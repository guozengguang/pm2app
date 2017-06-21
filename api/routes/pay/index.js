/**
 * Created by Administrator on 2016/10/11 0011.
 */
var express = require('express');
var moment = require('moment');
var router = express.Router();
var request = require('request');
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var utils = require(process.cwd() + '/utils/utils');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');
var co = require('co');
var WX=require(process.cwd() + '/utils/weixin')
var AL=new require(process.cwd() + '/utils/alipay').alipay()
module.exports = router;
var URL={
    weixin:'http://dev.geju.com/pay/weixin.html',
    alipay:'http://dev.geju.com/pay/alipay.html',
    other:'http://dev.geju.com/pay/err.html',
    qrcode:'http://dev.geju.com/pay/index',
    ok:'http://dev.geju.com/pay/ok.html',
}
var middleware={
    create:function (body) {
        return models.PaymentCode.create(body)
    },
    update:function (body,where) {
        return models.PaymentCode.update(body,{where:where})
    }
}
var isWeixin = (req)=>{
    "use strict";
    let ua = req.headers["user-agent"].toLowerCase();
    return ua.match(/MicroMessenger/i)=="micromessenger";
}
var isAlipay = (req)=>{
    "use strict";
    let ua = req.headers["user-agent"].toLowerCase();
    return ua.match(/AliPayClient/i)=="alipayclient";
}
//跳转页
router.get('/index', function (req, res) {
    var info='其他'
    var body=req.query;
    if(isWeixin(req)){//微信客户端
        url=URL.weixin
        if(body.id){
            url+='?goods='+body.id
        }
        url=encodeURI(url)
        url='https://open.weixin.qq.com/connect/oauth2/authorize?appid='+WX.api.appid+'&redirect_uri='+url+'&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect'
    }else if(isAlipay(req)){//支付宝客户端
        url=URL.alipay
        if(body.id){
            url+='?goods='+body.id
        }
    }else {
        var url=URL.other
    }
    return res.redirect(302,url)
});
//微信逻辑
/**
 * 获取openid
 */
router.get('/openid', function (req, res) {
    var body=req.query;
    request('https://api.weixin.qq.com/sns/oauth2/access_token?appid='+WX.api.appid+'&secret='+WX.api.appsecret+'&code='+body.code+'&grant_type=authorization_code',function (err,r) {
        if(!err){
            return response.ApiSuccess(res,JSON.parse(r.body))
        }
    })
});
/**
 * 微信初始化
 */
router.get('/config', function (req, res) {
    var body=req.query;
    var param = {
        debug: false,
        jsApiList: ['hideAllNonBaseMenuItem','closeWindow'],
        url: body.url
    };
    WX.api.getJsConfig(param, function (err,data) {
        return response.ApiSuccess(res,data)
    });
});
/**
 * js下单
 */
router.post('/payment', function (req, res) {
    co(function *() {
        try {
            var body=req.body;
            console.log(body)
            //参数验证
            if(utils.ParameterControl(['fee','room','province','place','goods','goodsid','name','tel','openid'],body)){
                return response.ApiError(res,{message:'请完善信息'})
            }
            //参数合法性验证 手机号和金额  其余不验证
            if(!(/^1\d{10}$/.test(body.tel))){
                return response.ApiError(res,{message:'手机号码格式错误'})
            }
            var goodsFee=yield models.Goods.findOne({
                where:{goodsid:body.goodsid},
                attributes:['goods_fee'],
                raw:true
            })
            if(!(goodsFee && goodsFee.goods_fee==body.fee && body.fee!=0)){
                return response.ApiError(res,{message:'金额错误'})
            }
            var ip=req.ip;
            var openid=body.openid;
            var out_trade_no='gj'+moment().format('YYYYMMDDHHmmssSS')+Math.random().toString().substr(2, 4);
            var desc=body.goods+'（格局商学 '+body.room.split(' ')[1]+'）'
            var pay= {
                body: desc,
                out_trade_no: out_trade_no,
                total_fee: body.fee*100,
                spbill_create_ip: ip,
                trade_type: 'JSAPI',
                openid: openid
            }
            yield middleware.create({
                tel:body.tel,//手机号
                name:body.name,//姓名
                company:body.company,//公司
                position:body.position,//职位
                body:desc,//描述
                goods:body.goodsid,//课程id
                fee:body.fee,//金额
                calssroom:body.place,//分院id
                status:0,//状态 0预订单 1付款
                type:1,//类型 1微信 2 支付宝
                out_trade_no:out_trade_no,//商户订单号
                openid:'',//微信的openid
                buyer:'',//支付宝的付款账号
                transaction_id:'',//平台订单号
                total_fee:0.00,//实际付款金额
            })
            WX.payment.getBrandWCPayRequestParams(pay, function(err, result){
                result.out_trade_no=out_trade_no
                return response.ApiSuccess(res,result)
            });
        }catch (err){
            console.log(err)
        }
    })
});
/**
 * 回调通知
 */
