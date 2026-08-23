# 実装乖離監査 — 0515_基本設計仕様書(API_デッキビルダー).html

- 正本: `excel_to_html/output/0515_基本設計仕様書(API_デッキビルダー).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **686要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 11 | ○ |
| 実装違い | 実装はあるが設計と違う | 43 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 0 | — |
| 設計どおり | 設計どおり実装されている | 416 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 215 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 1 | — |
| **合計** | | **686** | |

## 不具合 22件（P1 0 / P2 11 / P3 11）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 23件は重複として代表へ折り畳んだ（判定そのものは 45件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-1-R003 | A15-01 ログイン ／ API デッキビルダー — ログイン | 実装違い | IO | P2 | メールアドレスがメールアドレスの形式でないとき、またパスワードに半角の表示可能文字以外が含まれるときは、認証を試みずに入力不正（HTTP 400）として結果コードと結果メッセージを返す。 |
| sheet-1-R010 | A15-01 ログイン ／ API デッキビルダー — ログイン | 実装違い | IO | P2 | ログイン成功の応答で、発行したアクセストークンを有効期限付きのCookieとして呼び出し元に保持させる。あわせてセッションを開始する。 |
| sheet-10-R005 | A15-10 デッキ情報登更新 ／ API デッキビルダー — デッキ情報更新 | 実装違い | IO | P2 | 対象デッキの所有者と認証したプレイヤーが一致しないとき、認証拒否（HTTP 401）で応答し、応答本文のメッセージは「Authentication failed」になる。 |
| sheet-15-R007 | A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照 | 未実装 | ふるまい | P2 | アーキタイプを指定して問い合わせたとき、集計対象が指定したアーキタイプのデッキだけに絞られた結果が返る。 |
| sheet-15-R026 | A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照 | 未実装 | IO | P2 | カード別集計の各要素にカードの英語名が入っている。 |
| sheet-16-R007 | A15-16 直近大会情報取得 ／ API デッキビルダー — 直近大会情報取得 | 実装違い | IO | P2 | 大会日は保存されている日時の値をそのまま返し、応答を作る時点で時刻を落とすなどの丸めを行わない。 |
| sheet-17-R007 | A15-17 デッキ登録インポート ／ API デッキビルダー — デッキ登録インポート | 実装違い | IO | P2 | 解読できない行があっても登録は完了し、処理結果コードは206に切り替わり、該当行の行番号（0起点）が返る。 |
| sheet-18-R012 | A15-18 デッキ更新インポート ／ API デッキビルダー — デッキ更新インポート | 未実装 | ふるまい | P2 | 既存デッキへ更新インポートしたとき、更新前に登録されていたデッキカード・メイビー・アトラクション・ステッカーが取り除かれ、更新後にそのデッキを参照するとインポートしたカードリストの内容だけが採用カード |
| sheet-18-R050 | A15-18 デッキ更新インポート ／ API デッキビルダー — デッキ更新インポート | 未実装 | ふるまい | P2 | 更新インポートで保存が終わったとき、当該デッキの一時保存された下書きが無くなり、以後そのデッキを参照すると保存したインポート結果が返ること。 |
| sheet-5-R003 | A15-05 ユーザー情報変更 ／ API デッキビルダー — ユーザー情報変更 | 実装違い | IO | P2 | 認証トークンに該当するプレイヤーが無いときは認証拒否となり、HTTP 401 と「Access Token is incorrect」または「Authentication failed」のメッセージを |
| sheet-6-R007 | A15-06 マスタ検索 ／ API デッキビルダー — マスタ検索 | 未実装 | ふるまい | P2 | カテゴリとタグを指定したとき、サブテーブルの内容まで含んだマスタ行が返る。 |
| sheet-1-R006 | A15-01 ログイン ／ API デッキビルダー — ログイン | 実装違い | ふるまい | P3 | 必須・形式を満たし、本会員かつ未削除の会員が存在し、パスワードが一致した呼び出しには、アクセストークンを発行して認証成功として返す。 |
| sheet-1-R009 | A15-01 ログイン ／ API デッキビルダー — ログイン | 実装違い | IO | P3 | 発行して応答に含めるアクセストークンの内容に、発行者と発行時刻が入っている。 |
| sheet-11-R026 | A15-11 デッキ情報削除 ／ API デッキビルダー — デッキ情報削除 | 実装違い | IO | P3 | デッキの削除に成功したときの応答の処理結果メッセージは「Deck delete success」になる。 |
| sheet-13-R028 | A15-13 デッキ情報検索 ／ API デッキビルダー — デッキ情報検索 | 実装違い | IO | P3 | デッキ検索が成功したとき、応答の処理結果メッセージが「Deck search success」になる。 |
| sheet-14-R011 | A15-14 メタゲーム情報参照 ／ API デッキビルダー — メタゲーム情報参照 | 実装違い | IO | P3 | format_id を指定せずにメタゲーム情報を要求したとき、応答のメッセージが「invalid request parameter」であること。 |
| sheet-14-R012 | A15-14 メタゲーム情報参照 ／ API デッキビルダー — メタゲーム情報参照 | 実装違い | IO | P3 | format_id に一致するフォーマットが1件も無いとき、応答のメッセージが「format not found」であること。 |
| sheet-15-R003 | A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照 | 実装違い | IO | P3 | 公開かつ大会のデッキを集計対象とし、フォーマットに一致するものが無いときは該当なし（HTTP 404）で応答し、応答本文のメッセージは「format not found」になる。 |
| sheet-15-R013 | A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照 | 実装違い | IO | P3 | 平均採用枚数の降順で、件数を指定したときはその件数まで、指定が無いときは20件までを返す。 |
| sheet-6-R025 | A15-06 マスタ検索 ／ API デッキビルダー — マスタ検索 | 実装違い | IO | P3 | 特殊種別のマスタ行も、公開対象の項目（識別子・日本語名・英語名）だけで構成された要素として返る。 |
| sheet-7-R007 | A15-07 アーキタイプ検索 ／ API デッキビルダー — アーキタイプ検索 | 実装違い | IO | P3 | 指定したフォーマットがフォーマットマスタに無いとき、応答は処理結果コード 404 とメッセージ「The format does not exist」になる。 |
| sheet-9-R018 | A15-09 デッキ情報登録 ／ API デッキビルダー — デッキ情報登録 | 実装違い | IO | P3 | デッキ登録に成功したときの応答の処理結果メッセージは「Deck register success」になる。 |

### sheet-1-R003 A15-01 ログイン ／ API デッキビルダー — ログイン — 実装違い／IO／P2

- 正本: sheet-1（A15-01 ログイン ／ API デッキビルダー — ログイン） HTML行 306 付近
- 正本引用: 「メールアドレスとパスワードが必須・形式を満たすか	満たさないときは入力不正として返す」
- 設計期待値: メールアドレスがメールアドレスの形式でないとき、またパスワードに半角の表示可能文字以外が含まれるときは、認証を試みずに入力不正（HTTP 400）として結果コードと結果メッセージを返す。
- 画像確認: 本書0515は画像0枚（sheets.tsv の画像列=0、images/ 配下に sheet-*_img*.png は存在しない）。レイアウト図が無いためシート本文のみで判定した。
- 実装参照: `src/Eccube/Controller/App/DeckBuilder/LoginController.php:52-56`
- 実装実態: 判定しているのは「文字列であること」と「空文字でないこと」だけで、メールアドレスの形式もパスワードの文字種も検査していない。形式不正の入力はそのまま会員検索へ進み、会員が見つからない結果として HTTP 401「ID or password does not match」が返る。
- 同じ実装実態でまとまる要求: sheet-1-R018（A15-01 ログイン ／ API デッキビルダー — ログイン）
- 判定根拠: LoginController.php:54 の条件は is_string と空文字判定のみ。形式検証は他所にも無く、この経路は入力用のフォーム定義も通らない（LoginInput は src/Eccube/Service/App/DeckBuilder/ActionInput/LoginInput.php:20-24 で受け取った2値をそのまま保持するだけ）。現行 deck-api では src/Form/Type/LoginType.php で Assert\Email と Assert\Regex(/^[!-~]+$/) を課しており、形式不正は 400 で返っていた。
- 確信度: high

### sheet-1-R010 A15-01 ログイン ／ API デッキビルダー — ログイン — 実装違い／IO／P2

- 正本: sheet-1（A15-01 ログイン ／ API デッキビルダー — ログイン） HTML行 313 付近
- 正本引用: 「トークンは有効期限付きのCookieに設定し、セッションを開始する。」
- 設計期待値: ログイン成功の応答で、発行したアクセストークンを有効期限付きのCookieとして呼び出し元に保持させる。あわせてセッションを開始する。
- 画像確認: 本書0515は画像0枚（sheets.tsv の画像列=0、images/ 配下に sheet-*_img*.png は存在しない）。レイアウト図が無いためシート本文のみで判定した。
- 実装参照: `src/Eccube/Controller/App/DeckBuilder/LoginController.php:66-76`
- 実装実態: セッションの開始は行う（LoginController.php:66-69）が、トークンのCookieは一切設定しない。トークンは応答本文の値としてのみ返る。有効期限の設定値 eccube_deck_builder_jwt_expire_days（app/config/eccube/packages/eccube.yaml:275）はどこからも参照されていない。
- 同じ実装実態でまとまる要求: sheet-2-R005（A15-02 ログアウト ／ API デッキビルダー — ログアウト / 実装参照 `src/Eccube/Controller/App/DeckBuilder/LoginController.php:94-111; src/Eccube/Service/App/DeckBuilder/LogoutAction.php:37-54`）
- 判定根拠: デッキビルダーAPIの実装一式（src/Eccube/Controller/App/DeckBuilder/・src/Eccube/Service/App/DeckBuilder/・src/Eccube/Security/AccessToken/）にCookieを扱う記述は1つも無い。有効期限日数の設定値は eccube.yaml:275 に定義されるだけで参照が無く、期限付きCookieの仕組みごと入っていないことを裏づける。現行 deck-api の src/Controller/LoginController.php:61-63 は期限を付けてトークンのCookieを設定していた。sheet-2-R005（ログアウト時にCookieを空にする）と同一の欠落。
- 確信度: high

### sheet-10-R005 A15-10 デッキ情報登更新 ／ API デッキビルダー — デッキ情報更新 — 実装違い／IO／P2

- 正本: sheet-10（A15-10 デッキ情報登更新 ／ API デッキビルダー — デッキ情報更新） HTML行 559 付近
- 正本引用: 「3 対象デッキの所有者が認証したプレイヤーと一致しないとき 認証拒否（HTTP 401、「Authentication failed」）とする」
- 設計期待値: 対象デッキの所有者と認証したプレイヤーが一致しないとき、認証拒否（HTTP 401）で応答し、応答本文のメッセージは「Authentication failed」になる。
- 画像確認: 画像0枚（0515は全シートにレイアウト図が無い）。
- 実装参照: `src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:79-81; src/Eccube/Controller/App/DeckBuilder/DeckController.php:145-149; src/Eccube/Resource/locale/messages.ja.yaml:6374`
- 実装実態: 所有者が一致しないときの応答が認証拒否（HTTP 401）ではなく権限なし（HTTP 403）になる。src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:79-81 が所有者不一致を検出し、src/Eccube/Controller/App/DeckBuilder/DeckController.php:145-149 がそれを403と「アクセス権限がありません」（src/Eccube/Resource/locale/messages.ja.yaml:6374）で返す。同じデッキビルダーAPIの削除では同じ検出を401で返している（src/Eccube/Controller/App/DeckBuilder/DeckController.php:196-200）ため、更新だけ状態コードが違う。
- 同じ実装実態でまとまる要求: sheet-10-R016（A15-10 デッキ情報登更新 ／ API デッキビルダー — デッキ情報更新 / 実装参照 `src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:79-81; src/Eccube/Controller/App/DeckBuilder/DeckController.php:145-149`）、sheet-10-R021（A15-10 デッキ情報登更新 ／ API デッキビルダー — デッキ情報更新 / 実装参照 `src/Eccube/Controller/App/DeckBuilder/DeckController.php:140-161; src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:79-81`）
- 判定根拠: 所有者不一致を検出してはいるが、返す状態コードが401ではなく403で、メッセージも設計の文言でない。呼び出し側は認証やり直しが必要な場合と区別できない。
- 確信度: high

### sheet-15-R007 A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照 — 未実装／ふるまい／P2

- 正本: sheet-15（A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照） HTML行 725 付近
- 正本引用: 「アーキタイプ 指定したアーキタイプのデッキに限定する」
- 設計期待値: アーキタイプを指定して問い合わせたとき、集計対象が指定したアーキタイプのデッキだけに絞られた結果が返る。
- 画像確認: 画像0枚（0515は全シートにレイアウト図が無い）。
- 実装参照: `src/Eccube/Controller/App/DeckBuilder/DeckController.php:537-548; src/Eccube/Repository/DtbDeckRepository.php:1108-1156`
- 実装実態: usage_analysis が読む問い合わせ条件は src/Eccube/Controller/App/DeckBuilder/DeckController.php:537-546 の is_land / from / to だけで、アーキタイプ・区画（ボード）・件数の指定は一切読まない。集計本体 src/Eccube/Repository/DtbDeckRepository.php:1108-1156 の引数もフォーマット・土地区分・期間の4つで、アーキタイプ・区画・件数を受け取る口が無い。
- 同じ実装実態でまとまる要求: sheet-15-R008（A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照）、sheet-15-R019（A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照 / 実装参照 `src/Eccube/Controller/App/DeckBuilder/DeckController.php:522-548; src/Eccube/Repository/DtbDeckRepository.php:1108`）
- 判定根拠: アーキタイプでの絞り込みが実装に存在しない。src/Eccube/Controller/App/DeckBuilder/DeckController.php:537-546 は土地区分と期間しか読まず、src/Eccube/Repository/DtbDeckRepository.php:1108-1156 の集計にもアーキタイプの条件が無いため、アーキタイプを添えても結果は変わらない。
- 確信度: high

### sheet-15-R026 A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照 — 未実装／IO／P2

- 正本: sheet-15（A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照） HTML行 747 付近
- 正本引用: 「出力: カード別集計の項目 フィールド 型 説明 カード識別子 integer カード識別子。 カード名（日本語） string カードの日本語名。 カード名（英語） string カードの英語名。」
- 設計期待値: カード別集計の各要素にカードの英語名が入っている。
- 画像確認: 画像0枚（0515は全シートにレイアウト図が無い）。
- 実装参照: `src/Eccube/Repository/DtbDeckRepository.php:1136-1143; src/Eccube/Controller/App/DeckBuilder/DeckController.php:550-553`
- 実装実態: src/Eccube/Repository/DtbDeckRepository.php:1136-1143 の集計結果は カード識別子・カード日本語名・平均採用枚数 の3項目だけで、カード英語名・日本語版画像URL・英語版画像URL を返していない（src/Eccube/Controller/App/DeckBuilder/DeckController.php:550-553 はこの結果をそのまま応答に載せる）。
- 同じ実装実態でまとまる要求: sheet-15-R027（A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照）、sheet-15-R028（A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照）
- 判定根拠: カード英語名が集計結果の項目に無い。並び替えの条件（src/Eccube/Repository/DtbDeckRepository.php:1152）では英語名を使っているが、応答に載せる項目には含めていない。
- 確信度: high

### sheet-16-R007 A15-16 直近大会情報取得 ／ API デッキビルダー — 直近大会情報取得 — 実装違い／IO／P2

- 正本: sheet-16（A15-16 直近大会情報取得 ／ API デッキビルダー — 直近大会情報取得） HTML行 751 付近
- 正本引用: 「数量・日時は永続化済みの値を返し、応答生成時の丸め・補正を行わない。」
- 設計期待値: 大会日は保存されている日時の値をそのまま返し、応答を作る時点で時刻を落とすなどの丸めを行わない。
- 画像確認: 本書0515は画像0枚（sheets.tsv の画像列=0、images/ 配下に sheet-*_img*.png は存在しない）。レイアウト図が無いためシート本文のみで判定した。
- 実装参照: `src/Eccube/Controller/App/DeckBuilder/DeckController.php:652-659`
- 実装実態: 応答を組み立てる際に大会日を年月日の3要素だけの文字列へ整形しており（DeckController.php:654-656）、保存されている時刻とタイムゾーンが応答から落ちる。参加者数は保存値のまま返している。
- 同じ実装実態でまとまる要求: sheet-16-R018（A15-16 直近大会情報取得 ／ API デッキビルダー — 直近大会情報取得 / 実装参照 `src/Eccube/Controller/App/DeckBuilder/DeckController.php:652-659; src/Eccube/Repository/Master/MtbLatestEventDeckRepository.php:57`）
- 判定根拠: 対象の列は src/Eccube/Entity/Master/MtbLatestEventDeck.php:33-34 のとおりタイムゾーン付きの日時であり、保存値には時刻がある。DeckController.php:654-656 はそれを 'Y-m-d' で整形するため、応答生成時に時刻が切り捨てられる。抽出側（MtbLatestEventDeckRepository.php:56-63）は列の値をそのまま選んでいるので、丸めは応答生成の側で入っている。現行 deck-api の src/Controller/DeckController.php:354-361 と src/Repository/MtbLatestEventDeckRepository.php:20-38 は取得した日時をそのまま返しており、この整形は無かった。
- 確信度: high

### sheet-17-R007 A15-17 デッキ登録インポート ／ API デッキビルダー — デッキ登録インポート — 実装違い／IO／P2

- 正本: sheet-17（A15-17 デッキ登録インポート ／ API デッキビルダー — デッキ登録インポート） HTML行 775 付近
- 正本引用: 「カード名が一致せず解読できない行があるときは、登録は完了させたうえで処理結果コードを206に切り替え、該当行の行番号を返す。行番号は0から数える。」
- 設計期待値: 解読できない行があっても登録は完了し、処理結果コードは206に切り替わり、該当行の行番号（0起点）が返る。
- 画像確認: 画像0枚（0515は全シートにレイアウト図が無い）。
- 実装参照: `src/Eccube/Controller/App/DeckBuilder/DeckController.php:729-742; src/Eccube/Util/CardUtil.php:71-94; src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:160-164`
- 実装実態: 解読できない行があっても処理結果コードが206へ切り替わらない。src/Eccube/Controller/App/DeckBuilder/DeckController.php:729-742 は常に処理結果コード200・HTTP 200 で応答し、解読できなかった行番号の配列だけを追加で載せる。行番号自体は src/Eccube/Util/CardUtil.php:79 が0起点で集め、src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:160-164 経由で応答に届く。
- 同じ実装実態でまとまる要求: sheet-17-R018（A15-17 デッキ登録インポート ／ API デッキビルダー — デッキ登録インポート / 実装参照 `src/Eccube/Controller/App/DeckBuilder/DeckController.php:729-742`）、sheet-17-R021（A15-17 デッキ登録インポート ／ API デッキビルダー — デッキ登録インポート / 実装参照 `src/Eccube/Controller/App/DeckBuilder/DeckController.php:729-744; src/Eccube/Resource/locale/messages.ja.yaml:6378`）、sheet-18-R010（A15-18 デッキ更新インポート ／ API デッキビルダー — デッキ更新インポート / 実装参照 `src/Eccube/Controller/App/DeckBuilder/DeckController.php:729-733、src/Eccube/Controller/App/DeckBuilder/DeckController.php:740-744、src/Eccube/Util/CardUtil.php:71-94`）、sheet-18-R024（A15-18 デッキ更新インポート ／ API デッキビルダー — デッキ更新インポート / 実装参照 `src/Eccube/Controller/App/DeckBuilder/DeckController.php:729-733、src/Eccube/Controller/App/DeckBuilder/DeckController.php:740-744`）、sheet-18-R027（A15-18 デッキ更新インポート ／ API デッキビルダー — デッキ更新インポート / 実装参照 `src/Eccube/Controller/App/DeckBuilder/DeckController.php:729-744`）、sheet-18-R042（A15-18 デッキ更新インポート ／ API デッキビルダー — デッキ更新インポート / 実装参照 `src/Eccube/Controller/App/DeckBuilder/DeckController.php:729-733、src/Eccube/Controller/App/DeckBuilder/DeckController.php:740-744`）
- 判定根拠: 登録を完了させる点と行番号を0起点で返す点は設計どおり（src/Eccube/Util/CardUtil.php:71-94、src/Eccube/Controller/App/DeckBuilder/DeckController.php:740-742）。処理結果コードだけが206に切り替わらず200のままで、呼び出し側は設計どおりのコード判定では一部解読失敗を見分けられない。
- 確信度: high

### sheet-18-R012 A15-18 デッキ更新インポート ／ API デッキビルダー — デッキ更新インポート — 未実装／ふるまい／P2

- 正本: sheet-18（A15-18 デッキ更新インポート ／ API デッキビルダー — デッキ更新インポート） HTML行 811 付近
- 正本引用: 「既存デッキ配下のデッキカード・メイビー・アトラクション・ステッカーを初期化したうえで、解読したカードとデッキ名・公開区分・アーキタイプ識別子などで内容を組み立て直す。入力検証を通過したときに保存し、あわせて当該デッキの下書きを削除する。」
- 設計期待値: 既存デッキへ更新インポートしたとき、更新前に登録されていたデッキカード・メイビー・アトラクション・ステッカーが取り除かれ、更新後にそのデッキを参照するとインポートしたカードリストの内容だけが採用カードとして返ること。
- 画像確認: 画像0枚。本設計書にレイアウト図は添付されていない（sheets.tsv 画像=0）ため画像根拠は無い。
- 実装参照: `src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:104-146、src/Eccube/Service/EntityManager/DeckBuilderDeckEntityManager.php:90-150、src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:85-95`
- 実装実態: 更新インポートは既存の採用カードを取り除かずに、解読したカードを新しい行として足すだけなので、更新のたびに以前のカードが残り枚数が二重に積み上がる。同じ更新を行うデッキ情報更新側（instant_save）には初期化がある。
- 同じ実装実態でまとまる要求: sheet-18-R048（A15-18 デッキ更新インポート ／ API デッキビルダー — デッキ更新インポート / 実装参照 `src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:104-146、src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:89-92`）
- 判定根拠: [gate7/refute] 重要度を P2 へ。事実は反証できず維持。引用は sheets/sheet-18.txt:18 に逐語で実在、src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:104-146 に4種の削除が無く、同じ保存処理を持つ src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:88-92 では delete [gate7/refute] 重要度を P2 へ。事実（既存の採用カード4種の初期化が無い）は反証できず維持する。A15-18 は機能ランク C2 準コア（FUNCTION_RANK.tsv:386）で、PRIORITY_BUSINESS_CRITERIA.md のCSV一括登録の既定判定表が A15-18 デッキ更新インポートの代替を A15-09/A15-10 デッキ情報登録・更新と特定しており回避策あり。デッキ情報更新（instant_save）から保存し直せば4種は削除して組み直されるため重複行は業務側で訂正でき、受注・在庫・金額・外部連携へは伝播しない。AUDIT_JUDGING_RULES.md:80 もデッキ領域を P2 に置く。 src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:104-146 に既存のデッキカード・メイビー・アトラクション・ステッカーを取り除く処理が無く、src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:133-144 は src/Eccube/Service/EntityManager/DeckBuilderDeckEntityManager.php:90-150 の新規行作成をそのまま呼ぶ。同じ保存処理を持つデッキ情報更新（src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:89-92）では4種すべてを先に取り除いており、更新インポート側だけ初期化が欠けている。下書きの削除（src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:148-158 相当）も更新インポートには無い（sheet-18-R050 で別途指摘）。
- 確信度: high

### sheet-18-R050 A15-18 デッキ更新インポート ／ API デッキビルダー — デッキ更新インポート — 未実装／ふるまい／P2

- 正本: sheet-18（A15-18 デッキ更新インポート ／ API デッキビルダー — デッキ更新インポート） HTML行 854 付近
- 正本引用: 「削除 保存後の、当該デッキの下書き」
- 設計期待値: 更新インポートで保存が終わったとき、当該デッキの一時保存された下書きが無くなり、以後そのデッキを参照すると保存したインポート結果が返ること。
- 画像確認: 画像0枚。本設計書にレイアウト図は添付されていない（sheets.tsv 画像=0）ため画像根拠は無い。
- 実装参照: `src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:146-165、src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:148-158、src/Eccube/Controller/App/DeckBuilder/DeckController.php:222-238`
- 実装実態: 更新インポートは保存後に当該デッキの下書きを消さないため、下書きが残っていると以後のデッキ情報参照が古い下書きの内容を返し続ける。
- 判定根拠: src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:146-165 に下書きを消す処理が無い。同じ保存を行うデッキ情報更新は src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:148-158 で保存後に下書きを消している。デッキ情報参照は下書きを優先して返すため（src/Eccube/Controller/App/DeckBuilder/DeckController.php:222-238）、インポート結果が参照側に現れない。
- 確信度: high

### sheet-5-R003 A15-05 ユーザー情報変更 ／ API デッキビルダー — ユーザー情報変更 — 実装違い／IO／P2

- 正本: sheet-5（A15-05 ユーザー情報変更 ／ API デッキビルダー — ユーザー情報変更） HTML行 399 付近
- 正本引用: 「認証トークンの利用者識別子に対応する顧客からプレイヤーを特定し、そのプレイヤー自身の情報のみを更新する。他プレイヤーの情報は更新できない。トークンを検証できないとき、該当するプレイヤーが無いときは認証拒否（HTTP 401）とする。」
- 設計期待値: 認証トークンに該当するプレイヤーが無いときは認証拒否となり、HTTP 401 と「Access Token is incorrect」または「Authentication failed」のメッセージを返し、ユーザー情報は更新しない。
- 画像確認: 画像なし（本シートはレイアウト図0枚。文言はシート本文のみで確認）
- 実装参照: `src/Eccube/Controller/App/DeckBuilder/UserController.php:122;src/Eccube/Controller/App/DeckBuilder/UserController.php:126;src/Eccube/Resource/locale/messages.en.yaml:3953;src/Eccube/Resource/locale/messages.en.yaml:3968`
- 実装実態: プレイヤーが見つからないときは HTTP 400 と「Invalid request parameters」を返す（UserController.php:122-126 / messages.en.yaml:3953）。トークンの欠落・署名不正は 401「Access Token is incorrect」になる（UserController.php:86-91,117-121）が、プレイヤー未発見だけが 400 になり、「Authentication failed」（messages.en.yaml:3968）は本APIのどの経路でも返らない。
- 同じ実装実態でまとまる要求: sheet-3-R005（A15-03 ユーザー情報参照 ／ API デッキビルダー — ユーザー情報参照 / 実装参照 `src/Eccube/Service/App/DeckBuilder/GetUserAction.php:45-47; src/Eccube/Service/App/DeckBuilder/GetUserAction.php:76; src/Eccube/Controller/App/DeckBuilder/UserController.php:63-67`）、sheet-3-R012（A15-03 ユーザー情報参照 ／ API デッキビルダー — ユーザー情報参照 / 実装参照 `src/Eccube/Controller/App/DeckBuilder/UserController.php:58-68; src/Eccube/Service/App/DeckBuilder/GetUserAction.php:45-47`）、sheet-5-R030（A15-05 ユーザー情報変更 ／ API デッキビルダー — ユーザー情報変更）
- 判定根拠: [gate7/codex] sheet-3-R005 と同じ実装欠陥として畳む。sheet-3-R005へ畳む トークン検証失敗は 401 になるが（UserController.php:117-121）、トークンから引いたプレイヤーが見つからない経路は PlayerNotFoundException を 400 へ写している（UserController.php:122-126）。設計は両方を認証拒否 401 と定めている。プレイヤー特定と自分自身のみ更新する点はUpdateUserAction.php:87-101 のとおり設計どおり。
- 確信度: high

### sheet-6-R007 A15-06 マスタ検索 ／ API デッキビルダー — マスタ検索 — 未実装／ふるまい／P2

- 正本: sheet-6（A15-06 マスタ検索 ／ API デッキビルダー — マスタ検索） HTML行 435 付近
- 正本引用: 「カテゴリ・タグ サブテーブルを含めて取得する」
- 設計期待値: カテゴリとタグを指定したとき、サブテーブルの内容まで含んだマスタ行が返る。
- 画像確認: 画像0枚（0515は全シートにレイアウト図が無い）。
- 実装参照: `src/Eccube/Controller/App/DeckBuilder/MasterController.php:85-94; src/Eccube/Controller/App/DeckBuilder/MasterController.php:100-103; src/Eccube/Entity/Category.php:1; src/Eccube/Entity/Tag.php:1`
- 実装実態: src/Eccube/Controller/App/DeckBuilder/MasterController.php:85-94 はカテゴリを Eccube\Entity\DtbCategory、タグを Eccube\Entity\Master\MtbTag として引き当てようとするが、eeのカテゴリは src/Eccube/Entity/Category.php:1、タグは src/Eccube/Entity/Tag.php:1 でその名前のクラスは存在しないため、どちらも該当なし（HTTP 404）で返る。さらにサブテーブルを含めて取る呼び出し（src/Eccube/Controller/App/DeckBuilder/MasterController.php:100-101）が探すサブ取得処理はee内のどのリポジトリにも無く（該当0件）、仮に引き当てられても全件取得（src/Eccube/Controller/App/DeckBuilder/MasterController.php:103）へ落ちて子要素は付かない。
- 同じ実装実態でまとまる要求: sheet-6-R021（A15-06 マスタ検索 ／ API デッキビルダー — マスタ検索 / 実装参照 `src/Eccube/Controller/App/DeckBuilder/MasterController.php:85-94; src/Eccube/Entity/Category.php:1; src/Eccube/Entity/Tag.php:1`）、sheet-6-R027（A15-06 マスタ検索 ／ API デッキビルダー — マスタ検索 / 実装参照 `src/Eccube/Controller/App/DeckBuilder/MasterController.php:100-103; src/Eccube/Controller/App/DeckBuilder/MasterController.php:136-166`）
- 判定根拠: カテゴリ・タグはマスタ行そのものが返らない（該当なしになる）ため、サブテーブルを含めた取得も成立しない。ee全体を検索してもサブテーブル込みの取得処理は src/Eccube/Controller/App/DeckBuilder/MasterController.php:100-101 の呼び出し1か所だけで、実体が無い。
- 確信度: high

### sheet-1-R006 A15-01 ログイン ／ API デッキビルダー — ログイン — 実装違い／ふるまい／P3

- 正本: sheet-1（A15-01 ログイン ／ API デッキビルダー — ログイン） HTML行 309 付近
- 正本引用: 「上記を通過	アクセストークンを発行する」
- 設計期待値: 必須・形式を満たし、本会員かつ未削除の会員が存在し、パスワードが一致した呼び出しには、アクセストークンを発行して認証成功として返す。
- 画像確認: 本書0515は画像0枚（sheets.tsv の画像列=0、images/ 配下に sheet-*_img*.png は存在しない）。レイアウト図が無いためシート本文のみで判定した。
- 実装参照: `src/Eccube/Service/App/DeckBuilder/LoginAction.php:52-59; src/Eccube/Controller/App/DeckBuilder/LoginController.php:62-64`
- 実装実態: パスワード一致後にプレイヤーの存在という追加の条件が入り、プレイヤーが未登録の会員にはトークンを発行せず HTTP 401「Authentication failed」を返す。この応答はリニューアル後の表示メッセージ表（sheet-1 の3行）に無い。
- 判定根拠: [gate7/refute] 重要度を P3 へ。事実関係は確認できた。引用「4 上記を通過／アクセストークンを発行する」は逐語で在り、src/Eccube/Service/App/DeckBuilder/LoginAction.php:52-55 がパスワード一致後にプレイヤー検索を挟み、無ければ src/Eccube/Controller/App/DeckBuilder/LoginController.php:62-63 が 401 'Aut 設計の判定順序は1〜4の4段で、4段目「上記を通過」の結果はトークン発行である。LoginAction.php:52-55 はその後にプレイヤー検索を挟み、見つからないと LoginController.php:62-64 で 401 になる。現行 deck-api の src/Controller/LoginController.php:60-63 はプレイヤーを見ずにトークンを発行しており、この条件は現行にも無い。ただし後続APIがプレイヤーを必要とする（sheet-1-R013）ことから意図的な前倒し確認の可能性があり、要否は設計裁定が必要と考える。
- 確信度: low

### sheet-1-R009 A15-01 ログイン ／ API デッキビルダー — ログイン — 実装違い／IO／P3

- 正本: sheet-1（A15-01 ログイン ／ API デッキビルダー — ログイン） HTML行 312 付近
- 正本引用: 「会員IDを利用者IDとする署名付きのアクセストークンを発行する。内容は発行者・利用者ID（会員ID）・発行時刻とする。署名方式はHS256とする。」
- 設計期待値: 発行して応答に含めるアクセストークンの内容に、発行者と発行時刻が入っている。
- 画像確認: 本書0515は画像0枚（sheets.tsv の画像列=0、images/ 配下に sheet-*_img*.png は存在しない）。レイアウト図が無いためシート本文のみで判定した。
- 実装参照: `src/Eccube/Security/AccessToken/JwtTokenService.php:79-81`
- 実装実態: トークンに入るのは利用者ID（会員ID）1つだけで、発行者も発行時刻も入っていない。署名方式は HS256（JwtTokenService.php:86）で設計どおり。
- 判定根拠: JwtTokenService.php:79-81 が組み立てる内容は sub（会員ID）のみ。発行者・発行時刻を入れる箇所は同ファイル内に無い。現行 deck-api の src/Service/AuthService.php:23-27 は発行者・利用者ID・発行時刻の3つを入れており、設計はその内容を写している。トークンは応答に含まれて返る（LoginController.php:74）ため、内容の欠落は応答に出る差である。
- 確信度: med

### sheet-11-R026 A15-11 デッキ情報削除 ／ API デッキビルダー — デッキ情報削除 — 実装違い／IO／P3

- 正本: sheet-11（A15-11 デッキ情報削除 ／ API デッキビルダー — デッキ情報削除） HTML行 609 付近
- 正本引用: 「— APIレスポンス（JSON body・message） Deck delete success デッキの削除に成功したとき HTTP 200を返す」
- 設計期待値: デッキの削除に成功したときの応答の処理結果メッセージは「Deck delete success」になる。
- 画像確認: 画像なし（本シートはレイアウト図0枚。文言はシート本文のみで確認）
- 実装参照: `src/Eccube/Controller/App/DeckBuilder/DeckController.php:210;src/Eccube/Resource/locale/messages.en.yaml:3960`
- 実装実態: DeckController.php:210 が入れるのは api.deck_builder.deck.delete_success で、英語カタログの値は 'Deck deletion succeeded'（messages.en.yaml:3960）であり「Deck delete success」ではない。HTTP 200 とコード200は設計どおり（DeckController.php:208-211）。
- 判定根拠: 同じカタログでは 'Access Token is incorrect'・'Authentication failed' のように設計の文言と逐語一致している項目があり、削除成功の文言だけが食い違っている。ステータスとコードは一致するので文言のみの乖離。sheet-11-R030 と同一の実装欠陥。
- 確信度: high

### sheet-13-R028 A15-13 デッキ情報検索 ／ API デッキビルダー — デッキ情報検索 — 実装違い／IO／P3

- 正本: sheet-13（A15-13 デッキ情報検索 ／ API デッキビルダー — デッキ情報検索） HTML行 663 付近
- 正本引用: 「成功時出力 HTTP 200。処理結果コード 200、処理結果メッセージ「Deck search success」、総件数、1 ページ分のデッキ一覧」
- 設計期待値: デッキ検索が成功したとき、応答の処理結果メッセージが「Deck search success」になる。
- 画像確認: 画像0枚のシート（sheets.tsv）。レイアウト図は無く、本文の表のみで判定した。
- 実装参照: `src/Eccube/Controller/App/DeckBuilder/DeckController.php:515; src/Eccube/Resource/locale/messages.en.yaml:3963`
- 実装実態: 応答の message には文言ではなく識別子文字列「api.deck_builder.deck.search_success」がそのまま入る。messages.ja.yaml・messages.en.yaml のどちらにも当該キーの定義が無いため、どの言語設定でも「Deck search success」は返らない。デッキ種別が両方対象外のときの応答（同ファイル340行）も同じ。
- 判定根拠: HTTP 200・処理結果コード200・総件数・1ページ分の一覧は src/Eccube/Controller/App/DeckBuilder/DeckController.php:513-519 で一致する。文言だけが一致しない。messages.ja.yaml:6375 と messages.en.yaml:3963 には deck.get_success はあるが deck.search_success の行が無く、他に翻訳定義ファイルも無い（src/Eccube/Resource/locale 配下は messages.ja.yaml と messages.en.yaml の2本のみ）。未定義キーは識別子がそのまま応答へ出る。
- 確信度: high

### sheet-14-R011 A15-14 メタゲーム情報参照 ／ API デッキビルダー — メタゲーム情報参照 — 実装違い／IO／P3

- 正本: sheet-14（A15-14 メタゲーム情報参照 ／ API デッキビルダー — メタゲーム情報参照） HTML行 676 付近
- 正本引用: 「入力不正（HTTP 400）とし、「invalid request parameter」を返す」
- 設計期待値: format_id を指定せずにメタゲーム情報を要求したとき、応答のメッセージが「invalid request parameter」であること。
- 画像確認: 画像0枚。本設計書にレイアウト図は添付されていない（sheets.tsv 画像=0）ため画像根拠は無い。
- 実装参照: `src/Eccube/Controller/App/DeckBuilder/DeckController.php:571-576、src/Eccube/Resource/locale/messages.en.yaml:3969`
- 実装実態: HTTP 400 は返るが、メッセージは 'format_id is required'（英語カタログの値）で、設計の文言と一致しない。
- 判定根拠: src/Eccube/Controller/App/DeckBuilder/DeckController.php:571-576 で 400 を返す際に api.deck_builder.metagame.format_id_required を使い、その英語値は src/Eccube/Resource/locale/messages.en.yaml:3969 の 'format_id is required'。同シートの他の文言（sheet-18 の Access Token is incorrect 等）は英語カタログと逐語一致しており、設計の文言列は英語カタログを写したものと判断できるため、この2件だけが食い違っている。
- 確信度: med

### sheet-14-R012 A15-14 メタゲーム情報参照 ／ API デッキビルダー — メタゲーム情報参照 — 実装違い／IO／P3

- 正本: sheet-14（A15-14 メタゲーム情報参照 ／ API デッキビルダー — メタゲーム情報参照） HTML行 677 付近
- 正本引用: 「該当なし（HTTP 404）とし、「format not found」を返す」
- 設計期待値: format_id に一致するフォーマットが1件も無いとき、応答のメッセージが「format not found」であること。
- 画像確認: 画像0枚。本設計書にレイアウト図は添付されていない（sheets.tsv 画像=0）ため画像根拠は無い。
- 実装参照: `src/Eccube/Controller/App/DeckBuilder/DeckController.php:583-587、src/Eccube/Resource/locale/messages.en.yaml:3970`
- 実装実態: HTTP 404 は返るが、メッセージは 'The format does not exist' で、設計の文言と一致しない。
- 判定根拠: src/Eccube/Controller/App/DeckBuilder/DeckController.php:583-587 が api.deck_builder.metagame.format_not_found を返し、その英語値は src/Eccube/Resource/locale/messages.en.yaml:3970 の 'The format does not exist'。設計は「format not found」と定めている。
- 確信度: med

### sheet-15-R003 A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照 — 実装違い／IO／P3

- 正本: sheet-15（A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照） HTML行 721 付近
- 正本引用: 「指定したフォーマットの、公開・大会デッキを集計対象とする。フォーマットが指定されていない、または一致するフォーマットが無いときは該当なし（HTTP 404）とし、「format not found」を返す。」
- 設計期待値: 公開かつ大会のデッキを集計対象とし、フォーマットに一致するものが無いときは該当なし（HTTP 404）で応答し、応答本文のメッセージは「format not found」になる。
- 画像確認: 画像0枚（0515は全シートにレイアウト図が無い）。
- 実装参照: `src/Eccube/Controller/App/DeckBuilder/DeckController.php:529-535; src/Eccube/Resource/locale/messages.ja.yaml:6367`
- 実装実態: usage_analysis の該当なし応答は src/Eccube/Controller/App/DeckBuilder/DeckController.php:531-534 が共通の該当なし文言キーを渡しており、src/Eccube/Resource/locale/messages.ja.yaml:6367 でその文言は「見つかりません」。応答本文の message は「format not found」にならない。
- 同じ実装実態でまとまる要求: sheet-15-R017（A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照）、sheet-15-R021（A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照）
- 判定根拠: 集計対象の絞り込み（公開・大会デッキ）は src/Eccube/Repository/DtbDeckRepository.php:1147 が公開区分1・デッキ種別1で絞っており設計どおり。HTTP 404 も src/Eccube/Controller/App/DeckBuilder/DeckController.php:529-535 で返る。相違は応答本文のメッセージだけで、「format not found」ではなく共通の日本語文言（src/Eccube/Resource/locale/messages.ja.yaml:6367）が入る。
- 確信度: high

### sheet-15-R013 A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照 — 実装違い／IO／P3

- 正本: sheet-15（A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照） HTML行 731 付近
- 正本引用: 「平均採用枚数の降順に並べ、上位から最大で指定件数までを返す。件数が未指定のときは20件とする。」
- 設計期待値: 平均採用枚数の降順で、件数を指定したときはその件数まで、指定が無いときは20件までを返す。
- 画像確認: 画像0枚（0515は全シートにレイアウト図が無い）。
- 実装参照: `src/Eccube/Repository/DtbDeckRepository.php:1152-1153; src/Eccube/Controller/App/DeckBuilder/DeckController.php:537-548`
- 実装実態: 並び順は平均採用枚数の降順で設計どおりだが（src/Eccube/Repository/DtbDeckRepository.php:1152）、返す件数は常に100件上限に固定されており（src/Eccube/Repository/DtbDeckRepository.php:1153）、件数の指定を受け取る口が無い（src/Eccube/Controller/App/DeckBuilder/DeckController.php:537-546）。件数未指定時も20件ではなく最大100件返る。
- 判定根拠: 件数の指定は src/Eccube/Controller/App/DeckBuilder/DeckController.php:537-546 のどこでも読まれず、src/Eccube/Repository/DtbDeckRepository.php:1108 の引数にも無い。上限は src/Eccube/Repository/DtbDeckRepository.php:1153 の固定値100だけで、設計の既定20件と指定件数のどちらにも合わない。
- 確信度: high

### sheet-6-R025 A15-06 マスタ検索 ／ API デッキビルダー — マスタ検索 — 実装違い／IO／P3

- 正本: sheet-6（A15-06 マスタ検索 ／ API デッキビルダー — マスタ検索） HTML行 456 付近
- 正本引用: 「results array マスタ行の配列。要素は対象マスタの公開プロパティで構成するオブジェクト」
- 設計期待値: 特殊種別のマスタ行も、公開対象の項目（識別子・日本語名・英語名）だけで構成された要素として返る。
- 画像確認: 画像0枚（0515は全シートにレイアウト図が無い）。
- 実装参照: `src/Eccube/Controller/App/DeckBuilder/MasterController.php:54-75; src/Eccube/Controller/App/DeckBuilder/MasterController.php:106-107; src/Eccube/Controller/App/DeckBuilder/MasterController.php:136-166; src/Eccube/Entity/Master/MtbSpecialtype.php:39-108`
- 実装実態: 公開項目の一覧（src/Eccube/Controller/App/DeckBuilder/MasterController.php:54-75）に載っている特殊種別の見出しは SpecialType だが、実際に引き当てられるマスタ識別名は Specialtype（src/Eccube/Entity/Master/MtbSpecialtype.php:27）で綴りが一致しない。このため src/Eccube/Controller/App/DeckBuilder/MasterController.php:106 の絞り込みが空振りし、src/Eccube/Controller/App/DeckBuilder/MasterController.php:136-166 が公開対象でない並び順の項目まで含めて返す。一方 special_type と綴って呼ぶと Specialtype 側に当たらず該当なしになる。
- 判定根拠: 特殊種別マスタだけ公開項目の絞り込みが効かず、現行が公開していた3項目（識別子・日本語名・英語名）のほかに並び順の項目が応答に混ざる（src/Eccube/Entity/Master/MtbSpecialtype.php:108）。他のマスタは src/Eccube/Controller/App/DeckBuilder/MasterController.php:54-75 の見出しと引き当て名が一致していて絞り込みが効く。
- 確信度: med

### sheet-7-R007 A15-07 アーキタイプ検索 ／ API デッキビルダー — アーキタイプ検索 — 実装違い／IO／P3

- 正本: sheet-7（A15-07 アーキタイプ検索 ／ API デッキビルダー — アーキタイプ検索） HTML行 463 付近
- 正本引用: 「指定フォーマットが存在しない コード404・メッセージ「The format does not exist」を返す」
- 設計期待値: 指定したフォーマットがフォーマットマスタに無いとき、応答は処理結果コード 404 とメッセージ「The format does not exist」になる。
- 画像確認: 画像なし（本シートはレイアウト図0枚。文言はシート本文のみで確認）
- 実装参照: `src/Eccube/Controller/App/DeckBuilder/ArchetypeController.php:49;src/Eccube/Resource/locale/messages.en.yaml:3955;src/Eccube/Resource/locale/messages.en.yaml:3964`
- 実装実態: ArchetypeController.php:49 が返すのは api.deck_builder.common.not_found で、英語カタログの値は'Not Found'（messages.en.yaml:3955）。設計の「The format does not exist」に一致する文言は同カタログの api.deck_builder.deck.format_not_found（messages.en.yaml:3964）として存在するが、本APIからは参照されていない。コード 404 自体は設計どおり。
- 判定根拠: 同じ設計書の他機能（デッキ検索・メタゲーム）ではフォーマット不在に api.deck_builder.deck.format_not_found（'The format does not exist'）が使われており、アーキタイプ検索だけが汎用の 'Not Found' を返している。ステータスは一致するので文言のみの乖離。
- 確信度: high

### sheet-9-R018 A15-09 デッキ情報登録 ／ API デッキビルダー — デッキ情報登録 — 実装違い／IO／P3

- 正本: sheet-9（A15-09 デッキ情報登録 ／ API デッキビルダー — デッキ情報登録） HTML行 547 付近
- 正本引用: 「成功時出力 HTTP 200。処理結果コード 200、処理結果メッセージ「Deck register success」、発番したデッキID。公開範囲が限定公開のときは閲覧用トークンも返す」
- 設計期待値: デッキ登録に成功したときの応答の処理結果メッセージは「Deck register success」になる。
- 画像確認: 画像なし（本シートはレイアウト図0枚。文言はシート本文のみで確認）
- 実装参照: `src/Eccube/Controller/App/DeckBuilder/DeckController.php:106;src/Eccube/Resource/locale/messages.en.yaml:3958`
- 実装実態: DeckController.php:106 が入れるのは api.deck_builder.deck.register_success で、英語カタログの値は 'Deck registration succeeded'（messages.en.yaml:3958）であり「Deck register success」ではない。HTTP 200・コード200・発番したデッキID・限定公開時の閲覧用トークンは設計どおり（DeckController.php:104-119）。
- 判定根拠: 同じカタログでは 'Access Token is incorrect'・'Invalid request parameters'・'Update user information' のように設計の文言と逐語一致している項目が多く、登録成功の文言だけが設計と食い違っている。ステータスと他のフィールドは一致するので文言のみの乖離。
- 確信度: high

## 掲載しなかった判定

- 区分が「表示メッセージ」の指摘 9件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0515/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | A15-01 ログイン ／ API デッキビルダー — ログイン | 23 | 0 | 5 | 0 | 18 |
| sheet-2 | A15-02 ログアウト ／ API デッキビルダー — ログアウト | 17 | 1 | 0 | 0 | 16 |
| sheet-3 | A15-03 ユーザー情報参照 ／ API デッキビルダー — ユーザー情報参照 | 26 | 0 | 2 | 0 | 24 |
| sheet-4 | A15-04 他ユーザー情報参照 ／ API デッキビルダー — 他ユーザー情報参照 | 17 | 0 | 1 | 0 | 16 |
| sheet-5 | A15-05 ユーザー情報変更 ／ API デッキビルダー — ユーザー情報変更 | 38 | 0 | 3 | 0 | 35 |
| sheet-6 | A15-06 マスタ検索 ／ API デッキビルダー — マスタ検索 | 28 | 2 | 2 | 0 | 24 |
| sheet-7 | A15-07 アーキタイプ検索 ／ API デッキビルダー — アーキタイプ検索 | 36 | 0 | 1 | 0 | 35 |
| sheet-8 | A15-08 カード検索 ／ API デッキビルダー — カード検索 | 71 | 0 | 0 | 0 | 71 |
| sheet-9 | A15-09 デッキ情報登録 ／ API デッキビルダー — デッキ情報登録 | 36 | 0 | 1 | 0 | 35 |
| sheet-10 | A15-10 デッキ情報登更新 ／ API デッキビルダー — デッキ情報更新 | 27 | 0 | 3 | 0 | 24 |
| sheet-11 | A15-11 デッキ情報削除 ／ API デッキビルダー — デッキ情報削除 | 33 | 0 | 3 | 0 | 30 |
| sheet-12 | A15-12 デッキ情報参照 ／ API デッキビルダー — デッキ情報参照 | 42 | 0 | 0 | 0 | 42 |
| sheet-13 | A15-13 デッキ情報検索 ／ API デッキビルダー — デッキ情報検索 | 91 | 0 | 1 | 0 | 90 |
| sheet-14 | A15-14 メタゲーム情報参照 ／ API デッキビルダー — メタゲーム情報参照 | 63 | 0 | 4 | 0 | 59 |
| sheet-15 | A15-15 採用枚数情報参照 ／ API デッキビルダー — 採用枚数情報参照 | 30 | 5 | 6 | 0 | 19 |
| sheet-16 | A15-16 直近大会情報取得 ／ API デッキビルダー — 直近大会情報取得 | 25 | 0 | 2 | 0 | 23 |
| sheet-17 | A15-17 デッキ登録インポート ／ API デッキビルダー — デッキ登録インポート | 27 | 0 | 3 | 0 | 24 |
| sheet-18 | A15-18 デッキ更新インポート ／ API デッキビルダー — デッキ更新インポート | 56 | 3 | 6 | 0 | 47 |

