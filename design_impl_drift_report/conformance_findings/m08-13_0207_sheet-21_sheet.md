■管理-M08-13 ブラックリスト管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）電話番号の場合、チェックの前にハイフンを除去する。電話番号のみ追加で半角数字のみかのチェックを行う。
　電話番号項目の場合、既存行・新規行ともに入力値をそのまま /^[0-9]+$/ で検証している。ハイフン除去処理は BlacklistUpdateType / BlacklistType / BlacklistUpdateAction / BlacklistEntityManager / BlacklistController には存在しない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-21:4723,4724,4729,4730 ／ 実装: src/Eccube/Form/Type/Admin/BlacklistUpdateType.php:78, src/Eccube/Form/Type/Admin/BlacklistUpdateType.php:108）

■管理-M08-13 ブラックリスト管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）項目(新規登録用)・項目(更新用)は単一選択(チェックボックス)で、選択肢は住所、電話番号、氏名。
　新規用・更新用の項目は BlacklistTagType を使い、BlacklistTagType は MasterType を親にする。MasterType は EntityType かつ expanded=false / multiple=false なのでチェックボックスではなく単一 select として表示される。マスタ投入順も id=1 氏名、id=2 電話番号、id=3 住所で、BlacklistTagType は id ASC で並べる。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-21:4747,4749 ／ 実装: src/Eccube/Form/Type/Admin/BlacklistUpdateType.php:34, src/Eccube/Form/Type/Admin/BlacklistType.php:32, src/Eccube/Form/Type/Master/BlacklistTagType.php:45, src/Eccube/Form/Type/MasterType.php:29）

■管理-M08-13 ブラックリスト管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）登録・編集・削除が完了したとき、登録完了メッセージ（ロケールキー admin.register.complete）を表示する。
　更新処理成功時は addSuccess('admin.common.save_complete', 'admin') を呼び出し、表示文言は「保存しました」。設計指定の admin.register.complete は「登録が完了しました。」として存在するが、この機能では使用していない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-21:4820 ／ 実装: src/Eccube/Controller/Admin/Customer/BlacklistController.php:107, src/Eccube/Resource/locale/messages.ja.yaml:1405, src/Eccube/Resource/locale/messages.ja.yaml:1780）

■管理-M08-13 ブラックリスト管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）会員登録、買取時の会員登録時にブラックリスト判定を使用し、登録不可の場合は登録エラー(ブラックリスト)画面を表示する。
　通常会員登録では blacklist 該当時に entry_regist_error へ遷移するが、買取時の会員登録では registerCustomer が false を返し、買取申込完了画面へ register=2 を付けて遷移し、同画面内に会員登録不可メッセージを表示する。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-21:4737,4738,4739 ／ 実装: src/Eccube/Controller/Front/Purchase/OtcBuyController.php:380, src/Eccube/Controller/Front/Purchase/OtcBuyController.php:437, src/Eccube/Resource/template/default/OtcBuy/complete.twig:31）