router.post('/notify', WX.middleware.getNotify().done(function(message, req, res, next) {
    var openid = message.openid;
    var out_trade_no = message.out_trade_no;
    var total_fee = message.total_fee/100;
    var transaction_id = message.transaction_id;
/*    { appid: 'wx5a511f58fb7cb4db',
       bank_type: 'BOC_CREDIT',
       cash_fee: '1',
       fee_type: 'CNY',
       is_subscribe: 'Y',
       mch_id: '1362237102',
       nonce_str: '8JWAk9UZphU5jMEAMoC7d7ReOjEzegGr',
       openid: 'os9eMwHMHqzr__i73f6vboxMA2Iw',
       out_trade_no: 'gj20170505191703597551',
       result_code: 'SUCCESS',
       return_code: 'SUCCESS',
       sign: 'C6D107B8F2FE3BBC007141FDF45B8AA0',
       time_end: '20170505191709',
       total_fee: '1',
       trade_type: 'JSAPI',
       transaction_id: '4005072001201705059696347557' }*/
    middleware.update({
        status:1,
        transaction_id:transaction_id,
        total_fee:total_fee,
        openid:openid,
    },
    {
        out_trade_no:out_trade_no,
        type:1
    }).then(function () {
        res.reply('success');
    }).catch(function (err) {
        res.reply(new Error(err.toString()))
    })
}));

//支付宝逻辑
/**
 * 统一下单
 */
router.post('/trade', function (req, res) {
    co(function *() {
        try{
            var body=req.body;
            //参数验证
            if(utils.ParameterControl(['fee','room','province','place','goods','goodsid','name','tel'],body)){
                return response.ApiError(res,{message:'请完善信息'})
            }
            //参数合法性验证 手机号和金额  其余不验证
            if(!(/^1\d{10}$/.test(body.tel))){
                return response.ApiError(res,{message:'手机号码格式错误'})
            }
            var goodsFee=yield models.Goods.findOne({
                where:{goodsid:body.goodsid},
                attributes:['goods_fee'],
                raw:true
            })
            if(!(goodsFee && goodsFee.goods_fee==body.fee && body.fee!=0)){
                return response.ApiError(res,{message:'金额错误'})
            }
            var out_trade_no='gj'+moment().format('YYYYMMDDHHmmssSS')+Math.random().toString().substr(2, 4);
            var desc=body.goods+'（格局商学 '+body.room.split(' ')[1]+'）'
            var data = {
                total_amount: body.fee,
                out_trade_no: out_trade_no,
                subject: desc,
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
                body: body.goods
            };
            yield middleware.create({
                tel:body.tel,//手机号
                name:body.name,//姓名
                company:body.company,//公司
                position:body.position,//职位
                body:desc,//描述
                goods:body.goodsid,//课程id
                fee:body.fee,//金额
                calssroom:body.place,//分院id
                status:0,//状态 0预订单 1付款
                type:2,//类型 1微信 2 支付宝
                out_trade_no:out_trade_no,//商户订单号
                openid:'',//微信的openid
                buyer:'',//支付宝的付款账号
                transaction_id:'',//平台订单号
                total_fee:0.00,//实际付款金额
            })
            AL.alipay_trade_wap_pay(data, function (err,data) {
                return response.ApiSuccess(res,{url:data.url})
            })
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:'请求支付宝失败'})
        }
    })
});
/**
 * 回调通知 服务端通知
 */
