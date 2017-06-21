/**
 * Created by Administrator on 2017/1/9 0009.
 */
var express = require('express');
var router = express.Router();

var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var Filter = require(cwd + '/utils/filter');
var index = require(cwd + '/middlerware/website_config').index;
router.get('/', Filter.authorize, function (req, res) {
    response.ApiSuccess(res, {list: index}, '获取成功')
});
module.exports = router;