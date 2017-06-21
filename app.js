var express = require('express');
var path = require('path');
var ejs = require('ejs');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config   = require('./config/config');
var actions = require('./actions');
var log4js = require('log4js');
var app = express();

//****************log4s日志************************
log4js.configure({
  appenders: [
    { type: 'console' },{
      "type": "dateFile",
      "filename": "logs/booklist.log",
      "pattern": "-yyyy-MM-dd.log",
      "alwaysIncludePattern": true,
      "category": 'geju',
      "layout": {
        type:'messagePassThrough'
      }
}
  ],
  replaceConsole: true
});
var loger = log4js.getLogger('geju');
loger.setLevel('ALL');
app.use(log4js.connectLogger(loger, {level: 'auto',format:':protocol :hostname :url :method :status :response-time'}));
//*******************结束************************

// ********************view engine setup后台模板引擎************************
app.set('views', path.join(__dirname, 'admin/views'));
app.set('view engine', 'html');
app.engine('.html', ejs.__express);//两个下划线
//*************************结束************************

//app.use(favicon(path.join(__dirname, 'public', "favicon.ico")));
app.use(bodyParser.json({limit: '20mb'}));
app.use(bodyParser.urlencoded({limit: '20mb', type: function(req) {
    return /x-www-form-urlencoded/.test(req.headers['content-type']);
  },extended: true}));
app.use(cookieParser());
//*******************静态目录************************
var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm', 'html'],
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now());
  }
};

app.use(express.static(path.join(__dirname, 'admin/public'),options));
//*******************结束************************
var setting = { cookieSecret: config.session_secret, db: "dev" };
app.use(session({
  secret: setting.cookieSecret,
  store: new RedisStore({
    port: config.redis.port,
    host: config.redis.host,
    auth_pass:config.redis.password
  }),
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 4 }//4小时退出登陆
}));

app.use(function (req, res, next) {
  res.locals.current_user = req.session.user;
  res.locals.current_user_roles = req.session.roles;
  // res.locals.action = actions.permission;
  res.locals.action = req.session.permission;
  res.locals.menuAction = req.session.menuPermission;
  res.locals.path = req.path;
  res.locals.wwwname = req.session.wwwname;
  res.locals.version= config.version;
  next();
});

//***********************定时任务部署****************************************
// require('./middlerware/interval');
//***********************部署生产提示****************************************
var mount = require('mount-routes');
mount(app,__dirname+'/admin/routes');//cms
mount(app,__dirname+'/api/routes');//api



//**********************调试阶段使用*****************************************
/*var models = require("./models");
models.sequelize.sync().then(function () {
 console.log("mysql connection success");
});*/


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  console.log(err);
  return res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