router.post('/notify_url', function (req, res) {
    var body = req.body;
/*    { total_amount: '0.01', 订单金额
       buyer_id: '2088302206649581',
       trade_no: '2017051021001004580244323919',
       body: '思想的格局二期',
       notify_time: '2017-05-10 10:07:36',
       subject: '郭明亮购买思想的格局二期（上海分院）',
       sign_type: 'RSA2',
       buyer_logon_id: 'ydc***@126.com',
       auth_app_id: '2016070701589738',
       charset: 'utf-8',
       notify_type: 'trade_status_sync',
       invoice_amount: '0.01', 开票金额
       out_trade_no: 'gj20170510100725941654',
       trade_status: 'TRADE_SUCCESS',
       gmt_payment: '2017-05-10 10:07:36',
       version: '1.0',
       point_amount: '0.00',
       sign: 'RqOSsbH4NvU8vsEswPWJwEDlGImcutiEjl1L+FEwHNODPZ0nRxXarmOa9xC/jW5SerchndKJJngJ+euVAFnBoRCSik951ch3F1oI5QgtDyeAzkjvmvubKbq5MRetGl4RS4pU6NTv3C0PiNvK79GjPRoiJU++W1NJBzqJREWHrMkhlVQNgubDG3EaH6xF8cQPx1mHqmEFSWX0LXMe8K5zc8vR7fEtI8EvsbEhnzd1p2TGcccdnk7RRiWdJb0HvtW2sxQYaNhyIb1GHgOFEnx1027sgal3kHh6FBeM8rcWwTCB7QHyzoptK63jFMSTP+8pIk0mcf2eY8fPbM0MHjmnbQ==',
       gmt_create: '2017-05-10 10:07:35',
       buyer_pay_amount: '0.01', 付款金额
       receipt_amount: '0.01', 实收金额
       fund_bill_list: '[{"amount":"0.01","fundChannel":"ALIPAYACCOUNT"}]',
       app_id: '2016070701589738',
       seller_id: '2088421332662432',
       notify_id: 'ce2777a567733ba7fb209ab8c9582aakh6',
       seller_email: 'app@gejubusiness.com' }*/
    //商户订单号
    var out_trade_no = body['out_trade_no'];
    //支付宝交易号
    var trade_no = body['trade_no'];
    //交易状态
    var trade_status = body['trade_status'];
    //支付账号
    var buyer_email = body['buyer_logon_id'];
    //金额
    var total_fee = body['buyer_pay_amount'];
    //验证签名
    if(AL.verify(body,body.sign) && trade_status=='TRADE_SUCCESS'){
        middleware.update({
                status:1,
                transaction_id:trade_no,
                total_fee:total_fee,
                buyer:buyer_email,
            },
            {
                out_trade_no:out_trade_no,
                type:2
            }).then(function () {
            return res.send("success");
        }).catch(function (err) {
            return res.send("fail");
        })
    }else {
        return res.send("fail");
    }
});
/**
 * 回调通知 客户端通知
 */
router.get('/return_url', function (req, res) {
    var body=req.query
/*    { total_amount: '0.01',
       timestamp: '2017-05-10 20:07:37',
       sign: 'Ods5MRC1+E3SPFYhZxdM1MseoKz2MlYR7KTeePGuQVY+zHqCreXYw+mLhfKaefquWWhWfMw3uO8YoLQATyqLzTUbOZU/+cvN0AKRn6s7WR1O02f+uDY8rpviH3I75AxguvSHWFjNt5/EQe9FK3aW4IT+skbfH0lgIdCtpIZSkZ0loH+RlyTMoPby5dd+mHK4NDbvMZLGLH7paaW49KIHi/Ix50mbN+krmdIf/8MeLdPNK1wNgg+lkEVbKZPGplqpeONzckJn2/mrWK9W5mon8gcFTSgYWjfNdDHcHSgf0bsGiAxyz6AatLVbJtuqdOPD5O8/f3oSPBQqSEb/tIoAow==',
       trade_no: '2017051021001004580245441350',
       sign_type: 'RSA2',
       auth_app_id: '2016070701589738',
       charset: 'utf-8',
       seller_id: '2088421332662432',
       method: 'alipay.trade.wap.pay.return',
       app_id: '2016070701589738',
       out_trade_no: 'gj20170510200721383358',
       version: '1.0' }*/
    res.redirect(302,URL.ok+'?out_trade_no='+body.out_trade_no)
});

