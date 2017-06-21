/**
 * Created by Administrator on 2016/12/14 0014.
 */
var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var utils = require(cwd + '/middlerware/utils');
var _ =  require('lodash');

router.post('/', function (req, res) {
    var vote = req.body.vote;
    if(vote && _.isArray(vote)){
        models.RatingStatistics.bulkCreate(vote).then(function (result) {
            return response.ApiSuccess(res, {}, '投票成功');
        }, function (err) {
            return response.ApiError(res, err);
        });
    }else {
        return response.ApiError(res, {}, '参数错误');
    }
});
module.exports = router;