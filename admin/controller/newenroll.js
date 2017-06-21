var models = require('../../models');
var config = require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var request = require('request');
var hx = require('../../utils/hxchat');
var str = require('../../utils/str');
var utils = require('../../utils/page');
var co = require('co');
var fs = require('fs');
var multer = require('multer');
var OSS = require('ali-oss');
var Logs = require("../controller/logs");
var path = require('path');
var seque = require('../../utils/sequelizeQuery');
var ALY = require('../../utils/aly/util');
var StringBuilder = require('../../utils/StringBuilder');


//报名列表
exports.enroll_list = function (req, res) {
    var options = utils.cms_get_page_options(req);
    var body = req.query;
    var where = {};
    var sql = new StringBuilder();
    var sqlCount = new StringBuilder();
    sql.AppendFormat("SELECT newenroll.*,u.user_nicename FROM gj_new_enroll newenroll");
    sql.AppendFormat(" LEFT JOIN gj_user u ON newenroll.creater=u.uid where 1=1 ");

    sqlCount.AppendFormat("SELECT COUNT(*) as count FROM gj_new_enroll newenroll LEFT JOIN gj_user u ON newenroll.creater=u.uid where 1=1 ");
    if (body.creater) {
        sql.AppendFormat(" and u.user_nicename like '%{0}%' ", body.creater);
        sqlCount.AppendFormat(" and u.user_nicename like '%{0}%' ", body.creater);
    }
    if (body.jz_name) {
        sql.AppendFormat(" and newenroll.jz_name like '%{0}%' ", body.jz_name);
        sqlCount.AppendFormat(" and newenroll.jz_name like '%{0}%' ", body.jz_name);
    }
    if(body.project_type){
        sql.AppendFormat(" and newenroll.project_type = {0} ", body.project_type);
        sqlCount.AppendFormat(" and newenroll.project_type = {0} ", body.project_type);
        if(body.project_type != "2" && body.course_name){
            sql.AppendFormat(" and newenroll.course_name = {0} ", body.course_name);
            sqlCount.AppendFormat(" and newenroll.course_name = {0} ", body.course_name);
        }
    }
    // if (body.course_name) {
    //     sql.AppendFormat(" and newenroll.course_name = {0} ", body.course_name);
    //     sqlCount.AppendFormat(" and newenroll.course_name = {0} ", body.course_name);
    // }
    sql.AppendFormat(" order by newenroll.create_date desc limit {0},{1}", options.offset, options.pagesize);
    co(function *() {
        var count = yield models.sequelize.query(sqlCount.ToString(), {
            type: models.sequelize.QueryTypes.SELECT,
            raw: true
        });
        models.sequelize.query(sql.ToString(), {
            type: models.sequelize.QueryTypes.SELECT,
            raw: true
        }).then(function (result) {
            result.forEach(function (node,index) {
                node.index = options.offset + index + 1
                node.create_date = moment(node.create_date).format('YYYY-MM-DD HH:mm:ss');
                node.update_date = moment(node.update_date).format('YYYY-MM-DD HH:mm:ss');
            })
            return response.onSuccess(res, {list: result, pagecount: Math.ceil(count[0].count / options.pagesize)});
        })
        // models.NewEnroll.findAndCountAll({
        //     where: where,
        //     order: [['create_date', 'DESC']],
        //     limit: options.pagesize,
        //     offset: options.offset
        // }).then(function (item) {
        //     if (item) {
        //         var resultItem = item.rows;//过滤后的值
        //         return response.onSuccess(res, {
        //             list: resultItem,
        //             pagecount: Math.ceil(item.count / options.pagesize)
        //         })
        //     } else {
        //         return response.onError(res, '没有数据')
        //     }
        // }, function (err) {
        //     console.log(err);
        // });
    })
};


//上架下架
exports.upordown_enroll = function (req, res) {
    //post方式
    var body = req.body;
    var index = body["index"];//序号
    var status = body["status"];//状态
    var sqlStr = new StringBuilder();
    if (status == "0") {
        sqlStr.AppendFormat("update gj_new_enroll set enroll_status = 1 where newenroll_id='{0}'", body.index);
    } else {
        sqlStr.AppendFormat("update gj_new_enroll set enroll_status = 0 where newenroll_id='{0}'", body.index);
    }
    models.sequelize.query(sqlStr.ToString(), {type: models.sequelize.QueryTypes.UPDATE}).then(function (item) {
        return response.onSuccess(res, {message: "更新成功"});
    }).catch(function (err) {
        console.log(err);
        return response.onError(res, '错误');
    })
};

