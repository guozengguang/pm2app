/**
 * Created by guozengguang on 2017/04/06.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');
var str = require(process.cwd() + '/utils/str');
var models = require(process.cwd() + '/models/index');
var moment = require('moment');
var co = require('co');
var utils = require(process.cwd() + '/utils/page');
router.all('/*',Filter.authorize);

/**
 * 跳转到论坛管理列表
 */
router.get('/',function (req,res) {
    return res.render('enroll/forum',{
        title:'动态论坛管理'
    })
})
/**
 * ajax请求列表
 */
router.get('/forum_ajax',function (req,res) {
    var options = utils.cms_get_page_options(req);
    var body = req.query;
    var select = new StringBuilder();
    var selectCount = new StringBuilder();
    co(function *() {
        try{
            select.AppendFormat("SELECT forum.*,user.user_nicename FROM gj_forum forum INNER JOIN gj_user user ON forum.uid=user.uid where 1=1 AND forum.deleted_at IS NULL ");
            selectCount.AppendFormat("SELECT count(forum_id) as count FROM gj_forum forum INNER JOIN gj_user user ON forum.uid=user.uid where 1=1 AND forum.deleted_at IS NULL ");
            if(body.forum_name_form){
                select.AppendFormat(" AND forum.forum_name like '%{0}%' ",body.forum_name_form);
                selectCount.AppendFormat(" AND forum.forum_name like '%{0}%' ",body.forum_name_form);
            }
            if(body.user_nicename){
                select.AppendFormat(" AND user.user_nicename like '%{0}%' ",body.user_nicename);
                selectCount.AppendFormat(" AND user.user_nicename like '%{0}%' ",body.user_nicename);
            }
            if(body.forum_status_form){
                select.AppendFormat(" AND forum.forum_status = {0} ",body.forum_status_form);
                selectCount.AppendFormat(" AND forum.forum_status = {0} ",body.forum_status_form);
            }
            if(body.forum_type_form){
                select.AppendFormat(" AND forum.forum_type = {0} ",body.forum_type_form);
                selectCount.AppendFormat(" AND forum.forum_type = {0} ",body.forum_type_form);
            }
            select.AppendFormat(" ORDER BY forum.created_at DESC LIMIT {0},{1}",options.offset,options.pagesize);
            var count = yield models.sequelize.query(selectCount.ToString(), {type: models.sequelize.QueryTypes.SELECT});//yield表示同步执行
            models.sequelize.query(select.ToString(), {type: models.sequelize.QueryTypes.SELECT})
                .then(function(item) {
                    if(item){
                        var list = item;
                        list.forEach(function (node,index) {
                            node.created_at = moment(node.created_at).format('YYYY-MM-DD HH:mm:ss');
                            node.index = options.offset + index + 1
                            if(node.forum_status == 0){
                                node.forum_status = "关闭"
                            }else {
                                node.forum_status = "开启"
                            }
                            if(node.forum_type == 0){
                                node.forum_type = "先审后发"
                            }else {
                                node.forum_type = "先发后审"
                            }
                        })
                        return response.onSuccess(res, {
                            list: list,
                            pagecount: Math.ceil(count[0].count/ options.pagesize)
                        })
                    }else {
                        return response.onError(res, '没有数据')
                    }
                })
        }catch (err){
            console.log(err)
        }
    })

})

/**
 * 添加论坛
 */
router.post('/add',function (req,res) {
    var body = req.body;
    body.uid=req.session.user.uid;
    body.key = UUID(16,16).toLocaleLowerCase();
    models.Forum.create(body).then(function () {
        response.ApiSuccess(res, {}, '添加成功');
    }, function (err) {
        response.ApiError(res, err);
    })
})
/**
 * 修改论坛
 */
router.post('/update',function (req,res) {
    var body = req.body;
    body.update_uid=req.session.user.uid;
    models.Forum.update(body, {where: {forum_id: body.forum_id}}).then(function () {
        response.ApiSuccess(res, {}, '修改成功');
    }, function (err) {
        response.ApiError(res, err);
    })
})
/**
 * 修改开启关闭状态
 */
router.post('/updateStatus',function (req,res) {
    var body = req.body;
    body.update_uid=req.session.user.uid;
    models.Forum.update({forum_status:body.forum_status,update_uid:body.update_uid,updated_at:new Date()}, {where: {forum_id: body.id}}).then(function () {
        response.ApiSuccess(res, {}, '修改成功');
    }, function (err) {
        response.ApiError(res, err);
    })
})
/**
 * 删除敏感词
 */
router.post('/delete',function (req,res) {
    var body = req.body;
    var id = body.id;
    models.Forum.destroy({
        where: {
            forum_id: id
        }
    }).then(function () {
        response.ApiSuccess(res, {}, '删除成功');
    }, function (err) {
        response.ApiError(res, err);
    })
})
/**
 * 跳转到论坛详情页
 */
router.get('/forum_detail/:id',function (req,res) {
    return res.render('enroll/forum_detail',{
        title:'动态论坛管理详情',
        key:req.param.id
    })
});
/**
 * 根据论坛key获取评论回复列表
 */
