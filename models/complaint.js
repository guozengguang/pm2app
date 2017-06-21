"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Complaint", {
    complaintid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    complaint_content: { type: DataTypes.STRING, defaultValue:""},          //学区id
    complaint_user: { type: DataTypes.INTEGER, defaultValue:0 }       //教室名称
  }, {
    classMethods: {
      associate: function(models) {  
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_complaint',
    timestamps: true
  });
};
