var Media = require("../classes/Media");
var fs = require('fs');
var request = require('request');
var formidable = require('formidable');
var path = require('path');

var imageData = {
	class: Media.Image,
	folder: 'views/downloadedAssets/imgs',
	socketCommand: 'sendImage',
	consoleType: 'image'
}
var audioData = {
	class: Media.Audio,
	folder: 'views/downloadedAssets/audio',
	socketCommand: 'sendAudio',
	consoleType: 'audio'
}
var hyperlinkData = {
	class: Media.Hyperlink,
	socketCommand: 'sendHyperlink',
	consoleType: 'hyperlink'
}
var images = [];
var audios = [];
var hyperlinks = [];
module.exports.images = images;
module.exports.audios = audios;
module.exports.hyperlinks = hyperlinks;

module.exports.route = function(app, io){
	app.post('/sendImage', function(req, res){
		post(imageData, images, req, res, io);
	});

	app.post('/sendAudio', function(req, res){
		post(audioData, audios, req, res, io);
	});

	app.post('/sendHyperlink', function(req, res){
		post(hyperlinkData, hyperlinks, req, res, io);
	});

	app.post('/clearMedia', function(req, res){
		console.log('clearing all media');
		io.sockets.emit('clearMedia');
		images = [];
		audios = [];
		clearFolder(imageData.folder);
		clearFolder(audioData.folder);
		res.end();
	});
}


function post(mediaData, array, req, res, io){
	var post = new mediaData.class();
	var form = new formidable.IncomingForm();
	var files = [];
	var fields = [];

	form.parse(req, function(err, fields, files) {
		if (err) {
			console.error('Error', err)
			return;
		}
		if(fields.url){
			console.log(fields.url + ' remote ' + mediaData.consoleType + ' uploaded to server');
			array[post.id] = post;
			io.sockets.emit(mediaData.socketCommand, post);
			res.end();
			return;
		}
		if(Object.keys(files).length == 0) {
			post.name = post.id + path.extname(fields.remoteFileURL);
			downloadRemote(fields.remoteFileURL, mediaData.folder, post.name, function onComplete(){
				console.log(fields.remoteFileURL + ' remote ' + mediaData.consoleType + ' uploaded to server');
				array[post.id] = post;
				io.sockets.emit(mediaData.socketCommand, post);
				res.end();
			});
		}
	});

	form.on('field', function(name, value){
		if(name=='remoteFileURL') return;
		post[name] = value;
	});
	form.on('fileBegin', function (name, file){
			post.name = post.id + path.extname(file.name);
			file.name = post.name;
			file.path = mediaData.folder + '/' + file.name;
	});
	form.on('file', function (name, file){
			console.log(post.name + ' local ' + mediaData.consoleType +' uploaded to server');
			array[post.id] = post;
			io.sockets.emit(mediaData.socketCommand, post);
			res.end();
	});
	form.on('progress', function(bytesReceived, bytesExpected){
		console.log(bytesReceived + ' out of ' + bytesExpected);
		//io.socket.emit('uploadProgress', {
	//		received: bytesReceived,
	//		expected: bytesExpected
	//	})
	});
}

function downloadRemote(url, dest, filename, cb) {
	var file = fs.createWriteStream(dest + "/" + filename);

	request.get(url, function(err, resp, body){
		if(err){
			console.log(err.message, ' file deleted');
			file.close();
			fs.unlinkSync(dest + "/" + filename);
		} else {
			file.on('finish', function() {
				file.close(cb);
			});
		}
	})
	.pipe(file);
}

function clearFolder(directory) {
	fs.readdir(directory, (err, files) => {
	  if (err) {
			console.log(err);
			return;
		}
	  for (const file of files) {
	    fs.unlink(path.join(directory, file), err => {
	      console.log(err);
	    });
	  }
	});
}
