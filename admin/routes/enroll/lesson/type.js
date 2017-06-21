/**
 * Created by Administrator on 2016/10/11 0011.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var Filter = require(process.cwd() + '/utils/filter');
router.all(Filter.authorize);

router.get('/', function (req, res) {
    models.EnrollLesson.findAll({
        attributes: ['enroll_use'],
        group: ['enroll_use'],
        raw : true,
    }).then(function(result){
        return response.ApiSuccess(res, { list : result });
    }, function (err) {
        console.log(req.originalUrl,err);
        return response.ApiError(res, '获取数据失败');
    });
});
module.exports = router;
