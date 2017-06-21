/**
 * Created by Administrator on 2017/3/23 0023.
 */
var express = require('express');
var _ = require('lodash');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');


router.get('/', Filter.authorize, function (req, res) {
    var query = req.query,
        hotel = query.hotel;
    models.HotelRoom.findAll({
        where: {
            hotel: hotel
        }
    }).then(function (result) {
        result = JSON.parse(JSON.stringify(result));
        var room = {}, Rooms = [];
        _.forEach(result, function (v, i) {
            var key = v.name + '-_-' + v.price + '-_-' + v.bed;
            if(room[key]){
                room[key] ++ ;
            }else {
                room[key] = 1;
            }
        });
        _.forIn(room, function (v, k) {
            var arr = k.split('-_-');
            Rooms.push({
                name: arr[0],
                price: +arr[1],
                bed: +arr[2],
                count: v
            })
        });
        return response.ApiSuccess(res, Rooms, '获取成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;