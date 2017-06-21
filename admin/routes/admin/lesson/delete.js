var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');

router.post('/', function (req, res) {
    var id = req.body.id;
    if (!id) { return response.ApiError(res, {} , '参数错误') }
    models.sequelize.query('DELETE FROM gj_enroll_lesson WHERE lesson_id = ' + id,{
        type: models.sequelize.QueryTypes.DELETE
    }).then(function (result) {
        response.ApiSuccess(res , {},'删除成功')
    },function (err) {
        return response.ApiError(res,{},err.message);
    });
});
module.exports = router;