/**
 * Created by Administrator on 2016/10/28 0028.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var Filter = require(process.cwd() + '/utils/filter');

router.post('/',Filter.authorize, function (req, res) {
    var body = req.body,
        where = {
            where:{
                mediaid: body.id
            }
        };
    if(!body.id){
        response.ApiError(res,'参数有误');
    }
    models.Media.update({
        media_status: 3
    },where).then(function (result) {
        response.ApiSuccess(res , {} ,'删除成功')
    },function (err) {
        response.ApiError(res,'数据错误');
    });
    models.Columnmedia.update({
        cm_status: 0
    }, {
        where: {
            cm_mediaid: body.id
        }
    })
});
module.exports = router;