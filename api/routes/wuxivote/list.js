/**
 * Created by Administrator on 2016/12/30 0030.
 */
/**
 * Created by Administrator on 2016/12/13 0013.
 */
var express = require('express');
var router = express.Router();
var _ = require('lodash');
var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var str = require(cwd + '/utils/str');

router.get('/', function (req, res) {
    models.Wuxivote.findAll({}).then(function (result) {
        return response.ApiSuccess(res, result, '获取成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;