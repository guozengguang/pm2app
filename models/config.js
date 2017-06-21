"use strict";
/**
 * 附件表
 * @param  {[type]} sequelize [description]
 * @param  {[type]} DataTypes [description]
 * @return {[type]}           [description]
 */
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Config", {
    id:{type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    key:{type:DataTypes.STRING,defaultValue:''},//key名
    val:{type:DataTypes.STRING(20000),defaultValue:''},//key值
    desc:{type:DataTypes.STRING,defaultValue:''},//名称
    name:{type:DataTypes.STRING,defaultValue:''},//key描述
}, {
    classMethods: {
      associate: function(models) {
        //User.hasMany(models.Task)
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_config',
    timestamps: true
  });
};