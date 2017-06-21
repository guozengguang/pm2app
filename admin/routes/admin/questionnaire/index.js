/**
 * Created by Administrator on 2016/12/5 0005.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var sequelize = require(process.cwd() + '/models/index').sequelize;

router.all(Filter.authorize);

router.get('/',function (req, res) {
    return res.render('questionnaire/examine', {
        title: '问题调查',
    });
});
router.get('/add',function (req, res) {
    return res.render('questionnaire/create_primary', {
        title: '添加调查',
        parent : req.query.id
    });
});

module.exports = router;