■管理-M10-07 税率設定
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）税率設定画面は「個別税率設定」ブロックに「商品別税率機能」の有効/無効選択と上部「登録」ボタンを表示し、POST /{admin_route}/setting/shop/tax/edit_param で dtb_base_info.option_product_tax_rule だけを保存する。
　税率設定画面側には option_product_tax_rule のフォーム項目、個別税率設定ブロック、edit_param ルート、パラメータ保存イベント dispatch が無い。option_product_tax_rule は ShopMasterType に存在し、ShopController の /setting/shop で保存される。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-8:2535 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:51, src/Eccube/Resource/template/admin/Setting/Shop/tax_rule.twig:53, src/Eccube/Form/Type/Admin/TaxRuleType.php, src/Eccube/Form/Type/Admin/ShopMasterType.php:279, src/Eccube/Controller/Admin/Setting/Shop/ShopController.php:45, rg: option_product_tax_rule/edit_param/admin_setting_shop_tax_edit_parameter/tax.rule.edit.parameter））

■管理-M10-07 税率設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）画面構成は「個別税率設定」「共通税率設定」「税率一覧」の縦並びで、ページ見出しは「基本情報設定」＋サブタイトル「税率設定」、共通税率は「登録」ボタン、課税規則はラジオ、適用日時は Bootstrap datetimepicker、確認モーダルは使わない。
　実装は単一の「税率設定」カード内に新規行・既存行を含む表を描画する。見出しは title=税率設定/sub_title=基本情報設定。新規ボタンは「新規作成」、編集保存は「決定」。課税規則は expanded=false の選択式。税率設定テンプレートには datetimepicker 初期化が無く、削除は Bootstrap モーダルを使う。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-8:2603 ／ 実装: src/Eccube/Resource/template/admin/Setting/Shop/tax_rule.twig:15; src/Eccube/Resource/template/admin/Setting/Shop/tax_rule.twig:53; src/Eccube/Form/Type/Master/RoundingTypeType.php:29; src/Eccube/Form/Type/Admin/TaxRuleType.php:61）

■管理-M10-07 税率設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一覧から「編集」を選ぶと GET /{admin_route}/setting/shop/tax/{id}/edit で当該行がフォームに載り、基本税率行以外は適用日時欄と日時ピッカーを表示する。
　編集専用 GET /setting/shop/tax/{id}/edit は無い。編集ボタンは tax_rule.twig の JS で同一一覧行の .edit を表示し、POST /setting/shop/tax に tax_rule_id と mode=edit_inline を送る。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-8:2600 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:51, src/Eccube/Resource/template/admin/Setting/Shop/tax_rule.twig:39, rg: admin_setting_shop_tax_edit, /setting/shop/tax/{id}/edit））

■管理-M10-07 税率設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）新規共通税率行の課税規則の初期値はマスタID1とする。
　newTaxRule は最初に RoundingType::ROUND(ID1) を取得するが、現在有効な税率設定が取得できる場合は $CurrentRule->getRoundingType() で上書きする。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-8:2607 ／ 実装: src/Eccube/Repository/TaxRuleRepository.php:77）

■管理-M10-07 税率設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）消費税率は必須、整数入力、0〜100の範囲、数値書式パターンを併用して検証する。
　tax_rate は IntegerType、NotBlank、Range(['min' => 0])、Regex /^\d+(\.\d+)?$/ のみで、100以下の上限制約が無い。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-8:2646 ／ 実装: src/Eccube/Form/Type/Admin/TaxRuleType.php:47）

■管理-M10-07 税率設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）同一適用日時の別行が既に存在する場合は、共通税率行に限って重複判定し、適用日時へフォームエラー文言「既に同じ適用日時で登録されています。」を付与して保存しない。
　POST_SUBMIT で t.apply_date が同じ、かつ t.ProductClass IS NULL の行を数える。Product IS NULL 条件は無い。エラー文言は admin.setting.shop.tax.apply_date.available_error で「同時刻の適用日時を設定できません。」。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-8:2628 ／ 実装: src/Eccube/Form/Type/Admin/TaxRuleType.php:73; src/Eccube/Resource/locale/messages.ja.yaml:3095）

■管理-M10-07 税率設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除対象IDが存在しない場合は、フラッシュをクリアして警告メッセージだけを残し、税率設定一覧へリダイレクトする。
　delete(Request $request, TaxRule $TaxRule) として TaxRule 実体を引数に受け、メソッド内に対象不存在時の分岐、フラッシュクリア、警告メッセージ追加が無い。存在する非基本税率は repository->delete して成功メッセージ、基本税率は何もせずリダイレクトする。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-8:2615 ／ 実装: src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:147）

■管理-M10-07 税率設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）共通税率保存成功後は admin.setting.shop.tax.rule.index.complete イベントで完了フックを実行する。
　新規フォームの保存成功時は ADMIN_SETTING_SHOP_TAX_RULE_INDEX_COMPLETE を dispatch するが、既存行の edit_inline 保存成功時は persist/flush と成功メッセージだけで完了イベントを dispatch しない。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-8:2666 ／ 実装: src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:75）
