/**
 * Created by Administrator on 2016/12/13 0013.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.all(Filter.authorize);

router.get('/', function (req, res) {
    var query = req.query,
        page = query.page - 1 || 0,
        size = +query.size || 12,
        where = {
            level: 1
        },
        filter = query.filter;
    if(filter){
        if(filter.start_time){
            if(where.createdAt){
                where.createdAt.$gte = filter.start_time;
            }else {
                where.createdAt = {
                    $gte : filter.start_time
                }
            }
        }
        if(filter.end_time){
            if(where.createdAt){
                where.createdAt.$lte = filter.end_time;
            }else {
                where.createdAt = {
                    $lte : filter.end_time
                }
            }
        }
        if(filter.name){
            where.name = {
                $like: '%' + filter.name + '%'
            };
        }
    }
    models.Rating.findAndCountAll({
        where:where,
        limit: size,
        offset: 12 * page,
        order: 'createdAt DESC'
    }).then(function (result) {
        return response.ApiSuccess(res, result, '获取成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;