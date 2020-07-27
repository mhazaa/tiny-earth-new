var express = require('express');
var app = express();
var fs = require('fs');
var request = require('request');
var path = require('path');
var PORT = process.env.PORT || 52300;
var server = app.listen(PORT, '0.0.0.0', function(){
	console.log('listenting to port: ' + PORT);
});

var socket = require('socket.io');
var siofu = require("socketio-file-upload");
var io = socket(server);

app.set('view engine', 'ejs');
app.use(express.static('views'));
app.use(siofu.router)

var mainRouter = require("./routes/router.js");
mainRouter(app);

var Player = require("./classes/Player");
var Items = require("./classes/Items");
var Timer = require("./classes/Timer")

var timer = new Timer();
timer.start();

var itemsData = {
	image: {
		Class: Items.Image,
		array: []
	},
	audio: {
		Class: Items.Audio,
		array: []
	},
	room: {
		Class: Items.Room,
		array: []
	},
	portal: {
		Class: Items.Portal,
		array: []
	},
	text: {
		Class: Items.Text,
		array: []
	},
	iframe: {
		Class: Items.Iframe,
		array: []
	}
}

var players = [];
var sockets = [];
var downloadedAssets = 'views/downloadedAssets';

io.on('connect', function(socket){
	setInterval(function(){
		socket.emit('updateTime', timer);
	},50);

	var player = new Player();
	var thisPlayerID = player.id;
	player.socketId = socket.id;

	console.log(thisPlayerID + ' connected to server');

	sockets[thisPlayerID] = socket;
	socket.emit('register', {id: thisPlayerID});

	socket.on('open', function(data){
		player.peerId = data.peerId;
	});

	socket.on('spawn', function(data){
		player.username = data.username;
		player.color = data.color;
		if(data.x) player.x = data.x;
		if(data.y) player.y = data.y;
		console.log(player.id + ' spawned into game with username ' + player.username);
		players[thisPlayerID] = player;
		socket.emit('spawn', player);
		socket.broadcast.emit('spawnOtherPlayers', player);
		for(var playerID in players){
			if (playerID != thisPlayerID) {
				socket.emit('spawnOtherPlayers', players[playerID]);
			}
		}
		io.sockets.emit('updateActivePlayers', Object.size(players));
		ingameEvents();
	});

	socket.on('disconnect', function(){
		console.log(thisPlayerID + ' disconnected from server');
		delete sockets[thisPlayerID];
		delete players[thisPlayerID];
		socket.broadcast.emit('disconnected', {id: thisPlayerID});
		socket.broadcast.emit('updateActivePlayers', Object.size(players));
	});

	function ingameEvents(){
		/* player changes events */
		socket.on('updatePosition', function(data){
			player.x = data.x;
			player.y = data.y;
			socket.broadcast.emit('updatePosition', {
				id: thisPlayerID,
				x: player.x,
				y: player.y
			});
		});

		socket.on('updateColor', function(data){
			console.log(thisPlayerID + ' changed color to ' + data.color);
			player.color = data.color;
			socket.broadcast.emit('updateColor', {
				id: thisPlayerID,
				color: player.color
			});
		});

		socket.on('requestTether', function(data){
			console.log(data.requesterId + ' is requesting tether with ' + data.receiverId);
			io.to(players[data.receiverId].socketId).emit('requestTether', {requesterId: data.requesterId});
		});

		socket.on('acceptTether', function(data){
			console.log(data.receiverId + ' is accepting tether with ' + data.requesterId);
			io.to(players[data.requesterId].socketId).emit('acceptTether', {receiverId: data.receiverId});
		});

		socket.on('sendText', function(data){
			console.log(player.username + ': ' + data.text);
			player.text = data.text;
			io.sockets.emit('sendText', {
				id: thisPlayerID,
				text: data.text
			});
		});

		socket.on('switchScene', function(data){
			console.log(data.id + ' switched from scene ' + players[data.id].scene + ' to scene ' + data.scene);
			players[data.id].scene = data.scene;
			socket.broadcast.emit('switchScene', {
				id: data.id,
				scene: data.scene
			});
		});

		/*sending items */
		var uploader = new siofu();
		uploader.dir = downloadedAssets;
		uploader.listen(socket);
		var fileUploading;
		uploader.on('complete', function(e){
			fileUploading.name = e.file.name;
			console.log(fileUploading.localFile + ' local file uploaded to server');
			console.log(fileUploading.id + ' added to ' + fileUploading.itemType + 's');
			console.log(fileUploading);
			io.sockets.emit('sendItem', fileUploading);
		});

		socket.on('sendItem', function(data){
			var itemData = itemsData[data.itemType];
			var item = new itemData.Class();

			itemData.array[item.id] = item;
			for(var key in data){
				itemData.array[item.id][key] = data[key]
			}

			if(data.remoteFile){
				itemData.array[item.id].name = itemData.array[item.id].id + path.extname(data.remoteFile);
				/*downloading remote file*/
				var file = fs.createWriteStream(downloadedAssets + "/" + item.name);
				request.get(data.remoteFile, function(err, resp, body){
					if(err){
						console.log(err.message, ' file deleted');
						file.close();
						fs.unlinkSync(downloadedAssets + "/" + item.name);
						delete itemData.array[item.id];
					} else {
						file.on('finish', function() {
							file.close(function(){
								console.log(data.remoteFile + ' remote file uploaded to server');
								console.log(item.id + ' added to ' + item.itemType + 's');
								console.log(item);
								io.sockets.emit('sendItem', item);
							});
						});
					}
				})
				.pipe(file);
				return;
			}

			if(data.localFile){
				fileUploading = itemData.array[item.id];
				return;
			}

			console.log(item.id + ' added to ' + item.itemType + 's');
			console.log(item);
			io.sockets.emit('sendItem', itemData.array[item.id]);
		});

		/* sends all the pre-existings item elements to client */
		for(var item in itemsData){
			var item = itemsData[item];
			for(var el in item.array){
				socket.emit('sendItem', item.array[el]);
			}
		}

		/*update items positions and remove*/
		socket.on('updateItemPosition', function(data){
			var array = itemsData[data.itemType].array;
			array[data.itemId].x = data.x;
			array[data.itemId].y = data.y;
			socket.broadcast.emit('updateItemPosition', {
				itemId: data.itemId,
				x: data.x,
				y: data.y
			});
		});

		/*deleting items*/
		socket.on('removeItem', function(data){
			console.log(data.itemId + ' removed from ' + data.itemType + 's');
			var array = itemsData[data.itemType].array;
			delete array[data.itemId];
			socket.broadcast.emit('removeItem', {itemId: data.itemId});
		});

		/*addinternalportal*/
		socket.on('addInternalPortal', function(data){
			var array = itemsData[data.itemType].array;
			array[data.itemId].internalPortal = {
				x: data.x,
				y: data.y
			}
			socket.broadcast.emit('addInternalPortal', data);
			console.log(array[data.itemId]);
		});
	}
});


Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
}
