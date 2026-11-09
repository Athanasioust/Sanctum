/**
 * Entry point of the desktop app's server: the LAN guard first, then Next's
 * standalone server. Loading the guard before `server.js` creates its HTTP
 * server means no request is ever answered unguarded, not even during startup.
 *
 * The desktop build copies this file and `lan-guard.cjs` next to the
 * standalone `server.js` (see scripts/build-desktop.mjs), and the Electron
 * shell refuses to start the server if either is missing.
 */

"use strict";

const path = require("node:path");

require(path.join(__dirname, "lan-guard.cjs"));
require(path.join(__dirname, "server.js"));
