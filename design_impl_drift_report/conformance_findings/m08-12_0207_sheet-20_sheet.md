■管理-M08-12 顧客グループ管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）利用者視点の入口は、GET /{admin_route}/customer_group/{id}、POST /{admin_route}/customer_group/new、POST /{admin_route}/customer_group/{id}/update、DELETE /{admin_route}/customer_group/{id}/delete とする。
　実装は /%eccube_admin_route%/customer/customer_group と /%eccube_admin_route%/customer/customer_group/{id} を GET/POST 共用で定義し、DELETE も /%eccube_admin_route%/customer/customer_group/{id}/delete で定義している。/customer_group/new と /customer_group/{id}/update のルートは検索範囲内に存在しない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-20:4632,4641,4643 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerGroupController.php:39,40,72 ／ src/Eccube/Resource/template/admin/CustomerGroup/index.twig:13,117）

■管理-M08-12 顧客グループ管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）新規追加/編集ラベルは、初期表示は「新規追加」、既存の顧客グループ選択時は「編集」と表示する。
　画面タイトルは常に admin.customer.customer_group_edit（顧客グループ編集）、カードタイトルは常に admin.customer.customer_group_management（顧客グループ管理）で、TargetCustomerGroup.id による「新規追加」/「編集」の切替表示がない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-20:4560 ／ 実装: src/Eccube/Resource/template/admin/CustomerGroup/index.twig:5,6,20 ／ src/Eccube/Resource/locale/messages.ja.yaml:3840,3841）

■管理-M08-12 顧客グループ管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除確認ダイアログの表示メッセージは「[顧客グループ名称]を削除してもよろしいですか？」とする。
　削除モーダルは共通翻訳 admin.common.delete_modal__message を使い、「この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？」を表示する。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-20:4528 ／ 実装: src/Eccube/Resource/template/admin/CustomerGroup/index.twig:111 ／ src/Eccube/Resource/locale/messages.ja.yaml:1600）

■管理-M08-12 顧客グループ管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ポイント還元率は必須、数値（整数）、最大値4294967295、0以上の整数のみ入力可能とする。
　フォームは IntegerType 必須で NotBlank と Regex('/^[-]?([1-9]\d*|0)$/') を設定しており、負数形式を許容する。最大値制約はなく、Entity は point_percentage を unsigned SMALLINT として定義している。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-20:4562 ／ 実装: src/Eccube/Form/Type/Admin/CustomerGroupType.php:39,40,41,42,43,44 ／ src/Eccube/Entity/DtbCustomerGroup.php:70）

■管理-M08-12 顧客グループ管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）支払方法は複数選択チェックボックスで、支払方法設定に登録されている支払方法をすべて表示する。
　Payments は expanded/multiple のチェックボックスだが、query_builder で p.visible = true に限定し、Payment::EC_CREDIT と Payment::EC_CVS を除外している。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-20:4565 ／ 実装: src/Eccube/Form/Type/Admin/CustomerGroupType.php:54,55,56,57,58,59,60,61,62,63,64 ／ src/Eccube/Entity/Payment.php:49,50,142,143）
