/**
 * 论坛动态化api接口
 * Created by guozengguang on 2017/04/11.
 */
var express = require('express');
var moment = require('moment');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var sms = require(process.cwd() + '/utils/sms');
var token = require(process.cwd() + '/utils/token');
var utils = require(process.cwd() + '/utils/str');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');
var py = require(process.cwd() + '/utils/strChineseFirstPY');
var hx = require(process.cwd() + '/utils/hxchat');
var co = require('co');

var loginConfig = {//登陆短信配置
    appId: '8aaf07085a3c0ea1015a4ac65d4f0696',//应用id
    templateId: '155870',//短信模板id
    accountSid: '8a48b55153eae51101540dc38ef1365c',//主账户id
    authtoken: 'db6ea888164c485fb64fb6c0122a938d',//token
    lostdata: '30',//短信失效时间
    host: "app.cloopen.com",  //主域名
    port: 8883  //端口
};
var cookieConfig = {
    domain: '.geju.com',
    path: '/',
    secure: false,
    httpOnly: false
};
/**
 * 通过手机号码验证是否为业务员并获取登陆密码
 * @param phone - 手机号码
 * @returns {*}
 */
var checkInfo = (phone) => {
    "use strict";
    var sql = new StringBuilder();
    sql.AppendFormat("select m.m_name as name,m.mid,case when  m.m_type = 4  then '4' when m.m_type = 10 then '10' ");
    sql.AppendFormat(" when  m.m_type = 0 and m.m_status=1 then '0-1' when m.m_type = 0 and m.m_status=0 then '0-0' ");
    sql.AppendFormat(" when m.m_phone='{0}' then '2' ");
    sql.AppendFormat(" end as authority from gj_members as m where m.m_phone='{0}' ", phone);
    return models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT});
};

/**
 * 提交评论
 * @param body
 * @returns {body}
 */
var setComment = (body) => {
    "use strict";
    return models.ActivityComment.create(body)
};
/**
 * 获取评论
 * @param key
 * @returns {*}
 */
var getComment = (key) => {
    "use strict";
    var sql = new StringBuilder();
    sql.AppendFormat("select comment.root,m.m_name as sourceName,m1.m_name as rootName,m.m_pics,m.m_company as company," +
        "comment.source,comment.content,comment.parent,comment.id,comment.pics,comment.createdAt as time,comment.assist " +
        "from gj_activity_comment as comment " +
        "INNER JOIN gj_members as m ON m.mid=comment.source " +
        "LEFT JOIN gj_members as m1 ON m1.mid=comment.root " +
        "WHERE comment.key='{0}' AND comment.status=1 AND comment.audit_status=1 " +
        "ORDER BY comment.parent,comment.createdAt DESC", key);
    return models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT});
};

/**
 * 设置时间
 * @param time
 */
var setTime = (time) => {
    "use strict";
    //JavaScript函数：
    var minute = 1000 * 60;
    var hour = minute * 60;
    var day = hour * 24;
    var halfamonth = day * 15;
    var month = day * 30;
    var now = new Date().getTime();
    var diffValue = now - new Date(time).getTime();
    var result = ''
    if (diffValue < 0) {
        return '刚刚'
    }
    var monthC = diffValue / month;
    var weekC = diffValue / (7 * day);
    var dayC = diffValue / day;
    var hourC = diffValue / hour;
    var minC = diffValue / minute;
    if (monthC >= 1) {
        // result=parseInt(monthC) + "个月前";
        result = moment(time).locale('zh-cn').format('M月D日');
    }
    else if (weekC >= 1) {
        // result=parseInt(weekC) + "周前";
        result = moment(time).locale('zh-cn').format('M月D日');
    }
    else if (dayC >= 1) {
        result = parseInt(dayC) + "天前";
    }
    else if (hourC >= 1) {
        result = parseInt(hourC) + "小时前";
    }
    else if (minC >= 1) {
        result = parseInt(minC) + "分钟前";
    } else {
        result = "刚刚";
    }
    return result;
}

