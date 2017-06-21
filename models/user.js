"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("User", {
    uid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    user_login: { type: DataTypes.STRING(16), defaultValue:"" },        //登录名
    user_pass: { type: DataTypes.STRING(16), defaultValue:"",validate:{is:/(?=^.{6,18}$)(?=(?:.*?\d){1})(?=.*[a-z])(?=(?:.*?[A-Z]){1})(?!.*\s)[0-9a-zA-Z!@#$%*()_+^&]*$/} },//密码
    user_nicename: { type: DataTypes.STRING(50), defaultValue:""},     //昵称
    user_phone: { type: DataTypes.STRING(50), defaultValue:""},     //手机号码
    user_status:{ type : DataTypes.INTEGER, defaultValue:1 },//状态
    user_branch:{ type : DataTypes.INTEGER, defaultValue:0 },//所属分院 和权限里面的一直 为了兼容历史两边都保留
    user_parent:{ type : DataTypes.INTEGER, defaultValue:0 },//父级
    user_email: {  type: DataTypes.STRING(50), defaultValue:"" }, //email
  }, {
    classMethods: {
      associate: function(models) {
        models.User.belongsTo(models.Role);
        models.User.hasMany(models.Log,{foreignKey: 'uid',as:'ul'});
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_user',
    timestamps: true
  });
};
