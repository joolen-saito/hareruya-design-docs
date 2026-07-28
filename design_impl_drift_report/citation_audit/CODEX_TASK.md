# 乖離指摘の根拠検証タスク

設計vs実装の乖離指摘について、**その指摘の根拠がどこにあるか**を特定し、指摘が妥当かを判定する。

## 背景

この乖離監査は、設計期待値を「正本設計書(Excel→HTML)」から生成したことになっている。
しかし少なくとも1件（A02-02）で、設計期待値の実体が**設計書ではなく旧実装**に由来し、
設計書側には対応する記述が存在しないことが判明した。同種の指摘が他にもある可能性が高い。

したがって各指摘について、根拠の所在を切り分ける必要がある。

## リポジトリ

| 役割 | パス |
|---|---|
| 正本設計書(HTML) | `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/` |
| 新実装(移植先) | `/home/y-saito/Developments/ec-cube-enterprise`（develop 固定スナップショットのパスは別途指示） |
| 旧実装: APIサーバ | `/home/y-saito/Developments/pf-api` |
| 旧実装: EC-CUBE3サイト | `/home/y-saito/Developments/pf-eccube3` |
| 旧実装: 記事サイト(WordPress) | `/home/y-saito/Developments/pf-article` |
| 旧実装: デッキAPI | `/home/y-saito/Developments/deck-api` |
| EC-CUBE本体(参考) | `/home/y-saito/Developments/ec-cube` |

## 判定手順（1件ごと）

### 1. 設計書側の裏取り
`設計書参照` のHTMLファイルと `#sheet-N` を開く。
**行番号は信用しないこと。** 設計書HTMLは監査後に再生成され行番号がずれている。
必ず該当シートの本文を読み、設計期待値を裏付ける記述が**実在するか**を確認する。
キーワード検索（項目名、パラメータ名、並び順、条件など）も併用する。

**重要: 設計書HTMLには2系統の資料が混在している。**

| 系統 | 見分け方 | 位置づけ |
|---|---|---|
| Excel正本 | `src-cell` / `data-excel-ref` を持つ要素 | 正本設計書。`SPEC_BACKED` の根拠になる |
| リバース詳細設計 | `<!-- function-design-embed:start ... -->` 以降。`data-source="functions/..."` | 旧実装から起こした文書。`LEGACY_BACKED` の根拠 |

リバース詳細設計の実体は `/home/y-saito/Developments/hareruya-design-docs/functions/` 配下にある:
`functions/pf-api/`(115件) `functions/pf-eccube3/` `functions/ec-cube-enterprise/`。
機能Noに対応するmdを直接読むのが速い（例 `functions/pf-api/a02-02_api_product_popup_card.md`）。

**この2系統を必ず区別すること。** リバース詳細設計にしか記述が無いものを `SPEC_BACKED` と
判定してはならない。それは `LEGACY_BACKED` である。

### 2. 旧実装側の裏取り
設計書に裏付けが無い、または不十分な場合、旧実装リポジトリを探索する。
エンドポイントURL・メソッド名・テーブル名・カラム名・機能名で横断検索する。
設計期待値と一致する挙動を実装しているコードが見つかれば、それが真の根拠である。

### 3. 新実装の現状確認
`ec-cube-enterprise` 側で、設計期待値どおりの実装が存在するかを確認する。

## 判定値（`verdict`）

| 値 | 意味 |
|---|---|
| `SPEC_BACKED` | 設計書に裏付けがあり、新実装が満たしていない。**真の乖離**。 |
| `LEGACY_BACKED` | 設計書に記述は無いが旧実装に根拠があり、新実装に移植漏れがある。**真の乖離**（ただし設計書の記述漏れも併存）。 |
| `UNSUPPORTED` | 設計書にも旧実装にも根拠が見つからない。**誤検出の疑い**。 |
| `ALREADY_MET` | 新実装が既に設計期待値を満たしている。**誤検出**。 |
| `UNCERTAIN` | 判断材料が不足。何が足りないかを `note` に書く。 |

迷ったら `UNCERTAIN` にする。根拠なく `UNSUPPORTED` と断じないこと。

## 出力

指示されたJSONファイルに、以下の形式で **Write して** 書き込む。

```json
{
  "packetId": "...",
  "results": [
    {
      "rowId": 9,
      "verdict": "LEGACY_BACKED",
      "specEvidence": "設計書0502 sheet-4「ポップアップ用カード情報取得」のリクエストパラメータ表は『言語コード』『カードID』の2項目のみ。foil_flg/price/並び順の記述は書籍0502全体に存在しない（grep で0件）。",
      "legacyEvidence": "pf-api/src/Controller/ProductController.php:87-93 `$foilFlg = $request->get('foil_flg'); $price = $request->get('price');` および pf-api/src/Repository/DtbProductSubClassRepository.php:111-116 `$qb->addOrderBy('cardDetail.foilFlg', $foilFlg ? 'DESC' : 'ASC');` `$qb->addOrderBy('productClass.price02', $price === 'high' ? 'DESC' : 'ASC');`",
      "currentImpl": "ec-cube-enterprise の ProductController.php:265 は Request を受け取らず、findPopupProductByCardId($cardId, $languageCode) のみ。クエリ未対応。",
      "note": ""
    }
  ]
}
```

- `specEvidence` / `legacyEvidence` / `currentImpl` には **ファイルパス:行番号 と実際のコード・記述の引用**を必ず含める。
- 該当が無い場合は「〜に存在しない（確認範囲: ...）」と、探した範囲を明記する。
- findings 全件について結果を返すこと（欠落禁止）。
