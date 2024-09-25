import {
    tokenEndpoint,
    clientId,
    redirectUrl,
    currentToken,
    cache,
    setProgress,
    initProgress,
} from "./app.js";

import { db, get, getAll } from "./db.js";

// Soptify API Calls
export async function getToken(code) {
    const code_verifier = localStorage.getItem("code_verifier");

    const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUrl,
            code_verifier: code_verifier,
        }),
    });

    return await response.json();
}

export async function refreshToken() {
    const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: "refresh_token",
            refresh_token: currentToken.refresh_token,
        }),
    });

    return await response.json();
}

export async function getUserData() {
    const response = await fetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers: { Authorization: "Bearer " + currentToken.access_token },
    });

    return await response.json();
}

export async function getUserPlaylists() {
    const storedPlaylists = await getAll("playlists");

    if (storedPlaylists && storedPlaylists.length > 0) {
        return { items: storedPlaylists };
    }

    const response = await fetch("https://api.spotify.com/v1/me/playlists", {
        method: "GET",
        headers: { Authorization: "Bearer " + currentToken.access_token },
    });

    let returnedPlaylists = await response.json();
    if ("error" in returnedPlaylists) {
        cache.user_playlists = null;
        return null;
    }
    let items = returnedPlaylists.items;

    initProgress(returnedPlaylists.total);
    setProgress(items.length);
    while (returnedPlaylists.next) {
        const response = await fetch(returnedPlaylists.next, {
            method: "GET",
            headers: { Authorization: "Bearer " + currentToken.access_token },
        });
        returnedPlaylists = await response.json();
        items = [...items, ...returnedPlaylists.items];
        setProgress(items.length);
    }

    const playlistStore = db
        .transaction("playlists", "readwrite")
        .objectStore("playlists");

    items.forEach((playlist) => {
        playlistStore.put(playlist);
    });

    return { items };
}

export async function getPlaylistTracks(playlistId) {
    const storedPlaylist = await get("playlist-tracks", playlistId);

    if (storedPlaylist) {
        return storedPlaylist;
    }

    const response = await fetch(
        "https://api.spotify.com/v1/playlists/" +
            playlistId +
            "?fields=name,items(track(id, name,artists(name),album.images.url,duration_ms)),total,next,tracks(total,next,items(track(id, name,artists(name),album.images.url,duration_ms))",
        {
            method: "GET",
            headers: { Authorization: "Bearer " + currentToken.access_token },
        },
    );

    let returnedPlaylist = await response.json();
    if ("error" in returnedPlaylist) {
        // delete storedPlaylists[playlistId];
        // cache.playlists = storedPlaylists;
        return null;
    }
    let items = returnedPlaylist.tracks.items;
    const playlistName = returnedPlaylist.name;

    initProgress(returnedPlaylist.tracks.total);
    setProgress(items.length);
    var next = returnedPlaylist.tracks.next;
    while (next) {
        const response = await fetch(next, {
            method: "GET",
            headers: { Authorization: "Bearer " + currentToken.access_token },
        });
        returnedPlaylist = await response.json();
        items = [...items, ...returnedPlaylist.items];
        next = returnedPlaylist.next;
        setProgress(items.length);
    }

    const playlistTracksStore = db
        .transaction("playlist-tracks", "readwrite")
        .objectStore("playlist-tracks");

    const trackIds = items.map((item) => item.track.id);
    const playlistTracks = { playlistId, items: trackIds };
    playlistTracksStore.put(playlistTracks);

    const tracksStore = db
        .transaction("tracks", "readwrite")
        .objectStore("tracks");

    items.forEach((item) => {
        tracksStore.put(item.track);
    });

    return playlistTracks;
}
