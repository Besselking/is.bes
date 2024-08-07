function getById(id) {
    let element = document.getElementById(id);
    if (element) {
        return element;
    } else {
        throw `Element with id '${id}' not found.`;
    }
}

/**
 * @param {string} href
 * @returns {HTMLAnchorElement}
 */
function a(href, pageName) {
    const aElem = document.createElement("a");
    aElem.href = href;
    aElem.text = pageName;
    return aElem;
}

function div(...children) {
    const divElem = document.createElement("div");
    divElem.replaceChildren(...children);
    return divElem;
}

function span(text) {
    const spanElem = document.createElement("span");
    spanElem.textContent = text;
    return spanElem;
}

function h(elementTag, ...children) {
    const elem = document.createElement(elementTag);
    elem.replaceChildren(...children);
    return elem;
}

/** @param {HTMLElement} element  */
function addClass(element, newClass) {
    element.classList.add(newClass);
    return element;
}

function writeError(error) {
    writeLog(error, "error");
}

function writeInfo(msg) {
    writeLog(msg, "info");
}

function writeDebug(msg) {
    writeLog(msg, "debug");
}

function writeLog(msg, className) {
    if (typeof msg === "string" || msg instanceof String) {
        log.appendChild(div(addClass(span(msg), className)));
    } else {
        log.appendChild(div(addClass(msg, className)));
    }
}

function resetLog() {
    log.replaceChildren();
}

const log = getById("log");

// https://stackoverflow.com/questions/75988682/debounce-in-javascript
// https://www.joshwcomeau.com/snippets/javascript/debounce/
function debounce(callback, wait) {
    let timeoutId = null;
    return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            callback(...args);
        }, wait);
    };
}

export {
    getById,
    a,
    div,
    span,
    h,
    addClass,
    writeError,
    writeInfo,
    writeDebug,
    resetLog,
    debounce,
};
