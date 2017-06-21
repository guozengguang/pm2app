/**
 * Created by Administrator on 2017/1/13 0013.
 */
var express = require('express');
var _ = require('lodash');
var request = require('request-promise');

var router = express.Router();
var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var config = require(cwd + '/middlerware/hx');
var lexicon = require(cwd + '/middlerware/lexicon');

//286526391170630172 现用聊天室
//286529996833423896 测试聊天室
router.get('/', function (req, res) {
    var query = req.query;
    var name = query.name || '匿名';
    var msg = query.message + '';
    if(!/\S/.test(msg)){
        return response.ApiError(res, {message: '消息不能为空'});
    }
    if(lexicon.isValid(msg)){
        var options = {
            chatrooms: ['286529996833423896', '286526391170630172'],
            nickName: name || '匿名',
            msg: msg,
            fromuser: 'gejupush'
        };
        config.chatroomsmessages(options, function (err, data) {
            if(err){
                return response.ApiError(res, {message: '发送失败'});
            }
            return response.ApiSuccess(res, data, '发送成功');
        })
    }else {
        return response.ApiError(res, {message: '含有敏感词汇'});
    }
});
module.exports = router;