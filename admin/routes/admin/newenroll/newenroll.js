var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var sequelize = require(process.cwd() + '/models/index').sequelize;

router.all('/*',Filter.authorize);

router.get('/',function (req, res) {
    return res.render('newenroll/newenroll', {
        title: '新招生简章'
    });
});

module.exports = router;