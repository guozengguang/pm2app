/**
 * Created by Administrator on 2016/10/11 0011.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var Filter = require(process.cwd() + '/utils/filter');
var Str = require(process.cwd() + '/utils/str');
var config = require(process.cwd() + '/config/config');


var select_option = {
    type: models.sequelize.QueryTypes.SELECT,
    raw: true,
    plain: true
};

router.all(Filter.authorize);
router.post('/', function (req, res) {
    var body = req.body;
    if (!(body.lesson || body.alias ) || !body.use || !body.img) {
        return response.ApiError(res, {}, '参数有误');
    }
    if (+body.lesson_id) {
        models.EnrollLesson.update({
            lesson_name: body.lesson,//课程名称
            lesson_alias: body.alias,//其他时 课程名称
            enroll_use: body.use,//用途
            background_img: body.img
        }, {where: {lesson_id: body.lesson_id}}).then(function () {
            return response.ApiSuccess(res, {message: '操作成功'}, '编辑成功');
        }, function (err) {
            return response.ApiError(res, {}, '编辑失败')
        });
    } else {
        models.EnrollLesson.create({
            lesson_name: body.lesson,//课程名称
            lesson_alias: body.alias,//其他时 课程名称
            enroll_use: body.use,//用途
            background_img: body.img,
            type: body.type || 0
        }).then(function () {
            return response.ApiSuccess(res);
        }, function (err) {
            return response.ApiError(res, {}, err.message);
        });
    }
});
router.get('/', function (req, res) {
    var query = req.query;
    var keyword = query.keyword;
    var from = query.from;
    var select_count = 'SELECT COUNT(lesson_id) FROM `gj_enroll_lesson` '
    var select = 'SELECT lesson_id, type, background_img, lesson_alias, lesson_name, enroll_use , gj_enroll_lesson.createdAt,gj_goods.goods_name FROM gj_enroll_lesson LEFT JOIN gj_goods ON gj_enroll_lesson.lesson_name = gj_goods.goodsid ';
    if (keyword) {
        select_count += 'WHERE gj_enroll_lesson.enroll_use = "' + keyword + '" ';
        select += 'WHERE gj_enroll_lesson.enroll_use = "' + keyword + '" '
    }
    select += 'ORDER BY lesson_id DESC LIMIT ' + (req.query.page ? (req.query.page - 1) * 12 : 0) + ',12;';
    models.Config.findAll({
        where: {
            $or: [{key: 'listname'}, {key: 'bmlistname'}, {key: 'silicon_path'}, {key: 'eduction_path'},{key: 'israel_pay_path'}]
        },
        raw: true,
        attributes: ['key','val']
    }).then((path)=> {
        var obj = {};
        path.forEach(function (v) {
            obj[v.key] = v.val;
        });
        models.sequelize.query(select_count, select_option).then(function (count) {
            models.sequelize.query(select, {type: models.sequelize.QueryTypes.SELECT}).then(function (result) {
                if (result && result.createdAt) {
                    result = [result];
                }
                return response.ApiSuccess(res, {
                    list: result || [],
                    baseUrl:obj,
                    count: count ? count['COUNT(lesson_id)'] : 0
                });
            }, (err)=> {
                return response.ApiError(res, {}, err.message);
            });
        }, (err)=> {
            return response.ApiError(res, {}, err.message);
        });
    }, (err)=> {
        return response.ApiError(res, {}, err.message);
    });
});
module.exports = router;
