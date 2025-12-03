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

function validateHeaderNumbers(value) {
    // Pattern matches: empty string or comma-separated integers (positive or negative)
    const pattern = /^ *(-?\d+ *(, *-?\d+ *)*)?$/;
    if (!pattern.test(value)) {
        return {error: "Invalid format. Use comma-separated integers (e.g., \"0,1,2\" or \"-1,-2\")", valid: false};
    }
    return {valid: true};
}

// Validation configuration
const validationConfig = [
    {id: "header-numbers", validator: validateHeaderNumbers},
    {id: "regexp", validator: validateRegexp}
];

function validateField(id, validator) {
    const inputElement = document.querySelector(`#${id}`);
    const errorSpan = document.querySelector(`#${id}-error`);
    const validation = validator(inputElement.value);

    if (validation.valid) {
        inputElement.classList.remove("invalid");
        errorSpan.style.display = "none";
        errorSpan.textContent = "";
    } else {
        inputElement.classList.add("invalid");
        errorSpan.textContent = validation.error;
        errorSpan.style.display = "block";
    }

    return validation.valid;
}

function validateAllFields() {
    return validationConfig.every(({id, validator}) => validateField(id, validator));
}

function restoreOptions() {
    return browser.storage.local.get(["headerNumbers", "regexp", "removeDuplicates", "singleLine", "substituteFWS"])
        .then(({headerNumbers, regexp, removeDuplicates, singleLine, substituteFWS}) => {
            document.querySelector("#header-numbers").value = headerNumbers;
            document.querySelector("#regexp").value = regexp;
            document.querySelector("#remove-duplicates").checked = removeDuplicates;
            document.querySelector("#single-line").checked = singleLine;
            document.querySelector("#substitute-fws").checked = substituteFWS;
        });
}

document.addEventListener("DOMContentLoaded", () => {
    const saveButton = document.querySelector("#save-button");

    function updateSaveButtonState() {
        const hasInvalidFields = document.querySelectorAll("input.invalid").length > 0;
        saveButton.disabled = hasInvalidFields;
    }

    restoreOptions().then(() => {
        // Validate loaded values
        validateAllFields();
        updateSaveButtonState();
    });

    // Set up real-time validation for all configured fields
    validationConfig.forEach(({id, validator}) => {
        const inputElement = document.querySelector(`#${id}`);
        inputElement.addEventListener("input", () => {
            validateField(id, validator);
            updateSaveButtonState();
        });
    });
});


browser.runtime.getBrowserInfo().then((browserInfo) => {
    const [majorVersion] = browserInfo.version.split(".", 1);

    if (majorVersion >= 128) document.querySelector("#substitute-fws-option").removeAttribute("hidden");

    function saveOptions(e) {
        e.preventDefault();

        // Validate all fields before saving
        if (!validateAllFields()) return;

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
