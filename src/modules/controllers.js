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
                    url: util.getApiUrl('logon', '', 'server'),
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
                    $state.go('app');
                }, function errorCallback(response) {

                });
            }

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

            }

            self.backHome = function () {

            }
        }

    ])

    //具体模块
    .controller('specificController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', '$q', '$log', 'util', 'CONFIG',
        function($http, $scope, $state, $location, $filter, $stateParams, $q, $log, util, CONFIG) {
            var self = this;
            self.init = function() {
                self.term = [
                    {name: '累计终端', value: true, sort: '', desc: false},
                    {name: '上线终端', value: true, sort: '', desc: false},
                    {name: '活跃终端', value: true, sort: '', desc: false},
                    {name: '付费终端', value: true, sort: '', desc: false},
                    {name: '新增终端', value: false, sort: '', desc: false}
                ];
                self.other = ['其他'];
                self.orderby = {};
            }

            self.backHome = function () {

            }

            $scope.items = [
                'The first choice!',
                'And another choice for you.',
                'but wait! A third!'
            ];

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
                        categories: [
                            '周一',
                            '周二',
                            '周三',
                            '周四',
                            '周五',
                            '周六',
                            '周日'
                        ],
                        plotBands: [{ // visualize the weekend
                            from: 4.5,
                            to: 6.5,
                            color: 'rgba(68, 170, 213, .2)'
                        }]
                    },
                    yAxis: {
                        title: {
                            text: '水果 单位'
                        }
                    },
                    tooltip: {
                        shared: true,
                        valueSuffix: ' 单位'
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
                series: [{
                    name: '小张',
                    data: [3, 4, 3, 5, 4, 10, 12]
                }, {
                    name: '小潘',
                    data: [1, 3, 4, 3, 3, 5, 4]
                }],
                title: {
                    text: 'test'
                }
            }

            self.dataSet = [
                {datetime: '03-18', cumulative: 110, online: 99, active: 90, pay: 42, new: 10},
                {datetime: '03-19', cumulative: 110, online: 80, active: 80, pay: 32, new: 0},
                {datetime: '03-20', cumulative: 110, online: 90, active: 89, pay: 39, new: 0},
                {datetime: '03-21', cumulative: 110, online: 85, active: 85, pay: 42, new: 0}
            ]



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
})();
