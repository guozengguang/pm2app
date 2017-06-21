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
        picture = body.picture,
        branches = body.branches,
        areas = body.areas,
        id = body.id;
    id && (delete body.id);
    if(id){
        if(_.isArray(picture)){
            body.picture = picture.join(',')
        }
        if(_.isArray(branches)){
            body.branches = branches.join(',')
        }
        if(_.isArray(areas)){
            body.areas = areas.join(',')
        }
        if(body.is_stay){
            body.is_stay = Boolean(Number(body.is_stay));
        }
        if(body.lessons){
            body.lessons = body.lessons.join(',');
        }
        models.HotelActivity.update(body,{
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
});
module.exports = router;