# Backlog不具合チケットを、設計書乖離リストと同じ軸で分類する

Backlog「不具合（バグ）」／状態 処理中 の247件を、乖離リスト1,034件と**同じ分類軸**に載せる。
目的は両者を合算して全体像を出すこと。工数の見積は既に済んでいるので**やり直さない**。

## 参照先

| 役割 | パス |
|---|---|
| **正本Excel（設計の正）** | `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/input/*.xlsx` |
| 生成HTML（読む用。編集対象ではない） | `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/*.html` |
| 実装（新） | `/home/y-saito/Developments/ec-cube-enterprise` |
| 実装（旧・移行元） | `/home/y-saito/Developments/pf-eccube3`, `pf-api`, `pf-article`, `deck-api` |

**HTMLは `convert.py` の生成物**であり、`src-cell` / `data-excel-ref` 属性を持つ領域だけが正本Excel由来。
`<!-- function-design-embed:start -->` 〜 `end` で囲まれた領域は旧実装からのリバース記述であり**正本ではない**。

**正本の根拠は base64 埋め込み画像（`class="image-layer-img"`）の中にあることが多い。**
テキスト検索で見つからないことを「正本に記述が無い」と即断しない。該当シートの画像も見ること。

## 判定する4つのこと

### 1. `shitekiKubun` — 指摘の性質

| 値 | 意味 |
|---|---|
| `未実装` | 設計が求める機能・項目・処理がそもそも存在しない |
| `実装違い` | 存在はするが、条件・値・並び・文言・保存先などが設計と違う |

### 2. `harm` — 実害の大きさ

乖離リストと同じ基準を使う。

| 値 | 基準 |
|---|---|
| `high` | 業務が止まる／データ不整合が起きる／外部連携が切れる／金額・在庫が誤る |
| `med` | 機能が設計どおり動かないが、業務は回避しながら回せる |
| `low` | 文言・ラベル・並び順・軽微な表示崩れ |

**チケットのBacklog優先度（高/中/低）をそのまま写さないこと。** 起票者の主観であり実害とは別。
実コードを見て、何が壊れるかで判定する。

### 3. `basis` — 根拠区分（このチケットの期待挙動は、どこに裏付けがあるか）

| 値 | 意味 |
|---|---|
| `SPEC_BACKED` | 正本Excel（HTMLの `src-cell` 領域または貼付画像）に、期待挙動の裏付けがある |
| `LEGACY_BACKED` | 正本には記述が無いが、旧実装（pf-eccube3等）にその挙動がある＝移植漏れ |
| `UNSUPPORTED` | 正本にも旧実装にも根拠が見つからない（運用要望・新規要求の可能性） |
| `UNCERTAIN` | 判断材料が足りない |

**この判定が、乖離リストと合算するときの要になる。**
`SPEC_BACKED` は設計どおり直すだけ、`LEGACY_BACKED` は直すと同時に設計書への追記も要る、
`UNSUPPORTED` は「そもそも直すのか」の設計判断が要る、と扱いが変わる。

根拠区分を判定するには、まずチケットが**どの機能・どの設計書シート**の話かを特定する。
チケット本文に「設計書：0301_....xlsx」や機能No（F03-01 等）が書かれていることがある。

### 4. `docWork` / `docEffortDays` — 設計書側の作業

| 値 | 意味 |
|---|---|
| `NONE` | 設計書は現状で正しい。実装を直せば済む |
| `ADD` | 設計書に記述が無い。項目表・処理概要などに書き足す |
| `FIX` | 記述はあるが採用する仕様と食い違う。既存記述を直す |
| `IMAGE` | 画面レイアウト画像の差し替えが要る |
| `RESOLVE` | 正本の中で記述同士が矛盾している。どちらが正かを決めて片方を直す |
| `UNSURE` | 判断できない |

原則は乖離リストと同じ。`SPEC_BACKED` → 原則 `NONE`（記述が曖昧で明確化が要るなら `FIX`）。
`LEGACY_BACKED` → 原則 `ADD`。`UNSUPPORTED` → 仕様が決まってから書くので原則 `UNSURE`。

`docEffortDays` の目安（Excel編集のみ。HTML再生成は書籍単位の固定費なので含めない）:

| 作業 | 目安 |
|---|---|
| 既存の表に1行足す／セルの文言を1つ直す | 0.05〜0.1 |
| 項目表に複数行・条件付きの記述を足す | 0.1〜0.25 |
| 処理概要・業務ルールの節を書き起こす | 0.25〜0.5 |
| 画面レイアウト画像の差し替え | 0.5〜1.0 |
| 正本内部の矛盾解消 | 0.25〜1.0 |

`docWork = NONE` のときは `docEffortDays: 0`。

## 絶対の禁止事項

- **引用・確認内容の捏造をしない。** 実際に開いて確認したものだけを書く。
- 確認していないことを「確認した」と書かない。分からないものは `UNCERTAIN` / `UNSURE` にする。
- **工数（実装側）は見積もり直さない。** 既に確定しており、この作業の対象外。
- チケットのBacklog優先度を `harm` にそのまま写さない。

## 出力

指示されたJSONファイルに **Write して** 書き込む。

```json
{
  "packetId": "...",
  "results": [
    {
      "issueKey": "ECCUBE_HARERUYA-1234",
      "shitekiKubun": "実装違い",
      "harm": "med",
      "basis": "LEGACY_BACKED",
      "docWork": "ADD",
      "docEffortDays": 0.1,
      "docTarget": "0202_基本設計仕様書(在庫管理機能).xlsx / 在庫編集 シートの画面項目表",
      "reason": "正本HTML 0202 sheet-12 の項目表に当該列の記述が無い（画像も確認）。旧実装 pf-eccube3 の StockController::edit に同等処理あり。",
      "confidence": "high"
    }
  ]
}
```

`reason` には**どのファイルの何を見てそう判断したか**を必ず書く。
`confidence` は `high` / `med` / `low`。
