/* global ChromeUtils, Components */
/* exported displayReceivedHeader */

"use strict";

const {ExtensionCommon} = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
const {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");

// eslint-disable-next-line no-var
var displayReceivedHeader = class extends ExtensionCommon.ExtensionAPI {
    getAPI(context) {
        const [majorVersion] = Services.appinfo.platformVersion.split(".", 1);

        function getDocumentByTabId(tabId) {
            const {ExtensionParent} = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");
            const target = ExtensionParent.apiManager.global.tabTracker.getTab(tabId);
            const window = Components.utils.getGlobalForObject(target);
            return window.document;
        }

        context.callOnClose(this);
        return {
            displayReceivedHeader: {
                addHeadersToWindowById(windowId) {
                    const window = Services.wm.getOuterWindowWithId(windowId);
                    const {document} = window;
                    const expandedHeaders2 = document
                        .getElementById(majorVersion < 100 ? "expandedHeaders2" : "extraHeadersArea");

                    if (expandedHeaders2) {
                        const element = document.createElement(majorVersion < 100 ? "tr" : "div");
                        element.hidden = true;
                        element.id = "expandedReceivedRow";
                        element.classList.add("message-header-row");

                        const headerRowTitleLabel = document.createXULElement("label");
                        headerRowTitleLabel.id = "expandedReceivedLabel";
                        headerRowTitleLabel.classList.add(majorVersion < 100 ? "headerName" : "message-header-label");
                        headerRowTitleLabel.value = "Received";
                        headerRowTitleLabel.control = "receivedReceivedHeader";

                        if (majorVersion < 100) {
                            const headerRowTitle = document.createElement("th");
                            headerRowTitle.appendChild(headerRowTitleLabel);
                            element.appendChild(headerRowTitle);
                        } else {
                            element.appendChild(headerRowTitleLabel);
                        }

                        const headerRowValue = document.createElement("td");
                        headerRowValue.id = "receivedReceivedHeader";

                        element.appendChild(headerRowValue);
                        expandedHeaders2.appendChild(element);
                    } else {
                        throw Error("Could not find the expandedHeaders2 element");
                    }
                },
                setReceivedHeaderHidden(tabId, hidden) {
                    // Ensure that the all visible labels have the same size.
                    function syncGridColumnWidths(document) {
                        const allHeaderLabels = document
                            .querySelectorAll(".message-header-row:not([hidden]) .message-header-label");

                        // Clear existing style.
                        for (const label of allHeaderLabels) {
                            label.style.minWidth = null;
                        }

                        const minWidth = Math.max(...Array.from(allHeaderLabels, (i) => i.clientWidth));
                        for (const label of allHeaderLabels) {
                            label.style.minWidth = `${minWidth}px`;
                        }
                    }

                    const document = getDocumentByTabId(tabId);
                    if (!document) return;

                    const mailHeaderfield = document.getElementById("expandedReceivedRow");
                    mailHeaderfield.hidden = hidden;
                    if (majorVersion >= 100) syncGridColumnWidths(document);
                },
                setReceivedHeaderValue(tabId, headersArray, singleLine) {
                    const document = getDocumentByTabId(tabId);
                    if (!document) return;

                    const headerRowValue = document.createElement("td");
                    headerRowValue.id = "receivedReceivedHeader";
                    let mailHeaderfield;

                    if (singleLine) {
                        mailHeaderfield = document.createXULElement("mail-headerfield");
                        mailHeaderfield.flex = "1";
                    }

                    headersArray.forEach(function (header) {
                        if (!singleLine) {
                            mailHeaderfield = document.createXULElement("mail-headerfield");
                            mailHeaderfield.flex = "1";
                        }

                        if (mailHeaderfield.textContent !== "") {
                            mailHeaderfield.textContent += ", ";
                        }

                        header.forEach(function (string) {
                            mailHeaderfield.textContent += string;
                        });

                        if (!singleLine) {
                            headerRowValue.appendChild(mailHeaderfield);
                        }
                    });

                    if (singleLine) {
                        headerRowValue.appendChild(mailHeaderfield);
                    }

                    mailHeaderfield = document.getElementById("expandedReceivedRow");
                    const oldChild = document.getElementById("receivedReceivedHeader");
                    mailHeaderfield.replaceChild(headerRowValue, oldChild);
                },
            },
        };
    }

    // eslint-disable-next-line class-methods-use-this
    close() {
        ["mail:3pane", "mail:messageWindow"].forEach((windowType) => {
            for (const window of Services.wm.getEnumerator(windowType)) {
                const expandedReceivedRow = window.document.getElementById("expandedReceivedRow");
                if (expandedReceivedRow) {
                    expandedReceivedRow.remove();
                }
            }
        });
    }
};
