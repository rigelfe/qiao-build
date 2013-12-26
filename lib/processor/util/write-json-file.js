/**
 * 写入json文件
 * 
 * @param {string} file 文件路径
 * @param {Object|Array} data 内容
 */
module.exports = exports = function (file, data) {
    require('fs').writeFileSync(file, JSON.stringify(data, null, 4));
};
