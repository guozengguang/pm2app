"use strict";
/**
 * 角色表
 * @param  {[type]} sequelize [description]
 * @param  {[type]} DataTypes [description]
 * @return {[type]}           [description]
 */
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Role", {
    rid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    r_name: { type: DataTypes.STRING(50), defaultValue:""},//权限名称
    r_permission: { type: DataTypes.STRING, defaultValue:"" },//菜单权限字符串 不能为空
    r_permission_menu: { type: DataTypes.STRING, defaultValue:"" },//角色权限字符串 不能为空
    r_area: { type: DataTypes.STRING, defaultValue:"" },//不知道干嘛的，暂时保留
    r_branch: { type : DataTypes.INTEGER, defaultValue:0 },//0表示总院设置的权限 不为0表示地方设置的权限
    r_parent: { type : DataTypes.INTEGER, defaultValue:0 },//父级
    r_status:{type:DataTypes.INTEGER,defaultValue:1}//1=正常 0=停用
  }, {
    classMethods: {
      associate: function(models) {
        models.Role.hasOne(models.User);
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_role',
    timestamps: true
  });
};
