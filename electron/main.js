// Electron shell for Sanctum.
//
// In a packaged build this process launches the self-contained Next.js server
// (produced by `output: "standalone"`) as a child process on a random free
// port, waits for it to answer, then opens a desktop window pointing at it.
// All writable data (database, backups, uploads) is redirected to a per-user
// directory so the read-only install folder is never written to.
//
// In development (`app.isPackaged === false`) no server is spawned — the window
// simply loads a `next dev` instance (default http://localhost:3000).

const { app, BrowserWindow, Menu, screen, shell, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const net = require("node:net");
const http = require("node:http");
const { spawn } = require("node:child_process");

const isDev = !app.isPackaged;
// The window always talks to the server over loopback. What changes with
// local-network sharing is what the server *binds* to, not how we reach it.
const HOST = "127.0.0.1";

/**
 * Local-network sharing, off unless the DM turned it on in Settings.
 *
 * With it off the server binds to loopback and nothing it serves is reachable
 * from another machine. With it on the server binds to every interface so
 * players can open the read-only player view on their phones. Read here rather
 * than asked for over IPC because the decision is needed before the server
 * starts; the setting is written by /api/lan and takes effect on restart.
 */
function lanSharingEnabled() {
  try {
    const configPath = path.join(app.getPath("userData"), "lan.json");
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return parsed?.enabled === true;
  } catch {
    return false;
  }
}

/** @type {import('node:child_process').ChildProcess | null} */
let serverProcess = null;
let mainWindow = null;
let logStream = null;

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(" ")}`;
  // eslint-disable-next-line no-console
  console.log(line);
  try {
    logStream?.write(line + "\n");
  } catch {
    /* logging must never crash the app */
  }
}

/** Find an available TCP port by binding to 0 and reading the assigned port. */
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, HOST, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

/** Resolve once the server answers an HTTP request, or reject after timeout. */
function waitForServer(port, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get({ host: HOST, port, path: "/", timeout: 2000 }, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", retry);
      req.on("timeout", () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() > deadline) {
        reject(new Error(`Server did not start within ${timeoutMs}ms`));
      } else {
        setTimeout(attempt, 300);
      }
    };
    attempt();
  });
}

function startServer(port) {
  const bindHost = lanSharingEnabled() ? "0.0.0.0" : HOST;
  const standaloneDir = path.join(process.resourcesPath, "standalone");
  const serverEntry = path.join(standaloneDir, "server.js");

  if (!fs.existsSync(serverEntry)) {
    throw new Error(`Bundled server not found at ${serverEntry}`);
  }

  const env = {
    ...process.env,
    // Run the Electron binary as a plain Node process for the child.
    ELECTRON_RUN_AS_NODE: "1",
    NODE_ENV: "production",
    PORT: String(port),
    HOSTNAME: bindHost,
    // Redirect all writable data to a per-user directory (install dir is read-only).
    SANCTUM_DATA_ROOT: app.getPath("userData"),
    SANCTUM_MIGRATIONS_DIR: path.join(standaloneDir, "drizzle"),
  };

  log(
    `Starting server: ${serverEntry} on ${bindHost}:${port}` +
      (bindHost === "0.0.0.0" ? " (local-network sharing ON)" : ""),
  );
  const child = spawn(process.execPath, [serverEntry], {
    cwd: standaloneDir,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (d) => log(`[server] ${d.toString().trimEnd()}`));
  child.stderr.on("data", (d) => log(`[server:err] ${d.toString().trimEnd()}`));
  child.on("exit", (code, signal) => {
    log(`Server exited (code=${code}, signal=${signal})`);
    serverProcess = null;
    // If the server dies unexpectedly while the app is running, there is nothing
    // to show — shut down rather than leave a blank window.
    if (!app.isQuitting) {
      dialog.showErrorBox(
        "Sanctum",
        "The Sanctum server stopped unexpectedly. Please restart the app.\n\n" +
          `Diagnostic log: ${logFilePath()}`,
      );
      app.quit();
    }
  });

  return child;
}

function logFilePath() {
  return path.join(app.getPath("userData"), "logs", "desktop.log");
}

function openLogStream() {
  try {
    const dir = path.join(app.getPath("userData"), "logs");
    fs.mkdirSync(dir, { recursive: true });
    logStream = fs.createWriteStream(path.join(dir, "desktop.log"), { flags: "a" });
  } catch {
    /* diagnostics are best-effort */
  }
}

/* -------------------------------------------------------------------------- */
/* Window state                                                                */

// Preferred size on a first run; always shrunk to whatever the display can
// actually show (a 1400x900 window does not fit a 1280x720 work area, which is
// what a 1080p screen at 150% scaling reports — the window then gets clipped
// and parts of the UI become unreachable).
const PREFERRED_SIZE = { width: 1400, height: 900 };
const MIN_SIZE = { width: 820, height: 560 };
const ZOOM_LIMITS = { min: 0.5, max: 2 };

/** @type {{width:number,height:number,x?:number,y?:number,maximized:boolean,zoomFactor:number}} */
let windowState = { ...PREFERRED_SIZE, maximized: false, zoomFactor: 1 };
let saveStateTimer = null;

function windowStatePath() {
  return path.join(app.getPath("userData"), "window-state.json");
}

function loadWindowState() {
  try {
    const raw = JSON.parse(fs.readFileSync(windowStatePath(), "utf8"));
    if (typeof raw !== "object" || raw === null) return;
    const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
    windowState = {
      width: num(raw.width) ?? PREFERRED_SIZE.width,
      height: num(raw.height) ?? PREFERRED_SIZE.height,
      x: num(raw.x),
      y: num(raw.y),
      maximized: raw.maximized === true,
      zoomFactor: clampZoom(num(raw.zoomFactor) ?? 1),
    };
  } catch {
    /* first run, or an unreadable file — the defaults are fine */
  }
}

function saveWindowState() {
  clearTimeout(saveStateTimer);
  saveStateTimer = setTimeout(() => {
    try {
      fs.writeFileSync(windowStatePath(), JSON.stringify(windowState, null, 2));
    } catch {
      /* persisting the layout is best-effort */
    }
  }, 300);
}

/** Snapshot the live window into `windowState` (skipping bounds while maximized). */
function captureWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const maximized = mainWindow.isMaximized() || mainWindow.isFullScreen();
  if (!maximized) {
    const { x, y, width, height } = mainWindow.getBounds();
    windowState = { ...windowState, x, y, width, height };
  }
  windowState.maximized = maximized;
  saveWindowState();
}

function clampZoom(factor) {
  return Math.min(ZOOM_LIMITS.max, Math.max(ZOOM_LIMITS.min, factor));
}

/**
 * Clamp the remembered bounds to a display that still exists, so the window can
 * never open larger than the screen or off the edge of it (e.g. after
 * unplugging a monitor or changing the display scale).
 */
function fitToWorkArea(state) {
  const hasPosition = state.x !== undefined && state.y !== undefined;
  const display = hasPosition
    ? screen.getDisplayMatching({
        x: state.x,
        y: state.y,
        width: state.width,
        height: state.height,
      })
    : screen.getPrimaryDisplay();
  const area = display.workArea;

  const width = Math.min(state.width, area.width);
  const height = Math.min(state.height, area.height);

  const fitsOnScreen =
    hasPosition &&
    state.x + width > area.x &&
    state.x < area.x + area.width &&
    state.y + height > area.y &&
    state.y < area.y + area.height;

  const x = fitsOnScreen
    ? Math.max(area.x, Math.min(state.x, area.x + area.width - width))
    : area.x + Math.round((area.width - width) / 2);
  const y = fitsOnScreen
    ? Math.max(area.y, Math.min(state.y, area.y + area.height - height))
    : area.y + Math.round((area.height - height) / 2);

  // On a display too small for the preferred size, open maximized rather than
  // handing the user a window they have to resize before anything fits.
  const clamped = width < state.width || height < state.height;

  return { x, y, width, height, clamped };
}

function setZoom(factor) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const next = clampZoom(Math.round(factor * 20) / 20);
  mainWindow.webContents.setZoomFactor(next);
  windowState.zoomFactor = next;
  saveWindowState();
}

/**
 * Minimal menu. Zoom lives here (rather than on Electron's stock View role) so
 * the chosen level is remembered between launches.
 */
function buildMenu() {
  const zoomBy = (step) => () => {
    if (!mainWindow) return;
    setZoom(mainWindow.webContents.getZoomFactor() + step);
  };

  return Menu.buildFromTemplate([
    {
      label: "File",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow?.webContents.reload(),
        },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { label: "Zoom In", accelerator: "CmdOrCtrl+Plus", click: zoomBy(0.1) },
        { label: "Zoom In", accelerator: "CmdOrCtrl+=", visible: false, click: zoomBy(0.1) },
        { label: "Zoom Out", accelerator: "CmdOrCtrl+-", click: zoomBy(-0.1) },
        { label: "Actual Size", accelerator: "CmdOrCtrl+0", click: () => setZoom(1) },
        { type: "separator" },
        { role: "togglefullscreen" },
        {
          label: "Reset Window Size",
          click: () => {
            if (!mainWindow) return;
            if (mainWindow.isFullScreen()) mainWindow.setFullScreen(false);
            if (mainWindow.isMaximized()) mainWindow.unmaximize();
            const fitted = fitToWorkArea({ ...PREFERRED_SIZE });
            mainWindow.setBounds({
              x: fitted.x,
              y: fitted.y,
              width: fitted.width,
              height: fitted.height,
            });
            setZoom(1);
          },
        },
        { type: "separator" },
        { role: "toggleDevTools" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Open Data Folder",
          click: () => shell.openPath(app.getPath("userData")),
        },
        {
          label: "Open Diagnostic Log",
          click: () => shell.openPath(logFilePath()),
        },
      ],
    },
  ]);
}

function createWindow(url) {
  const fitted = fitToWorkArea(windowState);

  mainWindow = new BrowserWindow({
    x: fitted.x,
    y: fitted.y,
    width: fitted.width,
    height: fitted.height,
    // Never demand more room than the display has, or the window becomes
    // unresizable below its own minimum and the edges stay cut off.
    minWidth: Math.min(MIN_SIZE.width, fitted.width),
    minHeight: Math.min(MIN_SIZE.height, fitted.height),
    backgroundColor: "#0a0a0a",
    show: false,
    // Windows reads the .ico; Linux window managers need a PNG. (macOS takes
    // its icon from the bundle, so the option is ignored there.)
    icon: path.join(__dirname, process.platform === "win32" ? "icon.ico" : "icon.png"),
    title: "Sanctum",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(buildMenu());

  if (windowState.maximized || fitted.clamped) mainWindow.maximize();

  mainWindow.once("ready-to-show", () => mainWindow.show());

  // Restore the remembered zoom level once a document exists to apply it to.
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.setZoomFactor(windowState.zoomFactor);
  });

  // Ctrl+wheel zooming bypasses the menu — keep the saved level in step.
  mainWindow.webContents.on("zoom-changed", (_event, direction) => {
    setZoom(mainWindow.webContents.getZoomFactor() + (direction === "in" ? 0.1 : -0.1));
  });

  mainWindow.on("resize", captureWindowState);
  mainWindow.on("move", captureWindowState);
  mainWindow.on("maximize", captureWindowState);
  mainWindow.on("unmaximize", captureWindowState);
  mainWindow.on("close", captureWindowState);

  // Open external (non-app) links in the user's default browser.
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (target.startsWith("http://") || target.startsWith("https://")) {
      shell.openExternal(target);
    }
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadURL(url);
}

async function boot() {
  openLogStream();
  loadWindowState();

  let url;
  try {
    if (isDev) {
      url = process.env.SANCTUM_DEV_URL || "http://localhost:3000";
      log(`Dev mode: loading ${url}`);
    } else {
      const port = await getFreePort();
      serverProcess = startServer(port);
      await waitForServer(port);
      url = `http://${HOST}:${port}`;
      log(`Server ready at ${url}`);
    }
  } catch (err) {
    log(`Boot failed: ${err?.stack || err}`);
    dialog.showErrorBox(
      "Sanctum failed to start",
      `${err?.message || err}\n\nDiagnostic log: ${logFilePath()}`,
    );
    app.quit();
    return;
  }

  createWindow(url);
}

// Ensure only one instance runs (a second launch focuses the existing window).
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(boot);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 && !isDev) boot();
  });

  app.on("window-all-closed", () => {
    app.quit();
  });

  app.on("before-quit", () => {
    app.isQuitting = true;
    // Flush the debounced layout write before the process goes away.
    clearTimeout(saveStateTimer);
    try {
      fs.writeFileSync(windowStatePath(), JSON.stringify(windowState, null, 2));
    } catch {
      /* best-effort */
    }
    if (serverProcess) {
      log("Stopping server");
      serverProcess.kill();
    }
    try {
      logStream?.end();
    } catch {
      /* noop */
    }
  });
}
