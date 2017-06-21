/**
 * Created by Administrator on 2017/1/5 0005.
 */
var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var Filter = require(cwd + '/utils/filter');
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');

router.all(Filter.authorize);
router.get('/', function (req, res) {
    models.Goods.findAll().then(function (result) {
        return response.ApiSuccess(res, result, '获取成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;