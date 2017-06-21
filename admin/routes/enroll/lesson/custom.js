/**
 * Created by Administrator on 2016/10/11 0011.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var _ = require('lodash');


router.get('/', function (req, res) {
    models.sequelize.query('SELECT lesson_alias FROM gj_enroll_lesson WHERE lesson_alias != "" GROUP BY lesson_alias',{
        type: models.sequelize.QueryTypes.SELECT,
        raw: true
    }).then(function (result) {
        if(!_.isArray(result)){
            result = [result]
        }
        response.ApiSuccess(res , { list : result },'获取成功')
    },function (err) {
        return response.ApiError(res,{},err.message);
    });
});
module.exports = router;
