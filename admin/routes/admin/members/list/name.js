/**
 * Created by Administrator on 2016/12/14 0014.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');
var _ = require('lodash');
router.all(Filter.authorize);

router.get('/',function (req, res) {
    var id = req.query.id,mid;
    if(_.isArray(id)){
        mid = {
            $or: id
        }
    }else {
        mid = id;
    }
    models.Members.findAll({
        attribute: ['m_name'],
        where:{
            mid: mid
        }
    }).then(function (result) {
        result = _.pluck(result,'m_name');
        return response.ApiSuccess(res, result, '添加成功');
    },function (err) {
        return response.ApiError(res, err);
    });
});

module.exports = router;