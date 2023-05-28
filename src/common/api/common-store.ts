import type { Static, TObject } from "@sinclair/typebox";
import Ajv from "ajv";
import fs from "fs";
import { assign } from "jaz-ts-utils";
import path from "path";
import { reactive, watch } from "vue";

export type Store<T extends TObject> = {
    model: Static<T>;
    read: () => Promise<void>;
    write: () => Promise<void>;
};

export async function newCommonStore<T extends TObject>(filePath: string, schema: T) {
    const model: Static<T> = reactive({});
    const ajv = new Ajv({ coerceTypes: true, useDefaults: true });
    const validator = ajv.compile(schema);
    const dir = path.parse(filePath).dir;

    await fs.promises.mkdir(dir, { recursive: true });

    async function read() {
        const modelStr = await fs.promises.readFile(filePath, { encoding: "utf-8" });
        const updatedModel = JSON.parse(modelStr) as Static<T>;
        const isValid = validator(model);

        if (isValid) {
            assign(model, updatedModel);
        } else {
            console.error(`Error validating file store: ${filePath}`, validator.errors);
        }
    }

    async function write() {
        await fs.promises.writeFile(filePath, JSON.stringify(model, null, 4));
    }

    if (fs.existsSync(filePath)) {
        await read();
    } else {
        validator(model);
        await write();
    }

    watch(model, () => {
        write();
    });

    return {
        model,
        read,
        write,
    };
}
