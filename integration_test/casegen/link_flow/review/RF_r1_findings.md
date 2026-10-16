### 指摘1（重大度: Major）対象: IT-M06-03-RF001〜003
主張: シードで店頭買取の査定を完了し、「入庫待ち」の買取を用意できる。
実際: 3件のシードには固定価格商品部門IDの設定がない（`integration_test/casegen/link_flow/cases/RF_seed_data.tsv:4-6`）。MTGバイヤーは査定画面を開く際に固定価格部門を取得し（`functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:32`）、設定がなければ取得APIはHTTP 500を返す（`functions/pf-api/a06-12_api_store_purchase_fixed_price_section.md:11-13`）。現状の事前準備では、査定画面で行うシード作成手順の成立を保証できない。
判定: 前提不成立
修正案: 3件それぞれの事前準備に、画面で作成した固定価格商品部門と、追加システム設定に登録したその部門IDを値付きで加える。

### 指摘2（重大度: Minor）対象: IT-M06-03-RF001〜002
主張: 在庫シードの投入時、在庫変動区分に「入庫の区分」を選ぶ。
実際: この記述では選択値が決まらない（`integration_test/casegen/link_flow/cases/RF_seed_data.tsv:4-5`）。在庫編集画面には「入庫/問屋仕入」から「入庫/その他」まで複数の選択肢がある（`excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:1750`）。投入方法は実行できる粒度で書く規約にも合わない（`integration_test/casegen/precond/README.md:31`）。
判定: 規約違反
修正案: 両シードの投入方法で、選択値を「入庫/その他」など設計書上の一つの値に特定する。
