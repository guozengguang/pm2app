/**
 * Created by Administrator on 2017/2/24 0024.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var co = require('co');

router.post('/', function (req, res) {
    var body = req.body;
    models.SiliconEnroll.create(body).then(function (result) {
        return response.ApiSuccess(res, {},'报名成功');
    },function (err) {
        return response.ApiError(res,{},err.message);
    })
});
module.exports = router;