"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Media", {
    mediaid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    media_type: { type: DataTypes.INTEGER, defaultValue:1},    //类型1 视频 2 图片 3内容
    media_title: { type: DataTypes.STRING, defaultValue:''},    //标题
    media_content: { type: DataTypes.TEXT, defaultValue:''},  //内容
    media_href:{type:DataTypes.STRING, defaultValue:''},        //跳转链接
    media_pics: { type: DataTypes.STRING, defaultValue:''}, //图片
    media_video: { type: DataTypes.STRING, defaultValue:''}, //视频
    media_columnid: { type: DataTypes.STRING, defaultValue:''},    //栏目id
    media_author: { type: DataTypes.STRING, defaultValue:''},    //作者
    media_clickcount: { type: DataTypes.INTEGER, defaultValue:0},    //浏览次数
    media_keywords: { type: DataTypes.STRING, defaultValue:''},    //关键字
    media_description: { type: DataTypes.STRING, defaultValue:''},    //描述
    media_pushtime: { type: DataTypes.DATE, defaultValue:DataTypes.NOW},    //发布时间
    media_status: { type: DataTypes.INTEGER, defaultValue:1},    //状态 1未发布 2发布 3 删除(逻辑删除)
    media_indexes: { type: DataTypes.INTEGER.UNSIGNED, defaultValue:0}    //索引ID 默认0 不索引
  }, {
    classMethods: {
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_media',
    timestamps: true
  });
};
