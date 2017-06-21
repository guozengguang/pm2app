/**
 * Created by Administrator on 2016/12/19 0019.
 */
var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var Filter = require(cwd + '/utils/filter');
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');

router.all(Filter.authorize);

router.post('/',function (req, res) {
    var body = req.body,
        id = body.id;
    if( !id ){
        return response.ApiError(res, {}, '参数错误');
    }
    models.Blessings.update({
        status: 0
    },{
        where:{
            id: id
        }
    }).then(function (result) {
        return response.ApiSuccess(res, result, '下架成功');
    },function (err) {
        return response.ApiError(res, err, '下架失败');
    })

});
module.exports = router;