const store = new Map();
const MAX = 20000;
export function memo(key, ttlMs, load) {
    const now = Date.now();
    const hit = store.get(key);
    if (hit && now - hit.at < ttlMs)
        return hit.value;
    if (store.size > MAX)
        store.clear();
    const value = load().catch((e) => { store.delete(key); throw e; });
    store.set(key, { at: now, value });
    return value;
}
/** Drop every cached entry whose key starts with the prefix (call after admins change the data). */
export function forget(prefix) {
    for (const k of store.keys())
        if (k.startsWith(prefix))
            store.delete(k);
}
