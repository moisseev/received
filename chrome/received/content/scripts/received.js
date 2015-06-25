var Received = {};

Received.addRecievedHeader = function() {
    var headers = prefs.getCharPref("mailnews.customHeaders");
    if (headers.search(/(^| )Received( |$)/i) < 0) {
        headers = headers + " Received";
        prefs.setCharPref("mailnews.customHeaders", headers);
    }
}

Received.parseReceivedHeader = function(headerStr, regexp) {
        var capturedSubstr = headerStr.match(new RegExp(regexp));
        if (capturedSubstr == null)
            return null;
    return capturedSubstr[1];
};
