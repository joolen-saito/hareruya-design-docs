■管理-M05-01 受注情報検索 一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）CSVダウンロードの名称は「受注一覧CSVダウンロード」「受注詳細CSVダウンロード」「受注一覧カスタムCSVダウンロード」「受注詳細カスタムCSVダウンロード」に変更する。
　画面は翻訳キー経由で旧名称の「受注CSVダウンロード」「出荷CSVダウンロード」「カスタム受注CSVダウンロード」「カスタム配送CSVダウンロード」を表示する実装になっている。実装内に「受注一覧CSV」「受注詳細CSV」「受注一覧カスタムCSV」「受注詳細カスタムCSV」の表示文言は確認できない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-4:1914 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1142, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1145, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1159, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1176, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5563）

■管理-M05-01 受注情報検索 一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）受注情報検索一覧の件数はデフォルト値を300件とし、件数プルダウンの初期値も300件とする。
　初期件数はセッション未設定時にeccube_default_page_countを参照し、設定値は10である。300件はmtb_page_maxの選択肢としては存在するが、初期選択値にはなっていない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-4:1878 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:161, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php:83, /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:124, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1127）

■管理-M05-01 受注情報検索 一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）デフォルトでメンバー管理で設定されている店舗にて絞り込まれている状態とする。
　通常GETの初期検索条件はorder_status_id指定がない限り空のviewDataで、tenantsフォームにもメンバー店舗の初期値設定はない。Repositoryはtenantsが入力済みの場合だけ絞り込み、dtb_order/dtb_shippingのRLSも無効化されている。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-4:1881 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:223, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:289, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:251, /home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260319061014.php:51）

■管理-M05-01 受注情報検索 一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）お名前列は、非会員の場合に「非会員」と表示する。
　TwigにはOrder.Customerがnullの場合に「非会員」を表示する分岐があるが、一覧取得Queryがo.CustomerをinnerJoinしているため、Customerがnullの受注は検索結果から除外される。Orderエンティティ上のCustomerはnullableである。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-4:1939 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:585, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:249, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1270）

■管理-M05-01 受注情報検索 一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一覧ヘッダのソート操作は、画面から送信されるsortkey/sorttypeに従って受注日・受注番号・注文確定日などを正しく並び替える。
　Twigはdata-sortkeyとしてorder_date、order_number、order_commit_dateを送信するが、OrderRepository::COLUMNSにはこれらのキーが存在しない。Repositoryはsortkeyが空でなければself::COLUMNS[$searchData['sortkey']]を参照してorderByする。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-4:2012 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1233, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1234, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1238, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:65, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:556）
