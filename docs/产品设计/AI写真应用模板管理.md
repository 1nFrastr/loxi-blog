---
title: 自定义模板管理：让你的AI写真应用更高效运营
tags:
  - AI换脸
  - 开源项目
  - 系统设计
createTime: 2024/10/08 17:38:41
permalink: /article/jxj0mwlt/
---
大家可能听说过妙鸭相机和欧美市场的EPIK年鉴，这些都是基于AI换脸技术生成艺术写真照的应用。

我们的客户于2023年5月立项开发AI换脸应用，最初在国内小程序平台上线，随后扩展到国际版App Store，但在C端运营上未能取得成功。

针对这一挑战，我结合多个竞品分析与客户的实际运营痛点，重新设计了一套可自定义模板的系统，以适应快速变化的市场需求。同时，我们还开源了业内首个[AI换脸写真企业级解决方案](https://github.com/loxi-opensource/luna-swapping)
## 概念设计

用户图：用户上传的图片

目标图：用户希望把脸换上去的目标图片

结果图：1张用户图 + 1张目标图 = 1张换脸效果图

模板：用户作图目标的最小选择粒度

> 有两种类型：
> 1. 单张模板：1张目标图
> 2. 合辑模板：
> - 多张目标图组成子模板库
> - 用户不能自行指定目标图，而是系统从子模版库随机选择n张目标图

模板组：多张模板的组合
> 一般用于风格区分，比如古风剑客、男士证件照、女士高管照

玩法策略：多个模板组的组合
> 可用于自定义玩法比如AI盲盒写真、一对一换脸、多人合照等

**模型抽象示意图**
![模型抽象示意图](/image/jxj0mwlt/model-abstract.png)

## 原型图
![原型图1](/image/jxj0mwlt/proto-1.png)

![原型图2](/image/jxj0mwlt/proto-2.png)

## 交付效果

### 管理后台
<table>
<tbody>
	<tr>
        <td width="20%">换脸测试</td>
        <td><img src="/image/jxj0mwlt/swap-test.png"/></td>
    </tr>
	<tr>
        <td>模板管理</td>
        <td><img src="/image/jxj0mwlt/swap-template.png"/></td>
    </tr>
	<tr>
        <td>模板组</td>
        <td><img src="/image/jxj0mwlt/template-group.png"/></td>
    </tr>
	<tr>
        <td>作图任务</td>
        <td><img src="/image/jxj0mwlt/swap-task.png"/></td>
    </tr>
</tbody>
</table>

### 小程序
<table>
<tbody>
    <tr>
        <td><img src="/image/jxj0mwlt/show-1.jpg"/>
<p align="center">AI写真盲盒</p>
</td>
        <td>
<img src="/image/jxj0mwlt/show-7.jpg"/>
<p align="center">数字分身</p>
</td>
        <td>
<img src="/image/jxj0mwlt/show-3.jpg"/>
<p align="center">作图等待页</p>
</td>
    </tr>
	<tr>
        <td>
<img src="/image/jxj0mwlt/show-4.jpg"/>
<p align="center">AI换脸</p>
</td>
        <td>
<img src="/image/jxj0mwlt/show-5.jpg"/>
<p align="center">换脸效果-年画娃娃</p>
</td>
        <td>
<img src="/image/jxj0mwlt/show-6.jpg"/>
<p align="center">电影定妆照</p>
</td>
    </tr>
</tbody>
</table>

## 体验入口

<table>
<tbody>
    <tr>
        <td width="30%">
            <img src="/image/jxj0mwlt/qrcode.jpg" alt="小程序演示"/>
        </td>
        <td>
            <p>
                内置10w+高清写真模板：<a href="https://luna-admin.sodair.top/admin" target="_blank">管理后台演示环境</a>
            </p>
            <p>
                AI换脸企业级解决方案：<a href="https://luna.iartai.com" target="_blank">了解更多</a>
            </p>
        </td>
    </tr>
</tbody>
</table>
