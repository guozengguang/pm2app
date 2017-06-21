"use strict";

module.exports = function(sequelize, DataTypes) {//报名会员
  return sequelize.define("EnrollMember", {
    en_mid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    en_pics: { type: DataTypes.STRING(126), defaultValue:''},    //用户头像
    en_name: { type: DataTypes.STRING(25), defaultValue:''},    //用户姓名
    en_telephone: { type: DataTypes.STRING(11), defaultValue:''},    //用户手机号
    en_reference_phone: { type: DataTypes.STRING(11), defaultValue:''},    //推荐人手机号
    en_enterprise: { type: DataTypes.STRING, defaultValue:''},    //公司
    en_position: { type: DataTypes.STRING, defaultValue:''},    //职位
    en_address: { type: DataTypes.STRING, defaultValue:''},   //公司地址
    en_city: { type: DataTypes.STRING, defaultValue:''},   //市
    en_province: { type: DataTypes.STRING, defaultValue:''},   //省
    en_sex: { type: DataTypes.STRING, defaultValue:''},    //性别
    en_email: { type: DataTypes.STRING, defaultValue:''},    //邮箱
    en_school: { type: DataTypes.STRING, defaultValue:''},    //学校
    en_department: { type: DataTypes.STRING, defaultValue:''},    //部门
    en_website: { type: DataTypes.STRING, defaultValue:''},    //公司网址
    en_lnasset: { type: DataTypes.STRING, defaultValue:''},    //公司规模
    en_education: { type: DataTypes.STRING, defaultValue:''},    //学历
    en_age: { type: DataTypes.STRING, defaultValue:''},    //年龄
    en_card: { type: DataTypes.STRING, defaultValue:''},    //身份证
    en_phone: { type: DataTypes.STRING, defaultValue:''},    //电话
    en_fax: { type: DataTypes.STRING, defaultValue:''},    //传真
    en_birthday: { type: DataTypes.DATE, defaultValue:DataTypes.NOW},    //生日
    en_trade: { type: DataTypes.STRING, defaultValue:''},    //所属行业
    en_vip: { type: DataTypes.INTEGER, defaultValue:0},    //是否是梦想发起人 0否 1是
    en_classroomid: { type: DataTypes.INTEGER, defaultValue:0},    //分院id
    en_type: { type: DataTypes.INTEGER, defaultValue:0},    //类型  1分院录入 0活动报名
  }, {
    classMethods: {
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_enroll_member',
    timestamps: true
  });
};
