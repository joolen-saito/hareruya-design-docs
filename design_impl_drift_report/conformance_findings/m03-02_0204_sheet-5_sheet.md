■管理-M03-02 商品登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）商品新規登録のアクセスを禁止し、/admin/product/product/new にアクセスした場合は 404(Page Not Found) を返す。
　新規登録ルートは GET/POST として定義されたままで、id=null の場合は新規 Product/ProductClass を作成してフォーム表示する。POST時は404ではなくエラー追加後に admin_product_product_new へリダイレクトする。ACLは一部権限の /product/product/new を ACCESS_DENIED にするだけで、仕様のHTTP404ではない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1671-1674 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:496, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:509, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:591, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:35, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Voter/AuthorityVoter.php:60）

■管理-M03-02 商品登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）更新POSTは /{admin_route}/product/product/{id}/edit/update、POSTフォーム名は m03-02_admin_product_product_edit、画像関連隠しフィールドは add_images/copy_images/delete_images/rank_images を用いる。
　更新は GET/POST 共用の /product/product/{id}/edit で受ける。HTML form は name="form1"、Symfonyフォームの block prefix は admin_product。画像の隠しCollectionは images/add_images/delete_images/copy_images で、rank_images はなく、並び順は request の admin_product[product_image] から読む。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1813, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1830, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1841 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:496, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/product.twig:124, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:305, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:312, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:319, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:326, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:380, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:753）

■管理-M03-02 商品登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）商品画像追加XHRは /{admin_route}/product/product/image/add で受け、XHR以外とファイル配列なし/0件をHTTP400、非画像MIMEをHTTP415、元拡張子を保った一時ファイル名一覧をJSONで返す。
　実装ルートは /product/product/image/process。非XHR判定は !$request->isXmlHttpRequest() && $this->isTokenValid() で、CSRF不正時は AccessDeniedHttpException になる。ファイルなし/0件は明示HTTP400にせず、count($images)>0 のときだけ処理する。応答は JsonResponse ではなく new Response(array_shift($files)) で先頭1件の文字列を返す。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1813, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1824-1825, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1838-1839, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1852 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:370, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:373, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:377, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:381, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:387, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:414, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/product_js.twig:52）

■管理-M03-02 商品登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）商品名(英)・商品カテゴリ・購入グループ・サイズ・重量・割引率・販売制限を必須/NotBlankで検証し、サイズ/重量はLength max 9かつ入力欄0以上999999999以下で検証する。
　商品名と商品ステータスにはNotBlankがあるが、商品名(英)はLengthのみ。商品カテゴリには制約なし。購入グループ、サイズ、重量、割引率、販売制限は required=false またはHTML属性のみで、NotBlank/Length max 9/上限999999999のサーバ側制約がない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1830-1831, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1851-1852 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:91, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:165, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:177, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:186, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:195, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:223, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:248, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:284）

■管理-M03-02 商品登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）商品公開ステータスが廃止で更新された場合、以降の商品情報を変更できなくする。参照は可能。
　Twigは廃止ステータス時に右下のStatus/登録ボタンだけを非表示にするが、基本情報の入力欄は参照専用にしていない。ProductControllerのPOST更新経路には現在ステータスがDISPLAY_ABOLISHEDかを拒否する分岐がなく、フォームがvalidなら更新日時設定とflushまで進む。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1681 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/product.twig:817, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:591, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:599, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:811）

■管理-M03-02 商品登録編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）更新確定後に支店システムへ当該商品の更新を通知する。
　商品編集POSTでは支店公開フラグをProductに設定してflushするだけで、支店システム通知ジョブ/API/メッセージ投入はない。支店連携に近いコメントはCSVインポート系のTODOとして残るのみで、商品編集確定後の通知処理ではない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1823, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1836, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1838-1839, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1841-1842 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command。検索語: 支店システム, 支店.*通知, 更新通知, Branch.*notify, notify.*Branch, dispatch.*Branch, branch.*message, UniSearch, isBranchPublished））

■管理-M03-02 商品登録編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）商品編集で商品公開ステータスが廃止になった場合、スマレジに登録済みの紐付く商品規格についてDELETE APIを実行し削除する。
　SmaregiProductClassEventServiceには削除メッセージ投入機能があり、ProductClassControllerの規格削除ではdispatchDeleteMessageを呼ぶ。一方、ProductControllerの商品編集更新では商品名変更時のdispatchUpsertのみで、商品ステータスがDISPLAY_ABOLISHEDになった場合の削除ジョブ登録/DELETE投入がない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1684-1686, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-65:13891, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-66:13953 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler。検索語: DISPLAY_ABOLISHED, dispatchDeleteMessage, SmaregiProductClassDeleteMessage, dispatchUpsert, smaregi delete））

■管理-M03-02 商品登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）更新成功時は「登録が完了しました。」の成功フラッシュを設定し、同じ商品の編集画面へリダイレクトする。
　リダイレクト先は同じ編集画面だが、フラッシュキーは admin.common.save_complete で、表示文言は「保存しました」。設計どおりの admin.register.complete（登録が完了しました。）は翻訳定義には存在するが、この更新経路では使っていない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1823, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-5:1858-1859 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:852, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1405, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1780, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:873）
