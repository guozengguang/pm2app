/**
 * Created by Geju on 2017/4/18.
 * sql拼接 也可使用框架自带方式
 */

//如：var str = new StringBuilder(',')； 则在ToString时，将使用,号作为分隔符连接字符串
// var str = new StringBuilder('a','b','c',','); 则在ToString时，将输出 'a,b,c'
function StringBuilder(){
    this._buffers = [];
    this._length=0;
    this._splitChar = arguments.length>0 ? arguments[arguments.length-1] : '';

    if(arguments.length>0){
        for(var i=0,iLen=arguments.length-1;i<iLen;i++)
        {
            this.Append(arguments[i]);
        }
    }
}

//向对象中添加字符串
//参数：一个字符串值
StringBuilder.prototype.Append=function(str){
    this._length += str.length;
    this._buffers[this._buffers.length] = str;
}
StringBuilder.prototype.Add = StringBuilder.prototype.append;

//向对象附加格式化的字符串
//参数：参数一是预格式化的字符串，如：'{0} {1} {2}'
//格式参数可以是数组，或对应长度的arguments,
//参见示例
StringBuilder.prototype.AppendFormat=function(){
     if(arguments.length>1){
        var TString=arguments[0];
        if(arguments[1] instanceof Array){
            for(var i=0,iLen=arguments[1].length;i<iLen;i++){
                var jIndex=i;
                var re=eval("/\\{"+jIndex+"\\}/g;");
                TString= TString.replace(re,arguments[1][i]);
            }
        }
        else{
            for(var i=1,iLen=arguments.length;i<iLen;i++){
                var jIndex=i-1;
                var re=eval("/\\{"+jIndex+"\\}/g;");
                TString= TString.replace(re,arguments[i]);
            }
        }
        this.Append(TString);
     }
     else if(arguments.length==1){
        this.Append(arguments[0]);
     }
}

//字符串长度（相当于ToString()后输出的字符串长度
StringBuilder.prototype.Length=function(){
    if(this._splitChar.length>0 && (!this.IsEmpty())){
        return  this._length + ( this._splitChar.length * ( this._buffers.length-1 ) ) ;
    }
    else {
        return this._length;
    }
}
//字符串是否为空
StringBuilder.prototype.IsEmpty=function(){
    return this._buffers.length <= 0;
}
//清空
StringBuilder.prototype.Clear = function(){
    this._buffers = [];
    this._length=0;
}
//输出
//参数：可以指定一个字符串（或单个字符），作为字符串拼接的分隔符
StringBuilder.prototype.ToString = function(){
    if(arguments.length==1){
        return this._buffers.join(arguments[1]);
    }
    else{
        return this._buffers.join(this._splitChar);
    }
}
module.exports = StringBuilder;