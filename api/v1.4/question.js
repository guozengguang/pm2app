var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var utils = require('../../utils/page');
var str = require('../../utils/str');
var token = require('../../utils/token');
var response = require('../../utils/response');
var config=require('../../config/config');
var co = require('co');
var moment=require('moment');
const NUM=2;
// return response.ApiError(res,{message:"send_sms error"});
// return response.onDataSuccess(res,{data:list});
// return response.onListSuccess(res,{list:list});

var Question={
  list:function(req,res){
    var body=req.query;
    var options=utils.get_page_options(req);
    var where={};
    if (!body.classid || !body.userid) {
      return response.ApiError(res,{message:'classid  empty'})
    };
    //控制排序 desc 降顺排序 asc 升序排序 time votes
    var order=[['question_votes', 'DESC']]//默认排序
    if(body.order==1){//按照时间排序
      order=[['createdAt', 'DESC']]//降序
    }
    if(body.order==2){//按照时间排序
      order=[['createdAt', 'ASC']]//升序
    }
    if(body.order==3){//按照投票排序
      order=[['question_votes', 'ASC']]//升序
    }
    if(body.order==4){//按照投票排序
      order=[['question_votes', 'DESC']]//降序
    }
    where.question_classid=body.classid;
    where.question_status=1;
    co(function* (){
      try{
        //获取我的身份
        var m_type=yield models.Members.findOne({
          where:{mid:body.userid},
          attributes:['m_type'],
          raw:true
        });
        if(!m_type){
          return response.ApiError(res,{message:'学员不存在'});
        }
        //获取课程的信息
        var my_class=yield models.Class.findOne({
          where:{classid:body.classid},
          attributes:['class_qustart','class_start','class_quend']
        });
        //
        var report=1//投票阶段
        if (moment() >= moment(my_class.dataValues.class_quend)) {//结束
          report = 4;
        }
        var question=yield models.Question.findAndCountAll({
          where:where,
          order:order,
          attributes:['question_votes','question_content','question_title','questionid','createdAt','question_fromuser'],
          limit:options.pagesize,
          offset:options.offset,
          include:[{
            model:models.Members,
            attributes:['m_pics','m_name','m_company','m_position','mid']
          }]
        });
        //我的提问
        var q=0
        var my_question=yield models.Question.findOne({
          where:{question_classid:body.classid,question_fromuser:body.userid,question_status:1},
          attributes:['question_votes']
        });
        if(my_question){
          q=1
        }
        if(body.userid){
          //获取我点赞问题的id
          var user=yield models.Questionassist.findAndCountAll({
            where:{assist_userid:body.userid,assist_classid:body.classid},
            attributes:['assist_questionid']
          });
        };
        var list=question.rows?question.rows:[];
        list.forEach( function(node, index) {
          var node=node.dataValues;
          node.createdAt = str.getUnixToTime(node.createdAt);
          if(node.Member){
            node.Member.m_pics=str.AbsolutePath(node.Member.m_pics);
          }
          var isvote=0;
          var isMyQ=0
          if(node.question_fromuser==body.userid){
            var isMyQ=1
          }
          //判断当前用户是否对此问题投票
          if (user){
            user.rows.forEach(function(i){
              var i=i.dataValues;
              if (i.assist_questionid==node.questionid){
                isvote=1;
              }
            })
          }
          node.isvote=isvote;
          node.isMyQ=isMyQ;
        });
        return response.ApiSuccess(res,{question:q,m_type:m_type.m_type,report:report,list:list});
      }catch (e){
        console.log(e)
        return response.ApiError(res,{message:e.message});
      };
    })
  },question_my:function(req,res){
    var body=req.query;
    var options=utils.get_page_options(req);
    if (!body.classid || !body.userid) {
      return response.ApiError(res,{message:'classid or userid empty'})
    };
    co(function *(){
      try{
        //我的排名
        var myrank=yield models.Question.getRank({classid:body.classid,userid:body.userid});
        var rank='';
        if(myrank[0]){
          rank=myrank[0].rank
        }
        //我的提问
        var my_question=yield models.Question.findOne({
          where:{question_classid:body.classid,question_fromuser:body.userid,question_status:1},
          attributes:['question_votes','question_content','question_title','createdAt','questionid']
        });
        //获取次课程的信息
        var my_class=yield models.Class.findOne({
          where:{classid:body.classid},
          attributes:['class_qustart','class_start','class_quend']
        });
        //
        var report=1//投票阶段
        if (moment() >= moment(my_class.dataValues.class_quend)) {//结束
          report = 4;
        }
        var seft_votes=[]
        if(my_question){
          my_question.dataValues.rank=rank;
          my_question.dataValues.createdAt=str.getUnixToTime(my_question.dataValues.createdAt);
          var seft_votes=yield models.Questionassist.getSeftVotes({limit:7,offset:0,assist_classid:body.classid,assist_questionid:my_question.dataValues.questionid})
          if(seft_votes){
            seft_votes.forEach(function(node,index){
              node.m_pics=str.AbsolutePath(node.m_pics);
            })
          }
        }
        my_question=my_question?my_question:{}
        //我的投票
        var my_votes=yield models.Questionassist.getMyVotes({assist_classid:body.classid,assist_userid:body.userid})
        if(my_votes){
          my_votes.forEach(function(node,index){
            node.m_pics=str.AbsolutePath(node.m_pics);
            node.createdAt=str.getUnixToTime(node.createdAt);
          });
        }
        my_votes=my_votes?my_votes:[];
        seft_votes=seft_votes;
        return response.ApiSuccess(res,{question:my_question,report:report,vote:my_votes,votes:seft_votes})
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:"error"});
      }
    })
  },del_question:function(req,res){
    var body=req.body;
    if (!body.questionid) {
      return response.ApiError(res,{message:'questionid empty'})
    };
    models.Question.update({
      question_status:0
    },{where:{questionid:body.questionid}}).then(function(){
      return response.ApiSuccess(res,{})
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:"question del error"});
    })
  },question_vote:function(req,res){
    var body=req.query;
    var options=utils.get_page_options(req);
    if (!body.questionid) {
      return response.ApiError(res,{message:'classid or questionid empty'})
    };
    co(function *(){
      try{
        var seft_votes=yield models.Questionassist.getSeftVotes({limit:options.pagesize,offset:options.offset,assist_questionid:body.questionid})
        if(seft_votes){
          seft_votes.forEach(function(node,index){
            node.m_pics=str.AbsolutePath(node.m_pics);
          })
        }
        return response.ApiSuccess(res,{list:seft_votes})
      }catch (err){
        console.log(err)
      }
    })
  },question_assist:function(req,res){
    //var app_vote=req.vote?req.vote:NUM;
    var body=req.body;
    if (!body.questionid || !body.userid || !body.classid) {
      return response.ApiError(res,{message:"questionid or userid empty"});
    }
    try{
      co(function* (){
        //var user=yield models.Questionassist.findAndCountAll({
        //  where:{assist_userid:body.userid,assist_classid:body.classid},
        //  attributes:['assist_questionid']
        //});
        //获取次课程的信息
        var my_class=yield models.Class.findOne({
          where:{classid:body.classid},
          attributes:['class_qustart','class_start','class_quend']
        });
        //
        if (moment() >= moment(my_class.dataValues.class_quend)) {//结束
          return response.ApiError(res,{message:"已超出提问及点赞的时间，你将不能进行提问或点赞操作"});
        }
        //控制用户是否可以投票和投票次数
        //var num=app_vote-user.count
        //if (num<=0){
        //  return response.ApiError(res,{message:"投票限制"});
        //}
        models.Questionassist.create({
          assist_questionid:body.questionid,
          assist_classid:body.classid,
          assist_userid:body.userid
        }).then(function(){
          models.Question.questionVoteAdd({id:body.questionid});
          return response.ApiSuccess(res,{})
        }, function(err){
          return response.ApiError(res,{message:"question_assist error"});
        })
      })
    }catch(e){
      console.log(e);
    }
  },question_unassist:function(req,res){
    //var app_vote=req.vote?req.vote:NUM;
    var body=req.body;
    if (!body.questionid || !body.userid || !body.classid) {
      return response.ApiError(res,{message:"questionid or userid empty"});
    }
    co(function *(){
      try{
        //获取次课程的信息
        var my_class=yield models.Class.findOne({
          where:{classid:body.classid},
          attributes:['class_qustart','class_start','class_quend']
        });
        //
        if (moment() >= moment(my_class.dataValues.class_quend)) {//结束
          return response.ApiError(res,{message:"已超出提问及投票的时间，你将不能进行提问或投票操作"});
        }
        yield models.Questionassist.destroy({
          where:{
            assist_questionid:body.questionid,
            assist_userid:body.userid
          }
        })
        yield models.Question.questionVoteSub({id:body.questionid});
        //var user=yield models.Questionassist.findAndCountAll({
        //  where:{assist_userid:body.userid,assist_classid:body.classid},
        //  attributes:['assist_questionid']
        //});
        //var num=app_vote-user.count
        return response.ApiSuccess(res,{})
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:"question_assist error"});
      }
    })
  },question_put:function(req,res){
    var body=req.body;
    if (!body.classid || !body.userid) {
      return response.ApiError(res,{message:"goodsid or userid empty"});
    }
    models.Question.create({
      question_fromuser:body.userid,
      question_classid:body.classid,
      question_content:body.content,
      question_title:body.title
    }).then(function(){
      return response.ApiSuccess(res,{})
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:"question_put error"});
    })
  },question_putnouserid:function(req,res){
    var body=req.body;
    if (!body.name || !body.phone || !body.classid) {
      return response.ApiError(res,{message:"name or phone empty"});
    }
    co(function* (){
      try{
         var smscode=yield models.Smscode.findOne({
              where:{smscode:body.smscode,phoneno:body.phone,createdAt:{'$gt': moment().add('-30','minute').format()}},raw:true
         });
         if(smscode){
            var exituser=yield models.Members.findOne({
              where:{m_phone:body.phone},
              attributes:['mid','m_status','m_type'],
              raw:true
            })
            var mid = '';
            if(exituser&&exituser.mid)
            {
              mid=exituser.mid;
            }else
            {
              var firstabv = py.makePy(body.name);
              var user = yield models.Members.create({
                  m_type:0,
                  m_phone:body.phone,
                  m_name:body.name,
                  m_pics:body.avatarUrl, 
                  m_status:0,
                  m_firstabv:firstabv
                });
              hx.reghxuser({username:mid},function(err,result){
                console.log(err)
                console.log(result)
              });
              mid = user.mid;
            }
            yield models.WX.create({
              userId:mid,
              openId:body.openid,
              unionId:body.unionId,
              nickName:body.nickName,
              gender:body.gender,
              city:body.city,
              province:body.province,
              country:body.country,
              avatarUrl:body.avatarUrl
            }).then(function(){
              return response.ApiSuccess(res,{})
            }, function(err){
              console.log(err)
              return response.ApiError(res,{message:"question_putnouserid error"});
            })

            models.Question.create({
              question_fromuser:mid,
              question_classid:body.classid,
              question_content:body.content
            }).then(function(){
              return response.ApiSuccess(res,{})
            }, function(err){
              console.log(err)
              return response.ApiError(res,{message:"question_putnouserid error"});
            })
         }else
         {
            return response.ApiError(res,{message:"验证码输入错误，请您重新输入"});
         }
       }catch (err){
        console.log(err)
      }
    });
   
  },question_update:function(req,res){
    var body=req.body;
    if (!body.classid || !body.userid || !body.questionid) {
      return response.ApiError(res,{message:"goodsid or userid or questionid empty"});
    }
    models.Question.update({
      question_content:body.content,
      question_title:body.title
    },{where:{question_fromuser:body.userid,question_classid:body.classid,questionid:body.questionid}}).then(function(){
      return response.ApiSuccess(res,{})
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:"question_assist error"});
    })
  },
};
module.exports=Question;