var models  = require('../../models');
var config=require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var utils = require('../../utils/page');
var Str = require('../../utils/str');
var co = require('co');
var Logs=require("../controller/logs");
var fs = require('fs');
var multer = require('multer');
var OSS = require('ali-oss');
var crypto = require('crypto');
var request = require('request');
var ALY = require('../../utils/aly/util');
var StringBuilder = require('../../utils/StringBuilder');

//视频上传
exports.video_render = function (req, res) {
  return res.render('attachs/video', {
    title: '视频上传',
  });
};
exports.attach_list = function(req,res){
  var options=utils.cms_get_page_options(req);
  var body=req.query;
  var where={};
  where.attach_type=1;
  console.log(body)
  if(body.attach_title){
    where.attach_title={"like":"%"+body.attach_title+"%"}
  }
  models.Attach.findAndCountAll({
    where:where,
    order:[['createdAt', 'DESC']],
    limit:options.pagesize,
    offset:options.offset
  }).then(function(item){
    if (item) {
      var list=item.rows;
      list.forEach( function(node, index) {
        node.dataValues.createdAt = moment(node.dataValues.createdAt).format('YYYY-MM-DD HH:mm:ss');
        node.dataValues.source_attach_path = node.dataValues.attach_path;
        node.dataValues.attach_path = Str.AbsoluteVideoPath(node.dataValues.attach_path);
        node.dataValues.index = options.offset + index + 1
      });
      return response.onSuccess(res, {
        list:list,
        pagecount: Math.ceil(item.count / options.pagesize)
      })
    }else {
      return response.onError(res,'没有数据')
    }
  }, function(err){
    console.log(err)
  });
}
//精彩锦集
exports.splendid_render = function (req, res) {
  return res.render('attachs/splendid/list', {
    title: '精彩锦集',
  });
};
exports.splendid_add = function (req, res) {
  return res.render('attachs/splendid/add', {
    title: '添加项目',
  });
};
exports.splendid_edit = function (req, res) {
  var body=req.query;
  var sql=new StringBuilder();
  sql.Append("select * from gj_prdattach");
  sql.AppendFormat(" INNER JOIN gj_attach on gj_attach.attachid=gj_prdattach.attachid where prdattachid={0}",body.id);
  models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (item) {
    console.log(item)
    item=item.length>0?item[0]:{}
    return res.render('attachs/splendid/edit', {
      title: '编辑项目',
      item:item,
      aly:config.aly
    });
  })
};
//讲师墙
exports.lecturerWall_render = function (req, res) {
  return res.render('attachs/lecturerWall', {
    title: '讲师墙',
    aly:config.aly
  });
};
exports.lecturerWall_list=function(req,res){
  var body=req.query;
  var sql=new StringBuilder();
  sql.AppendFormat("select * from gj_lecturer_wall as lec INNER JOIN gj_members as m ON lec.lecturer_key=m.mid");
  models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(item){
    return response.onSuccess(res,{list:item})
  }).catch(function(err){
    console.log(err)
    return response.onError(res,'错误')
  })
},
exports.lecturerWall_create=function(req,res){
  var body=req.body;
  models.LecturerWall.upsert(body,{validate:true}).then(function(item){
    if(item){
      return response.onSuccess(res,{message:'添加成功'})
    }else {
      return response.onSuccess(res,{message:'修改成功'})
    }
  }).catch(function(err){
    console.log(err)
    return response.ApiError(res,{message:err.message})
  })
},
exports.lecturerWall_update=function(req,res){
  var body=req.body;
  models.LecturerWall.destroy({where:{lecturer_id:body.id}}).then(function(){
    return response.onSuccess(res,{message:'成功'})
  }).catch(function(err){
    console.log(err)
    return response.onError(res,'错误')
  })
},

exports.upload_base64_img = function (req, res) {
  var base64=req.body.base64;
  var date = new Date();
  var file=date.getTime()+'.jpg';
  //设置目录;
  var dir='./admin/public/upload/'+moment().format("YYYY-MM-DD");
  //创建目录;
  if (fs.existsSync(dir)) {
    console.log('已经创建过此目录了');
  } else {
    fs.mkdirSync(dir);
    console.log('目录已创建成功\n');
  }
  var bitmap = new Buffer(base64, 'base64');
  fs.writeFileSync(dir+'/'+file, bitmap);
  dir=dir.substr(2);
  aliOss(dir+'/'+file,function(result){
    if(result){
      models.Attach.create({
        attach_type:0,
        attach_path:result.name,
        attach_from:req.session.user.user_login,
        attach_title:'图片'
      });
      return response.onSuccess(res,result);
    }else{
      return response.onError(res, "操作异常");
    }
  })
};

exports.upload_img=function(req,res){
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
  console.log(req.body);
  upload(req, res, function (err) {
    if (err) {
      return response.onError(res, "操作异常");
    }else{
      return response.onSuccess(res,req.file.path.substr(12).replace("public","").replace(/\\/ig, '/'));
    }
  })
}

