/**
 * Created by Administrator on 2016/12/14 0014.
 */

var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var Filter = require(cwd + '/utils/filter');
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var utils = require(cwd + '/middlerware/utils');

router.all(Filter.authorize);

var select = "SELECT * FROM gj_rating as a WHERE a.deletedAt IS NULL AND (a.id = $1 OR a.parent = $1 OR a.parent LIKE $2 ) ORDER BY a.sort";

router.get('/', function (req, res) {
    var query = req.query,
        id = query.id;
    if (!id) {
        return response.ApiError(res, {}, '参数错误');
    }
    Promise.all([models.RatingStatistics.findOne({
        where: {
            id: id
        },
        attributes: ['id'],
        raw: true
    }),models.sequelize.query(select, {
        bind: [
            id,
            id + ',%'
        ], type: models.sequelize.QueryTypes.SELECT
        ,nest: true
    })]).then(function (result) {
        var block = !!result[0];
        result = utils.appendPath(result[1], 'id', 'parent' ,'level' ,1);
        result[0].block = block;
        return response.ApiSuccess(res, result[0], '添加成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;
