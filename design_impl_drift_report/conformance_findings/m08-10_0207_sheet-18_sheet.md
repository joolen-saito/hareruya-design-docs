■管理-M08-10 オンライン本人確認
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）「確認済に変更する」押下時、身分証有効期限の入力値となりすまし対策トークンを隠しフォームに載せてPOST送信し、確認済への変更POSTでトークンを検証する。
　JSが生成するPOSTフォームは id_expiration_date だけを追加して送信し、completeIdentification は id_expiration_date を読むだけで _token や isCsrfTokenValid を扱わない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-18:4181,4188,4216 ／ 実装: src/Eccube/Resource/template/admin/Customer/edit.twig:82; src/Eccube/Controller/Admin/Customer/CustomerEditController.php:231; 不在（探索範囲: CustomerEditController.php と admin/Customer/edit.twig の isCsrfTokenValid/_token/csrf_token/admin_customer_identification_complete））

■管理-M08-10 オンライン本人確認
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）会員IDから選手情報を取得し、存在しない場合はページが見つからない扱い（404）とする。
　$Customer->getPlayer() が null の場合、admin.common.system_error を addError して admin_customer_edit へリダイレクトする。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-18:4178,4188,4197,4206,4226 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerEditController.php:252; src/Eccube/Controller/Admin/Customer/CustomerEditController.php:264）

■管理-M08-10 オンライン本人確認
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）本人確認の閲覧権限が無い場合は身分証画像を表示せず、各画像枠に「閲覧不可」を表示する。
　Twigは画像データがあれば常に img を出し、無ければ「登録データなし」を出す。画像配信ルート側では閲覧不可権限を検出すると AccessDenied を投げるが、モーダル内に「閲覧不可」を表示する分岐や翻訳キーは無い。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-18:4182,4186,4191,4197,4216,4219,4226,4230 ／ 実装: src/Eccube/Resource/template/admin/Customer/edit.twig:251; src/Eccube/Resource/template/admin/Customer/edit.twig:253; src/Eccube/Resource/template/admin/Customer/edit.twig:255; src/Eccube/Controller/Admin/Customer/CustomerEditController.php:312; src/Eccube/Resource/locale/messages.ja.yaml:2744; 不在（探索範囲: src/Eccube, html の 閲覧不可/identification_image.*view/authority 判定付きTwig分岐））

■管理-M08-10 オンライン本人確認
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）身分証画像のサムネイル押下で画像種別ごとの拡大表示モーダルを開き、サムネイルは縮小表示、拡大モーダルは大きめ表示にする。
　画像には class="expand-image" が付くが、クリックハンドラ、data-bs-toggle/data-bs-target、画像種別ごとの拡大モーダル、expand-image 用CSSは見つからない。customer.css はオンライン本人確認モーダル幅などだけを定義している。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-18:4181,4223 ／ 実装: src/Eccube/Resource/template/admin/Customer/edit.twig:253; html/template/admin/assets/css/customer.css:7; 不在（探索範囲: src/Eccube/Resource/template/admin/Customer, html/template/admin/assets の expand-image click handler/data-bs-target/拡大モーダル定義））

■管理-M08-10 オンライン本人確認
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）確認済への変更が成功したとき、フラッシュに「会員情報を保存しました。」を表示する。
　completeIdentification は admin.common.save_complete を addSuccess し、messages.ja.yaml では「保存しました」と定義されている。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-18:4234 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerEditController.php:299; src/Eccube/Resource/locale/messages.ja.yaml:1559）

■管理-M08-10 オンライン本人確認
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）確認済への変更時は本人確認ステータス・身分証有効期限の更新を記録し、個人情報・身分証画像・画像URL・トークン等の具体値はログに出さない。
　completeIdentification は選手情報保存とフラッシュ表示を行うが、確認済への変更事実を記録する log_info や監査記録の呼び出しが無い。個人情報や画像URLを出すログも見つからない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-18:4237,4240 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerEditController.php:231; 不在（探索範囲: CustomerEditController.php, src/Eccube/Controller/Admin/Customer, src/Eccube/Service の log_info/log_error/確認済への変更/completeIdentification））
