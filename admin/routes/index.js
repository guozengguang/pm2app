var express = require('express');
var router = express.Router();
var User=require("../controller/user");
var Home=require("../controller/home");
var Role=require("../controller/role");
var Logs=require("../controller/logs");
var Other=require("../controller/other");
var Filter = require('../../utils/filter');
var Attachs=require("../controller/attachs");
var Ads=require("../controller/ads");
var Activity=require("../controller/activity");
var Special=require("../controller/special");
var International=require("../controller/international");
var Class=require("../controller/class");
var Area=require("../controller/area");
var Students=require("../controller/students");
var Sysconfig=require("../controller/sysconfigs");
var Notifics=require("../controller/notifics");
var Media=require("../controller/media");
var Inform=require("../controller/inform");
var Note=require("../controller/note");
var Reward=require("../controller/reward");
var Declare=require("../controller/declare");
var Caiwu=require("../controller/caiwu");
var Beian=require("../controller/beian");
var Enterprise=require("../controller/enterprise");
var PaymentCode=require("../controller/paymentCode");

var NewEnroll = require("../controller/newenroll");

//定时器任务
// require("../controller/schedule")

/* GET home page. */
router.get('/login', User.login);//登陆页
router.get('/reset', User.reset);//重置密码
router.post('/reset_code', User.reset_code);//重置密码验证码
router.post('/reset_password', User.reset_password);//重置密码短信
router.post('/signin', User.signin);//登录
router.get('/loginout',User.loginout);//退出
router.get('/index', Filter.authorize ,User.index_render);//首页
router.post('/changepwd',User.changepwd);//修改密码

//新的报名管理 created by dyk
router.get("/newenroll/newenroll_list",Filter.authorize,NewEnroll.enroll_list);
router.post("/newenroll/upordown_enroll",Filter.authorize,NewEnroll.upordown_enroll);
router.post("/newenroll/delete_enroll",Filter.authorize,NewEnroll.delete_enroll);
router.get("/newenroll/newenroll_add",Filter.authorize,NewEnroll.newenroll_add);
router.get("/newenroll/newenroll_edit",Filter.authorize,NewEnroll.newenroll_edit);
router.post("/newenroll/newenroll_create",Filter.authorize,NewEnroll.newenroll_create);
router.post("/newenroll/newenroll_update",Filter.authorize,NewEnroll.newenroll_update);
//报名模板管理
router.get("/newenroll/template_add",Filter.authorize,NewEnroll.template_add);
router.get("/newenroll/template_copy",Filter.authorize,NewEnroll.template_copy);
router.get("/newenroll/template_detaillist",Filter.authorize,NewEnroll.template_detaillist);
//系统管理
router.get('/admin/role', Filter.authorize , Role.role_render);
router.get('/admin/role_list', Filter.authorize , Role.role_list);
router.get('/admin/role_add', Filter.authorize , Role.role_add_render);
router.post('/admin/role_create', Filter.authorize , Role.role_create);
router.get('/admin/role_edit', Filter.authorize ,Role.role_edit_render);
router.post('/admin/role_update', Filter.authorize , Role.role_update);
router.get('/admin/role_del', Filter.authorize , Role.role_del);
router.post('/admin/role_update_status', Filter.authorize ,Role.role_update_status);

//操作日志
router.get('/admin/logs', Filter.authorize , Logs.logs_render);
router.get('/admin/logs_list', Filter.authorize , Logs.logs_list);
router.get('/admin/logs_del',Filter.authorize , Logs.logs_del);

