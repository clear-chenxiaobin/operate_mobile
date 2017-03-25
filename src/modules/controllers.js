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
            
            // self.login = function () {
            //     self.loading = true;
            //
            //     var data = JSON.stringify({
            //         username: self.userName,
            //         password: md5.createHash(self.password)
            //     })
            //     $http({
            //         method: 'POST',
            //         url: util.getApiUrl('v2/logon', '', 'server'),
            //         data: data
            //     }).then(function successCallback(response) {
            //         var msg = response.data;
            //         if (msg.rescode == '200') {
            //             util.setParams('token', msg.token);
            //             self.getEditLangs();
            //         }
            //         else {
            //             alert(msg.rescode + ' ' + msg.errInfo);
            //         }
            //     }, function errorCallback(response) {
            //         alert('连接服务器出错');
            //     }).finally(function(value) {
            //         self.loading = false;
            //     });
            // }
            // //
            // self.getEditLangs = function() {
            //     $http({
            //         method: 'GET',
            //         url: util.getApiUrl('', 'editLangs.json', 'local')
            //     }).then(function successCallback(response) {
            //         util.setParams('editLangs', response.data.editLangs);
            //         $state.go('app');
            //     }, function errorCallback(response) {
            //
            //     });
            // }

            $state.go('app');
        }
    ])


    .controller('appController', ['$http', '$scope', '$state', '$stateParams', 'util', 'CONFIG',
        function($http, $scope, $state, $stateParams, util, CONFIG) {
            var self = this;
            self.init = function() {

                // 弹窗层
                self.maskUrl = '';
                self.maskParams = {};
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
        }
    ])

    //HOME
    .controller('homeController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', '$q', 'util', 'CONFIG',
        function($http, $scope, $state, $location, $filter, $stateParams, $q, util, CONFIG) {
            var self = this;
            self.init = function() {

            }

            self.logout = function(event) {
                // util.setParams('token', '');
                $state.go('login');
            }
        }

    ])

    //概览模块
    .controller('overviewController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', '$q', 'util', 'CONFIG',
        function($http, $scope, $state, $location, $filter, $stateParams, $q, util, CONFIG) {
            var self = this;
            self.init = function() {
                self.project = [
                    {name: 'opennVoD'},
                    {name: '西塘'}
                ];

                self.term = [
                    {name: '累计终端', value: true, sort: '', desc: false},
                    {name: '上线终端', value: true, sort: '', desc: false},
                    {name: '活跃终端', value: true, sort: '', desc: false},
                ];
                self.activerow = 0;

                self.loadChart();
            }

            /**
             * 更改tab
             * @param index
             */
            self.isCurrent = function(index){
                self.activerow = index;
            }

            /**
             * 选择终端指标
             * @param $index
             * @returns {boolean}
             */
            self.selectTerm = function ($index) {
                if (self.term[$index].value == true) {
                    self.selectCount--;
                } else if (self.term[$index].value == false && self.selectCount < 3) {
                    self.selectCount++;
                } else {
                    alert('最多只能选择3个显示！');
                    return false;
                }
                self.term[$index].value = !self.term[$index].value;
            }

            /**
             * 初始化图表
             * @type {{options: {chart: {type: string, zoomType: string}, legend: {layout: string, align: string, verticalAlign: string, x: number, y: number, floating: boolean, borderWidth: number, backgroundColor: (*)}, xAxis: {categories: [*], plotBands: [*]}, yAxis: {title: {text: string}}, tooltip: {shared: boolean, valueSuffix: string}, credits: {enabled: boolean}, plotOptions: {areaspline: {fillOpacity: number}}}, series: [*], title: {text: string}}}
             */
            self.charts = {
                options: {
                    chart: {
                        type: 'areaspline',
                        zoomType: 'x'
                    },
                    legend: {
                        layout: 'vertical',
                        align: 'left',
                        verticalAlign: 'top',
                        x: 150,
                        y: 100,
                        floating: true,
                        borderWidth: 1,
                        backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
                    },
                    xAxis: {
                        categories: [],
                    },
                    yAxis: {
                        title: {
                            text: '百分比 (%)'
                        }
                    },
                    tooltip: {
                        shared: true,
                        valueSuffix: '%'
                    },
                    credits: {
                        enabled: false
                    },
                    plotOptions: {
                        areaspline: {
                            fillOpacity: 0.5
                        }
                    },
                },
                series: [],
                title: {
                    text: ''
                }
            }

            self.loadChart = function () {
                var deferred = $q.defer();

                self.categories = [];
                self.chartsData = [];
                self.dataSet = [];

                //获取开机率
                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getTermOnlineRateInfo',
                    endTime: '2017-03-23 10:00:00',
                    project: ["all"],
                    timespans: 7,
                    type: 2
                })
                self.loadingChart = true;

                $http({
                    method: 'POST',
                    url: util.getApiUrl('v2/statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        data.timeList.forEach(function (el, index) {
                            self.categories.push(el.substring(5, 16));
                            self.dataSet.push({datetime: el.substring(5, 16)});
                        });

                        self.charts.options.xAxis.categories = eval(self.categories);

                        self.chartsData.push({name: "开机率", data: []});
                        data.onlineRate.forEach(function (el, index) {
                            self.chartsData[0].data.push(el * 100);
                            self.dataSet[index].onlineRate = el * 100 + '%';
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
                    self.loadingChart4 = false;
                });

                //获取累计终端和上线终端
                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getTermStatisticsInfo',
                    endTime: '2017-03-23 10:00:00',
                    project: ["all"],
                    timespans: 7,
                    type: 2
                })
                self.loadingChart = true;

                $http({
                    method: 'POST',
                    url: util.getApiUrl('v2/statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        // self.chartsData.push({name: "累计终端", data:[]});
                        data.addUpCount.forEach(function (el, index) {
                            // self.chartsData[1].data.push({value: el });
                            self.dataSet[index].addUpCount = el;
                        });

                        // self.chartsData.push({name: "上线终端", data:[]});
                        data.onlineCount.forEach(function (el, index) {
                            // self.chartsData[2].data.push({value: el });
                            self.dataSet[index].onlineCount = el;
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
                self.other = ['其他'];

                // self.charts0 = new charts('终端 个', ' 个');
                // self.charts1 = new charts('次数 次', ' 次');
                // self.charts2 = new charts('金额 元', ' 元');
                // self.charts1= new self.initCharts('', '时间', '次数', '');
                self.initCharts();

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
             * 选择终端指标
             * @param $index
             * @returns {boolean}
             */
            self.selectTerm = function ($index) {
                if (self.term[$index].show == true) {
                    self.selectCount--;
                } else if (self.term[$index].show == false && self.selectCount < 3) {
                    self.selectCount++;
                } else {
                    alert('最多只能选择3个显示！');
                    return false;
                }
                self.term[$index].show = !self.term[$index].show;

                self.series0 = [];
                self.term.forEach(function (el, index) {
                    if (el.show == true) {
                        self.series0.push(self.dataset0[index])
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
             * 初始化图表
             * @type {{options: {chart: {type: string, zoomType: string}, legend: {layout: string, align: string, verticalAlign: string, x: number, y: number, floating: boolean, borderWidth: number, backgroundColor: (*)}, xAxis: {categories: [*], plotBands: [*]}, yAxis: {title: {text: string}}, tooltip: {shared: boolean, valueSuffix: string}, credits: {enabled: boolean}, plotOptions: {areaspline: {fillOpacity: number}}}, series: [*], title: {text: string}}}
             */
            // function charts(yText, valueSuffix) {
            //     this.options = {
            //         chart: {
            //             type: 'areaspline',
            //             zoomType: 'x'
            //         },
            //         legend: {
            //             layout: 'vertical',
            //             align: 'left',
            //             verticalAlign: 'top',
            //             x: 150,
            //             y: 100,
            //             floating: true,
            //             borderWidth: 1,
            //             backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
            //         },
            //         xAxis: {
            //             categories: []
            //         },
            //         yAxis: {
            //             title: {
            //                 text: yText
            //             }
            //         },
            //         tooltip: {
            //             shared: true,
            //             valueSuffix: valueSuffix
            //         },
            //         credits: {
            //             enabled: false
            //         },
            //         plotOptions: {
            //             areaspline: {
            //                 fillOpacity: 0.5
            //             }
            //         },
            //     },
            //     this.series = [],
            //     this.title = {
            //         text: ''
            //     }
            // }

            self.initCharts = function () {
                self.attrs0 = {
                    "caption": "",
                    "xAxisname": "时间",
                    "yAxisName": "终端",
                    "numberPrefix": "",                      //前缀
                    "numberSuffix": " 个",                   //后缀
                    "plotFillAlpha" : "",

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
                    "valueFontColor" : "#ffffff",
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
                    "plotFillAlpha" : "",

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
                    "valueFontColor" : "#ffffff",
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
                    "plotFillAlpha" : "",

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
                    "valueFontColor" : "#ffffff",
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
                    "yAxisName": "金额",
                    "numberPrefix": "¥ ",                 //前缀
                    "numberSuffix": "",                   //后缀
                    "plotFillAlpha" : "",

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
                    "valueFontColor" : "#ffffff",
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
                self.dataSet0 = [];

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
                        break;
                }

                /**
                 * 获取终端指标
                 */
                function loadTerm() {
                    self.dataset0 = [];
                    self.series0 = [];
                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getTermStatisticsInfo',
                        endTime: '2017-03-23 10:00:00',
                        project: ["all"],
                        timespans: 7,
                        type: 2
                    })
                    self.loadingChart = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            self.categories0[0].category = [];
                            data.timeList.forEach(function (el, index) {
                                self.categories0[0].category.push({label: el.substring(5, 16)});
                                self.dataSet0.push({datetime: el.substring(5, 16)});
                            });

                            self.dataset0.push({seriesname: "累计终端", data: []});
                            data.addUpCount.forEach(function (el, index) {
                                self.dataset0[0].data.push({value: el});
                                self.dataSet0[index].addUpCount = el;
                            });

                            self.dataset0.push({seriesname: "在线终端", data: []});
                            data.onlineCount.forEach(function (el, index) {
                                self.dataset0[1].data.push({value: el});
                                self.dataSet0[index].onlineCount = el;
                            });

                            self.dataset0.push({seriesname: "活跃终端", data: []});
                            data.activeCount.forEach(function (el, index) {
                                self.dataset0[2].data.push({value: el});
                                self.dataSet0[index].activeCount = el;
                            });

                            self.dataset0.push({seriesname: "付费终端", data: []});
                            data.payCount.forEach(function (el, index) {
                                self.dataset0[3].data.push({value: el});
                                self.dataSet0[index].payCount = el;
                            });

                            self.dataset0.push({name: "新增终端", data: []});
                            data.newAddCount.forEach(function (el, index) {
                                self.dataset0[4].data.push({value: el});
                                self.dataSet0[index].newAddCount = el;
                            });


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
                        self.loadingChart = false;
                    });
                    return deferred.promise;
                }

                /**
                 * 获取次数统计
                 */
                function loadCount() {
                    // self.categories1 = [];

                    self.wantPaySeries = [];
                    self.wantPayData = [];
                    self.paySeries = [];
                    self.payData = [];
                    self.dataSet1 = [];


                    var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getPayCountStatisticsInfo',
                        endTime: '2017-03-23 10:00:00',
                        project: ["all"],
                        timespans: 7,
                        type: 2
                    })
                    self.loadingChart1 = true;

                    $http({
                        method: 'POST',
                        url: util.getApiUrl('v2/statistics', '', 'server'),
                        data: data
                    }).then(function successCallback(response) {
                        var data = response.data;
                        if (data.rescode == '200') {
                            // data.timeList.forEach(function (el, index) {
                            //     self.categories1.push(el.substring(5, 16));
                            //     self.wantPayData.push({datetime: el.substring(5, 16)});
                            //     self.payData.push({datetime: el.substring(5, 16)});
                            // });
                            // self.charts1.options.xAxis.categories = self.categories1;
                            //
                            // self.wantPaySeries.push({name: "准付费次数", data: data.wantPayCount});
                            // data.wantPayCount.forEach(function (el, index) {
                            //     self.wantPayData[index].payCount = el;
                            // });
                            // self.wantPaySeries.push({name: "准付费次数（单次）", data: data.wantPaySingleCount});
                            // data.wantPaySingleCount.forEach(function (el, index) {
                            //     self.wantPayData[index].paySingleCount = el;
                            // });
                            // self.wantPaySeries.push({name: "准付费次数（打包）", data: data.wantPayPackageCount});
                            // data.wantPayPackageCount.forEach(function (el, index) {
                            //     self.wantPayData[index].payPackageCount = el;
                            // });
                            //
                            // self.paySeries.push({name: "付费次数", data: data.payCount});
                            // data.payCount.forEach(function (el, index) {
                            //     self.payData[index].payCount = el;
                            // });
                            // self.paySeries.push({name: "付费次数（单次）", data: data.paySingleCount});
                            // data.paySingleCount.forEach(function (el, index) {
                            //     self.payData[index].paySingleCount = el;
                            // });
                            // self.paySeries.push({name: "付费次数（打包）", data: data.payPackageCount});
                            // data.payPackageCount.forEach(function (el, index) {
                            //     self.payData[index].payPackageCount = el;
                            // });

                            self.categories1[0].category = [];
                            self.series = [];

                            data.timeList.forEach(function (el, index) {
                                self.categories1[0].category.push({label: el.substring(5, 16)});
                                self.wantPayData.push({datetime: el.substring(5, 16)});
                                self.payData.push({datetime: el.substring(5, 16)});
                            });

                            self.wantPaySeries.push({seriesname: "准付费次数", data: []});
                            data.wantPayCount.forEach(function (el, index) {
                                self.wantPaySeries[0].data.push({value: el});
                                self.wantPayData[index].payCount = el;
                            });
                            self.wantPaySeries.push({seriesname: "准付费次数（单次）", data: []});
                            data.wantPaySingleCount.forEach(function (el, index) {
                                self.wantPaySeries[1].data.push({value: el});
                                self.wantPayData[index].paySingleCount = el;
                            });
                            self.wantPaySeries.push({seriesname: "准付费次数（打包）", data: []});
                            data.wantPayPackageCount.forEach(function (el, index) {
                                self.wantPaySeries[2].data.push({value: el});
                                self.wantPayData[index].payPackageCount = el;
                            });

                            self.paySeries.push({seriesname: "付费次数", data: []});
                            data.payCount.forEach(function (el, index) {
                                self.paySeries[0].data.push({value: el});
                                self.payData[index].payCount = el;
                            });
                            self.paySeries.push({seriesname: "付费次数（单次）", data: []});
                            data.paySingleCount.forEach(function (el, index) {
                                self.paySeries[1].data.push({value: el});
                                self.payData[index].paySingleCount = el;
                            });
                            self.paySeries.push({seriesname: "付费次数（打包）", data: []});
                            data.payPackageCount.forEach(function (el, index) {
                                self.paySeries[2].data.push({value: el});
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
                        endTime: '2017-03-23 10:00:00',
                        project: ["all"],
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
                            self.categories2[0].category = [];
                            self.dataset2 = [];
                            self.revenueData = [];
                            data.timeList.forEach(function (el, index) {
                                self.categories2[0].category.push({label: el.substring(5, 16)});
                                self.revenueData.push({datetime: el.substring(5, 16)});
                            });

                            self.dataset2.push({seriesname: "总收益", data: []});
                            data.totalMovieRevenue.forEach(function (el, index) {
                                self.dataset2[0].data.push({value: el / 100});
                                self.revenueData[index].totalMovieRevenue = el;
                            });
                            self.dataset2.push({seriesname: "单次点播收益", data: []});
                            data.singleMovieRevenue.forEach(function (el, index) {
                                self.dataset2[1].data.push({value: el / 100});
                                self.revenueData[index].singleMovieRevenue = el;
                            });
                            self.dataset2.push({seriesname: "打包点播收益", data: []});
                            data.packageMovieRevenue.forEach(function (el, index) {
                                self.dataset2[2].data.push({value: el / 100});
                                self.revenueData[index].packageMovieRevenue = el;
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
