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
const NUM=1;
// return response.ApiError(res,{message:"send_sms error"});
// return response.onDataSuccess(res,{data:list});
// return response.onListSuccess(res,{list:list});
var Question={
  list:function(req,res){
    var app_vote=req.vote?req.vote:NUM;
    var body=req.query;
    var options=utils.get_page_options(req);
    var where={};
    var setvote=1; //1可以在投票 0 不能再投票
    var havevote=app_vote; //剩余票数
    if (!body.classid) {
      return response.ApiError(res,{message:'classid empty'})
    };
    where.question_classid=body.classid;
    try{
      co(function* (){
        var isquestion=0;
        var my_question={};
        var question=yield models.Question.findAndCountAll({
          where:where,
          order:[['question_votes', 'DESC']],
          attributes:['question_votes','question_content','question_title','createdAt','questionid'],
          limit:options.pagesize,
          offset:options.offset,
          include:[{
            model:models.Members,
            attributes:['m_pics','m_name']
          }]
        });
        if(body.userid){
          var user=yield models.Questionassist.findAndCountAll({
            where:{assist_userid:body.userid,assist_classid:body.classid},
            attributes:['assist_questionid']
          });
          var myrank=yield models.Question.getRank({classid:body.classid,userid:body.userid});
          var rank=''
          if(myrank[0]){
            rank=myrank[0].rank
          }
          my_question=yield models.Question.findOne({
            where:{question_classid:body.classid,question_fromuser:body.userid},
            attributes:['question_votes','question_content','question_title','createdAt','questionid']
          })
          if(my_question){
            isquestion=1
          }
          my_question=my_question?my_question:{}
        };
        var list=question.rows?question.rows:[];
        //控制用户是否可以投票和投票次数
        if (user){
          if(user.count>=app_vote){
            setvote=0;
          }
          havevote=havevote-user.count;
          havevote=havevote>=0?havevote:0
        };
        list.forEach( function(node, index) {
          var node=node.dataValues;
          node.createdAt = str.getUnixToTime(node.createdAt);
          node.Member.m_pics=str.AbsolutePath(node.Member.m_pics);
          var isvote=0;
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
        });
        return response.onListSuccess(res,{data:{setvote:setvote,havevote:havevote,myQuestion:my_question,isQuestion:isquestion,myRank:rank},list:list});
      })
    }catch (e){
      console.log(e)
      return response.ApiError(res,{message:"class_list error"});
    };
  },question_assist:function(req,res){
    var app_vote=req.vote?req.vote:NUM;
    var body=req.body;
    if (!body.questionid || !body.userid || !body.classid) {
      return response.ApiError(res,{message:"questionid or userid empty"});
    }
    try{
      co(function* (){
        var user=yield models.Questionassist.findAndCountAll({
          where:{assist_userid:body.userid,assist_classid:body.classid},
          attributes:['assist_questionid']
        });
        //控制用户是否可以投票和投票次数
        if (user){
          if(user.count>=app_vote){
            return response.ApiError(res,{message:"投票限制"});
          }
        }
        models.Questionassist.create({
          assist_questionid:body.questionid,
          assist_classid:body.classid,
          assist_userid:body.userid
        }).then(function(){
          models.Question.questionVoteAdd({id:body.questionid});
          return response.onDataSuccess(res,{data:''})
        }, function(err){
          return response.ApiError(res,{message:"question_assist error"});
        })
      })
    }catch(e){
      console.log(e);
    }
  },question_unassist:function(req,res){
    var body=req.body;
    if (!body.questionid || !body.userid) {
      return response.ApiError(res,{message:"questionid or userid empty"});
    }
    models.Questionassist.destroy({
      where:{
        assist_questionid:body.questionid,
        assist_userid:body.userid
      }
    }).then(function(){
      models.Question.questionVoteSub({id:body.questionid});
      return response.onDataSuccess(res,{data:''})
    }, function(err){
      return response.ApiError(res,{message:"question_assist error"});
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
      return response.onDataSuccess(res,{data:''})
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:"question_put error"});
    })
  },question_update:function(req,res){
    var body=req.body;
    if (!body.classid || !body.userid || !body.questionid) {
      return response.ApiError(res,{message:"goodsid or userid or questionid empty"});
    }
    models.Question.update({
      question_content:body.content,
      question_title:body.title
    },{where:{question_fromuser:body.userid,question_classid:body.classid,questionid:body.questionid}}).then(function(){
      return response.onDataSuccess(res,{data:''})
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:"question_assist error"});
    })
  }
};
module.exports=Question;