/**
 * 付款查询接口
 */
router.get('/query', function (req, res) {
    var body=req.query
    if(utils.ParameterControl(['out_trade_no'],body)){
        return response.ApiError(res,{message:'缺少单号'})
    }
    var sql=new StringBuilder();
    sql.AppendFormat("select p.createdat as time,p.total_fee as fee,g.goods_name as name from gj_payment_code as p " +
        "INNER JOIN gj_goods as g ON p.goods=g.goodsid " +
        "where p.status=1 AND p.out_trade_no='{0}'",body.out_trade_no);
    models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (data) {
        if(data.length>0){
            data[0].time=moment(data[0].time).format('YYYY-MM-DD HH:mm')
            return response.ApiSuccess(res,{datail:data[0]})
        }else {
            return response.ApiError(res,{message:'订单不存在'})
        }
    }).then(function (err) {
        console.log(err)
        return response.ApiError(res,{message:'查询错误'})
    })
});
/**
 * 付费专用接口
 */
//二维码生成
router.get('/qrcode', function (req, res) {
    var body=req.query;
    var qr = require('qr-image');
    var qr_svg = qr.image(URL.qrcode, { type: 'svg' ,ec_level:'L',margin:4});
    res.type('svg')
    qr_svg.pipe(res);
});
//课程列表
router.get('/goods', function (req, res) {
    var body=req.query
    var where={}
    if(body.goods){
        where.goodsid=body.goods
    }else {
        where.goods_status=1
    }
    co(function *() {
        try{
            var list=yield models.Goods.findAll({
                attributes:[['goods_name','name'],['goodsid','id'],['goods_fee','fee']],
                raw:true,
                where:where
            })
            //如果没有那么就全部返回
            if(list==0){
                list=yield models.Goods.findAll({
                    attributes:[['goods_name','name'],['goodsid','id'],['goods_fee','fee']],
                    raw:true,
                    where:where
                })
            }
            return response.ApiSuccess(res,{list:list})
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:'err'})
        }
    })
});
//分院列表
router.get('/room', function (req, res) {
    co(function *() {
        try{
            var sql=new StringBuilder();
            sql.AppendFormat("select gj_classroom.classroom,gj_classroom.classroom_name,gj_area.area_name,gj_area.areaid " +
                "from gj_area INNER JOIN gj_classroom ON gj_area.areaid=gj_classroom.classroom_areaid where gj_classroom.classroom_status=0");
            sql.AppendFormat(" ORDER BY FIELD(area_name,'北京','天津','上海','重庆','河北','河南','云南','辽宁','黑龙江'" +
                ",'湖南','安徽','山东','新疆维吾尔自治区','江苏','浙江','江西','湖北','广西壮族','甘肃','山西','内蒙古自治区'" +
                ",'陕西','吉林','福建','贵州','广东','青海','西藏','四川','宁夏回族','海南','台湾','香港特别行政区','澳门特别行政区')");
            var area = yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
            var arr=[];
            var arr1=[];
            var arr2=[];
            area.forEach(function(node,index){
                if(arr.indexOf(node.area_name)==-1){
                    arr.push(node.area_name)
                    arr1.push(node.areaid)
                }
            });
            arr.forEach(function(i,j){
                arr2[j]={};
                arr2[j].name=i;
                arr2[j].id=arr1[j];
                arr2[j].sub=[];
                area.forEach(function(node,index){
                    if((node.area_name)==i){
                        arr2[j].sub.push({name:node.classroom_name,id:node.classroom})
                    }
                })
            });
            return response.ApiSuccess(res,{list:arr2});
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:'err'})
        }
    })
});




