import { Static, TObject } from "@sinclair/typebox";
import { ipcMain } from "electron";
import { assign as assignOnlyNonUndefined } from "jaz-ts-utils";
import path from "path";

import { newCommonStore } from "$/api/common-store";

export type { Store } from "$/api/common-store";

export async function newStore<T extends TObject>(filePath: string, schema: T) {
    const name = path.parse(filePath).name;

    const store = await newCommonStore<T>(filePath, schema);

    ipcMain.on(`store-update:${name}`, (_event, model: Static<T>) => {
        assignOnlyNonUndefined(store.model, model);
    });

    return store;
}
