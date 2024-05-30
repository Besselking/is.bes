import { getById, debounce, writeError, resetLog } from "./common.js";
import lzString from "./lz-string.js";

const input = getById("input");

input.addEventListener("input", debounce(() => {
    if (input.value == '') {
        window.location.hash = ''
    }
    else {
        window.location.hash = '#' + lzString.compressToEncodedURIComponent(input.value);
    }
    resetLog();
}, 10))

window.addEventListener('hashchange', loadState);

function loadState() {
    if (window.location.hash != '') {
        input.value = lzString.decompressFromEncodedURIComponent(window.location.hash.substring(1));
        if (input.value == '') {
            //Hash but no content?
            writeError("Failed to load note from url.")
        }
    }
}

loadState();