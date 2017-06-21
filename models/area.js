"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Area", {
    areaid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    area_name: { type: DataTypes.STRING, defaultValue:"" },        //学区名称
    area_region: { type: DataTypes.STRING, defaultValue:"" },        //大区
    area_city: { type: DataTypes.STRING, defaultValue:""},          //学区所在城市
    area_remark: { type: DataTypes.STRING, defaultValue:"" },     //备注
    area_create: { type: DataTypes.STRING(50), defaultValue:"" },     //创建者
  }, {
    classMethods: {
      associate: function(models) { 
        models.Area.hasMany(models.Classroom,{foreignKey: 'classroom_areaid'});
      },list(option){
        var sql=new StringBuilder();
        sql.AppendFormat("select gj_classroom.classroom_status,gj_classroom.classroom_areaid,gj_classroom.classroom_head,gj_classroom.classroom,gj_classroom.classroom_name,gj_classroom.classroom_area_city,gj_classroom.classroom_pics,gj_area.area_name from gj_area INNER JOIN gj_classroom ON gj_area.areaid=gj_classroom.classroom_areaid where 1=1");
        if(option.area_name){
          sql.AppendFormat(" and area_name='{0}'",option.area_name);
        }
        sql.AppendFormat(" ORDER BY area_name,classroom_area_city DESC");
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getAllArea(){
        var sql=new StringBuilder();
        sql.AppendFormat("select area_name from gj_area GROUP BY area_name");
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getAllCity(option){
        var sql=new StringBuilder();
        //sql.AppendFormat("select area_city,areaid,area_name from gj_area where 1=1 and area_name IN ('北京') GROUP BY area_city ORDER BY area_city DESC");
        sql.AppendFormat("select area_city,areaid,area_name from gj_area where 1=1");
        if(option.recruit_area){
          sql.AppendFormat(" and area_name IN ({0})",option.recruit_area);
        }
        sql.AppendFormat(" GROUP BY area_city ORDER BY area_city DESC");
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getAllCityReport(option){
        var sql=new StringBuilder();
        //sql.AppendFormat("select area_city,areaid,area_name from gj_area where 1=1 and area_name IN ('北京') GROUP BY area_city ORDER BY area_city DESC");
        sql.AppendFormat("select area_city,areaid,area_name,classroom_name,classroom from gj_area INNER JOIN gj_classroom ON gj_area.areaid=gj_classroom.classroom_areaid where 1=1");
        if(option.recruit_area){
          sql.AppendFormat(" and area_name IN ({0})",option.recruit_area);
        }
        sql.AppendFormat(" ORDER BY area_city,area_name DESC");
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getGroupUser(option){
        var sql=new StringBuilder();
        sql.Append("select groupuser_user,group_classroom,m_name,groupuser_group from gj_groupuser")
        sql.Append(" INNER JOIN gj_group ON gj_groupuser.groupuser_group=gj_group.groupid");
        sql.Append(" INNER JOIN gj_members ON gj_groupuser.groupuser_user=gj_members.mid");
        sql.AppendFormat(" WHERE group_goodid={0} AND group_type={1}",option.goodsid,option.type);
        if(option.classroom){
          sql.AppendFormat(" AND group_classroom={0}",option.classroom);
        }
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getAreaClassroom(option){
          var sql=new StringBuilder();
          sql.Append("select * from gj_area")
          sql.Append(" INNER JOIN gj_classroom ON gj_classroom.classroom_areaid=gj_area.areaid");
          sql.AppendFormat(" WHERE classroom={0}",option.classroom);
          return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getGropuClass(option){
        var sql=new StringBuilder();
        sql.Append("select classroom_name from gj_groupuser")
        sql.Append(" INNER JOIN gj_group ON gj_groupuser.groupuser_group=gj_group.groupid");
        sql.Append(" INNER JOIN gj_classroom ON gj_classroom.classroom=gj_group.group_classroomid");
        sql.AppendFormat(" WHERE groupuser_user={0} AND group_type=9 ORDER BY gj_groupuser.createdAt",option.userid);
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getGropuGoode(option){
        var sql=new StringBuilder();
        sql.Append("select goods_subtitle,group_type,group_classroom,classroom_name,goodsid from gj_groupuser")
        sql.Append(" INNER JOIN gj_group ON gj_groupuser.groupuser_group=gj_group.groupid");
        sql.Append(" LEFT JOIN gj_goods ON gj_goods.goodsid=gj_group.group_goodid");
        sql.Append(" INNER JOIN gj_classroom ON gj_classroom.classroom=gj_groupuser.group_classroom");
        sql.AppendFormat(" WHERE groupuser_user={0} AND group_type IN (5,6,7,8,10) ORDER BY gj_groupuser.createdAt",option.userid);
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getGropuGoodeAll(option){
        var sql=new StringBuilder();
        sql.Append("select goodsid from gj_groupuser")
        sql.Append(" INNER JOIN gj_group ON gj_groupuser.groupuser_group=gj_group.groupid");
        sql.Append(" LEFT JOIN gj_goods ON gj_goods.goodsid=gj_group.group_goodid");
        sql.AppendFormat(" WHERE groupuser_user={0} AND group_type IN (7,10) ORDER BY gj_groupuser.createdAt DESC",option.userid);
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },findAllGoods(option){
        var sql=new StringBuilder();
        sql.Append("select group_name,goods_name from gj_group")
        sql.Append(" INNER JOIN gj_goods ON gj_group.group_goodid=gj_goods.goodsid");
        sql.AppendFormat(" WHERE group_classroomid={0} AND group_type=3",option.group_classroomid);
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_area',
    timestamps: true
  });
};
