/**
 * Created by Administrator on 2016/10/13 0013.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.all(Filter.authorize);
router.get('/',function (req, res) {
    var branch = req.session.user.user_branch;
    if(branch !=0){
        console.log();
        models.Classroom.findOne({
            where: {
                classroom: +branch
            },
            attributes: ['classroom_name'],
            raw : true
        }).then(function (result) {
            return res.render('enroll/manage', {
                title: '报名管理',
                branch_name: result.classroom_name
            });
        })
    }else {
        return res.render('enroll/manage', {
            title: '报名管理',
            branch_name: ''
        });
    }
});

module.exports = router;