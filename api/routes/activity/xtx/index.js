/**
 * Created by Administrator on 2016/10/11 0011.
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
var py = require(process.cwd() +'/utils/strChineseFirstPY');
var hx = require(process.cwd() +'/utils/hxchat');
var co = require('co');

var loginConfig={//登陆短信配置
    appId: '8aaf07085a3c0ea1015a4ac65d4f0696',//应用id
    templateId: '155870',//短信模板id
    accountSid: '8a48b55153eae51101540dc38ef1365c',//主账户id
    authtoken: 'db6ea888164c485fb64fb6c0122a938d',//token
    lostdata: '30',//短信失效时间
    host: "app.cloopen.com",  //主域名
    port: 8883  //端口
};
var cookieConfig={
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
    var sql=new StringBuilder();
    sql.AppendFormat("select m.m_name as name,m.mid from gj_members as m where m.m_phone={0} AND m.m_status=1 AND m.m_type=0",phone);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
};
/**
 * 通过手机号码验证是否为业务员并获取登陆密码
 * @param phone - 手机号码
 * @returns {*}
 */
var checkRegister = (phone) => {
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("select m.m_name as name,m.mid from gj_members as m where m.m_phone={0}",phone);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
};
/**
 * 新建用户
 * @param body
 * @returns {body}
 */
var createMember = (body) =>{
    if(body.m_name){
        body.m_firstabv=py.makePy(body.m_name)
    }
    return models.Members.create(body)
}
/**
 * 更新用户信息 （部分）
 * @param body
 * @returns {body}
 */
var updateMember = (body) =>{
    return models.Members.update(body,{where:{mid:body.mid}})
}
/**
 * 新增验证码记录
 * @param body
 * @returns {body}
 */
var setSms = (body) => {
    return models.Smscode.create(body);
};
/**
 * 验证有效性
 * @param option
 * @returns {*}
 */
var checkSms = (option) => {
    "use strict";
    var time=option.time || 30;//默认三十分钟
    var sql=new StringBuilder();
    sql.AppendFormat("select sms.smscode as code " +
        "from gj_smscode as sms " +
        "where phoneno={0} AND type={1} AND createdAt <= '{2}' " +
        "ORDER BY createdAt DESC " +
        "LIMIT 1",option.phone,option.type,moment().add(time,'minute').format());
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
};
/**
 * 获取会员列表  按分院
 * @param str
 * @returns {*}
 */
var getVip = (str) =>{
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("SELECT cl.classroom_name as room,m.m_name as name,m.m_pics as pics,m.m_company as company,m.m_desc as `desc` FROM gj_userclass as uc " +
        "INNER JOIN gj_members as m ON m.mid=uc.uc_userid " +
        "INNER JOIN gj_classroom as cl ON cl.classroom=uc.uc_calssroomid " +
        "WHERE uc.uc_calssroomid IN ({0}) " +
        "GROUP BY uc.uc_calssroomid,uc_userid " +
        "ORDER BY room,name",str);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
};
/**
 * 提交评论
 * @param body
 * @returns {body}
 */
var setComment = (body) =>{
    "use strict";
    return models.ActivityComment.create(body)
};
/**
 * 获取评论
 * @param key
 * @returns {*}
 */
var getComment = (key) =>{
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("select m.m_name as sourceName,m1.m_name as rootName,m.m_pics,m.m_company as company," +
        "comment.source,comment.content,comment.parent,comment.id,comment.pics,comment.createdAt as time,comment.assist " +
        "from gj_activity_comment as comment " +
        "INNER JOIN gj_members as m ON m.mid=comment.source " +
        "LEFT JOIN gj_members as m1 ON m1.mid=comment.root " +
        "WHERE comment.key='{0}' AND comment.status=1 " +
        "ORDER BY comment.parent,comment.createdAt DESC",key);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
};
/**
 * 获取文章
 * @param key
 * @param id
 * @returns {*}
 */
var getArticle = (key,id) =>{
    "use strict";
    var sql=new StringBuilder();
    var where={key:key,status:1};
    if(id){
        where.id=id
    }
    return models.ActivityArticle.findAll({
        where:where,
        raw:true,
        attributes:['id','pics','video','key','content','title','assist']
    })
};
/**
 * 设置时间
 * @param time
 */
