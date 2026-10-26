---
name: hareruya-e2e-case-evidence
description: 晴れる屋の結合テストケース（integration_test/casegen/cases/<機能ID>_test_cases.tsv とシード表）に従って e2e/ の Playwright テストコード（画面の部品・シード・DB確認・テスト）を実装し、手元の環境で1件ずつ流して、手順ごとの画面キャプチャつきのエビデンス（MD・HTML・TSV）を出し、不合格を切り分けて判定と合否の一覧へ記録する。結合テストケースのE2E化・実行・エビデンス作成・流し直し・判定の記録を頼まれたときに使う。
---

# 結合テストケース → E2E 実装 → 実行 → エビデンス

結合テストケースを正として、`e2e/` の Playwright 基盤でテストを書き、流し、画面つきのエビデンスを残し、合否を判定して記録するまでの手順。

- 基盤の使い方の正本は `e2e/README.md`、これまでの経緯と判断待ちは `e2e/HANDOFF_codex.md`。最初に両方を読む。
- 古いスキル `hareruya-playwright-standard-tests`・`e2e-test-cases` は、いまは無い旧基盤（`integration_test/e2e/*_e2e_cases.md`・`e2e/helpers/`）向け。この作業には使わない。

## 守ること（例外なし。詳しくは [references/RULES.md](references/RULES.md)）

1. **テストケースが正。** 落ちても正本（`cases/`）・期待結果・アプリ（ec-cube-enterprise）を変えない。直してよいのは `e2e/` の中だけ（セレクタ・待ち方・シードの画面操作）。
   - 例外は1つだけ: 設計書が画面と合っていて手順だけが誤っているとき、`rulings.tsv` の裁定で手順を直す（期待結果は直さない。RULES.md の4）。
2. **期待結果を弱めない。操作をせずに合格にしない。** 手順が画面で実行できず、期待結果が操作の結果を見るものなら不合格。
3. **テストデータは画面から作る。** DB は参照（SELECT）だけ。DB での準備が要るケースは依頼者の指示があるまで着手しない。
4. **Playwright は全体で1本。** 流すのは `e2e/tools/run_evidence.sh`（中で `pw_run.sh` のロックを取る）。担当（サブエージェント）は同時に2人まで。重い処理は `nice` で1本ずつ。
5. **物理名は書かない。** テスト・注記・確かめのメッセージ・記録は業務の言葉。物理名はセレクタ・HTTP のパス・SQL の中だけ（`.cursor/skills/logical-naming/SKILL.md`）。
6. **コミット・プッシュ・共有の開発環境での実行は、依頼者の指示があるまでしない。** 資格情報をファイルに書かない。

## 流れ

### 1. 対象を決めて読む

```bash
cd e2e
node tools/coverage.mjs <機能ID>               # 正本のケース数・テストのある数・シードの作り方のある数
```

読むもの（全体検索はしない。この機能のファイルだけ）:

- `integration_test/casegen/cases/<機能ID>_test_cases.tsv`・`<機能ID>_seed_data.tsv`（正本。1行1ケース・1行1シード）
- 設計書の写し `integration_test/casegen/datapattern/units/<機能ID>/design.txt`（行番号で根拠を示すとき）
- `e2e/review/<機能ID>_progress_*.md`（前回の記録。**再実行の制約**＝固定の商品コードが残る など、を必ず確かめる）
- 似た機能の `e2e/pages/`・`seeds/`・`db/`・`spec/`（部品を流用する。同じ画面の部品を二重に作らない）
- 画面の作り（セレクタ・遷移）はアプリの実ソース `/home/y-saito/Developments/ec-cube-enterprise`（Twig・Controller・Form）。**期待値はここから取らない**

### 2. ケースを振り分ける

各ケースを「実装する」「実装しない（理由）」に分け、記録（`e2e/review/<機能ID>_progress_<日付>.md`）の最初に表で書く。実装しない理由の典型:

- シードの投入方法が DB での準備・DB での削除（依頼者の指示待ち）
- 外部の試験環境（スマレジ・ユニサーチ・決済など）が要る
- 入力ファイル（画像など）の中身が正本で決まらない（推測で作らない）
- フェーズ2・除外済み（`cases/` に無いケースは、そもそも書けない）

### 3. 実装する（[references/IMPLEMENTATION.md](references/IMPLEMENTATION.md)）

