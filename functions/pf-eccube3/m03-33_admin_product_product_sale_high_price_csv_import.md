# m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）

## 概要

管理画面の「商品管理」→「商品CSV管理」から開く「セール用高額商品価格変更CSVアップロード」において、CSV ファイルを送信して高額品かつ非公開規格の価格・セール状態・帯 URL・タグ・スマレジ連携フラグを一括更新し、条件に応じて価格履歴と取込履歴を追記する機能である。雛形ファイルのダウンロード仕様は別紙 `admin_product_sale_high_price_csv_export.md` を正とする。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値は EC-CUBE Enterprise の `src/Eccube` 配下および同梱設定を正とする。

本機能のカスタマイズ区分はカスタマイズである。挙動は現行リポ pf-eccube3 の実装を参照し、DB関連の記述（テーブル名・列名・保存先・副作用のDB更新）は ec-cube-enterprise を正とする。セール用高額商品価格変更CSV登録は ec-cube-enterprise にも同等実装がある。

対象はブラウザ経由の管理画面に限定する。

コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

- 価格・買取・セール・帯URL・スマレジ連携フラグ・高額商品コードの保存先: 現行 pf-eccube3 ではこれらが規格テーブルと規格補助テーブル（dtb_product_sub_class）に分かれるが、移行先 ec-cube-enterprise では規格テーブル dtb_product_class に統合している。本書のDBカラム節・保存先の記述は移行先 dtb_product_class を正とする。
- 商品タグの紐付け列: 現行 pf-eccube3 は dtb_product_tag の tag 列、移行先 ec-cube-enterprise は dtb_product_tag の tag_id 列で保持する。
- 価格履歴・取込履歴: dtb_price_history・dtb_csv_import_history は現行と移行先で同一スキーマである。
- 取込種別ID: 高額商品価格変更取込は ec-cube-enterprise の取込種別マスタで ID 8（HIGH_PRICE_IMPORT_CSV_ID）に対応する。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| ナビ「商品管理」→「商品CSV管理」→「セール用高額商品価格変更CSVアップロード」 | `GET /{admin_route}/product/sale_high_price/csv_upload` | アップロード画面が開き、フォーマット表・履歴・雛形リンクが表示される。 |
| CSV を選択して「CSVアップロード」を押す | `POST /{admin_route}/product/sale_high_price/import` | 検証・取込のあと常に `GET …/sale_high_price/csv_upload` へリダイレクトされ、フラッシュで結果が示される。 |
| 履歴の表示件数プルダウン変更 | `GET /{admin_route}/product/sale_high_price/csv_upload?page_no=1&page_count={件数}` | 許容リストに含まれる件数だけセッションに保存され、履歴のページサイズが変わる。 |
| 雛形ダウンロード | `GET /{admin_route}/product/sale_high_price/csv_template` | 雛形ファイルが得られる。 |

ナビゲーションのキーは `admin.product.sale_high_price_csv`（日本語ロケールの確認値は「セール用高額商品価格変更CSVアップロード」）。

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | `@admin/Product/csv_product_sale_high_price.twig` は `@admin/Product/base_csv_upload.twig` を継承する。ページタイトルは `admin.product.product_management`、サブタイトルは `admin.product.sale_high_price_csv`。サイドメニューは `product`・`product_csv_management`・`sale_high_price_csv_import`。フォームは `id="upload-form"`、`action` は `admin_product_sale_high_price_import`。ファイル入力は `accept=".csv, text/csv, .tsv, text/tsv"`。続けてフォーマット説明表（必須バッジはコントローラが渡す `csv_required_header_keys` に基づく）。下部に取込履歴（ファイル名・アップロード日時・作業者）。履歴の表示件数は 10, 50, 100, 300, 500, 1000, 2000, 10000, 12000 のいずれか。 |
| JS 挙動 | ファイル選択でラベルへファイル名を表示する。フォーム送信時に `$.changeLoading(true)` を呼ぶ。履歴件数プルダウン変更で `window.location.href` を差し替える。 |
| CSS・レイアウト | `base_csv_upload.twig` 内の `custom-file` 向けスタイル。 |
| モーダル・ポップアップ | 送信前の確認ダイアログはない。 |

