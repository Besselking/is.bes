import { getById, div, span, h } from "./common.js"
import lzString from "./lz-string.js";

function writeError(error) {
    log.appendChild(div(span(error)));
}

var definitions = {};

/** @param {SubmitEvent} event */
function submitForm(event) {
    console.log(input.value);
    resetLog();
    try {
        definitions = {};
        const stack = evalString(input.value);
        console.log(stack);

        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;

        params.set("in", lzString.compressToEncodedURIComponent(input.value));
        window.history.replaceState({}, '', `${path}?${params.toString()}${hash}`);
    }
    catch (error) {
        writeError(error);
        console.log(error);
    }
    event.preventDefault();
}

/** @param {string} inputString */
function evalString(inputString) {
    let words = inputString.trim().split(/[\s,]+/).filter(i => i);
    return evalWords(words);
}

function effect2(f) {
    return (stack) => {
        if (stack.length <= 1) throw "stack underflow, need 2 numbers";
        let [x, y, ...rest] = stack;
        return [f(y, x), ...rest];
    }
}

const plus = effect2((a, b) => a + b);
const subtract = effect2((a, b) => a - b);
const multiply = effect2((a, b) => a * b);
const divide = effect2((a, b) => a / b);


function evalWords(inputWords) {
    let words = inputWords;
    let stack = [];

    while (words.length > 0) {
        writeLog(stack, words);
        if (words.length == 0) return stack;
        
        let [word, ...rest] = words;
        [stack, words] = evalWord(word, stack, rest);
    }
    writeLog(stack, words);
    return stack;
}

function evalWord(word, stack, rest) {
    switch (word) {
        case "+": return [plus(stack), rest];
        case "-": return [subtract(stack), rest];
        case "*": return [multiply(stack), rest];
        case "/": return [divide(stack), rest];
        case "dup": return [dup(stack), rest];
        case "drop": return [drop(stack), rest];
        case "swap": return [swap(stack), rest];
        case "skip": return skip(stack, rest);
        case ":": return [stack, define(rest)];
        default: return parse(word, stack, rest);
    }
}

function skip(stack, words) {
    if (stack.length == 0) throw "stack underflow, dont know how much to skip";
    let [amount, ...restStack] = stack;

    if (amount > words.length) throw `program underflow, cant skip ${amount} words`;
    if (amount <= 0) return [stack.slice(1), words]; // no skipping on <= 0 

    let restWords = words.slice(amount);

    return [restStack, restWords];
}

function define(words) {
    if (words.length < 2) throw "missing definition after ':'"
    let [ident, ...rest] = words;
    let index = 0;
    let definition = [];

    for (; index < rest.length; index++) {
        const word = rest[index];
        if (word === ";") {
            break;
        } else if (rest.length - 1 == index) {
            throw "expected ';', found end of program"
        }
        definition.push(word);
    }

    definitions[ident] = definition;

    return rest.slice(index+1);
}

function dup(stack) {
    if (stack.length == 0) throw "stack underflow, nothing to duplicate";
    let [x, ...rest] = stack;
    return [x, x, ...rest];
}

function drop(stack) {
    if (stack.length == 0) throw "stack underflow, nothing to drop";
    let [_, ...rest] = stack;
    return rest;
}

function swap(stack) {
    if (stack.length < 2) throw "stack underflow, not enough to swap";
    let [x, y, ...rest] = stack;
    return [y, x, ...rest];
}

function parse(word, stack, rest) {
    if (word in definitions) {
        return [stack, [...definitions[word], ...rest]]
    }

    let num = Number(word);
    if (isNaN(num)) {
        throw `word '${word}' not recognised`;
    }

    return [[num, ...stack], rest];
}

function writeLog(stack, words) {
    let log_left = span(`[${stack.join(', ')}]`);
    let log_right = span(words.join(' '));
    
    if (words.length === 0) {
        log_left.textContent += " <=="
    }
    
    let log_row = div(log_left, log_right);
    log_row.className = "flex-spread";

    log.appendChild(log_row);
}

function resetLog() {
    if (!log.hasChildNodes()) return;
    
    let summary = h("summary");
    summary.textContent = log.firstChild.lastChild.textContent;
    
    let old_log = log.cloneNode(true);
    old_log.id = '';

    let details = h("details", summary, old_log);
    details.className = "history"

    log.insertAdjacentElement("afterend", details);
    log.replaceChildren(); //remove children, clear log
}

const form = getById("form");
const input = getById("input");
const log = getById("log");

form.addEventListener("submit", submitForm);

const urlParams = new URLSearchParams(window.location.search);
const queryInput = urlParams.get('in');

if (input.value.length === 0) {
    input.value = lzString.decompressFromEncodedURIComponent(queryInput);
}