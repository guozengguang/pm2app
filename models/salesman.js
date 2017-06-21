"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Sales", {
    salesid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    sales_classroom: { type: DataTypes.STRING, defaultValue:''},    //所属区域id
    sales_members: { type: DataTypes.INTEGER, defaultValue:0},    //人员id
    sales_password: { type: DataTypes.STRING, defaultValue:'geju'},    //默认密码
    sales_remark: { type: DataTypes.STRING, defaultValue:''},    //备注
    sales_status: { type: DataTypes.INTEGER, defaultValue:1},    //状态
  }, {
    classMethods: {
      associate: function(models) {
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_sales',
    timestamps: true
  });
};
