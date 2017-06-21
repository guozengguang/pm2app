"use strict";

var models = require('../../models');
var config = require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var str = require('../../utils/str');
var utils = require('../../utils/page');
var Sequelize = require('sequelize');
var database = require(process.cwd() + '/database');
var co = require('co');
var Logs = require("../controller/logs");
var request = require('request');
var _ = require('lodash');
var StringBuilder = require('../../utils/StringBuilder');
//媒资
exports.media = function (req, res) {
    return res.render('media/list', {
        title: '媒资列表'
    });
};

/*start*/
//媒资列表ajax接口
exports.media_single_list = function (req, res) {
    var options = utils.cms_get_page_options(req);
    var body = req.query;
    console.log(body,'body');
    var mediaCMStatusSql;
    if(!body.cm_status || body.cm_status == 3){
        mediaCMStatusSql = "AND gjcolumnmedia.cm_status != 2 ";
    }else {
        mediaCMStatusSql = "AND gjcolumnmedia.cm_status=" + body.cm_status;
    }
    var where = {
        media_status: 3
    };
    var mediaTitleSql;
    var columnidSql;
    if (body.media_title) {
        // where.media_title = {'$like': '%' + body.media_title + '%'}
        mediaTitleSql = "AND gjmedia.media_title like '%" + body.media_title +"%'";
    }else {
        mediaTitleSql = '';
    }

    if(body.columnid){
        columnidSql = 'AND gjcolumnmedia.cm_columnid='+body.columnid;
    }else {
        columnidSql = '';
    }

    //gzg start
    co(function*(){
        try{
            var sql = new StringBuilder();
            sql.AppendFormat("SELECT COUNT(gjmedia.mediaid) as count FROM gj_media gjmedia "
                + " WHERE gjmedia.media_status != {0} " + mediaTitleSql,where.media_status);
            var count = yield models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT});//yield表示同步执行
            var sql = new StringBuilder();
            sql.AppendFormat("SELECT * FROM gj_media gjmedia  "
                + "WHERE gjmedia.media_status != {0} " + mediaTitleSql
                + " ORDER BY gjmedia.createdAt DESC LIMIT {1},{2}",where.media_status,options.offset,options.pagesize);
            models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT})
                .then(function(item) {
                    if (item) {
                        var list = item;
                        list.forEach(function (node, index) {
                            if(node.media_type == 1){
                                node.media_type = '视频媒资';
                            }else if(node.media_type == 2){
                                node.media_type = '轮播广告';
                            }else {
                                node.media_type = '内容媒资';
                            }

                            if(node.cm_status == 0){
                                node.cm_status = '未上架';
                                node.buttonName = '上架';
                            }else if(node.cm_status == 1){
                                node.cm_status = '已上架';
                                node.buttonName = '下架';
                            }
                            node.media_pushtime = moment(node.media_pushtime).format('YYYY-MM-DD');
                            node.index = options.offset + index + 1
                        });
                        return response.onSuccess(res, {
                            list: list,
                            pagecount: Math.ceil(count[0].count/ options.pagesize)
                        })
                    } else {
                        return response.onError(res, '没有数据')
                    }
                })
        }catch (err){
            console.log(err)
        }
    })
    //gzg end
};
/*end*/

