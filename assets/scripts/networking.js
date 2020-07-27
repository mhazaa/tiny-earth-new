var socket = io();

var peer = new Peer();
var peerId;
peer.on('open', function(id){
  peerId = id;
  socket.emit('open', {peerId: peerId});
});
