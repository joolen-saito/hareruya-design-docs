# 実装乖離監査 — 0506_基本設計仕様書(API_店頭買取管理).html

- 正本: `excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **692要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 0 | ○ |
| 実装違い | 実装はあるが設計と違う | 30 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 0 | — |
| 設計どおり | 設計どおり実装されている | 365 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 294 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 3 | — |
| **合計** | | **692** | |

## 不具合 17件（P1 0 / P2 8 / P3 9）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 12件は重複として代表へ折り畳んだ（判定そのものは 29件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-10-R034 | カード名から買取用商品情報を取得 | 実装違い | ふるまい | P2 | 商品画像が結び付いていない商品の商品規格は、応答に含まれない。 |
| sheet-11-R019 | 部門一覧を取得 | 実装違い | IO | P2 | 部門一覧の応答は、必ず 200 が入る結果コードを項目として持つ。 |
| sheet-12-R018 | 固定価格部門の部門情報を取得 | 実装違い | IO | P2 | 固定価格商品部門IDの取得要求に対する応答には、レスポンスコードを表す code が必ず200として含まれる。 |
| sheet-15-R012 | 【新規】ダブルチェック者更新 | 実装違い | IO | P2 | ダブルチェック者更新の要求では、ダブルチェック者のメンバーIDを member_id という項目で必須で受け取り、その値をダブルチェック者として記録する。 |
| sheet-4-R059 | 店頭買取情報取得 | 実装違い | IO | P2 | 本人確認が未登録の受注では identificationId に 0 を返す。 |
| sheet-5-R076 | 店頭買取情報更新 | 実装違い | ふるまい | P2 | 適格請求書発行事業者に該当する受注のときだけ、適格請求書発行事業者確認フラグが指定された値（true でも false でも）に更新され、該当しない受注では指定されても更新されない。 |
| sheet-5-R081 | 店頭買取情報更新 | 実装違い | IO | P2 | 入力検証に失敗したときは入力不正（HTTP 400）を返し、検出した全メッセージがerrors配列の要素として返る。データの削除・登録・保存は行われない。 |
| sheet-8-R012 | カード詳細IDから買取用商品情報を取得 | 実装違い | IO | P2 | カード詳細IDを指定したとき、応答にはそのカード詳細だけでなく、同じカードに属する他のカード詳細の情報も含まれる。 |
| sheet-10-R025 | カード名から買取用商品情報を取得 | 実装違い | IO | P3 | 指定された名称に紐づく商品が0件のときは、見つからなかったという結果（404）で応答する。 |
| sheet-10-R031 | カード名から買取用商品情報を取得 | 実装違い | ふるまい | P3 | 検索語に含まれる % と _ は文字そのものとして照合され、任意文字列・任意1文字の代用として働かない。 |
| sheet-10-R040 | カード名から買取用商品情報を取得 | 実装違い | IO | P3 | カード名検索の応答では、cards の各要素が1から始まる連番のキーで並ぶ。 |
| sheet-3-R038 | 買取アプリ用ログイン | 実装違い | IO | P3 | ログイン成功時に返すトークンは、発行者と、認証した管理者会員のIDの2つを持つ。 |
| sheet-4-R056 | 店頭買取情報取得 | 実装違い | IO | P3 | applyDate はISO8601形式の日時文字列（例 2024-09-20T10:47:29+09:00）で返す。 |
| sheet-4-R062 | 店頭買取情報取得 | 実装違い | IO | P3 | 住所は、国が日本のときは都道府県名・住所1・住所2、それ以外の国のときは国名・住所2・住所1 の順に、半角空白区切りで連結した1つの文字列で返す（住所3は連結しない）。 |
| sheet-5-R092 | 店頭買取情報更新 | 実装違い | IO | P3 | 店頭買取ステータスマスタに存在しないステータスIDが指定されたとき、errorsに「MtbOtcBuyOrderStatusに{指定ID}が見つかりません。」という日本語のメッセージを含めて返す。 |
| sheet-8-R053 | カード詳細IDから買取用商品情報を取得 | 実装違い | IO | P3 | 商品規格ごとの応答項目として、商品コードが productCode という名前で入る。 |
| sheet-9-R030 | 商品IDリストから買取用商品情報を取得 | 実装違い | ふるまい | P3 | 商品画像が登録されていない商品は、削除済みでなくても買取用商品情報の結果に含まれない。 |

### sheet-10-R034 カード名から買取用商品情報を取得 — 実装違い／ふるまい／P2

- 正本: sheet-10（カード名から買取用商品情報を取得） HTML行 1870 付近
- 正本引用: 「商品または商品規格に次のいずれかが結び付いていない場合、その商品規格は応答に含めない。 商品に結び付く商品画像」
- 設計期待値: 商品画像が結び付いていない商品の商品規格は、応答に含まれない。
- 画像確認: img1: MTGBuyer側のカード読取画面（言語・カードの状態・フォイル・カード名・カードセット・プロモーション・在庫数・販売価格・買取価格）。img2: 虫眼鏡押下で出るカード名検索ダイアログ（入力欄と検索/キャンセル）。検索語をそのまま渡す前方一致検索の入口であることを確認。
- 実装参照: `src/Eccube/Repository/Master/MtbCardRepository.php:159`
- 実装実態: 商品画像は任意の結び付き（並び順0の1件）として扱われ、画像が無い商品の商品規格も imageFileName を値なしにして応答に含まれる（src/Eccube/Repository/Master/MtbCardRepository.php:159、src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:78）。現行(pf-api/src/Repository/DtbProductRepository.php:251)は画像が無い商品を応答から落としていた。
- 同じ実装実態でまとまる要求: sheet-8-R062（カード詳細IDから買取用商品情報を取得）
- 判定根拠: src/Eccube/Repository/Master/MtbCardRepository.php:159 が任意結合のため画像0件でも行が残る。他に画像の有無で落とす条件は src/Eccube/Repository/Master/MtbCardRepository.php:152-200 に無い。
- 確信度: high

### sheet-11-R019 部門一覧を取得 — 実装違い／IO／P2

- 正本: sheet-11（部門一覧を取得） HTML行 1954 付近
- 正本引用: 「取得できる部門が1件も無いときも、成功として応答する。部門の配列を空にして返し、取得できないことを表す応答や失敗のステータスには置き換えない。」
- 設計期待値: 部門一覧の応答は、必ず 200 が入る結果コードを項目として持つ。
- 画像確認: image1は個別入力商品の登録行にある部門プルダウン。「1010101:PCシングル」「1020101:スタンダードシングル」…と部門コード昇順で並んでいる。
- 実装参照: `src/Eccube/Controller/App/MTGBuyer/V1/Admin/SectionController.php:40-49`
- 実装実態: 応答は部門の一覧そのものを並べた形で返しており、結果コードの項目が無い。
- 同じ実装実態でまとまる要求: sheet-11-R020（部門一覧を取得）、sheet-11-R021（部門一覧を取得）
- 判定根拠: src/Eccube/Controller/App/MTGBuyer/V1/Admin/SectionController.php:40-49 は部門1件ごとの3項目（部門ID・部門名・部門コード）を並べた一覧をそのまま応答にしており、結果コード・実行結果メッセージ・部門の配列という3項目の入れ物が無い。tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/SectionControllerTest.php:77-85 も一覧がそのまま返ることを期待している。引用は同じ応答仕様を述べている現行仕様の文（レスポンスデータ表のcode/message/sections の各行は表のセル単独のため機械ゲートが通らない）。
- 確信度: high

### sheet-12-R018 固定価格部門の部門情報を取得 — 実装違い／IO／P2

- 正本: sheet-12（固定価格部門の部門情報を取得） HTML行 2040 付近
- 正本引用: 「・本店管理画面の追加システム設定画面から設定できる固定価格商品部門IDを取得する リクエストパラメータ 項目名 型 必須 最大文字数 または最大値 入力例 備考 なし リクエストパラメータサンプル ステータスコード コード 説明 200 レスポンスデータ 名前 型 説明 code 文字列 レスポンスコード、必ず200が入る section_id 文字列 固定価格商品部門ID」
- 設計期待値: 固定価格商品部門IDの取得要求に対する応答には、レスポンスコードを表す code が必ず200として含まれる。
- 画像確認: sheet-12_img1.png はMTGBuyerのカード登録画面で「1円/2円/5円/10円」の固定価格ボタンが写っている（部門IDの用途を示す図）。sheet-12_img2.png は本店管理画面の追加システム設定で「固定価格商品部門ID」欄に 29 が入っている図で、本APIが返す値の設定元がこの欄であることを確認した。
- 実装参照: `src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php:51-59`
- 実装実態: OptionController::getFixedPriceSection は mtb_option の fixed_price_section の値だけを new JsonResponse($value) で返す。テスト tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OptionControllerTest.php:184 が レスポンス本文を json_encode($expectedValue)（例 "29"）と断定しており、code も section_id も名前として現れない。
- 同じ実装実態でまとまる要求: sheet-12-R019（固定価格部門の部門情報を取得）
- 判定根拠: レスポンス本文は設定値そのもの（JSON文字列）で、codeという名前の項目は存在しない。同じMTGBuyer管理APIでも更新系は ["code" => 200] を返しており（src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:150）、本APIだけ応答の形が設計と違う。応答の形は外部に出るI/Oであり内部挙動ではない。
- 確信度: high

### sheet-15-R012 【新規】ダブルチェック者更新 — 実装違い／IO／P2

- 正本: sheet-15（【新規】ダブルチェック者更新） HTML行 2287 付近
- 正本引用: 「★ダブルチェック者は新規のカラムに追加する リクエストパラメータ 項目名 型 必須 最大文字数 または最大値 入力例 備考 member_id 数値(整数) 〇 1000 メンバーID」
- 設計期待値: ダブルチェック者更新の要求では、ダブルチェック者のメンバーIDを member_id という項目で必須で受け取り、その値をダブルチェック者として記録する。
- 画像確認: sheet-15_img1.png を確認。MTGバイヤーの店頭買取査定画面で、ヘッダにログインユーザ（k.ishikawa）と明細一覧が写っている。ダブルチェック者を選ぶUIそのものは図に写っていないが、連携元がこのアプリであることを確認した。
- 実装参照: `src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:239-256`
- 実装実態: OtcBuyOrderController.php:239 は double_check_member_id だけを読み、値が無ければ 「ダブルチェック者を入力してください」で必須エラーにする。member_id を送っても参照されないため、設計どおりの呼び出しでは必須エラーになる。テストも double_check_member_id で送信している（tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:692）。
- 判定根拠: リクエストで受け取る項目は外部との取り決めであって内部挙動ではない。設計の唯一の必須項目 member_id が実装では受け付けられず、別名の項目のみを必須としているため、設計どおりの呼び出しではダブルチェック者を登録できない。
- 確信度: high

### sheet-4-R059 店頭買取情報取得 — 実装違い／IO／P2

- 正本: sheet-4（店頭買取情報取得） HTML行 1221 付近
- 正本引用: 「identificationId 本人確認が未登録の場合は0。」
- 設計期待値: 本人確認が未登録の受注では identificationId に 0 を返す。
- 画像確認: sheet-4_img1.png はMTGBuyer側「お客様選択」画面。列見出しは 査定番号／申込み時間／氏名／査定担当者／フリーコメント欄、行ごとに「査定中断」ボタン、右上に「更新」ボタン。本APIが返す assessmentId・applyDate・氏名・memberName・freeComment がこの画面の各列に対応する。画像内に本APIの追加I/O要求は無い（画面はMTGBuyer側の実装でeeの対象外）。
- 実装参照: `src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:106;src/Eccube/Entity/DtbOtcBuyOrder.php:140-142`
- 実装実態: 本人確認が未登録の受注では identificationId に null を返す（src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:106）。受注の本人確認証明書は未設定を許す項目で（src/Eccube/Entity/DtbOtcBuyOrder.php:140-142）、未設定時は0でなくnullになる。テストもnullを期待値にしている（tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:133）。
- 判定根拠: 同じ節の他の項目は「未設定の場合はnull」と書き分けられているのに、identificationId だけ「本人確認が未登録の場合は0」と明記されている。実装は他項目と同じnullを返しており、この行の指定と食い違う。MTGBuyerが身分証明書種別の初期選択に使う値のため、未登録の表し方の差はそのまま画面の挙動差になる。
- 確信度: high

### sheet-5-R076 店頭買取情報更新 — 実装違い／ふるまい／P2

- 正本: sheet-5（店頭買取情報更新） HTML行 1346 付近
- 正本引用: 「査定担当者には認証した管理者会員を、更新日時には現在日時を設定する。適格請求書発行事業者に該当する受注のときだけ、確認済みフラグを指定値で更新する（該当しない受注では、指定されても更新しない）。」
- 設計期待値: 適格請求書発行事業者に該当する受注のときだけ、適格請求書発行事業者確認フラグが指定された値（true でも false でも）に更新され、該当しない受注では指定されても更新されない。
- 画像確認: sheet-5_img1.png（MTGBuyer書類確認画面：買取成立／経理払い出し待ち／買取キャンセルの3ボタンと端末取引ID入力欄）を確認。この行に対応する追加文言は画像に無い。
- 実装参照: `src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:62-64`
- 実装実態: 受注が適格請求書発行事業者かどうかを見ず、指定値が true のときだけフラグを true にしている。そのため（1）適格請求書発行事業者の受注で false を指定しても確認済みが解除されず、（2）適格請求書発行事業者でない受注に true を指定すると確認済みになる。査定担当者・更新日時の設定は src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:48-49 で一致。
- 判定根拠: 現行実装（pf-api の店頭買取受注詳細更新）は受注側の適格請求書発行事業者フラグを条件に確認済みフラグを指定値へ更新していた。ee は条件が指定値そのものに置き換わっており、受注側の該当有無を参照する箇所が無い。
- 確信度: high

### sheet-5-R081 店頭買取情報更新 — 実装違い／IO／P2

- 正本: sheet-5（店頭買取情報更新） HTML行 1352 付近
- 正本引用: 「入力検証エラー 入力不正（HTTP 400）とし、全メッセージをerrors配列で返す。削除・登録・保存は行わない」
- 設計期待値: 入力検証に失敗したときは入力不正（HTTP 400）を返し、検出した全メッセージがerrors配列の要素として返る。データの削除・登録・保存は行われない。
- 画像確認: sheet-5_img1.png（MTGBuyer書類確認画面：買取成立／経理払い出し待ち／買取キャンセルの3ボタンと端末取引ID入力欄）を確認。この行に対応する追加文言は画像に無い。
- 実装参照: `src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateOtcBuyOrderDto.php:33-51;src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:130;tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:330-350`
- 実装実態: リクエスト本文の検証に失敗すると入力不正（400）ではなく422が返り、errors には違反を1つの文字列に連結した1要素だけが入る。この応答を期待するテストが tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:330-350 にある。削除・登録・保存が行われない点は一致。
- 同じ実装実態でまとまる要求: sheet-5-R091（店頭買取情報更新）、sheet-5-R093（店頭買取情報更新）、sheet-5-R094（店頭買取情報更新）、sheet-5-R095（店頭買取情報更新）、sheet-5-R096（店頭買取情報更新）
- 判定根拠: 正常系以外の応答コードを tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php が422で固定しており、明細の商品名未入力・ステータス範囲外・明細空・単価負数のいずれも422になる。正本（現行仕様・レスポンスサンプルとも）は400。
- 確信度: high

### sheet-8-R012 カード詳細IDから買取用商品情報を取得 — 実装違い／IO／P2

- 正本: sheet-8（カード詳細IDから買取用商品情報を取得） HTML行 1611 付近
- 正本引用: 「・カード詳細IDに紐づくカードに属する他の詳細情報も取得する」
- 設計期待値: カード詳細IDを指定したとき、応答にはそのカード詳細だけでなく、同じカードに属する他のカード詳細の情報も含まれる。
- 画像確認: img1: MTGBuyer側のカード読取画面（言語・カードの状態・ノーマル/フォイル・カード名・カードセット・プロモーション・在庫数・販売価格・買取価格の表示欄）。応答項目 stock/price/buyPrice が画面に出る項目であることを確認。
- 実装参照: `src/Eccube/Repository/Master/MtbCardRepository.php:84-96;src/Eccube/Repository/Master/MtbCardRepository.php:152-200`
- 実装実態: 指定したカード詳細ID自身で絞り込み、応答に載せる各項目も同じ絞り込み後のカード詳細から取っているため、応答には指定した1件のカード詳細しか入らない。現行(pf-api/src/Repository/DtbProductRepository.php:141-142)は指定詳細が属するカードの全詳細を返していた。
- 同じ実装実態でまとまる要求: sheet-8-R036（カード詳細IDから買取用商品情報を取得 / 実装参照 `src/Eccube/Repository/Master/MtbCardRepository.php:84-96;src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:84-85`）
- 判定根拠: src/Eccube/Repository/Master/MtbCardRepository.php:90 の絞り込みが、応答項目の取得元でもあるカード詳細自身に掛かる。同じカードの他の詳細を残す経路が実装に無い。
- 確信度: high

### sheet-10-R025 カード名から買取用商品情報を取得 — 実装違い／IO／P3

- 正本: sheet-10（カード名から買取用商品情報を取得） HTML行 1857 付近
- 正本引用: 「追加開発でログイン者の所属店舗のEC在庫を取得するようにする リクエストパラメータ 項目名	型	必須	最大文字数 または最大値	入力例	備考 name	文字列	〇		【Foil】《王冠泥棒	商品名 リクエストパラメータサンプル ステータスコード コード　説明 200　成功 404　指定された名称に紐づく商品が見つからなかった場合」
- 設計期待値: 指定された名称に紐づく商品が0件のときは、見つからなかったという結果（404）で応答する。
- 画像確認: img1: MTGBuyer側のカード読取画面（言語・カードの状態・フォイル・カード名・カードセット・プロモーション・在庫数・販売価格・買取価格）。img2: 虫眼鏡押下で出るカード名検索ダイアログ（入力欄と検索/キャンセル）。検索語をそのまま渡す前方一致検索の入口であることを確認。
- 実装参照: `src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:99-113`
- 実装実態: 0件でも成功(200)で、cards が空のオブジェクトの応答を返す（src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:113、src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:123）。見つからない扱いにしない。現行(pf-api/src/Controller/ProductController.php:206-207)は0件で404を返していた。同じ設計書のカード詳細ID指定側は0件で404を返す（src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:57-59）。
- 判定根拠: 引用はステータスコード表（200/404）を含む連続範囲。表のセル単独では述語が無いため直前の行を含めた。src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:99-113 に0件を見つからない扱いにする分岐は無い。
- 確信度: high

### sheet-10-R031 カード名から買取用商品情報を取得 — 実装違い／ふるまい／P3

- 正本: sheet-10（カード名から買取用商品情報を取得） HTML行 1867 付近
- 正本引用: 「カード名に含まれる % と _ はエスケープし、ワイルドカードではなく文字そのものとして扱う。」
- 設計期待値: 検索語に含まれる % と _ は文字そのものとして照合され、任意文字列・任意1文字の代用として働かない。
- 画像確認: img1: MTGBuyer側のカード読取画面（言語・カードの状態・フォイル・カード名・カードセット・プロモーション・在庫数・販売価格・買取価格）。img2: 虫眼鏡押下で出るカード名検索ダイアログ（入力欄と検索/キャンセル）。検索語をそのまま渡す前方一致検索の入口であることを確認。
- 実装参照: `src/Eccube/Repository/Master/MtbCardRepository.php:136-137`
- 実装実態: 受け取ったカード名をそのまま前方一致の照合値に組み立てるため、% は任意文字列、_ は任意1文字として働き、名前に該当しない商品まで一致する（src/Eccube/Repository/Master/MtbCardRepository.php:136-137、src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:101）。現行(pf-api/src/Repository/DtbProductRepository.php:246)は%と_を打ち消してから照合していた。
- 判定根拠: [gate7/refute] 重要度を P3 へ。事実は反証できない。引用「カード名に含まれる % と _ はエスケープし、ワイルドカードではなく文字そのものとして扱う。」は sheets/sheet-10.txt:63 に逐語で実在する述語つき業務ロジックで、同ブロックに打ち消しは無い。実装は src/Eccube/Repository/Master/MtbCardRepository.php:136-137 が product.name LI src/Eccube/Repository/Master/MtbCardRepository.php:136-137 と src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:101-113 に打ち消し処理が無い。ee内には同種の打ち消し処理（src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:244）があるが、この検索では使っていない。 反証段: 事実は維持（打ち消し処理は実装に無い）。重要度は、%と_を含むカード名の入力は実運用でほぼ起きず、起きても余分な候補が並ぶだけで再入力すれば済むため P2 から P3 へ是正。
- 確信度: high

### sheet-10-R040 カード名から買取用商品情報を取得 — 実装違い／IO／P3

- 正本: sheet-10（カード名から買取用商品情報を取得） HTML行 1876 付近
- 正本引用: 「検索で得たカードだけを1始まりの連番でキー付けし直して返す。各カードの配下は、カード詳細ID・言語コード・状態コードの順で入れ子にする。ページングの件数（総件数・1ページあたり件数など）は返さない。」
- 設計期待値: カード名検索の応答では、cards の各要素が1から始まる連番のキーで並ぶ。
- 画像確認: img1: MTGBuyer側のカード読取画面（言語・カードの状態・フォイル・カード名・カードセット・プロモーション・在庫数・販売価格・買取価格）。img2: 虫眼鏡押下で出るカード名検索ダイアログ（入力欄と検索/キャンセル）。検索語をそのまま渡す前方一致検索の入口であることを確認。
- 実装参照: `src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:74-81;src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:123`
- 実装実態: cards のキーはカードIDのままで、連番への振り直しをしない（src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:74-81,123）。カード詳細ID・言語コード・状態コードの順の入れ子（src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:84-113）と、件数を返さない点（src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:123）は設計どおり。現行(pf-api/src/Controller/ProductController.php:210-213)は1始まりの連番へ振り直していた。
- 同じ実装実態でまとまる要求: sheet-10-R046（カード名から買取用商品情報を取得）
- 判定根拠: src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:74 でカードIDをキーにし、src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:109-113 も含めて振り直す箇所が無い。カード詳細ID指定側（sheet-8）はカードIDキーが正本の指定なので、この振り直しはカード名検索だけの要求。
- 確信度: high

### sheet-3-R038 買取アプリ用ログイン — 実装違い／IO／P3

- 正本: sheet-3（買取アプリ用ログイン） HTML行 1090 付近
- 正本引用: 「発行されるトークンは、発行者と利用者ID（認証した管理者会員のID）を持つ。以降の各APIは受け取ったトークンの利用者IDから管理者会員を引いて認可し、会員を引けないときは認可しない。」
- 設計期待値: ログイン成功時に返すトークンは、発行者と、認証した管理者会員のIDの2つを持つ。
- 画像確認: image1（ログインID/パスワード/ログインボタン）・image2（「正しいログインIDとパスワードを入力してください。」）はMTGBuyer側のログイン画面。文言はアプリ側表示で、API応答文言はリニューアル後の表示メッセージ表が正。
- 実装参照: `src/Eccube/Security/AccessToken/JwtTokenService.php:79-81`
- 実装実態: トークンには利用者ID（sub）だけを入れて署名しており、発行者を表す値を入れていない。後半の「利用者IDから管理者会員を引いて認可し、引けないときは認可しない」は実装と一致している。
- 判定根拠: src/Eccube/Security/AccessToken/JwtTokenService.php:79-81 が payload に sub のみを設定してトークンを組み立てている。発行者に相当する値を設定している箇所は src/Eccube/Security/AccessToken/JwtTokenService.php 内に無い。認可側（src/Eccube/Security/AccessToken/JwtTokenHandler.php:42-58, src/Eccube/Security/AccessToken/JwtTokenHandler.php:69-82）は sub から会員を引き、引けないときは認証拒否にしており、こちらは設計どおり。
- 確信度: med

### sheet-4-R056 店頭買取情報取得 — 実装違い／IO／P3

- 正本: sheet-4（店頭買取情報取得） HTML行 1218 付近
- 正本引用: 「applyDate ISO8601形式の日時文字列で返す。」
- 設計期待値: applyDate はISO8601形式の日時文字列（例 2024-09-20T10:47:29+09:00）で返す。
- 画像確認: sheet-4_img1.png はMTGBuyer側「お客様選択」画面。列見出しは 査定番号／申込み時間／氏名／査定担当者／フリーコメント欄、行ごとに「査定中断」ボタン、右上に「更新」ボタン。本APIが返す assessmentId・applyDate・氏名・memberName・freeComment がこの画面の各列に対応する。画像内に本APIの追加I/O要求は無い（画面はMTGBuyer側の実装でeeの対象外）。
- 実装参照: `src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:97;tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:124`
- 実装実態: applyDate を 'Y/m/d H:i:s' 形式（例 2024/09/20 10:47:29）で返している（src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:97）。テストも同じ書式を期待値にしている（tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:124）。
- 判定根拠: [gate7/refute] 重要度を P3 へ。指摘自体は成立する。引用「applyDate ISO8601形式の日時文字列で返す。」は sheets/sheet-4.txt:90 に逐語で実在し、区分は現行仕様（カスタマイズ説明=現行踏襲、リニューアル後の仕様側に日時書式の上書き記述は無く sheet-4.txt:99 は「本APIは画面メッセージを扱わない」のみ）。同ブロック(sheet-4-R054..R062)の表は「出力: 値の表し方 ISO8601は日付と時刻をハイフン区切り・T連結で表す書式で、スラッシュ区切り・空白連結の値はこれに当たらない。同APIを読むMTGBuyerが申込み時間を解釈する値であり、書式差は日時の解釈失敗や誤表示につながる。同じ節の他のふるまい（freeComment・memberName・qualifiedInvoiceIssuerCode のnull）は一致しているため、この行だけが外れている。
- 確信度: high

### sheet-4-R062 店頭買取情報取得 — 実装違い／IO／P3

- 正本: sheet-4（店頭買取情報取得） HTML行 1224 付近
- 正本引用: 「customerInfo.address 国が日本のときは都道府県名・住所1・住所2、それ以外の国のときは国名・住所2・住所1 の順に、半角空白区切りで連結した1つの文字列で返す。」
- 設計期待値: 住所は、国が日本のときは都道府県名・住所1・住所2、それ以外の国のときは国名・住所2・住所1 の順に、半角空白区切りで連結した1つの文字列で返す（住所3は連結しない）。
- 画像確認: sheet-4_img1.png はMTGBuyer側「お客様選択」画面。列見出しは 査定番号／申込み時間／氏名／査定担当者／フリーコメント欄、行ごとに「査定中断」ボタン、右上に「更新」ボタン。本APIが返す assessmentId・applyDate・氏名・memberName・freeComment がこの画面の各列に対応する。画像内に本APIの追加I/O要求は無い（画面はMTGBuyer側の実装でeeの対象外）。
- 実装参照: `src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:90-92;tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:143-149`
- 実装実態: 日本のときは 都道府県名・住所1・住所2・住所3、日本以外のときは 国名・住所3・住所2・住所1 と、設計に無い住所3を加えて連結している（src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:90-92）。住所3が設定された受注では住所文字列に1区画多く現れる。テストも住所3を含む期待値になっている（tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:143-149）。
- 判定根拠: 連結する要素と順序が明記されているのに、実装は住所3を追加している。住所3は受注に存在する任意項目（src/Eccube/Entity/DtbOtcBuyOrder.php:76-77）で、値が入っていれば必ず出力に現れるため、MTGBuyerの氏名・住所照合欄に表示される文字列が設計と変わる。空のときは空要素が落ちるので一致する。
- 確信度: med

### sheet-5-R092 店頭買取情報更新 — 実装違い／IO／P3

- 正本: sheet-5（店頭買取情報更新） HTML行 1364 付近
- 正本引用: 「400 ステータスIDが店頭買取ステータスマスタに存在しない errorsに「MtbOtcBuyOrderStatusに{指定ID}が見つかりません。」を含む」
- 設計期待値: 店頭買取ステータスマスタに存在しないステータスIDが指定されたとき、errorsに「MtbOtcBuyOrderStatusに{指定ID}が見つかりません。」という日本語のメッセージを含めて返す。
- 画像確認: sheet-5_img1.png（MTGBuyer書類確認画面：買取成立／経理払い出し待ち／買取キャンセルの3ボタンと端末取引ID入力欄）を確認。この行に対応する追加文言は画像に無い。
- 実装参照: `src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateOtcBuyOrderDto.php:35`
- 実装実態: 範囲外のステータスIDには英語の 'order_status is invalid' が返る（指定IDも示されない）。買取成立・買取キャンセル・経理払い出し待ち以外はマスタに存在しても同じメッセージになる。
- 判定根拠: src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateOtcBuyOrderDto.php:35 の検証メッセージが唯一のステータス不正時の文言で、日本語のマスタ不在メッセージは ee のどこにも無い（『MtbOtcBuyOrderStatusに』で全文検索して該当なし）。同ファイル:30 は『バリデーションメッセージは旧システムを踏襲する』と記しており、この1件だけ踏襲されていない。
- 確信度: high

### sheet-8-R053 カード詳細IDから買取用商品情報を取得 — 実装違い／IO／P3

- 正本: sheet-8（カード詳細IDから買取用商品情報を取得） HTML行 1652 付近
- 正本引用: 「productCode	文字列	商品コード buyPrice	文字列	買取価格 price	文字列	基準価格（販売価格を取得していたが基準価格を取得する）」
- 設計期待値: 商品規格ごとの応答項目として、商品コードが productCode という名前で入る。
- 画像確認: img1: MTGBuyer側のカード読取画面（言語・カードの状態・ノーマル/フォイル・カード名・カードセット・プロモーション・在庫数・販売価格・買取価格の表示欄）。応答項目 stock/price/buyPrice が画面に出る項目であることを確認。
- 実装参照: `src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:115`
- 実装実態: 商品コードは productClassCode という名前で入り、productCode という項目は応答に無い（src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:115、取得元 src/Eccube/Repository/Master/MtbCardRepository.php:193）。現行(pf-api/src/Repository/DtbProductRepository.php:156)は productCode で返していた。
- 同じ実装実態でまとまる要求: sheet-10-R064（カード名から買取用商品情報を取得）
- 判定根拠: 応答を組み立てる箇所で項目名が productClassCode になっており、ee内に productCode へ読み替える箇所は無い（grepで src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:115 のみ）。
- 確信度: high

### sheet-9-R030 商品IDリストから買取用商品情報を取得 — 実装違い／ふるまい／P3

- 正本: sheet-9（商品IDリストから買取用商品情報を取得） HTML行 1769 付近
- 正本引用: 「商品画像・カード・カード詳細・レアリティ・言語・カード状態のいずれかが登録されていない商品は、削除済みでなくても結果に含まれない。カードセット・プロモーション・保管コードは未設定でも結果に含まれる。」
- 設計期待値: 商品画像が登録されていない商品は、削除済みでなくても買取用商品情報の結果に含まれない。
- 画像確認: image1は買取証明書（査定表）の印刷イメージ。商品名・言語・状態・フォイル・プロモーション・数・買取価格・小計が並ぶ。
- 実装参照: `src/Eccube/Repository/Master/MtbCardRepository.php:159`
- 実装実態: 商品画像は未登録でも結果に残る扱いになっており、画像ファイル名を値なしにしたまま該当商品を返す。カード・カード詳細・レアリティ・言語・カード状態が未登録なら除く点、カードセット・プロモーション・保管コードは未設定でも含める点は設計どおり。
- 判定根拠: src/Eccube/Repository/Master/MtbCardRepository.php:159 は商品画像を任意の付随情報として取り、未登録でも行が残る。未登録を除く条件は src/Eccube/Repository/Master/MtbCardRepository.php:167-172 の条件に無く、整形側（src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:60-67）も画像ファイル名が値なしの行を落としていない。カード・カード詳細・レアリティ・言語・カード状態は必須の辿りになっており（src/Eccube/Repository/Master/MtbCardRepository.php:155-165）除外される。
- 確信度: med

## 掲載しなかった判定

- 区分が「表示メッセージ」の指摘 1件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0506/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 5 | 0 | 0 | 0 | 5 |
| sheet-2 | 目次 | 18 | 0 | 0 | 0 | 18 |
| sheet-3 | 買取アプリ用ログイン | 44 | 0 | 1 | 0 | 43 |
| sheet-4 | 店頭買取情報取得 | 63 | 0 | 3 | 0 | 60 |
| sheet-5 | 店頭買取情報更新 | 105 | 0 | 8 | 0 | 97 |
| sheet-6 | 店頭買取情報コメント更新 | 37 | 0 | 0 | 0 | 37 |
| sheet-7 | 店頭買取情報ステータス更新 | 65 | 0 | 1 | 0 | 64 |
| sheet-8 | カード詳細IDから買取用商品情報を取得 | 83 | 0 | 4 | 0 | 79 |
| sheet-9 | 商品IDリストから買取用商品情報を取得 | 46 | 0 | 1 | 0 | 45 |
| sheet-10 | カード名から買取用商品情報を取得 | 70 | 0 | 6 | 0 | 64 |
| sheet-11 | 部門一覧を取得 | 31 | 0 | 3 | 0 | 28 |
| sheet-12 | 固定価格部門の部門情報を取得 | 26 | 0 | 2 | 0 | 24 |
| sheet-13 | 本人確認更新 | 49 | 0 | 0 | 0 | 49 |
| sheet-14 | 【新規】店頭買取情報一部キャンセル情報連携 | 31 | 0 | 0 | 0 | 31 |
| sheet-15 | 【新規】ダブルチェック者更新 | 19 | 0 | 1 | 0 | 18 |

