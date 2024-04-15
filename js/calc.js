import { getById, div, span, h, writeError } from "./common.js"

/** @param {SubmitEvent} event */
function submitForm(event) {
    console.log(input.value);
    resetLog();
    try {
        const stack = evalString(input.value);
        console.log(stack);

        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;

        params.set("in", input.value);
        window.history.replaceState({}, '', `${path}?${params.toString()}${hash}`);
    }
    catch (error) {
        writeError(error);
    }
    event.preventDefault();
}

/** @param {string} input */
function evalString(input) {
    let words = input.trim().split(' ').filter(i => i);
    return evalWords([], words);
}

function effect2(f) {
    return (stack) => {
        if (stack.length <= 1) throw "stack underflow";
        let [x, y, ...rest] = stack;
        return [f(y, x), ...rest];
    }
}

const plus = effect2((a, b) => a + b);
const subtract = effect2((a, b) => a - b);
const multiply = effect2((a, b) => a * b);
const divide = effect2((a, b) => a / b);


function evalWords(stack, words) {
    writeLog(stack, words);
    if (words.length == 0) return stack;

    let [word, ...rest] = words;
    return evalWords(evalWord(word, stack), rest);
}

function evalWord(word, stack, rest) {
    switch (word) {
        case "+": return plus(stack);
        case "-": return subtract(stack);
        case "*": return multiply(stack);
        case "/": return divide(stack);
        case "dup": return dup(stack);
        case "drop": return drop(stack);
        case "swap": return swap(stack);
        default: return parse(word, stack);
    }
}

function dup(stack) {
    let [x, ...rest] = stack;
    return [x, x, ...rest];
}

function drop(stack) {
    let [_, ...rest] = stack;
    return rest;
}

function swap(stack) {
    let [x, y, ...rest] = stack;
    return [y, x, ...rest];
}

function parse(word, stack) {
    let num = Number(word);
    if (isNaN(num)) {
        throw `word '${word}' not recognised`;
    }
    return [num, ...stack];
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
    input.value = queryInput;
}