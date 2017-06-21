/**
 * Created by Administrator on 2016/12/19 0019.
 */
var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var str = require(cwd + '/utils/str');

router.get('/',function (req, res) {
    var query = req.query,
        type = query.type,
        page = query.page - 1 || 0,
        order = query.order || 'createdAt DESC',
        size = +query.size || 12;
    models.Blessings.findAndCountAll({
        where:{
            type: type,
            status: 1
        },
        limit: size,
        offset: page * size,
        order: order,
        raw: true
    }).then(function (result) {
        result.rows.forEach(function (v) {
            v.video = str.AbsoluteVideoPath(v.video);
            v.image = str.AbsolutePath(v.image);
        });
        return response.ApiSuccess(res, result, '获取成功');
    },function (err) {
        return response.ApiError(res, err);
    })
});
module.exports = router;