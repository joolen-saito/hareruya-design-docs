# HTML設計書 再生成 手順書

正本HTML設計書（`excel_to_html/output/*.html`）を作り直すときの手順とゲート。
**この手順を通さない再生成は行わない。**

- 変換の規約は [[function-spec-html-render]] / [[excel-to-html]] / [[output-exclusion-policy]] が正本。
  本書は「どの順で回し、どこで落とすか」を定める。
- 不具合調査（②）は再生成後の正本を読む。**正本が欠けたまま調査すると、その範囲は原理的に検出できない。**

---

## なぜ手順書が要るか（2026-08-21 の事故）

Markdown正本を「0203の型」（業務ロジック／入出力／表示メッセージの3節）へ書き直す工程で、
**内容が3節へ移されず捨てられた機能設計書が35本**出た。うち22本が 0202（在庫管理）。

| 例 | 変化 | 残ったもの |
| --- | --- | --- |
| m04-12 在庫分割結合検索/一覧 | 274行 → **11行** | 表示メッセージ表だけ |
| m04-22 在庫移動・振替CSV登録 | 330行 → **1行** | タイトルのみ |
| m04-01 在庫検索一覧 | 456行 → 39行 | 業務ロジック・入出力なし |

結果として 0202 は、正本のうち現行仕様由来の要求が **3.8%** しかない（0203は32.2%、0204は33.5%）。
在庫管理の主要11機能について、業務ロジックと入出力の突合が実施できない正本になっていた。

**なぜ止まらなかったか。** 既存ゲート `check_rewrite_quality.py` は
**メッセージIDと画面文言の保存しか見ていない**。捨てられたのは本文で、メッセージ表は残っていたため、
上の3本はいずれも「OK」で通った（実測済み）。`verify.py` は Excel→HTML の忠実性を見る道具で、
Markdown書き直しの欠落は守備範囲外。**守る対象と守っている対象がずれていた。**

同じ日に、`csv-format-only.tsv` のヘッダが参照する `detect_csv_format_only.py` が
**存在しなかった**ことも判明した。そのため台帳の登録が4件で止まり、
CSV項目だけのシート（0206「買取商品一覧CSV出力項目」など）に現行仕様が埋め込まれていた。

---

## 手順

### 0. 前提の確認

```bash
git status --short functions/ excel_to_html/output/   # 作業ツリーが汚れていないこと
```

再生成は既存の正本を上書きする。**比較元（git HEAD）が正しい状態であること**が全ゲートの前提。
未コミットの変更が残っている状態で始めない。

### 1. 台帳を先に更新する

書き直しも変換も、台帳を見て「出さない」を決める。**台帳が古いまま回すと、出すべきでないものが出る。**

```bash
python3 .cursor/skills/function-spec-html-render/scripts/detect_csv_format_only.py --unregistered
python3 .cursor/skills/function-spec-html-render/scripts/detect_superseded_specs.py
python3 .cursor/skills/function-spec-html-render/scripts/detect_phase2_specs.py
```

| 台帳 | 意味 | 出力への効き方 |
| --- | --- | --- |
| `functions/csv-format-only.tsv` | CSV/TSVの項目定義しか無いシート | 現行仕様を埋め込まない |
| `functions/superseded_specs.json` | 刷新後は実装不要 | 「刷新後は実装不要」バナー |
| `functions/phase2_specs.json` | フェーズ2対応 | 「フェーズ1では実装不要」バナー |

**候補は機械が出し、登録は人が確認して行う。** 未登録の候補が残っている状態で次へ進まない
（`--unregistered` は未登録があれば終了コード1）。

### 2. Markdown正本を0203の型へ書き直す

```bash
python3 .cursor/skills/function-spec-html-render/scripts/restructure_to_three_sections.py --book <書番>
```

**書き直しは要約であって削除ではない。** 3節（業務ロジック／入出力／表示メッセージ）へ
**内容を移す**のであって、入らないものを捨てるのではない。
旧文書の 画面表示・一覧項目／検索条件／プロセスフロー／分岐・遷移・例外／状態・データ更新 は、
すべて業務ロジックか入出力のどちらかに行き先がある。

