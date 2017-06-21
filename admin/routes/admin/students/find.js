/**
 * Created by Administrator on 2016/11/1 0001.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var request = require('request');
var sequelize = require(process.cwd() + '/models/index').sequelize;

router.all(Filter.authorize);
router.get('/', function (req, res) {
    var body = req.body;
    if (!body.m_phone) {
        return response.onError(res, {message: '错误操作'})
    }
    models.Members.findOne({
        where: {
            m_phone: body.m_phone
        },
        defaults: body
    }).then(function (result) {
        response.ApiSuccess(res,{ data: result } ,'获取成功');
    }).catch(function (err) {
        response.ApiSuccess(res,{} ,'获取失败');
    });
});

module.exports = router;