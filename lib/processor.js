/**
 * @file build processor
 * @author treelite(c.xinle@gmail.com)
 */

var packages = {};

function add(processor) {
    packages[processor.name] = processor;
}

add(require('./processor/module-version'));
add(require('./processor/js-compressor'));
add(require('./processor/module-compiler'));
add(require('./processor/file-combine'));
add(require('./processor/less-replacer'));

module.exports = function (Super, type, options) {
    options = options || {};
    var processor = new Super(options);
        
    var item = packages[type];
    if (item) {
        processor = require('./util').extend(processor, item);
    }
    else {
        console.log('[ERROR] can not find processor ' + type);
    }
    
    return processor;
};
