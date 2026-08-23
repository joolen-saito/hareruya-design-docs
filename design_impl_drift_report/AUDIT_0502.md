# 実装乖離監査 — 0502_基本設計仕様書(API_商品管理).html

- 正本: `excel_to_html/output/0502_基本設計仕様書(API_商品管理).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **431要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 5 | ○ |
| 実装違い | 実装はあるが設計と違う | 6 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 7 | — |
| 設計どおり | 設計どおり実装されている | 223 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 190 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 0 | — |
| **合計** | | **431** | |

## 不具合 6件（P1 0 / P2 3 / P3 3）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 7件は重複として代表へ折り畳んだ（判定そのものは 13件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-3-R066 | ポップアップ用商品情報取得 | 実装違い | IO | P2 | 週間販売数は、返した1件の商品規格と同じ言語コードを持つ商品規格の週間販売数量を合計した値になる。指定言語と返した商品規格の言語が違うときも、返した商品規格の言語で数える。 |
| sheet-6-R062 | ポップアップ用カード情報取得（旧商品ID） | 実装違い | ふるまい | P2 | 商品画像を1件も持たない商品は、旧商品IDが一致しても該当なしとして扱い、商品情報を返さずNot Foundで終わる。 |
| sheet-7-R040 | 更新商品規格取得 | 実装違い | IO | P2 | 応答の各商品規格に、ストレージコードIDが正本のレスポンス項目名 strageCodeId で含まれること |
| sheet-4-R063 | ポップアップ用カード情報取得 | 未実装 | ふるまい | P3 | フォイル有無の指定があるときは、その指定に沿ってフォイル区分を最優先に並べ（真値なら降順、偽値なら昇順）、特殊セット・プロモーション・発売日より先に効かせた結果の先頭1件を返す。 |
| sheet-4-R080 | ポップアップ用カード情報取得 | 実装違い | IO | P3 | 該当が1件も無いときの応答本文は、コードとメッセージの2項目だけを持ち、メッセージとして Not Found を返す。 |
| sheet-7-R046 | 更新商品規格取得 | 実装違い | IO | P3 | 商品更新日時が、正本のレスポンスサンプルと同じ日付時刻書式（2025-03-06T18:34:41+09:00 の形）で応答に入ること |

### sheet-3-R066 ポップアップ用商品情報取得 — 実装違い／IO／P2

- 正本: sheet-3（ポップアップ用商品情報取得） HTML行 1101 付近
- 正本引用: 「週間販売数は、返した商品規格1件の値ではなく、その商品が持つ商品規格のうち、返した商品規格と同じ言語コードのものの週間販売数量を合計した値とする。」
- 設計期待値: 週間販売数は、返した1件の商品規格と同じ言語コードを持つ商品規格の週間販売数量を合計した値になる。指定言語と返した商品規格の言語が違うときも、返した商品規格の言語で数える。
- 画像確認: 画像0枚（本シートにレイアウト図なし）。文言はシート本文のみで確認
- 実装参照: `src/Eccube/Repository/ProductRepository.php:2230-2238`
- 実装実態: src/Eccube/Repository/ProductRepository.php:2238 は合計の対象を要求で指定された言語コードに固定している。src/Eccube/Repository/ProductRepository.php:2249-2253 のとおり言語は絞り込みに使われないため、指定言語の商品規格が無い商品ではjaを指定してもEN(英語)の商品規格が返るが、そのとき合計は指定言語(JP)の商品規格だけを数え、返した商品規格の言語(EN)の販売数は合計されず0になる。
- 判定根拠: 設計は「返した商品規格と同じ言語コード」を数える単位と定めている。実装（src/Eccube/Repository/ProductRepository.php:2230-2238）の合計条件は要求で指定された言語コードであり、返した商品規格の言語コード（src/Eccube/Repository/ProductRepository.php:2226 で応答するcode）とは一致しないことがある。ja指定でEN商品規格が返る場合、応答のweeklySoldが設計より小さくなる（合計対象0件で0）。
- 確信度: high

### sheet-6-R062 ポップアップ用カード情報取得（旧商品ID） — 実装違い／ふるまい／P2

- 正本: sheet-6（ポップアップ用カード情報取得（旧商品ID）） HTML行 1491 付近
- 正本引用: 「カードとの対応を持たない商品、および商品画像を1件も持たない商品は、旧商品IDが一致しても該当なしとして扱う。」
- 設計期待値: 商品画像を1件も持たない商品は、旧商品IDが一致しても該当なしとして扱い、商品情報を返さずNot Foundで終わる。
- 画像確認: 画像0枚（本シートにレイアウト図なし）。文言はシート本文のみで確認
- 実装参照: `src/Eccube/Repository/ProductRepository.php:2639-2640;src/Eccube/Controller/App/ProductController.php:323-324`
- 実装実態: src/Eccube/Repository/ProductRepository.php:2639-2640 は商品画像を任意の付随情報として取得しており、画像が1件も無い商品も結果に含まれる。そのため画像を持たない商品でも src/Eccube/Controller/App/ProductController.php:334 で200が返り、src/Eccube/Service/App/Popup/PopupResponseBuilder.php:37-38 の subFileName と fileName がnullの商品情報が応答される。該当なし（404）にはならない。
- 判定根拠: 設計は画像を1件も持たない商品を該当なし扱いにすると定めている。カードとの対応が無い商品は src/Eccube/Repository/ProductRepository.php:2641-2642 で必須条件になっており除外されるが、画像の有無は条件になっていない（src/Eccube/Repository/ProductRepository.php:2639-2640）。実装では画像なしの商品が200で返るため、応答の有無が設計と食い違う。同シートには画像が無いときnullとする旨の記述は無い（画像null許容はsheet-3の商品ID指定側の記述）。
- 確信度: high

### sheet-7-R040 更新商品規格取得 — 実装違い／IO／P2

- 正本: sheet-7（更新商品規格取得） HTML行 1593 付近
- 正本引用: 「result.strageCodeId 数値(整数) ストレージコードID result.storageCodeName 文字型 ストレージコード名 result.languageCode 文字型 言語コード result.cardsetCode 文字型 カードセットコード result.cardConditionCode 文字型 カード状態 result.productClassUpdateDate 文字型 商品規格更新日時」
- 設計期待値: 応答の各商品規格に、ストレージコードIDが正本のレスポンス項目名 strageCodeId で含まれること
- 画像確認: 画像0枚のシート。レイアウト図なし（本文のみで判定）
- 実装参照: `src/Eccube/Repository/ProductRepository.php:2323;src/Eccube/Repository/ProductRepository.php:2362`
- 実装実態: ストレージコードIDは storageCodeId という名前で応答に入る。strageCodeId という項目は応答に存在しない
- 判定根拠: 応答の項目名がstorageCodeIdになっており、正本のstrageCodeIdでは値が取れない。src/Eccube/Repository/ProductRepository.php:2323 のSQL別名と src/Eccube/Repository/ProductRepository.php:2362 の結果マッピングがともにstorageCodeIdで、src/Eccube/Controller/App/ProductController.php:232-237 はその結果をそのまま応答にしている。現行実装（/home/y-saito/Developments/pf-api/src/Repository/DtbProductClassRepository.php:48）はstrageCodeIdで返しており、正本の項目表とレスポンスサンプル（本文91行目のstrageCodeId: 1449）も同じ綴りである
- 確信度: high

### sheet-4-R063 ポップアップ用カード情報取得 — 未実装／ふるまい／P3

- 正本: sheet-4（ポップアップ用カード情報取得） HTML行 1226 付近
- 正本引用: 「フォイル有無の指定があるときは、その指定が特殊セット・プロモーション・発売日より優先される。」
- 設計期待値: フォイル有無の指定があるときは、その指定に沿ってフォイル区分を最優先に並べ（真値なら降順、偽値なら昇順）、特殊セット・プロモーション・発売日より先に効かせた結果の先頭1件を返す。
- 画像確認: 画像0枚（images/ に sheet-4 の図は無い）。レイアウト図を持たないAPI仕様シートのため、判定は本文のみを根拠にした。
- 実装参照: `src/Eccube/Controller/App/ProductController.php:266-290、src/Eccube/Repository/ProductRepository.php:2465-2476`
- 実装実態: カードID指定のポップアップ処理はフォイル有無の指定を一切受け取らず（src/Eccube/Controller/App/ProductController.php:266-278 は言語コードとカードIDだけを使う）、並べ替えは常に特殊セット→プロモーション→発売日→非フォイルの固定順で行う（src/Eccube/Repository/ProductRepository.php:2465-2476）。フォイル有無の指定を第1優先にする分岐が無い。
- 同じ実装実態でまとまる要求: sheet-4-R064（ポップアップ用カード情報取得）、sheet-4-R074（ポップアップ用カード情報取得）、sheet-4-R083（ポップアップ用カード情報取得 / 実装参照 `src/Eccube/Controller/App/ProductController.php:266-278`）、sheet-4-R084（ポップアップ用カード情報取得 / 実装参照 `src/Eccube/Controller/App/ProductController.php:266-278`）
- 判定根拠: [gate7/refute] 重要度を P3 へ。事実は正しい。設計根拠(sheets/sheet-4.txt:104「フォイル有無の指定があるときは、その指定が特殊セット・プロモーション・発売日より優先される。」)は逐語で実在し述語を持つ。実装も確認: ProductController.php:266 の getPopupProductByCardId(string $lang, string $cardId) は Request を受け取ら ee 全体を検索してもポップアップ系の処理でフォイル有無の指定を読む箇所が無い（src配下で query から foil を読む実装は無し）。そのためフォイル有無を指定しても返る1件は変わらず、指定が特殊セット・プロモーション・発売日より優先されることもない。
- 確信度: high

### sheet-4-R080 ポップアップ用カード情報取得 — 実装違い／IO／P3

- 正本: sheet-4（ポップアップ用カード情報取得） HTML行 1243 付近
- 正本引用: 「該当する商品規格が1件も無いとき、応答本文はコードとメッセージだけを持つJSONになり、メッセージは Not Found を返す。商品情報のフィールドは含まない。」
- 設計期待値: 該当が1件も無いときの応答本文は、コードとメッセージの2項目だけを持ち、メッセージとして Not Found を返す。
- 画像確認: 画像0枚（images/ に sheet-4 の図は無い）。レイアウト図を持たないAPI仕様シートのため、判定は本文のみを根拠にした。
- 実装参照: `src/Eccube/Controller/App/ProductController.php:291-295、src/Eccube/EventListener/ExceptionListener.php:140-143`
- 実装実態: 該当なしのときの応答本文は code と errors の2項目で、Not Found は errors の配列要素として返る（src/Eccube/Controller/App/ProductController.php:291-295、共通の整形も同じ形 src/Eccube/EventListener/ExceptionListener.php:140-143）。メッセージ単体の項目は存在しない。
- 同じ実装実態でまとまる要求: sheet-5-R078（ポップアップ用商品情報取得（旧商品ID） / 実装参照 `src/Eccube/Controller/App/ProductController.php:384-388、src/Eccube/EventListener/ExceptionListener.php:140-143`）
- 判定根拠: tests/Eccube/Tests/Web/App/ProductControllerTest.php:336-339 が示すとおり、404応答は code と errors（配列）で返る。商品情報のフィールドを含まない点と、Not Found という文言そのものは設計どおりだが、メッセージが単一項目ではなく配列項目として返るため、受け取り側が読む項目が設計と異なる。
- 確信度: med

### sheet-7-R046 更新商品規格取得 — 実装違い／IO／P3

- 正本: sheet-7（更新商品規格取得） HTML行 1599 付近
- 正本引用: 「result.productUpdateDate 文字型 商品更新日時」
- 設計期待値: 商品更新日時が、正本のレスポンスサンプルと同じ日付時刻書式（2025-03-06T18:34:41+09:00 の形）で応答に入ること
- 画像確認: 画像0枚のシート。レイアウト図なし（本文のみで判定）
- 実装参照: `src/Eccube/Repository/ProductRepository.php:2329;src/Eccube/Repository/ProductRepository.php:2368`
- 実装実態: データベースが返す文字列をそのまま載せるため、2025-03-06 18:34:41+09 のように日付と時刻の区切りが空白・時差が分を伴わない形になる
- 判定根拠: 商品更新日時もR045と同じ欠陥。データベースの値を文字列のまま応答に載せている（src/Eccube/Repository/ProductRepository.php:2329、src/Eccube/Repository/ProductRepository.php:2368）。正本のレスポンスサンプル（本文97行目の productUpdateDate: 2025-03-06T18:34:41+09:00）の書式と異なる
- 確信度: med

## 掲載しなかった判定

- 実装実態が空欄の判定 3件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0502/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 8 | 0 | 0 | 0 | 8 |
| sheet-2 | 目次 | 7 | 0 | 0 | 0 | 7 |
| sheet-3 | ポップアップ用商品情報取得 | 71 | 0 | 1 | 0 | 70 |
| sheet-4 | ポップアップ用カード情報取得 | 90 | 5 | 1 | 1 | 83 |
| sheet-5 | ポップアップ用商品情報取得（旧商品ID） | 79 | 0 | 1 | 3 | 75 |
| sheet-6 | ポップアップ用カード情報取得（旧商品ID） | 69 | 0 | 1 | 3 | 65 |
| sheet-7 | 更新商品規格取得 | 107 | 0 | 2 | 0 | 105 |

