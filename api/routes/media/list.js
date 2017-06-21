/**
 * Created by Administrator on 2016/10/28 0028.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
router.get('/', function (req, res) {
    var size = req.query.size || 10;
    var page = req.query.page || 1;
    models.sequelize.query('SELECT * FROM gj_media LIMIT '+ ((page - 1) * size) +',' + size + ';', {
        type: models.sequelize.QueryTypes.SELECT ,
        raw: true ,
        plain: true
    }).then(function (result) {
        return response.ApiSuccess(res, { list : result || [] });
    },function (err) {
        return response.ApiError(res, '获取数据失败');
    });
});
module.exports = router;