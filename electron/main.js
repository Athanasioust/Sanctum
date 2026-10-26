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
const isMac = process.platform === "darwin";
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
// Shown from the first tick of boot so the launch never looks frozen while the
// server starts; replaced by the real window once it is ready to show.
let splashWindow = null;
let logStream = null;
// Set once the log stream has been ended (on quit). Writing to an ended stream
// raises an *asynchronous* 'error' event that no try/catch around write() can
// see, which used to surface as a bogus "A JavaScript error occurred in the
// main process" dialog on top of whatever really went wrong.
let loggingClosed = false;
// The URL the window loads, remembered so macOS can reopen a closed window
// against the server that is already running instead of starting a second one.
let serverUrl = null;

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(" ")}`;
  console.log(line);
  if (logStream && !loggingClosed) {
    try {
      logStream.write(line + "\n");
    } catch {
      /* logging must never crash the app */
    }
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

/* -------------------------------------------------------------------------- */
/* Server                                                                      */

// Tail of the server child's stderr. When the server fails to start this is the
// only place the real reason appears, so it is carried into the failure dialog
// instead of the useless "did not start in time".
const SERVER_ERROR_CHARS = 4000;
const SERVER_ERROR_LINES = 20;
let lastServerError = "";

function rememberServerError(text) {
  lastServerError = (lastServerError + text)
    .slice(-SERVER_ERROR_CHARS)
    .split("\n")
    .slice(-SERVER_ERROR_LINES)
    .join("\n")
    .trim();
}

/** Append the captured stderr to a message, when there is any. */
function withServerError(message) {
  return lastServerError ? `${message}\n\n${lastServerError}` : message;
}

// Set while boot is waiting for the server to answer, so the child's exit
// handler can fail that wait at once rather than leaving the user watching a
// splash screen until the timeout expires.
/** @type {((code: number | null, signal: string | null) => void) | null} */
let failBootOnServerExit = null;

/**
 * Resolve once the server answers, or reject on timeout — or, sooner, as soon
 * as the child process dies without ever having answered.
 *
 * Polls `/api/health`, a route that does no work, so the window opens the
 * moment the server is listening instead of waiting for the (much heavier)
 * homepage to compile and render.
 */
function waitForServer(port, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (fn) => (value) => {
      if (settled) return;
      settled = true;
      failBootOnServerExit = null;
      fn(value);
    };
    const succeed = settle(resolve);
    const fail = settle(reject);

    failBootOnServerExit = (code, signal) =>
      fail(
        new Error(
          withServerError(
            `The Sanctum server stopped before it was ready (code=${code}, signal=${signal}).`,
          ),
        ),
      );

    const attempt = () => {
      const req = http.get({ host: HOST, port, path: "/api/health", timeout: 2000 }, (res) => {
        res.resume();
        succeed();
      });
      req.on("error", retry);
      req.on("timeout", () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (settled) return;
      if (Date.now() > deadline) {
        fail(new Error(withServerError(`Server did not start within ${timeoutMs}ms.`)));
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

  const onStdout = (d) => log(`[server] ${d.toString().trimEnd()}`);
  const onStderr = (d) => {
    const text = d.toString();
    rememberServerError(text);
    log(`[server:err] ${text.trimEnd()}`);
  };
  child.stdout.on("data", onStdout);
  child.stderr.on("data", onStderr);

  child.on("exit", (code, signal) => {
    // Stop funnelling the child's output into the log: a dying server flushes
    // its buffers as the app is quitting, and by then the log stream is gone.
    child.stdout.off("data", onStdout);
    child.stderr.off("data", onStderr);
    log(`Server exited (code=${code}, signal=${signal})`);
    serverProcess = null;
    // Still booting: let boot() report it — with the captured stderr, and as the
    // single dialog the user sees.
    if (failBootOnServerExit) {
      failBootOnServerExit(code, signal);
      return;
    }
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
    // Stream errors arrive asynchronously; without a listener they are thrown
    // as uncaught exceptions in the main process.
    logStream.on("error", () => {
      /* diagnostics are best-effort */
    });
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
 *
 * macOS gets the two menus the platform expects. Without an explicit `appMenu`
 * the first submenu in the template is drawn in the application-menu slot, so
 * "File" would end up carrying the app's name and About/Services/Hide would be
 * missing entirely; without `windowMenu` there is no Minimize or Zoom.
 */
function buildMenu() {
  const zoomBy = (step) => () => {
    if (!mainWindow) return;
    setZoom(mainWindow.webContents.getZoomFactor() + step);
  };

  return Menu.buildFromTemplate([
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "File",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow?.webContents.reload(),
        },
        { type: "separator" },
        // Quit already lives in the application menu on macOS; File offers
        // Close instead, which leaves the app running in the dock.
        isMac ? { role: "close" } : { role: "quit" },
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
    ...(isMac ? [{ role: "windowMenu" }] : []),
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

/**
 * A tiny frameless window shown while the server starts.
 *
 * The main window cannot appear until the server answers, which on a slow disk
 * (or a portable build extracting itself) is several seconds of nothing at all
 * — indistinguishable from a hung launch. The splash needs no server, so it is
 * on screen immediately.
 */
function createSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) return;

  splashWindow = new BrowserWindow({
    width: 420,
    height: 300,
    frame: false,
    resizable: false,
    movable: false,
    center: true,
    show: true,
    backgroundColor: "#0a0a0a",
    title: "Sanctum",
    icon: path.join(__dirname, process.platform === "win32" ? "icon.ico" : "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  splashWindow.on("closed", () => {
    splashWindow = null;
  });

  splashWindow.loadFile(path.join(__dirname, "splash.html"));
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) splashWindow.destroy();
  splashWindow = null;
}

/**
 * Whether `target` is one of Sanctum's own pop-out panels (the combat tracker
 * or soundpad in a window of its own) on the server this app is running.
 */
function isPopoutUrl(target) {
  if (!serverUrl) return false;
  try {
    const url = new URL(target);
    return url.origin === new URL(serverUrl).origin && url.pathname.startsWith("/popout/");
  } catch {
    return false;
  }
}

/**
 * What `window.open` does from a Sanctum page. Pop-out panels become native
 * windows on the same local server (so they share its data and stay in sync);
 * any other web link opens in the user's default browser, never inside the app.
 * Pop-out windows get the same rules, so a link clicked in one behaves alike.
 */
function routeWindowOpens(contents) {
  contents.setWindowOpenHandler(({ url: target }) => {
    if (isPopoutUrl(target)) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 960,
          height: 900,
          minWidth: 480,
          minHeight: 400,
          backgroundColor: "#0a0a0a",
          autoHideMenuBar: true,
          title: "Sanctum",
          icon: path.join(__dirname, process.platform === "win32" ? "icon.ico" : "icon.png"),
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
          },
        },
      };
    }
    if (target.startsWith("http://") || target.startsWith("https://")) {
      shell.openExternal(target);
    }
    return { action: "deny" };
  });
  contents.on("did-create-window", (child) => {
    routeWindowOpens(child.webContents);
  });
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

  mainWindow.once("ready-to-show", () => {
    closeSplash();
    mainWindow.show();
  });

  // Restore the remembered zoom level once a document exists to apply it to.
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.setZoomFactor(windowState.zoomFactor);
    // Belt and braces: a load that finishes without ever firing ready-to-show
    // must not leave the splash on screen forever.
    closeSplash();
  });

  // A page that fails to load never becomes ready to show either.
  mainWindow.webContents.on("did-fail-load", () => closeSplash());

  // Ctrl+wheel zooming bypasses the menu — keep the saved level in step.
  mainWindow.webContents.on("zoom-changed", (_event, direction) => {
    setZoom(mainWindow.webContents.getZoomFactor() + (direction === "in" ? 0.1 : -0.1));
  });

  mainWindow.on("resize", captureWindowState);
  mainWindow.on("move", captureWindowState);
  mainWindow.on("maximize", captureWindowState);
  mainWindow.on("unmaximize", captureWindowState);
  mainWindow.on("close", captureWindowState);

  routeWindowOpens(mainWindow.webContents);

  mainWindow.on("closed", () => {
    mainWindow = null;
    closeSplash();
  });

  mainWindow.loadURL(url);
}

async function boot() {
  createSplash();
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
    serverUrl = url;
  } catch (err) {
    log(`Boot failed: ${err?.stack || err}`);
    const message = String(err?.message || err);
    // The captured stderr is usually already in the message (see
    // `withServerError`); only append it for failures raised elsewhere.
    const detail = lastServerError && !message.includes(lastServerError) ? lastServerError : "";
    closeSplash();
    dialog.showErrorBox(
      "Sanctum failed to start",
      `${message}${detail ? `\n\n${detail}` : ""}\n\nDiagnostic log: ${logFilePath()}`,
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
    } else if (serverUrl) {
      // On macOS the app outlives its window, so a second launch may find
      // nothing to focus. Reopen rather than doing nothing.
      createWindow(serverUrl);
    }
  });

  app.whenReady().then(boot);

  // Clicking the dock icon with no window open. The server is still running at
  // this point, so reopen against it — calling boot() again would spawn a second
  // one on a second port. Only fall back to a full boot if there is no URL yet
  // (the very first activate can arrive before boot resolves).
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length > 0) return;
    if (serverUrl) createWindow(serverUrl);
    else if (!isDev) boot();
  });

  app.on("window-all-closed", () => {
    // macOS apps stay in the dock after their last window closes, and Sanctum
    // has a server child process to keep alive with them; Cmd+Q (or Quit in the
    // app menu) is what shuts it down. Everywhere else, closing the window means
    // quitting.
    if (!isMac) app.quit();
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
    // Close the log last, and mark it closed first: the server child flushes
    // whatever it had buffered as it dies, and a write landing after end() is
    // an unhandled stream error, not something write()'s try/catch can absorb.
    const stream = logStream;
    loggingClosed = true;
    logStream = null;
    try {
      stream?.end();
    } catch {
      /* noop */
    }
  });
}
