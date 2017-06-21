/**
 * Created by Administrator on 2016/10/11 0011.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var co = require('co');

router.get('/', function (req, res) {
    var query = req.query,
        address = query.address;
    if(!address){
        return response.ApiError(res, '获取数据失败');
    }
    models.Classroom.findAll({
        where:{
            classroom_area_city : address,
            classroom_status: 0
        },
        attributes: ['classroom', 'classroom_name', 'classroom_address'],
        raw : true
    }).then(function(result){
        if(result.length){
            return response.ApiSuccess(res, { list : result });
        }
        return response.ApiSuccess(res, {list : []} ,'当前城市没有分院，自动分配到北京总院');
    }, function (err) {
        console.log('branch/list',err);
        return response.ApiError(res, '获取数据失败');
    });
});
module.exports = router;
