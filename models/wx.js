"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("WX", {
        id: {
            type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, unique: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },      //用户ID
        openId: {
            type: DataTypes.CHAR,
            allowNull: false
        },      //微信单应用用户唯一标识
        unionId: {
            type: DataTypes.CHAR
        },      //微信公众平台多应用唯一标识
        nickName: {
            type: DataTypes.STRING
        },      //昵称
        gender: {
            type: DataTypes.INTEGER, defaultValue: 0
        },      //性别
        city: {
            type: DataTypes.STRING
        },      //城市
        province: {
            type: DataTypes.STRING
        },      //省份
        country: {
            type: DataTypes.STRING
        },      //国家
        avatarUrl: {
            type: DataTypes.STRING(2048)
        }       //头像
    }, {
        classMethods: {
            associate: function (models) {
                //查询对应用户
                models.WX.hasOne(models.Members, {
                    foreignKey: 'mid',
                    targetKey: 'userId'
                });
            }
            ,getmembersbyopenid:function(condition){
                var sql=new StringBuilder();
                sql.AppendFormat("SELECT w.nickName,w.userId,w.openId,w.avatarUrl,m.m_name,m.m_pics,guc.uc_calssroomid,guc.uc_calssroomname from gj_wx as w  INNER JOIN gj_members as m on m.mid=w.userId LEFT JOIN gj_userclass as guc on guc.uc_userid=m.mid where w.openId='{0}'",condition.where.openid);
                return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_wx',
        timestamps: true,
        paranoid: true
    });
};

