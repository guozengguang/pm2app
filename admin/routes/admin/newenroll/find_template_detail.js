/**
 * Created by Administrator on 2016/12/13 0013.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');
var co = require('co');

router.all('/*',Filter.authorize);


router.get('/', function (req, res) {
    var branch = req.Branch;
    console.log(branch,'branch')
    // branch = 35;
    var query = req.query,
        page = query.page - 1 || 0,
        id = query.filter.id,
        newenroll_id = query.filter.newenroll_id;
        where = {
            parent: id
        },
        filter = query.filter;
    var classroom;
    var classRoomName;
    co(function *() {
        try{
            console.log(branch)
            classroom = yield models.Classroom.findOne({where:{classroom:branch},raw:true});
            if(classroom){
                classRoomName = classroom.classroom_name;
                if(classRoomName.indexOf(",") > -1 || classRoomName.indexOf("，") > -1){
                    classRoomName = classRoomName.replace("，",",").split(",")[2];
                }
            }
            models.Apply_Template.findAndCountAll({
                where: where
            }).then(function (result) {
                var sql = new StringBuilder();
                sql.Append("select rs.createdAt,rs.status ");
                //return response.ApiSuccess(res, result);
                var listname = [];
                var isHasClassroom = 0;
                var classRoomIndex = 0;
                result.rows.forEach(function (n, i) {
                    sql.AppendFormat(",MAX(case r.id when {0} then (CASE when gr.`name` is not null then gr.`name` else  rs.`value` end) else '' end ) as  ", n.dataValues.id);
                    sql.AppendFormat("'{0}' ", i);
                    listname.push(n.dataValues.name);
                    if(n.dataValues.method == 7){
                        isHasClassroom = 1;
                        classRoomIndex = i;
                    }
                });
                sql.AppendFormat(",rs.rowID from gj_apply_template_statistics as rs INNER JOIN gj_apply_template  as r on r.id = substring_index(substring_index(rs.parent,',',-2),',',1) LEFT JOIN  gj_apply_template as gr on gr.id = rs.`value` and r.method in (1,2) ");
                sql.AppendFormat(" where rs.template = '{0}' ", id);
                if (filter.start_time != '') {
                    sql.AppendFormat(" and rs.createdAt >= '{0}'", filter.start_time);
                }
                if (filter.end_time != '') {
                    sql.AppendFormat(" and rs.createdAt <= '{0}'", filter.end_time);
                }
                sql.AppendFormat(" and rs.newenroll_id='{0}' and rs.status !=2 group by rs.createdAt ORDER BY rs.createdAt DESC ",newenroll_id);
                models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT}).then(function (result) {
                    var newResultList = [];
                    if(branch && isHasClassroom){
                        result.forEach(function (node,index) {
                            if(classRoomName == node[classRoomIndex]){
                                newResultList.push(node);
                            }
                        })
                    }
                    if(newResultList && newResultList.length > 0){
                        result = newResultList;
                    }
                    return response.ApiSuccess(res, {list: result, listname: listname});
                }, function (err) {
                    return response.ApiError(res, err);
                });
            }, function (err) {
                return response.ApiError(res, err);
            });
        }catch(err){
            console.log(err)
            return response.ApiError(res, err);
        }
    })
});
module.exports = router;