//用户角色
router.get('/admin/user', Filter.authorize , User.user_render);
router.get('/admin/user_list', Filter.authorize , User.user_list);
router.get('/admin/user_add', Filter.authorize , User.user_add_render);
router.post('/admin/user_create', Filter.authorize , User.user_create);
router.get('/admin/user_edit', Filter.authorize , User.user_edit_render);
router.post('/admin/user_update', Filter.authorize , User.user_update);
router.get('/admin/user_del', Filter.authorize , User.user_del);
router.post('/admin/user_update_status', Filter.authorize ,User.user_update_status);
//app首页配置
router.get('/admin/app_home', Filter.authorize , Home.home_render);
router.get('/admin/diagram', Filter.authorize , Home.diagram_render);
router.get('/admin/diagram_list', Filter.authorize , Home.diagram_list);
router.post('/admin/diagram_create', Filter.authorize , Home.diagram_create);
router.post('/admin/diagram_update', Filter.authorize , Home.diagram_update);
router.get('/admin/home_item', Filter.authorize , Home.home_item);
router.get('/admin/home_list', Filter.authorize , Home.home_list);
router.post('/admin/home_create', Filter.authorize , Home.home_create);
router.post('/admin/home_item_create', Filter.authorize , Home.home_item_create);
router.post('/admin/home_item_update', Filter.authorize , Home.home_item_update);
router.post('/admin/home_update', Filter.authorize , Home.home_update);
//广告
router.get('/admin/ads',Filter.authorize,Ads.ads_render);
router.get('/admin/ads_list',Filter.authorize,Ads.ads_list);
router.get('/admin/ads_add',Filter.authorize, Ads.adsAll , Ads.ads_add_render);
router.post('/admin/ads_create',Filter.authorize, Ads.adsAll , Ads.ads_create);
router.get('/admin/ads_edit',Filter.authorize, Ads.adsAll , Ads.ads_edit_render);
router.post('/admin/ads_update',Filter.authorize, Ads.adsAll , Ads.ads_update);
router.get('/admin/ads_autocomplete',Filter.authorize, Ads.ads_autocomplete);
//活动
router.get('/admin/activity',Filter.authorize,Activity.activity_render);
router.get('/admin/activity_list',Filter.authorize,Activity.activity_list);
router.get('/admin/activity_add',Filter.authorize, Activity.activity_add_render);
router.post('/admin/activity_create',Filter.authorize, Activity.activity_create);
router.get('/admin/activity_edit',Filter.authorize, Activity.activity_edit_render);
router.post('/admin/activity_update',Filter.authorize,Activity.activity_update);
//专辑
router.get('/admin/special',Filter.authorize,Special.special_render);
router.get('/admin/special/subset',Filter.authorize,Special.special_subset_render);
router.get('/admin/special_list',Filter.authorize,Special.special_list);
router.get('/admin/special_add',Filter.authorize, Special.special_add_render);
router.get('/admin/special_subset_add',Filter.authorize, Special.special_subset_add_render);
router.post('/admin/special_create',Filter.authorize, Special.special_create);
router.get('/admin/special_edit',Filter.authorize, Special.special_edit_render);
router.get('/admin/special_subset_edit',Filter.authorize, Special.special_subset_edit_render);
router.post('/admin/special_update',Filter.authorize,Special.special_update);
router.get('/admin/special/video',Filter.authorize,Special.special_video_render);

//国际化 International
router.get('/admin/international',Filter.authorize,International.international_render);
router.get('/admin/international/subset',Filter.authorize,International.international_subset_render);
router.get('/admin/international_list',Filter.authorize,International.international_list);
router.get('/admin/international_add',Filter.authorize, International.international_add_render);
router.get('/admin/international_subset_add',Filter.authorize, International.international_subset_add_render);
router.post('/admin/international_create',Filter.authorize, International.international_create);
router.get('/admin/international_edit',Filter.authorize, International.international_edit_render);
router.get('/admin/international_subset_edit',Filter.authorize, International.international_subset_edit_render);
router.post('/admin/international_update',Filter.authorize,International.international_update);
router.get('/admin/international/video',Filter.authorize,International.international_video_render);

//图片视频上传 待合并整理
router.post("/admin/upload_img",Filter.authorize , Attachs.upload_img);
router.post("/upload_base64_img", Filter.authorize , Attachs.upload_base64_img);
router.post("/aly_upload_img", Filter.authorize , Attachs.aly_upload_img);
router.post("/upload_pdf", Filter.authorize , Attachs.aly_upload_pdf);
router.post("/upload_video", Filter.authorize , Attachs.aly_upload_video);
//附件其他
router.get('/admin/video',Filter.authorize,Attachs.video_render);
router.get('/admin/splendid',Filter.authorize,Attachs.splendid_render);
router.get('/admin/splendid_add',Filter.authorize,Attachs.splendid_add);
router.get('/admin/splendid_deit',Filter.authorize,Attachs.splendid_edit);
router.get('/admin/lecturerWall',Filter.authorize,Attachs.lecturerWall_render);
router.get('/admin/lecturerWall_list',Filter.authorize,Attachs.lecturerWall_list);
router.post('/admin/lecturerWall_create',Filter.authorize,Attachs.lecturerWall_create);
router.post('/admin/lecturerWall_update',Filter.authorize,Attachs.lecturerWall_update);
router.get('/admin/attach_list',Filter.authorize, Attachs.attach_list);
//阿里通知回调
router.post('/notification/callback', Attachs.notification_callback);

