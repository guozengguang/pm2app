var config = {
	//cms: "http://qhd.cms.joygo.com",
	//yf: "http://user.joygo.com/qhd",
	//domain: "http://user.joygo.com/qhd/user/headimg?img="
	ver: 'v1.2/',
	cms: "http://fuzhoutest.cms.joygo-dev.com",
	yf: "http://user.test.joygo-dev.com/test",
	domain: "http://user.test.joygo-dev.com/dev/user/headimg?img="
};

$(function() {
	if (typeof(onCMSLoad) == "function") {
		$("body").append('<iframe id="cms" src="' + config.cms + '/cms.html" width="0" height="0" style="display: none;" onload="onCMSLoad()"></iframe>')
	}
	if (typeof(onYFLoad) == "function") {
		$("body").append('<iframe id="yf" src="' + config.yf + '/yf.html" width="0" height="0" style="display: none;" onload="onYFLoad()"></iframe>');
	}
});

var CMSUtils = {
	get_columns: function(pid) {
		var data = {
			event: "get_columns",
			url: config.ver + "api/get_columns?pid=" + pid,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_list: function(cid, page, pagesize, type) {
		var data = {
			event: "get_list",
			url: config.ver + "api/get_medias?cid=" + cid + "&page=" + page + "&pagesize=" + pagesize + "&type=" + type,
			param: "",
			mark: cid,
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_detail: function(cid, mid, mpno) {
		var data = {
			event: "get_detail",
			url: config.ver + "api/get_detail?cid=" + cid + "&mid=" + mid + "&mpno=" + mpno,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
    },
    get_broadcasts_detail: function (mid) {
        var data = {
            event: "get_broadcasts_detail",
            url: config.ver + "api/get_broadcasts_detail?_id=" + mid,
            param: "",
            mark: "",
            callBackEvent: ""
        };
        document.getElementById("cms").contentWindow.postMessage(data, "*");
    },
	get_comments: function(mid, mpno, page, pageSize) {
		var data = {
			event: "get_comments",
			url: config.ver + "api/get_comments?mid=" + mid + "&type=0&mpno=" + mpno + "&page=" + page + "&pagesize=" + pageSize,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	set_comments: function(auth, mid, type, nickname, mpno, content, head) {
		var data = {
			action: "post",
			event: "set_comments",
			url: config.ver + "api/set_comments",
			cookie: {
				AUTH: auth
			},
			param: {
				mid: mid,
				type: type,
				nickname: nickname,
				mpno: mpno,
				content: content,
				head: head
			},
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_scores: function(mid) {
		var data = {
			event: "get_scores",
			url: config.ver + "api/get_scores?mid=" + mid,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	set_scores: function(mid, mpno, title, num) {
		var data = {
			action: "post",
			event: "set_scores",
			url: config.ver + "api/set_scores",
			param: {
				mid: mid,
				mpno: mpno,
				title: title,
				num: num
			},
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_kpis: function(title, sort, year, month, modelunit, type, advanced, pageIndex, pageSize, flag) {
		var kpis_param = "";
		if (title != "") kpis_param += "title=" + title;
		if (sort != -1) kpis_param += "&sort=" + sort;
		if (year != -1) kpis_param += "&year=" + year;
		if (month != -1) kpis_param += "&month=" + month;
		if (modelunit != -1) kpis_param += "&modelunit=" + modelunit;
		if (type != -1) kpis_param += "&type=" + type;
		if (advanced != -1) kpis_param += "&advanced=" + advanced;
		if (pageIndex != -1) kpis_param += "&page=" + pageIndex;
		if (pageSize != -1) kpis_param += "&pageSize=" + pageSize;
		kpis_param += "&flag=" + flag;
		console.log(kpis_param);
		var data = {
			event: "get_kpis",
			url: config.ver + "api/get_kpis?" + kpis_param,
			param: "",
			mark: modelunit + "/" + type + "/" + advanced + "/" + pageIndex + "/" + pageSize,
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	set_posts_assist: function(auth, mid, mpno) {
		var data = {
			action: "post",
			event: "set_posts_assist",
			url: config.ver + "api/set_posts_assist",
			cookie: {
				AUTH: auth
			},
			param: {
				mid: mid,
				mpno: mpno
			},
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	set_favorites: function(auth, mid, mpno) {
		var data = {
			action: "post",
			event: "set_favorites",
			url: config.ver + "api/set_favorites",
			cookie: {
				AUTH: auth
			},
			param: {
				mid: mid,
				mpno: mpno
			},
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	set_activitys: function(auth, mid, title, fullname, sex, card, mpno) {
		var data = {
			action: "post",
			event: "set_activitys",
			url: config.ver + "api/set_activitys",
			cookie: {
				AUTH: auth
			},
			param: {
				mid: mid,
				title: title,
				fullname: fullname,
				sex: sex,
				card: card,
				mpno: mpno
			},
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_dishes: function(mid, page, pageSize) {
		var data = {
			event: "get_dishes",
			url: config.ver + "api/get_dishes?mid=" + mid + "&page=" + page + "&pagesize=" + pageSize,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	set_feedback: function(auth, mpno, type, content, contact) {
		var data = {
			event: "set_feedback",
			action: "post",
			url: config.ver + "api/set_feedback",
			cookie: {
				AUTH: auth
			},
			param: {
				mpno: mpno,
				feedbacktype: type,
				content: content,
				contact: contact
			},
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_organ_yellow: function(pid) {
		var url = config.ver + "api/get_organ_yellow";
		if (Boolean(pid)) {
			url += "?pid=" + pid;
		}
		var data = {
			event: "get_organ_yellow",
			url: url,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_houses_config: function() { //价格区间，房型接口
		var url = config.ver + "api/get_houses_config";
		var data = {
			event: "get_houses_config",
			url: url,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_houses: function(mpno, provinceCode, cityCode, streetCode, priceRegions, room, title, page, pageSize) { //获取房源信息接口
		var url = config.ver + "api/get_houses";
		var houseParams = "";
		if (mpno != null) houseParams += "&mpno=" + mpno;
		if (provinceCode != -1) houseParams += "&provicecode=" + provinceCode;
		if (cityCode != -1) houseParams += "&citycode=" + cityCode;
		if (streetCode != -1) houseParams += "&streetcode=" + streetCode;
		if (priceRegions != "") houseParams += "&priceregions=" + priceRegions;
		if (room != "") houseParams += "&room=" + room;
		if (title != "") houseParams += "&title=" + title;
		if (page != -1) houseParams += "&page=" + page;
		if (pageSize != -1) houseParams += "&pageSize=" + pageSize;
		if (houseParams != "") {
			url += "?" + houseParams;
		}
		var data = {
			event: "get_houses",
			url: url,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_areas: function(pid) { //获取区域接口
		var url = config.ver + "api/get_houses_regions";
		if (Boolean(pid)) {
			url += "?pid=" + pid;
		}
		var data = {
			event: "get_areas",
			url: url,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	set_houses: function(auth, serialParam) {
		var data = {
			event: "set_houses",
			action: "post",
			url: config.ver + "api/set_houses",
			cookie: {
				AUTH: auth
			},
			param: serialParam,
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	set_regs: function(auth, param) {
		var data = {
			event: "set_regs",
			action: "post",
			url: config.ver + "api/set_regs",
			cookie: {
				AUTH: auth
			},
			param: param,
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_votes: function(mpno, vid) {
		var data = {
			event: "get_votes",
			url: config.ver + "api/get_votes?mpno=" + mpno + "&vid=" + vid,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	set_votes: function(auth, mpno, vid, rid) {
		var data = {
			event: "set_votes",
			action: "post",
			url: config.ver + "api/set_votes",
			cookie: {
				AUTH: auth
			},
			param: "mpno=" + mpno + "&vid=" + vid + "&rid=" + rid,
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_myuploads_detail: function(mid) {
		var data = {
			event: "get_myuploads_detail",
			url: config.ver + "api/get_myuploads_detail?mid=" + mid,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_anchors: function() {
		var data = {
			event: "get_anchors",
			url: config.ver + "api/get_anchors",
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_anchors_detail: function(id) {
		var data = {
			event: "get_anchors_detail",
			url: config.ver + "api/get_anchors_detail?_id=" + id,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_anchors_dynamics: function(anchorsid, page, pagesize) {
		var paramArray = new Array();
		if (Boolean(anchorsid)) paramArray.push("anchorsid=" + anchorsid);
		if (Boolean(page)) paramArray.push("page=" + page);
		if (Boolean(pagesize)) paramArray.push("pagesize=" + pagesize);
		var data = {
			event: "get_anchors_dynamics",
			url: config.ver + "api/get_anchors_dynamics?" + paramArray.join("&"),
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_anchors_dynamics_detail: function(id, mpno) {
		var paramArray = new Array();
		if (Boolean(id)) paramArray.push("_id=" + id);
		if (Boolean(mpno)) paramArray.push("mpno=" + mpno);
		var data = {
			event: "get_anchors_dynamics_detail",
			url: config.ver + "api/get_anchors_dynamics_detail?" + paramArray.join("&"),
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_questions: function(publishmpno, answermpno, isanswered, sort, page, pagesize) {
		var paramArray = new Array();
		if (Boolean(publishmpno)) paramArray.push("publishmpno=" + publishmpno);
		if (Boolean(answermpno)) paramArray.push("answermpno=" + answermpno);
		if (Boolean(isanswered)) paramArray.push("isanswered=" + isanswered);
		if (Boolean(sort)) paramArray.push("sort=" + sort);
		if (Boolean(page)) paramArray.push("page=" + page);
		if (Boolean(pagesize)) paramArray.push("pagesize=" + pagesize);
		var data = {
			event: "get_questions",
			url: config.ver + "api/get_questions?" + paramArray.join("&"),
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_myanswerquestions: function(answermpno, page, pagesize) {
		var url = config.ver + "api/get_myanswerquestions?answermpno=" + answermpno;
		url = Boolean(page) ? url + "&page=" + page : url;
		url = Boolean(pagesize) ? url + "&pagesize=" + pagesize : url;
		var data = {
			event: "get_myanswerquestions",
			url: url,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_answer: function(answermpno, questionid, page, pagesize) {
		var url = config.ver + "api/get_answers?answermpno=" + answermpno + "&questionid=" + questionid;
		url = Boolean(page) ? url + "&page=" + page : url;
		url = Boolean(pagesize) ? url + "&pagesize=" + pagesize : url;
		var data = {
			event: "get_answer",
			url: url,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_questions_detail: function(questionid) {
		var data = {
			event: "get_questions_detail",
			url: config.ver + "api/get_questions_detail?questionid=" + questionid,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	set_activitys_cancel: function(auth, mpno, mid) {
		var data = {
			action: "post",
			event: "set_activitys_cancel",
			url: config.ver + "api/set_activitys_cancel",
			cookie: {
				AUTH: auth
			},
			param: {
				mid: mid,
				mpno: mpno
			},
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_activitys_status: function(mpno, mid) {
		var data = {
			event: "get_activitys_status",
			url: config.ver + "api/get_activitys_status?mid=" + mid + "&mpno=" + mpno,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	set_anchors_text: function(auth, key, anchorid, content) {
		var data = {
			action: "post",
			event: "set_anchors_text",
			url: config.ver + "api/set_anchors_text",
			cookie: {
				AUTH: auth
			},
			param: {
				key: key,
				anchorid: anchorid,
				content: content
			},
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_ad: function(adposition) {
		var data = {
			event: "get_ad",
			url: config.ver + "api/get_ad?adposition=" + adposition,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_feedback: function(mpno) {
		var data = {
			event: "get_feedback",
			url: config.ver + "api/get_feedback?mpno=" + mpno,
			param: "",
			mark: "",
			callBackEvent: ""
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_lives: function(columntype, columnname, livetype, mpno, page, pagesize, mark) {
		var paramArray = new Array();
		if (Boolean(columntype)) paramArray.push('columntype=' + columntype);
		if (Boolean(columnname)) paramArray.push('columnname=' + columnname);
		if (Boolean(livetype)) paramArray.push('livetype=' + livetype);
		if (Boolean(mpno)) paramArray.push('mpno=' + mpno);
		if (Boolean(page)) paramArray.push('page=' + page);
		if (Boolean(pagesize)) paramArray.push('pagesize=' + pagesize);
		var data = {
			event: 'get_lives',
			url: config.ver + 'api/lives/get_lives?' + paramArray.join('&'),
			param: '',
			mark: mark,
			callBackEvent: ''
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_lives_detail: function(id) {
		var data = {
			event: 'get_lives_detail',
			url: config.ver + 'api/lives/get_detail?_id=' + id,
			param: '',
			mark: '',
			callBackEvent: ''
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_lives_histories: function(mpno, page, pagesize) {
		var data = {
			event: 'get_lives_histories',
			url: config.ver + 'api/lives/get_lives_histories?mpno=' + mpno + "&page=" + page + "&pagesize=" + pagesize,
			param: '',
			mark: '',
			callBackEvent: ''
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
	},
	get_posts_albums: function(mid, mpno, name, sort, page, pageSize) {
		var data = {
			event: 'get_posts_albums',
			url: config.ver + 'api/get_posts_albums?mid=' + mid + '&mpno=' + mpno + '&name=' + name + '&sort=' + sort + '&page=' + page + '&pagesize=' + pageSize,
			param: '',
			mark: '',
			callBackEvent: ''
		};
		document.getElementById("cms").contentWindow.postMessage(data, "*");
    },
    set_awards: function (mpno, no, result) {
        var data = {
            action: "post",
            event: "set_awards",
            url: config.ver + "api/set_awards",
            param: {
                mpno: mpno,
                no: no,
                result: result
            },
            mark: "",
            callBackEvent: ""
        };
        document.getElementById("cms").contentWindow.postMessage(data, "*");
    }
};

var YFUtils = {
	get_coin_total: function(auth) {
		var data = {
			action: "post",
			event: "get_coin_total",
			url: "coin/total",
			cookie: {
				AUTH: auth
			}
		};
		document.getElementById("yf").contentWindow.postMessage(data, "*");
	},
	get_coin_list: function(auth, pageIndex, pageSize) {
		var data = {
			action: "post",
			event: "get_coin_list",
			url: "coin/mylist",
			cookie: {
				AUTH: auth
			},
			param: {
				pageindex: pageIndex,
				pagesize: pageSize
			}
		};
		document.getElementById("yf").contentWindow.postMessage(data, "*");
	},
	get_discount_list: function(auth, kind, pageIndex, pageSize) {
		var data = {
			action: "post",
			event: "get_discount_list",
			url: "discount/mylist",
			cookie: {
				AUTH: auth
			},
			param: {
				kind: kind,
				pageindex: pageIndex,
				pagesize: pageSize
			}
		};
		document.getElementById("yf").contentWindow.postMessage(data, "*");
	},
	consume: function(auth, no) {
		var data = {
			action: "post",
			event: "consume",
			url: "discount/consume",
			cookie: {
				AUTH: auth
			},
			param: {
				discountno: no
			}
		};
		document.getElementById("yf").contentWindow.postMessage(data, "*");
	},
	cash: function(auth, no) {
		var data = {
			action: "post",
			event: "cash",
			url: "user/setval",
			cookie: {
				AUTH: auth
			},
			param: {
				key:'alipayid',
				value:no
			}
		};
		document.getElementById("yf").contentWindow.postMessage(data, "*");
	},
	get_user_info: function(auth) {
		var data = {
			action: "post",
			event: "get_user_info",
			url: "user/info/",
			cookie: {
				AUTH: auth
			}
		};
		document.getElementById("yf").contentWindow.postMessage(data, "*");
	}
};