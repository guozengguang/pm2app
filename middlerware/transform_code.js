/**
 * Created by Administrator on 2016/12/23 0023.
 */
var request = require('request-promise');
var moment = require('moment');

var cwd = process.cwd();
var ALY = require(cwd + '/utils/aly/util');
var Str = require(cwd + '/utils/str');
exports.transform_m3u8 = function (path, filename) {
    // 按照时间建立文件夹
    var time = moment().format('YYYY-MM-DD');
    var en_path = encodeURI(path);
    var md5 = Str.md5(moment() + '');
    // 文件存储路径
    var outfile = 'outfile/' + time + '/' + md5 + '/' + filename;
    // 视频输出路径
    var params = {inputfile: en_path, outfile: encodeURI(outfile)};
    // 图片输出路径
    var jpgparams = {inputfile: en_path, outfile: encodeURI(outfile + '.jpg')};
    return {
        promise: Promise.all([
            request({
                method: 'POST',
                uri: ALY.url,
                form: ALY.mts.SubmitSnapshotJob(jpgparams)
            }),
            request({
                method: 'POST',
                uri: ALY.url,
                form: ALY.mts.SubmitJobs(params)
            })
        ]),
        file: outfile + '.m3u8',
        img: outfile + '.jpg'
    }
};