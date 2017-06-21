"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("InvitationCard", {
     ic_id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//邀请涵ID
     ic_toid: { type: DataTypes.INTEGER, defaultValue:0},  //被邀请人id
     ic_phone: {type: DataTypes.STRING, defaultValue:""},    //被邀请人手机号
     ic_name: {type: DataTypes.STRING,  defaultValue:""},    //被邀请人姓名
     ic_classnameid: {type: DataTypes.STRING, defaultValue:""},    //被邀请人分院id
     ic_classname: {type: DataTypes.STRING, defaultValue:""},    //被邀请人分院
     ic_frommid: { type: DataTypes.INTEGER, defaultValue:0},  //邀请人id
     ic_status: { type: DataTypes.INTEGER, defaultValue: 0}  //状态 0邀请中 1已邀请  2删除
  }, {
    classMethods: {
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_invitation_card',
    timestamps: true
  });
};
