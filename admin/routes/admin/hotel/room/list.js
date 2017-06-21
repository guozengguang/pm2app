/**
 * Created by Administrator on 2017/3/20 0020.
 */
var express = require('express');
var _ = require('lodash');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.get('/', Filter.authorize, function (req, res) {
    var query = req.query;
    var id = query.hotel;
    models.HotelRoom.findAll({
        where: {
            hotel: id
        },
        include: [{
            model: models.HotelReservation
        }]
    }).then(function (result) {
        return response.ApiSuccess(res, result, '获取成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;