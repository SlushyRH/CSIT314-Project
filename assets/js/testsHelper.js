window.addEventListener("DOMContentLoaded", () => {
    testOutcome = document.getElementById('testOutcome');
});

let testOutcome;

function resetTestOutcome() {
    testOutcome.innerText = '';
}

function log(msg) {
    testOutcome.innerText += '\n' + msg;
}

function assert(condition, msg) {
    const result = condition ? `PASS: ${msg}` : `FAIL: ${msg}`;
    testOutcome.innerText +=  '\n' + result;
}