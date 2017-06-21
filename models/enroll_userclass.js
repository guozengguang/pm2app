/**
 * Created by Administrator on 2016/10/11 0011.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("EnrollUserClass", {
        en_uid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//报名ID
        en_mid: { type: DataTypes.INTEGER,defaultValue: 0},//用户ID
        en_cid: { type: DataTypes.INTEGER,defaultValue: 0},//账单ID
        en_eid: { type: DataTypes.INTEGER,defaultValue: 0},//审核说明ID
        en_goodsid: { type: DataTypes.INTEGER,defaultValue:0},//课程ID
        en_key_name: { type: DataTypes.STRING,defaultValue: ''},//其他别名   lessonid
        en_status: { type: DataTypes.INTEGER,defaultValue: 0},//状态 0 非正式学员 1正式学员
        en_follow_status: { type: DataTypes.INTEGER,defaultValue: 0},//状态 0 未跟进 1报备跟进
        en_pay_status: { type: DataTypes.INTEGER,defaultValue: 0},//状态 0 未交费 1缴费
        en_type: { type: DataTypes.INTEGER,defaultValue: 0},//类型  0 pos报名 1转账报名
        en_areaid: { type: DataTypes.INTEGER,defaultValue: 0},// 学区id
        en_form: { type: DataTypes.INTEGER,defaultValue: 0},// 来源 0业务员直接报名 1活动报名 2.....
        en_classroomid: { type: DataTypes.INTEGER,defaultValue: 0},// 分院id
        en_fee: { type: DataTypes.INTEGER,defaultValue: 0},// 费用
        en_reference: { type: DataTypes.STRING,defaultValue: ''},//推荐人
        en_channel: { type: DataTypes.STRING,defaultValue: ''},//渠道来源
        en_time: { type: DataTypes.DATE,defaultValue: DataTypes.NOW},//报备时间
        en_clerkid: { type: DataTypes.INTEGER,defaultValue: 0},// 业务员
        en_create: { type: DataTypes.INTEGER,defaultValue: 0},// 创建者
        en_desc: { type: DataTypes.STRING,defaultValue: ''},// 说明
    }, {
        classMethods: {
            associate: function(models) {
                models.EnrollUserClass.belongsTo(models.Members,{foreignKey: 'en_mid'});
            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_enroll_user_class',
        timestamps: true
    });
};