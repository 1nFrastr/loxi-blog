---
title: 减少用户66%操作成本的下拉选择输入UI优化方案
createTime: 2024/10/09 01:39:42
permalink: /article/a2t8ke9p/
tags:
    - ElementPlus
    - UI优化
---
管理后台大多数以表格为主，顶部一般都是搜索筛选项目输入表单，有些时候某些字段仅有几个可选值。使用下拉选择器实现不容易让直观看到选项的内容，而且可选值不多的情况下使用下拉选择器，对于用户操作步骤是不够简化的。

用户选择一个选项要经历以下3步

1. 点击下拉菜单，寻找到目标
2. 点击目标选项，确认
3. 点击搜索框搜索

是否可以优化到一步？
1. 点击目标选项，触发搜索

可以的！

> **升级ElementPlus版本到2.7.0+，使用[ Segmented 分段控制器 ](https://element-plus.org/zh-CN/component/segmented.html)来替代[ Select 下拉选择器 ](https://element-plus.org/zh-CN/component/select.html)**

所有选项平铺显示，点击某个分段tab即可触发搜索。

<p algin="center">
<img src="/image/a2t8ke9p/img.png" alt="效果图" width="60%">
</p>

升级ElementPlus需注意，el-selection组件不兼容更新到了v2版本，会导致默认宽度丢失。需要手动设置宽度。
版本升级后整个项目的下拉选项组件样式会出问题，这个改动被社区用户骂死了。

详见讨论区：[Select 没有了默认宽度 · Issue #15510](https://github.com/element-plus/element-plus/issues/15510)
