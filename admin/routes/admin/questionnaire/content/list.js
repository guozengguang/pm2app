/**
 * Created by Administrator on 2016/12/6 0006.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var sequelize = require(process.cwd() + '/models/index').sequelize;
var models = require(process.cwd() + '/models/index');
router.all(Filter.authorize);
router.get('/', function (req, res) {
    var body = req.query;
    var parent_id = body.parent_id;//父级
    var from = body.from;//来源
    /* 判断参数 */
    if (!parent_id) {
        response.ApiError(res, {}, '参数错误');
    }
    var where = {
        parent_id: parent_id
    };
    if(from){
        where.from = +from;
    }
    /* 判断参数 */
    models.Questionnaire_Content.findAll({
        where:where,
        raw: true
    }).then(function (result) {
        response.ApiSuccess(res, result, '查找成功');
    }, function (err) {
        response.ApiError(res, err);
    })
});


module.exports = router;