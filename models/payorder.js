"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Payorder", {
    payorderid : {type :  DataTypes.INTEGER,primaryKey : true, unique : true},
    po_tomid: { type: DataTypes.INTEGER, defaultValue:0 },       
    po_toname: {type : DataTypes.STRING(64),defaultValue:''},      
    po_prepayid: { type: DataTypes.STRING(32), defaultValue:''},  
    po_money: { type: DataTypes.STRING(32), defaultValue:''},      
    po_openid: { type: DataTypes.STRING(64), defaultValue:''},      
    po_nickname: { type: DataTypes.STRING(64), defaultValue:''},      
    po_sex: { type: DataTypes.STRING(10), defaultValue:''},      
    po_city: { type: DataTypes.STRING(20), defaultValue:''},      
    po_province: { type: DataTypes.STRING(20), defaultValue:''},      
    po_timeend: { type: DataTypes.STRING(50), defaultValue:''},      
    po_tradeno: { type: DataTypes.STRING(50), defaultValue:''},      
    po_ordertype: { type: DataTypes.INTEGER, defaultValue:0},      
    po_headimgurl: { type: DataTypes.STRING(256), defaultValue:''},  
    po_userphone: { type: DataTypes.STRING(32), defaultValue:''},  
    po_username: { type: DataTypes.STRING(32), defaultValue:''},  
    po_userclassname: { type: DataTypes.STRING(32), defaultValue:''}      
  }, {
    classMethods: {
      associate: function(models) {        
      },findtotalmoney:function(condition){
        var sql=new StringBuilder();
        console.log(condition);
        sql.AppendFormat(" select count(po_money) as totalmoney from gj_payorder where po_tomid={0} ",condition.where.mid);
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },findsunmoney:function(condition){
        var sql=new StringBuilder();
        //sql.AppendFormat(" select sum(po_money) as totalmoney from gj_payorder where po_toname like '%{0}%' and createdat >= {1} and createdat <={2} ",condition.where.po_toname,condition.where.etime,condition.where.stime);
        sql.AppendFormat(" select sum(po_money) as summoney from gj_payorder where 1=1");
        if(condition.po_toname){
          sql.AppendFormat(" and po_toname like '%{0}%'",condition.po_toname);
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
        sql.AppendFormat("select po_toname,po_sex,po_city,po_province,createdAt,po_nickname,SUM(po_money) as money_sum from gj_payorder where 1=1");
        if(condition.po_toname){
          sql.AppendFormat(" and po_toname like '%{0}%'",condition.po_toname)
        }
        sql.AppendFormat(" GROUP BY po_openid  ORDER BY money_sum DESC LIMIT {0} OFFSET {1}",condition.limit || 20,condition.offset || 0);

        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },Payorderbyid:function(condition){
        var sql = new StringBuilder();
        sql.AppendFormat("select po_toname,po_headimgurl,po_nickname,SUM(po_money) as money_sum from gj_payorder where po_tomid = {0} GROUP BY po_toname,po_headimgurl,po_nickname ORDER BY money_sum DESC LIMIT 20",condition.where.mid);
        
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getpayorderbyopenid:function(condition){
        var sql = new StringBuilder();
        sql.AppendFormat("select * from gj_payorder where po_openid='{0}' and po_userphone is not null and po_userphone <> '' LIMIT 1",condition.where.openid);
        
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },PayorderCount:function(condition){
        var sql = new StringBuilder();
        sql.AppendFormat("select count(po_openid) from (select * from gj_payorder where 1=1");
        if(condition.po_toname){
          sql.AppendFormat(" and po_toname like '%{0}%'",condition.po_toname)
        }
        sql.AppendFormat(" GROUP BY po_openid) as ordercount ")
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_payorder',
    timestamps: true
  });
};