//媒资上下架列表ajx接口
exports.media_list = function (req, res) {
    var options = utils.cms_get_page_options(req);
    var body = req.query;
    var mediaCMStatusSql;
    if(!body.cm_status || body.cm_status == 3){
        mediaCMStatusSql = "AND gjcolumnmedia.cm_status != 2 ";
    }else {
        mediaCMStatusSql = "AND gjcolumnmedia.cm_status=" + body.cm_status;
    }
    var where = {
        media_status: 3
    };
    var mediaTitleSql;
    var columnidSql;
    if (body.media_title) {
        // where.media_title = {'$like': '%' + body.media_title + '%'}
        mediaTitleSql = "AND gjmedia.media_title like '%" + body.media_title +"%'";
    }else {
        mediaTitleSql = '';
    }

    if(body.columnid){
        columnidSql = 'AND gjcolumnmedia.cm_columnid='+body.columnid;
    }else {
        columnidSql = '';
    }

    //gzg start
    co(function*(){
        try{
            var sql = new StringBuilder();
            sql.AppendFormat("SELECT COUNT(gjcolumnmedia.cmid) as count FROM gj_columnmedia gjcolumnmedia "
                + "INNER JOIN gj_media gjmedia ON gjcolumnmedia.cm_mediaid=gjmedia.mediaid "
                + "INNER JOIN gj_column gjcolumn ON gjcolumnmedia.cm_columnid=gjcolumn.columnid "
                + "WHERE gjmedia.media_status != {0} " + mediaCMStatusSql + " AND gjcolumn.column_status != 3 and gjcolumnmedia.deletedAt IS NULL " + mediaTitleSql + columnidSql,where.media_status);
            var count = yield models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT});//yield表示同步执行
            var sql = new StringBuilder();
            sql.AppendFormat("SELECT gjmedia.*,gjcolumnmedia.cm_status,gjcolumnmedia.cmid FROM gj_columnmedia gjcolumnmedia "
                + "INNER JOIN gj_media gjmedia ON gjcolumnmedia.cm_mediaid=gjmedia.mediaid "
                + "INNER JOIN gj_column gjcolumn ON gjcolumnmedia.cm_columnid=gjcolumn.columnid "
                + "WHERE gjmedia.media_status != {0} "+ mediaCMStatusSql + " AND gjcolumn.column_status != 3 and gjcolumnmedia.deletedAt IS NULL " + mediaTitleSql + columnidSql
                + " ORDER BY gjmedia.media_pushtime DESC,gjcolumnmedia.cm_status DESC LIMIT {1},{2}",where.media_status,options.offset,options.pagesize);
            models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT})
                .then(function(item) {
                    if (item) {
                        var list = item;
                        list.forEach(function (node, index) {
                            if(node.media_type == 1){
                                node.media_type = '视频媒资';
                            }else if(node.media_type == 2){
                                node.media_type = '轮播广告';
                            }else {
                                node.media_type = '内容媒资';
                            }

                            if(node.cm_status == 0){
                                node.cm_status = '未上架';
                                node.buttonName = '上架';
                            }else if(node.cm_status == 1){
                                node.cm_status = '已上架';
                                node.buttonName = '下架';
                            }
                            node.media_pushtime = moment(node.media_pushtime).format('YYYY-MM-DD');
                            node.index = options.offset + index + 1
                        });
                        return response.onSuccess(res, {
                            list: list,
                            pagecount: Math.ceil(count[0].count/ options.pagesize)
                        })
                    } else {
                        return response.onError(res, '没有数据')
                    }
                })
        }catch (err){
            console.log(err)
        }
    })
    //gzg end
};
exports.media_add = function (req, res) {
    co(function*(){
        try{
            models.Column.findAll({
                where:{column_status:0},
                attribute: ['column_title', 'columnid', 'column_path']
            }).then(function (item) {
                var item = recursive_list(item, [], 0)
                return res.render('media/media_add', {
                    title: '新建媒资',
                    item: item ? item : []
                })
            }, function (err) {
                console.log(err)
            })
        }catch (err){
            console.log(err)
        }
    })
};
exports.media_edit = function (req, res) {
    var body = req.query;
    models.Media.findOne({
        where: {
            mediaid: body.mediaid
        },
        raw: true
    }).then(function (item) {
        if (item) {
            item.media_pushtime = str.getUnixToTime(item.media_pushtime);
            item.media_video = str.AbsoluteVideoPath(item.media_video);
            return res.render('media/media_edit', {
                title: '修改媒资',
                item: item,
                aly: config.aly
            })
        }
    }, function (err) {
        console.log(err)
    })
};
exports.media_create = function (req, res) {
    var body = req.body;
    var cloumnmedia = {}; // video
    cloumnmedia.cm_columnid = body.media_columnid;

    models.Media.create(body).then(function (item) {
        Logs.logsSave({
            lg_content: "新建媒资【" + body.media_title + "】",
            lg_ip: req.ip,
            uid: req.session.user.uid
        });
        if (item) {
            cloumnmedia.cm_mediaid = item.mediaid;
            models.Columnmedia.create(cloumnmedia);
            return response.onSuccess(res, {message: '创建成功'})
        }

    }, function (err) {
        console.log(err)
    })
};
exports.media_update = function (req, res) {
    var body = req.body;
    var mediaid = body.mediaid;
    console.log('media_update',mediaid);
    delete body.mediaid;
    models.Media.update(body, {where: {mediaid: mediaid}}).then(function () {
        Logs.logsSave({
            lg_content: "修改媒资【" + body.media_title + "】",
            lg_ip: req.ip,
            uid: req.session.user.uid
        });
        return response.onSuccess(res, {message: '操作成功'});
    }, function (err) {
        console.log(err)
    });
};


