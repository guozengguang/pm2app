"use strict";

var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Groupuser", {
    groupuserid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    groupuser_user: { type: DataTypes.INTEGER, defaultValue:0 },       //群成员
    groupuser_group: { type : DataTypes.STRING(32),defaultValue:'' },    //群组外键
    group_istop: { type : DataTypes.INTEGER,defaultValue:0 },
    group_isdisturb: { type : DataTypes.INTEGER,defaultValue:0 },
    group_classroom: { type : DataTypes.INTEGER,defaultValue:0 },
  }, {
    classMethods: {
      associate: function(models) {        
      },getgroupuserbygroup:function(condition){
        var sql=new StringBuilder();
        sql.Append("select gpu.groupuser_user as user_id,m_company as user_company,m_phone as user_phone,m_name as user_name,m_pics as user_pics,gpu.groupuser_group,m_position as user_position,m_firstabv as user_firstabv from gj_groupuser gpu inner join ");
        if(condition.where.groupid)
        {
          sql.AppendFormat(" gj_members as m on gpu.groupuser_user=m.mid where gpu.groupuser_group='{0}'",condition.where.groupid);
        }else if(condition.where.hxid)
        {
          sql.AppendFormat(" gj_members as m on gpu.groupuser_user=m.mid inner join gj_group as gp on gp.groupid=gpu.groupuser_group where gp.group_hxid='{0}'",condition.where.hxid);
        }
        if(condition.where.qcontent!=""){
        sql.AppendFormat(" and (m.m_name like '%{0}%' or m.m_phone like '%{0}%'  or m.m_company like '%{0}%')",condition.where.qcontent);
        }
        sql.Append(' group by gpu.groupuser_user,m_company,m_phone,m_name,m_pics,gpu.groupuser_group,m_position,m_firstabv order by m_firstabv ')
        if(condition.where.limit){
        sql.AppendFormat(" limit {0},{1}",condition.where.offset,condition.where.limit);
        }
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
     },getgroupuserbygroupv15:function(condition){
        var sql=new StringBuilder();
        if(condition.where.grouptype==9)
        {
          sql.Append("select m.mid as user_id,m_company as user_company,m_phone as user_phone,m_name as user_name,m_pics as user_pics,'' as groupuser_group,m_position as user_position,m_firstabv as user_firstabv ,case when type = 1 then '院长' when type = 2 then '教学' when type = 3 then '班主任' when type = 4 then '班级助理'  ELSE '招生' END as group_type  ");
          sql.AppendFormat(" from gj_branch_manage as bm inner join gj_members as m on bm.member=m.mid where bm.classroom = {0} and type in (2,3,4,5) ORDER BY case when type =2 then 4 when type =3 then 2 when type =4 then 3 else type end  ",condition.where.groupid);
        }else
        {
              sql.Append("select gpu.groupuser_user as user_id,m_company as user_company,m_phone as user_phone,m_name as user_name,m_pics as user_pics,gpu.groupuser_group,m_position as user_position,m_firstabv as user_firstabv,'' as group_type from gj_groupuser gpu inner join ");
              if(condition.where.groupid)
              {
                    sql.AppendFormat(" gj_members as m on gpu.groupuser_user=m.mid where gpu.groupuser_group='{0}'",condition.where.groupid);
              }else if(condition.where.hxid)
              {
                    sql.AppendFormat(" gj_members as m on gpu.groupuser_user=m.mid inner join gj_group as gp on gp.groupid=gpu.groupuser_group where gp.group_hxid='{0}'",condition.where.hxid);
              }
              if(condition.where.qcontent!=""){
                  sql.AppendFormat(" and (m.m_name like '%{0}%' or m.m_phone like '%{0}%'  or m.m_company like '%{0}%')",condition.where.qcontent);
              }
              sql.Append(' group by gpu.groupuser_user,m_company,m_phone,m_name,m_pics,gpu.groupuser_group,m_position,m_firstabv order by m_firstabv ')
              if(condition.where.limit){
                  sql.AppendFormat(" limit {0},{1}",condition.where.offset,condition.where.limit);
              }
        }
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
     },getgroupuserbygood:function(condition){
        var sql=new StringBuilder();
        sql.Append("select gp.group_name,gpu.groupuser_user as user_id,m_company as user_company,m_phone as user_phone,m_name as user_name,m_pics as user_pics,gpu.groupuser_group,m_position as user_position,m_firstabv as user_firstabv from gj_groupuser gpur inner join gj_group as gp on gpur.groupuser_group = gp.groupid LEFT JOIN   gj_groupuser as gpu on gpu.groupuser_group = gp.groupid inner join gj_members as m on gpu.groupuser_user=m.mid   ");
        sql.AppendFormat(" where gp.group_goodid={0} and gpur.groupuser_user={1} and gp.group_type = 3 ",condition.where.goodid,condition.where.userid);
        sql.Append(' group by gp.group_name,gpu.groupuser_user,m_company,m_phone,m_name,m_pics,gpu.groupuser_group,m_position,m_firstabv')
        if(condition.where.limit){
        sql.AppendFormat(" limit {0},{1}",condition.where.offset,condition.where.limit);
        }
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
     }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_groupuser',
    timestamps: true
  });
};
