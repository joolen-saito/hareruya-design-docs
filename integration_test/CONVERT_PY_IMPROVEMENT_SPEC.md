# convert.py 改修設計仕様書（codex立案・2026-07-25）

> 立案=codex（役割: 戦略/立案=codex・実装=sonnet著者・忠実性検証=excel_preprocess差分0＋codex＋人手）。
> 目的: Excel設計書→HTML生成  を、T2 excel-primaryの唯一の「可読＋引用可能な正典」に育てる。
> ユーザー指摘で判明した6軸の課題（取消線ハードコード/HTML行番号/図形内容/番号ピン対応/結合改行書式/非表示コメント条件付き書式）を是正。
> 受入ゲート合格までB1(T2量産305)着手禁止。excel_preprocessはooxml.py=移植元・verify.py=差分0検証器へ再定義。
>
> **【正典と確定スコープ・2026-07-25ユーザー決定】** 正典は `.cursor/skills/excel-to-html/SKILL.md`（更新済み）。convert.pyはこのスキルを実装する位置づけ。本仕様の技術詳細はスキルと矛盾しない範囲で使う。**確定した適用範囲**:
> - **採用（スキル違反バグ修正＋スキル更新反映）**: ①取り消し線=`apply_forced_strikes`ハードコード撤廃→XML直読（run単位・セル継承・`<strike val="0">`=偽） ②数式=`data_only=False`で式本文保持 ③引用規約=全cell/図形/pin/画像に`data-excel-ref`（`0203:シート名!B50`形式）付与・HTML行番号引用廃止 ④【2026-07-25ユーザー決定で撤回】当初「画面遷移図」名称除外の撤廃→遷移図描画を採用したが、取り込むと後続シート序数(`sheet-<N>`)が全シフトし `superseded_specs.json` 台帳・既存相互リンクが破綻するため、**ユーザー指示「画面遷移図シートは除外で良い」により名前除外を維持（=元挙動へ復帰）**。画面遷移図専用シートはサイドバー・変換・検証から除外。スキル更新済（状態除外の唯一の名前例外として明記）。埋め込み図のステージ化・connector台帳規約は残置シートに対しては存続。 ⑤未解決connectorの黙殺`continue`撤廃→全件台帳/検証失敗（残置シート内の図に適用） ⑥残件CSVが常に空の修正→未変換の実検出 ⑦60%未満の未一致pinを台帳化。
> - **見送り（今回スコープ外・ユーザー決定）**: 非表示/veryHiddenシート=**除外維持（無視）**／データ入力規則・ハイパーリンク・名前定義・AutoFilter・表示形式=**追加しない**／条件付き書式・印刷範囲=**現行どおり「未変換要素」列挙のみ（検証対象化しない）**。
> - よって本仕様§4(データ入力規則)・§8(非表示取込・コメント・条件付き書式検証)・ハイパーリンク/名前定義関連は**適用しない**。§10 exit0条件も上記採用項目に限定する。

---

## `excel_to_html/convert.py` 改修設計仕様書

改修後の `convert.py` は、原本 `.xlsx` のセル・書式・結合・非表示状態・コメント・DrawingML 図形／画像／番号ピン／遷移関係を、可読な HTML と実Excel座標で追跡可能な形で出力することを保証する。ただし、Excel実機と同じレイアウト、条件付き書式の最終描画結果、VBA実行、数式の再計算、図形のピクセル完全一致、コメント吹き出しの画面上位置は保証しない。それらは「存在・原本アンカー・未再現理由」をHTMLへ明示し、実機／人手確認へ渡す。

## 1. 改修方針

`excel_to_html/convert.py` を、T2 excel-primary の唯一の「可読＋引用可能な正典」にする。既存の可読化（表・フロー・画像レイヤー・遷移図）を維持するが、可読化によって原本の座標・意味・構造を失わないよう、全表示要素へ原本由来の識別子を追加する。

`excel_preprocess/` の役割は次へ限定・再定義する。

