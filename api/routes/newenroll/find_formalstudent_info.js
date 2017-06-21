var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var utils = require(cwd + '/middlerware/utils');
var StringBuilder = require(cwd + '/utils/StringBuilder');
var str = require(cwd + '/utils/str');
var co = require('co');

/**
 * 通过手机号码查询正式学员信息
 * @param phone - 手机号码
 * @returns {*}
 */
var checkInfo = (phone) => {
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("select m.m_name as name,m.mid from gj_members as m where m.m_phone={0} AND m.m_status=1 AND m.m_type=0",phone);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
};

router.post('/', function (req, res) {
    var body = req.body;
    if (!body.phone) {
        return response.ApiError(res, {}, '参数错误');
    }
    co(function *() {
        try{
            var check=yield checkInfo(body.phone)
            if(check.length==0){
                return response.ApiError(res,{code:401,message:'非格局学员不能参加'})
            }
            var sql = new StringBuilder();
            sql.AppendFormat("SELECT member.m_name,member.m_phone,member.m_position,member.classroomname,enterprise.productDesc ");
            sql.AppendFormat(" ,enterprise.hangye,enterprise.companyDesc,enterprise.name as m_company FROM (SELECT members.mid,members.m_name,members.m_phone, ");
            sql.AppendFormat(" members.m_company,members.m_position,userclass.uc_calssroomname AS classroomname FROM gj_members members ");
            sql.AppendFormat(" INNER JOIN gj_userclass userclass ON members.mid=userclass.uc_userid ");
            if(req.query.goodsid){
                sql.AppendFormat(" AND userclass.uc_goodsid ='{0}' ",req.query.goodsid);
            }
            sql.AppendFormat(" where members.m_status=1 AND members.m_type=0) member ");
            sql.AppendFormat(" LEFT JOIN (SELECT em.member AS mid,en.productDesc,en.trade AS hangye,en.desc AS companyDesc,mem.m_phone,en.name FROM gj_enterprise_member em ");
            sql.AppendFormat(" INNER JOIN gj_enterprise en ON em.enterprise=en.id INNER JOIN gj_members mem ");
            sql.AppendFormat(" ON em.member=mem.mid) enterprise ON member.mid=enterprise.mid where member.m_phone='{0}' LIMIT 1 ",body.phone);
            models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (result) {
                console.log(result[0],'result[0]')
                if(!result[0]){
                    return response.ApiError(res,{code:201,message:'不符合指定报名课程'})
                }
                return response.ApiSuccess(res, result[0], '查询成功');
            }, function (err) {
                return response.ApiError(res,err.toString());
            });
        }catch(err){
            console.log(err)
            return response.ApiError(res,err.toString());
        }
    })
});

module.exports = router;