---

## 処理フロー

### アップロード画面を表示する（GET `admin_product_sale_high_price_csv_upload`）

1. 管理画面の認証・共通制約を通過する。
2. 管理者向け CSV 取込フォーム種別の空フォームを組み立て、リクエストをバインドする（クエリのみの GET では実質空のまま）。
3. クエリ `page_count` が許容リストに含まれる場合のみセッションキー `admin.product.sale_high_price_csv.page_count` に保存する。含まれない場合はセッション既存値または既定 10 を採用する。
4. `page_no` はクエリまたはセッション `admin.product.sale_high_price_csv.page_no` から決め、都度セッションへ書き戻す。
5. 取込種別が `HIGH_PRICE_IMPORT_CSV_ID` の履歴だけを対象とするクエリをページネーションし、テンプレートへ渡す。

### CSV を取込む（POST `admin_product_sale_high_price_import`）

1. ログイン利用者を取込更新者として用いる。本コントローラは PHP の実行時間制限を明示的に解除しない。
2. 管理者向け CSV 取込フォーム種別を組み立てて送信をバインドする。妥当でなければ各フォームエラーを `admin` フラッシュに積み、`GET admin_product_sale_high_price_csv_upload` へリダイレクトする。
3. `import_file` が null ならキー `admin.common.csv_invalid_format` を `admin` フラッシュに積み、同じくリダイレクトする。
4. アップロードファイル全文から、二重引用符内の改行を除いたうえでの改行数を数え、その件数が抽象コントローラ定数 `ADMIN_CSV_IMPORT_MAX_ROWS`（5010）以上なら `admin.csv.error.upload.maxrecord`（パラメータに当該上限）を `admin` フラッシュに積み、リダイレクトする。取込本体は開始しない。
5. 情報ログに「セール用高額商品価格変更CSV登録開始」を書く。
6. 行処理用ハンドラ（価格履歴リポジトリ・規格リポジトリ・商品リポジトリ・スマレジ連携コーディネータを渡して生成）と、汎用インポータを組み立て、アップロードファイルを渡して `import` を呼ぶ。
7. 戻り値に info があれば各メッセージを `admin` の warning フラッシュに積む（コントローラは `addWarning` を使う）。
8. 戻り値にエラーがあれば情報ログに「セール用高額商品価格変更CSV登録 異常終了」を書き、各エラーを `admin` フラッシュに積む。成功時はキー `admin.register.complete` を `admin` 成功フラッシュに積み、情報ログに「セール用高額商品価格変更CSV登録完了」と処理件数を書き、`dtb_csv_import_history` へ 1 行 INSERT する（種別 ID は `HIGH_PRICE_IMPORT_CSV_ID`、ファイル名はクライアントオリジナル名、作業者はログイン利用者 ID）。
9. 常に `GET admin_product_sale_high_price_csv_upload` へリダイレクトする。

### 汎用インポータ内部（確認値）

1. アップロードファイルを設定 `eccube_csv_temp_realdir` 配下へ移し、`SplFileObject` として開く。拡張子が `tsv` のときはタブ区切り、それ以外は `eccube_csv_import_delimiter` と `eccube_csv_import_enclosure` を使う。
2. 1 行目をヘッダとみなせなければエラー配列を返して終了する。ヘッダのみでデータ行が無ければエラー配列を返して終了する。
3. DB 接続でトランザクションを開始し、行ロックタイムアウトをハンドラが返す秒数（既定 5）に設定する。
4. データ行ごとに「物理列数とハンドラ定義列数の一致」「各列の必須・型・桁」「行ターゲット検証（後述）」を通過させたうえで行更新処理へ進む。インデックスが 100 の倍数の行ごとに flush と clear を挟む（汎用インポータの既定）。
5. 全行処理後、再度 flush と clear を行う。
6. トランザクションの成否判定は、メッセージストアが保持する CSV 取込エラー件数（行バリデーション等で積むエラーのみで、行番号付きの注意文言として積む別配列は数に入れない実装確認値）と、行ループ中に `breakAll` が発生したかどうかのフラグで行う。エラー件数が 0 である、または途中で一度も `breakAll` が発生しなかったときのどちらか一方でも真ならコミットし、「エラーが 1 件以上あり、かつ途中で `breakAll` が発生した」ときだけロールバックする。
7. ハンドラの「取込後」フックを呼ぶ（成功可否を引数に渡す）。スマレジ連携コーディネータはこのタイミングで完了処理へ進む。
8. 処理件数・エラー配列・info 配列を結果オブジェクトに載せて返す。

