# API データ管理 — 指定言語の設定済みトップバナー一覧を取得

## 業務ロジック

### 取得する対象

指定された言語コードの設定済みトップバナー一覧を取得する。一覧が空、かつ当該言語コードが言語マスタに存在しないときはコード404のJSONを返す。

### 応答値の扱い

件数・表示順は取得結果に従い、取得後に業務値を再計算しない。

一覧はトップバナーIDの昇順で返す。言語コードで絞り込んだときも同じ順とし、取得後に並べ替えない。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 一覧が空・言語が存在しない | コード404・「Language code is not found」のJSONを返す |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 絞り込み対象の言語コード |
| 成功時出力 | HTTP 200。トップバナーの配列 |
| 失敗時出力 | HTTP 404。一覧が空かつ言語コードが存在しないとき |

### 入力: リクエスト

| パラメータ | 位置 | 型 | 必須／任意 | 説明 |
|------------|------|----|-----------|------|
| `languageCode` | パス | string | 必須 | 絞り込み対象の言語コード |

### 出力: レスポンス（成功）

トップバナーの配列をそのまま返す（ラップオブジェクトを持たない）。

| フィールド | 型 | 説明 |
|------------|----|------|
| `id` | integer | トップバナーID |
| `imageUrl` | string | 画像URL |
| `link` | string | リンク先URL |
| `dispType` | integer | 表示タイプ |
| `languages` | array | 関連する言語の配列。子フィールドは`id`（言語ID）、`nameJp`（言語名・日本語）、`nameEn`（言語名・英語）、`code`（言語コード） |

各要素の応答フィールドは上表の5項目だけである。金額・ポイント・数量・ステータス・日時に当たる項目は持たない。

```json
[
  {
    "id": 1,
    "imageUrl": "https://example.com/banner/top_001.png",
    "link": "https://example.com/campaign",
    "dispType": 1,
    "languages": [
      { "id": 1, "nameJp": "日本語", "nameEn": "Japanese", "code": "ja" }
    ]
  }
]
```

### 出力: レスポンス（失敗）

| HTTPステータス | 条件 | 本文の形 |
|----------------|------|----------|
| 404 | 一覧が空かつ当該言語コードが言語マスタに存在しない | 処理結果コードと "Language code is not found" のメッセージ |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| — | API応答JSON | Language code is not found | 一覧が空かつ言語コードが言語マスタに存在しないとき | HTTP 404を返して終了する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 応答値の扱い | P2 | pf-api:src/Repository/MtbTopBannerRepository.php:28 |
| 応答値の扱い | P2 | pf-api:src/Controller/BannerController.php:46-61 |
| 出力: レスポンス（成功） | P2 | pf-api:src/Controller/BannerController.php:61 |
| 出力: レスポンス（成功） | P2 | pf-api:src/Entity/MtbTopBanner.php:11-43 |
| 応答値の扱い | P2 | pf-api:src/Entity/MtbTopBanner.php:11-43 |
