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
        id = body.id;
    id && (delete body.id);
    if(id){
        models.HotelDetail.update(body,{
            where: {
                id: id
            }
        }).then(function () {
            if(body.meals){
                models.HotelRoom.update({
                    meals: body.meals
                },{
                    where: {
                        hotel: id
                    }
                }).then(function () {
                    return response.ApiSuccess(res, {}, '更新成功');
                },function (err) {
                    return response.ApiError(res, err);
                });
            }else {
                return response.ApiSuccess(res, {}, '更新成功');
            }
        },function (err) {
            return response.ApiError(res, err);
        });
    }else {
        return response.ApiError(res, err, '参数错误');
    }
});
module.exports = router;