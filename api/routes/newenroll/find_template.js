var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var Filter = require(cwd + '/utils/filter');
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var utils = require(cwd + '/middlerware/utils');

router.all(Filter.authorize);

var sqlStr = "select * from gj_apply_template as a where a.deletedAt is null and (a.id = $1 or a.parent = $1 or a.parent like $2 ) order by a.sort";

router.get('/', function (req, res) {
    var query = req.query;
    var id = query.id;
    if (!id) {
        return response.ApiError(res, {}, '参数错误');
    }
    models.sequelize.query(sqlStr, {
        //
        bind: [
            id,
            id + ",%"
        ], type: models.sequelize.QueryTypes.SELECT, nest: true
    }).then(function (result) {
        //把多级关系组合成一级
        result = utils.appendPath(result, 'id', 'parent', 'level', 0);
        return response.ApiSuccess(res, result[0], '查询成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});

module.exports = router;