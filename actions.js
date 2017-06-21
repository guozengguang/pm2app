module.exports = {
    //operation 操作类型 5全部 4增 3删 2改 1查
    permission: [
        {
            code: "1000", path: "", title: "报名列表",
            buttons: []
        },
        {
            code: "1200", path: "/admin/enroll/enroll", title: "招生简章",
            buttons: [
                {code: "1201", operation: 4, parent: '1200', path: "", title: "生成页面地址"},
                {code: "1202", operation: 3, parent: '1200', path: "", title: "删除简章"},
                {code: "1203", operation: 2, parent: '1200', path: "", title: "编辑简章"}
            ]
        },
        {
            code: "1300", path: "/admin/enroll/manage", title: "学员报名管理",
            buttons: [
                {code: "1301", operation: 1, parent: '1300', path: "/admin/enroll/branch_info", title: "下载Excel"},
            ]
        },
        {
            code: "1400", path: "/admin/enroll/branch/manage", title: "分院报名管理",
            buttons: [
                {code: "1401", operation: 1, parent: '1400', path: "/admin/enroll/branch_info", title: "下载Excel"},
            ]
        },
        {
            code: "1500", path: "/admin/enroll/branch/manage", title: "硅谷报名管理",
            buttons: [
                {code: "1501", operation: 1, parent: '1400', path: "/admin/enroll/branch_info", title: "下载Excel"},
            ]
        },
        {
            code: "1600", path: "/admin/enroll/education/manage", title: "家长学院报名管理",
            buttons: []
        },
        {
            code: "1650", path: "/admin/enroll/israel/manage", title: "以色列报名付费",
            buttons: []
        },
        {
            code: "1700", path: "/admin/newenroll/newenroll", title: "新招生简章",
            buttons: []
        },
        {
            code: "1800", path: "/admin/newenroll/apply_template_manager", title: "报名模板管理",
            buttons: []
        },
        {
            code: "8000", path: "", title: "APP配置",
            buttons: []
        },
        {
            code: "8100", path: "/admin/app_home", title: "首页配置",
            buttons: []
        },
        {
            code: "8200", path: "/admin/sysconfigs", title: "参数配置",
            buttons: []
        },{
            code: "8300", path: "/admin/diagram", title: "启动图设置",
            buttons: []
        },

        {
            code: "2000", path: "", title: "格局商学",
            buttons: []
        },
        {
            code: "2100", path: "/admin/goods", title: "课程班列表",
            buttons: []
        },
        {
            code: "2400", path: "/admin/activity", title: "活动列表",
            buttons: []
        },{
            code: "2600", path: "/admin/international", title: "国际化列表",
            buttons: []
        },
        {
            code: "2500", path: "/admin/special", title: "专辑列表",
            buttons: []
        },
        {
            code: "2300", path: "/admin/student", title: "会员列表",
            buttons: []
        },
        {
            code: "2200", path: "/admin/area", title: "学区列表",
            buttons: []
        },
        {
            code: "2700", path: "/admin/enterprise", title: "企业列表",
            buttons: []
        },
        {
            code: "2800", path: "/admin/payment", title: "付款码",
            buttons: []
        },

        {
            code: "3000", path: "", title: "格局用户",
            buttons: []
        },
        {
            code: "3100", path: "/admin/vip_list", title: "用户列表",
            buttons: []
        },
        {
            code: "3800", path: "/admin/staff_list", title: "员工列表",
            buttons: []
        },
        {
            code: "3700", path: "/admin/sales_list", title: "招生老师列表",
            buttons: []
        },
        {
            code: "3500", path: "/admin/lecturer_list", title: "讲师列表",
            buttons: []
        },
        {
            code: "3900", path: "/admin/council_list", title: "院办列表",
            buttons: []
        },
        {
            code: "3600", path: "/admin/system_list", title: "系统用户",
            buttons: []
        },
        {
            code: "3200", path: "/admin/feedback", title: "用户反馈",
            buttons: []
        },
        {
            code: "3300", path: "/admin/reward/wechat", title: "微信打赏",
            buttons: []
        },

        {
            code: "4000", path: "", title: "格局媒资",
            buttons: []
        },
        {
            code: "4100", path: "/admin/media", title: "媒资列表",
            buttons: []
        },
        {
            code: "4200", path: "/admin/column", title: "栏目列表",
            buttons: []
        },
        {
            code: "4300", path: "/admin/media/online", title: "媒资上下架",
            buttons: []
        },
        // {
        //     code: "4400", path: "/admin/media/offline", title: "媒资下架",
        //     buttons: []
        // },

        {
            code: "5000", path: "", title: "附件其他",
            buttons: []
        },
        {
            code: "5200", path: "/admin/ads", title: "广告位管理",
            buttons: []
        },
        {
            code: "5500", path: "/admin/video", title: "视频上传",
            buttons: []
        },
        {
            code: "5400", path: "/admin/notifics", title: "格局公告",
            buttons: []
        },
        {
            code: "5800", path: "/admin/inform", title: "内部通知",
            buttons: []
        },{
            code: "5900", path: "/admin/note", title: "短信通知",
            buttons: []
        },
        {
            code: "5600", path: "/admin/um", title: "友盟推送",
            buttons: []
        },
        {
            code: "5700", path: "/admin/splendid", title: "精彩锦集",
            buttons: []
        },


        {
            code: "6000", path: "", title: "学员报备",
            buttons: []
        },
        {
            code: "6100", path: "/admin/beian/list", title: "学员列表(高级)",
            buttons: []
        },{
            code: "6150", path: "/admin/beian/branch_list", title: "学员列表",
            buttons: []
        },
        /*{
            code: "6200", path: "/admin/beian/apply/info", title: "申请信息修改",
            buttons: []
        },
        {
            code: "6300", path: "/admin/beian/apply/affiliation", title: "申请归属转移",
            buttons: []
        },
        {
            code: "6400", path: "/admin/beian/apply/transfer", title: "申请转院",
            buttons: []
        },*/
        {
            code: "6500", path: "/admin/beian/check/info", title: "信息修改列表",
            buttons: []
        },

        {
            code: "6600", path: "/admin/beian/check/affiliation", title: "归属转移列表",
            buttons: []
        },
        {
            code: "6700", path: "/admin/beian/check/transfer", title: "转院列表",
            buttons: []
        },
        {
            code: "6800", path: "/admin/beian/pay/list", title: "缴费管理",
            buttons: []
        },
        {
            code: "6900", path: "/admin/beian/aging", title: "时效设置",
            buttons: []
        },

        {
            code: "9000", path: "", title: "财务部",
            buttons: []
        },
        {
            code: "9100", path: "/admin/caiwu/list", title: "审核列表",
            buttons: []
        },

        /*{
            code: "6000", path: "", title: "报名付费",
            buttons: []
        },
        {
            code: "6100", path: "/admin/swipe", title: "pos总院",
            buttons: []
        },
        {
            code: "6200", path: "/admin/branch_swipe", title: "pos分院",
            buttons: []
        },
        {
            code: "6500", path: "/admin/transfer", title: "转账总院",
            buttons: []
        },
        {
            code: "6600", path: "/admin/branch_transfer", title: "转账分院",
            buttons: []
        },
        {
            code: "6300", path: "/admin/pos", title: "pos分院对照表",
            buttons: []
        },
        {
            code: "6400", path: "/admin/member", title: "学员列表",
            buttons: []
        },*/

        {
            code: "7000", path: "", title: "宣传页",
            buttons: []
        },
        {
            code: "7001", path: "/admin/advertisement", title: "参数管理",
            buttons: []
        },
        {
            code: "7002", path: "/admin/advertisement/value", title: "参数修改",
            buttons: []
        },
        {
            code: "7003", path: "/admin/advertisement/value", title: "问卷调查",
            buttons: [
                {code: "7004", operation: 2, parent: '7003', path: "", title: "修改投票数"}
            ]
        },
        {
            code: "7005", path: "/admin/enroll/good_project/manage", title: "好项目报名",
            buttons: []
        },
        {
            code: "7400", path: "/admin/rating/manage", title: "评价表列表",
            buttons: []
        },
        {
            code: "7500", path: "/admin/rating/statistics", title: "评价表统计",
            buttons: []
        },

        {
            code: "7600", path: "/admin/blessings/branch", title: "学院祝福审核",
            buttons: []
        },
        {
            code: "7700", path: "/admin/blessings/student", title: "学员祝福审核",
            buttons: []
        },
        {
            code: "7800", path: "/admin/master/enroll", title: "格局达人报名",
            buttons: []
        },
        {
            code: "7900", path: "/admin/master/winning", title: "格局达人中奖",
            buttons: []
        },
        {
            code: "7006", path: "/admin/enroll/xtx", title: "活动专辑",
            buttons: []
        },
        {
            code: "7007", path: "/admin/enroll/forum", title: "动态论坛管理",
            buttons: []
        },
        {
            code: "7008", path: "/admin/enroll/sensitive", title: "敏感词管理",
            buttons: []
        },
        {
            code: "10000", path: "", title: "系统管理",
            buttons: []
        },
        {
            code: "10100", path: "/admin/uesr", title: "角色管理",
            buttons: []
        },
        {
            code: "10200", path: "/admin/role", title: "用户管理",
            buttons: []
        },
        {
            code: "10900", path: "/admin/logs", title: "操作日志",
            buttons: []
        },
        {
            code: "8fddf4df95dfcfcb", path: "", title: "活动管理",
            buttons: []
        },
        {
            code: "8fddf4df95dfcfcba02b70284bee20c4", path: "/admin/logs", title: "发布活动",
            buttons: []
        },
        {
            code: "8fddf4df95dfcfcb07179c6b0ee1557d", path: "/admin/logs", title: "活动审核",
            buttons: []
        },
        {
            code: "8fddf4df95dfcfcbj0td7k6m08eg09147a9iq1fz", path: "/admin/logs", title: "活动管理",
            buttons: []
        },
        {
            code: "8fddf4df95dfcfcb71b837b9d8c0998f", path: "/admin/logs", title: "酒店管理",
            buttons: []
        },
        {
            code: "8fddf4df95dfcfcbba0e65e983dc0003", path: "/admin/logs", title: "酒店介绍",
            buttons: []
        },
        {
            code: "8fddf4df95dfcfcbcc98f38b47f453fc", path: "/admin/logs", title: "预定记录",
            buttons: []
        },
        {
            code: "8fddf4df95dfcfcbb72de041b1c7e6ee", path: "/admin/logs", title: "酒店预定",
            buttons: []
        }
    ]
};