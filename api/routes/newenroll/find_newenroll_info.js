var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var Filter = require(cwd + '/utils/filter');
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var utils = require(cwd + '/middlerware/utils');
var StringBuilder = require(cwd + '/utils/StringBuilder');
var str = require(cwd + '/utils/str');

router.all(Filter.authorize);

router.get('/', function (req, res) {
    var query = req.query;
    var id = query.id;
    if (!id) {
        return response.ApiError(res, {}, '参数错误');
    }
    var sql = new StringBuilder();
    sql.AppendFormat("SELECT * FROM gj_new_enroll WHERE newenroll_id='{0}' ",id);
    models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (result) {
        result[0].adimg_url=str.AbsolutePath(result[0].adimg_url);
        return response.ApiSuccess(res, result[0], '查询成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});

module.exports = router;