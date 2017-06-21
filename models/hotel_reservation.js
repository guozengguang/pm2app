/**
 * Created by Administrator on 2017/3/17 0017.
 */
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("HotelReservation", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
            comment: '主标识'
        },
        in_time: {
            type: DataTypes.DATEONLY,
            comment: '入住时间',
            allowNull: false
        },
        out_time: {
            type: DataTypes.DATEONLY,
            comment: '退房时间',
            allowNull: false
        },
        duration: {
            type: DataTypes.INTEGER.UNSIGNED,
            comment: '入住时长',
            allowNull: false
        },
        food: {
            type: DataTypes.BOOLEAN,
            comment: '是否用餐',
            defaultValue: false
        },
        concat: {
            type: DataTypes.BOOLEAN,
            comment: '是否拼房',
            defaultValue: false
        },
        invoice: {
            type: DataTypes.BOOLEAN,
            comment: '是否发票',
            defaultValue: true
        },
        invoice_title: {
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '发票抬头'
        },
        invoice_used: {
            type: DataTypes.CHAR(10),
            allowNull: false,
            comment: '发票用途'
        },
        state: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            comment: '状态',
            defaultValue: 0 //默认0 未生成订单 1 已经生成订单
        },
        hotel: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            comment: '酒店ID',
        },
        room: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            comment: '房间ID',
        },
        activity: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            comment: '活动ID'
        },
        human: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            comment: '入住人ID'
        },
        order: {
            type: DataTypes.CHAR(24),
            allowNull: false,
            comment: '订单ID'
        },
        operator: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            comment: '操作人ID'
        }
    }, {
        classMethods: {
            associate: function (models) {
                models.HotelReservation.belongsTo(models.HotelDetail ,{
                    foreignKey: 'hotel'
                });
                models.HotelReservation.belongsTo(models.HotelHuman ,{
                    foreignKey: 'human'
                });
                models.HotelReservation.belongsTo(models.HotelRoom ,{
                    foreignKey: 'room'
                });
                models.HotelReservation.belongsTo(models.HotelActivity ,{
                    foreignKey: 'activity'
                });
                models.HotelReservation.belongsTo(models.HotelOrder ,{
                    foreignKey: 'order'
                });
            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'hotel_reservation',
        timestamps: true,
        underscored: true,
        paranoid: true
    });
};