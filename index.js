var bootstrap = require("./dist/scripts/bootstrap")
/**
 *
 * @param config
 * @param librarys
 */
module.exports = function (config, libraries) {
    // 声明 Angular Module
    window.$app = angular.module("$app", ["ngLocale", "ngAnimate", "ngSanitize", "pasvaz.bindonce", "ui.bootstrap", "ui.router"]);
    // 加载扩展模块、具体应用
    libraries.forEach(function (callback) {
        callback($app)
    });
    // 初始化 Angular
    bootstrap(config, $app);
}