// 微信操作
define(['http://res.wx.qq.com/open/js/jweixin-1.0.0.js','./utils'], function (wx,Utils) {

  var domain = Utils.getParam('domain_prefix'),
      api = 'http://gikoo.mlp5plus.gikoo.cn/api/v1/wechat/',
      openid = null,
      wl = window.location;

  function getBackUrl() {
    var search = wl.search

    var url = wl.origin + wl.pathname + search + wl.hash
    return encodeURIComponent(url)
  }

  function getQuery(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)")
    var r = window.location.search.substr(1).match(reg)
    if (r != null)
      return unescape(r[2])
    return null
  }

  function getOpenId() {
    var code =  getQuery('code');
    if(code)
    {
      return code;
    }
    
    // 没有openid，调用微信接口
    if (!code) {
      var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx5a511f58fb7cb4db&redirect_uri=REDIRECT_URI&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect';
      //var backurl = encodeURIComponent(api + 'get-wechat-open-id/?back_url=' + getBackUrl())
      url = url.replace('REDIRECT_URI', window.location.href);
      window.location.href = url;
      return null
    }
    return code;
  }

  // 注册微信
  window.getWechatSignature = function (res) {
    console.log(111);
    res = res || []
    wx.config({
      debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
      appId: 'wx5a511f58fb7cb4db', // 必填，公众号的唯一标识
      timestamp: res[2], // 必填，生成签名的时间戳
      nonceStr: res[1], // 必填，生成签名的随机串
      signature: res[0],// 必填，签名，见附录1
      jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage', 'hideOptionMenu'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
    })
  }

  function callJsonpApi(url) {
    var script = document.createElement('script')
    script.src = url
    document.head.appendChild(script)
  }

  // 统计
  function log(type) {
    var share = getQuery('share')
    var openids = share ? share.split(',') : []
    if(!(openid in openids)){
      openids.push(openid)
    }
    if(openids.length>4){
      openids = openids.splice(0,3);
      openids.push(openid);
    }
    var qrcode = getQuery('qrcode');
    var  API = 'http://'+domain+'.mlp5plus.gikoo.cn/api/v1/wechat/';
    var url = API + 'tracker-user-poster-status/' +
              '?user_id=' + (getQuery('mps_user_id') || '') +
              '&position_id=' + (getQuery('position') || '') +
              '&op_type=' + type + 
              '&open_ids=' + openids.join(',')+
              (qrcode?('&qrcode='+qrcode):"")+
              (getQuery('store_id')?('&store_id=' +getQuery('store_id')):"");
    callJsonpApi(url)
  }

  function setShareInfo(title, desc, cover) {

    log(2)
    var shareStr = getQuery('share') || '';
    var flag = shareStr.indexOf(openid);
    var share = shareStr.split(',')

    if (share[0] === '') {
      share = []
    }
    if (share.length < 3 && flag==-1) {
      share.push(openid)
    }

    var link = location.origin + location.pathname + '?position=' + getQuery('position') + '&company=' + getQuery('company') + '&share=' + share.join(',')+'&domain_prefix='+ (getQuery('domain_prefix') || '')+ '&store_id='+(getQuery('store_id') || '') + '&mps_user_id='+(getQuery('mps_user_id') || '')
    //var link = 'http://job.gikoo.cn/wechat/poster.html?position=' + getQuery('position') + '&company=' + getQuery('company') + '&share=' + share.join(',')+'&domain_prefix='+ (getQuery('domain_prefix') || '')+ '&store_id='+(getQuery('store_id') || '') + '&mps_user_id='+(getQuery('mps_user_id') || '')

    //var link = location.origin + location.pathname + '?position=' + getQuery('position') + '&company=' + getQuery('company') + '&share=' + share.join(',')+'&domain_prefix='+ (getQuery('domain_prefix') || '')+ '&store_id='+(getQuery('store_id') || '') + '&mps_user_id='+(getQuery('mps_user_id') || '')
    var link = 'http://job.gikoo.cn/wechat/poster.html?position=' + getQuery('position') + '&company=' + getQuery('company') + '&share=' + share.join(',')+'&domain_prefix='+ (getQuery('domain_prefix') || '')+ '&store_id='+(getQuery('store_id') || '') + '&mps_user_id='+(getQuery('mps_user_id') || '')


    var data = {
      title: title, // 分享标题
      desc: desc, // 分享描述
      link: link, // 分享链接
      imgUrl: cover, // 分享图标
      success: function () { 
        // 用户确认分享后执行的回调函数
        log(3)
        // 分享成功测试回调
        // $.alert('shared')
        $.alert('分享成功');
      },
      cancel: function () { 
        // 用户取消分享后执行的回调函数
      }
    }
    wx.ready(function() {
      wx.onMenuShareTimeline(data)
      wx.onMenuShareAppMessage(data)
    })

    callJsonpApi(api + 'get-jsapi-signature/?callback=getWechatSignature&url=' + encodeURIComponent(location.href))
  }
  
  function setshareurl(shareurl, title, desc, cover) {
    var data = {
      title: title, // 分享标题
      desc: desc, // 分享描述
      link: shareurl, // 分享链接
      imgUrl: cover, // 分享图标
      success: function () {
        // 用户确认分享后执行的回调函数
        log(3)
        // 分享成功测试回调
        // $.alert('shared')
        $('#all-cover').css('display', 'block');
        $('#popupone').slideDown();
      },
      cancel: function () {
        // 用户取消分享后执行的回调函数
      }
    }
    wx.ready(function() {
      wx.onMenuShareTimeline(data)
      wx.onMenuShareAppMessage(data)
    })

    callJsonpApi(api + 'get-jsapi-signature/?callback=getWechatSignature&url=' + encodeURIComponent(location.href))

  }

  function hideOptionMenu() {
    wx.ready(function() {
      wx.hideOptionMenu()
    })
    callJsonpApi(api + 'get-jsapi-signature/?callback=getWechatSignature&url=' + encodeURIComponent(location.href))
  }
  // 发送给朋友: "menuItem:share:appMessage"
// 分享到朋友圈: "menuItem:share:timeline"
// 分享到QQ: "menuItem:share:qq"
// 分享到Weibo: "menuItem:share:weiboApp"
// 收藏: "menuItem:favorite"
// 分享到FB: "menuItem:share:facebook"
// 分享到 QQ 空间/menuItem:share:QZone
  function hideMenuItems(){
    wx.ready(function(){
      wx.hideMenuItems({
          menuList: ["menuItem:share:appMessage","menuItem:share:timeline","menuItem:share:qq","menuItem:share:weiboApp","menuItem:share:facebook","menuItem:share:QZone"] // 要隐藏的菜单项，只能隐藏“传播类”和“保护类”按钮，所有menu项见附录3
      });
    })
   
  }

  return {
    getOpenId: getOpenId,
    hideOptionMenu: hideOptionMenu,
    setShareInfo: setShareInfo,
    setshareurl:setshareurl,
    log: log,
    hideMenuItems:hideMenuItems
  }
})
