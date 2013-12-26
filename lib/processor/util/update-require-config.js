
function extend(target, source) {
    Object.keys(source).forEach(function (key) {
        target[key] = source[key];
    });

    return target;
}

function updateRequireConfig(content, config, token) {
    var scriptTags = [];
    // 寻找并保存所有的<script>标签
    content.replace(/<\/?script[^>]*>/g, function ($0) {
        scriptTags.push($0);
    });
    // 以<script>标签切割代码
    content = content.split(/<\/?script[^>]*>/);

    // 如果没有<script>标签，则将内容填充一个空的首元素
    // 便于之后的数组操作
    if (scriptTags.length <= 0) {
        content.unshift('');
    }

    function replacer($0, $1, $2) {
        var data = (new Function ('return (' + $2 + ');'))();
        data = extend(data, config);

        // 寻找起始的缩进数
        var indent = 0;
        var i = $0.indexOf('r') - 1;
        while (i >= 0 && $0.charAt(i--) == ' ') {
            indent++;
        }

        data = JSON.stringify(data, null, 4);
        data = data.replace(/\r?\n/g, function ($0) {
            // 附加每行缩进
            return $0 + (new Array(indent + 1)).join(' ');
        });

        return $0.substring(0, $0.indexOf('r'))
            + token
            + '('
            + data 
            + ')';
    }

    var rt = token.replace(/\./g, '\\.');
    var reg = new RegExp(
        '(^|\\s+|\\t+)' + rt + '\\(([^)]*)\\)', 
        'g'
    );
    // 偶数递进处理<script>中的script代码
    for (var i = 1, len = content.length, script; i < len ; i += 2) {
        script = content[i];
        if (reg.test(script)) {
            content[i] = script.replace(reg, replacer);
            break;
        }
    }

    // 回填<script>标签
    for (var i = 0, item; item = scriptTags[i]; i++) {
        content.splice(i * 2 + 1, 0, item);
    }

    return content.join('');
}

module.exports = exports = updateRequireConfig;
