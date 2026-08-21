# 乖離指摘の再事実確認・批判的レビュー

先行工程で各乖離指摘に `根拠区分`（SPEC_BACKED / LEGACY_BACKED）と検証メモが付いている。
あなたの仕事は **その内容を疑い、事実に照らして反証を試みること**である。
追認は目的ではない。**誤りを見つけることが目的**である。

判定するのは次の2軸で、**両方を必ず返す**。

| 軸 | 問い |
|---|---|
| `classVerdict` | 根拠区分（設計書に根拠があるのか、旧実装だけなのか）の分類は正しいか |
| `driftVerdict` | その乖離は **今の新実装（作業ツリーの現状）でも再現するか** |

## 絶対の禁止事項

- **引用の捏造をしないこと。** 実際にファイルを開いて確認した文字列だけを書く。
  記憶・推測・「たぶんこう書いてある」で書かない。
- **確認していないことを「確認した」と書かないこと。**
- 先行判定に引きずられないこと。先行判定は仮説にすぎない。
- 判断がつかないときは無理に断定せず `UNSURE` にする。

## 軸1: classVerdict（根拠区分の妥当性）

### Excel正本とリバース詳細設計の区別（最重要）

設計書HTMLには2系統が混在する。

| 系統 | 見分け方 | 位置づけ |
|---|---|---|
| **Excel正本** | `src-cell` / `data-excel-ref` 属性を持つ要素、および `data-excel-ref` に紐づくレイアウト画像 | これだけが「設計書に書かれている」の根拠 |
| リバース詳細設計 | `<!-- function-design-embed:start ... -->` 〜 `:end` の内側、`data-source="functions/..."` | 旧実装から起こした文書。**正本ではない** |

リバース詳細設計の記述を「Excel正本にある」と誤認するのが最大の失敗パターンである。

### 画像に注意（前回のレビューで判明した系統的な見落とし）

Excel正本の画面レイアウト・注意文・メニュー名などは、**テキストではなく画像**
(`class="image-layer-img"` の base64 埋め込み) として入っていることが多い。
テキスト grep だけで「正本に記述が無い」と結論した先行判定が、実際には画像の中に
文言が存在していて誤りだった例が複数ある。

**表示文言・画面レイアウト・項目配置・注意書きに関する指摘では、該当シートの画像も必ず見ること。**
画像を確認したかどうかを `checkedQuote` に書くこと。

### SPEC_BACKED を疑う手順
`正本根拠` の引用を該当HTMLから実際に検索し、実在と所在を確認する。
- 引用が見つからない → 捏造の疑い → `REFUTED`
- 見つかるが `function-design-embed` の内側だった → 正本ではない → `REFUTED`（正しくは LEGACY_BACKED）
- 見つかるが設計期待値を支持しない（別項目の話、文脈違い）→ `REFUTED`

### LEGACY_BACKED を疑う手順
「Excel正本に記述が無い」という **不在の主張**を崩せるか試す。
- 設計期待値のキーワードを複数の言い換えで検索する（項目名・和名・英名・カラム名・
  画面部品名・機能仕様処理概要・エラーメッセージ文言など）
- **同じ書籍の別シート、関連する別書籍**も見る（前後のバッチ・呼び出し元など）
- **画像**も見る（上記）
- 1つでも正本の記述が見つかれば `REFUTED`（正しくは SPEC_BACKED）
- 探しても見つからない場合のみ `UPHELD`。**どう探したかを必ず書く**

### 指摘そのものが誤りの場合
設計書にも旧実装にも根拠が無い → `correctedClass: "UNSUPPORTED"`
設計期待値を新実装が既に満たしている → `correctedClass: "ALREADY_MET"`

## 軸2: driftVerdict（現在も再現するか）

`実装実態` `差分内容` `現実装` に書かれた新実装側の事実主張を、
**現在の作業ツリー** `/home/y-saito/Developments/ec-cube-enterprise` で確かめる。
検証メモは過去のコミット時点のものであり、その後の変更で解消している場合がある。