- `excel_preprocess/ooxml.py`: `styles.xml`、`sharedStrings.xml`、`inlineStr` を直接読む、セル書式／rich-text run／strike の移植元。
- `excel_preprocess/verify.py`: 原本との差分0を検証するエンジン。HTMLの可読化ロジックをここへ逆流させない。
- `convert.py`: `openpyxl` をシート構造・結合・表示補助に、`zipfile` + `xml.etree.ElementTree` を原本書式・DrawingML・コメント・条件付き書式・座標の正本読取に使う。

現状では `load_workbook(..., data_only=True, rich_text=True)` を用い、表示シートのみを `visible_worksheets()` で選別している（`convert.py:139-163, 218-230`）。また、空白セルを落として可読化する（`convert.py:1177-1205`）。これらは可読ビューとしては維持可能だが、引用・検証の正本にはしてはならない。

実データでは、0203受注管理原本に DrawingML 図形843、画像79、DrawingML文字run 1,882 が存在することを確認した。図形をセルだけの前処理へ縮退させる方針は採用しない。

## 2. 共通データ契約

変換前に、ブック全体の「source model」を構築する。HTMLレンダラはこのモデルのみを入力とし、`openpyxl.Cell.font` やレンダリング済みHTML文字列を後処理で書き換えない。

必須の原本識別子は以下とする。

| 対象 | 必須識別子 |
|---|---|
| ブック | `workbook_no`: ファイル名先頭4桁。例 `0203` |
| シート | `sheet_name`、`sheet_index`、`sheet_state` |
| セル | `cell_address`: `B50`、`source_ref`: `0203:B50` |
| 図形・pin・画像 | `source_ref`: アンカーセルに基づく `0203:B50`、DrawingML object id、drawing order |
| 遷移 | connector object id、遷移元nodeの `source_ref`、遷移先nodeの `source_ref` |
| コメント | コメント対象セルの `source_ref`、comment part、comment index |
| 条件付き書式 | `sqref`、rule type、該当シート |

同一ブック内でシート名を省略するとセル参照が曖昧になり得る。そのため、HTML属性には必ず `data-excel-book="0203"`、`data-excel-sheet="受注一覧"`、`data-excel-ref="0203:B50"` を併記する。L1が文章で引用する際は、次を標準とする。

```text
0203:B50（sheet=受注一覧）
```

シート名を文脈上省略できない場合は、`0203:受注一覧!B50` を完全表記とする。`0203:6285` のようなHTML行番号は以後使用禁止とする。

HTML id は引用文字列をそのまま使わず、衝突しないエスケープ済み値とする。例:

```html
<span id="src-0203-<sheet-slug>-B50"
      class="source-ref"
      data-excel-book="0203"
      data-excel-sheet="受注一覧"
      data-excel-ref="0203:B50">0203:B50</span>
```

## 3. 軸①: 取り消し線のXML正本化

### 現状と問題

- `cell_text_runs()` は `cell.font.strike` と `CellRichText`／`TextBlock` に依存する（`convert.py:3308-3334`）。
- `render_cell_text()` は run の `strike` を `<span class="cell-strike">` として描画する（`convert.py:3380-3394`）。
- その後、`convert_workbook()` が `apply_forced_strikes()` を呼ぶ（`convert.py:170-172`）。
- `apply_forced_strikes()` は、0202「共通処理」の文言を列挙し、HTML文字列置換するブック／シート／文言ハードコードである（`convert.py:1392-1417`）。

これは検出不能な取り消し線をHTML上で補正しているだけで、原本セル・run・座標の証跡を残さない。撤廃する。

### 改修仕様

1. `apply_forced_strikes()` を削除する。呼出しも削除する。
2. `excel_preprocess/ooxml.py` の以下を、共通モジュール化または同等実装として `convert.py` 側へ移植する。

   - OOXML真偽値判定 `_ooxml_bool_element()`（`ooxml.py:102-118`）
   - shared string と rich-text run の `parse_rich_text()`（`ooxml.py:180-231`）
   - `styles.xml` の `cellXfs → fontId → fonts/font` 解決
   - `sharedStrings.xml` と `inlineStr` の両方の読取
   - run明示書式とセル書式の継承解決

3. `<strike/>` は真、`<strike val="0"/>` と `<strike val="false"/>` は偽とする。要素の存在だけで真と判定してはならない。
4. 各runについて少なくとも以下を保持する。