### 行ターゲット検証（ハンドラの検証フック）

1. 商品コードが `dtb_product_class` 上で 2 件以上に重複している場合はエラーを積み `breakAll` する（1 件以下のみ通過）。
2. 次に、高額品かつ非公開の規格を商品コードで再検索し、見つからなければ不存在エラーを積み `breakAll` する。

### 行更新処理（検証通過後）

1. 再度、同じ検索要件で規格を取得する。見つからなければ不存在エラーを積み `breakAll` し false を返す（二重の防御）。
2. CSV の販売・買取は `bcfloor` 相当で整数化する。セールフラグ・スマレジ連携フラグは 0／1 を整数として読み、真偽へ変換する。
3. 商品に紐付くタグ ID リストを CSV の「タグ(ID)」から解釈し、`dtb_product` 単位でタグを置換する（更新者 ID はログイン利用者）。
4. 現在のセールフラグと CSV のセールフラグの組み合わせで、新しい販売価格とセールフラグを決める（「セールフラグと販売価格の決定順序」の表に従う）。
5. 規格 ID 単位で SQL の UPDATE を発行し、`price02`・`buy_price`・`belt_url`・`sale_flg`・`smaregi_alignment_flg`・`update_date` だけを上書きする。`standard_price` は本 UPDATE では変えない。
6. スマレジ連携コーディネータへ、規格 ID・CSV のスマレジフラグ・スマレジ商品コードを渡し、条件を満たすときだけ後続処理を予約する。
7. 変更前の販売・買取・基準価格（販売の「変更前」は現在の `price02`）と、決定した新販売・CSV 買取・変更前基準価格を価格履歴リポジトリへ渡し、いずれかが変化しているときだけ `dtb_price_history` に 1 行追加する。

---

## 集計条件

本機能では売上集計や一覧件数の業務集計は行わない。履歴一覧は「CSV 取込種別が高額価格取込」の履歴行を時系列クエリでページングするだけである。

---

## セールフラグと販売価格の決定順序

（買取価格は下表のいずれでも CSV 値を `buy_price` に書き込む。帯 URL・スマレジ・タグもセール分岐に依存しない。）

| 順序 | 現在のセールフラグ | CSV セールフラグ（1 をセール ON とみなす） | 新しい販売価格 | 新しいセールフラグ | 付帯メッセージ |
|------|-------------------|------------------------------------------|----------------|-------------------|----------------|
| 1 | OFF／NULL | ON | CSV 販売価格 | ON | なし |
| 2 | ON | ON | CSV 販売価格 | ON | なし |
| 3 | ON | OFF | 既存の基準価格 | OFF | CSV 販売価格セルが 0 以外のとき、info キー `admin.product.sale_high_price_csv.alert_off_sale_buy_only` を行番号付きで積む |
| 4 | OFF／NULL | OFF | 取込時点の既存 `price02` を `bcfloor` した値 | OFF | info キー `admin.product.sale_high_price_csv.alert_end_sale_sell_from_standard` を行番号付きで積む |

---

## 業務ルール・計算

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| CSV ファイル | 必須 | ファイルサイズは Symfony のファイル制約で `eccube_csv_size` に付いたメガバイト上限（`eccube.yaml` 配布値は 5M）。改行カウントの目安が抽象コントローラ定数 5010 行未満であること（5010 行以上でコントローラが拒否） | 未選択 | 一時ディレクトリへ移動後に汎用インポータが読み捨てし、終了時に削除する。本文バイト列は履歴のファイル名以外に保存しない |
| CSRF トークン | 必須 | フォーム種別既定 | 画面表示値 | 欠落・不一致時はフォーム妥当性エラーでリダイレクト |

