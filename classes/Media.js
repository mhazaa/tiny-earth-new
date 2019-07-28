var shortID = require('shortid');

module.exports.Image = function(){
  this.id = shortID.generate();
  this.name = '';
  this.x = 0;
  this.y = 0;
}
module.exports.Audio = function(){
  this.id = shortID.generate();
  this.name = '';
  this.x = 0;
  this.y = 0;
}
module.exports.Hyperlink = function(){
  this.id = shortID.generate();
  this.title = '';
  this.url = '';
  this.x = 0;
  this.y = 0;
}
module.exports.Room = function(){
  this.id = shortID.generate();
  this.name = '';
  this.x = 0;
  this.y = 0;
}
