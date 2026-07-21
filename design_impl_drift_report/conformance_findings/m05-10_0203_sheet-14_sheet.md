■管理-M05-10 納品書印刷（英語）
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）・棚番（昇順、支店の場合は棚番のソートは行わない）
　英語納品書データ生成では generateDeliverySlips() が共通の sortProduct($qb2) を無条件に呼び、SortProductTrait は sn.sortNo を shelfNumberSortNo として追加し、常に shelfNumberSortNo ASC で並べている。支店の場合に棚番ソートを無効化する BaseInfo / tenant / branch / isMainShop 条件分岐は当該 Controller/Repository/Trait/Twig 内に確認できない。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-14:4219 ／ 実装: src/Eccube/Repository/DtbShippingStandbyRepository.php:320, src/Eccube/Repository/Traits/SortProductTrait.php:69, src/Eccube/Repository/Traits/SortProductTrait.php:72）
