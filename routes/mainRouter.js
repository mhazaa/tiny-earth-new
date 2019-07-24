var path = require('path');

module.exports = function(app){
  app.get('', function(req, res){
    res.render(path.resolve('views/index'));
  });
  app.get('/home', function(req, res){
  	res.redirect('/');
  });
}
