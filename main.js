const IP = "127.0.0.1";
const PORT = 8080;

// Enum of requests
var requestType = {
	NullRequest : 0,
	Handshake : 1,
	GameData : 2
};

var buttonState = {
	Released : 0,
	Pressed : 1
};

var action = {
	up : 0,
	down: 1,
	left: 2,
	right: 3,
	restart: 4
};

var prevStatus = [];
for (i = 4; i < 9; i++) {
	prevStatus[i] = 0;
}

var socketId;
var numberOfPlayers = 0;
var handshaken = false;

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

chrome.sockets.tcp.onReceive.addListener(function(info) {
	if (info.socketId != socketId)
		return;
	// info.data is an arrayBuffer.
	arrayBuffer2String(info.data, function(string) {
		var jsonObject = JSON.parse(string);
		if (handshaken === true) {
			handleGameDataResponse(jsonObject);
		} else {
			handleHandshakeResponse(jsonObject);
		}
	});
});


/* Responses */

function sendHandshake() {
	var handshake = {
		Request_type: requestType.Handshake,
		Max_players: 1,
		Min_players: 1,
		Buttons: {
			Width: 5,
			Height: 3,
			4: {
				"Title": "↑",
				"X": 1,
				"Y": 0
			},
			5: {
				"Title": "↓",
				"X": 1,
				"Y": 2
			},
			6: {
				"Title": "←",
				"X": 0,
				"Y": 1
			},
			7: {
				"Title": "→",
				"X": 2,
				"Y": 1
			},
			8: {
				"Title": "Restart",
				"X": 4,
				"Y": 0
			}
		},
		Media: []
	};

	var json = JSON.stringify(handshake);

	string2ArrayBuffer(json, function(buf) {
		chrome.sockets.tcp.send(socketId, buf, function(info) {
			if (info.resultCode !== 0) {
				console.log("Send failed.");
			}
		});
	});
}

function handleHandshakeResponse(JSON)
{
	numberOfPlayers = JSON.Active_Players;
	handshaken = true;
	sendGameData();
}

function sendGameData()
{
	var gameData = {
		Request_type: requestType.GameData,
		Devices: [4, 5, 6, 7, 8],
		Player_actions: {}
	};

	var json = JSON.stringify(gameData);

	string2ArrayBuffer(json, function(buf) {
		chrome.sockets.tcp.send(socketId, buf, function(info) {
			if (info.resultCode !== 0) {
				console.log("Send failed.");
			}
		});
	});
}

function handleGameDataResponse(JSON)
{
	var players = JSON.Player_inputs;

	if (players[0] != null) {
		var playersDevices = players[0].Devices;
		if (playersDevices != null) {
			for (var key in playersDevices) {
				if (playersDevices.hasOwnProperty(key)) {
					if (playersDevices[key].Status == 1 && prevStatus[key] == 0) {
						var gesture;
						console.log("button press");
						switch (key) {
							case "4":
								gesture = action.up;
								break;

							case "5":
								gesture = action.down;
								break;

							case "6":
								gesture = action.left;
								break;

							case "7":
								gesture = action.right;
								break;

							case "8":
								gesture = action.restart;
								break;
						}

						var event = new CustomEvent('mulan-gesture', { 'detail': gesture });
						document.dispatchEvent(event);
					}
					prevStatus[key] = playersDevices[key].Status;
				}
			}
		}
	}

	var shouldKill = JSON.GameKill;
	if (shouldKill != null) {
		console.log("Got kill");
		if (shouldKill) {
			chrome.sockets.tcp.close(socketId, null);
			window.close();
		}
	}

	setTimeout(sendGameData, 25);
}

/* Turn the JSON strings into an array buffer. Chrome sockets require the data to be in this format to send */

function string2ArrayBuffer(string, callback) {
	var blob = new Blob([string]);
	var f = new FileReader();
	f.onload = function(e) {
		callback(e.target.result);
	};
	f.readAsArrayBuffer(blob);
}

function arrayBuffer2String(buf, callback) {
	var blob = new Blob([buf]);
	var f = new FileReader();
	f.onload = function(e) {
		callback(e.target.result);
	};
	f.readAsText(blob);
}
