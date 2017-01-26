var express = require('express');
var router = express.Router();
var config = require('../config/config');

router.get('/', function(req, res, next) {
  res.render('index', {projectInfo: config.PROJECT_DESCRIPTION, googleplay_link: config.GOOGLE_PLAY_LINK});
});

module.exports = router;
