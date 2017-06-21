var VSERION="/api-v1.2/";
var path='../v1.2'
var express = require('express');
var router = express.Router();
var Members = require(path+'/members');
var Group = require(path+'/group');
var Groupuser = require(path+'/groupuser');
var Class = require(path+'/class');
var Question = require(path+'/question');
var Complaint = require(path+'/complaint');
var Places = require(path+'/places');
var Myfriend = require(path+'/myfriend');
var Sms = require(path+'/sms');
var Hx = require(path+'/hx');
var Pay = require(path+'/pay');
var Devicetoken = require(path+'/devicetoken');
var Reward = require(path+'/reward');
var Config = require(path+'/config');
var Notify=require(path+'/notify');
var Column=require(path+'/column');
var Media=require(path+'/media');
var Token = require('../../utils/token');
var Cookie = require('../../utils/cookie');
var config=require('../../config/config');

/* notify */
router.post('/alipay-notify',Notify.set_alipay_notify);//支付宝回调通知

// 会员
router.post('/app-auth',Members.app_auth);   //获取token
router.post('/send-sms',Token.auth_token,Members.send_sms);   //获取短信
router.post('/members-enter',Members.members_enter);   //登录
router.post('/members-info',Token.auth_token,Members.members_info);   //修改信息
router.get('/get-members',Members.get_member);   //获取用户信息
router.post('/put-feedback',Members.put_feedback);   //用户反馈
router.get('/get-memberlist',Members.get_memberslist);   //用户查询
router.post('/put-tag',Members.put_tag);   //添加标签
router.post('/del-tag',Members.del_tag);   //删除标签
router.get('/get-tag',Members.get_tag);   //获取标签
router.get('/get-otherinfo',Members.get_otherinfo);   //查看其它用户

//通知信息
router.get('/class-notice',Class.class_notice);   //获取通知
//课程
router.get('/goods-list',Class.list);   //获取产品列表
router.get('/goods-detail',Class.goods_detail);   //获取产品详情
router.get('/goods-classlist',Class.goods_classlist);   //获取产品详情
router.get('/class-detail',Class.class_detail);   //获取课程详情
router.get('/class-reward',Class.class_reward);   //获取课程打赏状态
router.get('/my-goods',Class.my_goods);   //我的产品
router.post('/goods-register',Token.auth_token,Class.class_register);   //产品报名
router.get('/area-list',Class.area_list);   //学区列表
router.post('/classvalue-put',Class.put_classvalue);   //提交评论
router.get('/classvalue-list',Class.classvalue_list);   //评论列表
router.get('/classvalue-label',Class.classvalue_label);   //评论标签
router.get('/notifics-list',Class.notifics_list);   //系统通知
router.get('/notifics-detail',Class.notifics_detail);   //通知详情
router.get('/get-courseware',Class.get_courseware);   //获取课件
router.get('/get-reference',Class.get_reference);   //获取推荐书目
//提问
router.get('/question-list',Config.get_vote,Question.list);   //获取问题列表
router.get('/question-my',Question.question_my);   //获取我的问题 投票
router.get('/question-vote',Question.question_vote);   //获取我的问题 投票
router.post('/question-put',Question.question_put);   //用户提问
router.post('/question-update',Question.question_update);   //用户提问
router.post('/question-assist',Config.get_vote,Question.question_assist);   //问题点赞
router.post('/question-unassist',Config.get_vote,Question.question_unassist);   //问题点赞
//广告
router.get('/get-places',Places.get_places); //广告列表
//打赏
router.get('/reward-list',Reward.list);   //获取打赏
router.post('/reward-put',Reward.reward_put);   //打赏
//好友
router.get('/get-Myfriends',Myfriend.get_myfriends); //获取好友列表
router.post('/add-Myfriends',Myfriend.add_myfriend); //添加我的好友
router.post('/delete-Myfriends',Myfriend.delete_myfriend); //删除我的好友
router.post('/add-Myblacklist',Myfriend.add_myblacklist); //设置黑名单
//群组
router.get('/get-mygroup',Group.get_mygroup); //获取我的群组
router.get('/get-groupuser',Groupuser.get_groupuser); //获取群组成员
router.post('/set-mygroup',Group.set_mygroup); //设置我的群组
router.get('/get-groupbyid',Group.get_groupbyid); //根据id获取群组详情
router.get('/get-groupbygood',Group.get_groupbygood); //获取产品下的群组
router.get('/get-groupuserbygood',Groupuser.get_groupuserbygood); //获取产品下的用户
router.get('/get-groupbyusertype',Group.get_groupbyusertype); //获取院长本院群组
//投诉
router.post('/set-complaint',Complaint.set_complaint); //设置我的投诉

//配置
router.get('/get-init-config',Config.get_init_config); //获取配置信息
//短信
router.post('/get-smscode',Sms.get_smscode); //获取短信验证码
router.post('/send-smsbytemplate',Sms.send_smsbytemplate); //发送短信验证码
//环信
router.get('/get-hxtoken',Hx.get_hxtoken); //获取token
router.get('/get-reghxuser',Hx.get_reghxuser); //获取用户
router.get('/get-deletehxuser',Hx.get_deletehxuser); //删除用户
router.get('/get-deletehxgroup',Hx.get_deletehxgroup); //删除群组
router.get('/get-createhxgroup',Hx.get_createhxgroup); //创建群组
router.get('/get-gethxgroupinfo',Hx.get_gethxgroupinfo); //查看群组详情
router.get('/get-addhxgroupuser',Hx.get_addhxgroupuser); //添加群组用户
router.get('/get-deletehxgroupuser',Hx.get_deletehxgroupuser); //删除群组用户
router.get('/get-sendmessages',Hx.get_sendmessages); //发送消息

//token
router.post('/add-devicetoken',Devicetoken.add_devicetoken); //记录用户token

//微信相关
router.get('/get-weixinpayurl',Pay.get_weixinpayurl); //获取微信支付地址
router.get('/get-weixingpayid',Pay.get_weixingpayid); //获取支付回调
router.get('/get-weixingopenid',Pay.get_weixingopenid); //获取支付回调
router.get('/get-jsapiticket',Pay.get_jsapiticket); //获取票据
router.post('/set-payorder',Pay.set_payorder); //设置支付订单
router.post('/set-weixingpayorder',Pay.set_weixingpayorder); //微信支付订单回掉
router.get('/get-payorders',Pay.get_payorders); //获取微信打赏列表
router.get('/get-payorderajax',Pay.payorder_ajax); //获取微信打赏列表

//栏目
router.get('/get-columnsbyid',Column.get_columnsbyid); //获取栏目列表
//媒咨
router.get('/get-mediasbycolumnid',Media.get_mediasbycolumnid); //获取栏目下的媒咨
router.get('/get-mediabyid',Media.get_mediabyid); //获取媒咨详情
router.get('/get-video',Media.get_video); //一个视频
module.exports = router;