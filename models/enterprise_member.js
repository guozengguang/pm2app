/**
 * Created by Administrator on 2016/10/11 0011.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("EnterpriseMember", {
        id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true},//申请id
        member: { type: DataTypes.INTEGER,defaultValue: 0,unique : true},//客户id
        enterprise: { type: DataTypes.INTEGER,defaultValue: 0},//企业id
    }, {
        classMethods: {
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_enterprise_member',
        timestamps: true
    });
};