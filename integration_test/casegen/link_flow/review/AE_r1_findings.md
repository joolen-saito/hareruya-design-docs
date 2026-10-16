### 指摘1（重大度: Major）対象: IT-A15-09-AE001・AE002、IT-A15-17-AE001
主張: APIで登録したデッキが、大会デッキ登録編集画面の「マイデッキ」に現れる。
実際: A15-09は認証したプレイヤーを所有者にすると定めるが、登録するデッキの種別は定めていない（`functions/pf-api/a15-09_api_deck_builder_deck_register.md:7,72-86`）。A15-17も所有者は定めるが、種別は定めていない（`functions/pf-api/a15-17_api_deck_builder_deck_import_register.md:7,54-60`）。下流の一覧は「本人が作成したデッキ」で、空表示の条件は「ユーザー作成デッキ一覧MyDecksが空」である（`functions/pf-eccube3/f06-16_front_member_mypage_event_deck_edit.md:19-27,109-114`）。著者自身も種別の記述がなく、実装と「所有者＝本人」で接続したと報告している（`integration_test/casegen/link_flow/gen_AE/report.md:49-50`）。
判定: 推測による接続
修正案: API登録デッキがMyDecksの取得対象になる根拠を設計書で確定できるまで、この3ケースを外す。

### 指摘2（重大度: Major）対象: IT-A15-09-AE003、IT-A15-17-AE002
主張: APIによる新規登録後、管理画面のデッキ編集画面で登録値を確かめれば連携を判定できる。
実際: 両ケースともAPIを呼ぶ前に下流画面を確認せず、応答で得たデッキIDを使って初めて編集画面を開く（`integration_test/casegen/link_flow/cases/AE_test_cases.tsv:4,8`）。下流の設計は、編集時には指定デッキを読み込み、存在しなければ404と定める（`functions/pf-eccube3/m15-05_admin_deck_deck_edit.md:5-11`）。依頼文は「下流で操作前の表示を確かめる→上流を操作する→下流を開き直す」を要求しており、著者も操作前確認ができないと認めている（`integration_test/casegen/link_flow/gen_AE/prompt.md:66-68`、`integration_test/casegen/link_flow/gen_AE/report.md:54`）。
判定: 手順不備
修正案: 操作前後を同じ下流画面で確認できる経路に組み替える。組み替えられなければ、この2ケースを削除する。

### 指摘3（重大度: Minor）対象: IT-A15-09-AE001・AE002
主張: 同じデッキ情報登録APIからF06-16への連携を、表示項目を分けて2件とする。
実際: 両ケースは同じ上流操作を行い、同じ「マイデッキを取得」画面で登録デッキを確認する。AE001は一覧の名前とフォーマット、AE002はそのデッキを選んだ後のカード欄を確認している（`integration_test/casegen/link_flow/cases/AE_test_cases.tsv:2-3`）。依頼文は上流機能と下流画面の組につき登録・表示で1件を目安とし、項目違いで増やさないと定める（`integration_test/casegen/link_flow/gen_AE/prompt.md:104-105`）。
判定: 重複
修正案: 指摘1の接続根拠が確定した場合は、一覧表示とカード取り込みを1ケースにまとめる。

### 指摘4（重大度: Minor）対象: F06-16を下流とする5ケース
主張: 「マイデッキを取得」を開くだけで、対象デッキが一覧に表示される。
実際: ポップアップには「フォーマット選択」があるが、設計書の初期値欄は「-」で、開いた直後の絞り込み状態は定まっていない（`excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3317-3334`）。5ケースの手順には対象フォーマットを選ぶ操作がない（`integration_test/casegen/link_flow/cases/AE_test_cases.tsv:2-3,5,7,9`）。著者の報告も「初期状態のまま全件が出る前提」と明記している（`integration_test/casegen/link_flow/gen_AE/report.md:51`）。
判定: 手順不備
修正案: 表示を確認する前に、ポップアップでケースの対象フォーマットを明示的に選ぶ手順へ直す。