補足。画面フォームの永続化はファイル入力と CSRF に限る。フォーム型には他フィールド（強制反映チェック等）も定義されるが、本テンプレートではウィジェットを出しておらず、画面から操作されるのは上記とファイル入力のみである。

### CSV アップロードファイル内の各列（フォーマット表／雛形の見出しどおりの日本語列名）

データ行は、ハンドラが持つ列定義の数と一致する列数であること。ヘッダ名で列が解決される。

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 商品コード | 必須 | 取込列検証は必須チェックのみ（桁上限の列バリデータは付けない）。DB は `dtb_product_class.product_code` 長さ 255 | — | 高額・非公開の規格を一意に特定するキー。2 件以上一致で全体エラー |
| 販売価格 | 必須 | 半角数字のみ（0 以上）。桁は列定義で最大 9 桁 | — | セール ON へ遷移するときおよびセール中のまま更新するときの新しい販売価格の元。現在セール OFF かつ CSV もセール OFF のときは新販売価格の決定に使わず、既存 `price02` を維持する。情報メッセージ `admin.product.sale_high_price_csv.alert_end_sale_sell_from_standard` が行番号付きで載るだけである |
| 買取価格 | 必須 | 同上 | — | 常に CSV 値を `dtb_product_class.buy_price` へ |
| セールフラグ | 必須 | 列定義は 0 か 1 のみ | — | `dtb_product_class.sale_flg` |
| 帯URL | 任意 | 列検証は文字列必須なし。DB 列 `belt_url` は長さ 128 の可変長文字列 | 空のとき null を書く | `dtb_product_class.belt_url` |
| タグ(ID) | 任意 | カンマ区切りの非負整数。各要素は最大 9 桁。タグマスタ存在検証あり | 空 | `dtb_product` に紐付く商品タグを置換 |
| スマレジ連携フラグ | 必須 | 0 か 1 のみ | — | `dtb_product_class.smaregi_alignment_flg` |

### エッジケース

| ケース | 扱い |
|--------|------|
| 高額コードが空／NULL の規格、または規格が公開のまま | 検索にヒットせず不存在エラーで全体中断 |
| 同一商品コードの規格が 2 件以上 | 重複エラーで全体中断 |
| セール外かつ CSV もセール OFF | 販売価格は CSV ではなく既存 `price02` を維持し、情報メッセージを積む。買取価格は CSV 値で更新する |
| セール ON から CSV でセール OFF | 販売価格は既存基準価格へ戻す。CSV 販売列が 0 でなければ info を積む |
| 価格履歴 | 変更前後で販売・買取・基準のいずれも変化がなければ履歴行は増えない。本取込は基準価格を更新しないため、履歴に渡す「新基準」は常に変更前基準と同値 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧との一致 | 取込直後、同一トランザクションがコミットされていれば商品規格の参照クエリは更新後値を返す。ロールバックされた場合は更新されない。 |
| 履歴 | 取込履歴はエラーなくコミット完了した実行だけが 1 件増える。失敗時は増えない。 |
| スマレジ | コーディネータに予約された処理はコミット成功後フック側の責務であり、本書では完了保証の範囲を切らない。 |

---

## API/バッチ結果

本機能は画面から外部 HTTP API を直接呼ばない。スマレジ連携の実処理はコーディネータ経由の別処理に委ねる。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | CSV ファイル（POST マルチパート）、履歴ページング用 GET クエリ |
| 成功時出力 | 同一画面上に成功フラッシュ（キー `admin.register.complete`）。info があるときは warning フラッシュに各文面。履歴テーブルに新行。 |
| 失敗時出力 | `admin` エラーフラッシュに汎用 CSV エラーメッセージまたはフォームエラー。 |
| 副作用 | 規格の価格・セール・帯・スマレジフラグ更新、商品タグ置換、条件付きで価格履歴・取込履歴 INSERT、情報ログ、スマレジ連携の予約。 |

---

## DBカラム

