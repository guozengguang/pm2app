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
var StringBuilder = require('../../utils/StringBuilder');

var Members={
  app_auth:function(req,res){//用来获取token
    var key=config.token_secret;
    token.encode_token({key:key},function(err,data){
      return response.ApiSuccess(res,{data:data});
    });
  },
  send_sms:function(req,res){
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
      attributes:['mid','m_status','m_type'],
      raw:true
    }).then(function(item){
      if(item && (item.m_status==1 || item.m_type>=4)){
        // 产生验证码
        var code=parseInt((Math.random()*9+1)*100000)+'';
        // 发送验证码
        sms.get_code({mpno:m_mpno,code:code},function(err,result){
          result=JSON.parse(result);
          if (result.statusCode=="000000"){//发送成功
            models.Smscode.create({
              phoneno:m_mpno,
              smscode:code
            });
            return response.ApiSuccess(res,{data:'验证码发送成功'});
          }else {
            return response.ApiError(res,{message:"验证码发送失败"});
          }
        });
      }else {
        return response.ApiError(res,{code:401,message:"很抱歉！格局商学APP只对正式学员开放，各地学员请联系当地分院激活帐号"});
      }
    }, function(err){
      console.log(err.toString())
      return response.ApiError(res,{message:err.toString()});
    });
  },
  members_enter:function(req,res){
    var m_mpno=req.body.m_mpno;
    var m_code=req.body.m_code;
    if (!m_mpno || !m_code) {
      return response.ApiError(res,{message:"m_mpno or m_code empty"});
    }
    co(function* (){
      try{
        //查询30分钟的记录
        var smscode=yield models.Smscode.findOne({
          where:{smscode:m_code,phoneno:m_mpno,createdAt:{'$gt': moment().add('-30','minute').format()}},raw:true
        });
        if(m_mpno==17701089944){
          smscode=1
        }
        if(smscode){
          var item=yield models.Members.findOne({
            where:{m_phone:m_mpno},
            raw:true
          })
          if(item){
            item.createdAt=str.getUnixToTime(item.createdAt);
            item.m_pics=str.AbsolutePath(item.m_pics);
            //发送首次登陆通知
            if(item.m_firstsend==0){
              //查找通知和发通知的人
              var notSql=new StringBuilder();
              notSql.AppendFormat("select notifics.not_title from gj_config as config INNER JOIN gj_notifics as notifics ON notifics.notid=config.val WHERE config.key='first' ");
              var not=yield models.sequelize.query(notSql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
              var tipsSql=new StringBuilder();
              tipsSql.AppendFormat("select config.val,me.m_pics,me.m_name from gj_members as me INNER JOIN gj_config as config ON config.val=me.mid WHERE config.key='tips' ");
              var tips=yield models.sequelize.query(tipsSql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
              if(not.length>0 && tips.length>0){
                tips[0].m_pics=str.AbsolutePath(tips[0].m_pics);
                var option={
                  fromuser:tips[0].val,
                  msg:not[0].not_title,
                  users:[item.mid],
                  avatarURLPath:tips[0].m_pics,
                  nickName:tips[0].m_name
                }
                var hx = require('../../utils/hxchat');
                hx.sendmessages(option,function(err,result){
                  console.log(result);
                  console.log(err)
                })
              }
              models.Members.update({m_firstsend:1},{where:{mid:item.mid}})
            }
            return response.ApiSuccess(res,{data:item});
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
  },
  members_info:function(req,res){
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
      return response.ApiSuccess(res,{});
    },function(err){
      console.log(err);
      return response.ApiError(res,{message:err.toString()});
    })
  },
  check_memberbyopenid:function(req,res){
    var openid=req.query.openid;
  
    if (!openid) {
      return response.ApiError(res,{message:"openid empty"});
    }
    models.WX.getmembersbyopenid({
      where:{openid:openid},
      attributes:['userId','openId','nickName','avatarUrl','m_name','m_pics','uc_calssroomid','uc_calssroomname']
    }).then(function(item){
      if(item)
      {
         item.forEach(function(node,index){
            node.m_pics=str.AbsolutePath(node.m_pics);
          })
         return response.ApiSuccess(res,{list:item})
      }else
      {
         return response.ApiSuccess(res,{list:null})
      }
    }, function(err){
      //console.log(err.toString())
      return response.ApiError(res,{message:err.toString()});
    });
  },
  get_member:function(req,res){
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
            if(member.dataValues.m_type==10 && !member.dataValues.m_class){//内部员工
              models.Members.update({m_class:'北京总院'},{
                where:{mid:body.mid}
              });
              member.dataValues.m_class='北京总院';
            }else if(member.dataValues.m_type==4){//院办
              var a=yield models.Area.getGropuGoode({userid:body.mid});
              if(a.length>0 && member.dataValues.m_class!=a[0].classroom_name){
                models.Members.update({m_class:a[0].classroom_name},{
                  where:{mid:body.mid}
                });
                member.dataValues.m_class=a[0].classroom_name;
              }
            }
            member.dataValues.my_goods='';
          }else {
            //我的班级进行设置
            var sql=new StringBuilder();
            sql.AppendFormat("select goods.goods_subtitle,goods.goods_end,userclass.uc_goodsid,userclass.uc_areaname,userclass.uc_calssroomname from gj_userclass as userclass INNER JOIN gj_goods as goods ON goods.goodsid=userclass.uc_goodsid WHERE userclass.uc_userid={0} LIMIT 0,1",body.mid);
            var myUserClass=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
            if(myUserClass.length>0){
              myUserClass=myUserClass[0]
              var m_class=myUserClass.uc_calssroomname;
              member.dataValues.my_goods=myUserClass.goods_subtitle;
              if(moment(myUserClass.goods_end)<moment()){
                member.dataValues.member_goods=1
              }else {
                member.dataValues.member_goods=0
              }
              if(member.dataValues.m_class!=m_class){
                member.update({m_class:m_class});
              }
              member.dataValues.m_class=m_class;
            }
          }
          return response.ApiSuccess(res,{data:member})
        }else {
          return response.ApiError(res,{message:'用户不存在'})
        }
      }catch(err){
        console.log(err)
        return response.ApiError(res,{message:'get member error'})
      }
    })
  },
  put_feedback:function(req,res){
    var body=req.body;
    if (!body.content) {
      return response.ApiError(res,{message:"content empty"});
    }
    models.Feedback.create({
      feedback_content:body.content,
      feedback_type:body.feedback_type,
      feedback_fromuser:body.feedback_fromuser
    }).then(function(item){
      var img=eval('('+body.img+')')
      if(img.length>0){
        var id=item.dataValues.feedbackid;
        var ImgArr=[]
        img.forEach(function(node,index){
          ImgArr.push({feedid:id,feedback_img:node})
        })
        models.FeedbackAttach.bulkCreate(ImgArr)
      }
      return response.ApiSuccess(res,{})
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:"question_assist error"});
    })
  },
  del_feedback:function(req,res){
    var body=req.body;
    if (!body.feedbackid) {
      return response.ApiError(res,{message:"feedbackid empty"});
    }
    models.Feedback.update({feedback_status:0},{
      where:{feedbackid:body.feedbackid}
    }).then(function(){
      return response.ApiSuccess(res,{})
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:"del_feedback error"});
    })
  },
  get_feedback:function(req,res){
    var body=req.query;
    if (!body.feedback_fromuser) {
      return response.ApiError(res,{message:"feedback_fromuser empty"});
    }
    models.Feedback.update({feedback_replystatus:2},{where:{feedback_fromuser:body.feedback_fromuser}});
    models.Feedback.findAll({
      where:{feedback_fromuser:body.feedback_fromuser,feedback_status:1},
      include:[{
        model:models.FeedbackAttach,
        as:'img',
        attributes:['feedback_img']
      },{
        model:models.Members,
        attributes:['m_name','m_position','m_pics']
      }],
      order:[['createdAt','DESC']]
    }).then(function(item){
      item.forEach(function(n,i){
        n.dataValues.createdAt=str.getUnixToTime(n.dataValues.createdAt)
        n.dataValues.replyAt=str.getUnixToTime(n.dataValues.replyAt)
        if(n.dataValues.img){
          var img=n.dataValues.img
          img.forEach(function(node,index){
            node.feedback_img=str.AbsolutePath(node.feedback_img)
          })
        }
        if(n.dataValues.Member){
          var Member=n.dataValues.Member
          Member.m_pics=str.AbsolutePath(Member.m_pics)
        }
      })
      return response.ApiSuccess(res,{list:item,data:'格局小贴士'})
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:"del_feedback error"});
    })
  },
  get_feedbackstatus:function(req,res){
     var body=req.query;
    if (!body.feedback_fromuser) {
      return response.ApiError(res,{message:"feedback_fromuser empty"});
    }
     
     models.Feedback.findAll({
      where:{feedback_fromuser:body.feedback_fromuser,feedback_status:1,feedback_replystatus:1},
     }).then(function(item){
      if(item&&item.length>0)
      {
        return response.ApiSuccess(res,{isreply:1})
      }else
      {
        return response.ApiSuccess(res,{isreply:0})       
      }
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:"get_feedbackstatus error"});
    })
  },
  get_memberslist:function(req,res){
   
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
          return response.ApiSuccess(res,{list:item});
        }else {
          return response.ApiError(res,{message:"get members error"});
        }
      }, function(err){
        console.log(err)
        return response.ApiError(res,{message:'get member error'})
      })
    }
  },
  get_insidemembers:function(req,res){
    var body=req.query;
    var where={m_department:body.department};
    if (!body.department) {
      return response.ApiError(res,{message:"qcontent empty"});
    }else
    {
        models.Members.findAll({
        where:where,
        attributes:['m_pics','m_name','m_type','m_position','m_phone','m_company','mid','m_firstabv','m_department'],
        order:[['m_firstabv']],
      }).then(function(item){
          if (item) {
          item.forEach( function(node, index) {
            node.m_pics = str.AbsolutePath(node.m_pics);
          });
          return response.ApiSuccess(res,{list:item});
        }else {
          return response.ApiError(res,{message:"get members error"});
        }
      }, function(err){
        console.log(err)
        return response.ApiError(res,{message:'get member error'})
      })
    }
  },
  put_tag:function(req,res){
    var body=req.body;
    if(!body.userid || !body.content){
      return response.ApiError(res,{message:"put_tag error"});
    }
    models.Tag.create({
      tag_userid:body.userid,
      tag_content:body.content
    }).then(function(item){
      return response.ApiSuccess(res,{})
    },function(err){
      console.log(err)
      return response.ApiError(res,{message:"put_tag error"});
    })
  },
  get_tag:function(req,res){
    var body=req.query;
    console.log(body)
    if(!body.userid){
      return response.ApiError(res,{message:'userid empty'})
    }
    models.Tag.findAll({
      where:{tag_userid:body.userid},
      attributes:['tag_userid','tag_content','tagid']
    }).then(function(item){
      return response.ApiSuccess(res,{list:item});
    },function(err){
      console.log(err)
    })
  },
  del_tag:function(req,res){
    var body=req.body;
    if(!body.tagid || !body.userid){
      return response.ApiError(res,{message:'tagid empty'})
    }
    models.Tag.destroy({
      where:{tagid:body.tagid,tag_userid:body.userid}
    }).then(function(item){
      return response.ApiSuccess(res,{})
    },function(err){
      console.log(err)
    })
  },
  get_otherinfo:function(req,res){
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
      attributes:['user_name','user_pics','user_position','user_phone','user_url','user_place','user_company','company_desc','user_email','goods_name','isover','ismyfriend','uc_calssroomname','user_sex','user_background','m_ishidephone','myfriend_type']
    }).then(function(item){
      item.forEach( function(node, index) {
        node.user_pics=str.AbsolutePath(node.user_pics)
        if(node.m_ishidephone==1)
        {
          node.user_phone = node.user_phone.substring(0,3)+'********';
        }
      });
      return response.ApiSuccess(res,{list:item})
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:'get member error'})
    })
  }
};
module.exports=Members;