落としてよいのは次だけ:
- 出力除外規約が「設計書に書かない」と決めた定型節（概要・本書で扱うこと・改訂履歴・
  ログ・セッション・Cookie・排他制御・試行制限・権限認可 ほか。正本は [[output-exclusion-policy]]）
- 実装手段の語（クラス名・メソッド名・DB物理名・翻訳キー・定数名）

### 3. 書き直しのゲート（2本とも通すこと）

```bash
python3 .cursor/skills/function-spec-html-render/scripts/check_rewrite_quality.py      --book <書番>
python3 .cursor/skills/function-spec-html-render/scripts/check_rewrite_completeness.py --book <書番>
```

| ゲート | 見るもの | 落ちる条件 |
| --- | --- | --- |
| `check_rewrite_quality` | 捏造・様式 | メッセージIDや画面文言が減った／H2が3節以外／実装手段の語やDB物理名が残っている |
| `check_rewrite_completeness` | **本文の欠落** | 業務ロジックか入出力が無い／本文がほぼ全消し（既定8%未満） |

`completeness` は警告も出す（本文15%未満・情報語の保存率20%未満）。
**警告は自動で落とさない。** 較正の記録として: 正しく書き直せた m11-01 は 5,467字→1,225字（22%）で、
消えた語は「エラーフラッシュ」「セレクト」など**規約が意図的に落とす実装用語**だった。
要約は元の7〜8割を捨てるのが正常なので、縮小率だけでは良し悪しを決められない。
警告が出たものは人が抜き取りで中身を見る。

除外台帳（廃止・Ph2・CSV項目のみ）に載る機能は両ゲートとも免除される。
**免除したいなら台帳に登録する。ゲートの閾値をいじって通さない。**

### 4. HTMLを再生成する

```bash
cd excel_to_html && uv run python convert.py                 # Excel → HTML（全書）
python3 .cursor/skills/function-spec-html-render/scripts/integrate_function_docs_into_excel_html.py
python3 .cursor/skills/function-spec-html-render/scripts/build_orphan_group_html.py   # 入力xlsxが無い6冊
```

入力xlsx が無い Markdown起点の6冊（0000 / 0215 / 0216 / 0417 / 0508 / 0515）は
`build_orphan_group_html.py` の系統で作る。

### 5. 再生成のゲート

```bash
cd excel_to_html && uv run python verify.py
```

8種を見る: シート網羅／セル文言網羅／画像／遷移図／引き出し線の相互リンク／出力除外規約／
非表示シート／廃止仕様バナー。**`verify.py` は Excel→HTML の忠実性しか見ない。**
Markdown書き直しの欠落は手順3のゲートで止める。ここで代替できると考えない。

### 6. 台帳へ記録してコミットする

`design_impl_drift_report/html_regen_checklist_state.tsv` の `再生成` と `再生成備考` を更新する。
**備考には実際にやったことだけを書く。** 「書き直し済み」と書くなら手順3のゲートが通っていること
（2026-08-21 の台帳は 0204「40本中11本」「0205 未着手」のまま実態と食い違っていた）。

再生成の成果物は**その場でコミットする**。作業ツリーに置いたままにしない（手順0の前提が崩れる）。

### 7. 不具合調査をやり直す

正本が変わった書は、②不具合調査の判定が陳腐化する。
`design_impl_drift_report/design_audit/<書>/parts/` を破棄して inventory からやり直す。
観点と手順は [AUDIT_SCOPE.md](../design_impl_drift_report/AUDIT_SCOPE.md) /
[AUDIT_JUDGING_RULES.md](../design_impl_drift_report/AUDIT_JUDGING_RULES.md)。

---

## この手順が守らないもの

- **ゲートは「捨てられた」を捕まえるが、「移し方が浅い」は捕まえられない。**
  必須節があって本文も残っていれば通る。粒度が 0203 に届いているかは、
  同種機能（検索一覧どうし、CSV出力どうし）を並べて人が見るしかない。
  目安として 0203 の検索一覧は 202行 / 小見出し13。
- 台帳への登録判断そのもの（廃止か、Ph2か、CSV項目だけか）。機械は候補を出すだけ。
