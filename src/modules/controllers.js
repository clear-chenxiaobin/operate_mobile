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

            //获取项目列表
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
        }
    ])


    .controller('appController', ['$http', '$scope', '$state', '$stateParams', '$q', '$filter', '$location', '$sessionStorage', 'util', 'CONFIG',
        function($http, $scope, $state, $stateParams, $q, $filter, $location, $sessionStorage, util, CONFIG) {
            var self = this;
            self.init = function() {

                // 弹窗层
                self.maskUrl = '';
                self.maskParams = {};

                $scope.granularity = [
                    {id: 0, name: "日"},
                    {id: 1, name: "周"},
                    {id: 2, name: "月"},
                    {id: 3, name: "年"}
                ]

                $scope.dateRangeStart = $filter('date')(new Date(), 'yyyy-MM-dd');
                $scope.dateRangeEnd = $filter('date')(new Date(), 'yyyy-MM-dd');
                $scope.showDate = false;
                $scope.category = 0;
                $scope.dateType = 0;

                if (util.getProjectIds() == undefined || $sessionStorage.revenueProjects == undefined) {
                    alert('访问超时，请重新登录');
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
                $scope.app.showHideMask(true,'pages/project.html');
            }
        }
    ])

    //选择项目
    .controller('projectController', ['$scope', '$state', '$stateParams', '$sessionStorage', 'util', 'CONFIG',
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
                if ($scope.category == 4) {
                    $scope.showDate = true;
                } else {
                    $scope.showDate = false;
                }
                self.loadData();
            }

            /**
             * 修改粒度
             */
            self.changeGra = function (value) {
                if (value == 0) {
                } else {
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
                legend: {
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'top',
                    x: 0,
                    y: 0,
                    floating: true,
                    borderWidth: 1,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
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
                        fillOpacity: 0.5
                    }
                },
                series: []
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
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getTermOnlineRateInfo',
                        StartTime: $scope.dateRangeStart + " 00:00:00",
                        EndTime: $scope.dateRangeEnd + " 00:00:00",
                        project: util.getProjectIds(),
                        type: $scope.showDate == false ? 0 : 1,
                        category: $scope.showDate == false ? $scope.category : $scope.dateType
                    })
                    self.loadingChart = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.th = ["日期", "上线终端", "累计终端", "开机率"];
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            data.timeList.forEach(function (el, index) {
                                self.charts.xAxis.categories.push(self.dtSubstr(el));
                                self.dataSet.push({a: self.dtSubstr(el)});
                            });

                            data.onlineCount.forEach(function (el, index) {
                                self.dataSet[index].b = el;
                            });

                            data.totalCount.forEach(function (el, index) {
                                self.dataSet[index].c = el;
                            });

                            self.charts.series.push({name: "开机率", id: "series-0", data: [], tooltip: {valueSuffix: '%'}});
                            data.onlineRate.forEach(function (el, index) {
                                self.charts.series[0].data.push(util.FloatMul(el, 100));
                                self.dataSet[index].d = util.FloatMul(el, 100) + "%";
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
                        self.loadingChart = false;
                    });
                }

                //获取活跃率
                function loadActiveRate() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getTermActiveRateInfo',
                        StartTime: $scope.dateRangeStart + " 00:00:00",
                        EndTime: $scope.dateRangeEnd + " 00:00:00",
                        project: util.getProjectIds(),
                        type: $scope.showDate == false ? 0 : 1,
                        category: $scope.showDate == false ? $scope.category : $scope.dateType
                    })
                    self.loadingChart = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.th = ["日期", "活跃终端", "上线终端", "活跃率"];
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            data.timeList.forEach(function (el, index) {
                                self.charts.xAxis.categories.push(self.dtSubstr(el));
                                self.dataSet.push({a: self.dtSubstr(el)});
                            });

                            data.activeCount.forEach(function (el, index) {
                                self.dataSet[index].b = el;
                            });

                            data.onlineCount.forEach(function (el, index) {
                                self.dataSet[index].c = el;
                            });

                            self.charts.series.push({name: "活跃率", id: "series-0", data: [], tooltip: {valueSuffix: '%'}});
                            data.activeRate.forEach(function (el, index) {
                                self.charts.series[0].data.push(util.FloatMul(el, 100));
                                self.dataSet[index].d = util.FloatMul(el, 100) + "%";
                            });

                            deferred.resolve();
                        }
                        else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        self.loadingChart = false;
                    });
                }


                //付费转化率
                function loadPayRate() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getTermPayRateInfo',
                        StartTime: $scope.dateRangeStart + " 00:00:00",
                        EndTime: $scope.dateRangeEnd + " 00:00:00",
                        project: util.getProjectIds(),
                        type: $scope.showDate == false ? 0 : 1,
                        category: $scope.showDate == false ? $scope.category : $scope.dateType
                    })
                    self.loadingChart = true;

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

                            data.timeList.forEach(function (el, index) {
                                self.charts.xAxis.categories.push(self.dtSubstr(el));
                                self.dataSet.push({a: self.dtSubstr(el)});
                            });

                            data.payCount.forEach(function (el, index) {
                                self.dataSet[index].b = el;
                            });

                            data.activeCount.forEach(function (el, index) {
                                self.dataSet[index].c = el;
                            });

                            self.charts.series.push({name: "终端付费转化率", data: [], tooltip: {valueSuffix: '%'}});
                            data.payRate.forEach(function (el, index) {
                                self.charts.series[0].data.push(util.FloatMul(el, 100));
                                self.dataSet[index].d = util.FloatMul(el, 100) + '%';
                            });

                            deferred.resolve();
                        }
                        else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        self.loadingChart = false;
                    });
                }

                //每终端营收
                function loadRevenue() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getPerTermRevenueInfo',
                        StartTime: $scope.dateRangeStart + " 00:00:00",
                        EndTime: $scope.dateRangeEnd + " 00:00:00",
                        project: util.getProjectIds(),
                        type: $scope.showDate == false ? 0 : 1,
                        category: $scope.showDate == false ? $scope.category : $scope.dateType
                    })
                    self.loadingChart = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.th = ["日期", "总营收", "总终端数", "平均营收"];
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            data.timeList.forEach(function (el, index) {
                                self.charts.xAxis.categories.push(self.dtSubstr(el));
                                self.dataSet.push({a: self.dtSubstr(el)});
                            });

                            data.totalMoney.forEach(function (el, index) {
                                self.dataSet[index].b = el;
                            });

                            data.onlineCount.forEach(function (el, index) {
                                self.dataSet[index].c = el;
                            });

                            self.charts.series.push({name: "平均每终端营收", data: [], tooltip: {valueSuffix: ' 元'}});
                            data.revenue.forEach(function (el, index) {
                                self.charts.series[0].data.push(el);
                                self.dataSet[index].d = el;
                            });

                            deferred.resolve();
                        }
                        else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        self.loadingChart = false;
                    });
                }

                //获取平均活跃时长
                function loadActiveDur() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getPerTermActiveTimeInfo',
                        StartTime: $scope.dateRangeStart + " 00:00:00",
                        EndTime: $scope.dateRangeEnd + " 00:00:00",
                        project: util.getProjectIds(),
                        type: $scope.showDate == false ? 0 : 1,
                        category: $scope.showDate == false ? $scope.category : $scope.dateType
                    })
                    self.loadingChart = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.th = ["日期", "总活跃时长", "总终端数", "平均活跃时长"];
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            data.timeList.forEach(function (el, index) {
                                self.charts.xAxis.categories.push(self.dtSubstr(el));
                                self.dataSet.push({a: self.dtSubstr(el)});
                            });

                            data.activeTime.forEach(function (el, index) {
                                self.dataSet[index].b = el;
                            });

                            data.activeCount.forEach(function (el, index) {
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
                        }
                        else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        self.loadingChart = false;
                    });
                }

                return deferred.promise;
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
                if ($scope.showDate == false) {
                    switch ($scope.category) {
                        case 0:
                            return datetime.substring(5, 16);
                        case 1:
                            return datetime.substring(5, 10);
                        case 2:
                            return datetime.substring(5, 10);
                        case 3:
                            return datetime.substring(0, 7);
                    }
                } else {
                    switch ($scope.dateType) {
                        case 0:
                            return datetime.substring(5, 10);
                        case 1:
                            return datetime.substring(5, 10);
                        case 2:
                            return datetime.substring(5, 7);
                        case 3:
                            return datetime.substring(0, 4);
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
                self.countStatistics = [
                    {name: '总', show: true, sort: '', desc: false},
                    {name: '单次', show: false, sort: '', desc: false},
                    {name: '打包', show: false, sort: '', desc: false}

                ];
                self.selectCount = 3;
                self.active = [
                    {name: '活跃时长', show: true, sort: '', desc: false},
                    {name: '活跃终端', show: false, sort: '', desc: false},
                    {name: '营 收 额', show: false, sort: '', desc: false},
                    {name: '活跃区间', show: false, sort: '', desc: false}
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
                if ($scope.category == 4) {
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
                legend: {
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'top',
                    x: 0,
                    y: 0,
                    floating: true,
                    borderWidth: 1,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
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
                        fillOpacity: 0.5
                    }
                },
                series: []
            }

            /**
             * 加载数据
             * @returns {jQuery.promise|IPromise<T>|promise|((target?:any)=>JQueryPromise<T>)|((type?:string, target?:Object)=>JQueryPromise<any>)|*}
             */
            self.loadData = function () {
                var deferred = $q.defer();

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
                        loadActive();
                        break;
                    case 4:
                        loadOD();
                        break;
                }

                /**
                 * 获取终端指标
                 */
                function loadTerm() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getTermStatisticsInfo',
                        StartTime: $scope.dateRangeStart + " 00:00:00",
                        EndTime: $scope.dateRangeEnd + " 00:00:00",
                        project: util.getProjectIds(),
                        type: $scope.showDate == false ? 0 : 1,
                        category: $scope.showDate == false ? $scope.category : $scope.dateType
                    })
                    self.loadingChart = true;

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
                        }
                        else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        self.loadingChart = false;
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
                            action = "getAllOrderCountStatisticsInfo";
                            self.th = ["日期", "单次下单数", "单次支付数", "转化率"];
                            break;
                        case 2:
                            action = "getAllOrderCountStatisticsInfo";
                            self.th = ["日期", "打包下单数", "打包支付数", "转化率"];
                            break;
                        default:
                            action = "getAllOrderCountStatisticsInfo";
                            self.th = ["日期", "总下单数", "总支付数", "转化率"];
                            break;
                    }

                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: action,
                        StartTime: $scope.dateRangeStart + " 00:00:00",
                        EndTime: $scope.dateRangeEnd + " 00:00:00",
                        project: util.getProjectIds(),
                        type: $scope.showDate == false ? 0 : 1,
                        category: $scope.showDate == false ? $scope.category : $scope.dateType
                    })
                    self.loadingChart = true;

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
                                self.dataSet[index].d = el;
                            });

                            deferred.resolve();
                        }
                        else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        self.loadingChart = false;
                    });

                    return deferred.promise;
                }

                /**
                 * 获取营收
                 * @returns {jQuery.promise|promise|IPromise<T>|((target?:any)=>JQueryPromise<T>)|((type?:string, target?:Object)=>JQueryPromise<any>)|Promise|*}
                 */
                function loadRevenue() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getRevenueStatisticsInfo',
                        StartTime: $scope.dateRangeStart + " 00:00:00",
                        EndTime: $scope.dateRangeEnd + " 00:00:00",
                        project: util.getProjectIds(),
                        type: $scope.showDate == false ? 0 : 1,
                        category: $scope.showDate == false ? $scope.category : $scope.dateType
                    })
                    self.loadingChart = true;

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
                        }
                        else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        self.loadingChart = false;
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

                    if (select == 0 || select == 1 || select == 2) {
                        loadActiveTime();
                    } else if (select == 3) {
                        loadActiveTimeInterval();
                    }

                    function loadActiveTime() {
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getActiveStatisticsInfo',
                            StartTime: $scope.dateRangeStart + " 00:00:00",
                            EndTime: $scope.dateRangeEnd + " 00:00:00",
                            project: util.getProjectIds(),
                            type: $scope.showDate == false ? 0 : 1,
                            category: $scope.showDate == false ? $scope.category : $scope.dateType
                        })
                        self.loadingChart = true;

                        $http({
                            method: 'POST',
                            url: util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response) {
                            var data = response.data;
                            if (data.rescode == '200') {
                                self.activeSeries0 = [];
                                self.activeSeries1 = [];

                                self.th = ["日期", "活跃时长", "活跃终端数"];
                                self.dataSet = [];
                                self.charts.xAxis.categories = [];
                                self.charts.series = [];

                                data.timeList.forEach(function (el, index) {
                                    self.charts.xAxis.categories.push(self.dtSubstr(el));
                                    self.dataSet.push({a: self.dtSubstr(el)});
                                });

                                self.activeSeries0.push({
                                    name: "活跃时长",
                                    id: "series-0",
                                    data: [],
                                    tooltip: {valueSuffix: ' 小时'}
                                });
                                data.totalActiveTime.forEach(function (el, index) {
                                    self.activeSeries0[0].data.push(Number((el / 3600).toFixed(2)));

                                    var h = Math.floor(el / 3600);
                                    var m = Math.floor((el - h * 3600) / 60);
                                    var s = el - h * 3600 - m * 60;

                                    self.dataSet[index].b = h + ":" + zeroFill(m) + ":" + zeroFill(s);
                                    function zeroFill(data) {
                                        if (data < 10) {
                                            data = "0" + data;
                                        }
                                        return data;
                                    }
                                });
                                self.activeSeries1.push({
                                    name: "活跃终端数",
                                    id: "series-0",
                                    data: [],
                                    tooltip: {valueSuffix: ' 个'}
                                });
                                data.activeCount.forEach(function (el, index) {
                                    self.activeSeries1[0].data.push(el);
                                    self.dataSet[index].c = el;
                                });

                                if (self.active[0].show == true) {
                                    self.charts.series = self.activeSeries0;
                                } else if (self.active[1].show == true) {
                                    self.charts.series = self.activeSeries1;
                                }
                                // else if (self.active[2].show == true) {
                                //     self.charts.series = self.activeSeries2;
                                // }
                                deferred.resolve();
                            }
                            else {
                                alert(data.errInfo);
                                deferred.reject();
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                            self.loadingChart = false;
                        });
                    }

                    function loadActiveTimeInterval() {
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getTermCountBySpanActiveTime',
                            StartTime: $scope.dateRangeStart + " 00:00:00",
                            EndTime: $scope.dateRangeEnd + " 00:00:00",
                            project: util.getProjectIds(),
                            type: $scope.showDate == false ? 0 : 1,
                            category: $scope.showDate == false ? $scope.category : $scope.dateType
                        })
                        self.loadingChart = true;

                        $http({
                            method: 'POST',
                            url: util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response) {
                            var data = response.data;
                            if (data.rescode == '200') {
                                self.th = ["时间区间", "区间活跃终端数", "占比"];
                                self.dataSet = [];
                                self.charts.xAxis.categories = [];
                                self.charts.series = [];

                                data.timeList.forEach(function (el, index) {
                                    self.charts.xAxis.categories.push(self.dtSubstr(el));
                                    self.dataSet.push({a: self.dtSubstr(el)});
                                });

                                self.activeSeries0.push({
                                    name: "活跃时长",
                                    id: "series-0",
                                    data: [],
                                    tooltip: {valueSuffix: ' 小时'}
                                });
                                data.totalActiveTime.forEach(function (el, index) {
                                    self.activeSeries0[0].data.push(Number((el / 3600).toFixed(2)));

                                    var h = Math.floor(el / 3600);
                                    var m = Math.floor((el - h * 3600) / 60);
                                    var s = el - h * 3600 - m * 60;

                                    self.dataSet[index].b = h + ":" + zeroFill(m) + ":" + zeroFill(s);
                                    function zeroFill(data) {
                                        if (data < 10) {
                                            data = "0" + data;
                                        }
                                        return data;
                                    }
                                });
                                self.activeSeries1.push({
                                    name: "活跃终端数",
                                    id: "series-0",
                                    data: [],
                                    tooltip: {valueSuffix: ' 个'}
                                });
                                data.activeCount.forEach(function (el, index) {
                                    self.activeSeries1[0].data.push(el);
                                    self.dataSet[index].c = el;
                                });

                                deferred.resolve();
                            }
                            else {
                                alert(data.errInfo);
                                deferred.reject();
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                            self.loadingChart = false;
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
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getTopNByMovieCount',
                            StartTime: $scope.dateRangeStart + " 00:00:00",
                            EndTime: $scope.dateRangeEnd + " 00:00:00",
                            top: 10,
                            project: util.getProjectIds(),
                            type: $scope.showDate == false ? 0 : 1,
                            category: $scope.showDate == false ? $scope.category : $scope.dateType
                        })
                        self.loadingChart = true;

                        $http({
                            method: 'POST',
                            url: util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response) {
                            var data = response.data;
                            if (data.rescode == '200') {
                                self.th = ["电影", "点播量"];
                                self.dataSet = [];
                                self.charts.xAxis.categories = [];
                                self.charts.series = [];

                                data.movieNameCHZ.forEach(function (el, index) {
                                    self.charts.xAxis.categories.push(el);
                                    self.dataSet.push({a: el});
                                });

                                self.charts.series.push({name: "点播量", data: [], tooltip: {valueSuffix: '次'}});
                                data.count.forEach(function (el, index) {
                                    self.charts.series[0].data.push(el);
                                    self.dataSet[index].b = el;
                                });

                                deferred.resolve();
                            }
                            else {
                                alert(data.errInfo);
                                deferred.reject();
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                            self.loadingChart = false;
                        });
                    }

                    function loadODRevenue() {
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getTopNByMovieRevenue',
                            StartTime: $scope.dateRangeStart + " 00:00:00",
                            EndTime: $scope.dateRangeEnd + " 00:00:00",
                            top: 10,
                            project: util.getProjectIds(),
                            type: $scope.showDate == false ? 0 : 1,
                            category: $scope.showDate == false ? $scope.category : $scope.dateType
                        })
                        self.loadingChart = true;

                        $http({
                            method: 'POST',
                            url: util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response) {
                            var data = response.data;
                            if (data.rescode == '200') {
                                self.th = ["电影", "营收金额"];
                                self.dataSet = [];
                                self.charts.xAxis.categories = [];
                                self.charts.series = [];

                                data.movieNameCHZ.forEach(function (el, index) {
                                    self.charts.xAxis.categories.push(el);
                                    self.dataSet.push({a: el});
                                });

                                self.charts.series.push({name: "营收金额", data: [], tooltip: {valueSuffix: '元'}});
                                data.price.forEach(function (el, index) {
                                    self.charts.series[0].data.push(el / 100);
                                    self.dataSet[index].b = el / 100;
                                });

                                deferred.resolve();
                            }
                            else {
                                alert(data.errInfo);
                                deferred.reject();
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                            deferred.reject();
                        }).finally(function (value) {
                            self.loadingChart = false;
                        });
                    }

                    return deferred.promise;
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
                    if ($scope.showDate == false) {
                        switch ($scope.category) {
                            case 0:
                                return datetime.substring(5, 16);
                            case 1:
                                return datetime.substring(5, 10);
                            case 2:
                                return datetime.substring(5, 10);
                            case 3:
                                return datetime.substring(0, 7);
                        }
                    } else {
                        switch ($scope.dateType) {
                            case 0:
                                return datetime.substring(5, 10);
                            case 1:
                                return datetime.substring(5, 10);
                            case 2:
                                return datetime.substring(5, 7);
                            case 3:
                                return datetime.substring(0, 4);
                        }
                    }
                }
            }
        }

    ])
})();
