/**
 * Created by Administrator on 2017/3/20 0020.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');
var _ = require('lodash');

router.post('/', Filter.authorize,function (req, res) {
    var body = req.body;
    var rooms = body.Rooms;
    var Rooms = [];
    delete body.Rooms;
    models.HotelDetail.create(body).then(function (result) {
        var id = result.getDataValue('id');
        _.forEach(rooms, function (v) {
            var count = + v.count;
            for(var i = 0;i < count ; i++){
                delete v.count;
                v.hotel = id;
                v.meals = body.meals;
                Rooms.push(v);
            }
        });
        models.HotelRoom.bulkCreate(Rooms).then(function () {
            return response.ApiSuccess(res, {}, '添加成功');
        }, function (err) {
            return response.ApiError(res, err);
        });
    },function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;