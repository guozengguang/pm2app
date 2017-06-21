/**
 * Created by Administrator on 2016/10/8 0008.
 */
var schedule = require("node-schedule");
var rule = new schedule.RecurrenceRule();


//rule.second = [0, 20, 40];
rule.second = 0;
var umeng = require('./umeng');
var j = schedule.scheduleJob(rule, function () {
    umeng.auto();
});