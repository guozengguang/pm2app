/**
 * Created by Administrator on 2017/3/31 0031.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');
var _ = require('lodash');
var sequelize = models.sequelize;

router.post('/', Filter.authorize, function (req, res) {
    var operator = req.session.user.uid;//添加操作人ID
    var id = req.body.id;
    models.HotelReservation.destroy({
        where: {
            id: id,
            operator: operator
        }
    }).then(function (result) {
        return response.ApiSuccess(res, result, '删除成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;