■管理-M08-02 出荷指示リスト検索
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表示件数プルダウンは、同一パターンの change ハンドラは載っておらず、プルダウンだけでは自動遷移しない。
　ShippingStandby/index.twig の javascript ブロックで #page_count_pulldown の change イベントを登録し、選択値があれば window.location.href に代入して自動遷移する実装になっている。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-18:6724,6727 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:21）