```python
{
  "text": "...",
  "space_preserve": bool,
  "explicit_strike": bool | None,
  "effective_strike": bool,
  "strike_from_cell": bool,
  "explicit_bold": bool | None,
  "effective_bold": bool,
}
```

5. `effective_strike` は、runで明示されていればその値、なければセル書式のstrikeを継承する。これは既存 `excel_preprocess/canonical.py:41-55` の契約と同じにする。
6. HTMLではrun単位で取り消し線を描画し、該当セル要素に `data-cell-strike="true"` を付ける。セル全体strikeと一部run strikeを混同しない。
7. rich-text の先頭・末尾空白は `xml:space="preserve"` を含めて保持する。現行 `trim_text_runs()`（`convert.py:3337-3348`）をXML正本経路に使ってはならない。

確認例として、`0506:E17`／`E44` の一部run strike と、`E18`／`E45` の非strikeを別々に検証する。`0204:D142`／`D144` のセル書式strikeも含める。

## 4. 軸②: 全要素への実Excel座標付与

### 現状と問題

- 図形だけは `cellref` を持つ（`_parse_drawing_shapes()`: `convert.py:812-830`）。
- 図形テーブルには `data-shape-ref` と可視位置列がある（`convert.py:1886-1906`）。
- 画像キャプションには `sheet / A1 / image N` がある（`convert.py:451-462`）。
- 一方、セルの描画データには列番号、文字列、run、bold、strike、fillしかなく、セル座標がない（`convert.py:1192-1201`）。
- 空白セル・空白行は落とされる（`convert.py:1177-1205`）。従ってHTML上の行位置はExcel行番号ではない。

### 改修仕様

1. source modelの全 materialized cell（値、式、書式のみセル、結合アンカー／被覆セル、コメント付きセルを含む）に `row`、`col`、`cell_address`、`source_ref` を付与する。
2. 可読ビューで複数セルを1段落・1表セルへ再構成する場合も、各原本セルを独立した子要素として保持する。

```html
<span class="source-cell"
      data-excel-book="0203"
      data-excel-sheet="受注一覧"
      data-excel-ref="0203:B50">
  <a class="source-ref" href="#src-0203-...-B50">0203:B50</a>
  <span class="cell-content">...</span>
</span>
```

3. 表のセル、文書フロー、メタデータカード、見出し、図形一覧、画像、pin、遷移図、コメント一覧に可視参照を出す。可読性のため参照は小型のchip表示でよいが、CSSだけで恒久的に隠してはならない。
4. Excelの空行をHTML本文の空白として全て出す必要はない。ただし、次のいずれかを満たす行は省略禁止とする。

   - materialized cellがある
   - 行高・hidden・outline属性がある
   - 結合範囲に含まれる
   - コメント、画像、図形、pin、遷移図、条件付き書式のアンカーまたは範囲に関与する

5. 純粋な暗黙空行を可読本文で畳む場合は、開始／終了実行番号を明示する。例: `空行（0203:51–74）`。HTML表示順をExcel行番号として引用させない。
6. 結合セルは、アンカーに `data-merge-range="B50:D50"`、被覆セルに `data-merge-covered-by="B50"` を付与する。既存の `build_merged_maps()`（`convert.py:3247-3263`）はマッピングの基礎として利用するが、現状の被覆セルスキップだけでは不十分である。
7. 画像は `data-excel-ref`、`data-image-order`、DrawingML object id、画像レイヤー識別子を付与する。`caption` は少なくとも `0203:B50 / image 3` を表示する。
8. pinは `data-excel-ref`、`data-pin-no`、`data-pin-object-id`、`data-pin-image-ref` を持つ。
9. 図形は `data-excel-ref`、`data-drawing-object-id`、`data-drawing-order` を持つ。

## 5. 軸③: 図形内容・遷移関係・座標対応

### 現状と問題

DrawingMLは既に直接読まれている。

- `collect_workbook_shapes()` は、図形文字、pin、画像、図を取り込む（`convert.py:385-468`）。
- グループ図形を再帰処理し、図形・画像・コネクタの絶対EMU座標を構築する（`convert.py:1028-1135`）。
- 遷移グラフは connector の接続先、矢印方向、重なり／近傍フォールバックから構築する（`convert.py:2526-2626`）。
- 遷移一覧は現状、遷移元・先の文字列のみであり、座標・connector識別子を出していない（`convert.py:2828-2852`）。
- 一方で、解決できないconnectorは `continue` される（`convert.py:2578-2586`）。これは「取りこぼしゼロ」の観点では黙殺である。

