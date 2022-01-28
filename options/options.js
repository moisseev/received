/* global browser */

"use strict";

function saveOptions(e) {
    e.preventDefault();

    browser.storage.local.set({
        headerNumbers: document.querySelector("#header-numbers").value,
        regexp: document.querySelector("#regexp").value
    });
}

function restoreOptions() {
    browser.storage.local.get(["headerNumbers", "regexp"]).then(({headerNumbers, regexp}) => {
        document.querySelector("#header-numbers").value = headerNumbers;
        document.querySelector("#regexp").value = regexp;
    });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
