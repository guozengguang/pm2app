var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var algorithm = require('ape-algorithm');
var utils = require('../../utils/page');
var str = require('../../utils/str');
var token = require('../../utils/token');
var response = require('../../utils/response');
var config=require('../../config/config');
var co = require('co');
// return response.ApiError(res,{message:"send_sms error"});
// return response.onDataSuccess(res,{data:list});
// return response.onListSuccess(res,{list:list});
var Group={
  get_mygroup:function(req,res){
    var groupuser=req.query.groupuser;
    var options=utils.get_page_options(req);
    if (!groupuser) {
      return response.ApiError(res,{message:"myfriend_owner empty"});
    }
    var typestr = 100;
    co(function*() {
            var b=yield models.Area.getGropuGoode({userid:groupuser});
              var goodssearcharr=[];
              for(var i=0,len=b.length;i<len;i++){
                if(typestr > b[i].group_type){
                  typestr=b[i].group_type;
                }
            }
            var mtype = 100;
            var mlevel = 0;
            if(typestr==100)
            {
              var item=yield models.Members.findOne({
              where:{mid:groupuser}
              });
           
              if(item!=null&&item.dataValues.m_type==10)
              {
                mtype=10;
                mlevel=item.dataValues.m_level;
              }   
            }
          
          yield models.Group.findByowner({
            where:{groupuser:groupuser,usertype:typestr,mtype:mtype,mlevel:mlevel},
            attributes:['groupid','group_istop','group_isdisturb','group_owner','group_imgurl','group_name','group_numbers','group_maxnums','group_desc','group_type','group_goodid'],
            limit:options.pagesize,
            offset:options.offset
          }).then(function(item){
            if (item) {
               item.forEach( function(node, index) {
                    node.group_imgurl=str.AbsolutePath(node.group_imgurl);
                });
              return response.onListSuccess(res,{list:item});
            }else {
              return response.onListSuccess(res,{list:null});
              
            }
          }, function(err){
            return response.ApiError(res,{message:"get myfriend error"});
          });
    })
  },set_mygroup:function(req,res){
    var body=req.body;
    if(!body.groupid){
      return response.ApiError(res,{message:"groupid error"});
    }
   var content={};
        if (body.istop){
          content.group_istop=body.istop;
        }
        if (body.m_company){
          content.group_isdisturb=body.isdisturb;
        }
       models.Group.update(content,{where:{groupid:body.groupid}});
       return response.onDataSuccess(res,{data:{}});
  },get_groupbyid:function(req,res){
    var groupid=req.query.groupid;
   
    if (!groupid) {
      return response.ApiError(res,{message:"groupid empty"});
    }
    models.Group.findOne({
      where:{groupid:groupid}
    }).then(function(item){
      if (item) {
        return response.onListSuccess(res,{data:item});
      }else {
        return response.onListSuccess(res,{data:null});
      }
    }, function(err){
        return response.ApiError(res,{message:"get group error"});
    });
  },get_groupbygood:function(req,res){
    var goodid=req.query.goodid;
   
    if (!goodid) {
      return response.ApiError(res,{message:"goodid empty"});
    }
    
    models.Group.getgroupsbygoods({
      where:{goodid:goodid},
      attributes:['groupid','group_imgurl','group_name','group_numbers']
    }).then(function(item){
      if (item) {
        item.forEach( function(node, index) {
               node.group_imgurl=str.AbsolutePath(node.group_imgurl);
        });
        return response.onListSuccess(res,{list:item});
      }else {
        return response.onListSuccess(res,{list:null});
      }
    }, function(err){
       return response.ApiError(res,{message:"get group error"});
    });
  },get_groupbyusertype:function(req,res){
    var usertype=req.query.usertype;
    var userid=req.query.userid;
    var groupid =req.query.groupid;
    if (!usertype||!userid) {
      return response.ApiError(res,{message:"usertype or userid empty"});
    }
    if(usertype==4)
    {
      var typestr = 100;
         co(function*() {
           var b=yield models.Area.getGropuGoode({userid:userid});
            var goodssearcharr=[];
            for(var i=0,len=b.length;i<len;i++){
              if(typestr > b[i].group_type){
                typestr=b[i].group_type;
              }
            }
           
            yield models.Group.getgroupsbyusertype({
                  where:{usertype:typestr,userid:userid,groupid:groupid},
                  attributes:['groupid','group_imgurl','group_name','group_numbers','group_type']
                }).then(function(item){
                  if (item) {
                    item.forEach( function(node, index) {
                          node.group_imgurl=str.AbsolutePath(node.group_imgurl);
                    });
                    return response.onListSuccess(res,{list:item});
                  }else {
                    return response.onListSuccess(res,{list:null});
                  }
                }, function(err){
                  return response.ApiError(res,{message:"get group error"});
                });
         });
    }else
    {
      models.Group.getgroupsbyusertype({
            where:{usertype:usertype,userid:userid,groupid:groupid},
            attributes:['groupid','group_imgurl','group_name','group_numbers','group_type']
          }).then(function(item){
            if (item) {
              item.forEach( function(node, index) {
                     node.group_imgurl=str.AbsolutePath(node.group_imgurl);
               });
              return response.onListSuccess(res,{list:item});
            }else {
              return response.onListSuccess(res,{list:null});
            }
          }, function(err){
            return response.ApiError(res,{message:"get group error"});
          });
    }
  }
};
module.exports=Group;