/**
 * @file JSON模拟数据({{{url}}})
 * @author {{{author}}}({{{email}}})
 */

// 返回数据 E-JSON
var res = {status: 0};

module.exports = {
    type: '{{{data.type}}}',

    // 返回结果
    // string形式
    data: JSON.stringify(res)

    // function形式
    // 用于根据请求参数生成动态数据
    /**
     * 构建返回结果
     *
     * @param {string} url 请求的url
     * @param {Object} params 请求的参数
     * @return {string} JSON字符串
     */
    //data: function (url, params) {}
};
