"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Allowarea", {
    allowareaid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    allowarea_areaid: { type: DataTypes.INTEGER, defaultValue:0 },        //学区id
    allowarea_classid: { type: DataTypes.INTEGER, defaultValue:0},          //课程id
    allowarea_quantity: { type: DataTypes.INTEGER, defaultValue:0 },     //有效问题数
    allowarea_create: { type: DataTypes.STRING(50), defaultValue:"" },     //创建者
  }, {
    classMethods: {
      associate: function(models) {    
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_allowarea',
    timestamps: true
  });
};