### 改修仕様

1. DrawingML inventoryをシート単位で作る。`sp`、`cxnSp`、`pic`、group、anchor種別をすべて1件ずつ記録する。
2. 各objectに以下を保持する。

```python
{
  "drawing_part": "xl/drawings/drawingN.xml",
  "object_id": "...",
  "object_name": "...",
  "object_type": "shape|connector|picture|group",
  "drawing_order": 1,
  "anchor_type": "twoCellAnchor|oneCellAnchor|absoluteAnchor",
  "anchor_ref": "B50",
  "source_ref": "0203:B50",
  "text_runs": [...],
  "box_emu": [x, y, width, height],
}
```

3. テキストを持つ全図形は、HTMLの図形台帳へ必ず出す。空文字図形もobject inventoryには残す。したがって「形状はあるが文字なし」を消失扱いにしない。
4. 各connectorは、次のいずれかの状態を明示する。

   - `resolved`: DrawingML接続idから遷移元・先が一意に解決
   - `geometry_resolved`: 明示接続idが不足し、幾何フォールバックで一意に解決
   - `unresolved`: 解決できない。connector object id、アンカー、理由を未解決台帳へ出す

5. `unresolved` connector が1件でもあれば検証はexit 1とする。推測した遷移を正本として静かに採用してはならない。
6. 遷移一覧は、文字列だけでなく次を表示する。

```text
0203:画面遷移図!B50（画面A）
  → 0203:画面遷移図!H50（画面B）
  connector=42 / anchor=0203:F50 / resolution=resolved
```

7. 同名ノードの統合（現行 `build_transition_graph()` の `text_rep` による処理、`convert.py:2593-2617`）は可読ビューだけで許容する。ただし原本object inventoryと各統合先の対応表をHTML／検証JSONに残す。テキスト同一だけを理由に原本ノードを消してはならない。
8. `shape_textbox_residuals()` は現状常に空配列を返す（`convert.py:186-198`）。改修後は「未出力 object」を本当に列挙し、空であることを検証する。常に空を返して成功扱いにしてはならない。

## 6. 軸④: 画像上の番号pinと項目定義の対応

### 現状と問題

- pin番号の正規化は実装済み（`convert.py:959-971`）。
- pinは最近接画像へ割り当てる（`assign_pins_to_images()`、`convert.py:471-`）。
- 項目表No.との一致が60%以上の場合のみオーバーレイを有効化する（`convert.py:1245-1274`、README:57）。
- 一致しないpinも可視化する実装はある（`render_image_pins()`: `convert.py:2226-2264`）。

60%は可読化の判定には使えても、完全性判定には使えない。残り40%を「画像でない」と判断して対応検証から除くことは禁止する。

### 改修仕様

1. pin、画像、項目定義No.を別々の完全inventoryとして作る。
2. pinごとに、以下を出力する。

```python
{
  "pin_no": "1-2",
  "pin_text": "(1-2)",
  "pin_source_ref": "0203:C80",
  "pin_object_id": "...",
  "image_source_ref": "0203:B60",
  "position": {"x_emu": ..., "y_emu": ..., "x_percent": ..., "y_percent": ...},
  "item_match": {
    "status": "matched|missing_item|ambiguous_item|not_screen_context",
    "item_source_ref": "0203:A120",
    "item_no": "1-2"
  }
}
```

3. 項目定義No.側には、対応pinの `source_ref`、画像 `source_ref`、画像内位置を表示する。
4. pinの画像割当は、最近接というヒューリスティックの結果であることを `assignment_method` として記録する。画像の外側へクランプした場合も `clamped=true` を記録する。
5. `matched` 以外を黙って通常pin扱いにして合格としてはならない。

   - `missing_item`: pin番号に対応する項目定義がない
   - `ambiguous_item`: 同一No.が複数候補
   - `unassigned_image`: 画像に割り当て不能
   - `not_screen_context`: 画面モックアップではないことを明示した図形pin

