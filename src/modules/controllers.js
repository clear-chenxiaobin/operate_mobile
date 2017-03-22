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
    .controller('specificController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', '$q', 'util', 'CONFIG',
        function($http, $scope, $state, $location, $filter, $stateParams, $q, util, CONFIG) {
            var self = this;
            self.init = function() {

            }

            self.backHome = function () {

            }
        }

    ])
})();
