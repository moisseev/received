Received.Message = {};

var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefBranch);

Received.Message.displayReceivedHeader = function() {
    var regexp = prefs.getCharPref("extensions.received.regexp");
    var rowEl = document.getElementById("expandedReceivedRow");
    var hdrEl = document.getElementById("receivedReceivedHeader");

    var uri = gMessageDisplay.folderDisplay.selectedMessageUris[0];
    if (uri == null)
        return;
    var hdr = gDBView.msgFolder.GetMessageHeader(gDBView.getKeyAt(gDBView.currentlyDisplayedMessage));
    if (hdr == null)
        return;
    var receivedHeader = hdr.getStringProperty("received");
    if (receivedHeader == null)
        return;

    var parsed = Received.parseReceivedHeader(receivedHeader, regexp);
    rowEl.collapsed = (parsed == null);
    hdrEl.headerValue = parsed;
    hdrEl.valid = true;
}

Received.Message.onLoad = function() {
    var listener = {};
    listener.onStartHeaders = function() {};
    listener.onEndHeaders = function() {
        Received.Message.displayReceivedHeader();
    };
    gMessageListeners.push(listener);
};

Received.Message.onUnload = function() {
    window.removeEventListener("load", Received.Message.onLoad, false);
    window.removeEventListener("unload", Received.Message.onUnload, false);
};

window.addEventListener("load", Received.Message.onLoad, false);
window.addEventListener("unload", Received.Message.onUnload, false);
