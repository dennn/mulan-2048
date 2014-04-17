const IP = "127.0.0.1"
const PORT = 8080;

// Enum of requests
var requestType = {
	NullRequest : 0,
	Handshake : 1,
	GameData : 2
};

var socketId;

chrome.sockets.tcp.create({}, function(createInfo) {
	socketId = createInfo.socketId;
  	chrome.sockets.tcp.connect(createInfo.socketId, IP, PORT, onConnectedCallback);
});

function onConnectedCallback() {
	console.log("Connected");

	chrome.sockets.tcp.onReceiveError.addListener(function(info) {
    	console.log("Error: ", info);
 	});

 	sendHandshake();

 	chrome.sockets.tcp.setPaused(info.clientSocketId, false);
}

function sendHandshake() {
	var handshake = {
  		Request_type: requestType.Handshake,
  		maxPlayers: 1,
  		minPlayers: 1,
  		Buttons: {
  			Width: 2,
  			Height: 2
  		},
  		Media: [{
  			Path: "ASKOASK",
  			Type: 0
  		}]
	}

	var json = JSON.stringify(handshake);
	console.log(json);

	string2ArrayBuffer(json, function(buf) {
		chrome.sockets.tcp.send(socketId, buf, function(info) {
			if (info.resultCode != 0) {
      			console.log("Send failed.");
			}
		});
	});
}

chrome.sockets.tcp.onReceive.addListener(function(info) {
	console.log("Received data")
  	if (info.socketId != socketId)
    	return;
  	// info.data is an arrayBuffer.
  	console.log(info.data);
});

/* Turn the JSON strings into an array buffer. Chrome sockets require the data to be in this format to send */

function string2ArrayBuffer(string, callback) {
    var blob = new Blob([string]);
    var f = new FileReader();
    f.onload = function(e) {
        callback(e.target.result);
    }
    f.readAsArrayBuffer(blob);
}

function arrayBuffer2String(buf, callback) {
    var blob = new Blob([buf]);
    var f = new FileReader();
    f.onload = function(e) {
        callback(e.target.result)
    }
    f.readAsText(blob);
}