import { AsyncLocalStorage } from "node:async_hooks";
import type { Session } from "next-auth";
// Overrides identity only while a mobile HTTP handler reuses a server action.
export const mobileIdentity = new AsyncLocalStorage<Session | null>();
