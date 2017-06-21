"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Devicetoken", {
    mdtokenid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    mdt_devicemodel: {type: DataTypes.INTEGER, defaultValue:0},//设备型号 1 android 2 ios
    mdt_member: { type: DataTypes.INTEGER, defaultValue:0},//会员id
    mdt_memberphone: { type: DataTypes.STRING(15), defaultValue:''},//会员手机号
    mdt_devicetoken: { type: DataTypes.STRING(64), defaultValue:'' }
  }, {
    classMethods: {
      associate: function(models) {
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_devicetoken',
    timestamps: true
  });
};
