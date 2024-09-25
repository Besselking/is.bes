import { setstatus } from "./app.js";

export let db;
const request = window.indexedDB.open("spotify", 3);

/**
 * @param {Event} event
 */
request.onerror = (event) => {
    console.error("Why didn't you allow my web app to use IndexedDB?!");
    setstatus("Error creating IndexedDB.");
};

/**
 * @param {Event} event
 */
request.onsuccess = (event) => {
    db = event.target.result;
    db.onerror = (event) => {
        const message = `Database error: ${event.target.error?.message}`;
        console.error(message);
        setstatus(message);
    };
};

/**
 *
 * @param {IDBVersionChangeEvent} event
 */
request.onupgradeneeded = (event) => {
    const db = event.target.result;

    if (event.oldVersion < 2) {
        db.createObjectStore("playlists", { keyPath: "id" });
    }

    if (event.oldVersion < 3) {
        db.createObjectStore("playlist-tracks", { keyPath: "playlistId" });
        db.createObjectStore("tracks", { keyPath: "id" });
    }
};

export function getAll(store) {
    const request = openStore(store).getAll();
    const promise = requestAsPromise(request);
    return promise;
}

export function get(storename, key) {
    const request = openStore(storename).get(key);
    const promise = requestAsPromise(request);
    return promise;
}

export function getFrom(store, key) {
    const request = store.get(key);
    const promise = requestAsPromise(request);
    return promise;
}

export function openStore(store) {
    return db.transaction(store, "readonly").objectStore(store);
}

function requestAsPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = (e) => {
            resolve(e.target.result);
        };
        request.onerror = (e) => {
            reject(e.target.error);
        };
    });
}
