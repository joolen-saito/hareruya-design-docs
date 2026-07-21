■管理-M05-19 出荷指示リスト編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表示件数プルダウンは、各 option の value に GET /{admin_route}/standby/search?page_no=1&page_count=… 形式のURL文字列を持つが、当 index.twig の javascript ブロックは空であり、#page_count_pulldown の change ハンドラは載っていないため、プルダウンだけでは自動遷移しない。
　ShippingStandby/index.twig の javascript ブロックに #page_count_pulldown の change ハンドラが実装され、選択値を targetUrl として window.location.href に代入している。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-19:6724,6748 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:21）
