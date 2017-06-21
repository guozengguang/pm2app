"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Inform", {
    inform_id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    inform_type: { type: DataTypes.INTEGER, defaultValue:0},          //类型
    inform_title: { type: DataTypes.STRING, defaultValue:"" },     //标题
    inform_key: { type: DataTypes.INTEGER, defaultValue:0 },     //外键key
    inform_status: { type: DataTypes.INTEGER, defaultValue:0 },     //状态
    inform_target: { type: DataTypes.TEXT, defaultValue:"" },     //收信者
    inform_create: { type: DataTypes.STRING, defaultValue:"" },     //发送者
  }, {
    classMethods: {
      associate: function(models) {}
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_inform',
    timestamps: true
  });
};
