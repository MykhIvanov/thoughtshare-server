var mongoose = require('mongoose');
var config = require('../config/config');

var userSchema = mongoose.Schema({
  email: String,
  name: String,
  avatar_url: String,
  thoughts: [{type: mongoose.Schema.Types.ObjectId, ref: "Thought"}],
  subscriptions: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
  subscribers: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}]

}, {collection: 'users'});

var User = module.exports = mongoose.model('User', userSchema);

module.exports.getUsers = function(callback){
  User.find(callback);
}

module.exports.getUsersById = function(query_ids, callback){
  var ids = [];

  if (typeof query_ids == 'string')
    ids.push(mongoose.Types.ObjectId(query_ids));
  else
    for (var i = 0; i < query_ids.length; i++)
      ids.push(mongoose.Types.ObjectId(query_ids[i]));


  User.find({'_id': { $in: ids }}, callback);
}

module.exports.getUser = function(_id, callback){
  User.findOne({_id: _id}, callback);
}

module.exports.getUserByEmail = function(email, callback){
  User.findOne({email: email}, callback);
}

module.exports.containsUser = function(_id, callback){
  User.findOne({_id: _id}, function(err, user){
    if (err || user == null){
      callback(false);
    }
    else {
      callback(true);
    }
  });
}

module.exports.getIdsArray = function(users, callback){
  var ids = [];
  for (var i = 0; i < users.length; i++){
    ids.push(users[i]._id);
  }
  callback(ids);
}

module.exports.addUser = function(email, name, avatar_url, callback){
  var user = new User({
    email: email,
    name: name,
    avatar_url: avatar_url,
    thoughts: [],
    subscriptions: [],
    subscribers: []
  });

  user.save(callback);
}

module.exports.addSubscriber = function(user, id, callback){
  var i = user.subscriptions.indexOf(mongoose.Types.ObjectId(id));
  if ((i != null) && (i >= 0)){
    callback(true);
    return;
  }
  user.subscriptions.push(mongoose.Types.ObjectId(id));

  user.save(function(err){
    if (err){
      callback(err);
      return;
    }

    User.findOne({_id: id}, function(err, userSubscription){
      if (err){
        callback(err);
        return;
      }

      userSubscription.subscribers.push(user._id);
      userSubscription.save(callback);
    });
  });
}

module.exports.removeSubscriber = function(user, id, callback){

  var index = user.subscriptions.indexOf(mongoose.Types.ObjectId(id));
  if ((index != null) && (index >= 0)){

    user.subscriptions.splice(index, 1);
    user.save(function(err){
      User.findOne({_id: id}, function(err, userSubscription){
        if (err || userSubscription == null){
          callback(true);
          return;
        }

        index = userSubscription.subscribers.indexOf(mongoose.Types.ObjectId(user._id));
        if ((index != null) && (index >= 0)){
          userSubscription.subscribers.splice(index, 1);
          userSubscription.save(callback);
        }
        else
          callback(true);
      });
    });
  }
  else
    callback(true);
}
