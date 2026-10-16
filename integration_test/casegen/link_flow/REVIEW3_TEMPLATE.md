# 敵対レビュー: APIから画面・管理画面どうしの連携の結合テストケース（群 {CODE}・3巡目＝レビュー後の変更だけ）

これは成果物のレビューである。著者（別のAI）と依頼元を信用せず、事実は自分で設計書とファイルを読んで確認せよ。
褒める必要はない。ファイルは変更するな（読み取りのみ）。

パスはすべて `/home/y-saito/Developments/hareruya-design-docs/` からの相対である。

## 今回見るもの

この群は codex のレビューを2巡受けた。そのあとに入った次の変更は、まだ誰もレビューしていない。今回はここだけを見よ。
2巡目までに通った内容（変更の無いケース・項目）を一から見直す必要はない。

**A. 2巡目の指摘への反映**
- 指摘: `integration_test/casegen/link_flow/review/{CODE}_r2_findings.md`
- 裁定と直したこと: `integration_test/casegen/link_flow/review/{CODE}_r2_dispositions.tsv`
- 著者の報告: `integration_test/casegen/link_flow/gen_{CODE}/report.md` の「レビュー2巡目の反映」の節

**B. 合流の直前に依頼元が行った置き換え**（{NLOG}箇所）
- 記録: `integration_test/casegen/link_flow/fix_idents_log.tsv` の「群」が {CODE} の行（列: 群・行（テストIDまたはシードID）・置換前・置換後）。置き換えの規則は `integration_test/casegen/link_flow/fix_idents.py` の冒頭
- 目的: 前提条件の検査 G5（ケース専用データの識別子が全機能で一意）に通すため。検査の字句は `[A-Za-z0-9][A-Za-z0-9_.@\-]{3,}` のうち英字と数字を両方含むもの（機能IDの形 `M04-09` と〔〕で囲んだ控えの呼び名は数えない。`integration_test/casegen/precond/gate_precond.py` の idents）。
  - パスワード「Passw0rd!X」→「Passw0rd-X」（既存シードと同じ文字列＝既存のアカウントを指すものは変えていない）
  - 共有データの名前に入っていた「機能番号＋群」の語を、機能IDの形と群の文字に分けた（例「A0603」→「A06-03」、「M0409RD店舗A」→「M04-09 RD店舗A」、「A06-03AB試験店舗」→「A06-03 AB試験店舗」）
  - 群 AC だけ: 共有の商品名「AC申込用サプライ03/04/05」→「…甲/乙/丙」（申込時に自動で保存されるメモの値も同じく変わる）
- 置き換えたのはテストID・シードID・使用シードの列以外のセル。語の途中（「M0327RB-001」の「M0327RB」など）は変えていない（つもりである。そこを確かめよ）。
{MANUAL}

## ファイル

- ケース: `integration_test/casegen/link_flow/cases/{CODE}_test_cases.tsv`（14列）、シード: `integration_test/casegen/link_flow/cases/{CODE}_seed_data.tsv`。どちらも上の変更をすべて当てたあとの版で、これが今回のレビュー対象である。
- 著者への依頼文: `integration_test/casegen/link_flow/gen_{CODE}/prompt.md`（範囲・ケースにしてよい条件・縛りの正）
- 2巡目までの検証項目: `integration_test/casegen/link_flow/REVIEW_TEMPLATE.md` の「検証してほしいこと」1〜6
- 判定単位: `integration_test/viewpoint_canonical/viewpoints_canonical.tsv` の IT-0364・IT-0365・IT-0340
- このケースはまだ機能ごとのケースファイルへ合流していない（合流はこのレビューの後）。指摘は群のファイルのテストIDで書け。

## 正本

- 機能設計書: `functions/*/<機能IDの小文字>_*.md`（`_archive` は読まない）
- HTML設計書: `excel_to_html/output/<ブック>_*.html`。機能とシートの対応は `functions/function-sheet-map.tsv`
- 判定基準: `integration_test/SCOPE.md`。前提条件の規約: `integration_test/casegen/precond/README.md` の P1〜P13・類型 T1〜T4
- 既存ケース: `integration_test/casegen/all_test_cases.tsv`

実装コード（`/home/y-saito/Developments/ec-cube-enterprise` ほか）は入力制約の確認に読んでよいが、期待結果の正否は設計書で判定せよ。
他の群のファイルと、`review/` の他の群の出力は読むな。

## 検証してほしいこと

1. **A の反映が正しいか**: 裁定が採用・一部採用の指摘それぞれについて、「直したこと」が実際にケース・シードに入っているか、直し方が設計書に照らして正しいか。直したことで同じケースや他のケースに新しい誤り（手順と期待結果の食い違い、事前準備に無い状態の前提、番号の連番の乱れ、使用シードの付け忘れ）が出ていないか。却下した指摘は理由を読み、新しい根拠が無ければ再提示するな。
2. **2巡目で足したケース**（裁定の「直したこと」に追加とあるもの）は、`REVIEW_TEMPLATE.md` の1〜6をすべて当てて見よ。
3. **B の置き換えが意味を変えていないか**。記録の行ごとに:
   - 同じデータを指す箇所（シードの論理名・状態・投入方法、事前準備、手順、期待結果）がすべて同じ置換後の文字列になっているか。片方だけ変わった、長い語の一部に旧い文字列が残って別のデータに見える、といった食い違いが無いか。
   - 置換後の値が、それを入力する項目の制約（最大桁数、使える文字種、パスワードの規則〔必須の文字種・使える記号〕、半角英数字のみ等）を設計書の上で満たすか。
   - 値に依存する期待結果（並び順、部分一致の検索結果、件数、表示の切り詰め）が、置換後も成り立つか。
   - 変えてはいけないもの（画面が振る番号、設計書に書かれた固定の表示値・メッセージ、既存シードのアカウント、他のファイル名と一致すべき名前）を変えていないか。
4. **手で直した箇所**（あれば上に記載）が設計書に照らして正しく、他の箇所と食い違っていないか。

修正案は、G5 に再び掛かる形（例: 「Passw0rd!X」に戻す、群の番号だけの語に戻す）にするな。

## 指摘対象外

- 2巡目までに通った、変更の無い内容。この判定を結合テストに足すこと自体の是非。実機で未実行であること。
- `functions/dead-spec-register.tsv` に登録済みの不機能仕様、`functions/phase2_candidates.tsv` のフェーズ2見送り。

## 出力形式

指摘が無ければ `NONE` の1語だけを出力せよ。指摘は1件ごとに次の形で書け。結論を先に置け。

```
### 指摘N（重大度: Major / Minor）対象: <テストID または シードID>
変更: A（2巡目の反映）/ 追加ケース / B（置き換え）/ 手直し
主張: （ファイルの記述）
実際: （確認した事実。file:line を付ける）
判定: 反映不備 / 反映による新たな誤り / 期待結果の捏造 / 推測による接続 / 前提不成立 / 手順不備 / 置換の食い違い / 入力制約違反 / 規約違反
修正案: （書き直した文、削除）
```
