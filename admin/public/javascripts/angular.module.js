/**
 * Created by Administrator on 2016/12/29 0029.
 */
//拦截器
function Interceptor($q) {
    return {
        /**
         * @param {Object} config
         * @param {Object} config.cache
         * @param {Object} config.headers
         * @param {String} config.method
         * @param {function} config.paramSerializer
         * @param {Array} config.transformRequest
         * @param {Array} config.transformResponse
         * @param {String} config.url
         */
        request: function (config) {
            return config;
        },
        /**
         * @param {Object} response
         * @param {Object} response.config
         * @param {String} response.data
         * @param {Object} response.headers
         * @param {Number} response.status
         * @param {String} response.statusText
         */
        response: function (response) {
            if(/\.html$/.test(response.config.url)){
                return response;
            }
            if (response.data.code !== 200) {
                swal({
                    type: 'error',
                    title: '失败',
                    text: response.data.message,
                    showConfirmButton: true,
                    timeout: 2000
                });
                return $q.reject();
            } else {
                return response;
            }
        },
        requestError: function (rejction) {
            swal({
                type: 'warning',
                title: '网络异常',
                text: '请查看网络连接是否正常',
                showConfirmButton: true,
                timeout: 2000
            });
            return $q.reject(rejction);
        },
        /**
         * @param {Object} response
         * @param {Object} response.config
         * @param {String} response.data
         * @param {Object} response.headers
         * @param {Number} response.status
         * @param {String} response.statusText
         */
        responseError: function (rejction) {
            swal({
                title: "服务器异常",
                type: "warning",
                text: "请查看网络连接是否正常",
                showConfirmButton: false,
                timer: 2000
            });
            return $q.reject(rejction);
        }
    }
}
function httpDefault($provide, $httpProvider) {
    $httpProvider.interceptors.push('Interceptor');
}
angular.module('cms', [])
    .factory('Interceptor', Interceptor)
    .config(httpDefault);
angular.module('cms')
    .service('staticService', function () {
        this.query = undefined;
        this.getQuery = function getQuery() {
            var search = location.search.slice(1),
                arr = search.split('&'),
                obj = {},
                len = arr.length,
                i = 0;
            for (; i < len; i++) {
                var arr1 = arr[i].split('=');
                obj[arr1[0]] = arr1[1];
            }
            this.query = obj;
        };
        this.getQuery()
    })
    .directive('qqMapLongitudeLatitude', function () {
        return {
            restrict: 'A',//属性
            scope: {
                longitude: '=',// @解析普通字符串 =解析数据 &函数
                latitude: '=',
                init: '='
            },
            controller: function ($scope, $element) {
                $scope.init = function (address) {
                    geocoder.getLocation("中国" + address);
                };
                var map = new qq.maps.Map($element[0], {
                    // 地图的中心地理坐标。
                    center: new qq.maps.LatLng(39.916527, 116.397128),
                    zoom: 15
                });
                var marker;
                if($scope.longitude && $scope.latitude){
                    //如果上次存在经纬度
                    marker = new qq.maps.Marker({
                        position: new qq.maps.LatLng($scope.longitude, $scope.latitude),
                        map: map
                    });
                }else {
                    //调用地址解析类
                    var geocoder = new qq.maps.Geocoder({
                        complete : function(result){
                            /* 设置地图的中心点 */
                            var position = result.detail.location;
                            map.setCenter(position);
                            /* 由地址解析经纬度 */
                            $scope.$apply(function () {
                                $scope.longitude = position.lng;
                                $scope.latitude = position.lat;
                            });
                            if(marker){
                                marker.setMap(null);
                            }
                            /* 添加标记 */
                            marker = new qq.maps.Marker({
                                map:map,
                                position: result.detail.location
                            });
                            /* 设置为允许拖拽 */
                            marker.setDraggable(true);
                            //设置Marker停止拖动事件
                            qq.maps.event.addListener(marker, 'dragend', function() {
                                var position = marker.getPosition();
                                $scope.$apply(function () {
                                    $scope.longitude = position.lng;
                                    $scope.latitude = position.lat;
                                });
                            });
                        }
                    });
                }
            }
        }
    })
    .filter('isInclude', function () {
        return function (id, list) {
            if (!list) {
                return false;
            }
            var len = list.length;
            if (len === 0) {
                return false
            } else {
                var i = 0;
                for (; i < len; i++) {
                    if (list[i] == id) {
                        return true
                    }
                }
                return false;
            }
        }
    })
