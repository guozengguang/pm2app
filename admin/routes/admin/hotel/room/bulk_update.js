/**
 * Created by Administrator on 2017/3/20 0020.
 */
var express = require('express');
var _ = require('lodash');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.post('/', Filter.authorize,function (req, res) {
    var body = req.body,
        hotel = body.hotel,
        room = body.room;
    if(hotel){
        models.HotelRoom.update({
            name: room.new_name,
            price: room.new_price,
            bed: room.new_bed
        },{
            where: {
                hotel: +hotel,
                name: room.old_name,
                price: +room.old_price,
                bed: +room.old_bed
            }
        }).then(function () {
            return response.ApiSuccess(res, {}, '更新成功');
        },function (err) {
            return response.ApiError(res, err);
        });
    }else {
        return response.ApiError(res, err, '参数错误');
    }
});
module.exports = router;