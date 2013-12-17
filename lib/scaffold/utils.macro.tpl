#**
 * 用于定义公共宏
 *#

#set($webRoot=$!link.getContextPath())

#**
 * 引入静态资源
 *#
#macro (includeStatic)
{{#each styles}}
<link rel="stylesheet" href="$!{webRoot}/{{{this}}}" />
{{/each}}
{{#each scripts}}
<script src="$!{webRoot}/{{{this}}}"></script>
{{/each}}
<script>
var {{{project.code}}} = {
    root: '$!{webRoot}'
};
</script>
#end

#macro (footer)
<div class="footer">
    © 2013 Baidu
</div>
#end
