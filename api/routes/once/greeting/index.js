/**
 * Created by Administrator on 2017/1/11 0011.
 */
var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');

router.post('/', function (req, res) {
    var body = req.body;
    models.Once_GreetingCard.create({
        template: body.t, //模板ID
        congratulations: body.c, //贺词
        name: body.n, //姓名
        job: body.j, //职位
        corporation: body.co, //公司
        picture: body.p //头像
    }).then(function (result) {
        return response.ApiSuccess(res, result, '创建成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
router.get('/',function (req, res) {
    var id = +req.query.id;
    if(!id){
        return response.ApiError(res, '参数错误');
    }
    models.Once_GreetingCard.findById(id,{
        attributes: ['id', 'template', 'congratulations', 'name', 'job', 'corporation', 'picture']
    }).then(function (result) {
        return response.ApiSuccess(res, result, '获取成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;