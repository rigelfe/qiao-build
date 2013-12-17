# CRM产品线EDP扩展

符合crm产品线特点的项目开发辅助工具，主要完成项目初始化，模拟数据管理，构建等方面。使用前请先参阅[edp说明](https://github.com/ecomfe/edp)，了解基本的edp安装、使用方法。

## 安装

    $ npm install edpx-crm

## 使用

    $ edp help crm
    CRM项目管理
    Sub Command:
    add     添加文件
    build   构建目录或项目
    create  创建模块
    doc     创建jsDoc
    import  添加第三方依赖
    init    初始化当前目录为项目目录
    mock    设置模拟数据
    refresh 刷新模块配置信息
    start   启动调试服务器 

## 实例

    $ edp crm init
    Project Code: test
    Project Name: 演示项目
    Project Code (for mock): test

    $ edp crm create index

    $ edp crm start

浏览`localhost:8848/index.action`

## 命令

* [init](doc/init.md)
* [create](doc/create.md)
* [add](doc/add.md)
* [mock](doc/mock.md)
* [start](doc/start.md)
* [build](doc/build.md)
* [doc](doc/doc.md)

## 测试

    $ npm test

使用[jasmine](http://pivotal.github.io/jasmine/)，借助[jasmine-node](https://github.com/mhevery/jasmine-node)构建的单元测试用例

## 版本变更

最新版本：__0.3.3__

* 添加本地模拟使用的`ejson`模块，支持`ejson.toJson()`，`ejson.toSimpleJson`
* 所有`vm`模版变量统一封装到`$data`中
* bug fix

[了解更多](doc/changelog.md)
