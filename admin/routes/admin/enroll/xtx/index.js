/**
 * Created by Administrator on 2016/10/13 0013.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');
var utils = require(process.cwd() + '/utils/str');
var models = require(process.cwd() + '/models/index');
var moment = require('moment');

router.get('/',Filter.authorize,function (req, res) {
    return res.render('enroll/xtx', {
        title: '活动专辑',
        branch_name: ''
    });
});
router.get('/add',Filter.authorize,function (req, res) {
    return res.render('enroll/xtx_add', {
        title: '新增文章',
        branch_name: ''
    });
});
router.post('/create',function (req,res) {
    var body=req.body;
    console.log(body)
    models.ActivityArticle.create(body).then(function () {
        return response.onSuccess(res,{message:'ok'})
    }).catch(function (err) {
        console.log(err)
        return response.onError(res,{message:err.toString()})
    })
})
router.get('/edit',Filter.authorize,function (req, res) {
    var body=req.query
    models.ActivityArticle.findOne({
        where:{id:body.id},
        raw:true,
    }).then(function (item) {
        return res.render('enroll/xtx_edit', {
            title: '修改文章',
            item:item
        });
    }).catch(function (err) {
        console.log(err)
        return response.onError(res,{message:err.toString()})
    })
});
router.post('/article/update',function (req,res) {
    var body=req.body;
    models.ActivityArticle.update(body,{where:{id:body.id}}).then(function () {
        return response.onSuccess(res,{message:'ok'})
    }).catch(function (err) {
        console.log(err)
        return response.onError(res,{message:err.toString()})
    })
})
router.post('/comment/update',function (req,res) {
    var body=req.body;
    models.ActivityComment.update(body,{where:{id:body.id}}).then(function () {
        return response.onSuccess(res,{message:'ok'})
    }).catch(function (err) {
        console.log(err)
        return response.onError(res,{message:err.toString()})
    })
})
router.post('/comment/create',function (req,res) {
    var body=req.body;
    models.ActivityComment.create({
        key:body.key,//外键
        content:body.content,//内容
        source:body.mid,//源人员
        root:body.source,
        parent:body.id
    }).then(function () {
        return response.onSuccess(res,{message:'ok'})
    }).catch(function (err) {
        console.log(err)
        return response.onError(res,{message:err.toString()})
    })
})
router.get('/article',function (req,res) {
    var body=req.query;
    if(!body.key){
        return response.onError(res,{message:'参数缺失'})
    }
    models.ActivityArticle.findAll({
        where:{key:body.key},
        attributes:['id','key','title','status'],
        raw:true,
    }).then(function (item) {
        return response.onSuccess(res,{list:item})
    }).catch(function (err) {
        console.log(err)
        return response.onError(res,{message:err.toString()})
    })
})
router.get('/comment',function (req,res) {
    var body=req.query;
    if(!body.key){
        return response.onError(res,{message:'参数缺失'})
    }
    getComment(body.key).then(function (item) {
        var len=item.length
        for(var i=0;len>i;i++){
            //对评论图片和用户图片的处理
            item[i].m_pics=utils.AbsolutePath(item[i].m_pics)
            item[i].time=setTime(utils.getUnixToTime(item[i].time));
            item[i].pics=item[i].pics?item[i].pics.split(','):[];
            item[i].count=0//初始化数据，子条数和子项目
            item[i].item=[]
            for(var j=0;len>j;j++){
                if(item[i].id==item[j].parent){
                    item[i].count+=1
                    item[i].item.unshift(item[j])
                }
            }
        }
        return response.onSuccess(res,{list:item.filter(function(node) {
            return node.parent==0;
        })});

/*        for(var i=0,len=item.length;len>i;i++){
            //对评论图片和用户图片的处理
            item[i].m_pics=utils.AbsolutePath(item[i].m_pics)
            item[i].time=setTime(utils.getUnixToTime(item[i].time))
            item[i].pics=item[i].pics?item[i].pics.split(','):[];
        }
        return response.onSuccess(res,{list:item})*/
    }).catch(function (err) {
        console.log(err)
        return response.onError(res,{message:err.toString()})
    })
})
var getComment = (key) =>{
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("select m.m_name as sourceName,m1.m_name as rootName,m.m_pics,m.m_company as company," +
        "comment.status,comment.source,comment.content,comment.parent,comment.id,comment.pics,comment.createdAt as time,comment.assist " +
        "from gj_activity_comment as comment " +
        "INNER JOIN gj_members as m ON m.mid=comment.source " +
        "LEFT JOIN gj_members as m1 ON m1.mid=comment.root " +
        "WHERE comment.key='{0}' " +
        "ORDER BY comment.parent,comment.createdAt DESC",key);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
};
var setTime = (time) =>{
    "use strict";
    //JavaScript函数：
    var minute = 1000 * 60;
    var hour = minute * 60;
    var day = hour * 24;
    var halfamonth = day * 15;
    var month = day * 30;
    var now = new Date().getTime();
    var diffValue = now - new Date(time).getTime();
    var result=''
    if(diffValue < 0){
        return '刚刚'
    }
    var monthC =diffValue/month;
    var weekC =diffValue/(7*day);
    var dayC =diffValue/day;
    var hourC =diffValue/hour;
    var minC =diffValue/minute;
    if(monthC>=1){
        // result=parseInt(monthC) + "个月前";
        result=moment(time).locale('zh-cn').format('M月D日');
    }
    else if(weekC>=1){
        // result=parseInt(weekC) + "周前";
        result=moment(time).locale('zh-cn').format('M月D日');
    }
    else if(dayC>=1){
        result=parseInt(dayC) +"天前";
    }
    else if(hourC>=1){
        result=parseInt(hourC) +"小时前";
    }
    else if(minC>=1){
        result=parseInt(minC) +"分钟前";
    }else{
        result="刚刚";
    }
    return result;
}


module.exports = router;