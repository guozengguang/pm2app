"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Column", {
    columnid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    column_type: { type: DataTypes.INTEGER, defaultValue:0},    //类型
    column_status: { type: DataTypes.INTEGER, defaultValue:0},    //状态 //0启用 1 停用 3 删除
    column_title: { type: DataTypes.STRING, defaultValue:''},    //标题
    column_level: { type: DataTypes.INTEGER, defaultValue:1},    //深度
    column_path: { type: DataTypes.STRING, defaultValue:''},  //路径
    column_parent_id: {type: DataTypes.INTEGER, defaultValue: 0}, //父级ID
    column_url: { type: DataTypes.STRING, defaultValue:''},    //链接地址
    column_order: { type: DataTypes.STRING, defaultValue:''},    //排序
    column_indexes: { type: DataTypes.INTEGER.UNSIGNED, defaultValue:0}    //索引ID 默认0 不索引
  }, {
    classMethods: {
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_column',
    timestamps: true
  });
};
