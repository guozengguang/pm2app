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
    models.HotelDetail.findAll({
        include: [{
            model: models.HotelRoom,
            as: 'Rooms'
        }]
    }).then(function (result) {
        result = JSON.parse(JSON.stringify(result));
        _.forEach(result, function (value, index) {
            var room = {}, Rooms = [];
            _.forEach(value.Rooms, function (v, i) {
                var key = v.name + '-_-' + v.price;
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
                    price: arr[1],
                    count: v
                })
            });
            value.Rooms = Rooms;
        });
        return response.ApiSuccess(res, { list: result }, '获取成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;