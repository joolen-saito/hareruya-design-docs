# 実装乖離監査 — 0508_基本設計仕様書(API_コンテンツ).html

- 正本: `excel_to_html/output/0508_基本設計仕様書(API_コンテンツ).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **66要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 0 | ○ |
| 実装違い | 実装はあるが設計と違う | 10 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 0 | — |
| 設計どおり | 設計どおり実装されている | 15 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 41 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 0 | — |
| **合計** | | **66** | |

## 不具合 3件（P1 0 / P2 1 / P3 2）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 6件は重複として代表へ折り畳んだ（判定そのものは 9件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-1-R015 | A08-01 トップバナーIDのトップバナー情報を取得 ／ API データ管理 — トップバナーIDのトップバナー情報を取得 | 実装違い | IO | P2 | 成功応答のJSONは、表示タイプを dispType の名称のフィールドで返す。 |
| sheet-1-R029 | A08-01 トップバナーIDのトップバナー情報を取得 ／ API データ管理 — トップバナーIDのトップバナー情報を取得 | 実装違い | IO | P3 | 該当IDのトップバナーが無いときは、HTTP 404 と、処理結果コードおよび "Not Found" のメッセージを1つ持つ本文を返す。 |
| sheet-2-R007 | A08-02 指定言語の設定済みトップバナー一覧を取得 ／ API データ管理 — 指定言語の設定済みトップバナー一覧を取得 | 実装違い | IO | P3 | 一覧が空・言語が存在しないときは、HTTP 404 と「Language code is not found」の文言を持つ本文を返す。 |

### sheet-1-R015 A08-01 トップバナーIDのトップバナー情報を取得 ／ API データ管理 — トップバナーIDのトップバナー情報を取得 — 実装違い／IO／P2

- 正本: sheet-1（A08-01 トップバナーIDのトップバナー情報を取得 ／ API データ管理 — トップバナーIDのトップバナー情報を取得） HTML行 302 付近
- 正本引用: 「dispType integer 表示タイプ languages array 関連する言語の配列。要素はオブジェクトで、子フィールドはid（integer、言語ID）、nameJp（string、言語名・日本語）、nameEn（string、言語名・英語）、code（string、言語コード）」
- 設計期待値: 成功応答のJSONは、表示タイプを dispType の名称のフィールドで返す。
- 画像確認: 画像0枚のシート（sheets.tsv上も画像0枚）。レイアウト図が無いため本文のみで判定した。
- 実装参照: `src/Eccube/Service/App/Content/TopBannerResponseBuilder.php:45;tests/Eccube/Tests/Web/App/ContentControllerTest.php:47`
- 実装実態: 応答JSONのフィールドは image_url / disp_type / name_jp / name_en というスネークケースで返る。src/Eccube/Service/App/Content/TopBannerResponseBuilder.php:35-45 が当該キーで配列を組み立てており、tests/Eccube/Tests/Web/App/ContentControllerTest.php:45,47,52,53 も image_url / disp_type / name_jp / name_en を期待している。応答生成の途中で名称を変換する処理はee内に存在しない（CamelCase変換の設定・実装をsrc/とconfig/に対して検索し0件）。
- 同じ実装実態でまとまる要求: sheet-1-R016（A08-01 トップバナーIDのトップバナー情報を取得 ／ API データ管理 — トップバナーIDのトップバナー情報を取得 / 実装参照 `src/Eccube/Service/App/Content/TopBannerResponseBuilder.php:32-39;tests/Eccube/Tests/Web/App/ContentControllerTest.php:52-53`）、sheet-2-R020（A08-02 指定言語の設定済みトップバナー一覧を取得 ／ API データ管理 — 指定言語の設定済みトップバナー一覧を取得）、sheet-2-R021（A08-02 指定言語の設定済みトップバナー一覧を取得 ／ API データ管理 — 指定言語の設定済みトップバナー一覧を取得 / 実装参照 `src/Eccube/Service/App/Content/TopBannerResponseBuilder.php:32-39;tests/Eccube/Tests/Web/App/ContentControllerTest.php:52-53`）、sheet-1-R013（A08-01 トップバナーIDのトップバナー情報を取得 ／ API データ管理 — トップバナーIDのトップバナー情報を取得 / 実装参照 `src/Eccube/Service/App/Content/TopBannerResponseBuilder.php:43-45;tests/Eccube/Tests/Web/App/ContentControllerTest.php:45-47`）、sheet-2-R018（A08-02 指定言語の設定済みトップバナー一覧を取得 ／ API データ管理 — 指定言語の設定済みトップバナー一覧を取得 / 実装参照 `src/Eccube/Service/App/Content/TopBannerResponseBuilder.php:43-45;tests/Eccube/Tests/Web/App/ContentControllerTest.php:45-47`）
- 判定根拠: 設計の dispType に対し実装が返すのは disp_type で、応答の項目名が設計と一致しない。src/Eccube/Service/App/Content/TopBannerResponseBuilder.php:45 と tests/Eccube/Tests/Web/App/ContentControllerTest.php:47 で確認。
- 確信度: high

### sheet-1-R029 A08-01 トップバナーIDのトップバナー情報を取得 ／ API データ管理 — トップバナーIDのトップバナー情報を取得 — 実装違い／IO／P3

- 正本: sheet-1（A08-01 トップバナーIDのトップバナー情報を取得 ／ API データ管理 — トップバナーIDのトップバナー情報を取得） HTML行 316 付近
- 正本引用: 「404 該当IDのトップバナーが存在しない {code, message}（"Not Found"）」
- 設計期待値: 該当IDのトップバナーが無いときは、HTTP 404 と、処理結果コードおよび "Not Found" のメッセージを1つ持つ本文を返す。
- 画像確認: 画像0枚のシート（sheets.tsv上も画像0枚）。レイアウト図が無いため本文のみで判定した。
- 実装参照: `src/Eccube/Controller/App/ContentController.php:71-75;tests/Eccube/Tests/Web/App/ContentControllerTest.php:68-71`
- 実装実態: 404の本文は {"code":404,"errors":["Not Found"]} で、メッセージは単一の値ではなく errors という配列で返る。src/Eccube/Controller/App/ContentController.php:71-75 が code と errors の2項目で本文を組み、tests/Eccube/Tests/Web/App/ContentControllerTest.php:70-71 も errors 配列を期待している。
- 判定根拠: HTTPステータス404と文言「Not Found」は設計どおりだが、本文の形が設計の {code, message} と異なり {code, errors:[...]} である。呼び出し元がメッセージを取り出す位置が設計と違う。
- 確信度: med

### sheet-2-R007 A08-02 指定言語の設定済みトップバナー一覧を取得 ／ API データ管理 — 指定言語の設定済みトップバナー一覧を取得 — 実装違い／IO／P3

- 正本: sheet-2（A08-02 指定言語の設定済みトップバナー一覧を取得 ／ API データ管理 — 指定言語の設定済みトップバナー一覧を取得） HTML行 322 付近
- 正本引用: 「一覧が空・言語が存在しない コード404・「Language code is not found」のJSONを返す」
- 設計期待値: 一覧が空・言語が存在しないときは、HTTP 404 と「Language code is not found」の文言を持つ本文を返す。
- 画像確認: 画像0枚のシート（sheets.tsv上も画像0枚）。レイアウト図が無いため本文のみで判定した。
- 実装参照: `src/Eccube/Controller/App/ContentController.php:95-108;tests/Eccube/Tests/Web/App/ContentControllerTest.php:143-152`
- 実装実態: 404は返るが本文の文言は "Not Found" で、"Language code is not found" は返らない。src/Eccube/Controller/App/ContentController.php:99,107 がいずれも Not Found の文言で404を起こし、tests/Eccube/Tests/Web/App/ContentControllerTest.php:151 も Not Found を期待している。文字列 "Language code is not found" はee全体に存在しない（大文字小文字を無視した全文検索を3回実施し0件）。
- 同じ実装実態でまとまる要求: sheet-2-R035（A08-02 指定言語の設定済みトップバナー一覧を取得 ／ API データ管理 — 指定言語の設定済みトップバナー一覧を取得 / 実装参照 `src/Eccube/Controller/App/ContentController.php:95-108;tests/Eccube/Tests/Web/App/ContentControllerTest.php:145-152`）
- 判定根拠: HTTPステータス404は設計どおりだが、404本文の文言が設計の「Language code is not found」ではなく「Not Found」であり、呼び出し元が受け取るメッセージが設計と異なる。
- 確信度: high

## 掲載しなかった判定

- 区分が「表示メッセージ」の指摘 1件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0508/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | A08-01 トップバナーIDのトップバナー情報を取得 ／ API データ管理 — トップバナーIDのトップバナー情報を取得 | 29 | 0 | 4 | 0 | 25 |
| sheet-2 | A08-02 指定言語の設定済みトップバナー一覧を取得 ／ API データ管理 — 指定言語の設定済みトップバナー一覧を取得 | 37 | 0 | 6 | 0 | 31 |

