/**
 * 新招生简章添加项目类型(0:课程1:活动2:其他)后的招生简章信息接口
 */

var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var Filter = require(cwd + '/utils/filter');
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var utils = require(cwd + '/middlerware/utils');
var StringBuilder = require(cwd + '/utils/StringBuilder');
var str = require(cwd + '/utils/str');
var co = require('co')
var request = require('request');

router.all(Filter.authorize);

router.get('/', function (req, res) {
    var query = req.query;
    var id = query.id;
    var project_type = 0;
    // var activityUrl = "http://api.geju.com/admin/hotel/activity/newenroll/get_hotel_activity";
    var course_name="";
    var where = {};
    if (!id) {
        return response.ApiError(res, {}, '参数错误');
    }
    co(function *() {
        var sql = new StringBuilder();
        sql.AppendFormat("SELECT * FROM gj_new_enroll WHERE newenroll_id='{0}' ", id);
        var enroll = yield models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT});
        project_type=enroll[0].project_type;
        if (project_type == 1) {
            // activityUrl += "?id=" + enroll[0].course_name;
            // request(activityUrl, function (error, response, body) {
            //     course_name = JSON.parse(body).result.title;
            // });
        }else if(project_type == 0){
            where.goodsid=enroll[0].course_name;
            var item=yield models.Goods.findOne({
                where:where
            })
            course_name = item.goods_name;
        }else if(project_type == 2){
            course_name = "其他"
        }
        enroll[0].course_name=course_name;
        enroll[0].adimg_url=str.AbsolutePath(enroll[0].adimg_url);
        return response.ApiSuccess(res, enroll[0], '查询成功');
    })
});

module.exports = router;