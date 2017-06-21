var VSERION="/api-v1.0/";
var express = require('express');
var router = express.Router();
var Members = require('./members');
var Group = require('./group');
var Groupuser = require('./groupuser');
var Class = require('./class');
var Question = require('./question');
var Complaint = require('./complaint');
var Places = require('./places');
var Myfriend = require('./myfriend');
var Sms = require('./sms');
var Hx = require('./hx');
var Pay = require('./pay');
var Devicetoken = require('./devicetoken');
var Reward = require('./reward');
var Config = require('./config');
var Token = require('../../utils/token');
var Cookie = require('../../utils/cookie');
var Notify=require('./notify');
var config=require('../../config/config');

/* notify */
router.post(VSERION+'alipay-notify',Notify.set_alipay_notify);//支付宝回调通知
var WXPay = require('weixin-pay');
var wxpay = WXPay(config.weixin_app);
router.use(VSERION+'weixin-notify', wxpay.useWXCallback(function(msg, req, res, next){
    notify.set_weixin_notify(req,function(err,result){
        console.log(result)
        if(err)return res.fail();
        if(result.code==200){
            return res.success();
        }else{
            return res.fail();
        }
    })
}));
// 会员
router.post(VSERION+'app-auth',Members.app_auth);   //获取token
router.post(VSERION+'send-sms',Token.auth_token,Members.send_sms);   //获取短信
router.post(VSERION+'members-enter',Members.members_enter);   //登录
router.post(VSERION+'members-info',Token.auth_token,Members.members_info);   //修改信息
router.get(VSERION+'get-members',Members.get_member);   //获取用户信息
router.post(VSERION+'put-feedback',Members.put_feedback);   //用户反馈
router.get(VSERION+'get-memberlist',Members.get_memberslist);   //用户查询
router.post(VSERION+'put-tag',Members.put_tag);   //添加标签
router.post(VSERION+'del-tag',Members.del_tag);   //删除标签
router.get(VSERION+'get-tag',Members.get_tag);   //获取标签
router.get(VSERION+'get-otherinfo',Members.get_otherinfo);   //查看其它用户
//聊天室发送消息   测试用
router.get(VSERION+'hx',function(req,res){
    var hx = require('../../utils/hxchat');
    var option={
        fromuser:'297',
        msg:'呵呵100万',
        chatrooms:['226776041564144048'],
        avatarURLPath:'',
        nickName:'haha',
        messageMoney:111
    };
    hx.chatroomsmessages(option,function(err,result){
      console.log(result);
      console.log(err)
    });
})
//通知信息
router.get(VSERION+'class-notice',Class.class_notice);   //获取通知
//课程
router.get(VSERION+'goods-list',Class.list);   //获取产品列表
router.get(VSERION+'goods-detail',Class.goods_detail);   //获取产品详情
router.get(VSERION+'classitem-detail',Class.classitem_detail);   //获取课程详情
router.get(VSERION+'classitem-reward',Class.classitem_reward);   //获取课程打赏状态
router.get(VSERION+'my-goods',Class.my_goods);   //我的产品
router.post(VSERION+'goods-register',Token.auth_token,Class.class_register);   //产品报名
router.get(VSERION+'area-list',Class.area_list);   //学区列表
router.post(VSERION+'classvalue-put',Class.put_classvalue);   //提交评论
router.get(VSERION+'classvalue-list',Class.classvalue_list);   //评论列表
router.get(VSERION+'classvalue-label',Class.classvalue_label);   //评论标签
router.get(VSERION+'notifics-list',Class.notifics_list);   //系统通知
router.get(VSERION+'notifics-detail',Class.notifics_detail);   //通知详情
//提问
router.get(VSERION+'question-list',Config.get_vote,Question.list);   //获取问题列表
router.post(VSERION+'question-put',Question.question_put);   //用户提问
router.post(VSERION+'question-update',Question.question_update);   //用户提问
router.post(VSERION+'question-assist',Config.get_vote,Question.question_assist);   //问题点赞
router.post(VSERION+'question-unassist',Question.question_unassist);   //问题点赞
//广告
router.get(VSERION+'get-places',Places.get_places); //广告列表
//打赏
router.get(VSERION+'reward-list',Reward.list);   //获取打赏
router.post(VSERION+'reward-put',Reward.reward_put);   //打赏
//好友
router.get(VSERION+'get-Myfriends',Myfriend.get_myfriends); //获取好友列表
router.post(VSERION+'add-Myfriends',Myfriend.add_myfriend); //添加我的好友
router.post(VSERION+'delete-Myfriends',Myfriend.delete_myfriend); //删除我的好友
router.post(VSERION+'add-Myblacklist',Myfriend.add_myblacklist); //设置黑名单
//群组
router.get(VSERION+'get-mygroup',Group.get_mygroup); //获取我的群组
router.get(VSERION+'get-groupuser',Groupuser.get_groupuser); //获取群组成员
router.post(VSERION+'set-mygroupuser',Groupuser.set_mygroupuser); //秀爱群组成员
router.post(VSERION+'set-mygroup',Group.set_mygroup); //设置我的群组
router.get(VSERION+'get-groupbyid',Group.get_groupbyid); //设置我的群组
//投诉
router.post(VSERION+'set-complaint',Complaint.set_complaint); //获取我的群组

//配置
router.get(VSERION+'get-init-config',Config.get_init_config); //获取群组成员
//短信
router.post(VSERION+'get-smscode',Sms.get_smscode); //获取短信验证码
router.post(VSERION+'send-smsbytemplate',Sms.send_smsbytemplate); //发送短信验证码
//环信
router.get(VSERION+'get-hxtoken',Hx.get_hxtoken); //获取token
router.get(VSERION+'get-reghxuser',Hx.get_reghxuser); //获取用户
router.get(VSERION+'get-deletehxuser',Hx.get_deletehxuser); //删除用户
router.get(VSERION+'get-deletehxgroup',Hx.get_deletehxgroup); //删除群组
router.get(VSERION+'get-createhxgroup',Hx.get_createhxgroup); //创建群组
router.get(VSERION+'get-gethxgroupinfo',Hx.get_gethxgroupinfo); //查看群组详情
router.get(VSERION+'get-addhxgroupuser',Hx.get_addhxgroupuser); //添加群组用户
router.get(VSERION+'get-deletehxgroupuser',Hx.get_deletehxgroupuser); //删除群组用户
router.get(VSERION+'get-sendmessages',Hx.get_sendmessages); //发送消息
//token
router.post(VSERION+'add-devicetoken',Devicetoken.add_devicetoken); //记录用户token

//微信相关
router.get(VSERION+'get-weixinpayurl',Pay.get_weixinpayurl); //获取微信支付地址
router.get(VSERION+'get-weixingpayid',Pay.get_weixingpayid); //获取支付回调
router.get(VSERION+'get-weixingopenid',Pay.get_weixingopenid); //获取支付回调
router.get(VSERION+'get-jsapiticket',Pay.get_jsapiticket); //获取票据
router.post(VSERION+'set-payorder',Pay.set_payorder); //设置支付订单
router.post(VSERION+'set-weixingpayorder',Pay.set_weixingpayorder); //微信支付订单回掉
router.get(VSERION+'get-payorders',Pay.get_payorders); //获取微信打赏列表
router.get(VSERION+'get-payorderajax',Pay.payorder_ajax); //获取微信打赏列表

module.exports = router;