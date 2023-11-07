function getById(id) {
    let element = document.getElementById(id)
    if (element) {
        return element;
    } else {
        throw `Element with id '${id}' not found.`
    }
}

/**
 * @param {HTMLLIElement[]} children
 * @returns {HTMLUListElement}
 */
function ul(...children) {
    const ulElem = document.createElement("ul");
    ulElem.replaceChildren(...children);
    return ulElem;
}

/**
 * @param {HTMLElement[]} children
 * @returns {HTMLLIElement}
 */
function li(...children) {
    const liElem = document.createElement("li");
    liElem.replaceChildren(...children);
    return liElem;
}

/**
 * @param {string} href
 * @returns {HTMLAnchorElement}
 */
function a(href) {
    const aElem = document.createElement("a");
    aElem.href = href;
    return aElem;
}

/**
 * @param {HTMLElement[]} children
 * @returns {HTMLElement}
 */
function footer(...children) {
    const footerElem = document.createElement("footer");
    footerElem.replaceChildren(...children);
    return footerElem;
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

export { getById, ul, li, a, footer, div, span, h }