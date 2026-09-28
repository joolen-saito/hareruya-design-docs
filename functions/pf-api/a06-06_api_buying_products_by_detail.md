# API 店頭買取管理 — カード詳細IDから買取用商品情報を取得

## 業務ロジック

### 応答に含めない商品規格

次のいずれかに当てはまる商品規格は、応答に含めない。

- 商品に商品画像が1件も結び付いていない
- カード詳細にレアリティが結び付いていない
- 商品規格に、買取価格・部門IDを保持する付随情報が結び付いていない
- その付随情報に言語が結び付いていない
- その付随情報に状態が結び付いていない

カードセット・プロモーション・略称タグは結び付いていなくても応答から除かず、該当項目を値なしで返す。

### 同じ組に複数の商品規格が該当したときの扱い

同じカードID・カード詳細ID・言語・状態の組に複数の商品規格が該当した場合、応答に残るのは1件だけで、後から取得したものが先のものを上書きする。取得順は指定していないため、どれが残るかは定まらない。

### 応答値の加工

金額・在庫数量の再計算、丸め、桁区切りなどの整形は行わない。保持している値をそのまま応答へ入れる。

## 入出力

### 出力: 値が無いときの扱い

次の項目は、値が設定されていないとき項目自体は省略せず、値なしで返す。

| 項目 | 値が無いときの応答 |
| --- | --- |
| カードセットコード | 値なし |
| カードセット名 | 値なし |
| プロモーション名 | 値なし |
| 略称タグ名 | 値なし |
| 買取価格 | 値なし |
| 部門ID | 値なし |

値なしはJSONの null で返す。空文字にはしない。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| A06-06-MSG-001 | API応答JSON（errors配列） | 認証エラー | カード詳細ID取得時に、ログイン中の利用者が管理者でない | MTGバイヤー側で認証を行い再試行する |
| A06-06-MSG-002 | API応答JSON（errors配列） | カードが見つかりません | 指定カード詳細IDに対応する買取用カードが0件 | 対象カード詳細IDを確認して再検索する |

いずれのメッセージも英訳を持たない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 応答に含めない商品規格 | P1 | pf-api:src/Repository/DtbProductRepository.php:128-145 |
| 応答に含めない商品規格 | P1 | pf-api:src/Resources/config/doctrine/DtbProduct.orm.yml:97-103 |
| 応答に含めない商品規格 | P1 | pf-api:src/Resources/config/doctrine/MtbCardDetail.orm.yml:143-152 |
| 同じ組に複数の商品規格が該当したときの扱い | P1 | pf-api:src/Repository/HierarchicalDataTrait.php:38-49 |
| 同じ組に複数の商品規格が該当したときの扱い | P1 | pf-api:src/Repository/DtbProductRepository.php:15-42 |
| 同じ組に複数の商品規格が該当したときの扱い | P1 | pf-api:src/Repository/DtbProductRepository.php:172-177 |
| 応答値の加工 | P1 | pf-api:src/Controller/ProductController.php:161-173 |
| 出力: 値が無いときの扱い | P2 | pf-api:src/Repository/DtbProductRepository.php:135-137 |
| 出力: 値が無いときの扱い | P2 | pf-api:src/Resources/config/doctrine/DtbProductSubClass.orm.yml:31-33 |
| 出力: 値が無いときの扱い | P2 | pf-api:src/Resources/config/doctrine/DtbProductSubClass.orm.yml:139-145 |
| 出力: 値が無いときの扱い | P2 | pf-api:config/packages/fos_rest.yaml:16-17 |
| 出力: 値が無いときの扱い | P2 | pf-api:config/bundles.php:15 |
