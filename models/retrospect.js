"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Retrospect", {
    retid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    ret_classid: { type: DataTypes.INTEGER, defaultValue:0 },        //课程id
    ret_pics: { type: DataTypes.STRING, defaultValue:"" },     //图片
    ret_sort:{type : DataTypes.STRING,defaultValue:''},        //排序
    ret_remark:{type : DataTypes.STRING,defaultValue:''},        //备注
    ret_create:{type : DataTypes.STRING(50),defaultValue:''}      //创建者
  }, {
    classMethods: {
      associate: function(models) {
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_retrospect',
    timestamps: true
  });
};
