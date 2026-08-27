---
title: "UI Optimization: How One Small Change Cuts 66% of User Effort"
createTime: 2024/10/09 01:39:42
permalink: /article/a2t8ke9p/
tags:
    - ElementPlus
    - UI Optimization
description: In admin filter forms, replace dropdowns with clearer option UI to cut user steps.
---
Most admin backends center on tables, with a top form that holds several filter inputs. Sometimes a field has only a few possible values. With a dropdown select, users cannot see all options at a glance, and when there are few choices the interaction is still more steps than necessary.

For example, **choosing one option takes three steps**:

1. Open the dropdown and find the target
2. Click the target option to confirm
3. Click search

**Can we optimize this to one step?**
1. Click the target option and trigger search

Yes!

> **Use a [Segmented Control](https://element-plus.org/zh-CN/component/segmented.html) instead of a [Select](https://element-plus.org/zh-CN/component/select.html). Requires Element Plus 2.7.0+.**

As shown below, all options are laid out flat; clicking a segment tab triggers search immediately.

<p algin="center">
<img src="/image/a2t8ke9p/img_1.png" alt="Screenshot" width="60%">
</p>

When upgrading Element Plus, note that `el-select` is no longer compatible with the previous default width behavior in v2 — default width is lost and you must set width manually. After the upgrade, select styles across the project can break; this change drew a lot of community complaints.

See the discussion: [Select lost its default width · Issue #15510](https://github.com/element-plus/element-plus/issues/15510)
