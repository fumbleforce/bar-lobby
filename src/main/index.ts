import { safeStorage } from "electron";
import { app, ipcMain, protocol, screen } from "electron";
import unhandled from "electron-unhandled";
import { autoUpdater } from "electron-updater";
import envPaths from "env-paths";
import os from "os";
import path from "path";

import { newStore } from "@/api/store";
import * as MainWindow from "@/main-window";
import type { Info } from "$/model/info";
import { settingsSchema } from "$/model/settings";

/** Steam integration, commented out until we have a dedicated app id */
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const steamworks = require("steamworks.js");
// const client = steamworks.init(480);
// console.log(client.localplayer.getName());
// steamworks.electronEnableSteamOverlay();

const NODE_ENV = process.env.NODE_ENV;

let initialised = false;

unhandled();

app.setName("Beyond All Reason");

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

function getInfo() {
    const resourcesPath = path.join(app.getAppPath(), "resources").split("resources")[0] + "resources";
    const paths = envPaths(app.getName(), { suffix: "" });

    const displayIds = screen.getAllDisplays().map((display) => display.id);
    let currentDisplayId = 0;
    if (MainWindow.window) {
        currentDisplayId = screen.getDisplayNearestPoint(MainWindow.window.getBounds()).id;
    }

    const networkInterfaces = os.networkInterfaces();
    const defaultNetworkInterface = networkInterfaces["Ethernet"]?.[0] ?? Object.values(networkInterfaces)[0]?.[0];

    const info: Info = {
        resourcesPath,
        contentPath: paths.data,
        configPath: paths.config,
        lobby: {
            name: "BAR Lobby",
            version: app.getVersion(),
            hash: defaultNetworkInterface?.mac ?? "123",
        },
        hardware: {
            numOfDisplays: displayIds.length,
            currentDisplayIndex: displayIds.indexOf(currentDisplayId),
        },
    };

    return info;
}

function setupHandlers() {
    ipcMain.handle("getInfo", async () => {
        return getInfo();
    });

    ipcMain.handle("flashFrame", (event, flag: boolean) => {
        MainWindow.window.flashFrame(flag);
    });

    ipcMain.handle("encryptString", async (event, str: string) => {
        if (safeStorage.isEncryptionAvailable()) {
            return safeStorage.encryptString(str);
        }
        console.warn(`encryption not available, storing as plaintext`);
        return str;
    });

    ipcMain.handle("decryptString", async (event, buffer: Buffer) => {
        if (safeStorage.isEncryptionAvailable()) {
            return safeStorage.decryptString(buffer);
        }
        console.warn(`encryption not available, returning buffer`);
        return buffer.toString();
    });
}

async function onReady() {
    if (initialised) {
        return;
    }

    if (NODE_ENV === "development") {
        try {
            // await installExtension(VUEJS_DEVTOOLS);
        } catch (err) {
            console.error("Vue Devtools failed to install:", err?.toString());
        }
    } else if (app.isPackaged && NODE_ENV !== "development") {
        autoUpdater.checkForUpdatesAndNotify();
    }

    const info = getInfo();
    const settingsFilePath = path.join(info.configPath, "settings.json");
    const settings = await newStore(settingsFilePath, settingsSchema);

    MainWindow.init(settings);
    MainWindow.window.on("restore", () => MainWindow.window.flashFrame(false));

    setupHandlers();

    initialised = true;
}

protocol.registerSchemesAsPrivileged([
    {
        scheme: "bar",
        privileges: {
            secure: true,
            standard: true,
            stream: true,
        },
    },
]);

app.commandLine.appendSwitch("disable-features", "HardwareMediaKeyHandling,MediaSessionService");
app.on("ready", onReady);
app.on("window-all-closed", () => app.quit());
app.on("browser-window-focus", () => MainWindow.window.flashFrame(false));

if (NODE_ENV !== "production") {
    if (process.platform === "win32") {
        process.on("message", (data) => {
            if (data === "graceful-exit") {
                app.quit();
            }
        });
    } else {
        process.on("SIGTERM", () => {
            app.quit();
        });
    }
}
