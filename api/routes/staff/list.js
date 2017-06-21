/**
 * Created by Administrator on 2016/11/16 0016.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var co = require('co');
var u_page = require(process.cwd() + '/utils/page');
var str = require(process.cwd() + '/utils/str');
router.get('/', function (req, res) {
    var options=u_page.cms_get_page_options(req);
    var body=req.query;
    var where={};
    if (body.m_phone){
        where.m_phone={'$like': '%'+body.m_phone+'%'}
    };
    if (body.m_name){
        where.m_name={'$like': '%'+body.m_name+'%'}
    };
    if(body.type){
        where.m_type={'$in':body.type.split(',')}
    }
    //为报名查询单条留用的条件
    if (body.phone){
        where.m_phone=body.phone
    };
    co(function * (){
        try{
            if(body.goods){
                var sql=new StringBuilder();
                var midArr=[]
                sql.AppendFormat("select b.related_fkey as mid from gj_goodsrelated as a INNER JOIN gj_goodsrelated as b ON a.relatedid=b.related_parent WHERE a.related_goodid={0} AND a.related_type=2",body.goods);
                var arr=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(item){
                    return Promise.all(item.map(function(node,index){
                        midArr.push(node.mid)
                    }))
                })
                if(midArr.length>0){
                    _.merge(where,{mid:{
                        '$notIn':midArr
                    }})
                }
            }
            models.Members.findAndCountAll({
                where:where,
                order:[['createdAt', 'DESC']],
                limit:options.pagesize,
                offset:options.offset
            }).then(function(item){
                if (item) {
                    var list=item.rows;
                    list.forEach( function(node, index) {
                        node.dataValues.createdAt = str.getUnixToTime(node.dataValues.createdAt);
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
        }catch (err){
            console.log(err)
        }
    })
});
module.exports = router;