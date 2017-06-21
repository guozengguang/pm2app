"use strict";
/**
 * 推荐位
 * @param  {[type]} sequelize [description]
 * @param  {[type]} DataTypes [description]
 * @return {[type]}           [description]
 */
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("PlacesItemType", {
    pit_id:{type : DataTypes.INTEGER, primaryKey : true, unique : true},
    pit_name:{type:DataTypes.STRING,defaultValue:""},//图
  }, {
    classMethods: {
      associate: function(models) {
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_placesitemtype',
    timestamps: false
  });
};