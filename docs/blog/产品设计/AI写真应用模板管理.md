---
title: "Product Design: AI Portrait Apps — Custom Template Management"
tags:
  - AI Face Swap
  - Open Source
  - System Design
createTime: 2024/10/08 17:38:41
permalink: /article/jxj0mwlt/
description: Combining competitor research and ops pain points, design a customizable-template AI portrait system and open-source an enterprise face-swap solution.
---
You may have heard of Miaoya Camera and EPIK yearbooks in Western markets — apps that generate artistic portraits via AI face swap.

Our client kicked off an AI face-swap product in May 2023, first on domestic mini programs, then an international App Store build, but consumer-side ops did not take off.

Facing that challenge, I combined competitor analysis with the client’s real ops pain points and redesigned a customizable template system for fast-changing market needs. We also open-sourced what we believe is the industry’s first [enterprise AI face-swap portrait solution](https://github.com/loxi-opensource/luna-swapping).

## Model definitions

User image: the photo the user uploads

Target image: the image onto which the user’s face should be swapped

Result image: 1 user image + 1 target image = 1 face-swap result

Template: the smallest selectable unit of a generation goal

> Two types:
> 1. Single template: 1 target image
> 2. Collection template:
> - Multiple target images form a sub-template library
> - Users cannot pick a specific target; the system randomly chooses n targets from the sub-library

Template group: a combination of multiple templates
> Usually for style separation — e.g. classic swordsman, men’s ID photo, women’s executive portrait

Play strategy: a combination of multiple template groups
> For custom plays such as AI blind-box portraits, one-to-one face swap, group photos, etc.

**Model abstraction diagram**
![Model abstraction diagram](/image/jxj0mwlt/model-abstract.png)

## Prototypes
![Prototype 1](/image/jxj0mwlt/proto-1.png)

![Prototype 2](/image/jxj0mwlt/proto-2.png)

## Delivered results

### Admin console
<table>
<tbody>
	<tr>
        <td width="20%">Face-swap test</td>
        <td><img src="/image/jxj0mwlt/swap-test.png"/></td>
    </tr>
	<tr>
        <td>Template management</td>
        <td><img src="/image/jxj0mwlt/swap-template.png"/></td>
    </tr>
	<tr>
        <td>Template groups</td>
        <td><img src="/image/jxj0mwlt/template-group.png"/></td>
    </tr>
	<tr>
        <td>Generation tasks</td>
        <td><img src="/image/jxj0mwlt/swap-task.png"/></td>
    </tr>
</tbody>
</table>

### Mini program
<table>
<tbody>
    <tr>
        <td><img src="/image/jxj0mwlt/show-1.jpg"/>
<p align="center">AI portrait blind box</p>
</td>
        <td>
<img src="/image/jxj0mwlt/show-7.jpg"/>
<p align="center">Digital twin</p>
</td>
        <td>
<img src="/image/jxj0mwlt/show-3.jpg"/>
<p align="center">Generation waiting page</p>
</td>
    </tr>
	<tr>
        <td>
<img src="/image/jxj0mwlt/show-4.jpg"/>
<p align="center">AI face swap</p>
</td>
        <td>
<img src="/image/jxj0mwlt/show-5.jpg"/>
<p align="center">Face-swap result — New Year doll</p>
</td>
        <td>
<img src="/image/jxj0mwlt/show-6.jpg"/>
<p align="center">Movie still portrait</p>
</td>
    </tr>
</tbody>
</table>

## Try it

<table>
<tbody>
    <tr>
        <td width="30%">
            <img src="/image/jxj0mwlt/qrcode.jpg" alt="Mini program demo"/>
        </td>
        <td>
            <p>
                100k+ HD portrait templates built in: <a href="https://luna-admin.sodair.top/admin" target="_blank">Admin demo</a>
            </p>
            <p>
                Enterprise AI face-swap solution: <a href="https://luna.iartai.com" target="_blank">Learn more</a>
            </p>
        </td>
    </tr>
</tbody>
</table>
