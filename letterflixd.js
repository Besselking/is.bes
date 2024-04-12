import { getById, resetLog, writeError, writeInfo, writeDebug, a, span, div, addClass } from "./common.js"



/** @param {SubmitEvent} event */
function submitForm(event) {
    event.preventDefault();
    event.stopPropagation();

    resetLog();
    const files = netflix_file_input.files;
    if (files.length != 1) {
        writeError("First select your viewing history file.");
        return;
    }

    const netflix_file = files[0];

    writeInfo("Checking metadata...");

    if (!netflix_file.type.match('text/csv')) {
        let detected_filetype = "";
        if (netflix_file.type) {
            detected_filetype = ", detected filetype: " + netflix_file.type;
        }
        writeError("Select a CSV file" + detected_filetype);
        return;
    }

    handleFile(netflix_file);
}

/** @param {File} file  */
function handleFile(file) {
    writeInfo("Reading file...");
    file.text()
        .then(convertText);
}

const viewingHistoryPattern = /"(.*)","(\d\d)\/(\d\d)\/(\d\d\d\d)"/;

/** @param {string} data  */
function convertText(data) {
    writeInfo("Checking header...");
    const [header, ...lines] = data.split(/\r?\n|\r|\n/g);
    if (header !== "Title,Date") {
        writeError("Invalid Netflix viewing history file, expected header \"Title,Date\"");
        return;
    }
    writeInfo("History count: " + lines.length);
    let letterboxd_output = "Title,WatchedDate,Rewatch\n";
    let watched_movies = new Set();

    for (let line of lines) {
        if (!line) continue;
        if (line.includes(": Season")
            || line.includes(": Limited Series:")
            || line.includes(": Part")
            || line.includes(": Chapter ")
            || line.includes(": Volume ")
            || line.includes(": Series ")
            || line.includes(": Book ")) {
            writeDebug("Skipping show episode: " + line);
            continue;
        }
        if (line.startsWith(": ")) {
            writeDebug("Skipping empty title entry")
        }
        const [_, title, day, month, year] = viewingHistoryPattern.exec(line);
        if (title && day && month && year) {
            const rewatch = watched_movies.has(title);
            letterboxd_output += `"${title}",${year}-${month}-${day},${rewatch}\n`
            if (rewatch) {
                writeDebug("Rewatch of: " + title);
            }
            watched_movies.add(title);
        }
        else {
            writeError("could not parse line: " + line);
        }
    }

    let letterboxd_import = new Blob([letterboxd_output], { type: 'text/csv' });

    let download_button = a(window.URL.createObjectURL(letterboxd_import))
    let download_text = span("Download import file ==> ")
    download_button.download = "netflix-letterboxd-import.csv";
    log.appendChild(div(addClass(download_text, "info"), download_button));
}

const form = getById("form");
const netflix_file_input = getById("netflix-file");

form.addEventListener("submit", submitForm);
