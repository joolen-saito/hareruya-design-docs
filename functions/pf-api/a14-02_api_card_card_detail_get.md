# API カード管理 — カード詳細IDからカード詳細情報を取得

## 概要

カード詳細IDを指定してカード詳細マスタの情報を取得するAPIである。pf-apiが提供するJSON APIである。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値はpf-apiのカード詳細取得処理、ルート定義、カード詳細マスタを扱うリポジトリを正とする。

本機能のカスタマイズ区分は現行踏襲であり、挙動はpf-apiの現行実装を、DB関連はec-cube-enterpriseの実装を正とする。

対象はJSON APIエンドポイントであり、ブラウザ向けの画面を持たない。

---

## 本書で扱うこと

- カード詳細IDによるカード詳細情報の取得
- 該当が無い場合の応答

---

## 本書で扱わないこと

以下は本書では仕様確定せず、実装または別機能の設計を正とする。

- カードIDによる取得（カード情報取得を正とする）
- 検索クエリによる取得（検索クエリに一致するカード情報取得を正とする）

---

## リニューアル移行時の扱い

DB関連の記述はec-cube-enterpriseの実装を正とする。挙動は現行のpf-api実装を正とする。

| 観点 | 現行（pf-api） | 移行先（ec-cube-enterprise） |
|------|----------------|------------------------------|
| カード詳細マスタのテーブル | `mtb_card_detail` | `mtb_card_detail`（同一スキーマ） |
| 主な列 | `card_id`・`back_card_detail_id`・`cardset_id`・`rarity_id`・`illustrator_id`・`flavor_jp`・`flavor_en`・`text_jp`・`text_en`・`power`・`toughness`・`card_no`・`foil_flg`・`promotion_flg`・`create_date`・`update_date` | 同一の列名（差分なし） |

カード詳細マスタは現行と移行先でテーブル名・主な列名が同一であり、永続化スキーマの差はない。移行に伴うAPIの応答仕様の変更は本書では確定しない。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| カード詳細IDからカード詳細情報を取得 | `GET /cardDetails/{id}` | カード詳細IDに対応するカード詳細情報をJSONで返す。該当が無い場合は404を返す。 |

応答形式はJSON。

---

## 処理フロー

### カード詳細情報を取得する（GET `/cardDetails/{id}`）

1. パスのカード詳細IDを受け取る。
2. カード詳細マスタのリポジトリから当該IDのカード詳細を取得する。
3. 取得できない場合はコード404・「Not Found」のJSONを返す。
4. 取得できた場合はカード詳細情報をJSONで返す。

---

## 業務ルール・計算

| 項目 | 内容 |
|------|------|
| 対象データ | リクエストで指定されたID・条件に一致するデータを取得対象とする。抽出条件と該当なし時の扱いは処理フロー・入出力の各節を正とする。 |
| 計算処理 | 本APIでは金額・税・ポイント・在庫数量の再計算や丸めを行わない。DBまたはリポジトリから取得した値をJSON応答へ整形して返す。 |
| 応答値 | 応答フィールドは取得時点の値を返す。表示用の加工やフロントエンド側の表示制御は呼び出し元クライアントの設計を正とする。 |

---

## 入出力

### リクエスト

| パラメータ | 位置 | 型 | 必須／任意 | 説明 |
|------------|------|----|-----------|------|
| `id` | パス | integer | 必須 | カード詳細ID。カード詳細マスタの主キーで該当カード詳細を取得する。 |

### レスポンス（成功）

HTTP 200。

カード詳細情報を返す。除外指定のプロパティを除く全プロパティをシリアライズし、以下を含む。

| フィールド | 型 | 説明 |
|------------|----|------|
| `id` | integer | カード詳細ID。 |
| `cardId` | integer | 紐づくカードID。 |
| `backCardDetailId` | integer | 裏面カードID。 |
| `cardsetId` | integer | カードセットID。 |
| `rarityId` | integer | レアリティID。 |
| `illustratorId` | integer | イラストレーターID。 |
| `flavorJp` | string | フレーバーテキスト（日）。 |
| `flavorEn` | string | フレーバーテキスト（英）。 |
| `textJp` | string | カードテキスト（日）。 |
| `textEn` | string | カードテキスト（英）。 |
| `power` | string | パワー。 |
| `toughness` | string | タフネス。 |
| `cardNo` | string | カードNo。 |
| `foilFlg` | boolean | Foilフラグ。 |
| `promotionFlg` | boolean | プロモフラグ。 |
| `updateDate` | string | 更新日時。 |
| `createDate` | string | 作成日時。 |
| `cardLayout` | object | カードレイアウト情報。 |
| `rarity` | object | レアリティ情報。 |
| `cardset` | object | カードセット情報。 |
| `illustrator` | object | イラストレーター情報。 |
| `promotion` | object | プロモーション情報。 |
| `cardImages` | array | カード画像の一覧。 |

`cardLayoutId`・`promotionId`・親カード（`card`）・商品サブ（`productSubs`）は除外指定であり、応答に含まれない。

### レスポンス（失敗）

| HTTPステータス | 条件 | 本文の形 |
|----------------|------|----------|
| 404 | 該当カード詳細なし | `{code, message}`（"Not Found"） |

### サンプルレスポンス

成功時の応答例（実装確認値に基づく代表値）。

```json
{
  "id": 54321,
  "cardId": 12345,
  "backCardDetailId": null,
  "cardsetId": 10,
  "rarityId": 3,
  "illustratorId": 7,
  "flavorJp": "",
  "flavorEn": "",
  "textJp": "稲妻は、任意の対象に3点のダメージを与える。",
  "textEn": "Lightning Bolt deals 3 damage to any target.",
  "power": null,
  "toughness": null,
  "cardNo": "001",
  "foilFlg": false,
  "promotionFlg": false,
  "updateDate": "2026-06-01T12:00:00+09:00",
  "createDate": "2020-01-01T00:00:00+09:00",
  "cardLayout": null,
  "rarity": null,
  "cardset": null,
  "illustrator": null,
  "promotion": null,
  "cardImages": []
}
```

### 副作用

無し（参照のみ）。

応答はJSON応答整形を経て返す。プロパティはcamelCase、日時はISO8601とする。

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 参照時点 | 呼び出し時点のカード詳細マスタ情報を返す。本APIはデータを更新しない。 |

---

## DBカラム

| テーブル | 列 | メモ |
|---------|-----|------|
| カード詳細マスタ（`mtb_card_detail`） | カード詳細ID（`id`）・詳細情報の各列 | 取得条件・応答内容に使用する。テーブル名・列名はec-cube-enterpriseを正とする。 |

### DB操作

本機能は参照系（検索）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 検索 | mtb_card_detail | 検索条件に合致するレコードを抽出する。 |

---

## 権限・認可

| 利用者状態 | カード詳細情報取得 |
|------------|--------------------|
| クライアント | クライアントから呼び出す。認可方式はpf-apiの方針に従う。 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| 該当カード詳細なし | コード404・「Not Found」のJSONを返す。 |

---

## 排他制御・トランザクション

本APIは参照のみであり、楽観ロック・悲観ロックの対象は持たない。
