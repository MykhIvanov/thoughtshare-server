var express = require('express');
var router = express.Router();

var authenticate = require('../../authenticate');
var googleAuth = require('google-auth-library');
var config = require('../../config/config');

var User = require('../../models/user');

router.post('/google', function(req, res){

  if (!req.body.token_id || !req.body.name){
    res.status(404).send();
    return;
  }

  var auth = new googleAuth;
  var client = new auth.OAuth2(config.GOOGLE_CLIENT_ID, '', '');
  client.verifyIdToken(req.body.token_id, config.GOOGLE_CLIENT_ID, function(err, account){
    if (err){
      res.status(403).send();
      return;
    }

    var accountPayload = account.getPayload();
    var email = accountPayload['email'];

    if (email == null){
      res.status(403).send();
      return;
    }

    User.getUserByEmail(email, function(err, user){
      if (err)
        res.status(500).send();

      if (user == null){
        // @TODO: replace string with some const from file
        var avatar_url = "http://localhost:3000/images/default_avatar.png";
        if (req.body.avatar_url)
          avatar_url = req.body.avatar_url;

        User.addUser(email, req.body.name, avatar_url, function(err, user){
          if (err)
            res.status(500).send();
          else
            res.status(200).json(getJSONObject(authenticate.getToken(user._id), user._id));
        });

      }
      else
        res.status(200).json(getJSONObject(authenticate.getToken(user._id), user._id));
    });
  });

});

function getJSONObject(token, user_id){
  var jsonObject = {
    'token': token,
    'expiresIn': config.TOKEN_EXPIRES_IN,
    'user':{
      '_id': user_id
    }
  };

  return jsonObject;
}

module.exports = router;
