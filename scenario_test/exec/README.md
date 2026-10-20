# シナリオテスト 実行用TSV

<!-- generated-by: audit_scenario_delivery.py -->

正本 `../test_items/all_scenario_test_items.tsv` の1652項目を、業務別の14列TSVへ変換した。

[目的と完了基準](../システムテストの目的と完了基準.md)に従い、各経路の全必須判定と最終業務状態から業務成立を判定する。[必須判定一覧](../coverage/business_goal_review/route_acceptance.tsv)で経路と個別判定を対応付ける。

| ファイル | 業務 | 項目数 |
|---|---|---:|
| [ sti-deck_concretized.tsv ](tsv/sti-deck_concretized.tsv) | デッキ登録 | 37 |
| [ sti-event_concretized.tsv ](tsv/sti-event_concretized.tsv) | イベント管理 | 117 |
| [ sti-kaitori_concretized.tsv ](tsv/sti-kaitori_concretized.tsv) | 店頭買取 | 137 |
| [ sti-online_concretized.tsv ](tsv/sti-online_concretized.tsv) | ネット買取 | 175 |
| [ sti-order_concretized.tsv ](tsv/sti-order_concretized.tsv) | 店頭受取受注管理 | 124 |
| [ sti-price_concretized.tsv ](tsv/sti-price_concretized.tsv) | 価格管理 | 46 |
| [ sti-product_concretized.tsv ](tsv/sti-product_concretized.tsv) | 商品登録・編集 | 108 |
| [ sti-shiire_concretized.tsv ](tsv/sti-shiire_concretized.tsv) | 仕入れ業務 | 54 |
| [ sti-tsuhan_concretized.tsv ](tsv/sti-tsuhan_concretized.tsv) | 通販受注管理 | 363 |
| [ sti-zaiko_concretized.tsv ](tsv/sti-zaiko_concretized.tsv) | 在庫管理 | 491 |

元の11列に使用シード・自動検証・実行方法を加える。前提条件から移した情報は逆変換で照合し、操作の改行は ` ⏎ ` として保持する。
最新版の[項目別実施条件と修正記録](../coverage/execution_repairs/README.md)を確認する。旧テストIDからの対応表もここに保存している。
実行方法はテスト実施方法として手動。自動検証欄の `—` は業務データの更新がないことを意味しない。実施保留・条件付きの項目は準備手順と理由を確認してから実施する。

再生成: `python3 scenario_test/tools/emit_scenario_concretized_tsv.py`。構造・逆変換・件数ゲートで情報欠落を検出する。
同期検証: `python3 scenario_test/tools/audit_scenario_delivery.py`。SCN・項目・実行用表・可否台帳のIDと工程を照合する。

実機でのテスト実行結果は含まない。設計どおりに動作するかは実施時に判定する。
