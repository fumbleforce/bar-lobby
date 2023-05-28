import { Type } from "@sinclair/typebox";

import { Store } from "@/api/store";

export const accountSchema = Type.Object({
    email: Type.String({ default: "" }),
    token: Type.String({ default: "" }),
});

export type AccountStore = Store<typeof accountSchema>;
