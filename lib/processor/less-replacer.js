/**
 * @file less引用处理
 * @author treelite(c.xinle@gmail.com)
 */

exports.name = 'LessReplacer';

exports.process = function (file, processContext, callback) {
    var extnames = this.extnames.split(/\s*,\s*/);
    
    if (extnames.indexOf(file.extname) >= 0) {
        var data = file.data;
        data = data.replace(/<link ([^>]+)/g, function (match, attrStr) {

            return '<link '
                + attrStr.replace(/less/g, 'css');

        });

        data = data.replace(
            /<script ([^>]+)>\s*<\/script>/g, 
            function (match, attrStr) {
                if (attrStr.indexOf('less.js') > -1) {
                    return '';
                }

                return '<script ' + attrStr + '></script>';
            }
        );

        file.setData(data);
    }

    callback();
};
