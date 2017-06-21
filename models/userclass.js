"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Userclass", {
    ucid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    uc_goodsid: { type: DataTypes.INTEGER, defaultValue:0 },        //课程id
    uc_userid: { type: DataTypes.INTEGER, defaultValue:0},          //用户id
    uc_clerkid: { type: DataTypes.INTEGER, defaultValue:0},          //业务员id
    uc_areaid:{type: DataTypes.INTEGER, defaultValue:0},        //学区id
    uc_calssroomid:{type: DataTypes.INTEGER, defaultValue:0},        //教室id
    uc_userphone: { type: DataTypes.STRING(16), defaultValue:"" },     //学员手机号
    uc_areaname: { type: DataTypes.STRING, defaultValue:"" },     //学区名称
    uc_calssroomname:{type : DataTypes.STRING(50),defaultValue:''},        //教室名称
    uc_status:{type: DataTypes.INTEGER, defaultValue:0},        //状态 1成功 0未交费
    uc_paytime:{type: DataTypes.DATE, defaultValue:DataTypes.NOW},        //缴费时间
    uc_remark:{type : DataTypes.STRING,defaultValue:''},        //备注
    uc_create:{type : DataTypes.STRING(50),defaultValue:''}        //创建者
  }, {
    classMethods: {
      associate: function(models) {
        models.Userclass.belongsTo(models.Goods,{foreignKey: 'uc_goodsid'});
        models.Userclass.belongsTo(models.Members,{foreignKey: 'uc_userid'});
        //models.Userclass.belongsTo(models.Members,{foreignKey: 'uc_clerkid',as:'cl'});
      },getMyClass: function(opt){
        var sql=new StringBuilder();
        sql.Append("SELECT goodsid,goods_name,goods_start,goods_img,goods_summary,goods_time,classid,class_name,class_start,class_teacherid,class_qustart,class_asstart,class_end,m_name,goods_ismore,m_pics,m_position,class_img,class_summary,cl.late_time,case when cl.late_time is null then 0 else 1 end as late_null FROM gj_userclass as userclass");
        sql.Append(" INNER JOIN gj_goods as goods ON userclass.uc_goodsid=goods.goodsid");
        sql.Append(" LEFT JOIN gj_class as class ON class.class_goodsid=goods.goodsid AND now() < class.class_end");
        sql.Append(" LEFT JOIN gj_members as members ON members.mid=class_teacherid");
        sql.Append(" LEFT JOIN (select min(class_start) as late_time,class_goodsid from gj_class where now() < class_end group by class_goodsid) as cl on cl.class_goodsid=goods.goodsid");
        sql.AppendFormat(" WHERE userclass.uc_userid={0} AND uc_status=1",opt.userid);
        sql.Append(" ORDER  BY late_null desc ,late_time,goods_start desc,class_start");
        //sql.AppendFormat(" GROUP BY area_city ORDER BY area_city DESC");
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getMyClassSpecial: function(opt){
        var sql=new StringBuilder();
        sql.Append("SELECT goodsid,goods_name,goods_start,goods_img,goods_summary,goods_time,classid,class_name,class_start,class_teacherid,class_qustart,class_asstart,class_end,m_name,goods_ismore,m_pics,m_position,class_img,class_summary,cl.late_time,case when cl.late_time is null then 0 else 1 end as late_null FROM gj_goods as goods");
        sql.Append(" LEFT JOIN gj_class as class ON class.class_goodsid=goods.goodsid AND now() < class.class_end");
        sql.Append(" LEFT JOIN gj_members as members ON members.mid=class_teacherid");
        sql.Append(" LEFT JOIN (select min(class_start) as late_time,class_goodsid from gj_class where now() < class_end group by class_goodsid) as cl on cl.class_goodsid=goods.goodsid");
        if(opt.goodid){
          sql.AppendFormat(" WHERE goods.goodsid IN {0}",opt.goodid);
        }
        sql.Append(" ORDER  BY late_null desc ,late_time,goods_start desc,class_start");
        //sql.AppendFormat(" GROUP BY area_city ORDER BY area_city DESC");
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_userclass',
    timestamps: true
  });
};
