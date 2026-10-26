// push-key.ts
import { requesterKey, type Actor } from "./approvals"

export const pushKeyOf = (a: Actor) => `${a.alias}:${requesterKey(a)}`