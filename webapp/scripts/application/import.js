module.exports = function ($app) {
    // ====================================== 引入模块 ==================================================================
    [
        // 基础平台
        require("./platform/import"),
        // 营运
        require("./operations/import"),
        // 招商
        require("./investment/import"),
        // 财务
        require("./finance/import"),
        // 管理
        require("./management/import"),
        // 基础数据
        require("./basic/import"),
        // 管理后台
        require("./admin/import")
    ].forEach(function (callback) {
        callback($app)
    });
}