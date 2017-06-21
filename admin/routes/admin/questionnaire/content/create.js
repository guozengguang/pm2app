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
    var parent_id = body.parent_id;//父级
    var describe = body.describe;//描述
    var from = body.from;//来源
    /* 判断参数 */
    if (!parent_id || !describe || !from) {
        response.ApiError(res, {}, '参数错误');
    }
    /* 判断参数 */
    models.Questionnaire_Content.create({
        describe: describe,
        parent_id: parent_id,
        vote_count:body.vote_count || 0,
        from: from,
        name: body.name
    }, {
        raw: true
    }).then(function (result) {
        response.ApiSuccess(res, {}, '添加成功');
    }, function (err) {
        response.ApiError(res, err);
    })
});


module.exports = router;