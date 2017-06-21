/**
 * Created by Administrator on 2017/3/17 0017.
 */
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("HotelHuman", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
            comment: '主标识'
        },
        name: {
            type: DataTypes.CHAR(8),
            allowNull: false,
            comment: '姓名'
        },
        sex: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '性别'// 默认 男 女
        },
        card: {
            type: DataTypes.CHAR(18),
            allowNull: false,
            comment: '身份证号'
        },
        company: {
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '公司'
        },
        position: {
            type: DataTypes.CHAR(20),
            allowNull: false,
            comment: '职务'
        },
        phone: {
            type: DataTypes.BIGINT(11).UNSIGNED,
            allowNull: false,
            comment: '电话号码'
        },
        user: {
            type: DataTypes.INTEGER,
            comment: '用户ID'
        }
    }, {
        classMethods: {
            associate: function (models) {
                models.HotelHuman.hasMany(models.HotelReservation, {
                    foreignKey: 'human'
                });
                models.HotelHuman.belongsTo(models.Members, {foreignKey: 'user', targetKey: 'mid',onDelete: 'SET NULL' });
            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'hotel_human',
        timestamps: true,
        underscored: true,
        paranoid: true
    });
};