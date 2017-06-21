/**
 * Created by Administrator on 2016/10/26 0026.
 */
var express = require('express');
var router = express.Router();
var response = require(process.cwd() + '/utils/response');
var sequelize = require(process.cwd() + '/models/index').sequelize;
function rebuild(list){
    var arr = [];
    list.forEach(function(value){
        var f_2 = value.city_id.slice(0,2);
        var m_2 = value.city_id.slice(2,4);
        var l_2 = value.city_id.slice(4);
        if(m_2 + l_2 === '0000'){//一级
            arr[+f_2] = value;
        }else if(l_2 === '00'){//二级
            if(!arr[+f_2].children){
                arr[+f_2].children = [];
            }
            arr[+f_2].children[+m_2] = value;
        }else{
            if(!arr[+f_2].children[+m_2].children){
                arr[+f_2].children[+m_2].children = [];
            }
            arr[+f_2].children[+m_2].children.push(value);
        }
    });
    return JSON.parse(JSON.stringify(arr).replace(/null,/g,''));
}
router.get('/',function (req, res) {
    var deep = +req.query.deep || 0;
    switch (deep){
        case 1:
            sequelize.query('SELECT * FROM until_city WHERE city_parent_code = 0;',
                { type: sequelize.QueryTypes.SELECT , raw: true }
            ).then(function (result) {
                response.ApiSuccess(res, {
                    list: result
                }, '获取成功');
            },function (err) {
                response.ApiError(res,{},'获取失败')
            });
            break;
        case 2:
            sequelize.query('SELECT * FROM until_city as a WHERE a.city_parent_code LIKE "%0000" OR a.city_parent_code = 0;',
                { type: sequelize.QueryTypes.SELECT , raw: true }
            ).then(function (result) {
                response.ApiSuccess(res, {
                    list: rebuild(result)
                }, '获取成功');
            },function (err) {
                response.ApiError(res,{},'获取失败')
            });
            break;
        case 3:
            sequelize.query('SELECT * FROM until_city;',
                { type: sequelize.QueryTypes.SELECT , raw: true }
            ).then(function (result) {
                response.ApiSuccess(res, {
                    list: rebuild(result)
                }, '获取成功');
            },function (err) {
                response.ApiError(res,{},'获取失败')
            });
            break;
        default:
            response.ApiSuccess(res, {
                list: []
            }, '获取成功');
    }
});

module.exports = router;
