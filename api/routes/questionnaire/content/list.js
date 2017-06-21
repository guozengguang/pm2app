/**
 * Created by Administrator on 2016/12/6 0006.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var co = require('co');
var _ = require('lodash');
var map = {//数据库字段映射表
    id: 'id',
    desc: 'describe',
    count: 'vote_count',
    create: 'createdAt',
    state: 'state',
    parent: 'parent_id',
    from: 'from',
    update: 'updatedAt',
    delete: 'deletedAt'
};
router.get('/', function (req, res) {
    var query = req.query,
        id = +query.id,//id
        options = {
            attributes: ['id','name','describe','vote_count','createdAt'],
            where: {
                parent_id: id,
                state: 1,
                from: 0
            },
            raw: true
        },
        sort = query.sort? map[query.sort] : 'createdAt',//排序字段
        isDESC = query.desc ?  ' DESC' : '',//排序
        size = query.size || 20,
        last_id = query.last_id || '';
    if(!id || !sort){
        return response.ApiError(res, err, '参数错误');
    }
    options.order = sort + isDESC;
    models.Questionnaire_Content.findAndCountAll(options).then(function (item) {
        if(last_id){
            console.log('last_id');
            var index = _.findIndex(item.rows, 'id', +last_id);
            item.rows = _.slice(item.rows, index + 1, size);
            return response.ApiSuccess(res, item, '获取成功');
        }else {
            item.rows = _.slice(item.rows, 0, size);
            return response.ApiSuccess(res, item, '获取成功');
        }
    }, function (err) {
        console.log(err);
        return response.ApiError(res, err, '获取失败');
    });
});
module.exports = router;