var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.all(Filter.authorize);

router.post('/', function (req, res) {
    var body = req.body,
        rowID = body.rowID;
    if (!rowID) {
        return response.ApiError(res, {}, '参数错误');
    }
    models.ApplyTemplateStatistics.update({status:body.status},{where: {rowID:rowID}}).then(function (result) {
        return response.ApiSuccess(res,{message:'操作成功'})
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;
