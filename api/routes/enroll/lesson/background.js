/**
 * Created by Administrator on 2016/10/14 0014.
 */
/**
 * Created by Administrator on 2016/10/11 0011.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var config = require(process.cwd() + '/config/config');

router.get('/', function (req, res) {
    var id = req.query.id;
    var select = 'SELECT goods_name,lesson_alias,background_img ' +
        'FROM gj_enroll_lesson LEFT JOIN gj_goods ' +
        'ON gj_enroll_lesson.lesson_name = gj_goods.goodsid WHERE lesson_id = ' + id + ' LIMIT 0, 1;';
    models.sequelize.query(select, {
        type: models.sequelize.QueryTypes.SELECT
    }).then((result)=>{
        if(result &&  result[0]){
            return response.ApiSuccess(res, { data : result[0] },'获取成功');
        }else {
            return response.ApiError(res,{},'沒有此課程');
        }
    },(err)=>{
        return response.ApiError(res,{},err.message);
    });
});
module.exports = router;