6. `not_screen_context` は人手承認した分類リストにだけ許可する。分類理由・object id・アンカーをHTMLへ表示する。その他の未対応はexit 1とする。
7. 既存の相互リンク `pin-<sheet>-<No>`／`item-<sheet>-<No>`（README:58、`convert.py:1815-1832, 2244-2257`）は維持するが、idの一意性を「No.だけ」へ依存させず、DrawingML object idまたはpin順序を含める。重複No.は曖昧として検証失敗にする。

## 7. 軸⑤: 結合・改行・書式の意味保存

### 現状と問題

- 結合範囲はマップ化されるが、被覆セルはレンダリングから除外される（`convert.py:1156, 1183-1187, 3247-3263`）。
- 改行は `<br>` に変換される（`escape_multiline()`: `convert.py:3375-3377`）。
- 塗りは `solid_fill()` で一部取り込まれる（`convert.py:1420-1432`）。
- 太字・strikeは取り込むが、罫線、配置、列幅、行高、hidden、outline、書式のみセルは可読ビューから落ち得る。

### 改修仕様

1. HTML本文の可読化と、原本構造台帳を分離する。
2. 各シート末尾に折りたたみ可能な「原本構造台帳」を置き、少なくとも以下を出す。

   - materialized cellの実座標
   - 値／数式／表示文字列
   - rich-text run
   - 結合範囲とアンカー／被覆状態
   - 改行の有無
   - bold、strike、fill、border、alignment
   - 行高・列幅・hidden・outline
   - コメント有無
   - 条件付き書式該当有無

3. 罫線・塗り・太字を「意味」と自動解釈して見出し等へ変換してはならない。HTMLは視覚的補助として反映してよいが、原本の書式属性を属性・台帳として残す。
4. セル内改行は表示用に `<br>` 化してよいが、原本改行文字列を `data-raw-text` または台帳へ保持する。
5. 結合範囲は `B50:D50` のように可視表示し、結合アンカー以外の被覆セルを存在しないセルとして扱わない。
6. 既存READMEの「内容のない行・列はまるごと省く」「結合範囲は残った行・列に合わせて再計算」（README:41-42）は、引用正本の説明として削除・改訂する。

## 8. 軸⑥: 非表示シート・コメント・条件付き書式

### 非表示シート

現状の `visible_worksheets()` は `sheet_state == "visible"` かつシート名に「画面遷移図」を含まないものだけを返す（`convert.py:218-230`）。READMEも非表示／veryHiddenを本文・検証対象から除外すると明記している（README:39, 65）。

改修後は以下とする。

1. 全シートを workbook.xml の順序でsource modelへ含める。
2. `visible`、`hidden`、`veryHidden` をそのまま保持する。
3. hidden／veryHiddenシートもHTML本文・サイドバー・検証対象へ含める。
4. サイドバーでは状態を明示する。例: `F06-10 [非表示]`。
5. 非表示シートを通常表示と区別したい場合は、HTML初期状態で折りたたみ可とする。ただしURLアンカー・検索・引用対象から除外しない。
6. 「画面遷移図」名称による除外も撤廃する。遷移図専用シートは遷移図として表示し、通常セル・図形・connector inventoryも残す。
7. 除外を許すのは、CLIで明示指定された場合だけとする。除外した場合はHTML先頭の生成manifestへ対象・理由・件数を記録し、通常変換のexit 0条件には使わない。

### コメント

現状 `convert.py` にセルコメント抽出はない。`excel_preprocess/ooxml.py` も worksheetの `legacyDrawing` relationshipを記録するに留まる（`ooxml.py:740-765`）。

改修後は、worksheet relationshipからコメントpartを解決し、従来コメントを抽出する。

- `xl/commentsN.xml`: author、comment `ref`、rich text本文
- VML／legacyDrawing: 吹き出し位置・サイズが解決できる場合のみ記録
- threaded comment が存在する場合: `xl/threadedComments/*` とpersons参照を解析し、対象セル、author/person、本文、日時を記録する

HTMLでは対象セルにコメント件数とリンクを表示し、シート内「コメント・注釈」一覧に本文と `0203:B50` を出す。吹き出しの座標を再現できない場合は、`位置未再現` と明示する。コメントpartを検出したのにセルコメントが0件になる場合はexit 1とする。

