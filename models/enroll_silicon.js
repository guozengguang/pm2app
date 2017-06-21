/**
 * Created by Administrator on 2017/2/24 0024.
 */
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("SiliconEnroll", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
            comment: '主标识'
        },
        name: {
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '姓名'
        },      //用户ID
        phone: {
            type: DataTypes.BIGINT(11).UNSIGNED,
            allowNull: false,
            comment: '手机号'
        },      //微信单应用用户唯一标识
        email: {
            type: DataTypes.CHAR(255),
            allowNull: false,
            comment: '电子邮箱'
        },      //微信公众平台多应用唯一标识
        sex: {
            type: DataTypes.CHAR(2),
            allowNull: false,
            comment: '性别'
        },      //昵称
        enterprise: {
            type: DataTypes.CHAR(255),
            allowNull: false,
            comment: '企业名称'
        },      //性别
        position: {
            type: DataTypes.CHAR(255),
            allowNull: false,
            comment: '职务'
        },
        industry: {
            type: DataTypes.CHAR(255),
            comment: '行业'
        },
        ever_visa: {
            type: DataTypes.CHAR(2),
            allowNull: false,
            comment: '是否曾经获取美国签证'
        },
        has_visa: {
            type: DataTypes.CHAR(2),
            allowNull: false,
            comment: '是否已持有美国签证'
        },
        visa_type: {
            type: DataTypes.CHAR(255),
            comment: '签证类型'
        },
        visa_other_type: {
            type: DataTypes.CHAR(255),
            comment: '签证其他类型名称'
        },
        visa_end: {
            type: DataTypes.DATEONLY,
            comment: '签证到期时间'
        },
        agent: {
            type: DataTypes.CHAR(2),
            allowNull: false,
            comment: '是否需要格局代办签证'
        },
        face: {
            type: DataTypes.CHAR(10),
            comment: '面签城市'
        },
        agent_activation: {
            type: DataTypes.CHAR(2),
            comment: '是否需要格局代办已有美国签证激活（EVUS）'
        },
        other_passport: {
            type: DataTypes.CHAR(50),
            comment: '其他国家护照'
        },
        purpose: {
            type: DataTypes.STRING(65535),
            comment: '赴美目的'
        },
        intend: {
            type: DataTypes.STRING(65535),
            comment: '是否有在美国发展企业的意愿'
        },
        branch:{
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '所属分院'
        }
    }, {
        classMethods: {},
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'silicon_enroll',
        timestamps: true,
        underscored: true,
        paranoid: true
    });
};