var setTime = (time) =>{
    "use strict";
    //JavaScript函数：
    var minute = 1000 * 60;
    var hour = minute * 60;
    var day = hour * 24;
    var halfamonth = day * 15;
    var month = day * 30;
    var now = new Date().getTime();
    var diffValue = now - new Date(time).getTime();
    var result=''
    if(diffValue < 0){
        return '刚刚'
    }
    var monthC =diffValue/month;
    var weekC =diffValue/(7*day);
    var dayC =diffValue/day;
    var hourC =diffValue/hour;
    var minC =diffValue/minute;
    if(monthC>=1){
        // result=parseInt(monthC) + "个月前";
        result=moment(time).locale('zh-cn').format('M月D日');
    }
    else if(weekC>=1){
        // result=parseInt(weekC) + "周前";
        result=moment(time).locale('zh-cn').format('M月D日');
    }
    else if(dayC>=1){
        result=parseInt(dayC) +"天前";
    }
    else if(hourC>=1){
        result=parseInt(hourC) +"小时前";
    }
    else if(minC>=1){
        result=parseInt(minC) +"分钟前";
    }else{
        result="刚刚";
    }
    return result;
}
/**
 *
 * @param time
 */
var  CommentAssist= (id) =>{
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("UPDATE gj_activity_comment SET assist=assist+1 WHERE id='{0}'",id);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.UPDATE });
}

/**
 * 文章点赞
 * @param id
 */
var  articleAssist= (id) =>{
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("UPDATE gj_activity_article SET assist=assist+1 WHERE id='{0}'",id);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.UPDATE });
}