//学区管理
router.get('/admin/area', Filter.authorize , Area.AllArea, Area.area_render);
router.get('/admin/area_list', Filter.authorize , Area.area_list);
router.post('/admin/area_create', Filter.authorize , Area.area_create);
router.post('/admin/area_update', Filter.authorize , Area.area_update);
router.post('/admin/area_delete', Filter.authorize , Area.area_delete);
router.get('/admin/area_add_render', Filter.authorize , Area.area_add_render);
router.get('/admin/area_edit_render', Filter.authorize , Area.area_edit_render);
router.get('/admin/area_classroom', Filter.authorize , Area.area_classroom);
router.get('/admin/area/manage', Filter.authorize , Area.area_manage_render);
router.post('/admin/branch_manage_push', Filter.authorize , Area.branch_manage_push);
router.post('/admin/branch_manage_del', Filter.authorize , Area.branch_manage_del);
router.get('/admin/branch_manage_list', Filter.authorize , Area.branch_manage_list);

//打赏
router.post('/admin/reward/class_reward', Filter.authorize , Reward.class_reward);
router.get('/admin/reward/app', Filter.authorize , Reward.reward_app_list);
router.get('/admin/reward_app_ajax', Filter.authorize , Reward.reward_app_ajax);
router.get('/admin/reward/wechat', Filter.authorize , Reward.reward_wechat_list);
router.get('/admin/reward_wechat_ajax', Filter.authorize , Reward.reward_wechat_ajax);
router.get('/admin/get_rewardWechatExcel', Filter.authorize , Reward.get_rewardWechatExcel);

//付款码
router.get('/admin/payment', Filter.authorize ,  Area.AllClassRoom,Class.AllGoods,PaymentCode.list_render);
router.get('/admin/payment_list', Filter.authorize , PaymentCode.list_ajax);

//课程管理
router.get('/admin/goods', Filter.authorize , Class.goods_render);
router.get('/admin/class_ajax', Filter.authorize ,Class.goods_list);
router.get('/admin/goods_add', Filter.authorize ,Class.goods_add);
router.post('/admin/class_create', Filter.authorize ,Class.goods_create);
router.get('/admin/goods_edit', Filter.authorize ,Class.goods_edit);
router.post('/admin/class_update', Filter.authorize ,Class.goods_update);

router.get('/admin/goodsrelated_ajax', Filter.authorize ,Class.goods_related_ajax);
router.post('/admin/goodsrelated_add', Filter.authorize ,Class.goods_related_add);
router.post('/admin/goodsrelated_del', Filter.authorize ,Class.goods_related_del);

router.get('/admin/goods/branch', Filter.authorize , Class.branch_render);

router.get('/admin/goods/child', Filter.authorize , Class.class_render);
router.get('/admin/child_ajax', Filter.authorize ,Class.class_list);
router.get('/admin/goods/child_add', Filter.authorize ,Students.AllTea ,Class.class_add);
router.post('/admin/child_create', Filter.authorize ,Class.class_create);
router.get('/admin/goods/child_edit', Filter.authorize ,Students.AllTea ,Class.class_edit);
router.post('/admin/child_update', Filter.authorize ,Class.class_update);
router.post('/admin/child_del', Filter.authorize ,Class.class_del);
router.post('/admin/child_note', Filter.authorize ,Class.class_note);

router.get('/admin/goods/child/courseware', Filter.authorize ,Class.class_courseware_render);
router.get('/admin/class/courseware_ajax', Filter.authorize ,Class.class_courseware_list);
router.post('/admin/class/courseware_update', Filter.authorize ,Class.class_courseware_update);
router.post('/admin/class/courseware_transcoding', Filter.authorize ,Class.class_courseware_transcoding);

