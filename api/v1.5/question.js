var express = require('express');
var router = express.Router();
var models = require('../../models');
var validator = require('validator');
var utils = require('../../utils/page');
var str = require('../../utils/str');
var token = require('../../utils/token');
var response = require('../../utils/response');
var config = require('../../config/config');
var co = require('co');
var moment = require('moment');
var StringBuilder = require('../../utils/StringBuilder');
const NUM = 2;
// return response.ApiError(res,{message:"send_sms error"});
// return response.onDataSuccess(res,{data:list});
// return response.onListSuccess(res,{list:list});

var Question = {
    list: function (req, res) {
        var body = req.query;
        var options = utils.get_page_options(req);
        var stauts=0
        if (!body.classid) {
            return response.ApiError(res, {message: 'classid  empty'})
        }
        co(function *() {
            try{
                var sql=new StringBuilder();
                sql.Append("SELECT gj_members.mid as mid,question_isupscreen as isUpscreen,question_classid as classid" +
                    ",question_content as content,question_votes as votes" +
                    ",classroom_name as classroom,m_name as name,gj_question.questionid as questionid," +
                    "gj_question.createdAt as time,m_pics as pics FROM gj_question")
                sql.Append(" INNER JOIN gj_class ON gj_class.classid=gj_question.question_classid")
                sql.Append(" INNER JOIN gj_members ON gj_members.mid=gj_question.question_fromuser")
                sql.Append(" LEFT JOIN gj_userclass ON gj_class.class_goodsid=gj_userclass.uc_goodsid AND gj_question.question_fromuser=gj_userclass.uc_userid")
                sql.Append(" LEFT JOIN gj_classroom ON gj_classroom.classroom=gj_userclass.uc_calssroomid")
                if(body.ismyclass==1){
                    sql.Append(" INNER JOIN gj_userclass as uc ON gj_classroom.classroom=uc.uc_calssroomid")
                }
                sql.AppendFormat(" WHERE question_classid = {0} AND question_status = 1",body.classid);
                if(body.ismyclass==1){
                    sql.AppendFormat(" AND uc.uc_userid={0}",body.userid);
                }
                //控制排序 desc 降顺排序 asc 升序排序 time votes
                if (body.order == 1) {//按照时间排序
                    sql.AppendFormat(" ORDER BY gj_question.createdAt DESC");//降序
                }
                if (body.order == 2) {//按照时间排序
                    sql.AppendFormat(" ORDER BY gj_question.createdAt");//升序
                }
                if (body.order == 3) {//按照投票排序
                    sql.AppendFormat(" ORDER BY question_votes");//升序
                }
                if (body.order == 4) {//按照投票排序
                    sql.AppendFormat(" ORDER BY question_votes DESC");
                }
                sql.AppendFormat(" LIMIT {0},{1}",options.offset,options.pagesize);
                var list=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
                var classDetail=yield models.Class.findOne({
                    where:{classid:body.classid},
                    raw:true,
                    attributes:[['class_qustatus','qustatus']]
                });
                if(classDetail.qustatus==2){
                    stauts=1
                }
                if (body.userid) {
                    //获取我点赞问题的id
                    var user = yield models.Questionassist.findAll({
                        where: {assist_userid: body.userid, assist_classid: body.classid},
                        attributes: ['assist_questionid'],
                        raw:true
                    });
                    list.forEach(function (node, index) {
                        var isVote = 0;
                        node.pics=str.AbsolutePath(node.pics)
                        node.time=str.getUnixToTime(node.time)
                        if (user) {
                            user.forEach(function (i) {
                                if (i.assist_questionid == node.questionid) {
                                    isVote = 1;
                                }
                            })
                        }
                        node.isVote = isVote;
                    });
                };
                return response.ApiSuccess(res,{list:list,status:stauts,isVip:req.isVip})
            }catch (err){
                console.log(err)
                return response.ApiError(res,{message:err.toString()})
            }
        })
    },
    question_assist: function (req, res) {
        var body = req.body;
        if (!body.questionid || !body.userid || !body.classid) {
            return response.ApiError(res, {message: "questionid or userid or classid empty"});
        }
        try {
            co(function*() {
                var sql=new StringBuilder();
                sql.AppendFormat("SELECT class_qustatus as status,assistid FROM gj_class as c" +
                    " LEFT JOIN gj_questionassist as q ON q.assist_classid=c.classid AND q.assist_questionid={1} AND q.assist_userid={2}" +
                    " WHERE c.classid={0} LIMIT 0,1",body.classid,body.questionid,body.userid);
                var assist=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
                if(assist[0].status!=2){
                    return response.ApiError(res, {message: "已超出提问及点赞的时间，你将不能进行提问或点赞操作"});
                }
                if(assist[0].assistid){
                    return response.ApiError(res, {message: "已点赞"});
                }
                models.Questionassist.create({
                    assist_questionid: body.questionid,
                    assist_classid: body.classid,
                    assist_userid: body.userid
                }).then(function () {
                    models.Question.questionVoteAdd({id: body.questionid});
                    return response.ApiSuccess(res, {message:'ok'})
                }, function (err) {
                    return response.ApiError(res, {message: "question_assist error"});
                })
            })
        } catch (e) {
            console.log(e);
        }
    },
    question_unassist: function (req, res) {
        var body = req.body;
        if (!body.questionid || !body.userid || !body.classid) {
            return response.ApiError(res, {message: "questionid or userid empty"});
        }
        co(function *() {
            try {
                var sql=new StringBuilder();
                sql.AppendFormat("SELECT class_qustatus as status,assistid FROM gj_class as c" +
                    " LEFT JOIN gj_questionassist as q ON q.assist_classid=c.classid AND q.assist_questionid={1} AND q.assist_userid={2}" +
                    " WHERE c.classid={0} LIMIT 0,1",body.classid,body.questionid,body.userid);
                var assist=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
                console.log(assist)
                if(assist[0].status!=2){
                    return response.ApiError(res, {message: "已超出提问及点赞的时间，你将不能进行提问或点赞操作"});
                }
                if(!assist[0].assistid){
                    return response.ApiError(res, {message: "不存在赞"});
                }
                models.Questionassist.destroy({
                    where: {
                        assist_questionid: body.questionid,
                        assist_classid: body.classid,
                        assist_userid: body.userid
                    }
                }).then(function () {
                    models.Question.questionVoteSub({id: body.questionid});
                    return response.ApiSuccess(res, {message:'ok'})
                }, function (err) {
                    return response.ApiError(res, {message: "question_assist error"});
                })
            } catch (err) {
                console.log(err)
                return response.ApiError(res, {message: "question_assist error"});
            }
        })
    },
    question_put: function (req, res) {
        var body = req.body;
        if (!body.classid || !body.userid) {
            return response.ApiError(res, {message: "classid or userid empty"});
        }
        models.Class.findOne({
            where:{
                classid:body.classid
            },
            attributes:['class_qustatus'],
            raw:true
        }).then(function (item) {
            if(item.class_qustatus!=2){
                return response.ApiError(res, {message: "已超出提问及点赞的时间，你将不能进行提问或点赞操作"});
            }
            models.Question.create({
                question_fromuser: body.userid,
                question_classid: body.classid,
                question_content: body.content,
                question_title: body.title
            })
            return response.ApiSuccess(res, {message:'ok'})
        }).catch(function (err) {
            console.log(err)
            return response.ApiError(res, {message: err.toString()});
        })
    },

    question_putnouserid: function (req, res) {
        var body = req.body;
        if (!body.name || !body.phone || !body.classid) {
            return response.ApiError(res, {message: "name or phone empty"});
        }
        co(function*() {
            try {
                var smscode = yield models.Smscode.findOne({
                    where: {
                        smscode: body.smscode,
                        phoneno: body.phone,
                        createdAt: {'$gt': moment().add('-30', 'minute').format()}
                    }, raw: true
                });
                if (smscode) {
                    var exituser = yield models.Members.findOne({
                        where: {m_phone: body.phone},
                        attributes: ['mid', 'm_status', 'm_type'],
                        raw: true
                    })
                    var mid = '';
                    if (exituser && exituser.mid) {
                        mid = exituser.mid;
                    } else {
                        var firstabv = py.makePy(body.name);
                        var user = yield models.Members.create({
                            m_type: 0,
                            m_phone: body.phone,
                            m_name: body.name,
                            m_pics: body.avatarUrl,
                            m_status: 0,
                            m_firstabv: firstabv
                        });
                        hx.reghxuser({username: mid}, function (err, result) {
                            console.log(err)
                            console.log(result)
                        });
                        mid = user.mid;
                    }
                    yield models.WX.create({
                        userId: mid,
                        openId: body.openid,
                        unionId: body.unionId,
                        nickName: body.nickName,
                        gender: body.gender,
                        city: body.city,
                        province: body.province,
                        country: body.country,
                        avatarUrl: body.avatarUrl
                    }).then(function () {
                        return response.ApiSuccess(res, {})
                    }, function (err) {
                        console.log(err)
                        return response.ApiError(res, {message: "question_putnouserid error"});
                    })

                    models.Question.create({
                        question_fromuser: mid,
                        question_classid: body.classid,
                        question_content: body.content
                    }).then(function () {
                        return response.ApiSuccess(res, {})
                    }, function (err) {
                        console.log(err)
                        return response.ApiError(res, {message: "question_putnouserid error"});
                    })
                } else {
                    return response.ApiError(res, {message: "验证码输入错误，请您重新输入"});
                }
            } catch (err) {
                console.log(err)
            }
        });

    },

    question_my: function (req, res) {
        var body = req.query;
        var options = utils.get_page_options(req);
        if (!body.classid || !body.userid) {
            return response.ApiError(res, {message: 'classid or userid empty'})
        }
        ;
        co(function *() {
            try {
                //我的排名
                var myrank = yield models.Question.getRank({classid: body.classid, userid: body.userid});
                var rank = '';
                if (myrank[0]) {
                    rank = myrank[0].rank
                }
                //我的提问
                var my_question = yield models.Question.findOne({
                    where: {question_classid: body.classid, question_fromuser: body.userid, question_status: 1},
                    attributes: ['question_votes', 'question_content', 'question_title', 'createdAt', 'questionid']
                });
                //获取次课程的信息
                var my_class = yield models.Class.findOne({
                    where: {classid: body.classid},
                    attributes: ['class_qustart', 'class_start', 'class_quend']
                });
                //
                var report = 1//投票阶段
                if (moment() >= moment(my_class.dataValues.class_quend)) {//结束
                    report = 4;
                }
                var seft_votes = []
                if (my_question) {
                    my_question.dataValues.rank = rank;
                    my_question.dataValues.createdAt = str.getUnixToTime(my_question.dataValues.createdAt);
                    var seft_votes = yield models.Questionassist.getSeftVotes({
                        limit: 7,
                        offset: 0,
                        assist_classid: body.classid,
                        assist_questionid: my_question.dataValues.questionid
                    })
                    if (seft_votes) {
                        seft_votes.forEach(function (node, index) {
                            node.m_pics = str.AbsolutePath(node.m_pics);
                        })
                    }
                }
                my_question = my_question ? my_question : {}
                //我的投票
                var my_votes = yield models.Questionassist.getMyVotes({
                    assist_classid: body.classid,
                    assist_userid: body.userid
                })
                if (my_votes) {
                    my_votes.forEach(function (node, index) {
                        node.m_pics = str.AbsolutePath(node.m_pics);
                        node.createdAt = str.getUnixToTime(node.createdAt);
                    });
                }
                my_votes = my_votes ? my_votes : [];
                seft_votes = seft_votes;
                return response.ApiSuccess(res, {
                    question: my_question,
                    report: report,
                    vote: my_votes,
                    votes: seft_votes
                })
            } catch (err) {
                console.log(err)
                return response.ApiError(res, {message: "error"});
            }
        })
    },
    del_question: function (req, res) {
        var body = req.body;
        if (!body.questionid) {
            return response.ApiError(res, {message: 'questionid empty'})
        }
        ;
        models.Question.update({
            question_status: 0
        }, {where: {questionid: body.questionid}}).then(function () {
            return response.ApiSuccess(res, {})
        }, function (err) {
            console.log(err)
            return response.ApiError(res, {message: "question del error"});
        })
    },
    question_vote: function (req, res) {
        var body = req.query;
        var options = utils.get_page_options(req);
        if (!body.questionid) {
            return response.ApiError(res, {message: 'classid or questionid empty'})
        }
        ;
        co(function *() {
            try {
                var seft_votes = yield models.Questionassist.getSeftVotes({
                    limit: options.pagesize,
                    offset: options.offset,
                    assist_questionid: body.questionid
                })
                if (seft_votes) {
                    seft_votes.forEach(function (node, index) {
                        node.m_pics = str.AbsolutePath(node.m_pics);
                    })
                }
                return response.ApiSuccess(res, {list: seft_votes})
            } catch (err) {
                console.log(err)
            }
        })
    },
    question_update: function (req, res) {
        var body = req.body;
        if (!body.classid || !body.userid || !body.questionid) {
            return response.ApiError(res, {message: "goodsid or userid or questionid empty"});
        }
        models.Question.update({
            question_content: body.content,
            question_title: body.title
        }, {
            where: {
                question_fromuser: body.userid,
                question_classid: body.classid,
                questionid: body.questionid
            }
        }).then(function () {
            return response.ApiSuccess(res, {})
        }, function (err) {
            console.log(err)
            return response.ApiError(res, {message: "question_assist error"});
        })
    },
};
module.exports = Question;
