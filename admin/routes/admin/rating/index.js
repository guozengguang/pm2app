/**
 * Created by Administrator on 2016/12/13 0013.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');

router.all(Filter.authorize);

router.get('/manage',function (req, res) {
    return res.render('rating/manage', {
        title: '评价列表',
    });
});
router.get('/detaillist',function (req, res) {
    return res.render('rating/detaillist', {
        title: '评价详细列表',
        parent : req.query.id
    });
});
router.get('/statistics',function (req, res) {
    return res.render('rating/statistics', {
        title: '评价统计',
        parent : req.query.id
    });
});
router.get('/edit',function (req, res) {
    return res.render('rating/edit', {
        title: '评价编辑',
        parent : req.query.id
    });
});
module.exports = router;