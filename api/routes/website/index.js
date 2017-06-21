/**
 * Created by Administrator on 2017/1/10 0010.
 */
var express = require('express');
var _ = require('lodash');
var request = require('request-promise');
var co = require('co');

var router = express.Router();
var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var utils = require(process.cwd() + '/middlerware/utils');
var config = require(cwd + '/middlerware/website_config');
var index_map = config.index_map;
var domain = config.domain;

var options = {
    json: true,
    transform: function (body) {
        var list;
        if(body.code === 200){
            if(list = body.result.list){
                return list
            }
            if(list = body.result.detail[0]){
                return list.Item
            }
        }else {
            return false;
        }
    }
};

router.get('/', function (req, res) {
    var title = req.query.title;
    var id = req.query.id;
    console.log(title,'title')
    co(function *() {
        try {
            options.url = domain + '/column/media?id='+id;
            var column = yield request(options);
            if(!column){
                return response.ApiError(res, {message: '获取栏目失败'});
            }
            var i = 0,len = column.length;
            for(;i<len;i++){
                var v = column[i];
                var indexes = v.column_indexes;
                if(indexes){
                    options.url = index_map[indexes];
                    var a = yield request(options);
                    switch (indexes){
                        case 1000:
                            v.media = a.slice(0,2);
                            break;
                        case 1001:
                            v.media = a.slice(0,4);
                            break;
                        case 2:
                            v.media = a.slice(0,2);
                            break;
                        case 3:
                            v.media = a.slice(0,2);
                            break;
                        case 4:
                            v.media = a.slice(0,4);
                            break;
                        case 5:
                            v.media = a.slice(0,3);
                            break;
                        default: v.media = a;
                    }
                }
            }
            var arguments = [column, 'columnid', 'column_path'];
            if(title){
                arguments.concat(['column_title', title])
            }
            column = utils.appendPath.apply(null, arguments);
            response.ApiSuccess(res, column, '获取成功');
        }catch (e){
            return response.ApiError(res, e);
        }
    });
    //return response.ApiSuccess(res, result, '获取成功');
});
module.exports = router;