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
    var body = req.body;
    if( !body.name ){
        return response.ApiError(res, {}, '学院名称为空');
    }
    if( !body.video ){
        return response.ApiError(res, {}, '视频链接为空');
    }
    if( !body.image ){
        return response.ApiError(res, {}, '图片链接为空');
    }
    models.Blessings.create({
        video: body.video,
        name: body.name,
        image: body.image,
        type: 1
    }).then(function (result) {
        return response.ApiSuccess(res, {}, '创建成功');
    },function (err) {
        return response.ApiError(res, err);
    })
});
module.exports = router;