//获取活动的key值
router.get('/get-key', function (req, res) {
   return response.ApiSuccess(res,{list:require(process.cwd() + '/database').activityType})
});
//发送验证码
router.post('/get-code', function (req, res) {
    var body=req.body;
    if(utils.parameterControl(['phone'],body)){
        return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            var check=yield checkInfo(body.phone)
            if(check.length==0){
                return response.ApiError(res,{message:'非格局学员不能参加'})
            }
            sms.putCode(loginConfig,{phone:body.phone}).then(function (data) {
                setSms({
                    phoneno:body.phone,
                    smscode:data.data,
                    type:7,//pc登陆用
                });
                return response.ApiSuccess(res,{message:'ok'})
            }).catch(function (err) {
                console.log(err)
                return response.ApiError(res,{message:err.toString()})
            })
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
});
//发送验证码登陆注册pc
router.post('/get-code-register', function (req, res) {
    var body=req.body;
    if(utils.parameterControl(['phone'],body)){
        return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            var check=yield checkRegister(body.phone)
            sms.putCode(loginConfig,{phone:body.phone}).then(function (data) {

                setSms({
                    phoneno:body.phone,
                    smscode:data.data,
                    type:8,//pc登陆用
                });
                return response.ApiSuccess(res,{isVip:(check.length==0)?0:1})
            }).catch(function (err) {
                console.log(err)
                return response.ApiError(res,{message:err.toString()})
            })
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
});
//验证码登陆或注册pc
router.post('/code-login-register', function (req, res) {
    var body=req.body;
    if(utils.parameterControl(['phone','code'],body)){
        return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            var info=yield checkRegister(body.phone);
            var show=0;
            var check=yield checkSms({phone:body.phone,type:8})
            if(check.length==1 && check[0].code==body.code){
                if(info.length==0){
                    var addMember=yield createMember({
                        m_phone:body.phone,
                        m_name:body.name,
                    })
                    info=[{name:addMember.dataValues.m_name,mid:addMember.dataValues.mid}]
                    hx.reghxuser({username:addMember.dataValues.mid},function(err,result){
                        console.log(err)
                        console.log(result)
                    });
                    show=1
                }
                token.encode_token({key:body.phone},function(err,data){
                    res.cookie('ac1012f0ddb039a4', data , cookieConfig );
                    return response.ApiSuccess(res,{message:'登陆成功',phone:body.phone,mid:info[0].mid,isShow:show})
                });
            }else {
                return response.ApiError(res,{message:'验证码错误'})
            }
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
});
//验证码登陆
router.post('/code-login', function (req, res) {
    var body=req.body;
    if(utils.parameterControl(['phone','code'],body)){
        return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            var info=yield checkInfo(body.phone);
            if(info.length==0){
                return response.ApiError(res,{message:'非格局学员不能参加'})
            }
            var check=yield checkSms({phone:body.phone,type:7})
            if(check.length==1 && check[0].code==body.code){
                token.encode_token({key:body.phone},function(err,data){
                    res.cookie('ac1012f0ddb039a4', data , cookieConfig );
                    return response.ApiSuccess(res,{message:'登陆成功',phone:body.phone,mid:info[0].mid})
                });
            }else {
                return response.ApiError(res,{message:'验证码错误'})
            }
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
});
//修改信息
router.post('/set-member', function (req, res) {
    var body=req.body;
    if(utils.parameterControl(['mid','company','position'],body)){
        return response.ApiError(res,{message:'参数缺失'})
    }
    updateMember({
        m_company:body.company,
        m_position:body.position,
        mid:body.mid
    }).then(function () {
        return response.ApiSuccess(res,{message:'ok'})
    }).catch(function (err) {
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
    })
});
//发表评论
router.post('/set-comment', function (req, res) {
    var body=req.body;
    if(utils.parameterControl(['content','phone','source','pics','key','parent'],body)){
        return response.ApiError(res,{message:'参数缺失'})
    }
    var k=req.cookies.ac1012f0ddb039a4;
    var phone=body.phone;
    co(function *() {
        if(body.type){
            yield setComment({
                pics:body.pics,//图片
                key:body.key,//外键
                content:body.content,//内容
                source:body.source,//人员
                parent:body.parent,//父级
                root:body.root,//根父级
            })
            return response.ApiSuccess(res,{message:'ok'})//处理评论
        }
        if(!k){
            return response.ApiError(res,{code:401,message:'未登录'})
        }
        try{
            var tokenPhone=token.decode_token(k).iss;
            console.log(token.decode_token(k));
            if(tokenPhone==phone){
                yield setComment({
                    pics:body.pics,//图片
                    key:body.key,//外键
                    content:body.content,//内容
                    source:body.source,//人员
                    parent:body.parent,//父级
                    root:body.root,//根父级
                })
                response.ApiSuccess(res,{message:'ok'})//处理评论
            }else {
                return response.ApiError(res,{code:401,message:'未登录'})
            }
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
});
//获取学员列表
router.post('/get-vip', function (req, res) {
    var body=req.body;
    if(utils.parameterControl(['str'],body)){
        return response.ApiError(res,{message:'参数缺失'})
    }
    getVip(body.str).then(function (item) {
        var map = {},
            dest = [];
        for(var i = 0; i < item.length; i++) {
            var node = item[i];
            var room=node.room;
            delete node.room;
            node.pics=utils.AbsolutePath(node.pics);
            if (!map[room]) {
                dest.push({name:room,item:[node]});
                map[room] = 'true';
            } else {
                for (var j = 0; j < dest.length; j++) {
                    var dj = dest[j];
                    if (dj.name == room) {
                        dj.item.push(node)
                        break;
                    }
                }
            }
        }
        return response.ApiSuccess(res,{list:dest})
    }).catch(function (err) {
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
    })
});
//获取文章列表
router.post('/get-article', function (req, res) {
    var body=req.body;
    if(utils.parameterControl(['key'],body)){
        return response.ApiError(res,{message:'参数缺失'})
    }
    getArticle(body.key,body.id).then(function (item) {
        item.forEach(function (node) {
            node.video=utils.AbsoluteVideoPath(node.video);
            node.pics=utils.AbsolutePath(node.pics)
        })
        result={}
        if(body.id){
            result.detail=item[0]
        }else {
            result.list=item
        }
        return response.ApiSuccess(res,result)
    }).catch(function (err) {
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
    })
});
//获取评论列表
router.post('/get-comment', function (req, res) {
    var body=req.body;
    if(utils.parameterControl(['key'],body)){
        return response.ApiError(res,{message:'参数缺失'})
    }
    getComment(body.key).then(function (item) {
        var len=item.length
        for(var i=0;len>i;i++){
            //对评论图片和用户图片的处理
            item[i].m_pics=utils.AbsolutePath(item[i].m_pics)
            item[i].time=setTime(utils.getUnixToTime(item[i].time))
            item[i].count=0//初始化数据，子条数和子项目
            item[i].item=[]
            for(var j=0;len>j;j++){
                if(item[i].id==item[j].parent){
                    item[i].count+=1
                    item[i].item.unshift(item[j])
                }
            }
        }
        return response.ApiSuccess(res,{list:item.filter(function(node) {
            return node.parent==0;
        })})
    }).catch(function (err) {
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
    })
});
//评论点赞
router.post('/comment-assist', function (req, res) {
    var body=req.body;
    if(utils.parameterControl(['id'],body)){
        return response.ApiError(res,{message:'参数缺失'})
    }
    CommentAssist(body.id).then(function (item) {
        return response.ApiSuccess(res,{message:'ok'})
    }).catch(function (err) {
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
    })
});

//文章点赞
router.post('/article-assist', function (req, res) {
    var body=req.body;
    if(utils.parameterControl(['id'],body)){
        return response.ApiError(res,{message:'参数缺失'})
    }
    articleAssist(body.id).then(function (item) {
        return response.ApiSuccess(res,{message:'ok'})
    }).catch(function (err) {
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
    })
});
module.exports = router;
