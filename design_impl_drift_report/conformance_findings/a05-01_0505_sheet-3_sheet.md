■API-A05-01 注文印刷_印刷情報をプリンタへ送信
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）A05-01 はエンドポイントURLを /order/prints/{店舗ID}、HTTPメソッドを GET とし、URLに店舗ID(shop_id)を引数として持つ。A05-02とはエンドポイントを分ける。
　実装のルートは #[Route(path: '/api/order/prints/direct/{base_info_id}', name: 'order_direct_print', requirements: ['base_info_id' => '\d+'], methods: ['POST'])] で、A05-01(GetRequest) と A05-02(SetResponse) を同一POSTルート内の ConnectionType 分岐で処理している。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-3:855 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:43）

■API-A05-01 注文印刷_印刷情報をプリンタへ送信
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）店舗ID(shop_id)が無い、整数以外の型、存在しない店舗ID(shop_id)の場合は 404 を返す。
　実装は base_info_id を \d+ でルーティングするが、存在しないIDは OrderDirectPrintAction に渡され、BaseInfo が見つからない場合も getDirectPrintOrderList($base_info_id) を実行して、対象なしなら空文字の200応答になり得る。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-3:903 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:43）

■API-A05-01 注文印刷_印刷情報をプリンタへ送信
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）GetRequestで生成した印刷情報が空でない場合、印刷不具合検証のため印刷情報のXMLを var/log/print_logs/ 配下にタイムスタンプと一意名を付けたファイルとして書き出し、ディレクトリが存在しない場合は作成する。
　該当処理は TODO コメント付きでブロックコメント化されており、file_put_contents は実行されない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-3:1095 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:57）

■API-A05-01 注文印刷_印刷情報をプリンタへ送信
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）バーコード未印刷を防ぐため、注文データをXML形式にする前に受注データにスマレジの商品コードが存在するか確認し、存在しない場合は何もしない。スマレジコードは印刷情報のバーコードにも用いる。
　本店向け getPrintOrderListMainShop の店頭受取・注文受領分岐には o.smaregi_code IS NOT NULL 条件がない。ブラウザ印刷フラグ分岐にもスマレジコード必須条件がない。支店向け getDirectPrintOrderList でも browser_print_flg = true 分岐にスマレジコード必須条件がない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-3:879 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1493）

■API-A05-01 注文印刷_印刷情報をプリンタへ送信
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）印刷対象の受注一覧は、店頭受取で注文受領の受注、スムーズ店頭受取で所定の支払方法かつ未確定・未出荷・未取消・未受領・店頭予約日なし・スマレジコードありの受注、ブラウザ印刷フラグが立つ受注を対象とし、最大10件を取得する。配送がスムーズ店頭受取の場合は合計金額欄を「スムーズ店頭受取」とする。
　支店向け getDirectPrintOrderList は店頭受取分岐と browser_print_flg 分岐のみで、スムーズ店頭受取分岐がない。また OrderDirectPrintAction は payment_total をそのまま印字しており、スムーズ店頭受取時に「スムーズ店頭受取」へ置換する分岐を持たない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-3:1044 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1550）

■API-A05-01 注文印刷_印刷情報をプリンタへ送信
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ConnectionType が GetRequest・SetResponse のいずれにも一致しない場合は処理を行わず応答を組み立てない。
　ConnectionType が想定値以外の場合、StreamedResponse を作成し、HTTP 400 と Content-Type: text/plain; charset=utf-8 を設定して返している。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-3:1062 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:91）