router.get('/comment',function (req,res) {
    var body=req.query;
    var options=utils.cms_get_page_options(req);
    if(!body.key){
        return response.onError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            //获取评论总数量
            var sqlCount=new StringBuilder();
            var sourceNameSql = "";
            var end_time;
            var auditStatusSql = "";
            if(body.sourceName){
                sourceNameSql += " AND m.m_name like '%"+body.sourceName + "%'";
            }
            if(body.start_time){
                sourceNameSql += " AND comment.createdAt >= '"+body.start_time + "'";
            }
            if (body.end_time) {
                end_time = body.end_time;
            } else {
                end_time = moment().format('YYYY-MM-DD HH:mm:ss');
            }
            body.end_time=end_time;
            sourceNameSql += " AND comment.createdAt <= '"+body.end_time +"'";
            if(body.audit_status){
                auditStatusSql += " AND comment.audit_status= '"+body.audit_status + "'";
            }
            if(body.reply_status){
                sourceNameSql += " AND comment.reply_status="+body.reply_status;
            }

            sqlCount.AppendFormat("select count(id) as count " +
                "from gj_activity_comment as comment " +
                "INNER JOIN gj_members as m ON m.mid=comment.source " +
                "LEFT JOIN gj_members as m1 ON m1.mid=comment.root " +
                "WHERE comment.key='{0}' and comment.parent='0' " ,body.key);
            sqlCount.Append(sourceNameSql);
            sqlCount.AppendFormat(auditStatusSql);
            var count= yield models.sequelize.query(sqlCount.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
            var commentList = yield getComment(body,0,auditStatusSql);
            body.options=options;
            body.sourceNameSql=sourceNameSql;
            getComment(body,1,auditStatusSql).then(function (item) {
                var len=item.length
                for(var i=0;len>i;i++){
                    if(item[i].audit_status == 0){
                        item[i].audit_status = "未审核";
                    }else if(item[i].audit_status == 1){
                        item[i].audit_status = "审核通过";
                    }else if(item[i].audit_status == 2){
                        item[i].audit_status = "审核未通过";
                    }

                    if(item[i].reply_status == 0){
                        item[i].reply_status = "未回复";
                    }else if(item[i].reply_status == 1){
                        item[i].reply_status = "已回复";
                    }
                    //对评论图片和用户图片的处理
                    item[i].m_pics=str.AbsolutePath(item[i].m_pics)
                    item[i].time=str.getUnixToTime(item[i].time);
                    item[i].pics=item[i].pics?item[i].pics.split(','):[];
                    item[i].count=0//初始化数据，子条数和子项目
                    item[i].item=[]
                    for(var j=0;commentList.length>j;j++){
                        if(item[i].id==commentList[j].parent){
                            item[i].count+=1
                            commentList[j].time=str.getUnixToTime(commentList[j].time)
                            if(commentList[j].audit_status == 0){
                                commentList[j].audit_status = "未审核";
                            }else if(commentList[j].audit_status == 1){
                                commentList[j].audit_status = "审核通过";
                            }else if(commentList[j].audit_status == 2){
                                commentList[j].audit_status = "审核未通过";
                            }
                            item[i].item.unshift(commentList[j])
                        }
                    }
                }
                return response.onSuccess(res,{list:item.filter(function(node) {
                    return node.parent==0;
                }),pagecount: Math.ceil(count[0].count / options.pagesize)});
            }).catch(function (err) {
                console.log(err)
                return response.onError(res,{message:err.toString()})
            })
        }catch (err){
            console.log(err);
        }
    })
})
/**
 * 获取评论列表
 * @param body
 * @param flag
 */
var getComment = (body,flag,auditStatusSql) =>{
    "use strict";
    var options=body.options;
    var sql=new StringBuilder();
    sql.AppendFormat("select comment.root,m.m_name as sourceName,m1.m_name as rootName,m.m_pics,m.m_company as company," +
        "comment.status,comment.audit_status,comment.reply_status,comment.source,comment.content,comment.parent,comment.id,comment.pics,comment.createdAt as time,comment.assist " +
        "from gj_activity_comment as comment " +
        "INNER JOIN gj_members as m ON m.mid=comment.source " +
        "LEFT JOIN gj_members as m1 ON m1.mid=comment.root " +
        "WHERE comment.key='{0}' ",body.key);
    if(body.sourceNameSql){
        sql.Append(body.sourceNameSql);
    }
    if(auditStatusSql){
        sql.Append(auditStatusSql);
    }
    sql.AppendFormat(" ORDER BY comment.parent,comment.createdAt DESC");
    if(flag && options){
        sql.AppendFormat(" LIMIT {0},{1} ",options.offset,options.pagesize);
    }
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
};
/**
 * 审核通过、不通过
 */
