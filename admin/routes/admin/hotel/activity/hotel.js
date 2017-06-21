/**
 * Created by Administrator on 2017/3/30 0030.
 */
var express = require('express');
var _ = require('lodash');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.get('/', Filter.authorize, function (req, res) {
    var query = req.query,
        activity = query.id,
        in_time = query.in_time,
        out_time = query.out_time;
    if(!activity){
        return response.ApiSuccess(res, []);
    }
    models.HotelActivityRelation.findAll({
        attributes: ['id'],
        where: {
            activity: activity
        },
        include: [{
            attributes: ['id','name','meals'],
            model: models.HotelDetail
        }, {
            attributes: ['id','name','type','bed','price'],
            model: models.HotelRoom,
            as: 'Rooms',
            include: [{
                attributes: ['id'],
                model: models.HotelReservation,
                required: false,
                where: {
                    $or: {
                        in_time: {
                            $gte: in_time,
                            $lt: out_time,
                        },
                        out_time: {
                            $gt: in_time,
                            $lte: out_time,
                        }
                    }
                },
                include: [{
                    attributes: ['name','sex'],
                    model: models.HotelHuman
                }]
            }]
        }]
    }).then(function (result) {
        return response.ApiSuccess(res, result , '获取成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;