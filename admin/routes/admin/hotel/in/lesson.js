/**
 * Created by Administrator on 2017/3/28 0028.
 */
var express = require('express');
var _ = require('lodash');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');


router.get('/', Filter.authorize, function (req, res) {
    var query = req.query,
        id = query.id;
    if(!id){
        return response.ApiError(res, {}, '参数错误');
    }
    if(!_.isArray(id)){
        id = [id];
    }
    models.Goods.findAll({
        attributes: ['goods_name'],
        where: {
            goodsid: {
                $in: id
            }
        },
    }).then(function (result) {
        return response.ApiSuccess(res, result, '获取成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;