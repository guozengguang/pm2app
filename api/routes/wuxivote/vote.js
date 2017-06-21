
var co = require('co');
var express = require('express');
var router = express.Router();
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');
var cache = require('../../../utils/cache');
var redis = cache.redis;


router.post('/', function (req, res) {
   co(function *() {
        var ipaddress =  req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

         var result = yield redis.getAsync(ipaddress);
        console.log(ipaddress);
        if(!result||parseInt(result)<10)
        {
             var tic = 0;
            
            if(!result)
            {
               tic = 1
            }else
            {
                tic = parseInt(result)+1; 
            }
            console.log(tic);
            redis.setAsync(ipaddress, tic);
            redis.expire(ipaddress,  7200);

            var body = req.body,
                id = body.id;//id

            if(!id){
                return response.ApiError(res, {}, '参数错误');
            }
            models.Wuxivote.findById(id).then(function(result){
                if(!result){
                    return response.ApiError(res, {}, '没有此数据');
                }
                result.increment('vote').then(function(){
                    return response.ApiSuccess(res, {}, '投票成功');
                },function (err) {
                    return response.ApiError(res, err, '投票失败');
                })
            },function (err) {
                return response.ApiError(res, err, '投票失败');
            })
        }else
        {
            return response.ApiError(res,  { code: 202 }, '您已投票10次，请勿刷票！');
        }
     })
});
module.exports = router;