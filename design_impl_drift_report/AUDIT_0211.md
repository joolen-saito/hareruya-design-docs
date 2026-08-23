# 実装乖離監査 — 0211_基本設計仕様書(分析・集計管理機能).html

- 正本: `excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **706要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 9 | ○ |
| 実装違い | 実装はあるが設計と違う | 17 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 2 | — |
| 設計どおり | 設計どおり実装されている | 437 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 241 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 0 | — |
| **合計** | | **706** | |

## 不具合 15件（P1 0 / P2 5 / P3 10）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 11件は重複として代表へ折り畳んだ（判定そのものは 26件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-13-R041 | 入荷通知依頼 一覧表示(検索項目) | 実装違い | ふるまい | P2 | キーワード検索に半角空白・全角空白・カンマで区切って複数の語を入れると、入れたすべての語を商品名(日/英)に含む入荷通知依頼だけが結果に残る。 |
| sheet-4-R017 | 日別・月別集計 集計一覧(検索項目-月別) | 実装違い | ふるまい | P2 | 店舗管理で店舗ごとに「売上集計の検索項目に出す／出さない」を設定でき、出す設定の店舗だけが集計対象(各店舗)のチェックボックス一覧に並ぶ。 |
| sheet-5-R011 | 日別・月別集計 集計一覧(検索結果-日別) | 未実装 | IO | P2 | 集計一覧の店舗名の列には、通販の行は「通販」、店舗の行はその店舗名、通販でも各店舗でもない売上の行は「その他」が出る。 |
| sheet-5-R022 | 日別・月別集計 集計一覧(検索結果-日別) | 実装違い | IO | P2 | 集計一覧の廃棄の列に、在庫変動区分が廃棄となっているものの廃棄コスト（金額）の合計が出る。 |
| sheet-6-R023 | 日別・月別集計 集計一覧(検索結果-月別) | 実装違い | IO | P2 | 廃棄・欠品の列に、該当する在庫変動のコスト（金額）合計が出力される |
| sheet-13-R025 | 入荷通知依頼 一覧表示(検索項目) | 実装違い | ふるまい | P3 | 「検索条件をクリア」を押すと、キーワード・依頼日・販売金額・言語・並び替え・表示件数・売上分析タグの入力内容が画面を開いた直後の初期値に戻る。依頼日は当月1日～当月末日、並び順は昇順に戻る。 |
| sheet-13-R040 | 入荷通知依頼 一覧表示(検索項目) | 実装違い | ふるまい | P3 | 販売金額(To)に指定した金額とちょうど同じ販売金額の商品は検索結果に含まれない。販売金額(From)に指定した金額とちょうど同じものは含まれる。 |
| sheet-16-R021 | フォーマット売上分析 集計一覧(検索項目) | 実装違い | ふるまい | P3 | 集計月を選んだ時点で、検索ボタンを押さなくても集計結果が表示される。 |
| sheet-16-R029 | フォーマット売上分析 集計一覧(検索項目) | 実装違い | ふるまい | P3 | 平均表の「今月平均」には、各フォーマットの平均を足し合わせた値が表示される。 |
| sheet-16-R033 | フォーマット売上分析 集計一覧(検索項目) | 実装違い | IO | P3 | 折れ線グラフに「<年>年<月>月 日別売上」の表題（例: 2025年7月 日別売上）が表示される。 |
| sheet-3-R054 | 日別・月別集計 集計一覧(検索項目-日別) | 未実装 | IO | P3 | 集計対象期間に含まれる日付（月別のときは月）のうち集計結果が無いものも、各列を0とした行として一覧に表示される。 |
| sheet-7-R033 | 日別・月別集計 CSV出力 | 未実装 | IO | P3 | CSVの最終行に、総売上から欠品までの各列の総合計を並べた「総合計」の行が出力される |
| sheet-7-R041 | 日別・月別集計 CSV出力 | 実装違い | IO | P3 | ダウンロードされるCSVのファイル名が report_summary_ に出力日時（YmdHis）を付けた .csv になる |
| sheet-8-R016 | 受注売上分析 集計一覧(検索項目) | 実装違い | ふるまい | P3 | 初期表示では、ログインしたユーザーが所属している店舗だけにチェックが入った状態で店舗一覧が表示される。 |
| sheet-8-R063 | 受注売上分析 集計一覧(検索項目) | 実装違い | ふるまい | P3 | 集計日(To)に指定した日時ちょうどの受注は集計に含まれず、その直前までが集計される。 |

### sheet-13-R041 入荷通知依頼 一覧表示(検索項目) — 実装違い／ふるまい／P2

- 正本: sheet-13（入荷通知依頼 一覧表示(検索項目)） HTML行 2106 付近
- 正本引用: 「半角空白・全角空白・カンマで区切って複数語を指定でき、指定した語をすべて満たすものを部分一致で絞り込む」
- 設計期待値: キーワード検索に半角空白・全角空白・カンマで区切って複数の語を入れると、入れたすべての語を商品名(日/英)に含む入荷通知依頼だけが結果に残る。
- 画像確認: レイアウト図のキーワード欄は1本のテキストボックスで、複数語指定の可否は図からは読み取れない。効き方は同シートの現行仕様表に依拠した。
- 実装参照: `src/Eccube/Repository/DtbProductRequestRepository.php:404-408`
- 実装実態: 入力された文字列を区切らず1つの語として扱い、その文字列全体を含む商品名だけを部分一致で探す。複数語を空白やカンマで区切って入れると、区切り文字ごと含む商品名しか一致せず、結果が0件になる。
- 判定根拠: キーワードは前後の空白を落としたうえで文字列全体を1つの部分一致条件にしているだけで（src/Eccube/Repository/DtbProductRequestRepository.php:404-408）、空白・カンマでの分割と語ごとのAND条件を作る処理が無い。
- 確信度: high

### sheet-4-R017 日別・月別集計 集計一覧(検索項目-月別) — 実装違い／ふるまい／P2

- 正本: sheet-4（日別・月別集計 集計一覧(検索項目-月別)） HTML行 1211 付近
- 正本引用: 「・売上集計用に検索項目に出力するフラグを店舗管理に持たせる(追加)」
- 設計期待値: 店舗管理で店舗ごとに「売上集計の検索項目に出す／出さない」を設定でき、出す設定の店舗だけが集計対象(各店舗)のチェックボックス一覧に並ぶ。
- 画像確認: レイアウト図(sheet-4_img1.png)を確認。集計タイプ(○日次 ◉月次)、集計月(2025-05 ～ 2025-07)、集計対象の見出しの下に「通販売上」帯＋□通販、「店舗売上」帯＋□全てチェック、その下に店舗名のチェックボックスが4列で並び最後に□その他、最下部に「検索する >」ボタン、右上に検索枠の表示・非表示ボタン(−)。
- 実装参照: `src/Eccube/Repository/BaseInfoRepository.php:205-221;src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:110-136`
- 実装実態: 集計対象(各店舗)に並ぶ店舗は、店舗管理の「公開」の設定が公開になっている店舗という条件だけで決まる。売上集計の検索項目に出すかどうかを店舗ごとに設定する項目は店舗管理に無い。
- 同じ実装実態でまとまる要求: sheet-4-R022（日別・月別集計 集計一覧(検索項目-月別)）、sheet-3-R017（日別・月別集計 集計一覧(検索項目-日別) / 実装参照 `src/Eccube/Repository/BaseInfoRepository.php:212-221; src/Eccube/Form/Type/Admin/Analysis/SummaryType.php:109-134; src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:119-126`）
- 判定根拠: [gate7/codex] sheet-3-R017 と同じ実装欠陥として畳む。`sheet-3-R017` へ畳む。 店舗一覧の取得条件は公開状態（is_public_shop）だけで（src/Eccube/Repository/BaseInfoRepository.php:205-221、利用は src/Eccube/Form/Type/Admin/Analysis/SummaryType.php:109-134）、集計向けの可否を持つ項目が無い。店舗管理の登録項目にも売上集計向けの設定は無く、店舗の真偽値項目は 本店/支店・公開・開店の3つだけ（src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:110-136、項目定義は src/Eccube/Entity/BaseInfo.php:1547-1580）。そのため公開店舗は必ず検索項目に出て、非公開店舗は集計対象として選べない。
- 確信度: med

### sheet-5-R011 日別・月別集計 集計一覧(検索結果-日別) — 未実装／IO／P2

- 正本: sheet-5（日別・月別集計 集計一覧(検索結果-日別)） HTML行 1309 付近
- 正本引用: 「・識別ID 2: 「支店名」を追加。「通販」もしくは指定された「店舗名」または「その他」を出力」
- 設計期待値: 集計一覧の店舗名の列には、通販の行は「通販」、店舗の行はその店舗名、通販でも各店舗でもない売上の行は「その他」が出る。
- 画像確認: レイアウト図(sheet-5_img1.png)を確認。集計日／店舗名／総売上／原価／粗利益高／販売点数／取引数／取引単価(平均)／買取件数／買取金額／廃棄／欠品の12列と、右上のcsvダウンロード、最下部の総合計行。店舗名の行は通販・TC東京・TC大阪…そして「その他」が並び、集計日は同日の行をまとめて1セルで表示。
- 実装参照: `src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:259-274;src/Eccube/Repository/DtbDailySummaryRepository.php:459-500`
- 実装実態: 店舗名の列に出るのは「通販」か店舗名の2種類だけで、「その他」の行は作られない。通販でも選択した店舗でもない売上は行として現れず、集計から落ちる。
- 同じ実装実態でまとまる要求: sheet-5-R012（日別・月別集計 集計一覧(検索結果-日別) / 実装参照 `src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:259-274;src/Eccube/Service/Admin/Analysis/BatchAggregateDailySummaryAction.php:44-99`）、sheet-6-R011（日別・月別集計 集計一覧(検索結果-月別) / 実装参照 `src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:262-274; src/Eccube/Repository/DtbDailySummaryRepository.php:86-90`）、sheet-6-R012（日別・月別集計 集計一覧(検索結果-月別) / 実装参照 `src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:262-274; src/Eccube/Repository/DtbDailySummaryRepository.php:86-90`）、sheet-7-R020（日別・月別集計 CSV出力 / 実装参照 `src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:262-274; src/Eccube/Repository/DtbDailySummaryRepository.php:86-90`）、sheet-7-R021（日別・月別集計 CSV出力 / 実装参照 `src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:262-274; src/Eccube/Repository/DtbDailySummaryRepository.php:86-90`）
- 判定根拠: 店舗名は集計チャネルが通販なら固定文言「通販」、それ以外は店舗の略称（無ければ店舗名）を返すだけで、「その他」を返す分岐が無い（src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:259-274）。集計結果の行は店舗（base_info）ごとに作られ（src/Eccube/Repository/DtbDailySummaryRepository.php:459-500、src/Eccube/Service/Admin/Analysis/BatchAggregateDailySummaryAction.php:44-99）、店舗に紐づかない売上を集める行が存在しない。ee 全体でこの画面配下に「その他」の店舗名を出す実装は見つからなかった（src/Eccube/Controller/Admin/Analysis/SummaryController.php、src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php、src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php を確認）。
- 確信度: med

### sheet-5-R022 日別・月別集計 集計一覧(検索結果-日別) — 実装違い／IO／P2

- 正本: sheet-5（日別・月別集計 集計一覧(検索結果-日別)） HTML行 1320 付近
- 正本引用: 「・識別ID 11: 「廃棄」を追加。在庫変動区分が「廃棄」となっているものを集計し廃棄コスト合計を出力」
- 設計期待値: 集計一覧の廃棄の列に、在庫変動区分が廃棄となっているものの廃棄コスト（金額）の合計が出る。
- 画像確認: レイアウト図(sheet-5_img1.png)を確認。集計日／店舗名／総売上／原価／粗利益高／販売点数／取引数／取引単価(平均)／買取件数／買取金額／廃棄／欠品の12列と、右上のcsvダウンロード、最下部の総合計行。店舗名の行は通販・TC東京・TC大阪…そして「その他」が並び、集計日は同日の行をまとめて1セルで表示。 廃棄列の例示値は 0／1200／1090 で、総合計は 70990。図からは金額か数量かは判別できないため、機能仕様の「廃棄コスト合計」に依拠した。
- 実装参照: `src/Eccube/Repository/DtbDailySummaryRepository.php:295-332;src/Eccube/Service/Admin/Analysis/BatchAggregateDailySummaryAction.php:77-87`
- 実装実態: 廃棄の列に出るのは廃棄された在庫の数量合計で、原価・金額を掛けたコスト合計ではない。
- 同じ実装実態でまとまる要求: sheet-5-R024（日別・月別集計 集計一覧(検索結果-日別) / 実装参照 `src/Eccube/Repository/DtbDailySummaryRepository.php:336-370;src/Eccube/Service/Admin/Analysis/BatchAggregateDailySummaryAction.php:89-99`）、sheet-6-R022（日別・月別集計 集計一覧(検索結果-月別) / 実装参照 `src/Eccube/Repository/DtbDailySummaryRepository.php:307-333; src/Eccube/Repository/DtbDailySummaryRepository.php:346-370; src/Eccube/Service/Admin/Analysis/BatchAggregateDailySummaryAction.php:86`）
- 判定根拠: 廃棄の集計は在庫変動履歴の在庫変動数量を符号反転して合計しているだけで（src/Eccube/Repository/DtbDailySummaryRepository.php:312-332 の SUM(sh.stockChangeQuantity)）、単価・原価を掛ける処理が無い。その値がそのまま日次集計の廃棄（waste_count）へ入り（src/Eccube/Service/Admin/Analysis/BatchAggregateDailySummaryAction.php:86,134）、画面とCSVの廃棄列に出る（src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:113、src/Eccube/Controller/Admin/Analysis/SummaryController.php:51、src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:37）。格納先も整数の件数カラム（src/Eccube/Entity/DtbDailySummary.php:79-80）。
- 確信度: med

### sheet-6-R023 日別・月別集計 集計一覧(検索結果-月別) — 実装違い／IO／P2

- 正本: sheet-6（日別・月別集計 集計一覧(検索結果-月別)） HTML行 1425 付近
- 正本引用: 「・識別ID 12: 「欠品」を追加。在庫変動区分が「欠品」となっているものを集計しコスト合計を出力」
- 設計期待値: 廃棄・欠品の列に、該当する在庫変動のコスト（金額）合計が出力される
- 画像確認: レイアウト図の廃棄・欠品の値は販売点数と同程度の桁で、金額か数量かを図から確定はできない
- 実装参照: `src/Eccube/Repository/DtbDailySummaryRepository.php:307-333; src/Eccube/Repository/DtbDailySummaryRepository.php:346-370; src/Eccube/Service/Admin/Analysis/BatchAggregateDailySummaryAction.php:86`
- 実装実態: 在庫変動履歴の変動数量を符号反転して合算した数量をそのまま廃棄・欠品として出力しており、原価・金額への換算を行っていない
- 同じ実装実態でまとまる要求: sheet-7-R031（日別・月別集計 CSV出力）、sheet-7-R032（日別・月別集計 CSV出力）
- 判定根拠: 廃棄・欠品の集計は SUM(sh.stockChangeQuantity) を符号反転した「数量」で、金額列（原価等）を参照していない。集計値は waste_count / shortage_count として保存され、画面・CSVはその値をそのまま出す
- 確信度: med

### sheet-13-R025 入荷通知依頼 一覧表示(検索項目) — 実装違い／ふるまい／P3

- 正本: sheet-13（入荷通知依頼 一覧表示(検索項目)） HTML行 2086 付近
- 正本引用: 「識別ID 1～12(2を除く) の入力内容をすべて初期値に戻す」
- 設計期待値: 「検索条件をクリア」を押すと、キーワード・依頼日・販売金額・言語・並び替え・表示件数・売上分析タグの入力内容が画面を開いた直後の初期値に戻る。依頼日は当月1日～当月末日、並び順は昇順に戻る。
- 画像確認: レイアウト図に「検索条件をクリア」のリンクがあり、依頼日は 2025-07-01～2025-07-31（当月1日～当月末日）で描かれている。戻すべき初期値が空欄でないことは図でも確認できる。
- 実装参照: `html/template/admin/assets/js/function.js:186-202;src/Eccube/Resource/template/admin/Analysis/product_request.twig:102-104;src/Eccube/Resource/template/admin/Analysis/product_request.twig:15-17`
- 実装実態: クリックすると検索枠内の入力欄・選択欄が一律で空にされ、チェックとラジオは全解除される（並び順だけは画面固有の処理で昇順へ戻す）。依頼日は当月1日・当月末日ではなく空欄になり、表示件数も未選択になる。
- 判定根拠: クリアのリンクは共通処理に結び付いており（src/Eccube/Resource/template/admin/Analysis/product_request.twig:102-104 の search-clear、共通処理は html/template/admin/assets/js/function.js:186-202）、対象要素の値を空文字にするだけで初期値の再設定は行わない。画面固有の処理は並び順を昇順へ戻すだけ（src/Eccube/Resource/template/admin/Analysis/product_request.twig:15-17）。依頼日の初期値（当月1日／当月末日）は画面生成時にだけ入る（src/Eccube/Form/Type/Admin/Analysis/SearchProductRequestType.php:54-65）ため、クリア後は空欄のままになる。
- 確信度: med

### sheet-13-R040 入荷通知依頼 一覧表示(検索項目) — 実装違い／ふるまい／P3

- 正本: sheet-13（入荷通知依頼 一覧表示(検索項目)） HTML行 2105 付近
- 正本引用: 「指定の無い条件 絞り込みに使わない 依頼日(To) 指定した日の当日分まで含める 販売金額(From)／(To) Fromは指定額を含め、Toは指定額を含まない」
- 設計期待値: 販売金額(To)に指定した金額とちょうど同じ販売金額の商品は検索結果に含まれない。販売金額(From)に指定した金額とちょうど同じものは含まれる。
- 画像確認: レイアウト図の販売金額欄は「300 ～ 5000」の2入力で、境界の含み方は図からは読み取れない。効き方は同シートの現行仕様表に依拠した。
- 実装参照: `src/Eccube/Repository/DtbProductRequestRepository.php:423-454`
- 実装実態: 販売金額(To)は指定額以下（指定額を含む）で絞り込むため、指定額とちょうど同じ販売金額の商品も結果に出る。
- 判定根拠: 下限は price02 >= 指定額（指定額を含む＝設計どおり）だが、上限は price02 <= 指定額 と指定額を含む条件になっている（src/Eccube/Repository/DtbProductRequestRepository.php:427,431,435,447,450,453）。上限を含まない扱いにしている箇所は無い。
- 確信度: med

### sheet-16-R021 フォーマット売上分析 集計一覧(検索項目) — 実装違い／ふるまい／P3

- 正本: sheet-16（フォーマット売上分析 集計一覧(検索項目)） HTML行 2368 付近
- 正本引用: 「初期表示では集計結果を表示しない。集計月を選んだ時点で、検索ボタンを押さなくても集計を実行する。」
- 設計期待値: 集計月を選んだ時点で、検索ボタンを押さなくても集計結果が表示される。
- 画像確認: sheet-16_img1.png を確認。検索部は「集計月」テキスト（2025-07）＋「集計対象」の2チェック（☑通販・☑店舗、いずれも初期チェックON）＋「検索する >」ボタンの並びで、実装の並び・初期値と一致する。図の2つ目のチェックは「店舗」表記だが、項目定義の説明欄は「全店舗」を含める となっており正本内で表記が揺れている（実装のラベルは「全店舗」）。
- 実装参照: `src/Eccube/Resource/template/admin/Analysis/format_sales.twig:17-32; src/Eccube/Resource/template/admin/Analysis/format_sales.twig:94-127; src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:48-66`
- 実装実態: 初期表示で集計結果を出さない点は設計どおり。ただし集計月を選んでも何も起きず、集計結果を出すには「検索する」ボタンの押下が必要。
- 判定根拠: src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:62-65 は初期表示で集計結果を渡しておらず前段は一致する。集計月の入力欄は src/Eccube/Resource/template/admin/Analysis/format_sales.twig:20-32 で日付選択を開く処理だけを持ち、選択時に集計を実行する処理が無い。集計は src/Eccube/Resource/template/admin/Analysis/format_sales.twig:94 のフォーム送信＝検索ボタン押下でしか起きない（src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:73-75）。
- 確信度: med

### sheet-16-R029 フォーマット売上分析 集計一覧(検索項目) — 実装違い／ふるまい／P3

- 正本: sheet-16（フォーマット売上分析 集計一覧(検索項目)） HTML行 2376 付近
- 正本引用: 「各フォーマットの合計を合算した値、および各フォーマットの平均を合算した値」
- 設計期待値: 平均表の「今月平均」には、各フォーマットの平均を足し合わせた値が表示される。
- 画像確認: sheet-16_img1.png を確認。検索部は「集計月」テキスト（2025-07）＋「集計対象」の2チェック（☑通販・☑店舗、いずれも初期チェックON）＋「検索する >」ボタンの並びで、実装の並び・初期値と一致する。図の2つ目のチェックは「店舗」表記だが、項目定義の説明欄は「全店舗」を含める となっており正本内で表記が揺れている（実装のラベルは「全店舗」）。
- 実装参照: `src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:249-254; src/Eccube/Resource/template/admin/Analysis/format_sales.twig:199-205`
- 実装実態: 「今月合計」は各フォーマットの合計の合算で設計どおりだが、「今月平均」は各フォーマットの平均の合算ではなく、全フォーマットの月内売上合計を当月日数で割った値になっている。
- 判定根拠: [gate7/refute] 重要度を P3 へ。事実関係は反証できない。引用「各フォーマットの合計を合算した値、および各フォーマットの平均を合算した値」は sheets/sheet-16.txt の「集計値の算出」表の『合計』行の算出方法セルに逐語で実在し、算出方法を述べた仕様（表ヘッダは 識別ID… の項目表だが、引用元は算出方法列の値であり見出しではない）。実装 src/Eccube/Controller/Admin/Analysis/Fo src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:249-252 が各フォーマットの合計を合算して今月合計を作る（前段は一致）。src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:253 は合算した合計を当月日数で割って今月平均にしており、各フォーマットの平均（src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:286 で切り捨て済み）を足し合わせていない。切り捨てが先に入るぶん、両者は一般に一致しない（例: 当月30日で2フォーマットが各45円なら、各平均1円の合算は2円だが実装は90÷30=3円）。src/Eccube/Resource/template/admin/Analysis/format_sales.twig:202 がこの値を「今月平均」の欄に表示する。 重要度は、差が各フォーマットの切り捨て端数の合計にとどまり（フォーマット数程度の円未満）、百万円規模の集計値に対する影響が丸め差に等しく、業務判断を変えないためP3とする。
- 確信度: med

### sheet-16-R033 フォーマット売上分析 集計一覧(検索項目) — 実装違い／IO／P3

- 正本: sheet-16（フォーマット売上分析 集計一覧(検索項目)） HTML行 2380 付近
- 正本引用: 「グラフは日を横軸、フォーマットごとの日別売上を系列とする折れ線で、表題は「<年>年<月>月 日別売上」とし、縦軸の目盛は円を付けた金額で表示する。」
- 設計期待値: 折れ線グラフに「<年>年<月>月 日別売上」の表題（例: 2025年7月 日別売上）が表示される。
- 画像確認: sheet-16_img1.png を確認。検索部は「集計月」テキスト（2025-07）＋「集計対象」の2チェック（☑通販・☑店舗、いずれも初期チェックON）＋「検索する >」ボタンの並びで、実装の並び・初期値と一致する。図の2つ目のチェックは「店舗」表記だが、項目定義の説明欄は「全店舗」を含める となっており正本内で表記が揺れている（実装のラベルは「全店舗」）。
- 実装参照: `src/Eccube/Resource/template/admin/Analysis/format_sales.twig:56-85; src/Eccube/Resource/template/admin/Analysis/format_sales.twig:146-150; src/Eccube/Resource/template/admin/Analysis/format_sales.twig:172-176; src/Eccube/Resource/template/admin/Analysis/format_sales.twig:193-197`
- 実装実態: 折れ線・横軸の日・系列・縦軸の通貨記号付き目盛、および3つの表の見出しは設計どおり。ただしグラフに集計月を示す表題が無く、凡例だけが表示される。
- 判定根拠: src/Eccube/Resource/template/admin/Analysis/format_sales.twig:146-150 の日別売上表（先頭「日」・各フォーマット・末尾「合計」）、src/Eccube/Resource/template/admin/Analysis/format_sales.twig:172-176 の合計表、src/Eccube/Resource/template/admin/Analysis/format_sales.twig:193-197 の平均表、src/Eccube/Resource/template/admin/Analysis/format_sales.twig:57-58 の折れ線と系列、src/Eccube/Resource/template/admin/Analysis/format_sales.twig:72 の横軸「日」、src/Eccube/Resource/template/admin/Analysis/format_sales.twig:76-81 の通貨記号付き目盛はいずれも一致する。src/Eccube/Resource/template/admin/Analysis/format_sales.twig:59-84 のグラフ設定に表題の指定が無く、「<年>年<月>月 日別売上」が画面に出ない。
- 確信度: med

### sheet-3-R054 日別・月別集計 集計一覧(検索項目-日別) — 未実装／IO／P3

- 正本: sheet-3（日別・月別集計 集計一覧(検索項目-日別)） HTML行 1130 付近
- 正本引用: 「該当する集計結果が無いものも、各列を 0 とした行として一覧に補う」
- 設計期待値: 集計対象期間に含まれる日付（月別のときは月）のうち集計結果が無いものも、各列を0とした行として一覧に表示される。
- 画像確認: レイアウト図は検索項目のみの図で、結果一覧の行構成は図から読み取れない。
- 実装参照: `src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:47-63; src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:70-119; src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:126-173`
- 実装実態: 一覧は集計済みデータに存在する行だけを並べており(src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:70-119、src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:126-173)、期間内で集計結果が無い日付（月）の行を0で補う処理が無いため、その日付は一覧に現れない。
- 判定根拠: 集計結果の取得(src/Eccube/Repository/DtbDailySummaryRepository.php:459-501、src/Eccube/Repository/DtbMonthlySummaryRepository.php:90-146)は期間内の既存行を返すだけで、日付の欠けを埋めない。組み立て側(src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:47-63)も取得した行に表示用のキーを足すだけで行を追加しない。画面も渡された行をそのまま繰り返す(src/Eccube/Resource/template/admin/Analysis/summary.twig:217-232)。
- 確信度: med

### sheet-7-R033 日別・月別集計 CSV出力 — 未実装／IO／P3

- 正本: sheet-7（日別・月別集計 CSV出力） HTML行 1523 付近
- 正本引用: 「・最終行には「総合計」を追加。識別ID3～12各列のそれぞれの総合計を出力」
- 設計期待値: CSVの最終行に、総売上から欠品までの各列の総合計を並べた「総合計」の行が出力される
- 画像確認: 本シートに画像は無い
- 実装参照: `src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:106-126`
- 実装実態: CSVはヘッダ行と明細行だけを書き出して終わり、総合計の行を書き出さない（画面の一覧には総合計行がある）
- 判定根拠: [gate7/refute] 重要度を P3 へ。欠陥自体は事実。引用は sheets/sheet-7.txt:62 に逐語で実在し、実装 src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:106-126 はヘッダ1行＋明細ループのみで、AnalysisSummaryBuilder.php:59-61 が返す total を使っておらず総合計行を書かない（画面側は summ 出力処理はヘッダを1行書いた後 summary の各行を回すだけで、AnalysisSummaryBuilder が返す total（列ごとの合計）を使っていない。画面側は summary.twig:233-242 で同じ total を総合計行として描画しており、CSVだけ欠けている
- 確信度: high

### sheet-7-R041 日別・月別集計 CSV出力 — 実装違い／IO／P3

- 正本: sheet-7（日別・月別集計 CSV出力） HTML行 1537 付近
- 正本引用: 「成功時出力 集計結果のCSVファイル。ファイル名は report_summary_ に出力日時（YmdHis）を付けた .csv。文字コード判別用のBOMを付与する」
- 設計期待値: ダウンロードされるCSVのファイル名が report_summary_ に出力日時（YmdHis）を付けた .csv になる
- 画像確認: 本シートに画像は無い
- 実装参照: `src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:128`
- 実装実態: ファイル名は summary_daily_ または summary_monthly_ に出力日時を付けた .csv で出力される（BOMは付与されている）
- 判定根拠: src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:128 は sprintf('summary_%s_%s.csv', 集計タイプ, YmdHis) でファイル名を組み立てており report_summary_ で始まらない。BOMは src/Eccube/Service/CsvExportService.php:276 で付与されるため設計どおり
- 確信度: high

### sheet-8-R016 受注売上分析 集計一覧(検索項目) — 実装違い／ふるまい／P3

- 正本: sheet-8（受注売上分析 集計一覧(検索項目)） HTML行 1621 付近
- 正本引用: 「初期設定として、店舗一覧にログインしたユーザーが所属している店舗にチェックが入った状態で表示される(追加)」
- 設計期待値: 初期表示では、ログインしたユーザーが所属している店舗だけにチェックが入った状態で店舗一覧が表示される。
- 画像確認: レイアウト図では店舗一覧のうち「TC東京」1件だけにチェックが入った状態で描かれており、複数店舗が既定でチェックされる図ではない。
- 実装参照: `src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:184-205; src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:50`
- 実装実態: 初期チェックには所属店舗のほかに、そのユーザーへ付与された編集可能店舗も加えられる(src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:184-205)ため、所属していない店舗にも初期チェックが入る。
- 判定根拠: 所属店舗は dtb_member.base_info_id（テナント情報, src/Eccube/Entity/Member.php:185-199）で、編集可能店舗は別テーブル由来（src/Eccube/Entity/Member.php:78-91 の編集可能店舗判定、src/Eccube/Service/Admin/Setting/System/MemberCreateAction.php:54 で登録）である。同一文言を持つ日別・月別集計側は所属店舗だけを初期チェックしている(src/Eccube/Controller/Admin/Analysis/SummaryController.php:338-352)ため、受注売上分析側だけ初期チェックの範囲が広い。
- 確信度: med

### sheet-8-R063 受注売上分析 集計一覧(検索項目) — 実装違い／ふるまい／P3

- 正本: sheet-8（受注売上分析 集計一覧(検索項目)） HTML行 1674 付近
- 正本引用: 「指定した日時ちょうどは含めず、その手前までを集計する」
- 設計期待値: 集計日(To)に指定した日時ちょうどの受注は集計に含まれず、その直前までが集計される。
- 画像確認: レイアウト図の集計日To欄は「2025-07-31 23:59:59」。図から境界の扱いは読み取れない。
- 実装参照: `src/Eccube/Repository/OrderItemRepository.php:265-268`
- 実装実態: 集計日To は指定日時以下を対象にするため(src/Eccube/Repository/OrderItemRepository.php:265-268)、指定日時ちょうどの受注も集計に含まれる。
- 判定根拠: 集計日From は「以上」(src/Eccube/Repository/OrderItemRepository.php:261-264)で設計どおりだが、To は「以下」で境界の扱いが設計と反対になっている。境界1秒分の受注の計上有無が変わる。なお本シートのリニューアル後の仕様は集計日(To)の初期値を当月末日23:59:59と定めるだけで、境界の含み方は上書きしていない。
- 確信度: med

## 掲載しなかった判定

- 実装実態が空欄の判定 2件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0211/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 7 | 0 | 0 | 0 | 7 |
| sheet-2 | 目次 | 22 | 0 | 0 | 0 | 22 |
| sheet-3 | 日別・月別集計 集計一覧(検索項目-日別) | 57 | 2 | 0 | 0 | 55 |
| sheet-4 | 日別・月別集計 集計一覧(検索項目-月別) | 44 | 0 | 2 | 0 | 42 |
| sheet-5 | 日別・月別集計 集計一覧(検索結果-日別) | 45 | 2 | 2 | 0 | 41 |
| sheet-6 | 日別・月別集計 集計一覧(検索結果-月別) | 44 | 2 | 2 | 0 | 40 |
| sheet-7 | 日別・月別集計 CSV出力 | 43 | 3 | 3 | 0 | 37 |
| sheet-8 | 受注売上分析 集計一覧(検索項目) | 84 | 0 | 2 | 0 | 82 |
| sheet-9 | 受注売上分析 集計一覧(検索結果-集計単位 商品) | 25 | 0 | 0 | 0 | 25 |
| sheet-10 | 受注売上分析 集計一覧(検索結果-集計単位 カテゴリ ) | 24 | 0 | 0 | 0 | 24 |
| sheet-11 | 受注売上分析 CSV出力(商品) | 36 | 0 | 0 | 0 | 36 |
| sheet-12 | 受注売上分析 CSV出力(カテゴリ) | 21 | 0 | 0 | 0 | 21 |
| sheet-13 | 入荷通知依頼 一覧表示(検索項目) | 50 | 0 | 3 | 0 | 47 |
| sheet-14 | 入荷通知依頼 一覧表示(検索結果) | 23 | 0 | 0 | 2 | 21 |
| sheet-15 | 入荷通知依頼 CSV出力 | 41 | 0 | 0 | 0 | 41 |
| sheet-16 | フォーマット売上分析 集計一覧(検索項目) | 35 | 0 | 3 | 0 | 32 |
| sheet-17 | フォーマット売上分析 集計一覧(検索結果) | 15 | 0 | 0 | 0 | 15 |
| sheet-18 | フォーマット売上分析 CSV出力 | 41 | 0 | 0 | 0 | 41 |
| sheet-19 | 特集タグ編集CSVダウンロード(検索項目) | 27 | 0 | 0 | 0 | 27 |
| sheet-20 | 特集タグ編集CSVダウンロード CSV出力 | 22 | 0 | 0 | 0 | 22 |

