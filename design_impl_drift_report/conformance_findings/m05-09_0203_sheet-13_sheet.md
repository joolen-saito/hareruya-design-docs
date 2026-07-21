■管理-M05-09 納品書印刷（日本語）
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）納品書印刷（日本語）の商品明細並び順は「棚番（昇順、支店の場合は棚番のソートは行わない）」とする。
　納品書データ生成は常に sortProduct($qb2) を呼び、SortProductTrait は sn.sortNo を shelfNumberSortNo として常に addOrderBy('shelfNumberSortNo', 'ASC') している。支店判定や支店時に棚番ソートを無効化する分岐はこの経路に無い。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-13:3932 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:319, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Traits/SortProductTrait.php:69）
