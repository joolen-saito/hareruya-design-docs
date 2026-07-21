■管理-M03-14 略称タグ登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）件数プルダウンは選択肢として「10件 50件 100件 300件 500件 1000件 2000件 10000件 12000件」を表示する。
　略称タグ登録の件数プルダウンは [10, 50, 100, 300, 500, 1000] のみを描画しており、2000件・10000件・12000件が選択肢に存在しない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-28:6820 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:114）
