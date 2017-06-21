/**
 * Created by guozengguang on 2017/6/12.
 */
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("IsraelPayEnroll", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
            comment: '主键'
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: '',
            comment: '报名用户姓名'
        },
        classroomname: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: '',
            comment: '报名用户分院'
        },
        related_student_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: '',
            comment: '关联学员姓名'
        },
        reference_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: '',
            comment: '推荐人姓名'
        },
        reference_classroomname: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: '',
            comment: '推荐人所属分院'
        },
        phone: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: '',
            comment: '报名用户手机号码'
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: '',
            comment: '电子邮箱'
        },
        sex: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
            comment: '性别:0:男;1:女'
        },
        company: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: '',
            comment: '企业名称'
        },
        position: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: '',
            comment: '职务'
        },
        company_address: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: '',
            comment: '公司地址'
        },
        trade: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: '',
            comment: '所属行业'
        },
        trip_purpose: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
            comment: '出行目的'
        },
        is_like_develop_enterprise: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            defaultValue: 0,
            comment: '是否有在以色列发展企业的意愿:0:是;1:否'
        },
        is_like_resource_abutment: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            defaultValue: 0,
            comment: '是否愿意跟以色列进行资源对接:0:是;1:否'
        },
        is_like_join: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            defaultValue: 0,
            comment: '是否愿意参加“格局商学全球创新课程”（学制18个月，课程内容包括：硅谷1周+以色列1周+欧洲1周+深圳1周）:0:是;1:否'
        },
        is_need_single_room: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: '是否需要单人间（每人增加6600元，即总价94600元）:0:是;1:否'
        },
        is_need_invoice: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            defaultValue: 0,
            comment: '是否需要发票:0:是;1:否'
        },
        emergency_contact_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: '',
            comment: '紧急联系人姓名'
        },
        emergency_contact_phone: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: '',
            comment: '紧急联系人手机号'
        },
        student_status: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
            comment: '学员状态:0:学员/亲友;1:非学员'
        }
    }, {
        classMethods: {
            associate: function (models) {

            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'israel_pay_enroll',//表名
        timestamps: true,//时间戳
        underscored: true//下划线
    });
};