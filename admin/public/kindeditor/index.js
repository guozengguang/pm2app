var options={
    resizeType : 1,
    urlType : 'absolute',
    autoHeightMode : false,
    height:450,
    filterMode : true,
    afterCreate : function() {
        this.loadPlugin('autoheight');
    },
    allowPreviewEmoticons : false,
    allowImageUpload : false,
    fullscreenShortcut:true,
    // newlineTag:'br',
    pasteType : 1,
    items : ['source',
        '|','undo','redo','preview','fullscreen','hr',
        '|','formatblock','forecolor','hilitecolor','bold', 'italic', 'underline','removeformat','quickformat',
        '|', 'justifyleft', 'justifycenter', 'justifyright','indent','outdent',
        '|','images']
};
var editor = new Array();
KindEditor.ready(function(K) {
    editor[0] = K.create(".setEditor",options);
    if($('.setEditor1').length>0){
        editor[1] = K.create(".setEditor1",options);
    }
});
//上传按钮--到aly
KindEditor.plugin('images', function(K) {
    var editor = this, name = 'images';
    // 点击图标时执行
    var uploader = new plupload.Uploader({ //实例化一个plupload上传对象
        runtimes:"html5,flash,silverlight,html4",
        browse_button : 'editor_upload',
        url : '/aly_upload_img',
        auto_start:true,
        filters: {
            mime_types : [ //只允许上传图片和zip文件
                { title : "Image files", extensions : "jpg,gif,png" }
            ],
            max_file_size:"500kb",
            prevent_duplicates : false //不允许选取重复文件
        },
        multi_selection:true,
        multipart:true,
        multipart_params:{},
        unique_names:true,
        resize:{
            width: 40000,
            height: 20000,
            crop: false,
            preserve_headers: true
        }
    });
    uploader.init(); //初始化
    //绑定文件添加进队列事件
    uploader.bind('FilesAdded',function(uploader,files){
        for(var i = 0, len = files.length; i<len; i++){
            var file_name = files[i].name; //文件名
        }
        uploader.start(); //开始上传
    });
    uploader.bind('BeforeUpload',function(uploader,file){
        uploader.settings.multipart_params.size = file.size;
    });

    uploader.bind('UploadComplete',function(uploader,files){
        console.log(files);
    });
    uploader.bind("FileUploaded",function(uploader,file,responseObject){
        var result=JSON.parse(responseObject.response);
        if(result.code===200){
            editor.insertHtml('<p><img style="width:100%" src="'+result.message.url+'"></p>')
        }else{
            console.log('失败')
        }
    })
    //绑定文件上传进度事件
    uploader.bind('UploadProgress',function(uploader,file){
        console.log(file);
    });
    editor.clickToolbar(name, function() {
        $("#editor_upload").click();
    });
});
KindEditor.lang({
    images : '图片'
});