"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Classvalue", {
    valueid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    value_classid: { type: DataTypes.INTEGER, defaultValue:0 },        //课程id
    value_user: { type: DataTypes.INTEGER, defaultValue:0 },     //用户
    value_content:{type : DataTypes.STRING(50),defaultValue:''},        //评价内容
    value_votes:{type: DataTypes.INTEGER, defaultValue:5},        //星级
    value_remark:{type : DataTypes.STRING,defaultValue:''},        //备注
    value_label:{type : DataTypes.STRING,defaultValue:''},        //备注
    value_create:{type : DataTypes.STRING(50),defaultValue:''}
  }, {
    classMethods: {
      associate: function(models) {
        models.Classvalue.belongsTo(models.Members,{foreignKey: 'value_user'});
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_valueclass',
    timestamps: 'true',
    updatedAt:"updateat",
    createdAt:"createdat"
  });
};