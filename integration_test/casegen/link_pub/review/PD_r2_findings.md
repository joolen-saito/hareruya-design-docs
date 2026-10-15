### 指摘1（重大度: Major）対象: IT-F05-06-PD001
主張: 買取履歴欄に申込の行が表示されれば、IT-0332を満たす。
実際: IT-0332は、登録した実体が管理画面の一覧に載り、詳細・編集画面で開けることを求める（`integration_test/casegen/link_pub/gen_PD/prompt.md:53`、`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:333`）。修正後の手順と期待結果は、会員登録編集画面の買取履歴欄の行を見るだけで、買取申込の詳細を開かない（`integration_test/casegen/link_pub/cases/PD_test_cases.tsv:2`）。下流設計でも、その欄は対象会員の買取履歴を取得する欄とされている（`excel_to_html/output/0207_基本設計仕様書(会員管理機能).html:1861-1870`）。
判定: 範囲外
修正案: IT-0332としての本ケースを削除する。買取申込の一覧・詳細確認は、既存ケースとの重複を踏まえて扱う。

### 指摘2（重大度: Major）対象: IT-F05-06-PD001〜PD003
主張: 共通商品シードを画面から作成し、数量2の買取申込に使える。
実際: シードの規格登録手順は言語・状態・商品コード・買取価格だけを指定する（`integration_test/casegen/link_pub/cases/PD_seed_data.tsv:4`）。商品規格登録画面では販売価格・基準価格・買取価格・部門が必須であり（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:3624-3627,3634`）、販売価格は買取価格以上でなければ保存できない（`functions/pf-eccube3/m03-09_admin_product_product_class_edit.md:24-27`）。このシード記述だけでは、3件の前提商品を登録できない。
判定: 前提不成立
修正案: 各規格について販売価格・基準価格・部門を具体値で指定し、販売価格が買取価格以上になる投入手順に直す。
