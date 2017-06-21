var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.all(Filter.authorize);
router.post('/',function (req, res) {
    var body = req.body;
    var id = body.id;
    if(!body.name){
        return response.ApiError(res,{},'参数错误');
    }
    id && (delete body.id);
    if(id){
        models.Apply_Template.update(body,{
            where:{
                id:id
            }
        }).then(function (result) {
            return response.ApiSuccess(res,body,'更新成功');
        },function (err) {
           return response.ApiError(res,err);
        });
    }else{
        models.Apply_Template.create(body,{
            raw: true,
            plain: true
        }).then(function (result) {
            return response.ApiSuccess(res, result, '添加成功');
        },function (err) {
            return response.ApiError(res, err);
        });
    }
});
module.exports = router;