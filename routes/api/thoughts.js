var express = require('express');
var router = express.Router();

var Thought = require("../../models/thought");
var User = require("../../models/user");

var authenticate = require("../../authenticate");

// ===================================

const FEED_SUBS = "subs";
const FEED_NEW = "new";
const FEED_POPULAR = "popular";

router.get('/', function(req, res, next){
  if (req.query._id)
    id(req, res);
  else if (req.query.feed){

    if (req.query.feed == FEED_SUBS)
      next();
    else if (req.query.feed == FEED_NEW)
      feed_new(req, res);
    else if (req.query.feed == FEED_POPULAR)
      feed_popular(req, res);
    else
      res.status(404).send();

  }
  else
    res.status(200).json([]);
  }, authenticate.authenticate, feed_subs);

function id(req, res){
  Thought.getThoughtsById(req.query._id, function(err, thoughts){
    if (err)
      res.status(404).send();
    else
      res.status(200).json(thoughts);
  });
}

function feed_subs(req, res){
  var user_id = req.decoded._id;

  User.getUser(user_id, function(err, user){
    if (err || user == null){
      res.status(404).send();
      return;
    }

    Thought.getSubsThoughts(user.subscriptions, function(err, thoughts){
      if (err || (thoughts == null)){
        res.status(200).json([]);
        return;
      }

      Thought.getIdsArray(thoughts, function(ids){
        res.status(200).json(ids);
      });
    });
  });
}

function feed_new(req, res){
  Thought.getThoughts(function(err, thoughts){
    if (err || thoughts == null){
      res.status(500).send();
      return;
    }

    Thought.getIdsArray(thoughts, function(ids){
      res.status(200).json(ids);
    });
  });
}

function feed_popular(req, res){
  Thought.getPopularThoughts(function(err, thoughts){
    if (err || (thoughts == null))
      res.status(404).send();
    else{
      Thought.getIdsArray(thoughts, function(ids){
        res.status(200).json(ids);
      });
    }
  });
}

// ===================================

router.post('/', authenticate.authenticate, function(req, res){

  var user_id = req.decoded._id;

  if (!req.body.body){
    req.status(404).send();
    return;
  }

  User.getUser(user_id, function(err, user){
    if (err || user == null){
      res.status(404).send();
      return;
    }

    Thought.addThought(user, req.body.body, function(err){
      if (err)
        res.status(500).send();
      else
        res.status(201).send();
    });
  });
});


// ===================================

router.post('/:object_id/rate', authenticate.authenticate, function(req, res){

  var user_id = req.decoded._id;

  if (!req.body.rate || ((req.body.rate <= 0) && (req.body.rate > 5))){
    res.status(404);
    return;
  }

  Thought.getThought(req.params.object_id, function(err, thought){
    if (err || thought == null){
      res.status(404).send();
      return;
    }

    Thought.rateThought(user_id, req.body.rate, thought, function(err){
      if (err)
        res.status(500).send();
      else
        res.status(201).send();
    });
  });
});

// ===================================

router.get('/:object_id', function(req, res){
  Thought.getThought(req.params.object_id, function(err, thought){
    if (err || (thought == null))
      res.status(404).send();
    else
      res.status(200).json(thought);
  });
});

// ===================================

module.exports = router;
