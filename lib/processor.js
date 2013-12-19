/**
 * @file build processor
 * @author treelite(c.xinle@gmail.com)
 */

var packages = {};

function add(processor) {
    packages[processor.name] = processor;
}

add(require('./processor/js-compressor'));
add(require('./processor/module-compiler'));
add(require('./processor/file-combine'));
add(require('./processor/less-replacer'));

module.exports = function (Super, type, options) {
    options = options || {};
    var processor = new Super(options);
        
    var items = packages[type];
    if (items) {
        processor = require('./util').extend(processor, items);
    }
    
    return processor;
};
