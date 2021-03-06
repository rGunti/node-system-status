/*
 * Copyright (c) 2017 Raphael Guntersweiler, All rights reserved!
 */

let express = require('express');
let hbs = require('express-hbs');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let HandleRender = require('./ui/handlebar-renderer');
let HandleHelpers = require('./ui/handlebar-helpers');
let config = require('./core/config');

let ServiceChecker = require('./core/service-checker');
ServiceChecker.init(require(config.getValue(config.KEYS.SERVICE_CONFIG)));

let index = require('./routes/index');
let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
let hbsEngine = hbs.express4({
    defaultLayout: __dirname + '/views/layouts/main.hbs',
    partialsDir: __dirname + '/views/partials',
    layoutsDir: __dirname + '/views/layouts'
});
let hbhelpers = require('handlebars-helpers')({ handlebars: hbs.handlebars });
HandleHelpers.registerHelperMethods(hbs.handlebars);
app.engine('hbs', hbsEngine);
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'node_modules/materialize-css/dist')));
app.use('/public', express.static(path.join(__dirname, 'node_modules/font-awesome')));
app.use('/public/js', express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use('/public/css', express.static(path.join(__dirname, 'node_modules/material-design-icons-iconfont/dist')));
app.use('/public/js', express.static(path.join(__dirname, 'node_modules/moment/min')));
app.use('/public/js', express.static(path.join(__dirname, 'node_modules/pulltorefreshjs/dist')));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'develop' ? err : {};

    // render the error page
    res.status(err.status || 500);
    HandleRender.render(res, 'error', 'Error');
});

module.exports = app;
