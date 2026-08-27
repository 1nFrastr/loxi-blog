---
title: "UniApp Style Chaos on Old Android: How to Fix It"
createTime: 2024/10/09 02:01:14
permalink: /article/r932ez77/
tags:
  - uniapp
  - Android
  - css
description: Diagnose and fix UniApp UI layout breakage on low-version Android POS devices.
---
A customer’s aggregated payment system includes a merchant cashier app — a sub-app of the payment system — built with UniApp so one codebase can compile to WeChat mini program and Android app.

The app ran fine on real Android devices and in the WeChat mini program, but on a Huilaimei POS device the styles broke.

The customer said this POS brand covers a large share of the market, peers use it too, and their own apps run normally on it.

With that information, I **believed the problem was solvable**. If others worked, so could we.

The POS Android version was ancient 5.0. **I suspected poor support for newer CSS.**

A quick search showed Android 5.0 shipped on November 4, 2014. UniApp apps actually run in a WebView; Android 5 indeed does not support flex layout.

For easier debugging we needed to **reproduce the bug in a development environment**. The POS hardware did not support USB debugging to a PC.

After some research, I found that LDPlayer — a leading Android emulator — still offered a 5.0 kernel. I installed it from the official site, ran the UniApp editor against LDPlayer, and successfully reproduced the issue.

Then came live debugging and fixes.

At first I tried **grid layout** as a flex alternative — grid is older and often more compatible — but it still failed on the real device.

I fell back to the most primitive approach: **CSS float layout**, essentially hand-crafted.

I fed the original flex CSS to ChatGPT, tweaked a bit, and Android 5 styles were fixed.

Because UniApp is one codebase for many platforms, fixing Android 5 must not break environments that already work — classic **regression testing**. New code must not break existing behavior.

I verified real Android devices and the WeChat mini program both looked correct. Bug fixed.

UniApp also offers a browser kernel different from the native Android WebView, based on Tencent’s QQ Browser (X5). It is said to smooth over low-version WebView differences so developers can keep writing flex and the kernel rewrites for the target. Sounds promising — worth trying when the chance comes.

[uni-app docs | Android X5 Webview](https://zh.uniapp.dcloud.io/tutorial/app-android-x5.html)
