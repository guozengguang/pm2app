/**
 * Created by Administrator on 2017/3/20 0020.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.post('/', Filter.authorize, function (req, res) {
    var body = req.body,
        hotel = body.hotel,
        remove = [],
        poor = body.room.count - body.target_count;
    delete body.room.count;
    if (!hotel) {
        return response.ApiError(res, {}, '参数错误');
    }
    models.HotelRoom.findAll({
        where: body.room,
        include: [{
            model: models.HotelReservation
        }]
    }).then(function (result) {
        result = JSON.parse(JSON.stringify(result));
        var i = 0,len = result.length;
        for (; i < len; i++) {
            if(result[i].HotelReservations.length === 0){
                remove.push(result[i].id);
                if(remove.length === poor){
                    break;
                }
            }
        }
        models.HotelRoom.destroy({
            where: {
                id: {
                    $in: remove
                }
            }
        }).then(function (result) {
            return response.ApiSuccess(res, {}, '删除成功');
        }, function (err) {
            return response.ApiError(res, err);
        });
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;