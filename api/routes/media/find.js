/**
 * Created by Administrator on 2016/10/28 0028.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
router.get('/', function (req, res) {
    var id = req.query.id;
    if(!id){
        return response.ApiError(res, {}, '参数错误');
    }
    models.sequelize.query('SELECT * FROM gj_media WHERE mediaid = ' + id + ' LIMIT 0,1', {
        type: models.sequelize.QueryTypes.SELECT ,
        raw: true ,
        plain: true
    }).then(function (result) {
        return response.ApiSuccess(res, { data : (result&&result[0]) || {} });
    },function (err) {
        return response.ApiError(res,{}, '获取数据失败');
    });
});
module.exports = router;