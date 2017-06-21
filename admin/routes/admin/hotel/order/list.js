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


router.get('/', Filter.authorize, function (req, res) {
    var branch = req.Branch,
        where = {
            operator: req.Uid
        };
    if (branch !== 0) {
        where.branch = branch
    }
    models.HotelOrder.findAll({
        where: where,
        include: [{
            model: models.HotelActivity
        }]
    }).then(function (result) {
        return response.ApiSuccess(res, {list: result}, '获取成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;