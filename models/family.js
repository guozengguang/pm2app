"use strict";
/**
 * 正式学员家庭信息表
 * @param  {[type]} sequelize [description]
 * @param  {[type]} DataTypes [description]
 * @return {[type]}           [description]
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("Family", {
        family_id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//家庭信息id
        emergency_contact_name: { type: DataTypes.STRING, defaultValue:''},    //紧急联系人姓名
        emergency_contact_phone: { type: DataTypes.STRING, defaultValue:''},    //紧急联系人电话
        son_name: { type: DataTypes.STRING, defaultValue:''},    //儿子姓名
        son_age: { type: DataTypes.INTEGER, defaultValue:0},    //儿子岁数
        daughter_name: { type: DataTypes.STRING, defaultValue:''},    //女儿姓名
        daughter_age: { type: DataTypes.INTEGER, defaultValue:1},    //女儿岁数
        father_name: { type: DataTypes.STRING, defaultValue:''},    //学员父亲
        father_phone: { type: DataTypes.STRING, defaultValue:''},    //学员父亲联系电话
        mother_name: { type: DataTypes.STRING, defaultValue:''},    //学员母亲
        mother_phone: { type: DataTypes.STRING, defaultValue:''},    //学员母亲联系电话
        family_desc: { type: DataTypes.STRING, defaultValue:''},    //备注
        mid: { type: DataTypes.INTEGER, defaultValue:0}   //member外键
    }, {
        classMethods: {
            associate: function(models) {
            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_family',
        timestamps: true, //时间戳
        underscored:true //下划线
    });
};
