/**
 * Created by Administrator on 2016/12/6 0006.
 */
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

router.get('/',function (req, res){
    return res.render('questionnaire/data', {
        title: '关联数据',
        id: req.query.id
    });
});

module.exports = router;