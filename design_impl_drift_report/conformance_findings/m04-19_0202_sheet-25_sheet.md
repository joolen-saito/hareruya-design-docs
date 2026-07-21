■管理-M04-19 欠品履歴検索一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索した結果の在庫変動履歴の内、在庫変動理由区分が「廃棄」（親区分）、「欠品減算（受注）」・「欠品減算（移動）」（子区分）の履歴を検索し表示する。
　disposal_search 時は MtbStockChangeType::DISPOSAL 配下の全子区分を取得して sh.StockChangeTypeDetail IN 条件にしている。マスタ上の「欠品減算(受注)」id=19 と「欠品減算(移動)」id=21 は MtbStockChangeType::OUT_OF_STOCK 配下であり、この条件に含まれない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-25:10732 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockHistoryRepository.php:143）

■管理-M04-19 欠品履歴検索一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）第三ソートを各レコードの「登録日時」の降順（最新順）で表示する。
　並び順は pc.code DESC、ps.baseInfo DESC、sh.createDate DESC。画面の登録日表示は Stock.registeredAt を使っているが、ソートは registeredAt ではなく createDate を使っている。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-25:10737 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockHistoryRepository.php:332）

■管理-M04-19 欠品履歴検索一覧(検索結果)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）商品名を押下すると、押下した商品在庫の在庫編集画面を別タブで表示する。
　商品名列は {{ productSub.name }} のプレーンテキスト表示で、在庫編集画面への a タグや target="_blank" がない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-25:10762 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:661）

■管理-M04-19 欠品履歴検索一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）欠品時販売価格は、欠品登録時の販売価格を表示し、受注の場合は受注情報で保持している販売価格、移動の場合も移動情報で保持している販売価格を参照する。
　欠品検索モードの「欠品時販売価格」列は productClassSub.buy_price|price を表示している。これは仕入単価であり、在庫履歴に保存された sell_price ではない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-25:10771 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:713）

■管理-M04-19 欠品履歴検索一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索結果0件時は「検索条件に該当するデータがありませんでした。」の見出しを表示する。
　検索成功後の戻り値で has_errors が true 固定になっているため、pagination.totalItemCount が0件の場合、history.twig の has_errors 分岐に入り admin.common.search_invalid_condition を表示する。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-25:10903 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockHistoryController.php:220）

■管理-M04-19 欠品履歴検索一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）識別ID:2-7 として「在庫区分」列を表示する。
　列値は Stock.ProductStock.locationName を表示しているが、列見出しは admin.stock.history.stock_location を使い、ロケール上は「在庫場所」と表示される。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-25:10743 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:624）
