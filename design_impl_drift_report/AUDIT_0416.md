# 実装乖離監査 — 0416_基本設計仕様書(バッチ_インフラ).html

- 正本: `excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **382要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 20 | ○ |
| 実装違い | 実装はあるが設計と違う | 5 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 0 | — |
| 設計どおり | 設計どおり実装されている | 73 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 176 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 108 | — |
| **合計** | | **382** | |

## 不具合 8件（P1 0 / P2 3 / P3 5）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 17件は重複として代表へ折り畳んだ（判定そのものは 25件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-14-R004 | データベースデッドロック感知 | 未実装 | IO | P2 | 注文データでデッドロックが発生したとき、管理者のメールアドレスに発生通知と、どこで起きたかが分かる詳細情報が届く |
| sheet-7-R002 | WAF不正アクセスログ集計処理 | 未実装 | ふるまい | P2 | 前日分の不正アクセスと判断されたアクセスログが日次でまとめられ、集計結果が残る。 |
| sheet-9-R002 | Redash用データベース作成 | 未実装 | ふるまい | P2 | 分析用に使うデータベースが本番とは別に用意される |
| sheet-10-R018 | EC-CUBE 同期ディレクトリ処理バッチ | 未実装 | IO | P3 | S3に置かれたsitemap.xmlの内容が、ECサーバの /var/ec-cube/html/sitemap.xml に反映され、公開されるサイトマップがS3側の最新内容になる。 |
| sheet-13-R008 | S3画像サイズチェック処理 | 実装違い | IO | P3 | ファイル名とサイズの一覧取得の対象は、商品サムネイル・商品サムネイル(オリジナル画像)・バナー画像・商品画像・絵文字(シンボル)の5種の置き場所に限られ、それ以外の画像は容量超過の通知対象にならない。 |
| sheet-13-R042 | S3画像サイズチェック処理 | 実装違い | IO | P3 | 超過アラートは、設計が定める通知先（BCCは r9y9k6q2h2i8d9b5@sekappy-dev.slack.com）にも届く。 |
| sheet-13-R043 | S3画像サイズチェック処理 | 実装違い | IO | P3 | 通知メールの件名は「画像ファイルサイズ超過アラート」である。 |
| sheet-8-R013 | 月次商品情報スナップショット | 実装違い | ふるまい | P3 | 一時的に作られるDBインスタンスの名前は restore-for-inventory である。 |

### sheet-14-R004 データベースデッドロック感知 — 未実装／IO／P2

- 正本: sheet-14（データベースデッドロック感知） HTML行 1477 付近
- 正本引用: 「注文テーブルでデッドロック発生時、管理者メールアドレスにデッドロック発生通知および詳細情報を送信する」
- 設計期待値: 注文データでデッドロックが発生したとき、管理者のメールアドレスに発生通知と、どこで起きたかが分かる詳細情報が届く
- 画像確認: 本シートに添付画像は0枚（sheets/sheet-14.txt ヘッダの「画像 0枚」、images/ 配下に sheet-14_img*.png は存在しない）。図中文言の見落としは無い。
- 実装参照: `infra/lib/constructs/alerts/server/database/primary.rds.alert.ts:12; script/ops/db/init.sh:1`
- 実装実態: ee にデッドロックを検知して通知する資材が無い。deadlock/デッドロックでリポジトリ全体を検索した一致はMTGカードデータ（app/DoctrineMigrations/sql/mtb_card.sql:2786 の「行き詰まりの罠」等）だけで、ロック状態を調べる問合せは src/Eccube/Repository/OrderRepository.php:1118 のアドバイザリロックの空き判定だけで、これは自前の名前付きロックが取れているかを見るものであり、相互待ち（デッドロック）の検出には使っていない。pg_stat_activity を参照する箇所は0件。script/ops 配下のバッチ、src/Eccube/Command 配下の全コマンド、シェルスクリプト34本にも該当処理は無い。DBの監視は infra/lib/constructs/alerts/server/database/primary.rds.alert.ts:12 のCPU・接続数・ストレージ・遅延など13項目の警報だけで、デッドロックを対象にした警報も管理者宛の通知経路も無い。
- 同じ実装実態でまとまる要求: sheet-14-R011（データベースデッドロック感知）、sheet-14-R012（データベースデッドロック感知）
- 判定根拠: 機能本体の記述（注文テーブルのデッドロック発生時に通知と詳細情報を送る）。本設計書(0416)の他バッチは ee の script/ops 配下に実装されており、script/ops/stg-db-maintenance/restoresnapshot_stg_from_tmp.sh:3 が自身を「B16-10」と明記していることから、B16系バッチの実装場所は ee である。そこにB16-12に当たる資材が無く、ロック状態を調べる問合せも管理者へのデッドロック通知も存在しないため、実装が無いと判断した。
- 確信度: med

### sheet-7-R002 WAF不正アクセスログ集計処理 — 未実装／ふるまい／P2

- 正本: sheet-7（WAF不正アクセスログ集計処理） HTML行 1021 付近
- 正本引用: 「・晴れる屋EC-CUBEのWAFで不正アクセスした際に生成されるログを元に、前日分のログ統合・集計を行う。」
- 設計期待値: 前日分の不正アクセスと判断されたアクセスログが日次でまとめられ、集計結果が残る。
- 画像確認: 画像0枚（本シートにレイアウト図なし）
- 実装参照: `infra/lib/constructs/network.ts:167`
- 実装実態: ee内にWAFログの集計処理が存在しない。WAFはinfra/lib/constructs/network.ts:167でWebACLとして定義されるだけで、ログのS3配信も集計も無い。集計スクリプトは一度 script/ops/waf-log-count/ に追加された後（bc3df4478f）、Slack通知が削除され（ff9ec7cd56）、スクリプト自体も削除されている（4a44f08d6a, ECCUBE_HARERUYA-1306）。
- 同じ実装実態でまとまる要求: sheet-7-R004（WAF不正アクセスログ集計処理）、sheet-7-R005（WAF不正アクセスログ集計処理）、sheet-7-R009（WAF不正アクセスログ集計処理）、sheet-7-R021（WAF不正アクセスログ集計処理）、sheet-7-R024（WAF不正アクセスログ集計処理）、sheet-7-R026（WAF不正アクセスログ集計処理）、sheet-7-R028（WAF不正アクセスログ集計処理）、sheet-7-R031（WAF不正アクセスログ集計処理）
- 判定根拠: script/ops配下（imgcheck・monthly-inventory-snapshot・stg-db-maintenance）には他のインフラバッチが移植されているが、WAFログ集計は現HEADに無い。削除コミットがあるため、別リポジトリへの移管や設計側の取り下げの可能性が残る（要確認）。
- 確信度: med

### sheet-9-R002 Redash用データベース作成 — 未実装／ふるまい／P2

- 正本: sheet-9（Redash用データベース作成） HTML行 1171 付近
- 正本引用: 「分析用Redash用データベースを作成する」
- 設計期待値: 分析用に使うデータベースが本番とは別に用意される
- 画像確認: 本シートに添付画像は0枚（sheets/sheet-9.txt ヘッダの「画像 0枚」、images/ 配下に sheet-9_img*.png は存在しない）。図中文言の見落としは無い。
- 実装参照: `script/ops/stg-db-maintenance/restoresnapshot_stg_from_tmp.sh:102; script/ops/monthly-inventory-snapshot/inventory.sh:59; script/ops/stg-db-maintenance/smaregi_clear.sql:5`
- 実装実態: ee にはRedash用データベースを作る資材が無い。リポジトリ全体（*.sh/*.sql/*.php/*.ts/*.yml/*.md）を redash で検索して0件、シェルスクリプトは34本すべて確認したがRedash向けは無い。近い処理は script/ops/stg-db-maintenance/restoresnapshot_stg_from_tmp.sh:102 のステージング用（B16-10）と script/ops/monthly-inventory-snapshot/inventory.sh:59 の月次在庫用で、いずれもRedash用DBを残さない（前者はSTG差し替え後に一時リソースを削除、後者は集計CSV取得後に一時DBを削除）。スマレジ設定の除去は script/ops/stg-db-maintenance/smaregi_clear.sql:5 にステージング向けとして存在するが、注文のスマレジ削除フラグを更新するSQLはリポジトリ内に無い（smaregi_del_flg を更新する *.sql/*.sh は0件）。
- 同じ実装実態でまとまる要求: sheet-9-R004（Redash用データベース作成）、sheet-9-R008（Redash用データベース作成）、sheet-9-R010（Redash用データベース作成）、sheet-9-R011（Redash用データベース作成）、sheet-9-R012（Redash用データベース作成）
- 判定根拠: 機能の概要（分析用Redash用データベースを作成する）。本設計書(0416)の他バッチは ee の script/ops 配下に実装されており、script/ops/stg-db-maintenance/restoresnapshot_stg_from_tmp.sh:3 は自身を「ステージングデータベース保守バッチ (ECCUBE_HARERUYA-783 / B16-10)」と明記している。つまりB16系バッチの実装場所は ee である。そこにB16-07に当たる資材が無く、Redash という語もリポジトリ全体で0件のため、実装が無いと判断した。
- 確信度: med

### sheet-10-R018 EC-CUBE 同期ディレクトリ処理バッチ — 未実装／IO／P3

- 正本: sheet-10（EC-CUBE 同期ディレクトリ処理バッチ） HTML行 1234 付近
- 正本引用: 「★S3パス :  s3://[S3バケット名]/html/sitemap.xml　→　EC-CUBE 同期ディレクトリ : /var/ec-cube/html/sitemap.xml※カスタマイズ時にサイトマップ同期も当スクリプトに追加」
- 設計期待値: S3に置かれたsitemap.xmlの内容が、ECサーバの /var/ec-cube/html/sitemap.xml に反映され、公開されるサイトマップがS3側の最新内容になる。
- 画像確認: 画像0枚（本シートにレイアウト図なし）
- 実装参照: `dockerbuild/eccube/file_sync_command.sh:57-65`
- 実装実態: 同期対象は app/template/default・app/template/user_data・html/user_data の3つだけで（dockerbuild/eccube/file_sync_command.sh:57-65、dockerbuild/docker-php-entrypoint:183-185）、html/sitemap.xml を同期する処理はee内のどこにも無い。S3上のsitemap.xmlを取り込む記述はスクリプト・設定・CDKのいずれにも存在しない。
- 同じ実装実態でまとまる要求: sheet-10-R019（EC-CUBE 同期ディレクトリ処理バッチ）
- 判定根拠: ★カスタマイズとして追加が指示されているsitemap.xmlの同期が無い。サイトマップ生成バッチ（同書サイトマップ生成処理）がS3へ上げたファイルを取り込む経路が無いため、公開されるサイトマップはEC-CUBE標準の動的生成（src/Eccube/Controller/Front/SitemapController.php:56）のままになる。 同期元バケット名の設定は app/config/eccube/packages/eccube.yaml:39（AWS_S3_CONTENT_BUCKET）。実装の実体は上記シェルスクリプト。
- 確信度: high

### sheet-13-R008 S3画像サイズチェック処理 — 実装違い／IO／P3

- 正本: sheet-13（S3画像サイズチェック処理） HTML行 1403 付近
- 正本引用: 「・下記バケットからファイル名およびファイルサイズの一覧を取得する」
- 設計期待値: ファイル名とサイズの一覧取得の対象は、商品サムネイル・商品サムネイル(オリジナル画像)・バナー画像・商品画像・絵文字(シンボル)の5種の置き場所に限られ、それ以外の画像は容量超過の通知対象にならない。
- 画像確認: 画像0枚（本シートにレイアウト図なし）
- 実装参照: `script/ops/imgcheck/bigfilefinder.sh:14; script/ops/imgcheck/bigfilefinder.sh:34-40`
- 実装実態: 設計に無い img/goods/iwatatest/ 配下も一覧取得の対象にしており（script/ops/imgcheck/bigfilefinder.sh:14）、512000バイト以上のものを通知一覧に加えている（script/ops/imgcheck/bigfilefinder.sh:34-40）。
- 同じ実装実態でまとまる要求: sheet-13-R014（S3画像サイズチェック処理）
- 判定根拠: 設計の入力データ詳細は①〜⑤の5種のみを挙げるが、実装は6種目としてテスト用と思われる img/goods/iwatatest/ を走査対象にしている。結果として設計外の画像も超過アラートのメール本文に載る。 画像バケットの設定は app/config/eccube/packages/eccube.yaml:45。実装の実体は上記シェルスクリプト。
- 確信度: high

### sheet-13-R042 S3画像サイズチェック処理 — 実装違い／IO／P3

- 正本: sheet-13（S3画像サイズチェック処理） HTML行 1437 付近
- 正本引用: 「・規定サイズを超えるファイルがある場合、該当ファイル一覧を作成し管理者メールアドレスに通知する」
- 設計期待値: 超過アラートは、設計が定める通知先（BCCは r9y9k6q2h2i8d9b5@sekappy-dev.slack.com）にも届く。
- 画像確認: 画像0枚（本シートにレイアウト図なし）
- 実装参照: `script/ops/imgcheck/config.sh:36; script/ops/imgcheck/bigfilefinder.sh:96`
- 実装実態: BCCの既定値は ex-hareruya-eccube-al-aaaat4a5x3pzbmyj2q2bc6gd5u@wakuwaku-impact.slack.com（script/ops/imgcheck/config.sh:36）で、設計が指定するアドレスとは別のSlack取り込み先になっている。
- 判定根拠: From/To/CCは設計値と一致するが、BCCだけ別ワークスペース宛のアドレスになっている。環境変数で上書きできるが、リポジトリ内の既定値・本番設定例（script/ops/imgcheck/config.sh:5-10）にも設計値は現れない。設計側が旧開発Slack宛のままである可能性があり、どちらを正とするか確認が必要。 画像バケットの設定は app/config/eccube/packages/eccube.yaml:45。実装の実体は上記シェルスクリプト。
- 確信度: med

### sheet-13-R043 S3画像サイズチェック処理 — 実装違い／IO／P3

- 正本: sheet-13（S3画像サイズチェック処理） HTML行 1438 付近
- 正本引用: 「・規定サイズを超えるファイルがある場合、該当ファイル一覧を作成し管理者メールアドレスに通知する」
- 設計期待値: 通知メールの件名は「画像ファイルサイズ超過アラート」である。
- 画像確認: 画像0枚（本シートにレイアウト図なし）
- 実装参照: `script/ops/imgcheck/bigfilefinder.sh:97`
- 実装実態: 件名は「画像ファイルサイズ超過アラート」の後ろに実行日時を連結して送信している（script/ops/imgcheck/bigfilefinder.sh:97）。
- 判定根拠: 設計は件名を「画像ファイルサイズ超過アラート」と定めるが、実装は末尾に -$(date) を付けるため受信側の件名は毎回変わる。件名で振り分ける運用がある場合に影響する。 画像バケットの設定は app/config/eccube/packages/eccube.yaml:45。実装の実体は上記シェルスクリプト。
- 確信度: med

### sheet-8-R013 月次商品情報スナップショット — 実装違い／ふるまい／P3

- 正本: sheet-8（月次商品情報スナップショット） HTML行 1116 付近
- 正本引用: 「・名前はrestore-for-inventoryとする」
- 設計期待値: 一時的に作られるDBインスタンスの名前は restore-for-inventory である。
- 画像確認: 画像0枚（本シートにレイアウト図なし）
- 実装参照: `script/ops/monthly-inventory-snapshot/inventory.sh:36; script/ops/monthly-inventory-snapshot/config.sh:22`
- 実装実態: 既定名 restore-for-inventory の後ろに実行時刻と乱数由来のIDを連結した名前でインスタンスを作る（script/ops/monthly-inventory-snapshot/inventory.sh:34-36）ため、実際の名前は実行ごとに変わる。
- 判定根拠: R011と同一の実装欠陥（一時リソース名へのサフィックス付与）。script/ops/monthly-inventory-snapshot/config.sh:22 の既定値は設計どおりだが script/ops/monthly-inventory-snapshot/inventory.sh:36 で書き換えられる。 抽出対象データの定義はEC-CUBE本体側（src/Eccube/Entity/ProductStock.php:263 など）にあり、本バッチはその本番DBを復元して読む。
- 確信度: med

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 8 | 0 | 0 | 0 | 8 |
| sheet-2 | 目次 | 14 | 0 | 0 | 0 | 14 |
| sheet-3 | WordPress主要ファイルからS3バケットへ同期 | 23 | 0 | 0 | 0 | 23 |
| sheet-4 | S3からWP主要ファイル同期(記事管理サーバ用) | 24 | 0 | 0 | 0 | 24 |
| sheet-5 | S3からWP主要ファイル同期(記事サーバ1用) | 24 | 0 | 0 | 0 | 24 |
| sheet-6 | S3からWP主要ファイル同期(記事サーバ2用) | 24 | 0 | 0 | 0 | 24 |
| sheet-7 | WAF不正アクセスログ集計処理 | 36 | 9 | 0 | 0 | 27 |
| sheet-8 | 月次商品情報スナップショット | 40 | 0 | 1 | 0 | 39 |
| sheet-9 | Redash用データベース作成 | 19 | 6 | 0 | 0 | 13 |
| sheet-10 | EC-CUBE 同期ディレクトリ処理バッチ | 35 | 2 | 0 | 0 | 33 |
| sheet-11 | サイトマップ生成処理 | 33 | 0 | 0 | 0 | 33 |
| sheet-12 | ステージングデータベース保守バッチ | 30 | 0 | 0 | 0 | 30 |
| sheet-13 | S3画像サイズチェック処理 | 52 | 0 | 4 | 0 | 48 |
| sheet-14 | データベースデッドロック感知 | 20 | 3 | 0 | 0 | 17 |

