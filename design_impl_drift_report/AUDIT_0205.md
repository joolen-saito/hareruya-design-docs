# 実装乖離監査 — 0205_基本設計仕様書(店頭買取管理).html

- 正本: `excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **1018要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 23 | ○ |
| 実装違い | 実装はあるが設計と違う | 20 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 6 | — |
| 設計どおり | 設計どおり実装されている | 660 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 304 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 5 | — |
| **合計** | | **1018** | |

## 不具合 17件（P1 0 / P2 5 / P3 12）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 26件は重複として代表へ折り畳んだ（判定そのものは 43件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-10-R277 | 買取詳細 | 実装違い | ふるまい | P2 | 商品追加モーダルでカテゴリーを選んで検索すると、そのカテゴリー（配下を含む）に属する商品だけが一覧に出る。 |
| sheet-11-R044 | ステータス変更 | 実装違い | ふるまい | P2 | ステータス変更に伴う処理のどこかが失敗したときは、ステータスの変更も残らず、変更前の状態のままになる。 |
| sheet-12-R041 | 買取商品履歴(検索入力) | 実装違い | ふるまい | P2 | 買取日時の範囲検索では、買取キャンセルの買取情報はキャンセル日で、それ以外は買取成立日で絞り込まれる。 |
| sheet-4-R069 | 買取一覧(検索結果) | 未実装 | IO | P2 | 買取商品（キャンセル）CSVのリンクを押すと同CSVがダウンロードされる。 |
| sheet-9-R041 | 【新規】戻しリストPDF出力 | 未実装 | IO | P2 | 戻しリストの各ページに、リストを作成した日時が表示される。 |
| sheet-11-R041 | ステータス変更 | 実装違い | IO | P3 | 変更後のステータスの選択肢に、その買取が今持っているステータスは出ない。 |
| sheet-11-R048 | ステータス変更 | 実装違い | IO | P3 | ステータス変更では、買取情報の更新日時と最終更新者は変わらない。 |
| sheet-11-R051 | ステータス変更 | 実装違い | ふるまい | P3 | なりすましの疑いがある更新要求はアクセス拒否として扱われ、ステータス変更画面が開き直されることもない。 |
| sheet-12-R040 | 買取商品履歴(検索入力) | 未実装 | ふるまい | P3 | 買取日時のFromがToより後の日付のときは、検索を実行せずエラーを画面に表示する。 |
| sheet-12-R052 | 買取商品履歴(検索入力) | 実装違い | ふるまい | P3 | 買取商品履歴の検索画面を開き直したときは、前に使った検索条件・ページ番号・表示件数が捨てられ、次の検索は既定の表示件数で始まる。 |
| sheet-12-R071 | 買取商品履歴(検索入力) | 実装違い | IO | P3 | ダウンロードされるCSVのファイル名は otc_buy_order_detail_history_ に出力時刻（年月日時分秒）を付けたもの。 |
| sheet-13-R011 | 買取商品履歴(検索結果) | 実装違い | IO | P3 | CSVの申込者列には、一覧と同じく買取情報の姓と名を半角空白でつないだ値が出力される。会員に紐づかない買取でも空欄にならない。 |
| sheet-15-R014 | 買取集計データ(検索入力) | 実装違い | IO | P3 | 買取店舗の検索条件では店舗を1つだけ選べる。複数の店舗を同時に指定することはできない。 |
| sheet-3-R035 | 買取一覧(検索入力) | 未実装 | ふるまい | P3 | 査定申込日時のFromがToより後の日付のときは、検索を実行せずエラーを画面に表示する。 |
| sheet-3-R043 | 買取一覧(検索入力) | 実装違い | IO | P3 | チェックボックスの見出しは「戻し未完了のみ表示」と表示される。 |
| sheet-5-R008 | 古物台帳入力用CSV出力 | 実装違い | IO | P3 | 古物台帳入力用CSVの住所は、日本の住所のとき「県名・半角空白・住所1・半角空白・住所2・住所3」の並びで出力され、住所2と住所3の間には区切りの空白が入らない。 |
| sheet-6-R005 | 【新規】買取商品一覧CSV出力項目 | 実装違い | IO | P3 | 買取商品一覧CSVの基準価格の列には、商品規格に紐づく現在の基準価格を出す。ただし個別入力商品の行と、状態を持たない商品の行では、この列を空にする。 |

### sheet-10-R277 買取詳細 — 実装違い／ふるまい／P2

- 正本: sheet-10（買取詳細） HTML行 1995 付近
- 正本引用: 「・検索ボタンを押下すると、商品名・商品ID・商品コード、カテゴリーを条件として商品を検索できる。」
- 設計期待値: 商品追加モーダルでカテゴリーを選んで検索すると、そのカテゴリー（配下を含む）に属する商品だけが一覧に出る。
- 画像確認: sheet-10_img9.png のモーダル上部にカテゴリーの選択欄（「選択してください」）があり、検索条件として設計されていることを確認した。
- 実装参照: `src/Eccube/Controller/Admin/SearchProductController.php:84-87;src/Eccube/Repository/ProductRepository.php:1264-1281`
- 実装実態: モーダルの検索は選ばれたカテゴリーを1件のカテゴリとして渡す（src/Eccube/Controller/Admin/SearchProductController.php:84-87）が、絞り込み側は複数選択された集まりとして1件ずつ読み出す作りになっており（src/Eccube/Repository/ProductRepository.php:1266-1270）、対象が1件も取り出せないまま絞り込み条件が付かない。結果としてカテゴリーを選んでも全商品が返る。商品名・商品ID・商品コードの条件は効く（src/Eccube/Repository/ProductRepository.php:1254-1261）。
- 判定根拠: カテゴリー欄は画面にあり値も送られているのに（src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:446 と src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:614-624）、絞り込みに使われないため検索結果が変わらない。商品名・ID・コードの条件だけが効く。
- 確信度: med

### sheet-11-R044 ステータス変更 — 実装違い／ふるまい／P2

- 正本: sheet-11（ステータス変更） HTML行 2354 付近
- 正本引用: 「更新は一連の処理としてまとめて行い、途中で失敗したときは確定しない。」
- 設計期待値: ステータス変更に伴う処理のどこかが失敗したときは、ステータスの変更も残らず、変更前の状態のままになる。
- 画像確認: images/sheet-11_img1.png を確認。左に「査定番号／現在のステータス／変更後のステータス（ステータスを選択）」、右に現行の確定・戻るボタン、画面下部に新しい操作バー（左に「◀◀ 店頭買取詳細」、右に「保存」）が描かれている。実装の画面（src/Eccube/Resource/template/admin/OtcBuyOrder/status.twig:15-77）はこの下部バーの形に一致する。
- 実装参照: `src/Eccube/Service/Admin/OtcBuyOrder/UpdateStatusAction.php:110-125;src/Eccube/Service/Admin/OtcBuyOrder/RecalculateSummaryAction.php:33-55`
- 実装実態: ステータスと履歴の更新を確定（commit）した後で買取集計の作り直しを呼び出している（UpdateStatusAction.php:110-111 で確定し、118-125 で再集計）。そのため集計の作り直しが失敗しても、ステータス変更だけは確定したまま残る。再集計側は端数調整セクション未設定などで例外を投げうる（RecalculateSummaryAction.php:42-48、SummaryByDateAggregator.php:42-51）。
- 同じ実装実態でまとまる要求: sheet-11-R047（ステータス変更）
- 判定根拠: ステータス・日時・履歴・入庫はひとまとめに扱われ失敗時は元に戻るが、買取集計データの作り直しだけはステータス変更を確定させた後に行われるため、そこで失敗するとステータスだけが変わった状態が残る。
- 確信度: high

### sheet-12-R041 買取商品履歴(検索入力) — 実装違い／ふるまい／P2

- 正本: sheet-12（買取商品履歴(検索入力)） HTML行 2502 付近
- 正本引用: 「・買取成立の場合は買取成立日、買取キャンセル日の場合は買取キャンセル日を検索する」
- 設計期待値: 買取日時の範囲検索では、買取キャンセルの買取情報はキャンセル日で、それ以外は買取成立日で絞り込まれる。
- 画像確認: images/sheet-12_img1.png（店頭買取管理 買取商品履歴の検索フォーム）を確認。どの日付で検索するかは図に現れない。
- 実装参照: `src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:186-200;src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:103-122`
- 実装実態: 買取日時の絞り込みは常に買取成立日だけを見ており、買取キャンセルの買取情報をキャンセル日で拾わない。成立日を持たないキャンセル分は、期間を指定すると検索結果から漏れる。
- 判定根拠: src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:188-199 の条件は成立日のみで、キャンセル日を見る分岐が無い。買取一覧側 src/Eccube/Repository/DtbOtcBuyOrderRepository.php:141-164 には設計どおりの分岐があり、履歴側にだけ無い。
- 確信度: med

### sheet-4-R069 買取一覧(検索結果) — 未実装／IO／P2

- 正本: sheet-4（買取一覧(検索結果)） HTML行 1283 付近
- 正本引用: 「買取商品（キャンセル）CSVをダウンロードする」
- 設計期待値: 買取商品（キャンセル）CSVのリンクを押すと同CSVがダウンロードされる。
- 画像確認: images/sheet-4_img1.png の右上「ダウンロード」プルダウンと左下の枠に「古物台帳入力用CSV／買取商品一覧CSV／買取商品（キャンセル）CSV／戻しリストCSV／戻しリストPDF」の5件が描かれている。実装のプルダウンは4件で、買取商品（キャンセル）CSVだけが無い。
- 実装参照: `src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:33-75;src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:181-189`
- 実装実態: 店頭買取のダウンロードに用意されているのは古物台帳入力用CSV・買取商品一覧CSV・戻しリストCSV・戻しリストPDFの4種だけで、買取商品（キャンセル）に相当する出力口も抽出処理も無い。店頭買取の明細（dtb_otc_buy_order_detail）には明細単位のキャンセルを表す情報自体が無く、一部キャンセルの明細を選び出す手段が実装されていない（ネット買取側には BuyOrderProductListCsvExportService.php:47-95 にキャンセル分の出力がある）。
- 同じ実装実態でまとまる要求: sheet-7-R002（【新規】買取商品一覧（キャンセル）CSV出力項目 / 実装参照 `src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:33-75;src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:184-187`）、sheet-7-R003（【新規】買取商品一覧（キャンセル）CSV出力項目 / 実装参照 `src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:33-75;src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:184-187`）、sheet-7-R004（【新規】買取商品一覧（キャンセル）CSV出力項目 / 実装参照 `src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:33-75;src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:184-187`）、sheet-7-R005（【新規】買取商品一覧（キャンセル）CSV出力項目 / 実装参照 `src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:33-75;src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:184-187`）、sheet-7-R006（【新規】買取商品一覧（キャンセル）CSV出力項目 / 実装参照 `src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:33-75;src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:184-187`）、sheet-7-R007（【新規】買取商品一覧（キャンセル）CSV出力項目 / 実装参照 `src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:33-75;src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:184-187`）、sheet-7-R008（【新規】買取商品一覧（キャンセル）CSV出力項目 / 実装参照 `src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:33-75;src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:184-187`）、sheet-7-R009（【新規】買取商品一覧（キャンセル）CSV出力項目 / 実装参照 `src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:33-75;src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:184-187`）、sheet-7-R010（【新規】買取商品一覧（キャンセル）CSV出力項目 / 実装参照 `src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:33-75;src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:184-187`）、sheet-4-R010（買取一覧(検索結果)）、sheet-4-R022（買取一覧(検索結果) / 実装参照 `src/Eccube/Repository/DtbOtcBuyOrderRepository.php:422-559;src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:50-62`）、sheet-4-R024（買取一覧(検索結果)）、sheet-4-R025（買取一覧(検索結果)）、sheet-4-R026（買取一覧(検索結果)）、sheet-4-R027（買取一覧(検索結果)）、sheet-4-R028（買取一覧(検索結果)）、sheet-4-R029（買取一覧(検索結果)）
- 判定根拠: 項目表の識別ID:15に相当するリンクが画面に無い。
- 確信度: high

### sheet-9-R041 【新規】戻しリストPDF出力 — 未実装／IO／P2

- 正本: sheet-9（【新規】戻しリストPDF出力） HTML行 1556 付近
- 正本引用: 「ピッキングリストを作成した日時」
- 設計期待値: 戻しリストの各ページに、リストを作成した日時が表示される。
- 画像確認: sheet-9_img1〜4のいずれにも右上に「作成日：2025/05/28 21:51:25」が描かれている。画像で実在を確認した上での指摘。
- 実装参照: `src/Eccube/Resource/template/admin/Purchase/restock_list.twig:16-38; src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:763-766`
- 実装実態: src/Eccube/Resource/template/admin/Purchase/restock_list.twig には作成日時を出す要素が無く、src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:763-766 が渡すのは区分ごとの明細だけのため、印刷される戻しリストに作成日時が出ない。
- 同じ実装実態でまとまる要求: sheet-9-R042（【新規】戻しリストPDF出力）
- 判定根拠: src/Eccube/Resource/template/admin/Purchase/restock_list.twig 全体を確認したが作成日時に相当する出力が無い。同じ版面の受注ピッキングリスト(src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:42)には作成日の出力があり、戻しリストにだけ欠けている。
- 確信度: high

### sheet-11-R041 ステータス変更 — 実装違い／IO／P3

- 正本: sheet-11（ステータス変更） HTML行 2351 付近
- 正本引用: 「変更後ステータスの選択肢には、その買取が現在持っているステータスを出さない。」
- 設計期待値: 変更後のステータスの選択肢に、その買取が今持っているステータスは出ない。
- 画像確認: images/sheet-11_img1.png を確認。左に「査定番号／現在のステータス／変更後のステータス（ステータスを選択）」、右に現行の確定・戻るボタン、画面下部に新しい操作バー（左に「◀◀ 店頭買取詳細」、右に「保存」）が描かれている。実装の画面（src/Eccube/Resource/template/admin/OtcBuyOrder/status.twig:15-77）はこの下部バーの形に一致する。
- 実装参照: `src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderStatusType.php:50-63;src/Eccube/Resource/template/admin/OtcBuyOrder/status.twig:38-46`
- 実装実態: 選択肢から除くのは廃止ステータスだけで（OtcBuyOrderStatusType.php:57-62）、現在のステータスも選択肢に並ぶ。選んで保存しても日時は書き換えられない（DtbOtcBuyOrder.php:780-783）が、選択肢としては表示される。
- 判定根拠: 現在のステータスを選択肢から外す絞り込みが実装に無い。リニューアル後の仕様側にこれを覆す記述は無い。
- 確信度: high

### sheet-11-R048 ステータス変更 — 実装違い／IO／P3

- 正本: sheet-11（ステータス変更） HTML行 2358 付近
- 正本引用: 「ステータス変更では、店頭買取受注の更新日時と担当者を書き換えない。」
- 設計期待値: ステータス変更では、買取情報の更新日時と最終更新者は変わらない。
- 画像確認: images/sheet-11_img1.png を確認。左に「査定番号／現在のステータス／変更後のステータス（ステータスを選択）」、右に現行の確定・戻るボタン、画面下部に新しい操作バー（左に「◀◀ 店頭買取詳細」、右に「保存」）が描かれている。実装の画面（src/Eccube/Resource/template/admin/OtcBuyOrder/status.twig:15-77）はこの下部バーの形に一致する。
- 実装参照: `src/Eccube/Service/Admin/OtcBuyOrder/UpdateStatusAction.php:76-78;src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:226`
- 実装実態: ステータス変更のたびに買取情報の担当者をログイン中の担当者へ、更新日時を現在時刻へ書き換える（UpdateStatusAction.php:77-78）。買取一覧の最終更新者欄はこの担当者を表示するため（index.twig:226）、表示内容が変わる。
- 判定根拠: 金額の再計算・税計算を行わない点は設計どおりだが、更新日時と担当者は書き換えている。リニューアル後の仕様側にこれを覆す記述は無い。
- 確信度: high

### sheet-11-R051 ステータス変更 — 実装違い／ふるまい／P3

- 正本: sheet-11（ステータス変更） HTML行 2362 付近
- 正本引用: 「なりすまし対策トークンが一致しないときアクセス拒否として扱い、更新しない」
- 設計期待値: なりすましの疑いがある更新要求はアクセス拒否として扱われ、ステータス変更画面が開き直されることもない。
- 画像確認: images/sheet-11_img1.png を確認。左に「査定番号／現在のステータス／変更後のステータス（ステータスを選択）」、右に現行の確定・戻るボタン、画面下部に新しい操作バー（左に「◀◀ 店頭買取詳細」、右に「保存」）が描かれている。実装の画面（src/Eccube/Resource/template/admin/OtcBuyOrder/status.twig:15-77）はこの下部バーの形に一致する。
- 実装参照: `src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:381-436;src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderStatusType.php:37-42`
- 実装実態: ステータス更新は画面の入力チェックと同じ扱いでなりすまし対策の検証を行うため（OtcBuyOrderController.php:396-400、OtcBuyOrderStatusType.php:37-42）、検証に通らない要求はアクセス拒否にならず、ステータス変更画面がそのまま表示し直される（OtcBuyOrderController.php:432-435）。更新自体は行われない。
- 同じ実装実態でまとまる要求: sheet-11-R055（ステータス変更）
- 判定根拠: 更新しない点は保たれているが、アクセス拒否ではなくステータス変更画面の再表示になる。経理払い出し済・入庫済みの操作では拒否扱い（OtcBuyOrderController.php:449-455）で、同じ画面内でも扱いが揃っていない。
- 確信度: high

### sheet-12-R040 買取商品履歴(検索入力) — 未実装／ふるまい／P3

- 正本: sheet-12（買取商品履歴(検索入力)） HTML行 2501 付近
- 正本引用: 「・買取日時(From)>買取日時(To)の場合エラー ・買取成立の場合は買取成立日、買取キャンセル日の場合は買取キャンセル日を検索する」
- 設計期待値: 買取日時のFromがToより後の日付のときは、検索を実行せずエラーを画面に表示する。
- 画像確認: images/sheet-12_img1.png（店頭買取管理 買取商品履歴の検索フォーム）を確認。買取日時の From/To 欄は描かれているが、エラー表示は図に含まれない。
- 実装参照: `src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:103-122;src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig:98-106`
- 実装実態: 買取日時のFromとToを比べる検証が無く、From>Toでも検索が実行されて該当0件の表示になるだけでエラーにならない。
- 判定根拠: src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:103-112（From）と src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:113-122（To）に範囲の相互チェックは無く、フォーム全体にも比較の検証は無い。src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:187-200 も From>To をそのまま範囲条件にする。
- 確信度: high

### sheet-12-R052 買取商品履歴(検索入力) — 実装違い／ふるまい／P3

- 正本: sheet-12（買取商品履歴(検索入力)） HTML行 2517 付近
- 正本引用: 「検索画面を開いたときは、保持していた検索条件・ページ番号・表示件数を破棄し、一覧を表示しない。表示件数は既定値に戻る。」
- 設計期待値: 買取商品履歴の検索画面を開き直したときは、前に使った検索条件・ページ番号・表示件数が捨てられ、次の検索は既定の表示件数で始まる。
- 画像確認: images/sheet-12_img1.png（店頭買取管理 買取商品履歴の検索フォーム）を確認。保持値の扱いは図に現れない。
- 実装参照: `src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderHistoryController.php:80-127;src/Eccube/Controller/Admin/SearchControllerTrait.php:100-215`
- 実装実態: 初期表示では一覧を出さず表示件数欄も既定値を返すが、前回の検索条件・ページ番号・表示件数は保持されたままで捨てられない。そのため画面を開き直して検索すると、既定件数ではなく前回選んだ表示件数のまま一覧が出る。
- 同じ実装実態でまとまる要求: sheet-3-R052（買取一覧(検索入力) / 実装参照 `src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:108-158;src/Eccube/Controller/Admin/SearchControllerTrait.php:100-215`）
- 判定根拠: src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderHistoryController.php:101-121 の初期表示は空フォームを返すだけで保持値を消していない。次の検索で src/Eccube/Controller/Admin/SearchControllerTrait.php:154-166 が保持している表示件数を優先して使う。現行(pf-eccube3)の初期表示は保持値を消してから画面を出していた。
- 確信度: med

### sheet-12-R071 買取商品履歴(検索入力) — 実装違い／IO／P3

- 正本: sheet-12（買取商品履歴(検索入力)） HTML行 2537 付近
- 正本引用: 「ファイル名は otc_buy_order_detail_history_ に出力時刻（年月日時分秒）を付けたCSVとする。」
- 設計期待値: ダウンロードされるCSVのファイル名は otc_buy_order_detail_history_ に出力時刻（年月日時分秒）を付けたもの。
- 画像確認: images/sheet-12_img1.png（店頭買取管理 買取商品履歴の検索フォーム）を確認。ファイル名は図に現れない。
- 実装参照: `src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:101-106`
- 実装実態: ファイル名が otc_buy_order_history_ + 年月日時分秒 + .csv になっており、設計・現行(pf-eccube3)の otc_buy_order_detail_history_ と接頭辞が異なる。
- 判定根拠: src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:102 が 'otc_buy_order_history_' を接頭辞にしており、src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:104 でその名前を添付ファイル名として返す。現行 pf-eccube3 は otc_buy_order_detail_history_ を使っていた。
- 確信度: high

### sheet-13-R011 買取商品履歴(検索結果) — 実装違い／IO／P3

- 正本: sheet-13（買取商品履歴(検索結果)） HTML行 2612 付近
- 正本引用: 「・会員ID、申込者、基準価格、買取価格を出力可能とする」
- 設計期待値: CSVの申込者列には、一覧と同じく買取情報の姓と名を半角空白でつないだ値が出力される。会員に紐づかない買取でも空欄にならない。
- 画像確認: sheet-13_img1で一覧の申込者に「テスト 会員1」等が表示されることを確認。CSVレイアウトの画像は本シートに無い。
- 実装参照: `src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:351-368; src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:37-38`
- 実装実態: src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:354 はCSVの申込者を買取情報に紐づく会員の氏名から作っており、会員が紐づいていない買取では空欄になる。一覧(src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig:228)は買取情報側の姓・名を表示しているため、同じ買取でも画面とCSVで申込者が食い違う。
- 判定根拠: 会員ID・基準価格・買取価格の3列は src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:37-42 で出力されている。申込者だけ出所が一覧と異なり、買取情報の会員参照は任意（src/Eccube/Entity/DtbOtcBuyOrder.php:201-203）である一方、姓・名は買取情報自身が必須で保持している（src/Eccube/Entity/DtbOtcBuyOrder.php:58-59）。
- 確信度: med

### sheet-15-R014 買取集計データ(検索入力) — 実装違い／IO／P3

- 正本: sheet-15（買取集計データ(検索入力)） HTML行 2744 付近
- 正本引用: 「4 買取店舗 単一選択(セレクトボックス) - - ログインしているメンバーのデフォルト検索表示店舗 ・リスト内容は店舗マスタから取得」
- 設計期待値: 買取店舗の検索条件では店舗を1つだけ選べる。複数の店舗を同時に指定することはできない。
- 画像確認: sheet-15_img1の買取店舗欄は空の入力枠1つで、複数選択かどうかは画像からは判別できない。判定は項目定義の書式欄による。
- 実装参照: `src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderSummaryType.php:68-74; src/Eccube/Resource/template/admin/OtcBuyOrder/summary.twig:42-48; html/template/admin/assets/js/OtcBuyOrder/otc-buy-order-summary.js:9-11`
- 実装実態: src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderSummaryType.php:71 で買取店舗欄が複数選択として定義されており、src/Eccube/Resource/template/admin/OtcBuyOrder/summary.twig:45 と html/template/admin/assets/js/OtcBuyOrder/otc-buy-order-summary.js:9-11 が複数選択のセレクトボックスとして描画するため、利用者は複数店舗を同時に指定できる。絞り込みも src/Eccube/Repository/DtbOtcBuyOrderSummaryRepository.php:56-62 で複数店舗を受け付ける。
- 判定根拠: 同じ検索欄の部門は識別ID3で複数選択と明記され実装も複数選択だが、買取店舗は識別ID4で単一選択と明記されている（識別ID3には2026/7/17の書式修正注記があり、書式は意識して書き分けられている）。初期値がデフォルト検索表示店舗である点は src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderSummaryType.php:73 で満たしている。
- 確信度: med

### sheet-3-R035 買取一覧(検索入力) — 未実装／ふるまい／P3

- 正本: sheet-3（買取一覧(検索入力)） HTML行 1106 付近
- 正本引用: 「・査定申込日時(From)>査定申込日時(To)の場合エラー ・1か月前の日付の0時を初期表示する」
- 設計期待値: 査定申込日時のFromがToより後の日付のときは、検索を実行せずエラーを画面に表示する。
- 画像確認: images/sheet-3_img1.png（店頭買取管理 買取一覧の検索フォーム）を確認。査定申込日時のFrom/To欄は描かれているが、エラー表示は図に含まれない。
- 実装参照: `src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:155-182;src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:96-106`
- 実装実態: 査定申込日時のFromとToを比べる検証は無く、From>Toでも検索が実行され、該当0件として「検索条件に該当するデータがありませんでした。」が出るだけでエラーにならない。日付項目に付いているのは古すぎる日付を弾く下限チェックのみ。
- 同じ実装実態でまとまる要求: sheet-3-R038（買取一覧(検索入力) / 実装参照 `src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:96-121;src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:107-117`）
- 判定根拠: src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:155-171 と src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:172-182 の各項目には下限日付(src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:166-170)以外の検証が無く、フォーム全体にもFrom/Toを比較する検証は無い。検索処理 src/Eccube/Repository/DtbOtcBuyOrderRepository.php:124-139 も From>To をそのまま範囲条件にする。なお同じ行の初期値「1か月前」は sheet-3-R036 で設計矛盾として別に挙げた。
- 確信度: high

### sheet-3-R043 買取一覧(検索入力) — 実装違い／IO／P3

- 正本: sheet-3（買取一覧(検索入力)） HTML行 1114 付近
- 正本引用: 「14 戻し未完了のみ表示 単一選択(チェックボックス) - - - 棚戻し済みフラグが立っていないもののみ検索対象にする」
- 設計期待値: チェックボックスの見出しは「戻し未完了のみ表示」と表示される。
- 画像確認: images/sheet-3_img1.png（店頭買取管理 買取一覧の検索フォーム）を確認。チェックボックスのラベルは「戻し未完了のみ表示」と描かれており、実装文言と異なる。
- 実装参照: `src/Eccube/Resource/locale/messages.ja.yaml:5564;src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:128-137;src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:183-187`
- 実装実態: 画面に出る文言は「棚戻し未完了のみ表示」で、設計・レイアウト図の「戻し未完了のみ表示」と1文字（棚）違う。絞り込みの動作自体は設計どおり。
- 判定根拠: src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:132-133 がラベルを翻訳キー admin.purchase.store.form.restock_incomplete_only.label から描画し、その文言が src/Eccube/Resource/locale/messages.ja.yaml:5564 で「棚戻し未完了のみ表示」になっている。絞り込みは src/Eccube/Repository/DtbOtcBuyOrderRepository.php:276-282 で設計どおり。
- 確信度: high

### sheet-5-R008 古物台帳入力用CSV出力 — 実装違い／IO／P3

- 正本: sheet-5（古物台帳入力用CSV出力） HTML行 1340 付近
- 正本引用: 「日本の場合は県名 + 半角空白 + 住所1 + 半角空白 + 住所2 + 住所3 海外の場合は国名 + 半角空白 + 住所3 + 半角空白 + 住所2 + 住所1　2026/5/11木村：海外は住所3,2,1の順に変更」
- 設計期待値: 古物台帳入力用CSVの住所は、日本の住所のとき「県名・半角空白・住所1・半角空白・住所2・住所3」の並びで出力され、住所2と住所3の間には区切りの空白が入らない。
- 画像確認: 本シートに添付画像は無い（images/ に該当シートの img ファイルが存在しない）
- 実装参照: `src/Eccube/Repository/DtbOtcBuyOrderRepository.php:340`
- 実装実態: 県名・住所1・住所2・住所3の4つを一律に半角空白でつないで出力しているため、住所2と住所3の間にも半角空白が1つ入る。
- 同じ実装実態でまとまる要求: sheet-5-R009（古物台帳入力用CSV出力 / 実装参照 `src/Eccube/Repository/DtbOtcBuyOrderRepository.php:341`）
- 判定根拠: 日本の住所では、実装は県名・住所1・住所2・住所3を一律に半角空白でつないでいる（src/Eccube/Repository/DtbOtcBuyOrderRepository.php:340）。設計は住所2と住所3の間に区切りを置いていないため、出力される住所文字列に余分な半角空白が1つ入る。列自体は存在し、県名から始まる並び順は設計どおり。
- 確信度: med

### sheet-6-R005 【新規】買取商品一覧CSV出力項目 — 実装違い／IO／P3

- 正本: sheet-6（【新規】買取商品一覧CSV出力項目） HTML行 1380 付近
- 正本引用: 「商品規格に紐づく現在の基準価格、個別入力商品または状態がない場合は何も出力しない」
- 設計期待値: 買取商品一覧CSVの基準価格の列には、商品規格に紐づく現在の基準価格を出す。ただし個別入力商品の行と、状態を持たない商品の行では、この列を空にする。
- 画像確認: sheet-6 は画像0枚（sheets.tsv の画像欄0／images/ に sheet-6_img* が無い）。レイアウト図なしの項目表のみのシート。
- 実装参照: `src/Eccube/Repository/DtbOtcBuyOrderRepository.php:507`
- 実装実態: 個別入力商品の行は空になる（src/Eccube/Repository/DtbOtcBuyOrderRepository.php:482）が、状態を持たない通常商品の行は商品規格の基準価格をそのまま出力しており空にならない（src/Eccube/Repository/DtbOtcBuyOrderRepository.php:507）。同じ様式に揃えるとされているネット買取の買取商品一覧CSVでは、同じ区分の行の基準価格を空にしている（src/Eccube/Repository/DtbBuyOrderRepository.php:641）。
- 同じ実装実態でまとまる要求: sheet-6-R007（【新規】買取商品一覧CSV出力項目 / 実装参照 `src/Eccube/Repository/DtbOtcBuyOrderRepository.php:509`）、sheet-6-R008（【新規】買取商品一覧CSV出力項目 / 実装参照 `src/Eccube/Repository/DtbOtcBuyOrderRepository.php:510`）、sheet-6-R009（【新規】買取商品一覧CSV出力項目 / 実装参照 `src/Eccube/Repository/DtbOtcBuyOrderRepository.php:511`）
- 判定根拠: 店頭買取一覧の買取商品一覧CSVは3区分（状態を持つ通常商品／個別入力商品／状態を持たない通常商品）を積み上げて出力する。個別入力商品の区分は設計どおり該当列を空・言語ID=1にしているが、状態を持たない通常商品の区分だけ同じ扱いになっていない。基準価格については、揃える先とされたネット買取側が明示的に空にしているのに対し、店頭買取側だけ値が出る。
- 確信度: high

## 掲載しなかった判定

- 実装実態が空欄の判定 6件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0205/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 6 | 0 | 0 | 0 | 6 |
| sheet-2 | 目次 | 20 | 0 | 0 | 0 | 20 |
| sheet-3 | 買取一覧(検索入力) | 90 | 2 | 2 | 1 | 85 |
| sheet-4 | 買取一覧(検索結果) | 74 | 9 | 0 | 0 | 65 |
| sheet-5 | 古物台帳入力用CSV出力 | 14 | 0 | 2 | 0 | 12 |
| sheet-6 | 【新規】買取商品一覧CSV出力項目 | 10 | 0 | 4 | 0 | 6 |
| sheet-7 | 【新規】買取商品一覧（キャンセル）CSV出力項目 | 10 | 9 | 0 | 0 | 1 |
| sheet-8 | 【新規】戻しリストCSV出力 | 11 | 0 | 0 | 0 | 11 |
| sheet-9 | 【新規】戻しリストPDF出力 | 53 | 2 | 0 | 0 | 51 |
| sheet-10 | 買取詳細 | 338 | 0 | 1 | 3 | 334 |
| sheet-11 | ステータス変更 | 63 | 0 | 6 | 1 | 56 |
| sheet-12 | 買取商品履歴(検索入力) | 78 | 1 | 3 | 1 | 73 |
| sheet-13 | 買取商品履歴(検索結果) | 37 | 0 | 1 | 0 | 36 |
| sheet-14 | 買取商品履歴CSV出力 | 13 | 0 | 0 | 0 | 13 |
| sheet-15 | 買取集計データ(検索入力) | 36 | 0 | 1 | 0 | 35 |
| sheet-16 | 買取集計データ(検索結果) | 27 | 0 | 0 | 0 | 27 |
| sheet-17 | 買取集計データCSV出力 | 24 | 0 | 0 | 0 | 24 |
| sheet-18 | 別添資料_店頭買取管理ステータス | 114 | 0 | 0 | 0 | 114 |

