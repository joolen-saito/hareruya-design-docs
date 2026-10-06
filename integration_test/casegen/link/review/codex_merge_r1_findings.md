### 指摘1（重大度: Major）対象: IT-F05-06-052〜058
主張: 商品コードをケース別に改名しても、ケースとケース専用シードの整合性は維持される。
実際: 各ケースと会員シードは `F0506L-AF0506n052`〜`F0506L-AF0506n058` を参照するが、全件が使用する共有シード `S-F05-06-L-PRODUCT` が投入する商品コードは改名前の `F0506L-A` のみである。専用シードの投入方法も存在しない改名後コードの商品をカートへ入れようとする（`integration_test/casegen/cases/F05-06_test_cases.tsv:50`〜`:56`、`integration_test/casegen/cases/F05-06_seed_data.tsv:62`〜`:69`）。
判定: 参照の不一致
修正案: 7件のケースと `S-F05-06-L-MEMBER-052`〜`058`の商品コードを共有シードに合わせて `F0506L-A` に戻す。ケース別商品が必要なら、改名後コードの商品シードを7件追加して参照させる。

### 指摘2（重大度: Major）対象: IT-F06-01-053〜056
主張: `Passw0rd` のケース別改名後も、管理者としてログインできる。
実際: 事前準備と手順4は管理者パスワードとして `Passw0rdF0601n053!L0601`〜`Passw0rdF0601n056!L0601` を使うが、共有管理者シード `S-F06-01-L-ADM` のパスワードは `Passw0rd!L0601` のままである（`integration_test/casegen/cases/F06-01_test_cases.tsv:52`〜`:55`、`integration_test/casegen/cases/F06-01_seed_data.tsv:51`）。なお、登録会員側のパスワードと確認値は専用シード内では一致している（同`:54`〜`:57`）。
判定: 入力値が通らない
修正案: 4件の管理者に関する事前準備と手順4だけを `Passw0rd!L0601` に戻す。

### 指摘3（重大度: Major）対象: IT-F08-03-037〜039
主張: 管理者パスワードのケース別改名後も、手順6で管理画面へログインできる。
実際: ケースは管理者パスワードとして `Passw0rdF0803n037!F0803L`〜`Passw0rdF0803n039!F0803L` を指定するが、共有管理者シード `S-F08-03-L-ADM` が登録する値は `Passw0rd!F0803L` である（`integration_test/casegen/cases/F08-03_test_cases.tsv:37`〜`:39`、`integration_test/casegen/cases/F08-03_seed_data.tsv:51`）。会員ログイン用パスワードとは別の不一致であり、手順6の管理者ログインが失敗する。
判定: 入力値が通らない
修正案: 3件の管理者に関する事前準備と手順6を `Passw0rd!F0803L` に戻す。

### 指摘4（重大度: Minor）対象: IT-M10-06-001、IT-M03-16-037・038、IT-M03-17-040、IT-F06-01-053〜056、IT-M03-22-031、IT-F08-03-037〜039、IT-M03-14-041・043、IT-M10-04-001・003、IT-M11-03-032・033
主張: 重複回避のため、手順で入力する名称やパスワードも機械改名してよい。
実際: P13は「手順で入力する値（登録する名称・コードなど）は改名しない」と明記している（`integration_test/casegen/precond/README.md:34`）。それにもかかわらず、例えば IT-M10-06-001 の入力値は `連携配送L001` から `連携配送L001M1006n001` に変更され（`integration_test/casegen/link/merged_renames.tsv:10`、`integration_test/casegen/cases/M10-06_test_cases.tsv:2`）、IT-M03-16-037・038ではアップロードするCSV内の登録・更新名称まで変更されている（`integration_test/casegen/cases/M03-16_test_cases.tsv:34`〜`:35`）。F06-01ではブラウザ入力するパスワード・確認値や会社名も改名対象になっている（`integration_test/casegen/cases/F06-01_seed_data.tsv:54`〜`:57`）。
判定: 過剰な置換
修正案: 手順またはアップロードファイルから入力する値を合流前の値へ戻し、重複回避はP13どおり事前準備で同値データを削除・不存在確認する。

### 指摘5（重大度: Minor）対象: IT-F01-02-070・071、IT-M03-16-037、IT-M03-17-041、IT-M05-14-001、IT-M10-04-002、IT-M10-16-045・046
主張: ケース専用シードIDの付け替えに合わせ、シードが指す専用ケースも新テストIDへ整合した。
実際: 用途欄には別ケースまたは旧IDが残っている。具体的には `IT-F01-02-L003F0102n070`・`IT-F01-02-L004F0102n071`（`integration_test/casegen/cases/F01-02_seed_data.tsv:67`〜`:68`）、`IT-M03-16-038`（`integration_test/casegen/cases/M03-16_seed_data.tsv:37`）、`IT-M03-17-L004`（`integration_test/casegen/cases/M03-17_seed_data.tsv:43`）、`IT-M05-14-L002`（`integration_test/casegen/cases/M05-14_seed_data.tsv:4`）、`IT-M10-04-003`（`integration_test/casegen/cases/M10-04_seed_data.tsv:5`）、`IT-M10-16-046`・`IT-M10-16-L003`（`integration_test/casegen/cases/M10-16_seed_data.tsv:48`〜`:49`）である。正しい新IDは対応表でそれぞれ確定している（`integration_test/casegen/link/merged_map.tsv:28`〜`:29`、`:63`、`:66`、`:88`、`:97`、`:119`〜`:120`）。
判定: 参照の不一致
修正案: 各用途欄を実際の使用先である `IT-F01-02-070`、`071`、`IT-M03-16-037`、`IT-M03-17-041`、`IT-M05-14-001`、`IT-M10-04-002`、`IT-M10-16-045`、`046` に修正する。

### 指摘6（重大度: Minor）対象: IT-M16-01-047・048
主張: 「ID 1」等を「バナーID 1」等へ変更すれば、設計書の項目名に合い、ケースとシードでも呼称が統一される。
実際: 設計書はトップバナー各行の識別子を一貫して「ID」と記載しており、「バナーID」という項目名はない（`functions/pf-eccube3/m16-01_admin_data_top_banner.md:7`、`:13`）。ケースとシードの状態・属性は「バナーID」へ変更された一方、同じシード行の投入方法は「ID 1〜11」のままである（`integration_test/casegen/cases/M16-01_test_cases.tsv:45`〜`:46`、`integration_test/casegen/cases/M16-01_seed_data.tsv:52`〜`:53`）。
判定: 書き方の不一致
修正案: 事前準備・手順・シードの「バナーID」を、設計書と投入方法に合わせてすべて「ID」へ戻す。
