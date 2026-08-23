# 実装乖離監査 — 0516_基本設計仕様書(API_データ管理).html

- 正本: `excel_to_html/output/0516_基本設計仕様書(API_データ管理).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **182要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 0 | ○ |
| 実装違い | 実装はあるが設計と違う | 4 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 1 | — |
| 設計どおり | 設計どおり実装されている | 33 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 144 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 0 | — |
| **合計** | | **182** | |

## 不具合 4件（P1 0 / P2 1 / P3 3）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-4-R117 | 言語コードに紐づいたトップバナーの情報一覧を取得 | 実装違い | ふるまい | P2 | 指定言語の一覧には、画像URLが空のバナーと表示タイプが非表示のバナーを含めない |
| sheet-3-R047 | トップバナー情報取得 | 実装違い | IO | P3 | 該当するトップバナーが無いときは、コードとメッセージの2項目からなるJSONを返し、コードは404、メッセージは「Not Found」である |
| sheet-4-R118 | 言語コードに紐づいたトップバナーの情報一覧を取得 | 実装違い | ふるまい | P3 | 一覧はバナーIDの昇順で並んで返る |
| sheet-4-R122 | 言語コードに紐づいたトップバナーの情報一覧を取得 | 実装違い | IO | P3 | コード404を返すときは、コードとメッセージの2項目からなる本文を返し、メッセージは「Language code is not found」である |

### sheet-4-R117 言語コードに紐づいたトップバナーの情報一覧を取得 — 実装違い／ふるまい／P2

- 正本: sheet-4（言語コードに紐づいたトップバナーの情報一覧を取得） HTML行 1251 付近
- 正本引用: 「画像URLが空文字のバナーは一覧に含めない。表示タイプが0（非表示）のバナーも一覧に含めない。」
- 設計期待値: 指定言語の一覧には、画像URLが空のバナーと表示タイプが非表示のバナーを含めない
- 画像確認: 本シートに画像0枚（レイアウト図なし）。画像由来の文言は存在しない
- 実装参照: `src/Eccube/Controller/App/ContentController.php:102;src/Eccube/Controller/App/ContentController.php:110;src/Eccube/Service/App/Content/TopBannersResponseBuilder.php:37`
- 実装実態: 指定言語に紐づくトップバナーを絞り込みなしで全件取り出し（src/Eccube/Controller/App/ContentController.php:102）、そのまま全件を応答に並べている（src/Eccube/Controller/App/ContentController.php:110;src/Eccube/Service/App/Content/TopBannersResponseBuilder.php:37-39）。画像URLが空かどうか・表示タイプが非表示かどうかの判定は無い。非表示（disp_type=0）のバナーが一覧に含まれることは tests/Eccube/Tests/Web/App/ContentControllerTest.php:179 のデータと同:110 の期待から確認できる
- 判定根拠: 同一ファイル内の別用途では画像URLが空でないもの・表示タイプ指定のものだけを取る絞り込みが実装されている（src/Eccube/Repository/Master/MtbTopBannerRepository.php:46-47）のに、本APIの一覧はその絞り込みを通していない。結果として非表示バナーと画像URLが空のバナーが記事サイト向けの一覧に出る
- 確信度: high

### sheet-3-R047 トップバナー情報取得 — 実装違い／IO／P3

- 正本: sheet-3（トップバナー情報取得） HTML行 1075 付近
- 正本引用: 「該当するトップバナーが無いときの応答本文は、コードとメッセージの2項目を持つJSONで、コードは404、メッセージは「Not Found」。」
- 設計期待値: 該当するトップバナーが無いときは、コードとメッセージの2項目からなるJSONを返し、コードは404、メッセージは「Not Found」である
- 画像確認: 本シートに画像0枚（レイアウト図なし）。画像由来の文言は存在しない
- 実装参照: `src/Eccube/Controller/App/ContentController.php:71;src/Eccube/Controller/App/ContentController.php:74`
- 実装実態: 応答本文は code と errors の2項目で、メッセージは errors の配列要素として入る（src/Eccube/Controller/App/ContentController.php:71-74）。テストも errors 配列に 'Not Found' が含まれることを期待している（tests/Eccube/Tests/Web/App/ContentControllerTest.php:71）
- 判定根拠: 設計はメッセージを単一項目として持つ本文を求めているが、実装は文字列配列を持つ項目に入れて返すため、本文の項目構成が設計と異なる。コード404とメッセージ文言そのものは一致している
- 確信度: high

### sheet-4-R118 言語コードに紐づいたトップバナーの情報一覧を取得 — 実装違い／ふるまい／P3

- 正本: sheet-4（言語コードに紐づいたトップバナーの情報一覧を取得） HTML行 1252 付近
- 正本引用: 「一覧はバナーIDの昇順で並べる。」
- 設計期待値: 一覧はバナーIDの昇順で並んで返る
- 画像確認: 本シートに画像0枚（レイアウト図なし）。画像由来の文言は存在しない
- 実装参照: `src/Eccube/Controller/App/ContentController.php:102;src/Eccube/Controller/App/ContentController.php:110`
- 実装実態: 言語に紐づくトップバナーの集合をそのまま応答に並べており（src/Eccube/Controller/App/ContentController.php:102;src/Eccube/Controller/App/ContentController.php:110）、バナーIDで並べ直す指定は無い（src/Eccube/Entity/Master/MtbLanguage.php:175-196 の関連にも並び順の指定なし）。同一ファイル内の別用途の取得には並び順の指定がある（src/Eccube/Repository/Master/MtbTopBannerRepository.php:50-51）
- 判定根拠: 設計はバナーIDの昇順を求めているが、実装には並び順の指定が無く、返る順序が保証されない。テスト（tests/Eccube/Tests/Web/App/ContentControllerTest.php:110-111）も順序を確認しておらず、昇順であることは担保されていない
- 確信度: med

### sheet-4-R122 言語コードに紐づいたトップバナーの情報一覧を取得 — 実装違い／IO／P3

- 正本: sheet-4（言語コードに紐づいたトップバナーの情報一覧を取得） HTML行 1257 付近
- 正本引用: 「コード404を返すときの応答本文は、コードとメッセージの2項目を持つ。メッセージは「Language code is not found」である。」
- 設計期待値: コード404を返すときは、コードとメッセージの2項目からなる本文を返し、メッセージは「Language code is not found」である
- 画像確認: 本シートに画像0枚（レイアウト図なし）。画像由来の文言は存在しない
- 実装参照: `src/Eccube/Controller/App/ContentController.php:99;src/Eccube/Controller/App/ContentController.php:107;src/Eccube/Controller/App/ContentController.php:114`
- 実装実態: 本文は code と errors の2項目で、メッセージは文字列配列の要素として入る（src/Eccube/Controller/App/ContentController.php:114-117）。しかも入る文言は 'Not Found' で（src/Eccube/Controller/App/ContentController.php:99;src/Eccube/Controller/App/ContentController.php:107）、言語コードが見つからない旨の文言ではない。テストも 'Not Found' を期待している（tests/Eccube/Tests/Web/App/ContentControllerTest.php:151;tests/Eccube/Tests/Web/App/ContentControllerTest.php:167）
- 判定根拠: 設計が求める本文のメッセージ「Language code is not found」が返らず、汎用の 'Not Found' が返る。あわせてメッセージが単一項目ではなく文字列配列で返るため、本文の項目構成も設計と異なる
- 確信度: high

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 7 | 0 | 0 | 0 | 7 |
| sheet-2 | 目次 | 4 | 0 | 0 | 0 | 4 |
| sheet-3 | トップバナー情報取得 | 48 | 0 | 1 | 0 | 47 |
| sheet-4 | 言語コードに紐づいたトップバナーの情報一覧を取得 | 123 | 0 | 3 | 1 | 119 |

