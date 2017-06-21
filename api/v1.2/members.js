var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var utils = require('../../utils/page');
var str = require('../../utils/str');
var token = require('../../utils/token');
var cookie = require('../../utils/cookie');
var response = require('../../utils/response');
var py = require('../../utils/strChineseFirstPY');
var sms = require('../../utils/sms');
var config=require('../../config/config');
var co = require('co');
var moment = require('moment');
//models.Members.destroy({where:{m_type:{"$in":[5,6,7,8,9]}}})
var Members={
  app_auth:function(req,res){//用来获取token
    var key=config.token_secret;
    token.encode_token({key:key},function(err,data){
      return response.onDataSuccess(res,{data:data});
    });
  },send_sms:function(req,res){
    var body=req.body;
    //通过验证
    var access_token=req.access_token;
    var m_mpno=body.m_mpno;
    if (!m_mpno) {
      return response.ApiError(res,{message:"手机号码为空"});
    }
    if(!access_token){
      return response.ApiError(res,{message:"验证失败"});
    }
    //判断用户是否是会员状态
    models.Members.findOne({
      where:{m_phone:m_mpno},
      attributes:['mid','m_status','m_type']
    }).then(function(item){
      if (item){
        if(item.dataValues.m_status==1 || item.dataValues.m_type>=4){
          // 产生验证码
          var code=parseInt((Math.random()*9+1)*100000)+'';
          // 发送验证码
          sms.get_code({mpno:m_mpno,code:code},function(err,result){
            //result={"templateSMS":{"smsMessageSid":"c17b066fb75644b0882428ceb11c7400","dateCreated":"20160705135304"},"statusCode":"000000"}
            result=JSON.parse(result);
            if (result.statusCode=="000000"){//发送成功
              models.Smscode.create({
                phoneno:m_mpno,
                smscode:code
              });
              return response.onDataSuccess(res,{data:'验证码发送成功'});
            }else {
              return response.ApiError(res,{message:"验证码发送失败"});
            }
          });
        }else {
          return response.ApiError(res,{code:401,message:"很抱歉！格局商学APP只对正式学员开放，各地学员请联系当地分院激活帐号"});
        }
      }else {
        return response.ApiError(res,{code:401,message:"很抱歉！格局商学APP只对正式学员开放，各地学员请联系当地分院激活帐号"});
      }
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:"send_sms error"});
    });
  },members_enter:function(req,res){
    var m_mpno=req.body.m_mpno;
    var m_code=req.body.m_code;
    if (!m_mpno || !m_code) {
      return response.ApiError(res,{message:"m_mpno or m_code empty"});
    }
    co(function* (){
      try{
        //查询30分钟的记录
        var smscode=yield models.Smscode.findOne({
          where:{smscode:m_code,phoneno:m_mpno,createdAt:{'$gt': moment().add('-30','minute').format()}}
        });
        smscode=1
        if(smscode){
          var item=yield models.Members.findOne({
            where:{m_phone:m_mpno}
          })
          if(item){
            item.dataValues.createdAt=str.getUnixToTime(item.dataValues.createdAt);
            item.dataValues.m_pics=str.AbsolutePath(item.dataValues.m_pics);
            //发送首次登陆通知
            //models.Members.update({m_firstsend:0},{where:{m_type:{'$in':[0,1,2,3]}}})
            if(item.dataValues.m_firstsend==0){
              var hx = require('../../utils/hxchat');
              var mid=item.dataValues.mid;
              var ts=yield models.Config.findOne({
                where:{key:'tips'},
                attributes:['val']
              });
              var first=yield models.Config.findOne({
                where:{key:'first'},
                attributes:['val']
              });
              var notifics= yield models.Notifics.findOne({
                where:{notid:first.dataValues.val}
              });
              var member=yield models.Members.findOne({
                where:{mid:ts.dataValues.val},
                attributes:['m_name','m_pics']
              });
              member.dataValues.m_pics=str.AbsolutePath(member.dataValues.m_pics);
              if(first && ts && member){
                var option={
                  fromuser:ts.dataValues.val,
                  msg:notifics.dataValues.not_title,
                  users:[mid],
                  avatarURLPath:member.dataValues.m_pics,
                  nickName:member.dataValues.m_name
                }
                hx.sendmessages(option,function(err,result){
                  console.log(result);
                  console.log(err)
                })
              }
              models.Members.update({m_firstsend:1},{where:{mid:mid}})
            }
            return response.onDataSuccess(res,{data:item});
          }else {
            return response.ApiError(res,{code:401,message:"很抱歉！格局商学APP只对正式学员开放，各地学员请联系当地分院激活帐号"});
          }
        }else {
          return response.ApiError(res,{message:"验证码输入错误，请您重新输入"});
        }
      }catch (err){
        console.log(err)
      }
    });
  },members_info:function(req,res){
    var m_mpno=req.body.m_mpno;
    var info=req.body.info;
    var body={};
    var access_token=req.access_token;
    if (!m_mpno) {
      return response.ApiError(res,{message:"m_mpno empty"});
    }
    if(!access_token){
      return response.ApiError(res,{message:"token 验证失败"});
    }
    if(typeof info =='string'){
      info=eval('('+info+')');
    }
    body=info?info:{};
    //如果更改姓名需要更改对应的首字母
    if (body.m_name){
      body.m_firstabv=py.makePy(body.m_name);
    }
    models.Members.update(body,{where:{m_phone:m_mpno}}).then(function(){
      return response.onDataSuccess(res,{data:''});
    },function(err){
      console.log(err);
      return response.ApiError(res,{message:"members_info error"});
    })
  },get_member:function(req,res){
    var body=req.query;
    if (!body.mid) {
      return response.ApiError(res,{message:"mid empty"});
    }
    co(function* (){
      try{
        var member=yield models.Members.findOne({
          where:{mid:body.mid}
        });
        if(member){
          member.dataValues.m_pics=str.AbsolutePath(member.dataValues.m_pics);
          member.dataValues.m_teacherqrcode=str.AbsolutePath(member.dataValues.m_teacherqrcode);
          member.dataValues.m_teachertitleimg=str.AbsolutePath(member.dataValues.m_teachertitleimg);
          member.dataValues.m_teacherrightimg=str.AbsolutePath(member.dataValues.m_teacherrightimg);
          if(member.dataValues.m_type>=4){//特殊身份
            if(member.dataValues.m_type==10){//内部员工
              models.Members.update({m_class:'北京总院'},{
                where:{mid:body.mid}
              });
              member.dataValues.my_goods='';
              member.dataValues.m_class='北京总院';
            }else if(member.dataValues.m_type==4){//院办
              var a=yield models.Area.getGropuGoode({userid:body.mid});
              if(a.length>0){
                models.Members.update({m_class:a[0].classroom_name},{
                  where:{mid:body.mid}
                });
                member.dataValues.m_class=a[0].classroom_name;
              }else {
                member.dataValues.m_class='';
              }
              member.dataValues.my_goods='';
            }
          }else {
            //我的班级进行设置
            var userclass=yield models.Userclass.findOne({
              where:{uc_userid:body.mid},
              order:[['createdAt','DESC']],
              attributes:['uc_goodsid','uc_areaname','uc_calssroomname']
            });
            if(userclass){
              //获取我报名的课程信息  地区 分校 课程
              var userclass=userclass.dataValues;
              var goods=yield models.Goods.findOne({
                where:{goodsid:userclass.uc_goodsid},
                attributes:['goods_subtitle','goods_end']
              });
              var m_class=userclass.uc_calssroomname;
              member.dataValues.m_class=m_class;
              member.dataValues.my_goods=goods.dataValues.goods_subtitle;
              models.Members.update({m_class:m_class},{
                where:{mid:body.mid}
              });
              //我课程的进度查询
              if(moment(goods.dataValues.goods_end)<moment()){
                member.dataValues.member_goods=1
              }else {
                member.dataValues.member_goods=0
              }
            }
          }
          return response.onDataSuccess(res,{data:member})
        }else {
          return response.ApiError(res,{message:'用户不存在'})
        }
      }catch(err){
        console.log(err)
        return response.ApiError(res,{message:'get member error'})
      }
    })
  },put_feedback:function(req,res){
    var body=req.body;
    if (!body.content) {
      return response.ApiError(res,{message:"content empty"});
    }
    models.Feedback.create({
      feedback_content:body.content
    }).then(function(){
      return response.onDataSuccess(res,{data:''})
    }, function(err){
      return response.ApiError(res,{message:"question_assist error"});
    })
  },get_memberslist:function(req,res){
   
    var body=req.query;
    var where={'$or': [
      {'m_phone': {'$like': '%'+body.qcontent+'%'}},
      {'m_name': {'$like': '%'+body.qcontent+'%'}},
      {'m_company': {'$like': '%'+body.qcontent+'%'}}
    ],m_status:1};
    if (!body.qcontent) {
      return response.ApiError(res,{message:"qcontent empty"});
    }else
    {
        models.Members.findAll({
        where:where,
        attributes:['m_pics','m_name','m_type','m_position','m_phone','m_company','mid','m_firstabv'],
        order:[['m_firstabv']],
      }).then(function(item){
          if (item) {
          item.forEach( function(node, index) {
            node.m_pics = str.AbsolutePath(node.m_pics);
          });
          return response.onListSuccess(res,{list:item});
        }else {
          return response.ApiError(res,{message:"get members error"});
        }
      }, function(err){
        console.log(err)
        return response.ApiError(res,{message:'get member error'})
      })
    }
  },put_tag:function(req,res){
    var body=req.body;
    if(!body.userid || !body.content){
      return response.ApiError(res,{message:"put_tag error"});
    }
    models.Tag.create({
      tag_userid:body.userid,
      tag_content:body.content
    }).then(function(item){
      return response.onDataSuccess(res,{data:''})
    },function(err){
      console.log(err)
      return response.ApiError(res,{message:"put_tag error"});
    })
  },get_tag:function(req,res){
    var body=req.query;
    console.log(body)
    if(!body.userid){
      return response.ApiError(res,{message:'userid empty'})
    }
    models.Tag.findAll({
      where:{tag_userid:body.userid},
      attributes:['tag_userid','tag_content','tagid']
    }).then(function(item){
      return response.onListSuccess(res,{list:item});
    },function(err){
      console.log(err)
    })
  },del_tag:function(req,res){
    var body=req.body;
    if(!body.tagid || !body.userid){
      return response.ApiError(res,{message:'tagid empty'})
    }
    models.Tag.destroy({
      where:{tagid:body.tagid,tag_userid:body.userid}
    }).then(function(item){
      return response.onDataSuccess(res,{data:''})
    },function(err){
      console.log(err)
    })
  },get_otherinfo:function(req,res){
   var body=req.query;
    if (!body.mid) {
      return response.ApiError(res,{message:"mid empty"});
    }
    if (!body.friendid) {
      return response.ApiError(res,{message:"friendid empty"});
    }
    var where={};
    where.mid=body.mid;
    where.friendid=body.friendid;
    models.Members.getmemberinfo({
      where:where,
      attributes:['user_name','user_pics','user_position','user_phone','user_url','user_place','user_company','company_desc','user_email','goods_name','isover','ismyfriend','uc_calssroomname','user_sex','user_background']
    }).then(function(item){
      item.forEach( function(node, index) {
      node.user_pics=str.AbsolutePath(node.user_pics)
      });
      return response.onListSuccess(res,{list:item})
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:'get member error'})
    })
  }
};
module.exports=Members;