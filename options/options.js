/* global browser */

"use strict";

function validateRegexp(value) {
    try {
        // eslint-disable-next-line no-new
        new RegExp(value);
        return {valid: true};
    } catch (err) {
        return {error: err.message, valid: false};
    }
}

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

document.addEventListener("DOMContentLoaded", () => {
    const regexpInput = document.querySelector("#regexp");
    const errorSpan = document.querySelector("#regexp-error");
    const saveButton = document.querySelector("#save-button");

    function updateValidationUI(validation) {
        if (validation.valid) {
            regexpInput.classList.remove("invalid");
            errorSpan.style.display = "none";
            errorSpan.textContent = "";
            saveButton.disabled = false;
        } else {
            regexpInput.classList.add("invalid");
            errorSpan.textContent = validation.error;
            errorSpan.style.display = "block";
            saveButton.disabled = true;
        }
    }

    function validateInput() {
        const validation = validateRegexp(regexpInput.value);
        updateValidationUI(validation);
    }

    regexpInput.addEventListener("input", validateInput);
    saveButton.addEventListener("mouseenter", validateInput);
});


browser.runtime.getBrowserInfo().then((browserInfo) => {
    const [majorVersion] = browserInfo.version.split(".", 1);

    if (majorVersion >= 128) document.querySelector("#substitute-fws-option").removeAttribute("hidden");

    function saveOptions(e) {
        e.preventDefault();

        const regexpValue = document.querySelector("#regexp").value;
        const validation = validateRegexp(regexpValue);

        if (!validation.valid) {
            const regexpInput = document.querySelector("#regexp");
            const errorSpan = document.querySelector("#regexp-error");
            regexpInput.classList.add("invalid");
            errorSpan.textContent = validation.error;
            errorSpan.style.display = "block";
            return;
        }

        browser.storage.local.set({
            headerNumbers: document.querySelector("#header-numbers").value,
            regexp: regexpValue,
            removeDuplicates: document.querySelector("#remove-duplicates").checked,
            singleLine: document.querySelector("#single-line").checked,

        });
        if (majorVersion >= 128) {
            browser.storage.local.set({substituteFWS: document.querySelector("#substitute-fws").checked});
        }
    }
    document.querySelector("form").addEventListener("submit", saveOptions);
});
