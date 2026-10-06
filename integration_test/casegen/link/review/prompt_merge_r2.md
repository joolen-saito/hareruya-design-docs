# 敵対レビュー: 合流時に機械改名した結合テストケース

これは成果物のレビューである。著者(claude)を信用せず、事実は自分で確認せよ。褒める必要はない。ファイルは変更するな（読み取りのみ）。

パスはすべて `/home/y-saito/Developments/hareruya-design-docs/` からの相対である。

## 経緯

機能間データ連携の結合テストケース142件を、機能ごとのケースファイル `integration_test/casegen/cases/<機能ID>_test_cases.tsv`（11列）と
`<機能ID>_seed_data.tsv` へ合流させた（依頼者決定 2026-10-06）。合流後のテストIDと合流前のIDの対応は
`integration_test/casegen/link/merged_map.tsv`（判定ID列つき）。

合流直後、前提条件のゲート `integration_test/casegen/precond/gate_precond.py`（規約は `precond/README.md` の P1〜P13）で126件が落ちた。
著者は次の機械処理で通した。**この機械処理が、ケースを実行できないものにしていないか**を見てほしい。

1. **識別子の改名（65箇所）**: 連携ケースが決めた識別子（名称・コード・メール・パスワードなど）が他のケースや他のケース専用シードと重なっていたので、
   「元の識別子＋機能IDとケース番号」（例 `Passw0rd`→`Passw0rdB0805n016`、`L001`→`L001M1015n072`）へ改名した。
   記録は `integration_test/casegen/link/merged_renames.tsv`（テストID／旧／新／置換箇所数）。処理は `link/fix_merged_gate.py`。
   置換は、そのケースの行の 事前準備・手順・期待結果 と、そのケースが使うケース専用シードの行（論理名・状態・属性・用途・投入方法）にだけ当てた。
   語の境界は「直前が英数字でない、直後が英数字・`_`・`.`・`@`・`-` でない」。
2. **レコードIDの書き方の変更**: IT-M16-01-047・048 の「ID 1」「ID 2」「ID 3〜11」を「バナーID 1」などに、IT-M10-09 のシードの「使用テンプレート=ID 1009102」を「使用テンプレート=テンプレートID 1009102」にした。
3. **ケース専用シードの追加**: IT-M10-01-044・045 に `S-M10-01-L-BASE-044`・`-045`（店舗基本情報の開始時状態）を足し、事前準備④の参照先を変えた。
4. **未整備の前提の登録**: `precond/open_preconditions.tsv` に `S-B08-02-L-ENV`（IT-B08-02-014〜016）を足した。
5. **要求IDの整理**: IT-M11-02-038〜040 の要求IDから、下流機能の要求ID（`materials/M11-02_requirements.tsv` に無いもの）を外した。
6. テストIDの振り直しに合わせ、ケース専用シードIDの末尾3桁を新しいケース番号にした（`link/merge_into_cases.py`）。

## 正本

- 合流後のケースとシード: `integration_test/casegen/cases/`（対象は `merged_map.tsv` の「新テストID」の142件）
- 合流前のケースとシード（改名前の姿）: `integration_test/casegen/link/cases/<機能ID>_link_test_cases.tsv`・`_link_seed_data.tsv`
- 設計書: `functions/*/<機能IDの小文字>_*.md`、`excel_to_html/output/<ブック>_*.html`（機能とシートの対応は `functions/function-sheet-map.tsv`）
- 規約: `integration_test/casegen/precond/README.md`、`integration_test/SCOPE.md`

## 前巡の指摘と対応

前巡の指摘は `integration_test/casegen/link/review/codex_merge_r1_findings.md`、裁定は `review/merge_dispositions.md`、直した箇所は `link/merged_rename_fixes.tsv`。
指摘4（手順で入力する値の改名）は却下した。理由は裁定のとおり。再提示するな。

## 検証してほしいこと

同じ指摘の再提示はするな。次だけを見よ。

1. 前巡の指摘1・2・3・5・6が正しく直っているか。直しで新たな食い違いが入っていないか。
   特に IT-F08-03-037〜039 は、会員のパスワード（ケース専用）と管理者のパスワード（共有）が、事前準備・手順・シードでそれぞれ揃っているか。
   IT-F05-06-052〜058 は、ケースの文の商品コードと共有シードの商品コードが揃っているか。
2. 前巡と同じ種類の誤り（共有可のシードが定める値をケース側だけ改名した、用途欄の参照が違う）が、前巡で挙げた以外のケースに残っていないか。
   `link/merged_renames.tsv` の全行について、改名後の値が、そのケースが使う共有可のシードの値と食い違っていないかを確かめよ。
3. 改名後の値が、設計書の画面項目定義（最大文字数、文字種、形式）に収まらないものが無いか。前巡で見ていない行を優先せよ。

## 指摘対象外

- ケースの内容そのもの（期待結果の根拠、判定単位の範囲、重複）。これまでのレビューで裁定済み（`link/review/*_dispositions.md`）。
- 実機で未実行であること。
- `verify_cases.py` の「引用不一致」10件（自機能の設計書しか読まない検査の限界で、把握済み）。

## 出力形式

指摘が無ければ `NONE` の1語だけを出力せよ。指摘は1件ごとに次の形で書け。結論を先に置け。

```
### 指摘N（重大度: Major / Minor）対象: <テストID>
主張: （著者の処理）
実際: （確認した事実。file:line を付ける）
判定: 入力値が通らない / 置換漏れ / 過剰な置換 / 参照の不一致 / 書き方の不一致
修正案: （直した値・文）
```
