// src/mocks/browser.ts
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { wsHandlers } from "./wsHandlers";

export const worker = setupWorker(...handlers, ...wsHandlers);