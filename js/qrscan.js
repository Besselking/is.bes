import { getById, writeError, writeInfo, a, div } from "./common.js";

// regexr.com/2rj36
const url_like_regex =
    /^[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?$/i;

///https://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript
function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function logQRValue(value) {
    if (URL.canParse(value)) {
        writeInfo(div(a(new URL(url).href, value)));
    } else if (url_like_regex.test(value)) {
        // Not a true URL but close enough for me to create an anchor tag.
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
            value = "https://" + value;
        }
        writeInfo(div(a(value, value)));
    } else {
        writeInfo(value);
    }
}

// check compatibility
if (!("BarcodeDetector" in globalThis)) {
    writeError(
        "Barcode Detector is not supported by this browser. Make sure Shape Detection API is turned on.",
    );
} else {
    writeInfo("Barcode Detector supported!");

    // create new detector
    const barcodeDetector = new BarcodeDetector({
        formats: ["qr_code"],
    });

    const initBarcodescan = (stream) => {
        writeInfo("Starting scanner...");
        var lastbarcodes = [];
        setInterval(() => {
            barcodeDetector
                .detect(stream)
                .then((barcodes) => {
                    if (barcodes.length == 0) {
                    } else {
                        const values = barcodes.map(
                            (barcode) => barcode.rawValue,
                        );
                        if (arraysEqual(values, lastbarcodes)) {
                            return;
                        }

                        values.forEach(logQRValue);
                        lastbarcodes = values;
                    }
                })
                .catch((err) => {
                    writeError(err);
                });
        }, 1000);
    };

    var video = getById("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("muted", "");
    video.style.width = "100%";
    // video.style.height = "100%";

    /* Setting up the constraint */
    var facingMode = "environment"; // Can be 'user' or 'environment' to access back or front camera (NEAT!)
    var constraints = {
        audio: false,
        video: {
            facingMode: facingMode,
        },
    };

    /* Stream it to video element */
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function success(stream) {
            video.srcObject = stream;
        })
        .finally(() => {
            writeInfo("Initialized video stream");
            initBarcodescan(video);
        });
}
