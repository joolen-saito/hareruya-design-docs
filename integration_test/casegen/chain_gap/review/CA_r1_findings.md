### 指摘1（重大度: Major）対象: CH-0012
主張: 既存の IT-M11-02-010 が、登録後の画面遷移を確認済み。
実際: 同ケースは新規登録時に「所属店舗」を入力していない（`integration_test/casegen/cases/M11-02_test_cases.tsv:11`）。出典の画面項目定義では「所属店舗」は必須で、初期値もない（`excel_to_html/output/0201_基本設計仕様書(システム設定).html:1227`）。この手順では登録完了を起こせず、遷移を確認できない。一方、登録操作と遷移先がともに M11-02 内という「連鎖ではない」判定自体は、同機能の設計書に合う（`functions/pf-eccube3/m11-02_admin_system_setting_setting_system_member_edit.md:33-35`）。
判定: 手順不備
修正案: 「連鎖ではない」は維持し、「既存ケースで確認済み」という根拠を削る。IT-M11-02-010 に所属店舗の入力を加えたうえで、確認済みと記す。

### 指摘2（重大度: Minor）対象: CH-0017, CH-0018
主張: 既存ケースがそれぞれの契機を起こし、IT-M11-02-018 が画面留まりを確認している。
実際: IT-M11-01-030 と 032 はどちらも**新規登録時**のケースで、期待結果は未登録というデータ確認だけである（`integration_test/casegen/cases/M11-01_test_cases.tsv:26,28`）。IT-M11-02-018 は編集時のパスワード確認欄の不一致を起こすケースで、CH-0017 の英数字不足も CH-0018 の店舗未設定も起こしていない（`integration_test/casegen/cases/M11-02_test_cases.tsv:19`）。出典は編集時の後続処理も指定している（`functions/pf-eccube3/m11-01_admin_system_setting_setting_system_member_list.md:79-80`）。「連鎖ではない」判定自体は妥当だが、挙げたケースを組み合わせても各契機の編集後画面を確認済みとは言えない。
判定: 推測
修正案: 両連鎖の判定は維持し、既存ケースによる画面確認を示唆する根拠を削る。

### 指摘3（重大度: Minor）対象: CH-0019
主張: IT-M11-01-034 が契機を起こし、IT-M11-02-018 が画面留まりを確認している。
実際: IT-M11-01-034 は最後の稼働中システム権限メンバーの非稼働化を試みるが、期待結果は稼働状態が変わらないことだけで、画面を確かめない（`integration_test/casegen/cases/M11-01_test_cases.tsv:30`）。IT-M11-02-018 の契機は別の入力不備である（`integration_test/casegen/cases/M11-02_test_cases.tsv:19`）。出典が指定するこの契機後の画面は、両ケースのいずれでも確認されていない（`functions/pf-eccube3/m11-01_admin_system_setting_setting_system_member_list.md:82`）。
判定: 推測
修正案: 「連鎖ではない」は維持し、既存ケースで画面まで確認したかのような根拠を削る。