| テーブル | 列 | メモ |
|---------|-----|------|
| dtb_product_class | product_code, high_price_code, standard_price, price02, buy_price, belt_url, sale_flg, smaregi_alignment_flg, update_date, 規格ステータス | 検索と UPDATE の対象 |
| dtb_csv_import_history | csv_import_type_id, file_name, member_id, create_date 等 | 成功コミット後に 1 行追加 |
| dtb_price_history | 販売・買取・基準の新旧、product_class_id, member_id 等 | 変化があれば追加 |

### DB操作

永続化の正は ec-cube-enterprise。商品系は承認ワークフローを介さず persist/flush で直接確定する（在庫の承認ワークフローとは別系統。`ProductController`・各CSVサービスで確認）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_csv_import_history / dtb_price_history / dtb_product_class | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| アップロードファイル | NotBlank、最大サイズ `eccube_csv_size` M、事前の改行カウント 5010 未満 |
| CSV 全体 | 1 行目ヘッダ必須、2 行目以降に最低 1 データ行 |
| 各列 | 物理列数一致、ヘッダ名の存在、必須列の値、数値列は半角数字と 9 桁上限、セール・スマレジは 0／1、タグ ID はマスタ存在 |
| 行ターゲット | 商品コードの重複禁止、高額・非公開規格の存在必須 |

---

## 権限・認可

| 利用者状態 | アップロード画面（GET） | 取込（POST） |
|------------|-------------------------|--------------|
| 管理画面にログイン済みで当領域へ到達できる主体 | 画面を表示できる | 取込を実行できる |
| 未認証または管理領域外の主体 | 管理画面のセキュリティ設定に従いログイン誘導またはアクセス拒否となる。細部は別設計を正とする。 | 同上 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 取込 POST の完了（成功・失敗いずれも） | `GET /{admin_route}/product/sale_high_price/csv_upload` |
| 履歴件数変更 | 同一パスにクエリ付きで GET |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| GET 画面 | `page_count` 許容値ならセッションへ保存。`page_no` を毎回セッションへ保存 | 保存済みページサイズ・ページ番号で履歴を再取得 |
| POST 取込 | フラッシュへ成功・警告・エラーを積む | リダイレクト後の GET でフラッシュが表示され、履歴は更新後データ |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| フォーム・CSRF 不備 | エラーフラッシュし、アップロード画面へリダイレクト |
| ファイル未選択 | `admin.common.csv_invalid_format` を出しリダイレクト |
| 行数上限超過 | `admin.csv.error.upload.maxrecord` を出しリダイレクト |
| CSV 形式・列・ターゲット不備 | 汎用インポータがエラー配列を返しトランザクションロールバック。コントローラがエラーフラッシュに載せる |
| 取込中の例外 | インポータはロールバック試行後、捕捉した例外をそのまま再送出する。画面は Symfony のエラーハンドリングに従う |

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 |
|--------------|----------|--------------|----------|
| M03-33-MSG-001 | 画面上部フラッシュ（エラー） | 要ソース確認 | POST 後にフォームが妥当でないとき（`import_file` の NotBlank / File(maxSize) 制約違反）。`$error->getMessage()` を渡し逐語literal無し。制約はカスタム message 無しのため既定文言候補: NotBlank「入力されていません。」（validators.ja.yaml:17）/ File maxSize「ファイルのサイズが大きすぎます（{{ size }} {{ suffix }}）。{{ limit }} {{ suffix }}以下にしてください。」（Symfony 既定訳）。`admin.csv.error.upload.require`/`maxsize` は本フォームに未配線のため候補から撤回。`$form->getErrors()` はルートフォーム直属エラーのみ返すため実行経路の断定不能 |
| M03-33-MSG-002 | 画面上部フラッシュ（エラー） | CSVのフォーマットが一致しません | フォーム処理後に `import_file` が取得できない（null）とき |
| M03-33-MSG-003 | 画面上部フラッシュ（エラー） | %maxRecord% 行を超えるCSVファイルは登録できません。 | 改行カウントが上限定数 `ADMIN_CSV_IMPORT_MAX_ROWS` 以上のとき（`%maxRecord%` は同定数で置換。キー `admin.csv.error.upload.maxrecord`） |
| M03-33-MSG-004 | 画面上部フラッシュ（警告） | 要ソース確認 | 取込結果に info があるとき（行ごとに通知、`$info['message']`）。逐語literal候補2件: `admin.product.sale_high_price_csv.alert_off_sale_buy_only`「%d行目: セール外のため、買取価格および販売価格はデータベースにある基準価格で更新してます。」/ `admin.product.sale_high_price_csv.alert_end_sale_sell_from_standard`「%d行目: 通常商品のため、買取価格はCSVの値で更新しました。」。1行に2文言が併存するため単一literalへ断定不能 |
| M03-33-MSG-005 | 画面上部フラッシュ（エラー） | 要ソース確認 | 取込結果にエラーがあるとき（`$error['message']`、CSV 形式・必須値・商品コード重複／不存在等）。生成元が複数で MessageStore が sprintf 置換。逐語literal候補: `admin.csv.error.format.body`「CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。」/ `admin.csv.error.data.require`「%s は必須項目です。 %d 行目のデータを確認してください。」等。単一literalへ断定不能 |
| M03-33-MSG-006 | 画面上部フラッシュ（成功） | 登録が完了しました。 | 取込がエラーなく完了したとき（キー `admin.register.complete`） |

