主張: `matrix_UKA-01/README.md:31` は買取店舗Hと査定担当者の所属店舗Kを独立とし、`matrix.md:13` のT01などは本店での買取を支店所属の担当者が査定するとしている。禁則表にも該当する禁則が無い。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1167` は「ログイン者の所属店舗に紐づく…査定情報を取得する」と規定する。新実装の `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:1104` も買取店舗をログイン者の店舗で絞るため、支店所属者の一覧に本店の受注は出ず、T01は査定に進めない。
判定: 禁則の誤り
修正案: HとKを同じ店舗にそろえ、本店・支店それぞれで実行できる行に直す。

主張: `scenario_list.md:76` は、本人確認で住所を確かめる項目が「設計書にも実装にも見つからない」としている。
実際: `/home/y-saito/Developments/front-application/MTGBuyer/Screen/IDScan/IdentificationScan.xaml:105`–`106` は身分証スキャン画面に「スキャンした身分証と」「住所登録を照合してください。」と表示する。画面は査定開始前に住所照合を指示している。
判定: 事実の誤り
修正案: 査定開始前の住所照合指示を本人確認の手順と確認結果に加え、照合結果をシステムが判定していない点を別に記す。
