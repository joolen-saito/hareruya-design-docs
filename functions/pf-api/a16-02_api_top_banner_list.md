# API データ管理 — 指定言語の設定済みトップバナー一覧を取得

## 業務ロジック

### 取得対象

パスの言語コードで絞り込んだ設定済みのトップバナー一覧を返す。一覧が空で、かつ当該言語コードが言語マスタに存在しないときはコード404を返す。

金額・件数・表示順は取得した値をそのまま返し、再計算や補正を行わない。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 一覧が空かつ言語コードが存在しない | コード404・メッセージ「Language code is not found」を返す |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | パスの言語コード（必須、文字列） |
| 成功時出力 | HTTP 200。トップバナーの配列をそのまま返す（ラッパオブジェクトを持たない） |
| 失敗時出力 | HTTP 404。コードとメッセージ（"Language code is not found"） |

### 出力: 要素のフィールド

| フィールド | 型 | 説明 |
|------------|----|------|
| id | integer | トップバナーID。 |
| imageUrl | string | 画像URL。 |
| link | string | リンク先URL。 |
| dispType | integer | 表示タイプ。 |
| languages | array | 関連する言語の配列。要素の子フィールドは id（integer、言語ID）、nameJp（string、言語名・日本語）、nameEn（string、言語名・英語）、code（string、言語コード）。 |

成功時の応答例（実装確認値に基づく代表値）。

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

### 入出力: 永続化

本APIは業務データを更新しない。

## 表示メッセージ

本APIは画面メッセージを扱わない。