| 値 | 意味 |
|---|---|
| `REPRODUCED` | 記載どおりの実装で、乖離は今も存在する |
| `RESOLVED` | 実装が変わり、設計期待値を満たすようになっている（乖離は消滅） |
| `PARTIAL` | 一部だけ解消。何が残っているかを `reason` に書く |
| `MISDESCRIBED` | 乖離は残るが、`実装実態`の記述が事実と違う（該当箇所・挙動の説明が誤り） |
| `UNSURE` | 確認できない |

`実装参照` の行番号はずれている場合がある。**行番号ではなくシンボル名で追うこと。**

## 各findingに付いている機械検証フラグ

パケットの各 finding には `mech` フィールドがある。これは機械的に検査した結果で、
**疑ってかかるべき箇所の手掛かり**である（フラグ自体が誤っていることもある）。

| フラグ | 意味 |
|---|---|
| `quote: EXCEL` | 正本根拠の引用がExcel正本領域のテキストに実在した |
| `quote: EMBED_ONLY` | 引用がリバース詳細設計領域にしか無かった → SPEC_BACKED なら要検証 |
| `quote: NOT_FOUND` | 引用がHTMLテキストに見つからない → 捏造か、**画像内**か、言い換えか |
| `quote: NO_QUOTE / TOO_SHORT` | 機械判定不能 |
| `implFile: FILE_MISSING` | 実装参照のファイルが現HEADに存在しない |
| `implLine: LINE_OUT` | 実装参照の行番号がファイル行数を超える |
| `stale: CHANGED` | 検証時HEAD以降にその実装ファイルが変更された → driftVerdict を特に慎重に |

## 出力

指示されたJSONファイルに **Write して** 書き込む。

```json
{
  "packetId": "...",
  "results": [
    {
      "rowId": 123,
      "originalClass": "LEGACY_BACKED",
      "classVerdict": "UPHELD",
      "correctedClass": null,
      "driftVerdict": "REPRODUCED",
      "checkedQuote": "0502 sheet-3 を『週間販売数』『weeklySold』『週間』で検索し data-excel-ref 保持要素に0件。sheet-3のレイアウト画像3枚も確認したが該当なし。",
      "reason": "判断の根拠。実際に開いたファイルパスと引用を含める。",
      "currentImpl": "ec-cube-enterprise 現状: src/Eccube/... の xxx() は ... のままで、設計期待値の ... は無い。",
      "severityOpinion": "med",
      "confidence": "high"
    }
  ]
}
```

- `classVerdict`: `UPHELD` / `REFUTED` / `UNSURE`
- `correctedClass`: REFUTED のとき正しい区分（`SPEC_BACKED` / `LEGACY_BACKED` / `UNSUPPORTED` / `ALREADY_MET`）。それ以外は null
- `driftVerdict`: `REPRODUCED` / `RESOLVED` / `PARTIAL` / `MISDESCRIBED` / `UNSURE`
- `checkedQuote`: **自分が実際に実行した検索と結果**。実在を確認した引用のみ
- `currentImpl`: 現在の実装の実際の状態（ファイルパス＋シンボル名＋引用）
- `severityOpinion`: この乖離の実害の大きさ `high` / `med` / `low`
  （high=業務が回らない・データ不整合・外部連携断、med=機能差・表示差、low=文言/軽微）
- `confidence`: `high` / `medium` / `low`

findings 全件について返すこと（欠落禁止）。

## リポジトリ

| 役割 | パス |
|---|---|
| 正本設計書(HTML) | `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/` |
| リバース詳細設計の実体 | `/home/y-saito/Developments/hareruya-design-docs/functions/` |
| 新実装（移行先・現状） | `/home/y-saito/Developments/ec-cube-enterprise` |
| 旧実装: APIサーバ | `/home/y-saito/Developments/pf-api` |
| 旧実装: EC-CUBE3サイト | `/home/y-saito/Developments/pf-eccube3` |
| 旧実装: 記事サイト | `/home/y-saito/Developments/pf-article` |
| 旧実装: デッキAPI | `/home/y-saito/Developments/deck-api` |
| EC-CUBE本体(参考) | `/home/y-saito/Developments/ec-cube` |
