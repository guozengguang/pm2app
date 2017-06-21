/**
 * Created by Administrator on 2017/3/6 0006.
 */
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("Once_GoodProject", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
            comment: '主标识'
        },
        name: {
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '姓名'
        },
        phone: {
            type: DataTypes.BIGINT(11).UNSIGNED,
            allowNull: false,
            comment: '手机号'
        },
        contact: {
            type: DataTypes.CHAR(50),
            comment: '其他联系方式'
        },
        branch: {
            type: DataTypes.CHAR(20),
            allowNull: false,
            comment: '分院名称'
        },
        enterprise: {
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '企业名称'
        },
        position: {
            type: DataTypes.CHAR(20),
            allowNull: false,
            comment: '职务'
        },
        introduce: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: '企业介绍'
        },
        business: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: '业务介绍'
        },
        mode: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: '商业模式'
        },
        asset: {
            type: DataTypes.INTEGER(2).UNSIGNED,
            allowNull: false,
            comment: '资产规模'
        },
        state: {
            type: DataTypes.INTEGER(2).UNSIGNED,
            defaultValue: 1,
            comment: '状态'
            /*
            * 0 不通过
            * 1 待审核
            * 2 审核通过，可以邀请提交宣传材料
            * 3 已经邀请提交宣传材料，可以再次邀请
            * 4 宣传材料已经提交， 可以邀请提交路演材料
            * 5 已经邀请提交路演材料，可以再次邀请
            * 6 路演材料已经提交， 可以邀请参加路演。
            * 7 已经邀请参加路演，可以再次邀请
            * 8 未参加路演，可以再次邀请
            * 9 已参加路演
            * */
        },
        apply: {
            type: DataTypes.STRING(2048),
            defaultValue: '',
            comment: '申请资料'
        },
        propaganda: {
            type: DataTypes.STRING(2048),
            defaultValue: '',
            comment: '宣传资料'
        },
        roadshow: {
            type: DataTypes.STRING(2048),
            defaultValue: '',
            comment: '路演资料'
        }
    }, {
        classMethods: {
            /*associate: function (models) {
            }*/
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'once_good_project',
        timestamps: true,
        underscored: true,
        paranoid: false
    });
};