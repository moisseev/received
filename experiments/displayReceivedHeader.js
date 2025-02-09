/* global ChromeUtils, globalThis */
/* exported displayReceivedHeader */

"use strict";

const Services = globalThis.Services || ChromeUtils.import("resource://gre/modules/Services.jsm").Services;
const [majorVersion] = Services.appinfo.platformVersion.split(".", 1);

/**
 * Dynamically imports a module based on the Thunderbird version.
 *
 * For Thunderbird 136 and above, it imports the ESM version of the module.
 * For older versions, it imports the JSM version.
 *
 * @param {string} name - The name of the module to import.
 * @returns {*} The exported module object.
 */
function importModule(name) {
    const moduleSubdir = name === "ExtensionSupport" ? "" : "gre";
    return majorVersion >= 136
        ? ChromeUtils.importESModule("resource://" + moduleSubdir + "/modules/" + name + ".sys.mjs")[name]
        : ChromeUtils.import("resource://" + moduleSubdir + "/modules/" + name + ".jsm")[name];
}

const ExtensionCommon = importModule("ExtensionCommon");

// eslint-disable-next-line no-var, vars-on-top
var displayReceivedHeader = class extends ExtensionCommon.ExtensionAPI {
    getAPI(context) {
        function getDocumentByTabIndex(windowId, tabIndex) {
            const window = Services.wm.getOuterWindowWithId(windowId);
            return getContentWindow(window, tabIndex).document;
        }

        function addHeadersToWindowById(windowId, tabIndex) {
            const document = getDocumentByTabIndex(windowId, tabIndex);
            const expandedHeaders2 = document
                .getElementById(majorVersion < 100 ? "expandedHeaders2" : "extraHeadersArea");

            if (expandedHeaders2) {
                const element = document.createElement(majorVersion < 100 ? "tr" : "div");
                element.hidden = true;
                element.id = "expandedReceivedRow";
                element.classList.add("message-header-row");

                const headerRowTitleLabel = document.createXULElement("label");
                headerRowTitleLabel.id = "expandedReceivedLabel";
                headerRowTitleLabel.classList.add(majorVersion < 100
                    ? "headerName"
                    : "message-header-label");
                headerRowTitleLabel.value = "Received";
                headerRowTitleLabel.control = "receivedReceivedHeader";

                if (majorVersion < 100) {
                    const headerRowTitle = document.createElement("th");
                    headerRowTitle.appendChild(headerRowTitleLabel);
                    element.appendChild(headerRowTitle);
                } else {
                    element.appendChild(headerRowTitleLabel);
                }

                const expandedReceivedBox = document.createElement("div");
                expandedReceivedBox.id = "expandedReceivedBox";

                const headerRowValue = document.createElement("div");
                headerRowValue.id = "receivedReceivedHeader";

                expandedReceivedBox.appendChild(headerRowValue);
                element.appendChild(expandedReceivedBox);
                expandedHeaders2.appendChild(element);

                if (majorVersion >= 100) {
                    expandedReceivedBox.addEventListener("contextmenu", (event) => {
                        const popup = document.getElementById("simpleCopyPopup");
                        popup.headerField = event.target;
                        popup.openPopupAtScreen(event.screenX, event.screenY, true);
                    });
                }
            } else {
                throw Error("Could not find the expandedHeaders2 element");
            }
        }

        function getMailHeaderfield(document, windowId, tabIndex, elId) {
            let mailHeaderfield = document.getElementById(elId);
            if (!mailHeaderfield) {
                addHeadersToWindowById(windowId, tabIndex);
                mailHeaderfield = document.getElementById(elId);
            }
            return mailHeaderfield;
        }

        context.callOnClose(this);
        return {
            displayReceivedHeader: {
                setReceivedHeaderHidden(windowId, tabIndex, hidden) {
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

                    const document = getDocumentByTabIndex(windowId, tabIndex);
                    if (!document) return;

                    const mailHeaderfield = getMailHeaderfield(document, windowId, tabIndex, "expandedReceivedRow");
                    mailHeaderfield.hidden = hidden;
                    if (majorVersion >= 100) syncGridColumnWidths(document);
                },
                setReceivedHeaderValue(windowId, tabIndex, headersArray, singleLine, separator) {
                    const document = getDocumentByTabIndex(windowId, tabIndex);
                    if (!document) return;

                    const headerRowValue = document.createElement("div");
                    headerRowValue.id = "receivedReceivedHeader";

                    function initMailHeaderfield() {
                        const mailHeaderfield = document.createXULElement("mail-headerfield");
                        mailHeaderfield.flex = "1";
                        mailHeaderfield.classList.add("header-row");
                        return mailHeaderfield;
                    }

                    if (singleLine) {
                        const mailHeaderfield = initMailHeaderfield();

                        headersArray.forEach(function (header) {
                            if (mailHeaderfield.textContent !== "") {
                                mailHeaderfield.textContent += separator;
                            }
                            header.forEach(function (string) {
                                mailHeaderfield.textContent += string;
                            });
                        });

                        headerRowValue.appendChild(mailHeaderfield);
                    } else {
                        headersArray.forEach(function (header, i) {
                            const mailHeaderfield = initMailHeaderfield();
                            if (i !== 0 && majorVersion > 78) mailHeaderfield.style.marginTop = "3px";
                            header.forEach(function (string) {
                                mailHeaderfield.textContent += string;
                            });

                            headerRowValue.appendChild(mailHeaderfield);
                        });
                    }

                    const mailHeaderfield = getMailHeaderfield(document, windowId, tabIndex, "expandedReceivedBox");
                    const oldChild = document.getElementById("receivedReceivedHeader");
                    mailHeaderfield.replaceChild(headerRowValue, oldChild);
                },
            },
        };
    }

    // eslint-disable-next-line class-methods-use-this
    close() {
        ["mail:3pane", "mail:messageWindow"].forEach((windowType) => {
            function removeExpandedReceivedRow(window, tabIndex) {
                const expandedReceivedRow = getContentWindow(window, tabIndex).document
                    .getElementById("expandedReceivedRow");
                if (expandedReceivedRow) expandedReceivedRow.remove();
            }

            for (const window of Services.wm.getEnumerator(windowType)) {
                if (window.gTabmail) {
                    window.gTabmail.tabInfo.forEach((tab, tabIndex) => {
                        if (["mail3PaneTab", "mailMessageTab"].some((n) => n === tab.mode.name))
                            removeExpandedReceivedRow(window, tabIndex);
                    });
                } else {
                    removeExpandedReceivedRow(window);
                }
            }
        });
    }
};

function getContentWindow(window, tabIndex) {
    if (majorVersion < 111) return window;

    if (window.gTabmail) {
        const tab = window.gTabmail.tabInfo[tabIndex];
        return tab.mode.name === "mail3PaneTab"
            ? tab.chromeBrowser.contentWindow.messageBrowser.contentWindow
            : tab.chromeBrowser.contentWindow;
    } else if (window.messageBrowser) {
        return window.messageBrowser.contentWindow;
    }
    throw Error("Could not find the XUL <browser> object");
}
