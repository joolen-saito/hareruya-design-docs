### 指摘1（重大度: Major）対象: 群PB
主張: 3件のシードは「商品登録編集画面」で商品コード・販売価格・公開状態を登録し、注文可能な商品を用意できる。
実際: 商品編集機能の新規登録は廃止されている。商品規格が無ければ公開操作もできず、商品編集画面では価格を扱わない。商品コード・販売価格は商品規格登録編集の項目で、基準価格・買取価格・部門も入力が必要である（`integration_test/casegen/link_pub/cases/PB_seed_data.tsv:5`–`7`、`functions/pf-eccube3/m03-02_admin_product_product_edit.md:5`、同`:13`、同`:32`、`excel_to_html/output/0204_基本設計仕様書(商品管理).html:3620`–`3634`）。
判定: 前提不成立
修正案: 画面から作れる商品作成経路を特定し、商品本体と商品規格を作る操作・必須値を各シードに記す。作成経路を確定できなければ、この3件を成立するケースとして扱わない。

### 指摘2（重大度: Major）対象: 群PB
主張: 各ケースで対象商品を数量3で注文できる。
実際: 注文確定前に購入制限数と商品数を比較し、超過するとエラーになる。商品規格には販売制限数の項目があるが、3件のシードはその値を指定していない（`excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2077`、`excel_to_html/output/0204_基本設計仕様書(商品管理).html:3622`、`integration_test/casegen/link_pub/cases/PB_seed_data.tsv:5`–`7`）。
判定: 前提不成立
修正案: 各商品の販売制限数を数量3の注文が通る値として、事前準備と画面での投入方法に明記する。

### 指摘3（重大度: Minor）対象: IT-F04-04-PB001、IT-F04-04-PB002
主張: 事前準備の会員メールアドレスはそれぞれ `f0404pb-001`、`f0404pb-002` である。
実際: 対応するシードの登録値と手順のログイン値は、それぞれ `f0404pb-001@example.test`、`f0404pb-002@example.test` である。事前準備の値はメールアドレス形式でもなく、シードと一致しない（`integration_test/casegen/link_pub/cases/PB_test_cases.tsv:2`–`3`、`integration_test/casegen/link_pub/cases/PB_seed_data.tsv:5`–`6`、`excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1220`）。
判定: 規約違反
修正案: 2件の事前準備を、シードと同じ完全なメールアドレスに直す。

### 指摘4（重大度: Minor）対象: 群PB
主張: 報告書の作成数は4件で、PB004を採用した。
実際: ケースはPB001～003の3件であり、前回裁定でPB004は削除された。報告書の作成数・採否表・対応表・到達可能性には削除前の記述が残り、末尾の注記だけで取り消している（`integration_test/casegen/link_pub/cases/PB_test_cases.tsv:2`–`4`、`integration_test/casegen/link_pub/gen_PB/report.md:6`–`15`、同`:29`、同`:44`、同`:61`–`65`）。
判定: 規約違反
修正案: 報告書全体を現行3件に合わせ、PB004を不採用候補として理由付きで記載する。
