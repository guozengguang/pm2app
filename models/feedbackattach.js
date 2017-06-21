"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("FeedbackAttach", {
    faid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    feedid: { type: DataTypes.INTEGER, defaultValue:0},//反馈id
    feedback_img: { type: DataTypes.STRING, defaultValue:'' },//图片
  }, {
    classMethods: {
      associate: function(models) {
        models.FeedbackAttach.belongsTo(models.Feedback,{foreignKey: 'feedid',as:'img'});
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_feedbackattach',
    timestamps: true
  });
};
