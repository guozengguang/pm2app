"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Feedback", {
    feedbackid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    feedback_fromuser: { type: DataTypes.INTEGER, defaultValue:0},//反馈者
    feedback_touser: { type: DataTypes.INTEGER, defaultValue:0 },//被反馈者
    feedback_phone: { type: DataTypes.STRING, defaultValue:'' },//被反馈者
    feedback_type: { type: DataTypes.INTEGER, defaultValue:0 },//反馈类型
    feedback_content:{type:DataTypes.STRING,defaultValue:''},//内容
    feedback_status:{type:DataTypes.INTEGER,defaultValue:1},//状态
    feedback_reply:{type:DataTypes.STRING,defaultValue:''},//回复内容
    feedback_replystatus: { type: DataTypes.INTEGER, defaultValue:0 },  //是否已回复（0，未回复，1为已回复，2已查看）
    replyAt: { type: DataTypes.DATE, defaultValue:DataTypes.NOW }  //回复时间
  }, {
    classMethods: {
      associate: function(models) {
        models.Feedback.hasMany(models.FeedbackAttach,{foreignKey: 'feedid',as:'img'});
        models.Feedback.belongsTo(models.Members,{foreignKey: 'feedback_fromuser'});
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_feedback',
    timestamps: true
  });
};
