/**
 * Created by Administrator on 2016/12/15 0015.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var sequelize = require(process.cwd() + '/models/index').sequelize;
var models = require(process.cwd() + '/models/index');

router.all(Filter.authorize);

router.get('/',function (req, res) {
    var id = req.query.id;
    if(!id){
        return response.ApiSuccess(res, {} , '参数错误');
    }
    models.Userclass.count({
        where: {
            uc_status: 1,
            uc_goodsid: id
        }
    }).then(function (result) {
        response.ApiSuccess(res, {
            count: result
        } , '获取成功');
    },function (err) {
        console.log('admin/good/student/count',err);
        response.ApiSuccess(res, {} , '获取失败');
    });
});

module.exports = router;