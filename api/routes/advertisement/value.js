/**
 * Created by Administrator on 2016/11/29 0029.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var sql_middleware = require(process.cwd() + '/middlerware/sequelize');
var str = require(process.cwd() + '/utils/str');

router.get('/', function (req, res) {
    var filter = req.query.filter;
    var options = {
        raw: true
    };
    if(filter){
        options.where = {
            key:{
                $in: filter
            }
        };
    }
    models.Propagate.findAll(options)
        .then(function (items) {
            var obj = {}
            items.forEach(function (v ,i) {
                if(/\.(jpg|png|gif)$/.test(v.val)){
                    v.val = str.AbsolutePath(v.val)
                }
                obj[v.key] = v.val
            });
            return response.onSuccess(res, {data: obj})
        }, function (err) {
            sql_middleware.error(res, err);
        })
});
module.exports = router;