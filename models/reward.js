"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Reward", {
    reward_id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    reward_classid: { type: DataTypes.INTEGER, defaultValue:0 },        //课程id
    reward_classname: { type: DataTypes.STRING, defaultValue:"" },        //课程名称
    reward_fromuser: { type: DataTypes.STRING, defaultValue:""},          //打赏人
    reward_no: { type: DataTypes.STRING, defaultValue:""},          //单号
    reward_payno: { type: DataTypes.STRING, defaultValue:""},          //第三方单号
    reward_fromaccount: { type: DataTypes.STRING, defaultValue:""},          //打赏人账号
    reward_status: { type: DataTypes.INTEGER, defaultValue:0 },          //支付状态 0未支付 1已支付
    reward_touser: { type: DataTypes.STRING, defaultValue:"" },     //打赏对象
    reward_toname: { type: DataTypes.STRING, defaultValue:"" },     //打赏对象名称
    reward_fromname: { type: DataTypes.STRING, defaultValue:"" },     //打赏者名称
    reward_type: { type: DataTypes.INTEGER, defaultValue:0 },     //打赏类型 0 支付宝 1微信
    reward_money: { type: DataTypes.DECIMAL(18,2),defaultValue:0.00 },     //打赏金额
    reward_armoney: { type: DataTypes.DECIMAL(18,2),defaultValue:0.00 },     //收到金额
    reward_chatroom: { type: DataTypes.STRING, defaultValue:"" },     //聊天室
    reward_remark: { type: DataTypes.STRING, defaultValue:"" },     //备注
    reward_create: { type: DataTypes.STRING(50), defaultValue:"" },     //创建者
  }, {
    classMethods: {
      associate: function(models) {        
      },findsunmoney:function(condition){
        var sql=new StringBuilder();
        sql.AppendFormat(" select sum(reward_armoney) as summoney from gj_reward where reward_status=1");
        if(condition.reward_classname){
          sql.AppendFormat(" and reward_classname like '%{0}%'",condition.reward_classname);
        }
        if (condition.etime) {
          sql.AppendFormat(" and createdAt <= '{0}'",condition.etime);
        }
        if (condition.stime) {
          sql.AppendFormat(" and createdAt >= '{0}'",condition.stime);
        }
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },PayorderAll:function(condition){
        var sql = new StringBuilder();
        sql.AppendFormat("select reward_classname,reward_fromname,reward_toname,SUM(reward_armoney) as money_sum from gj_reward where reward_status=1");
        if(condition.reward_classname){
          sql.AppendFormat(" and reward_classname like '%{0}%'",condition.reward_classname)
        }
        sql.AppendFormat(" GROUP BY reward_fromuser  ORDER BY money_sum DESC LIMIT {0} OFFSET {1}",condition.limit || 20,condition.offset || 0);
        console.log(sql.ToString());
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },PayorderCount:function(condition){
        var sql = new StringBuilder();
        sql.AppendFormat("select count(reward_fromuser) from (select * from gj_reward where reward_status=1");
        if(condition.reward_classname){
          sql.AppendFormat(" and reward_classname like '%{0}%'",condition.reward_classname)
        }
        sql.AppendFormat(" GROUP BY reward_fromuser) as ordercount ")
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_reward',
    timestamps: true
  });
};
