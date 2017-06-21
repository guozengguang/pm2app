var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var Filter = require(cwd + '/utils/filter');
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var utils = require(cwd + '/middlerware/utils');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');

router.all(Filter.authorize);

//var sqlStr = "select * from gj_apply_template as a where a.deletedAt is null and (a.id = $1 or a.parent = $1 or a.parent like $2 ) order by a.sort";

router.get('/', function (req, res) {
   var query = req.query,
        page = query.page - 1 || 0,
        id = query.id,
        where = {
            parent: id
        };
    
    models.Apply_Template.findAndCountAll({
        where:where
    }).then(function (result) {
        var sql=new StringBuilder();
        sql.Append("select rs.createdAt ");
        //return response.ApiSuccess(res, result);
        var listname = [];
        result.rows.forEach(function(n,i){
            sql.AppendFormat(",MAX(case r.id when {0} then (CASE when gr.`name` is not null then gr.`name` else  rs.`value` end) else '' end ) as  ",n.dataValues.id);
            sql.AppendFormat("'{0}' ",n.dataValues.name);
            listname.push(n.dataValues.name);
        });
        sql.AppendFormat(" from gj_apply_template_statistics as rs INNER JOIN gj_apply_template   as r on r.id = substring_index(substring_index(rs.parent,',',-2),',',1) LEFT JOIN  gj_apply_template as gr on gr.id = rs.`value` and r.method in (1,2) where rs.template = {0} ",id);
     
        sql.Append(" and rs.status = 1 group by rs.createdAt ORDER BY rs.createdAt  ");
        models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (result) {
                return response.ApiSuccess(res, {list:result});
                }, function (err) {
            return response.ApiError(res, err);
        });
    }, function (err) {
        return response.ApiError(res, err);
    });
   
});

module.exports = router;