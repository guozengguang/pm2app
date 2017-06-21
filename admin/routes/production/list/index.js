/**
 * Created by Administrator on 2016/10/12 0012.
 */

var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var co = require('co');

router.get('/', function (req, res) {
    models.Goods.findAll({
        attributes: ['goodsid', 'goods_name'],
        raw : true
    }).then(function(result){
        if(result.length){
            return response.ApiSuccess(res, { list : result });
        }
        return response.ApiSuccess(res, {list : []} ,'获取产品列表成功');
    }, function (err) {
        console.log(req.originalUrl,err);
        return response.ApiError(res, '获取数据失败');
    });
});
module.exports = router;
