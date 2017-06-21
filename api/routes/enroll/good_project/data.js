/**
 * Created by Administrator on 2017/3/6 0006.
 */
var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');

router.post('/', function (req, res) {
    var body = req.body,
        path = body.path,
        phone = body.phone,
        value = {};
    if( !path || !phone ){
        return response.ApiError(res, {} ,'参数错误');
    }
    if(body.type){
        value.state = 4;
        value.propaganda = path; //宣传资料
    }else{
        value.state = 6;
        value.roadshow = path; //路演资料
    }
    models.Once_GoodProject.update(value, {
        where: {
            phone: phone
        }
    }).then(function (result) {
        return response.ApiSuccess(res, {}, '提交成功                                                  ');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;