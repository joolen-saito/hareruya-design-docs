### 指摘1（重大度: Major）対象: IT-F06-17-PE005〜PE007
主張: 2026-01-01開催の大会デッキを登録し、管理画面のデッキ一覧でイベント名を指定して検索すれば対象を開ける。
実際: 3件の手順は「ほかの検索条件は空のまま」とするが、デッキ一覧の「イベント開催日(From)」には初期値として3か月前の日付が入る（`integration_test/casegen/link_pub/cases/PE_test_cases.tsv:10-12`、`excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:1135`）。シードの開催日2026-01-01は、現在の2026-10-15から3か月前より古い（`integration_test/casegen/link_pub/cases/PE_seed_data.tsv:12-14`）。設計書は開始日以降を検索対象と定める（`functions/pf-eccube3/m15-01_admin_deck_deck_search.md:20`）。
判定: 手順不備
修正案: 3件とも検索前に「日付クリア」を押し、開催日のFrom・Toが空になったことを確認する手順を加える。同ボタンの動作はHTML設計書の1138行に定義されている。

### 指摘2（重大度: Major）対象: 群PE
主張: F06-16からM15-01・M15-05への連携は不採用。
実際: 著者はこの組を不採用と記す一方、F06-17から同じM15-05への登録反映は追加している（`integration_test/casegen/link_pub/gen_PE/report.md:23,66-67`）。F06-16は同一イベント詳細・選手・フォーマットのデッキとカードを上書きすると定める（`functions/pf-eccube3/f06-16_front_member_mypage_event_deck_edit.md:68-70,102-107`）。M15-05は既存デッキを読み込み、登録カードをメイン・サイドボードに表示する（`functions/pf-eccube3/m15-05_admin_deck_deck_edit.md:11-13`、`excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:1541-1542`）。既存ケース一覧にも、この公開側での上書き後にM15-05を確認するケースは見当たらない。
判定: 取りこぼし
修正案: F06-16で大会デッキを上書きし、M15-05を開いてメイン・サイドの更新後の値を照合するIT-0333ケースを追加する。M15-01で探す手順には指摘1の日付クリアを入れる。

### 指摘3（重大度: Minor）対象: 群PE
主張: 報告書の作成数・組ごとの評価・重複確認が成果物を表している。
実際: ケースは12件でM15-01・M15-05向けの3件を含む（`integration_test/casegen/link_pub/cases/PE_test_cases.tsv:2-13`）。しかし報告書の集計は9件、評価表はM15向けを不採用、重複確認は「全9件」のままである（`integration_test/casegen/link_pub/gen_PE/report.md:8-11,23,36-37`）。依頼文は採用ケースごとの対応表・重複確認を求めている（`integration_test/casegen/link_pub/gen_PE/prompt.md:151-155`）。
判定: 規約違反
修正案: 集計を12件に直し、PE005〜PE007を評価表・対応表・重複確認・到達可能性に反映する。実際には未作成のF06-16→M15-05は、指摘2に沿って採否を再評価する。
