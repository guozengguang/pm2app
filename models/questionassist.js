"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Questionassist", {
    assistid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    assist_questionid: { type: DataTypes.INTEGER, defaultValue:0 },        //问题id
    assist_userid: { type: DataTypes.INTEGER, defaultValue:0},          //点赞人id
    assist_classid: { type: DataTypes.INTEGER, defaultValue:0},          //课程id
    assist_create:{type : DataTypes.STRING(50),defaultValue:''},        //创建者
  }, {
    classMethods: {
      associate: function(models) {

      },getMyVotes:function(opt){
        var sql=new StringBuilder();
        sql.Append("select mid,question_votes,question_content,question_title,questionid,m_pics,m_name,m_company,m_position,gj_question.createdAt from gj_questionassist")
        sql.Append(" INNER JOIN gj_question ON gj_questionassist.assist_questionid=gj_question.questionid")
        sql.Append(" INNER JOIN gj_members ON gj_members.mid=gj_question.question_fromuser")
        sql.AppendFormat(" WHERE assist_classid={0} AND assist_userid={1}",opt.assist_classid,opt.assist_userid)
        sql.Append(" ORDER BY question_votes desc")
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getSeftVotes:function(opt){
        var sql=new StringBuilder();
        sql.Append("select m_pics,m_name,mid from gj_questionassist")
        sql.Append(" INNER JOIN gj_members ON gj_members.mid=gj_questionassist.assist_userid")
        sql.AppendFormat(" WHERE assist_questionid={0}",opt.assist_questionid)
        sql.AppendFormat(" LIMIT {0},{1}",opt.offset,opt.limit);
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_questionassist',
    timestamps: true
  });
};
