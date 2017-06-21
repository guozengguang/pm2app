var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.all(Filter.authorize);

router.post('/', function (req, res) {
    var body = req.body,
        id = body.id;
    if (!id) {
        return response.ApiError(res, {}, '参数错误');
    }
    models.Apply_Template.destroy({
        where: {
            $or: [
                {
                    id: id
                }, {
                    parent:{
                        $like: id + ',%'
                    }
                },
                {
                    parent:{
                        $like:  '%,' + id
                    }
                },
                {
                    parent: id
                }
            ]
        }
    }).then(function (result) {
        return response.ApiSuccess(res, body, '删除成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;