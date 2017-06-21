/**
 * Created by Administrator on 2017/3/6 0006.
 */
var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var _ = require('lodash');

router.post('/', function (req, res) {
    var body = req.body;
    models.Once_GoodProject.create(
        _.pick(body, ['name', 'phone', 'contact', 'branch', 'enterprise', 'position', 'introduce', 'business' ,'mode', 'asset', ''])
    ).then(function (result) {
        return response.ApiSuccess(res, {}, '报名成功                                                  ');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;