/**
 * Created by Administrator on 2016/12/15 0015.
 */
/**
 * @function transform_No 转换数字为中文
 * @param {number} number 数字 不大于1万亿
 * @returns {string} result 转换为中文的字符串
 * */
function transform_No(number) {
    if(number > 999999999999){return '数字过大';}
    var source = ['零','一','二','三','四','五','六','七','八','九'],
        position = ['十','百','千','万','亿'],
        number_arr = number.toString().split('').reverse(),
        result = [];
    for(var i = 0,len=number_arr.length;i<len;i++){
        if((i - 1) && (i - 1)%7===0){
            result.unshift(position[4]);
        }else {
            result.unshift(position[(i - 1)%4]);
        }
        result.unshift(source[+number_arr[i]]);
    }
    return result.join('')
        .replace(/零[十百千]/g,'零')
        .replace(/零{2,}/g,'零')
        .replace(/零万/g,'万')
        .replace(/零亿/g,'亿')
        .replace('亿万','亿')
}
/**
 * @function dateInfo 格式化时间
 * @param {string} 格式
 * @returns {string} result 输出
 * */
!function () {
    var a = function () {
        var b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r = arguments.length, s = Number(this);
        return 1e12 > s && (s = 1e3 * s), b = new Date(s), a.ten = function (a) {
            return a > 9 ? a : "0" + a
        }, c = b.getFullYear(), d = a.ten(b.getMonth() + 1), 0 === r ? (e = new Date, f = s - e.getTime() > 0 ? "后" : "前", (g = Math.abs(c - e.getFullYear())) ? g + "年" + f : (h = Math.abs(d - e.getMonth() - 1)) ? h + "月" + f : (i = Math.abs(s - (new Date).getTime()), (j = Math.floor(i / 864e5)) ? j + "天" + f : (k = Math.floor(i / 36e5)) ? k + "小时" + f : (l = Math.floor(i / 6e4)) ? l + "分钟" + f : (m = Math.floor(i / 1e3), m ? m + "秒" + f : "刚刚"))) : (a.s = function (a) {
            return a.replace("Y", c).replace("M", d).replace("D", n).replace("h", o).replace("m", p).replace("s", q)
        }, n = a.ten(b.getDate()), o = a.ten(b.getHours()), p = a.ten(b.getMinutes()), q = a.ten(b.getSeconds()), a.s(arguments[0]))
    };
    Number.prototype.dateInfo = a, String.prototype.dateInfo = a
}();

function success_toaster(message) {
    swal({
        title: '成功',
        text: message,
        timer: 1000,
        type: 'success',
        showConfirmButton: false
    });
}

function error_toaster(title, message) {
    swal({
        title: title,
        text: message,
        timer: 1000,
        type: 'error',
        showConfirmButton: false
    });
}