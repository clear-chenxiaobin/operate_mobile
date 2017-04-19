'use strict';

(function() {
    var app = angular.module('app.controllers', [])

    .controller('indexController', ['$scope',
        function($scope) {
            var self = this;
            self.init = function() {
                this.maskUrl = '';
            }
        }
    ])

    .controller('loginController', ['$scope', '$http', '$state', '$filter', '$q', '$sessionStorage', 'md5', 'util',
        function($scope, $http, $state, $filter, $q, $sessionStorage, md5, util) {
            var self = this;
            self.init = function() {

            }

            self.login = function () {
                self.loading = true;

                var data = JSON.stringify({
                    username: self.userName,
                    password: md5.createHash(self.password)
                })
                $http({
                    method: 'POST',
                    url: util.getApiUrl('v1/logon', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var msg = response.data;
                    if (msg.rescode == '200') {
                        util.setParams('userName', self.userName);
                        util.setParams('token', msg.token);
                        self.getProject();
                    }
                    else {
                        alert(msg.rescode + ' ' + msg.errInfo);
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                }).finally(function(value) {
                    self.loading = false;
                });
            }

            /**
             * 获取项目列表
             * @returns {promise|((target?:any)=>JQueryPromise<T>)|jQuery.promise|((type?:string, target?:Object)=>JQueryPromise<any>)|IPromise<T>|*}
             */
            self.getProject = function () {
                var deferred = $q.defer();

                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getCategoryProjectNameList',
                })
                self.loading = true;

                $http({
                    method: 'POST',
                    url: util.getApiUrl('v1/project', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        self.proIds = [];
                        $sessionStorage.revenueProjects = data.revenueProjects;
                        $sessionStorage.nonRevenueProjects = data.nonRevenueProjects;
                        data.revenueProjects.forEach(function (el, idx) {
                            self.proIds.push(el.ProjectName);
                            el.active = true;
                        })

                        data.nonRevenueProjects.forEach(function (el) {
                            self.proIds.push(el.ProjectName);
                            el.active = true;
                        })

                        util.setProjectIds(self.proIds)

                        self.getEditLangs();
                        deferred.resolve();
                    } else if (data.rescode == '401') {
                        $state.reload();
                    } else {
                        alert(data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function (value) {
                    self.loading = false;
                });

                return deferred.promise;
            }

            //
            self.getEditLangs = function() {
                $http({
                    method: 'GET',
                    url: util.getApiUrl('', 'editLangs.json', 'local')
                }).then(function successCallback(response) {
                    util.setParams('editLangs', response.data.editLangs);
                    $state.go('app.home');
                }, function errorCallback(response) {

                });
            }
        }
    ])


    .controller('appController', ['$http', '$scope', '$state', '$stateParams', '$q', '$filter', '$location', '$sessionStorage', 'util', 'CONFIG',
        function($http, $scope, $state, $stateParams, $q, $filter, $location, $sessionStorage, util, CONFIG) {
            var self = this;
            self.init = function() {
                $scope.loading = false;
                // 弹窗层
                self.maskUrl = '';
                self.maskParams = {};

                $scope.granularity = [
                    {id: 0, name: "日"},
                    {id: 1, name: "周"},
                    {id: 2, name: "月"},
                    {id: 3, name: "年"}
                ]

                $scope.dateRangeStart = $filter('date')(new Date() - 6*24*60*60*1000, 'yyyy-MM-dd');
                $scope.dateRangeEnd = $filter('date')(new Date(), 'yyyy-MM-dd');
                $scope.showDate = false;
                $scope.shotcut = 0;
                $scope.category = 0;


                if (util.getProjectIds() == undefined || $sessionStorage.revenueProjects == undefined) {
                    alert('项目获取失败，请重新登录');
                    $location.path("pages/login.html");
                }
            }

            // 添加 删除 弹窗，增加一个样式的class
            self.showHideMask = function(bool,url){
                // bool 为true时，弹窗出现
                if (bool) {
                    $scope.app.maskUrl = url;
                    $scope.app.showMaskClass = true;
                } else {
                    $scope.app.maskUrl = '';
                    $scope.app.showMaskClass = false;
                }
            }

            self.openProject = function () {
                $scope.app.maskParams = {};
                $scope.app.showHideMask(true,'pages/selectProject.html');
            }

            $scope.$on("loading", function (event, msg) {
                $scope.loading = msg;
            })
        }
    ])

    //选择项目
    .controller('selectProjectController', ['$scope', '$state', '$stateParams', '$sessionStorage', 'util', 'CONFIG',
        function($scope, $state, $stateParams, $sessionStorage, util, CONFIG) {
            var self = this;
            self.init = function() {
                self.oneAtATime = true;
                self.proIds = util.clone(util.getProjectIds());
                self.reProList = util.clone($sessionStorage.revenueProjects);
                self.noProList = util.clone($sessionStorage.nonRevenueProjects);
            }

            self.ok = function () {
                if (self.proIds.length == 0) {
                    alert('至少选择一个项目，请选择一个项目');
                    return false;
                }
                $sessionStorage.revenueProjects = util.clone(self.reProList);
                $sessionStorage.nonRevenueProjects = util.clone(self.noProList);

                util.setProjectIds(self.proIds);

                $scope.app.showHideMask(false);
                $state.reload();
            }

            self.cancel = function() {
                $scope.app.showHideMask(false);
            }

            /**
             * 选择项目
             * @param pid
             * @param active
             */
            self.itemSelected = function (pid, active) {
                if (!active) {
                    self.proIds.push(pid);
                } else {
                    self.proIds.forEach(function (el, index) {
                        if (el == pid) {
                            self.proIds.splice(index, 1);
                        }
                    })
                }
            };

            /**
             * 付费项目全选
             */
            self.reCheckALL = function () {
                self.proIds = [];
                self.reProList.forEach(function (el) {
                    el.active = true;
                    self.proIds.push(el.ProjectName);
                })

                self.noProList.forEach(function (el) {
                    if (el.active == true) {
                        self.proIds.push(el.ProjectName);
                    }
                })
            }
            /**
             * 付费项目全不选
             */
            self.reUnCheckALL = function () {
                self.proIds = [];
                self.reProList.forEach(function (el) {
                    el.active = false;
                })

                self.noProList.forEach(function (el) {
                    if (el.active == true) {
                        self.proIds.push(el.ProjectName);
                    }
                })
            }
            /**
             * 非付费项目全选
             */
            self.noCheckALL = function () {
                self.proIds = [];
                self.noProList.forEach(function (el) {
                    el.active = true;
                    self.proIds.push(el.ProjectName);
                })

                self.reProList.forEach(function (el) {
                    if (el.active == true) {
                        self.proIds.push(el.ProjectName);
                    }
                })
            }
            /**
             * 非付费项目全不选
             */
            self.noUnCheckALL = function () {
                self.proIds = [];
                self.noProList.forEach(function (el) {
                    el.active = false;
                })

                self.reProList.forEach(function (el) {
                    if (el.active == true) {
                        self.proIds.push(el.ProjectName);
                    }
                })
            }
        }
    ])

    //HOME
    .controller('homeController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', '$q', 'util', 'CONFIG',
        function($http, $scope, $state, $location, $filter, $stateParams, $q, util, CONFIG) {
            var self = this;
            self.init = function() {
                self.projectList = [
                    {projectName: "OpenVoD", projectNameCHZ: "OpenVoD"},
                ]
                self.selectProject = "OpenVoD";
                self.username = util.getParams('userName');
            }

            self.logout = function() {
                util.setParams('token', '');
                $state.go('login');
            }
        }

    ])

    //概览模块
    .controller('overviewController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', '$q', 'util', 'CONFIG',
        function($http, $scope, $state, $location, $filter, $stateParams, $q, util, CONFIG) {
            var self = this;

            self.init = function() {
                self.activerow = 0;
                self.dateType = 1;
                self.loadData();
            }

            moment.locale('zh-cn');
            $scope.endDateBeforeRender = endDateBeforeRender
            $scope.endDateOnSetTime = endDateOnSetTime
            $scope.startDateBeforeRender = startDateBeforeRender
            $scope.startDateOnSetTime = startDateOnSetTime

            function startDateOnSetTime () {
                $scope.$broadcast('start-date-changed');
            }

            function endDateOnSetTime () {
                $scope.$broadcast('end-date-changed');
            }

            function startDateBeforeRender ($view, $dates) {
                if ($scope.dateRangeEnd) {
                    var activeDate = moment($scope.dateRangeEnd).subtract(0, $view).add(1, 'minute');

                    $dates.filter(function (date) {
                        return date.localDateValue() >= activeDate.valueOf()
                    }).forEach(function (date) {
                        date.selectable = false;
                    })
                }
            }

            function endDateBeforeRender ($view, $dates) {
                if ($scope.dateRangeStart) {
                    var activeDate = moment($scope.dateRangeStart).subtract(1, $view).add(1, 'minute');
                    var nowDate = new Date().getTime();

                    $dates.filter(function (date) {
                        return date.localDateValue() <= activeDate.valueOf() || date.localDateValue() >= nowDate.valueOf()
                    }).forEach(function (date) {
                        date.selectable = false;
                    })
                }
            }

            /**
             * 更改tab
             * @param index
             */
            self.isCurrent = function(index){
                if (self.activerow != index) {
                    self.activerow = index;
                    self.loadData();
                }
            }

            /**
             * 快捷日期和自定义日期修改
             */
            self.categoryChange = function () {
                if ($scope.shotcut == 4) {
                    $scope.showDate = true;
                } else {
                    $scope.showDate = false;
                }
                self.loadData();
            }

            self.charts = {
                chart: {
                    type: 'areaspline'
                },
                title: {
                    text: ''
                },
                xAxis: {
                    categories: [],
                    tickInterval: 1
                },
                yAxis: {
                    title: {
                        text: ''
                    }
                },
                tooltip: {
                    shared: true,
                    valueSuffix: ''
                },
                credits: {
                    enabled: false
                },
                plotOptions: {
                    areaspline: {
                        fillOpacity: 0.5,
                        marker: {
                            enabled: false
                        }
                    }
                },
                series: [],
                lang: {
                    noData: '暂无数据'
                },
                noData: {
                    style: {
                        fontWeight: 'bold',
                        fontSize: '15px',
                        color: '#9B9B9B'
                    }
                }
            }

            self.loadData = function () {
                var deferred = $q.defer();
                switch (self.activerow) {
                    case 0:
                        loadOnlineRate();
                        break;
                    case 1:
                        loadActiveRate();
                        break;
                    case 2:
                        loadPayRate();
                        break;
                    case 3:
                        loadRevenue();
                        break;
                    case 4:
                        loadActiveDur();
                        break;
                }
                //获取开机率
                function loadOnlineRate() {
                    if($scope.showDate){
                        //自定义
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getTermOnlineRateInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.category
                        })
                    }else{
                        //快捷
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getTermOnlineRateInfo',
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.shotcut
                        })
                    }

                    $scope.$emit("loading", true);

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.th = ["日期", "累计终端", "上线终端", "开机率"];
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            checkDataLength(data.timeList);

                            data.timeList.forEach(function (el, index) {
                                self.charts.xAxis.categories.push(self.dtSubstr(el));
                                self.dataSet.push({a: self.dtSubstr(el)});
                            });

                            data.totalCount.forEach(function (el, index) {
                                self.dataSet[index].b = el;
                            });

                            data.onlineCount.forEach(function (el, index) {
                                self.dataSet[index].c = el;
                            });

                            self.charts.series.push({name: "开机率", id: "series-0", data: [], tooltip: {valueSuffix: '%'}});
                            data.onlineRate.forEach(function (el, index) {
                                self.charts.series[0].data.push(util.FloatMul(el, 100));
                                self.dataSet[index].d = util.FloatMul(el, 100).toFixed(2) + "%";
                            });

                            deferred.resolve();
                        } else if (data.rescode == '401') {
                            alert('访问超时，请重新登录');
                            $location.path("pages/login.html");
                        } else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                        return deferred.promise;
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        $scope.$emit("loading", false);
                    });
                }

                //获取活跃率
                function loadActiveRate() {
                    if($scope.showDate){
                        //自定义
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getTermActiveRateInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.category
                        })
                    }else{
                        //快捷
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getTermActiveRateInfo',
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.shotcut
                        })
                    }
                    $scope.$emit("loading", true);

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.th = ["日期", "上线终端", "活跃终端", "活跃率"];
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            checkDataLength(data.timeList);

                            data.timeList.forEach(function (el, index) {
                                self.charts.xAxis.categories.push(self.dtSubstr(el));
                                self.dataSet.push({a: self.dtSubstr(el)});
                            });

                            data.onlineCount.forEach(function (el, index) {
                                self.dataSet[index].b = el;
                            });

                            data.activeCount.forEach(function (el, index) {
                                self.dataSet[index].c = el;
                            });

                            self.charts.series.push({name: "活跃率", id: "series-0", data: [], tooltip: {valueSuffix: '%'}});
                            data.activeRate.forEach(function (el, index) {
                                self.charts.series[0].data.push(util.FloatMul(el, 100));
                                self.dataSet[index].d = util.FloatMul(el, 100).toFixed(2) + "%";
                            });

                            deferred.resolve();
                        } else if (data.rescode == '401') {
                            alert('访问超时，请重新登录');
                            $location.path("pages/login.html");
                        } else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        $scope.$emit("loading", false);
                    });
                }


                //付费转化率
                function loadPayRate() {
                    if($scope.showDate){
                        //自定义
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getTermPayRateInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.category
                        })
                    }else{
                        //快捷
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getTermPayRateInfo',
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.shotcut
                        })
                    }
                    $scope.$emit("loading", true);

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.th = ["日期", "活跃终端", "付费终端", "付费终端转化率"];
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            checkDataLength(data.timeList);

                            data.timeList.forEach(function (el, index) {
                                self.charts.xAxis.categories.push(self.dtSubstr(el));
                                self.dataSet.push({a: self.dtSubstr(el)});
                            });

                            data.activeCount.forEach(function (el, index) {
                                self.dataSet[index].b = el;
                            });

                            data.payCount.forEach(function (el, index) {
                                self.dataSet[index].c = el;
                            });

                            self.charts.series.push({name: "终端付费转化率", data: [], tooltip: {valueSuffix: '%'}});
                            data.payRate.forEach(function (el, index) {
                                self.charts.series[0].data.push(util.FloatMul(el, 100));
                                self.dataSet[index].d = util.FloatMul(el, 100).toFixed(2) + '%';
                            });

                            deferred.resolve();
                        } else if (data.rescode == '401') {
                            alert('访问超时，请重新登录');
                            $location.path("pages/login.html");
                        } else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        $scope.$emit("loading", false);
                    });
                }

                //每终端营收
                function loadRevenue() {
                    if($scope.showDate){
                        //自定义
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getPerTermRevenueInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.category
                        })
                    }else{
                        //快捷
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getPerTermRevenueInfo',
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.shotcut
                        })
                    }
                    $scope.$emit("loading", true);

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.th = ["日期", "活跃终端数", "总营收", "平均营收"];
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            checkDataLength(data.timeList);

                            data.timeList.forEach(function (el, index) {
                                self.charts.xAxis.categories.push(self.dtSubstr(el));
                                self.dataSet.push({a: self.dtSubstr(el)});
                            });

                            data.activeCount.forEach(function (el, index) {
                                self.dataSet[index].b = el;
                            });

                            data.totalMoney.forEach(function (el, index) {
                                self.dataSet[index].c = el;
                            });

                            self.charts.series.push(
                                {name: "平均每终端营收", data: [], tooltip: {valueSuffix: ' 元'}},
                                {name: "日均营收", data: [], tooltip: {valueSuffix: ' 元'}}
                                );
                            data.revenue.forEach(function (el, index) {
                                self.charts.series[0].data.push(el);
                                self.charts.series[1].data.push(data.dayPerRevenue);
                                self.dataSet[index].d = el;
                            });


                            deferred.resolve();
                        } else if (data.rescode == '401') {
                            alert('访问超时，请重新登录');
                            $location.path("pages/login.html");
                        } else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        $scope.$emit("loading", false);
                    });
                }

                //获取时长分布
                function loadActiveDur() {
                    if($scope.showDate){
                        //自定义
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getPerTermActiveTimeInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.category
                        })
                    }else{
                        //快捷
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getPerTermActiveTimeInfo',
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.shotcut
                        })
                    }
                    $scope.$emit("loading", true);

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.th = ["日期", "活跃终端数", "总活跃时长", "平均活跃时长"];
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            checkDataLength(data.timeList);

                            data.timeList.forEach(function (el, index) {
                                self.charts.xAxis.categories.push(self.dtSubstr(el));
                                self.dataSet.push({a: self.dtSubstr(el)});
                            });

                            data.activeCount.forEach(function (el, index) {
                                self.dataSet[index].b = el;
                            });

                            data.activeTime.forEach(function (el, index) {
                                self.dataSet[index].c = el;
                            });

                            self.charts.series.push({name: "平均活跃时长", data: [], tooltip: {valueSuffix: ' 小时'}});
                            data.perActiveTime.forEach(function (el, index) {
                                self.charts.series[0].data.push(Number((el / 3600).toFixed(2)));

                                var h = Math.floor(el / 3600);
                                var m = Math.floor((el - h * 3600) / 60);
                                var s = (el - h * 3600 - m * 60).toFixed(2);

                                self.dataSet[index].d = h + ":" + zeroFill(m) + ":" + zeroFill(s);
                                function zeroFill(data) {
                                    if (data < 10) {
                                        data = "0" + data;
                                    }
                                    return data;
                                }
                            });

                            deferred.resolve();
                        } else if (data.rescode == '401') {
                            alert('访问超时，请重新登录');
                            $location.path("pages/login.html");
                        } else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        $scope.$emit("loading", false);
                    });
                }

                return deferred.promise;
            }

            /**
             * 检测返回数据是否为空
             * @param dataJson {array} 数组
             * @returns {boolean}
             */
            function checkDataLength(dataJson) {
                if (dataJson.length == 0) {
                    self.noData = true;
                    return false;
                }
            }

            /**
             * 列表排序
             * @param orderby
             */
            self.changeOrderby = function (orderby) {
                self.desc = !self.desc;
            }

            /**
             * 根据时间类型返回时间
             * @param datetime
             * @returns {string}
             */
            self.dtSubstr = function(datetime) {
                if ($scope.showDate == true) {
                    switch ($scope.category) {
                        case 0:
                            return datetime.substring(5, 10);
                        case 1:
                            return datetime.substring(5, 10);
                        case 2:
                            return datetime.substring(5, 7);
                        case 3:
                            return datetime.substring(0, 4);
                    }
                } else {
                    switch ($scope.shotcut) {
                        case 0:
                            return datetime.substring(5, 16);
                        case 1:
                            return datetime.substring(5, 10);
                        case 2:
                            return datetime.substring(5, 10);
                        case 3:
                            return datetime.substring(0, 7);
                    }
                }
            }
        }

    ])

    //具体模块
    .controller('specificController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', '$q', 'util', 'CONFIG',
        function($http, $scope, $state, $location, $filter, $stateParams, $q, util, CONFIG) {
            var self = this;

            self.init = function() {
                self.activerow = 0;
                self.term = [
                    {name: '累计终端', show: true, sort: '', desc: false},
                    {name: '上线终端', show: true, sort: '', desc: false},
                    {name: '活跃终端', show: true, sort: '', desc: false},
                    {name: '付费终端', show: true, sort: '', desc: false},
                    {name: '新增终端', show: false, sort: '', desc: false}
                ];
                self.selectCount = 4;

                self.countStatistics = [
                    {name: '总', show: true, sort: '', desc: false},
                    {name: '单次', show: false, sort: '', desc: false},
                    {name: '打包', show: false, sort: '', desc: false}

                ];

                self.active = [
                    {name: '时长分布', show: true, sort: '', desc: false},
                    {name: '时段分布', show: false, sort: '', desc: false}
                ];
                self.OD = [
                    {name: '点播Top10', show: true, sort: '', desc: false},
                    {name: '营收Top10', show: false, sort: '', desc: false}
                ]

                self.loadData();
                self.orderby = {};
                self.orderby.desc = false;
            }

            moment.locale('zh-cn');
            $scope.endDateBeforeRender = endDateBeforeRender
            $scope.endDateOnSetTime = endDateOnSetTime
            $scope.startDateBeforeRender = startDateBeforeRender
            $scope.startDateOnSetTime = startDateOnSetTime

            function startDateOnSetTime () {
                $scope.$broadcast('start-date-changed');
            }

            function endDateOnSetTime () {
                $scope.$broadcast('end-date-changed');
            }

            function startDateBeforeRender ($view, $dates) {
                if ($scope.dateRangeEnd) {
                    var activeDate = moment($scope.dateRangeEnd).subtract(0, $view).add(1, 'minute');

                    $dates.filter(function (date) {
                        return date.localDateValue() >= activeDate.valueOf()
                    }).forEach(function (date) {
                        date.selectable = false;
                    })
                }
            }

            function endDateBeforeRender ($view, $dates) {
                if ($scope.dateRangeStart) {
                    var activeDate = moment($scope.dateRangeStart).subtract(1, $view).add(1, 'minute');
                    var nowDate = new Date().getTime();

                    $dates.filter(function (date) {
                        return date.localDateValue() <= activeDate.valueOf() || date.localDateValue() >= nowDate.valueOf()
                    }).forEach(function (date) {
                        date.selectable = false;
                    })
                }
            }

            /**
             * 更改tab
             * @param index
             */
            self.isCurrent = function(index){
                if (self.activerow != index) {
                    self.activerow = index;
                    self.loadData();
                }
            }

            /**
             * 切换项目
             * @param projectName
             */
            self.changeProject = function (projectName) {
                util.setParams('project', projectName);
                self.loadData();
            }

            /**
             * 快捷日期和自定义日期修改
             */
            self.categoryChange = function () {
                if ($scope.shotcut == 4) {
                    $scope.showDate = true;
                } else {
                    $scope.showDate = false;
                }
                self.loadData();
            }

            /**
             * 选择终端指标
             * @param $index
             * @returns {boolean}
             */
            self.selectTerm = function ($index) {
                if (self.term[$index].show == true && self.selectCount >= 2) {
                    self.selectCount--;
                } else if (self.term[$index].show == true && self.selectCount < 2) {
                    alert('最少选择1组数据！');
                    return false;
                } else if (self.term[$index].show == false && self.selectCount < 4) {
                    self.selectCount++;
                } else {
                    alert('最多只能选择4组显示！');
                    return false;
                }
                self.term[$index].show = !self.term[$index].show;

                self.th = ["日期"];
                self.charts.series = [];
                var num = 0;
                self.term.forEach(function (el, index) {
                    if (el.show == true) {
                        self.th.push(el.name);
                        self.termSeries[index].id = 'series-' + num;
                        self.charts.series.push(self.termSeries[index]);
                        num++;
                    }
                })

                self.dataSet = [];

                self.termData.forEach(function (el, index) {
                    self.dataSet.push({a: el.a});
                    if (self.term[0].show == true) {
                        self.dataSet[index].b = el.b;
                    }
                    if (self.term[1].show == true) {
                        self.dataSet[index].c = el.c;
                    }
                    if (self.term[2].show == true) {
                        self.dataSet[index].d = el.d;
                    }
                    if (self.term[3].show == true) {
                        self.dataSet[index].e = el.e;
                    }
                    if (self.term[4].show == true) {
                        self.dataSet[index].f = el.f;
                    }
                })
            }

            /**
             * 选择次数统计
             * @param $index
             */
            self.selectMenu = function (Array, $index) {
                Array.forEach(function (el) {
                    el.show = false;
                })
                Array[$index].show = true;
                self.loadData();
            }

            self.charts = {
                chart: {
                    type: 'areaspline'
                },
                title: {
                    text: ''
                },
                xAxis: {
                    categories: [],
                },
                yAxis: {
                    title: {
                        text: ''      //y轴
                    }
                },
                tooltip: {
                    shared: true,
                    valueSuffix: ''   //后缀
                },
                credits: {
                    enabled: false
                },
                plotOptions: {
                    areaspline: {
                        fillOpacity: 0.5,
                        marker: {
                            enabled: false
                        }
                    }
                },
                series: [],
                lang: {
                    noData: '暂无数据'
                },
                noData: {
                    style: {
                        fontWeight: 'bold',
                        fontSize: '15px',
                        color: '#9B9B9B'
                    }
                }
            }

            /**
             * 加载数据
             * @returns {jQuery.promise|IPromise<T>|promise|((target?:any)=>JQueryPromise<T>)|((type?:string, target?:Object)=>JQueryPromise<any>)|*}
             */
            self.loadData = function () {
                var deferred = $q.defer();

                self.noData = false;
                self.charts.chart.type = "areaspline";
                switch (self.activerow) {
                    case 0:
                        loadTerm();
                        break;
                    case 1:
                        loadOrder();
                        break;
                    case 2:
                        loadRevenue();
                        break;
                    case 3:
                        self.charts.chart.type = "column";
                        loadActive();
                        break;
                    case 4:
                        self.charts.chart.type = "column";
                        loadOD();
                        break;
                }

                /**
                 * 获取终端指标
                 */
                function loadTerm() {
                    if($scope.showDate){
                        //自定义
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getTermStatisticsInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.category
                        })
                    }else{
                        //快捷
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getTermStatisticsInfo',
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.shotcut
                        })
                    }

                    $scope.$emit("loading", true);

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];
                            self.termSeries = [];
                            self.termData = [];

                            checkDataLength(data.timeList);

                            data.timeList.forEach(function (el, index) {
                                self.charts.xAxis.categories.push(self.dtSubstr(el));
                                self.termData.push({a: self.dtSubstr(el)});
                            });

                            self.termSeries.push({name: "累计终端", data: [], tooltip: {valueSuffix: ' 个'}});
                            data.addUpCount.forEach(function (el, index) {
                                self.termSeries[0].data.push(el);
                                self.termData[index].b = el;
                            });

                            self.termSeries.push({name: "上线终端", data: [], tooltip: {valueSuffix: ' 个'}});
                            data.onlineCount.forEach(function (el, index) {
                                self.termSeries[1].data.push(el);
                                self.termData[index].c = el;
                            });

                            self.termSeries.push({name: "活跃终端", data: [], tooltip: {valueSuffix: ' 个'}});
                            data.activeCount.forEach(function (el, index) {
                                self.termSeries[2].data.push(el);
                                self.termData[index].d = el;
                            });

                            self.termSeries.push({name: "付费终端", data: [], tooltip: {valueSuffix: ' 个'}});
                            data.payCount.forEach(function (el, index) {
                                self.termSeries[3].data.push(el);
                                self.termData[index].e = el;
                            });

                            self.termSeries.push({name: "新增终端", data: [], tooltip: {valueSuffix: ' 个'}});
                            data.newAddCount.forEach(function (el, index) {
                                self.termSeries[4].data.push(el);
                                self.termData[index].f = el;
                            });

                            self.th = ["日期"];
                            var num = 0;
                            self.term.forEach(function (el, index) {
                                if (el.show == true) {
                                    self.th.push(el.name);
                                    self.termSeries[index].id = 'series-' + num;
                                    self.charts.series.push(self.termSeries[index]);
                                    num++;
                                }
                            })

                            self.termData.forEach(function (el, index) {
                                self.dataSet.push({a: el.a});
                                if (self.term[0].show == true) {
                                    self.dataSet[index].b = el.b;
                                }
                                if (self.term[1].show == true) {
                                    self.dataSet[index].c = el.c;
                                }
                                if (self.term[2].show == true) {
                                    self.dataSet[index].d = el.d;
                                }
                                if (self.term[3].show == true) {
                                    self.dataSet[index].e = el.e;
                                }
                                if (self.term[4].show == true) {
                                    self.dataSet[index].f = el.f;
                                }
                            })

                            deferred.resolve();
                        } else if (data.rescode == '401') {
                            alert('访问超时，请重新登录');
                            $location.path("pages/login.html");
                        } else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        $scope.$emit("loading", false);
                    });
                    return deferred.promise;
                }

                /**
                 * 获取次数统计
                 */
                function loadOrder() {
                    var select = 0,
                        action;
                    self.countStatistics.forEach(function (el, index) {
                        if (el.show == true) select = index;
                    })

                    switch (select) {
                        case 0:
                            action = "getAllOrderCountStatisticsInfo";
                            self.th = ["日期", "总下单数", "总支付数", "转化率"];
                            break;
                        case 1:
                            action = "getSingleOrderCountStatisticsInfo";
                            self.th = ["日期", "单次下单数", "单次支付数", "转化率"];
                            break;
                        case 2:
                            action = "getPackageOrderCountStatisticsInfo";
                            self.th = ["日期", "打包下单数", "打包支付数", "转化率"];
                            break;
                        default:
                            action = "getAllOrderCountStatisticsInfo";
                            self.th = ["日期", "总下单数", "总支付数", "转化率"];
                            break;
                    }
                    if($scope.showDate){
                        //自定义
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: action,
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.category
                        })
                    }else{
                        //快捷
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: action,
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.shotcut
                        })
                    }

                    $scope.$emit("loading", true);

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            checkDataLength(data.timeList);

                            data.timeList.forEach(function (el, index) {
                                self.charts.xAxis.categories.push(self.dtSubstr(el));
                                self.dataSet.push({a: self.dtSubstr(el)});
                            });

                            self.charts.series.push({
                                name: self.th[1],
                                id: "series-0",
                                data: [],
                                tooltip: {valueSuffix: ' 单'}
                            });
                            data.orderCount.forEach(function (el, index) {
                                self.charts.series[0].data.push(el);
                                self.dataSet[index].b = el;
                            });

                            self.charts.series.push({
                                name: self.th[2],
                                id: "series-1",
                                data: [],
                                tooltip: {valueSuffix: ' 单'}
                            });
                            data.payedCount.forEach(function (el, index) {
                                self.charts.series[1].data.push(el);
                                self.dataSet[index].c = el;
                            });

                            data.rate.forEach(function (el, index) {
                                self.dataSet[index].d = util.FloatMul(el, 100).toFixed(2) + "%";
                            });

                            deferred.resolve();
                        } else if (data.rescode == '401') {
                            alert('访问超时，请重新登录');
                            $location.path("pages/login.html");
                        } else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        $scope.$emit("loading", false);
                    });
                    return deferred.promise;
                }

                /**
                 * 获取营收
                 * @returns {jQuery.promise|promise|IPromise<T>|((target?:any)=>JQueryPromise<T>)|((type?:string, target?:Object)=>JQueryPromise<any>)|Promise|*}
                 */
                function loadRevenue() {
                    if($scope.showDate){
                        //自定义
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getRevenueStatisticsInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.category
                        })
                    }else{
                        //快捷
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getRevenueStatisticsInfo',
                            project: util.getProjectIds(),
                            type: 0,
                            category: $scope.shotcut
                        })
                    }

                    $scope.$emit("loading", true);

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.th = ["日期", "总收益", "单次点播收益", "打包点播收益"];
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            checkDataLength(data.timeList);

                            data.timeList.forEach(function (el, index) {
                                self.charts.xAxis.categories.push(self.dtSubstr(el));
                                self.dataSet.push({a: self.dtSubstr(el)});
                            });

                            self.charts.series.push({name: "总收益", data: [], tooltip: {valueSuffix: ' 元'}});
                            data.totalMovieRevenue.forEach(function (el, index) {
                                self.charts.series[0].data.push(el / 100);
                                self.dataSet[index].b = el / 100;
                            });
                            self.charts.series.push({name: "单次点播收益", data: [], tooltip: {valueSuffix: ' 元'}});
                            data.singleMovieRevenue.forEach(function (el, index) {
                                self.charts.series[1].data.push(el / 100);
                                self.dataSet[index].c = el / 100;
                            });
                            self.charts.series.push({name: "打包点播收益", data: [], tooltip: {valueSuffix: ' 元'}});
                            data.packageMovieRevenue.forEach(function (el, index) {
                                self.charts.series[2].data.push(el / 100);
                                self.dataSet[index].d = el / 100;
                            });
                            deferred.resolve();
                        } else if (data.rescode == '401') {
                            alert('访问超时，请重新登录');
                            $location.path("pages/login.html");
                        } else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        $scope.$emit("loading", false);
                    });
                    return deferred.promise;
                }

                /**
                 * 获取活跃指标
                 */
                function loadActive() {
                    var select = 0;
                    self.active.forEach(function (el, index) {
                        if (el.show == true) select = index;
                    })

                    if (select == 0) {
                        loadActiveTime();
                    } else if (select == 1) {
                        loadActiveTimeInterval();
                    }

                    //时长分布
                    function loadActiveTime() {
                        if($scope.showDate){
                            //自定义
                            var data = JSON.stringify({
                                token: util.getParams("token"),
                                action: 'getTermCountBySpanActiveTime',
                                StartTime: $scope.dateRangeStart,
                                EndTime: $scope.dateRangeEnd,
                                project: util.getProjectIds(),
                                type: 1,
                                category: $scope.category
                            })
                        }else{
                            //快捷
                            var data = JSON.stringify({
                                token: util.getParams("token"),
                                action: 'getTermCountBySpanActiveTime',
                                project: util.getProjectIds(),
                                type: 1,
                                category: $scope.shotcut
                            })
                        }

                        $scope.$emit("loading", true);

                        $http({
                            method: 'POST',
                            url: util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response) {
                            var data = response.data;
                            if (data.rescode == '200') {
                                self.th = ["时长", "活跃终端数", "占比"];
                                self.dataSet = [];
                                self.charts.xAxis.categories = [];
                                self.charts.series = [];

                                checkDataLength(data.activeTimeSpan);

                                var start = 0, end = 0;
                                for (var i = 0; i < data.activeTimeSpan.length; i++) {
                                    start = data.activeTimeSpan[i] / 3600 + "h";
                                    if (i < data.activeTimeSpan.length - 1) {
                                        end = data.activeTimeSpan[i + 1] / 3600 + "h";
                                    } else {
                                        end = "";
                                    }
                                    self.charts.xAxis.categories.push(start + " ~ " + end);
                                    self.dataSet.push({a: start + " ~ " + end});
                                }

                                self.charts.series.push({
                                    name: "活跃终端数",
                                    id: "series-0",
                                    data: [],
                                    tooltip: {valueSuffix: ' 个'}
                                });
                                data.activeCount.forEach(function (el, index) {
                                    self.charts.series[0].data.push(el);
                                    self.dataSet[index].b = el;
                                });

                                data.rate.forEach(function (el, index) {
                                    self.dataSet[index].c = util.FloatMul(el, 100).toFixed(2) + "%";
                                });

                                deferred.resolve();
                            } else if (data.rescode == '401') {
                                alert('访问超时，请重新登录');
                                $location.path("pages/login.html");
                            } else {
                                alert(data.errInfo);
                                deferred.reject();
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                            $scope.$emit("loading", false);
                        });
                    }

                    //时段分布
                    function loadActiveTimeInterval() {
                        if($scope.showDate){
                            //自定义
                            var data = JSON.stringify({
                                token: util.getParams("token"),
                                action: 'getTerm24HourActiveInfo',
                                StartTime: $scope.dateRangeStart,
                                EndTime: $scope.dateRangeEnd,
                                project: util.getProjectIds(),
                                type: 1,
                                category: $scope.category
                            })
                        }else{
                            //快捷
                            var data = JSON.stringify({
                                token: util.getParams("token"),
                                action: 'getTerm24HourActiveInfo',
                                project: util.getProjectIds(),
                                type: 1,
                                category: $scope.shotcut
                            })
                        }

                        $scope.$emit("loading", true);

                        $http({
                            method: 'POST',
                            url: util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response) {
                            var data = response.data;
                            if (data.rescode == '200') {
                                self.th = ["时间段", "活跃终端数", "活跃分钟数", "营收额"];
                                self.dataSet = [];
                                self.charts.xAxis.categories = [];
                                self.charts.series = [];

                                checkDataLength(data.activeCount);

                                self.charts.xAxis.categories = ["00:00-01:00", "01:00-02:00", "02:00-03:00", "03:00-04:00",
                                    "04:00-05:00", "05:00-06:00", "06:00-07:00", "07:00-08:00", "08:00-09:00", "09:00-10:00",
                                    "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00",
                                    "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00",
                                    "22:00-23:00", "23:00-24:00"
                                ]
                                self.charts.xAxis.categories.forEach(function (el, index) {
                                    self.dataSet.push({a: el});
                                })

                                self.charts.series.push({
                                    name: "活跃终端数",
                                    id: "series-0",
                                    data: [],
                                    tooltip: {valueSuffix: ' 个'}
                                });
                                data.activeCount.forEach(function (el, index) {
                                    self.charts.series[0].data.push(el);
                                    self.dataSet[index].b = el;
                                });

                                self.charts.series.push({
                                    name: "活跃时长",
                                    id: "series-1",
                                    data: [],
                                    tooltip: {valueSuffix: ' 小时'}
                                });
                                data.avgActiveTime.forEach(function (el, index) {
                                    self.charts.series[1].data.push(Number((el / 60).toFixed(2)));
                                    self.dataSet[index].c = (el / 60).toFixed(2);
                                });

                                self.charts.series.push({
                                    name: "营收额",
                                    id: "series-2",
                                    data: [],
                                    tooltip: {valueSuffix: ' 元'}
                                });
                                data.avgMoney.forEach(function (el, index) {
                                    self.charts.series[2].data.push((el / 100).toFixed(2));
                                    self.dataSet[index].d = (el / 100).toFixed(2);
                                });

                                deferred.resolve();
                            } else if (data.rescode == '401') {
                                alert('访问超时，请重新登录');
                                $location.path("pages/login.html");
                            } else {
                                alert(data.errInfo);
                                deferred.reject();
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                            $scope.$emit("loading", false);
                        });
                    }
                    return deferred.promise;
                }

                function loadOD() {
                    var select = 0;
                    self.OD.forEach(function (el, index) {
                        if (el.show == true) select = index;
                    })

                    switch (select) {
                        case 0:
                            loadODCount();
                            break;
                        case 1:
                            loadODRevenue();
                            break;
                    }

                    function loadODCount() {
                        if($scope.showDate){
                            //自定义
                            var data = JSON.stringify({
                                token: util.getParams("token"),
                                action: 'getTopNByMovieCount',
                                StartTime: $scope.dateRangeStart,
                                EndTime: $scope.dateRangeEnd,
                                project: util.getProjectIds(),
                                type: 1,
                                category: $scope.category
                            })
                        }else{
                            //快捷
                            var data = JSON.stringify({
                                token: util.getParams("token"),
                                action: 'getTopNByMovieCount',
                                project: util.getProjectIds(),
                                type: 1,
                                category: $scope.shotcut
                            })
                        }
                        $scope.$emit("loading", true);

                        $http({
                            method: 'POST',
                            url: util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response) {
                            var data = response.data;
                            if (data.rescode == '200') {
                                self.th = ["ID", "电影", "点播量"];
                                self.dataSet = [];
                                self.charts.xAxis.categories = [];
                                self.charts.series = [];

                                checkDataLength(data.movieID);

                                data.movieID.forEach(function (el, index) {
                                    self.dataSet.push({a: el});
                                });

                                data.movieNameCHZ.forEach(function (el, index) {
                                    self.charts.xAxis.categories.push(el);
                                    self.dataSet[index].b = el;
                                });

                                self.charts.series.push({name: "点播量", data: [], tooltip: {valueSuffix: '次'}});
                                data.count.forEach(function (el, index) {
                                    self.charts.series[0].data.push(el);
                                    self.dataSet[index].c = el;
                                });

                                deferred.resolve();
                            } else if (data.rescode == '401') {
                                alert('访问超时，请重新登录');
                                $location.path("pages/login.html");
                            } else {
                                alert(data.errInfo);
                                deferred.reject();
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                            $scope.$emit("loading", false);
                        });
                    }

                    function loadODRevenue() {
                        if($scope.showDate){
                            //自定义
                            var data = JSON.stringify({
                                token: util.getParams("token"),
                                action: 'getTopNByMovieRevenue',
                                StartTime: $scope.dateRangeStart,
                                EndTime: $scope.dateRangeEnd,
                                project: util.getProjectIds(),
                                type: 1,
                                category: $scope.category
                            })
                        }else{
                            //快捷
                            var data = JSON.stringify({
                                token: util.getParams("token"),
                                action: 'getTopNByMovieRevenue',
                                project: util.getProjectIds(),
                                type: 1,
                                category: $scope.shotcut
                            })
                        }

                        $scope.$emit("loading", true);

                        $http({
                            method: 'POST',
                            url: util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response) {
                            var data = response.data;
                            if (data.rescode == '200') {
                                self.th = ["ID", "电影", "营收金额"];
                                self.dataSet = [];
                                self.charts.xAxis.categories = [];
                                self.charts.series = [];

                                checkDataLength(data.movieID);

                                data.movieID.forEach(function (el, index) {
                                    self.dataSet.push({a: el});
                                });

                                data.movieNameCHZ.forEach(function (el, index) {
                                    self.charts.xAxis.categories.push(el);
                                    self.dataSet[index].b = el;
                                });

                                self.charts.series.push({name: "营收金额", data: [], tooltip: {valueSuffix: '元'}});
                                data.price.forEach(function (el, index) {
                                    self.charts.series[0].data.push(el / 100);
                                    self.dataSet[index].c = el / 100;
                                });

                                deferred.resolve();
                            } else if (data.rescode == '401') {
                                alert('访问超时，请重新登录');
                                $location.path("pages/login.html");
                            } else {
                                alert(data.errInfo);
                                deferred.reject();
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                            $scope.$emit("loading", false);
                        });
                    }

                    return deferred.promise;
                }

                /**
                 * 检测返回数据是否为空
                 * @param dataJson {array} 数组
                 * @returns {boolean}
                 */
                function checkDataLength(dataJson) {
                    if (dataJson.length == 0) {
                        self.noData = true;
                        return false;
                    }
                }

                /**
                 * 列表排序
                 * @param orderby
                 */
                self.changeOrderby = function (orderby) {
                    // self.orderby.sort = orderby;
                    self.desc = !self.desc;
                }

                /**
                 * 根据时间类型返回时间
                 * @param datetime
                 * @returns {string}
                 */
                self.dtSubstr = function (datetime) {
                    if ($scope.showDate == true) {
                        switch ($scope.category) {
                            case 0:
                                return datetime.substring(5, 10);
                            case 1:
                                return datetime.substring(5, 10);
                            case 2:
                                return datetime.substring(5, 7);
                            case 3:
                                return datetime.substring(0, 4);
                        }
                    } else {
                        switch ($scope.shotcut) {
                            case 0:
                                return datetime.substring(5, 16);
                            case 1:
                                return datetime.substring(5, 10);
                            case 2:
                                return datetime.substring(0, 10);
                            case 3:
                                return datetime.substring(0, 7);
                        }
                    }
                }
            }
        }
    ])

        //漏斗模块
        .controller('funnelController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', '$q', 'util', 'CONFIG',
            function($http, $scope, $state, $location, $filter, $stateParams, $q, util, CONFIG) {
                var self = this;

                self.init = function() {
                    self.activerow = 0;
                    self.dateType = 1;
                    self.loadData();
                }

                moment.locale('zh-cn');
                $scope.endDateBeforeRender = endDateBeforeRender
                $scope.endDateOnSetTime = endDateOnSetTime
                $scope.startDateBeforeRender = startDateBeforeRender
                $scope.startDateOnSetTime = startDateOnSetTime

                function startDateOnSetTime () {
                    $scope.$broadcast('start-date-changed');
                }

                function endDateOnSetTime () {
                    $scope.$broadcast('end-date-changed');
                }

                function startDateBeforeRender ($view, $dates) {
                    if ($scope.dateRangeEnd) {
                        var activeDate = moment($scope.dateRangeEnd).subtract(0, $view).add(1, 'minute');

                        $dates.filter(function (date) {
                            return date.localDateValue() >= activeDate.valueOf()
                        }).forEach(function (date) {
                            date.selectable = false;
                        })
                    }
                }

                function endDateBeforeRender ($view, $dates) {
                    if ($scope.dateRangeStart) {
                        var activeDate = moment($scope.dateRangeStart).subtract(1, $view).add(1, 'minute');
                        var nowDate = new Date().getTime();

                        $dates.filter(function (date) {
                            return date.localDateValue() <= activeDate.valueOf() || date.localDateValue() >= nowDate.valueOf()
                        }).forEach(function (date) {
                            date.selectable = false;
                        })
                    }
                }

                /**
                 * 快捷日期和自定义日期修改
                 */
                self.categoryChange = function () {
                    if ($scope.shotcut == 4) {
                        $scope.showDate = true;
                    } else {
                        $scope.showDate = false;
                    }
                    self.loadData();
                }

                self.charts = {
                    chart: {
                        type: 'funnel',
                        marginRight: 100
                    },
                    title: {
                        text: ''
                    },
                    tooltip: {
                        shared: true,
                        valueSuffix: ''
                    },
                    credits: {
                        enabled: false
                    },
                    plotOptions: {
                        series: {
                            dataLabels: {
                                enabled: true,
                                format: '<b>{point.name}</b> ({point.y:,.0f})',
                                color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black',
                                softConnector: true
                            },
                            neckWidth: '30%',
                            neckHeight: '25%'
                            //-- Other available options
                            // height: pixels or percent
                            // width: pixels or percent
                        }
                    },
                    series: [],
                    lang: {
                        noData: '暂无数据'
                    },
                    noData: {
                        style: {
                            fontWeight: 'bold',
                            fontSize: '15px',
                            color: '#9B9B9B'
                        }
                    }
                }

                self.loadData = function () {
                    var deferred = $q.defer();
                    switch (self.activerow) {
                        case 0:
                            loadOnlineRate();
                            break;
                    }
                    //获取开机率
                    function loadOnlineRate() {
                        if($scope.showDate){
                            //自定义
                            var data = JSON.stringify({
                                token: util.getParams("token"),
                                action: 'getTermStatisticsInfo',
                                StartTime: $scope.dateRangeStart,
                                EndTime: $scope.dateRangeEnd,
                                project: util.getProjectIds(),
                                type: 1,
                                category: $scope.category
                            })
                        }else{
                            //快捷
                            var data = JSON.stringify({
                                token: util.getParams("token"),
                                action: 'getTermStatisticsInfo',
                                project: util.getProjectIds(),
                                type: 1,
                                category: $scope.shotcut
                            })
                        }

                        $scope.$emit("loading", true);

                        $http({
                            method: 'POST',
                            url: util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response) {
                            var data = response.data;
                            if (data.rescode == '200') {
                                self.th = ["日期", "累计终端", "上线终端", "活跃终端", "付费终端"];
                                self.dataSet = [];
                                self.charts.xAxis.categories = [];
                                self.charts.series = [];

                                checkDataLength(data.timeList);

                                self.charts.series.push({name: "终端", data: [], tooltip: {valueSuffix: '个'}});

                                data.addUpCount.forEach(function (el, index) {
                                    self.charts.series[0].data.
                                    self.dataSet[index].b = el;
                                });

                                data.onlineCount.forEach(function (el, index) {
                                    self.dataSet[index].c = el;
                                });

                                data.activeCount.forEach(function (el, index) {
                                    self.dataSet[index].b = el;
                                });

                                data.payCount.forEach(function (el, index) {
                                    self.dataSet[index].c = el;
                                });

                                self.charts.series.push({name: "开机率", id: "series-0", data: [], tooltip: {valueSuffix: '%'}});
                                data.onlineRate.forEach(function (el, index) {
                                    self.charts.series[0].data.push(util.FloatMul(el, 100));
                                    self.dataSet[index].d = util.FloatMul(el, 100).toFixed(2) + "%";
                                });

                                deferred.resolve();
                            } else if (data.rescode == '401') {
                                alert('访问超时，请重新登录');
                                $location.path("pages/login.html");
                            } else {
                                alert(data.errInfo);
                                deferred.reject();
                            }
                            return deferred.promise;
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                            $scope.$emit("loading", false);
                        });
                    }

                    return deferred.promise;
                }

                /**
                 * 检测返回数据是否为空
                 * @param dataJson {array} 数组
                 * @returns {boolean}
                 */
                function checkDataLength(dataJson) {
                    if (dataJson.length == 0) {
                        self.noData = true;
                        return false;
                    }
                }

                /**
                 * 根据时间类型返回时间
                 * @param datetime
                 * @returns {string}
                 */
                self.dtSubstr = function(datetime) {
                    if ($scope.showDate == true) {
                        switch ($scope.category) {
                            case 0:
                                return datetime.substring(5, 10);
                            case 1:
                                return datetime.substring(5, 10);
                            case 2:
                                return datetime.substring(5, 7);
                            case 3:
                                return datetime.substring(0, 4);
                        }
                    } else {
                        switch ($scope.shotcut) {
                            case 0:
                                return datetime.substring(5, 16);
                            case 1:
                                return datetime.substring(5, 10);
                            case 2:
                                return datetime.substring(5, 10);
                            case 3:
                                return datetime.substring(0, 7);
                        }
                    }
                }
            }

        ])

        //项目模块
        .controller('projectController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', '$q', 'util', 'CONFIG',
            function($http, $scope, $state, $location, $filter, $stateParams, $q, util, CONFIG) {
                var self = this;

                /**
                 * 切换条目
                 * @param probabilityName
                 */
                self.changeProbability = function (probabilityName,$index) {
                    // $scope.current=probabilityName;
                    util.setParams('probabilityName', probabilityName);
                    util.setParams('index', $index);
                    console.log(util.getParams('probabilityName'),$index);
                    if($index<5){
                        console.log('<5')
                    }else{
                        console.log('>5')
                    }
                    $state.go('app.project2');

                    // self.loadChart($index);
                }

                self.changeTermShow=function(){
                    self.term.forEach(function (el, index) {
                        el.show=!el.show;
                    })
                    self.drop[0]=!self.drop[0];
                }
                self.changeOrderShow=function(){
                    self.order.forEach(function (el, index) {
                        el.show=!el.show;
                    })
                    self.drop[1]=!self.drop[1];
                }
                self.changeRevenueShow=function(){
                    self.revenue.forEach(function (el, index) {
                        el.show=!el.show;
                    })
                    self.drop[2]=!self.drop[2];
                }

                self.init = function() {
                    self.current=util.getParams('probabilityName');
                    self.drop=[true,true,true];
                    self.probability=[
                        {name: '开机率', show: false, sort: '', desc: false},
                        {name: '活跃率', show: false, sort: '', desc: false},
                        {name: '付费转化', show: false, sort: '', desc: false},
                        {name: '平均营收', show: false, sort: '', desc: false},
                        {name: '平均活跃', show: false, sort: '', desc: false}
                    ];
                    self.term = [
                        {name: '累计终端', show: false, sort: '', desc: false},
                        {name: '上线终端', show: false, sort: '', desc: false},
                        {name: '活跃终端', show: false, sort: '', desc: false},
                        {name: '付费终端', show: false, sort: '', desc: false},
                        {name: '新增终端', show: false, sort: '', desc: false}

                    ];
                    self.order = [
                        {name: '订单总数',   show: false, sort: '', desc: false},
                        {name: '付费订单总数',   show: false, sort: '', desc: false},
                        {name: '单次订单数', show: false, sort: '', desc: false},
                        {name: '单次付费订单数', show: false, sort: '', desc: false},
                        {name: '打包订单数', show: false, sort: '', desc: false},
                        {name: '打包付费订单数', show: false, sort: '', desc: false}
                    ];
                    self.revenue = [
                        {name: '营收总额',   show: false, sort: '', desc: false},
                        {name: '单次营收额', show: false, sort: '', desc: false},
                        {name: '打包营收额', show: false, sort: '', desc: false}
                    ];

                    // $scope.dateRangeEnd = $filter('date')(new Date() + 1*24*60*60*1000, 'yyyy-MM-dd');
                    // self.searchDate = $filter('date')((new Date().getTime()), 'yyyy-MM-dd');
                    // self.selectGra = 1;
                    // self.isDate = true;

                    // self.selectDur = 7;

                    // self.loadChart();
                    // self.orderby = {};
                    // self.orderby.desc = false;


                }
            }
        ])

        //项目2模块
        .controller('project2Controller', ['$http', '$scope', '$state', '$location','$filter', '$stateParams','md5','$q', 'util', 'CONFIG',
            function($http, $scope, $state, $location, $filter, $stateParams,md5, $q, util, CONFIG) {
                var self = this;

                $scope.showDate = true;

                $scope.endDateBeforeRender = endDateBeforeRender
                $scope.endDateOnSetTime = endDateOnSetTime
                $scope.startDateBeforeRender = startDateBeforeRender
                $scope.startDateOnSetTime = startDateOnSetTime

                function startDateOnSetTime () {
                    $scope.$broadcast('start-date-changed');
                }

                function endDateOnSetTime () {
                    $scope.$broadcast('end-date-changed');
                }

                function startDateBeforeRender ($view, $dates) {
                    if ($scope.dateRangeEnd) {
                        var activeDate = moment($scope.dateRangeEnd).subtract(0, $view).add(1, 'minute');

                        $dates.filter(function (date) {
                            return date.localDateValue() >= activeDate.valueOf()
                        }).forEach(function (date) {
                            date.selectable = false;
                        })
                    }
                }

                function endDateBeforeRender ($view, $dates) {
                    if ($scope.dateRangeStart) {
                        var activeDate = moment($scope.dateRangeStart).subtract(1, $view).add(1, 'minute');
                        var nowDate = new Date().getTime();

                        $dates.filter(function (date) {
                            return date.localDateValue() <= activeDate.valueOf() || date.localDateValue() >= nowDate.valueOf()
                        }).forEach(function (date) {
                            date.selectable = false;
                        })
                    }
                }

                self.loadChart=function(index){
                    var deferred = $q.defer();
                    switch (index) {
                        case 0:
                            //开机率
                            loadOnlineRate();
                            break;
                        case 1:
                            //活跃率
                            loadActiveRate();
                            break;
                        case 2:
                            //付费转化
                            loadRevenue();
                            break;
                        case 3:
                            //平均营收
                            loadAverageRevenue();
                            break;
                        case 4:
                            //平均活跃
                            loadAverageActive();
                            break;
                        case 5:
                            // 累积终端
                            loadAccTerm();
                            break;
                        case 6:
                            // 上线终端
                            loadOnlineTerm();
                            break;
                        case 7:
                            // 活跃终端
                            loadActiveTerm();
                            break;
                        case 8:
                            // 付费终端
                            loadReveTerm();
                            break;
                        case 9:
                            // 新增终端
                            loadNewTerm();
                            break;
                        case 10:
                            // 订单总数
                            loadTotalOrder();
                            break;
                        case 11:
                            // 付费订单总数
                            loadTotalPayOrder();
                            break;
                        case 12:
                            // 单次订单数
                            loadSingleOrder();
                            break;
                        case 13:
                            // 单次付费订单数
                            loadSinglePayOrder();
                            break;
                        case 14:
                            // 打包订单数
                            loadPackOrder();
                            break;
                        case 15:
                            // 打包付费订单数
                            loadPackPayOrder();
                            break;
                        case 16:
                            // 营收总额
                            loadTotalRevenue();
                            break;
                        case 17:
                            // 单次营收额
                            loadSingleRevenue();
                            break;
                        case 18:
                            // 打包营收额
                            loadPackRevenue();
                            break;
                    }
                    function loadOnlineRate(){
                        self.th=["项目名称","累计终端","上线终端","开机率"];
                        self.charts.series[0].name="开机率";
                        self.charts.tooltip.valueSuffix='%';
                        self.charts.xAxis.categories=[];
                        self.charts.yAxis.min=0;


                        self.charts.series[0].data=[];
                        self.dataSet = [];
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectOnlineRateInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        console.log(JSON.parse(data).StartTime)
                        console.log(JSON.parse(data).EndTime)
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            console.log(data);
                            if(data.rescode=="200"){
                                //数据格式：[{项目名-累计终端-上线终端-开机率}]
                                self.charts.yAxis.max=data.onlineRate[0]*100+1;
                                if(self.charts.yAxis.max==0){
                                    self.charts.yAxis.max=1;
                                }else if(self.charts.yAxis.max>100){
                                    self.charts.yAxis.max=100;
                                }
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.totalCount[i],
                                        d:data.onlineCount[i],
                                        e:parseInt(data.onlineRate[i]*100)+'%'
                                    });
                                }
                                var length=(self.dataSet.length>5)?5:self.dataSet.length
                                for(var i=0;i<length;i++){
                                    self.charts.xAxis.categories.push(self.dataSet[i].b);
                                    self.charts.series[0].data.push(parseFloat(self.dataSet[i].e));
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadActiveRate(){
                        self.th=["项目名称","上线终端","活跃终端","活跃率"];
                        self.charts.series[0].name="活跃率";
                        self.charts.tooltip.valueSuffix='%';
                        self.charts.xAxis.categories=[];
                        self.charts.series[0].data=[];
                        self.charts.yAxis.min=0;
                        self.dataSet = [];
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectActiveRateInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            console.log(data);
                            if(data.rescode=="200"){
                                //数据格式：[{日期-项目名-上线终端-活跃终端-活跃率}]
                                self.charts.yAxis.max=data.activeRate[0]*100+1;
                                if(self.charts.yAxis.max==0){
                                    self.charts.yAxis.max=1;
                                }else if(self.charts.yAxis.max>100){
                                    self.charts.yAxis.max=100;
                                }
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.onlineCount[i],
                                        d:data.activeCount[i],
                                        e:parseInt(data.activeRate[i]*100)+'%'
                                    });
                                }
                                var length=(self.dataSet.length>5)?5:self.dataSet.length
                                for(var i=0;i<length;i++){
                                    self.charts.xAxis.categories.push(self.dataSet[i].b);
                                    self.charts.series[0].data.push(parseFloat(self.dataSet[i].e));
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadRevenue(){
                        self.th=["项目名称","活跃终端","付费终端","付费转化"];
                        self.charts.series[0].name="付费转化";
                        self.charts.tooltip.valueSuffix='%';
                        self.charts.xAxis.categories=[];
                        self.charts.series[0].data=[];
                        self.charts.yAxis.min=0;
                        self.dataSet = [];
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectPayRateInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            console.log(data);
                            if(data.rescode=="200"){
                                //数据格式：[{日期-项目名-活跃终端-付费终端-付费转化}]
                                self.charts.yAxis.max=data.payRate[0]*100+1;
                                if(self.charts.yAxis.max==0){
                                    self.charts.yAxis.max=1;
                                }else if(self.charts.yAxis.max>100){
                                    self.charts.yAxis.max=100;
                                }
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.activeCount[i],
                                        d:data.payCount[i],
                                        e:parseInt(data.payRate[i]*100)+'%'
                                    });
                                }
                                var length=(self.dataSet.length>5)?5:self.dataSet.length
                                for(var i=0;i<length;i++){
                                    self.charts.xAxis.categories.push(self.dataSet[i].b);
                                    self.charts.series[0].data.push(parseFloat(self.dataSet[i].e));
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadAverageRevenue(){
                        self.th=["项目名称","活跃终端","营收总额","平均营收","日均营收"];
                        self.charts.series[0].name="平均营收";
                        self.charts.tooltip.valueSuffix='元';
                        self.charts.xAxis.categories=[];
                        self.charts.series[0].data=[];
                        self.charts.yAxis.min=0;
                        self.dataSet = [];
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectPerRevenueInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            // console.log("平均营收信息")
                            var data=response.data;
                            // var data=self.myData;
                            console.log(data);
                            if(data.rescode=="200"){
                                //数据格式：[{日期-项目名-累积终端-营收总额-平均营收}]
                                self.charts.yAxis.max=Number((data.perRevenue[0]/100).toFixed(2))+.1;
                                // if(self.charts.yAxis.max==2){
                                //     self.charts.yAxis.max=1;
                                // }
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.activeCount[i],
                                        d:Number((data.allMoney[i]/100).toFixed(2)),
                                        e:Number((data.perRevenue[i]/100).toFixed(2)),
                                        f:Number((data.dayPerRevenue[i]/100).toFixed(2))
                                    });
                                }
                                var length=(self.dataSet.length>5)?5:self.dataSet.length
                                for(var i=0;i<length;i++){
                                    self.charts.xAxis.categories.push(self.dataSet[i].b);
                                    self.charts.series[0].data.push(parseFloat(self.dataSet[i].e));
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadAverageActive(){
                        self.th=["项目名称","活跃终端","活跃时长","平均活跃时长(h)"];
                        self.charts.series[0].name="平均活跃时长";
                        self.charts.tooltip.valueSuffix='h';
                        self.charts.xAxis.categories=[];
                        self.charts.series[0].data=[];
                        self.charts.yAxis.min=0;
                        self.dataSet = [];
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectPerActiveInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            // console.log("平均活跃时长信息")
                            var data=response.data;
                            // var data=self.myData;
                            console.log(data);
                            if(data.rescode=="200"){
                                //数据格式：[{日期-项目名-活跃终端-活跃时长-平均活跃}]
                                self.charts.yAxis.max=parseInt(data.avgActiveTime[0]/3600)+5;
                                if(self.charts.yAxis.max==5){
                                    self.charts.yAxis.max=1;
                                }
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.activeCount[i],
                                        d:(data.avgAllActiveTime[i]/3600).toFixed(2),
                                        e:(data.avgActiveTime[i]/3600).toFixed(2)
                                    });
                                }
                                var length=(self.dataSet.length>5)?5:self.dataSet.length
                                for(var i=0;i<length;i++){
                                    self.charts.xAxis.categories.push(self.dataSet[i].b);
                                    self.charts.series[0].data.push(parseFloat(self.dataSet[i].e));
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadAccTerm() {
                        console.log('加载累计终端数据……')
                        self.th=["项目名称","累计终端"];
                        self.charts.series[0].name="累计终端";
                        self.charts.series[0].data=[];
                        self.dataSet = [];
                        //依次获取各个项目的累计终端数
                        //数据格式：[{日期-项目名-累计终端}]
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectAddUpInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            page:1,
                            per_page:1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            if(data.rescode=="200"){
                                var rest=0;
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    rest+=data.addUpCount[i];
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.addUpCount[i]
                                    });
                                }
                                self.dataSet.forEach(function(el,index){
                                    if(index<5){
                                        rest-=el.c;
                                        if(index==0){
                                            self.charts.series[0].data.push({
                                                name:el.b,
                                                y:el.c,
                                                sliced: true,
                                                selected: true
                                            })
                                        }else {
                                            self.charts.series[0].data.push([el.b,el.c]);
                                        }
                                    }
                                })
                                if(rest!=0){
                                    self.charts.series[0].data.push(['其他',rest]);
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadOnlineTerm() {
                        console.log('加载上线终端数据……')
                        self.th=["项目名称","上线终端"];
                        self.charts.series[0].name="上线终端";
                        self.charts.series[0].data=[];
                        self.dataSet = [];
                        //依次获取各个项目的上线终端数
                        //数据格式：[{日期-项目名-上线终端}]
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectOnlineInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            if(data.rescode=="200"){
                                var rest=0;
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    rest+=data.onlineCount[i];
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.onlineCount[i]
                                    });
                                }
                                self.dataSet.forEach(function(el,index){
                                    if(index<5){
                                        rest-=el.c;
                                        if(index==0){
                                            self.charts.series[0].data.push({
                                                name:el.b,
                                                y:el.c,
                                                sliced: true,
                                                selected: true
                                            })
                                        }else {
                                            self.charts.series[0].data.push([el.b,el.c]);
                                        }
                                    }
                                })
                                if(rest!=0){
                                    self.charts.series[0].data.push(['其他',rest]);
                                }


                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadActiveTerm() {
                        console.log('加载活跃终端数据……')
                        self.th=["项目名称","活跃终端"];
                        self.charts.series[0].name="活跃终端";
                        self.charts.series[0].data=[];
                        self.dataSet = [];
                        //依次获取各个项目的活跃终端数
                        //数据格式：[{日期-项目名-活跃终端}]
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectActiveInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            if(data.rescode=="200"){
                                var rest=0;
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    rest+=data.activeCount[i];
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.activeCount[i]
                                    });
                                }
                                self.dataSet.forEach(function(el,index){
                                    if(index<5){
                                        rest-=el.c;
                                        if(index==0){
                                            self.charts.series[0].data.push({
                                                name:el.b,
                                                y:el.c,
                                                sliced: true,
                                                selected: true
                                            })
                                        }else {
                                            self.charts.series[0].data.push([el.b,el.c]);
                                        }
                                    }
                                })
                                if(rest!=0){
                                    self.charts.series[0].data.push(['其他',rest]);
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadReveTerm() {
                        self.th=["项目名称","付费终端"];
                        self.charts.series[0].name="付费终端";
                        self.charts.series[0].data=[];
                        self.dataSet = [];
                        //依次获取各个项目的付费终端数
                        //数据格式：[{日期-项目名-付费终端}]
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectPayedInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            if(data.rescode=="200"){
                                var rest=0;
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    rest+=data.payedCount[i];
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.payedCount[i]
                                    });
                                }
                                self.dataSet.forEach(function(el,index){
                                    if(index<5){
                                        rest-=el.c;
                                        if(index==0){
                                            self.charts.series[0].data.push({
                                                name:el.b,
                                                y:el.c,
                                                sliced: true,
                                                selected: true
                                            })
                                        }else {
                                            self.charts.series[0].data.push([el.b,el.c]);
                                        }
                                    }
                                })
                                if(rest!=0){
                                    self.charts.series[0].data.push(['其他',rest]);
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadNewTerm() {
                        self.th=["项目名称","新增终端"];
                        self.charts.series[0].name="新增终端";
                        self.charts.series[0].data=[];
                        self.dataSet = [];
                        //依次获取各个项目的新增终端数
                        //数据格式：[{日期-项目名-新增终端}]
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectNewAddInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            if(data.rescode=="200"){
                                var rest=0;
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    rest+=data.newAddCount[i];
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.newAddCount[i]
                                    });
                                }
                                self.dataSet.forEach(function(el,index){
                                    if(index<5){
                                        rest-=el.c;
                                        if(index==0){
                                            self.charts.series[0].data.push({
                                                name:el.b,
                                                y:el.c,
                                                sliced: true,
                                                selected: true
                                            })
                                        }else {
                                            self.charts.series[0].data.push([el.b,el.c]);
                                        }
                                    }
                                })
                                if(rest!=0){
                                    self.charts.series[0].data.push(['其他',rest]);
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadTotalOrder() {
                        self.th=["项目名称","订单总数"];
                        self.charts.series[0].name="订单总数";
                        self.charts.series[0].data=[];
                        self.dataSet = [];
                        //依次获取各个项目的订单总数
                        //数据格式：[{日期-项目名-订单总数}]
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectOrderCountInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            if(data.rescode=="200"){
                                var rest=0;
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    rest+=data.orderCount[i];
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.orderCount[i]
                                    });
                                }
                                self.dataSet.forEach(function(el,index){
                                    if(index<5){
                                        rest-=el.c;
                                        if(index==0){
                                            self.charts.series[0].data.push({
                                                name:el.b,
                                                y:el.c,
                                                sliced: true,
                                                selected: true
                                            })
                                        }else {
                                            self.charts.series[0].data.push([el.b,el.c]);
                                        }
                                    }
                                })
                                if(rest!=0){
                                    self.charts.series[0].data.push(['其他',rest]);
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadTotalPayOrder() {
                        self.th=["项目名称","付费订单总数"];
                        self.charts.series[0].name="付费订单总数";
                        self.charts.series[0].data=[];
                        self.dataSet = [];
                        //依次获取各个项目的付费订单总数
                        //数据格式：[{日期-项目名-付费订单总数}]
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectPayedOrderCountInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            if(data.rescode=="200"){
                                var rest=0;
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    rest+=data.payedOrderCount[i];
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.payedOrderCount[i]
                                    });
                                }
                                self.dataSet.forEach(function(el,index){
                                    if(index<5){
                                        rest-=el.c;
                                        if(index==0){
                                            self.charts.series[0].data.push({
                                                name:el.b,
                                                y:el.c,
                                                sliced: true,
                                                selected: true
                                            })
                                        }else {
                                            self.charts.series[0].data.push([el.b,el.c]);
                                        }
                                    }
                                })
                                if(rest!=0){
                                    self.charts.series[0].data.push(['其他',rest]);
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadSingleOrder() {
                        self.th=["项目名称","单次订单数"];
                        self.charts.series[0].name="单次订单数";
                        self.charts.series[0].data=[];
                        self.dataSet = [];
                        //依次获取各个项目的单次订单数
                        //数据格式：[{日期-项目名-单次订单数}]
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectSingleOrderCountInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            if(data.rescode=="200"){
                                var rest=0;
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    rest+=data.orderCount[i];
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.orderCount[i]
                                    });
                                }
                                self.dataSet.forEach(function(el,index){
                                    if(index<5){
                                        rest-=el.c;
                                        if(index==0){
                                            self.charts.series[0].data.push({
                                                name:el.b,
                                                y:el.c,
                                                sliced: true,
                                                selected: true
                                            })
                                        }else {
                                            self.charts.series[0].data.push([el.b,el.c]);
                                        }
                                    }
                                })
                                if(rest!=0){
                                    self.charts.series[0].data.push(['其他',rest]);
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadSinglePayOrder() {
                        self.th=["项目名称","单次付费订单数"];
                        self.charts.series[0].name="单次付费订单数";
                        self.charts.series[0].data=[];
                        self.dataSet = [];
                        //依次获取各个项目的单次付费订单数
                        //数据格式：[{日期-项目名-单次付费订单数}]
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectSinglePayedOrderCountInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            if(data.rescode=="200"){
                                var rest=0;
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    rest+=data.payedOrderCount[i];
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.payedOrderCount[i]
                                    });
                                }
                                self.dataSet.forEach(function(el,index){
                                    if(index<5){
                                        rest-=el.c;
                                        if(index==0){
                                            self.charts.series[0].data.push({
                                                name:el.b,
                                                y:el.c,
                                                sliced: true,
                                                selected: true
                                            })
                                        }else {
                                            self.charts.series[0].data.push([el.b,el.c]);
                                        }
                                    }
                                })
                                if(rest!=0){
                                    self.charts.series[0].data.push(['其他',rest]);
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }

                    function loadPackOrder() {
                        self.th=["项目名称","打包订单数"];
                        self.charts.series[0].name="打包订单数";
                        self.charts.series[0].data=[];
                        self.dataSet = [];
                        //依次获取各个项目的打包订单数
                        //数据格式：[{日期-项目名-打包订单数}]
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectPackageOrderCountInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            if(data.rescode=="200"){
                                var rest=0;
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    rest+=data.orderCount[i];
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.orderCount[i]
                                    });
                                }
                                self.dataSet.forEach(function(el,index){
                                    if(index<5){
                                        rest-=el.c;
                                        if(index==0){
                                            self.charts.series[0].data.push({
                                                name:el.b,
                                                y:el.c,
                                                sliced: true,
                                                selected: true
                                            })
                                        }else {
                                            self.charts.series[0].data.push([el.b,el.c]);
                                        }
                                    }
                                })
                                if(rest!=0){
                                    self.charts.series[0].data.push(['其他',rest]);
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadPackPayOrder() {
                        self.th=["项目名称","打包付费订单数"];
                        self.charts.series[0].name="打包付费订单数";
                        self.charts.series[0].data=[];
                        self.dataSet = [];
                        //依次获取各个项目的打包付费订单数
                        //数据格式：[{日期-项目名-打包付费订单数}]
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectPackagePayedOrderCountInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            if(data.rescode=="200"){
                                var rest=0;
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    rest+=data.payedOrderCount[i];
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:data.payedOrderCount[i]
                                    });
                                }
                                self.dataSet.forEach(function(el,index){
                                    if(index<5){
                                        rest-=el.c;
                                        if(index==0){
                                            self.charts.series[0].data.push({
                                                name:el.b,
                                                y:el.c,
                                                sliced: true,
                                                selected: true
                                            })
                                        }else {
                                            self.charts.series[0].data.push([el.b,el.c]);
                                        }
                                    }
                                })
                                if(rest!=0){
                                    self.charts.series[0].data.push(['其他',rest]);
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }

                    function loadTotalRevenue() {
                        self.th=["项目名称","营收总额(元)"];
                        self.charts.series[0].name="营收总额";
                        self.charts.series[0].data=[];
                        self.dataSet = [];
                        //依次获取各个项目的营收总额
                        //数据格式：[{日期-项目名-营收总额}]
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectRevenueInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            if(data.rescode=="200"){
                                var rest=0;
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    rest+=Number((data.revenue[i]/100).toFixed(2));
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:Number((data.revenue[i]/100).toFixed(2))
                                    });
                                }
                                self.dataSet.forEach(function(el,index){
                                    if(index<5){
                                        rest-=el.c;
                                        if(index==0){
                                            self.charts.series[0].data.push({
                                                name:el.b,
                                                y:el.c,
                                                sliced: true,
                                                selected: true
                                            })
                                        }else {
                                            self.charts.series[0].data.push([el.b,el.c]);
                                        }
                                    }
                                })
                                if(rest!=0){
                                    self.charts.series[0].data.push(['其他',rest]);
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadSingleRevenue() {
                        self.th=["项目名称","单次营收额(元)"];
                        self.charts.series[0].name="单次营收额";
                        self.charts.series[0].data=[];
                        self.dataSet = [];
                        //依次获取各个项目的单次营收额
                        //数据格式：[{日期-项目名-单次营收额}]
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectSingleRevenueInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            if(data.rescode=="200"){
                                var rest=0;
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    rest+=Number((data.revenue[i]/100).toFixed(2));
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:Number((data.revenue[i]/100).toFixed(2))
                                    });
                                }
                                self.dataSet.forEach(function(el,index){
                                    if(index<5){
                                        rest-=el.c;
                                        if(index==0){
                                            self.charts.series[0].data.push({
                                                name:el.b,
                                                y:el.c,
                                                sliced: true,
                                                selected: true
                                            })
                                        }else {
                                            self.charts.series[0].data.push([el.b,el.c]);
                                        }
                                    }
                                })
                                if(rest!=0){
                                    self.charts.series[0].data.push(['其他',rest]);
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                    function loadPackRevenue() {
                        self.th=["项目名称","打包营收额(元)"];
                        self.charts.series[0].name="打包营收额";
                        self.charts.series[0].data=[];
                        self.dataSet = [];
                        //依次获取各个项目的打包营收额
                        //数据格式：[{日期-项目名-打包营收额}]
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getSortedProjectPackageRevenueInfo',
                            StartTime: $scope.dateRangeStart,
                            EndTime: $scope.dateRangeEnd,
                            "page":1,
                            "per_page":1000,
                            "project":["all"]
                        })
                        $http({
                            method:'POST',
                            url:util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response){
                            var data=response.data;
                            // var data=self.myData;
                            if(data.rescode=="200"){
                                var rest=0;
                                for(var i=0;i<data.projectListCHZ.length;i++){
                                    rest+=Number((data.revenue[i]/100).toFixed(2));
                                    self.dataSet.push({
                                        // a:start+"~"+end,
                                        b:data.projectListCHZ[i],
                                        c:Number((data.revenue[i]/100).toFixed(2))
                                    });
                                }
                                self.dataSet.forEach(function(el,index){
                                    if(index<5){
                                        rest-=el.c;
                                        if(index==0){
                                            self.charts.series[0].data.push({
                                                name:el.b,
                                                y:el.c,
                                                sliced: true,
                                                selected: true
                                            })
                                        }else {
                                            self.charts.series[0].data.push([el.b,el.c]);
                                        }
                                    }
                                })
                                if(rest!=0){
                                    self.charts.series[0].data.push(['其他',rest]);
                                }
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                        });
                    }
                }

                self.changeTermShow=function(){
                    self.term.forEach(function (el, index) {
                        el.show=!el.show;
                    })
                }

                self.changeOrderShow=function(){
                    self.order.forEach(function (el, index) {
                        el.show=!el.show;
                    })
                }

                self.changeRevenueShow=function(){
                    self.revenue.forEach(function (el, index) {
                        el.show=!el.show;
                    })
                }

                self.init = function() {
                    self.current=util.getParams('probabilityName');
                    self.indexNum=util.getParams('index');
                    self.showClass=true;
                    // self.myData={
                    //     "rescode": "200",
                    //     "projectListCHZ": [
                    //         "project1",
                    //         "project2",
                    //         "project3",
                    //         "project4",
                    //         "project5",
                    //         "project6",
                    //         "project7",
                    //         "project8",
                    //         "project9",
                    //         "project10"
                    //     ],
                    //     "totalCount": [
                    //         parseInt(Math.random()*100+300),
                    //         parseInt(Math.random()*100+300),
                    //         parseInt(Math.random()*100+300),
                    //         parseInt(Math.random()*100+300),
                    //         parseInt(Math.random()*100+300),
                    //         parseInt(Math.random()*100+300),
                    //         parseInt(Math.random()*100+300),
                    //         parseInt(Math.random()*100+300),
                    //         parseInt(Math.random()*100+300),
                    //         parseInt(Math.random()*100+300)
                    //     ],
                    //     "onlineCount": [
                    //         parseInt(Math.random()*50+250),
                    //         parseInt(Math.random()*50+250),
                    //         parseInt(Math.random()*50+250),
                    //         parseInt(Math.random()*50+250),
                    //         parseInt(Math.random()*50+250),
                    //         parseInt(Math.random()*50+250),
                    //         parseInt(Math.random()*50+250),
                    //         parseInt(Math.random()*50+250),
                    //         parseInt(Math.random()*50+250),
                    //         parseInt(Math.random()*50+250)
                    //     ],
                    //     "activeCount": [
                    //         parseInt(Math.random()*50+200),
                    //         parseInt(Math.random()*50+200),
                    //         parseInt(Math.random()*50+200),
                    //         parseInt(Math.random()*50+200),
                    //         parseInt(Math.random()*50+200),
                    //         parseInt(Math.random()*50+200),
                    //         parseInt(Math.random()*50+200),
                    //         parseInt(Math.random()*50+200),
                    //         parseInt(Math.random()*50+200),
                    //         parseInt(Math.random()*50+200)
                    //     ],
                    //     "payCount": [
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150)
                    //     ],
                    //     "newAddCount": [
                    //         parseInt(Math.random()*50),
                    //         parseInt(Math.random()*50),
                    //         parseInt(Math.random()*50),
                    //         parseInt(Math.random()*50),
                    //         parseInt(Math.random()*50),
                    //         parseInt(Math.random()*50),
                    //         parseInt(Math.random()*50),
                    //         parseInt(Math.random()*50),
                    //         parseInt(Math.random()*50),
                    //         parseInt(Math.random()*50)
                    //     ],
                    //     "activeTime": [
                    //         parseInt(Math.random()*350),
                    //         parseInt(Math.random()*350),
                    //         parseInt(Math.random()*350),
                    //         parseInt(Math.random()*350),
                    //         parseInt(Math.random()*350),
                    //         parseInt(Math.random()*350),
                    //         parseInt(Math.random()*350),
                    //         parseInt(Math.random()*350),
                    //         parseInt(Math.random()*350),
                    //         parseInt(Math.random()*350)
                    //     ],
                    //     "revenue": [
                    //         parseInt(Math.random()*1150),
                    //         parseInt(Math.random()*1150),
                    //         parseInt(Math.random()*1150),
                    //         parseInt(Math.random()*1150),
                    //         parseInt(Math.random()*1150),
                    //         parseInt(Math.random()*1150),
                    //         parseInt(Math.random()*1150),
                    //         parseInt(Math.random()*1150),
                    //         parseInt(Math.random()*1150),
                    //         parseInt(Math.random()*1150)
                    //     ],
                    //     "orderCount": [
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150),
                    //         parseInt(Math.random()*50+150)
                    //     ],
                    //     "errInfo": "None"
                    // }
                    if(self.indexNum<5){
                        self.charts = {
                            chart: {
                                type: 'bar'
                            },
                            title: {
                                text: ''
                            },
                            legend: {
                                backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
                            },
                            xAxis: {
                                categories:[],
                                tickPixelInterval: 5
                            },
                            yAxis: {
                                title: {
                                    text: '',  //y轴
                                    align:'high'
                                }
                            },
                            tooltip: {
                                shared: true,
                                valueSuffix: ''   //后缀
                            },
                            credits: {
                                enabled: false
                            },
                            plotOptions: {
                                areaspline: {
                                    fillOpacity: 0.5
                                },
                                series:
                                    {
                                        groupPadding:0.4,
                                        borderRadius: 4,
                                        colorByPoint: true,
                                    }
                            },
                            series: [
                                {
                                    name: '',
                                    data: []
                                }
                            ]
                        }
                    }else{
                        self.showClass=false;
                        self.charts = {
                            chart: {
                                plotBackgroundColor: null,
                                plotBorderWidth: null,
                                plotShadow: false
                            },
                            title: {
                                text: ''
                            },
                            tooltip: {
                                headerFormat: '{series.name}<br>',
                                pointFormat: '{point.name}: <b>{point.percentage:.1f}%</b>'
                            },
                            legend: {

                            },
                            credits: {
                                enabled: false
                            },
                            plotOptions: {
                                pie: {
                                    allowPointSelect: true,
                                    cursor: 'pointer',
                                    dataLabels: {
                                        enabled: true,
                                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                                        connectorColor: 'silver'
                                    },
                                    showInLegend: true
                                }
                            },
                            series: [{
                                type: 'pie',
                                name: '',
                                data: [
                                ]
                            }]
                        }
                    }
                    console.log('当前index：',self.indexNum);
                    self.loadChart(self.indexNum);
                    self.orderby = {};
                    self.orderby.desc = true;
                }

                /**
                 * 列表排序
                 * @param orderby
                 */
                self.changeOrderby = function (orderby) {
                    // self.orderby.sort = orderby;
                    self.desc = !self.desc;
                }

            }
        ])
})();
