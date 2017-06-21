/**
 * Created by Administrator on 2016/10/28 0028.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var Filter = require(process.cwd() + '/utils/filter');
router.all(Filter.authorize);
router.post('/', Filter.authorize, function (req, res) {
    var body = req.body;
    if (!body.id) {
        response.ApiError(res, '参数有误');
    }else {
        models.Column.update({
            column_status: 3
        }, {
            where: {
                columnid: body.id
            }
        }).then(function (result) {
            response.ApiSuccess(res, {}, '删除成功')
        }, function (err) {
            response.ApiError(res, '数据错误');
        });
        models.Columnmedia.update({
            cm_status: 0
        }, {
            where: {
                cm_columnid: body.id
            }
        })
    }
});
module.exports = router;