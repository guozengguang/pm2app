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

router.post('/', function (req, res) {
    var body = req.body;
    var hierarchy = body.hierarchy;
    var options = {
        name: body.name              //名称
    };
    /* 判断参数 */
    if (!body.name) {
        response.ApiError(res, {}, '参数错误');
    }
    if (hierarchy > 1) {
        options.hierarchy = hierarchy;//层级
        options.parent_id = body.parent_id;//父级ID
        //state 状态  0下架  1上架
        options.type = body.type;//状态  0未分类 1期望课程 2期望教师
    }
    console.log(options);
    /* 判断参数 */
    models.Questionnaire_Primary.create(options, {
        raw: true
    }).then(function (result) {
        response.ApiSuccess(res, {}, '添加成功');
    }, function (err) {
        response.ApiError(res, err);
    })
});


module.exports = router;