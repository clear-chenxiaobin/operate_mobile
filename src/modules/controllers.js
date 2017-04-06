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

    .controller('loginController', ['$scope', '$http', '$state', '$filter', 'md5', 'util',
        function($scope, $http, $state, $filter, md5, util) {
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
                        self.getEditLangs();
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

            // $state.go('app');
        }
    ])


    .controller('appController', ['$http', '$scope', '$state', '$stateParams', '$q', 'util', 'CONFIG',
        function($http, $scope, $state, $stateParams, $q, util, CONFIG) {
            var self = this;
            self.init = function() {

                // 弹窗层
                self.maskUrl = '';
                self.maskParams = {};

                $scope.granularity = [
                    {id: 0, name: "小时"},
                    {id: 1, name: "日"},
                    {id: 2, name: "周"},
                    {id: 3, name: "月"},
                    {id: 4, name: "年"}
                ]
                $scope.getProject();
                $scope.durationList = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 24];
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

            $scope.dtSubstr = function(datetime, num) {
                switch (num) {
                    case 0:
                        return datetime.substring(5, 16);
                    case 1:
                        return datetime.substring(5, 10);
                    case 2:
                        return datetime.substring(5, 10);
                    case 3:
                        return datetime.substring(0, 7);
                    case 4:
                        return datetime.substring(0, 4);
                }
            }

            //获取项目列表
            $scope.getProject = function () {
                var deferred = $q.defer();

                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'realProjectNameList',
                })

                $http({
                    method: 'POST',
                    url: util.getApiUrl('v1/project', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        $scope.app.projectList = [];
                        $scope.app.projectList[0] = ({projectName: "all", projectNameCHZ: "所有项目"});
                        data.data.forEach(function (el) {
                            $scope.app.projectList.push({projectName: el.ProjectName, projectNameCHZ: el.ProjectNameCHZ})
                        });
                        $scope.app.selectProject = "all";

                        util.setParams('project', "all");

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
                    // self.loadingChart0 = false;
                });
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

            moment.locale('zh-cn');
            $scope.endDateBeforeRender = endDateBeforeRender;
            $scope.endDateOnSetTime = endDateOnSetTime;

            function endDateOnSetTime () {
                $scope.$broadcast('end-date-changed');
                self.loadChart();
            }

            function endDateBeforeRender ($dates) {
                if ($scope.dateRangeEnd) {
                    var activeDate = moment($scope.dateRangeEnd);

                    $dates.filter(function (date) {
                        return date.localDateValue() >= activeDate.valueOf()
                    }).forEach(function (date) {
                        date.selectable = false;
                    })
                }
            }

            self.init = function() {
                self.activerow = 0;

                $scope.dateRangeEnd = $filter('date')(new Date() + 1*24*60*60*1000, 'yyyy-MM-dd');
                self.searchDate = $filter('date')((new Date().getTime()), 'yyyy-MM-dd');
                self.selectGra = 1;
                self.isDate = true;

                self.selectDur = 7;

                self.loadChart();
            }

            /**
             * 更改tab
             * @param index
             */
            self.isCurrent = function(index){
                if (self.activerow != index) {
                    self.activerow = index;
                    self.loadChart();
                }
            }

            /**
             * 修改粒度
             */
            self.changeGra = function (value) {
                if (value == 0) {
                    self.isDate = false;
                    if (self.searchDate.length == 10) self.searchDate += " 00:00";
                } else {
                    self.isDate = true;
                    if (self.searchDate.length == 16) self.searchDate = self.searchDate.substring(0, 10);
                }
                self.loadChart();
            }

            /**
             * 切换项目
             * @param projectName
             */
            self.changeProject = function (projectName) {
                util.setParams('project', projectName);
                self.loadChart();
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

            self.loadChart = function () {
                var deferred = $q.defer();

                switch (self.activerow) {
                    case 0:
                        loadOnlineRate();
                        // loadActiveRate();
                        break;
                    case 1:
                        loadPayRate();
                        break;
                    case 2:
                        loadRevenue();
                        break;
                    case 3:
                        loadActiveDur();
                        break;
                }

                //获取开机率
                function loadOnlineRate() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getTermOnlineRateInfo',
                        endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                        project: [util.getParams("project")],
                        timespans: self.selectDur,
                        type: self.selectGra
                    })
                    self.loadingChart0 = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.th = ["日期", "开机率"];
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            data.timeList.forEach(function (el, index) {
                                if (index < 7) self.charts.xAxis.categories.push($scope.dtSubstr(el, self.selectGra));
                                self.dataSet.push({a: $scope.dtSubstr(el, self.selectGra)});
                            });

                            self.charts.series.push({name: "开机率", id: "series-0", data: [], tooltip: {valueSuffix: '%'}});
                            data.onlineRate.forEach(function (el, index) {
                                if (index < 7) self.charts.series[0].data.push(util.FloatMul(el, 100));
                                self.dataSet[index].b = util.FloatMul(el, 100) + "%";
                            });

                            deferred.resolve();
                        }
                        else {
                            alert(data.errInfo);
                            deferred.reject();
                        }
                        return deferred.promise;
                    }, function errorCallback(response) {
                        alert('连接服务器出错');
                        deferred.reject();
                    }).finally(function (value) {
                        // self.loadingChart0 = false;
                        loadActiveRate()
                    });
                }

                //获取活跃率
                function loadActiveRate() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getTermActiveRateInfo',
                        endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                        project: [util.getParams("project")],
                        timespans: self.selectDur,
                        type: self.selectGra
                    })
                    // self.loadingChart0 = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.th.push("活跃率");
                            self.charts.series.push({name: "活跃率", id: "series-1", data: [], tooltip: {valueSuffix: '%'}});
                            data.activeRate.forEach(function (el, index) {
                                if (index < 7) self.charts.series[1].data.push(util.FloatMul(el, 100));
                                self.dataSet[index].c = util.FloatMul(el, 100) + "%";
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
                        self.loadingChart0 = false;
                    });
                }


                //付费转化率
                function loadPayRate() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getPayRateInfo',
                        endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                        project: [util.getParams("project")],
                        timespans: self.selectDur,
                        type: self.selectGra
                    })
                    self.loadingChart1 = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.th = ["日期", "付费终端转化率", "付费次数转化率"];
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            data.timeList.forEach(function (el, index) {
                                if (index < 7) self.charts.xAxis.categories.push($scope.dtSubstr(el, self.selectGra));
                                self.dataSet.push({a: $scope.dtSubstr(el, self.selectGra)});
                            });

                            self.charts.series.push({name: "付费终端转化率", data: [], tooltip: {valueSuffix: '%'}});
                            data.payRate.forEach(function (el, index) {
                                if (index < 7) self.charts.series[0].data.push(util.FloatMul(el, 100));
                                self.dataSet[index].b = util.FloatMul(el, 100) + '%';
                            });

                            self.charts.series.push({name: "付费次数转化率", data: [], tooltip: {valueSuffix: '%'}});
                            data.payCountRate.forEach(function (el, index) {
                                if (index < 7) self.charts.series[1].data.push(util.FloatMul(el, 100));
                                self.dataSet[index].c = util.FloatMul(el, 100) + '%';
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
                        self.loadingChart1 = false;
                    });
                }

                //每终端营收
                function loadRevenue() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getPerTermRevenueInfo',
                        endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                        project: [util.getParams("project")],
                        timespans: self.selectDur,
                        type: self.selectGra
                    })
                    self.loadingChart2 = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.th = ["日期", "平均每终端营收"];
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            data.timeList.forEach(function (el, index) {
                                if (index < 7) self.charts.xAxis.categories.push($scope.dtSubstr(el, self.selectGra));
                                self.dataSet.push({a: $scope.dtSubstr(el, self.selectGra)});
                            });

                            self.charts.series.push({name: "平均每终端营收", data: [], tooltip: {valueSuffix: ' 元'}});
                            data.revenue.forEach(function (el, index) {
                                if (index < 7) self.charts.series[0].data.push(el);
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
                        self.loadingChart2 = false;
                    });
                }

                //获取平均活跃时长
                function loadActiveDur() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getPerTermActiveTimeInfo',
                        endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                        project: [util.getParams("project")],
                        timespans: self.selectDur,
                        type: self.selectGra
                    })
                    self.loadingChart3 = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.th = ["日期", "平均活跃时长"];
                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            data.timeList.forEach(function (el, index) {
                                if (index < 7) self.charts.xAxis.categories.push($scope.dtSubstr(el, self.selectGra));
                                self.dataSet.push({a: $scope.dtSubstr(el, self.selectGra)});
                            });

                            self.charts.series.push({name: "平均活跃时长", data: [], tooltip: {valueSuffix: ' 小时'}});
                            data.perActiveTime.forEach(function (el, index) {
                                if (index < 7) self.charts.series[0].data.push(Number((el / 3600).toFixed(2)));

                                var h = Math.floor(el / 3600);
                                var m = Math.floor((el - h * 3600) / 60);
                                var s = (el - h * 3600 - m * 60).toFixed(2);

                                self.dataSet[index].b = h + ":" + zeroFill(m) + ":" + zeroFill(s);
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
                        self.loadingChart3 = false;
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
        }

    ])

    //具体模块
    .controller('specificController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', '$q', 'util', 'CONFIG',
        function($http, $scope, $state, $location, $filter, $stateParams, $q, util, CONFIG) {
            var self = this;

            moment.locale('zh-cn');
            $scope.endDateBeforeRender = endDateBeforeRender;
            $scope.endDateOnSetTime = endDateOnSetTime;

            function endDateOnSetTime () {
                $scope.$broadcast('end-date-changed');
                self.loadChart();
            }

            function endDateBeforeRender ($dates) {
                if ($scope.dateRangeEnd) {
                    var activeDate = moment($scope.dateRangeEnd);

                    $dates.filter(function (date) {
                        return date.localDateValue() >= activeDate.valueOf()
                    }).forEach(function (date) {
                        date.selectable = false;
                    })
                }
            }

            self.init = function() {
                self.activerow = 0;
                self.term = [
                    {name: '累计终端', show: true, sort: '', desc: false},
                    {name: '上线终端', show: true, sort: '', desc: false},
                    {name: '活跃终端', show: true, sort: '', desc: false},
                    {name: '付费终端', show: false, sort: '', desc: false},
                    {name: '新增终端', show: false, sort: '', desc: false}
                ];
                self.countStatistics = [
                    {name: '付 费 次 数', show: true, sort: '', desc: false},
                    {name: '准付费次数', show: false, sort: '', desc: false},

                ];
                self.selectCount = 3;
                self.other = [
                    {name: '活跃时长', show: true, sort: '', desc: false},
                    {name: '西塘票务', show: false, sort: '', desc: false},
                ];

                $scope.dateRangeEnd = $filter('date')(new Date() + 1*24*60*60*1000, 'yyyy-MM-dd');
                self.searchDate = $filter('date')((new Date().getTime()), 'yyyy-MM-dd');
                self.selectGra = 1;
                self.isDate = true;

                self.selectDur = 7;

                self.loadChart();
                self.orderby = {};
                self.orderby.desc = false;
            }

            /**
             * 更改tab
             * @param index
             */
            self.isCurrent = function(index){
                if (self.activerow != index) {
                    self.activerow = index;
                    self.loadChart();
                }
            }

            /**
             * 切换项目
             * @param projectName
             */
            self.changeProject = function (projectName) {
                util.setParams('project', projectName);
                self.loadChart();
            }

            /**
             * 修改粒度
             */
            self.changeGra = function (value) {
                if (value == 0) {
                    self.isDate = false;
                    if (self.searchDate.length == 10) self.searchDate += " 00:00";
                } else {
                    self.isDate = true;
                    if (self.searchDate.length == 16) self.searchDate = self.searchDate.substring(0, 10);
                }
                self.loadChart();
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
                } else if (self.term[$index].show == false && self.selectCount < 3) {
                    self.selectCount++;
                } else {
                    alert('最多只能选择3组显示！');
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
            self.selectCountStatistics = function ($index) {
                if (self.countStatistics[$index].show == false) {
                    if ($index == 0) {
                        self.countStatistics[0].show = true;
                        self.countStatistics[1].show = false;
                    } else {
                        self.countStatistics[0].show = false;
                        self.countStatistics[1].show = true;
                    }

                }

                if (self.countStatistics[0].show == true) {
                    self.th = ["日期", "付费次数", "付费次数(单次)", "付费次数(打包)"];
                    self.charts.series = self.paySeries;
                    self.dataSet = self.payData;
                } else if (self.countStatistics[1].show == true) {
                    self.th = ["日期", "准付费次数", "准付费次数(单次)", "准付费次数(打包)"];
                    self.charts.series = self.wantPaySeries;
                    self.dataSet = self.wantPayData;
                }
            }

            /**
             * 选择其他指标
             * @param $index
             */
            self.selectOther = function ($index) {
                self.other.forEach(function (el) {
                    el.show = false;
                })
                self.other[$index].show = true;
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
            self.loadChart = function () {
                var deferred = $q.defer();

                switch (self.activerow) {
                    case 0:
                        loadTerm();
                        break;
                    case 1:
                        loadCount();
                        break;
                    case 2:
                        loadRevenue();
                        break;
                    case 3:
                        loadOther();
                        break;
                }

                /**
                 * 获取终端指标
                 */
                function loadTerm() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getTermStatisticsInfo',
                        endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                        project: [util.getParams("project")],
                        timespans: self.selectDur,
                        type: self.selectGra
                    })
                    self.loadingChart0 = true;

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
                                if (index < 7) self.charts.xAxis.categories.push($scope.dtSubstr(el, self.selectGra));
                                self.termData.push({a: $scope.dtSubstr(el, self.selectGra)});
                            });

                            self.termSeries.push({name: "累计终端", data: [], tooltip: {valueSuffix: ' 个'}});
                            data.addUpCount.forEach(function (el, index) {
                                if (index < 7) self.termSeries[0].data.push(el);
                                self.termData[index].b = el;
                            });

                            self.termSeries.push({name: "上线终端", data: [], tooltip: {valueSuffix: ' 个'}});
                            data.onlineCount.forEach(function (el, index) {
                                if (index < 7) self.termSeries[1].data.push(el);
                                self.termData[index].c = el;
                            });

                            self.termSeries.push({name: "活跃终端", data: [], tooltip: {valueSuffix: ' 个'}});
                            data.activeCount.forEach(function (el, index) {
                                if (index < 7) self.termSeries[2].data.push(el);
                                self.termData[index].d = el;
                            });

                            self.termSeries.push({name: "付费终端", data: []});
                            data.payCount.forEach(function (el, index) {
                                if (index < 7) self.termSeries[3].data.push(el);
                                self.termData[index].e = el;
                            });

                            self.termSeries.push({name: "新增终端", data: []});
                            data.newAddCount.forEach(function (el, index) {
                                if (index < 7) self.termSeries[4].data.push(el);
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
                        self.loadingChart0 = false;
                    });
                    return deferred.promise;
                }

                /**
                 * 获取次数统计
                 */
                function loadCount() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getPayCountStatisticsInfo',
                        endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                        project: [util.getParams("project")],
                        timespans: self.selectDur,
                        type: self.selectGra
                    })
                    self.loadingChart1 = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.wantPaySeries = [];
                            self.wantPayData = [];
                            self.paySeries = [];
                            self.payData = [];

                            self.dataSet = [];
                            self.charts.xAxis.categories = [];
                            self.charts.series = [];

                            data.timeList.forEach(function (el, index) {
                                if (index < 7) self.charts.xAxis.categories.push($scope.dtSubstr(el, self.selectGra));
                                self.wantPayData.push({a: $scope.dtSubstr(el, self.selectGra)});
                                self.payData.push({a: $scope.dtSubstr(el, self.selectGra)});
                            });

                            self.wantPaySeries.push({name: "准付费次数", id: "series-0", data: [], tooltip: {valueSuffix: ' 次'}});
                            data.wantPayCount.forEach(function (el, index) {
                                if (index < 7) self.wantPaySeries[0].data.push(el);
                                self.wantPayData[index].b = el;
                            });
                            self.wantPaySeries.push({name: "准付费次数(单次)", id: "series-1", data: [], tooltip: {valueSuffix: ' 次'}});
                            data.wantPaySingleCount.forEach(function (el, index) {
                                if (index < 7) self.wantPaySeries[1].data.push(el);
                                self.wantPayData[index].c= el;
                            });
                            self.wantPaySeries.push({name: "准付费次数(打包)", id: "series-2", data: [], tooltip: {valueSuffix: ' 次'}});
                            data.wantPayPackageCount.forEach(function (el, index) {
                                if (index < 7) self.wantPaySeries[2].data.push(el);
                                self.wantPayData[index].d= el;
                            });

                            self.paySeries.push({name: "付费次数", id: "series-0", data: [], tooltip: {valueSuffix: ' 次'}});
                            data.payCount.forEach(function (el, index) {
                                if (index < 7) self.paySeries[0].data.push(el);
                                self.payData[index].b = el;
                            });
                            self.paySeries.push({name: "付费次数(单次)", id: "series-1", data: [], tooltip: {valueSuffix: ' 次'}});
                            data.paySingleCount.forEach(function (el, index) {
                                if (index < 7) self.paySeries[1].data.push(el);
                                self.payData[index].c = el;
                            });
                            self.paySeries.push({name: "付费次数(打包)", id: "series-2", data: [], tooltip: {valueSuffix: ' 次'}});
                            data.payPackageCount.forEach(function (el, index) {
                                if (index < 7) self.paySeries[2].data.push(el);
                                self.payData[index].d = el;
                            });

                            if (self.countStatistics[0].show == true) {
                                self.th = ["日期", "付费次数", "付费次数(单次)", "付费次数(打包)"];
                                self.charts.series = self.paySeries;
                                self.dataSet = self.payData;
                            } else if (self.countStatistics[1].show == true) {
                                self.th = ["日期", "准付费次数", "准付费次数(单次)", "准付费次数(打包)"];
                                self.charts.series = self.wantPaySeries;
                                self.dataSet = self.wantPayData;
                            }
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
                        self.loadingChart1 = false;
                    });
                    return deferred.promise;
                }
                
                function loadRevenue() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getRevenueStatisticsInfo',
                        endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                        project: [util.getParams("project")],
                        timespans: self.selectDur,
                        type: self.selectGra
                    })
                    self.loadingChart2 = true;

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
                                if (index < 7) self.charts.xAxis.categories.push($scope.dtSubstr(el, self.selectGra));
                                self.dataSet.push({a: $scope.dtSubstr(el, self.selectGra)});
                            });

                            self.charts.series.push({name: "总收益", data: [], tooltip: {valueSuffix: ' 元'}});
                            data.totalMovieRevenue.forEach(function (el, index) {
                                if (index < 7) self.charts.series[0].data.push(el / 100);
                                self.dataSet[index].b = el / 100;
                            });
                            self.charts.series.push({name: "单次点播收益", data: [], tooltip: {valueSuffix: ' 元'}});
                            data.singleMovieRevenue.forEach(function (el, index) {
                                if (index < 7) self.charts.series[1].data.push(el / 100);
                                self.dataSet[index].c = el / 100;
                            });
                            self.charts.series.push({name: "打包点播收益", data: [], tooltip: {valueSuffix: ' 元'}});
                            data.packageMovieRevenue.forEach(function (el, index) {
                                if (index < 7) self.charts.series[2].data.push(el / 100);
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
                        self.loadingChart2 = false;
                    });
                    return deferred.promise;
                }

                function loadOther() {
                    var select = 0;
                    self.other.forEach(function (el, index) {
                        if (el.show == true) select = index;
                    })

                    switch (select) {
                        case 0:
                            loadActiveTime();
                            break;
                        // case 1:
                        //     LoadXitang();
                        //     break;
                    }

                    function loadActiveTime() {
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getActiveStatisticsInfo',
                            endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                            project: [util.getParams("project")],
                            timespans: self.selectDur,
                            type: self.selectGra
                        })
                        self.loadingChart3 = true;

                        $http({
                            method: 'POST',
                            url: util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response) {
                            var data = response.data;
                            if (data.rescode == '200') {
                                self.th = ["日期", "活跃时长", "活跃终端数"];
                                self.dataSet = [];
                                self.charts.xAxis.categories = [];
                                self.charts.series = [];

                                data.timeList.forEach(function (el, index) {
                                    if (index < 7) self.charts.xAxis.categories.push($scope.dtSubstr(el, self.selectGra));
                                    self.dataSet.push({a: $scope.dtSubstr(el, self.selectGra)});
                                });

                                self.charts.series.push({name: "活跃时长", data: [], tooltip: {valueSuffix: ' 小时'}});
                                data.totalActiveTime.forEach(function (el, index) {
                                    if (index < 7) self.charts.series[0].data.push(Number((el / 3600).toFixed(2)));

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
                                // self.charts.series.push({name: "活跃终端数", type: 'spline', data: [], tooltip: {valueSuffix: ' 个'}});
                                data.activeCount.forEach(function (el, index) {
                                    // if (index < 5)self.charts.series[1].data.push(el);
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
                            self.loadingChart3 = false;
                        });
                        return deferred.promise;
                    }
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
        }

    ])
})();
