/**
 * Created by Administrator on 2017/2/24 0024.
 */
var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var Filter = require(cwd + '/utils/filter');
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');

router.get('/',Filter.authorize , function (req, res) {
    models.sequelize.query('SELECT silicon_enroll.* , gj_goods.goods_name FROM silicon_enroll ' +
    'LEFT JOIN gj_members ON silicon_enroll.phone = gj_members.m_phone ' +
    'LEFT JOIN gj_userclass ON gj_members.mid = gj_userclass.uc_userid ' +
    'LEFT JOIN gj_goods ON gj_userclass.uc_goodsid = gj_goods.goodsid',{
        type: models.sequelize.QueryTypes.SELECT
    }).then(function (result) {
        return response.ApiSuccess(res, result, '获取成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;