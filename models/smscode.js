"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Smscode", {
    smscodeid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    phoneno: { type: DataTypes.STRING(15), defaultValue:0},
    type: { type: DataTypes.INTEGER, defaultValue:0}, //0历史 1业务员验证码 2登录验证码 3注册验证码 4修改密码 5后台密码修改 6邀请验证码 7pc登陆
    area: { type: DataTypes.STRING(15), defaultValue:'+86'}, //手机区号
    smscode: { type: DataTypes.STRING(12), defaultValue:"" }
  }, {
    classMethods: {
      associate: function(models) {
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_smscode',
    timestamps: true
  });
};
