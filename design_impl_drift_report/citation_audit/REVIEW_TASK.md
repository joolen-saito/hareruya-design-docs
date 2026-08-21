# 根拠区分の批判的レビュー

先行の検証で、各乖離指摘に `根拠区分` を付けた。あなたの仕事は**その分類を疑い、反証を試みること**である。
追認は求めていない。**誤りを見つけることが目的**である。

## 分類の定義

| 区分 | 主張の内容 |
|---|---|
| `SPEC_BACKED` | 設計期待値の裏付けが **Excel正本設計書に存在する** |
| `LEGACY_BACKED` | Excel正本には **記述が無く**、旧実装に根拠がある |

## 絶対の禁止事項

- **引用の捏造をしないこと。** 実際にファイルに存在する文字列だけを引用する。
  引用は必ず自分で開いて確認した実物を写す。記憶や推測で書かない。
- **確認していないことを「確認した」と書かないこと。**
- 元の判定に引きずられないこと。先行判定は仮説にすぎない。

## Excel正本とリバース詳細設計の区別（最重要）

設計書HTMLには2系統が混在する。

| 系統 | 見分け方 | 位置づけ |
|---|---|---|
| **Excel正本** | `src-cell` / `data-excel-ref` 属性を持つ要素 | これだけが「設計書に書かれている」の根拠 |
| リバース詳細設計 | `<!-- function-design-embed:start -->` 以降、`data-source="functions/..."` | 旧実装から起こした文書。**正本ではない** |

リバース詳細設計の記述を「Excel正本にある」と誤認するのが最大の失敗パターンである。

## 検証手順

### SPEC_BACKED を疑う
`正本根拠` に書かれた引用文字列を、**実際に該当HTMLから grep して実在を確認する**。
- 引用が見つからない → 捏造の疑い。`verdict=REFUTED`
- 見つかるが `data-excel-ref` を持たない領域（function-design-embed 内）だった
  → 正本ではない。`verdict=REFUTED`（正しくは LEGACY_BACKED）
- 見つかるが設計期待値を支持しない（別項目の話、文脈違い）→ `verdict=REFUTED`

### LEGACY_BACKED を疑う
「Excel正本に記述が無い」という**不在の主張**を崩せるか試す。
- 設計期待値のキーワードを複数の言い換えで該当シートの Excel正本部分を検索する
  （項目名、和名、英名、カラム名、画面部品名、機能仕様処理概要の記述など）
- 1つでも正本の記述が見つかれば `verdict=REFUTED`（正しくは SPEC_BACKED）
- 探索しても見つからない場合のみ `verdict=UPHELD`。**どう探したかを必ず書く**

## 出力

```json
{
  "packetId": "...",
  "results": [
    {
      "rowId": 123,
      "original": "LEGACY_BACKED",
      "verdict": "UPHELD",
      "correctedClass": null,
      "checkedQuote": "『週間販売数』で 0502 の data-excel-ref 保持要素を検索し0件。『weeklySold』『週間』でも正本部分に該当なし。",
      "reason": "Excel正本sheet-4の画面部品仕様表・機能仕様処理概要をいずれも通読し、当該項目の記述が無いことを確認した。",
      "confidence": "high"
    }
  ]
}
```

- `verdict`: `UPHELD`（元の分類が正しい） / `REFUTED`（誤り） / `UNSURE`（判断つかず）
- `correctedClass`: REFUTED のとき正しい区分（`SPEC_BACKED`/`LEGACY_BACKED`/`UNSUPPORTED`/`ALREADY_MET`）。それ以外は null
- `checkedQuote`: **自分が実際に実行した検索と、その結果**。実在を確認した引用のみ
- `reason`: 判断の根拠
- `confidence`: `high` / `medium` / `low`

findings 全件について返すこと。判断がつかない場合は `UNSURE` にし、無理に断定しない。

## リポジトリ

- 設計書: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/`
- リバース詳細設計の実体: `/home/y-saito/Developments/hareruya-design-docs/functions/`
- 新実装: `/home/y-saito/Developments/ec-cube-enterprise`
- 旧実装: `/home/y-saito/Developments/pf-api`, `pf-eccube3`, `pf-article`, `deck-api`
