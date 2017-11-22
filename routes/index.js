/*
 * Copyright (c) 2017 Raphael Guntersweiler, All rights reserved!
 */

let express = require('express');
let router = express.Router();
let HandleRender = require('../ui/handlebar-renderer');

/* GET home page. */
router.get('/', function(req, res) {
    HandleRender.render(res, 'index', 'System Status')
});

module.exports = router;
