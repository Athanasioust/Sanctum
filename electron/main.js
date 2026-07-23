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

const { app, BrowserWindow, shell, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const net = require("node:net");
const http = require("node:http");
const { spawn } = require("node:child_process");

const isDev = !app.isPackaged;
const HOST = "127.0.0.1";

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
    HOSTNAME: HOST,
    // Redirect all writable data to a per-user directory (install dir is read-only).
    SANCTUM_DATA_ROOT: app.getPath("userData"),
    SANCTUM_MIGRATIONS_DIR: path.join(standaloneDir, "drizzle"),
  };

  log(`Starting server: ${serverEntry} on port ${port}`);
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

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 940,
    minHeight: 600,
    backgroundColor: "#0a0a0a",
    show: false,
    icon: path.join(__dirname, "icon.ico"),
    title: "Sanctum",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

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