router.get('/admin/goods/child/question', Filter.authorize ,Class.class_question_render);
router.get('/admin/class/question_list', Filter.authorize ,Class.class_question_list);
router.post('/admin/class/question_update', Filter.authorize ,Class.class_question_update);

router.get('/admin/goods/child/back', Filter.authorize ,Class.class_back_render);

router.get('/admin/goods/child/topic', Filter.authorize ,Class.class_topic_render);
router.get('/admin/goods/child/topic_add', Filter.authorize ,Class.class_topic_add);
router.get('/admin/goods/child/topic_video', Filter.authorize ,Class.class_topic_video);
router.post('/admin/goods/child/topic_create', Filter.authorize ,Class.class_topic_create);
router.post('/admin/goods/child/topic_update', Filter.authorize ,Class.class_topic_update);
router.get('/admin/goods/child/topic_edit', Filter.authorize ,Class.class_topic_edit);

router.get('/admin/goods/child/value', Filter.authorize ,Class.class_vlaue_render);
router.get('/admin/class/value_list', Filter.authorize ,Class.class_vlaue_list);

router.get('/admin/goods/child/reference', Filter.authorize ,Class.class_reference_render);
router.get('/admin/class/reference_list', Filter.authorize ,Class.class_reference_list);
router.post('/admin/class/reference_create', Filter.authorize ,Class.class_reference_create);
router.post('/admin/class/reference_del', Filter.authorize ,Class.class_reference_del);

router.get('/admin/student', Filter.authorize , Area.AllClassRoom,Class.vip_render);
router.get('/admin/vip_ajax', Filter.authorize ,Class.vip_list);
router.get('/admin/student_vip_add', Filter.authorize ,Class.vip_add);
router.post('/admin/vip_create', Filter.authorize ,Class.vip_create);
router.get('/admin/student_vip_edit', Filter.authorize ,Class.vip_edit);
router.post('/admin/vip_update', Filter.authorize ,Class.vip_update);
router.post('/admin/vip_delete', Filter.authorize ,Class.vip_delete);

router.get('/admin/goods/group', Filter.authorize , Class.group_render);
router.get('/admin/class/group_ajax', Filter.authorize ,Class.group_list);

router.get('/admin/goods/teacher', Filter.authorize , Class.teacher_list_render);
router.post('/admin/set_groupuser', Filter.authorize , Class.set_groupuser);

router.get('/admin/goods/video', Filter.authorize , Class.video_render);
router.get('/admin/class/video_list_ajax', Filter.authorize , Class.video_list);
router.post('/admin/class/video_create', Filter.authorize , Class.video_create);
router.post('/admin/class/video_update', Filter.authorize , Class.video_update);

//企业
router.get("/admin/enterprise",Filter.authorize , Enterprise.enterprise_render);
router.get("/admin/enterprise_list",Filter.authorize , Enterprise.enterprise_list);
router.get("/admin/enterprise/detail",Filter.authorize , Enterprise.enterprise_detail);
router.post("/admin/enterprise/update",Filter.authorize , Enterprise.enterprise_update);
//学员导入
router.get("/admin/vip/import",Filter.authorize , Class.import);
//学员
router.get('/admin/vip_list', Filter.authorize , Students.vip_render);
router.get('/admin/vip_add', Filter.authorize , Students.vip_add);
router.get('/admin/vip_edit', Filter.authorize ,Students.vip_edit);
router.get('/admin/vip_enterprise', Filter.authorize ,Students.vip_enterprise);
router.post('/admin/vip_enterprise_update', Filter.authorize ,Students.vip_enterprise_update);
//业务员
router.get('/admin/sales_list', Filter.authorize , Students.sales_render);
router.get('/admin/sales_add', Filter.authorize , Area.AllClassRoom , Students.sales_add);
router.get('/admin/sales_edit', Filter.authorize , Area.AllClassRoom , Students.sales_edit);
//系统
router.get('/admin/system_list', Filter.authorize , Students.system_render);
router.get('/admin/system_add', Filter.authorize , Students.system_add);
router.get('/admin/system_edit', Filter.authorize ,Students.system_edit);
//院办
router.get('/admin/council_list', Filter.authorize , Students.council_render);
router.get('/admin/council_add', Filter.authorize , Students.council_add);
router.get('/admin/council_edit', Filter.authorize ,Students.council_edit);
//讲师
router.get('/admin/lecturer_list', Filter.authorize , Students.lecturer_render);
router.get('/admin/lecturer_add', Filter.authorize , Students.lecturer_add);
router.get('/admin/lecturer_edit', Filter.authorize ,Students.lecturer_edit);
//员工
router.get('/admin/staff_list', Filter.authorize , Students.staff_render);
router.get('/admin/staff_add', Filter.authorize , Students.staff_add);
router.get('/admin/staff_edit', Filter.authorize ,Students.staff_edit);
//ajax创建 列表 和 修改
router.get('/admin/students_ajax', Filter.authorize , Students.students_list);
router.post('/admin/students_create', Filter.authorize ,Students.students_create);
router.post('/admin/students_update', Filter.authorize ,Students.students_update);

