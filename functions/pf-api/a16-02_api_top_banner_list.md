# API データ管理 — 指定言語の設定済みトップバナー一覧を取得

## 業務ロジック

### 一覧に含めるバナー

画像URLが空文字のバナーは一覧に含めない。表示タイプが0（非表示）のバナーも一覧に含めない。

一覧はバナーIDの昇順で並べる。

## 入出力

### 受け付けるパス

拡張子を付けないパス（/topBanners/{言語コード}）でも、同じ一覧を返す。

### 失敗時の応答本文

コード404を返すときの応答本文は、コードとメッセージの2項目を持つ。メッセージは「Language code is not found」である。

## 表示メッセージ

本APIは画面メッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 一覧に含めるバナー | P2 | pf-api:src/Repository/MtbTopBannerRepository.php:17 |
| 受け付けるパス | P2 | pf-api:config/routes.yaml:163 |
| 失敗時の応答本文 | P2 | pf-api:src/Controller/BannerController.php:53 |
