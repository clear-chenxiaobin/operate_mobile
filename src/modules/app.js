'use strict';

(function () {
    var app = angular.module('openvod', [
        'ngAnimate',
        'ui.router',
        'pascalprecht.translate',
        'app.controllers',
        'app.filters',
        'app.directives',
        'app.services',
        'angular-md5',
        'ngTable',
        'ngStorage',
        'ui.bootstrap',
        'ui.checkbox',
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
            //openvod
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
             .state('app.project', {
                url: '/remain',
                templateUrl: 'pages/project.html'
            })
             .state('app.project2', {
                url: '/project2',
                templateUrl: 'pages/project2.html'
            })
            //西塘
            .state('app.XT_overview', {
                url: '/XT_overview',
                templateUrl: 'pages/xitang/overview.html'
            })
            .state('app.XT_specific', {
                url: '/XT_specific',
                templateUrl: 'pages/xitang/specific.html'
            })
            .state('app.XT_menu', {
                url: '/XT_menu',
                templateUrl: 'pages/xitang/menu.html'
            })
            .state('app.XT_funnel', {
                url: '/XT_funnel',
                templateUrl: 'pages/xitang/funnel.html'
            })
    }])


    .constant('CONFIG', {
        serverUrl: serverURL,
        uploadImgUrl: 'http://mres.cleartv.cn/upload',
        uploadVideoUrl: 'http://movies.clearidc.com/upload',
        testUrl: 'test/',
        test: false
    })   

})();