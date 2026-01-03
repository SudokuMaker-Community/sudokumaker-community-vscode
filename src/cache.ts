import { randomUUID } from "node:crypto";

let cacheId = randomUUID();

export function generateNewCacheId() {
    cacheId = randomUUID();
}

export function getCacheId() {
    return cacheId;
}