var action = require('../actions');

exports.authorize = function (req, res, next) {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        var flag = true;
        action.permission.forEach(function (item, index) {
            if (item.path == req.path) {
                if (req.session.roles.r_permission.indexOf(item.code)<0 && req.session.roles.r_permission!=="") {
                    flag = false;
                    return;
                }
            }
        })
        if (flag) {
            req.Branch=req.session.user.user_branch
            req.Uid=req.session.user.uid
            next();
        } else {
            res.redirect('/login');
        }
    }
};

