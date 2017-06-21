/**
 * Created by Administrator on 2017/3/25 0025.
 */
var express = require('express');
var _ = require('lodash');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');


router.get('/', function (req, res) {
    var id = req.query.id;
    if(id){
        models.HotelActivity.findOne({
            where: {
                id: id
            }
        }).then(function (result) {
            return response.ApiSuccess(res, result, '获取成功');
        }, function (err) {
            return response.ApiError(res, err);
        });
    }else {
        return response.ApiError(res, {} , '参数错误');
    }

});
module.exports = router;