"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Home", {
    home_id:{type : DataTypes.INTEGER, autoIncrement : true,primaryKey : true, unique : true},
    home_title:{type:DataTypes.STRING(50),defaultValue:""},//标题
    home_img:{type:DataTypes.STRING,defaultValue:""},//图片
    home_type:{type:DataTypes.INTEGER,defaultValue:0},//类型
    home_sort:{type:DataTypes.INTEGER,defaultValue:0},//排序
    home_status:{type:DataTypes.INTEGER,defaultValue:1},//状态
    home_create:{type:DataTypes.STRING,defaultValue:""},//创建者
  }, {
    classMethods: {
      associate: function(models) {
        models.Home.hasMany(models.HomeItem,{foreignKey: 'subitem_home',as:'Item'})
      }

    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_home',
    timestamps: 'true',
    updatedAt:"updateat",
    createdAt:"createdat"
  });
};