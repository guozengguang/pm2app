/**
 * Created by Administrator on 2016/10/11 0011.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');

router.post('/', function (req, res) {
    var body = req.body;
    if( (!body.name || !body.phone) ){
        return response.ApiError(res, {} ,'参数有误');
    }
    var user_info = {
        name:body.name,//姓名
        phone:body.phone,//电话
        enterprise:body.enterprise || '',//企业
        position:body.position || '',//职位
        province:body.province,//省
        city:body.city,//市
        reference:body.touserid || ""//推荐人手机号
    };
    models.BranchEnroll.create(user_info).then(()=>{
        return response.ApiSuccess(res, {} ,'报名成功')
    },(err)=>{
        return response.ApiError(res,{},err.message);
    });
});
module.exports = router;
