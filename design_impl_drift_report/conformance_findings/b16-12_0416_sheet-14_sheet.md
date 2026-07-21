■バッチ-B16-12 データベースデッドロック感知
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）B16-12は、5分毎にStep Functionsで起動し、本店DB内の注文テーブルで現時点のデッドロック発生有無を問い合わせ、発生している場合は晴れる屋管理者メールアドレスへデッドロック発生通知および詳細情報をメール送信する。解除処理は含めない。
　デッドロック検知用のCommand/Service/Repository/メールテンプレート/通知メソッド/スケジュール定義が確認できない。src/Eccube内でdeadlock/デッドロックは一致なし。innodb_lock_wait_timeout は SqlUtil.php:437 と SqlUtil.php:476 に存在するが、ロック待ちタイムアウト値の取得・設定であり、現時点のデッドロック検知、注文テーブル対象判定、管理者メール通知、詳細情報送信ではない。確認お願いします。（設計根拠: excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html#sheet-14:1500,1512,1520-1524 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command, Service, Repository, Resource/config, Resource/template, Resource/locale および /home/y-saito/Developments/ec-cube-enterprise/html。deadlock/デッドロック、SHOW ENGINE/INFORMATION_SCHEMA/performance_schema/data_locks/innodb_lock/1213/40001、Step Functions/5分毎、管理者通知/メールの別表現で検索））