//微信打赏生成页面
router.get('/admin/wechat_students', Filter.authorize ,Students.students_wechat);
router.get('/admin/wechat_qrcode', Filter.authorize ,Students.get_qrcode);
router.get('/admin/feedback', Filter.authorize , Students.feedback);
router.get('/admin/feedback_ajax', Filter.authorize , Students.feedback_ajax);
router.post('/admin/feedback_update', Filter.authorize , Students.feedback_update);

//参数配置
router.get('/admin/sysconfigs', Filter.authorize , Sysconfig.list);
router.get('/admin/sysconfigs_ajax', Filter.authorize , Sysconfig.list_ajax);
router.post('/admin/sysconfigs_save',Filter.authorize , Sysconfig.sysconfigs_save);
router.get('/admin/sysconfigs_del',Filter.authorize , Sysconfig.sysconfigs_del);

//格局公告
router.get('/admin/notifics', Filter.authorize , Notifics.list);
router.get('/admin/notifics_ajax', Filter.authorize , Notifics.list_ajax);
router.post('/admin/notifics_create', Filter.authorize ,Notifics.notifics_create);
router.post('/admin/notifics_update', Filter.authorize ,Notifics.notifics_update);
router.get('/admin/notifics_add', Filter.authorize ,Notifics.notifics_add);
router.get('/admin/notifics_edit', Filter.authorize ,Notifics.notifics_edit);
router.post('/admin/notifics_push', Filter.authorize ,Notifics.notifics_push);
router.post('/admin/notifics_del', Filter.authorize ,Notifics.notifics_del);
//消息通知
router.get('/admin/inform', Filter.authorize , Inform.inform_render);
router.get('/admin/inform_list', Filter.authorize , Inform.inform_list);
router.get('/admin/inform_add', Filter.authorize , Inform.inform_add);
router.post('/admin/inform_push', Filter.authorize , Inform.inform_push);
router.get('/admin/inform_title', Filter.authorize , Inform.inform_title);
router.post('/admin/interior_inform_push', Inform.inform_push);
//短信通知
router.get('/admin/note', Filter.authorize , Note.note_render);
router.get('/admin/note_list', Filter.authorize , Note.note_list);
router.get('/admin/note_exchange', Filter.authorize , Note.note_exchange);
router.post('/admin/note_add', Filter.authorize , Note.note_add);
router.post('/admin/note_del', Filter.authorize , Note.note_del);
router.post('/admin/note_push', Filter.authorize , Note.note_push);
//备案
router.get('/admin/beian/list', Filter.authorize , Area.AllClassRoomBaoBei,Beian.list_render);
router.get('/admin/beian/branch', Filter.authorize , Beian.branch_list_render);
router.get('/admin/beian/all_list', Filter.authorize , Beian.all_list_ajax);//人员列表
router.get('/admin/beian/branch_list', Filter.authorize , Beian.branch_list_ajax);//人员列表
router.post('/admin/beian/set_clerk', Filter.authorize , Beian.set_clerk); //设置合伙人（报备）
router.get('/admin/beian/aging', Filter.authorize , Beian.aging_render);//设置分院报备时效页面
router.post('/admin/beian/set_aging', Filter.authorize , Beian.set_aging);//设置分院报备时效接口
router.get('/admin/beian/remark_list', Filter.authorize , Beian.remark_list);//获取备注列表

