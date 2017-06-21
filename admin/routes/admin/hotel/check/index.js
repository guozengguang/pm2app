/**
 * Created by Administrator on 2017/3/30 0030.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');
var _ = require('lodash');
var sequelize = models.sequelize;

router.post('/', Filter.authorize,function (req, res) {
    var body = req.body,
        human = body.human,
        reservation = body.reservation;
    if(!human || !reservation){
        return response.ApiError(res, {}, '参数错误');
    }
    reservation.operator = req.session.user.uid;//添加操作人ID
    human.sex = human.sex === 'true';
    models.HotelHuman.findOrCreate({
        where: {
            phone: human.phone
        },
        defaults: human
    }).then(function (human) {
        human = human[0].dataValues;
        reservation.human = human.id;
        sequelize.transaction(function (t) {
            return models.HotelRoom.findOne({
                where: {
                    id:  reservation.room
                },
                include: [{
                    attributes: ['id'],
                    model: models.HotelReservation,
                    required: false,
                    where: {
                        $or: {
                            in_time: {
                                $gte: reservation.in_time,
                                $lt: reservation.out_time,
                            },
                            out_time: {
                                $gte: reservation.in_time,
                                $lt: reservation.out_time,
                            }
                        }
                    }
                }],
                transaction:t
            }).then(function (room) {
                if(room){
                    room = room.dataValues;
                    if(+room.bed > room.HotelReservations.length){
                        // 可以住

                        return models.HotelReservation.create(reservation);
                    }
                }else {
                    return response.ApiSuccess(res, {}, '入住失败');
                }
            })
        }).then(function (result){
            return response.ApiSuccess(res, {}, '入住成功');
        }).catch(function(err){
            return response.ApiError(res, err);
        });
    }, function (err) {
        return response.ApiError(res, err);
    });

});
module.exports = router;