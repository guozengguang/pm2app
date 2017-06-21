/**
 * Created by Administrator on 2016/10/21 0021.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');
var sequelize = require(process.cwd() + '/models/index').sequelize;

router.all(Filter.authorize);

router.get('/',function (req, res) {
    return res.render('media/offline', {
        title: '媒資下架'
    });
});
router.post('/',function (req, res) {
    var body = req.body;
    console.log(body);
    if(!body.id || !body.medias.length){
        response.ApiError(res, {} , '参数错误')
    }
    models.Columnmedia.destroy({
        where:{
            cm_columnid: body.id,
            cm_mediaid : {
                $in: body.medias
            }
        }
    }).then(function (result) {
        response.ApiSuccess(res, {} ,'下架成功');
    },function (err) {
        console.log(err);
        response.ApiError(res, err,'下架失败');
    })
});
module.exports = router;