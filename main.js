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

	/* {"Request_type":1,"minPlayers":1,"maxPlayers":10,"Buttons":{"Width":3,"Height":2,"5":{"Title":"SHOOT","X":0,"Y":0},"6":{"Title":"BOOST","X":2,"Y":0},"7":{"Title":"BREAK","X":2,"Y":1}},"Media":[{"Path":"/Users/denisogun/Documents/Year 3/Games Project/Game/Client/Assets/Media/Images/blue.png","Type":0},{"Path":"/Users/denisogun/Documents/Year 3/Games Project/Game/Client/Assets/Media/Images/red.png","Type":0},{"Path":"/Users/denisogun/Documents/Year 3/Games Project/Game/Client/Assets/Media/Images/green.png","Type":0},{"Path":"/Users/denisogun/Documents/Year 3/Games Project/Game/Client/Assets/Media/Images/magenta.png","Type":0}]} */

	var json = JSON.stringify(handshake);
	console.log(json);
	buffer = str2ab(json);

	chrome.sockets.tcp.send(socketId, buffer, function(info) {
		if (info.resultCode != 0) {
      		console.log("Send failed.");
		}
	});
}

chrome.sockets.tcp.onReceive.addListener(function(info) {
	console.log("Received data")
  	if (info.socketId != socketId)
    	return;
  	// info.data is an arrayBuffer.
  	console.log(info.data);
});



function ab2str(buf) {
	return String.fromCharCode.apply(null, new Uint16Array(buf));
}
    
function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
    	bufView[i] = str.charCodeAt(i);
    }
    
    return buf;
}