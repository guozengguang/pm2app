var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var utils = require('../../utils/page');
var response = require('../../utils/response');
var str = require('../../utils/str');
var config=require('../../config/config');
var thunkify = require('thunkify');
var request = require('request');
var get = thunkify(request.get);
var co = require('co');
var hx = require('../../utils/hxchat');

//var WXPay = require('weixin-pay');
//https://doc.open.alipay.com/doc2/detail.htm?spm=a219a.7629140.0.0.URZXc3&treeId=58&articleId=103596&docType=1
//http://cnodejs.org/topic/504061d7fef591855112bab5
//https://mapi.alipay.com/gateway.do?service=notify_verify&partner=2088002396712354&notify_id=RqPnCoPT3K9%252Fvwbh3I%252BFioE227%252BPfNMl8jwyZqMIiXQWxhOCmQ5MQO%252FWd93rvCB%252BaiGg
var Notify={
  set_alipay_notify:function(req,res){
    //alipay.create_direct_pay_by_user_notify(req,res);
    var _POST = req.body;
    //商户订单号
    var out_trade_no = _POST['out_trade_no'];
    //支付宝交易号
    var trade_no = _POST['trade_no'];
    //交易状态
    var trade_status = _POST['trade_status'];
    //支付账号
    var buyer_email = _POST['buyer_email'];
    //金额
    var total_fee = _POST['total_fee'];
    //描述
    var trade_body = _POST['body'];
    if(trade_status=='TRADE_SUCCESS'){
      models.Reward.findOne({
        where:{reward_no:out_trade_no}
      }).then(function(item){
        item.update({reward_armoney:total_fee,reward_status:1,reward_payno:trade_no,reward_fromaccount:buyer_email,reward_remark:trade_body});
        var item=item.dataValues;
        var reward_chatroom=[item.reward_chatroom];
        var reward_fromuser=item.reward_fromuser;
        models.Members.findOne({
          where:{mid:reward_fromuser},
          attributes:['m_name','m_pics']
        }).then(function(item){
          if(item){
            item.dataValues.m_pics=str.AbsolutePath(item.dataValues.m_pics);
            var option={
              fromuser:reward_fromuser,
              msg:'打赏',
              chatrooms:reward_chatroom,
              avatarURLPath:item.dataValues.m_pics,
              nickName:item.dataValues.m_name,
              messageMoney:total_fee
            };
            hx.chatroomsmessages(option,function(err,result){
              console.log(result);
              console.log(err)
            });
          }
        },function(err){
          console.log(err)
        });
        return res.send("success");
      },function(err){
        console.log(err);
        return res.send("fail");
      });
    }
  }
};
module.exports=Notify;