//上传相关
exports.aly_upload_img=function(req,res){
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
  console.log(upload)
  upload(req, res, function (err) {
    console.log(req.file.path)
    if (err) {
      return response.onError(res, "操作异常");
    }else{
      aliOss(req.file.path,function(result){
        if(result){
          models.Attach.create({
            attach_type:0,
            attach_path:result.name,
            attach_from:req.session.user.user_login,
            attach_title:'图片'
          });
          return response.onSuccess(res,result);
        }else{
          return response.onError(res, "操作异常");
        }
      })
    }
  })
}

exports.aly_upload_pdf=function(req,res){
  //创建目录;
  var dir='./admin/public/upload/pdf';
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
      aliOssPdf(req.file.path,function(result){
        console.log(result);
        if(result){
          models.Attach.create({
            attach_type:2,
            attach_path:result.name,
            attach_from:req.session.user.user_login,
            attach_title:'ftp'
          });
          return response.onSuccess(res,result.name);
        }else{
          return response.onError(res, "操作异常");
        }
      })
    }
  })
}

exports.aly_upload_video=function(req,res){
  //创建目录;
  var body=req.body;
  var m=moment().format('YYYY-MM-DD')
  var filename=body.path.split('/')[2].split('.')[0];
  var md5=Str.md5(moment()+'')
  var outfile='outfile/'+m+'/'+md5+'/'+filename;
  var params={inputfile:encodeURI(body.path),outfile:encodeURI(outfile)};
  var jpgparams={inputfile:encodeURI(body.path),outfile:encodeURI(outfile+'.jpg')};
  var r=response;
  //提交截图
  request.post({url:ALY.url,form:ALY.mts.SubmitSnapshotJob(jpgparams)},function(err,response, body){
    var info=JSON.parse(body);
  });
  //提交转码
  request.post({url:ALY.url,form:ALY.mts.SubmitJobs(params)},function(err,response, body){
    var info=JSON.parse(body);
    info.JobResultList.JobResult.forEach(function(node,index){
      models.Attach.create({
        attach_type:1,
        attach_status:1,
        attach_path:outfile+'.m3u8',
        attach_from:req.session.user.user_login,
        attach_title:filename,
        attach_jobid:node.Job.JobId,
      }).then(function(){
        return r.onSuccess(res,{ path: outfile+'.m3u8' });
      },function(err){
        console.log(err)
      })
    })
  });
}
// models.Attach.findAll({where:{attach_type:1}}).then(function(item){
//   Promise.all(item.map(function(node){
//     "use strict";
//     Str.getMediaInfo(node.dataValues.attach_path).then(function(data){
//       node.update({attach_duration:data})
//     })
//   }))
// }).then(function(item){
//   "use strict";
//   console.log(item)
// })
exports.notification_callback = function(req,res){
  req.rawBody='';
  //var json='{"jobId":"d01e0774007d46a7933bf9594fdcbadc","Type":"Transcode","state":"Success","type":"Transcode","State":"Success","JobId":"d01e0774007d46a7933bf9594fdcbadc"}';
  var json={}
  req.setEncoding('utf8');
  req.on('data',function(chunk){
    req.rawBody+=chunk;
  });
  req.on('end',function(){
    json=JSON.parse(req.rawBody);
    models.Attach.findOne({
      where:{attach_jobid:json.jobId}
    }).then(function(item){
      if(item){
        if(json.state=='Success'){
          Str.getMediaInfo(item.attach_path).then(function(data){
            item.update({attach_duration:data,attach_status:0})
          })
        }else {
          item.update({attach_status:2})
        }
      }
      res.status(204).send();
    },function(err){
      console.log(err)
      res.status(500).send();
    })
  })

}
function aliOss(filename,callback){
  co(function* () {
    console.log("file:"+filename);
    var client = new OSS({
      region: 'oss-cn-beijing',
      accessKeyId: 'DJMGU4mvJFo6mZdV',
      accessKeySecret: 'Q7KIWm7tBwNtIUD7I1pEFFWKChOjRE',
      bucket:'gejubusinessbucket',
    });
    // client.useBucket('gejubusinessbucket');
    var name='gejubusiness/'+moment().format('YYYY-MM-DD')+'/'+crypto.createHash('md5').update(filename).digest("hex")+'.'+filename.split('.').slice(-1);
    var result = yield client.put(name, filename);
    callback(result);
  }).catch(function(err){
    console.log(err);
    callback(null,null);
  })
}
function aliOssPdf(filename,callback){
  co(function* () {
    console.log("file:"+filename);
    var client = new OSS({
      region: 'oss-cn-beijing',
      accessKeyId: 'DJMGU4mvJFo6mZdV',
      accessKeySecret: 'Q7KIWm7tBwNtIUD7I1pEFFWKChOjRE',
      bucket:'gejubusinessbucket',
    });
    var name='file/'+moment().format('YYYY-MM-DD')+'/'+crypto.createHash('md5').update(filename).digest("hex")+'.'+filename.split('.').slice(-1);
    var result = yield client.put(name, filename);
    callback(result);
  }).catch(function(err){
    console.log(err);
    callback(null,null);
  })
}

