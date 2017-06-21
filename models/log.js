"use strict";
/**
 * 后台操作日志表
 * @param  {[type]} sequelize [description]
 * @param  {[type]} DataTypes [description]
 * @return {[type]}           [description]
 */
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Log", {
    lg_id:{type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    lg_content:{type:DataTypes.STRING,defaultValue:""},//操作详情
    lg_type:{type : DataTypes.INTEGER,defaultValue:0},//操作类型
    lg_ip:{type:DataTypes.STRING,defaultValue:""},//操作人ip
    uid : {type : DataTypes.INTEGER, defaultValue:0},
  }, {
    classMethods: {
      associate: function(models) {
        models.Log.belongsTo(models.User,{foreignKey: 'uid',as:"ul"});
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_log',
    timestamps: true
  });
};