### 条件付き書式

現状は存在時に「HTMLへ変換していません」というwarningを出すだけである（`convert.py:1149-1154`）。`excel_preprocess/ooxml.py` は `sqref` とrule typeを取得する（`ooxml.py:743-765`）。

改修後は、条件付き書式を完全再現しない代わりに、シートの「未再現原本要素」一覧へ次を出す。

```text
条件付き書式: sqref=D10:D30, rule_types=[cellIs, expression]
```

該当セルには `data-conditional-formatting="true"` を付与する。存在をwarningだけで済ませず、範囲とrule種別の差分0検証対象にする。

## 9. 引用規約

L1オラクルは、HTML表示順・DOM行番号・スクリーンショット座標を引用しない。

| 対象 | 引用形式 |
|---|---|
| セル | `0203:B50（sheet=受注一覧）` |
| 結合セル | `0203:B50:D50（sheet=受注一覧、anchor=B50）` |
| strike run | `0203:E17 run=2（sheet=..., strike=true）` |
| 図形 | `0203:C80 shape=<object-id>` |
| 画像 | `0203:B60 image=3` |
| 番号pin | `0203:C80 pin=1-2 → item=0203:A120 → image=0203:B60` |
| 遷移 | `0203:B50（画面A） → 0203:H50（画面B）, connector=<object-id>` |
| コメント | `0203:B50 comment=<comment-id>` |
| 条件付き書式 | `0203:D10:D30 cf=<rule-type>` |

旧HTML行番号は完全廃止する。特に、0204の旧HTML行6285等は実セル座標ではなく、正しい参照は `0204:D142`／`D144` である。

## 10. 忠実性検証

`excel_preprocess/verify.py` は既にセル、行列属性、結合、drawing residual、条件付き書式残差を比較する基礎を持つ（`verify.py:320-359`）。ただし現在のdrawing residualは存在・アンカー中心であり、convert.pyのHTML出力との完全性比較には拡張が必要である。

新設する `excel_to_html/verify.py` または既存 `excel_to_html/verify.py` の拡張は、原本source modelと生成HTMLの機械比較を行う。

### exit 0 条件

以下を全て満たす場合だけexit 0とする。

1. workbook.xml上の全シートがHTML manifestに1件ずつ存在し、sheet名・順序・stateが一致する。
2. 全 materialized cell がHTML上のsource ledgerに1件ずつ存在し、book、sheet、実セル座標が一致する。
3. セル文字列、数式、改行、rich-text run、`effective_strike`、bold、結合状態、行／列hidden、コメント有無、条件付き書式範囲が原本と一致する。
4. HTML本文で再構成された各セル断片が、source ledgerの該当セルを参照する。
5. DrawingML inventoryの `shape`、`connector`、`picture` の件数・object id・アンカー・順序が一致する。
6. テキストを持つ全図形の文字列とrun数が一致する。
7. 全画像にアンカー、DrawingML順序、HTML要素がある。
8. 全番号pinにアンカー・画像割当・項目定義対応状態がある。未承認の `missing_item`、`ambiguous_item`、`unassigned_image` は0件。
9. 全connectorが `resolved` または人手承認済みの明示的除外であり、未解決は0件。
10. コメントpartが存在する場合、コメント数・対象セル・本文が一致する。
11. 条件付き書式の `sqref` とrule typeが一致する。
12. source refの重複・欠落・デッドリンクが0件。
13. `apply_forced_strikes` 相当の例外表、文言置換、ブック名分岐が存在しない。

差分出力は必ず原本識別子を含む。例:

```text
HTML_RUN_STRIKE_MISMATCH 0506:E17 sheet=在庫連携 run=2 expected=true actual=false
HTML_PIN_ITEM_MISSING 0203:C80 pin=1-2 image=0203:B60
HTML_CONNECTOR_UNRESOLVED 0203:F50 connector=42
HTML_COMMENT_MISSING 0203:B50 comment=comment1
```

「未対応要素」とHTMLに表示しただけでexit 0にしてはならない。

## 11. D2相当の受入ゲート

