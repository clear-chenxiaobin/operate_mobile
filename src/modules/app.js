'use strict';

(function () {
    var app = angular.module('openvod', [
        'ui.router',
        'pascalprecht.translate',
        'app.controllers',
        'app.filters',
        'app.directives',
        'app.services',
        'angular-md5',
        'ngCookies',
        'ngTable',
        'ui.bootstrap',
        'ui.bootstrap.datetimepicker',
        'ng-fusioncharts'
    ])
    
    .config(['$translateProvider', function ($translateProvider) {
        var lang = navigator.language.indexOf('zh') > -1 ? 'zh-CN' : 'en-US';
        $translateProvider.preferredLanguage(lang);
        $translateProvider.useStaticFilesLoader({
            prefix: 'i18n/',
            suffix: '.json'
        });
    }])

    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/login');
        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'pages/login.html'
            })
            .state('app', {
                url: '/app',
                templateUrl: 'pages/app.html'
            })
            .state('app.online', {
                url: '/online',
                templateUrl: 'pages/online.html'
            })
            .state('app.home', {
                url: '/home',
                templateUrl: 'pages/home.html'
            })
    }])


    .constant('CONFIG', {
        // serverUrl: 'http://openvod.cleartv.cn/backend_clearmgt/v1/',
        serverUrl: 'http://192.168.30.100/backend_clearmgt/v1/',
        uploadImgUrl: 'http://mres.cleartv.cn/upload',
        uploadVideoUrl: 'http://movies.clearidc.com/upload',
        testUrl: 'test/',
        test: false
    })

})();