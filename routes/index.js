/*
 * Copyright (c) 2017 Raphael Guntersweiler, All rights reserved!
 */

let express = require('express');
let router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'System Status' });
});

module.exports = router;
