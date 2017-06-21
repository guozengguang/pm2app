var express = require('express');
var moment = require('moment');
var jwt = require('jwt-simple');
var app = express();
app.set('jwtTokenSecret', 'GEJU_SECRET_STRING');

module.exports={
  encode_token:function(option,cb){
    var expires = moment().add(7,'days').valueOf();
    var token = jwt.encode({
      iss: option.key,
      sub:option.no || '',
      exp: expires
    }, app.get('jwtTokenSecret'));
    return cb(null,token);
  },auth_token:function(req,res,next){
    var token=(req.body.access_token) || (req.query.access_token) || req.headers['x-access-token'];
    if (token) {
      try {
        var decoded = jwt.decode(token, app.get('jwtTokenSecret'));
        //if (decoded.exp <= (moment().valueOf())) {
        //  var e=new Error('token 过期')
        //  return next()
        //}
        req.access_token=decoded;
        next()
      } catch (err) {
        return next();
      }
    } else {
      next();
    }
  },decode_token:function(token){
    return jwt.decode(token, app.get('jwtTokenSecret'));
  }
}