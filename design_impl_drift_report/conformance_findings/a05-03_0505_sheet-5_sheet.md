■API-A05-03 店頭注文番号取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）店頭注文番号リストの取得は GET /{_locale}/waiting_api/get_waiting で提供し、本APIはリクエストパラメータを持たない。パスパラメータ {_locale} は言語識別子であり、取得対象の絞り込みには用いない。
　実装は GET /waiting_api/get_waiting_number/{base_info_id} の `get_waiting_number` ルートを定義し、Twig も `BaseInfo.id` を渡して呼び出す。Controller は `base_info_id > 0` の場合だけ取得処理に入り、注文番号札・注文番号の双方を BaseInfo で絞り込む。確認お願いします。（設計根拠: excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-5:1463,1476 ／ 実装: src/Eccube/Controller/Front/WaitingNumberController.php:56,57,61,64,69,71,77,79; src/Eccube/Resource/template/default/Block/js/waiting_get_js.twig:96; src/Eccube/Repository/DtbWaitingNumberRepository.php:43,49,50; 不在（探索範囲: src/Eccube と html/template の Route/Twig/YAML/PHP を get_waiting, waiting_api, get_waiting_number で検索し、/{_locale}/waiting_api/get_waiting または get_waiting 名のルートは未検出））
