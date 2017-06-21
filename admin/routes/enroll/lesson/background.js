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
    models.EnrollLesson.findOne({
        where: {
            lesson_id: id
        },
        plain: true,
        raw: true,
        attributes: ['background_img']
    }).then((path)=>{
        if(path &&  path.background_img){
            return response.ApiSuccess(res, { src : path.background_img },'获取成功');
        }else {
            return response.ApiError(res,{},'沒有此課程');
        }
    },(err)=>{
        return response.ApiError(res,{},err.message);
    });
});
module.exports = router;
