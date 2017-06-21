/**
 * Created by Administrator on 2016/11/2 0002.
 */
var express = require('express');
var router = express.Router();
var WORK_PATH = process.cwd();
var Filter = require(WORK_PATH + '/utils/filter');
var response = require(WORK_PATH + '/utils/response');
var models = require(WORK_PATH + '/models/index');
var dingTalk = require(WORK_PATH + '/middlerware/ding_talk');
var hx = require(WORK_PATH + '/utils/hxchat');

router.all(Filter.authorize);

function proxy(options, msg , res) {
    options.message.push(msg);
    if(options.message.length >= 3){
        if(options.success){
            response.ApiSuccess(options.res,{message:options.message.join(',') } ,options.message.join(','));
        }else {
            response.ApiError(options.res,{message:options.message.join(',') } ,options.message.join(','));
        }
    }
}
router.post('/',function (req, res) {
    var option = {
        message: [],
        success: true,
        res : res
    };
    var id = req.body.id;
    models.Members.destroy({
        where:{
            mid: id
        }
    }).then(function (result) {
        proxy(option ,'用户删除成功');
    },function (err) {
        option.success = false;
        proxy(option ,'用户删除失败');
    });
    dingTalk.delete_user(id,function (error_code, result) {
        if(error_code){
            option.success = false;
            proxy(option ,'钉钉用户删除失败:'+ error_code);
        }else {
            proxy(option ,'钉钉用户删除成功');
        }
    });
    hx.deletehxuser({username: id},function (err_message, result) {
        if(err_message){
            option.success = false;
            proxy(option ,'环信用户删除失败:'+ err_message);
        }else {
            proxy(option ,'环信用户删除成功');
        }
    })
});
module.exports = router;