/**
 * Created by Administrator on 2016/12/6 0006.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var sequelize = require(process.cwd() + '/models/index').sequelize;
var models = require(process.cwd() + '/models/index');
var _ = require('lodash');

router.all(Filter.authorize);

function appendChild(result) {
    result.forEach(function (item, i) {
        var parent_id = item.parent_id;
        result.every(function (v) {
            if(v.id == parent_id){
                if(v.children){
                    v.children.push(item);
                }else {
                    v.children = [item];
                }
                return false;
            }
            return true;
        })
    });
    return _.filter(result, function (item) {
        var boolean = (item.parent_id === 0 && item.hierarchy === 1);
        delete item.parent_id;
        return boolean;
    });
}

router.get('/', function (req, res) {
    var query = req.query;
    var hierarchy = query.hierarchy;
    var page = query.page || 1;
    var size = query.size || 12;
    /* 判断参数 */
    var options = {
        attributes:['id','name','parent_id','hierarchy'],
        raw: true
    };
    if(hierarchy == '0'){
        return response.ApiSuccess(res, {
            list: []
        }, '获取成功');
    }
    if (hierarchy) {
        options.where = {
            hierarchy: +hierarchy
        }
    }
    /* 判断参数结束 */
    models.Questionnaire_Primary.findAll(options).then(function (result) {
        if(!hierarchy){
            result = appendChild(result);
        }
        return response.ApiSuccess(res, {
                list: result.slice( (page - 1) * size, size),
                count: Math.ceil(result.length / size)
            } || {
                list:[]
            }, '获取成功');
    },function (err) {
        return response.ApiError(res, err);
    })
});

module.exports = router;