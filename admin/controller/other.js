"use strict";
var models = require('../../models');
var config = require('../../config/config');
var moment = require('moment');
var co = require('co');
var response = require('../../utils/response');
var StringBuilder = require('../../utils/StringBuilder');

exports.api_test = function (req, res) {
    return res.render('other/api_test', {
        title: 'api测试',
        info: 'http://127.0.0.1:3000/api-v1.2/'
    });
};
exports.aly_render = function (req, res) {
    return res.render('other/upload', {
        title: '阿里上传文件',
    });
};
exports.trlgml = function (req, res) {
    var body = req.query;
    var sql = new StringBuilder();
    sql.AppendFormat("select (2 * 6378.137* ASIN(SQRT(POW(SIN(PI() * ({1}-classroom_coordinates) / 360), 2)+COS(PI() * {1} / 180)* COS(classroom_coordinates* PI() / 180) * POW(SIN(PI() * ({0}-classroom_longitude) / 360), 2)))) AS distance from gj_classroom ORDER BY distance LIMIT 10", body.long, body.lat);
    models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT}).then(function (item) {
        return response.onSuccess(res, {list: item})
    }, function (err) {
        console.log(err)
    })
};

exports.test = function (req, res) {
    //获取所有特殊的组
    co(function *() {
        try {
            let g = yield models.Group.findAll({
                where: {group_type: {'$in': [5, 6, 7, 10]}},
                attributes: [['groupid', 'id'], ['group_goodid', 'goodsid'], ['group_areaid', 'areaid'], ['group_classroomid', 'classroomid'], ['group_type', 'type']],
                raw: true
            })
            for (let i = 0, len = g.length; i < len; i++) {
                let node = g[i]
                console.log(1)
                let info = yield models.Groupuser.findAll({
                    where: {groupuser_group: node.id},
                    attributes: [['group_classroom', 'classroom'], ['groupuser_user', 'mid']],
                    raw: true
                })
                if (node.type == 5) {//5院长
                    //获取人员信息
                    info.forEach(function (item, index) {
                        let defaults = {
                            classroom: item.classroom,
                            type: 1,
                            member: item.mid
                        }
                        models.branchManage.findOrCreate({
                            where: {
                                classroom: defaults.classroom,
                                type: defaults.type,
                                member: defaults.mid
                            }, defaults: defaults
                        })
                        console.log(defaults)
                    })
                } else if (node.type == 6) {//6教务
                    info.forEach(function (item, index) {
                        let defaults = {
                            classroom: item.classroom,
                            type: 2,
                            member: item.mid
                        }
                        models.branchManage.findOrCreate({
                            where: {
                                classroom: defaults.classroom,
                                type: defaults.type,
                                member: defaults.mid
                            }, defaults: defaults
                        })
                        console.log(defaults)
                    })
                } else if (node.type == 7) {//7班主任
                    info.forEach(function (item, index) {
                        let defaults = {
                            classroom: item.classroom,
                            type: 3,
                            member: item.mid,
                            goods: node.goodsid
                        }
                        models.branchManage.findOrCreate({
                            where: {
                                classroom: defaults.classroom,
                                type: defaults.type,
                                member: defaults.mid
                            }, defaults: defaults
                        })
                        console.log(defaults)
                    })
                } else if (node.type == 10) {//10班级助理
                    info.forEach(function (item, index) {
                        let defaults = {
                            classroom: item.classroom,
                            type: 4,
                            member: item.mid,
                            goods: node.goodsid
                        }
                        models.branchManage.findOrCreate({
                            where: {
                                classroom: defaults.classroom,
                                type: defaults.type,
                                member: defaults.mid
                            }, defaults: defaults
                        })
                        console.log(defaults)
                    })
                }
            }
            return response.onSuccess(res, {result: g})
        } catch (err) {
            console.log(err)
        }
    })
    return
    co(function*() {//北京总院到北京总院
        try {
            var g = yield models.Groupuser.findAndCountAll({where: {groupuser_group: {'$in': [8160826172636849, 4160826172907186]}}});
            var arr = []
            g.rows.forEach(function (node, index) {
                if (arr.indexOf(node.groupuser_user) == -1) {
                    arr.push(node.groupuser_user)
                }
            })
            var m = yield models.Members.update({m_type: 10}, {where: {mid: {'$in': arr}}})
            models.Groupuser.destroy({where: {groupuser_group: {'$in': [8160826172636849, 4160826172907186]}}});
            models.Groupuser.destroy({
                where: {
                    groupuser_group: {'$in': [1160826165010816, 2160826162845744]},
                    groupuser_user: {'$in': arr}
                }
            });
            models.Group.destroy({where: {groupid: {'$in': [8160826172636849, 4160826172907186]}}});
            return res.send('完成')
        } catch (err) {
            console.log(err)
        }
    })
    return
    co(function*() {//通过用户id获取身份
        try {
            var b = yield models.Area.getGropuGoode({userid: body.mid});
            b.forEach(function (node, index) {
                if (node.group_type == 5) {
                    node.shenfen = '院长'
                } else if (node.group_type == 6) {
                    node.shenfen = '副院长'
                } else if (node.group_type == 7) {
                    node.shenfen = '班主任'
                } else if (node.group_type == 8) {
                    node.shenfen = '运营'
                } else if (node.group_type == 10) {
                    node.shenfen = '班级助理'
                }
            })
            return response.onDataSuccess(res, {data: {b: b}})
        } catch (err) {
            console.log(err)
        }

    })
};

exports.table = function (req,res) {
    var body=req.query;
    var where={}
    if (body.id){
        where.uc_goodsid=body.id;
    };
    models.Userclass.findAll({
        where:where,
        order:[['createdAt', 'DESC']],
        attributes:['uc_userphone','createdAt','uc_calssroomname'],
        include:[{
            model:models.Members,
            attributes:['m_name','m_position','m_company']
        },{
            model:models.Goods,
            attributes:['goods_name']
        }]
    }).then(function(list){
        var nodeExcel = require('excel-export');
        var conf = {};
        conf.cols = [
            { caption: '姓名', type: 'string',width: 240},
            { caption: '手机号码', type: 'string' , width: 240},
            { caption: '公司 ', type: 'string',width: 240},
            { caption: '职位', type: 'string',width: 240},
            { caption: '报名课程', type: 'string',width: 240},
            { caption: '报名分院', type: 'string',width: 240},
            { caption: '报名时间', type: 'string',width: 240},
        ];
        conf.rows = [];
        list.forEach( function(node, index) {
            var rows = [];
            var node=node.dataValues;
            rows.push(node.Member.dataValues.m_name);
            rows.push(node.uc_userphone);
            rows.push(node.Member.dataValues.m_company);
            rows.push(node.Member.dataValues.m_position);
            rows.push(node.Good.dataValues.goods_name);
            rows.push(node.uc_calssroomname);
            rows.push(moment(node.createdAt).format('YYYY-MM-DD'));
            conf.rows.push(rows);
        });
        var result = nodeExcel.execute(conf);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + moment().format('YYYYMMDDHHmmss') + ".xlsx");
        res.end(result, 'binary');
    }, function(err){
        console.log(err)
    });
}
