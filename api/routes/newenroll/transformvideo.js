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
    if( !body.video || !body.filename ){
        return response.ApiError(res, {}, '参数错误');
    }
    var result = transform_code.transform_m3u8(body.video, body.filename);
     result.promise.then(function () {
        return response.ApiSuccess(res, result, '转码成功');
      })
    
    
});
module.exports = router;