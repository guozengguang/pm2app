/**
 * Created by Administrator on 2016/11/29 0029.
 */
"use strict";

var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var Filter = require(process.cwd() + '/utils/filter');
var sql_middleware = require(process.cwd() + '/middlerware/sequelize');
router.all(Filter.authorize);
router.post('/', Filter.authorize, function (req, res) {
    var id = req.body.id;
    var where = {id: id};
    models.Propagate.destroy({
        where: where
    }).then(function () {
        return response.ApiSuccess(res,{},'删除成功')
    }, function (err) {
        sql_middleware.error(res, err);
    })
});
module.exports = router;