/**
 * Created by Administrator on 2016/12/15 0015.
 */

var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var Filter = require(cwd + '/utils/filter');
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var utils = require(cwd + '/middlerware/utils');
var _ = require('lodash');

router.all(Filter.authorize);

var select = "SELECT * FROM gj_rating as a WHERE a.deletedAt IS NULL AND (a.id = $1 OR a.parent = $1 OR a.parent LIKE $2 ) ORDER BY a.sort";

router.get('/', function (req, res) {
    var query = req.query,
        start_time = query.start_time,
        end_time = query.end_time,
        where = {},
        id = query.id;
    if (!id) {
        return response.ApiError(res, {}, '参数错误');
    }
    if(start_time){
        if(where.createdAt){
            where.createdAt.$gte = start_time;
        }else {
            where.createdAt = {
                $gte : start_time
            }
        }
    }
    if(end_time){
        if(where.createdAt){
            where.createdAt.$lte = end_time;
        }else {
            where.createdAt = {
                $lte : end_time
            }
        }
    }
    var cp_where = _.cloneDeep(where);
    cp_where.rating = id;
    Promise.all([models.sequelize.query(select, {
        bind: [
            id,
            id + ',%'
        ], type: models.sequelize.QueryTypes.SELECT
        ,nest: true
    }),models.RatingStatistics.findAll({
        where: where,
        raw: true
    }),models.RatingStatistics.findAll({
        where: cp_where,
        attributes: ['id'],
        group: 'createdAt',
        raw: true
    })]).then(function (result) {
        var statistics_count =  result[2]? result[2].length : 0;
        if(result[1] && _.isArray(result[1])){
            result[0] = result[0].concat(result[1]);
        }else if(_.isObject(result[1])){
            result[0].push(result[1]);
        }
        result = utils.appendPath(result[0], 'id', 'parent' ,'level' ,1);
        result[0].statistics_count = statistics_count;
        return response.ApiSuccess(res, result[0], '添加成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;