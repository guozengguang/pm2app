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
var moment=require('moment')

var Reward={
  list:function(req,res){
    var body=req.query;
    var options=utils.get_page_options(req);
    var where={}
    if (!body.fromuser && !body.touser) {
      return response.ApiError(res,{message:'fromuser and  touser empty'})
    }
    if (body.fromuser) {  
      where.reward_fromuser=body.fromuser;
    }
    if (body.touser) {  
      where.reward_touser=body.touser;
    }
    models.Reward.findAndCountAll({
      where:where,
      order:[['createdAt', 'DESC']],
      limit:options.pagesize,
      offset:options.offset
    }).then(function(item){
      if (item) {
        var list=item.rows;
        list.forEach( function(node, index) {
          node.dataValues.createdAt = str.getUnixToTime(node.dataValues.createdAt);
        });
        return response.onListSuccess(res,{list:list});
      }else {
        return response.ApiError(res,{message:"list error"});
      }
    }, function(err){
      console.log(err)
    });
  },reward_put:function(req,res){
    var body=req.body;
    if (!body.fromuser || !body.touser || !body.classid) {
      return response.ApiError(res,{message:"fromuser or touser empty"});
    }
    var reward_no=str.getRewardNo({prefix:"GJ"});
    co(function*(){
      var member=yield models.Members.findOne({
        where:{mid:body.fromuser},
        attributes:['m_name']
      });
      if(!member){
        return response.ApiError(res,{message:"mid error"});
      }
      console.log(body);
      var fromname=member.dataValues.m_name || '';
      var toname=body.toname || '';
      var classname=body.classname || '';
      models.Reward.create({
        reward_fromuser:body.fromuser,
        reward_no:reward_no,
        reward_touser:body.touser,
        reward_classid:body.classid,
        reward_classname:classname,
        reward_toname:toname,
        reward_fromname:fromname,
        reward_money:body.money,
        reward_type:body.type,
        reward_chatroom:body.chatroom
      }).then(function(item){
        var no=item.dataValues.reward_no;
        var title='打赏'+toname+'讲师-'+classname;
        var desc=fromname+'打赏'+toname+'讲师-'+classname;
        if(item.dataValues.reward_type==2){
          var result={no:reward_no,amount:body.money.toString(),title:title};
          return Reward.reward_put_weixin(result,res);
        }
        return response.onDataSuccess(res,{data:{no:no,desc:desc,title:title}})
      }, function(err){
        return response.ApiError(res,{message:"question_assist error"});
      })
    })
  },reward_put_weixin:function(data,res){
    var WXPay = require('weixin-pay');
    var wxpay = WXPay(config.weixin_app);
    wxpay.createUnifiedOrder({
      body: data.title,
      out_trade_no: data.no,
      total_fee: data.amount*100,
      spbill_create_ip: "101.200.215.157",
      notify_url: "http://api.geju.com/api-v1.0/weixin-notify",
      trade_type: 'APP',
      input_charset:'UTF-8'
    }, function(err, result){
      var timeStamp=moment().format('YYYYMMDDHHmmss');
      var package='Sign=WXPay';
      var item={
        weixin:{
          appid:result.appid,
          mch_id:result.mch_id,
          nonce_str:result.nonce_str,
          sign:wxpay.sign({
            appid:result.appid,
            partnerid:result.mch_id,
            noncestr:result.nonce_str,
            package:package,
            timestamp:timeStamp,
            prepayid:result.prepay_id
          }),
          package:package,
          timeStamp:timeStamp,
          prepay_id:result.prepay_id
        },
        no:data.no,
        amount:data.amount,
        title:data.title
      };
      return response.onDataSuccess(res,{data:item});
    });
  }
};
module.exports=Reward;