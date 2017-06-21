    //退出系统
    function quit() {
        $.ajax({
            url: 'http://api.geju.com/business/login/quit',
            dataType: "json",
            async: true,
            data: "",
            type: "POST",
            success: function (res) {
                if (res.code == '200') {
                    //清空相关的cookie
                    //当前登录手机号和用户名
                    $.cookie("currentUserPhone", "", {expires: 7});
                    $.cookie("currentUserName", "", {expires: 7});

                    //确定是否已经登录
                    $.cookie("isLogin", "false", {expires: 7});

                    window.location.href = "./login.html";
                } else {
                    alert(res.message);
                }
            }
        });
    }