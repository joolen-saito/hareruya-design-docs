### 指摘1（重大度: Major）対象: IT-M03-27-QB003

主張: グッズ商品CSVで「最新入荷アイテム」タグを付け、本店TOPへの掲載を確認できる。

実際: 取込CSVと商品作成手順は〔タグID-M0327-最新入荷〕と〔タグID-M0327-値下げ〕を使うが、使用シードのマスタには両タグの登録状態もIDの控え方もない（`integration_test/casegen/link_pub/cases/QB_seed_data.tsv:11,16-17`）。CSVのタグ指定は実在するタグを前提とする（`functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md:66`）。

判定: 前提不成立

修正案: M03-27のマスタシードに両タグの登録状態とIDの取得手順を加え、事前準備にも値を明記する。

### 指摘2（重大度: Major）対象: IT-M03-26-QB002、IT-M03-27-QB003、IT-M03-28-QB001・QB002、IT-M03-38-QB001・QB002

主張: 名称「最新入荷アイテム」のタグIDをCSVに指定すれば、本店TOPの同名欄への掲載が切り替わる。

実際: 各シードは名称から得た「環境の既存の値」を使い、TOPが参照するタグIDとの一致を定めていない（`integration_test/casegen/link_pub/cases/QB_seed_data.tsv:4,20,32`。M03-27は指摘1のとおりID自体が未定義）。TOP設計はブロック内で**タグIDを指定して**商品を取得すると記す（`excel_to_html/output/0301_基本設計仕様書(フロント_トップ).html:1277`）。商品設計の例では「最新入荷アイテム」のタグIDは1であり（`excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:1123`）、実装も本店TOPの取得に固定ID 1を使う（`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Tag.php:55`、`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/NewItemsBlockPayloadBuilder.php:61,70`）。名称だけでは同一タグと確定しない。

判定: 前提不成立

修正案: 各シードで本店TOPが参照するタグID 1の行を確認し、そのIDを商品と更新CSVに指定する。行がない環境での作成方法も定める。

### 指摘3（重大度: Major）対象: IT-M03-28-QB003・QB004

主張: 商品タグ更新CSVの「登録が完了しました。」を確認した直後に支店TOPを開けば、タグ変更後の掲載を判定できる。

実際: タグ更新の確定後には支店システムへの通知があり、**通知に失敗しても取込は確定したまま**連携エラーを残す（`functions/pf-eccube3/m03-28_admin_product_product_product_tag_csv_import.md:59`）。両ケースは完了メッセージの確認から支店TOPの再表示へ直行し、通知の結果確認や反映待ちがない（`integration_test/casegen/link_pub/cases/QB_test_cases.tsv:9-10`）。取込完了だけでは下流への到達を保証できない。

判定: 手順不備

修正案: 支店システムへの通知が成功し、反映が完了したことを確認してから支店TOPを開く手順と、その確認に必要な前提を追加する。

### 指摘4（重大度: Minor）対象: IT-M03-27-QB002

主張: 買取価格を600円から900円へ更新して公開側で確認するケースの優先度はP2。

実際: このケースは金額を更新・照合する（`integration_test/casegen/link_pub/cases/QB_test_cases.tsv:5`）。依頼文は「金銭に関わる」ケースをP1と定める（`integration_test/casegen/link_pub/gen_QB/prompt.md`「出力」の優先度規則）。

判定: 規約違反

修正案: 優先度をP1にする。

### 指摘5（重大度: Minor）対象: 群QB

主張: 報告書の作成数は11件で、M03-26→F01-01とM03-27→F01-01は不採用。

実際: ケース表には13件あり、両組の追加ケースも存在する（`integration_test/casegen/link_pub/cases/QB_test_cases.tsv:2-14`）。報告書の作成数・組ごとの評価・期待結果の対応表は11件時点のままで、末尾の追記と矛盾する（`integration_test/casegen/link_pub/gen_QB/report.md:6-13,28,34-41,67-69`）。

判定: 規約違反

修正案: 作成数を13件に直し、両組を採用として評価表・対応表・重複確認・到達可能性に反映する。
