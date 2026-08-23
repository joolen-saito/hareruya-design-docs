# 実装乖離監査 — 0402_基本設計仕様書(バッチ_在庫管理).html

- 正本: `excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **135要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 1 | ○ |
| 実装違い | 実装はあるが設計と違う | 9 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 0 | — |
| 設計どおり | 設計どおり実装されている | 30 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 93 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 2 | — |
| **合計** | | **135** | |

## 不具合 6件（P1 0 / P2 5 / P3 1）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 4件は重複として代表へ折り畳んだ（判定そのものは 10件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-5-R008 | 期間別入庫数集計バッチ | 実装違い | ふるまい | P2 | 集計対象になるのは在庫変動区分の親区分が「入庫」「買取」の履歴だけで、棚卸による増加は集計されない。 |
| sheet-5-R010 | 期間別入庫数集計バッチ | 実装違い | IO | P2 | 当日を含む8つの期間すべてについて、その期間に入庫した数量が集計値として記録される。 |
| sheet-5-R026 | 期間別入庫数集計バッチ | 未実装 | ふるまい | P2 | 集計に失敗した場合、集計できなかった旨が担当者へメールで通知される。 |
| sheet-5-R031 | 期間別入庫数集計バッチ | 実装違い | ふるまい | P2 | 各期間に入るかどうかは登録日時の日付だけで決まり、起動した時刻によって数える履歴が変わらない。 |
| sheet-6-R011 | 週間在庫履歴更新バッチ | 実装違い | IO | P2 | 在庫（商品コード・店舗・在庫区分の組）ごとに、1〜11週間前の各時点で最新だった在庫変動履歴が持つ在庫数が、そのまま週間在庫履歴として記録される。 |
| sheet-5-R003 | 期間別入庫数集計バッチ | 実装違い | IO | P3 | 入庫数の集計値は商品コード・店舗・在庫区分（在庫場所）の組ごとに保持される。 |

### sheet-5-R008 期間別入庫数集計バッチ — 実装違い／ふるまい／P2

- 正本: sheet-5（期間別入庫数集計バッチ） HTML行 1117 付近
- 正本引用: 「★取得対象（＝集計対象）の在庫変動区分は親区分が「入庫」「買取」のもののみとする」
- 設計期待値: 集計対象になるのは在庫変動区分の親区分が「入庫」「買取」の履歴だけで、棚卸による増加は集計されない。
- 画像確認: 画像0枚（0402/images に sheet-3〜sheet-6 の図は存在しない）
- 実装参照: `src/Eccube/Repository/DtbStockUpQuantityRepository.php:147-148;src/Eccube/Repository/DtbStockUpQuantityRepository.php:177;src/Eccube/Entity/Master/MtbStockChangeType.php:27-38`
- 実装実態: 取得条件は sctd.stock_change_type_id IN (BE_STOCKED=1, INVENTORY_ADJUSTMENT=5)。親区分「買取」(PURCHASE=2、店頭買取・ネット買取) が集計対象から漏れ、設計が挙げていない「棚卸」が集計対象に入っている。
- 同じ実装実態でまとまる要求: sheet-5-R018（期間別入庫数集計バッチ / 実装参照 `src/Eccube/Repository/DtbStockUpQuantityRepository.php:147-148;src/Eccube/Repository/DtbStockUpQuantityRepository.php:177`）
- 判定根拠: src/Eccube/Repository/DtbStockUpQuantityRepository.php:147-148 で BE_STOCKED と INVENTORY_ADJUSTMENT を、src/Eccube/Repository/DtbStockUpQuantityRepository.php:177 でその2つに限定している。src/Eccube/Entity/Master/MtbStockChangeType.php:28 の PURCHASE は条件に含まれない。買取は主要な入庫経路のため、入庫数の集計値が実績より小さくなり、代わりに棚卸ぶんが加算される。
- 確信度: high

### sheet-5-R010 期間別入庫数集計バッチ — 実装違い／IO／P2

- 正本: sheet-5（期間別入庫数集計バッチ） HTML行 1119 付近
- 正本引用: 「★取得した在庫変動履歴を商品コードごと、店舗ごと、在庫区分ごと、期間ごと（当日、前日、3日間、1週間、1ヶ月間、90日間、180日間、365日間）に集計する」
- 設計期待値: 当日を含む8つの期間すべてについて、その期間に入庫した数量が集計値として記録される。
- 画像確認: 画像0枚（0402/images に sheet-3〜sheet-6 の図は存在しない）
- 実装参照: `src/Eccube/Repository/DtbStockUpQuantityRepository.php:150-171;src/Eccube/Repository/DtbStockUpQuantityRepository.php:220;src/Eccube/Repository/DtbStockUpQuantityRepository.php:235`
- 実装実態: 集計SQLは前日・3日・1週・2週・3週・1ヶ月・90日・180日・365日を求めるが、当日ぶんを求める式が無く、当日入庫数の列には常に固定値0が書き込まれる（新規登録・更新の両方）。
- 判定根拠: src/Eccube/Repository/DtbStockUpQuantityRepository.php:150-171 に当日ぶんの集計式が無く、src/Eccube/Repository/DtbStockUpQuantityRepository.php:220（新規登録）と src/Eccube/Repository/DtbStockUpQuantityRepository.php:235（更新）で当日入庫数に 0 を入れている。当日入庫数は src/Eccube/Service/ProductAllCsv.php:534-538 で「当日入庫数」としてCSVに出力されるため、常に0という値が利用者の見る出力に現れる（なお src/Eccube/Form/Type/Admin/SearchProductType.php:322-329 の絞り込み選択肢に当日は無い）。
- 確信度: high

### sheet-5-R026 期間別入庫数集計バッチ — 未実装／ふるまい／P2

- 正本: sheet-5（期間別入庫数集計バッチ） HTML行 1135 付近
- 正本引用: 「・エラーが発生した場合集計できなかった旨をメールで送信する」
- 設計期待値: 集計に失敗した場合、集計できなかった旨が担当者へメールで通知される。
- 画像確認: 画像0枚（0402/images に sheet-3〜sheet-6 の図は存在しない）
- 実装参照: `src/Eccube/Command/AggregateStockUpCommand.php:47-53;src/Eccube/Service/Product/BatchAggregateStockUpAction.php:34-49`
- 実装実態: 例外を捕まえてコンソールへエラー文字列を書き出し失敗として終了するだけで、メール送信の呼び出しがどこにも無い。
- 判定根拠: src/Eccube/Command/AggregateStockUpCommand.php:47-53 が catch で $io->error を出して FAILURE を返すのみ。src/Eccube/Service/Product/BatchAggregateStockUpAction.php:44-48 も例外を投げ直すだけでメールを送らない。同種の週間在庫履歴更新バッチは src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:78 でエラー通知メールを送っており、この機能だけ通知が無い。
- 確信度: high

### sheet-5-R031 期間別入庫数集計バッチ — 実装違い／ふるまい／P2

- 正本: sheet-5（期間別入庫数集計バッチ） HTML行 1144 付近
- 正本引用: 「期間に入るかどうかの判定は登録日時の日付部分だけで行い、時刻は見ない。」
- 設計期待値: 各期間に入るかどうかは登録日時の日付だけで決まり、起動した時刻によって数える履歴が変わらない。
- 画像確認: 画像0枚（0402/images に sheet-3〜sheet-6 の図は存在しない）
- 実装参照: `src/Eccube/Repository/DtbStockUpQuantityRepository.php:156-171`
- 実装実態: 前日ぶんだけが日付同士の比較で、3日間から365日間までの各期間は起動時刻そのものからさかのぼった時刻との比較になっており、時刻を見て範囲を切っている。
- 同じ実装実態でまとまる要求: sheet-5-R032（期間別入庫数集計バッチ）
- 判定根拠: src/Eccube/Repository/DtbStockUpQuantityRepository.php:154-155 の前日は create_date::date で日付比較だが、src/Eccube/Repository/DtbStockUpQuantityRepository.php:156-171 の各期間は sh.create_date >= 起動時刻 - INTERVAL の時刻比較。起動を朝に行うと、始点の日の朝より前に登録された履歴が数から落ちる。
- 確信度: med

### sheet-6-R011 週間在庫履歴更新バッチ — 実装違い／IO／P2

- 正本: sheet-6（週間在庫履歴更新バッチ） HTML行 1202 付近
- 正本引用: 「・在庫ごと（商品コードごと、店舗ごと、在庫区分ごと）に1週間前、2週間前・・・11週間前時点で最新の在庫変動履歴を取得し、その履歴の在庫数を取得する」
- 設計期待値: 在庫（商品コード・店舗・在庫区分の組）ごとに、1〜11週間前の各時点で最新だった在庫変動履歴が持つ在庫数が、そのまま週間在庫履歴として記録される。
- 画像確認: 画像0枚（0402/images に sheet-3〜sheet-6 の図は存在しない）
- 実装参照: `src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:47-66;src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:92-103;src/Eccube/Entity/DtbStockHistory.php:92`
- 実装実態: 最新履歴の特定と在庫数の取り出しを「履歴ID×10000＋在庫数」という1つの数値の最大値で行い、下4桁を在庫数として切り出している。在庫数は4桁に収まる保証が無いため、在庫数が10000以上の履歴では記録される在庫数が下4桁だけの誤った値になり、最新履歴の選び方も崩れる。
- 判定根拠: src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:47-48 で桁を4に固定し、src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:56-64 で MAX(sh.id * 10000 + sh.stock)、src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:99 で substr(値, -4) を在庫数としている。在庫変動履歴の在庫数は src/Eccube/Entity/DtbStockHistory.php:92 で符号なし整数（4桁上限ではない）、保存先の週間在庫履歴も整数列（src/Eccube/Entity/DtbWeeklyStockHistory.php:45）。例: 履歴ID=5・在庫数=12345 なら 62345 となり、記録される在庫数は 2345 になる。この値は在庫リコメンドCSVの「1週間前在庫数」等として出力される（src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:140-144）。
- 確信度: med

### sheet-5-R003 期間別入庫数集計バッチ — 実装違い／IO／P3

- 正本: sheet-5（期間別入庫数集計バッチ） HTML行 1111 付近
- 正本引用: 「・商品コードごと、店舗ごと、在庫区分ごとに集計を行う」
- 設計期待値: 入庫数の集計値は商品コード・店舗・在庫区分（在庫場所）の組ごとに保持される。
- 画像確認: 画像0枚（0402/images に sheet-3〜sheet-6 の図は存在しない）
- 実装参照: `src/Eccube/Repository/DtbStockUpQuantityRepository.php:179;src/Eccube/Entity/DtbStockUpQuantity.php:59-83`
- 実装実態: 集計SQLの束ねは GROUP BY ps.product_class_id, sh.base_info_id の2軸だけで、在庫場所（dtb_product_stock.stock_location_id）を軸に持たない。保存先 dtb_stock_up_quantity にも在庫場所の列が無く、ProductClass と BaseInfo の2つだけを持つ。
- 同じ実装実態でまとまる要求: sheet-5-R006（期間別入庫数集計バッチ / 実装参照 `src/Eccube/Repository/DtbStockUpQuantityRepository.php:179`）、sheet-5-R012（期間別入庫数集計バッチ / 実装参照 `src/Eccube/Repository/DtbStockUpQuantityRepository.php:199;src/Eccube/Repository/DtbStockUpQuantityRepository.php:246;src/Eccube/Entity/DtbStockUpQuantity.php:59-83`）
- 判定根拠: src/Eccube/Repository/DtbStockUpQuantityRepository.php:179 の束ねは商品規格と店舗の2軸のみ。src/Eccube/Entity/ProductStock.php:263 に在庫場所（1:EC-CUBE / 2:スマレジ）の区分があり在庫は在庫場所ごとに分かれるが、集計結果は在庫場所をまたいで合算された1行になる。なお在庫場所別の入庫数を見せる出力・画面は現状無く、商品コード×店舗の合計値は設計どおりの値と一致するため、表示上の差は生じない（過剰指摘と判断されれば取り下げ可）。
- 確信度: med

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 6 | 0 | 0 | 0 | 6 |
| sheet-2 | 目次 | 6 | 0 | 0 | 0 | 6 |
| sheet-3 | 在庫切れバッチ | 20 | 0 | 0 | 0 | 20 |
| sheet-4 | 在庫警戒バッチ | 19 | 0 | 0 | 0 | 19 |
| sheet-5 | 期間別入庫数集計バッチ | 46 | 1 | 8 | 0 | 37 |
| sheet-6 | 週間在庫履歴更新バッチ | 38 | 0 | 1 | 0 | 37 |

