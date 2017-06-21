/**
 * Created by Administrator on 2017/3/20 0020.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.post('/', Filter.authorize, function (req, res) {
    var body = req.body,
        id = body.id;
    if (!id) {
        return response.ApiError(res, {}, '参数错误');
    }
    models.HotelActivity.destroy({
        where: {
            id: id
        }
    }).then(function (result) {
        return response.ApiSuccess(res, body, '删除成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;