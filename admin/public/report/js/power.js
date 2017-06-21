var thief = {
    accuracy:undefined,
    latitude:undefined,
    deviceMessage:navigator.appVersion,
    getPostition:function(){
        var accuracy = 0,latitude = 0;//Î³¶È
        navigator.geolocation.getCurrentPosition(function(position){
            thief.accuracy = position.coords.accuracy;
            thief.latitude = position.coords.latitude;
            accuracy = position.coords.accuracy;
            latitude = position.coords.latitude;
        });
        return accuracy +','+latitude;
    },
    width:screen.availWidth,
    height:screen.availHeight
};
var promptingFrame = {
    div:null,
    run:function(content,id){
        if(this.div){
            this.div.innerHTML = content;
            this.div.style.marginLeft = '-'+(content.length/2)+'em';
            this.div.style.display = 'block';
            this.timeOut();
        }else{
            this.createHTML(content,id);
        }
    },
    createHTML:function(content,id){
        var div = document.createElement('div');
        div.innerHTML = content;
        div.id = id||'promptingFrame';
        document.body.appendChild(div);
        this.createStyle(content.length,id);
    },
    createStyle:function(length,id){
        id = id || 'promptingFrame';
        document.head.innerHTML += '<'+'style>#'+id+'{z-index: 20;padding:5px;border-radius:5px;background-color: #D43e3e;box-shadow: 0 0 5px #D43e3e;color: white;opacity: 0.6;position: fixed;top: 50%;left: 50%;margin-top: -1em;}</'+'style>';
        this.div = document.getElementById(id);
        this.div.style.marginLeft = '-'+(length/2)+'em';
        this.timeOut();
    },
    timeOut:function(){
        var that = this;
        setTimeout(function(){
            that.div.style.display = 'none';
        },2000);
    }
};