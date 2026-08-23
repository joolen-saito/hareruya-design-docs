# 実装乖離監査 — 0505_基本設計仕様書(API_受注管理).html

- 正本: `excel_to_html/output/0505_基本設計仕様書(API_受注管理).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **482要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 4 | ○ |
| 実装違い | 実装はあるが設計と違う | 20 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 0 | — |
| 設計どおり | 設計どおり実装されている | 247 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 208 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 3 | — |
| **合計** | | **482** | |

## 不具合 15件（P1 0 / P2 9 / P3 6）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 9件は重複として代表へ折り畳んだ（判定そのものは 24件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-3-R009 | 注文印刷_印刷情報をプリンタへ送信 | 実装違い | IO | P2 | 印刷情報の取得と印刷完了の登録は別々のURLで受け付け、1つの受け口でクエリ値により処理が分かれない |
| sheet-3-R014 | 注文印刷_印刷情報をプリンタへ送信 | 実装違い | ふるまい | P2 | スマレジの商品コードが採番されていない受注は印刷情報に含めず、バーコードが空の伝票が印刷されない |
| sheet-3-R029 | 注文印刷_印刷情報をプリンタへ送信 | 実装違い | IO | P2 | 存在しない店舗IDを指定された要求には404を返し、印刷対象の検索や正常応答へ進まない |
| sheet-3-R038 | 注文印刷_印刷情報をプリンタへ送信 | 実装違い | IO | P2 | 店頭注文番号欄には受注の店頭注文番号が印字され、採番されていない受注では空欄になる |
| sheet-3-R044 | 注文印刷_印刷情報をプリンタへ送信 | 実装違い | IO | P2 | スムーズ店頭受取の受注では、合計金額欄に金額ではなく「スムーズ店頭受取」と印字される |
| sheet-3-R124 | 注文印刷_印刷情報をプリンタへ送信 | 実装違い | ふるまい | P2 | 所定の支払方法で各日時が未設定・スマレジコード採番済みのスムーズ店頭受取の受注が、どの店舗IDでも印刷対象に含まれる |
| sheet-4-R013 | 注文印刷_該当受注のステータスを印刷済みに変更 | 実装違い | IO | P2 | 印刷完了通知の要求には店舗IDを含める必要がなく、印刷結果XMLに含まれる受注IDだけで対象受注を特定して更新できる。 |
| sheet-4-R014 | 注文印刷_該当受注のステータスを印刷済みに変更 | 未実装 | ふるまい | P2 | 印刷結果XMLの各印刷結果に失敗が返っている場合、その失敗理由コードをログへ追記する。 |
| sheet-6-R182 | スマレジ受信処理 | 未実装 | ふるまい | P2 | スマレジの取引を既存の受注へ反映して出荷完了にするとき、その受注の確定日と出荷日に日時が記録され、スマレジ用として登録された担当者が受注の担当者として記録される。 |
| sheet-3-R129 | 注文印刷_印刷情報をプリンタへ送信 | 実装違い | IO | P3 | カナ氏名が無い受注では、お客様名欄に氏名が印字される |
| sheet-4-R094 | 注文印刷_該当受注のステータスを印刷済みに変更 | 実装違い | ふるまい | P3 | ブラウザ印刷の区分が立っていない受注は、対応状況をピック中へ更新し、注文確定日に現在日時を設定する。 |
| sheet-4-R104 | 注文印刷_該当受注のステータスを印刷済みに変更 | 実装違い | IO | P3 | 印刷結果XMLはPOSTのボディの値だけを用い、URLのクエリに同名の値があってもその値は用いない。 |
| sheet-6-R040 | スマレジ受信処理 | 実装違い | IO | P3 | スマレジ取引から新規作成する受注には配送に関する情報（配送方法・お届け先）が登録されない |
| sheet-6-R113 | スマレジ受信処理 | 実装違い | IO | P3 | Webhookを正常に受け付けたときは、状態コード200を返し、応答本文には何も含めない。 |
| sheet-6-R179 | スマレジ受信処理 | 未実装 | IO | P3 | スマレジ取引で登録するポイント履歴の備考に、付与のときは「店舗付与」、利用のときは「店舗使用」と記録される。 |

### sheet-3-R009 注文印刷_印刷情報をプリンタへ送信 — 実装違い／IO／P2

- 正本: sheet-3（注文印刷_印刷情報をプリンタへ送信） HTML行 1033 付近
- 正本引用: 「現状は印刷完了ステータスに更新するAPI (A05-02)と処理を受けるメソッドが共通で、クエリ「ConnectionType」で処理が分岐しているので、A05-02とエンドポイントを分ける」
- 設計期待値: 印刷情報の取得と印刷完了の登録は別々のURLで受け付け、1つの受け口でクエリ値により処理が分かれない
- 画像確認: 本シートは画像0枚（レイアウト図なし）。sheets/sheet-3.txt 本文のみで判定
- 実装参照: `src/Eccube/Controller/App/OrderController.php:43-77`
- 実装実態: 印刷情報の取得は POST /api/order/prints/direct/{base_info_id} の1つの受け口で受け、クエリ ConnectionType が GetRequest のときだけ印刷情報を返す。A05-02（印刷完了ステータス更新）は同じ受け口の SetResponse 分岐で処理されるため、A05-01 と A05-02 が同じURLに同居している（OrderController.php:43,46,48,64）
- 同じ実装実態でまとまる要求: sheet-4-R006（注文印刷_該当受注のステータスを印刷済みに変更）、sheet-4-R011（注文印刷_該当受注のステータスを印刷済みに変更 / 実装参照 `src/Eccube/Controller/App/OrderController.php:43-69`）、sheet-3-R003（注文印刷_印刷情報をプリンタへ送信 / 実装参照 `src/Eccube/Controller/App/OrderController.php:43`）、sheet-4-R003（注文印刷_該当受注のステータスを印刷済みに変更）
- 判定根拠: 設計は A05-02 と受け口を分けると明記しているが、実装は同一URL・同一処理内で ConnectionType の値により A05-01/A05-02 を分岐しており、現状の作りがそのまま残っている（src/Eccube/Controller/App/OrderController.php:46-77）。R003 と同一の実装欠陥
- 確信度: high

### sheet-3-R014 注文印刷_印刷情報をプリンタへ送信 — 実装違い／ふるまい／P2

- 正本: sheet-3（注文印刷_印刷情報をプリンタへ送信） HTML行 1039 付近
- 正本引用: 「・バーコードが印刷されていない問題が発生しないようにするため、注文データをXML形式にする前に受注データにスマレジの商品コードが存在するかどうか確認する」
- 設計期待値: スマレジの商品コードが採番されていない受注は印刷情報に含めず、バーコードが空の伝票が印刷されない
- 画像確認: 本シートは画像0枚（レイアウト図なし）。sheets/sheet-3.txt 本文のみで判定
- 実装参照: `src/Eccube/Repository/OrderRepository.php:1708-1727;src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:55-58`
- 実装実態: 本店向け抽出はスムーズ店頭受取の分岐にだけ smaregi_code IS NOT NULL を持ち、店頭受取（OTC＋注文受領）とブラウザ印刷フラグの分岐には条件が無い（OrderRepository.php:1710-1726）。印刷データ生成側にもスマレジコードの有無で除外する処理は無く、空のバーコードを含む伝票が出力される（OrderDirectPrintAction.php:55-58,78,135）
- 同じ実装実態でまとまる要求: sheet-3-R015（注文印刷_印刷情報をプリンタへ送信）
- 判定根拠: ★カスタマイズは印刷情報を作る前にスマレジ商品コードの有無を確認すると述べているが、本店向け抽出の店頭受取・ブラウザ印刷分岐にはスマレジコードの条件が無く、印刷データ生成側にも除外が無い（src/Eccube/Repository/OrderRepository.php:1710-1726、src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:55-58）。支店向け抽出は店頭受取分岐にだけ条件がある（src/Eccube/Repository/OrderRepository.php:1769）
- 確信度: med

### sheet-3-R029 注文印刷_印刷情報をプリンタへ送信 — 実装違い／IO／P2

- 正本: sheet-3（注文印刷_印刷情報をプリンタへ送信） HTML行 1054 付近
- 正本引用: 「コード　説明 200　正常終了 404　店舗ID(shop_id)が無い、整数以外の型、存在しない店舗ID(shop_id)　※支店での処理を踏襲」
- 設計期待値: 存在しない店舗IDを指定された要求には404を返し、印刷対象の検索や正常応答へ進まない
- 画像確認: 本シートは画像0枚（レイアウト図なし）。sheets/sheet-3.txt 本文のみで判定
- 実装参照: `src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:42-52;src/Eccube/Controller/App/OrderController.php:57-63`
- 実装実態: 店舗IDに対応する店舗情報が見つからなくても404にならない。店舗情報が null のときは本店判定に入らず支店向け抽出をそのまま実行し、対象が無ければ空文字を200で返す
- 判定根拠: 店舗IDが無い場合と整数以外の場合はパス引数の整数制約で404になるが、存在しない店舗IDは src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:42-48 で null のまま処理が続き、src/Eccube/Controller/App/OrderController.php:57-63 が200で応答する。404にする分岐が実装に無い
- 確信度: high

### sheet-3-R038 注文印刷_印刷情報をプリンタへ送信 — 実装違い／IO／P2

- 正本: sheet-3（注文印刷_印刷情報をプリンタへ送信） HTML行 1063 付近
- 正本引用: 「受注に店頭注文番号が採番されていないときは空欄にする」
- 設計期待値: 店頭注文番号欄には受注の店頭注文番号が印字され、採番されていない受注では空欄になる
- 画像確認: 本シートは画像0枚（レイアウト図なし）。sheets/sheet-3.txt 本文のみで判定
- 実装参照: `src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:77;src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:97;src/Eccube/Repository/OrderRepository.php:1708`
- 実装実態: 店頭注文番号欄には受注の注文番号（order_number、購入時に8桁で採番される連番）を印字しており（OrderDirectPrintAction.php:77,97）、店頭注文番号（waiting_number）を印字していない。抽出条件が order_number IS NOT NULL のため、この欄が空欄になることもない（OrderRepository.php:1708,1766,1787）。同じ値を注文番号欄にも印字している（OrderDirectPrintAction.php:117）
- 同じ実装実態でまとまる要求: sheet-3-R130（注文印刷_印刷情報をプリンタへ送信 / 実装参照 `src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:77;src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:97;src/Eccube/Repository/OrderRepository.php:1766`）
- 判定根拠: 動的変更箇所表は店頭注文番号欄に店頭注文番号を出すと定め、現行仕様も未採番なら空欄と定めている。実装は店頭注文番号ではなく注文番号を印字し（src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:77,97）、注文番号欄（src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:117）と同じ値が2箇所に印字される。現行ソースでは店頭注文番号欄に店頭注文番号（waiting number）を印字していた
- 確信度: med

### sheet-3-R044 注文印刷_印刷情報をプリンタへ送信 — 実装違い／IO／P2

- 正本: sheet-3（注文印刷_印刷情報をプリンタへ送信） HTML行 1069 付近
- 正本引用: 「注文の合計金額。ただしスムーズ店頭受取の場合、「スムーズ店頭受取」と表示」
- 設計期待値: スムーズ店頭受取の受注では、合計金額欄に金額ではなく「スムーズ店頭受取」と印字される
- 画像確認: 本シートは画像0枚（レイアウト図なし）。sheets/sheet-3.txt 本文のみで判定
- 実装参照: `src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:74;src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:129`
- 実装実態: 印刷データ生成は受注の合計金額をそのまま合計金額欄へ印字する。配送がスムーズ店頭受取かを見て文言へ置き換える処理が無く、抽出結果にも配送種別が含まれていない
- 判定根拠: src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:74 で合計金額を設定し src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:129 でそのまま印字している。スムーズ店頭受取の判定は抽出条件にしか現れず（src/Eccube/Repository/OrderRepository.php:1715）、印刷データ生成側に文言差し替えが無い
- 確信度: high

### sheet-3-R124 注文印刷_印刷情報をプリンタへ送信 — 実装違い／ふるまい／P2

- 正本: sheet-3（注文印刷_印刷情報をプリンタへ送信） HTML行 1154 付近
- 正本引用: 「スムーズ店頭受取の受注	所定の支払方法（クレジット決済・支払いなし）で、対応状況が購入処理中でなく、確定日時・注文確定日・出荷日・取消日・受領日・店頭予約日がいずれも未設定で、スマレジコードが採番済みのとき」
- 設計期待値: 所定の支払方法で各日時が未設定・スマレジコード採番済みのスムーズ店頭受取の受注が、どの店舗IDでも印刷対象に含まれる
- 画像確認: 本シートは画像0枚（レイアウト図なし）。sheets/sheet-3.txt 本文のみで判定
- 実装参照: `src/Eccube/Repository/OrderRepository.php:1748-1792;src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:44-48`
- 実装実態: 支店向け抽出は店頭受取（注文受領・スマレジコードあり）とブラウザ印刷フラグの2つの条件だけで構成され、スムーズ店頭受取の条件を持たない。本店向け抽出にはこの条件がある
- 判定根拠: src/Eccube/Repository/OrderRepository.php:1750-1792 のSQLに SMOOTH_OTC・支払方法・確定日時等の未設定条件が無いため、支店の店舗IDで要求すると条件を満たすスムーズ店頭受取の受注が印刷されない（本店経路は src/Eccube/Repository/OrderRepository.php:1714-1725 で対応済み）
- 確信度: high

### sheet-4-R013 注文印刷_該当受注のステータスを印刷済みに変更 — 実装違い／IO／P2

- 正本: sheet-4（注文印刷_該当受注のステータスを印刷済みに変更） HTML行 1230 付近
- 正本引用: 「・送信されてきたXML情報から取引IDを全て抽出し、その受注IDのステータスをピック中にする
※ 受注IDを持っているので、情報として店舗IDは不要」
- 設計期待値: 印刷完了通知の要求には店舗IDを含める必要がなく、印刷結果XMLに含まれる受注IDだけで対象受注を特定して更新できる。
- 画像確認: sheet-4は画像0枚（sheets.tsv / images配下に該当ファイル無し）。レイアウト図は無く本文のみで判定した。
- 実装参照: `src/Eccube/Controller/App/OrderController.php:43-69、src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:61-68`
- 実装実態: 印刷完了通知のURLに店舗の基本情報IDを必ず含める必要があり、その値で店舗情報が引けないと1件も更新せずに戻る。受注IDだけでは更新できない。
- 判定根拠: src/Eccube/Controller/App/OrderController.php:43 はURLに base_info_id（店舗の基本情報ID）を必須の要素として持ち、src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:61-68 はその値で店舗情報を取得できないとログを出して更新せずに戻る。設計は店舗IDは不要と明記している。
- 確信度: high

### sheet-4-R014 注文印刷_該当受注のステータスを印刷済みに変更 — 未実装／ふるまい／P2

- 正本: sheet-4（注文印刷_該当受注のステータスを印刷済みに変更） HTML行 1231 付近
- 正本引用: 「★ プリンタ側でエラーがあった場合、レスポンスデータの中にエラーコードが返ってくるので、ログに追記する」
- 設計期待値: 印刷結果XMLの各印刷結果に失敗が返っている場合、その失敗理由コードをログへ追記する。
- 画像確認: sheet-4は画像0枚（sheets.tsv / images配下に該当ファイル無し）。レイアウト図は無く本文のみで判定した。
- 実装参照: `src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:48-101`
- 実装実態: XMLの解析に失敗したときと印刷結果要素が0件のときだけ受信内容をログに出す。各印刷結果の成功/失敗と失敗理由コードは一切読み取っておらず、印刷が失敗して理由コードが返ってきてもログには何も残らない。
- 同じ実装実態でまとまる要求: sheet-4-R016（注文印刷_該当受注のステータスを印刷済みに変更）
- 判定根拠: src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:48-59 は解析失敗と印刷結果0件のログ出力のみ。同78-101 の印刷結果ごとの処理は printjobid だけを読み、成功/失敗の値や失敗理由コードを参照する箇所が無い（ee 全体で EPTR_/EX_BADPORT 等のコード名も0件）。また src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:55 の判定は ServerDirectPrint 要素の文字列を見ており、設計サンプルのように成功/失敗が属性で返る形では失敗を検知できない。
- 確信度: high

### sheet-6-R182 スマレジ受信処理 — 未実装／ふるまい／P2

- 正本: sheet-6（スマレジ受信処理） HTML行 1633 付近
- 正本引用: 「注文へ反映するとき、その時点の日時を、注文の確定日と出荷日、および注文に紐づく各配送の出荷日として記録する。スマレジ用として登録されている担当者があるときは、その担当者を注文の担当者として記録する。」
- 設計期待値: スマレジの取引を既存の受注へ反映して出荷完了にするとき、その受注の確定日と出荷日に日時が記録され、スマレジ用として登録された担当者が受注の担当者として記録される。
- 画像確認: 画像0枚（images/ に sheet-6/sheet-5 の図は無い）。レイアウト図は存在しないためテキスト全文で判定した。
- 実装参照: `src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeSmoothOtcPatternHandler.php:62-65`
- 実装実態: スムーズ店頭受取（既存受注を出荷完了にするパターン）では、受注のステータスと取引IDだけを更新し、確定日・出荷日・担当者を一切更新していない（src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeSmoothOtcPatternHandler.php:62-65）。
- 判定根拠: 新規受注を作る経路では確定日・出荷日・担当者を設定している（src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:337-343 と :322-325）が、既存受注を出荷完了へ更新する経路にはその処理が無い。取引IDから既存受注を引き当てる再処理経路（src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:424-433）でもポイント適用のみで日付・担当者は更新されない。各配送の出荷日はリニューアル後の仕様が「配送情報は使用用途がないので未登録とする」としているため期待値に含めていない。
- 確信度: med

### sheet-3-R129 注文印刷_印刷情報をプリンタへ送信 — 実装違い／IO／P3

- 正本: sheet-3（注文印刷_印刷情報をプリンタへ送信） HTML行 1159 付近
- 正本引用: 「カナ氏名（姓と名を空白でつなぐ）を印刷する。カナ氏名が無いときは氏名を印刷する」
- 設計期待値: カナ氏名が無い受注では、お客様名欄に氏名が印字される
- 画像確認: 本シートは画像0枚（レイアウト図なし）。sheets/sheet-3.txt 本文のみで判定
- 実装参照: `src/Eccube/Repository/OrderRepository.php:1756;src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:75`
- 実装実態: 支店向け抽出はカナ姓名を素の連結で組み立てるため、カナが未登録の受注でも空白1文字が値として返り、氏名への切り替えが働かず、お客様名欄に空白だけが印字される。本店向け抽出は連結結果が空になるため氏名へ切り替わる
- 判定根拠: src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:75 の切り替えは値が空のときだけ働く。src/Eccube/Repository/OrderRepository.php:1756 はネイティブSQLのCONCATで、PostgreSQLではNULLを空文字として扱うため結果は空白1文字になり空判定に掛からない。本店向け（src/Eccube/Repository/OrderRepository.php:1698）はDQLのCONCATで連結演算子に展開されNULLが伝播するため切り替わる。スマレジ由来の受注は受注のカナが未設定のまま作られるため、実際に起こり得る
- 確信度: med

### sheet-4-R094 注文印刷_該当受注のステータスを印刷済みに変更 — 実装違い／ふるまい／P3

- 正本: sheet-4（注文印刷_該当受注のステータスを印刷済みに変更） HTML行 1315 付近
- 正本引用: 「ブラウザ印刷フラグが立っていないとき	対応状況をピック中へ更新し、注文確定日に現在日時を設定する」
- 設計期待値: ブラウザ印刷の区分が立っていない受注は、対応状況をピック中へ更新し、注文確定日に現在日時を設定する。
- 画像確認: sheet-4は画像0枚（sheets.tsv / images配下に該当ファイル無し）。レイアウト図は無く本文のみで判定した。
- 実装参照: `src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:87-98`
- 実装実態: 対応状況はピック中へ更新するが、注文確定日に現在日時を入れるのは本店の受注のときだけで、支店の受注では注文確定日は空のまま、代わりにピック開始日へ現在日時を入れる。
- 同じ実装実態でまとまる要求: sheet-4-R107（注文印刷_該当受注のステータスを印刷済みに変更 / 実装参照 `src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:87-100`）
- 判定根拠: src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:90 で対応状況をピック中へ更新した後、同91-97 は店舗が本店かどうかで分岐し、本店のみ注文確定日を現在日時にする。支店ではピック開始日を設定し注文確定日は更新しない。設計は店舗によらず注文確定日を設定すると記しており、支店の扱いの記述は正本に無い（設計裁定が必要な可能性がある）。
- 確信度: med

### sheet-4-R104 注文印刷_該当受注のステータスを印刷済みに変更 — 実装違い／IO／P3

- 正本: sheet-4（注文印刷_該当受注のステータスを印刷済みに変更） HTML行 1328 付近
- 正本引用: 「入力	接続種別は、クエリのほかボディからも受け取る。印刷結果XMLはPOSTのボディからのみ読み取り、クエリに同名の値があっても用いない」
- 設計期待値: 印刷結果XMLはPOSTのボディの値だけを用い、URLのクエリに同名の値があってもその値は用いない。
- 画像確認: sheet-4は画像0枚（sheets.tsv / images配下に該当ファイル無し）。レイアウト図は無く本文のみで判定した。
- 実装参照: `src/Eccube/Controller/App/OrderController.php:46-67`
- 実装実態: 印刷結果XMLの取り出しはURLのクエリを先に見るため、クエリに同名の値を付けるとボディの値ではなくクエリの値で更新処理が動く。
- 判定根拠: src/Eccube/Controller/App/OrderController.php:67 は接続種別と同じ取り出し方で印刷結果XMLを読んでおり、vendor/symfony/http-foundation/Request.php:744-760 の通りクエリ→ボディの順に探すため、クエリの同名値が優先される。設計はボディからのみ読み取ると定めている。接続種別をクエリ・ボディ双方から受け取る点（src/Eccube/Controller/App/OrderController.php:46）は設計どおり。
- 確信度: high

### sheet-6-R040 スマレジ受信処理 — 実装違い／IO／P3

- 正本: sheet-6（スマレジ受信処理） HTML行 1487 付近
- 正本引用: 「配送情報は使用用途がないので未登録とする」
- 設計期待値: スマレジ取引から新規作成する受注には配送に関する情報（配送方法・お届け先）が登録されない
- 画像確認: 本シートは画像0枚（images/sheet-6_img*.png が存在しない）ため、図中文言の確認対象なし
- 実装参照: `src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:135;src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandler.php:155;src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:96`
- 実装実態: 新規受注には必ず配送情報が1件作られ、配送方法=店頭受取と、会員なら会員住所・非会員なら店舗住所がお届け先として設定される（src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:135。src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:128 に「Shippingを作らないと管理受注検索やマイページの明細表示が壊れる」ため作る旨のコメントがある）
- 判定根拠: 正本は新規受注について配送情報を未登録とすると定めているが、実装は全パターンで配送情報を生成して住所まで設定している。なお同じ節の複数受注購入パターンには「配送方法は店頭受取とする」（sheet-6-R080）とあり、正本内でも配送情報の扱いに緊張がある点は付記する
- 確信度: med

### sheet-6-R113 スマレジ受信処理 — 実装違い／IO／P3

- 正本: sheet-6（スマレジ受信処理） HTML行 1560 付近
- 正本引用: 「200　レスポンスデータは空を返す」
- 設計期待値: Webhookを正常に受け付けたときは、状態コード200を返し、応答本文には何も含めない。
- 画像確認: 画像0枚（images/ に sheet-6/sheet-5 の図は無い）。レイアウト図は存在しないためテキスト全文で判定した。
- 実装参照: `src/Eccube/Controller/Smaregi/WebhookController.php:107-109;src/Eccube/Controller/Smaregi/WebhookController.php:85-88`
- 実装実態: 200 は返すが、応答本文に {”status”:”ok”} を入れて返している（src/Eccube/Controller/Smaregi/WebhookController.php:107-109）。重複受信時も {”status”:”ok”,”message”:”Event is duplicate”} を本文に入れて200で返す（src/Eccube/Controller/Smaregi/WebhookController.php:85-88）。
- 同じ実装実態でまとまる要求: sheet-6-R005（スマレジ受信処理 / 実装参照 `src/Eccube/Controller/Smaregi/WebhookController.php:107`）
- 判定根拠: [gate7/codex] sheet-6-R005 と同じ実装欠陥として畳む。sheet-6-R005へ畳む 設計は 200 の説明として「レスポンスデータは空を返す」と定めているが、実装は 200 とともに JSON 本文を返している。処理概要側も「レスポンス書式　なし(ステータスコードのみ)」であり、本文を返さないことが設計の期待。
- 確信度: high

### sheet-6-R179 スマレジ受信処理 — 未実装／IO／P3

- 正本: sheet-6（スマレジ受信処理） HTML行 1630 付近
- 正本引用: 「登録する履歴の備考には、付与のときは「店舗付与」、利用のときは「店舗使用」と記録する。」
- 設計期待値: スマレジ取引で登録するポイント履歴の備考に、付与のときは「店舗付与」、利用のときは「店舗使用」と記録される。
- 画像確認: 画像0枚（images/ に sheet-6/sheet-5 の図は無い）。レイアウト図は存在しないためテキスト全文で判定した。
- 実装参照: `src/Eccube/Service/PointService.php:63;src/Eccube/Service/PointService.php:150;src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:172`
- 実装実態: 履歴を作るとき備考に何も渡していないため（src/Eccube/Service/PointService.php:63 と :150、src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:172 のいずれも備考の引数が null）、備考は空のまま登録される。「店舗付与」「店舗使用」という文言は ee 全体に存在しない。
- 判定根拠: ポイント履歴の備考は管理画面の会員ポイント画面に列として表示される（src/Eccube/Resource/template/admin/Customer/point_update.twig:117,:138）ため、備考が空だと店舗由来の付与・利用を画面で区別できない。備考を設定できる仕組み自体はある（src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:70-72）が、スマレジ経由の登録では渡していない。
- 確信度: high

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 5 | 0 | 0 | 0 | 5 |
| sheet-2 | 目次 | 6 | 0 | 0 | 0 | 6 |
| sheet-3 | 注文印刷_印刷情報をプリンタへ送信 | 132 | 0 | 10 | 0 | 122 |
| sheet-4 | 注文印刷_該当受注のステータスを印刷済みに変更 | 109 | 2 | 7 | 0 | 100 |
| sheet-5 | 店頭注文番号取得 | 32 | 0 | 0 | 0 | 32 |
| sheet-6 | スマレジ受信処理 | 198 | 2 | 3 | 0 | 193 |

