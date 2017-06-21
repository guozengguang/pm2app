/**
 * Created by Administrator on 2017/3/27 0027.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');
var sequelize = models.sequelize;
var _ = require('lodash');
var co = require('co');

router.get('/', Filter.authorize, function (req, res) {
    var id = req.query.id;
    sequelize.query('SELECT ' +
        'detail.id,' +
        'detail.name,' +
        'room.name AS `r_name`,' +
        'room.bed AS `r_bed`,' +
        'room.price AS `r_price` ' +
        'FROM hotel_detail AS detail ' +
        'INNER JOIN hotel_room AS room ON room.hotel = detail.id ' +
        'INNER JOIN hotel_activity_relation AS relation ON relation.room = room.id ' +
        'WHERE relation.activity = ? ' +
        'AND detail.deleted_at IS NULL ' +
        'AND room.deleted_at IS NULL;', {
        type: sequelize.QueryTypes.SELECT,
        replacements: [id]
    }).then(function (result) {
        var room = {}, hotel = {}, arr = [];
        _.forEach(result, function (v, i) {
            var key = v.id+ '-_-' + v.name + '-_-' + v.r_name + '-_-' + v.r_price + '-_-' + v.r_bed;
            if(room[key]){
                room[key] ++ ;
            }else {
                room[key] = 1;
            }
        });
        _.forIn(room, function (v, k) {
            var arr = k.split('-_-'),
                key = arr[0]+ '-_-' + arr[1];
            if(hotel[key]){
                hotel[key].Rooms.push({
                    name: arr[2],
                    price:+ arr[3],
                    bed: + arr[4],
                    applied: v
                })
            }else {
                hotel[key] = {
                    id : + arr[0],
                    name : arr[1],
                    Rooms: [{
                        name: arr[2],
                        price: + arr[3],
                        bed: + arr[4],
                        applied: v
                    }]
                };
            }
        });
        _.forIn(hotel, function (v, k) {
            arr.push(v);
        });
        return response.ApiSuccess(res, arr, '获取成功');
    }, function (err) {
        return response.ApiError(res, err, '数据错误');
    });
});
module.exports = router;