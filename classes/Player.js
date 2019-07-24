var shortID = require('shortid');

module.exports = function Player(){
  this.id = shortID.generate();
  this.username = '';
  this.x = 0;
  this.y = 0;
}
