var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.all(Filter.authorize);

router.get('/', function (req, res) {
    var query = req.query,
        page = query.page - 1 || 0,
        size = +query.size || 12,
        where = {
            level: 0
        }
    models.Apply_Template.findAndCountAll({
        where: where,
        limit: size,
        offset: 12 * page,
        order: 'createdAt DESC'
    }).then(function (result) {
        return response.ApiSuccess(res, result, '获取成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;