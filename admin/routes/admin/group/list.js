/**
 * Created by Administrator on 2016/10/13 0013.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var sequelize = require(process.cwd() + '/models/index').sequelize;

router.all(Filter.authorize);

router.get('/',function (req, res) {
    sequelize.query('SELECT groupid, group_name FROM gj_group WHERE group_type in (5,6,7,8,9,10);',
        { type: sequelize.QueryTypes.SELECT }
    ).then(function (result) {
        response.ApiSuccess(res, result , '获取成功');
    },function (err) {
        console.log('get_group',err);
        response.ApiSuccess(res, {} , '获取失败');
    });
});

module.exports = router;