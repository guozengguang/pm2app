/**
 * Created by Administrator on 2017/4/1 0001.
 */
var express = require('express');
var _ = require('lodash');
var moment = require('moment');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');


router.get('/', Filter.authorize, function (req, res) {
    var operator = req.session.user.uid,//添加操作人ID
        id = req.query.id;
    models.sequelize.query('SELECT ' +
        '`u`.user_nicename AS `name`, ' +
        '`u`.user_phone AS phone, ' +
        'branch.classroom_name AS branch ' +
        'FROM hotel_order AS o ' +
        'INNER JOIN gj_user AS u ON o.operator = u.uid ' +
        'LEFT JOIN gj_classroom AS branch ON branch.classroom = u.user_branch ' +
        'WHERE o.id = ?; ', {
        type: models.sequelize.QueryTypes.SELECT,
        replacements: [id]
    }).then(function (result) {
        return response.ApiSuccess(res, result, '获取成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
})
;
module.exports = router;