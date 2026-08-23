# 実装乖離監査 — 0209_基本設計仕様書(基本情報設定).html

- 正本: `excel_to_html/output/0209_基本設計仕様書(基本情報設定).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **738要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 35 | ○ |
| 実装違い | 実装はあるが設計と違う | 34 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 13 | — |
| 設計どおり | 設計どおり実装されている | 397 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 251 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 8 | — |
| **合計** | | **738** | |

## 不具合 29件（P1 0 / P2 7 / P3 22）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 46件は重複として代表へ折り畳んだ（判定そのものは 75件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-12-R036 | カスタムCSV出力設定 | 未実装 | ふるまい | P2 | CSV出力設定の削除要求は、なりすまし対策トークンが無効なときは削除せずアクセス拒否となる。 |
| sheet-13-R095 | 店舗登録 | 未実装 | IO | P2 | 店舗登録の画面で管理者情報として、ログインID・パスワード・パスワード（確認）・所属・メールアドレスをいずれも必須で入力し、既に存在するメンバーの情報でその店舗のシステム管理者を設定できる。所属は所属 |
| sheet-13-R123 | 店舗登録 | 実装違い | ふるまい | P2 | 店名略称(3文字)にほかの店舗で登録済みの値が入力されたときは保存せず、その値を使っている店舗のショップ名略称を挙げた「(登録済みの店舗のショップ名略称)にて登録済の略称です。」を入力項目付近に表示し |
| sheet-4-R027 | 特定商取引に関する法律 | 未実装 | IO | P2 | 電話番号・FAX番号は3つの欄に分けて入力し、一部の欄だけを埋めて登録するとエラーになる。 |
| sheet-5-R005 | 利用規約管理 | 実装違い | ふるまい | P2 | 管理画面の利用規約設定の画面で、購入者向け利用規約として表示される本文を書き換えて登録できる。 |
| sheet-8-R008 | 税率設定 | 未実装 | IO | P2 | 税率設定画面に商品別税率機能の有効・無効を選ぶラジオボタンがあり、初期値は無効である。 |
| sheet-8-R023 | 税率設定 | 実装違い | IO | P2 | 消費税率に100を超える値を入れて登録すると、入力エラーになって保存されない。 |
| sheet-10-R013 | メール設定 | 実装違い | ふるまい | P3 | 自動送信メールのテンプレートを直接指定してこの画面を開こうとしても、画面が表示されない。 |
| sheet-10-R017 | メール設定 | 実装違い | IO | P3 | テンプレートの選択肢がテンプレ名称の昇順で並ぶ。 |
| sheet-10-R018 | メール設定 | 実装違い | ふるまい | P3 | テンプレートを選ばないまま登録しても新規登録は行えず、その旨のエラーが出て何も保存されない。 |
| sheet-10-R028 | メール設定 | 未実装 | IO | P3 | メールテンプレート編集画面の上部に、そのテンプレートの最終更新者の氏名と最終更新日時が表示される。 |
| sheet-10-R030 | メール設定 | 未実装 | IO | P3 | メールテンプレート編集画面の見出しの横から、新規作成の画面とテンプレート一覧の画面へ移れる。 |
| sheet-11-R007 | CSV出力項目設定 | 実装違い | IO | P3 | CSV種別の選択肢には登録されているCSVの種別がすべて並ぶ。 |
| sheet-13-R121 | 店舗登録 | 実装違い | ふるまい | P3 | 存在しない店舗を指定して店舗の登録・編集画面を開いたときは、画面を表示せず見つからない旨の応答を返す。 |
| sheet-13-R125 | 店舗登録 | 実装違い | ふるまい | P3 | ショップアイコンの画像を確定できないときは店舗情報を保存せず、管理画面上部に「ショップアイコンファイルを指定してください。」と表示して同じ画面に留まる。 |
| sheet-13-R127 | 店舗登録 | 実装違い | IO | P3 | ショップアイコンとして受け付ける画像は5メガバイトまでとし、それを超える大きさの画像は受け付けない。 |
| sheet-3-R029 | 基本設定(旧ショップマスター) | 実装違い | IO | P3 | 有効／無効を無効・有効の2択のラジオボタンから1つ選ぶ形で設定できること |
| sheet-3-R035 | 基本設定(旧ショップマスター) | 実装違い | IO | P3 | 自動ログイン機能の設定は初期状態で無効であること |
| sheet-3-R039 | 基本設定(旧ショップマスター) | 未実装 | IO | P3 | 地図設定で緯度・経度を入力でき、緯度は-90〜90、経度は-180〜180、小数点以下6桁までを受け付け、範囲や桁数を外れる値は保存しないこと |
| sheet-3-R042 | 基本設定(旧ショップマスター) | 実装違い | IO | P3 | 店頭用アカウントIPアドレスは300文字までのIPアドレスとカンマだけを受け付け、それ以外の文字を含む値は保存しないこと |
| sheet-3-R055 | 基本設定(旧ショップマスター) | 実装違い | IO | P3 | 郵便番号は3桁と4桁の2欄に分けて入力し、数字以外や3桁・4桁でない桁数のときは保存しないこと |
| sheet-3-R057 | 基本設定(旧ショップマスター) | 実装違い | IO | P3 | 市区町村名は32文字を超えると保存しないこと |
| sheet-3-R061 | 基本設定(旧ショップマスター) | 実装違い | IO | P3 | 電話番号・FAX番号はそれぞれ3つの欄に分けて入力できること |
| sheet-3-R076 | 基本設定(旧ショップマスター) | 実装違い | IO | P3 | 送料無料条件(金額)は数字だけを受け付け、8桁を超える値は保存しないこと。画面には3桁ごとの区切りを付けて表示すること |
| sheet-6-R034 | 支払い方法　手数料設定 | 実装違い | IO | P3 | ロゴ画像の欄に「620px以上推奨」という推奨サイズの案内を併記する。 |
| sheet-8-R019 | 税率設定 | 実装違い | IO | P3 | 新規に共通税率を追加するとき、課税規則の初期選択は四捨五入である。 |
| sheet-8-R029 | 税率設定 | 実装違い | ふるまい | P3 | 既に消えている税率の削除を選ぶと、既に削除されている旨の警告が出て税率設定画面に戻る。 |
| sheet-9-R021 | 自動送信メール | 未実装 | ふるまい | P3 | この画面が編集対象にできるのは自動送信メールに該当するテンプレートだけで、それ以外のテンプレートは編集対象にならない。 |
| sheet-9-R023 | 自動送信メール | 実装違い | IO | P3 | テンプレ選択のセレクトボックスの選択肢がテンプレ名称の昇順に並ぶ。 |

### sheet-12-R036 カスタムCSV出力設定 — 未実装／ふるまい／P2

- 正本: sheet-12（カスタムCSV出力設定） HTML行 2088 付近
- 正本引用: 「無効のときはアクセス拒否とする」
- 設計期待値: CSV出力設定の削除要求は、なりすまし対策トークンが無効なときは削除せずアクセス拒否となる。
- 画像確認: レイアウト図(sheet-12_img1)はCSV種別セレクト(商品CSV)、追加されたCSV選択セレクト(新規作成)、名前欄、左右2つのリスト(CSV出力しない項目/CSV出力する項目)、中央の4つの移動ボタン、右の「項目順序」4ボタン(一つ上/一つ下/一番上/一番下)、下部の「削除」「設定」ボタンを示す。
- 実装参照: `src/Eccube/Controller/Admin/Setting/Shop/CustomerCsvController.php:114-121;src/Eccube/Controller/AbstractController.php:252-263`
- 実装実態: 削除処理はトークンの検証を行わず、トークンが無効な削除要求でもそのまま削除が実行される。
- 同じ実装実態でまとまる要求: sheet-12-R048（カスタムCSV出力設定 / 実装参照 `src/Eccube/Controller/Admin/Setting/Shop/CustomerCsvController.php:114-121`）
- 判定根拠: 画面側は削除リンクにトークンを付けて送るが(src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:254)、src/Eccube/Controller/Admin/Setting/Shop/CustomerCsvController.php:115-121 に検証の呼び出しが無い。同種の削除処理では検証を行っている(src/Eccube/Controller/Admin/Setting/Shop/PaymentController.php:342)ため、この機能だけ検証が欠けている。共通の検証は src/Eccube/Controller/AbstractController.php:252-263 に用意されている。
- 確信度: high

### sheet-13-R095 店舗登録 — 未実装／IO／P2

- 正本: sheet-13（店舗登録） HTML行 2293 付近
- 正本引用: 「3-1 ログインID 全角・半角 ○ - - EC-CUBEエンタプライズの標準に準拠 存在するメンバーの情報を入力」
- 設計期待値: 店舗登録の画面で管理者情報として、ログインID・パスワード・パスワード（確認）・所属・メールアドレスをいずれも必須で入力し、既に存在するメンバーの情報でその店舗のシステム管理者を設定できる。所属は所属マスターから選べる。
- 画像確認: レイアウト図 sheet-13_img1.png を確認。「管理者情報」区分にログインID・パスワード・パスワード(確認)・所属・メールアドレスの5項目が必須バッジ付きで描かれているが、実装画面には同区分が存在しない。
- 実装参照: `src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:64-406; src/Eccube/Resource/template/admin/mall/tenant/detail.twig:250-687; src/Eccube/Resource/locale/messages.ja.yaml:3892-3895`
- 実装実態: 店舗登録・編集の画面に管理者情報の区分が無く、ログインID・パスワード・パスワード（確認）・所属・メールアドレスの入力項目も、店舗のシステム管理者を設定する処理も無い。管理者情報・ログインID・パスワード・パスワード（確認）の文言だけが未使用で残っている。
- 同じ実装実態でまとまる要求: sheet-13-R096（店舗登録）、sheet-13-R097（店舗登録）、sheet-13-R098（店舗登録）、sheet-13-R099（店舗登録）、sheet-13-R100（店舗登録）、sheet-13-R101（店舗登録）、sheet-13-R102（店舗登録）、sheet-13-R103（店舗登録）、sheet-13-R104（店舗登録）、sheet-13-R105（店舗登録）、sheet-13-R106（店舗登録）、sheet-13-R107（店舗登録）、sheet-13-R108（店舗登録）、sheet-13-R109（店舗登録）、sheet-13-R110（店舗登録）
- 判定根拠: 店舗登録画面の管理者情報区分は実装に無い。フォーム定義(src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:64-406)と画面(src/Eccube/Resource/template/admin/mall/tenant/detail.twig:250-687)に該当の入力項目が1つも無く、文言だけが未使用で残る(src/Eccube/Resource/locale/messages.ja.yaml:3892-3895)。メンバーの登録は別機能のメンバー管理でのみ行える。
- 確信度: high

### sheet-13-R123 店舗登録 — 実装違い／ふるまい／P2

- 正本: sheet-13（店舗登録） HTML行 2325 付近
- 正本引用: 「店名略称(3文字)には、ほかの店舗で登録済みの値を使えない。重複したときは保存せず、その値を使っている店舗のショップ名略称を示すエラーを表示する。編集中の店舗自身が持つ値は重複として扱わない。」
- 設計期待値: 店名略称(3文字)にほかの店舗で登録済みの値が入力されたときは保存せず、その値を使っている店舗のショップ名略称を挙げた「(登録済みの店舗のショップ名略称)にて登録済の略称です。」を入力項目付近に表示して同じ画面に留まる。
- 画像確認: レイアウト図 sheet-13_img1.png を確認。「店名略称(3文字)」欄の付近にエラーを出す要求。
- 実装参照: `src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:329-337; src/Eccube/Entity/BaseInfo.php:172-173; src/Eccube/Controller/Admin/Mall/TenantController.php:359-372`
- 実装実態: 保存前に店名略称の重複を確かめておらず、重複時はデータベースの一意制約違反による失敗として扱われる。画面上部に汎用の保存失敗メッセージが出るだけで、重複相手のショップ名略称を挙げた文言も入力項目付近のエラー表示も無い。
- 判定根拠: 店名略称の重複検査はフォームにもコントローラにも無い（src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:329-337 は長さと必須のみ）。重複は src/Eccube/Entity/BaseInfo.php:172-173 の一意制約でしか止まらず、src/Eccube/Controller/Admin/Mall/TenantController.php:359-372 の失敗処理で汎用の保存失敗メッセージが出る。重複相手のショップ名略称を示す文言は実装のどこにも無い（src/Eccube/Resource/locale/messages.ja.yaml を全文検索して不在を確認）。
- 確信度: high

### sheet-4-R027 特定商取引に関する法律 — 未実装／IO／P2

- 正本: sheet-4（特定商取引に関する法律） HTML行 1265 付近
- 正本引用: 「3	電話番号・FAX番号の3分割入力	3欄すべてに入力するか、3欄すべてを空にする。一部の欄だけを入力したときはエラーとする。FAXは必須ではないため全欄が空でもよい」
- 設計期待値: 電話番号・FAX番号は3つの欄に分けて入力し、一部の欄だけを埋めて登録するとエラーになる。
- 画像確認: レイアウト図(sheet-4_img1.png)を確認。見出し『特定商取引法』の下に、販売業者/運営責任者/所在地(〒2分割＋都道府県セレクト＋住所2行)/TEL(3分割)/FAX(3分割)/メールアドレス/URL/商品代金以外の必要料金/注文方法/支払方法/支払期限/引き渡し時期/返品・交換について の13項目が固定ラベルの入力欄として並び、右下に『設定』ボタンがある。 図のTEL・FAXは3分割入力として描かれているが、実装に該当欄が無い。
- 実装参照: `src/Eccube/Resource/template/admin/Setting/Shop/tradelaw.twig:32-55;src/Eccube/Form/Type/Admin/TradeLawMallType.php:40-56`
- 実装実態: 電話番号・FAX番号の専用入力欄が無い。画面は名称と説明の対の行だけで、説明欄は文字数上限のみを見る自由入力のため、3分割の入力も欄をまたぐ検証も存在しない。
- 同じ実装実態でまとまる要求: sheet-4-R029（特定商取引に関する法律）、sheet-4-R031（特定商取引に関する法律 / 実装参照 `src/Eccube/Resource/template/admin/Setting/Shop/tradelaw.twig:32-55`）
- 判定根拠: src/Eccube/Resource/template/admin/Setting/Shop/tradelaw.twig に電話番号・FAX番号の欄は無く、src/Eccube/Form/Type/Admin/TradeLawMallType.php:48-56 の説明欄は長さ制約だけである。
- 確信度: high

### sheet-5-R005 利用規約管理 — 実装違い／ふるまい／P2

- 正本: sheet-5（利用規約管理） HTML行 1329 付近
- 正本引用: 「・利用規約を登録する」
- 設計期待値: 管理画面の利用規約設定の画面で、購入者向け利用規約として表示される本文を書き換えて登録できる。
- 画像確認: sheet-5_img1.png を確認。ラベル「利用規約」の付いた大きな入力欄に規約本文が入り、画面下部に青の「設定」ボタンが1つだけある単票編集画面。ee 側は同等の単票ではなくコンテンツのページ編集画面（ページ名/URL/ファイル名/コード/レイアウト/メタ + 登録ボタン）を流用している。
- 実装参照: `src/Eccube/Resource/template/admin/Content/page_edit.twig:57-61;app/config/eccube/packages/eccube_nav.yaml:217-220;src/Eccube/Resource/doctrine/import_csv/ja/dtb_page.csv:34`
- 実装実態: 設定>基本情報設定>利用規約設定 は「ご利用規約」ページ（dtb_page.csv:34、edit_type=2 の既定ページ、本文ファイルは Help/agreement）のページ編集画面を開く。既定ページでは本文（コード欄）が読み取り専用で表示され（page_edit.twig:57-61 で編集不可・不透明度0.7・カーソル not-allowed に固定）、規約本文を書き換えて登録できない。
- 判定根拠: app/config/eccube/packages/eccube_nav.yaml:217-220 で利用規約設定の遷移先が admin_content_page_edit の Page::AGREEMENT_PAGE_ID（=19）に固定されている。src/Eccube/Resource/doctrine/import_csv/ja/dtb_page.csv:34 の id=19「ご利用規約」は edit_type=2（Page::EDIT_TYPE_DEFAULT, src/Eccube/Entity/Page.php:39）なので src/Eccube/Controller/Admin/Content/PageController.php:114 の判定で is_user_data_page が false になり、src/Eccube/Resource/template/admin/Content/page_edit.twig:57-61 の分岐で本文欄が読み取り専用になる。この本文は購入者向け利用規約（src/Eccube/Controller/Front/HelpController.php:63-65 が src/Eccube/Resource/template/default/Help/agreement.twig を描画）の実体であり、管理画面から登録できない。
- 確信度: high

### sheet-8-R008 税率設定 — 未実装／IO／P2

- 正本: sheet-8（税率設定） HTML行 1658 付近
- 正本引用: 「1-1	商品別税率機能	単一選択(ラジオボタン)	-	-	無効	選択肢:有効　無効」
- 設計期待値: 税率設定画面に商品別税率機能の有効・無効を選ぶラジオボタンがあり、初期値は無効である。
- 画像確認: レイアウト図(sheet-8_img1.png)を確認。上から『個別税率設定』カード（商品別税率機能 有効/無効 ラジオ＋登録ボタン）、『共通税率設定』カード（消費税率・課税規則ラジオ・適用日時＋登録ボタン）、『税率一覧』（ID/消費税率/課税規則/適用日時＋行操作）の3ブロック構成。 図では『商品別税率機能』が有効/無効のラジオで示されているが実装に無い。
- 実装参照: `src/Eccube/Resource/template/admin/Setting/Shop/tax_rule.twig:53-213;src/Eccube/Form/Type/Admin/ShopMasterType.php:281`
- 実装実態: 税率設定画面に商品別税率機能の選択部品が無い。項目自体は店舗基本情報側のフォーム定義に存在するが（ShopMasterType.php:281）、店舗基本情報の画面テンプレートにも出力されていないため、どの画面からも切り替えられない。
- 同じ実装実態でまとまる要求: sheet-8-R009（税率設定 / 実装参照 `src/Eccube/Resource/template/admin/Setting/Shop/tax_rule.twig:53-213;src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:54-140`）、sheet-8-R005（税率設定 / 実装参照 `src/Eccube/Resource/template/admin/Setting/Shop/tax_rule.twig:53-213;src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:54`）、sheet-8-R027（税率設定 / 実装参照 `src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:54-140;src/Eccube/Resource/template/admin/Setting/Shop/tax_rule.twig:53-213`）、sheet-8-R031（税率設定 / 実装参照 `src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:54-167;src/Eccube/Resource/template/admin/Setting/Shop/tax_rule.twig:53-213`）、sheet-8-R035（税率設定 / 実装参照 `src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:54-167`）
- 判定根拠: src/Eccube/Resource/template/admin/Setting/Shop/tax_rule.twig 全体に商品別税率機能の入力部品が無い。shop_master.twig にも option_product_tax_rule の出力は無く（grep 一致なし）、画面から設定できない。
- 確信度: high

### sheet-8-R023 税率設定 — 実装違い／IO／P2

- 正本: sheet-8（税率設定） HTML行 1677 付近
- 正本引用: 「消費税率は必須で、0以上100以下でなければならない。」
- 設計期待値: 消費税率に100を超える値を入れて登録すると、入力エラーになって保存されない。
- 画像確認: レイアウト図(sheet-8_img1.png)を確認。上から『個別税率設定』カード（商品別税率機能 有効/無効 ラジオ＋登録ボタン）、『共通税率設定』カード（消費税率・課税規則ラジオ・適用日時＋登録ボタン）、『税率一覧』（ID/消費税率/課税規則/適用日時＋行操作）の3ブロック構成。 図では消費税率は単一行の入力欄で、上限の表示は無い。
- 実装参照: `src/Eccube/Form/Type/Admin/TaxRuleType.php:47-57`
- 実装実態: 消費税率の検証は必須・0以上・数字と小数点のみの3つで、上限が無い。100を超える値（例 150）でもそのまま保存できる。
- 判定根拠: src/Eccube/Form/Type/Admin/TaxRuleType.php:51 の Range 制約は min のみで max が無い。行の残り（必須・整数保持・課税規則必須・適用日時必須・基本税率設定では適用日時欄を出さない・年-月-日 時:分 の1行入力）は src/Eccube/Form/Type/Admin/TaxRuleType.php:47-71 と src/Eccube/Resource/template/admin/Setting/Shop/tax_rule.twig:143-148 で満たされている。
- 確信度: high

### sheet-10-R013 メール設定 — 実装違い／ふるまい／P3

- 正本: sheet-10（メール設定） HTML行 1862 付近
- 正本引用: 「指定されたテンプレートが存在しないとき、または自動送信メールとして扱うテンプレートを直接指定したときは、画面を表示しない。」
- 設計期待値: 自動送信メールのテンプレートを直接指定してこの画面を開こうとしても、画面が表示されない。
- 画像確認: レイアウト図(sheet-10_img1.png / sheet-10_img2.png)を確認。1枚目は見出し『テンプレート編集』の下に『テンプレート』(?付きのセレクトボックス、初期表示は選択してください)と『件名』(必須バッジ付き入力欄)が並ぶ。2枚目は『本文』(必須バッジ付き、行番号と改行記号を表示するコード編集欄)と右下の『登録』ボタン。 図のテンプレート選択欄には自動送信メールが含まれない前提で描かれているが、直接指定の防止は図から判断できない。
- 実装参照: `src/Eccube/Controller/Admin/Mall/MallMailController.php:74-90;src/Eccube/Controller/Admin/Mall/MallMailController.php:105-122`
- 実装実態: 自動送信メールかどうかを見ずに指定されたテンプレートを読み込むため、自動送信メールのテンプレートも直接指定すればこの画面で開いて編集・保存できる。
- 判定根拠: [gate7/refute] 重要度を P3 へ。事実は確認できる（src/Eccube/Controller/Admin/Mall/MallMailController.php:74-90 の {Mail} 経路に isAutoSend の判定が無く、grep で AutoSend/auto_send はコントローラ・detail.twig ともに0件。選択肢からの除外は src/Eccube/Form/Type/Admin/MailType. src/Eccube/Controller/Admin/Mall/MallMailController.php:86-122 に自動送信メールを弾く判定が無い。選択肢からは除いているが（src/Eccube/Form/Type/Admin/MailType.php:56）、直接指定は防いでいない。存在しないテンプレートの指定については、対象が解決できずページが見つからない扱いになるため設計どおり。
- 確信度: high

### sheet-10-R017 メール設定 — 実装違い／IO／P3

- 正本: sheet-10（メール設定） HTML行 1866 付近
- 正本引用: 「選択肢はテンプレ名称の昇順で並ぶ。」
- 設計期待値: テンプレートの選択肢がテンプレ名称の昇順で並ぶ。
- 画像確認: レイアウト図(sheet-10_img1.png / sheet-10_img2.png)を確認。1枚目は見出し『テンプレート編集』の下に『テンプレート』(?付きのセレクトボックス、初期表示は選択してください)と『件名』(必須バッジ付き入力欄)が並ぶ。2枚目は『本文』(必須バッジ付き、行番号と改行記号を表示するコード編集欄)と右下の『登録』ボタン。 図のセレクトボックスは未選択状態で、並び順は図から判断できない。
- 実装参照: `src/Eccube/Form/Type/Admin/MailType.php:51-59`
- 実装実態: 選択肢は登録された順（識別子の昇順）で並び、テンプレ名称の昇順にならない。
- 判定根拠: src/Eccube/Form/Type/Admin/MailType.php:58 が識別子の昇順で並べている。名称での並べ替えは行っていない。
- 確信度: high

### sheet-10-R018 メール設定 — 実装違い／ふるまい／P3

- 正本: sheet-10（メール設定） HTML行 1867 付近
- 正本引用: 「テンプレートを選ばないまま登録すると、新規登録は行えない旨のエラーを表示してテンプレート未選択の画面へ戻り、何も保存しない。新規のテンプレートはこの画面では作れない。」
- 設計期待値: テンプレートを選ばないまま登録しても新規登録は行えず、その旨のエラーが出て何も保存されない。
- 画像確認: レイアウト図(sheet-10_img1.png / sheet-10_img2.png)を確認。1枚目は見出し『テンプレート編集』の下に『テンプレート』(?付きのセレクトボックス、初期表示は選択してください)と『件名』(必須バッジ付き入力欄)が並ぶ。2枚目は『本文』(必須バッジ付き、行番号と改行記号を表示するコード編集欄)と右下の『登録』ボタン。 図の入力項目はテンプレート・件名・本文の3つだけで、ファイル名・メールキーの欄は描かれていない。
- 実装参照: `src/Eccube/Controller/Admin/Mall/MallMailController.php:86;src/Eccube/Controller/Admin/Mall/MallMailController.php:133-144;src/Eccube/Resource/template/admin/mall/mail/detail.twig:161-188`
- 実装実態: テンプレート未選択のまま登録すると、この画面で新しいメールテンプレートが作られる。未選択時にはファイル名とメールキーの入力欄が現れ（src/Eccube/Resource/template/admin/mall/mail/detail.twig:163-188）、必須項目が埋まっていれば新規テンプレートとして保存される。
- 同じ実装実態でまとまる要求: sheet-10-R033（メール設定 / 実装参照 `src/Eccube/Controller/Admin/Mall/MallMailController.php:86;src/Eccube/Controller/Admin/Mall/MallMailController.php:133-144`）、sheet-10-R036（メール設定 / 実装参照 `src/Eccube/Controller/Admin/Mall/MallMailController.php:86;src/Eccube/Controller/Admin/Mall/MallMailController.php:133-144;src/Eccube/Resource/template/admin/mall/mail/detail.twig:163-188`）
- 判定根拠: src/Eccube/Controller/Admin/Mall/MallMailController.php:86 で未選択時に新しいテンプレートを組み立て、src/Eccube/Controller/Admin/Mall/MallMailController.php:136-144 で新規として保存している。『新規登録は行えない』旨のエラーは無い。
- 確信度: med

### sheet-10-R028 メール設定 — 未実装／IO／P3

- 正本: sheet-10（メール設定） HTML行 1877 付近
- 正本引用: 「画面上部に、そのテンプレートの最終更新者の氏名と最終更新日時を表示する。」
- 設計期待値: メールテンプレート編集画面の上部に、そのテンプレートの最終更新者の氏名と最終更新日時が表示される。
- 画像確認: レイアウト図(sheet-10_img1.png / sheet-10_img2.png)を確認。1枚目は見出し『テンプレート編集』の下に『テンプレート』(?付きのセレクトボックス、初期表示は選択してください)と『件名』(必須バッジ付き入力欄)が並ぶ。2枚目は『本文』(必須バッジ付き、行番号と改行記号を表示するコード編集欄)と右下の『登録』ボタン。 図にも最終更新者・最終更新日時の表示は描かれていないが、正本の本文が表示を要求している。
- 実装参照: `src/Eccube/Resource/template/admin/mall/mail/detail.twig:123-241`
- 実装実態: 画面に最終更新者・最終更新日時の表示が無い。値自体は保存時に記録されるが（src/Eccube/Doctrine/EventSubscriber/SaveEventSubscriber.php:64-76）、画面には出さない。
- 判定根拠: src/Eccube/Resource/template/admin/mall/mail/detail.twig に最終更新者・最終更新日時を出す箇所が無い（Creator・update_date の参照が無い）。
- 確信度: high

### sheet-10-R030 メール設定 — 未実装／IO／P3

- 正本: sheet-10（メール設定） HTML行 1879 付近
- 正本引用: 「画面見出しの横に、新規作成の画面へ移る導線と、テンプレート一覧の画面へ移る導線を置く。テンプレート一覧の画面は、自動送信メール以外の各テンプレートの本文を、編集欄ではなく文面として並べて表示する。」
- 設計期待値: メールテンプレート編集画面の見出しの横から、新規作成の画面とテンプレート一覧の画面へ移れる。
- 画像確認: レイアウト図(sheet-10_img1.png / sheet-10_img2.png)を確認。1枚目は見出し『テンプレート編集』の下に『テンプレート』(?付きのセレクトボックス、初期表示は選択してください)と『件名』(必須バッジ付き入力欄)が並ぶ。2枚目は『本文』(必須バッジ付き、行番号と改行記号を表示するコード編集欄)と右下の『登録』ボタン。 図の見出し『テンプレート編集』の横にも導線は描かれていない。
- 実装参照: `src/Eccube/Resource/template/admin/mall/mail/detail.twig:123-241;app/config/eccube/packages/eccube_nav.yaml:233-235`
- 実装実態: 見出しの横に導線が無く、各テンプレートの本文を文面として並べるテンプレート一覧の画面自体が存在しない。
- 判定根拠: src/Eccube/Resource/template/admin/mall/mail/detail.twig:129-131 の見出しに導線は無い。メールテンプレートの一覧を出す画面は管理画面の項目にも無く（app/config/eccube/packages/eccube_nav.yaml:233-235 はメール設定として編集画面を直接指す）、src/Eccube/Controller/Admin/Mall/MallMailController.php にも一覧の経路が無い。
- 確信度: high

### sheet-11-R007 CSV出力項目設定 — 実装違い／IO／P3

- 正本: sheet-11（CSV出力項目設定） HTML行 1952 付近
- 正本引用: 「選択肢:登録されているCSV全種」
- 設計期待値: CSV種別の選択肢には登録されているCSVの種別がすべて並ぶ。
- 画像確認: レイアウト図(sheet-11_img1.png / sheet-11_img2.png)を確認。見出し『CSV出力項目』の下に『CSV種別』(?付きセレクトボックス、表示は受注CSV)、左に『出力しない項目』の複数選択リスト、中央に『操作項目』(→出力/←解除/すべて出力/すべて解除)、右に『出力する項目』の複数選択リスト(注文ID・注文番号・会員ID…)、その右に『項目順序』(ひとつ上へ/ひとつ下へ/一番上へ/一番下へ)。下部に操作方法の説明文、右下に『登録』ボタン。 図のセレクトボックスは受注CSVを表示しており、選択肢の全体は図から判断できない。
- 実装参照: `src/Eccube/Controller/Admin/Setting/Shop/CsvController.php:52-73`
- 実装実態: 登録されている種別のうち3種（規格名・規格分類・GMO会員）を選択肢から除いているため、それらの出力項目はこの画面で設定できない。初期表示が受注CSVである点は設計どおり。
- 判定根拠: src/Eccube/Controller/Admin/Setting/Shop/CsvController.php:52-56 で除外する種別を並べ、src/Eccube/Controller/Admin/Setting/Shop/CsvController.php:69 で選択肢から外している。初期表示は src/Eccube/Controller/Admin/Setting/Shop/CsvController.php:46 の既定値で受注CSVになる。
- 確信度: med

### sheet-13-R121 店舗登録 — 実装違い／ふるまい／P3

- 正本: sheet-13（店舗登録） HTML行 2323 付近
- 正本引用: 「存在しない店舗を指定して画面を開いたときは、画面を表示せず見つからない旨の応答を返す。」
- 設計期待値: 存在しない店舗を指定して店舗の登録・編集画面を開いたときは、画面を表示せず見つからない旨の応答を返す。
- 画像確認: レイアウト図では判定できない（存在しない店舗を開いたときのふるまい）。
- 実装参照: `src/Eccube/Controller/Admin/Mall/TenantController.php:215-232; vendor/symfony/doctrine-bridge/ArgumentResolver/EntityValueResolver.php:85-87`
- 実装実態: 存在しない店舗IDを指定しても見つからない旨の応答にならず、新しい店舗の登録として登録画面が表示される。そのまま登録すると別の店舗が新規に作られる。
- 判定根拠: [gate7/refute] 重要度を P3 へ。事実は反証できない。引用は sheets/sheet-13.txt:199 に逐語で実在し、リニューアル後の仕様に打ち消しは無い（同ブロックの R120 は店舗選択部品の話で別）。実装は src/Eccube/Controller/Admin/Mall/TenantController.php:216 の引数が ?BaseInfo で null 許容のため、vendor/symfony/doctr 店舗IDを受け取る引数がnull許容のため、該当する店舗が無いときも見つからない旨の応答にならず null が渡り、src/Eccube/Controller/Admin/Mall/TenantController.php:219-223 の新規登録の初期化に入って登録画面が表示される。引数がnull許容のときは見つからない旨の応答を出さない仕組みであることを vendor/symfony/doctrine-bridge/ArgumentResolver/EntityValueResolver.php:85-87 で確認した。 反証段: 事実は維持。重要度は、この経路が一覧から開く通常操作では起きずURLを直接いじったときだけで、誤った登録も全必須項目を埋めて登録を押さないと起きないため P2 から P3 へ是正。
- 確信度: high

### sheet-13-R125 店舗登録 — 実装違い／ふるまい／P3

- 正本: sheet-13（店舗登録） HTML行 2327 付近
- 正本引用: 「入力の検証に通らないときは保存せず、同じ画面を再表示して項目ごとのエラーを表示する。ショップアイコンの画像を確定できないときも保存せず、画面上部にエラーを表示して同じ画面へ戻す。」
- 設計期待値: ショップアイコンの画像を確定できないときは店舗情報を保存せず、管理画面上部に「ショップアイコンファイルを指定してください。」と表示して同じ画面に留まる。
- 画像確認: レイアウト図 sheet-13_img1.png を確認。「ショップアイコン」欄と画面上部のメッセージ位置に関わる。
- 実装参照: `src/Eccube/Controller/Admin/Mall/TenantController.php:283-305; src/Eccube/Resource/template/admin/mall/tenant/detail.twig:117-127; src/Eccube/Resource/locale/messages.ja.yaml:1595`
- 実装実態: 入力検証に通らないときは同じ画面を再表示して項目ごとのエラーを出す一方、ショップアイコンの画像を確定できないときは何のエラーも出ず、アイコンだけが反映されないまま保存が成功として完了する。「ショップアイコンファイルを指定してください。」という文言は実装のどこにも無い。
- 同じ実装実態でまとまる要求: sheet-13-R137（店舗登録）
- 判定根拠: 前半（検証に通らないときは同じ画面で項目エラー）は src/Eccube/Controller/Admin/Mall/TenantController.php:258-266 と src/Eccube/Resource/template/admin/mall/tenant/detail.twig:268-269 などの項目別エラー表示で満たしている。後半のショップアイコンの確定失敗は src/Eccube/Controller/Admin/Mall/TenantController.php:283-305 で一時ファイルが見つからないときに何もせず素通りし、保存も止めずエラーも出さない。
- 確信度: high

### sheet-13-R127 店舗登録 — 実装違い／IO／P3

- 正本: sheet-13（店舗登録） HTML行 2329 付近
- 正本引用: 「画像を選んで保存すると、その店舗に設定されていた画像は消され、新しい画像へ差し替わる。画像を選ばずに保存したときは、設定済みの画像をそのまま残す。受け付ける画像は5メガバイトまでで、JPEG・GIF・PNGに限る。」
- 設計期待値: ショップアイコンとして受け付ける画像は5メガバイトまでとし、それを超える大きさの画像は受け付けない。
- 画像確認: レイアウト図 sheet-13_img1.png を確認。「ショップアイコン」欄のファイル選択が対象。
- 実装参照: `src/Eccube/Resource/template/admin/mall/tenant/detail.twig:94-95; src/Eccube/Controller/Admin/Mall/TenantController.php:487-520`
- 実装実態: 画面側の上限が10,000,000バイトで、5メガバイトを超える画像も受け付ける。受信側では拡張子と画像種別だけを見て大きさを確かめていない。
- 判定根拠: 差し替え（既存画像を消して新しい画像にする）と、選ばなかったときに既存画像を残す挙動は src/Eccube/Controller/Admin/Mall/TenantController.php:283-305 で満たしている。受け付ける種類も gif/jpg/jpeg/png に限っている（src/Eccube/Controller/Admin/Mall/TenantController.php:493-513）。大きさの上限だけが5メガバイトでなく10,000,000バイトで、受信側には大きさの検査が無い（src/Eccube/Resource/template/admin/mall/tenant/detail.twig:94-95）。
- 確信度: med

### sheet-3-R029 基本設定(旧ショップマスター) — 実装違い／IO／P3

- 正本: sheet-3（基本設定(旧ショップマスター)） HTML行 1105 付近
- 正本引用: 「2-3 商品ごとの送料設定を有効にする 単一選択(ラジオボタン) - - 無効 選択肢:無効　有効」
- 設計期待値: 有効／無効を無効・有効の2択のラジオボタンから1つ選ぶ形で設定できること
- 画像確認: sheet-3_img1: 商品ごとの送料設定を有効にする が「無効／有効」のラジオボタン2つで描かれている
- 実装参照: `src/Eccube/Form/Type/Admin/ShopMasterType.php:250-262;src/Eccube/Resource/template/admin/Form/bootstrap_4_horizontal_layout.html.twig:13`
- 実装実態: 有効／無効の切り替えはチェックボックス1つのトグルスイッチで描画され、選択肢のラジオボタン2つ（無効／有効）ではない。ラベルは有効／無効の文字を出し替える。
- 同じ実装実態でまとまる要求: sheet-3-R030（基本設定(旧ショップマスター)）、sheet-3-R037（基本設定(旧ショップマスター)）
- 判定根拠: 設計は書式・制限に単一選択(ラジオボタン)、選択肢に無効・有効と定める。実装は ToggleSwitchType（src/Eccube/Form/Type/Admin/ShopMasterType.php:250-262）で、描画はチェックボックス1個のトグル（bootstrap_4_horizontal_layout.html.twig:13-38）。値は2択で同じだが画面部品が異なる。
- 確信度: high

### sheet-3-R035 基本設定(旧ショップマスター) — 実装違い／IO／P3

- 正本: sheet-3（基本設定(旧ショップマスター)） HTML行 1111 付近
- 正本引用: 「3-4 自動ログイン機能を有効にする 単一選択(ラジオボタン) - - 無効 選択肢:無効　有効」
- 設計期待値: 自動ログイン機能の設定は初期状態で無効であること
- 画像確認: sheet-3_img1: 自動ログイン機能を有効にする は「無効」が選択された状態で描かれており、項目定義の初期値と一致する
- 実装参照: `src/Eccube/Entity/BaseInfo.php:135-136;app/DoctrineMigrations/Version20251127154224.php:238`
- 実装実態: 自動ログイン機能の設定は初期状態で有効。dtb_base_info の既定値が true で、初期投入データも option_remember_me に 1（有効）を入れている。
- 判定根拠: 項目定義の初期値は「無効」で、レイアウト図でも自動ログイン機能を有効にするは「無効」が選択されている。実装はカラム既定値 true（src/Eccube/Entity/BaseInfo.php:135-136）、初期投入も 1（app/DoctrineMigrations/Version20251127154224.php:238）で有効。
- 確信度: med

### sheet-3-R039 基本設定(旧ショップマスター) — 未実装／IO／P3

- 正本: sheet-3（基本設定(旧ショップマスター)） HTML行 1115 付近
- 正本引用: 「緯度 -90 から 90 まで。小数点以下は6桁まで 経度 -180 から 180 まで。小数点以下は6桁まで 範囲や桁数を外れる値を入力したときは保存しない。」
- 設計期待値: 地図設定で緯度・経度を入力でき、緯度は-90〜90、経度は-180〜180、小数点以下6桁までを受け付け、範囲や桁数を外れる値は保存しないこと
- 画像確認: sheet-3_img1: 地図設定に「緯度」「経度」の2つの入力欄が描かれており、Google Map URLの欄は無い
- 実装参照: `src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:402-411;src/Eccube/Form/Type/Admin/ShopMasterType.php:264-271;src/Eccube/Entity/BaseInfo.php:1593`
- 実装実態: 地図設定の入力欄はGoogle Map埋め込みURLの1欄だけで、緯度・経度の入力欄が無い。店舗基本情報にも緯度・経度を保持する項目が無く、範囲や小数桁の検証も行われない。
- 同じ実装実態でまとまる要求: sheet-3-R040（基本設定(旧ショップマスター)）、sheet-3-R072（基本設定(旧ショップマスター)）、sheet-3-R073（基本設定(旧ショップマスター)）、sheet-3-R074（基本設定(旧ショップマスター)）
- 判定根拠: 地図設定の節（src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:402-411）にあるのは google_map_url の1欄で、src/Eccube/Form/Type/Admin/ShopMasterType.php にも緯度・経度の項目が無い。店舗基本情報（src/Eccube/Entity/BaseInfo.php:1593 googleMapUrl）にも座標の保持先が無い。
- 確信度: high

### sheet-3-R042 基本設定(旧ショップマスター) — 実装違い／IO／P3

- 正本: sheet-3（基本設定(旧ショップマスター)） HTML行 1118 付近
- 正本引用: 「6-1　店頭用アカウントIPアドレス( , 区切り)　IPアドレスで許容された文字とカンマ　-　300文字　-　-　2026/7/2 石川 追加」
- 設計期待値: 店頭用アカウントIPアドレスは300文字までのIPアドレスとカンマだけを受け付け、それ以外の文字を含む値は保存しないこと
- 画像確認: sheet-3_img2: ネットワーク設定の見出しと店頭用アカウントIPアドレス( , 区切り)の1行入力欄を確認
- 実装参照: `src/Eccube/Form/Type/Admin/ShopMasterType.php:274-282;src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:459-469`
- 実装実態: 基本設定の店頭用アカウントIPアドレスは300文字の長さ検査だけで、IPアドレスとカンマ以外の文字を含む値でもそのまま保存される。同じ項目を持つ店舗登録側にはカンマ区切りのIP妥当性検査がある。
- 判定根拠: src/Eccube/Form/Type/Admin/ShopMasterType.php:274-282 の global_ip_address は Length(300) のみ。上限300文字は設計どおり（app/config/eccube/packages/eccube.yaml:223）。形式検査は店舗登録側の MallTenantShopType.php:459-469（validateGlobalIpAddress）にしかなく、基本設定では不正な文字列も保存できる。
- 確信度: high

### sheet-3-R055 基本設定(旧ショップマスター) — 実装違い／IO／P3

- 正本: sheet-3（基本設定(旧ショップマスター)） HTML行 1136 付近
- 正本引用: 「郵便番号 3桁と4桁の2欄に分けて入力する。数字以外を入れたとき、または桁数が3桁・4桁でないときは保存しない」
- 設計期待値: 郵便番号は3桁と4桁の2欄に分けて入力し、数字以外や3桁・4桁でない桁数のときは保存しないこと
- 画像確認: sheet-3_img1: 住所の1行目に 〒 と 2つの入力欄（3桁-4桁）が描かれている
- 実装参照: `src/Eccube/Form/Type/PostalType.php:55-79;src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:89-93`
- 実装実態: 郵便番号の入力欄は1つで、数字であることと8文字以内であることだけを見る。3桁と4桁に分かれておらず、1桁でも8桁でも保存できる。
- 判定根拠: src/Eccube/Form/Type/PostalType.php:55-72 は Length(eccube_postal_code=8) と digit 型検査のみ。app/config/eccube/packages/eccube.yaml:205 で上限8文字。src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:89-93 も入力欄は1つ。
- 確信度: high

### sheet-3-R057 基本設定(旧ショップマスター) — 実装違い／IO／P3

- 正本: sheet-3（基本設定(旧ショップマスター)） HTML行 1138 付近
- 正本引用: 「市区町村名 32文字を超えると保存しない」
- 設計期待値: 市区町村名は32文字を超えると保存しないこと
- 実装参照: `src/Eccube/Form/Type/Admin/ShopMasterType.php:55-170;src/Eccube/Form/Type/AddressType.php:105-131;app/config/eccube/packages/eccube.yaml:114`
- 実装実態: 文字数の上限が設計と違う。会社名・会社名(フリガナ)・店名・店名(フリガナ)・店舗営業時間は255文字、市区町村名・番地ビル名は90文字、取扱商品・メッセージは3000文字で判定しており、設計の50文字・32文字・99999文字と一致しない。
- 同じ実装実態でまとまる要求: sheet-3-R058（基本設定(旧ショップマスター)）、sheet-3-R080（基本設定(旧ショップマスター)）、sheet-3-R082（基本設定(旧ショップマスター)）
- 判定根拠: src/Eccube/Form/Type/AddressType.php:105-113 の addr01 は Length(eccube_address1_len)=90文字（app/config/eccube/packages/eccube.yaml:185）。33〜90文字でも保存できる。
- 確信度: med

### sheet-3-R061 基本設定(旧ショップマスター) — 実装違い／IO／P3

- 正本: sheet-3（基本設定(旧ショップマスター)） HTML行 1142 付近
- 正本引用: 「電話番号・FAX番号は、それぞれ3つの欄に分けて入力する。」
- 設計期待値: 電話番号・FAX番号はそれぞれ3つの欄に分けて入力できること
- 画像確認: sheet-3_img1: 電話番号・FAX番号がそれぞれ3つの入力欄（ハイフン区切り）で描かれている
- 実装参照: `src/Eccube/Form/Type/PhoneNumberType.php:55-72;src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:123-136`
- 実装実態: 電話番号・FAX番号の入力欄はそれぞれ1つで、数字であることと14文字以内であることだけを見る。3欄に分かれていないため、1欄あたり5桁の上限も、3欄のうち一部だけ入力した場合の判定も行われない。
- 同じ実装実態でまとまる要求: sheet-3-R063（基本設定(旧ショップマスター)）、sheet-3-R064（基本設定(旧ショップマスター)）
- 判定根拠: src/Eccube/Form/Type/PhoneNumberType.php:55-72 は単一の入力欄に Length(eccube_tel_len_max=14) と digit 型検査を付けるだけ。src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:126,135 も1欄。
- 確信度: high

### sheet-3-R076 基本設定(旧ショップマスター) — 実装違い／IO／P3

- 正本: sheet-3（基本設定(旧ショップマスター)） HTML行 1158 付近
- 正本引用: 「送料無料条件(金額)は数字だけを受け付け、8桁を超えると保存しない。画面には3桁ごとの区切りを付けて表示する。」
- 設計期待値: 送料無料条件(金額)は数字だけを受け付け、8桁を超える値は保存しないこと。画面には3桁ごとの区切りを付けて表示すること
- 画像確認: sheet-3_img1: 基本情報編集の各入力欄（会社名〜メッセージ／送料設定／会員設定／商品設定／地図設定）と右下の設定ボタンを確認
- 実装参照: `src/Eccube/Form/Type/PriceType.php:43-58;app/config/eccube/packages/eccube.yaml:201;src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:313`
- 実装実態: 送料無料条件(金額)は0〜2147483647の範囲で受け付けるため、8桁を超える9桁・10桁の金額も保存できる。3桁ごとの区切り表示は行われる。
- 判定根拠: src/Eccube/Form/Type/PriceType.php:56 の Range(min 0, max eccube_price_max) で、上限は 2147483647（app/config/eccube/packages/eccube.yaml:201）。桁区切りは同ファイル:66 grouping=true で設計どおり。
- 確信度: high

### sheet-6-R034 支払い方法　手数料設定 — 実装違い／IO／P3

- 正本: sheet-6（支払い方法　手数料設定） HTML行 1459 付近
- 正本引用: 「欄には「620px以上推奨」を併記する」
- 設計期待値: ロゴ画像の欄に「620px以上推奨」という推奨サイズの案内を併記する。
- 画像確認: 編集レイアウト図はロゴ画像ラベルの直下に「620px以上推奨」と描いており、設計側の値を裏付ける。
- 実装参照: `src/Eccube/Resource/template/admin/Setting/Shop/payment_edit.twig:197;src/Eccube/Resource/locale/messages.ja.yaml:3117`
- 実装実態: ロゴ画像のラベル下に併記される案内は「推奨サイズ : 500px × 100px」で、推奨値そのものが設計と異なる。
- 判定根拠: 選べる形式(gif/jpg/jpeg/png)・1件のみ・10MB超の送信前エラー・サーバ側の画像種別確認は src/Eccube/Resource/template/admin/Setting/Shop/payment_edit.twig:57-67 と src/Eccube/Controller/Admin/Setting/Shop/PaymentController.php:200-217 で一致する。併記文言だけが異なる。
- 確信度: high

### sheet-8-R019 税率設定 — 実装違い／IO／P3

- 正本: sheet-8（税率設定） HTML行 1673 付近
- 正本引用: 「新規追加のときは、課税規則を四捨五入にした未登録の共通税率を編集対象として画面を組み立てる。」
- 設計期待値: 新規に共通税率を追加するとき、課税規則の初期選択は四捨五入である。
- 画像確認: レイアウト図(sheet-8_img1.png)を確認。上から『個別税率設定』カード（商品別税率機能 有効/無効 ラジオ＋登録ボタン）、『共通税率設定』カード（消費税率・課税規則ラジオ・適用日時＋登録ボタン）、『税率一覧』（ID/消費税率/課税規則/適用日時＋行操作）の3ブロック構成。 図の共通税率設定では課税規則の『四捨五入』が選択済みで表示されている。
- 実装参照: `src/Eccube/Repository/TaxRuleRepository.php:77-93;src/Eccube/Resource/template/admin/Setting/Shop/tax_rule.twig:98`
- 実装実態: 新規行の課税規則は、現在有効な共通税率の課税規則を引き継ぐ。有効な税率が1件も無いときだけ四捨五入になる（src/Eccube/Repository/TaxRuleRepository.php:81-86）。現行の税率が切り捨てに変更されているため（app/DoctrineMigrations/Version20260619000001.php:30）、新規行の初期選択は切り捨てになる。
- 判定根拠: 同じ行の残りの記述は実装と一致する。編集対象が基本税率設定のときに適用日時の入力欄を出さない点は src/Eccube/Resource/template/admin/Setting/Shop/tax_rule.twig:143-148 と src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:105-107 で満たされている。
- 確信度: med

### sheet-8-R029 税率設定 — 実装違い／ふるまい／P3

- 正本: sheet-8（税率設定） HTML行 1683 付近
- 正本引用: 「指定されたIDの共通税率が無いときは、削除を行わず、既に削除されている旨の警告を出して税率設定画面へ戻る。」
- 設計期待値: 既に消えている税率の削除を選ぶと、既に削除されている旨の警告が出て税率設定画面に戻る。
- 画像確認: レイアウト図(sheet-8_img1.png)を確認。上から『個別税率設定』カード（商品別税率機能 有効/無効 ラジオ＋登録ボタン）、『共通税率設定』カード（消費税率・課税規則ラジオ・適用日時＋登録ボタン）、『税率一覧』（ID/消費税率/課税規則/適用日時＋行操作）の3ブロック構成。 図には削除時の警告表示欄は描かれていない（管理画面上部の共通表示域）。
- 実装参照: `src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:147-167`
- 実装実態: 存在しないIDを指定すると税率設定画面へ戻らず、ページが見つからない扱いの画面になる。既に削除されている旨の警告は出ない。
- 判定根拠: src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:148 は対象行の解決を経路の引数解決に任せており、見つからないときは警告表示も画面遷移も行われない。既存の警告表示手段（src/Eccube/Controller/AbstractController.php:174-178）は呼ばれていない。行の残り（なりすまし対策トークンの検証・基本税率設定は削除せず完了メッセージ無しで戻る・それ以外は削除して戻る）は src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:150-166 で満たされている。
- 確信度: med

### sheet-9-R021 自動送信メール — 未実装／ふるまい／P3

- 正本: sheet-9（自動送信メール） HTML行 1775 付近
- 正本引用: 「識別子が一致し、かつ自動送信メールに該当するテンプレートを対象とする」
- 設計期待値: この画面が編集対象にできるのは自動送信メールに該当するテンプレートだけで、それ以外のテンプレートは編集対象にならない。
- 画像確認: レイアウト図(sheet-9_img1)は上部に最終更新者・最終更新日、テンプレ選択のセレクト、テンプレ名称、件名、続いて差込み項目を含む読取専用の本文と2つの入力欄(本文上部・本文下部)、右下に「設定」ボタンを示す。
- 実装参照: `src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:49-55;src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:81-89`
- 実装実態: 識別子で読み込むテンプレートに自動送信メールかどうかの絞り込みが無く、手動送信用のテンプレートでも識別子を指定すれば同じ編集画面が開き保存できる。
- 同じ実装実態でまとまる要求: sheet-9-R022（自動送信メール / 実装参照 `src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:49-55`）
- 判定根拠: 選択肢は src/Eccube/Form/Type/Admin/AutoMailType.php:51-53 で自動送信のものに限られるが、対象テンプレートの読み込み(src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:55 の引数解決)には同じ条件が無い。
- 確信度: med

### sheet-9-R023 自動送信メール — 実装違い／IO／P3

- 正本: sheet-9（自動送信メール） HTML行 1777 付近
- 正本引用: 「テンプレ選択の選択肢は、テンプレ名称の昇順で並べる。」
- 設計期待値: テンプレ選択のセレクトボックスの選択肢がテンプレ名称の昇順に並ぶ。
- 画像確認: レイアウト図では選択中の1件しか見えず並び順は図から確認できない。
- 実装参照: `src/Eccube/Form/Type/Admin/AutoMailType.php:49-54;src/Eccube/Form/Type/Master/MailTemplateType.php:37-38`
- 実装実態: 選択肢はテンプレートの識別子の昇順で並ぶ。名称順の並べ替えは行われない。
- 判定根拠: src/Eccube/Form/Type/Admin/AutoMailType.php:54 が orderBy(id, ASC) を指定しており、名称での並べ替えが無い。上位の型の既定も識別子順(src/Eccube/Form/Type/Master/MailTemplateType.php:37-38)。
- 確信度: high

## 掲載しなかった判定

- 区分が「表示メッセージ」の指摘 2件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0209/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 7 | 0 | 0 | 0 | 7 |
| sheet-2 | 目次 | 16 | 0 | 0 | 0 | 16 |
| sheet-3 | 基本設定(旧ショップマスター) | 94 | 5 | 14 | 3 | 72 |
| sheet-4 | 特定商取引に関する法律 | 35 | 3 | 0 | 6 | 26 |
| sheet-5 | 利用規約管理 | 26 | 0 | 1 | 0 | 25 |
| sheet-6 | 支払い方法　手数料設定 | 73 | 0 | 1 | 0 | 72 |
| sheet-7 | 配送方法設定 | 31 | 0 | 0 | 1 | 30 |
| sheet-8 | 税率設定 | 45 | 4 | 5 | 0 | 36 |
| sheet-9 | 自動送信メール | 47 | 2 | 1 | 0 | 44 |
| sheet-10 | メール設定 | 39 | 2 | 5 | 0 | 32 |
| sheet-11 | CSV出力項目設定 | 36 | 0 | 1 | 0 | 35 |
| sheet-12 | カスタムCSV出力設定 | 59 | 2 | 0 | 0 | 57 |
| sheet-13 | 店舗登録 | 144 | 17 | 6 | 0 | 121 |
| sheet-14 | 追加システム設定 | 86 | 0 | 0 | 3 | 83 |

