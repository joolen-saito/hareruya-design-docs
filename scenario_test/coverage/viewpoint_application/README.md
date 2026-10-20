# 観点の当てはめ（シナリオテストの作り直し）

シナリオテスト観点（`scenario_test/シナリオテスト観点.md` 第1部、20分類159観点）を業務ごとのシナリオへ当てはめ、テスト項目・経路・工程の補正を足す仕組み。2026-10-20 に通販受注管理で試行した。

## 置き場所

| 何 | どこ |
| --- | --- |
| 観点ごとの判定（159行） | `<業務名>.tsv`（判定・対象シナリオ・既存テストID・理由・根拠） |
| 当てはめ契約（生成の入力） | `../viewpoint_contracts.json`（items＝既存シナリオへ足す項目、routes＝新しい経路、step_resolutions＝既存工程の補正、step_targets・seed_additions＝工程の対象を別の受注にするもの、excluded＝統合・保留） |
| 契約の元データと組み立て | `work/<業務名>/`（担当ごとの契約・台帳・メモ、作業指示 `brief.md`、引用の照合 `check_quotes.py`、組み立て `assemble.py`） |
| レビューの記録 | `review/<業務名>/`（codex の観点ファイル・指摘・裁定 `dispositions.md`） |

## 作り直す手順

```bash
python3 -I scenario_test/coverage/viewpoint_application/work/通販受注管理/assemble.py \
  scenario_test/coverage/viewpoint_application/work/通販受注管理 .
bash scenario_test/tools/run_regeneration.sh
```

- `assemble.py` は契約（`viewpoint_contracts.json`）と判定台帳を書き出す。レビューで直したことも `assemble.py` に書いてある（元データは担当の提出物のまま）。
- 項目の数が変わったら、`run_regeneration.sh` の件数の関門で止まる。内容を確かめてから `emit_scenario_concretized_tsv.py` などの件数を直す。
- 引用は `audit_scenario_delivery.py` が原典と照合する。`functions/ec-cube-enterprise/`（新実装から起こした資料）を根拠にすると止まる。
