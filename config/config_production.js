module.exports = {
    wwwname: "格局商学",//生产
    version: 'v1.2',//当前版本号
    aly: "http://files.cdn.geju.com",//阿里云服务器文件域名
    aly_video: "http://media.cdn.geju.com",//阿里云服务器文件域名
    verification:false,//验证
    transcodUrl:'http://101.200.232.241:8089',//转码域名
    baseUrl:'http://cms.geju.com',//基础域名
    website: "http://html.geju.com/html5",//H5域名
    session_secret: 'gjbucms',//服务器有多个web项目 新项目必改,否则缓存会冲突
    token_secret: 'app@gejubusiness',//token
    hx_admin: '96',//用户组群的创建者,改名字需在换新重新注册用户.
    hx_inform: '109',//格局商学通知id不可变更
    hx_group_img: "public/groupdefault.png",//用户组群的创建者,改名字需在换新重新注册用户.
    mysql:{
        "username": "gejudb",
        "password": "geju6-606",
        "database": "geju",
        "host": "rm-2zeg642im18h92eofo.mysql.rds.aliyuncs.com",
        "dialect": "mysql",
        "port":"3306",
        "timezone":"+08:00"
    },
    pay:{
        weixin:{
            appid:'wx3d579f3f9c5280a3',
            mch_id:'1471997102',
            partner_key:'286f520oNKsf2E3pdRzS542m08E2KC9I',
            secret:'071955273a5f16fc30fdaff9a5ec24c2',
            pfx:'./cert/apiclient_cert.p12',
            notify:'http://api.geju.com/pay/notify',
        },
        alipay:{
            app_id:'2017051107203575',
            direct_notify_url:'http://api.geju.com/pay/notify_url',
            direct_return_url:'http://api.geju.com/pay/return_url',
            rsa_private_key:'./cert/alipay_rsa_key.txt',
            alipay_public_key:'./cert/alipay_public_key.txt'
        }
    },
    hxchat:{//环信配置
        host:'a1.easemob.com',//环信域名
        Client_Id:'YXA63XHNkDBiEeaHixkGuiA7GA',//环信Client_Id
        Client_Secret:'YXA6n7GB1H0mHxcJbABhH-6URhUhbKs',//环信Client_Secret
        org_name:'gejubusniess',//环信org_name
        app_name:'pattern',//环信app_name
        password:'geju6-606',
        token:'YWMtRgSxNJLmEeaMr2Wp7zc69gAAAVj9zUtG7ldhyTMrTrIX6TBuyY17ZDpklTo',
    },
    hxchat_web: {
        host: 'a1.easemob.com',//环信域名
        Client_Id: 'YXA6EJtRgNk0Eead8jFbNkcsCA',//环信Client_Id
        Client_Secret: 'YXA6zzHK_QShZ7PdsE9oyQPh-1R2Muw',//环信Client_Secret
        org_name: 'gejubusniess',//环信org_name
        app_name: 'web',//环信app_name
        password: 'geju6-606',
    },
    rlsms: {//短信配置
        appId: '8a216da855826478015591039ace073c',//应用id
        templateId: '97740',//短信模板id
        accountSid: '8a48b55153eae51101540dc38ef1365c',//主账户id
        authtoken: 'db6ea888164c485fb64fb6c0122a938d',//token
        lostdata: '30',//短信失效时间
        host: "app.cloopen.com",  //主域名
        port: 8883  //端口
    },//微信号两个
    weixin: {
        attach: '格局商学',// 公众账号ID
        appid: 'wx5a511f58fb7cb4db',// 公众账号ID
        mch_id: '1362237102',//商户号
        key: 'PJ3H708YW9BKM6VFRDUXOCEZSGNILQ4A',//私钥
        secret: 'f98879dac4e2706523e4c9cda09c7e33'
    },
    wx_small_program: {
        AppID: 'wx270f28f770f14c37',
        AppSecret: 'c7c60510fd7cf2109f62adb4a616425a'
    },
    //redis配置
    redis:{
        host: '123.56.48.81',//上线后要替换
        port: 6379,
        time:1*60,//过期时间 秒
        newTime: 1 * 60 * 5,//过期时间 秒(为了兼容新加字段)
        password:'geju.2016'
    },
    umeng: {
        alias_type:'GEJU',
        production: true,//是否为生产环境
        ios: {
            key: '575cf37d67e58ed037001359',
            secret: 'wjrv4suti3oeercujfgqpqj5ap7wat2b'
        },
        android: {
            key: '5786ee5167e58e2d2b001425',
            message_secret: '8c83c482a1da08a845211edbab1485f8',
            secret: 'pepldbomn6tvdba8yzn1bkbd42qn60sy'
        }
    },
    dingtalk: {
        CorpID: 'dinge321dfb0cd88e41c',
        CorpSecret: 'FjDZ4RiyA62sWZVJFupbpF16PeFLmLRrjwTXdF5BjNaOK5GMfKh-kw3pQN0lBJF_',
        SSOsecret: 'dPMtmM-cnihKzIe9RP4YB3KPvc35Poch6VKKoFnJd58aNl4rTwyOO2imghnDDqB6',
        ChannelSecret: 'W_b7gRtUYpKwksdQezz3M5RS30w859xOMvZEmSoKo66D5PPxizvVY9C7HKiBm_U9',
        /*
         以下目前还完全用不到 以后用到可以从新设置
         但目前此回调地址 可以用于激活钉钉套件
         等不忙的时候 考虑激活套件 获取更多功能
         token: 'DA12AC3B16316A412B2AD9015DA42064',
         //钉钉套件 自定义token
         data: 'atgu3tm3difxutz4nwuyhy6a0woc9w2q71rjsunfs1h',
         //数据加密字段目前没地方用 这个目前还没用到
         callback: 'http://dev.geju.com/admin/callback/dingtalk'
         //钉钉设置的回调域名，如果布置到生产环境需要添加
         */
    }
};