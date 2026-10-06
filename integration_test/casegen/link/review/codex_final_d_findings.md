### 指摘1（重大度: Major）対象: IT-0340
主張: 「取得元と定められた別機能の参照画面」で、既存判定との境界および結合テスト対象を客観的に判定できる。
実際: 判定文単体では、マスタ→選択肢のIT-0335、設定→挙動のIT-0337、管理→公開のIT-0150を除外しておらず、別機能IDなら同一コンポーネント内の保存結果再表示も含められる（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:336,338,341`、同`:151`）。除外条件は生成プロンプトにしかなく（`integration_test/casegen/link/GEN_LINK_PROMPT_TEMPLATE.md:52-53`）、正本のSCOPEは独立コンポーネント間だけを対象とし、単一ロジックの結果を別画面で観測しても単体としている（`integration_test/SCOPE.md:8-15`）。
判定: 型の欠陥
修正案: 「IT-0332〜0337・IT-0150に該当せず、管理画面の一機能が登録・更新したデータを、機能IDの違いだけでなく責務と入出力境界が独立した別コンポーネントが取得元として参照すると上流・下流双方の設計に明記されている場合、その参照画面に定義された項目が受け渡されること。同一コンポーネント内の保存結果の再表示、および同一機能群の編集画面と一覧画面の往復は除く。」とする。

### 指摘2（重大度: Major）対象: IT-M16-07-L001
主張: M16-07とM16-06は機能IDが異なるため、IT-0340の別機能間連携として扱える。
実際: 報告自身が両者を「同一の買取価格対応表機能群」と認めている（`integration_test/casegen/link/gen_M16-07/report.md:64`）。設計上も、同じ買取価格対応表の価格を保存し、その成功時に同表の一覧へ戻る処理である（`functions/pf-eccube3/m16-07_admin_data_data_buy_price_list_edit.md:36-46`）。ケースは保存値を遷移先の同表一覧で再表示しているだけで（`integration_test/casegen/link/cases/M16-07_link_test_cases.tsv:2`）、SCOPEの単一ロジック結果の画面観測に当たる（`integration_test/SCOPE.md:12-13,61`）。
判定: 型の欠陥
修正案: IT-M16-07-L001を削除する。機能IDが別という理由だけで独立コンポーネント扱いしない。

### 指摘3（重大度: Major）対象: IT-M05-14-L001
主張: M05-14が更新する受注ステータスと、M05-01一覧の「対応状況」列を接続できる。
実際: 下流の設計は項目名「対応状況」を置くだけで、取得元を受注ステータスと定めていない（`excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:1470`、`functions/pf-eccube3/m05-01_admin_order_order_search_result.md:93-100`）。M05-14報告は項目名の意味が同じだと推定して採用している（`integration_test/casegen/link/gen_M05-14/report.md:41,49`）一方、M05-12報告は同じ下流について取得元の記述がないとして正しく不採用にしている（`integration_test/casegen/link/gen_M05-12/report.md:39`）。
判定: 推測による接続
修正案: IT-M05-14-L001を削除する。現状ではM05-12にも追加しない。M05-01側に「対応状況列は対象受注の受注ステータスを表示する」と明記された場合に、M05-14とM05-12の双方を追加する。

### 指摘4（重大度: Minor）対象: IT-M03-14-L004
主張: 削除済み略称タグがCSVに含まれない確認をIT-0071に付け替えられる。
実際: IT-0071は「ファイルに含まれる項目の値が取得元と同値」であり、レコードの非出力を判定しない（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:72`）。ケースの期待結果は「ID 31400202の行が含まれない」である（`integration_test/casegen/link/cases/M03-14_link_test_cases.tsv:5`）。レコード数を扱う既存判定はIT-0072である（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:73`）。
判定: 型の欠陥
修正案: IT-0072へ付け替え、シードでCSV全体の期待件数を確定させたうえで「削除後は期待件数N件で、ID 31400202は含まれない」と書き直す。

### 指摘5（重大度: Minor）対象: IT-M01-01-L001・IT-M01-01-L002
主張: 成功を「青系のバッジ」、失敗を「赤系のバッジ」として期待結果に含めてよい。
実際: 両ケースが色まで合否対象にしており、L002は手順中でエラー文言も完全一致確認している（`integration_test/casegen/link/cases/M01-01_link_test_cases.tsv:2-3`）。SCOPEは見た目と画面表示文言の照合を結合テスト対象外としている（`integration_test/SCOPE.md:64-65`）。
判定: 型の欠陥
修正案: 期待結果はステータス値「成功」「失敗」だけにする。L002の手順も「ログインが拒否されたことを確認する」に留め、色と完全一致文言を外す。

### 指摘6（重大度: Major）対象: CH-0100
主張: 「手動メール通知（確認画面）」の機能を特定できないため、遷移先を空欄にする。
実際: 修正ログは空欄としている（`integration_test/casegen/chains_dest_fix_log.tsv:2`）が、HTMLの当該確認画面には機能No「M05-06」と明記されている（`excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:2133`）。機能対応表でもM05-06は同じ0203ブックのメール一括送信機能である（`functions/function-sheet-map.tsv:208`）。
判定: 取りこぼし
修正案: CH-0100の遷移先機能をM05-06にする。同一機能内の確認画面遷移として自己辺を保持する。

### 指摘7（重大度: Major）対象: CH-0622・build_chains.py
主張: 支店ECTOPからの公開側商品一覧は機能を特定できないため、遷移先を空欄にする。
実際: 設計書は「絞り込まれた商品一覧に遷移」と明記している（`excel_to_html/output/0301_基本設計仕様書(フロント_トップ).html:2422`）。公開側の商品一覧はF03-01として確定している（`functions/function-sheet-map.tsv:9`）。現ロジックは最長一致で先にM09-04「ページ管理」を選び、層違いとして空欄化した後、短いが正しいF03-01「商品一覧」を再探索しない（`integration_test/casegen/build_chains.py:164-177`）。
判定: 取りこぼし
修正案: CH-0622の遷移先をF03-01にする。候補選択では同一ブック・同一層の候補を先に絞ってから最長一致を選ぶか、層違い候補を棄却した後に残りの候補で再選択する。

### 指摘8（重大度: Minor）対象: M11-02
主張: 3ケースの上流項目は「画面項目定義 識別ID 1-8 デフォルト検索表示店舗」である。
実際: ケースと報告はいずれも1-8を引用している（`integration_test/casegen/link/cases/M11-02_link_test_cases.tsv:2-4`、`integration_test/casegen/link/gen_M11-02/report.md:47-49`）が、実際の項目定義では1-8は「権限グループ」、デフォルト検索表示店舗は1-9である（`excel_to_html/output/0201_基本設計仕様書(システム設定).html:1233-1234`）。
判定: 手順不備
修正案: 3ケースの出典およびreport.mdの対応表を識別ID 1-9へ修正する。テスト内容と3画面それぞれの下流記述は維持してよい。
