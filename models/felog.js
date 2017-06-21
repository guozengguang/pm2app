"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Felog", {
    l_logid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    l_userid: { type: DataTypes.INTEGER, defaultValue:0},
    l_username: { type: DataTypes.STRING, defaultValue:'' },
    l_userinfo: { type: DataTypes.STRING, defaultValue:'' },
    l_page: { type: DataTypes.STRING, defaultValue:'' },
    l_buttonevent: { type: DataTypes.STRING, defaultValue:'' },
    l_mtype: { type: DataTypes.INTEGER, defaultValue:0 },
    l_version: { type: DataTypes.STRING, defaultValue:'' },
    l_pdata: { type: DataTypes.STRING, defaultValue:'' },
    l_clicktime: { type: DataTypes.STRING, defaultValue:'' },
  }, {
    classMethods: {
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_felog',
    timestamps: true
  });
};
