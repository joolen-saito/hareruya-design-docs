# API 店頭買取管理 — カード名から買取用商品情報を取得

## 業務ロジック

### 検索条件

カード名に含まれる `%` と `_` はエスケープし、ワイルドカードではなく文字そのものとして扱う。

### 応答に含めない商品規格

商品または商品規格に次のいずれかが結び付いていない場合、その商品規格は応答に含めない。

- 商品に結び付く商品画像
- 商品に結び付く付随情報と、そこにぶら下がるカード詳細・カード・レアリティ
- 買取価格・部門IDを保持する商品規格の付随情報と、そこにぶら下がる言語・状態

### 同じ区分に複数の商品規格が該当したときの扱い

応答はカード・カード詳細・言語・状態の組でひとつの商品規格を保持する。同じ組に複数の商品規格が該当した場合、応答に残るのは最後に取得した1件だけで、それ以外は応答から失われる。

### 取得結果の並べ方

検索で得たカードだけを1始まりの連番でキー付けし直して返す。各カードの配下は、カード詳細ID・言語コード・状態コードの順で入れ子にする。ページングの件数（総件数・1ページあたり件数など）は返さない。

### 値の取り方

買取価格・販売価格・在庫数は、永続化済みの値をそのまま返す。応答を組み立てるときの丸め・補正・再計算は行わない。

## 入出力

| 種類 | 内容 |
|------|------|
| 成功時出力 | 最上位に `cards` を置き、その配下にカードごとの情報を入れて返す。 |

### 出力: 応答フィールド

| フィールド | 型 | 内容 |
|------------|----|------|
| `cards` | object | 1始まりの連番をキーとするオブジェクト。値は各カードの情報 |
| `cards.<n>.cardNameJp` | string | カードの日本語名 |
| `cards.<n>.cardNameEn` | string | カードの英語名 |
| `cards.<n>.imageFileName` | string | カード画像のファイル名 |
| `cards.<n>.details` | object | カード詳細IDをキーとするオブジェクト。値は各カード詳細の情報 |
| `cardsetCode` | string | カードセットのコード。カードセット未設定のときはnull |
| `cardsetName` | string | カードセットの日本語名。カードセット未設定のときはnull |
| `foilFlg` | boolean | フォイルか否か |
| `cardNo` | string | カード番号 |
| `promotionName` | string | プロモーションの日本語名。プロモーション未設定のときはnull |
| `productId` | integer | 商品ID |
| `productNameJp` | string | 商品の日本語名 |
| `productNameEn` | string | 商品の英語名 |
| `rarityCode` | string | レアリティのコード |
| `storageCodeName` | string | 保管コードの名称。未設定のときはnull |
| `languageClasses` | object | 言語コードをキーとするオブジェクト |
| `conditionClasses` | object | 状態コードをキーとするオブジェクト。値は商品規格単位の情報 |
| `productClassId` | integer | 商品規格ID |
| `productCode` | string | 商品コード |
| `buyPrice` | integer | 買取価格。未設定のときはnull |
| `price` | string | 販売価格 |
| `stock` | string | 在庫数 |
| `sectionId` | integer | 部門ID。未設定のときはnull |

`cardsetCode` 以降はカード詳細の配下だけに、`productClassId` 以降は言語コードと状態コードの配下だけに置く。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| A06-08-MSG-001 | API応答JSON（errors配列） | 認証エラー | カード名検索時にログインユーザーが管理者アカウントでないとき | 買取端末側で認証を行い再試行する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 検索条件 | P2 | pf-api:src/Repository/DtbProductRepository.php:246 |
| 応答に含めない商品規格 | P1 | pf-api:src/Repository/DtbProductRepository.php:248-261 |
| 同じ区分に複数の商品規格が該当したときの扱い | P1 | pf-api:src/Repository/HierarchicalDataTrait.php:38-49 |
| 同じ区分に複数の商品規格が該当したときの扱い | P1 | pf-api:src/Repository/DtbProductRepository.php:15-42 |
| 取得結果の並べ方 | P2 | pf-api:src/Controller/ProductController.php:200-217 |
| 取得結果の並べ方 | P2 | pf-api:src/Repository/DtbProductRepository.php:15-42 |
| 値の取り方 | P1 | pf-api:src/Repository/DtbProductRepository.php:276-279 |
| 出力: 応答フィールド | P1 | pf-api:src/Repository/DtbProductRepository.php:266-289 |
| 出力: 応答フィールド | P1 | pf-api:src/Repository/DtbProductRepository.php:15-42 |