.directive('areaBranchChecked', function () {
    return {
        restrict: 'A',//属性
        templateUrl: '/javascripts/branch_checked.html',
        scope: {
            checkedBranches: '=',// 选择的分院数组
            checkedAreas: '='// 选择的学区数组
        },
        replace: false,
        controller: function ($scope, $element, $http) {

            $scope.areas = [];//数据列表
            $scope.area_all = [];//全部学区id
            $scope.branch_all = [];//全部分院id
            $scope.areas = [];//已经选择学区列表

            $scope.area_child_id = {};//学区对应学院映射对象
            $scope.checked_area_child_id = {};//学区选择学院数据对象

            $scope.$watch('checkedBranches', function (n) {
                if(n && n.length === $scope.branch_all.length){
                    $scope.checked = true;
                }
            });

            /* 初始化数据 开始 */
            $http({
                url: '/admin/area/list',
                method: 'GET'
            }).success(function (result) {
                var list = result.result,
                    branch_all = [],
                    area_all = [],
                    area_child_id = [];
                $scope.areas = list;
                angular.forEach(list, function (v) {
                    area_all.push(v.id);
                    area_child_id[v.id] = [];
                    angular.forEach(v.children, function (w) {
                        area_child_id[v.id].push(w.id);
                        branch_all.push(w.id);
                    });
                });
                $scope.area_all = area_all;
                $scope.branch_all = branch_all;
                $scope.area_child_id = area_child_id;
                $scope.checked = false;
                if($scope.checkedBranches.length && $scope.checkedBranches.length === $scope.branch_all.length){
                    $scope.checked = true;
                }

            });

            /* 全选 数据处理逻辑 */
            $scope.checked = false;
            $scope.check_all = function () {
                if ($scope.checked) {
                    $scope.checkedAreas = angular.copy($scope.area_all);
                    $scope.checkedBranches = angular.copy($scope.branch_all);
                } else {
                    $scope.checkedAreas = [];
                    $scope.checkedBranches = [];
                }
            };
            /* 单选 数据处理逻辑 */
            $scope.check_one = function (e, id, area) {
                var checked = e.target.checked;
                if (checked) {
                    $scope.checkedBranches = _.union($scope.checkedBranches, [id]);
                    if ($scope.checkedBranches.length === $scope.branch_all.length) {
                        $scope.checkedAreas = angular.copy($scope.area_all);
                        $scope.checked = true;
                    }else{
                        var intersection = _.intersection($scope.area_child_id[area], $scope.checkedBranches);
                        if(intersection.length === $scope.area_child_id[area].length){
                            $scope.checkedAreas.push(area);
                        }
                    }
                } else {
                    _.pull($scope.checkedBranches, id);
                    _.pull($scope.checkedAreas, area);
                    $scope.checked = false;
                }
            };
            /* 单选 区域 处理逻辑 */
            $scope.check_area = function (e, id ) {
                var checked = e.target.checked;
                if (checked) {
                    $scope.checkedAreas.push(+id);
                    if ($scope.checkedAreas.length === $scope.area_all.length) {
                        $scope.checked = true;
                    }
                    $scope.checkedBranches = _.union($scope.checkedBranches, $scope.area_child_id[id])
                } else {
                    _.remove($scope.checkedAreas, function (n) {
                        return n === id;
                    });
                    _.forEach($scope.area_child_id[id] , function (v) {
                        _.pull($scope.checkedBranches , v)
                    });
                    $scope.checked = false;
                }
            }
        }
    }
});