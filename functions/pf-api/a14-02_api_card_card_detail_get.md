# API カード管理 — カード詳細IDからカード詳細情報を取得

## 業務ロジック

### 取得対象

パスで指定されたカード詳細IDに一致するカード詳細だけを取得する。カード詳細IDはカード詳細マスタの主キーであり、一致するものが無いときは取得しない。

### 応答値の作り方

除外指定のプロパティを除き、全プロパティを応答へ含める。値は取得時点の値だけを返す。金額・税・ポイント・在庫数量は、いずれの場合も再計算と丸めを行わない。表示用の加工と表示制御は本APIでは行わず、呼び出し元の設計に従う限りとする。

| 除外指定のプロパティ | 応答 |
| --- | --- |
| カードレイアウトID | 値が設定されている場合も含めない |
| プロモーションID | 値が設定されている場合も含めない |
| 親カード | 値が設定されている場合も含めない |
| 商品サブ | 値が設定されている場合も含めない |

### エラー時の扱い

| 事象 | 扱い |
| --- | --- |
| 指定のカード詳細IDに一致するカード詳細が無いとき | コード404・「Not Found」のJSONを返す |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | カード詳細ID（`id`、パス、必須）。パスで指定するときの型は integer とする。 |
| 成功時出力 | 該当のカード詳細があるときは HTTP200。カード詳細情報のJSON。 |
| 失敗時出力 | 該当が無いときは HTTP404。`{code, message}` の形で "Not Found" を返す。 |

### 出力: 応答フィールド

| フィールド | 型 | 内容 |
|------------|----|------|
| `id` | integer | カード詳細ID |
| `cardId` | integer | 紐づくカードID |
| `backCardDetailId` | integer | 裏面カードID |
| `cardsetId` | integer | カードセットID |
| `rarityId` | integer | レアリティID |
| `illustratorId` | integer | イラストレーターID |
| `flavorJp` | string | フレーバーテキスト（日） |
| `flavorEn` | string | フレーバーテキスト（英） |
| `textJp` | string | カードテキスト（日） |
| `textEn` | string | カードテキスト（英） |
| `power` | string | パワー |
| `toughness` | string | タフネス |
| `cardNo` | string | カードNo |
| `foilFlg` | boolean | Foilフラグ |
| `promotionFlg` | boolean | プロモフラグ |
| `updateDate` | string | 更新日時 |
| `createDate` | string | 作成日時 |
| `cardLayout` | object | カードレイアウト情報 |
| `rarity` | object | レアリティ情報 |
| `cardset` | object | カードセット情報 |
| `illustrator` | object | イラストレーター情報 |
| `promotion` | object | プロモーション情報 |
| `cardImages` | array | カード画像の一覧 |

### 入出力: 永続化

いずれの場合もデータを更新しない。

## 表示メッセージ

この機能は、いずれの場合もメッセージを扱わない。
