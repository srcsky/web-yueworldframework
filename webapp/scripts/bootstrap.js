/**
 * bootstrap.js
 * @author zhanggj
 * @version 1.0.0
 * @time 2017-03-02 10:32:11
 * @description Bootstrap App
 */
// 引入通用样式
require("./support/plugins/bootstrap/3.3.7.css");
require("./support/plugins/angular/1.6.0.csp.css");
require("./support/plugins/angular-ui-bootstrap/2.5.0.css");
require("./support/plugins/swiper/4.0.1/swiper.css");
require("../styles/css/animate.css");
require("../styles/css/bootstrap.css");
require("../styles/css/framework.css");
// 引入通用类库
require("./support/plugins/jquery/3.1.1");
require("./support/plugins/jquery.easing/1.4.1.js");
require("./support/plugins/swiper/4.0.1/swiper.js");
require("./support/plugins/angular/1.6.0.js");
require("./support/plugins/angular-locale/zh");
require("./support/plugins/angular-animate/1.6.0.js");
require("./support/plugins/angular-sanitize/1.6.0.js");
require("./support/plugins/angular-bindonce/0.3.1.js");
require("./support/plugins/angular-ui-router/0.4.2.js");
require("./support/plugins/angular-ui-bootstrap/2.5.0.js");
require("./support/plugins/angular-swiper/angular-swiper.js");
require("./support/plugins/snap.svg/import.js");

/**
 * 导出 类库
 * @param config    配置信息
 * @param $app      Angular Module
 */

modules.exports = function bootstrap(config, $app) {
    // 加载辅助类库
    require("./support/import")($app);

    $app.assert(!config, "未提供正确的配置对象！");

    config.url = angular.extend({
        main: "/operations/situation/index.html"
    }, config.url);

    // 通用 异常信息拦截
    $app.config(["$provide", "$stateProvider", "$urlRouterProvider", "$locationProvider", function ($provide, $stateProvider, $urlRouterProvider, $locationProvider) {
        $provide.decorator("$exceptionHandler", ["$delegate", function ($delegate) {
            return function (exception, cause) {
                $delegate(exception, cause);
                console.log(exception.message || cause);
            }
        }]);
        // 开启H5路由模式
        $locationProvider.html5Mode(true);
        // 默认路由
        $urlRouterProvider.otherwise(function () {
            if ($app.user.login) {
                return config.url.main;
            }
        })
    }]);


    // 启动初始化
    $app.run(["$rootScope", "$templateCache", "$state", "$stateParams", "$location", "$q", "$timeout", "$animate", "$injector", "$session", function ($rootScope, $templateCache, $state, $stateParams, $location, $q, $timeout, $animate, injector, $session, isFirstRouterComplete) {
        // 赋予全局作用域 常用对象
        $rootScope.$app = $app;
        $rootScope.$current = $state;
        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            // 未登陆前禁止路由执行
            if (!$app.user.login) {
                event.preventDefault()
            } else {
                // 显示loading
                $app.loading(true);
            }
            $app.router.params = toParams;
        })
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            // 首次路由完成、隐藏 预加载框
            if (!isFirstRouterComplete) {
                isFirstRouterComplete = true;
                $timeout(function () {
                    $animate.removeClass($app.el.loading, "in").then(function () {
                        $app.el.loading.hide();
                        $app.el.loading.addClass("complete");
                    })
                })
            } else {
                // 隐藏loading
                $app.loading(false);
            }
        });
        $app.injector = injector;
        $app.router = {go: $state.go, is: $state.is, includes: $state.includes, reload: $state.reload};
        // 请求超时
        $app.subscribe("requestTimeout", function () {
            $app.loading(false);
            $app.dialog.error({
                message: "很抱歉！<br/>由于您的网络原因、请求失败。",
                buttons: [{text: "我要重试", result: true}]
            }).then(function () {
                $state.reload();
            })
        });
        // 响应异常
        $app.subscribe("responseError", function (event) {
            $app.loading(false);
            $app.dialog.error({
                message: "很抱歉！<br/>由于服务器内部错误、请求失败。",
                buttons: [{text: "我要重试", result: true}]
            }).then(function () {
                window.location.reload();
            })
        });
        // 未登陆
        $app.subscribe("needLogin", function (event, data) {
            $app.loading(false);
            $app.dialog.error({
                message: "很抱歉！<br/>" + ($app.user.login ? "会话超时、请重新登陆！" : "您尚未登陆、请先去登陆！"),
                buttons: [{text: "去登陆", result: true}]
            }).then(function () {
                window.location.href = data.login.split("_srk_")[0] + "_srk_=" + encodeURIComponent(window.location.href);
            })
        });

        if ($session.success) {
            // ======================================== 已登陆 ==========================================================
            // 调整 loading 遮罩级别
            $app.el.loading.css({zIndex: 910})
            // 移除 单点登陆 票据参数
            $location.search(angular.extend($location.search(), {_stk_: undefined}));
            // 设置用户信息
            $app.user = angular.extend($app.user, $session.data.user, {login: true});
            // 远端配置
            $app.setting.init($session.data.settings);
            // 数据字典
            $app.dictionary.init($session.data.dictionary);
        } else if ($session.code == -100) {
            // ======================================== 未登陆 ==========================================================
            $app.dialog.error({
                title: false,
                message: "您尚未登陆、请先登陆！",
                buttons: [{text: "我要登陆", result: true}]
            }).then(function () {
                window.location.href = $session.data.login.split("_srk_")[0] + "_srk_=" + encodeURIComponent(window.location.href);
            })
        } else if ($session.code == 500) {
            // ======================================== 服务器错误 ======================================================
            $app.dialog.error({
                message: "很抱歉！<br/>由于服务器内部错误、请求失败。",
                buttons: [{text: "我要重试", result: true}]
            }).then(function () {
                window.location.reload();
            })
        } else {
            $app.dialog.error({message: $session.message});
        }
    }]);
    // 获取会话
    var _stk_ = $app.getParams("_stk_");
    $app.$.getJSON($app.getDynamicUrl("sdk/platform/init"), _stk_ ? {_stk_: _stk_} : {}).then(function ($response) {
        $app.value("$session", $response);
    }).fail(function () {
        $app.value("$session", {success: false, code: 500});
    }).always(function ($response) {
        angular.bootstrap(document, ["$app"]);
    });
}