/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code with PKCE oAuth2 flow to authenticate
 * against the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
 */

import {
    getToken,
    refreshToken,
    getUserData,
    getUserPlaylists,
    getPlaylistTracks,
} from "./api.js";
import lzString from "../lz-string.js";
import { getFrom, openStore } from "./db.js";

export const clientId = "5ce7cf2c23dd41f7857710348853edfe"; // your clientId
export const redirectUrl = "http://localhost:9000/spotify/index.html"; // your redirect URL - must be localhost URL and/or HTTPS

const authorizationEndpoint = "https://accounts.spotify.com/authorize";
export const tokenEndpoint = "https://accounts.spotify.com/api/token";
const scope = "user-read-private user-read-email";

// Data structure that manages the current active token, caching it in localStorage
export const currentToken = {
    get access_token() {
        return localStorage.getItem("access_token") || null;
    },
    get refresh_token() {
        return localStorage.getItem("refresh_token") || null;
    },
    get expires_in() {
        return localStorage.getItem("refresh_in") || null;
    },
    get expires() {
        return localStorage.getItem("expires") || null;
    },

    save: function (response) {
        const { access_token, refresh_token, expires_in } = response;
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        localStorage.setItem("expires_in", expires_in);

        const now = new Date();
        const expiry = new Date(now.getTime() + expires_in * 1000);
        localStorage.setItem("expires", expiry);
    },
};

export const cache = {
    get user_data() {
        return JSON.parse(localStorage.getItem("user-data")) || null;
    },
    set user_data(value) {
        return localStorage.setItem("user-data", JSON.stringify(value));
    },
};

// On page load, try to fetch auth code from current browser search URL
const args = new URLSearchParams(window.location.search);
const code = args.get("code");

const statusbar = document.getElementById("status");

export function setstatus(message) {
    window.setTimeout(() => {
        statusbar.innerHTML = message;
    });
}

const progress = document.getElementById("progress");

export function initProgress(total) {
    window.setTimeout(() => {
        progress.max = total;
    });
}

export function setProgress(value) {
    window.setTimeout(() => {
        progress.value = value;
    });
}

// If we find a code, we're in a callback, do a token exchange
if (code) {
    setstatus("loggin in...");
    const token = await getToken(code);
    currentToken.save(token);

    // Remove code from URL so we can refresh correctly.
    const url = new URL(window.location.href);
    url.searchParams.delete("code");

    const updatedUrl = url.search ? url.href : url.href.replace("?", "");
    window.history.replaceState({}, document.title, updatedUrl);
}

// If we have a token, we're logged in, so fetch user data and render logged in template
if (currentToken.access_token) {
    if (currentToken.expires < Date.now()) {
        refreshTokenClick();
    }

    setstatus("Getting user data...");
    cache.user_data = await getUserData();
    // renderTemplate("main", "logged-in-template", userData);
    // renderTemplate("oauth", "oauth-template", currentToken);

    setstatus("Getting playlists...");
    const playlists = await getDisplayedPlaylists();
    await renderTemplate("playlists-header", "playlists-header-template");
    await renderTemplate("playlists", "playlists-template", playlists);
    setstatus("done.");
}

// Otherwise we're not logged in, so render the login template
if (!currentToken.access_token) {
    await renderTemplate("main", "login");
}

async function redirectToSpotifyAuthorize() {
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomValues = crypto.getRandomValues(new Uint8Array(64));
    const randomString = randomValues.reduce(
        (acc, x) => acc + possible[x % possible.length],
        "",
    );

    const code_verifier = randomString;
    const data = new TextEncoder().encode(code_verifier);
    const hashed = await crypto.subtle.digest("SHA-256", data);

    const code_challenge_base64 = btoa(
        String.fromCharCode(...new Uint8Array(hashed)),
    )
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    window.localStorage.setItem("code_verifier", code_verifier);

    const authUrl = new URL(authorizationEndpoint);
    const params = {
        response_type: "code",
        client_id: clientId,
        scope: scope,
        code_challenge_method: "S256",
        code_challenge: code_challenge_base64,
        redirect_uri: redirectUrl,
    };

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString(); // Redirect the user to the authorization server for login
}

// Click handlers
async function loginWithSpotifyClick() {
    await redirectToSpotifyAuthorize();
}

async function logoutClick() {
    localStorage.clear();
    window.location.href = redirectUrl;
}

async function refreshTokenClick() {
    setstatus("Refreshing token...");
    const token = await refreshToken();
    currentToken.save(token);
    // renderTemplate("oauth", "oauth-template", currentToken);
}

