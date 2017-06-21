/**
 * Created by guozengguang on 2017/04/06.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');
var str = require(process.cwd() + '/utils/str');
var models = require(process.cwd() + '/models/index');
var moment = require('moment');
var co = require('co');
var utils = require(process.cwd() + '/utils/page');
var xlsx = require('node-xlsx');
var path=require('path');

router.all('/*',Filter.authorize);

/**
 * 跳转到敏感词管理列表
 */
router.get('/',function (req,res) {
    return res.render('enroll/sensitive',{
        title:'敏感词管理'
    })
})

/**
 * ajax请求列表
 */
router.get('/sensitive_ajax',function (req,res) {
    var options = utils.cms_get_page_options(req);
    var body = req.query;
    var select = new StringBuilder();
    var selectCount = new StringBuilder();
    co(function *() {
        try{
            select.AppendFormat("SELECT words.*,user.user_nicename FROM gj_sensitive_words words INNER JOIN gj_user user ON words.uid=user.uid where 1=1 AND words.deleted_at IS NULL ");
            selectCount.AppendFormat("SELECT count(sw_id) as count FROM gj_sensitive_words words INNER JOIN gj_user user ON words.uid=user.uid where 1=1 AND words.deleted_at IS NULL ");
            if(body.sw_words){
                select.AppendFormat(" AND words.sw_words like '%{0}%' ",body.sw_words);
                selectCount.AppendFormat(" AND words.sw_words like '%{0}%' ",body.sw_words);
            }
            select.AppendFormat(" ORDER BY words.created_at DESC LIMIT {0},{1}",options.offset,options.pagesize);
            var count = yield models.sequelize.query(selectCount.ToString(), {type: models.sequelize.QueryTypes.SELECT});//yield表示同步执行
            models.sequelize.query(select.ToString(), {type: models.sequelize.QueryTypes.SELECT})
                .then(function(item) {
                    if(item){
                        var list = item;
                        list.forEach(function (node,index) {
                            node.created_at = moment(node.created_at).format('YYYY-MM-DD HH:mm:ss');
                            node.index = options.offset + index + 1
                        })
                        return response.onSuccess(res, {
                            list: list,
                            pagecount: Math.ceil(count[0].count/ options.pagesize)
                        })
                    }else {
                        return response.onError(res, '没有数据')
                    }
                })
        }catch (err){
            console.log(err)
        }
    })

})

/**
 * 删除
 */
router.post('/delete',function (req,res) {
    var body = req.body;
    var id = body.id;
    models.SensitiveWords.destroy({
        where: {
            sw_id: id
        }
    }).then(function () {
        response.ApiSuccess(res, {}, '删除成功');
    }, function (err) {
        response.ApiError(res, err);
    })
})
/**
 * 添加敏感词
 */
router.post('/add',function (req,res) {
    var body = req.body;
    body.uid=req.session.user.uid;
    models.SensitiveWords.create(body).then(function () {
        response.ApiSuccess(res, {}, '添加成功');
    }, function (err) {
        response.ApiError(res, err);
    })
})
/**
 * 修改敏感词
 */
router.post('/update',function (req,res) {
    var body = req.body;
    body.update_uid=req.session.user.uid;
    models.SensitiveWords.update(body, {where: {sw_id: body.sw_id}}).then(function () {
        response.ApiSuccess(res, {}, '修改成功');
    }, function (err) {
        response.ApiError(res, err);
    })
})
/**
 * 敏感词导入
 */
router.get('/import',function (req,res) {
    co(function* () {
        try{
            var filename=req.query.filename || '';
            var obj = xlsx.parse(path.join("./admin/public",filename));
            var result={};
            result.list=[];
            if(obj.length>0){
                console.log(obj[0])
                result.total= obj[0].data.length;//总数,-1去掉标题
                if(!result.total){
                    return response.onError(res, "没有数据啊");
                }else{
                    for(var i=0;i<obj[0].data.length;i++){
                        var node=obj[0].data[i];
                        //去除首尾空格
                        node.forEach(function(x,y){
                            node[y]=(node[y]+'').replace(/^\s+|\s+$/g,"")
                        });
                        //得到一条信息
                        var body={
                            sw_words:node[0] || ""
                        };

                        let pushdata={sw_words:body.sw_words};
                        //查询是否已存在该敏感词
                        var sw_words=yield models.SensitiveWords.findOne({where:{sw_words:body.sw_words}});
                        if(sw_words){//如果敏感词已存在直接退出
                            pushdata.importStatus='敏感词重复';
                            pushdata.message='敏感词重复';
                            pushdata.code=500;
                            result.list.push(pushdata);
                            continue;
                        }
                        models.SensitiveWords.create({sw_words:body.sw_words,uid:req.session.user.uid});
                        pushdata.importStatus='导入成功';
                        pushdata.code=200;
                        result.list.push(pushdata)
                        console.log(result.list)
                    }
                    return response.onDataSuccess(res, {data:result});
                }
            }else{
                return response.onError(res, "没有数据啊");
            }
        }catch(err) {
            console.log(err)
            return response.onError(res, "导入失败");
        }
    })
})

module.exports=router;