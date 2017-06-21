"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("badgeItem", {
    badge_id:{type : DataTypes.INTEGER, autoIncrement : true,primaryKey : true, unique : true},
    badge_name:{type:DataTypes.STRING,defaultValue:""},//名称
    badge_remark:{type:DataTypes.STRING,defaultValue:""},//备注
  }, {
    classMethods: {
      associate: function(models) {
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_badgeitem',
    timestamps: 'true',
    updatedAt:"updateat",
    createdAt:"createdat"
  });
};