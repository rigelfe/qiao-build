<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>{{{project.name}}}</title>
    {{#loaderConfig}}
    <script>
    require.config({
        baseUrl: '{{{loaderBaseUrl}}}',
        paths: { {{#forEach loaderPaths}}
            {{{key}}}: '{{{value}}}'{{^last}},{{/last}}
        {{/forEach}} },
        packages: [ {{#loaderPackages}}
            {
                name: '{{{name}}}',
                location: '{{{location}}}',
                main: '{{{main}}}'
            }{{^last}},{{/last}}
        {{/loaderPackages}}]
    });
    </script>
    {{/loaderConfig}}
</head>
<body>

</body>
</html>
