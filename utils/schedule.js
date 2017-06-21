/**
 * 定时任务
 * Created by trlgml on 2017/4/6.
 */

/**
 * https://github.com/node-schedule/node-schedule
 * 模块说明
 * '*'表示通配符，匹配任意，当秒是'*'时，表示任意秒数都触发，其它类推
 * 每分钟的第30秒触发： '30 * * * * *'
 * 每小时的1分30秒触发 ：'30 1 * * * *'
 * 每天的凌晨1点1分30秒触发 ：'30 1 1 * * *'
 * 每月的1日1点1分30秒触发 ：'30 1 1 1 * *'
 * 2016年的1月1日1点1分30秒触发 ：'30 1 1 1 2016 *'
 * 每周1的1点1分30秒触发 ：'30 1 1 * * 1'
 * 上面的传入参数占位符中还可以传入范围
 * 每分钟的1-10秒都会触发 ：'1-10 * * * * *'
 */
var schedule = require('node-schedule');
var s={};
/**
 * Cron风格定时器
 * @param time 触发时间 触发规则看模块说明 '30 * * * * *'
 * @param cb 触发后执行的函数
 */
s.scheduleCronstyle=(time,cb)=>{
    schedule.scheduleJob(time, cb);
}
/**
 * 递归规则定时器
 * @param opt 触发时间 默认每分钟触发一次
 * @param opt.dayOfWeek   周
 * @param opt.year    年
 * @param opt.date    天
 * @param opt.month   月
 * @param opt.minute  分钟
 * @param opt.hour    小时
 * @param opt.second  秒
 * @param cb 触发后执行的函数
 */
s.scheduleRecurrenceRule=(opt,cb)=>{
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = opt.dayOfWeek?opt.dayOfWeek:null;
    rule.year = opt.year?opt.year:null;
    rule.date = opt.date?opt.date:null;
    rule.month = opt.month?opt.month:null;
    rule.hour = opt.hour?opt.hour:null;
    rule.minute = opt.minute?opt.minute:null;
    rule.second = opt.second?opt.second:0;
    schedule.scheduleJob(rule, cb);
}
/**
 * 对象文本语法定时器
 * @param opt 触发时间 默认每分钟触发一次
 * @param opt.dayOfWeek   周
 * @param opt.year    年
 * @param opt.date    天
 * @param opt.month   月
 * @param opt.minute  分钟
 * @param opt.hour    小时
 * @param opt.second  秒
 * @param cb
 */
s.scheduleObjectLiteralSyntax=(opt,cb)=>{
    if(JSON.stringify(opt) == "{}"){
        opt.second=0
    }
    schedule.scheduleJob(opt, cb);

}
module.exports=s;