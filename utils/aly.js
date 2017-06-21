/**
 * Created by trlgml on 2017/3/28.
 * 阿里云上传相关
 */
var aly = {};
var co = require('co');
var OSS = require('ali-oss');
var crypto = require('crypto');
var moment = require('moment');
var client = new OSS({
    region: 'oss-cn-beijing',
    accessKeyId: 'DJMGU4mvJFo6mZdV',
    accessKeySecret: 'Q7KIWm7tBwNtIUD7I1pEFFWKChOjRE',
    bucket:'gejubusinessbucket',
});
/**
 * 获取pdf下面的图片（值针对pdf使用有效）
 * @param path
 * @returns {*|{res, objects, prefixes, nextMarker, isTruncated}}
 */
aly.getPdfToJpg = (path,cb) => {
    path=path.substring(path.indexOf('/file/')+1,path.indexOf('.pdf'))+'/'//路径处理
    co(function *() {
        try{
            var list=yield client.list({
                delimiter: '/',
                prefix: path
            })
            cb(null,list.objects || [])
        }catch (err){
            console.log(err)
            cb(err,null)
        }
    })

}

module.exports = aly;
