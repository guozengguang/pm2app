"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("branchManage", {
    id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    classroom: { type: DataTypes.INTEGER, defaultValue:0},    //所属区域id
    type: { type: DataTypes.INTEGER, defaultValue:0},    //分类 1院长 2教务 3班主任 4班级助理 5招生
    member: { type: DataTypes.INTEGER, defaultValue:0},    //子区域id
    goods: { type: DataTypes.INTEGER, defaultValue:0},    //人员id
    remark: { type: DataTypes.STRING, defaultValue:''},    //备注
    status: { type: DataTypes.INTEGER, defaultValue:1},    //状态 1正常 0删除
  }, {
    classMethods: {
      associate: function(models) {
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_branch_manage',
    timestamps: true
  });
};
