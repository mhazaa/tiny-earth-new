var shortID = require('shortid');

module.exports = function Player(){
  this.socketId = null;
  this.id = shortID.generate();
  this.peerId = null;
  this.username = '';
  this.x = 0;
  this.y = 0;
  this.avatarOpts = {};
  this.scene = 'mainScene';
  this.text = '';
}
