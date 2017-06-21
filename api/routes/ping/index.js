/**
 * Created by Administrator on 2017/1/11 0011.
 */
var express = require('express');
var router = express.Router();
var cwd = process.cwd();

router.get('/', function (req, res) {
    res.send('ping成功')
});

module.exports = router;