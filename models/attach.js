"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Attach", {
    attachid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    attach_type: { type: DataTypes.INTEGER, defaultValue:0},    //类型 0 图片 1 视频 2 ftp
    attach_status: { type: DataTypes.INTEGER, defaultValue:0},    //类型 0 正常 1 转码中 2转码失败
    attach_path: { type: DataTypes.STRING, defaultValue:''},    //路径
    attach_duration: { type: DataTypes.STRING, defaultValue:'0'},    //时长
    attach_from: { type: DataTypes.STRING, defaultValue:''},    //来源  手机  后台  等
    attach_title: { type: DataTypes.STRING, defaultValue:''},    //标题
    attach_desc: { type: DataTypes.STRING, defaultValue:''},   //描述
    attach_jobid: { type: DataTypes.STRING, defaultValue:''} ,  //描述
    attach_count: { type: DataTypes.INTEGER, defaultValue:0}
  }, {
    classMethods: {
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_attach',
    timestamps: true
  });
};