exports.online = function (req, res) {
    var body = req.body;
    var flag = body.flag;
    if(!body.id){
        response.ApiError(res,'参数有误');
    }
    var message;
    if(flag == 1){
        message = '上架成功';
    }else{
        message = '下架成功';
    }
    //更改关联表上架状态
    models.Columnmedia.update({cm_status:body.flag},{where:{cmid:body.id}}).then(function () {
        response.ApiSuccess(res,{},message);
    },function (err) {
        console.log(err);
        response.ApiError(res,'数据错误');
    });
};

//栏目
exports.column = function (req, res) {
    return res.render('media/column/list', {
        title: '栏目列表',
    });
};
exports.column_list = function (req, res) {
    var where = {
        column_status: {
            $ne: 3
        }
    };
    models.Column.findAndCountAll({
        where: where,
    }).then(function (item) {
        if (item) {
            var list = item.rows;
            list = recursive_list(list, [], 0);
            return response.onSuccess(res, {
                list: list
            })
        } else {
            return response.onError(res, '没有数据')
        }
    }, function (err) {
        console.log(err)
    });
};
exports.column_add = function (req, res) {
    models.Column.findAll({
        where:{column_status:0},
        attribute: ['column_title', 'columnid', 'column_path']
    }).then(function (item) {
        item = recursive_list(item, [], 0)
        return res.render('media/column/column_add', {
            title: '新建栏目',
            item: item ? item : []
        })
    }, function (err) {
        console.log(err)
    })
};
exports.column_edit = function (req, res) {
    var body = req.query;
    var where = {};
    where.columnid = body.id;
    models.Column.findOne({
        where: where,
        raw: true
    }).then(function (columnitem) {
        //var column_title = columnitem.column_title
        if (columnitem) {
            models.Column.findAll({
                where:{column_status:{'$ne':3}},
                attribute: ['column_title', 'columnid', 'column_path','column_indexes']
            }).then(function (item) {
                item = recursive_list(item, [], 0);
                return res.render('media/column/column_edit', {
                    title: '编辑栏目',
                    item: item ? item : [],
                    columnitem: columnitem
                })
            }, function (err) {
                console.log(err)
            })
        }
    }, function (err) {
        console.log(err)
    })


};
exports.column_create = function (req, res) {
    var body = req.body;
    if (body.column_path) {
        body.column_level = body.column_path.split(',').length
    }
    models.Column.create(body).then(function () {
        Logs.logsSave({
            lg_content: "新建栏目【" + body.column_title + "】",
            lg_ip: req.ip,
            uid: req.session.user.uid
        });
        return response.onSuccess(res, {message: '创建成功'})
    }, function (err) {
        console.log(err)
    })
};
exports.column_update = function (req, res) {
    var body = req.body;
    var columnid = body.columnid;
    console.log(body)
    delete body.columnid;
    models.Column.update(body, {where: {columnid: columnid}}).then(function () {
        Logs.logsSave({
            lg_content: "修改栏目【" + body.column_title + "】",
            lg_ip: req.ip,
            uid: req.session.user.uid
        });
        return response.onSuccess(res, {message: '操作成功'});
    }, function (err) {
        console.log(err)
    });
};

function recursive_list(models, json, pid) {
    models.forEach(function (node, i) {
        if (node != null) {
            var node = node.dataValues;
            if (node.column_path == pid) {
                json.push(node);
                recursive_list(models, json, node.column_path + ',' + node.columnid);
            }
        }
    });
    return json;
}
