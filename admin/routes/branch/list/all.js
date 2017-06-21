/**
 * Created by Administrator on 2016/10/11 0011.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');

router.get('/', function (req, res) {
    models.Classroom.findAll({
        where: {
            classroom_status: 0
        },
        attributes: ['classroom','classroom_area_city' , 'classroom_name', 'classroom_address', 'classroom_phone'],
        raw : true
    }).then(function(result){
        if(result.length){
            return response.ApiSuccess(res, { list : result });
        }
    }, function (err) {
        console.log(req.originalUrl + ':',err);
        return response.ApiError(res, '获取数据失败');
    });
});

module.exports = router;
