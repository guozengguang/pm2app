const BASEURL='http://dev.geju.com';
// const BASEURL='http://html.geju.com';
// const BASEURL='http://127.0.0.1:8888';
const ROUTERURL=BASEURL+'/pay/index';

 /* getQueryString */
function getQueryString(name) {
     var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
     var r = window.location.search.substr(1).match(reg);
     if (r != null) {
         return unescape(r[2]);
     }
     return null;
}
/* jshint unused:false*/
function init($,rawCitiesData) {
    "use strict";
    var format = function(data) {
        var result = [];
        for(var i=0;i<data.length;i++) {
            var d = data[i];
            if(d.name === "请选择") continue;
            result.push(d.name);
        }
        if(result.length) return result;
        return [""];
    };

    var formatId = function(data) {
        var result = [];
        for(var i=0;i<data.length;i++) {
            var d = data[i];
            if(d.name === "请选择") continue;
            result.push(d.id);
        }
        if(result.length) return result;
        return [""];
    };

    var sub = function(data) {
        if(!data.sub) return [""];
        return format(data.sub);
    };

    var subId = function(data){
        if (!data.sub) return [""];
        return formatId(data.sub);
    };

    var getCities = function(d) {
        for(var i=0;i< raw.length;i++) {
            if(raw[i].name === d) return sub(raw[i]);
        }
        return [""];
    };

    var getCitiesId = function(d) {
        for(var i=0;i< raw.length;i++) {
            if(raw[i].name === d) return subId(raw[i]);
        }
        return [""];
    };

    var getDistricts = function(p, c) {
        for(var i=0;i< raw.length;i++) {
            if(raw[i].name === p) {
                for(var j=0;j< raw[i].sub.length;j++) {
                    if(raw[i].sub[j].name === c) {
                        return sub(raw[i].sub[j]);
                    }
                }
            }
        }
        return [""];
    };

    var raw = rawCitiesData;
    var rawId = rawCitiesData;
    var provincesNames = raw.map(function(d) {
        return d.name;
    });
    var provincesIds = raw.map(function(d) {
        return d.id;
    });
    var initCities = sub(raw[0]);
    var initCitiesIds = subId(raw[0]);
    //var initDistricts = [""];

    var currentProvince = provincesNames[0];
    var currentCity = initCities[0];
    //var currentDistrict = initDistricts[0];

    var t;
    var defaults = {

        cssClass: "city-picker",
        rotateEffect: false,  //为了性能

        onChange: function (picker, values, displayValues) {
            var newProvince = picker.cols[0].displayValue;
            var newCity;
            if(newProvince !== currentProvince) {
                // 如果Province变化，节流以提高reRender性能
                clearTimeout(t);

                t = setTimeout(function(){
                    var newCities = getCities(newProvince);
                    var newCitiesId = getCitiesId(newProvince);
                    newCity = newCities[0];
                    //var newDistricts = getDistricts(newProvince, newCity);
                    picker.cols[1].replaceValues(newCitiesId, newCities);
                    //picker.cols[2].replaceValues(newDistricts);
                    currentProvince = newProvince;
                    currentCity = newCity;
                    picker.updateValue();
                }, 200);
                return;
            }
            newCity = picker.cols[1].value;
            /*if(newCity !== currentCity) {
             picker.cols[2].replaceValues(getDistricts(newProvince, newCity));
             currentCity = newCity;
             picker.updateValue();
             }*/
        },

        cols: [
            {
                textAlign: 'center',
                values: provincesIds,
                displayValues: provincesNames,
                cssClass: "col-province"
            },
            {
                textAlign: 'center',
                values: initCitiesIds,
                displayValues: initCities,
                cssClass: "col-city"
            }

            //{
            //    textAlign: 'center',
            //    values: initDistricts,
            //    cssClass: "col-district"
            //}
        ],
        formatValue: function (picker, value, displayValue){
            $(picker.params.province).val(value[0]);
            $(picker.params.place).val(value[1]);
            return displayValue.join(' ');
        }
    };

    $.fn.cityPicker = function(params) {
        return this.each(function() {
            if(!this) return;
            var p = $.extend(defaults, params);
            var value;
            var val;
            //计算value
            if (p.value) {
                $(this).val(p.value.join(' '));
                val = $(this).val();
                if (val && val.split(' ').length > 1)
                    value = val.split(' ');
            } else {
                //待改进

                val = $(this).val();
                if (val && val.split(' ').length > 1)
                    value = val.split(' ');

                var val1 = $(this).siblings("#province").val();
                var val2 = $(this).siblings("#place").val();
                if(val1+val2 > 1)
                    p.value = [val1, val2];
            }

            if (p.value) {
                //p.value = val.split(" ");
                if(p.value[0]) {
                    currentProvince = value[0];
                    p.cols[1].values = getCitiesId(value[0]);
                    p.cols[1].displayValues = getCities(value[0]);
                }
                if(p.value[1]) {
                    currentCity = value[1];
                    //p.cols[2].values = getDistricts(p.value[0], p.value[1]);
                    //} else {
                    //p.cols[2].values = getDistricts(p.value[0], p.cols[1].values[0]);
                }
                //!p.value[2] && (p.value[2] = '');
                //currentDistrict = p.value[2];
            }
            $(this).picker(p);
        });
    };

};
