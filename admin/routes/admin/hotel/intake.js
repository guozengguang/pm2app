/**
 * Created by Administrator on 2017/3/20 0020.
 */
var express = require('express');
var _ = require('lodash');
var moment = require('moment');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');
var sequelize = models.sequelize;
var co = require('co');

router.get('/', Filter.authorize, function (req, res) {

    var id = req.query.id;
    sequelize.query('SELECT ' +
        'activity.start_time, '+ 'activity.end_time, '+
        'activity.title, '+
        'detail.id, '+
        'detail.name, '+
        'room.name AS `r_name`, '+
        'room.bed AS `r_bed`, '+
        'room.price AS `r_price` '+
        'FROM hotel_detail AS detail '+
        'INNER JOIN hotel_room AS room ON room.hotel = detail.id '+
        'INNER JOIN hotel_activity_relation AS relation ON relation.room = room.id '+
        'LEFT JOIN hotel_activity as activity ON activity.id = relation.activity '+
        'WHERE detail.id = ? '+
        'AND activity.start_time <= ? '+
        'AND activity.end_time > ? '+
        'AND detail.deleted_at IS NULL '+
        'AND room.deleted_at IS NULL; ', {
        type: sequelize.QueryTypes.SELECT,
        replacements: [id,moment().format('YYYY-MM-DD'),moment().format('YYYY-MM-DD')]
    }).then(function (result) {
        result = JSON.parse(JSON.stringify(result));
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
        console.info(hotel)
        _.forIn(hotel, function (v, k) {
            arr = v.Rooms;
        });
        return response.ApiSuccess(res, { list: arr }, '获取成功');
    }, function (err) {
        return response.ApiError(res, err, '数据错误');
    });
});
module.exports = router;