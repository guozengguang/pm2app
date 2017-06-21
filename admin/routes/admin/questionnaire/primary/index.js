/**
 * Created by Administrator on 2016/12/6 0006.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var sequelize = require(process.cwd() + '/models/index').sequelize;
var models = require(process.cwd() + '/models/index');

router.all(Filter.authorize);

router.get('/',function (req, res) {
    var id= req.query.id;
    if(id){
        models.Questionnaire_Primary.findOne({
            where:{
                id: id
            }
        }).then(function (result) {
            return res.render('questionnaire/edit_primary', {
                title: '编辑项目',
                item: result
            });
        },function (err) {
            return response.ApiError(res, err);
        });
    }else {
        return res.render('questionnaire/examine', {
            title: '问题调查',
        });
    }
});
module.exports = router;