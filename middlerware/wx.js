var crypto = require('crypto')
var request = require('request');
var cwd = process.cwd();
var wx = require(cwd + '/config/config').wx_small_program;
function get_session_key(code, fn) {
  request.post('https://api.weixin.qq.com/sns/jscode2session?' +
      'appid='+ wx.AppID
      +'&secret='+ wx.AppSecret
      +'&js_code=' + code
      + '&grant_type=authorization_code',function (err, response, body) {
    fn&&fn(err,body);
  })
}
function WXBizDataCrypt(sessionKey) {
  this.appId = wx.AppID;
  this.sessionKey = sessionKey
}
//微信小应用openid解密
WXBizDataCrypt.prototype.decryptData = function (encryptedData, iv) {
  // base64 decode
  var sessionKey = new Buffer(this.sessionKey, 'base64');
  encryptedData = new Buffer(encryptedData, 'base64');
  iv = new Buffer(iv, 'base64');
  try {
     // 解密
    var decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, iv);
    // 设置自动 padding 为 true，删除填充补位
    decipher.setAutoPadding(true);
    var decoded = decipher.update(encryptedData, 'binary', 'utf8');
    decoded += decipher.final('utf8');
    decoded = JSON.parse(decoded)
  } catch (err) {
    console.log('err',err);
    return false;
  }
  if (decoded.watermark.appid !== this.appId) {
    console.log('appid不符合',decoded.watermark.appid);
    return false;
  }
  return decoded
};

module.exports = {
  get_session_key:get_session_key,
  crypt_openid:WXBizDataCrypt
};
