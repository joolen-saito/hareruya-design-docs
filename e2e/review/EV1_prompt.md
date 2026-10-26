# レビュー依頼: E2E のエビデンス基盤とスキル（1巡目）

あなたは独立したレビュアーです。著者は別にいます。読み取りだけで、ファイルを変えないでください。

## 依頼者の要求
「結合テストケースに従って e2e テストコードを実装し、かつ実施してキャプチャ付きのエビデンスを出力するように、ハーネスと skills を構築してほしい」

## 対象（新規・変更。リポジトリ /home/y-saito/Developments/hareruya-design-docs）
- e2e/lib/evidence.ts（新規。画面を撮る）
- e2e/lib/case.ts（変更。step/expected の前後で撮る・capture を足した）
- e2e/lib/evidence_reporter.ts（新規。Playwright のレポーター。evidence/<機能>/<テストID>/result.json と画像を書く）
- e2e/tools/evidence_index.mjs（新規。result.json から MD・HTML・TSV を作る。正本との一致・判定の重ね合わせ）
- e2e/tools/evidence_check.mjs（新規。検査）
- e2e/tools/evidence_judgements.py（新規。判定の表と playwright_cases.tsv への反映）
- e2e/tools/run_evidence.sh（新規。機能ごとに pw_run.sh を呼ぶ）、e2e/tools/evidence_pack.sh（新規）
- e2e/tools/pw_run.sh・e2e/tools/coverage.mjs（--list を足した）・e2e/playwright.config.ts・e2e/.gitignore・e2e/README.md（変更）
- .codex/skills/hareruya-e2e-case-evidence/SKILL.md と references/*.md（新規のスキル）
- 動作例: e2e/evidence/M03-14/（実行して出たエビデンス。いま裏で残りを流している最中なので、増えていく）

## 正（オラクル）
- 依頼者の決まり: e2e/HANDOFF_codex.md の2章、e2e/README.md（変更前の部分）、integration_test/casegen/build_all_test_cases.py の冒頭の説明（playwright_cases.tsv の扱い）
- Playwright 1.64 のレポーター API（e2e/node_modules/@playwright/test 以下の型定義 reporter.d.ts など）

## 重点観点
1. エビデンスが事実と違うものを出す道筋が無いか（手順と画像・状態の対応づけの誤り、合格でないものを合格と出す、落ちた場面の誤り、実施日時・指紋の不一致で古い判定を新しい実施に当てる、など）。具体的な入力で再現できる形で示す。
2. キャプチャがテストの合否やふるまいを変えてしまう道筋が無いか（例外が漏れる・待ちが変わる・ダイアログ・別タブ）。
3. 自動判定（合格／不合格／未判定／スキップ）の決め方と、判定の表・playwright_cases.tsv への反映の条件が、正の決まり（合格は条件なしだけ、未判定は載せない、既存の行を消さない）と食い違わないか。
4. run_evidence.sh の絞り込み（--todo / --failed / 番号）・呼び直し・停止の条件の誤り。pw_run.sh の -g の照合で別のケースが混ざる・漏れる道筋。
5. evidence_check.mjs が見逃す、エビデンスの不備。
6. スキルの文書が、実在しないパス・コマンド・オプションを書いていないか。正の決まりと食い違う指示が無いか。依頼者の要求（実装→実施→キャプチャつきエビデンス）の流れに抜けが無いか。
7. 物理名の規約（.cursor/skills/logical-naming/SKILL.md）に反する書き方。

## 指摘の対象外
- 文体・表現の好み、既存の基盤（変更していない lib/catalog.ts・seeds.ts など）の設計の是非。
- 旧スキル hareruya-playwright-standard-tests・e2e-test-cases の中身（使わないと明記している）。

## 出力の形
指摘が無ければ `NONE` の1語だけ。あれば1件ごとに:
- 主張（何が誤りか）
- 実際（file:line と、そこに書かれていること。再現の入力）
- 判定（誤り／漏れ／危うい）
- 修正案（1〜2文）
重要なものから順に。推測は推測と書く。
