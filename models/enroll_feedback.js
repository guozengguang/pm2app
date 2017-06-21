/**
 * Created by Administrator on 2016/10/11 0011.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("EnrollFeedback", {
        feedback_id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//说明ID
        feedback_feky: { type: DataTypes.INTEGER,defaultValue: 0},//外键ID
        feedback_type: { type: DataTypes.INTEGER,defaultValue: 0},//0审核说明  1单据说明
        feedback_content: { type: DataTypes.STRING,defaultValue: ''},//说明内容
    }, {
        classMethods: {
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_enroll_feedback',
        timestamps: true
    });
};