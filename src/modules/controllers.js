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


    .controller('appController', ['$http', '$scope', '$state', '$stateParams', 'util', 'CONFIG',
        function($http, $scope, $state, $stateParams, util, CONFIG) {
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

                $scope.durationList = [3, 4, 5, 6, 7, 8, 8, 10, 11, 12, 24];
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
        }
    ])

    //HOME
    .controller('homeController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', '$q', 'util', 'CONFIG',
        function($http, $scope, $state, $location, $filter, $stateParams, $q, util, CONFIG) {
            var self = this;
            self.init = function() {
                self.getProject();
            }

            self.logout = function() {
                util.setParams('token', '');
                $state.go('login');
            }

            self.getProject = function () {
                var deferred = $q.defer();

                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'projectList',
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
                    self.loadingChart0 = false;
                });
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
                self.term = [
                    {name: '累计终端', value: true, sort: '', desc: false},
                    {name: '上线终端', value: true, sort: '', desc: false},
                    {name: '活跃终端', value: true, sort: '', desc: false},
                ];
                self.activerow = 0;

                $scope.dateRangeEnd = $filter('date')(new Date(), 'yyyy-MM-dd');
                self.searchDate = $filter('date')((new Date().getTime()), 'yyyy-MM-dd');
                self.selectGra0 = 1;
                self.selectGra1 = 1;
                self.selectGra2 = 1;
                self.selectGra3 = 1;
                self.isDate = [true, true, true, true];

                self.selectDur0 = 7;
                self.selectDur1 = 7;
                self.selectDur2 = 7;
                self.selectDur3 = 7;

                self.initCharts();
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
            self.changeGra = function (value, index) {
                if (value == 0) {
                    self.isDate[index] = false;
                    if (self.searchDate.length == 10) self.searchDate += " 00:00";
                } else {
                    self.isDate[index] = true;
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

            /**
             * 初始化图表
             */
            self.initCharts = function () {
                self.attrs0 = {
                    "caption": "",
                    "xAxisname": "时间",
                    "yAxisName": "开机率",
                    "numberPrefix": "",                      //前缀
                    "numberSuffix": "%",                     //后缀
                    "plotFillAlpha" : "60",

                    //Cosmetics
                    "paletteColors" : "#0075c2,#1aaf5d",
                    "baseFontColor" : "#333333",
                    "baseFont" : "Helvetica Neue,Arial",
                    "captionFontSize" : "14",
                    "subcaptionFontSize" : "14",
                    "subcaptionFontBold" : "0",
                    "showBorder" : "0",
                    "bgColor" : "#ffffff",
                    "showShadow" : "0",
                    "showValues": "0",
                    "canvasBgColor" : "#ffffff",
                    "canvasBorderAlpha" : "0",
                    "divlineAlpha" : "100",
                    "divlineColor" : "#999999",
                    "divlineThickness" : "1",
                    "divLineIsDashed" : "1",
                    "divLineDashLen" : "1",
                    "divLineGapLen" : "1",
                    "usePlotGradientColor" : "0",
                    "showplotborder" : "0",
                    "valueFontColor" : "#000000",
                    "placeValuesInside" : "1",
                    "showHoverEffect" : "1",
                    "rotateValues" : "0",
                    "showXAxisLine" : "1",
                    "xAxisLineThickness" : "1",
                    "xAxisLineColor" : "#999999",
                    "showAlternateHGridColor" : "0",
                    "legendBgAlpha" : "0",
                    "legendBorderAlpha" : "0",
                    "legendShadow" : "0",
                    "legendItemFontSize" : "10",
                    "legendItemFontColor" : "#666666"
                };
                self.categories0 = [
                    {
                        "category": []
                    }
                ];
                self.dataset0 = [];

                self.attrs1 = {
                    "caption": "",
                    "xAxisname": "时间",
                    "yAxisName": "活跃率",
                    "numberPrefix": "",                      //前缀
                    "numberSuffix": "%",                   //后缀
                    "plotFillAlpha" : "60",

                    //Cosmetics
                    "paletteColors" : "#0075c2,#1aaf5d",
                    "baseFontColor" : "#333333",
                    "baseFont" : "Helvetica Neue,Arial",
                    "captionFontSize" : "14",
                    "subcaptionFontSize" : "14",
                    "subcaptionFontBold" : "0",
                    "showBorder" : "0",
                    "bgColor" : "#ffffff",
                    "showShadow" : "0",
                    "showValues": "0",
                    "canvasBgColor" : "#ffffff",
                    "canvasBorderAlpha" : "0",
                    "divlineAlpha" : "100",
                    "divlineColor" : "#999999",
                    "divlineThickness" : "1",
                    "divLineIsDashed" : "1",
                    "divLineDashLen" : "1",
                    "divLineGapLen" : "1",
                    "usePlotGradientColor" : "0",
                    "showplotborder" : "0",
                    "valueFontColor" : "#000000",
                    "placeValuesInside" : "1",
                    "showHoverEffect" : "1",
                    "rotateValues" : "0",
                    "showXAxisLine" : "1",
                    "xAxisLineThickness" : "1",
                    "xAxisLineColor" : "#999999",
                    "showAlternateHGridColor" : "0",
                    "legendBgAlpha" : "0",
                    "legendBorderAlpha" : "0",
                    "legendShadow" : "0",
                    "legendItemFontSize" : "10",
                    "legendItemFontColor" : "#666666"
                };
                self.categories1 = [
                    {
                        "category": []
                    }
                ];
                self.dataset1 = [];

                self.attrs2 = {
                    "caption": "",
                    "xAxisname": "时间",
                    "yAxisName": "付费转化率",
                    "numberPrefix": "",                     //前缀
                    "numberSuffix": "%",                   //后缀
                    "plotFillAlpha" : "60",

                    //Cosmetics
                    "paletteColors" : "#0075c2,#1aaf5d",
                    "baseFontColor" : "#333333",
                    "baseFont" : "Helvetica Neue,Arial",
                    "captionFontSize" : "14",
                    "subcaptionFontSize" : "14",
                    "subcaptionFontBold" : "0",
                    "showBorder" : "0",
                    "bgColor" : "#ffffff",
                    "showShadow" : "0",
                    "showValues": "0",
                    "canvasBgColor" : "#ffffff",
                    "canvasBorderAlpha" : "0",
                    "divlineAlpha" : "100",
                    "divlineColor" : "#999999",
                    "divlineThickness" : "1",
                    "divLineIsDashed" : "1",
                    "divLineDashLen" : "1",
                    "divLineGapLen" : "1",
                    "usePlotGradientColor" : "0",
                    "showplotborder" : "0",
                    "valueFontColor" : "#000000",
                    "placeValuesInside" : "1",
                    "showHoverEffect" : "1",
                    "rotateValues" : "0",
                    "showXAxisLine" : "1",
                    "xAxisLineThickness" : "1",
                    "xAxisLineColor" : "#999999",
                    "showAlternateHGridColor" : "0",
                    "legendBgAlpha" : "0",
                    "legendBorderAlpha" : "0",
                    "legendShadow" : "0",
                    "legendItemFontSize" : "10",
                    "legendItemFontColor" : "#666666"
                };
                self.categories2 = [
                    {
                        "category": []
                    }
                ];
                self.dataset2 = [];

                self.attrs3 = {
                    "caption": "",
                    "xAxisname": "时间",
                    "yAxisName": "平均每终端营收",
                    "numberPrefix": "",                 //前缀
                    "numberSuffix": "元",                   //后缀
                    "plotFillAlpha" : "60",

                    //Cosmetics
                    "paletteColors" : "#0075c2,#1aaf5d",
                    "baseFontColor" : "#333333",
                    "baseFont" : "Helvetica Neue,Arial",
                    "captionFontSize" : "14",
                    "subcaptionFontSize" : "14",
                    "subcaptionFontBold" : "0",
                    "showBorder" : "0",
                    "bgColor" : "#ffffff",
                    "showShadow" : "0",
                    "showValues": "0",
                    "canvasBgColor" : "#ffffff",
                    "canvasBorderAlpha" : "0",
                    "divlineAlpha" : "100",
                    "divlineColor" : "#999999",
                    "divlineThickness" : "1",
                    "divLineIsDashed" : "1",
                    "divLineDashLen" : "1",
                    "divLineGapLen" : "1",
                    "usePlotGradientColor" : "0",
                    "showplotborder" : "0",
                    "valueFontColor" : "#000000",
                    "placeValuesInside" : "1",
                    "showHoverEffect" : "1",
                    "rotateValues" : "0",
                    "showXAxisLine" : "1",
                    "xAxisLineThickness" : "1",
                    "xAxisLineColor" : "#999999",
                    "showAlternateHGridColor" : "0",
                    "legendBgAlpha" : "0",
                    "legendBorderAlpha" : "0",
                    "legendShadow" : "0",
                    "legendItemFontSize" : "10",
                    "legendItemFontColor" : "#666666"
                };
                self.categories3 = [
                    {
                        "category": []
                    }
                ];
                self.dataset3 = [];
            }

            self.loadChart = function () {
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
                }

                //获取开机率
                function loadOnlineRate() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getTermOnlineRateInfo',
                        endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                        project: [util.getParams("project")],
                        timespans: self.selectDur0,
                        type: self.selectGra0
                    })
                    self.loadingChart0 = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.dataset0 = [];
                            self.dataSet0 = [];
                            self.categories0[0].category = [];

                            data.timeList.forEach(function (el, index) {
                                if (index < 7) self.categories0[0].category.push({label: $scope.dtSubstr(el, self.selectGra0)});
                                self.dataSet0.push({datetime: $scope.dtSubstr(el, self.selectGra0)});
                            });

                            self.dataset0.push({seriesname: "开机率", data: []});
                            data.onlineRate.forEach(function (el, index) {
                                if (index < 7) self.dataset0[0].data.push({value: el * 100});
                                self.dataSet0[index].onlineRate = el * 100 + '%';
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


                //获取累计终端和上线终端
                // var data = JSON.stringify({
                //     token: util.getParams("token"),
                //     action: 'getTermStatisticsInfo',
                //     endTime: $filter('date')((new Date().getTime()), 'yyyy-MM-dd HH:mm:ss'),
                //     project: ["all"],
                //     timespans: 7,
                //     type: 2
                // })
                // self.loadingChart0 = true;
                //
                // $http({
                //     method: 'POST',
                //     url: util.getApiUrl('v2/statistics', '', 'server'),
                //     data: data
                // }).then(function successCallback(response) {
                //     var data = response.data;
                //     if (data.rescode == '200') {
                //         data.addUpCount.forEach(function (el, index) {
                //             self.dataSet[index].addUpCount = el;
                //         });
                //
                //         data.onlineCount.forEach(function (el, index) {
                //             self.dataSet[index].onlineCount = el;
                //         });
                //
                //         deferred.resolve();
                //     }
                //     else {
                //         alert(data.errInfo);
                //         deferred.reject();
                //     }
                // }, function errorCallback(response) {
                //     alert('连接服务器出错');
                //     deferred.reject();
                // }).finally(function (value) {
                //     self.loadingChart0 = false;
                // });
                // return deferred.promise;

                //获取活跃率
                function loadActiveRate() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getTermActiveRateInfo',
                        endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                        project: [util.getParams("project")],
                        timespans: self.selectDur1,
                        type: self.selectGra1
                    })
                    self.loadingChart1 = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.dataset1 = [];
                            self.dataSet1 = [];
                            self.categories1[0].category = [];
                            data.timeList.forEach(function (el, index) {
                                if (index < 7) self.categories1[0].category.push({label: $scope.dtSubstr(el, self.selectGra1)});
                                self.dataSet1.push({datetime: $scope.dtSubstr(el, self.selectGra1)});
                            });

                            self.dataset1.push({seriesname: "活跃率", data: []});
                            data.activeRate.forEach(function (el, index) {
                                if (index < 7) self.dataset1[0].data.push({value: el * 100});
                                self.dataSet1[index].activeRate = el * 100 + '%';
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


                //付费转化率
                function loadPayRate() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getTermPayRateInfo',
                        endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                        project: [util.getParams("project")],
                        timespans: self.selectDur2,
                        type: self.selectGra2
                    })
                    self.loadingChart2 = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.dataset2 = [];
                            self.dataSet2 = [];
                            self.categories2[0].category = [];
                            data.timeList.forEach(function (el, index) {
                                if (index < 7) self.categories2[0].category.push({label: $scope.dtSubstr(el, self.selectGra2)});
                                self.dataSet2.push({datetime: $scope.dtSubstr(el, self.selectGra2)});
                            });

                            self.dataset2.push({seriesname: "付费转化率", data: []});
                            data.payRate.forEach(function (el, index) {
                                if (index < 7) self.dataset2[0].data.push({value: el * 100});
                                self.dataSet2[index].payRate = el * 100 + '%';
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

                //每终端营收
                function loadRevenue() {
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getPerTermRevenueInfo',
                        endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                        project: [util.getParams("project")],
                        timespans: self.selectDur3,
                        type: self.selectGra3
                    })
                    self.loadingChart3 = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.dataset3 = [];
                            self.dataSet3 = [];
                            self.categories3[0].category = [];
                            data.timeList.forEach(function (el, index) {
                                if (index < 7) self.categories3[0].category.push({label: $scope.dtSubstr(el, self.selectGra3)});
                                self.dataSet3.push({datetime: $scope.dtSubstr(el, self.selectGra3)});
                            });

                            self.dataset3.push({seriesname: "付费转化率", data: []});
                            data.revenue.forEach(function (el, index) {
                                if (index < 7) self.dataset3[0].data.push({value: el});
                                self.dataSet3[index].revenue = el;
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
                self.term.sort = orderby;
                self.term.desc = !self.term.desc;
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
                self.project = [
                    {name: 'opennVoD'},
                    {name: '西塘'}
                    ];
                self.activerow = 0;
                self.term = [
                    {name: '累计终端', show: true, sort: '', desc: false},
                    {name: '上线终端', show: true, sort: '', desc: false},
                    {name: '活跃终端', show: true, sort: '', desc: false},
                    {name: '付费终端', show: false, sort: '', desc: false},
                    {name: '新增终端', show: false, sort: '', desc: false}
                ];
                self.countStatistics = [
                    {name: '准付费次数', show: false, sort: '', desc: false},
                    {name: '付 费 次 数', show: true, sort: '', desc: false},
                ];
                self.selectCount = 3;
                self.other = [
                    {name: '活跃时长', show: true, sort: '', desc: false},
                    {name: '西塘票务', show: false, sort: '', desc: false},
                ];

                self.initCharts();

                $scope.dateRangeEnd = $filter('date')(new Date(), 'yyyy-MM-dd');
                self.searchDate = $filter('date')((new Date().getTime()), 'yyyy-MM-dd');
                self.selectGra0 = 1;
                self.selectGra1 = 1;
                self.selectGra2 = 1;
                self.selectGra3 = 1;
                self.isDate = [true, true, true, true];

                self.selectDur0 = 7;
                self.selectDur1 = 7;
                self.selectDur2 = 7;
                self.selectDur3 = 5;

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
            self.changeGra = function (value, index) {
                if (value == 0) {
                    self.isDate[index] = false;
                    if (self.searchDate.length == 10) self.searchDate += " 00:00";
                } else {
                    self.isDate[index] = true;
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

                self.series0 = [];
                self.term.forEach(function (el, index) {
                    if (el.show == true) {
                        self.series0.push(self.termDate[index])
                    }
                })
                self.dataset0 = self.series0;
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
                        self.dataset1 = self.wantPaySeries;
                        self.dataSet1 = self.wantPayData;
                    } else {
                        self.countStatistics[0].show = false;
                        self.countStatistics[1].show = true;
                        self.dataset1 = self.paySeries;
                        self.dataSet1 = self.payData;
                    }

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

            /**
             * 初始化图表
             */
            self.initCharts = function () {
                self.attrs0 = {
                    "caption": "",
                    "xAxisname": "时间",
                    "yAxisName": "终端",
                    "numberPrefix": "",                      //前缀
                    "numberSuffix": " 个",                   //后缀
                    "plotFillAlpha" : "60",

                    //Cosmetics
                    "paletteColors" : "#0075c2,#1aaf5d",
                    "baseFontColor" : "#333333",
                    "baseFont" : "Helvetica Neue,Arial",
                    "captionFontSize" : "14",
                    "subcaptionFontSize" : "14",
                    "subcaptionFontBold" : "0",
                    "showBorder" : "0",
                    "bgColor" : "#ffffff",
                    "showShadow" : "0",
                    "showValues": "0",
                    "canvasBgColor" : "#ffffff",
                    "canvasBorderAlpha" : "0",
                    "divlineAlpha" : "100",
                    "divlineColor" : "#999999",
                    "divlineThickness" : "1",
                    "divLineIsDashed" : "1",
                    "divLineDashLen" : "1",
                    "divLineGapLen" : "1",
                    "usePlotGradientColor" : "0",
                    "showplotborder" : "0",
                    "valueFontColor" : "#000000",
                    "placeValuesInside" : "1",
                    "showHoverEffect" : "1",
                    "rotateValues" : "0",
                    "showXAxisLine" : "1",
                    "xAxisLineThickness" : "1",
                    "xAxisLineColor" : "#999999",
                    "showAlternateHGridColor" : "0",
                    "legendBgAlpha" : "0",
                    "legendBorderAlpha" : "0",
                    "legendShadow" : "0",
                    "legendItemFontSize" : "10",
                    "legendItemFontColor" : "#666666"
                };
                self.categories0 = [
                    {
                        "category": []
                    }
                ];
                self.dataset0 = [];

                self.attrs1 = {
                    "caption": "",
                    "xAxisname": "时间",
                    "yAxisName": "次数",
                    "numberPrefix": "",                      //前缀
                    "numberSuffix": " 次",                   //后缀
                    "plotFillAlpha" : "60",

                    //Cosmetics
                    "paletteColors" : "#0075c2,#1aaf5d",
                    "baseFontColor" : "#333333",
                    "baseFont" : "Helvetica Neue,Arial",
                    "captionFontSize" : "14",
                    "subcaptionFontSize" : "14",
                    "subcaptionFontBold" : "0",
                    "showBorder" : "0",
                    "bgColor" : "#ffffff",
                    "showShadow" : "0",
                    "showValues": "0",
                    "canvasBgColor" : "#ffffff",
                    "canvasBorderAlpha" : "0",
                    "divlineAlpha" : "100",
                    "divlineColor" : "#999999",
                    "divlineThickness" : "1",
                    "divLineIsDashed" : "1",
                    "divLineDashLen" : "1",
                    "divLineGapLen" : "1",
                    "usePlotGradientColor" : "0",
                    "showplotborder" : "0",
                    "valueFontColor" : "#000000",
                    "placeValuesInside" : "1",
                    "showHoverEffect" : "1",
                    "rotateValues" : "0",
                    "showXAxisLine" : "1",
                    "xAxisLineThickness" : "1",
                    "xAxisLineColor" : "#999999",
                    "showAlternateHGridColor" : "0",
                    "legendBgAlpha" : "0",
                    "legendBorderAlpha" : "0",
                    "legendShadow" : "0",
                    "legendItemFontSize" : "10",
                    "legendItemFontColor" : "#666666"
                };
                self.categories1 = [
                    {
                        "category": []
                    }
                ];
                self.dataset1 = [];

                self.attrs2 = {
                    "caption": "",
                    "xAxisname": "时间",
                    "yAxisName": "金额",
                    "numberPrefix": "¥ ",                 //前缀
                    "numberSuffix": "",                   //后缀
                    "plotFillAlpha" : "60",

                    //Cosmetics
                    "paletteColors" : "#0075c2,#1aaf5d",
                    "baseFontColor" : "#333333",
                    "baseFont" : "Helvetica Neue,Arial",
                    "captionFontSize" : "14",
                    "subcaptionFontSize" : "14",
                    "subcaptionFontBold" : "0",
                    "showBorder" : "0",
                    "bgColor" : "#ffffff",
                    "showShadow" : "0",
                    "showValues": "0",
                    "canvasBgColor" : "#ffffff",
                    "canvasBorderAlpha" : "0",
                    "divlineAlpha" : "100",
                    "divlineColor" : "#999999",
                    "divlineThickness" : "1",
                    "divLineIsDashed" : "1",
                    "divLineDashLen" : "1",
                    "divLineGapLen" : "1",
                    "usePlotGradientColor" : "0",
                    "showplotborder" : "0",
                    "valueFontColor" : "#000000",
                    "placeValuesInside" : "1",
                    "showHoverEffect" : "1",
                    "rotateValues" : "0",
                    "showXAxisLine" : "1",
                    "xAxisLineThickness" : "1",
                    "xAxisLineColor" : "#999999",
                    "showAlternateHGridColor" : "0",
                    "legendBgAlpha" : "0",
                    "legendBorderAlpha" : "0",
                    "legendShadow" : "0",
                    "legendItemFontSize" : "10",
                    "legendItemFontColor" : "#666666"
                };
                self.categories2 = [
                    {
                        "category": []
                    }
                ];
                self.dataset2 = [];

                self.attrs3 = {
                    "caption": "",
                    "xAxisname": "时间",
                    "pYAxisName": "活跃时长",
                    "sYAxisName": "活跃终端数",
                    "numberPrefix": "",                   //前缀
                    "numberSuffix": "小时",
                    "sNumberSuffix": "个",
                    "plotFillAlpha" : "60",

                    //Cosmetics
                    "paletteColors" : "#0075c2,#1aaf5d",
                    "baseFontColor" : "#333333",
                    "baseFont" : "Helvetica Neue,Arial",
                    "captionFontSize" : "14",
                    "subcaptionFontSize" : "14",
                    "subcaptionFontBold" : "0",
                    "showBorder" : "0",
                    "bgColor" : "#ffffff",
                    "showShadow" : "0",
                    "showValues": "0",
                    "canvasBgColor" : "#ffffff",
                    "canvasBorderAlpha" : "0",
                    "divlineAlpha" : "100",
                    "divlineColor" : "#999999",
                    "divlineThickness" : "1",
                    "divLineIsDashed" : "1",
                    "divLineDashLen" : "1",
                    "divLineGapLen" : "1",
                    "usePlotGradientColor" : "0",
                    "showplotborder" : "0",
                    "valueFontColor" : "#000000",
                    "placeValuesInside" : "1",
                    "showHoverEffect" : "1",
                    "rotateValues" : "0",
                    "showXAxisLine" : "1",
                    "xAxisLineThickness" : "1",
                    "xAxisLineColor" : "#999999",
                    "showAlternateHGridColor" : "0",
                    "legendBgAlpha" : "0",
                    "legendBorderAlpha" : "0",
                    "legendShadow" : "0",
                    "legendItemFontSize" : "10",
                    "legendItemFontColor" : "#666666"
                };
                self.categories3 = [
                    {
                        "category": []
                    }
                ];
                self.dataset3 = [];
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
                        timespans: self.selectDur0,
                        type: self.selectGra0
                    })
                    self.loadingChart0 = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.dataset0 = [];
                            self.dataSet0 = [];
                            self.termDate = [];
                            self.series0 = [];
                            self.categories0[0].category = [];
                            self.dataSet0 = [];
                            data.timeList.forEach(function (el, index) {
                                if (index < 7) self.categories0[0].category.push({label: $scope.dtSubstr(el, self.selectGra0)});
                                self.dataSet0.push({datetime: $scope.dtSubstr(el, self.selectGra0)});
                            });

                            self.dataset0.push({seriesname: "累计终端", data: []});
                            data.addUpCount.forEach(function (el, index) {
                                if (index < 7) self.dataset0[0].data.push({value: el});
                                self.dataSet0[index].addUpCount = el;
                            });

                            self.dataset0.push({seriesname: "在线终端", data: []});
                            data.onlineCount.forEach(function (el, index) {
                                if (index < 7) self.dataset0[1].data.push({value: el});
                                self.dataSet0[index].onlineCount = el;
                            });

                            self.dataset0.push({seriesname: "活跃终端", data: []});
                            data.activeCount.forEach(function (el, index) {
                                if (index < 7) self.dataset0[2].data.push({value: el});
                                self.dataSet0[index].activeCount = el;
                            });

                            self.dataset0.push({seriesname: "付费终端", data: []});
                            data.payCount.forEach(function (el, index) {
                                if (index < 7) self.dataset0[3].data.push({value: el});
                                self.dataSet0[index].payCount = el;
                            });

                            self.dataset0.push({seriesname: "新增终端", data: []});
                            data.newAddCount.forEach(function (el, index) {
                                self.dataset0[4].data.push({value: el});
                                self.dataSet0[index].newAddCount = el;
                            });

                            self.termDate = self.dataset0;
                            self.term.forEach(function (el, index) {
                                if (el.show == true) {
                                    self.series0.push(self.dataset0[index])
                                }
                            })
                            self.dataset0 = self.series0;

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
                    // self.categories1 = [];



                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getPayCountStatisticsInfo',
                        endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                        project: [util.getParams("project")],
                        timespans: self.selectDur1,
                        type: self.selectGra1
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
                            self.dataset1 = [];
                            self.dataSet1 = [];
                            self.categories1[0].category = [];
                            self.series = [];

                            data.timeList.forEach(function (el, index) {
                                if (index < 7) self.categories1[0].category.push({label: $scope.dtSubstr(el, self.selectGra1)});
                                self.wantPayData.push({datetime: $scope.dtSubstr(el, self.selectGra1)});
                                self.payData.push({datetime: el.substring(5, 16)});
                            });

                            self.wantPaySeries.push({seriesname: "准付费次数", data: []});
                            data.wantPayCount.forEach(function (el, index) {
                                if (index < 7) self.wantPaySeries[0].data.push({value: el});
                                self.wantPayData[index].payCount = el;
                            });
                            self.wantPaySeries.push({seriesname: "准付费次数（单次）", data: []});
                            data.wantPaySingleCount.forEach(function (el, index) {
                                if (index < 7) self.wantPaySeries[1].data.push({value: el});
                                self.wantPayData[index].paySingleCount = el;
                            });
                            self.wantPaySeries.push({seriesname: "准付费次数（打包）", data: []});
                            data.wantPayPackageCount.forEach(function (el, index) {
                                if (index < 7) self.wantPaySeries[2].data.push({value: el});
                                self.wantPayData[index].payPackageCount = el;
                            });

                            self.paySeries.push({seriesname: "付费次数", data: []});
                            data.payCount.forEach(function (el, index) {
                                if (index < 7) self.paySeries[0].data.push({value: el});
                                self.payData[index].payCount = el;
                            });
                            self.paySeries.push({seriesname: "付费次数（单次）", data: []});
                            data.paySingleCount.forEach(function (el, index) {
                                if (index < 7) self.paySeries[1].data.push({value: el});
                                self.payData[index].paySingleCount = el;
                            });
                            self.paySeries.push({seriesname: "付费次数（打包）", data: []});
                            data.payPackageCount.forEach(function (el, index) {
                                if (index < 7) self.paySeries[2].data.push({value: el});
                                self.payData[index].payPackageCount = el;
                            });

                            // self.charts.series = self.paySeries;
                            self.dataset1 = self.paySeries;
                            self.dataSet1 = self.payData;
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
                        timespans: self.selectDur2,
                        type: self.selectGra2
                    })
                    self.loadingChart2 = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.categories2[0].category = [];
                            self.dataset2 = [];
                            self.revenueData = [];
                            data.timeList.forEach(function (el, index) {
                                if (index < 7) self.categories2[0].category.push({label: $scope.dtSubstr(el, self.selectGra2)});
                                self.revenueData.push({datetime: $scope.dtSubstr(el, self.selectGra2)});
                            });

                            self.dataset2.push({seriesname: "总收益", data: []});
                            data.totalMovieRevenue.forEach(function (el, index) {
                                if (index < 7) self.dataset2[0].data.push({value: el / 100});
                                self.revenueData[index].totalMovieRevenue = el / 100;
                            });
                            self.dataset2.push({seriesname: "单次点播收益", data: []});
                            data.singleMovieRevenue.forEach(function (el, index) {
                                if (index < 7) self.dataset2[1].data.push({value: el / 100});
                                self.revenueData[index].singleMovieRevenue = el / 100;
                            });
                            self.dataset2.push({seriesname: "打包点播收益", data: []});
                            data.packageMovieRevenue.forEach(function (el, index) {
                                if (index < 7) self.dataset2[2].data.push({value: el / 100});
                                self.revenueData[index].packageMovieRevenue = el / 100;
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
                        case 1:
                            LoadXitang();
                            break;
                    }

                    function loadActiveTime() {
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getActiveStatisticsInfo',
                            endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                            project: [util.getParams("project")],
                            timespans: self.selectDur3,
                            type: self.selectGra3
                        })
                        self.loadingChart3 = true;

                        $http({
                            method: 'POST',
                            url: util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response) {
                            var data = response.data;
                            if (data.rescode == '200') {
                                self.categories3[0].category = [];
                                self.dataset3 = [];
                                self.dataSet3 = [];
                                data.timeList.forEach(function (el, index) {
                                    if (index < 5) self.categories3[0].category.push({label: $scope.dtSubstr(el, self.selectGra3)});
                                    self.dataSet3.push({datetime: $scope.dtSubstr(el, self.selectGra3)});
                                });

                                self.dataset3.push({seriesname: "活跃时长", data: []});
                                data.totalActiveTime.forEach(function (el, index) {
                                    if (index < 5) self.dataset3[0].data.push({value: (el / 3600).toFixed(2)});

                                    var h = Math.floor(el / 3600);
                                    var m = Math.floor((el - h * 3600) / 60);
                                    var s = el - h * 3600 - m * 60;

                                    self.dataSet3[index].totalActiveTime = h + ":" + zeroFill(m) + ":" + zeroFill(s);
                                    function zeroFill(data) {
                                        if (data < 10) {
                                            data += "0";
                                        }
                                        return data;
                                    }
                                });
                                self.dataset3.push({seriesname: "活跃终端数", renderAs: "line", parentYAxis: "S", showValues: "0", data: []});
                                data.activeCount.forEach(function (el, index) {
                                    if (index < 5) self.dataset3[1].data.push({value: el});
                                    self.dataSet3[index].activeCount = el;
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

                    function LoadXitang() {
                        var data = JSON.stringify({
                            token: util.getParams("token"),
                            action: 'getXiTangTicketStatisticsInfo',
                            endTime: self.searchDate.length == 10 ? self.searchDate + " 00:00:00" : self.searchDate + ":00",
                            project: [util.getParams("project")],
                            timespans: 7,
                            type: 2
                        })
                        self.loadingChart2 = true;

                        $http({
                            method: 'POST',
                            url: util.getApiUrl('v2/statistics', '', 'server'),
                            data: data
                        }).then(function successCallback(response) {
                            var data = response.data;
                            if (data.rescode == '200') {
                                self.categories3[0].category = [];
                                self.dataset3 = [];
                                self.revenueData = [];
                                data.timeList.forEach(function (el, index) {
                                    self.categories3[0].category.push({label: el.substring(5, 16)});
                                    self.revenueData.push({datetime: el.substring(5, 16)});
                                });

                                self.dataset3.push({seriesname: "总收益", data: []});
                                data.totalMovieRevenue.forEach(function (el, index) {
                                    self.dataset3[0].data.push({value: el / 100});
                                    self.revenueData[index].totalMovieRevenue = el / 100;
                                });
                                self.dataset3.push({seriesname: "单次点播收益", data: []});
                                data.singleMovieRevenue.forEach(function (el, index) {
                                    self.dataset3[1].data.push({value: el / 100});
                                    self.revenueData[index].singleMovieRevenue = el / 100;
                                });
                                self.dataset3.push({seriesname: "打包点播收益", data: []});
                                data.packageMovieRevenue.forEach(function (el, index) {
                                    self.dataset3[2].data.push({value: el / 100});
                                    self.revenueData[index].packageMovieRevenue = el / 100;
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

                }


            }

            /**
             * 列表排序
             * @param orderby
             */
            self.changeOrderby = function (orderby) {
                self.orderby.sort = orderby;
                self.orderby.desc = !self.orderby.desc;
            }
        }

    ])
})();
