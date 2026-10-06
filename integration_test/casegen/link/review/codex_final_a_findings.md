### 指摘1（重大度: Major）対象: IT-F01-01-L001〜L005、IT-F01-02-L001・L002・L005
主張: 既存ケースは「遷移到達のみ」であり、パンくず・URL・遷移先項目を見る新ケースとは同じ判定ではない（`integration_test/casegen/link/gen_F01-01/report.md:29`）。
実際: 既存ケースは、最新入荷タグ、Trending Nowタグ、値下げ・補充タグ、カテゴリ、および押した商品について、上流操作後に対応する商品一覧・商品詳細が表示されることを既に確認している（`integration_test/casegen/all_test_cases.tsv:1087`、`:1088`、`:1089`、`:1114`、`:1117`、`:1121`、`:1122`）。支店側もカテゴリとカードセットの引継ぎを確認済みである（同 `:1200`、`:1201`）。期待結果の観測箇所をパンくずやURLへ変えても、引き継いだタグ・カテゴリ・商品・カードセットが正しいという判定は増えない。依頼文も同じ上流操作から下流を確認する既存ケースがあれば作らないとしている（`integration_test/casegen/link/GEN_LINK_PROMPT_TEMPLATE.md:60`）。
判定: 重複
修正案: F01-01の5件を削除する。F01-02はL001・L002をIT-F01-02-061、L005をIT-F01-02-062との重複として削除する。カテゴリ／カードセットの表示用HTMLまで確認するL003・L004だけを残す。

### 指摘2（重大度: Major）対象: IT-F01-01-L002・L003、IT-F01-02-L001・L002・L005
主張: URLパス内のタグ／カテゴリIDやGETパラメータを確認すれば、IT-0339を判定できる。
実際: URL仕様自体は捏造ではなく、設計書に「タグ・カテゴリはパス、その他はGETパラメータ」と明記されている（`excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:1122`）。しかしL002・L003・F01-02-L002・L005は、数値ID、`tags/`、パスとGETの使い分けという内部表現を期待結果にしている（`integration_test/casegen/link/cases/F01-01_link_test_cases.tsv:3`、`:4`、`integration_test/casegen/link/cases/F01-02_link_test_cases.tsv:3`、`:6`）。これはルート名等の内部識別子を禁止する規約に反する（`integration_test/casegen/link/GEN_LINK_PROMPT_TEMPLATE.md:84`）。またIT-0339は遷移先の検索条件への設定を判定するものであり（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:340`）、F01-02-L001のパンくず確認はIT-0338の表示判定である（同 `:339`）。
判定: 型の欠陥
修正案: 重複でもあるため当該5件を削除する。残す場合でも、F01-02-L001はIT-0338へ付け替え、URL・数値IDではなく設計書上の論理的な検索条件の設定を確認する期待結果へ書き直す。

### 指摘3（重大度: Major）対象: IT-F04-02-L001・L002
主張: 会員の姓名を一意にしておけば、注文確定後の受注を注文者名で検索・特定できる。
実際: 上流設計は「その顧客で受注情報を作成する」としか定めず、会員の姓名を受注の注文者姓名へ複写する対応規則を定めていない（`functions/pf-eccube3/f04-02_front_cart_shopping_order_method.md:7`）。下流設計は既に受注に入っている注文者姓名の検索・表示規則を定めるだけである（`functions/pf-eccube3/m05-01_admin_order_order_search_list.md:10`、`functions/pf-eccube3/m05-01_admin_order_order_search_result.md:101`）。著者自身も「上流に保存記述が無いため採らなかった」としながら、直後には会員姓名が注文者になると補っており矛盾している（`integration_test/casegen/link/gen_F04-02/report.md:34`、`:40`、`:68`）。両ケースの対象行特定はこの未定義対応に全面依存している（`integration_test/casegen/link/cases/F04-02_link_test_cases.tsv:2`、`:3`）。
判定: 推測による接続
修正案: 会員姓名から注文者姓名への対応を設計書に追加するまで両ケースを削除する。あるいは、公開側で得た識別値と管理画面側の識別値の対応が設計書に明記された項目を用いて対象受注を特定する。

### 指摘4（重大度: Major）対象: IT-F04-02-L001・L002
主張: 商品価格が正で、郵便振替を選択できるため注文確定まで到達できる（`integration_test/casegen/link/gen_F04-02/report.md:56`）。
実際: ケース専用シードには在庫数と販売種別しかなく、販売価格が一切設定されていない（`integration_test/casegen/link/cases/F04-02_link_seed_data.tsv:4`、`:5`）。支払方法の選択肢はポイント控除後の注文金額によって変わり（`functions/pf-eccube3/f04-02_front_cart_shopping_order_method.md:21`）、支払方法の妥当性に失敗すると注文確定画面を再表示する（同 `:41`）。値付きで必要状態を書くP5にも違反する（`integration_test/casegen/precond/README.md:27`）。
判定: 前提不成立
修正案: 両専用シードに販売価格を値付きで追加し、送料・手数料・使用ポイントを含む計算後金額が正で、郵便振替の利用可能金額範囲に入ることまで事前準備に明記する。

### 指摘5（重大度: Major）対象: chains.tsv / build_chains.py
主張: 報告された28本は、同名画面を持つ別機能への取り違えである。
実際: 代表10本を設計書と対応表で確認した結果、報告は正しい。CH-0135・0136・0149・0194は管理画面の商品一覧M03-01でありF03-01ではない（`integration_test/casegen/chains.tsv:136`、`:137`、`:150`、`:195`、`excel_to_html/output/0204_基本設計仕様書(商品管理).html:1643`、`:2199`、`:3825`、`functions/function-sheet-map.tsv:75`）。CH-0301はM06-01自身である（`integration_test/casegen/chains.tsv:302`、`excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html:1164`、`functions/function-sheet-map.tsv:235`）。CH-0337・0340・0347はネット買取のM07-03へ戻る遷移である（`integration_test/casegen/chains.tsv:338`、`:341`、`:348`、`excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html:2188`、`:2285`、`functions/function-sheet-map.tsv:259`）。CH-0368・0369は管理画面のポイント履歴M08-06である（`integration_test/casegen/chains.tsv:369`、`:370`、`excel_to_html/output/0207_基本設計仕様書(会員管理機能).html:1999`、`functions/function-sheet-map.tsv:287`）。原因は、機能名だけの全体辞書を`setdefault`で作るため同名機能を先着で捨て、その後の「同じ長さなら曖昧」とする処理へ候補が渡らないことにある（`integration_test/casegen/build_chains.py:146`、`:150`、`:154`、`:161`）。ブック／業務領域も照合していない。
判定: 型の欠陥
修正案: 遷移先候補を機能名だけで一意化せず、ブック番号・画面種別・シート見出しを含む候補集合として保持する。同一ブック／同一業務領域を優先し、それでも複数なら空欄またはエラーにする。`商品一覧`対`商品検索/一覧`等の別名表を設け、先着採用を廃止したうえで全28本を再生成する。
