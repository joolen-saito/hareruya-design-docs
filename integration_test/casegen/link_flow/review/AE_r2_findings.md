### 指摘1（重大度: Major）対象: 群AE
主張: F09系は大会デッキだけを対象とするため、全APIからの連携ケースを作らない（`integration_test/casegen/link_flow/gen_AE/report.md:17`）。
実際: A15-10は所有者の一致する既存デッキを更新し、デッキ種別による拒否条件を定めていない（`functions/pf-api/a15-10_api_deck_builder_deck_update.md:5-15,41-55`）。A15-18も同じ所有者条件で既存デッキを上書きする（`functions/pf-api/a15-18_api_deck_builder_deck_import_update.md:5-12,49-55`）。管理画面ではデッキ種別に`event`を選べる（`excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:1511`）。F09-06はユーザーデッキを除外する一方、大会デッキの詳細にデッキ名を表示する（`functions/pf-eccube3/f09-06_front_deck_deck_show.md:5-14,35-43`）。したがって、既存の大会デッキを更新する組まで「ユーザーデッキ」を理由に除外できない。`all_test_cases.tsv`にも、このAPI操作からF09-06で確かめる既存ケースは見当たらない。
判定: 取りこぼし
修正案: A15-10→F09-06、A15-18→F09-06を検討対象へ戻す。各ケース専用の、所有者がいる閲覧可能な大会デッキを画面で用意し、詳細画面で旧デッキ名を確認→APIでデッキ名を更新→同じ詳細画面を開き直して新デッキ名を確認するIT-0364ケースを追加する。
