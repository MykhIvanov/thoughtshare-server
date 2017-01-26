var mongoose = require('mongoose');

var User = require('../models/user');
var config = require('../config/config');

var thoughtSchema = mongoose.Schema({
  author:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: mongoose.Schema.Types.Date,
  body:{
    type: String,
    required: true
  },
  rating: Number,
  voters: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}]
}, {collection: 'thoughts'});

var Thought = module.exports = mongoose.model('Thought', thoughtSchema);

module.exports.getThoughts = function(callback){
  Thought.find().sort({'date': -1}).exec(callback);
}

module.exports.getThoughtsById = function(query_ids, callback){
  var ids = [];

  if (typeof query_ids == 'string')
    ids.push(mongoose.Types.ObjectId(query_ids));
  else
    for (var i = 0; i < query_ids.length; i++)
      ids.push(mongoose.Types.ObjectId(query_ids[i]));

  Thought.find({'_id': { $in: ids }}).populate('author').exec(function(err, thoughts){
    if (err){
      callback(err, thoughts);
      return;
    }

    // THOUGHTS ORDER FIXING
    var correctOrderThoughts = [];
    for (var i = 0; i < ids.length; i++)
      correctOrderThoughts.push(thoughts.find(x =>  x._id.equals(ids[i])));

    callback(err, correctOrderThoughts);
  });
}

module.exports.getPopularThoughts = function(callback){
  Thought.find().sort({"voters": -1, "rating": -1, "date": -1}).exec(callback);
}

module.exports.getSubsThoughts = function(subscriptions, callback){
  var subsThoughts = [];

  var queryThoughts = [];
  for (var i = 0; i < subscriptions.length; i++)
    queryThoughts.push({author: mongoose.Types.ObjectId(subscriptions[i])});

  Thought.find({ $or:  queryThoughts}).sort({'date': -1}).exec(callback);
}

module.exports.getThought = function(_id, callback){
  Thought.findOne({_id: _id}, callback);
}

module.exports.containsThought = function(_id, callback){
  User.findOne({_id: _id}, function(err, thought){
    if (err || thought == null)
      callback(false);
    else
      callback(true);
  });
}

module.exports.getIdsArray = function(thoughts, callback){
  var ids = [];
  for (var i = 0; i < thoughts.length; i++){
    ids.push(thoughts[i]._id);
  }
  callback(ids);
}

module.exports.addThought = function(user, body, callback){

  if (body.length > config.THOUGHT_BODY_MAX_LENGTH){
    callback(true);
    return;
  }

  var thought = new Thought({
    author: mongoose.Types.ObjectId(user._id),
    date: new Date(),
    body: body,
    rating: 0.0,
    voters: []
  });

  thought.save(function(err, createdThought){
    if (err){
      callback(err);
      return;
    }

    user.thoughts.push(createdThought._id);
    user.save(callback);
  });
}

module.exports.rateThought = function(user_id, rate, thought, callback){
  User.containsUser(user_id, function(contains){
    if (!contains || (thought.voters.indexOf(mongoose.Types.ObjectId(user_id)) >= 0))
      callback(true);
    else{
      thought.rating = parseFloat((thought.rating * parseFloat(thought.voters.length) + parseFloat(rate)) / (parseFloat(thought.voters.length) + 1));
      thought.voters.push(user_id);
      thought.save(callback);
    }
  });
}
