/**
 * Created by Administrator on 2017/3/20 0020.
 */
var express = require('express');
var _ = require('lodash');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');
var co = require('co');

router.post('/', function (req, res) {

    var body = req.body,
        newenroll_id = body.newenroll_id,
        id = body.id;

    id && (delete body.id);
    co(function* () {
        var stmt = yield models.HotelActivity.findOne({
            where: {
                id: id
            }
        })
        var detail = stmt.dataValues;
        detail.newenroll_id = newenroll_id;
        (delete body.id);
        if(id){
            models.HotelActivity.update(detail,{
                where: {
                    id: id
                }
            }).then(function () {
                return response.ApiSuccess(res, {}, '更新成功');
            },function (err) {
                return response.ApiError(res, err);
            });
        }else {
            return response.ApiError(res, err, '参数错误');
        }
    })
});
module.exports = router;