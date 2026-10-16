### 指摘1（重大度: Major）対象: IT-F02-04-CD001
主張: 店舗登録画面で `F0204-CD支店A` を作り、支店ECTOPからお問い合わせを押せる。  
実際: シードの投入方法は店名・公開状態・住所などしか指定していない（`integration_test/casegen/chain_gap/cases/CD_seed_data.tsv:3`）。店舗登録では会社名、店名のカナ・英語表記、支店URL、複数のメールアドレス、店名略称、表示順などが必須である（`excel_to_html/output/0209_基本設計仕様書(基本情報設定).html:2269`、`:2274`、`:2285`、`:2299`、`:2302`）。ショップカラーも必須である（`functions/pf-eccube3/m10-15_admin_base_setting_setting_shop_register.md:37`）。現行の投入方法では店舗を登録できず、手順1に進めない。  
判定: 前提不成立  
修正案: 店舗登録画面の必須値を具体的にシードへ加え、登録後に支店ECTOPを開ける支店URLも指定する。

### 指摘2（重大度: Major）対象: CH-0789
主張: `IT-F06-15-006` で確認済み。  
実際: そのケースはマイページボタンの押下と遷移先の確認を書いている（`integration_test/casegen/cases/F06-15_test_cases.tsv:7`）。しかし使用シードは管理画面の「商品登録編集画面」で新規商品を作る手順を含む（`integration_test/casegen/cases/F06-15_seed_data.tsv:8`）。商品編集機能は刷新後に廃止される（`functions/pf-eccube3/m03-02_admin_product_product_edit.md:5`）。依頼文も商品新規登録画面は刷新後404になると明記している（`integration_test/casegen/chain_gap/gen_CD/prompt.md:100`）。この準備手順のままでは既存ケースを実行できない。  
判定: 前提不成立  
修正案: `IT-F06-15-006` の商品シードを、刷新後に使えるCSV登録などの手順へ直してから確認済みの根拠とする。

### 指摘3（重大度: Major）対象: CH-0905
主張: `IT-F06-27-004` で確認済み。  
実際: そのケースは「変更する」の押下と完了画面の確認を書いている（`integration_test/casegen/cases/F06-27_test_cases.tsv:5`）。一方、会員シードの投入方法は仮会員登録メールから本会員登録を完了させる（`integration_test/casegen/cases/F06-27_seed_data.tsv:6`）。本会員化にはスマレジへの新規会員登録成功が必要である（`functions/pf-eccube3/f06-02_front_member_entry_activate.md:25`）。スマレジ試験環境で対象会員を初期化・確認する方法は未確定であり（`integration_test/casegen/precond/open_preconditions.tsv:186`）、著者も同じ理由で CH-0800 を「作れない」に変更している（`integration_test/casegen/chain_gap/gen_CD/chain_judgement.tsv:4`）。  
判定: 前提不成立  
修正案: `IT-F06-27-004` の会員を未確定の本会員化経路に依存せず作れるようシードを修正する。修正できるまでは実行可能な確認済みケースとして扱わない。

### 指摘4（重大度: Minor）対象: CH-0800
主張: 報告の連鎖表では「作成」、テストIDは `IT-F06-02-CD001`。  
実際: 判定表は「作れない」であり（`integration_test/casegen/chain_gap/gen_CD/chain_judgement.tsv:4`）、ケースファイルにも当該ケースは無い（`integration_test/casegen/chain_gap/cases/CD_test_cases.tsv:1`）。報告には旧判定、旧件数、削除済みケースの対応表・到達可能性が残る（`integration_test/casegen/chain_gap/gen_CD/report.md:17`、`:22`、`:29`、`:43`）。  
判定: 判定の誤り  
修正案: 報告の CH-0800 を「作れない」に統一し、削除済みケースの行と旧件数を除く。
