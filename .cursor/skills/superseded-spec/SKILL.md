---
name: superseded-spec
description: Excel基本設計が廃止（削除する／廃止／不要／踏襲しない）を宣言した項目・画面・機能が、現行ソースからリバースした機能設計書に現行仕様として残っている問題を扱う。記述は消さずに残したうえで「刷新後は実装不要」と明示するための、検出・台帳・バナー描画・検証の手順。廃止指示の洗い出し、台帳への判定記録、HTML設計書へのバナー反映、判定漏れの検査に使用する。正本と派生成果物（Markdown↔HTML）の一致確認は doc-parity-check、文書横断の整合は spec-consistency-check の領分であり、本スキルは「Excelが現行実装の記述を無効化する非対称（design-supersedes-source）」だけを扱う。
---

# Excel廃止仕様の明示スキル

## なぜ（背景）

HTML設計書は、Excel基本設計（＝顧客と合意した**刷新後**の仕様）をHTML化し、そこへ現行実装からリバースした機能設計書（`functions/**/*.md`）を埋め込んで作られている。

ここで非対称が生じる。**Excelが「この項目を削除する」と廃止を宣言していても、現行実装のリバースはその機能を現行仕様として書く。** 埋め込まれた結果、読み手は廃止済みの仕様を「実装すべき仕様」と誤読する。

実例（F07-04 大会申込）: Excel `0214` が「識別ID:1-12 現行の『チーム人数』を削除し『チーム戦』チェックボックスを追加する」と宣言しているのに、機能設計書は「チーム人数が1より大きいとき…メンバーは席次つき未承認の申込選手として登録し、招待メールを送る」と書いていた。人数が真偽フラグに変わる以上、招待メールも未承認登録も承認導線も刷新後には要らない。刷新先 `ec-cube-enterprise` にも実装は無い。

これは単発ではない。Excel本文側の廃止指示は200行規模あり、名指しされた項目の多くが機能設計書に現行仕様として残っている。

## 原則

- **記述は消さない。** 現行実装のリバースとしての価値は残る。消すのではなく「刷新後は実装不要」と明示する。
- **正典は Excel。** 廃止の宣言そのものがExcel側の記載であり、「Excelに記載が無い実装確認値」ではない。ソースに実装が在ることを理由に現行仕様として書いてはならない（[[reverse-design]] 1b-3 / 1d(0)）。
- **判定を人手の記憶に置かない。** 検出器・台帳・描画・検証を通す。偽陽性も `not-superseded` として台帳に残す（残さないと毎回同じ候補が再提示される）。
- **フェーズ延期は廃止ではない。** Ph2/フェーズ2は `design_impl_drift_report/phase2_excluded_functions.json` の領分。この台帳には入れない。

## 情報の持ち方（二層）

| 層 | 実体 | 役割 |
|----|------|------|
| 機械用の正本 | `functions/superseded_specs.json`（台帳） | 検出突合・verify・網羅強制 |
| 人間用の記述正本 | 機能設計書Markdownの「リニューアル移行時の扱い」＋該当記述行 | 読解中の確実性 |
| 派生物 | HTML設計書の「刷新後は実装不要」バナー | 発見性 |

台帳とMarkdownの二重管理が腐らないよう、**同期を verify が強制する**（台帳エントリの定型句がmdに無ければNG）。

## バナーは注入ではなく描画

バナーは `integrate_function_docs_into_excel_html.py` の `render_block()` と `convert_function_spec_html.py` の `render_document()` が、台帳を読んで**描画の一部として**出す。後段注入にしてはならない — `strip_existing_embeds()` が埋め込みブロックを毎回作り直すため、ブロック内部への注入は integrate を回すたびに消える。描画に含めれば冪等性・実行順序・復元の問題が構造的に消える。

Excel由来HTML（`excel_to_html/output/`）と単体プレビュー（`function_spec_html_preview/`）の両方に出る。バナーの各行は Excel該当行のアンカー（`0214…html#item-sheet-5-1-12`）へリンクする。

## ハーネス（実行）

```bash
S=.cursor/skills/function-spec-html-render/scripts

# 1) 廃止指示の候補を洗い出す（ノイズ込み・人手トリアージ前提）
python3 "$S/detect_superseded_specs.py" scan

# 2) 判定して台帳へ記録する（functions/superseded_specs.json を編集）
python3 "$S/superseded_specs.py"          # 台帳の中身と定型句の一意性を確認

# 3) バナーを反映する（機能設計書の埋め込みと同じ経路）
python3 "$S/integrate_function_docs_into_excel_html.py"

# 4) 検証（バナー欠落／台帳⇔md同期／新規の未判定指示）
cd excel_to_html && uv run python verify.py

# 補助: 初期在庫をベースラインへ退避する（ratchet の起点。通常は再実行しない）
python3 "$S/detect_superseded_specs.py" baseline
python3 "$S/detect_superseded_specs.py" check   # 新規候補だけを検出
```

