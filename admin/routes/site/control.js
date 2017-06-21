
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var config = require(process.cwd() + '/config/config');
var Str = require(process.cwd() + '/utils/str');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');
var utils = require(process.cwd() + '/utils/page');
var co = require('co');
var fs = require('fs');
var multer = require('multer');
var OSS = require('ali-oss');
var crypto = require('crypto');
var moment = require('moment');
var _ = require('lodash');
var data2xml = require('data2xml');
var SMB2 = require('smb2');
var ALY = require(process.cwd() + '/utils/aly/util');
router.get('/all', function (req, res) {
    var body=req.query;
    var c=req.cookies;
    var key="admin";
    var value="geju";
    var Validate=false;
    for(var a in c){
        if(a==key && value==c[key]){
            Validate=true;
            break;
        }
    }
    var sql=new StringBuilder();
    sql.AppendFormat("select c.classid,c.class_img,c.class_end,c.class_start from gj_class as c order by c.class_end desc");
    models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(item){
        if(item.length<=0){
            return res.send('课程不存在');
        }
        var backList=[],
            nowList=[]
        item.forEach(function (node) {
            node.class_img=Str.AbsolutePath(node.class_img)
            node.class_end=moment(node.class_end).format('YYYY-MM-DD HH-mm-ss')
            //分组
            if(moment()>moment(node.class_end)){
                backList.push(node)
            }else {
                nowList.push(node)
            }
        })
        return res.render('site/list', {
            title: '现场控制',
            backList:_.sortBy(backList, function(item){
                return -item.class_start;
            }),
            nowList:_.sortBy(nowList, function(item){
                return item.class_start;
            }),
            Validate:Validate
        });
    }).catch(function(err){
        console.log(err)
        return res.send(err.toString());
    })
});

