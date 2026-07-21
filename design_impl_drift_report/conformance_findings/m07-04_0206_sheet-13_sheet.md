■管理-M07-04 【新規】手動メール通知(確認画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）テンプレ選択のフォームブロック接頭辞は `m07-04_admin_online_purchase_purchase_manual_mail`。フィールドキーは `template`。確認・送信では hidden で値を維持する。
　PurchaseManualMailType::getBlockPrefix() は `admin_purchase_manual_mail` を返す。`m07-04_admin_online_purchase_purchase_manual_mail` のフォーム接頭辞・別名・互換受け口は src/Eccube と html から確認できない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-13:3366 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseManualMailType.php:91）

■管理-M07-04 【新規】手動メール通知(確認画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）送信成功時のみ `dtb_mail_history` の履歴行が増え、条件が整えばメール送信とメール履歴 INSERT、成功フラッシュ、Doctrine の永続化キューへの追加が行われる。DB操作は persist/flush による即時反映で確定する。
　sendManualPurchaseMail() は送信成功後に MailHistoryEntityManager::save() を呼び、save() は MailHistory を persist するだけで flush しない。Purchase/MailController は sendManualPurchaseMail() 後に成功フラッシュを積んで詳細へリダイレクトするが flush しない。TransactionListener も terminate で commit のみを呼ぶ。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-13:3371; /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-13:3377; /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-13:3383 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1588; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/MailHistoryEntityManager.php:67; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/MailController.php:99; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/TransactionListener.php:119）
