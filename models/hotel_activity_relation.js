/**
 * Created by Administrator on 2017/3/17 0017.
 */
var base_url = require(process.cwd() + '/config/config').aly;
var _ = require('lodash');
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("HotelActivityRelation", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
            comment: '主标识'
        },
        hotel: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            unique: false,
            comment: '酒店ID'
        },
        room: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            unique: true,
            comment: '房间ID'
        },
        activity: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            unique: false,
            comment: '活动ID'
        },
    }, {
        classMethods: {
            associate: function (models) {
                models.HotelRoom.belongsToMany(models.HotelActivity, {
                    through: models.HotelActivityRelation,
                    foreignKey: 'room',
                    otherKey: 'activity'
                });
                models.HotelActivity.belongsToMany(models.HotelRoom, {
                    through: models.HotelActivityRelation,
                    foreignKey: 'activity',
                    otherKey: 'room'
                });
                models.HotelActivityRelation.belongsTo(models.HotelDetail, {
                    foreignKey: 'hotel',
                });
                models.HotelActivityRelation.belongsTo(models.HotelRoom, {
                    foreignKey: 'room',
                    as: 'Rooms'
                })
            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'hotel_activity_relation',
        timestamps: true,
        underscored: true,
        paranoid: false
    });
};