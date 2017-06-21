/**
 * Created by Administrator on 2017/3/6 0006.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.get('/', Filter.authorize ,function (req, res) {
    models.Once_Education.findAll().then(function (result) {
        response.ApiSuccess(res, result , '获取成功');
    },function (err) {
        console.log('admin/education/list',err);
        response.ApiSuccess(res, {} , '获取失败');
    });
});

module.exports = router;