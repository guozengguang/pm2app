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
var aly = require(process.cwd() + '/config/config').aly;
router.all(Filter.authorize);

router.get('/', Filter.authorize, function (req, res) {
    models.Propagate.findAll()
        .then(function (items) {
            return response.onSuccess(res, {
                list: items,
                base: aly
            })
        }, function (err) {
            sql_middleware.error(res, err);
        })
});
module.exports = router;
