/**
 * Created by Administrator on 2017/2/24 0024.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var co = require('co');

router.get('/', function (req, res) {
    var query = req.query;
    if( !query.phone ){
        return response.ApiError(res, {} ,'参数有误');
    }
    models.sequelize.query('SELECT gj_classroom.classroom, ' +
        'mid, ' +
        'gj_classroom.classroom_name, ' +
        'gj_userclass.uc_goodsid AS `goods.id`, ' +
        'gj_goods.goods_name AS `goods.name` ' +
        'FROM gj_members ' +
        'INNER JOIN gj_userclass ON gj_members.mid = gj_userclass.uc_userid '+
        'INNER JOIN gj_classroom ON gj_classroom.classroom = gj_userclass.uc_calssroomid '+
        'INNER JOIN gj_goods ON gj_goods.goodsid = gj_userclass.uc_goodsid '+
        'WHERE m_phone = '+ query.phone +' GROUP BY gj_userclass.uc_calssroomid '+
        ' union all SELECT "" as classroom,mid,"" as classroom_name,"" as `goods.id`,"" as `goods.name` FROM gj_members  WHERE m_phone = '+ query.phone ,{
        type: models.sequelize.QueryTypes.SELECT,
        nest : true
    }).then(function (user) {
        return response.ApiSuccess(res, user? user[0] : undefined ,'查询成功');
    },function (err) {
        return response.ApiError(res,{},err.message);
    });
});
module.exports = router;
