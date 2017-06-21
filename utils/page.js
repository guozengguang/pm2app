module.exports={
    get_page_options:function(req){
        var pagesize = req.query.pagesize;
        var page = req.query.page;
        if (pagesize === undefined || pagesize == "") pagesize = 20;//最多显示加载20条
        if (pagesize == 0) pagesize = 100;
        if (page === undefined || page == "") page = 0;
        //var countQuery = Posts.where(where).count();//总数
        var options = {
            offset: Number((page) * pagesize),
            limit: Number(pagesize),
            pagesize: Number(pagesize),
            page:Number(page),
        };
        return options;
    },
    cms_get_page_options:function(req) {
        var pagesize = req.query.pagesize || req.body.pagesize;
        var page = req.query.page || req.body.page;
        if (page === undefined || page == "") page = 1;
        if (pagesize === undefined || pagesize == "") pagesize = 12;
        var options = {
            offset: Number((page-1) * pagesize),
            limit: Number(pagesize),
            pagesize: Number(pagesize),
            page:Number(page),
        };
        return options;
    }
}