/* global ChromeUtils, Components */
/* exported displayReceivedHeader */

"use strict";

const {ExtensionCommon} = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
const {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");

const {platformVersion} = Services.appinfo;
let messageHeaderId = "extraHeadersArea";
let headerRowTitleLabelClass = "message-header-label";
if (Services.vc.compare(platformVersion, "100.0a1") === -1) {
    messageHeaderId = "expandedHeaders2";
    headerRowTitleLabelClass = "headerName";
}

// eslint-disable-next-line no-var, vars-on-top
var displayReceivedHeader = class extends ExtensionCommon.ExtensionAPI {
    getAPI(context) {
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
                    const expandedHeaders2 = document.getElementById(messageHeaderId);

                    if (expandedHeaders2) {
                        const element = document.createElement("tr");
                        element.hidden = true;
                        element.id = "expandedReceivedRow";

                        const headerRowTitle = document.createElement("th");
                        const headerRowTitleLabel = document.createXULElement("label");
                        headerRowTitleLabel.id = "expandedReceivedLabel";
                        headerRowTitleLabel.classList.add(headerRowTitleLabelClass);
                        headerRowTitleLabel.value = "Received";
                        headerRowTitleLabel.control = "receivedReceivedHeader";
                        headerRowTitle.appendChild(headerRowTitleLabel);

                        const headerRowValue = document.createElement("td");
                        headerRowValue.id = "receivedReceivedHeader";

                        element.appendChild(headerRowTitle);
                        element.appendChild(headerRowValue);
                        expandedHeaders2.appendChild(element);
                    } else {
                        throw Error("Could not find the expandedHeaders2 element");
                    }
                },
                setReceivedHeaderHidden(tabId, hidden) {
                    const document = getDocumentByTabId(tabId);
                    if (!document) return;

                    const mailHeaderfield = document.getElementById("expandedReceivedRow");
                    mailHeaderfield.hidden = hidden;
                },
                setReceivedHeaderValue(tabId, headersArray) {
                    const document = getDocumentByTabId(tabId);
                    if (!document) return;

                    const headerRowValue = document.createElement("td");
                    headerRowValue.id = "receivedReceivedHeader";

                    headersArray.forEach(function (header) {
                        const mailHeaderfield = document.createXULElement("mail-headerfield");
                        mailHeaderfield.flex = "1";
                        header.forEach(function (string) {
                            mailHeaderfield.textContent += string;
                        });

                        headerRowValue.appendChild(mailHeaderfield);
                    });

                    const mailHeaderfield = document.getElementById("expandedReceivedRow");
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