パイプライン順序は変わらない: convert → integrate（このときバナーも出る）→ orphan → endpoint-supplement build → verify。

## 台帳のスキーマ

`functions/superseded_specs.json` の `entries[]`。

| キー | 内容 |
|------|------|
| `id` | `書番-識別ID`（識別IDが無い★注記は `書番-シートID-スラッグ`）。HTMLの行番号は再生成で動くので正キーにしない |
| `book` / `bookTitle` / `sheets[]` | 根拠のExcel位置。`sheets[].anchor` は `item-sheet-5-1-12` 形式のHTMLアンカー（バナーのリンク先） |
| `identifierId` | 識別ID。★注記など無い場合は `null` |
| `verdict` | `deleted` / `replaced`（`replacement` 必須） / `restructured` / `not-superseded`（偽陽性。`reason` 必須） / `needs-triage` |
| `scope` | `FUNCTION_SCOPE`（機能・画面まるごと） / `ITEM_SCOPE`（項目単位） |
| `target` | 廃止対象の名前 |
| `designQuote` | Excelの指示原文（検出器の突合に使う） |
| `impliedUnneeded[]` | これに伴い不要になる周辺機構（例: 招待メール・未承認登録・承認導線） |
| `affects[]` | `featureNo` と `doc`（機能設計書のパス）。ここに書いたmdには廃止の明記が必要 |
| `currentImpl` / `renewalImpl` | 現行ソースと刷新先の実装状況（file:line 付きで） |
| `evidenceStrength` / `reason` | 判定の根拠と強さ |

`deleted` / `replaced` / `restructured` だけがバナーに描画される。`not-superseded` と `needs-triage` は描画されない（が、台帳に残ることで再提示を止める）。

## 判定の勘所

- **廃止か、単なる値か。** 商品公開ステータスには「廃止」という選択肢**値**がある。「『商品公開ステータス』を『廃止』とする場合は…」は廃止指示ではない。検出器は鉤括弧の中身を除いて廃止語を探すが、それでも残る偽陽性は `not-superseded` で落とす。
- **削除リンク・削除ボタンの挙動は廃止ではない。** 「『OK』押下時に該当データを削除する」は正常な機能仕様。
- **スコープを読み分ける。** 廃止の宣言が1項目だけを指すのか、機能・画面全体を覆うのか。機能全体でないなら `ITEM_SCOPE`。
- **波及を洗う。** 廃止項目そのものだけでなく、それに依存する機構まで `impliedUnneeded` に書く。チーム人数（整数）が真偽フラグになれば、人数を前提とする「N-1人分のメール入力」が成立せず、招待・未承認登録・承認導線がまとめて不要になる。ここを書かないと読み手は周辺機構を実装してしまう。
- **刷新先も見る。** `ec-cube-enterprise` に実装が無いことは廃止判定の裏付けになる。逆に実装が在るなら、廃止判定を疑う。

## Markdownへの書き方

```markdown
### Excel基本設計により廃止された仕様（刷新後は実装不要）

本書は現行実装からのリバースであり、以下は現行挙動として記述しているが、Excel基本設計が廃止を宣言している。刷新後は実装しない。

- チーム人数（※Excel基本設計 0214 識別ID:1-12 により廃止。刷新後は実装しない）。…これに伴い次も刷新後は実装しない。…
```

加えて、該当記述の行（表のセルなど、読み手が実際に読む場所）にも定型句を添える。

定型句は台帳から機械生成される（`superseded_specs.md_marker()`）。識別IDがあるものは `Excel基本設計 {書番} 識別ID:{識別ID} により廃止`、無いものは `Excel基本設計 {書番} {シート名}「{対象}」により廃止`。**エントリごとに一意でなければならない**（同一の定型句が2エントリで衝突するとverifyが同期を見分けられない。`assert_unique_markers()` が検査する）。

## 確認

- `cd excel_to_html && uv run python verify.py` が `VERIFY OK`。次の3つを検査する。
  - 台帳に載る機能設計書の埋め込み節・単体プレビューにバナーが在る（**欠落は即NG**。「バナーが無いファイルは検査対象外」にすると、レンダラが壊れて全部から消えても素通りする）
  - 台帳エントリの定型句が機能設計書Markdownに在る（台帳⇔md同期）
  - ベースラインにも台帳にも無い**新規**の廃止指示が無い（ratchet）
- `python3 .cursor/skills/function-spec-html-render/scripts/superseded_specs.py` が `OK: 定型句はエントリごとに一意です`。
- 初期在庫（トリアージ待ちの既知候補）は `functions/superseded_candidates_baseline.tsv` に退避してあり、赤くならない。消化したら台帳へ移し、ベースラインから消す。
