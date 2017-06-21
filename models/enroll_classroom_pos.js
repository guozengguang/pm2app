/**
 * Created by Administrator on 2016/10/11 0011.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("EnrollClassroomPos", {
        ecp_id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true},
        ecp_classroomid: { type: DataTypes.INTEGER,defaultValue: 0},//分院ID
        ecp_posid: { type: DataTypes.STRING,defaultValue: '', unique : true},//终端号
    }, {
        classMethods: {
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_enroll_crpos',
        timestamps: true
    });
};