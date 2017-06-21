"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Question", {
    questionid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    question_classid: { type: DataTypes.INTEGER, defaultValue:0 },        //课程id
    question_classroomid: { type: DataTypes.INTEGER, defaultValue:0},          //教室id
    question_areaid: { type: DataTypes.INTEGER, defaultValue:0 },     //学区id
    question_fromuser: { type: DataTypes.INTEGER, defaultValue:0 },     //用户
    question_touser:{type : DataTypes.STRING(50),defaultValue:''},        //提问对象
    question_content:{type : DataTypes.TEXT,defaultValue:''},        //问题
    question_title:{type : DataTypes.STRING(),defaultValue:''},        //标题
    question_votes:{type: DataTypes.INTEGER, defaultValue:0},        //票数
    question_remark:{type : DataTypes.STRING,defaultValue:''},        //备注
    question_status:{type: DataTypes.INTEGER, defaultValue:1},        //转态1有效 0无效
    question_isupscreen:{type: DataTypes.INTEGER, defaultValue:0},        //是否已上屏1已上屏，0未上屏
    question_create:{type : DataTypes.STRING(50),defaultValue:''},     //创建者
    question_site:{type : DataTypes.INTEGER,defaultValue:0}      //为大屏互动添加的状态
  }, {
    classMethods: {
      associate: function(models) {
        models.Question.belongsTo(models.Members,{foreignKey: 'question_fromuser'});
      },questionVoteAdd:function(opt){
        var sql=new StringBuilder();
        sql.AppendFormat(" update gj_question set question_votes=question_votes+1 where questionid = '{0}'",opt.id);
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.UPDATE });
      },questionVoteSub:function(opt){
          var sql=new StringBuilder();
          sql.AppendFormat(" update gj_question set question_votes=question_votes-1 where questionid = '{0}'",opt.id);
          return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.UPDATE });
      },getRank:function(opt){
        var sql=new StringBuilder();
        sql.AppendFormat("select * from ( select @rank:=@rank+1 as rank ,question_classid , question_fromuser from (select @rank:=0, gj_question.* from gj_question where question_status=1 and question_classid = {0} order by question_votes desc) rank) news_rank where question_fromuser = {1}",opt.classid,opt.userid);
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getList:function(opt){
        var sql=new StringBuilder();
        sql.Append("SELECT question_isupscreen,questionid,question_classid,question_status,question_fromuser,question_content as question_title,question_title as question_content,question_votes,classroom_name,m_name FROM gj_question")
        sql.Append(" INNER JOIN gj_class ON gj_class.classid=gj_question.question_classid")
        sql.Append(" INNER JOIN gj_members ON gj_members.mid=gj_question.question_fromuser")
        sql.Append(" LEFT JOIN gj_userclass ON gj_class.class_goodsid=gj_userclass.uc_goodsid AND gj_question.question_fromuser=gj_userclass.uc_userid")
        sql.Append(" LEFT JOIN gj_classroom ON gj_classroom.classroom=gj_userclass.uc_calssroomid")
        sql.AppendFormat(" WHERE question_classid = {0} AND question_status = '{1}'",opt.question_classid,opt.question_status);
        if(opt.classroom_name){
          sql.AppendFormat(" AND classroom_name LIKE '%{0}%'",opt.classroom_name);
        }
        sql.AppendFormat("ORDER BY question_votes DESC LIMIT {0},{1}",opt.offset,opt.limit);
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getquestionsbyclass:function(opt){
        var sql=new StringBuilder();
        sql.Append("SELECT question_isupscreen,question_classid,question_status,question_fromuser,question_content,question_title,question_votes,case when classroom_name is null then '' else classroom_name end,m_name,gj_question.questionid,gj_question.createdAt,m_pics,m_company,m_position,mid FROM gj_question")
        sql.Append(" INNER JOIN gj_class ON gj_class.classid=gj_question.question_classid")
        sql.Append(" INNER JOIN gj_members ON gj_members.mid=gj_question.question_fromuser")
        sql.Append(" INNER JOIN gj_userclass ON gj_class.class_goodsid=gj_userclass.uc_goodsid AND gj_question.question_fromuser=gj_userclass.uc_userid")
        sql.Append(" INNER JOIN gj_classroom ON gj_classroom.classroom=gj_userclass.uc_calssroomid")
        sql.Append(" INNER JOIN gj_userclass as uc ON gj_classroom.classroom=uc.uc_calssroomid")
        sql.AppendFormat(" WHERE question_classid = {0} AND question_status = '{1}' and uc.uc_userid={2} ",opt.where.question_classid,opt.where.question_status,opt.where.userid);
   
        if(opt.where.order==1)
        {
          sql.AppendFormat("ORDER BY createdAt DESC ");
        }
        if(opt.where.order==2)
        {
          sql.AppendFormat("ORDER BY createdAt ");
        }
        if(opt.where.order==3)
        {
          sql.AppendFormat("ORDER BY question_votes  ");
        }
        if(opt.where.order==4)
        {
          sql.AppendFormat("ORDER BY question_votes DESC ");
        }
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getCount:function(opt){
          var sql=new StringBuilder();
          sql.Append("SELECT count(*) as count FROM gj_question")
          sql.Append(" INNER JOIN gj_class ON gj_class.classid=gj_question.question_classid")
          sql.Append(" INNER JOIN gj_members ON gj_members.mid=gj_question.question_fromuser")
          sql.Append(" LEFT JOIN gj_userclass ON gj_class.class_goodsid=gj_userclass.uc_goodsid AND gj_question.question_fromuser=gj_userclass.uc_userid")
          sql.Append(" LEFT JOIN gj_classroom ON gj_classroom.classroom=gj_userclass.uc_calssroomid")
          sql.AppendFormat(" WHERE question_classid = {0} AND question_status = '{1}'",opt.question_classid,opt.question_status);
          if(opt.classroom_name){
            sql.AppendFormat(" AND classroom_name LIKE '%{0}%'",opt.classroom_name);
          }
          return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getquestionsforoutside:function(opt){
        var sql=new StringBuilder();
        sql.AppendFormat(" SELECT question_votes,question_content,question_title,questionid,q.createdAt,question_fromuser,m.m_pics,m.m_name,m.m_position,m.mid,guc.uc_calssroomid,guc.uc_calssroomname from gj_question  as q INNER JOIN gj_members as m on m.mid = q.question_fromuser LEFT JOIN gj_userclass as guc on guc.uc_userid = m.mid where q.question_classid ={0} and q.question_fromuser is not null and question_status =1 ",opt.where.question_classid);
       
        if(opt.where.order==1){//按照时间排序
          sql.Append(" order by q.createdAt desc ");
        }
        if(opt.where.order==2){//按照时间排序
          sql.Append(" order by q.createdAt ");
        }
        if(opt.where.order==3){//按照投票排序
          sql.Append(" order by question_votes");
        }
        if(opt.where.order==4){//按照投票排序
          sql.Append(" order by question_votes desc");
        }
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_question',
    timestamps: true
  });
};
