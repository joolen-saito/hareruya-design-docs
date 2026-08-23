# 実装乖離監査 — 0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html

- 正本: `excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **707要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 4 | ○ |
| 実装違い | 実装はあるが設計と違う | 23 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 3 | — |
| 設計どおり | 設計どおり実装されている | 419 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 249 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 9 | — |
| **合計** | | **707** | |

## 不具合 18件（P1 0 / P2 6 / P3 12）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 9件は重複として代表へ折り畳んだ（判定そのものは 27件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-13-R038 | 入荷通知依頼 一覧表示(検索項目) | 実装違い | ふるまい | P2 | キーワード検索に半角空白・全角空白・カンマ区切りで複数語を入れると、入力した語をすべて含むものだけが部分一致で絞り込まれる。 |
| sheet-15-R022 | 入荷通知依頼 CSV出力 | 実装違い | ふるまい | P2 | 5列目には、検索条件に該当する商品ごとに、入荷通知を受け取った件数と会員自身が通知の取り消しを行った件数を合わせた数を出力する。 |
| sheet-3-R054 | 日別・月別集計 集計一覧(検索項目-日別) | 未実装 | IO | P2 | 集計対象期間に含まれるすべての日付（月別のときは月）が一覧に並び、該当する集計結果が無い日付も各数値列を0とした行として表示される。 |
| sheet-5-R027 | 日別・月別集計 集計一覧(検索結果-日別) | 実装違い | IO | P2 | 廃棄の列には、廃棄となった在庫の原価を合計した金額が出力される。 |
| sheet-6-R011 | 日別・月別集計 集計一覧(検索結果-月別) | 実装違い | IO | P2 | 店舗名の列に「通販」または指定された店舗名を出力し、通販・各店舗のいずれにも該当しない売上は「その他」という名前の行として出力する。 |
| sheet-6-R022 | 日別・月別集計 集計一覧(検索結果-月別) | 実装違い | IO | P2 | 廃棄の列には、在庫変動区分が廃棄となっているものの廃棄コストの合計金額を出力する。 |
| sheet-13-R022 | 入荷通知依頼 一覧表示(検索項目) | 実装違い | ふるまい | P3 | 検索条件をクリアを押すと、依頼日From/Toは当月1日・当月末日、並び順は昇順、表示件数は既定値といった各項目の初期値に戻る。 |
| sheet-13-R037 | 入荷通知依頼 一覧表示(検索項目) | 実装違い | ふるまい | P3 | 販売金額(To)に指定した金額とちょうど同額の商品は検索結果に含まれない。 |
| sheet-14-R022 | 入荷通知依頼 一覧表示(検索結果) | 実装違い | IO | P3 | 結果表の5列目の見出しは「通知済/削除」と表示される。 |
| sheet-16-R021 | フォーマット売上分析 集計一覧(検索項目) | 実装違い | ふるまい | P3 | 集計月を選んだ時点で、検索ボタンを押さなくても集計が走り、グラフと表が表示される。 |
| sheet-16-R029 | フォーマット売上分析 集計一覧(検索項目) | 実装違い | IO | P3 | 平均表の「今月平均」は、表に並んだ各フォーマットの平均を合算した値になる。 |
| sheet-16-R033 | フォーマット売上分析 集計一覧(検索項目) | 実装違い | IO | P3 | 折れ線グラフの上に「<年>年<月>月 日別売上」という表題が出る。 |
| sheet-19-R009 | 特集タグ編集CSVダウンロード(検索項目) | 実装違い | IO | P3 | 画面を開いたとき、集計日(From)に当月1日が入っている。 |
| sheet-4-R017 | 日別・月別集計 集計一覧(検索項目-月別) | 未実装 | ふるまい | P3 | 検索項目の店舗一覧に載せる店舗を、店舗管理側の売上集計用の項目で店舗ごとに切り替えられる。 |
| sheet-5-R024 | 日別・月別集計 集計一覧(検索結果-日別) | 実装違い | IO | P3 | 取引単価(平均)は総売上を取引数で割った値を小数点第一位で四捨五入した整数として出力される。 |
| sheet-7-R033 | 日別・月別集計 CSV出力 | 未実装 | IO | P3 | CSVの最終行に、総売上から欠品までの各列それぞれの総合計を並べた「総合計」の行を出力する。 |
| sheet-7-R041 | 日別・月別集計 CSV出力 | 実装違い | IO | P3 | ダウンロードされるファイルの名前が report_summary_ に出力日時（YmdHis）を付けた .csv になる。 |
| sheet-8-R063 | 受注売上分析 集計一覧(検索項目) | 実装違い | ふるまい | P3 | 集計日(To)に指定した日時ちょうどの受注は集計に含まれず、その直前までが集計対象になる。 |

### sheet-13-R038 入荷通知依頼 一覧表示(検索項目) — 実装違い／ふるまい／P2

- 正本: sheet-13（入荷通知依頼 一覧表示(検索項目)） HTML行 2154 付近
- 正本引用: 「半角空白・全角空白・カンマで区切って複数語を指定でき、指定した語をすべて満たすものを部分一致で絞り込む」
- 設計期待値: キーワード検索に半角空白・全角空白・カンマ区切りで複数語を入れると、入力した語をすべて含むものだけが部分一致で絞り込まれる。
- 画像確認: sheet-13_img1.png を確認。上部にキーワード検索(プレースホルダ「商品名(日/英)・会員名」)と検索枠の表示・非表示ボタン(−)、依頼日 2025-07-01〜2025-07-31、販売金額 300〜5000、言語(日本語/英語/その他言語のチェックボックス)、並べ替え(指定なしのリストボックス＋昇順/降順ラジオ)、表示件数(10のリストボックス)、売上分析タグのテキストボックス、「検索条件をクリア」リンク、「検索する >」ボタン。 キーワード検索欄は1つのテキストボックスで、複数語の指定可否は図からは読めない。
- 実装参照: `src/Eccube/Repository/DtbProductRequestRepository.php:404-408`
- 実装実態: 入力文字列を区切らずそのまま1つの部分一致条件にしているため、複数語を入れると入力どおりの並びを含むものしか一致せず、語順が違うものや語の間に別の文字があるものは0件になる。
- 判定根拠: キーワードは前後の空白を落としただけの文字列を1つの部分一致条件に使っている（src/Eccube/Repository/DtbProductRequestRepository.php:404-408）。区切って複数条件にする処理が無いため、「青 ドラゴン」と入れると商品名に「青 ドラゴン」という並びを含むものだけが対象になる。
- 確信度: high

### sheet-15-R022 入荷通知依頼 CSV出力 — 実装違い／ふるまい／P2

- 正本: sheet-15（入荷通知依頼 CSV出力） HTML行 2322 付近
- 正本引用: 「検索項目で指定した条件に該当する商品ごとの通知済みもしくはユーザー自身が通知取り消しを行った件数を取得」
- 設計期待値: 5列目には、検索条件に該当する商品ごとに、入荷通知を受け取った件数と会員自身が通知の取り消しを行った件数を合わせた数を出力する。
- 画像確認: 本シートに画像は無い（画像0枚）。
- 実装参照: `src/Eccube/Repository/DtbProductRequestRepository.php:387;src/Eccube/Service/Csv/Exporter/ProductRequestCsvExportService.php:29`
- 実装実態: src/Eccube/Repository/DtbProductRequestRepository.php:387 は「その商品を依頼した会員の総数 − 通知待ちの会員数」を出しており、削除日時が入った依頼だけを数える。通知を送っても依頼の状態は変わらない（src/Eccube/Service/Stock/RestockNotificationMailSender.php:153 は送信後に何も更新しない）ため、通知済みは1件も数に入らない。逆に、管理側の一括取り消し（src/Eccube/Repository/DtbProductRequestRepository.php:566）で削除されたものは会員自身の取り消しでなくても数に入る。
- 同じ実装実態でまとまる要求: sheet-15-R006（入荷通知依頼 CSV出力 / 実装参照 `src/Eccube/Service/Csv/Exporter/ProductRequestCsvExportService.php:29`）
- 判定根拠: 入荷通知の依頼（src/Eccube/Entity/DtbProductRequest.php:50 以降）が持つのは作成日時と削除日時だけで、通知したことを表す項目が無い。そのため通知済みの件数は集計できず、src/Eccube/Repository/DtbProductRequestRepository.php:387 が数えるのは論理削除された依頼のみ。正本が求める「通知済みもしくはユーザー自身が通知取り消しを行った件数」と一致しない。
- 確信度: med

### sheet-3-R054 日別・月別集計 集計一覧(検索項目-日別) — 未実装／IO／P2

- 正本: sheet-3（日別・月別集計 集計一覧(検索項目-日別)） HTML行 1140 付近
- 正本引用: 「集計対象期間に含まれる日付（月別のときは月）のうち、該当する集計結果が無いものも、各列を 0 とした行として一覧に補う」
- 設計期待値: 集計対象期間に含まれるすべての日付（月別のときは月）が一覧に並び、該当する集計結果が無い日付も各数値列を0とした行として表示される。
- 画像確認: 画像1(日時・月次集計 検索項目のレイアウト図)を確認。集計タイプ(日次/月次のラジオ)・集計日(2025-07-01～2025-07-31)・集計対象(通販売上枠の「通販」/店舗売上枠の「全店舗チェック」と店舗毎チェックボックス)・検索するボタン・検索枠表示非表示ボタンの配置と文言を照合した。図の注記(D7)には集計対象の判定条件(通販売上=配送方法が店頭受取以外かつなし以外で対応状況が出荷完了、店舗売上=配送方法が店頭受取またはなし、対象店舗=店舗登録画面の公開状態が公開)が書かれている。 レイアウト図は検索項目のみで、一覧の行構成は示されていない。
- 実装参照: `src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:70-119;src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:126-173;src/Eccube/Repository/DtbDailySummaryRepository.php:459-501`
- 実装実態: src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:70-119 と src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:126-173 は保存済みの集計データから取得できた行をそのまま一覧に渡すだけで、期間内で集計データが無い日付（月）を0行として補う処理が無い。src/Eccube/Repository/DtbDailySummaryRepository.php:459-501 も期間内の日付を作らず、存在する集計行だけを返す。結果として売上が無い日付は一覧から抜け落ちる。
- 判定根拠: 0埋め行を作る処理を集計結果の組み立て(src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:47-63)・日別取得(src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:70-119)・月別取得(src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:126-173)・取得クエリ(src/Eccube/Repository/DtbDailySummaryRepository.php:459-501)のいずれにも見つけられなかった。日付の連続生成に相当する処理も無い。カスタマイズ要件は集計方式（出荷完了のみ・バッチ事前作成）と検索項目の変更だけを挙げており、この0埋め行の補完を廃止するとは書かれていないため、現行踏襲の対象として扱った。
- 確信度: med

### sheet-5-R027 日別・月別集計 集計一覧(検索結果-日別) — 実装違い／IO／P2

- 正本: sheet-5（日別・月別集計 集計一覧(検索結果-日別)） HTML行 1360 付近
- 正本引用: 「・識別ID 11: 「廃棄」を追加。在庫変動区分が「廃棄」となっているものを集計し廃棄コスト合計を出力」
- 設計期待値: 廃棄の列には、廃棄となった在庫の原価を合計した金額が出力される。
- 画像確認: sheet-5_img1.png を確認。集計日/店舗名/総売上/原価/粗利益高/販売点数/取引数/取引単価(平均)/買取件数/買取金額/廃棄/欠品の12列＋csvダウンロードリンク＋最下段の総合計行、店舗名欄に通販・TC東京・TC大阪・仙台・秋葉原・日本橋・その他が並ぶ図。 廃棄列は1200・1090などの整数、総合計70990。単位の記載は図に無い。
- 実装参照: `src/Eccube/Repository/DtbDailySummaryRepository.php:314;src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:113`
- 実装実態: 廃棄の列は在庫変動履歴の増減数（点数）を符号反転して合計した値であり、原価を掛けた金額になっていない。
- 同じ実装実態でまとまる要求: sheet-5-R029（日別・月別集計 集計一覧(検索結果-日別) / 実装参照 `src/Eccube/Repository/DtbDailySummaryRepository.php:353;src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:114`）
- 判定根拠: 廃棄集計は増減数(stock_change_quantity)だけを合算しており（src/Eccube/Repository/DtbDailySummaryRepository.php:314）、一覧もその値をそのまま表示する（src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:113）。在庫変動履歴は原価単価・総原価の項目を保持しているため（src/Eccube/Entity/DtbStockHistory.php:137-193）、金額での集計は可能。同じ文言はカスタマイズ説明の他シート（sheet-6/sheet-7）にも同一で現れ、コスト合計であることは正本内で一貫している。
- 確信度: high

### sheet-6-R011 日別・月別集計 集計一覧(検索結果-月別) — 実装違い／IO／P2

- 正本: sheet-6（日別・月別集計 集計一覧(検索結果-月別)） HTML行 1453 付近
- 正本引用: 「・識別ID 2: 「支店名」を追加。「通販」もしくは指定された「店舗名」または「その他」を出力」
- 設計期待値: 店舗名の列に「通販」または指定された店舗名を出力し、通販・各店舗のいずれにも該当しない売上は「その他」という名前の行として出力する。
- 画像確認: 画像 sheet-6_img1.png を確認。集計月／店舗名／総売上／原価／粗利益高／販売点数／取引数／取引単価(平均)／買取件数／買取金額／廃棄／欠品の12列と、右上「CSVダウンロード」、最下行「総合計」が描かれている。 画像の明細にも「その他」行が2025/05・2025/07の各集計月に描かれており、通販・各店舗と並ぶ独立した行であることが確認できる。
- 実装参照: `src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:262;src/Eccube/Repository/DtbDailySummaryRepository.php:86`
- 実装実態: src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:262 は通販か店舗名のいずれかしか返さず、「その他」を返す分岐が無い。集計元でも src/Eccube/Repository/DtbDailySummaryRepository.php:86 が店舗の紐づかない受注を対象から外しており、通販・各店舗に該当しない売上を集める行が存在しない。
- 同じ実装実態でまとまる要求: sheet-6-R012（日別・月別集計 集計一覧(検索結果-月別) / 実装参照 `src/Eccube/Repository/DtbDailySummaryRepository.php:86;src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:262`）、sheet-7-R020（日別・月別集計 CSV出力）、sheet-7-R021（日別・月別集計 CSV出力 / 実装参照 `src/Eccube/Repository/DtbDailySummaryRepository.php:86;src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:262`）
- 判定根拠: 店舗名列の値は src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:262 の3分岐（通販／店舗の略称／店舗名）だけで、「その他」は実装のどこにも現れない。集計の作成側（src/Eccube/Repository/DtbDailySummaryRepository.php:86）も店舗が定まらない受注を除外するため、該当しない売上を受け取る行が生まれない。
- 確信度: high

### sheet-6-R022 日別・月別集計 集計一覧(検索結果-月別) — 実装違い／IO／P2

- 正本: sheet-6（日別・月別集計 集計一覧(検索結果-月別)） HTML行 1464 付近
- 正本引用: 「・識別ID 11: 「廃棄」を追加。在庫変動区分が「廃棄」となっているものを集計し廃棄コスト合計を出力」
- 設計期待値: 廃棄の列には、在庫変動区分が廃棄となっているものの廃棄コストの合計金額を出力する。
- 画像確認: 画像 sheet-6_img1.png を確認。集計月／店舗名／総売上／原価／粗利益高／販売点数／取引数／取引単価(平均)／買取件数／買取金額／廃棄／欠品の12列と、右上「CSVダウンロード」、最下行「総合計」が描かれている。 画像の廃棄は142540・2633472といった金額の桁で、同じ行の販売点数（7565）とは桁が合わないため、数量ではなく金額の合計が期待されていることが読み取れる。
- 実装参照: `src/Eccube/Repository/DtbDailySummaryRepository.php:308;src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:113`
- 実装実態: src/Eccube/Repository/DtbDailySummaryRepository.php:308 は在庫変動の増減数を合算しており、原価に相当する金額を一切参照しない。src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:113 はその数量をそのまま廃棄列に載せる。
- 同じ実装実態でまとまる要求: sheet-7-R031（日別・月別集計 CSV出力 / 実装参照 `src/Eccube/Repository/DtbDailySummaryRepository.php:308;src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:121`）、sheet-6-R023（日別・月別集計 集計一覧(検索結果-月別) / 実装参照 `src/Eccube/Repository/DtbDailySummaryRepository.php:353;src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:114`）、sheet-7-R032（日別・月別集計 CSV出力 / 実装参照 `src/Eccube/Repository/DtbDailySummaryRepository.php:353;src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:122`）
- 判定根拠: 廃棄列の値は src/Eccube/Repository/DtbDailySummaryRepository.php:308 の増減数合計（数量）で、コスト金額ではない。在庫履歴には原価単価・総原価の項目（src/Eccube/Entity/DtbStockHistory.php:137 / :167）があるが集計に使われていない。
- 確信度: med

### sheet-13-R022 入荷通知依頼 一覧表示(検索項目) — 実装違い／ふるまい／P3

- 正本: sheet-13（入荷通知依頼 一覧表示(検索項目)） HTML行 2134 付近
- 正本引用: 「識別ID 1～12(2を除く) の入力内容をすべて初期値に戻す」
- 設計期待値: 検索条件をクリアを押すと、依頼日From/Toは当月1日・当月末日、並び順は昇順、表示件数は既定値といった各項目の初期値に戻る。
- 画像確認: sheet-13_img1.png を確認。上部にキーワード検索(プレースホルダ「商品名(日/英)・会員名」)と検索枠の表示・非表示ボタン(−)、依頼日 2025-07-01〜2025-07-31、販売金額 300〜5000、言語(日本語/英語/その他言語のチェックボックス)、並べ替え(指定なしのリストボックス＋昇順/降順ラジオ)、表示件数(10のリストボックス)、売上分析タグのテキストボックス、「検索条件をクリア」リンク、「検索する >」ボタン。 図の依頼日は2025-07-01〜2025-07-31（当月1日〜当月末日）が入った状態で描かれている。
- 実装参照: `src/Eccube/Resource/template/admin/Analysis/product_request.twig:15-18;src/Eccube/Resource/template/admin/Analysis/product_request.twig:102-104;html/template/admin/assets/js/function.js:187-201`
- 実装実態: クリアの共通処理は検索枠内の入力欄・選択欄を空にするだけで（html/template/admin/assets/js/function.js:187-201）、この画面固有の処理は並び順を昇順に戻すだけ（src/Eccube/Resource/template/admin/Analysis/product_request.twig:15-18）。依頼日From/Toは当月1日・当月末日ではなく空欄になり、表示件数も未選択になる。
- 判定根拠: 検索条件をクリアのリンクは共通処理（html/template/admin/assets/js/function.js:187-201）で検索枠(.search-box-inner)配下の値を空文字にし、チェック・ラジオを外す。画面側の追加処理は並び順の昇順だけを戻している（src/Eccube/Resource/template/admin/Analysis/product_request.twig:15-18）。初期値を持つ依頼日From/To（src/Eccube/Form/Type/Admin/Analysis/SearchProductRequestType.php:54-65）は復元されない。同じ管理画面の他の分析画面では初期日付を明示的に入れ直しており（src/Eccube/Resource/template/admin/Analysis/used_card.twig:16-21）、初期値へ戻す実装は可能。
- 確信度: high

### sheet-13-R037 入荷通知依頼 一覧表示(検索項目) — 実装違い／ふるまい／P3

- 正本: sheet-13（入荷通知依頼 一覧表示(検索項目)） HTML行 2153 付近
- 正本引用: 「依頼日(To)　指定した日の当日分まで含める 販売金額(From)／(To)　Fromは指定額を含め、Toは指定額を含まない」
- 設計期待値: 販売金額(To)に指定した金額とちょうど同額の商品は検索結果に含まれない。
- 画像確認: sheet-13_img1.png を確認。上部にキーワード検索(プレースホルダ「商品名(日/英)・会員名」)と検索枠の表示・非表示ボタン(−)、依頼日 2025-07-01〜2025-07-31、販売金額 300〜5000、言語(日本語/英語/その他言語のチェックボックス)、並べ替え(指定なしのリストボックス＋昇順/降順ラジオ)、表示件数(10のリストボックス)、売上分析タグのテキストボックス、「検索条件をクリア」リンク、「検索する >」ボタン。 図の販売金額は300〜5000が入った状態。境界の扱いは図からは読めない。
- 実装参照: `src/Eccube/Repository/DtbProductRequestRepository.php:425-453`
- 実装実態: 販売金額(To)は指定額以下という条件になっており、指定額と同額の商品も結果に含まれる。
- 判定根拠: 抽出条件は price02 <= :price_to（src/Eccube/Repository/DtbProductRequestRepository.php:427-431,447-451）で上限を含む。Fromは指定額を含む（>=）ので正本どおり。例: 販売金額(To)に5000を指定すると販売価格5000円の商品も一覧に出る。
- 確信度: high

### sheet-14-R022 入荷通知依頼 一覧表示(検索結果) — 実装違い／IO／P3

- 正本: sheet-14（入荷通知依頼 一覧表示(検索結果)） HTML行 2253 付近
- 正本引用: 「5 通知済/削除 ラベル - - -」
- 設計期待値: 結果表の5列目の見出しは「通知済/削除」と表示される。
- 画像確認: sheet-14_img1.png を確認。ヘッダ「集計・分析 入荷通知依頼」、検索入力項目(記載省略)の枠、右上に青字リンク「CSVダウンロード」、結果表の列は 商品ID/言語/商品名/通知待ち/通知済削除 の5列（列見出しは「通知済/削除」）。言語列の値は JP・EN、通知待ちと通知済/削除は件数の数値。 5列目の見出しは図でも項目定義と同じ「通知済/削除」であり、「削除」単独ではない。
- 実装参照: `src/Eccube/Resource/template/admin/Analysis/product_request.twig:134`
- 実装実態: 5列目の見出しは「削除」と直書きされており、「通知済」が抜けている src/Eccube/Resource/template/admin/Analysis/product_request.twig:134。
- 判定根拠: 項目定義の識別ID5のラベルは「通知済/削除」で、レイアウト図(sheet-14_img1.png)の5列目見出しも同じ「通知済/削除」。実装の見出しは「削除」のみ src/Eccube/Resource/template/admin/Analysis/product_request.twig:134。機能仕様の箇条書きは「削除」と略記しているが、ラベルの正本である項目定義とレイアウト図が一致しているため表示文言の相違と判断した。
- 確信度: med

### sheet-16-R021 フォーマット売上分析 集計一覧(検索項目) — 実装違い／ふるまい／P3

- 正本: sheet-16（フォーマット売上分析 集計一覧(検索項目)） HTML行 2423 付近
- 正本引用: 「初期表示では集計結果を表示しない。集計月を選んだ時点で、検索ボタンを押さなくても集計を実行する。」
- 設計期待値: 集計月を選んだ時点で、検索ボタンを押さなくても集計が走り、グラフと表が表示される。
- 画像確認: sheet-16_img1.png を確認。集計月の入力欄（2025-07）、集計対象のチェックボックス2つ（通販／店舗）、右に「検索する >」ボタンが描かれている。
- 実装参照: `src/Eccube/Resource/template/admin/Analysis/format_sales.twig:20-32`
- 実装実態: 集計月を選んでも何も起きない。集計結果を出すには検索ボタンの押下が必要。
- 判定根拠: 初期表示で集計結果を出さない点は実装どおり（src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:62-65 は集計結果を渡さない）。一方、集計月を選んだ時点での自動集計は実装に無い。集計月の入力欄は月選択のカレンダーを開くだけで、値が変わっても集計は始まらない（src/Eccube/Resource/template/admin/Analysis/format_sales.twig:20-32）。現行ソース（pf-eccube3 の format-sales.js）は集計月の変更で検索を自動実行しており、そのふるまいが引き継がれていない。
- 確信度: med

### sheet-16-R029 フォーマット売上分析 集計一覧(検索項目) — 実装違い／IO／P3

- 正本: sheet-16（フォーマット売上分析 集計一覧(検索項目)） HTML行 2431 付近
- 正本引用: 「各フォーマットの合計を合算した値、および各フォーマットの平均を合算した値」
- 設計期待値: 平均表の「今月平均」は、表に並んだ各フォーマットの平均を合算した値になる。
- 画像確認: sheet-16_img1.png を確認。集計月の入力欄（2025-07）、集計対象のチェックボックス2つ（通販／店舗）、右に「検索する >」ボタンが描かれている。
- 実装参照: `src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:249-254`
- 実装実態: 「今月平均」は全フォーマットの売上合計を当月日数で割った値で、各フォーマットの平均を足した値ではない。
- 判定根拠: 各フォーマットの合計を合算する側は実装どおり（src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:249-252、251行で各フォーマットの合計を足している）。平均側は各フォーマットの平均を足しておらず、全フォーマットの売上合計を当月日数で割った値を「今月平均」にしている（src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:253）。各フォーマットの平均は切り捨て済みのため、切り捨ての端数が積み上がる月は画面に並んだ平均の合計と一致しない（例: 2フォーマットが各29円・当月30日なら、各平均は0で合算0だが、実装は58/30を切り捨てた1を表示する）。
- 確信度: high

### sheet-16-R033 フォーマット売上分析 集計一覧(検索項目) — 実装違い／IO／P3

- 正本: sheet-16（フォーマット売上分析 集計一覧(検索項目)） HTML行 2435 付近
- 正本引用: 「グラフは日を横軸、フォーマットごとの日別売上を系列とする折れ線で、表題は「<年>年<月>月 日別売上」とし、縦軸の目盛は円を付けた金額で表示する。」
- 設計期待値: 折れ線グラフの上に「<年>年<月>月 日別売上」という表題が出る。
- 画像確認: sheet-16_img1.png を確認。集計月の入力欄（2025-07）、集計対象のチェックボックス2つ（通販／店舗）、右に「検索する >」ボタンが描かれている。
- 実装参照: `src/Eccube/Resource/template/admin/Analysis/format_sales.twig:56-85`
- 実装実態: グラフには凡例と軸の目盛だけがあり、集計月を示す表題が表示されない。
- 判定根拠: 表の見出しは実装どおり（日別表は「日」＋各フォーマット＋「合計」 src/Eccube/Resource/template/admin/Analysis/format_sales.twig:146-151、合計表は各フォーマット＋「合計」と「今月合計」 src/Eccube/Resource/template/admin/Analysis/format_sales.twig:172-176、平均表は各フォーマット＋「平均」と「今月平均」 src/Eccube/Resource/template/admin/Analysis/format_sales.twig:193-197）。グラフも日を横軸とする折れ線で縦軸の目盛は円付き（src/Eccube/Resource/template/admin/Analysis/format_sales.twig:56-58、src/Eccube/Resource/template/admin/Analysis/format_sales.twig:72-81）。欠けているのはグラフの表題で、表題の設定が無く「2025年7月 日別売上」のような見出しがグラフに出ない。現行ソース（pf-eccube3 の format-sales.js）は同じ表題を描画している。
- 確信度: high

### sheet-19-R009 特集タグ編集CSVダウンロード(検索項目) — 実装違い／IO／P3

- 正本: sheet-19（特集タグ編集CSVダウンロード(検索項目)） HTML行 2669 付近
- 正本引用: 「集計日(From) 日付(yyyy/mm/dd) 〇 - 当月1日 集計開始日付を指定する」
- 設計期待値: 画面を開いたとき、集計日(From)に当月1日が入っている。
- 画像確認: sheet-19_img1.png を確認。集計期間の日付入力2つ（2025-07-01 ～ 2025-07-31）、フォーマットの選択欄、「基本土地を含める」チェックボックス、下部に「特集タグ編集CSVダウンロード」ボタンが1画面に描かれている。入力欄は編集可能な状態で描かれ、略式CSVのボタンは無い。
- 実装参照: `src/Eccube/Form/Type/Admin/Analysis/SearchUsedCardType.php:43-49`
- 実装実態: 集計日(From)の初期値は2週間前の日付で、当月1日は入らない。
- 判定根拠: 集計日(From)は必須の日付入力として実装されている（src/Eccube/Form/Type/Admin/Analysis/SearchUsedCardType.php:43-49、描画は src/Eccube/Resource/template/admin/Analysis/used_card.twig:35）。ただし初期値が当月1日でなく、画面を開いた時点で2週間前の日付が入る（src/Eccube/Form/Type/Admin/Analysis/SearchUsedCardType.php:47）。現行ソースも2週間前だが、リニューアル後の項目定義は初期値を当月1日と定めており、そちらに合っていない。
- 確信度: high

### sheet-4-R017 日別・月別集計 集計一覧(検索項目-月別) — 未実装／ふるまい／P3

- 正本: sheet-4（日別・月別集計 集計一覧(検索項目-月別)） HTML行 1221 付近
- 正本引用: 「・売上集計用に検索項目に出力するフラグを店舗管理に持たせる(追加)」
- 設計期待値: 検索項目の店舗一覧に載せる店舗を、店舗管理側の売上集計用の項目で店舗ごとに切り替えられる。
- 画像確認: sheet-4_img1.png を確認。上部に検索枠の表示・非表示ボタン(−)、集計タイプ(日次/月次のラジオ)、集計月のFrom〜To(2025-05〜2025-07)、集計対象の見出しの下に「通販売上」枠の通販チェック、「店舗売上」枠の全てチェックと店舗チェックボックス群(TC東京・札幌・仙台…その他)、下部に「検索する >」ボタン。 図の店舗一覧は31店舗＋その他が並ぶが、どの店舗を出すかを決める設定項目は図に無い。
- 実装参照: `src/Eccube/Form/Type/Admin/Analysis/SummaryType.php:109-134;src/Eccube/Repository/BaseInfoRepository.php:212-221;src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:119-126`
- 実装実態: 店舗一覧の選択肢は店舗管理の「公開」設定が入った店舗という条件だけで決まり（src/Eccube/Repository/BaseInfoRepository.php:212-221、src/Eccube/Form/Type/Admin/Analysis/SummaryType.php:109-134）、売上集計用の項目は店舗管理の入力欄にも無い（src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:119-126）。
- 同じ実装実態でまとまる要求: sheet-4-R022（日別・月別集計 集計一覧(検索項目-月別)）
- 判定根拠: 検索項目の店舗一覧は公開店舗の抽出結果をそのまま選択肢にしている（src/Eccube/Form/Type/Admin/Analysis/SummaryType.php:109-134、src/Eccube/Repository/BaseInfoRepository.php:214-216）。店舗管理の入力項目には公開/非公開しか無く（src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:119-126）、売上集計に出すかどうかを店舗ごとに切り替える項目が無いため、公開店舗は必ず一覧に出て、非公開店舗は集計対象に選べない。
- 確信度: high

### sheet-5-R024 日別・月別集計 集計一覧(検索結果-日別) — 実装違い／IO／P3

- 正本: sheet-5（日別・月別集計 集計一覧(検索結果-日別)） HTML行 1357 付近
- 正本引用: 「・識別ID 8: 「取引単価(平均)」を追加。通販・店舗毎に1回の取引に対しての購入金額平均を出力」
- 設計期待値: 取引単価(平均)は総売上を取引数で割った値を小数点第一位で四捨五入した整数として出力される。
- 画像確認: sheet-5_img1.png を確認。集計日/店舗名/総売上/原価/粗利益高/販売点数/取引数/取引単価(平均)/買取件数/買取金額/廃棄/欠品の12列＋csvダウンロードリンク＋最下段の総合計行、店舗名欄に通販・TC東京・TC大阪・仙台・秋葉原・日本橋・その他が並ぶ図。
- 実装参照: `src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:252-257;src/Eccube/Service/Admin/Analysis/BatchAggregateDailySummaryAction.php:117-119`
- 実装実態: 総売上÷取引数を切り上げ(ceil)した値を出力しており、小数部が0.5未満のときも1円多い値になる。
- 判定根拠: 同シートの各項目の詳細説明は「(8)取引単価　総売上÷取引数」「小数点第一位を四捨五入」と定めるが、画面表示用の算出（src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:252-257）とバッチ保存値（src/Eccube/Service/Admin/Analysis/BatchAggregateDailySummaryAction.php:117-119）はいずれも切り上げ(ceil)を使う。例: 総売上10001円・取引数4件のとき四捨五入なら2500円だが実装は2501円を出力する。
- 確信度: high

### sheet-7-R033 日別・月別集計 CSV出力 — 未実装／IO／P3

- 正本: sheet-7（日別・月別集計 CSV出力） HTML行 1563 付近
- 正本引用: 「・最終行には「総合計」を追加。識別ID3～12各列のそれぞれの総合計を出力」
- 設計期待値: CSVの最終行に、総売上から欠品までの各列それぞれの総合計を並べた「総合計」の行を出力する。
- 画像確認: 本シートに画像は無い（画像0枚）。
- 実装参照: `src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:106`
- 実装実態: src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:106 の書き出しは見出し行と明細行だけで、明細のあとに合計を並べた行を出す処理が無い。src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:47 は総合計の値も返すが、src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:101 は明細だけを受け取って合計値を捨てている。
- 判定根拠: CSV出力（src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:106〜125）は見出しと明細のみ。集計一覧の画面には総合計行がある（src/Eccube/Resource/template/admin/Analysis/summary.twig:233）のに対し、CSVには相当する行が存在しない。
- 確信度: high

### sheet-7-R041 日別・月別集計 CSV出力 — 実装違い／IO／P3

- 正本: sheet-7（日別・月別集計 CSV出力） HTML行 1577 付近
- 正本引用: 「集計結果のCSVファイル。ファイル名は report_summary_ に出力日時（YmdHis）を付けた .csv。文字コード判別用のBOMを付与する」
- 設計期待値: ダウンロードされるファイルの名前が report_summary_ に出力日時（YmdHis）を付けた .csv になる。
- 画像確認: 本シートに画像は無い（画像0枚）。
- 実装参照: `src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:128`
- 実装実態: src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:128 が組み立てる名前は summary_ に集計タイプと出力日時を続けた .csv（例 summary_daily_20260823101112.csv）で、report_summary_ で始まらない。
- 判定根拠: src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:128 のファイル名は「summary_<集計タイプ>_<日時>.csv」。文字コード判別用のBOMは src/Eccube/Service/CsvExportService.php:276 で付与されるため、BOMの要求は満たしている。差はファイル名だけ。
- 確信度: high

### sheet-8-R063 受注売上分析 集計一覧(検索項目) — 実装違い／ふるまい／P3

- 正本: sheet-8（受注売上分析 集計一覧(検索項目)） HTML行 1718 付近
- 正本引用: 「指定した日時ちょうどは含めず、その手前までを集計する」
- 設計期待値: 集計日(To)に指定した日時ちょうどの受注は集計に含まれず、その直前までが集計対象になる。
- 画像確認: 画像1(受注売上分析 集計一覧 検索項目のレイアウト図)を確認。キーワード検索欄・集計対象(通販売上/店舗売上/全店舗チェック)・集計日(2025-07-31 00:00:00～23:59:59)・集計単位(商品)・集計日対象項目(注文日/注文確定日/入金日/出荷日/売上確定日/キャンセル日)・並べ替え(集計単位・昇順/降順)・表示件数(10)・カテゴリ・状態(NM/SP/MP/HP)・売上分析タグ・カードセット・平均単価・数量・検索条件をクリア・検索するボタンの配置を照合した。 集計日の初期値が 2025-07-31 00:00:00 ～ 2025-07-31 23:59:59 と秒まで指定される様式であることを確認し、境界秒の扱いが結果に出ることを裏づけた。
- 実装参照: `src/Eccube/Repository/OrderItemRepository.php:265-268`
- 実装実態: src/Eccube/Repository/OrderItemRepository.php:265-268 が集計日(To)を「指定日時以下」で絞り込むため、指定した日時ちょうどの受注も集計対象に含まれる。集計日(To)の初期値は当月末日23:59:59であり、その秒に該当する受注は設計では除外・実装では加算される。
- 判定根拠: 集計日Fromは src/Eccube/Repository/OrderItemRepository.php:261-264 が「以上」で設計どおりだが、Toは src/Eccube/Repository/OrderItemRepository.php:265-268 が「以下」で、正本が定める「指定した日時ちょうどは含めず」と境界の扱いが逆になる。集計値（金額合計・数量・件数・平均単価）と件数メッセージに影響する。
- 確信度: high

## 掲載しなかった判定

- 実装実態が空欄の判定 3件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0211_詳細設計/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 7 | 0 | 0 | 0 | 7 |
| sheet-2 | 目次 | 22 | 0 | 0 | 0 | 22 |
| sheet-3 | 日別・月別集計 集計一覧(検索項目-日別) | 57 | 1 | 0 | 0 | 56 |
| sheet-4 | 日別・月別集計 集計一覧(検索項目-月別) | 44 | 2 | 0 | 0 | 42 |
| sheet-5 | 日別・月別集計 集計一覧(検索結果-日別) | 50 | 0 | 3 | 2 | 45 |
| sheet-6 | 日別・月別集計 集計一覧(検索結果-月別) | 44 | 0 | 4 | 0 | 40 |
| sheet-7 | 日別・月別集計 CSV出力 | 43 | 1 | 5 | 0 | 37 |
| sheet-8 | 受注売上分析 集計一覧(検索項目) | 84 | 0 | 1 | 0 | 83 |
| sheet-9 | 受注売上分析 集計一覧(検索結果-集計単位 商品) | 25 | 0 | 0 | 0 | 25 |
| sheet-10 | 受注売上分析 集計一覧(検索結果-集計単位 カテゴリ ) | 24 | 0 | 0 | 0 | 24 |
| sheet-11 | 受注売上分析 CSV出力(商品) | 36 | 0 | 0 | 0 | 36 |
| sheet-12 | 受注売上分析 CSV出力(カテゴリ) | 21 | 0 | 0 | 0 | 21 |
| sheet-13 | 入荷通知依頼 一覧表示(検索項目) | 47 | 0 | 3 | 1 | 43 |
| sheet-14 | 入荷通知依頼 一覧表示(検索結果) | 23 | 0 | 1 | 0 | 22 |
| sheet-15 | 入荷通知依頼 CSV出力 | 41 | 0 | 2 | 0 | 39 |
| sheet-16 | フォーマット売上分析 集計一覧(検索項目) | 35 | 0 | 3 | 0 | 32 |
| sheet-17 | フォーマット売上分析 集計一覧(検索結果) | 15 | 0 | 0 | 0 | 15 |
| sheet-18 | フォーマット売上分析 CSV出力 | 41 | 0 | 0 | 0 | 41 |
| sheet-19 | 特集タグ編集CSVダウンロード(検索項目) | 26 | 0 | 1 | 0 | 25 |
| sheet-20 | 特集タグ編集CSVダウンロード CSV出力 | 22 | 0 | 0 | 0 | 22 |

