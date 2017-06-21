"use strict";

module.exports = function (sequelize, DataTypes) {
    return sequelize.define("Columnmedia", {
        cmid: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, unique: true},
        cm_columnid: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },    //栏目id
        cm_mediaid: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },     //媒体id
        cm_status: {type: DataTypes.INTEGER, defaultValue: 0}      //状态:0:未上架；1：已上架；
    }, {
        classMethods: {
            associate: function (models) {
                //媒资查询对应栏目
                models.Media.belongsToMany(models.Column, {
                    through: models.Columnmedia,
                    foreignKey: 'cm_mediaid',
                    targetKey: 'mediaid'
                });
                models.Media.hasMany(models.Columnmedia, {
                    foreignKey: 'cm_mediaid',
                    targetKey: 'mediaid'
                });
                //栏目查询对应媒资
                models.Column.hasMany(models.Columnmedia, {
                    foreignKey: 'cm_columnid',
                    targetKey: 'columnid'
                });
                models.Column.belongsToMany(models.Media, {
                    through: models.Columnmedia,
                    foreignKey: 'cm_columnid',
                    targetKey: 'columnid'
                });
            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_columnmedia',
        timestamps: true,
        paranoid: true
    });
};

