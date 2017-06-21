/**
 * Created by Administrator on 2017/3/6 0006.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.post('/', Filter.authorize ,function (req, res) {
    var state = req.body.state,
        id = req.body.id;
    if(!id){
        response.ApiSuccess(res, {} , '参数错误');
    }
    models.Once_GoodProject.update({state: state},{
        where: {
            id: id
        }
    }).then(function (result) {
        response.ApiSuccess(res, result , '更新成功');
    },function (err) {
        console.log('admin/good_project/state',err);
        response.ApiSuccess(res, {} , '更新失败');
    });
});

module.exports = router;