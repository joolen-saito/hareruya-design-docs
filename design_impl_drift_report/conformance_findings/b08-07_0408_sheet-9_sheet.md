■バッチ-B08-07 身分証有効期限切れ通知
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）プレイヤーデータの身分証有効期限切れ2週間前のユーザーを取得する。入力データ詳細では idExpirationDate から2週間前に有効期限が切れるユーザーを取得し、検索条件は「プレイヤーデータ.身分証有効期限日 <= 2週間前の日付」。
　DtbPlayerRepository.php:158-167 に `findCustomersForNotificationIdExpire(\DateTime $targetDate)` は存在し、`p.idExpirationDate <= :target_date` の検索は定義されているが、このメソッドを呼び出す Command/Action/Service が見つからない。2週間前の日付を算出して検索する実行処理も見つからない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-9:1776,1783,1787 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/Admin/Customer, src/Eccube/Repository/DtbPlayerRepository.php, src/Eccube/Service/MailService.php, src/Eccube/Resource/template/default/Mail, html。反証検索: findCustomersForNotificationIdExpire, idExpirationDate, id_expire, identification expire, 身分証 有効期限, 本人確認 期限））

■バッチ-B08-07 身分証有効期限切れ通知
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）該当者がいない場合には、処理を終了する。「入力データ詳細」で取得した一覧からユーザー毎に処理を行う。
　B08-03 の `PointExpireNotificationCommand.php:25-53` と `PointExpireNotificationAction.php:33-57`、B08-04 の `CheckBlankRequiredItemCustomerCommand.php:25-53` と `CheckBlankRequiredItemCustomerAction.php:31-42` のようなバッチCommand/Action構造は存在するが、B08-07相当のCommand/Actionが見つからない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-9:1784,1789 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/Admin/Customer, src/Eccube/Repository/DtbPlayerRepository.php, src/Eccube/Service/MailService.php。反証検索: id_expire, 身分証有効, 期限切れ会員, findCustomersForNotificationIdExpire））

■バッチ-B08-07 身分証有効期限切れ通知
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）該当ユーザーの身分証有効期限日を初期化(NULL)に設定し、プレイヤーデータにある身分証有効期限(idExpirationDate)を未設定値(null)へ更新する。
　`DtbPlayer::setIdExpirationDate()` は `src/Eccube/Entity/DtbPlayer.php:241-244` に存在するが、B08-07バッチで対象者に `setIdExpirationDate(null)` を実行する処理は見つからない。`setIdExpirationDate` の利用は管理画面/本人確認更新系であり、期限切れ通知バッチの更新処理ではない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-9:1777,1790 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/Admin/Customer, src/Eccube/Service/EntityManager, src/Eccube/Controller, src/Eccube/Repository。反証検索: setIdExpirationDate, idExpirationDate, NULL, 身分証有効期限））

■バッチ-B08-07 身分証有効期限切れ通知
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）オンライン本人確認の場合は、プレイヤーデータにある本人確認ステータスID(identity_confirm_status_id)を0(未設定)へ更新する。簡易書留で確認している場合は、本人確認ステータスの変更は行わない。
　本人確認ステータスの定数は `MtbIdentityConfirmStatus.php:31-34` にあり、未確認は `STATUS_UNCONFIRMED = 1`、簡易書留相当は `STATUS_REGISTERED_MAIL_CONFIRMED = 4` として存在する。しかし、B08-07バッチでオンライン本人確認のみを未設定へ更新し、簡易書留を変更しない分岐処理は見つからない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-9:1791,1792 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/Admin/Customer, src/Eccube/Service/EntityManager, src/Eccube/Controller, src/Eccube/Entity/Master/MtbIdentityConfirmStatus.php。反証検索: setIdentityConfirmStatus, identity_confirm_status, STATUS_UNCONFIRMED, 簡易書留, 登録郵送確認））

■バッチ-B08-07 身分証有効期限切れ通知
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）ユーザー宛に身分証有効期限切れ通知メールを送信する。メール送信先は会員データのメールアドレス、送信元は info@hareruyamtg.com、件名は「【晴れる屋】オンライン本人確認の更新手続きのお願い」、設計本文を送信する。
　メールテンプレート本文は `src/Eccube/Resource/template/default/Mail/Mall/id_expire_notification.twig:1-26` に存在し、メールマスタ投入は `app/DoctrineMigrations/Version20251204111453.php:1775-1778` に存在する。しかし `MailService.php` にこのテンプレートを使う送信メソッドは見つからず、B08-07のCommand/Actionから会員メールアドレス宛へ送信する呼び出しも見つからない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-9:1778,1794,1795,1798,1799 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/Admin/Customer, src/Eccube/Service/MailService.php, src/Eccube/Resource/template/default/Mail/Mall/id_expire_notification.twig, app/DoctrineMigrations。反証検索: id_expire_notification, eccube.mail.id_expire_notification, オンライン本人確認の更新手続き, sendIdExpire, sendIdentificationExpire））

■バッチ-B08-07 身分証有効期限切れ通知
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）該当ユーザーへ身分証有効切れ通知メール送信完了後、管理者に今回身分証有効期限切れ該当者を通知する。該当者をユーザーIDとユーザー名をスペースで区分け、ユーザー毎に1行ずつ本文に記載できる形式に編集する。
　管理者宛メールアドレス設定は `MtbOption::CHECK_ID_EXPIRED_CUSTOMER_MAIL_ADDRESS` として `src/Eccube/Entity/Master/MtbOption.php:91` に存在し、初期値 `it_common@hareruyamtg.com` は `app/DoctrineMigrations/Version20251125161057.php:280-284` に存在する。しかし、該当者一覧を `会員ID 氏名` 形式へ整形して送信する MailService メソッドやAction呼び出しは見つからない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-9:1800,1801,1802,1809 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/Admin/Customer, src/Eccube/Service/MailService.php, src/Eccube/Entity/Master/MtbOption.php, app/DoctrineMigrations。反証検索: check_id_expired_mail_address, 身分証の有効期限切れ会員, 会員ID 氏名, id expired customer, send*AlertMail））

■バッチ-B08-07 身分証有効期限切れ通知
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）管理者通知メールの送信先は it_common@hareruyamtg.com（mtb_option.check_id_expired_mail_address）、送信元は info@hareruyamtg.com、件名は「身分証の有効期限切れ会員の存在を通知するメール」、本文は「会員ID 氏名」から始まる該当者一覧とする。
　`check_id_expired_mail_address` のオプションは存在するが、件名「身分証の有効期限切れ会員の存在を通知するメール」や本文「会員ID 氏名」を生成して送信する実装は見つからない。類似実装として `sendBlankRequiredItemCustomerAlertMail()` は `MailService.php:1264-1307` に存在するが、B08-07用の送信ではない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-9:1803,1804,1805,1806,1807,1809 ／ 実装: 不在（探索範囲: src/Eccube/Service/MailService.php, src/Eccube/Service/Admin/Customer, src/Eccube/Command, src/Eccube/Entity/Master/MtbOption.php, app/DoctrineMigrations。反証検索: 身分証の有効期限切れ会員の存在を通知するメール, check_id_expired_customer, check_id_expired_mail_address, 会員ID 氏名））
