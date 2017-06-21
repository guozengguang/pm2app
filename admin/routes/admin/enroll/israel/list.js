/**
 * Created by guozengguang on 2017/6/12.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');

router.get('/', Filter.authorize, function (req, res) {
    var sql = new StringBuilder();
    var branch = req.Branch;
    sql.AppendFormat("SELECT israel.* FROM israel_pay_enroll israel INNER JOIN gj_classroom classroom ")
    sql.AppendFormat(" ON israel.classroomname=classroom.classroom_name ");
    if (branch) {
        sql.AppendFormat(" WHERE classroom.classroom={0} ", branch);
    }
    models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT}).then(function (result) {
        response.ApiSuccess(res, result, '获取成功');
    }, function (err) {
        console.log('admin/enroll/israel/list', err);
        response.ApiSuccess(res, {}, '获取失败');
    });
});

module.exports = router;