//发表评论
router.post('/set-comment', function (req, res) {
    //前端根据先审后发或者先发后审分别传递不同的状态值：先审后发-0；先发后审1；敏感词过滤开关直接传到后台。
    var body = req.body;
    console.log(body.publish_authority,'body.publish_authority')
    console.log(body.reply_authority,'body.reply_authority')
    if (utils.parameterControl(['content', 'phone', 'source', 'pics', 'key', 'parent', 'audit_status', 'sensitive_filter'], body)) {
        return response.ApiError(res, {message: '参数缺失'})
    }

    //如果设置论坛时设置了开启敏感词，对敏感词进行过滤判断
    var sensitiveSql = new StringBuilder();
    if (body.sensitive_filter) {
        sensitiveSql.AppendFormat("SELECT COUNT(INSTR('" + body.content + "', sw_words)) AS count FROM gj_sensitive_words ");
        sensitiveSql.AppendFormat(" WHERE INSTR('" + body.content + "', sw_words) > 0 ");
    }

    var k = req.cookies.d54d08efac05a5a3;
    var phone = body.phone;
    co(function *() {
        var count = yield models.sequelize.query(sensitiveSql.ToString(), {type: models.sequelize.QueryTypes.SELECT});
        var authority = yield checkInfo(body.phone);
        console.log(authority,'authority')
        if (body.publish_authority && body.publish_authority.indexOf("-1") < 0) {//包含游客，则所有人都可以评论
            if(body.publish_authority.indexOf(authority[0].authority) < 0){//不存在发表权限
                return response.ApiError(res,{code: 404,message:'此用户无发表权限'})
            }
        }
        if (body.reply_authority && body.reply_authority.indexOf("-1") < 0) {//包含游客，则所有人都可以回复
            if(body.reply_authority.indexOf(authority[0].authority) < 0){//不存在回复权限
                return response.ApiError(res,{code: 404,message:'此用户无回复权限'})
            }
        }

        if (count[0].count > 0) {//存在敏感词
            return response.ApiError(res, {code: 201, message: '存在敏感词,请重新输入'})
        }
        if (body.type) {
            yield setComment({
                pics: body.pics,//图片
                key: body.key,//外键
                content: body.content,//内容
                source: body.source,//人员
                parent: body.parent,//父级
                root: body.root,//根父级
                audit_status: body.audit_status//审核状态
            })
            return response.ApiSuccess(res, {message: 'ok'})//处理评论
        }
        if (!k) {
            return response.ApiError(res, {code: 401, message: '未登录'})
        }
        try {
            var tokenPhone = token.decode_token(k).iss;
            console.log(token.decode_token(k));
            if (tokenPhone == phone) {
                yield setComment({
                    pics: body.pics,//图片
                    key: body.key,//外键
                    content: body.content,//内容
                    source: body.source,//人员
                    parent: body.parent,//父级
                    root: body.root,//根父级
                    audit_status: body.audit_status//审核状态
                })
                response.ApiSuccess(res, {message: 'ok'})//处理评论
            } else {
                return response.ApiError(res, {code: 401, message: '未登录'})
            }
        } catch (err) {
            console.log(err)
            return response.ApiError(res, {message: err.toString()})
        }
    })
});

//获取评论列表
router.post('/get-comment', function (req, res) {
    var body = req.body;
    if (utils.parameterControl(['key'], body)) {
        return response.ApiError(res, {message: '参数缺失'})
    }
    co(function *() {
        //根据论坛key获取基本配置信息
        var sql = new StringBuilder();
        sql.AppendFormat("SELECT forum.forum_id,forum.forum_name,forum_status,forum.forum_type,forum.forum_publish_authority AS publish_authority");
        sql.AppendFormat(",forum.forum_reply_authority AS reply_authority,forum.forum_sensitive_filter AS sensitive_filter");
        sql.AppendFormat(" FROM gj_forum forum WHERE forum.key = '{0}' AND forum.deleted_at IS NULL", body.key);
        var forum = yield models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT});
        console.log(forum)
        getComment(body.key).then(function (item) {
            var len = item.length
            for (var i = 0; len > i; i++) {
                //对评论图片和用户图片的处理
                item[i].m_pics = utils.AbsolutePath(item[i].m_pics)
                item[i].time = setTime(utils.getUnixToTime(item[i].time))
                item[i].count = 0//初始化数据，子条数和子项目
                item[i].item = []
                for (var j = 0; len > j; j++) {
                    if (item[i].id == item[j].parent) {
                        item[i].count += 1
                        item[i].item.unshift(item[j])
                    }
                }
            }

            return response.ApiSuccess(res, {
                list: item.filter(function (node) {
                    return node.parent == 0;
                }), forumConfig: forum
            })
        }).catch(function (err) {
            console.log(err)
            return response.ApiError(res, {message: err.toString()})
        })
    })
});
module.exports = router;
