/**
 * Created by Administrator on 2016/10/13 0013.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var Filter = require(process.cwd() + '/utils/filter');
var _ = require('lodash');
var moment = require('moment');

var map = {
    used: 'gj_enroll_lesson.enroll_use = "',//用途
    lesson_alias: 'gj_enroll_lesson.lesson_alias = "',//课程别名
    lesson_name: 'gj_goods.goods_name = "', //课程名称
    branch_name: 'gj_enroll_user_class.en_classroomid = "',//分院名称
    name: 'gj_members.m_name LIKE "',//姓名
    phone: 'gj_members.m_phone LIKE "',//手机号
    reference: 'gj_members.m_reference_phone LIKE "'//推荐人
};
router.all(Filter.authorize);
router.get('/', function (req, res) {
    var branch = req.session.user.user_branch;
    var count_select = 'SELECT COUNT(gj_enroll_user_class.en_uid) ' +
        'FROM gj_enroll_user_class ' +
        'INNER JOIN gj_enroll_lesson ON gj_enroll_user_class.en_key_name = gj_enroll_lesson.lesson_id ' +
        'LEFT JOIN gj_members ON gj_enroll_user_class.en_mid = gj_members.mid ' +
        'LEFT JOIN gj_classroom ON gj_enroll_user_class.en_classroomid = gj_classroom.classroom ' +
        'LEFT JOIN gj_goods ON gj_enroll_lesson.lesson_name = gj_goods.goodsid WHERE gj_enroll_user_class.en_form = 1 ';
    var query = req.query;
    var type = query.type;
    var page = query.page || 0;
    var size = query.size || 12;
    var filter = query.filter;
    if(filter && filter.phone){
        filter.phone = '%' + filter.phone + '%';
    }
    if(filter && filter.name){
        filter.name = '%' + filter.name + '%';
    }
    if(filter && filter.reference){
        filter.reference = '%' + filter.reference + '%';
    }
    var c_select = count_select;
    var select = 'SELECT gj_enroll_user_class.en_uid AS id, ' +
        'gj_members.m_city AS city, ' +
        'gj_members.m_area AS province, ' +
        'gj_members.m_name AS name, ' +
        'gj_members.m_phone AS phone, ' +
        'gj_members.m_company AS enterprise, ' +
        'gj_members.m_position AS position, ' +
        'gj_enroll_user_class.createdAt AS createdAt, ' +
        'gj_members.m_reference_phone AS reference, ' +
        'gj_enroll_lesson.lesson_alias AS lesson_alias, ' +
        'gj_enroll_lesson.enroll_use AS used, ' +
        'gj_goods.goods_name AS lesson_name, ' +
        'gj_classroom.classroom_name AS branch ' +
        'FROM gj_enroll_user_class ' +
        'INNER JOIN gj_enroll_lesson ON gj_enroll_user_class.en_key_name = gj_enroll_lesson.lesson_id ' +
        'LEFT JOIN gj_members ON gj_enroll_user_class.en_mid = gj_members.mid ' +
        'LEFT JOIN gj_classroom ON gj_enroll_user_class.en_classroomid = gj_classroom.classroom ' +
        'LEFT JOIN gj_goods ON gj_enroll_lesson.lesson_name = gj_goods.goodsid WHERE gj_enroll_user_class.en_form = 1 ';
    _.forIn(filter, function (value, key) {
        if(value){
            select += 'AND ' + map[key] + value + '" ';
            c_select += 'AND ' + map[key] + value + '" ';
        }
    });
    select += 'AND gj_enroll_lesson.type = ' + type + ' ';
    c_select += 'AND gj_enroll_lesson.type = ' + type + ' ';
    if(branch !== 0){
        c_select += 'AND gj_classroom.classroom = ' + branch + ' ';
        select += 'AND gj_classroom.classroom = ' + branch + ' ';
    }
    models.sequelize.query(c_select, {
        type: models.sequelize.QueryTypes.SELECT,
        raw: true,
        plain:true
    }).then(function (count) {
        if(page){
            page = Number(page) - 1;
        }
        select += 'ORDER BY gj_enroll_user_class.en_uid DESC LIMIT '+ (page * 12) +' , '+ size +' ';
        models.sequelize.query(select, {
            type: models.sequelize.QueryTypes.SELECT,
            raw: true
        }).then(function (result) {
            if (!_.isArray(result)) {
                result = [result]
            }
            response.ApiSuccess(res, {list: result ,count: count ? count['COUNT(gj_enroll_user_class.en_uid)']: 0 }, '获取成功')
        }, function (err) {
            console.log(err);
            return response.ApiError(res, {}, err.message);
        });
    }, function (err) {
        console.log(err);
        return response.ApiError(res, {}, err.message);
    });
});

var tHead = '<thead><tr>' +
    '<td>序号</td>' +
    '<td>姓名</td>' +
    '<td>手机号码</td>' +
    '<td>企业名称</td>' +
    '<td>职位</td>' +
    '<td>报名日期</td>' +
    '<td>报名课程</td>' +
    '<td>用途</td>' +
    '<td>分院</td>' +
    '<td>城市</td>' +
    '<td>推荐人</td>' +
    '</tr></thead>';
router.get('/excel', function (req, res) {
    var query = req.query;
    var branch = req.session.user.user_branch;
    var filter = query.filter;
    if(filter && filter.phone){
        filter.phone = '%' + filter.phone + '%';
    }
    var select = 'SELECT gj_enroll_user_class.en_uid AS id, ' +
        'gj_members.m_city AS city, ' +
        'gj_members.m_area AS province, ' +
        'gj_members.m_name AS name, ' +
        'gj_members.m_phone AS phone, ' +
        'gj_members.m_company AS enterprise, ' +
        'gj_members.m_position AS position, ' +
        'gj_enroll_user_class.createdAt AS createdAt, ' +
        'gj_members.m_reference_phone AS reference, ' +
        'gj_enroll_lesson.lesson_alias AS lesson_alias, ' +
        'gj_enroll_lesson.enroll_use AS used, ' +
        'gj_goods.goods_name AS lesson_name, ' +
        'gj_classroom.classroom_name AS branch ' +
        'FROM gj_enroll_user_class ' +
        'INNER JOIN gj_enroll_lesson ON gj_enroll_user_class.en_key_name = gj_enroll_lesson.lesson_id ' +
        'LEFT JOIN gj_members ON gj_enroll_user_class.en_mid = gj_members.mid ' +
        'LEFT JOIN gj_classroom ON gj_enroll_user_class.en_classroomid = gj_classroom.classroom ' +
        'LEFT JOIN gj_goods ON gj_enroll_lesson.lesson_name = gj_goods.goodsid WHERE gj_enroll_user_class.en_form = 1 ';
    _.forIn(filter, function (value, key) {
        if(value){
            select += 'AND ' + map[key] + value + '" ';
        }
    });
    if(branch !== 0){
        select += 'AND gj_classroom.classroom = ' + branch + ' ';
    }
    select += 'ORDER BY gj_enroll_user_class.en_uid DESC;';
    models.sequelize.query(select, {
        type: models.sequelize.QueryTypes.SELECT,
        raw: true
    }).then(function (result) {
        if (!_.isArray(result)) {
            result = [result]
        }
        var tBody = '<tbody>';
        result.forEach(function (v, i) {
            tBody += '<tr>' +
                '<td>' + v.id + '</td>' +
                '<td>' + v.name + '</td>' +
                '<td>' + v.phone + '</td>' +
                '<td>' + v.enterprise + '</td>' +
                '<td>' + v.position + '</td>' +
                '<td>' + moment(v.createdAt).format('YYYY年MM月DD日 hh:mm') + '</td>' +
                '<td>' + (v.lesson_name || v.lesson_alias || '') + '</td>' +
                '<td>' + (v.used || '') + '</td>' +
                '<td>' + (v.branch || '总院') + '</td>' +
                '<td>' + v.province + ' ' +  v.city + '</td>' +
                '<td>' + v.reference + '</td>' +
                '</tr>'
        });
        tBody += '</tbody>';
        res.render('excel/enroll',{
            _html:tHead + tBody
        });
    }, function (err) {
        console.log(err);
        return response.ApiError(res, {}, err.message);
    });
});
module.exports = router;