router.get('/detail/:id', function (req, res) {
    var body=req.query;
    var id=req.params.id;
    var c=req.cookies;
    var key="admin";
    var value="geju";
    var Validate=false;
    for(var a in c){
        if(a==key && value==c[key]){
            Validate=true;
            break;
        }
    }
    if(!id){
        return res.send('参数错误');
    }
    var sql=new StringBuilder();
    sql.AppendFormat("select c.classid,c.class_name,m.m_name,m.m_pics,m.mid,c.class_start from gj_class as c INNER JOIN gj_members as m ON m.mid IN (c.class_teacher) where c.classid={0}",id);
    models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(item){
        if(item.length<=0){
            return res.send('课程不存在');
        }
        item=item[0]
        item.m_pics=Str.AbsolutePath(item.m_pics)
        item.class_start=Str.getUnix(item.class_start)
        return res.render('site/control', {
            title: '现场控制',
            id: id,
            url:config.website,
            item:item,
            Validate:Validate
        });
    }).catch(function(err){
        console.log(err)
        return res.send(err.toString());
    })
});
router.post('/login',function(req,res){
    var body=req.body;
    if(body.key=="admin" && body.value=="geju"){
        return response.onSuccess(res, {})
    }else {
        return response.onError(res,{message:'不匹配'});
    }
})
router.get('/question', function (req,res){
    var options=utils.cms_get_page_options(req);
    var body=req.query;
    var where={question_status:1,limit:options.pagesize,offset:options.offset,sort:'question_votes DESC'};
    if (!body.classid){
        return response.onError(res,'classid empty')
    };
    if(body.sort==1){
        where.sort='gj_question.createdAt DESC'
    }
    where.question_classid=body.classid;
    var sql=new StringBuilder();
    sql.Append("SELECT question_classid,question_status,question_content,question_title,question_votes,(case when cl.classroom_name is null then c.classroom_name else cl.classroom_name end) as classroom_name,mid,m_name,(case when gj_members.m_pics='' then gj_wx.avatarUrl else gj_members.m_pics end) as m_pics,questionid,m_company FROM gj_question")
    sql.Append(" LEFT JOIN gj_classroom as c ON c.classroom=gj_question.question_classroomid")
    sql.Append(" INNER JOIN gj_class ON gj_class.classid=gj_question.question_classid")
    sql.Append(" INNER JOIN gj_members ON gj_members.mid=gj_question.question_fromuser")
    sql.Append(" LEFT JOIN gj_wx ON gj_wx.userId=gj_question.question_fromuser")
    sql.Append(" LEFT JOIN gj_userclass ON gj_class.class_goodsid=gj_userclass.uc_goodsid AND gj_question.question_fromuser=gj_userclass.uc_userid")
    sql.Append(" LEFT JOIN gj_classroom as cl ON cl.classroom=gj_userclass.uc_calssroomid")
    sql.AppendFormat(" WHERE question_site=0 AND question_classid = {0} AND question_status = '{1}'",where.question_classid,where.question_status);
    sql.AppendFormat(" GROUP BY gj_question.questionid ORDER BY {2} LIMIT {0},{1}",where.offset,where.limit,where.sort);
    models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(list){
        list.forEach(function(node,index){
            node.m_pics=Str.AbsolutePath(node.m_pics)
            node.classroom_name=node.classroom_name?node.classroom_name:'暂无分院'
        })
        return response.onSuccess(res, {list:list})
    }).catch(function(err){
        console.log(err)
        return res.send(err.toString());
    })
});
router.get('/list', function (req,res){
    var body=req.query;
    var where={site_status:0};
    if (!body.classid){
        return response.onError(res,'classid empty')
    };
    var id=body.classid
    where.site_classid=id;
    co(function *() {
        try{
            //问题列表
            var list=yield models.SiteQuestion.findAll({
                where:where,
                order:[['site_sort']],
                raw:true
            })
            list.forEach( function(node, index) {
                node.index = index + 1
                node.site_pics=Str.AbsolutePath(node.site_pics)
            });
            //课程详情
            var sql=new StringBuilder();
            sql.AppendFormat("select c.class_name,m.m_name,m.m_pics from gj_class as c INNER JOIN gj_members as m ON m.mid IN (c.class_teacher) where c.classid={0}",id);
            var detail=yield  models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
            detail=(detail.length>0)?detail[0]:{}
            detail.m_pics=Str.AbsolutePath(detail.m_pics)
            return response.onSuccess(res, {list:list,detail:detail})
        }catch (err){
            console.log(err)
            return response.onError(res,err.message)
        }
    })
});
router.post('/create', function (req,res){
    var body=req.body;
    body.site_sort=moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10)
    models.SiteQuestion.create(body).then(function(){
        return response.onSuccess(res, {})
    }).catch(function(err){
        console.log(err)
        return response.onError(res,err.message)
    })
});
router.get('/del', function (req,res){
    var body=req.query;
    var where={};
    if (!body.classid){
        return response.onError(res,'classid empty')
    };
    where.site_classid=body.classid;
    models.SiteQuestion.findAll({
        where:where,
        order:[['createdAt', 'DESC']],
        raw:true
    }).then(function(item){
        item.forEach( function(node, index) {
            node.index = index + 1
        });
        return response.onSuccess(res, {list:item})
    }, function(err){
        console.log(err)
    });
});
router.get('/user', function (req,res){
    var body=req.query;
    // var where={'$or': [
    //     {'m_phone': {'$like': '%'+body.content+'%'}},
    //     {'m_name': {'$like': '%'+body.content+'%'}},
    //     {'m_company': {'$like': '%'+body.content+'%'}}
    // ]};
    var sql=new StringBuilder();
    sql.Append("SELECT uc_calssroomname,m_pics,mid,m_name,m_company,m_pics,m_firstabv FROM gj_members")
    sql.Append(" INNER JOIN gj_userclass ON gj_members.mid=gj_userclass.uc_userid")
    sql.AppendFormat(" WHERE m_phone LIKE '%{0}%' OR m_name LIKE '%{0}%' OR m_company LIKE '%{0}%'",body.content);
    sql.AppendFormat(" GROUP BY uc_calssroomname ORDER BY m_firstabv LIMIT 0,20");
    models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(list){
        list.forEach(function(node,index){
            node.m_pics=Str.AbsolutePath(node.m_pics);
            if(node.m_company.length>12){
                node.m_company=node.m_company.substr(0,12)+'...'
            }
        })
        return response.onSuccess(res, {list:list})
    }).catch(function(err){
        console.log(err)
        return response.onError(res,{message:err.message});
    })
});
router.post('/choose', function (req,res){
    var body=req.body;
    models.sequelize.transaction(function (t) {
        // 在事务中执行操作
        return models.Question.findOne({where:{questionid:body.id,question_site:0}}, {transaction:t})
            .then(function(item){
                console.log(item)
                return item.update({question_site:1},{transaction:t})
            })
            .then(function(item){
                return models.SiteQuestion.create({
                    site_question:body.id,
                    site_mid:body.mid,
                    site_classid:body.class,
                    site_name:body.name,
                    site_pics:body.pics,
                    site_company:body.company,
                    site_title:body.title,
                    site_content:body.content,
                    site_classroom:body.room,
                    site_sort:moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10)
                }, {transaction:t})
            });
    }).then(function (results){
        return response.onSuccess(res, {})
    }).catch(function(err){
        console.log(err)
        return response.onError(res,{message:err.message});
    });

});
router.post('/unChoose', function (req,res){
    var body=req.body;
    //qid 问题id sid 大屏id
    models.SiteQuestion.update({site_status:1},{
        where:{siteid:body.sid}
    }).then(function(item){
        if(body.qid){
            return models.Question.update({question_site:0},{where:{questionid:body.qid}})
        }else {
            return ''
        }
    }).then(function(){
        return response.onSuccess(res, {})
    }).catch(function(err){
        console.log(err)
        return response.onError(res,{message:err.message});
    })
});
router.post('/complete', function (req,res){
    var body=req.body;
    models.SiteQuestion.update({site_status:2},{
        where:{siteid:body.id}
    }).then(function(){
        return response.onSuccess(res, {})
    }).catch(function(err){
        console.log(err)
        return response.onError(res,{message:err.message});
    })
});
router.post('/up', function (req,res){
    var body=req.body;
    if(!body.id){
        return res.send('参数错误');
    }
    var sql=new StringBuilder();
    sql.AppendFormat("select * from gj_site_question where site_sort <(select site_sort from gj_site_question where siteid={0}) and site_status=0 order by site_sort desc limit 1",body.id);
    models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(item){
        console.log(item)
        if(!item.length>0){
            throw new Error('最大')
        }
        var compare={
            small:body.id,
            big:item[0].siteid
        }
        var exSql=new StringBuilder();
        exSql.AppendFormat("update gj_site_question as s1 join gj_site_question as s2 on (s1.siteid={0} and s2.siteid = {1}) or (s1.siteid={1} and s2.siteid = {0}) set s1.site_sort = s2.site_sort,s2.site_sort=s1.site_sort",compare.small,compare.big);
        return models.sequelize.query(exSql.ToString(),{ type: models.sequelize.QueryTypes.UPDATE })
    }).then(function(){
        return response.onSuccess(res, {})
    }).catch(function(err){
        console.log(err)
        return response.onError(res,{message:err.toString()});
    })
});
router.post('/down', function (req,res){
    var body=req.body;
    if(!body.id){
        return res.send('参数错误');
    }
    var sql=new StringBuilder();
    sql.AppendFormat("select * from gj_site_question where site_sort >(select site_sort from gj_site_question where siteid={0}) and site_status=0 order by site_sort limit 1",body.id);
    models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(item){
        console.log(item)
        if(!item.length>0){
            throw new Error('最小')
        }
        var compare={
            big:body.id,
            small:item[0].siteid
        }
        var exSql=new StringBuilder();
        exSql.AppendFormat("update gj_site_question as s1 join gj_site_question as s2 on (s1.siteid={0} and s2.siteid = {1}) or (s1.siteid={1} and s2.siteid = {0}) set s1.site_sort = s2.site_sort,s2.site_sort=s1.site_sort",compare.small,compare.big);
        return models.sequelize.query(exSql.ToString(),{ type: models.sequelize.QueryTypes.UPDATE })
    }).then(function(){
        return response.onSuccess(res, {})
    }).catch(function(err){
        console.log(err)
        return response.onError(res,{message:err.toString()});
    })
});
router.post('/upload', function (req,res){
    try{
        //创建目录;
        var dir='./admin/public/upload/'+moment().format("YYYY-MM-DD");
        if (fs.existsSync(dir)) {
            console.log('已经创建过此目录了');
        } else {
            fs.mkdirSync(dir);
            console.log('目录已创建成功\n');
        }
        var  upload = multer({
            storage: multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, dir)
                },
                filename: function (req, file, cb) {
                    cb(null, req.body.name)
                }
            })
        }).single('file');
        upload(req, res, function (err) {
            if (err) {
                return response.onError(res, "操作异常");
            }else{
                aliOss(req.file.path,function(result){
                    if(result){
                        return response.onSuccess(res,result);
                    }else{
                        return response.onError(res, "操作异常");
                    }
                })
            }
        })
    }catch (err){
        console.log(err)
    }
});
router.post('/site',function(req,res){
    "use strict";
    var body=req.body;
    var convert = data2xml();
    var builder = convert('Message',body);
    fs.writeFile('./admin/public/upload/site/site.xml', builder, function(err){
        if(!err){
            aliOssSite({fileName:'./admin/public/upload/site/site.xml',filePath:'site.xml'},function(result){
                if(result){
                    return response.onSuccess(res,result);
                }else{
                    return response.onError(res, "操作异常");
                }
            })
        }

    })
})
router.post('/user',function(req,res){
    "use strict";
    var body=req.body;
    var convert = data2xml();
    var builder = convert('Message',body);
    fs.writeFile('./admin/public/upload/site/user.xml', builder, function(err){
        if(!err){
            aliOssSite({fileName:'./admin/public/upload/site/user.xml',filePath:'user.xml'},function(result){
                if(result){
                    return response.onSuccess(res,result);
                }else{
                    return response.onError(res, "操作异常");
                }
            })
        }

    })
})
router.post('/userInfo',function(req,res){
    "use strict";
    //获取我的企业信息
    co(function *() {
        try{
            var body=req.body;
            if(!body.mid){
                return response.onError(res,'参数缺失');
            }
            if(body.mid==0){
                return response.onError(res,'参数错误');
            }
            var sql=new StringBuilder();
            sql.AppendFormat("select en.desc from gj_enterprise as en " +
                "INNER JOIN gj_enterprise_member as enm ON enm.enterprise=en.id AND enm.member={0} " +
                "WHERE en.status!=-1 ",body.mid)
            var info=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
            info=(info.length==0)?{}:info[0]
            var detail={};
            detail.desc=info.desc || '';
            var url=yield models.Config.findOne({
                where:{
                    key:'transfercode'
                },
                raw:true,
                attributes:['val']
            })
            var code=url.val+'?transfertype=10&id='+body.mid
            detail.code=code;
            return response.onSuccess(res,{detail:detail})
        }catch (err){
            console.log(err)
        }
    })
})
router.get('/qrcode',function (req,res) {
    var body=req.query;
    var url=body.url;
    var id=body.id;
    var size=body.size?body.size:10;
    var type=body.type?body.type:'png';
    if(!(type=="png" || type=="jpg")){
        type="png"
    }
    size=parseInt(size);
    var  qr_image = require( 'qr-image' );
    var qrcode=qr_image.image(url,{ type: type, ec_level: 'L', size: size, margin: 0 })
    res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename='+moment().format('X')+'.'+type,
    });
    qrcode.pipe(res);
})
function aliOss(filename,callback){
    co(function* () {
        var client = new OSS({
            region: 'oss-cn-beijing',
            accessKeyId: 'DJMGU4mvJFo6mZdV',
            accessKeySecret: 'Q7KIWm7tBwNtIUD7I1pEFFWKChOjRE',
            timeout:60000*6000
        });
        client.useBucket('gejubusinessbucket');
        var name='gejubusiness/'+moment().format('YYYY-MM-DD')+'/'+crypto.createHash('md5').update(filename).digest("hex")+'.'+filename.split('.').slice(-1);
        var result = yield client.put(name, filename);
        callback(result);
    }).catch(function(err){
        console.log(err);
        callback(null,null);
    })
}
function aliOssSite(option,callback){
    co(function* () {
        var client = new OSS({
            region: 'oss-cn-beijing',
            accessKeyId: 'DJMGU4mvJFo6mZdV',
            accessKeySecret: 'Q7KIWm7tBwNtIUD7I1pEFFWKChOjRE',
            timeout:60000*6000
        });
        client.useBucket('gejubusinessbucket');
        var name='site/'+option.filePath;
        var result = yield client.put(name, option.fileName);
        callback(result);
    }).catch(function(err){
        console.log(err);
        callback(null,null);
    })
}
module.exports = router;
