# 単体テストレベルのケースの除外（2026-10-21〜）

依頼者（2026-10-21）: 「結合テストケースにおいて単体テストレベルの項目があれば除外してほしい」

## 依頼者決定（同日 AskUserQuestion）

線引きは「**前回(8/31)の決裁と同じ線**」（`../../ut_layer_audit/DECISION.md`。観点表の74行を単体へ送った決裁）。1つの部品の中だけで決まることを確かめるケースを外す: 1項目・相関の入力チェック（エラー表示・画面に留まる・登録されない）、1つの値の書式・変換、計算式、検索の一致のしかた・並び順、サニタイズ。登録した値が別の画面・CSV・メール・外部・別機能へ正しく渡るかを確かめるものは残す。外したケースは削除せず除外表へ移し、E2E・Playwright のあるケースは残す。

8/31 の決裁は観点表の段で決めたもので、その後に生成・監査・データパターン・組合せで足したケースには当たっていなかった。いまのケースの観点ID（入力条件・条件網羅など）は単体か結合かと一致しないので、全ケースを中身で判定した。

## 流れ

| 段 | 何をするか | 担当 | 道具・出力 |
| --- | --- | --- | --- |
| 材料 | 機能ごとのケース全件（重複除外の後。印つき） | 機械 | `build_inputs.py`（`../dedup/build_inputs.py` の写し）→ `inputs/`・`protected.tsv`・`batches.tsv`（101束） |
| 判定 | 外すケース・区分（入力チェック／書式・変換／計算／一致条件・並び順／サニタイズ）・理由 | sonnet（1束1本） | `UT_PROMPT.md`（`mk_prompt.py`）→ `judg/<機能ID>.tsv` |
| 機械検査 | 形式、テストIDの実在と機能、重なり、E2E・Playwright を外していない | 機械 | `gate_judg.py` |
| 事実確認 | 外す行ごとに、保存・受け渡し・遷移・権限・業務条件・他データの参照を確かめていないか。疑わしければ戻す | codex（1巡） | `VERIFY_PROMPT.md`（`mk_review.py` → `review/V_*`、`run_verify.sh`）→ `collect_verify.py` → `adopted.tsv`・`returned.tsv` |
| 除外 | `adopted.tsv` のケースを cases/ から `../excluded_ut_cases.tsv`・`../excluded_ut_seeds.tsv` へ移す | 機械 | `../exclude_ut.py` |

## 合流の順

merge → `seed_screen/apply.py` → `datapattern/conflicts/apply_rulings.py` → `exclude_open.py` → `exclude_scope.py` → `exclude_dup.py` → **`exclude_ut.py`** → `build_all_test_cases.py` → `precond/gate_precond.py --all`・`datapattern/gate_dp.py`。
exclude_dup の後に流す。重複で残す側に選んだケースをこれが外したときも、重複で外したケースは外したまま（exclude_dup が excluded_ut_cases.tsv を「残す側はある」と数える）。
gate_precond（G6）・gate_dp・採番の道具は `excluded_ut_cases.tsv` を除外として数える。

## 結果（2026-10-21）

| 段 | 件数 |
| --- | --- |
| 判定（sonnet 101本） | 外す候補 1,574件（入力チェック958・一致条件・並び順404・書式・変換193・計算19・サニタイズ0） |
| 機械検査 | NG 0 |
| codex の事実確認（24束） | 採る **1,155件**（入力チェック798・一致条件・並び順235・書式・変換109・計算13）・戻す 419件（`returned.tsv` に codex の理由つき） |
| 除外 | cases/ から 1,155件・シード 1,080件を `../excluded_ut_cases.tsv`・`../excluded_ut_seeds.tsv` へ。一覧 13,316件 → **12,161件**（346 → 345機能）。gate_precond・gate_dp 合格 |

- codex が戻した主なもの: 入力チェックのあとに一覧の件数・画面遷移・他の項目の不更新まで確かめるもの、業務の優先順（API が返す1件の選び方 A02-01・A02-02、戻しリスト・ピッキングの順序 M04-33・M04-34・M07-09 など）、マスタや設定を読んで結果が変わるもの。
- **M04-14（在庫分割結合情報CSV出力）はケースが0件になった**。唯一のケース IT-M04-14-001 が出力項目12個の並びだけを確かめていたため。依頼者「M04-14は足して」で、結合レベルのケースを3件足した（`added/M04-14_cases.tsv`、`merge_added.py` で cases/ へ合流。一覧は 12,164件・346機能）:
  - IT-M04-14-012: 在庫分割のデータ（M04-13 で登録・承認）が一覧の検索・チェックを経て CSV の第1〜6・10・11項目へ渡る。作り方が未確定で外れていた 002 の作り直し（在庫区分は架空の「CSV在庫区分A」でなく実在の EC-CUBE）。
  - IT-M04-14-013: 在庫結合のデータが CSV の第1〜5・8・10・11項目へ渡る（003 の作り直し。在庫区分はスマレジ）。
  - IT-M04-14-014: 店舗で検索した結果2件を両方チェックして出力し、2件とも ID 昇順で、それぞれ DB の値と一致する。
  - 取得元が決まらない項目（Q-M04-14-01〜04: 結合の第6項目、第7・9項目、分割の第8項目、第12項目）は確かめない。「チェックした行か検索結果全体か」（Q-M04-14-05）に当たらないよう、検索結果の全件をチェックする。0件の出力（Q-M04-14-06）は扱わない。シードは既存の共有シード（S-M04-14-ADM・REF・BASE）。読み取りだけなので `precond/readonly_cases/M04-14.tsv` に宣言した。
  - 合流の順: merge → merge_dp → merge_cb → **`ut_layer/merge_added.py`** → seed_screen/apply.py → … → exclude_ut.py（exclude_ut が使うケースのある共有シードを cases/ へ戻す）。
- gate_precond の G6（改名の検査）は、外したケース自身の改名先が除外表へ移したシードにしか無いので誤検出になる。作り方が未確定で外したケースと同じく、`excluded_dup_cases.tsv`・`excluded_ut_cases.tsv` のケースは改名の検査から外した。
