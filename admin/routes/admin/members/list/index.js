/**
 * Created by Administrator on 2016/10/13 0013.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var sequelize = require(process.cwd() + '/models/index').sequelize;

router.all(Filter.authorize);

router.get('/',function (req, res) {
    var data = req.query,
        page = data.page || 0,
        size = data.pagesize || 20,
        keyword = data.keyword || '',
        query;
    if(keyword){
        query = 'SELECT m_phone, m_name FROM gj_members WHERE m_name LIKE "%'+ keyword +'%" LIMIT '+ page * size + ',' + size +';'
    }else {
        query = 'SELECT m_phone, m_name FROM gj_members LIMIT '+ page * size + ',' + size +';'
    }
    sequelize.query(query,{
        type: sequelize.QueryTypes.SELECT
    }).then(function (result) {
        response.onListSuccess(res, {
            list: result
        })
    })
});

module.exports = router;