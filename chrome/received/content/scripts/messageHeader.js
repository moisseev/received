Received.Message = {};

var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefBranch);

Received.Message.displayReceivedHeader = function() {
    var regexp = prefs.getCharPref("extensions.received.regexp");
    var rowEl = document.getElementById("expandedReceivedRow");
    var hdrEl = document.getElementById("receivedReceivedHeader");
    var msg = gMessageDisplay.displayedMessage;

    if (!msg.folder) {
        rowEl.collapsed = true;
        return
    };

    MsgHdrToMimeMessage(msg, null, function(aMsgHdr, aMimeMsg) {
        var parsed = Received.parseReceivedHeaders(aMimeMsg.headers, regexp);
        rowEl.collapsed = (parsed.length == 0);
        hdrEl.headerValue = parsed;
        hdrEl.valid = true;
    }, true);
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
