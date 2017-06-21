/**
 * Created by Administrator on 2016/12/6 0006.
 */
var express = require('express');
var router = express.Router();
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.post('/', function (req, res) {
    var body = req.body,
        id = body.id;//id
    if(!id){
        return response.ApiError(res, {}, '参数错误');
    }
    models.Questionnaire_Content.findById(id).then(function(user){
        if(!user){
            return response.ApiError(res, {}, '没有此数据');
        }
        user.increment('vote_count').then(function(){
            return response.ApiSuccess(res, {}, '点赞成功');
        },function (err) {
            console.log(err);
            return response.ApiError(res, err, '点赞失败');
        })
    },function (err) {
        return response.ApiError(res, err, '点赞失败');
    })
});
module.exports = router;