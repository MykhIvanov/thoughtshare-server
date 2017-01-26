var jwt = require('jsonwebtoken');
var config = require('./config/config');

// -------------------------------------

module.exports.authenticate = function(req, res, next){
  var token = req.headers[config.KEY_TOKEN];
  if (!token){
    res.status(403).send();
    return;
  }

  jwt.verify(token, config.TOKEN_SECRET, function(err, decoded){
    if (err)
      res.status(403).send();
    else{
      req.decoded = decoded;
      next();
    }
  });
}

// -------------------------------------

module.exports.getToken = function(user_id){
  var user = {
    _id: user_id
  };

  return jwt.sign(user, config.TOKEN_SECRET, {expiresIn: config.TOKEN_EXPIRES_IN});
}
// -------------------------------------
