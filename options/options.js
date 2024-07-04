/* global browser */

"use strict";

function restoreOptions() {
    browser.storage.local.get(["headerNumbers", "regexp", "removeDuplicates", "singleLine", "substituteFWS"])
        .then(({headerNumbers, regexp, removeDuplicates, singleLine, substituteFWS}) => {
            document.querySelector("#header-numbers").value = headerNumbers;
            document.querySelector("#regexp").value = regexp;
            document.querySelector("#remove-duplicates").checked = removeDuplicates;
            document.querySelector("#single-line").checked = singleLine;
            document.querySelector("#substitute-fws").checked = substituteFWS;
        });
}
document.addEventListener("DOMContentLoaded", restoreOptions);


browser.runtime.getBrowserInfo().then((browserInfo) => {
    const [majorVersion] = browserInfo.version.split(".", 1);

    if (majorVersion >= 128) document.querySelector("#substitute-fws-option").removeAttribute("hidden");

    function saveOptions(e) {
        e.preventDefault();

        browser.storage.local.set({
            headerNumbers: document.querySelector("#header-numbers").value,
            regexp: document.querySelector("#regexp").value,
            removeDuplicates: document.querySelector("#remove-duplicates").checked,
            singleLine: document.querySelector("#single-line").checked,

        });
        if (majorVersion >= 128) {
            browser.storage.local.set({substituteFWS: document.querySelector("#substitute-fws").checked});
        }
    }
    document.querySelector("form").addEventListener("submit", saveOptions);
});
