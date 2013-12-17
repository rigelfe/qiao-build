/**
 * @file VM模拟数据({{{url}}})
 * @author {{{author}}}({{{email}}})
 */

module.exports = {
    type: '{{{data.type}}}',

    // vm文件路径
    // 默认为空，以模拟请求路径来寻找vm
    file: '{{{data.file}}}',

    // 页面模板变量容器
    // 如果页面有模板变量$name, 则
    // data: {name: 'rigelfe'}
    data: {}

    // function形式
    // 用于根据请求参数生成动态数据
    /**
     * 构建模板变量
     *
     * @param {string} url 请求的url
     * @param {Object} params 请求的参数
     * @return {Object} 模板变量集合
     */
    //data: function (url, params) {}
};

