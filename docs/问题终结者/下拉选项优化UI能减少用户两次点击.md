---
title: UI优化：一个小改动如何减少用户66%操作成本
createTime: 2024/10/09 01:39:42
permalink: /article/a2t8ke9p/
tags:
    - ElementPlus
    - UI优化
---
管理后台大多数以表格为主，顶部一般是包含多个筛选输入项的表单，有些时候某些字段仅有几个可选值。 如果使用下拉选择器实现，用户是不能直观看到所有选项内容的，而且在可选值很少的情况下使用下拉选择器，用户的操作步骤是不够简化的。

比如用户**选择一个选项要经历以下3步**：

1. 点击下拉菜单，寻找到目标
2. 点击目标选项，确认选择
3. 点击搜索框搜索

**是否可以优化到一步？**
1. 点击目标选项，触发搜索

可以的！

> **使用[分段控制器](https://element-plus.org/zh-CN/component/segmented.html)，而不是[下拉选择器](https://element-plus.org/zh-CN/component/select.html)，需要升级ElementPlus版本到2.7.0+**

如图所示，所有选项平铺显示，点击某个分段tab立即触发搜索。

<p algin="center">
<img src="/image/a2t8ke9p/img_1.png" alt="效果图" width="60%">
</p>

升级ElementPlus需注意，el-selection组件不兼容更新到了v2版本，会导致默认宽度丢失。需要手动设置宽度。版本升级后整个项目的下拉选项组件样式会出问题，这个改动被社区用户骂死了。

详见讨论区：[Select 没有了默认宽度 · Issue #15510](https://github.com/element-plus/element-plus/issues/15510)
