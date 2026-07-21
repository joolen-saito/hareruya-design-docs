■管理-M10-02 特定商取引に関する法律
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）画面見出しは「ショップ設定」「特定商取引法管理」、ボックス見出しは「特定商取引法」として表示される。
　管理画面テンプレートは title とカードヘッダに admin.setting.shop.tradelaw_setting、sub_title に admin.setting.basic_info を表示する。日本語ロケール値はそれぞれ「特定商取引法設定」「基本情報設定」。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-4:1825,1841 ／ 実装: src/Eccube/Resource/template/admin/Setting/Shop/tradelaw.twig:15,16,28 / src/Eccube/Resource/locale/messages.ja.yaml:2780,2783）

■管理-M10-02 特定商取引に関する法律
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）特定商取引法ブロックに入力欄と「登録」ボタンがある。値を入力して「登録」を押す。
　送信ボタンは admin.common.save を表示し、日本語ロケール値は「保存」。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-4:1838,1841 ／ 実装: src/Eccube/Resource/template/admin/Setting/Shop/tradelaw.twig:68,69 / src/Eccube/Resource/locale/messages.ja.yaml:1441）

■管理-M10-02 特定商取引に関する法律
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）移行先（ec-cube-enterprise）では特定商取引法を dtb_tradelaw の name・description・sort_no・display_order_screen の行リストとして保持し、並び順・表示制御は sort_no・display_order_screen で扱う。
　Entity には sort_no と display_order_screen が存在するが、管理画面フォーム TradeLawMallType は name・description のみを定義し、管理Twigも name・description のみを描画する。フロント Help/tradelaw.twig は name と description の有無だけで表示し、display_order_screen を参照しない。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-4:1833,1834 ／ 実装: src/Eccube/Entity/TradeLaw.php:44,47 / src/Eccube/Form/Type/Admin/TradeLawMallType.php:39,56 / src/Eccube/Resource/template/admin/Setting/Shop/tradelaw.twig:42,50 / src/Eccube/Resource/template/default/Help/tradelaw.twig:21,27）
