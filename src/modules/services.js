'use strict';

(function () {
    var app = angular.module('app.services', [])

        .factory('util', ['$cookies', '$sessionStorage', '$translate', 'CONFIG', function ($cookies, $sessionStorage, $translate, CONFIG) {



            return {
                /** 
                 * 调用接口，本地和服务器的接口切换，方便调试
                 * @param url 服务器接口名称 
                 * @param testUrl 测试接口名称
                 * @param forceType 强制读取服务器or本地接口 server or local
                 */
                'getApiUrl': function (url, testUrl, forceType) {
                    if(forceType) {
                        if (forceType == 'server') {
                            return CONFIG.serverUrl + url;
                        }
                        else {
                            return CONFIG.testUrl + testUrl;
                        }
                    }
                    else {
                        if (CONFIG.test) {
                            return CONFIG.testUrl + testUrl;
                        }
                        else {
                            return CONFIG.serverUrl + url;
                        }
                    }
                },
                /**
                 * 获取上传URL
                 * @returns {string}
                 */
                'getUploadUrl': function () {
                    return CONFIG.uploadUrl;
                },
                /**
                 * 设置变量
                 * @param paramsName {String}
                 * {
                 *   userName: <String> 用户名,
                 *   projectName: <String> 项目名,
                 *   token: <String> token,
                 *   lang: <String> 本地语言,
                 *   editLangs: <String> 语言
                 *   [
                 *      {
                 *          "name": "中文",
                 *          "code": "zh-CN"
                 *      },
                 *      {
                 *          "name": "en",
                 *          "code": "en-US"
                 *      }
                 *    ]
                 *  }
                 * @param value {String}
                 */
                'setParams': function (paramsName, value) {
                    $cookies.put(paramsName, JSON.stringify(value))
                },
                /**
                 * 获取变量
                 * @param paramsName
                 * @returns {*}
                 */
                'getParams': function (paramsName) {
                    if($cookies.get(paramsName)) {
                        return JSON.parse($cookies.get(paramsName));
                    }
                    else {
                        return false;
                    }
                },
                
                // 当前系统 使用 的 语言
                'langStyle': function(){
                    return $translate.proposedLanguage() || $translate.use();
                },

                // 获取多语言编辑中的默认语言code
                'getDefaultLangCode': function() {
                    var langs = [];
                    if($cookies.get('editLangs')) {
                        langs = JSON.parse($cookies.get('editLangs'));
                    }
                    for (var i = 0; i < langs.length; i++) {
                        if(langs[i].default) {
                            return langs[i].code;
                        }
                    }
                },

                /*
                 * actionType: "normal" 普通上传, "transcode" 转码上传
                 */
                'uploadFileToUrl': function(xhr, file, uploadUrl, actionType, progressFn, succFn, failFn){
                    
                    var actionType = actionType ? actionType : 'normal';

                    var fd = new FormData();
                    fd.append('action', actionType);
                    fd.append('file', file);
                    
                    // var xhr = new XMLHttpRequest();
                    xhr.open('POST', uploadUrl, true);

                    xhr.upload.addEventListener("progress", function(evt) {
                        progressFn(evt);
                    }, false);

                    xhr.onreadystatechange = function(response) {
                        if (xhr.readyState == 4 && xhr.status == 200 && xhr.responseText != "") {
                            console.log(JSON.parse(xhr.responseText));
                            if(JSON.parse(xhr.responseText).result !== 0) {
                              failFn(xhr);
                            }
                            else {
                              succFn(xhr);
                            }
                        } else if (xhr.status != 200 && xhr.responseText) {
                            failFn(xhr);
                        }
                    };

                    xhr.send(fd);
                },

                /**
                 * 浮点乘法运算
                 * @param arg1
                 * @param arg2
                 * @returns {number}
                 * @constructor
                 */
                'FloatMul': function FloatMul(arg1, arg2) {
                    var m = 0, s1 = arg1.toString(), s2 = arg2.toString();
                    try {
                        m += s1.split(".")[1].length
                    } catch (e) {
                    }
                    try {
                        m += s2.split(".")[1].length
                    } catch (e) {
                    }
                    return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
                },

                /**
                 * 复制对象或数组（解决原数组被改动的问题）
                 * @param jsonObj
                 * @returns {*}
                 */
                'clone': function (jsonObj) {
                    var buf;
                    if (jsonObj instanceof Array) {
                        buf = [];
                        var i = jsonObj.length;
                        while (i--) {
                            buf[i] = this.clone(jsonObj[i]);
                        }
                        return buf;
                    } else if (jsonObj instanceof Object){
                        buf = {};
                        for ( var k in jsonObj) {
                            buf[k] = this.clone(jsonObj[k]);
                        }
                        return buf;
                    } else {
                        return jsonObj;
                    }
                },

                /**
                 * 设置选中的项目列表
                 * @param ids <array> 项目列表
                 */
                'setProjectIds': function (ids) {
                    $sessionStorage.ProjectIds = ids;
                },

                /**
                 * 获取选中的项目列表
                 * @returns {*}
                 */
                'getProjectIds': function () {
                    return $sessionStorage.ProjectIds;
                }
            }
        }])

})();