//删除
exports.delete_enroll = function (req, res) {
    //post方式
    var body = req.body;
    var optionArr = body["deleStr"].split('$');
    var resultArrStr = "";
    for (i = 0; i < optionArr.length - 1; i++) {
        resultArrStr += ("'" + optionArr[i] + "'" + ",");
    }
    resultArrStr = resultArrStr.substring(0, resultArrStr.length - 1);
    var sqlStr = new StringBuilder();
    sqlStr.AppendFormat("delete from gj_new_enroll where newenroll_id in({0})", resultArrStr);

    models.sequelize.query(sqlStr.ToString(), {type: models.sequelize.QueryTypes.DELETE}).then(function (item) {
        return response.onSuccess(res, {message: "删除成功"});
    }).catch(function (err) {
        return response.onError(res, "错误");
    });
};
//添加报名
exports.newenroll_add = function (req, res) {
    var body = req.query;
    return res.render('newenroll/newenroll_add', {
        title: '添加报名'
    })
};

//添加报名模板
exports.template_add = function (req, res) {
    var body = req.query;
    return res.render('newenroll/template_add', {
        title: "添加报名模板"
    })
};
//查看模板明细
exports.template_detaillist = function (req, res) {
    var body = req.query;
    return res.render('newenroll/template_detaillist', {
        title: "模板明细页"
    })
}
//编辑
exports.newenroll_edit = function (req, res) {
    var body = req.query;
    var where = {newenroll_id: body.id};
    models.NewEnroll.findOne({
        where: where,
    }).then(function (item) {
        if (item) {
            //对展现在页面的数据进行一些处理
            console.log(item.dataValues.course_end_time)
            item.dataValues.apply_begin_time = item.dataValues.apply_begin_time == 'Invalid Date'?'':str.getUnixToTime(item.dataValues.apply_begin_time);
            item.dataValues.apply_end_time = item.dataValues.apply_end_time == 'Invalid Date'?'':str.getUnixToTime(item.dataValues.apply_end_time);
            item.dataValues.course_begin_time = item.dataValues.course_begin_time == 'Invalid Date'?'':str.getUnixToTime(item.dataValues.course_begin_time);
            item.dataValues.course_end_time = item.dataValues.course_end_time == 'Invalid Date'?'':str.getUnixToTime(item.dataValues.course_end_time);

            //身份限制

            if (item.apply_identity.indexOf("学员") > -1) {
                item.XueYuan = "学员";
            }
            if (item.apply_identity.indexOf("用户") > -1) {
                item.YongHu = "用户";
            }
            if (item.apply_identity.indexOf("游客") > -1) {
                item.YouKe = "游客";
            }
            //课程限制
            if (item.course_identity.indexOf("课程1") > -1) {
                item.courseOne = "课程1";
            }
            if (item.course_identity.indexOf("课程2") > -1) {
                item.courseTwo = "课程2";
            }
            if (item.course_identity.indexOf("课程3") > -1) {
                item.courseThree = "课程3";
            }
            if (item.course_identity.indexOf("课程4") > -1) {
                item.courseFour = "课程4";
            }

            item.id = req.query.id;
            if(!item.apply_count){
                item.apply_count="";
            }
            if(!item.course_charge){
                item.course_charge="";
            }
            // console.log(item, 'item')
            if(!item.success_longitude){
                item.success_longitude=""
            }
            if(!item.success_latitude){
                item.success_latitude=""
            }
            return res.render("newenroll/newenroll_edit", {
                title: "修改报名",
                list: item
            })
        } else {
            return response.onError(res, '没有数据')
        }
    }, function (err) {
        console.log(err);
    });

};

//生成UUID
function getUUID() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);

    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}