router.get('/admin/beian/apply/info', Filter.authorize , Beian.apply_info_render);
router.get('/admin/beian/apply/affiliation', Filter.authorize , Beian.apply_affiliation_render);
router.get('/admin/beian/apply/transfer', Filter.authorize , Beian.apply_transfer_render);

router.get('/admin/beian/check/info', Filter.authorize , Beian.check_info_render);
router.get('/admin/beian/check/info/list', Filter.authorize , Beian.check_info_list);//审核(申请修改)人员信息（报备）列表
router.get('/admin/beian/set_check_info', Filter.authorize , Beian.set_check_info);//申请人员信息变更 （api）
router.post('/admin/beian/check/info', Filter.authorize , Beian.check_info); //审核(申请修改)人员信息（报备）
router.get('/admin/beian/check/affiliation', Filter.authorize , Beian.check_affiliation_render);
router.get('/admin/beian/check/affiliation/list', Filter.authorize , Beian.check_affiliation_list);//审核(申请修改)合伙人（报备）列表
router.get('/admin/beian/set_check_affiliation', Filter.authorize , Beian.set_check_affiliation);//申请合伙人变更 （api）
router.post('/admin/beian/check/affiliation', Filter.authorize , Beian.check_affiliation); //审核(申请修改)合伙人（报备）
router.get('/admin/beian/check/transfer', Filter.authorize , Beian.check_transfer_render);
router.get('/admin/beian/check/transfer/list', Filter.authorize , Beian.check_transfer_list);//审核(申请修改)分院（报备)列表
router.post('/admin/beian/check/transfer', Filter.authorize , Beian.check_transfer); //审核(申请修改)分院（报备）
router.post('/admin/beian/set_check_transfer', Filter.authorize , Beian.set_check_transfer); //设置(申请修改)分院（报备）


router.get('/admin/beian/pay/list', Filter.authorize , Beian.pay_list_render);
router.get('/admin/beian/pay/ajax', Filter.authorize , Beian.pay_list_ajax);
router.get('/admin/beian/pay/add', Filter.authorize , Beian.pay_add_render);
router.post('/admin/beian/pay/create', Filter.authorize , Beian.pay_create);
router.get('/admin/beian/pay/deit/:id', Filter.authorize , Beian.pay_edit_render);
router.post('/admin/beian/pay/update', Filter.authorize , Beian.pay_update);
router.post('/admin/beian/pay/del', Filter.authorize , Beian.pay_del);
//财务
router.get('/admin/caiwu/list', Filter.authorize , Caiwu.list_render);
router.get('/admin/caiwu/ajax', Filter.authorize , Caiwu.list_ajax);
router.get('/admin/caiwu/detail/:id', Filter.authorize , Caiwu.detail);
router.post('/admin/caiwu/examine', Filter.authorize , Caiwu.examine);
//格局媒资(强)
router.get('/admin/media', Filter.authorize , Media.media);
router.post('/admin/online', Filter.authorize , Media.online);
router.get('/admin/media_add', Filter.authorize ,Media.media_add);
router.get('/admin/media_edit', Filter.authorize ,Media.media_edit);
router.get('/admin/media_list', Filter.authorize , Media.media_list);//媒资上下架
router.get('/admin/media_single_list', Filter.authorize , Media.media_single_list);//媒资列表
router.post('/admin/media_create', Filter.authorize ,Media.media_create);
router.post('/admin/media_update', Filter.authorize ,Media.media_update);
router.get('/admin/column', Filter.authorize ,Media.column);
router.get('/admin/column_list', Filter.authorize ,Media.column_list);
router.get('/admin/column_add', Filter.authorize ,Media.column_add);
router.get('/admin/column_edit', Filter.authorize ,Media.column_edit);
router.post('/admin/column_create', Filter.authorize ,Media.column_create);
router.post('/admin/column_update', Filter.authorize ,Media.column_update);

