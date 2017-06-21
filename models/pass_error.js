/**
 * Created by Administrator on 2016/10/11 0011.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("PassError", {
        id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//申请id
        time: { type: DataTypes.DATE,defaultValue: DataTypes.NOW},//错误时间
        phone: { type: DataTypes.STRING(50),defaultValue: ''},//手机号
        num: { type: DataTypes.INTEGER,defaultValue: 0},//计数
        create: { type: DataTypes.STRING,defaultValue: ''},//创建者
    }, {
        classMethods: {
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_pass_error',
        timestamps: true
    });
};