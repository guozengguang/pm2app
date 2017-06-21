/**
 * Created by Administrator on 2016/10/11 0011.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("Apply", {
        id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//申请id
        status: { type: DataTypes.INTEGER,defaultValue: 0},//状态 0未审核 1通过 2未通过 3删除
        foreign: { type: DataTypes.INTEGER,defaultValue: 0},//外键mid
        type: { type: DataTypes.INTEGER,defaultValue: 0},//类型 1分院 2合伙人 3信息
        branch: { type: DataTypes.INTEGER,defaultValue: 0},//分院信息
        create: { type: DataTypes.STRING,defaultValue: ''},//创建者
        desc: { type: DataTypes.STRING,defaultValue: ''},//描述
    }, {
        classMethods: {
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_apply',
        timestamps: true
    });
};