---

## 試行制限

本機能ではログイン試行回数のようなレート制限を独自には扱わない。

---

## ログ・監査

| タイミング | 記録内容 |
|------------|----------|
| 取込開始直前 | 情報ログ「セール用高額商品価格変更CSV登録開始」 |
| 取込がエラー配列を返したとき | 情報ログ「セール用高額商品価格変更CSV登録 異常終了」 |
| 取込がエラーなく完了したとき | 情報ログ「セール用高額商品価格変更CSV登録完了」と処理件数 |
| 成功時 | `dtb_csv_import_history` にファイル名・作業者・種別 |

### ログに出してはいけないもの

- パスワード
- なりすまし対策トークン
- Cookie 値
- セッション ID の完全値
- Remember Me トークンの原値

---

## セッション

### 本機能におけるセッション

| 観点 | 内容 |
|------|------|
| 履歴ページング | キー `admin.product.sale_high_price_csv.page_count` および `admin.product.sale_high_price_csv.page_no` は、GET で画面を開くたびにクエリやセッションに応じてセッションへ書き換える |

### セッションへ保存しない情報

- アップロードした CSV の本文

---

## Cookie

本機能はセッション用 Cookie 以外を独自には扱わない。セッション Cookie の名前・属性は管理画面共通の設定を正とする。

---

## 排他制御・トランザクション

1. 汎用インポータが 1 取込あたり 1 トランザクションを張り、行ロック待ちの上限はハンドラの戻り値（秒）に従う。
2. 規格更新は主にネイティブ UPDATE で行い、同一規格への同時更新競合は DB ロックの順序に依存する。楽観的多version列は本取込では用いない。

---

## 調査補助

- コントローラ: `src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php`
- 行ハンドラ: `src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php`
- 汎用インポータ: `src/Eccube/Service/Csv/Importer/CsvImporter.php`
- 規格検索・更新 SQL: `src/Eccube/Repository/ProductClassRepository.php`（`findHighPriceProductClassForSaleCsv` と `updateProductClassForHighPriceSaleCsv`）
- 共通アップロードテンプレート: `src/Eccube/Resource/template/admin/Product/base_csv_upload.twig`
- 自動テスト: `tests/Eccube/Tests/Web/Admin/Product/Csv/ProductSaleHighPriceCsvControllerTest.php`

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_product_sale_high_price_csv_upload` … `GET` … `/{admin_route}/product/sale_high_price/csv_upload`（アップロードフォーム、フォーマット説明表、雛形へのリンク、本取込に紐付く CSV 取込履歴のページネーションを表示する。）
- `admin_product_sale_high_price_import` … `POST` … `/{admin_route}/product/sale_high_price/import`（送信ファイルを検証し、取込処理を実行する。終了後は常に `GET admin_product_sale_high_price_csv_upload` へ HTTP リダイレクトする。）
- `admin_product_sale_high_price_csv_template` … `GET` … `/{admin_route}/product/sale_high_price/csv_template`（ヘッダ行のみの雛形 CSV を返す。画面表示の主題ではないが同一メニューから到達する。）
