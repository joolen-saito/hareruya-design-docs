■バッチ-B08-01 リニューアル時パスワードリセットメール送信
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）リニューアル時パスワードリセットメールを送信するバッチを `customer:batch sendAccountMigration <基準日>` で実行し、基準日未指定時は日付指定を促して終了する。
　B08-01 用の Symfony Command クラスまたは同等のバッチ入口が存在しない。会員系バッチとしては `eccube:customer:check-blank-required-item` などはあるが、sendAccountMigration 相当はない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-3:876,913-914,961-966,975,988 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service, /home/y-saito/Developments/ec-cube-enterprise/html。反証検索: sendAccountMigration, customer:batch, customer_migration, CustomerMigration, 移行通知, 日付を指定してください））

■バッチ-B08-01 リニューアル時パスワードリセットメール送信
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）会員データの最終更新日が基準日以降、かつパスワード再設定キーコードが IS NOT NULL の会員を抽出し、会員ごとに移行通知メールを1通送信する。宛先は会員メールアドレス、送信元は info@hareruyamtg.com。
　`CustomerRepository.php:277-287` に汎用の update_date 検索、`CustomerRepository.php:501-508` に reset_key のユニーク生成はあるが、B08-01 の `update_date >= 基準日 AND reset_key IS NOT NULL` 抽出と一括送信ループは存在しない。通常の `/forgot` メール送信は `MailService.php:636-693` にあるが、利用者操作ベースであり移行通知バッチではない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-3:878,882-896,969,978,982 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CustomerRepository.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Views/RegisterCustomerViewRepository.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command））

■バッチ-B08-01 リニューアル時パスワードリセットメール送信
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）設定言語（日本語・英語）によって `Mail/customer_migration.twig` または `Mail/customer_migration.en.twig` を切り替え、設計の件名・本文で移行通知メールを送信する。
　customer_migration の Twig ファイルと `CUSTOMER_MIGRATION_JP/EN` 定数は存在するが、`src/Eccube` 内にこれらを選択して送信する MailService/Command の参照がない。指定範囲内の `src/Eccube/Resource/doctrine/import_csv/*/dtb_mail_template.csv` にも該当 mail_key・件名・本文初期データはない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-3:879,897-904,910 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/customer_migration.twig:1, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/customer_migration.en.twig:1, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/MailTemplate.php:71）

■バッチ-B08-01 リニューアル時パスワードリセットメール送信
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）メール送信後、1通ごとに `dtb_user_mail_history` へ送信日時、送信時件名、本文全文、使用テンプレートファイル名、送信相手ユーザーIDを登録する。
　`dtb_user_mail_history` の Entity は存在するが deprecated コメントで未使用扱い。共通の履歴保存は `MailHistoryEntityManager` が `MailHistory` を生成し、実体は `dtb_mail_history`。B08-01 からの履歴保存呼び出しもない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-3:880,905-911 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbUserMailHistory.php:21, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbUserMailHistory.php:24, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/MailHistory.php:25, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/MailHistoryEntityManager.php:39）

■バッチ-B08-01 リニューアル時パスワードリセットメール送信
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）現行ECサイトから会員情報インポート後、各ユーザーの会員データに重複しないパスワード再設定キーコードを登録する。登録により会員データの最終更新日が更新される。
　`dtb_customer.reset_key` カラム、ユニークな reset_key 生成、保存時の update_date 更新機構は存在する。一方で、インポート後の各会員へ reset_key を一括登録する B08-01 事前準備処理は指定範囲内に存在しない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-3:872-874 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:129, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CustomerRepository.php:501, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/SaveEventSubscriber.php:62）
