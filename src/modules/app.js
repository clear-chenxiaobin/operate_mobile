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
        'highcharts-ng'
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
            .state('app.home', {
                url: '/home',
                templateUrl: 'pages/home.html'
            })
            .state('app.overview', {
                url: '/overview',
                templateUrl: 'pages/overview.html'
            })
            .state('app.specific', {
                url: '/specific',
                templateUrl: 'pages/specific.html'
            })
            .state('app.event', {
                url: '/event',
                templateUrl: 'pages/event.html'
            })
            .state('app.funnel', {
                url: '/funnel',
                templateUrl: 'pages/funnel.html'
            })
    }])


    .constant('CONFIG', {
        serverUrl: 'http://openvod.cleartv.cn/backend_clearmgt/',
        // serverUrl: 'http://192.168.30.100/backend_clearmgt/',
        // serverUrl: 'http://172.16.1.21/backend_clearmgt/',
        uploadImgUrl: 'http://mres.cleartv.cn/upload',
        uploadVideoUrl: 'http://movies.clearidc.com/upload',
        testUrl: 'test/',
        test: false
    })

})();