//执行添加操作
exports.newenroll_create = function (req, res) {
    var activityUrl = "http://dev.geju.com/admin/hotel/activity/newenroll/update_newenroll";
    var body = req.body;
    var newUUID = getUUID();
    body.newenroll_id = newUUID;

    //是否在报名页显示
    if (body.isshow_in_applypage == "on") {
        body.isshow_in_applypage = "1";
    } else {
        body.isshow_in_applypage = "0";
    }

    body.creater = req.session.user.uid;
    models.NewEnroll.create(body).then(function (item) {
        console.log(body,'body')
        // console.log(body.project_type == '1')
        // console.log(req.session.user,'user')
        if (body.project_type == '1') {
            console.log(activityUrl, 'activityUrl')
            console.log({id: body.activity_id, newenroll_id: body.newenroll_id})
            request.post({
                url: activityUrl,
                form: {id: body.activity_id, newenroll_id: body.newenroll_id}
            }, function optionalCallback(err, httpResponse, body) {
                console.log(err);
                console.log(body)
                if (!err) {
                    // return response.onSuccess(res, {message: '操作成功'});
                }
            });
        }
        return response.onSuccess(res, {message: '操作成功'});
    }, function (err) {
        console.log(err);
        return response.onError(res, {message: err.errors[0].message});
    })
};
//执行更新操作
exports.newenroll_update = function (req, res) {
    var activityUrl = "http://dev.geju.com/admin/hotel/activity/newenroll/update_newenroll";
    var body = req.body;
    var where = {newenroll_id: body.newenroll_id};

    //是否在报名页显示
    if (body.isshow_in_applypage == "on") {
        body.isshow_in_applypage = "1";
    } else {
        body.isshow_in_applypage = "0";
    }

    //此时是checkbox不勾选的时候
    if (body.is_reuse_template == undefined) {
        body.is_reuse_template = "0";
    }

    if (body.apply_identity != undefined && Object.prototype.toString.call(body.apply_identity) === '[object Array]') {
        body.apply_identity = body.apply_identity.join(',');
    }
    if (body.course_identity != undefined && Object.prototype.toString.call(body.course_identity) === '[object Array]') {
        body.course_identity = body.course_identity.join(',');
    }

    body.updater = req.session.user.uid;
    models.NewEnroll.update(body, {
        where: where
    }).then(function (item) {
        if (body.project_type == '1') {
            console.log(activityUrl, 'activityUrl')
            console.log({id:body.activity_id, newenroll_id: body.newenroll_id})
            request.post({
                url: activityUrl,
                form: {id: body.activity_id, newenroll_id: body.newenroll_id}
            }, function optionalCallback(err, httpResponse, body) {
                console.log(err);
                console.log(body)
                if (!err) {
                    // return response.onSuccess(res, {message: '操作成功'});
                }
            });
        }
        return response.onSuccess(res, {message: '操作成功'});
    }, function (err) {
        console.log(err);
        return response.onError(res, {message: err.errors[0].message});
    })
};

//复制模板
exports.template_copy = function (req, res) {
    var body = req.query;
    var id = body.id;
    var where = {id: body.id};

    co(function*() {
        try {

            var firstLevelResult = yield models.Apply_Template.findOne({where: where});

            var finalResult = {
                "createdAt": firstLevelResult.createdAt,
                "deletedAt": firstLevelResult.deletedAt,
                "updatedAt": firstLevelResult.updatedAt,
                "imgcount": firstLevelResult.imgcount,
                "level": firstLevelResult.level,
                "method": firstLevelResult.method,
                "name": firstLevelResult.name + "(复制模板)",
                "operator": firstLevelResult.operator,
                "parent": firstLevelResult.parent,
                "property": firstLevelResult.property,
                "score": firstLevelResult.score,
                "sort": firstLevelResult.sort,
                "status": firstLevelResult.status,
                "type": firstLevelResult.type
            };

            //复制第一级的返回值
            var returnFirstLevelValue = yield models.Apply_Template.create(finalResult);

            //找出原第二级的
            var secondLevelValue = yield models.Apply_Template.findAll({where: {level: 2, parent: id}});

            if (secondLevelValue.length > 0) {
                secondLevelValue.forEach(function (node, index) {
                    var node = node.dataValues;
                    var thisResult = {
                        "createdAt": node.createdAt,
                        "deletedAt": node.deletedAt,
                        "updatedAt": node.updatedAt,
                        "imgcount": node.imgcount,
                        "level": node.level,
                        "method": node.method,
                        "name": node.name,
                        "operator": node.operator,
                        "parent": returnFirstLevelValue.id,
                        "property": node.property,
                        "score": node.score,
                        "sort": node.sort,
                        "status": node.status,
                        "type": node.type
                    };

                    models.Apply_Template.create(thisResult).then(function (nodeTwo) {
                        models.Apply_Template.findAll({
                            where: {
                                level: 3,
                                parent: id + "," + node.id
                            }
                        }).then(function (thirdLevelValue) {
                            if (thirdLevelValue.length > 0) {
                                thirdLevelValue.forEach(function (node, index) {
                                    var thisNode = node.dataValues;
                                    //组合第三级数据
                                    var resDic = {
                                        "createdAt": thisNode.createdAt,
                                        "deletedAt": thisNode.deletedAt,
                                        "updatedAt": thisNode.updatedAt,
                                        "imgcount": thisNode.imgcount,
                                        "level": 3,
                                        "method": thisNode.method,
                                        "name": thisNode.name,
                                        "operator": thisNode.operator,
                                        "parent": returnFirstLevelValue.id + "," + nodeTwo.id,
                                        "property": thisNode.property,
                                        "score": thisNode.score,
                                        "sort": thisNode.sort,
                                        "status": thisNode.status,
                                        "type": thisNode.type
                                    };
                                    models.Apply_Template.create(resDic);
                                })
                            }
                        });
                    });
                })
            }

            return response.onSuccess(res, {returnId: returnFirstLevelValue.id});

        } catch (err) {
            console.log(err);
        }
    });
};
