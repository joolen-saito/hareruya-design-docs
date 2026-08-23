# 実装乖離監査 — 0507_基本設計仕様書(API_ネット買取管理).html

- 正本: `excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **382要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 0 | ○ |
| 実装違い | 実装はあるが設計と違う | 5 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 3 | — |
| 設計どおり | 設計どおり実装されている | 224 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 150 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 0 | — |
| **合計** | | **382** | |

## 不具合 3件（P1 0 / P2 2 / P3 1）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 2件は重複として代表へ折り畳んだ（判定そのものは 5件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-4-R044 | ネット買取受注一覧取得 | 実装違い | IO | P2 | 査定申込日を、年月日と時刻を「T」でつなぎ時差を添えた日時表記（ISO8601）の文字列として返す。 |
| sheet-7-R045 | ネット買取注文の査定終了処理 | 実装違い | IO | P2 | リクエストの検証に失敗したときは、入力不正としてHTTP 400 と エラーメッセージの配列を返す。 |
| sheet-9-R031 | 複数ネット買取IDから個別入力商品の一覧を取得 | 実装違い | IO | P3 | 申込時買取価格が1件も対応しない買取代表カードでは、応答にその項目自体を含めない（空の入れ物も返さない）。 |

### sheet-4-R044 ネット買取受注一覧取得 — 実装違い／IO／P2

- 正本: sheet-4（ネット買取受注一覧取得） HTML行 1168 付近
- 正本引用: 「査定申込日はISO8601形式の日時文字列で返す。」
- 設計期待値: 査定申込日を、年月日と時刻を「T」でつなぎ時差を添えた日時表記（ISO8601）の文字列として返す。
- 画像確認: sheet-4_img1.png はMTGBuyer側「お客様選択」画面。列は 買取番号／申込み時間／氏名／買取カテゴリ／査定担当者／フリーコメント欄で、行ごとに「査定中断」「査定前」ボタン、右上に「更新」ボタン。本APIが返す netBuyOrderId・applyDate・氏名・memberName・freeComment・netOrderStatusId がこの画面の各列に対応する（買取カテゴリ列は買取商品一覧取得APIのpurchaseCategory由来）。画像内に本APIへの追加I/O要求は無い（画面はMTGBuyer側の実装でeeの対象外）。 画像の申込み時間欄は「8/27/2025 2:07:06 AM」だがこれはMTGBuyer側の表示整形であり、API応答の書式を定めるものではない。
- 実装参照: `src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:73`
- 実装実態: applyDate を「2025/09/18 10:21:07」の形（年/月/日 空白 時:分:秒）の文字列で返しており、ISO8601の日時表記になっていない（src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:73）。
- 判定根拠: src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:73 の書式指定は Y/m/d H:i:s で、日付と時刻の区切り記号も時差も持たない。現行(pf)は受注日を日時値のまま応答へ渡しており（/home/y-saito/Developments/pf-api/src/Repository/DtbBuyOrderRepository.php:46 で orderDate をそのまま選択、応答整形は共通の直列化に委ねる）ISO8601で出るため、正本の記述は現行の挙動と一致する。差分はee側の書式指定にある。
- 確信度: high

### sheet-7-R045 ネット買取注文の査定終了処理 — 実装違い／IO／P2

- 正本: sheet-7（ネット買取注文の査定終了処理） HTML行 1462 付近
- 正本引用: 「ステータスが未選択のとき 入力不正（HTTP 400）で終了する」
- 設計期待値: リクエストの検証に失敗したときは、入力不正としてHTTP 400 と エラーメッセージの配列を返す。
- 画像確認: sheet-7_img1.png（MTGBuyerのネット買取査定画面）を確認。左下に「査定完了」ボタン、明細表に商品名・言語・状態・フォイル・枚数・買取価格・小計の列があり、シート本文の項目と一致する。ee側の画面ではないため実装対象はAPIのみ。
- 実装参照: `src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:171; tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:717`
- 実装実態: 検証失敗時のHTTPステータスは422で返る（tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:717 が HTTP_UNPROCESSABLE_ENTITY を期待している）。body は {code:422, errors:[...]}（src/Eccube/EventListener/ExceptionListener.php:101,140-143）。
- 判定根拠: ステータスコード表の「400　バリデーションエラー」は述語を持たない断片のため、同じ内容を述べているリニューアル後仕様の行を引用した。src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:171 の本文マッピングは検証失敗時に422を投げる既定のままで、400へ寄せる指定が無い。tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:717 が422を期待して固定している。
- 確信度: high

### sheet-9-R031 複数ネット買取IDから個別入力商品の一覧を取得 — 実装違い／IO／P3

- 正本: sheet-9（複数ネット買取IDから個別入力商品の一覧を取得） HTML行 1693 付近
- 正本引用: 「一致する申込時買取価格が1件も無い買取代表カードには、申込時買取価格の項目そのものを付けない（空のオブジェクトも返さない）。」
- 設計期待値: 申込時買取価格が1件も対応しない買取代表カードでは、応答にその項目自体を含めない（空の入れ物も返さない）。
- 画像確認: sheet-9_img1.png はMTGBuyer側「お客様選択」画面（sheet-4・sheet-8と同じ画像）。列は 買取番号／申込み時間／氏名／買取カテゴリ／査定担当者／フリーコメント欄で、右上に「更新」ボタン、行ごとに「査定中断」「査定前」ボタン。個別入力商品そのものは画面に写っておらず、画像内に本APIへの追加I/O要求（項目・文言）は無い（画面はMTGBuyer側の実装でeeの対象外）。
- 実装参照: `src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyMainCardController.php:63-67;src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyMainCardController.php:80`
- 実装実態: 対応する申込時買取価格が1件も無くても applicationPrice の項目を必ず持たせ、中身が空のまま返す（src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyMainCardController.php:63-67 で空の入れ物を作り、src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyMainCardController.php:80 で無条件に項目へ入れている）。
- 判定根拠: src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyMainCardController.php:63 が空の入れ物を先に作り、src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyMainCardController.php:64-67 で対応する価格があるときだけ中身を詰め、src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyMainCardController.php:80 は条件なしに項目へ入れる。したがって価格が1件も無い買取代表カードでも項目が応答に現れる（tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyMainCardControllerTest.php:138 は価格がある場合の確認だけで、無い場合の確認は無い）。現行(pf)は一致する価格があったときだけ項目を作るため、価格が無い買取代表カードには項目が現れない（/home/y-saito/Developments/pf-api/src/Controller/Admin/BuyMainCardController.php:39-45）。正本の記述は現行の挙動と一致し、差分はee側にある。なお本シートの現行仕様節は Source が a07-06（買取代表カード＝ネット買取受注の商品一覧）で、sheet-8 の現行仕様節（a07-07 個別入力商品の一覧）と入れ替わって取り込まれている。この行は買取代表カード側の記述なので、その機能の実装で判定した。
- 確信度: med

## 掲載しなかった判定

- 区分が「表示メッセージ」の指摘 2件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0507/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 6 | 0 | 0 | 0 | 6 |
| sheet-2 | 目次 | 9 | 0 | 0 | 0 | 9 |
| sheet-3 | まとめて買取商品IDの取得 | 31 | 0 | 0 | 0 | 31 |
| sheet-4 | ネット買取受注一覧取得 | 50 | 0 | 1 | 0 | 49 |
| sheet-5 | ネット買取受注コメント更新 | 39 | 0 | 0 | 0 | 39 |
| sheet-6 | ネット買取受注ステータス更新 | 70 | 0 | 0 | 3 | 67 |
| sheet-7 | ネット買取注文の査定終了処理 | 83 | 0 | 3 | 0 | 80 |
| sheet-8 | 複数ネット買取IDからネット買取受注の商品一覧を取得 | 48 | 0 | 0 | 0 | 48 |
| sheet-9 | 複数ネット買取IDから個別入力商品の一覧を取得 | 46 | 0 | 1 | 0 | 45 |

