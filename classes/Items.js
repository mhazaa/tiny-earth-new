var shortID = require('shortid');

module.exports.Image = function(){
  this.id = shortID.generate();
  this.x = 0;
  this.y = 0;
  this.scene = 'mainScene';
}
module.exports.Audio = function(){
  this.id = shortID.generate();
  this.x = 0;
  this.y = 0;
  this.scene = 'mainScene';
}
module.exports.Room = function(){
  this.id = shortID.generate();
  this.x = 0;
  this.y = 0;
  this.scene = 'mainScene';
}
module.exports.Portal = function(){
  this.id = shortID.generate();
  this.x = 0;
  this.y = 0;
  this.scene = 'mainScene';
}
module.exports.Text = function(){
  this.id = shortID.generate();
  this.x = 0;
  this.y = 0;
  this.scene = 'mainScene';
}
module.exports.Iframe = function(){
  this.id = shortID.generate();
  this.x = 0;
  this.y = 0;
}
