"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("PlacesItem", {
    pi_id:{type : DataTypes.INTEGER, autoIncrement : true,primaryKey : true, unique : true},
    p_id:{type:DataTypes.INTEGER,defaultValue:0},//推荐位置
    pi_type:{type:DataTypes.INTEGER,defaultValue:0},//资源类型
    pi_name:{type:DataTypes.STRING(50),defaultValue:""},//名字
    pi_img:{type:DataTypes.STRING,defaultValue:""},//图
    pi_val:{type:DataTypes.STRING,defaultValue:""},//值
    pi_sort:{type:DataTypes.INTEGER,defaultValue:0},//排序
    pi_stime:{type:DataTypes.DATE, defaultValue:DataTypes.NOW},//开始时间
    pi_etime:{type:DataTypes.DATE, defaultValue:DataTypes.NOW},//结束时间
    pi_status:{type:DataTypes.INTEGER,defaultValue:0},//状态0=正常 1=停止
  }, {
    classMethods: {
      associate: function(models) {
      },getComplete(opt){
        var sql=new StringBuilder();
        // sql.AppendFormat("select * from (SELECT class_name,classid FROM gj_class WHERE class_name LIKE '%{0}%' ORDER BY class_name DESC) as t1 union all select * from (SELECT goods_name,goodsid FROM gj_goods WHERE goods_name LIKE '%{0}%' ORDER BY goods_name DESC) as t2",opt.vi_val);
        sql.AppendFormat("(SELECT class_name,classid,'课程' as type FROM gj_class WHERE class_name LIKE '%{0}%') " +
            "UNION ALL " +
            "(SELECT goods_name,goodsid,'课程班' as type FROM gj_goods WHERE goods_name LIKE '%{0}%') " +
            "UNION ALL " +
            "(SELECT activity_title,activity_id,'活动' as type FROM gj_activity WHERE activity_title LIKE '%{0}%') " +
            "UNION ALL " +
            "(SELECT special_title,special_id,CASE special_parent WHEN 0 THEN '专辑' ELSE '专辑子项' END as type FROM gj_special WHERE special_title LIKE '%{0}%') " +
            "ORDER BY class_name DESC",opt.vi_val);
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      }

    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_placesitem',
    timestamps: 'true',
    updatedAt:"updateat",
    createdAt:"createdat"
  });
};