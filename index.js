var express = require('express');
var app = express();
var PORT = process.env.PORT || 52300;
var server = app.listen(PORT, '0.0.0.0', function(){
	console.log('listenting to port: ' + PORT);
});

app.set('view engine', 'ejs');
app.use(express.static('views'));
var socket = require('socket.io');
var io = socket(server);

var Player = require("./classes/Player");
var players = [];
var sockets = [];

var mainRouter = require("./routes/mainRouter.js");
mainRouter(app);

var postRouter = require("./routes/postRouter.js");
postRouter.route(app, io);

function timer(seconds){
  function pad(s){
    return (s < 10 ? '0' : '') + s;
  }
  var hours = Math.floor(seconds / (60*60));
  var minutes = Math.floor(seconds % (60*60) / 60);
  var seconds = Math.floor(seconds % 60);

  return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

io.on('connect', function(socket){
	var player = new Player();
	var thisPlayerID = player.id;

	console.log(thisPlayerID + ' connected to server');

	sockets[thisPlayerID] = socket;
	socket.emit('register', {id: thisPlayerID});

	socket.on('disconnect', function(){
		console.log(thisPlayerID + ' disconnected from server');
		delete sockets[thisPlayerID];
		if( players[thisPlayerID] ){
			delete players[thisPlayerID];
			console.log(thisPlayerID + ' disconnected from game');
			socket.broadcast.emit('disconnected', {id: thisPlayerID});
		}
		socket.broadcast.emit('updateActivePlayers', Object.size(players));
	});

	socket.on('spawn', function(data){
		player.username = data.username;
		console.log(player.id + ' spawned into game with username ' + player.username);
		players[thisPlayerID] = player;
		socket.emit('spawn', player);
		socket.broadcast.emit('spawn', player);
		for(var playerID in players){
			if (playerID != thisPlayerID) {
				socket.emit('spawn', players[playerID]);
			}
		}
		io.sockets.emit('updateActivePlayers', Object.size(players));
		ingameEvents();
	});

	function ingameEvents(){
		setInterval(function(){
			var time = timer(process.uptime());
			socket.emit('updateTime', time);
		},1000);

		socket.on('updatePosition', function(data){
			player.x = data.x;
			player.y = data.y;
			socket.broadcast.emit('updatePosition', {
				id: thisPlayerID,
				x: player.x,
				y: player.y
			});
		});

		socket.on('updateMediaPosition', function(data){
			var array;
			if(data.type=='image'){
				array=postRouter.images;
			} else if(data.type=='audio'){
				array=postRouter.audios;
			} else if(data.type=='hyperlink'){
				array=postRouter.hyperlinks;
			}
			array[data.id].x = data.x;
			array[data.id].y = data.y;
			socket.broadcast.emit('updateMediaPosition', {
				id: data.id,
				x: data.x,
				y: data.y
			});
		});

		socket.on('sendMessage', function(data){
			console.log(player.username + ': ' + data.message);
			player.message = data.message;
			io.sockets.emit('sendMessage', {
				id: thisPlayerID,
				message: player.message
			});
		});

		for(var image in postRouter.images) {
			socket.emit('sendImage', postRouter.images[image]);
		}
		for(var audio in postRouter.audios) {
			socket.emit('sendAudio', postRouter.audios[audio]);
		}
		for(var hyperlink in postRouter.hyperlinks) {
			socket.emit('sendHyperlink', postRouter.hyperlinks[hyperlink]);
		}
		for(var room in postRouter.rooms) {
			socket.emit('sendRoom', postRouter.rooms[room]);
		}
	}
});
