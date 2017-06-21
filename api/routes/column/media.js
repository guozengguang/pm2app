/**
 * Created by Administrator on 2016/10/28 0028.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var utils = require(process.cwd() + '/utils/str');
router.get('/', function (req, res) {
    var query = req.query;
    var id = query.id;
    var page = query.page || 1;
    var size = query.size || 10;
    var select = 'SELECT * FROM gj_column as a ' +
        'LEFT JOIN gj_columnmedia as b ON a.columnid = b.cm_columnid AND b.cm_status = 1 ' +
        'LEFT JOIN gj_media as c ON b.cm_mediaid = c.mediaid AND c.media_pushtime < NOW() AND c.media_status != 3 ' +
        'WHERE b.deletedAt IS NULL AND column_status != 3 ';
    if(id){
        select += " AND a.column_path LIKE (SELECT CONCAT(column_path,',%') FROM gj_column col WHERE col.columnid=2) ORDER BY c.media_pushtime DESC ";
        // select += 'AND columnid = ' + id + ' LIMIT ' + ((page - 1)  * size) + ','+ size;
    }
    models.sequelize.query(select + ';',{
        type: models.sequelize.QueryTypes.SELECT ,
        raw: true
    }).then(function (result) {
            // console.log(result)
        var obj = {};
        console.log(result,'result')
        result.forEach(function (value) {
            console.log(!obj[value.columnid])
            if(!obj[value.columnid]){
                obj[value.columnid] = {
                    columnid :value.columnid,
                    column_title: value.column_title,
                    column_parent_id: value.column_parent_id,
                    column_url: value.column_url,
                    column_indexes: value.column_indexes,
                    column_order: value.column_order,
                    column_path: value.column_path,
                    media: []
                }
            }
            if(value.mediaid){//说明有媒资
                obj[value.columnid].media.push({
                    mediaid: value.mediaid,
                    media_type: value.media_type,
                    media_title: value.media_title,
                    media_content: value.media_content,
                    media_href: value.media_href,
                    media_pics: utils.AbsolutePath(value.media_pics),
                    media_video: utils.AbsoluteVideoPath(value.media_video),
                    media_author: value.media_author,
                    media_clickcount: value.media_clickcount,
                    media_keywords: value.media_keywords,//AbsoluteVideoPath
                    media_description: value.media_description,
                    media_pushtime: value.media_pushtime,
                    media_status: value.media_status,
                    status: value.cm_status//media与column关联表中的上架状态cm_status.
                })
            }
        });
        result = [];
        for(var key in obj){
            result.push(obj[key])
        }
        result.sort(function (a, b) {
            return a.column_order > b.column_order
        });
        return response.ApiSuccess(res, { list : result || [] });
    },function (err) {
        console.log(err);
        return response.ApiError(res, '获取数据失败');
    })
});
module.exports = router;
