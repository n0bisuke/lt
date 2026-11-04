---
marp: true
theme: iotlt
title: エッジAIで焼肉の焼き加減判定やってみた
date: 2026-04-19
event: IoTLT vol134 in 潮風公園BBQ
eventUrl: ""
published: false
---

<!-- _class: title -->

# エッジAIで焼肉の焼き加減判定やってみた

<div class="lt-slot lt-label">写真: BBQ会場で肉を焼いている様子</div>

<div class="lt-author">
  <img class="lt-avatar" src="../../design-system/project/assets/Logos/nobisuke-avatar.jpg" alt="">
  <p class="lt-caption">菅原のびすけ</p>
  <p class="lt-caption">@n0bisuke</p>
</div>
<p class="lt-tagline lt-tag">20260419 #IoTLT vol134 in 潮風公園BBQ</p>

---

<!-- _class: profile -->

<div class="lt-profile-head">
  <p class="lt-name">菅原 のびすけ</p>
  <p class="lt-label">nobisuke sugawara</p>
</div>
<img class="lt-avatar lt-profile-avatar" src="../../design-system/project/assets/Logos/nobisuke-avatar.jpg" alt="">
<div class="lt-profile-body lt-body">
  <p class="lt-strong">・プロトタイピング専門スクール「プロトアウトスタジオ」</p>
  <p><b>- デジタルハリウッド大学大学院 プロダクトプロトタイピング</b></p>
  <div class="lt-profile-gap"></div>
  <p><b>・個人活動</b></p>
  <p><b>- <span class="lt-strong">IoTLT</span>（国内最大のIoTコミュニティ）主催</b></p>
  <p><b>- Developers Summit 2025 ベストスピーカー1位</b></p>
  <p><b>- LINE API Expert / Microsoft MVP / IBM Champion</b></p>
  <p class="lt-strong">- 大阪で先日熱中症とサイフをすられました</p>
</div>

---

<!-- _class: statement -->

本日はBBQですね

---

<!-- _class: lines -->

# BBQのIoTネタの定番といえば肉焼き判定ということでやってみます

黒い肉 => コゲ

赤い肉 => 生

---

<!-- _class: split -->

# SenseCraft

<div class="lt-slot lt-label">スクショ: SenseCraftのトップページ</div>

- Seeedのクラウドサービス
- ローコードでエッジAIとかやれる
- 厳密にはいくつかのサービス群
  - **SenseCraft AI（今回ここ）**
  - SenseCraft HMI

> https://sensecraft.seeed.cc/

<!-- Seeedのクラウドサービスです。今回はこの中のSenseCraft AIを使いました。 -->

---

<!-- _class: split -->

# 蛇足: 今回熱電対も購入悩んだけど今回は見送り

<div class="lt-slot lt-label">スクショ: 商品ページ</div>

- M5Stack用MAX31855搭載 絶縁型Kmeterユニット
- **肉にブッ刺せる**
  - *今回のBBQで分厚い肉はたぶん無いので役不足*
- 2,992円

> https://www.switch-science.com/products/9007

---

<!-- _class: statement -->

<u>BBQの画像を探す</u> => モデル作成

---

# 肉画像を探してみる3 - コゲ

<div class="lt-collage">
  <div class="lt-slot lt-label" style="left:0;top:60px;width:680px;height:420px">写真: コゲた肉 1</div>
  <div class="lt-slot lt-label" style="left:540px;top:0;width:640px;height:400px">写真: コゲた肉 2</div>
  <div class="lt-slot lt-label" style="left:1000px;top:200px;width:700px;height:460px">写真: コゲた肉 3</div>
</div>

> （コゲ画像以外と少ない）

---

# STEP1 動作確認

```bash
curl -s http://localhost:11434/api/embed
```

---

# DEMO

<div class="lt-slot lt-label">動画: 判定している画面</div>

> xの投稿より（ @youtoy さん撮影 ）

<!-- 家で検証したときはBBQできないので魚肉ソーセージの袋で検証しました。 -->

---

<!-- _class: small -->

# まとめ

- BBQの焼き加減判定をエッジAIでやってみた
- SenseCraft
  - Seeed版のTeachable Machineみたいなクラウドサービス
- XIAO ESP32S3 Sense
  - SenseCraftで作ったモデルのデプロイ先
- **焼肉モデルを作ってXIAOでエッジAIやってみた**
- 思ったよりいい感じにBBQ会場でも反応してくれた
