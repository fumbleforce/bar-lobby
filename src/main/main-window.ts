import { BrowserWindow, screen, shell } from "electron";
import path from "path";
import { watch } from "vue";

import { SettingsStore } from "$/model/settings";

export let window: BrowserWindow;

let settings: SettingsStore;

export function setDisplay(displayIndex: number) {
    const display = screen.getAllDisplays()[displayIndex];
    if (display) {
        const { x, y, width, height } = display.bounds;
        window.setPosition(x, y);
        window.setSize(width, height);
        window.maximize();
        settings.model.displayIndex = displayIndex;
    }
}

export function show() {
    setDisplay(settings.model.displayIndex);

    window.setMenuBarVisibility(false);
    window.show();
    window.focus();
}

export function init(initSettings: SettingsStore) {
    settings = initSettings;

    window = new BrowserWindow({
        title: "Beyond All Reason",
        fullscreen: settings.model.fullscreen,
        frame: true,
        show: false,
        minWidth: 1440,
        minHeight: 900,
        paintWhenInitiallyHidden: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nodeIntegrationInSubFrames: true,
            nodeIntegrationInWorker: true,
            webSecurity: false,
            backgroundThrottling: false,
        },
    });

    window.once("ready-to-show", () => show());

    window.webContents.on("render-process-gone", (event, details) => {
        console.error(details);
    });

    window.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: "deny" };
    });

    window.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        callback({ requestHeaders: { Origin: "*", ...details.requestHeaders } });
    });

    window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        const obj = { responseHeaders: { ...details.responseHeaders } };
        if (!obj.responseHeaders["Access-Control-Allow-Origin"] && !obj.responseHeaders["access-control-allow-origin"]) {
            obj.responseHeaders["Access-Control-Allow-Origin"] = ["*"];
        }
        callback(obj);
    });

    watch(
        () => settings.model.displayIndex,
        (displayIndex) => setDisplay(displayIndex)
    );

    watch(
        () => settings.model.fullscreen,
        (fullscreen) => {
            window.setFullScreen(fullscreen);
            window.maximize();
        }
    );

    if (process.env.ELECTRON_RENDERER_URL) {
        window.loadURL(process.env.ELECTRON_RENDERER_URL);
        window.webContents.openDevTools();
    } else {
        window.loadFile(path.join(__dirname, "../renderer/index.html"));
    }
}
