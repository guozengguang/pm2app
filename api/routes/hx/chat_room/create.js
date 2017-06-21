/**
 * Created by Administrator on 2017/1/13 0013.
 */
var express = require('express');
var _ = require('lodash');
var request = require('request-promise');

var router = express.Router();
var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var config = require(cwd + '/middlerware/hx');


router.get('/', function (req, res) {
    var options = {
        name: '2017新年晚会',
        description: '格局2017新年晚会聊天室',
        maxusers: 5000,
        owner: 'gejupush',
    };
    config.createhxchatrooms(options, function (err, data) {
        if(err){
            return response.ApiError(res, {message: '创建失败'});
        }
        return response.ApiSuccess(res, data, '创建成功');
    })
});
module.exports = router;