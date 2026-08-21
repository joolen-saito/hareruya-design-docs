# API カード管理 — カードIDからカード情報を取得

## 業務ロジック

### 取得対象

パスで指定されたカードIDに一致するカードを取得対象とする。該当するカードが存在しないときはコード404・「Not Found」のJSONを返す。

### 応答に含める項目

公開指定のプロパティのみを応答に含める。カードタグ・キーワード能力・記事・デッキ収録カードは公開対象外であり、応答に含まれない。応答フィールドは取得時点の値をそのまま返し、金額・税・ポイント・在庫数量の再計算や丸めは行わない。表示用の加工や表示制御は呼び出し元クライアントの設計を正とする。

## 入出力

### 入出力: リクエスト

| パラメータ | 位置 | 型 | 必須／任意 | 説明 |
|------------|------|----|-----------|------|
| `id` | パス | integer | 必須 | カードID。カード情報の識別子で該当カードを取得する |

### 入出力: レスポンス（成功）

HTTP 200。

| フィールド | 型 | 説明 |
|------------|----|------|
| `id` | integer | カードID |
| `nameJp` | string | カード名（日） |
| `nameEn` | string | カード名（英） |
| `arenaFormatNameJp` | string | アリーナフォーマットカード名（日） |
| `arenaFormatNameEn` | string | アリーナフォーマットカード名（英） |
| `textJp` | string | カードテキスト（日） |
| `textEn` | string | カードテキスト（英） |
| `manaCost` | string | マナコスト |
| `cmc` | number | マナコスト（数値変換） |
| `power` | string | パワー |
| `toughness` | string | タフネス |
| `loyalty` | string | 忠誠度 |
| `oldProductId` | string | 現行の日本語商品ID |
| `oldEnProductId` | string | 現行の英語商品ID |
| `updateDate` | string | 更新日時 |
| `createDate` | string | 作成日時 |
| `cardtypes` | array | カードタイプの一覧 |
| `subtypes` | array | サブタイプの一覧 |
| `specialtypes` | array | 特殊タイプの一覧 |
| `colors` | array | 色の一覧 |
| `cardDetails` | array | カード詳細の一覧 |
| `cardFormats` | array | カードフォーマットの一覧 |
| `colorSequence` | object | 色順序情報 |

応答例（実装確認値に基づく代表値）。

```json
{
  "id": 12345,
  "nameJp": "稲妻",
  "nameEn": "Lightning Bolt",
  "arenaFormatNameJp": "",
  "arenaFormatNameEn": "",
  "textJp": "稲妻は、任意の対象に3点のダメージを与える。",
  "textEn": "Lightning Bolt deals 3 damage to any target.",
  "manaCost": "{R}",
  "cmc": 1,
  "power": null,
  "toughness": null,
  "loyalty": null,
  "oldProductId": "100001",
  "oldEnProductId": "200001",
  "updateDate": "2026-06-01T12:00:00+09:00",
  "createDate": "2020-01-01T00:00:00+09:00",
  "cardtypes": [],
  "subtypes": [],
  "specialtypes": [],
  "colors": [],
  "cardDetails": [],
  "cardFormats": [],
  "colorSequence": null
}
```

### 入出力: レスポンス（失敗）

| HTTPステータス | 条件 | 本文の形 |
|----------------|------|----------|
| 404 | 該当カードなし | `{code, message}`（"Not Found"） |
