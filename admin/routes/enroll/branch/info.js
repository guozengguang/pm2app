/**
 * Created by Administrator on 2016/10/13 0013.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var Filter = require(process.cwd() + '/utils/filter');
var _ = require('lodash');
var moment = require('moment');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');
router.all(Filter.authorize);

router.get('/', function (req, res) {
    var query = req.query,
        filter = query.filter,
        where = {},
        page = query.page || 1,
        size = query.size || 12;
    if(filter){
        if(filter.name){
            where.name = {
                $like: '%' + filter.name + '%'
            }
        }
        if(filter.phone){
            where.phone = {
                $like: '%' + filter.phone + '%'
            }
        }
        if(filter.reference){
            where.reference = {
                $like: '%' + filter.reference + '%'
            }
        }
    }
    models.BranchEnroll.findAndCountAll({
        where:where,
        raw: true,
        order: 'createdAt DESC',
        limit: size,
        offset: (page - 1) * size
    }).then(function (result) {
        return response.ApiSuccess(res, result, '获取成功');
    }, function (err) {
        return response.ApiError(res, {}, err.message);
    });
});

var tHead = '<thead><tr>' +
    '<td>序号</td>' +
    '<td>姓名</td>' +
    '<td>手机号码</td>' +
    '<td>企业名称</td>' +
    '<td>职位</td>' +
    '<td>省份</td>' +
    '<td>城市</td>' +
    '<td>报名日期</td>' +
    '<td>推荐人</td>' +
    '</tr></thead>';
router.get('/excel', function (req, res) {
    var query = req.query,
        where = {},
        filter = query.filter;
    if(filter){
        if(filter.name){
            where.name = {
                $like: '%' + filter.name + '%'
            }
        }
        if(filter.phone){
            where.phone = {
                $like: '%' + filter.phone + '%'
            }
        }
        if(filter.reference){
            where.reference = {
                $like: '%' + filter.reference + '%'
            }
        }
    }
    models.BranchEnroll.findAll({
        where: where,
        order: 'createdAt DESC',
        raw: true
    }).then(function (result) {
        if (!_.isArray(result)) {
            result = [result]
        }
        var tBody = '<tbody>';
        result.forEach(function (v, i) {
            tBody += '<tr>' +
                '<td>' + v.id + '</td>' +
                '<td>' + v.name + '</td>' +
                '<td>' + v.phone + '</td>' +
                '<td>' + v.enterprise + '</td>' +
                '<td>' + v.position + '</td>' +
                '<td>' + v.province + '</td>' +
                '<td>' + v.city + '</td>' +
                '<td>' + v.reference + '</td>' +
                '<td>' + moment(v.createdAt).format('YYYY年MM月DD日 hh:mm') + '</td>' +
                '</tr>'
        });
        tBody += '</tbody>';
        res.render('excel/enroll',{
            _html:tHead + tBody
        });
    }, function (err) {
        return response.ApiError(res, {}, err.message);
    });
});

router.get('/excelrating', function (req, res) {


     var query = req.query,
        id = query.filter.id,
        where = {
            parent: id
        },
        filter = query.filter;

  
     models.Rating.findAndCountAll({
        where:where
    }).then(function (result) {
        var sql=new StringBuilder();
        sql.Append("select rs.createdAt ");
         var tHead = '<thead><tr>'
        result.rows.forEach(function(n,i){
            sql.AppendFormat(",MAX(case r.id when {0} then (CASE when gr.`name` is not null then gr.`name` else  rs.`value` end) else '' end ) as  ",n.dataValues.id);
            sql.AppendFormat("'{0}' ",i);
            tHead+='<td>'+n.dataValues.name+'</td>';
        });
        tHead+='<td>时间</td>';
        tHead+='</tr></thead>';
        sql.AppendFormat(" from gj_rating_statistics as rs INNER JOIN gj_rating   as r on r.id = substring_index(substring_index(rs.parent,',',-2),',',1) LEFT JOIN  gj_rating as gr on gr.id = rs.`value` and r.method in (1,2) where rs.parent like '{0},%' ",id);
        if(filter.start_time!='')
        {
            sql.AppendFormat(" and  rs.createdAt >= '{0}'",filter.start_time);
        }
        if(filter.end_time!='')
        {
            sql.AppendFormat(" and rs.createdAt <= '{0}'",filter.end_time);
        }
        sql.Append(" group by rs.createdAt ORDER BY rs.createdAt DESC ");
        models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (result) {
                
                 var tBody = '<tbody>';
                result.forEach(function (v, i) {
                    v.createdAt = moment(v.createdAt).format('YYYY年MM月DD日 HH:mm:ss');
                    tBody += '<tr>' ;
                    for(var key in v)
                    {
                        tBody += '<td>'+v[key]+'</td>';
                    }
                    tBody += '</tr>';
                });
                tBody += '</tbody>';
                res.render('excel/enroll',{
                    _html:tHead + tBody
                    });
                }, function (err) {
            return response.ApiError(res, err);
        });    
    }, function (err) {
        return response.ApiError(res, {}, err.message);
    });
});
module.exports = router;