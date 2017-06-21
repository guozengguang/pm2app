var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var utils = require('../../utils/page');
var str = require('../../utils/str');
var token = require('../../utils/token');
var response = require('../../utils/response');
var config = require('../../config/config');
var hxchat = require('../../utils/hxchat');
var co = require('co');

// return response.ApiError(res,{message:"send_sms error"});
// return response.onDataSuccess(res,{data:list});
// return response.onListSuccess(res,{list:list});
var Myfriend={
  get_myfriends:function(req,res){
    var myfriend_owner=req.query.myfriend_owner;
    var options=utils.get_page_options(req);
    if (!myfriend_owner) {
      return response.ApiError(res,{message:"myfriend_owner empty"});
    }
    models.Myfriend.findmyfriend({
      where:{myfriend_owner:myfriend_owner},
      attributes:['uc_calssroomname','myfriend_owner','myfriend_user','user_name','user_pics','user_position','user_phone','user_email','myfriend_type','user_firstabv','user_company','user_background'],
      limit:options.pagesize,
      offset:options.offset
    }).then(function(item){
      if (item) {
         item.forEach( function(node, index) {
          node.user_pics = str.AbsolutePath(node.user_pics);
        });
        return response.ApiSuccess(res,{list:item});
      }else {
        return response.ApiError(res,{message:"get myfriend error"});
      }
    }, function(err){
      console.log(err)
    });
  },delete_mynewfriends:function(req,res){
    var frienduser=req.body.frienduser;
    var owner=req.body.owner;
    if (!frienduser||!owner) {
      return response.ApiError(res,{message:"frienduser owner empty"});
    }
    
    models.Myfriend.update({myfriend_applycontent:''},{
                      where:{myfriend_user:owner,myfriend_owner:frienduser}
    }).then(function(item){
        return response.ApiSuccess(res,{list:item});
    }, function(err){
      return response.ApiError(res,{message:"delete myfriend error"});
    });
  },get_mynewfriends:function(req,res){
    var myfriend_owner=req.query.myfriend_owner;
    var options=utils.get_page_options(req);
    if (!myfriend_owner) {
      return response.ApiError(res,{message:"myfriend_owner empty"});
    }
    co(function* (){
     try
     {
      var myfriendlist = yield  models.Myfriend.findmynewfriend({
              where:{myfriend_owner:myfriend_owner},
              attributes:['mid','myfriend_owner','myfriend_user','user_name','user_pics','user_position','user_phone','user_email','myfriend_type','user_firstabv','user_company','user_background','myfriend_applycontent','isadd','uc_calssroomname'],
              limit:options.pagesize,
              offset:options.offset
            })
            if (myfriendlist) {
                  myfriendlist.forEach( function(node, index) {
                    node.user_pics = str.AbsolutePath(node.user_pics);
                  });
            }
                
            var mypushfriendlist = yield models.Myfriend.findmypushfriend({
                  where:{myfriend_owner:myfriend_owner},
                  attributes:['mid','user_name','user_pics','user_position','user_phone','user_email','myfriend_type','user_firstabv','user_company','user_background','uc_calssroomname'],
                  limit:options.pagesize,
                  offset:options.offset
            })
            if (mypushfriendlist) {
                  mypushfriendlist.forEach( function(node, index) {
                    node.user_pics = str.AbsolutePath(node.user_pics);
                  });
            }
            return response.ApiSuccess(res,{myfriendlist:myfriendlist,mypushfriendlist:mypushfriendlist});
     }catch(err)
     {
       console.log(err);
     }
    })
  },add_myfriend:function(req,res){
    var body=req.body ;
    if (!body.owner || !body.frienduser) {
      return response.ApiError(res,{message:"owner or frienduser empty"});
    }
     co(function* (){
      try{
          var myfriend=yield models.Myfriend.findOne({
              where:{myfriend_owner:body.owner,myfriend_user:body.frienduser}
          });
          var friendresult;
          if(myfriend&&myfriend.myfriend_type>=0)
          {
             if(body.applycontent)
             {
                friendresult = yield  models.Myfriend.update({myfriend_type:0, myfriend_applycontent:body.applycontent},{
                      where:{myfriend_owner:body.owner,myfriend_user:body.frienduser}
                 });
             }else
             {
               friendresult = yield  models.Myfriend.update({myfriend_type:0},{
                      where:{myfriend_owner:body.owner,myfriend_user:body.frienduser}
                 });
             }
           
          }else
          {
            friendresult = yield models.Myfriend.create({
                      myfriend_owner:body.owner,
                      myfriend_user:body.frienduser,
                      myfriend_applycontent:body.applycontent
                    })
          }

          if(!friendresult)
          {
            return response.ApiError(res,{message:'添加好友失败'})
          }

          if(body.applycontent&&(!myfriend||myfriend.myfriend_applycontent==""))
          {
              var users = [];
              users.push(body.frienduser);
              var option = {
                      users:users,  
                      msg:body.applycontent,  
                      fromuser: 408,  
                      ext: {},
                  };
                
              hxchat.sendExtMessages(option,function (err, data) {
                      if (err) {
                          return response.ApiError(res,{message:'添加好友发送消息失败'})
                      }
                      if (!data) {
                          return response.onDataSuccess(res,{});
                      }
                      //data = JSON.parse(data);
                      return response.onDataSuccess(res,{data:data});
                  });
          }else
          {
            return response.onDataSuccess(res,{});
          }
      }
      catch(err)
      {
        console.log(err);
      }
     
    })
  },set_myfriend:function(req,res){
    var body=req.body;
    if (!body.owner || !body.frienduser) {
      return response.ApiError(res,{message:"owner or frienduser empty"});
    }

    var mf = {};
    if (body.myfriend_istop) {
       mf.myfriend_istop =  body.myfriend_istop;
    }
    if (body.myfriend_isdisturb) {
       mf.myfriend_isdisturb = body.myfriend_isdisturb;
    }
    co(function* (){
      
        var myfriend=yield models.Myfriend.findOne({
            where:{myfriend_owner:body.owner,myfriend_user:body.frienduser}
        });
        if(myfriend&&myfriend.myfriend_type>=0)
        {
           //models.Members.update({m_firstsend:1},{where:{mid:mid}})
           yield models.Myfriend.update(mf,{
                  where:{myfriend_owner:body.owner,myfriend_user:body.frienduser}
                }).then(function(){
                  return response.ApiSuccess(res,{})
                }, function(err){
                  return response.ApiError(res,{message:"update myfriend error"});
                })
           
        }else
        {
            mf.myfriend_owner = body.owner;
            mf.myfriend_user = body.frienduser;
            mf.myfriend_type = 2;
            yield models.Myfriend.create(mf).then(function(){
                return response.ApiSuccess(res,{})
              }, function(err){
                return response.ApiError(res,{message:"update myfriend error"});
              })
        }
    })
  },delete_myfriend:function(req,res){
    var body=req.body;
    if (!body.owner || !body.frienduser) {
      return response.ApiError(res,{message:"owner or frienduser empty"});
    }
    models.Myfriend.update({myfriend_type:2},{
                  where:{myfriend_owner:body.owner,myfriend_user:body.frienduser}
     }).then(function(){
        var option ={
          mid:req.body.owner,
          username:req.body.frienduser
          }
        var body = hxchat.deletebacklist(option,function (err, data) {
          //if (err) {
              //return response.ApiError(res,{message:'删除黑名单失败'})
          //}
          if (!data) {
              return response.ApiSuccess(res,{});
          }
          //data = JSON.parse(data);
          return response.ApiSuccess(res,{data:data});
         });
    }, function(err){
      return response.ApiError(res,{message:"delete myfriend error"});
    })
  },format:function(items){
    items.forEach(function(node,index){
      if(node.dataValues)node=node.dataValues;
      if(node.myfriendId)node.myfriendId=node.myfriendId;
      if(node.myfriend_owner)node.myfriend_owner=node.myfriend_owner;
      if(node.myfriend_user)node.myfriend_user=node.myfriend_user;
    });
    return items;
  },add_myblacklist:function(req,res){
    var body=req.body;
   
    if (!body.owner || !body.frienduser) {
      return response.ApiError(res,{message:"owner or frienduser empty"});
    }
    co(function* (){
      var myfriend=yield models.Myfriend.findOne({
          where:{myfriend_owner:body.owner,myfriend_user:body.frienduser}
      });
      if(myfriend){
        models.Myfriend.update({myfriend_type:1},{
                where:{myfriend_owner:body.owner,myfriend_user:body.frienduser}
                }).then(function(){
                var option ={
                  mid:req.body.owner,
                  usernames:req.body.frienduser.split(",")   
                }
                var body =hxchat.setbacklist(option,function (err, data) {
                  if (err) {
                      return response.ApiError(res,{message:'添加黑名失败'})
                  }
                  if (!data) {
                      return response.ApiSuccess(res,{});
                  }
                  //data = JSON.parse(data);
                  return response.ApiSuccess(res,{data:data});
              });
                //return response.onDataSuccess(res,{data:{}})
              }, function(err){
                return response.ApiError(res,{message:"add myblacklist error"});
              });
      }else
      {
          models.Myfriend.create({
                myfriend_owner:body.owner,
                myfriend_user:body.frienduser,
                myfriend_type:1
              }).then(function(){
                var option ={
                  mid:req.body.owner,
                  usernames:req.body.frienduser.split(",")   
                }
                var body =hxchat.setbacklist(option,function (err, data) {
                  if (err) {
                      return response.ApiError(res,{message:'添加黑名单'})
                  }
                  if (!data) {
                      return response.ApiSuccess(res,{});
                  }
                  //data = JSON.parse(data);
                  return response.ApiSuccess(res,{data:data});
              });
                //return response.onDataSuccess(res,{data:{}})
              }, function(err){
                return response.ApiError(res,{message:"add myblacklist error"});
              })
      }
   })
  }
};
module.exports=Myfriend;