async function openPlaylist(playlistId) {
    setstatus("opening: " + playlistId);

    const playlist = await getPlaylistTracks(playlistId);

    document.getElementById("playlist-tracks").hidden = false;
    await renderTemplate(
        "playlist-tracks",
        "playlist-tracks-template",
        playlist,
    );

    document.getElementById("playlist-section").hidden = true;
    setstatus("done.");
}

function backToPlaylists() {
    document.getElementById("playlist-section").hidden = false;
    document.getElementById("playlist-tracks").hidden = true;
}

async function refreshPlaylistsClick() {
    // await refreshTokenClick()
    setstatus("Refreshing playlists...");

    cache.user_playlists = null;
    cache.playlists = {};
    const playlists = await getDisplayedPlaylists();

    await renderTemplate("playlists", "playlists-template", playlists);
    setstatus("done.");
}

async function justMyPlaylistsClick() {
    const playlistElements = document
        .getElementById("playlists")
        .getElementsByClassName("row");
    const just_my_playlists =
        document.getElementById("just-my-playlists").checked;

    const userId = cache.user_data.id;

    for (const row of playlistElements) {
        if (just_my_playlists) {
            const owner = [...row.children].find(
                (elem) => elem.data_owner != null,
            ).data_owner;
            row.hidden = owner !== userId;
        } else {
            row.hidden = false;
        }
    }
}

async function getDisplayedPlaylists() {
    let playlists = await getUserPlaylists();

    playlists.items.sort((a, b) => b.tracks.total - a.tracks.total);

    return playlists;
}

// HTML Template Rendering with basic data binding - demoware only.
async function renderTemplate(targetId, templateId, data = null) {
    const template = document.getElementById(templateId);
    const clone = await cloneTemplate(template, data);

    const target = document.getElementById(targetId);
    target.innerHTML = "";
    target.appendChild(clone);
}

async function cloneTemplate(template, data = null) {
    const clone = template.content.cloneNode(true);

    const elements = clone.querySelectorAll("*");
    elements.forEach((ele) => {
        const bindingAttrs = [...ele.attributes].filter((a) =>
            a.name.startsWith("data-bind"),
        );
        bindingAttrs.forEach(databind(ele, data));

        const foreachAttrs = [...ele.attributes].filter(
            (a) => a.name === "foreach",
        );
        foreachAttrs.forEach(async (attr) => {
            const innerTemplateId = [...ele.attributes].find(
                (a) => a.name == "render",
            ).value;
            const innerTemplate = document.getElementById(innerTemplateId);
            const expression = "data." + attr.value.replace(/;\n\r\n/g, "");

            const list = eval(expression);
            ele.innerHTML = "";
            for (const item of list) {
                const row = await cloneTemplate(innerTemplate, item);
                ele.appendChild(row);
            }

            ele.removeAttribute(attr.name);
            ele.removeAttribute("render");
        });

        const foreachKeyAttrs = [...ele.attributes].filter(
            (a) => a.name === "foreach-key",
        );
        foreachKeyAttrs.forEach(async (attr) => {
            const innerTemplateId = [...ele.attributes].find(
                (a) => a.name == "render",
            ).value;
            const storeId = [...ele.attributes].find(
                (a) => a.name == "foreach-in",
            ).value;
            const innerTemplate = document.getElementById(innerTemplateId);
            const expression = "data." + attr.value.replace(/;\n\r\n/g, "");

            const list = eval(expression);
            const store = openStore(storeId);
            ele.innerHTML = "";
            for (const itemKey of list) {
                const item = await getFrom(store, itemKey);
                const row = await cloneTemplate(innerTemplate, item);
                ele.appendChild(row);
            }

            ele.removeAttribute(attr.name);
            ele.removeAttribute("render");
        });
    });
    return clone;
}

function databind(ele, data = null) {
    return (attr) => {
        const target = attr.name
            .replace(/data-bind-/, "")
            .replace(/data-bind/, "");
        const targetType = target.startsWith("onclick")
            ? "HANDLER"
            : "PROPERTY";
        const targetProp = target === "" ? "innerHTML" : target;

        const prefix = targetType === "PROPERTY" ? "data." : "";
        const expression = prefix + attr.value.replace(/;\n\r\n/g, "");

        try {
            ele[targetProp] =
                targetType === "PROPERTY"
                    ? eval(expression)
                    : () => {
                          eval(expression);
                      };
            ele.removeAttribute(attr.name);
        } catch (ex) {
            console.error(`Error binding ${expression} to ${targetProp}`, ex);
        }
    };
}
