import { getById, writeError, writeInfo } from "./common.js";

///https://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript
function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    // Please note that calling sort on an array will modify that array.
    // you might want to clone your array first.

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
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
                        values.forEach(writeInfo);
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