//测试
router.get('/admin/api_test', Other.api_test);
router.get('/admin/aly_upload', Other.aly_render);

/*
 //学员申报
 router.get('/admin/swipe', Filter.authorize ,Declare.all_goods , Declare.swipe);//pos总院页面
 router.get('/admin/branch_swipe', Filter.authorize ,Declare.all_goods , Declare.branch_swipe);//pos分院页面

 router.get('/admin/transfer', Filter.authorize ,Declare.all_goods , Declare.transfer);//转账总院页面
 router.get('/admin/branch_transfer', Filter.authorize ,Declare.all_goods , Declare.branch_transfer);//转账分院页面

 router.get('/admin/branch_transfer_add', Filter.authorize ,Declare.all_content,Declare.transfer_add);//新增转账页面
 router.post('/admin/branch_transfer_create', Filter.authorize ,Declare.transfer_create);//新增转账接口
 router.get('/admin/branch_transfer_edit', Filter.authorize ,Declare.all_content,Declare.transfer_edit);//新增转账页面
 router.post('/admin/branch_transfer_update', Filter.authorize ,Declare.transfer_update);//编辑转账接口
 router.post('/admin/statement_update', Filter.authorize ,Declare.statement_update);//导入订单状态改变

 router.post('/admin/record_create', Filter.authorize ,Declare.record_create);//新建说明
 router.get('/admin/record_list', Filter.authorize ,Declare.record_list);//说明列表
 router.get('/admin/payment_list', Filter.authorize ,Declare.payment_list);//学员id查看学员付款单

 router.get('/admin/financial_list', Filter.authorize ,Declare.financial_list);//总院列表数据
 router.get('/admin/financial_branch_list', Filter.authorize ,Declare.financial_branch_list);//分院列表数据
 router.get('/admin/financial_one', Filter.authorize ,Declare.financial_one);//获取一个数据
 router.post('/admin/financial_import', Filter.authorize ,Declare.all_pos,Declare.import);//pos导入
 router.post('/admin/financial_merge', Filter.authorize ,Declare.financial_merge);//合单
 router.post('/admin/financial_unmerge', Filter.authorize ,Declare.financial_unmerge);//拆单
 router.post('/admin/financial_associated', Filter.authorize ,Declare.financial_associated);//关联学员
 router.post('/admin/financial_unassociated', Filter.authorize ,Declare.financial_unassociated);//解除关联学员
 router.post('/admin/user_class_update', Filter.authorize ,Declare.user_class_update);//学员状态改变
 router.get('/admin/member_add', Filter.authorize ,Declare.all_content,Declare.financial_member_add);//新增学员页面
 router.post('/admin/financial_member_create', Filter.authorize ,Declare.financial_member_create);//新增学员接口
 router.get('/admin/member_edit', Filter.authorize ,Declare.all_content,Declare.financial_member_edit);//编辑学员页面
 router.post('/admin/financial_member_update', Filter.authorize ,Declare.financial_member_update);//编辑学员接口
 router.get('/admin/member', Filter.authorize ,Declare.all_content,Declare.financial_member);//学员列表页面
 router.get('/admin/financial_member_ajax', Filter.authorize ,Declare.financial_member_ajax);//学员列表接口 为关联选择用
 router.post('/admin/banch_member', Filter.authorize ,Declare.banch_member);//用户分院关联
 router.post('/admin/banch_member_break', Filter.authorize ,Declare.banch_member_break);//用户解分院关联解除
 router.get('/admin/member_by_mid', Filter.authorize ,Declare.member_by_mid);//mid获取用户所属分院
 router.get('/admin/financial_member_class_ajax', Filter.authorize ,Declare.financial_member_class_ajax);//学员列表 带已报名的课程
 router.get('/admin/pos', Filter.authorize ,Declare.classroom_pos);//pos关联分院页面
 router.get('/admin/classroom_pos_list', Filter.authorize ,Declare.classroom_pos_list);//pos和分院列表接口
 router.post('/admin/classroom_pos_create', Filter.authorize ,Declare.classroom_pos_create);//pos增加
 router.post('/admin/classroom_pos_update', Filter.authorize ,Declare.classroom_pos_update);//pos编辑
 */
module.exports = router;