router.post('/commentAudit',function (req,res) {
    var body=req.body;
    models.ActivityComment.update(body,{where:{id:body.id}}).then(function () {
        return response.onSuccess(res,{message:'ok'})
    }).catch(function (err) {
        console.log(err)
        return response.onError(res,{message:err.toString()})
    })
})
//后台回复(专员回复)
router.post('/comment/create',function (req,res) {
    var body=req.body;
    models.ActivityComment.create({
        key:body.key,//外键
        content:body.content,//内容
        source:body.mid,//源人员
        root:body.source,
        parent:body.id,
        audit_status:1
    }).then(function () {
        models.ActivityComment.update({reply_status:1},{where:{id:body.id}});
        return response.onSuccess(res,{message:'ok'})
    }).catch(function (err) {
        console.log(err)
        return response.onError(res,{message:err.toString()})
    })
})
/**
 * 更新评论状态
 */
router.post('/comment/update',function (req,res) {
    var body=req.body;
    models.ActivityComment.update(body,{where:{id:body.id}}).then(function () {
        return response.onSuccess(res,{message:'ok'})
    }).catch(function (err) {
        console.log(err)
        return response.onError(res,{message:err.toString()})
    })
})
/**
 * 生成16位UUID
 * @param len
 * @param radix
 * @returns {string}
 * @constructor
 */
function UUID(len, radix) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = [], i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
        // rfc4122, version 4 form
        var r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random()*16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join('');
}
/**
 * 获取导出数据集合
 */
router.get('/comment_export',function (req,res) {
    var body=req.query;
    if(!body.key){
        return response.onError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            //获取评论总数量
            var sourceNameSql = "";
            var end_time;
            var auditStatusSql = "";
            if(body.sourceName){
                sourceNameSql += " AND m.m_name like '%"+body.sourceName + "%'";
            }
            if(body.start_time){
                sourceNameSql += " AND comment.createdAt >= '"+body.start_time + "'";
            }
            if (body.end_time) {
                end_time = body.end_time;
            } else {
                end_time = moment().format('YYYY-MM-DD HH:mm:ss');
            }
            body.end_time=end_time;
            sourceNameSql += " AND comment.createdAt <= '"+body.end_time +"'";
            if(body.audit_status){
                auditStatusSql += " AND comment.audit_status= '"+body.audit_status + "'";
            }
            if(body.reply_status){
                sourceNameSql += " AND comment.reply_status="+body.reply_status;
            }

            var commentList = yield getCommentExport(body,auditStatusSql);
            body.sourceNameSql=sourceNameSql;
            getCommentExport(body,auditStatusSql).then(function (item) {
                var len=item.length
                for(var i=0;len>i;i++){
                    if(item[i].audit_status == 0){
                        item[i].audit_status = "未审核";
                    }else if(item[i].audit_status == 1){
                        item[i].audit_status = "审核通过";
                    }else if(item[i].audit_status == 2){
                        item[i].audit_status = "审核未通过";
                    }

                    if(item[i].reply_status == 0){
                        item[i].reply_status = "未回复";
                    }else if(item[i].reply_status == 1){
                        item[i].reply_status = "已回复";
                    }
                    //对评论图片和用户图片的处理
                    item[i].m_pics=str.AbsolutePath(item[i].m_pics)
                    item[i].time=str.getUnixToTime(item[i].time);
                    item[i].pics=item[i].pics?item[i].pics.split(','):[];
                    item[i].count=0//初始化数据，子条数和子项目
                    item[i].item=[]
                    for(var j=0;commentList.length>j;j++){
                        if(item[i].id==commentList[j].parent){
                            item[i].count+=1
                            commentList[j].time=str.getUnixToTime(commentList[j].time)
                            if(commentList[j].audit_status == 0){
                                commentList[j].audit_status = "未审核";
                            }else if(commentList[j].audit_status == 1){
                                commentList[j].audit_status = "审核通过";
                            }else if(commentList[j].audit_status == 2){
                                commentList[j].audit_status = "审核未通过";
                            }
                            item[i].item.unshift(commentList[j])
                        }
                    }
                }
                return response.onSuccess(res,{exportDataList:item.filter(function(node) {
                    return node.parent==0;
                })});
            }).catch(function (err) {
                console.log(err)
                return response.onError(res,{message:err.toString()})
            })
        }catch (err){
            console.log(err);
        }
    })
})
/**
 * 获取评论列表导出数据
 */
var getCommentExport = (body,auditStatusSql) =>{
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("select comment.root,m.m_name as sourceName,m1.m_name as rootName,m.m_pics,m.m_company as company," +
        "comment.status,comment.audit_status,comment.reply_status,comment.source,comment.content,comment.parent,comment.id,comment.pics,comment.createdAt as time,comment.assist " +
        "from gj_activity_comment as comment " +
        "INNER JOIN gj_members as m ON m.mid=comment.source " +
        "LEFT JOIN gj_members as m1 ON m1.mid=comment.root " +
        "WHERE comment.key='{0}' ",body.key);
    if(body.sourceNameSql){
        sql.Append(body.sourceNameSql);
    }
    if(auditStatusSql){
        sql.Append(auditStatusSql);
    }
    sql.AppendFormat(" ORDER BY comment.parent,comment.createdAt DESC");
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
};
module.exports=router;