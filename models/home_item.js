"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("HomeItem", {
    subitem_id:{type : DataTypes.INTEGER, autoIncrement : true,primaryKey : true, unique : true},
    subitem_title:{type:DataTypes.STRING(50),defaultValue:""},//标题
    subitem_home:{type:DataTypes.INTEGER,defaultValue:0},//父id
    subitem_key:{type:DataTypes.INTEGER,defaultValue:0},//关联id
    subitem_sort:{type:DataTypes.INTEGER,defaultValue:0},//排序
    subitem_status:{type:DataTypes.INTEGER,defaultValue:1},//状态
    subitem_create:{type:DataTypes.STRING,defaultValue:""},//创建者
  }, {
    classMethods: {
      associate: function(models) {
        models.HomeItem.belongsTo(models.Home,{foreignKey: 'subitem_home',as:'Item'})
      }

    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_home_item',
    timestamps: 'true',
    updatedAt:"updateat",
    createdAt:"createdat"
  });
};