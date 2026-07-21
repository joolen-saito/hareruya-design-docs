■管理-M07-04 手動メール通知(入力画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）テンプレ選択のフォームブロック接頭辞は m07-04_admin_online_purchase_purchase_manual_mail。フィールドキーは template。
　PurchaseManualMailType::getBlockPrefix() は admin_purchase_manual_mail を返す。反証検索でも m07-04_admin_online_purchase_purchase_manual_mail は src/Eccube/html 配下に存在しない。確認お願いします。（設計根拠: excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-12:3172 ／ 実装: src/Eccube/Form/Type/Admin/Purchase/PurchaseManualMailType.php:91）

■管理-M07-04 手動メール通知(入力画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）送信成功時はメール履歴 INSERT が中心であり、送信が成功した場合のみ履歴行が増える。HTTP経由ではリクエスト終了までに flush される前提。
　sendManualPurchaseMail は送信成功後に MailHistoryEntityManager::save() を呼ぶが flush しない。save() は persist のみ。TransactionListener の terminate 処理も commit のみで EntityManager::flush() を呼ばない。確認お願いします。（設計根拠: excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-12:3177 ／ 実装: src/Eccube/Service/MailService.php:1588; src/Eccube/Service/EntityManager/MailHistoryEntityManager.php:67; src/Eccube/EventListener/TransactionListener.php:119）

■管理-M07-04 手動メール通知(入力画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）テンプレート候補には Mail/buy_order_old.twig、Mail/buy_order_assessment_old.twig、Mail/buy_order_include_delivery_fee_old.twig を含め、選択テンプレートの file_name を BuyOrder・header・footer・BaseInfo でレンダリングして本文を初期生成する。
　フォーム候補には旧フローTwigを含め、DB登録もある。一方、createBody は BuyOrder 変数だけを渡すが、旧フローTwigは buyOrder 小文字と Plugin\HareruyaEc\Entity\DtbBuyMainCard::SALE を参照する。該当Plugin名前空間は実装に存在しない。確認お願いします。（設計根拠: excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-12:3170 ／ 実装: src/Eccube/Form/Type/Admin/Purchase/PurchaseManualMailType.php:82; src/Eccube/Controller/Admin/Purchase/MailController.php:126; src/Eccube/Resource/template/default/Mail/buy_order_old.twig:1; src/Eccube/Resource/template/default/Mail/buy_order_old.twig:12; app/DoctrineMigrations/Version20251204111453.php:4131）