- 画面の部品 `pages/`（セレクタはここだけ）、シード `seeds/<機能>.ts`（シード表1行＝`defineSeed` 1つ）、DB確認 `db/<領域>.ts`（SQL はここだけ）、テスト `spec/<機能群>/<機能>.spec.ts`。
- `caseTest("IT-…", …)` でテストIDを文字列でその場に書く。正本の手順1つ＝`step(n)` 1つ、最後に `expected()`。手順・期待結果の文はコードに写さない（エビデンスには正本の文が出る）。
- 画面は自動で撮られる（手順1の前・各手順のあと・期待結果のあと）。途中の画面も要るとき（モーダル・ダウンロード前など）だけ `capture("ラベル")`（手順の中ならその手順、手順の外なら直前の手順の画面として残る）。
- 画面で実行できなかった・解釈したことは `test.info().annotations.push({ type: "手順の注記", … })` で残す（エビデンスの注記に出る）。

```bash
npm run typecheck
node tools/coverage.mjs <機能ID>               # 誤りが0であること
```

### 4. 流す（[references/RUN_AND_EVIDENCE.md](references/RUN_AND_EVIDENCE.md)）

```bash
tools/run_evidence.sh <機能ID> --dry-run       # 流すケースの確認
tools/run_evidence.sh <機能ID>                 # 全部（1件1〜10分。担当はコマンドを裏で流し、終わりの知らせを待つ）
tools/run_evidence.sh <機能ID> --todo          # 中断したあと・正本が変わったあとの続き
tools/run_evidence.sh <機能ID> 016 026         # 直したケースだけ
```

- 流す前に、環境の状態（DB を戻したか・前回の残りデータ）と再実行の制約を確かめる。環境が止まったら `run_evidence.sh` が止まる（終了コード3。4＝エビデンスが書かれなかったケースがある、1＝エビデンスの検査で誤り）。勝手に再起動・DB の戻しをしない（依頼者に `!` で頼む）。
- 出るもの: `e2e/evidence/<機能ID>/index.html`（一覧）と `<テストID>/evidence.html`（手順の文・画面・確かめた項目ごとの合否・注記・エラー）。

### 5. 不合格・未判定を切り分ける（[references/JUDGEMENT.md](references/JUDGEMENT.md)）

```bash
python3 tools/evidence_judgements.py todo <機能ID>
```

1件ずつ `evidence.html` を開き（画面とエラーを読む）、次のどれかに決める。

| 見立て | すること |
| --- | --- |
| E2E の不備（セレクタ・待ち・シードの操作の誤り） | `e2e/` を直して、そのケースだけ流し直す。判定は流し直したあとに書く |
| アプリの実装が設計・正本と違う | 何も直さない。判定「不合格・実装差異」など |
| 正本の手順だけが誤り（設計書と画面が合う） | 裁定で手順を直す（RULES.md の4）→ 流し直す |
| 正本・設計書の中の食い違い、期待結果の側の問題 | 直さない。判定に書き、依頼者の判断待ちに挙げる |
| 環境（止まった・遅い・データの残り） | 判定「未判定・環境」。直れば `--failed` で流し直す |

### 6. 判定と記録（TSV と MD の両方）

```bash
python3 tools/evidence_judgements.py accept-clean <機能ID> --record e2e/review/<機能ID>_progress_<日付>.md
python3 tools/evidence_judgements.py set <機能ID> <テストID> 不合格 実装差異 "理由（業務の言葉で1〜2文）" --record e2e/review/<機能ID>_progress_<日付>.md
node tools/evidence_check.mjs --strict <機能ID>            # 誤り0・注意0（残る注意は記録に理由を書く）
python3 tools/evidence_judgements.py sync <機能ID>          # 合否の一覧へ載せる差分を確かめる
python3 tools/evidence_judgements.py sync <機能ID> --apply  # 書き込む
nice -n 19 python3 ../integration_test/casegen/build_all_test_cases.py   # 一覧を作り直す
```

- 判定の表（TSV）は `e2e/review/judgements/<機能ID>.tsv`、理由の詳しい説明（MD）は `e2e/review/<機能ID>_progress_<日付>.md`。
- 合否の一覧（`playwright_cases.tsv`）に載るのは「合格（条件なし）」と「不合格（条件付きでない）」だけ。未判定・条件付きは載せない。

### 7. レビューと報告

- 書いたテストを codex に批判的に読ませる（`adversarial-review` スキル。観点: 操作をせずに合格にしていないか・期待結果を弱めていないか・正本の手順を飛ばしていないか・物理名）。指摘は実ソースで確かめてから直す。
- 依頼者への報告は JUDGEMENT.md の「報告の書き方」。合格・不合格・未判定・スキップの件数、不合格1件ごとの理由、正本を直していないこと（直したら裁定の項目）、基盤を直したならその理由、エビデンスの場所（`tools/evidence_pack.sh <機能ID>` で固めたもの）。
