var moment = require('moment');
var token = require('./token');
var response = require('./response');
module.exports={
  set_cookie:function(name,val,opt){
    　var pairs = [name + '=' +val];
    　opt = opt || {};
    　if(opt.maxAge) 　pairs.push('Max-Age=' + opt.maxAge);
    　if(opt.domin) 　pairs.push('Domin=' + opt.domin);
    　if(opt.path) 　pairs.push('Path=' + opt.path);
    　if(opt.expires) 　pairs.push('Expires=' + opt.expires);
    　if(opt.httpOnly) 　pairs.push('HttpOnly');
      if(opt.secure) 　pairs.push('Secure');
    　return pairs.join(';');
    },valid_auth:function(req,res,next){
      if(req.cookies.isVisit){
          return response.ApiError(res,{message:"验证失败"});
      }else {
        next()
      }      
  }
}