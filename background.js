/* global browser */

"use strict";

function parseReceivedHeader(headerStr, regexp) {
    const captured = headerStr.match(new RegExp(regexp));
    if (captured === null) return null;
    captured.shift();
    // If the capturing group is optional ("* "or "?" quantifier) and didn’t match, its value is set to undefined.
    const filtered = captured.filter(function (element) {
        return typeof element !== "undefined";
    });
    if (!filtered.length) return null;
    return filtered;
}

function parseReceivedHeaders(headers, regexp) {
    const received = [];
    headers.forEach(function (header) {
        const parsed = parseReceivedHeader(header, regexp);
        if (parsed !== null)
            received.push(parsed);
    });
    return received;
}

browser.storage.local.get(["headerNumbers", "regexp"]).then(({headerNumbers, regexp}) => {
    if (!headerNumbers) browser.storage.local.set({headerNumbers: ""});
    if (!regexp) browser.storage.local.set({regexp: "(.*)"});
});

function displayReceivedHeader(tabId, messageId) {
    browser.messages.getFull(messageId).then((messagepart) => {
        browser.storage.local.get(["headerNumbers", "regexp", "removeDuplicates", "singleLine"]).then(({headerNumbers, regexp, removeDuplicates, singleLine}) => {
            let headers = [];
            let numberFound = false;

            const {received} = messagepart.headers;
            if (typeof received !== "undefined") {
                headerNumbers.split(",").map((item) => parseInt(item, 10)).forEach((i) => {
                    if (!isNaN(i)) numberFound = true;
                    const header = received[i];
                    if (typeof header !== "undefined") headers.push(header);
                });
                if (!numberFound) headers = received;
            }

            if (headers.length) {
                const parsed = parseReceivedHeaders(headers, regexp);
                let filteredParsed = [];

                if (removeDuplicates) {
                    let alreadyAdded = [];
                    for (let item of parsed) {
                        const key = item.join("_");
                        if (alreadyAdded.indexOf(key) === -1) {
                            filteredParsed.push(item);
                            alreadyAdded.push(key);
                        }
                     }
                } else {
                    filteredParsed = parsed;
                }

                browser.displayReceivedHeader.setReceivedHeaderValue(tabId, filteredParsed, singleLine);
                browser.displayReceivedHeader.setReceivedHeaderHidden(tabId, !filteredParsed.length);
            } else {
                browser.displayReceivedHeader.setReceivedHeaderHidden(tabId, true);
            }
        });
    });
}

browser.windows.getAll({populate: true, windowTypes: ["normal", "messageDisplay"]}).then((windows) => {
    windows.forEach(function (window) {
        browser.displayReceivedHeader.addHeadersToWindowById(window.id);
        window.tabs.filter((tab) => tab.active)
            .forEach(function (tab) {
                browser.messageDisplay.getDisplayedMessage(tab.id).then((message) => {
                    if (!message) return;
                    displayReceivedHeader(tab.id, message.id);
                });
            });
    });
});

browser.windows.onCreated.addListener((window) => {
    // Skip popup, devtools, etc.
    if (window.type !== "normal" && window.type !== "messageDisplay") return;
    browser.displayReceivedHeader.addHeadersToWindowById(window.id);
});

browser.messageDisplay.onMessageDisplayed.addListener((tab, message) => {
    displayReceivedHeader(tab.id, message.id);
});