既存 `excel_preprocess` のreal-data goldenを再利用しつつ、HTML正本用goldenを追加する。期待値はconvert.pyの出力から自己生成してはならず、独立したOOXMLダンプとExcel実機確認で作成する。

必須ケース:

- `m03-11-category-strike`: 0204、`D142`／`D144` のセル書式strike、結合、長大シート、実座標。
- `a06-08-store-stock-retraction`: 0506、`E17`／`E44` のrun strikeと `E18`／`E45` の生存文、隠し行。
- `rich-text-run-strike`: 1セル内のstrike/non-strike混在runと `xml:space="preserve"`。
- `merged-and-empty-rows`: 結合、書式のみセル、空行、行高。
- `multi-sheet-same-book`: 同一ブック内複数シート、hidden／veryHidden状態。
- 0203実断片: 図形、画像、番号pin、画像上pin、テキストボックス、connector付き遷移図を含む。
- コメント実例: 従来コメントを含む実ブック断片。threaded comment が現物に存在する場合は別ケース。
- 条件付き書式実例: rule typeとsqrefを含む実ブック断片。
- F06-10等、仕様を持つ非表示シートの実例。

ゲート合格条件は、全caseについて以下が連続してexit 0であること。

```text
原本OOXML独立ダンプ
→ excel_preprocess source/golden検証
→ convert.py変換
→ convert HTML検証
→ source-ref・shape・pin・画像・遷移・comment・hidden・CFの差分0
```

このゲートに合格するまで、B1量産へ進んではならない。

## 12. 非目標・アンチパターン

- 可読化を理由にセル、図形文字、コメント、番号pin、遷移、書式、空行、結合被覆セルを捨てること。
- `apply_forced_strikes()` のようなブック名・シート名・文言依存の補正。
- HTML行番号、DOM順、見た目だけを引用正本にすること。
- hidden／veryHiddenシート、画面遷移図シートを黙って除外すること。
- `data_only=True` のキャッシュ値だけを正本とし、式・XML文字列構造・run情報を失うこと。
- 60% pin一致の可読化ヒューリスティックを、完全性の合格条件に使うこと。
- connector解決失敗を `continue` して遷移図から消すこと。
- 条件付き書式、コメント、図形をwarningだけで済ませ、差分0検証から外すこと。
- 同名ノード統合を原本object削除とみなすこと。

## 13. sonnet著者向けDoD

- `convert.py` を拡張し、Python標準の `zipfile`／`xml.etree.ElementTree` と既存 `openpyxl` を使う。
- `apply_forced_strikes()` とその呼出しを完全削除する。
- XML直読で、セル書式strike、shared string rich-text、inlineStr、`val="0"`／`false`、セル継承を実装する。
- 全シートをstate付きでHTML出力する。
- 全 materialized cell、shape、pin、画像、comment、connectorへ実Excel参照を付ける。
- 可読ビューと原本構造台帳を両立させる。
- unresolved objectを成功扱いにしない。
- READMEを、hidden除外・画面遷移図除外・空行削除・条件付き書式warningのみの説明から更新する。
- HTML検証CLI、golden manifest、独立期待値生成手順、exit code契約を実装と同時に提供する。
- golden全件と通常全ブック変換がexit 0であることを記録する。

## 14. Codex敵対レビュー観点

- `cell.font.strike == false` でも、`sharedStrings.xml` のstrike runを検出できるか。
- `<strike val="0"/>` を誤ってtrueにしていないか。
- `inlineStr`、セル全体strike、混在run、`xml:space="preserve"` を別々に試験したか。
- `0204:D142`／`D144`、`0506:E17`／`E44` と非strike隣接セルを正しく区別するか。
- HTML本文の任意の文言から、実セル座標へ一意に遡れるか。
- hidden／veryHiddenシート、書式のみセル、結合被覆セル、hidden行、末尾行を落としていないか。
- 0203の843図形、79画像、1,882 DrawingML文字runについて、inventory件数が原本と一致するか。
- pinの60%閾値や最近接割当を使って、未対応pinを合格扱いにしていないか。
- connectorの未解決、同名ノード統合、空文字図形を黙って消していないか。
- コメントpart・条件付き書式partが存在するのに、HTML台帳・検証対象から漏れていないか。
- golden expectedを実装出力からコピーして自己承認していないか。
