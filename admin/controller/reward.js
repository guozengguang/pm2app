"use strict";
var models  = require('../../models');
var config=require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var str = require('../../utils/str');
var utils = require('../../utils/page');
var co = require('co');
var Logs=require("../controller/logs");
var hx = require('../../utils/hxchat');

//通知打赏
exports.class_reward = function (req,res){
    var body=req.body;
    var class_rewardstatus=0;
    var msg='打赏结束';
    var notifics='no';
    if(body.status==0){
        class_rewardstatus=1;
        var msg='喜欢老师的课,请他喝杯茶吧!';
        var notifics='yes';
    }
    co(function*(){
        try{
            var chatroom= yield models.Group.findOne({
                where:{group_goodid:body.goodsid,group_type:4},
                attributes:['groupid']
            });
            var re=yield models.Config.findOne({
                where:{key:'reward'},
                attributes:['val']
            });
            var chatroomid=chatroom.dataValues.groupid;
            var fromuser=re.dataValues.val;
            var members=yield models.Members.findOne({
                where:{mid:fromuser},
                attributes:['m_name','m_pics']
            });
            if (members){
                members.dataValues.m_pics = str.AbsolutePath(members.dataValues.m_pics);
            }
            var option={
                fromuser:fromuser,
                msg:msg,
                chatrooms:[chatroomid],
                avatarURLPath:members.dataValues.m_pics,
                nickName:members.dataValues.m_name,
                messageMoney:'',
                notifics:notifics
            };
            console.log(option)
            hx.chatroomsmessagescmd(option,function(err,result){
                console.log(result);
                console.log(err);
                if(!err){
                    models.Class.update({class_rewardstatus:class_rewardstatus},{where:{classid:body.classid}});
                    return response.onSuccess(res, {})
                }
            });
        }catch (err){
            console.log(err);
            return response.onError(res,'err')
        }
    })
}
//app打赏
exports.reward_app_list = function (req, res) {
    return res.render('reward/reward_app', {
        title: 'APP打赏',
    });
};
exports.reward_app_ajax = function (req, res) {
    var options=utils.cms_get_page_options(req);
    var body=req.query;
    console.log(body)
    var where={limit:options.pagesize,offset:options.offset};
    if(body.reward_classname){
        where.reward_classname=body.reward_classname;
    }
    if (body.etime && body.stime) {
        //where.createdAt={'$lte': body.etime,'$gte': body.stime};
        where.etime=body.etime;
        where.stime=body.stime;
    }else {
        //if (body.etime) {where.createdAt={'$lt': body.etime};sqlwhere.etime=body.etime}
        //if (body.stime) {where.createdAt={'$gt': body.stime};sqlwhere.stime=body.stime}
    }
    console.log(where)
    co(function*(){
        try{
            var pay=yield models.Reward.PayorderAll(where);
            var count=yield models.Reward.PayorderCount(where);
            var total=yield models.Reward.findsunmoney(where);
            total=total[0].summoney;
            if (pay) {
                pay.forEach( function(node, index) {
                    //node.createdAt = moment(node.createdAt).format('YYYY-MM-DD HH:mm:ss');
                    node.index = options.offset + index + 1
                });
                return response.onSuccess(res, {
                    list:pay,
                    pagecount: Math.ceil(count[0]['count(reward_fromuser)'] / options.pagesize),
                    total:total?total:'err'
                })
            }else {
                return response.onError(res,'没有数据')
            }
        }catch (err){
            console.log(err)
        }
    });
};

exports.reward_wechat_list = function (req, res) {
    return res.render('reward/reward_wechat', {
        title: '微信打赏',
    });
};
exports.reward_wechat_ajax = function (req, res) {
    var options=utils.cms_get_page_options(req);
    var body=req.query;
    var where={limit:options.pagesize,offset:options.offset};
    var sqlwhere={};
    if(body.po_toname){
        where.po_toname=body.po_toname;
        sqlwhere.po_toname=body.po_toname
    }
    if (body.etime && body.stime) {
        //where.createdAt={'$lte': body.etime,'$gte': body.stime};
        sqlwhere.etime=body.etime;
        sqlwhere.stime=body.stime;
        where.etime=body.etime;
        where.stime=body.stime;
    }else {
        //if (body.etime) {where.createdAt={'$lt': body.etime};sqlwhere.etime=body.etime}
        //if (body.stime) {where.createdAt={'$gt': body.stime};sqlwhere.stime=body.stime}
    }
    co(function*(){
        try{
            var pay=yield models.Payorder.PayorderAll(where);
            var count=yield models.Payorder.PayorderCount(where);
            var total=yield models.Payorder.findsunmoney(sqlwhere);
            total=total[0].summoney;
            if (pay) {
                pay.forEach( function(node, index) {
                    node.createdAt = moment(node.createdAt).format('YYYY-MM-DD HH:mm:ss');
                    node.index = options.offset + index + 1
                });
                return response.onSuccess(res, {
                    list:pay,
                    pagecount: Math.ceil(count[0]['count(po_openid)'] / options.pagesize),
                    total:total?total:0
                })
            }else {
                return response.onError(res,'没有数据')
            }
        }catch (err){
            console.log(err)
        }
    });
};
exports.get_rewardWechatExcel = function (req,res) {
    var nodeExcel = require('excel-export');
    var body=req.query;
    var where={}
    if(body.po_toname){
        where.po_toname={'$like': '%'+body.po_toname+'%'}
    }
    if (body.etime && body.stime) {
        where.createdAt={'$lte': body.etime,'$gte': body.stime}
    }else {
        if (body.etime) {where.createdAt={'$lt': body.etime}}
        if (body.stime) {where.createdAt={'$gt': body.stime}}
    }
    var conf = {};
    conf.cols = [
        { caption: '打赏对象', type: 'string',width: 120},
        { caption: '打赏金额', type: 'string' , width: 120},
        { caption: '微信打赏人', type: 'string',width: 120},
        { caption: '性别', type: 'string',width: 120},
        { caption: '城市', type: 'string',width: 120},
        { caption: '省份', type: 'string',width: 120},
        { caption: '时间', type: 'string',width: 120},
    ];
    conf.rows = [];
    models.Payorder.findAll({
        where:where,
        order:[['createdAt', 'DESC']]
    }).then(function(items){
        items.forEach(function(node,index){
            var rows = [];
            rows.push(node.dataValues.po_toname);
            rows.push(node.dataValues.po_money);
            rows.push(node.dataValues.po_nickname);
            if(node.dataValues.po_sex==1){
                rows.push('男');
            }else if(node.dataValues.po_sex==2){
                rows.push('女');
            }else {
                rows.push('未设置');
            }
            rows.push(node.dataValues.po_city);
            rows.push(node.dataValues.po_province);
            rows.push(moment(node.dataValues.createdAt).format('YYYY-MM-DD HH:mm:ss'));
            conf.rows.push(rows);
        })
        var result = nodeExcel.execute(conf);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + moment().format('YYYYMMDDHHmmss') + ".xlsx");
        res.end(result, 'binary');
    },function(err){
        console.log(err);
    })
};