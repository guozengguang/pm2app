/**
 * Created by Administrator on 2016/12/19 0019.
 */
var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var transform_code = require(cwd + '/middlerware/transform_code');

router.post('/',function (req, res) {
    var body = req.body;
    if( !body.name || !body.video || !body.branch || !body.company || !body.filename ){
        return response.ApiError(res, {}, '参数错误');
    }
    var result = transform_code.transform_m3u8(body.video, body.filename);
    result.promise.then(function () {
        models.Blessings.create({
            video: result.file,
            name: body.name,
            branch: body.branch,
            company: body.company,
            type: 2
        }).then(function (result) {
            return response.ApiSuccess(res, {}, '报名成功');
        },function (err) {
            return response.ApiError(res, err);
        })
    })

});
module.exports = router;