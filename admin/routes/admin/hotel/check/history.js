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


router.get('/', Filter.authorize, function (req, res) {
    var operator = req.session.user.uid;//添加操作人ID
    var query = req.query,
        activity = query.id;
    models.HotelReservation.findAll({
        where: {
            state: 0, //未完成状态
            operator: operator, //操作人ID,
            activity: activity, //当前活动ID
            order: {//订单ID 为空
                $ne: null
            }
        },
        include: [{
            model: models.HotelHuman
        }, {
            model: models.HotelDetail
        }, {
            model: models.HotelRoom
        }]
    })

        .then(function (result) {
            return response.ApiSuccess(res, result, '入住成功');
        }, function (err) {
            return response.ApiError(res, err);
        });

})
;
module.exports = router;