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

function displayReceivedHeader(windowId, tabIndex, messageId) {
    browser.messages.getFull(messageId).then((messagepart) => {
        browser.storage.local.get(["headerNumbers", "regexp", "removeDuplicates", "singleLine"])
            .then(({headerNumbers, regexp, removeDuplicates, singleLine = false}) => {
                let headers = [];
                let numberFound = false;
                let separator = "🡄";

                const {received} = messagepart.headers;
                if (typeof received !== "undefined") {
                    const idxDiff = [];
                    let prev = null;
                    headerNumbers.split(",").map((item) => parseInt(item, 10)).forEach((i) => {
                        if (!isNaN(i)) numberFound = true;
                        // .at() method is not supported on TB78
                        const header = received[(i < 0) ? received.length + i : i];
                        if (typeof header !== "undefined") {
                            headers.push(header);

                            if (singleLine) {
                                if (prev !== null) idxDiff.push(i - prev);
                                prev = i;
                            }
                        }
                    });
                    if (numberFound) {
                        if (singleLine) {
                            // ascending
                            if (idxDiff.every((n) => n > 0)) {
                            // descending
                            } else if (idxDiff.every((n) => n < 0)) {
                                separator = "🡆";
                            // out of order
                            } else {
                                separator = "🔹";
                            }
                        }
                    } else {
                        headers = received;
                    }

                }

                if (headers.length) {
                    const parsed = parseReceivedHeaders(headers, regexp);
                    let filteredParsed = [];

                    if (removeDuplicates) {
                        const alreadyAdded = [];
                        for (const item of parsed) {
                            const key = item.join("_");
                            if (alreadyAdded.indexOf(key) === -1) {
                                filteredParsed.push(item);
                                alreadyAdded.push(key);
                            }
                        }
                    } else {
                        filteredParsed = parsed;
                    }

                    browser.displayReceivedHeader
                        .setReceivedHeaderValue(windowId, tabIndex, filteredParsed, singleLine, " " + separator + " ");
                    browser.displayReceivedHeader.setReceivedHeaderHidden(windowId, tabIndex, !filteredParsed.length);
                }
            });
    });
}

browser.runtime.getBrowserInfo().then((browserInfo) => {
    const [majorVersion] = browserInfo.version.split(".", 1);

    browser.windows.getAll({populate: true, windowTypes: ["normal", "messageDisplay"]}).then((windows) => {
        windows.forEach(function (window) {
            window.tabs
                // Prior TB 111 messages are not displayed in inactive tabs
                .filter((tab) => (majorVersion >= 111 || tab.active) &&
                    (["mail", "messageDisplay"].some((t) => t === tab.type)))
                .forEach((tab) => {
                    browser.messageDisplay.getDisplayedMessage(tab.id).then((message) => {
                        if (!message) return;
                        displayReceivedHeader(tab.windowId, tab.index, message.id);
                    });
                });
        });
    });
});

let lastDisplayedMessageId = null;

browser.messageDisplay.onMessageDisplayed.addListener((tab, message) => {
    lastDisplayedMessageId = message.id;
    displayReceivedHeader(tab.windowId, tab.index, message.id);
});

browser.mailTabs.onSelectedMessagesChanged.addListener((tab, selectedMessages) => {
    if (selectedMessages.messages.length !== 1) return;
    // The same message was re-selected (e.g. after column sorting)
    if (selectedMessages.messages[0].id === lastDisplayedMessageId) return;
    // Hide header until message is loaded
    browser.displayReceivedHeader.setReceivedHeaderHidden(tab.windowId, tab.index, true);
});
