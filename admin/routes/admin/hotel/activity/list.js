/**
 * Created by Administrator on 2017/3/20 0020.
 */
var express = require('express');
var _ = require('lodash');
var moment = require('moment');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');


router.get('/', Filter.authorize, function (req, res) {
    var query = req.query,
        type = query.type,
        branch = query.branch,
        state = query.state,
        from_branch = query.from_branch;
    var where = {};
    if(type == 1){
        where.enroll_start_time = {
            $lte: moment().format('YYYY-MM-DD')
        };
        where.enroll_end_time = {
            $gt: moment().format('YYYY-MM-DD')
        };
    }
    if(state){
        where.state = +state;
    }
    if(from_branch==0){
        if(branch && branch < 1 ){
            where.branch = {
                $lte: 1
            }
        }else if(branch){
            where.branch = {

                    $gt: 1
            }

        }
    }else if(from_branch){
        where.branch = branch
    }

    models.HotelActivity.findAll({
        where: where,
        include: [{
            model: models.Classroom,
            attributes: [['classroom','id'],['classroom_name','name']]
        }]
    }).then(function (result) {
        return response.ApiSuccess(res, { list: result }, '获取成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;