"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Notifics", {
    notid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    not_type: { type: DataTypes.INTEGER, defaultValue:0},          //类型 0未推送 1 已推送
    not_title: { type: DataTypes.STRING, defaultValue:"" },     //标题
    not_desc: { type: DataTypes.STRING, defaultValue:"" },     //描述
    not_content: { type: DataTypes.TEXT, defaultValue:"" },     //内容
    not_pics:{type : DataTypes.STRING,defaultValue:''},        //图片
    not_stime:{type:DataTypes.DATE, defaultValue:DataTypes.NOW},//开始时间
    not_etime:{type:DataTypes.DATE, defaultValue:DataTypes.NOW}//结束时间
  }, {
    classMethods: {
      associate: function(models) {}
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_notifics',
    timestamps: true
  });
};
