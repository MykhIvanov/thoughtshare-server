var express = require('express');
var router = express.Router();

var User = require("../../models/user");
var Thought = require("../../models/thought");

var authenticate = require("../../authenticate");

// ===================================

router.get('/', function(req, res){

  if (req.query._id)
    id(req, res);
  else if (req.query.q)
    query(req, res);
  else
    res.status(200).json([]);
});

function query(req, res){
  User.getUsers(function(err, users){

    if (err || users == null){
      res.status(500).send();
      return;
    }

    var queryInput = req.query.q;
    var chosenUsersList = [];

    for (var i = 0; i < users.length; i++)
      if (users[i].name.toLowerCase().includes(queryInput.toString().toLowerCase()))
        chosenUsersList.push(users[i]);
      

    User.getIdsArray(chosenUsersList, function(ids){
      res.status(200).json(ids);
    });
  });
}

function id(req, res){
  User.getUsersById(req.query._id, function(err, users){
    if (err)
      res.status(500).send();
    else if (users == null)
      res.status(404).send();
    else
      res.status(200).json(users);
  });
}

// ===================================

router.get('/:object_id', function(req, res){

  User.getUser(req.params.object_id, function(err, user){
    if (err)
      res.status(500).send();
    else if (user == null)
      res.status(404).send();
    else
      res.status(200).json(user);
  });

});


// ===================================

router.get('/:object_id/thoughts', function(req, res){

  User.getUser(req.params.object_id, function(err, user){
    if (err || user == null){
      res.status(404).send();
      return;
    }

    res.status(200).json(user.thoughts.reverse());
  });

});


// ===================================

router.get('/:object_id/subscribers', function(req, res){

  User.getUser(req.params.object_id, function(err, user){
    if(err || user == null){
      res.status(404).send();
      return;
    }

    res.status(200).json(user.subscribers.reverse());
  });

});


// ===================================

router.get('/:object_id/subscriptions', function(req, res){

  User.getUser(req.params.object_id, function(err, user){
    if(err || user == null){
      res.status(404).send();
      return;
    }

    res.status(200).json(user.subscriptions.reverse());
  });

});

// ===================================

router.post('/:object_id/subscribe', authenticate.authenticate, function(req, res){

  var id = req.decoded._id;
  User.containsUser(req.params.object_id, function(contains){

    if (contains){
      User.getUser(id, function(err, user){
        if (err){
          res.status(404).send();
          return;
        }

        User.addSubscriber(user, req.params.object_id, function(err){
          if (err)
            res.status(404).send();
          else
            res.status(200).send();
        });

      });
    }
    else
      res.status(404).send();

  });
});

// ===================================

router.delete('/:object_id/subscribe', authenticate.authenticate, function(req, res){

  var id = req.decoded._id;
  User.containsUser(req.params.object_id, function(contains){

    if (contains){
      User.getUser(id, function(err, user){
        if (err){
          res.status(404).send();
          return;
        }

        User.removeSubscriber(user, req.params.object_id, function(err){
          if (err)
            res.status(404).send();
          else
            res.status(200).send();
        });

      });
    }
    else
      res.status(404).send();

  });
});

module.exports = router;
