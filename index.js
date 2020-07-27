var express = require('express');
var app = express();
var fs = require('fs');
var request = require('request');
var formidable = require('formidable');
var path = require('path');
var socket = require('socket.io');

//seting up ssl
var http = require('http');
var https = require('https');
var httpsPort = 443;
var httpPort = 80;

var options = {
	cert: fs.readFileSync('./certs/tinyearth_io.crt'),
	ca: fs.readFileSync('./certs/tinyearth_io.ca-bundle'),
	key: fs.readFileSync('./certs/tinyearth.key'),
	requestCert: false,
	rejectUnauthorized: false
}

var httpsServer = https.createServer(options, app);
httpsServer.listen(httpsPort, function(){
	console.log('listenting to port: ' + httpsPort);
});

var httpServer = app.listen(httpPort, '0.0.0.0', function(){
	console.log('listenting to port: ' + httpPort);
});

var io = socket(httpsServer);

app.set('view engine', 'ejs');
app.use(express.static('assets'));

app.use(function (req, res, next){
	if (req.secure){
		next();
  } else {
		res.redirect('https://' + req.headers.host + req.url);
  }
});

app.get('', function(req, res){
	res.render('./index', {
		branch: 'main'
	});
});
app.get('/disneyland', function(req, res){
	res.render('./index', {
		branch: 'disneyland'
	});
});
app.get('/home', function(req, res){
	res.redirect('/');
});
app.post('/sendItem', function(req, res){
	var form = new formidable.IncomingForm();
	form.uploadDir = downloadedAssets;

	form.parse(req, function(err, fields, files){
		var type = itemsData[fields.itemType];
		var item = new type.Class();
		type.array[item.id] = item;
		for(var key in fields){
			if(key == 'x' || key == 'y'){
				item[key] = parseInt(fields[key]);
			} else {
				item[key] = fields[key];
			}
		}

		var extension = path.extname(files.localFile.name);
		if(extension.length==0) extension = '.ogg';
		item.name = item.id + extension;

		fs.rename(files.localFile.path, downloadedAssets + '/' + item.name, function(err){
			if(err) console.log(err);
			console.log('local file uploaded to server');
			console.log(item.id + ' added to ' + item.itemType + 's');
			console.log(item);
			io.sockets.emit('sendItem', item);
			res.end();
		});
	});
});

/* database steup*/
/*
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url ="mongodb+srv://mhazaa:<*Lesmondes2012*>@tinyearthcluster-mceq5.gcp.mongodb.net/test?retryWrites=true&w=majority";
var client = new MongoClient(url);

client.connect(function(err){
	assert.equal(null, err);
	console.log("Connected successfully to server");
	var db = client.db('tinyearthtest');
	var collection = db.collection('coll');
  client.close();
});
*/


var Player = require("./classes/Player");
var Items = require("./classes/Items");
var Timer = require("./classes/Timer");

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
var downloadedAssets = 'assets/downloadedAssets';

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

	for(var playerID in players){
		socket.emit('spawn', players[playerID]);
	}

	socket.on('spawn', function(data){
		console.log(player.id + ' spawned into game with username ' + player.username);
		player.username = data.username;
		player.avatarOpts = data.avatarOpts;
		if(data.x) player.x = data.x;
		if(data.y) player.y = data.y;
		players[thisPlayerID] = player;
		socket.emit('spawn', player);
		socket.broadcast.emit('spawn', player);
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
		socket.on('sendItem', function(data){
			var type = itemsData[data.itemType];
			var item = new type.Class();

			type.array[item.id] = item;
			for(var key in data){
				type.array[item.id][key] = data[key]
			}

			if(data.remoteFile){
				/*downloading remote file*/
				type.array[item.id].name = type.array[item.id].id + path.extname(data.remoteFile);

				var file = fs.createWriteStream(downloadedAssets + "/" + item.name);
				request.get(data.remoteFile, function(err, resp, body){
					if(err){
						console.log(err.message, ' file deleted');
						file.close();
						fs.unlinkSync(downloadedAssets + "/" + item.name);
						delete type.array[item.id];
					} else {
						file.on('finish', function(){
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

			console.log(item.id + ' added to ' + item.itemType + 's');
			console.log(item);
			io.sockets.emit('sendItem', type.array[item.id]);
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

			if(array[data.itemId].itemType == 'image' || array[data.itemId].itemType == 'audio'){
				fs.unlinkSync(downloadedAssets + '/' + array[data.itemId].name);
			}

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
