"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Myfriend", {
    myfriendId : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    myfriend_owner: { type: DataTypes.INTEGER, defaultValue:0 },        //所有人
    myfriend_user: { type: DataTypes.INTEGER, defaultValue:0},     //好友id
    myfriend_type: { type: DataTypes.INTEGER, defaultValue:0},     //好友类型，0为好友，1未黑名单,2非好友
    myfriend_isdisturb: { type: DataTypes.INTEGER, defaultValue:0},     //消息免打扰
    myfriend_istop: { type: DataTypes.INTEGER, defaultValue:0},     //消息顶置
    myfriend_applycontent: { type: DataTypes.STRING, defaultValue:''}
  }, {
    classMethods: {
      associate: function(models) {        
      },findmyfriend:function(condition){
        var sql=new StringBuilder();
        sql.Append("select mf.myfriend_owner,mf.myfriend_user,mb.m_background as user_background,mb.m_name as user_name,mb.m_pics as user_pics,mb.m_company as user_company,mb.m_position as user_position,mb.m_phone as user_phone,mb.m_email as user_email,m_firstabv as user_firstabv,mf.myfriend_type,max(guc.uc_calssroomname) as uc_calssroomname  from gj_myfriend as mf  inner join gj_members as mb ")
        sql.AppendFormat("  on mf.myfriend_user = mb.mid inner join gj_myfriend as mfs on mfs.myfriend_owner =  mf.myfriend_user and  mfs.myfriend_user = mf.myfriend_owner left join gj_userclass as guc on guc.uc_userid=mb.mid where mf.myfriend_owner={0} and mf.myfriend_type in (0,1)  group BY myfriend_owner,myfriend_user,user_background,user_name,user_pics,user_company,user_position,user_phone,user_email,m_firstabv,myfriend_type ",condition.where.myfriend_owner);
        sql.Append(" order by mf.myfriend_type, mf.createdat desc");
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },findmynewfriend:function(condition){
        var sql=new StringBuilder();
        sql.Append("select mb.mid,mf.myfriend_owner,mf.myfriend_user,mb.m_background as user_background,mb.m_name as user_name,mb.m_pics as user_pics,mb.m_company as user_company,mb.m_position as user_position,mb.m_phone as user_phone,mb.m_email as user_email,m_firstabv as user_firstabv,mf.myfriend_type ,mf.myfriend_applycontent,CASE when hasmf.myfriendId is null then 1 else 0 end as isadd,max(case when guc.uc_calssroomname is null then '' else guc.uc_calssroomname end) as uc_calssroomname ")
        sql.AppendFormat(" from gj_myfriend as mf  inner join gj_members as mb on mf.myfriend_owner = mb.mid left JOIN gj_userclass as guc on guc.uc_userid = mb.mid  left join gj_myfriend as hasmf on hasmf.myfriend_user = mf.myfriend_owner and mf.myfriend_user = hasmf.myfriend_owner  and hasmf.myfriend_type = 0 where mf.myfriend_user={0} and mf.myfriend_type in (0) and mf.myfriend_applycontent <>'' and mf.myfriend_applycontent is not null  group by mid,mf.myfriend_owner,myfriend_user,user_background,user_name,user_pics,user_company,user_position,user_phone,user_email,user_firstabv,mf.myfriend_type ,mf.myfriend_applycontent,isadd ",condition.where.myfriend_owner);
        sql.Append(" order by mf.myfriend_type, mf.createdat desc ");
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },findmypushfriend:function(condition){
        var sql=new StringBuilder();
        sql.AppendFormat("select * from ((select mb.mid,mb.m_background as user_background,mb.m_name as user_name,mb.m_pics as user_pics,mb.m_company as user_company,mb.m_position as user_position,mb.m_phone as user_phone,mb.m_email as user_email,m_firstabv as user_firstabv,guc.uc_calssroomname from gj_members as mb INNER JOIN gj_userclass as guc on guc.uc_userid = mb.mid  inner join gj_userclass as gjuc on gjuc.uc_calssroomid = guc.uc_calssroomid and gjuc.uc_goodsid = guc.uc_goodsid where gjuc.uc_userid={0} and guc.uc_userid not in (select myfriend_user from gj_myfriend where myfriend_owner = {0} and myfriend_type in (0,1) ) and  mb.mid <> {0}   LIMIT 20 ) UNION ALL (select mb.mid,mb.m_background as user_background,mb.m_name as user_name,mb.m_pics as user_pics,mb.m_company as user_company,mb.m_position as user_position,mb.m_phone as user_phone,mb.m_email as user_email,m_firstabv as user_firstabv,guc.uc_calssroomname from gj_members as mb INNER JOIN gj_userclass as guc on guc.uc_userid = mb.mid  inner join gj_userclass as gjuc on  gjuc.uc_goodsid = guc.uc_goodsid and gjuc.uc_userid = {0} and gjuc.uc_calssroomid <> guc.uc_calssroomid where guc.uc_userid not in (select myfriend_user from gj_myfriend where myfriend_owner = {0} and myfriend_type in (0,1)) order by m_name  LIMIT 20  ) UNION ALL (select mb.mid,mb.m_background as user_background,mb.m_name as user_name,mb.m_pics as user_pics,mb.m_company as user_company,mb.m_position as user_position,mb.m_phone as user_phone,mb.m_email as user_email,m_firstabv as user_firstabv,cr.classroom_name as uc_calssroomname from gj_members as mb INNER JOIN gj_branch_manage as bm on  bm.member = mb.mid  inner join gj_branch_manage as bm1 on bm.classroom = bm1.classroom INNER JOIN gj_classroom as cr on bm1.classroom = cr.classroom where bm1.member = {0} and mb.mid <> {0})) as b group by mid,user_background,user_name,user_pics,user_company,user_position,user_phone,user_email,user_firstabv,uc_calssroomname   LIMIT 20",condition.where.myfriend_owner);

        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_myfriend',
    timestamps: true
  });
};
