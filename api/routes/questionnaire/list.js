/**
 * Created by Administrator on 2016/12/6 0006.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var co = require('co');
var _ = require('lodash');
/**
 * @function removal -- 1：N数据重构
 * @param {object[]} list 元数据
 * */
function removal(list) {
    if (list.length === 0) {
        return [];
    }
    var obj = {};
    var i = 0, length = list.length;
    for (; i < length; i++) {
        var data = list[i];
        var m1 = obj[data._id];
        if (!m1) {
            m1 = obj[data._id] = {
                primary_id: data._id,
                title: data._desc
            }
        }
        var item = {
            "id": data.item_id,
            "name": data.item_name,
            "count": data.item_count,
            "created": data.item_created
        };
        if (!m1.item) {
            m1.item = [item]
        } else {
            m1.item.push(item)
        }
    }
    return {
        primary_id: list[0].primary_id,
        title: list[0].title,
        children: _.values(obj) || []
    };
}
router.get('/', function (req, res) {
    var id = req.query.id;//id
    if (!id) {
        return response.ApiError(res, {}, '参数错误');
    }
    models.sequelize.query(
        'SELECT \
            `primary`.`id` as `primary_id`, \
            `primary`.`name` as `title`, \
            `primary_f`.`id` as `_id`, \
            `primary_f`.`name` as `_desc`, \
            `content`.`id` as `item_id`, \
            `content`.`describe` as `item_name`, \
            `content`.`vote_count` as `item_count`, \
            `content`.`createdAt` as `item_created` \
        FROM `gj_questionnaire_primary` AS `primary` \
        INNER JOIN `gj_questionnaire_primary` AS `primary_f` ON `primary`.id = primary_f.parent_id \
        LEFT JOIN gj_questionnaire_content AS `content` ON `primary_f`.`id` = `content`.parent_id \
        WHERE `primary`.`deletedAt` IS NULL \
        AND `primary`.`id` = ' + id + ' \
        AND `content`.`deletedAt` IS NULL \
    AND `content`.`state` = 1 \
    AND `content`.`from` = 1 \
    ORDER BY `primary`.`hierarchy`, `primary`.`createdAt` ,`content`.`from`, `content`.`createdAt`;', {
            type: models.sequelize.QueryTypes.SELECT,
            nest: true
        }).then(function (item) {
        item = removal(item);
        // item = appendChild(item, 'primary_id', 'parent_id', 'hierarchy', 1);
        return response.ApiSuccess(res, [item], '获取成功');
    }, function (err) {
        console.log(err);
        return response.ApiError(res, err, '获取失败');
    });
});
module.exports = router;