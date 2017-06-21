/**
 * Created by Administrator on 2016/10/28 0028.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var utils = require(process.cwd() + '/middlerware/utils');

router.get('/', function (req, res) {
    var query = req.query;
    var title = query.title;
    var select = 'SELECT * FROM gj_column WHERE column_status != 3 ';
    models.sequelize.query(select,{
        type: models.sequelize.QueryTypes.SELECT
    }).then(function (result) {
        if(title){
            result = utils.appendPath(result, 'columnid', 'column_path', 'column_title', title);
        }else {
            result = utils.appendPath(result, 'columnid', 'column_path', 'column_level', 1);
        }
        return response.ApiSuccess(res, { list : result || [] });
    },function (err) {
        return response.ApiError(res, '获取数据失败');
    })
});
module.exports = router;