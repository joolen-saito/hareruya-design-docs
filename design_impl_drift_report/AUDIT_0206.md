# 実装乖離監査 — 0206_基本設計仕様書(ネット買取管理機能).html

- 正本: `excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **983要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 2 | ○ |
| 実装違い | 実装はあるが設計と違う | 23 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 0 | — |
| 設計どおり | 設計どおり実装されている | 603 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 354 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 1 | — |
| **合計** | | **983** | |

## 不具合 17件（P1 0 / P2 2 / P3 15）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 8件は重複として代表へ折り畳んだ（判定そのものは 25件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-12-R035 | 手動メール通知(入力画面) | 実装違い | ふるまい | P2 | 手動メール通知でメールを送ったあと、件名・本文・送信日時と、選んだテンプレート・対象の買取受注・その会員を記録した送信履歴が1件残る。 |
| sheet-6-R008 | 入金CSV出力項目 | 実装違い | IO | P2 | 入金CSVの口座番号は、先頭の0を落とさない桁揃えの形（例 0472843）で出力される。1列目の受注番号は前ゼロなしと明確に書き分けられている。 |
| sheet-10-R038 | 【新規】戻しリストPDF出力 | 未実装 | IO | P3 | 戻しリスト（ピッキングリスト）の各区間の見出し付近に、リストを作成した日時が表示される。 |
| sheet-11-R092 | 買取情報編集 | 実装違い | IO | P3 | 基本情報の本人確認状態には、未確認・確認中・オンライン本人確認済み・簡易書留確認済みのいずれかがそのまま表示される |
| sheet-14-R033 | 【新規】買取商品履歴(検索入力) | 実装違い | IO | P3 | 検索実行のボタンが『検索する』と表示される。 |
| sheet-15-R009 | 【新規】買取商品履歴(検索結果) | 実装違い | IO | P3 | 検索結果上部の出力メニューが『CSVダウンロード』と表示され、そこから出力方法を選ぶ。 |
| sheet-17-R035 | 別添資料_ネット買取管理ステータス | 実装違い | ふるまい | P3 | 買取詳細画面で在庫登録ボタンを押したとき、売却する個別入力商品に実在庫が未登録のものが1件でも残っていれば、その買取の買取状況が「未登録在庫あり」になる。 |
| sheet-3-R025 | 買取一覧(検索入力) | 実装違い | IO | P3 | 買取番号の入力欄は50文字までを受け付け、50文字を超える入力は入力エラーとして画面に返す |
| sheet-3-R032 | 買取一覧(検索入力) | 実装違い | IO | P3 | 商品名の検索条件を選ぶラジオボタンの項目名として、画面に「AND/OR検索」と表示される |
| sheet-3-R056 | 買取一覧(検索入力) | 実装違い | IO | P3 | 棚戻しが未のものだけに絞り込むチェックボックスの項目名として、画面に「戻し未完了のみ表示」と表示される |
| sheet-3-R058 | 買取一覧(検索入力) | 実装違い | IO | P3 | 検索を実行するボタンの表示文言が「検索する >」である |
| sheet-3-R081 | 買取一覧(検索入力) | 実装違い | IO | P3 | 検索した結果が0件のときは、該当データなしのメッセージだけを表示し、該当件数の表示は出さない |
| sheet-4-R082 | 買取一覧(検索結果) | 実装違い | IO | P3 | 本人確認の欄に、未確認は⚠️、確認中・オンライン本人確認済み・簡易書留確認済みはその文言が表示される。 |
| sheet-4-R083 | 買取一覧(検索結果) | 実装違い | IO | P3 | 買取詳細の商品名は、まとめて買取の商品のとき太字で表示される。 |
| sheet-4-R086 | 買取一覧(検索結果) | 実装違い | IO | P3 | 箱数が3以上の買取は、一覧の箱数が赤色かつ太字で表示される。 |
| sheet-7-R005 | 買取商品一覧CSV出力項目 | 実装違い | IO | P3 | 買取商品一覧CSVの4列目の見出しが「販売価格」であり、そこに商品規格の現在の基準価格が入る |
| sheet-7-R007 | 買取商品一覧CSV出力項目 | 実装違い | IO | P3 | 個別入力商品の行と、状態を持たない通常商品の行は、言語IDの列がいずれも1（日本語）で出力される |

### sheet-12-R035 手動メール通知(入力画面) — 実装違い／ふるまい／P2

- 正本: sheet-12（手動メール通知(入力画面)） HTML行 2268 付近
- 正本引用: 「追加 メールを送ったあとの、通知の送信履歴1件。件名・本文・送信日時と、選んだテンプレート・対象の買取受注・その会員を記録する」
- 設計期待値: 手動メール通知でメールを送ったあと、件名・本文・送信日時と、選んだテンプレート・対象の買取受注・その会員を記録した送信履歴が1件残る。
- 画像確認: sheet-12_img1: 画面上に履歴表示は無く、レイアウト図からは判定できない項目のため実装を追って判定した
- 実装参照: `src/Eccube/Service/MailService.php:1743-1745; src/Eccube/Controller/Admin/Purchase/MailController.php:116-146`
- 実装実態: 送信履歴は組み立てられるものの、保存を確定させる処理が無いまま応答が返るため、履歴はDBに残らない。同じ MailService の他の買取メール（src/Eccube/Service/MailService.php:1591-1593）や会員手動メール（src/Eccube/Controller/Admin/Customer/CustomerMailController.php:266-267）は保存を確定させており、この経路だけ欠けている。
- 判定根拠: sendManualPurchaseMail は履歴を作るところまでで終わり、呼び出し元の MailController も送信後は完了メッセージを出して買取編集画面へ戻すだけで保存を確定させない。リクエスト終了時の後処理（src/Eccube/EventListener/TransactionListener.php:98-125）はDBのトランザクションを確定するだけで未確定の登録内容を書き出さないため、履歴は失われる。
- 確信度: high

### sheet-6-R008 入金CSV出力項目 — 実装違い／IO／P2

- 正本: sheet-6（入金CSV出力項目） HTML行 1459 付近
- 正本引用: 「入金CSV出力項目 識別ID 項目名 備考 1 受注番号 前ゼロなし 2 送料 3 査定額 査定承諾合計金額 4 銀行名 5 支店名 6 口座種別 7 口座番号 前ゼロあり」
- 設計期待値: 入金CSVの口座番号は、先頭の0を落とさない桁揃えの形（例 0472843）で出力される。1列目の受注番号は前ゼロなしと明確に書き分けられている。
- 画像確認: このシートにレイアウト図は無い（images/ に sheet-6_img* が存在しない）。項目表のみで判定。
- 実装参照: `src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:37;src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:123`
- 実装実態: src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:123 は口座番号を数値のまま CSV に書き出すだけで、ゼロ埋めしていない。口座番号は src/Eccube/Entity/DtbBankAccount.php:43 のとおり整数で保持されるため、0472843 は 472843 として出力される。同じ値を画面に出す箇所では src/Eccube/Resource/template/admin/Purchase/detail.twig:845 と src/Eccube/Resource/template/default/Purchase/fill.twig:272 が 7桁ゼロ埋めして表示しており、CSV だけ揃っていない。
- 判定根拠: 設計は識別ID1『前ゼロなし』と識別ID7『前ゼロあり』を書き分けているのに、実装は両方を同じ生の数値で出している。振込データとして銀行に渡す口座番号の先頭0が欠けるため、出力結果の値そのものが設計と異なる。
- 確信度: high

### sheet-10-R038 【新規】戻しリストPDF出力 — 未実装／IO／P3

- 正本: sheet-10（【新規】戻しリストPDF出力） HTML行 1670 付近
- 正本引用: 「4 作成日時 ラベル - - - ピッキングリストを作成した日時」
- 設計期待値: 戻しリスト（ピッキングリスト）の各区間の見出し付近に、リストを作成した日時が表示される。
- 画像確認: sheet-10_img1〜4: いずれのレイアウト図も右上に「作成日：2025/05/28 21:51:25」を表示している
- 実装参照: `src/Eccube/Resource/template/admin/Purchase/restock_list.twig:22-37`
- 実装実態: restock_list.twig の見出しブロックは区間タイトルとページ番号だけを出力しており、作成日時を出す記述が無い。同種のピッキングリストである src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:41 や src/Eccube/Resource/template/admin/Stock/MoveTransfer/return_list.twig:29 は admin.picking_item_list.create_date（作成日）を出力している。
- 同じ実装実態でまとまる要求: sheet-10-R039（【新規】戻しリストPDF出力）
- 判定根拠: テンプレート全文（106行）と読み込んでいるCSS・JSを確認したが、日時を出力する箇所は無い。表示データを組み立てる BuyOrderRestockListService::buildPdfViewData も restockListSections しか渡していない（src/Eccube/Service/Admin/Purchase/BuyOrderRestockListService.php:54-63）。
- 確信度: high

### sheet-11-R092 買取情報編集 — 実装違い／IO／P3

- 正本: sheet-11（買取情報編集） HTML行 1838 付近
- 正本引用: 「未確認、確認中、オンライン本人確認済み、簡易書留確認済みが表示される」
- 設計期待値: 基本情報の本人確認状態には、未確認・確認中・オンライン本人確認済み・簡易書留確認済みのいずれかがそのまま表示される
- 画像確認: レイアウト図image1(買取詳細ヘッダ)を確認。画像では未確認が赤字表示されている。
- 実装参照: `src/Eccube/Resource/template/admin/Purchase/detail.twig:143-151`
- 実装実態: オンライン本人確認済みと簡易書留確認済みのときは、その名称ではなく一律で「本人確認済み」と表示される(未確認・確認中はそのまま表示)
- 判定根拠: src/Eccube/Resource/template/admin/Purchase/detail.twig:144-149で本人確認状態が確認済み系の2値のときだけ固定文言「本人確認済み」に差し替えている。マスタには未確認・確認中・オンライン本人確認済み・簡易書留確認済みの4名称が登録されており、同じ画面の買取依頼者情報側(src/Eccube/Resource/template/admin/Purchase/detail.twig:724)はマスタ名称をそのまま出しているため、基本情報だけ表示が異なる。
- 確信度: high

### sheet-14-R033 【新規】買取商品履歴(検索入力) — 実装違い／IO／P3

- 正本: sheet-14（【新規】買取商品履歴(検索入力)） HTML行 2432 付近
- 正本引用: 「16	検索する	ボタン	-	-	-	検索実行する（買取商品履歴(検索結果)の内容を表示する）」
- 設計期待値: 検索実行のボタンが『検索する』と表示される。
- 画像確認: sheet-14_img1.png のレイアウト図で、買取番号／会員ID／申込者名／ステータス（振込完了・未登録在庫あり・入庫待ち・入庫済み）／査定担当者名／商品コード／商品名／振込完了日／基準価格／買取価格／言語（日本語・英語・その他言語）／状態（NM・SP・MP・HP）／検索するボタン の配置を確認した。 図のボタンは明確に『検索する >』と読める。
- 実装参照: `src/Eccube/Resource/template/admin/Purchase/history.twig:179`
- 実装実態: src/Eccube/Resource/template/admin/Purchase/history.twig:179 のボタンは共通文言 admin.common.search を出力するため、画面には『検索』と表示される。買取商品履歴用に用意された文言 admin.purchase.online.history.form.search.button（src/Eccube/Resource/locale/messages.ja.yaml:5696 に『検索する』として定義済み）はどこからも使われていない。
- 判定根拠: 設計の項目表は識別ID16のラベルを『検索する』としており、レイアウト図のボタンも『検索する >』である。実装は src/Eccube/Resource/locale/messages.ja.yaml:1643 の admin.common.search（値は『検索』）を出しており表示文言が異なる。店頭買取の同等画面 src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig:152 は専用文言（『検索する』）を出しており、ネット買取側だけが共通文言になっている。
- 確信度: high

### sheet-15-R009 【新規】買取商品履歴(検索結果) — 実装違い／IO／P3

- 正本: sheet-15（【新規】買取商品履歴(検索結果)） HTML行 2505 付近
- 正本引用: 「3	CSVダウンロード	単一選択	-	-	-	・選択した商品履歴取得」
- 設計期待値: 検索結果上部の出力メニューが『CSVダウンロード』と表示され、そこから出力方法を選ぶ。
- 画像確認: sheet-15_img1.png のレイアウト図で、該当件数表示・件数プルダウン・CSVダウンロードのプルダウン（選択した商品履歴取得／検索結果全件取得）・行頭チェックボックス・買取番号／申込者／商品コード／商品名／基準価格／買取価格／査定担当者／買取数／入庫数／増減数／振込完了日／更新日時 の列並びとページングを確認した。 図のプルダウンは『CSVダウンロード』と読め、開くと『選択した商品履歴取得』『検索結果全件取得』が並ぶ。
- 実装参照: `src/Eccube/Resource/template/admin/Purchase/history.twig:208-216`
- 実装実態: src/Eccube/Resource/template/admin/Purchase/history.twig:210 のメニューは共通文言 admin.common.download を出力するため、画面には『ダウンロード』と表示される。
- 判定根拠: 設計の項目表は識別ID3のラベルを『CSVダウンロード』としており、レイアウト図のプルダウンも『CSVダウンロード』である。実装は src/Eccube/Resource/locale/messages.ja.yaml:1656 の admin.common.download（値は『ダウンロード』）を出しており表示文言が異なる。店頭買取の同等画面 src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig:186 は『CSVダウンロード』と表示している。なお選択肢そのもの（選択した商品履歴取得／検索結果全件取得）は src/Eccube/Resource/template/admin/Purchase/history.twig:213-214 で設計どおり実装されている。
- 確信度: high

### sheet-17-R035 別添資料_ネット買取管理ステータス — 実装違い／ふるまい／P3

- 正本: sheet-17（別添資料_ネット買取管理ステータス） HTML行 2629 付近
- 正本引用: 「振込完了または買取詳細画面の在庫登録ボタン押下時に個別入力商品の中に一つでも在庫未登録の商品があれば未登録在庫ありにする」
- 設計期待値: 買取詳細画面で在庫登録ボタンを押したとき、売却する個別入力商品に実在庫が未登録のものが1件でも残っていれば、その買取の買取状況が「未登録在庫あり」になる。
- 画像確認: 画像5枚は進捗バーの文言のみで、管理画面表示名・DBIDの記載は無い。
- 実装参照: `src/Eccube/Service/Admin/Purchase/RegisterIndividualStockAction.php:70-100`
- 実装実態: 在庫登録ボタン押下の処理は、全ての売却対象が登録済みのときだけ「入庫待ち」へ変更し、未登録が残る場合は買取状況を変えず現在値のまま（RegisterIndividualStockAction.php:72-100）。未登録在庫ありへの変更は振込完了保存時の経路（PurchaseDetailUpdateAction.php:165-188）にしか無い。
- 判定根拠: [gate7/refute] 重要度を P3 へ。指摘自体は成立する。引用は sheets/sheet-17.txt:49 に逐語で実在し、sheets/sheet-17.txt:110-112 の『未登録在庫の有無は振込完了時と、ネット買取詳細画面での実在庫登録ボタン押下時に判定する』が同旨を補強している。実装 src/Eccube/Service/Admin/Purchase/RegisterIndividualStockAction.php 査定内容承諾〜振込失敗の状態でも在庫登録ボタンは操作できる（MtbBuyOrderStatus.php:92-100）ため、未登録が残ったまま登録しても未登録在庫ありにならない。振込完了時の判定は実装済みで、ボタン押下時の『あり』側の分岐だけが無い。
- 確信度: med

### sheet-3-R025 買取一覧(検索入力) — 実装違い／IO／P3

- 正本: sheet-3（買取一覧(検索入力)） HTML行 1113 付近
- 正本引用: 「最大文字数 または最大値 初期値 画面部品の説明 1 買取状況 複数選択(セレクトボックス) - - - 表示ステータスについては「別添資料_ネット買取管理ステータス」シートを参照 2 買取番号 半角・全角 - 50 -」
- 設計期待値: 買取番号の入力欄は50文字までを受け付け、50文字を超える入力は入力エラーとして画面に返す
- 画像確認: sheet-3_img1.png: 買取番号は1行のテキスト入力欄。画像に文字数の記載は無く、文字数は項目表のみが根拠
- 実装参照: `src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:119-128;app/config/eccube/packages/eccube.yaml:141`
- 実装実態: 買取番号の長さ制限が汎用の短文長（255文字）で定義されており、51〜255文字の入力はエラーにならずそのまま検索が実行される
- 判定根拠: src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:125-127 の長さ制約は eccube_stext_len を上限にしており、その値は app/config/eccube/packages/eccube.yaml:141 で255。設計の最大文字数50と一致しない。
- 確信度: med

### sheet-3-R032 買取一覧(検索入力) — 実装違い／IO／P3

- 正本: sheet-3（買取一覧(検索入力)） HTML行 1120 付近
- 正本引用: 「9 AND/OR検索 単一選択(ラジオボタン) - - - 「商品名(1)」から「商品名(3)」に対する検索条件を設定」
- 設計期待値: 商品名の検索条件を選ぶラジオボタンの項目名として、画面に「AND/OR検索」と表示される
- 画像確認: sheet-3_img1.png: 項目名は「AND/OR検索」と読める。選択肢はAND検索・OR検索の2つ
- 実装参照: `src/Eccube/Resource/template/admin/Purchase/index.twig:97;src/Eccube/Resource/locale/messages.ja.yaml:5596`
- 実装実態: 同じラジオボタンの項目名が画面上「AND/OR選択」と表示される
- 判定根拠: src/Eccube/Resource/template/admin/Purchase/index.twig:97 が使う表示文言は src/Eccube/Resource/locale/messages.ja.yaml:5596 で「AND/OR選択」。ラジオボタン自体（AND検索／OR検索の2択、既定は未選択）は src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:138-147 にあり、項目名の文字だけが設計と異なる。
- 確信度: med

### sheet-3-R056 買取一覧(検索入力) — 実装違い／IO／P3

- 正本: sheet-3（買取一覧(検索入力)） HTML行 1144 付近
- 正本引用: 「31 戻し未完了のみ表示 単一選択(チェックボックス) - - - 買取情報の棚戻し状況が未のものだけ表示する」
- 設計期待値: 棚戻しが未のものだけに絞り込むチェックボックスの項目名として、画面に「戻し未完了のみ表示」と表示される
- 画像確認: sheet-3_img1.png: 最下段のチェックボックスの項目名は「戻し未完了のみ表示」
- 実装参照: `src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:171-174;src/Eccube/Resource/locale/messages.ja.yaml:5564;src/Eccube/Resource/template/admin/Purchase/index.twig:134`
- 実装実態: チェックボックスの項目名が画面上「棚戻し未完了のみ表示」と表示される（設計文言の「戻し未完了のみ表示」は src/Eccube/Resource/locale/messages.ja.yaml:5616 に用意されているが使われていない）
- 判定根拠: src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:173 が参照する表示文言は src/Eccube/Resource/locale/messages.ja.yaml:5564 で「棚戻し未完了のみ表示」。絞り込み動作（src/Eccube/Repository/DtbBuyOrderRepository.php:218-222）は設計どおりで、項目名の文字だけが異なる。
- 確信度: high

### sheet-3-R058 買取一覧(検索入力) — 実装違い／IO／P3

- 正本: sheet-3（買取一覧(検索入力)） HTML行 1146 付近
- 正本引用: 「33 検索する > ボタン - - - 入力項目一覧で設定された値をもとに検索を実行する」
- 設計期待値: 検索を実行するボタンの表示文言が「検索する >」である
- 画像確認: sheet-3_img1.png: ボタンの文言は「検索する >」
- 実装参照: `src/Eccube/Resource/template/admin/Purchase/index.twig:144;src/Eccube/Resource/locale/messages.ja.yaml:1643;src/Eccube/Resource/locale/messages.ja.yaml:5618`
- 実装実態: ボタンの表示文言が汎用の「検索」になっている（設計文言の「検索する」は src/Eccube/Resource/locale/messages.ja.yaml:5618 に用意されているが使われていない）
- 判定根拠: src/Eccube/Resource/template/admin/Purchase/index.twig:144 は src/Eccube/Resource/locale/messages.ja.yaml:1643 の「検索」を表示する。押下で入力値をもとに検索が実行される動作（src/Eccube/Controller/Admin/Purchase/PurchaseController.php:153-179）は設計どおりで、文言だけが異なる。
- 確信度: high

### sheet-3-R081 買取一覧(検索入力) — 実装違い／IO／P3

- 正本: sheet-3（買取一覧(検索入力)） HTML行 1173 付近
- 正本引用: 「検索結果と出力の操作 該当件数が1件以上のときだけ表示する。0件のときは該当データなしのメッセージだけを示し、出力の操作は出さない」
- 設計期待値: 検索した結果が0件のときは、該当データなしのメッセージだけを表示し、該当件数の表示は出さない
- 画像確認: レイアウト図は検索入力部のみで、結果表示は図の対象外
- 実装参照: `src/Eccube/Resource/template/admin/Purchase/index.twig:147-153;src/Eccube/Resource/locale/messages.ja.yaml:1735`
- 実装実態: 0件のときも「検索結果：0件が該当しました」の件数表示が出たうえで、該当データなしのメッセージが表示される
- 判定根拠: src/Eccube/Resource/template/admin/Purchase/index.twig:147-153 は検索を実行していれば件数表示を出す作りで、0件かどうかを見ていない。出力の操作（ダウンロード）は src/Eccube/Resource/template/admin/Purchase/index.twig:161 で1件以上のときだけ出しており設計どおり、件数表示だけが0件でも出る。
- 確信度: med

### sheet-4-R082 買取一覧(検索結果) — 実装違い／IO／P3

- 正本: sheet-4（買取一覧(検索結果)） HTML行 1344 付近
- 正本引用: 「⚠️（未確認）、確認中、オンライン本人確認済み、簡易書留確認済みが表示される」
- 設計期待値: 本人確認の欄に、未確認は⚠️、確認中・オンライン本人確認済み・簡易書留確認済みはその文言が表示される。
- 画像確認: sheet-4_img1.png（買取一覧レイアウト）を確認。図では本人確認欄に「確認中」「オンライン本人確認済み」の文言と⚠️が描かれている。
- 実装参照: `src/Eccube/Resource/template/admin/Purchase/index.twig:245-256;app/DoctrineMigrations/Version20251125145047.php:62-83`
- 実装実態: 未確認は⚠️、オンライン本人確認済みはマスタ名称で表示されるが、確認中は文言ではなく目のアイコンが表示され（src/Eccube/Resource/template/admin/Purchase/index.twig:251-252）、簡易書留確認済みは「書留確認済み」という別文言が直書きされている（src/Eccube/Resource/template/admin/Purchase/index.twig:250）。
- 判定根拠: マスタの名称は app/DoctrineMigrations/Version20251125145047.php:62-83 で未確認／確認中／オンライン本人確認済み／簡易書留確認済み。src/Eccube/Resource/template/admin/Purchase/index.twig:249-252 が確認中をアイコンに、簡易書留確認済みを「書留確認済み」に置き換えている。
- 確信度: high

### sheet-4-R083 買取一覧(検索結果) — 実装違い／IO／P3

- 正本: sheet-4（買取一覧(検索結果)） HTML行 1345 付近
- 正本引用: 「まとめて買取の場合は太字にする」
- 設計期待値: 買取詳細の商品名は、まとめて買取の商品のとき太字で表示される。
- 画像確認: sheet-4_img1.png（買取一覧レイアウト）を確認。図では「まとめて買取」の行の商品名が太字で描かれている。
- 実装参照: `src/Eccube/Resource/template/admin/Purchase/index.twig:260;html/template/admin/assets/css/app.css`
- 実装実態: まとめて買取の商品名には bulkPurchase という区別用のクラスだけが付き、admin配下のCSSにもテンプレート内にもこのクラスの装飾定義が無いため太字にならない。
- 判定根拠: src/Eccube/Resource/template/admin/Purchase/index.twig:260 が該当商品に bulkPurchase を付けるが、html/template/admin/assets/css/*.css および scss を全文検索しても bulkPurchase の定義が無く、src/Eccube/Resource/template/admin/Purchase/index.twig:11-20 のスタイル定義にも含まれない。
- 確信度: med

### sheet-4-R086 買取一覧(検索結果) — 実装違い／IO／P3

- 正本: sheet-4（買取一覧(検索結果)） HTML行 1348 付近
- 正本引用: 「3以上の場合は赤太字にする」
- 設計期待値: 箱数が3以上の買取は、一覧の箱数が赤色かつ太字で表示される。
- 画像確認: sheet-4_img1.png（買取一覧レイアウト）を確認。図では箱数「3」が赤太字で描かれている。
- 実装参照: `src/Eccube/Resource/template/admin/Purchase/index.twig:271;html/template/admin/assets/css/bootstrap.css`
- 実装実態: 箱数が3以上のとき赤色（text-danger）は付くが、併用されている font-weight-bold は Bootstrap 5.3.3 では定義が無く（bootstrap.css の太字ユーティリティは fw-bold のみ）、リポジトリ内のどのCSSにも .font-weight-bold の定義が無いため太字にならない。
- 同じ実装実態でまとまる要求: sheet-4-R024（買取一覧(検索結果)）
- 判定根拠: src/Eccube/Resource/template/admin/Purchase/index.twig:271 は閾値（app/config/eccube/packages/eccube.yaml:347 の 3）以上で class="text-danger font-weight-bold" を付けるが、html/template/admin/assets/css 配下の全CSSに .font-weight-bold の定義が無く、Bootstrap 5 の太字ユーティリティは .fw-bold。赤字のみ効き太字が効かない。
- 確信度: med

### sheet-7-R005 買取商品一覧CSV出力項目 — 実装違い／IO／P3

- 正本: sheet-7（買取商品一覧CSV出力項目） HTML行 1497 付近
- 正本引用: 「4 販売価格 商品規格に紐づく現在の基準価格、個別入力商品または状態がない場合は何も出力しない」
- 設計期待値: 買取商品一覧CSVの4列目の見出しが「販売価格」であり、そこに商品規格の現在の基準価格が入る
- 画像確認: sheet-7 は画像0枚（レイアウト図なし）。判定は本文の項目表のみによる
- 実装参照: `src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:34`
- 実装実態: 4列目の見出しが「基準価格」で出力される（src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:34 の 'standard_price' => '基準価格'）。値そのものは src/Eccube/Repository/DtbBuyOrderRepository.php:571 の pc.standard_price で設計の備考どおり
- 同じ実装実態でまとまる要求: sheet-8-R005（【新規】買取商品一覧（キャンセル）CSV出力項目）
- 判定根拠: 設計の項目名は9項目中8項目（商品コード/在庫増減数/商品名/買取価格/言語ID/略称タグ/レアリティ/状態）がsrc/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:30-40 の見出し文字列と逐語一致しており、この表の項目名がCSV見出しを定めていると読める。4列目だけ設計「販売価格」に対し実装「基準価格」で食い違う。現行(pf)は app/Plugin/HareruyaEc/Controller/Admin/Purchase/PurchaseController.php の CSV_HEADER で '販売価格' を出力しており、eeで見出しの語が変わっている。値は備考どおり基準価格のため、食い違うのは見出しの語のみ。eeでは販売価格(price02)と基準価格(standard_price)が別項目のため、どちらを見出しにするかは影響が残る
- 確信度: med

### sheet-7-R007 買取商品一覧CSV出力項目 — 実装違い／IO／P3

- 正本: sheet-7（買取商品一覧CSV出力項目） HTML行 1499 付近
- 正本引用: 「6 言語ID 個別入力商品または状態がない場合は[1: 日本語]固定」
- 設計期待値: 個別入力商品の行と、状態を持たない通常商品の行は、言語IDの列がいずれも1（日本語）で出力される
- 画像確認: sheet-7 は画像0枚（レイアウト図なし）。判定は本文の項目表のみによる
- 実装参照: `src/Eccube/Repository/DtbBuyOrderRepository.php:643`
- 実装実態: 個別入力商品の行は src/Eccube/Repository/DtbBuyOrderRepository.php:617 で 1 固定だが、状態を持たない通常商品の行は src/Eccube/Repository/DtbBuyOrderRepository.php:643 で買取明細に登録された言語IDをそのまま出力する。買取明細の言語IDは未設定にもなり得るため、1以外や空欄が出力される
- 同じ実装実態でまとまる要求: sheet-7-R008（買取商品一覧CSV出力項目 / 実装参照 `src/Eccube/Repository/DtbBuyOrderRepository.php:644`）、sheet-7-R009（買取商品一覧CSV出力項目 / 実装参照 `src/Eccube/Repository/DtbBuyOrderRepository.php:645`）、sheet-8-R007（【新規】買取商品一覧（キャンセル）CSV出力項目）、sheet-8-R008（【新規】買取商品一覧（キャンセル）CSV出力項目 / 実装参照 `src/Eccube/Repository/DtbBuyOrderRepository.php:644`）、sheet-8-R009（【新規】買取商品一覧（キャンセル）CSV出力項目 / 実装参照 `src/Eccube/Repository/DtbBuyOrderRepository.php:645`）
- 判定根拠: 同じ表の他項目の備考「個別入力商品または状態がない場合は何も出力しない」は、状態を持たない通常商品の行（src/Eccube/Repository/DtbBuyOrderRepository.php:635-669 の3つ目の抽出）に対して src/Eccube/Repository/DtbBuyOrderRepository.php:638（商品コード）・src/Eccube/Repository/DtbBuyOrderRepository.php:641（販売価格）・src/Eccube/Repository/DtbBuyOrderRepository.php:646（状態）で空文字を返すことと一致しており、「状態がない場合」がこの行を指すことは実装側からも確認できる。言語IDだけはこの行で固定値になっていない。現行(pf)も同じ振る舞い（pf-eccube3 app/Plugin/HareruyaEc/Repository/DtbBuyOrderRepository.php の3つ目のSELECTで bmc.language_id）だが、本書はリニューアル後の基本設計であり後者を優先する
- 確信度: med

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 8 | 0 | 0 | 0 | 8 |
| sheet-2 | 目次 | 19 | 0 | 0 | 0 | 19 |
| sheet-3 | 買取一覧(検索入力) | 118 | 0 | 5 | 0 | 113 |
| sheet-4 | 買取一覧(検索結果) | 107 | 0 | 4 | 0 | 103 |
| sheet-5 | 古物台帳入力用CSV出力項目 | 16 | 0 | 0 | 0 | 16 |
| sheet-6 | 入金CSV出力項目 | 11 | 0 | 1 | 0 | 10 |
| sheet-7 | 買取商品一覧CSV出力項目 | 10 | 0 | 4 | 0 | 6 |
| sheet-8 | 【新規】買取商品一覧（キャンセル）CSV出力項目 | 10 | 0 | 4 | 0 | 6 |
| sheet-9 | 【新規】戻しリストCSV出力 | 11 | 0 | 0 | 0 | 11 |
| sheet-10 | 【新規】戻しリストPDF出力 | 49 | 2 | 0 | 0 | 47 |
| sheet-11 | 買取情報編集 | 309 | 0 | 1 | 0 | 308 |
| sheet-12 | 手動メール通知(入力画面) | 37 | 0 | 1 | 0 | 36 |
| sheet-13 | 【新規】手動メール通知(確認画面) | 15 | 0 | 0 | 0 | 15 |
| sheet-14 | 【新規】買取商品履歴(検索入力) | 33 | 0 | 1 | 0 | 32 |
| sheet-15 | 【新規】買取商品履歴(検索結果) | 26 | 0 | 1 | 0 | 25 |
| sheet-16 | 【新規】買取商品履歴CSV出力 | 15 | 0 | 0 | 0 | 15 |
| sheet-17 | 別添資料_ネット買取管理ステータス | 189 | 0 | 1 | 0 | 188 |

