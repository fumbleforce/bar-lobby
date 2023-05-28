import { TObject } from "@sinclair/typebox";
import { ipcRenderer } from "electron";
import path from "path";
import { toRaw, watch } from "vue";

import { newCommonStore } from "$/api/common-store";
export type { Store } from "$/api/common-store";

export async function newStore<T extends TObject>(filePath: string, schema: T) {
    const name = path.parse(filePath).name;

    const store = await newCommonStore<T>(filePath, schema);

    watch(store.model, () => {
        ipcRenderer.send(`store-update:${name}`, toRaw(store.model));
    });

    return store;
}
