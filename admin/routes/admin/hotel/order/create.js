/**
 * Created by Administrator on 2017/3/20 0020.
 */
var cwd = process.cwd();
var express = require('express');
var router = express.Router();
var Filter = require(cwd + '/utils/filter');
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var PUid = require(cwd + '/middlerware/id').p_uid;
var _ = require('lodash');

router.post('/', Filter.authorize, function (req, res) {
    var body = req.body,
        operator = req.session.user.uid,
        activity = body.activity;
    body.operator = operator;
    body.room_count = JSON.stringify(body.room_count);
    body.room_bed = JSON.stringify(body.room_bed);
    models.HotelOrder.create(body).then(function (Order) {
        var id = Order.getDataValue('id');
        models.HotelReservation.update({
            order: id,
            state: 1
        }, {
            where: {
                state: 0, //未完成状态
                operator: operator, //操作人ID,
                activity: activity, //当前活动ID
                order: {//订单ID 为空
                    $ne: null
                }
            }
        }).then(function () {
            return response.ApiSuccess(res, {}, '提交成功');
        }, function (err) {
            return response.ApiError(res, err);
        });
    }, function (err) {
        return response.ApiError(res, err);
    })
});
module.exports = router;