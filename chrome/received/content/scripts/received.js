var Received = {};

Received.parseReceivedHeader = function(headerStr, regexp) {
        var capturedSubstr = headerStr.match(new RegExp(regexp));
        if (capturedSubstr == null)
            return null;
    return capturedSubstr[1];
};
