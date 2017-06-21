/**
 * Created by Administrator on 2016/12/13 0013.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');

router.all(Filter.authorize);



router.get('/', function (req, res) {
    var query = req.query,
        page = query.page - 1 || 0,
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
        //return response.ApiSuccess(res, result);
        var listname = [];
        result.rows.forEach(function(n,i){
            sql.AppendFormat(",MAX(case r.id when {0} then (CASE when gr.`name` is not null then gr.`name` else  rs.`value` end) else '' end ) as  ",n.dataValues.id);
            sql.AppendFormat("'{0}' ",i);
            listname.push(n.dataValues.name);
        });
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
                return response.ApiSuccess(res, {list:result,listname:listname});
                }, function (err) {
            return response.ApiError(res, err);
        });
    }, function (err) {
        return response.ApiError(res, err);
    });
   
});
module.exports = router;