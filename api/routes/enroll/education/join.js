/**
 * Created by Administrator on 2017/3/15 0015.
 */
var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var _ = require('lodash');

router.post('/', function (req, res) {
    var body = req.body;
    models.Once_Education.create(
        body
    ).then(function (result) {
        return response.ApiSuccess(res, {}, '报名成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;