■管理-M05-01 受注情報検索 一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）店舗のセレクトボックスはメンバー管理で設定されているデフォルト検索表示店舗が選択されている状態とし、店舗選択は必須、全店の選択項目を追加する。複数店舗はOR条件、全店または全店＋店舗選択時は開店しているすべての店舗を検索対象とする。
　初期GETでは店舗検索条件を空配列でセッションへ保存し、tenants は required=false の通常EntityType複数選択として描画される。全店専用選択肢や開店店舗限定条件はなく、非空時だけ s.baseInfo IN (:BaseInfo) で絞り込む。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-3:1015,1016,1017,1018,1028 ／ 実装: src/Eccube/Controller/Admin/Order/OrderController.php:223; src/Eccube/Controller/Admin/Order/OrderController.php:233; src/Eccube/Form/Type/Admin/SearchOrderType.php:289; src/Eccube/Repository/OrderRepository.php:251; src/Eccube/Resource/template/admin/Order/index.twig:386）

■管理-M05-01 受注情報検索 一覧(検索入力)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）顧客グループは複数選択チェックボックスで、顧客グループ設定画面で定めたものをマスターとして参照して表示する。
　SearchOrderType には customer_group の EntityType 定義があるが、index.twig は「顧客グループ」ラベルだけを描画し form_widget(searchForm.customer_group) を出していない。OrderRepository も customer_group - TBD コメントのみで検索条件を組み立てない。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-3:1038 ／ 実装: src/Eccube/Form/Type/Admin/SearchOrderType.php:245; src/Eccube/Resource/template/admin/Order/index.twig:475; src/Eccube/Repository/OrderRepository.php:324）

■管理-M05-01 受注情報検索 一覧(検索入力)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）引き渡し後の受注情報に引き渡し前の注文番号を紐づけておき、引き渡し前の注文番号で検索した際に、引き渡し後の受注情報が検索できるようにする。
　スマレジ引き渡し処理では既存受注に next_order_id を設定するが、受注検索の注文番号条件は o.order_number LIKE :order_number のみ。旧受注の next_order_id から新受注を引く join/subquery はなく、未選択ステータスでは引渡し済み受注自体も除外される。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-3:1012 ／ 実装: src/Eccube/Repository/OrderRepository.php:258; src/Eccube/Repository/OrderRepository.php:295; src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandler.php:115; src/Eccube/Entity/Order.php:754）

■管理-M05-01 受注情報検索 一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）保存した検索パターンは検索条件フォームと検索結果一覧の間にリンクとして並べて表示され、クリックするとその検索条件で受注検索を行う。また保存した検索パターン個々にリロードアイコンがあり、該当件数は更新されるまで「*」を表示する。
　検索パターン一覧は描画されるが、現在適用中のパターンは pattern_id 分岐で名前だけを出力する。リンク、該当件数「*」のspan、個別リロードボタンは未選択パターン側の else にしかない。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-3:1003,1004,1005,1007,1109,1110 ／ 実装: src/Eccube/Resource/template/admin/Order/index.twig:1075; src/Eccube/Resource/template/admin/Order/index.twig:1078; src/Eccube/Resource/template/admin/Order/index.twig:1081）
