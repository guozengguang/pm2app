/**
 * Created by Administrator on 2016/12/7 0007.
 */
var express = require('express');
var router = express.Router();
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.post('/', function (req, res) {
    var body = req.body;
    var parent_id = body.parent_id;//父级
    var describe = body.describe;//描述
    /* 判断参数 */
    if (!parent_id || !describe) {
        response.ApiError(res, {}, '参数错误');
    }
    /* 判断参数 */
    models.Questionnaire_Content.create({
        name: body.name || '',//姓名
        describe: describe,
        parent_id: parent_id,
        from: 0
    }, {
        raw: true
    }).then(function (result) {
        response.ApiSuccess(res, {}, '添加成功');
    }, function (err) {
        response.ApiError(res, err);
    })
});
module.exports = router;