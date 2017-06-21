"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Tag", {
    tagid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    tag_userid: { type: DataTypes.STRING(16), defaultValue:"" },     //用户
    tag_content:{type : DataTypes.STRING(50),defaultValue:''},        //标签内容
    tag_remark:{type : DataTypes.STRING,defaultValue:''},        //备注
    tag_create:{type : DataTypes.STRING(50),defaultValue:''}      //创建者
  }, {
    classMethods: {
      associate: function(models) {
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_tag',
    timestamps: true
  });
};
