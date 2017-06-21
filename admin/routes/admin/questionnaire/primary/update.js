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
    var id = body.id;
    /* 判断参数 */
    if (!body.name) {
        response.ApiError(res, {}, '参数错误');
    }
    delete body.id;
    /* 判断参数 */
    models.Questionnaire_Primary.update(body, {
        where: {
            id: id
        },
        raw: true
    }).then(function (result) {
        response.ApiSuccess(res, {}, '更新成功');
    }, function (err) {
        response.ApiError(res, err);
    })
});


module.exports = router;