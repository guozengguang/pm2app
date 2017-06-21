/**
 * Created by Administrator on 2017/3/25 0025.
 */
var express = require('express');
var co = require('co');
var _ = require('lodash');
var router = express.Router();
var cwd = process.cwd();
var Filter = require(cwd + '/utils/filter');
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');

router.get('/', Filter.authorize, function (req, res) {
    models.Area.findAll({
        include: [{
            model: models.Classroom,
            attributes: ['classroom','classroom_name']
        }],
        raw: true
    }).then(function (result) {
        var obj = {}, list = [];
        _.forEach(result, function (v, i) {
            var key = v.area_region;
            if(key){
                if(!obj[key]){
                    obj[key] = {}
                }
                obj[key].id = v.areaid;
                obj[key].name = v.area_region;
                if(obj[key].children){
                    obj[key].children .push({
                        id: v['Classrooms.classroom'],
                        name: v['Classrooms.classroom_name'],
                    })
                }else {
                    obj[key].children = [{
                        id: v['Classrooms.classroom'],
                        name: v['Classrooms.classroom_name'],
                    }]
                }
            }
        });
        _.forIn(obj, function (v, i) {
            list.push(v);
        });
        return response.ApiSuccess(res, list, '获取成功');
    }, function (err) {
        return response.ApiError(res, err)
    })
});
module.exports = router;