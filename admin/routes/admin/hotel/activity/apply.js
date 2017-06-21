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

router.post('/', Filter.authorize,function (req, res) {
    var body = req.body,
        hotel = body.hotel,
        activity = +body.activity,
        data = [],
        room_relation = [],
        result_message = [];
    _.forEach(hotel, function (v) {
        _.forEach(v.Rooms, function (w) {
            data.push({
                hotel_name: v.name,
                hotel: v.id, //酒店ID
                price: w.price, //房间价格
                name: w.name, //房间名称
                applied: w.applied, //预定数量
                activity: activity //活动ID
            });
        });
    });
    co(function *() {
        try{
            yield models.HotelActivityRelation.destroy({
                where: {
                    activity: activity
                }
            });
            var i = 0,len = data.length;
            for(; i < len ; i++ ){
                var value = data[i];
                var rooms = yield sequelize.query(
                    'SELECT hotel_room.id, hotel_room.hotel FROM hotel_room ' +
                    'LEFT JOIN hotel_activity_relation ' +
                    'ON hotel_room.id = hotel_activity_relation.id ' +
                    'WHERE hotel_activity_relation.id IS NULL ' +
                    'AND hotel_room.name = ? ' +
                    'AND hotel_room.price = ? ' +
                    'AND hotel_room.hotel = ? ' +
                    'AND hotel_room.deleted_at IS NULL ' +
                    'LIMIT ?;', {
                        type: sequelize.QueryTypes.SELECT,
                        replacements: [value.name, value.price, value.hotel, value.applied]
                    });
                var room_length = rooms.length;
                if(room_length < data[i].applied){
                    result_message.push(value.hotel_name + '-' + value.name + '房间数量不足,预定数量减少为' +  room_length);
                }
                _.forEach(rooms, function (v) {
                    room_relation.push({
                        hotel: v.hotel, //酒店ID
                        room: v.id, //房间ID
                        activity: activity //活动ID
                    })
                });
            }
            yield models.HotelActivityRelation.bulkCreate(room_relation);
            return response.ApiSuccess(res, {}, result_message.join(','));
        }catch (e){
            return response.ApiError(res, e, '数据错误');
        }
    });
});
module.exports = router;