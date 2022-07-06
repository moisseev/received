/* global browser */

"use strict";

function saveOptions(e) {
    e.preventDefault();

    browser.storage.local.set({
        headerNumbers: document.querySelector("#header-numbers").value,
        regexp: document.querySelector("#regexp").value,
        removeDuplicates: document.querySelector("#remove-duplicates").checked,
        singleLine: document.querySelector("#single-line").checked
    });
}

function restoreOptions() {
    browser.storage.local.get(["headerNumbers", "regexp", "removeDuplicates", "singleLine"])
        .then(({headerNumbers, regexp, removeDuplicates, singleLine}) => {
            document.querySelector("#header-numbers").value = headerNumbers;
            document.querySelector("#regexp").value = regexp;
            document.querySelector("#remove-duplicates").checked = removeDuplicates;
            document.querySelector("#single-line").checked = singleLine;
        });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
