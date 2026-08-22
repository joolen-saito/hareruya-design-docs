# 実装乖離監査 — 0517_基本設計仕様書(API_その他).html

- 正本: `excel_to_html/output/0517_基本設計仕様書(API_その他).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **989要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 5 | ○ |
| 実装違い | 実装はあるが設計と違う | 11 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 2 | — |
| 設計どおり | 設計どおり実装されている | 568 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 403 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 0 | — |
| **合計** | | **989** | |

## 不具合 11件（P1 2 / P2 5 / P3 4）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 4件は重複として代表へ折り畳んだ（判定そのものは 15件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-5-R005 | PointGranterAPI連携 | 未実装 | ふるまい | P1 | 受け取った処理名と連携内容を、システム設定に登録したスマレジ連携先へ、呼び出し元から受け取った契約ID・アクセストークンを添えて送り、スマレジ側が返した結果を応答として返す。 |
| sheet-7-R137 | 商品名から商品詳細の情報を取得 | 実装違い | ふるまい | P1 | 検索文字列を空白またはカンマで語に分け、分けたすべての語を部分一致で含む商品だけが該当となる。各語は日本語の商品名か英語の商品名のどちらかに含まれていればよい。 |
| sheet-3-R526 | 検索クエリに一致する記事情報1件を取得 | 未実装 | ふるまい | P2 | 削除日時が入っている記事は検索の対象から外れ、指定されたWPの投稿IDに一致するのが削除済みの記事だけであれば、該当データなしの応答（HTTP 404）になる。 |
| sheet-5-R008 | PointGranterAPI連携 | 実装違い | IO | P2 | スマレジ契約ID・スマレジアクセストークン・処理名・連携内容のいずれかが無いときは、呼び出し元へ404（必須項目にデータがない）を返し、本文には空の配列だけを返す。 |
| sheet-6-R133 | 商品IDに紐づく商品詳細の情報を取得 | 実装違い | ふるまい | P2 | 非公開の商品は取得対象にせず、販売価格が0以下の商品規格も取得対象にしない。その結果、公開状態でない商品や0円以下の規格しか無い商品は該当なしとして扱われる。 |
| sheet-6-R139 | 商品IDに紐づく商品詳細の情報を取得 | 実装違い | IO | P2 | 販売制限数が未設定のときも0のときも、商品クラスの販売制限数は空で返る。 |
| sheet-7-R148 | 商品名から商品詳細の情報を取得 | 実装違い | IO | P2 | 良品以外の商品規格に、在庫があって販売価格が表示下限以上のものが1件も無い商品では、返す商品規格は良品だけになる。 |
| sheet-3-R174 | 検索クエリに一致する記事情報1件を取得 | 実装違い | IO | P3 | 応答のカードの色順情報には、サンプルどおり順位を表す rank が含まれ、参照側は rank で色の順位を読み取れる。 |
| sheet-5-R062 | PointGranterAPI連携 | 実装違い | ふるまい | P3 | ポイント履歴の発生日時と登録日時のどちらにも、連携内容の端末取引日時（terminalTranDateTime）が記録され、処理を実行した時刻は記録されない。 |
| sheet-6-R138 | 商品IDに紐づく商品詳細の情報を取得 | 実装違い | IO | P3 | 商品クラスは状態の昇順で並び、状態が同じものの中では商品規格IDの昇順で並ぶ。 |
| sheet-7-R147 | 商品名から商品詳細の情報を取得 | 実装違い | IO | P3 | 1商品の中の商品規格は、カードコンディション（良品から状態が悪い順）の昇順で並んで返る。 |

### sheet-5-R005 PointGranterAPI連携 — 未実装／ふるまい／P1

- 正本: sheet-5（PointGranterAPI連携） HTML行 1747 付近
- 正本引用: 「・PointGranterから送られてきた端末販売APIの内容をスマレジに連携する」
- 設計期待値: 受け取った処理名と連携内容を、システム設定に登録したスマレジ連携先へ、呼び出し元から受け取った契約ID・アクセストークンを添えて送り、スマレジ側が返した結果を応答として返す。
- 画像確認: 本設計書は画像0枚（design_audit/0517/images に該当シートの図は存在しない）。文言はシート本文で確認した。
- 実装参照: `src/Eccube/Service/Smaregi/SmaregiApiService.php:39-45;src/Eccube/Controller/App/PointGranterController.php:86-91`
- 実装実態: スマレジへ送る処理が無い。postRegisterTransaction は「TODO: スマレジAPIを実行する実装を追加」のコメントのまま、固定値 {'result':{'status':'success'}} を返すだけで、渡された契約ID・アクセストークン・処理名・連携内容はどこにも送られない（src/Eccube/Service/Smaregi/SmaregiApiService.php:39-45）。そのためスマレジ側には端末販売APIの内容が届かず、連携は常に成功として扱われる。
- 同じ実装実態でまとまる要求: sheet-5-R013（PointGranterAPI連携）、sheet-5-R014（PointGranterAPI連携）、sheet-5-R065（PointGranterAPI連携）
- 判定根拠: PointGranterから受けた内容をスマレジへ連携する処理そのものが無い。src/Eccube/Controller/App/PointGranterController.php:86 は src/Eccube/Service/Smaregi/SmaregiApiService.php を呼ぶが、同処理は固定の成功結果を返すだけで送信を行わない（src/Eccube/Service/Smaregi/SmaregiApiService.php:39-45）。別名の実装が無いか point_granter / postRegisterTransaction / transaction_upd / スマレジ で複数回検索したが、送信を行う実装は見つからなかった。
- 確信度: high

### sheet-7-R137 商品名から商品詳細の情報を取得 — 実装違い／ふるまい／P1

- 正本: sheet-7（商品名から商品詳細の情報を取得） HTML行 2195 付近
- 正本引用: 「検索する商品名は、空白またはカンマで区切って語に分ける。分けたすべての語を含む商品だけを対象とし、語は部分一致で判定する。」
- 設計期待値: 検索文字列を空白またはカンマで語に分け、分けたすべての語を部分一致で含む商品だけが該当となる。各語は日本語の商品名か英語の商品名のどちらかに含まれていればよい。
- 画像確認: 画像0枚（本シートにレイアウト図なし）
- 実装参照: `src/Eccube/Repository/ProductRepository.php:2040-2053`
- 実装実態: 検索文字列を語に分けず、文字列全体を1つの部分一致条件として商品名（日本語）・商品名（英語）に当てているため、語の並び順や語間の文字が違うと該当しない。
- 判定根拠: 現行pf-apiは検索語を空白・カンマで分割し語ごとにAND条件で部分一致させている（pf-api:src/Repository/DtbProductSubClassRepository.php:381-389）。eeは受け取った商品名を分割せず1つの部分一致条件としてのみ使うため（src/Eccube/Repository/ProductRepository.php:2040,2053）、語順が違う・語の間に別の文字が挟まる検索（例「漁る軟泥 M21」）では現行なら該当する商品が1件も返らない。日本語名・英語名のどちらかに含まれればよい点は実装済み。
- 確信度: high

### sheet-3-R526 検索クエリに一致する記事情報1件を取得 — 未実装／ふるまい／P2

- 正本: sheet-3（検索クエリに一致する記事情報1件を取得） HTML行 1559 付近
- 正本引用: 「削除日時が入っている記事は検索の対象から外れる。指定されたWPの投稿IDが削除済みの記事のものだけであれば、該当データなしとして扱う。」
- 設計期待値: 削除日時が入っている記事は検索の対象から外れ、指定されたWPの投稿IDに一致するのが削除済みの記事だけであれば、該当データなしの応答（HTTP 404）になる。
- 画像確認: 本シートに画像は0枚（sheets.tsv 画像=0、images/ 配下に sheet-3 の図は無い）。レイアウト図に依存する判定は無い。
- 実装参照: `src/Eccube/Controller/App/ArticleController.php:58; src/Eccube/Entity/DtbArticle.php:50`
- 実装実態: WPの投稿IDだけを条件に記事を1件引き当てており、削除日時の有無を条件にしていない。記事は削除日時の項目を持つが、削除済みを検索から除く仕組み（Gedmo の SoftDeleteable 指定）が記事に付いておらず、削除済みの記事もそのまま正常応答として返る。
- 判定根拠: src/Eccube/Controller/App/ArticleController.php:58 の絞り込み条件は wpPostId のみ。src/Eccube/Entity/DtbArticle.php:50 に deleted_at はあるが、同ファイルに Gedmo\SoftDeleteable の指定は無く（DtbProductRequest.php:26 等の他エンティティには有る）、app/config/eccube/packages/doctrine.yaml:86-88 で有効な soft_deleteable フィルタの対象にならない。記事を削除済みで絞る記述は ee 内に他に無い。
- 確信度: high

### sheet-5-R008 PointGranterAPI連携 — 実装違い／IO／P2

- 正本: sheet-5（PointGranterAPI連携） HTML行 1750 付近
- 正本引用: 「・下記の項目がなければエラー404を返す」
- 設計期待値: スマレジ契約ID・スマレジアクセストークン・処理名・連携内容のいずれかが無いときは、呼び出し元へ404（必須項目にデータがない）を返し、本文には空の配列だけを返す。
- 画像確認: 本設計書は画像0枚（design_audit/0517/images に該当シートの図は存在しない）。文言はシート本文で確認した。
- 実装参照: `src/Eccube/Controller/App/PointGranterController.php:75-83`
- 実装実態: 4項目のいずれかが空のとき、空の配列を 400（Response::HTTP_BAD_REQUEST）で返しており、404にならない（src/Eccube/Controller/App/PointGranterController.php:75-83）。同じ400は、スマレジからの結果に result が無いときにも返る（src/Eccube/Controller/App/PointGranterController.php:93-99）ため、呼び出し元は必須項目の欠落と連携失敗を状態コードで区別できない。
- 同じ実装実態でまとまる要求: sheet-5-R048（PointGranterAPI連携）
- 判定根拠: 必須4項目の欠落は検出しているが、そのときの応答が設計の404ではなく400になっている（src/Eccube/Controller/App/PointGranterController.php:75-83）。
- 確信度: high

### sheet-6-R133 商品IDに紐づく商品詳細の情報を取得 — 実装違い／ふるまい／P2

- 正本: sheet-6（商品IDに紐づく商品詳細の情報を取得） HTML行 1986 付近
- 正本引用: 「対象は公開状態の商品に限る。削除済みの商品・商品規格、および販売価格が0以下の商品規格は取得しない。」
- 設計期待値: 非公開の商品は取得対象にせず、販売価格が0以下の商品規格も取得対象にしない。その結果、公開状態でない商品や0円以下の規格しか無い商品は該当なしとして扱われる。
- 画像確認: 本シートに画像0枚。レイアウト図は無く、本文とJSONサンプルのみ。
- 実装参照: `src/Eccube/Repository/ProductRepository.php:328-330; src/Eccube/Repository/ProductRepository.php:305`
- 実装実態: 商品の公開状態と販売価格を取得条件にしていない。src/Eccube/Repository/ProductRepository.php:329-330 の絞り込みは商品IDが一致することと商品規格が存在することだけで、非公開商品も販売価格0以下の商品規格もそのまま取得され、応答に含まれる。
- 判定根拠: src/Eccube/Repository/ProductRepository.php:328-330 を通読したが公開状態・販売価格の条件が無い。削除済み商品規格は src/Eccube/Repository/ProductRepository.php:305 で除かれている。同じ実装ファイル内の別処理（src/Eccube/Repository/ProductRepository.php:411）では公開状態を条件にしており、この取得処理だけ条件が欠けている。該当なし（HTTP 404）の扱い自体は src/Eccube/Controller/App/ProductController.php:60-64 にあるが、判定の母数が設計より広い。
- 確信度: high

### sheet-6-R139 商品IDに紐づく商品詳細の情報を取得 — 実装違い／IO／P2

- 正本: sheet-6（商品IDに紐づく商品詳細の情報を取得） HTML行 1992 付近
- 正本引用: 「販売制限数が未設定または0のときは空（null）を返す。」
- 設計期待値: 販売制限数が未設定のときも0のときも、商品クラスの販売制限数は空で返る。
- 画像確認: 本シートに画像0枚。レイアウト図は無く、本文とJSONサンプルのみ。
- 実装参照: `src/Eccube/Service/App/ProductDetail/ProductDetailResponseBuilder.php:202`
- 実装実態: src/Eccube/Service/App/ProductDetail/ProductDetailResponseBuilder.php:202 は販売制限数が未設定のときだけ空にしており、0が登録されているときは0をそのまま返す。
- 判定根拠: 設計が空とする0の場合に0が出力され、呼び出し側からは制限数0（購入不可）と読める値になる。なお同じ行の状態コード（src/Eccube/Repository/ProductRepository.php:283）と画像の重複除去（src/Eccube/Service/App/ProductDetail/ProductDetailResponseBuilder.php:190-194, src/Eccube/Repository/ProductRepository.php:272）は設計どおりである。
- 確信度: high

### sheet-7-R148 商品名から商品詳細の情報を取得 — 実装違い／IO／P2

- 正本: sheet-7（商品名から商品詳細の情報を取得） HTML行 2207 付近
- 正本引用: 「商品ごとに、良品（NM）以外の商品規格で在庫があり販売価格が表示下限以上のものが1件もないときは、良品（NM）の商品規格だけに絞る。」
- 設計期待値: 良品以外の商品規格に、在庫があって販売価格が表示下限以上のものが1件も無い商品では、返す商品規格は良品だけになる。
- 画像確認: 画像0枚（本シートにレイアウト図なし）
- 実装参照: `src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:197-223`
- 実装実態: 良品以外の先頭の商品規格の販売価格が表示下限以上なら、在庫のある良品以外が1件も無くても良品以外の商品規格を返す。
- 判定根拠: 高額商品コードを持つ商品を絞り込みの対象外にする点（src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:135-141）は実装済み。絞り込みの発動条件が違う。設計は「在庫があり販売価格が表示下限以上の良品以外が1件も無いとき」に良品だけへ絞るとしているが、eeは良品以外の先頭1件の販売価格が表示下限以上でありさえすれば絞り込みを行わない（src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:218）。現行pf-apiは両方を満たすことを要求している（pf-api:src/Controller/ProductController.php:556-577）。その結果、在庫0で価格だけ下限以上の良品以外の規格しか無い商品で、現行なら良品だけになるところが良品以外も返る。
- 確信度: med

### sheet-3-R174 検索クエリに一致する記事情報1件を取得 — 実装違い／IO／P3

- 正本: sheet-3（検索クエリに一致する記事情報1件を取得） HTML行 1203 付近
- 正本引用: 「・WPの投稿IDを元に記事情報1件検索しJSON出力する。」
- 設計期待値: 応答のカードの色順情報には、サンプルどおり順位を表す rank が含まれ、参照側は rank で色の順位を読み取れる。
- 画像確認: 本シートは画像0枚（design_audit/0517/images 配下に sheet-3 の図は無い）。レイアウト図に依存する判定は無し。
- 実装参照: `src/Eccube/Service/App/Article/ArticleResponseBuilder.php:133-141`
- 実装実態: ArticleResponseBuilder.php:136-140 は色順情報を id / name / sort_no の3項目で返しており、rank は応答に出ない。色順の値を持つ src/Eccube/Entity/Master/MtbColorSequence.php:51-57 も sort_no だけで rank に相当する項目が無い。同じサンプル内の他の順位項目（disp の rank、format の rank）は ArticleResponseBuilder.php:455 / ArticleResponseBuilder.php:518 で rank のまま返しており、色順情報だけ名前が違う。
- 判定根拠: レスポンスデータサンプル（シート内行195-199）は color_sequence を id / name / rank の3項目として示すが、実装は3つ目を sort_no という名前で返す。順位の値そのものは返るが、サンプルの名前では読み取れないため、応答の内容の差として指摘する。カードの色の並び順に関わる表示上の差で、業務は回るため P3。
- 確信度: med

### sheet-5-R062 PointGranterAPI連携 — 実装違い／ふるまい／P3

- 正本: sheet-5（PointGranterAPI連携） HTML行 1808 付近
- 正本引用: 「発生日時・登録日時 いずれも連携内容の端末取引日時（terminalTranDateTime）を用いる。本システムの処理時刻は用いない」
- 設計期待値: ポイント履歴の発生日時と登録日時のどちらにも、連携内容の端末取引日時（terminalTranDateTime）が記録され、処理を実行した時刻は記録されない。
- 画像確認: 本設計書は画像0枚（design_audit/0517/images に該当シートの図は存在しない）。文言はシート本文で確認した。
- 実装参照: `src/Eccube/Service/App/PointGranter/PointGranterAction.php:60;src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:58-59;src/Eccube/Doctrine/EventSubscriber/SaveEventSubscriber.php:41-43`
- 実装実態: 発生日時には端末取引日時が記録される（src/Eccube/Service/App/PointGranter/PointGranterAction.php:60、src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:58-59）が、登録日時には何も渡しておらず、保存時の共通処理が登録日時へ処理時刻（new DateTime()）を書き込む（src/Eccube/Doctrine/EventSubscriber/SaveEventSubscriber.php:41-43）。その結果、登録日時は端末取引日時ではなく本システムの処理時刻になる。
- 判定根拠: 正本は発生日時・登録日時の両方に端末取引日時を用い、本システムの処理時刻は用いないと明記している。実装は登録日時だけが処理時刻になるため、後から連携内容の取引日時で履歴を突き合わせたときに両者がずれる。
- 確信度: med

### sheet-6-R138 商品IDに紐づく商品詳細の情報を取得 — 実装違い／IO／P3

- 正本: sheet-6（商品IDに紐づく商品詳細の情報を取得） HTML行 1991 付近
- 正本引用: 「並び順は状態、商品規格IDの昇順とする。」
- 設計期待値: 商品クラスは状態の昇順で並び、状態が同じものの中では商品規格IDの昇順で並ぶ。
- 画像確認: 本シートに画像0枚。レイアウト図は無く、本文とJSONサンプルのみ。
- 実装参照: `src/Eccube/Repository/ProductRepository.php:343-344; src/Eccube/Service/App/ProductDetail/ProductDetailResponseBuilder.php:63-69`
- 実装実態: src/Eccube/Repository/ProductRepository.php:343-344 の並び替えは商品規格IDの昇順だけで、状態による並び替えが無い。src/Eccube/Service/App/ProductDetail/ProductDetailResponseBuilder.php:63-69 でも並び替えは行っていない。
- 判定根拠: 取得順がそのまま応答の商品クラスの並びになるため、状態の順序と商品規格IDの順序が一致しない商品では設計と異なる順序で並ぶ。なお絞り込み条件（状態がNM、または販売価格が状態表示の下限価格以上）は src/Eccube/Service/App/ProductDetail/ProductDetailResponseBuilder.php:185-187 で設計どおり実装されている。
- 確信度: med

### sheet-7-R147 商品名から商品詳細の情報を取得 — 実装違い／IO／P3

- 正本: sheet-7（商品名から商品詳細の情報を取得） HTML行 2206 付近
- 正本引用: 「各商品規格のうち、良品（NM）であるもの、または販売価格が表示下限以上のものだけを商品規格として加える。画像はファイル名からURLへ変換して並べる。各商品の商品規格は、カードコンディションの昇順に並ぶ。」
- 設計期待値: 1商品の中の商品規格は、カードコンディション（良品から状態が悪い順）の昇順で並んで返る。
- 画像確認: 画像0枚（本シートにレイアウト図なし）
- 実装参照: `src/Eccube/Repository/ProductRepository.php:2158-2159`
- 実装実態: 商品規格の並び順が商品規格コードの文字列昇順になっており、カードコンディションの昇順にならない。
- 判定根拠: [gate7/refute] 重要度を P3 へ。事実関係は確認できた。引用は sheets/sheet-7.txt:178 に逐語で実在（「各商品の商品規格は、カードコンディションの昇順に並ぶ。」を含む仕様文）。実装は ee: src/Eccube/Repository/ProductRepository.php:2158-2159 の `ORDER BY p.id, COALESCE(lang.code,'JP'), pc.product_c 良品（NM）または販売価格が表示下限以上のものだけを加える点（src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:165-168）と、画像をファイル名からURLへ変換して並べる点（src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:174-178）は実装済み。並び順だけが違う。現行pf-apiはカードコンディションの昇順で取得している（pf-api:src/Repository/DtbProductSubClassRepository.php:437）が、eeは商品規格コードの昇順で並べる（src/Eccube/Repository/ProductRepository.php:2158-2159）。カードコンディションは良品→やや傷→傷→重傷→その他の順（src/Eccube/Entity/Master/MtbCardCondition.php:35-45）であり、コード文字列の昇順とは一致しないため、応答の商品規格の並びが現行と変わる。
- 確信度: high

## 掲載しなかった判定

- 実装実態が空欄の判定 1件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）
- 区分が「表示メッセージ」の指摘 1件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0517/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 7 | 0 | 0 | 0 | 7 |
| sheet-2 | 目次 | 7 | 0 | 0 | 0 | 7 |
| sheet-3 | 検索クエリに一致する記事情報1件を取得 | 533 | 1 | 2 | 1 | 529 |
| sheet-4 | 記事IDに関連する記事情報を取得 | 65 | 0 | 0 | 1 | 64 |
| sheet-5 | PointGranterAPI連携 | 79 | 4 | 3 | 0 | 72 |
| sheet-6 | 商品IDに紐づく商品詳細の情報を取得 | 146 | 0 | 3 | 0 | 143 |
| sheet-7 | 商品名から商品詳細の情報を取得 | 152 | 0 | 3 | 0 | 149 |

