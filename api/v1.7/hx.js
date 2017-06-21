var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var utils = require('../../utils/page');
var str = require('../../utils/str');
var token = require('../../utils/token');
var response = require('../../utils/response');
var config=require('../../config/config');
var hxchat=require('../../utils/hxchat');
var co = require('co');

var Hx={ 
  get_hxtoken:function(req,res){
      var option = {};
      hxchat.gethxtoken(option,function (err, data) {
        if (err) {
            return response.ApiError(res,{message:'获取token失败'})
        }
        if (!data) {
            return response.onDataSuccess(res,{});
        }
        //data = JSON.parse(data);
        return response.onDataSuccess(res,{data:data});
    });
  },get_reghxuser:function(req,res){
      var username=validator.trim(req.query.username);
      if (!username) {
      return response.ApiError(res,{message:"username empty"});
    }
      var option = {
          username: username,  
          password: config.hxchat.password,
      };
    
    var body =hxchat.reghxuser(option,function (err, data) {
        if (err) {
            return response.ApiError(res,{message:'注册用户失败'})
        }
        if (!data) {
            return response.onDataSuccess(res,{});
        }
        data = JSON.parse(data);
        return response.onDataSuccess(res,{data:data});
    });
  },
  get_deletehxuser:function(req,res){
      var username=validator.trim(req.query.username);
      if (!username) {
      return response.ApiError(res,{message:"username empty"});
    }
      var option = {
          username: username,  
    };
   var body =hxchat.deletehxuser(option,function (err, data) {
        if (err) {
            return response.ApiError(res,{message:'删除用户失败'})
        }
        if (!data) {
            return response.onDataSuccess(res,{});
        }
        data = JSON.parse(data);
        return response.onDataSuccess(res,{data:data});
    });
  },
  get_createhxgroup:function(req,res){
      var groupname=validator.trim(req.query.groupname);
      if (!groupname) {
      return response.ApiError(res,{message:"groupname empty"});
    }
     var desc=validator.trim(req.query.desc);

     var maxusers=validator.trim(req.query.maxusers);
      if (!maxusers) {
      return response.ApiError(res,{message:"maxusers empty"});
    }
     var owner=validator.trim(req.query.owner);
      if (!owner) {
      return response.ApiError(res,{message:"owner empty"});
    }
      var option = {
          groupname: groupname,  
          desc: desc,  
          maxusers: maxusers,  
          owner: owner,
      };
        var body =hxchat.createhxgroup(option,function (err, data) {
        if (err) {
            return response.ApiError(res,{message:'创建群组失败'})
        }
        if (!data) {
            return response.onDataSuccess(res,{});
        }
        data = JSON.parse(data);
        return response.onDataSuccess(res,{data:data});
    });
  },
  get_deletehxgroup:function(req,res){
      var groupid=validator.trim(req.query.groupid);
      if (!groupid) {
      return response.ApiError(res,{message:"groupid empty"});
    }
    
      var option = {
          groupid: groupid,  
      };
      var body =hxchat.deletehxgroup(option,function (err, data) {
        if (err) {
            return response.ApiError(res,{message:'删除群组失败'})
        }
        if (!data) {
            return response.onDataSuccess(res,{});
        }
        data = JSON.parse(data);
        return response.onDataSuccess(res,{data:data});
    });
  },
  get_gethxgroupinfo:function(req,res){
      var groupid=validator.trim(req.query.groupid);
      if (!groupid) {
      return response.ApiError(res,{message:"groupid empty"});
    }
      var option = {
          groupid: groupid,  
      };
    var body =hxchat.gethxgroupinfo(option,function (err, data) {
        if (err) {
            return response.ApiError(res,{message:'获取详情失败'})
        }
        if (!data) {
            return response.onDataSuccess(res,{});
        }
        data = JSON.parse(data);
        return response.onDataSuccess(res,{data:data.data});
    });
  },
  get_addhxgroupuser:function(req,res){
      var groupid=validator.trim(req.query.groupid);
      if (!groupid) {
      return response.ApiError(res,{message:"groupid empty"});
    }
     var username=validator.trim(req.query.username);
      if (!username) {
      return response.ApiError(res,{message:"username empty"});
    }
      var option = {
          groupid: groupid,  
          username: username,  
      };
    var body =hxchat.addhxgroupuser(option,function (err, data) {
        if (err) {
            return response.ApiError(res,{message:'添加群组用户失败'})
        }
        if (!data) {
            return response.onDataSuccess(res,{});
        }
        data = JSON.parse(data);
        return response.onDataSuccess(res,{data:data});
    });
  },
  get_deletehxgroupuser:function(req,res){
      var groupid=validator.trim(req.query.groupid);
      if (!groupid) {
      return response.ApiError(res,{message:"groupid empty"});
    }
     var username=validator.trim(req.query.username);
      if (!username) {
      return response.ApiError(res,{message:"username empty"});
    }
      var option = {
          groupid: groupid,  
          username: username,  
      };
      var body =hxchat.deletehxgroupuser(option,function (err, data) {
        if (err) {
            return response.ApiError(res,{message:'删除群组用户失败'})
        }
        if (!data) {
            return response.onDataSuccess(res,{});
        }
        data = JSON.parse(data);
        return response.onDataSuccess(res,{data:data});
    });
  },get_sendmessages:function(req,res){
      var users=validator.trim(req.query.users);
      var msg=validator.trim(req.query.msg);
      var fromuser=validator.trim(req.query.fromuser);
      if (!msg) {
      return response.ApiError(res,{message:"msg empty"});
     }
     if (!users) {
      return response.ApiError(res,{message:"users empty"});
     }
     if (!fromuser) {
      return response.ApiError(res,{message:"fromuser empty"});
     }

      var option = {
          users: users,  
          msg: msg,  
          fromuser: fromuser,  
      };
      var body =hxchat.sendmessages(option,function (err, data) {
        if (err) {
            return response.ApiError(res,{message:'删除群组失败'})
        }
        if (!data) {
            return response.onDataSuccess(res,{});
        }
        data = JSON.parse(data);
        return response.onDataSuccess(res,{data:data});
    });
  }
};
module.exports=Hx;