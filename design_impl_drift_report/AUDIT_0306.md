# 実装乖離監査 — 0306_基本設計仕様書(フロント_会員).html

- 正本: `excel_to_html/output/0306_基本設計仕様書(フロント_会員).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **1942要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 44 | ○ |
| 実装違い | 実装はあるが設計と違う | 134 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 18 | — |
| 設計どおり | 設計どおり実装されている | 1237 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 502 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 7 | — |
| **合計** | | **1942** | |

## 不具合 78件（P1 3 / P2 20 / P3 55）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 49件は重複として代表へ折り畳んだ（判定そのものは 127件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-13-R028 | 大会デッキ登録編集 | 未実装 | ふるまい | P1 | 書式に誤りがあるときは登録されず、編集画面のままメイン・サイドそれぞれのエラーメッセージが表示される |
| sheet-13-R031 | 大会デッキ登録編集 | 未実装 | ふるまい | P1 | 提出したデッキリストに含まれるカードが、そのデッキを構成するカードとして保存される |
| sheet-7-R080 | マイページ | 実装違い | IO | P1 | マイページのバーコードは、その会員の会員番号から組み立てた13桁のコードを表す。会員ごとに異なるコードが表示される |
| sheet-11-R091 | オンライン本人確認 | 実装違い | ふるまい | P2 | 撮影項目の検証に失敗したときは、エラーである旨を伴って撮影画面へ戻り、撮影をやり直せる |
| sheet-11-R106 | オンライン本人確認 | 実装違い | IO | P2 | 本人確認申請完了メールの返信先と Bcc が、買取専用メールアドレスとして設定した宛先になる |
| sheet-12-R013 | マイイベント・デッキ登録 | 実装違い | ふるまい | P2 | 開催日当日の23:59:59を過ぎるまでは処理状態を「イベント終了」にせず、当日中は申込状況をそのまま表示する。 |
| sheet-12-R014 | マイイベント・デッキ登録 | 実装違い | IO | P2 | 処理状態が「イベント終了」の場合、デッキ登録締切を過ぎている場合、デッキ登録を終了する指定がある場合、デッキ登録ありの指定が無い場合は、デッキ登録状況の欄もデッキ登録/編集の導線もどちらも画面に出さな |
| sheet-12-R046 | マイイベント・デッキ登録 | 実装違い | ふるまい | P2 | 申込状況が決済中の行は、イベントが終了済みであっても処理状態に「決済中」を表示する。 |
| sheet-13-R008 | 大会デッキ登録編集 | 実装違い | IO | P2 | 編集画面から「MTGアリーナからデッキリストをインポートする方法」の解説は表示されない |
| sheet-13-R020 | 大会デッキ登録編集 | 未実装 | ふるまい | P2 | カード名を入力すると、その文字列に部分一致するカード名が候補として表示される |
| sheet-15-R094 | 会員情報変更 | 未実装 | ふるまい | P2 | 国が日本なのに都道府県が「日本国外」、または国が日本以外なのに都道府県が国内の組み合わせで変更するを押下すると、更新されず、国の項目にエラーが表示された編集フォームが再表示される。 |
| sheet-15-R097 | 会員情報変更 | 実装違い | ふるまい | P2 | 会員情報の変更を確定すると、選手情報の連絡先アドレス・英字氏名に加えて和文氏名も、会員が入力した氏名と揃った内容へ更新される。 |
| sheet-15-R103 | 会員情報変更 | 実装違い | ふるまい | P2 | スマレジ側の会員情報更新が成功したときだけ会員情報の変更が確定し、失敗したときは変更が保存されず編集フォームが再表示される。変更が確定した後には支店側にもその会員の更新が伝わる。 |
| sheet-17-R054 | 退会 | 未実装 | ふるまい | P2 | 退会を確定したとき、その会員に紐づく選手情報も併せて削除され、退会後は残らない。 |
| sheet-22-R041 | 店頭PC用アカウント制御 | 実装違い | IO | P2 | 店頭PCアカウントでログイン済みのとき、ご注文方法指定画面で非表示になるのは「ご注文主」と「お届け先」だけで、注文する商品の一覧と小計はそのまま表示される |
| sheet-22-R082 | 店頭PC用アカウント制御 | 未実装 | ふるまい | P2 | お気に入り商品のセール通知メールは、店頭PCアカウント（店内アカウント・支店店内アカウント）の会員には送らない |
| sheet-3-R146 | 新規会員登録 | 未実装 | ふるまい | P2 | 国と都道府県の組み合わせが整合しない送信は、国欄にエラーを出して登録を行わない。 |
| sheet-3-R152 | 新規会員登録 | 未実装 | IO | P2 | 会員登録の実行時に作られる住所には既定の住所名が付き、既定のお届け先として扱われる。 |
| sheet-4-R022 | 本会員登録 | 実装違い | ふるまい | P2 | 会員のステータスが「本会員」として確定するのはスマレジへの会員登録が成功したときだけで、連携に失敗したときは本会員化されないまま残る |
| sheet-8-R029 | 入荷待ち商品一覧 | 実装違い | ふるまい | P2 | 同名商品のリンクを押すと、そのカードと同じカードで絞り込まれた商品一覧が表示されること。 |
| sheet-8-R036 | 入荷待ち商品一覧 | 実装違い | ふるまい | P2 | 画面を開いた直後や再読み込み直後は解除ボタンだけが並び、入荷通知ボタンは解除操作をした行にだけ現れること。 |
| sheet-9-R045 | お気に入り商品一覧 | 実装違い | IO | P2 | 高額商品コードが付いた商品は、在庫があるものだけを一覧に出す。在庫が無いものは一覧に出さない。 |
| sheet-9-R047 | お気に入り商品一覧 | 実装違い | IO | P2 | 状態ごとの明細に出すのは、ニアミントの明細と、販売価格が状態表示の下限価格以上の明細だけにする。高額商品コードを持つ明細は状態に続けて高額商品コードも並べて出す。 |
| sheet-10-R007 | ポイント履歴 | 実装違い | ふるまい | P3 | ポイント履歴の一覧は、ポイント履歴IDの降順（後から登録された履歴ほど上）に並ぶこと。 |
| sheet-10-R022 | ポイント履歴 | 実装違い | IO | P3 | 日本語ページの一覧上部に、全件数のうち現在表示している範囲（何件目から何件目か）が表示されること。 |
| sheet-10-R024 | ポイント履歴 | 実装違い | IO | P3 | ページ送りに「最初」の導線が並び、押すと1ページ目の一覧が表示されること。 |
| sheet-10-R028 | ポイント履歴 | 実装違い | IO | P3 | ページ番号の並びには、現在のページを中心に前後それぞれ最大4つまでのページ番号が並ぶこと。 |
| sheet-10-R043 | ポイント履歴 | 未実装 | IO | P3 | 英語ページの内容欄には、その履歴の内容が英語で表示されること。 |
| sheet-10-R053 | ポイント履歴 | 実装違い | ふるまい | P3 | 1ページの表示件数の指定が0や数値として読めない値だったときは、既定の10件表示に戻ること。 |
| sheet-10-R057 | ポイント履歴 | 実装違い | ふるまい | P3 | 一覧の注文番号を押したとき、購入履歴詳細が新しいタブで開き、ポイント履歴の一覧はそのまま残ること。 |
| sheet-11-R011 | オンライン本人確認 | 実装違い | IO | P3 | 本人確認状況には「未確認」「現在、確認中です」「オンラインで本人確認済み」「簡易書留で本人確認済み」のいずれかが表示される |
| sheet-12-R027 | マイイベント・デッキ登録 | 実装違い | IO | P3 | 申込が無くデッキだけを登録しているイベントの処理状態は「未登録」と表示する。 |
| sheet-12-R030 | マイイベント・デッキ登録 | 実装違い | IO | P3 | 決済中のヘルプに触れたとき「決済が中断されました」で始まる案内を出す。 |
| sheet-13-R022 | 大会デッキ登録編集 | 実装違い | ふるまい | P3 | 選択中のボード側の入力欄(メインボードまたはサイドボード)が強調表示される |
| sheet-13-R068 | 大会デッキ登録編集 | 未実装 | IO | P3 | 入力形式に関する注意事項に、該当セットのカードが別セットのカードへ変換される旨の案内が表示される |
| sheet-13-R090 | 大会デッキ登録編集 | 未実装 | IO | P3 | マイデッキ取得のモーダルに、該当するデッキの総件数が表示される |
| sheet-13-R109 | 大会デッキ登録編集 | 実装違い | ふるまい | P3 | 取り込んだマイデッキのフォーマットがその大会で選べるものなら、選択中のフォーマットがそのデッキのフォーマットへ変わる |
| sheet-13-R111 | 大会デッキ登録編集 | 実装違い | IO | P3 | 統率領域に置かれたカードがメインボードの先頭に足された状態で取り込まれる |
| sheet-13-R118 | 大会デッキ登録編集 | 実装違い | ふるまい | P3 | カード名が二重山括弧で囲まれていても、分割カードの区切りがどの書き方でも、同じカードとして扱われる |
| sheet-13-R127 | 大会デッキ登録編集 | 実装違い | ふるまい | P3 | フォーマットの指定が無い提出でも、その大会で選べるフォーマットの先頭を選んだものとして登録できる |
| sheet-13-R131 | 大会デッキ登録編集 | 実装違い | IO | P3 | 英字の姓名が無い会員のデッキには、住所地が海外なら会員の氏名、そうでなければ会員の氏名カナがプレイヤー名として登録される |
| sheet-13-R137 | 大会デッキ登録編集 | 実装違い | ふるまい | P3 | キャンセルすると入力内容は登録されず、参加した大会の一覧画面へ戻る |
| sheet-14-R022 | 大会デッキ登録確認～完了 | 実装違い | IO | P3 | 大会名の後ろの括弧内に、その大会に設定されたフォーマットが表示される。 |
| sheet-14-R034 | 大会デッキ登録確認～完了 | 実装違い | ふるまい | P3 | 「大会一覧に戻る」を押すと、イベント・大会のトップページが表示される。 |
| sheet-14-R055 | 大会デッキ登録確認～完了 | 実装違い | IO | P3 | カード画像が登録されていないカードでも、代替の画像が枚数とともに表示される。 |
| sheet-15-R040 | 会員情報変更 | 実装違い | IO | P3 | お名前(姓)は16文字までしか受け付けず、17文字以上を入力して変更するを押下するとエラーになる。 |
| sheet-15-R042 | 会員情報変更 | 実装違い | IO | P3 | フリガナ(姓)は25文字までしか受け付けず、26文字以上を入力して変更するを押下するとエラーになる。 |
| sheet-15-R075 | 会員情報変更 | 実装違い | ふるまい | P3 | 会員情報変更(入力)画面の戻るボタンを押すと、本店ECTOP画面が表示される。 |
| sheet-16-R025 | 配送先新規登録・変更 | 実装違い | IO | P3 | 配送先一覧画面の最下部ボタンのラベルを「マイページ」と表示する。 |
| sheet-16-R061 | 配送先新規登録・変更 | 実装違い | IO | P3 | 配送先氏名(名)は16文字を超える入力を受け付けない。 |
| sheet-16-R075 | 配送先新規登録・変更 | 実装違い | IO | P3 | 入力・変更画面の送信ボタンのラベルを「確認画面へ」と表示する。 |
| sheet-16-R126 | 配送先新規登録・変更 | 実装違い | IO | P3 | 海外言語ページでは、配送先の入力画面にも確認画面にも配送先氏名フリガナの欄・行を出さない。 |
| sheet-16-R128 | 配送先新規登録・変更 | 実装違い | ふるまい | P3 | 新規登録で配送先数が上限に達しているときは、配送先一覧へ戻したうえで一覧上部にエラーを表示する。入力画面・確認画面のどちらから来ても同じ扱いにする。 |
| sheet-16-R130 | 配送先新規登録・変更 | 未実装 | ふるまい | P3 | 国が日本で都道府県が「日本国外」のとき、または国が日本以外で都道府県が国内の都道府県のときは、国の項目にエラーを付けて登録させない。 |
| sheet-16-R143 | 配送先新規登録・変更 | 実装違い | IO | P3 | 削除で対象の配送先が無いとき、およびログイン会員に紐づかない配送先を指定したときは、HTTP404を返す。 |
| sheet-16-R149 | 配送先新規登録・変更 | 実装違い | IO | P3 | 配送先の削除は、記録を残したまま削除済みの状態へ変える。 |
| sheet-17-R061 | 退会 | 未実装 | ふるまい | P3 | 退会完了メールを送ったとき、その件名と本文が当該会員のメール送信履歴として残り、後から会員ごとに参照できる。 |
| sheet-18-R037 | お問い合わせ | 未実装 | IO | P3 | 件名（タイトル）の選択肢に「協賛関連」が表示され、選択して問い合わせを送信できる |
| sheet-18-R041 | お問い合わせ | 実装違い | IO | P3 | 氏名(名)は16文字を超える入力を受け付けず、超えたときは確認画面へ進めない |
| sheet-18-R068 | お問い合わせ | 実装違い | IO | P3 | イベント実施店舗の選択肢に、店舗登録された全店舗が表示される |
| sheet-19-R021 | お問い合わせ履歴 | 実装違い | IO | P3 | お問い合わせ履歴が1件も無いときも、一覧画面の件数欄に「0件」が表示される。 |
| sheet-19-R023 | お問い合わせ履歴 | 実装違い | IO | P3 | 日本語表示のお問い合わせ履歴一覧では、送信日時が「2025年09月26日 13:10」のように年月日を漢字で区切った書式で表示される。 |
| sheet-23-R021 | 【新規】パスワード設定（ポリシー違反用） | 実装違い | ふるまい | P3 | パスワード変更完了画面のボタンは「TOPへ戻る」で、押下するとサイトのTOP画面が表示される。 |
| sheet-3-R034 | 新規会員登録 | 実装違い | IO | P3 | フリガナ(姓)は25文字を超える入力を受け付けず、超過時は文字数超過として登録できない。 |
| sheet-4-R013 | 本会員登録 | 未実装 | ふるまい | P3 | 秘密鍵で見つかった仮会員が既にスマレジ会員IDを持っている場合は、会員登録済みとして本会員化を行わずエラー画面を出す |
| sheet-4-R017 | 本会員登録 | 実装違い | IO | P3 | 秘密鍵の書式は正しいがその秘密鍵を持つユーザーが見つからないときは、ユーザー存在チェックエラー画面（完了済みです。／既に会員登録が完了されております。）を表示する |
| sheet-4-R053 | 本会員登録 | 未実装 | ふるまい | P3 | 本会員登録が完了したとき、直前の商品検索の戻り先が残っていれば本登録完了画面を出さずにその画面へ移し、移した後は戻り先が残らない |
| sheet-5-R050 | ログイン | 実装違い | ふるまい | P3 | ログイン状態の保持を有効にしたとき、その状態は既定で1年間続く |
| sheet-5-R052 | ログイン | 実装違い | ふるまい | P3 | ログアウトしたときは直前に見ていた画面へ戻り、直前の画面が分からないときだけトップへ戻る |
| sheet-6-R050 | パスワード再発行 | 実装違い | IO | P3 | リセットキーの書式が不正なURLでアクセスしたとき、「アクセスできません。」「お探しのページはアクセスができない状況にあるか、移動もしくは削除された可能性があります。」を本文とし「トップページへ」ボタ |
| sheet-6-R077 | パスワード再発行 | 実装違い | IO | P3 | パスワード再設定完了画面のボタンは「戻る」と表示され、押下するとECTOPへ遷移する |
| sheet-6-R104 | パスワード再発行 | 未実装 | ふるまい | P3 | 新しいパスワード（確認）欄では貼り付け操作が受け付けられず、警告が表示されて貼り付けた内容が取り消される |
| sheet-6-R105 | パスワード再発行 | 実装違い | IO | P3 | 会員の保存パスワードがメールアドレスと同一のときに限り、新しいパスワード欄の下に、メールアドレスとは異なる文字列を使うよう促す注意が表示される |
| sheet-7-R076 | マイページ | 未実装 | ふるまい | P3 | 未ログインのまま入荷お知らせを申し込んだ会員がログイン後にマイページを開くと、マイページを表示せず、申し込んだ画面へ戻される |
| sheet-8-R022 | 入荷待ち商品一覧 | 実装違い | ふるまい | P3 | 一覧の商品画像を押すと、その商品の商品詳細画面が開くこと。 |
| sheet-8-R068 | 入荷待ち商品一覧 | 実装違い | ふるまい | P3 | 商品名を押したとき、入荷通知を登録した言語が選ばれた状態の商品詳細が開くこと。 |
| sheet-9-R021 | お気に入り商品一覧 | 実装違い | ふるまい | P3 | 一覧の商品画像を押すと、その商品の商品詳細画面へ移動する。 |
| sheet-9-R053 | お気に入り商品一覧 | 実装違い | ふるまい | P3 | 価格の高い順・低い順のどちらでも、同一商品の状態ごとの販売価格のうち最も高い価格を並べ替えの基準にする。 |

### sheet-13-R028 大会デッキ登録編集 — 未実装／ふるまい／P1

- 正本: sheet-13（大会デッキ登録編集） HTML行 3149 付近
- 正本引用: 「メインボード・サイドボードそれぞれに対し入力形式チェックを行い、エラーがある場合は画面遷移せずエラーメッセージを表示する」
- 設計期待値: 書式に誤りがあるときは登録されず、編集画面のままメイン・サイドそれぞれのエラーメッセージが表示される
- 画像確認: sheet-13_img1.png(SP)/img3.png(PC) の編集画面を確認
- 実装参照: `src/Eccube/Controller/Front/Mypage/DeckEntryController.php:137-153; src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:282; src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:287`
- 実装実態: 提出時に書式を一切確かめず、誤りがあってもそのまま保存して次の画面へ進む。編集画面のエラー文言は常に隠されたまま表示されない
- 同じ実装実態でまとまる要求: sheet-13-R120（大会デッキ登録編集 / 実装参照 `src/Eccube/Controller/Front/Mypage/DeckEntryController.php:137-153`）、sheet-13-R126（大会デッキ登録編集 / 実装参照 `src/Eccube/Controller/Front/Mypage/DeckEntryController.php:137-153`）、sheet-13-R142（大会デッキ登録編集 / 実装参照 `src/Eccube/Controller/Front/Mypage/DeckEntryController.php:104-153`）
- 判定根拠: src/Eccube/Controller/Front/Mypage/DeckEntryController.php:137-153 は入力テキストをそのまま登録処理へ渡すだけで書式判定が無く、src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:282 / src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:287 のエラー文言は hidden 固定で表示条件が無い
- 確信度: high

### sheet-13-R031 大会デッキ登録編集 — 未実装／ふるまい／P1

- 正本: sheet-13（大会デッキ登録編集） HTML行 3152 付近
- 正本引用: 「デッキを構築するカード情報を保存する」
- 設計期待値: 提出したデッキリストに含まれるカードが、そのデッキを構成するカードとして保存される
- 実装参照: `src/Eccube/Service/Front/Mypage/DeckEntryAction.php:37-83; src/Eccube/Service/Deck/CardListParserService.php:95-120`
- 実装実態: デッキ本体と入力テキストだけを保存し、デッキを構成するカードは1件も保存しない
- 同じ実装実態でまとまる要求: sheet-13-R145（大会デッキ登録編集 / 実装参照 `src/Eccube/Service/Front/Mypage/DeckEntryAction.php:41-51`）、sheet-13-R133（大会デッキ登録編集 / 実装参照 `src/Eccube/Service/Front/Mypage/DeckEntryAction.php:37-83`）、sheet-14-R063（大会デッキ登録確認～完了 / 実装参照 `src/Eccube/Service/Front/Mypage/DeckEntryAction.php:47-51;src/Eccube/Service/Admin/Deck/DeckStoreAction.php:133-135`）
- 判定根拠: src/Eccube/Service/Front/Mypage/DeckEntryAction.php:37-83 の登録処理はデッキ1件を保存して終わり、カードを保存する処理(src/Eccube/Service/Deck/CardListParserService.php:95-120)を呼んでいない
- 確信度: high

### sheet-7-R080 マイページ — 実装違い／IO／P1

- 正本: sheet-7（マイページ） HTML行 2172 付近
- 正本引用: 「バーコードは、その会員番号に固定の接頭番号を付けて桁数分をゼロ埋めし、末尾にチェックディジットを加えた13桁のコードを、EAN-13形式で表示する。」
- 設計期待値: マイページのバーコードは、その会員の会員番号から組み立てた13桁のコードを表す。会員ごとに異なるコードが表示される
- 画像確認: sheet-7_img9（現行）は会員番号7321808に対応するバーコードを表示。実装は会員に依らない固定コード
- 実装参照: `src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:22; src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:23; src/Eccube/Entity/Customer.php:1096`
- 実装実態: src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:23 が固定値2900065596792を描画しており、会員の会員番号からコードを組み立てる呼び出し（同:22）はコメントアウトされている。組み立て自体は src/Eccube/Entity/Customer.php:1096 に実装済みだが画面から呼ばれていない
- 判定根拠: 全会員に同一の固定バーコードが表示される。会員番号のラベル表示（src/Eccube/Resource/template/default/Mypage/index.twig:71）は会員ごとの値だが、読み取り対象のバーコードは会員を識別しないため、店頭での読み取りが別人の会員に結び付く
- 確信度: high

### sheet-11-R091 オンライン本人確認 — 実装違い／ふるまい／P2

- 正本: sheet-11（オンライン本人確認） HTML行 2837 付近
- 正本引用: 「4 撮影項目の検証に失敗したとき エラー状態を付けて撮影画面へ戻す」
- 設計期待値: 撮影項目の検証に失敗したときは、エラーである旨を伴って撮影画面へ戻り、撮影をやり直せる
- 実装参照: `src/Eccube/Controller/Front/Mypage/IdentificationController.php:155-160; src/Eccube/Resource/template/default/Block/js/identification_js.twig:130-134`
- 実装実態: 検証に失敗すると撮影画面のアドレスへ送り返すが、撮影画面はフォーム送信でしか開けないため許可されない要求として扱われ、撮影画面には戻らない。戻り先で出すはずのエラー表示（identification_js.twig:130-134）にも到達しない。
- 判定根拠: src/Eccube/Controller/Front/Mypage/IdentificationController.php:156-159 の戻し先 mypage_identification_photograph は src/Eccube/Controller/Front/Mypage/IdentificationController.php:72 のとおりフォーム送信でしか開けない。加えて戻り先はエラー状態も身分証種別も送信内容から読む（src/Eccube/Controller/Front/Mypage/IdentificationController.php:82-90）ため、この戻し方では受け取れない。
- 確信度: med

### sheet-11-R106 オンライン本人確認 — 実装違い／IO／P2

- 正本: sheet-11（オンライン本人確認） HTML行 2853 付近
- 正本引用: 「返信先と Bcc には、買取専用メールアドレスに設定した宛先を用いる。」
- 設計期待値: 本人確認申請完了メールの返信先と Bcc が、買取専用メールアドレスとして設定した宛先になる
- 実装参照: `src/Eccube/Service/MailService.php:1133-1140`
- 実装実態: 本人確認申請完了メールの Bcc は店舗の代表メールアドレス、返信先は返信先用アドレスで、買取専用メールアドレスとして設定した宛先は使われない。
- 判定根拠: src/Eccube/Service/MailService.php:1137-1138 が bcc に代表アドレス・返信先に返信先用アドレスを設定している。買取専用メールアドレスの設定値は src/Eccube/Service/MailService.php:1554-1577 のネット買取受付完了メールでは Bcc・返信先の両方に使われており、本メールだけ扱いが違う。
- 確信度: med

### sheet-12-R013 マイイベント・デッキ登録 — 実装違い／ふるまい／P2

- 正本: sheet-12（マイイベント・デッキ登録） HTML行 2973 付近
- 正本引用: 「・開催日の23:59:59を過ぎたイベントは処理状態に「イベント終了」と表示する」
- 設計期待値: 開催日当日の23:59:59を過ぎるまでは処理状態を「イベント終了」にせず、当日中は申込状況をそのまま表示する。
- 画像確認: img1 では開催日時 2025/6/16 15:17 の行が「申込済み」、2025/1/1 15:17 の行が「決済中」と、開始時刻を過ぎていても終了扱いにしていない。
- 実装参照: `src/Eccube/Entity/DtbEventDetail.php:554-557;src/Eccube/Resource/template/default/Mypage/event_history.twig:115-116`
- 実装実態: src/Eccube/Entity/DtbEventDetail.php:554-557 の終了判定は開催日時そのものと現在時刻を比べており、開催日当日でも開始時刻を過ぎた時点で終了とみなす。src/Eccube/Resource/template/default/Mypage/event_history.twig:115 がこの判定で「イベント終了」を表示するため、開催日当日の開始時刻直後から「イベント終了」になる。
- 判定根拠: 設計は終了とみなす境目を開催日の23:59:59と定めているが、実装の境目は開催日時（開始時刻）である。開催日当日の開始時刻から23:59:59までの間、表示が食い違う。
- 確信度: high

### sheet-12-R014 マイイベント・デッキ登録 — 実装違い／IO／P2

- 正本: sheet-12（マイイベント・デッキ登録） HTML行 2974 付近
- 正本引用: 「★(6)デッキステータス、(7)デッキ登録/編集は、以下のいずれかに該当する場合は表示しない」
- 設計期待値: 処理状態が「イベント終了」の場合、デッキ登録締切を過ぎている場合、デッキ登録を終了する指定がある場合、デッキ登録ありの指定が無い場合は、デッキ登録状況の欄もデッキ登録/編集の導線もどちらも画面に出さない。
- 画像確認: img1 の最終行（処理状態「イベント終了」）はデッキ登録の欄が空欄で、ボタンも無い。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/event_history.twig:139-147`
- 実装実態: src/Eccube/Resource/template/default/Mypage/event_history.twig:141 のデッキ登録状況は条件に関わらず常に「登録済み」または「未登録」を表示する。非表示になるのは src/Eccube/Resource/template/default/Mypage/event_history.twig:145-147 のデッキ登録/編集ボタンだけで、4条件のいずれに該当してもデッキ登録状況の欄は残る。
- 判定根拠: 設計は(6)デッキステータスと(7)デッキ登録/編集の両方を非表示にすると定めているが、実装で非表示になるのは(7)だけである。
- 確信度: high

### sheet-12-R046 マイイベント・デッキ登録 — 実装違い／ふるまい／P2

- 正本: sheet-12（マイイベント・デッキ登録） HTML行 3011 付近
- 正本引用: 「申込状態が決済中のときは、イベントが終了していても「イベント終了」ではなく「決済中」を表示する。決済中の判定が終了済みの判定に優先する。」
- 設計期待値: 申込状況が決済中の行は、イベントが終了済みであっても処理状態に「決済中」を表示する。
- 画像確認: img1 では開催日時が過去の行（2025/1/1 15:17）でも処理状態が「決済中」と描かれている。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/event_history.twig:115-137`
- 実装実態: src/Eccube/Resource/template/default/Mypage/event_history.twig:115 が終了済みかどうかを先に見て「イベント終了」を確定させるため、申込状況が決済中でもイベントが終了していれば「イベント終了」が表示され、src/Eccube/Resource/template/default/Mypage/event_history.twig:119 の決済中の分岐には到達しない。
- 判定根拠: 設計は決済中の判定を終了済みの判定より優先すると定めているが、実装の判定順は逆である。
- 確信度: high

### sheet-13-R008 大会デッキ登録編集 — 実装違い／IO／P2

- 正本: sheet-13（大会デッキ登録編集） HTML行 3129 付近
- 正本引用: 「・「MTGアリーナからデッキリストをインポートする方法」を削除」
- 設計期待値: 編集画面から「MTGアリーナからデッキリストをインポートする方法」の解説は表示されない
- 画像確認: sheet-13_img1.png(SP)/img3.png(PC) の編集画面を確認。レイアウト図ではキャンセルボタンの下はフッタで、当該解説は描かれていない
- 実装参照: `src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:320-322; src/Eccube/Resource/template/default/Block/deck_entry_how_to_import.twig:11-13`
- 実装実態: 編集画面の下部に『MTGアリーナからデッキリストをインポートする方法』の見出しと手順解説(図解)が現行のまま表示される
- 判定根拠: src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:320-322 が src/Eccube/Resource/template/default/Block/deck_entry_how_to_import.twig を読み込み、src/Eccube/Resource/template/default/Block/deck_entry_how_to_import.twig:11-13 に同名の見出しと手順が残っている
- 確信度: high

### sheet-13-R020 大会デッキ登録編集 — 未実装／ふるまい／P2

- 正本: sheet-13（大会デッキ登録編集） HTML行 3141 付近
- 正本引用: 「・カード名(13)を入力すると、カード名が部分一致するカードがサジェスト表示される」
- 設計期待値: カード名を入力すると、その文字列に部分一致するカード名が候補として表示される
- 画像確認: sheet-13_img1.png(SP)/img3.png(PC) の編集画面を確認。レイアウト図ではカード名入力欄にプレースホルダのみで候補一覧は描かれていない
- 実装参照: `src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:71-78; src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:239-242`
- 実装実態: 候補の入れ物(空のリスト)だけがあり、入力しても候補は1件も出ない。候補となるカード名を画面へ渡す処理も無い
- 同じ実装実態でまとまる要求: sheet-13-R021（大会デッキ登録編集 / 実装参照 `src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:75-78; src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:239-242`）、sheet-13-R107（大会デッキ登録編集 / 実装参照 `src/Eccube/Controller/Front/Mypage/DeckEntryController.php:49-93; src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:239-242`）
- 判定根拠: src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:239-242 の候補リストは空で、src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:71-78 は入力有無で表示属性を切り替えるだけ。候補を取得・描画する処理がテンプレートにもJSにも無い
- 確信度: high

### sheet-15-R094 会員情報変更 — 未実装／ふるまい／P2

- 正本: sheet-15（会員情報変更） HTML行 3742 付近
- 正本引用: 「国が日本で都道府県が海外のとき、国が海外で都道府県が国内のときは、送信後の検証で拒否し、国の項目にエラーを付して再表示する。」
- 設計期待値: 国が日本なのに都道府県が「日本国外」、または国が日本以外なのに都道府県が国内の組み合わせで変更するを押下すると、更新されず、国の項目にエラーが表示された編集フォームが再表示される。
- 画像確認: img5(日本)の都道府県セレクトは全県が並ぶ形で、日本国外を除いた選択肢である証跡は画像に無い。
- 実装参照: `src/Eccube/Form/Type/Front/EntryType.php:209-229; src/Eccube/Form/Type/Front/EntryType.php:231-252; src/Eccube/Resource/template/default/Mypage/change.twig:426-436`
- 実装実態: 国と都道府県の組み合わせを判定する処理が無い。国が日本以外のときは都道府県を「日本国外」に上書きして通してしまい（src/Eccube/Form/Type/Front/EntryType.php:226-227）、国が日本のときは都道府県が未選択かどうかしか見ない（src/Eccube/Form/Type/Front/EntryType.php:240-243）。都道府県の選択肢には「日本国外」が含まれる（app/DoctrineMigrations/Version20251125164358.php:295-299）ため、国=Japan かつ都道府県=日本国外がエラーにならずに登録できる。
- 判定根拠: 国の項目にエラーを付す処理はコード上に存在せず、組み合わせ不正を拒否する分岐も無い。
- 確信度: med

### sheet-15-R097 会員情報変更 — 実装違い／ふるまい／P2

- 正本: sheet-15（会員情報変更） HTML行 3745 付近
- 正本引用: 「選手情報のメールアドレス・英字氏名・和文氏名・更新日時を更新する。」
- 設計期待値: 会員情報の変更を確定すると、選手情報の連絡先アドレス・英字氏名に加えて和文氏名も、会員が入力した氏名と揃った内容へ更新される。
- 画像確認: 画像は入力画面のレイアウトのみで、選手情報の更新有無は読み取れない。
- 実装参照: `src/Eccube/Form/Type/Front/EntryType.php:186-207; src/Eccube/Controller/Front/Mypage/ChangeController.php:113-199`
- 実装実態: 選手情報はメールアドレス（src/Eccube/Form/Type/Front/EntryType.php:203-206）と英字姓・名（src/Eccube/Form/Type/Front/PlayerType.php:34-51 経由）しか更新されず、和文氏名（姓・名）を会員の氏名から更新する処理が無い。更新日時は保存時に自動更新される（src/Eccube/Doctrine/EventSubscriber/SaveEventSubscriber.php:62-68）。
- 同じ実装実態でまとまる要求: sheet-15-R110（会員情報変更 / 実装参照 `src/Eccube/Form/Type/Front/EntryType.php:186-207; src/Eccube/Form/Type/Front/PlayerType.php:34-51`）、sheet-3-R153（新規会員登録 / 実装参照 `src/Eccube/Controller/Front/EntryController.php:163-169; src/Eccube/Form/Type/Front/PlayerType.php:34-51`）
- 判定根拠: 会員情報変更の経路から和文氏名を設定する呼び出しはコード全体に存在しない（setLastNameJp/setFirstNameJp の呼び出しは店頭買取と外部ユーザー更新のみ）。会員の氏名を変更しても選手情報の和文氏名は元のまま残る。
- 確信度: med

### sheet-15-R103 会員情報変更 — 実装違い／ふるまい／P2

- 正本: sheet-15（会員情報変更） HTML行 3751 付近
- 正本引用: 「スマレジへの会員情報更新が成功したときだけ、変更を確定する。失敗したときは更新を中止し、編集フォームを再表示する。確定したあとに、支店システムへ当該会員の更新を通知する。」
- 設計期待値: スマレジ側の会員情報更新が成功したときだけ会員情報の変更が確定し、失敗したときは変更が保存されず編集フォームが再表示される。変更が確定した後には支店側にもその会員の更新が伝わる。
- 画像確認: 画像は入力画面・完了画面のレイアウトのみで、連携の成否は読み取れない。
- 実装参照: `src/Eccube/Controller/Front/Mypage/ChangeController.php:170-199; src/Eccube/Service/Smaregi/SmaregiCustomerUpdateEventService.php:39-63`
- 実装実態: スマレジへの反映は後回しの非同期処理として積まれるだけで、成功可否を待たずに会員情報の変更が確定する（src/Eccube/Controller/Front/Mypage/ChangeController.php:176-186）。連携が失敗しても変更は取り消されず、編集フォームにも戻らない。支店へ会員の更新を伝える処理は会員情報変更の経路に無い。
- 同じ実装実態でまとまる要求: sheet-15-R107（会員情報変更 / 実装参照 `src/Eccube/Controller/Front/Mypage/ChangeController.php:200-212; src/Eccube/Resource/template/default/Mypage/change.twig:66-77`）
- 判定根拠: src/Eccube/Controller/Front/Mypage/ChangeController.php:170-172 のコメント自身が「スマレジ連携の失敗で会員情報変更自体はブロックしない」と述べており、設計の「成功したときだけ確定する」と食い違う。支店通知は DtbBranchUpdateError を使う商品系にしか無く、会員更新の通知先は存在しない。
- 確信度: high

### sheet-17-R054 退会 — 未実装／ふるまい／P2

- 正本: sheet-17（退会） HTML行 4286 付近
- 正本引用: 「退会を確定したとき、会員に紐づく選手情報も削除する。スマレジ連携に失敗して退会を中止したときは、選手情報も削除しない。」
- 設計期待値: 退会を確定したとき、その会員に紐づく選手情報も併せて削除され、退会後は残らない。
- 画像確認: sheet-17_img1〜img6の6枚すべてを確認した。
- 実装参照: `src/Eccube/Controller/Front/Mypage/WithdrawController.php:109-155`
- 実装実態: 退会確定時に行うのはスマレジ会員の削除・会員状態の変更・メールアドレスのダミー化・削除フラグの設定・完了メール送信・ログアウトだけで、会員に紐づく選手情報を削除する処理が無い。選手情報は src/Eccube/Service/EntityManager/PlayerEntityManager.php:31-55 で登録・更新されるだけで、退会経路から削除されることがない。
- 同じ実装実態でまとまる要求: sheet-17-R060（退会）
- 判定根拠: 退会確定の処理を最初から最後まで読んだが選手情報を削除する処理は無く、会員自体も削除フラグを立てる論理削除のため、関連削除で消えることもない。
- 確信度: med

### sheet-22-R041 店頭PC用アカウント制御 — 実装違い／IO／P2

- 正本: sheet-22（店頭PC用アカウント制御） HTML行 5009 付近
- 正本引用: 「※以下赤枠内のように、現行の本店で表示していた「ご注文主」「お届け先」は非表示とする」
- 設計期待値: 店頭PCアカウントでログイン済みのとき、ご注文方法指定画面で非表示になるのは「ご注文主」と「お届け先」だけで、注文する商品の一覧と小計はそのまま表示される
- 画像確認: sheet-22_img2（ご注文方法の指定）にご注文主・お届け先・ご注文の商品の3節が写っており、非表示指定は前2節のみ
- 実装参照: `src/Eccube/Resource/template/default/Shopping/index.twig:204; src/Eccube/Resource/template/default/Shopping/index.twig:330`
- 実装実態: src/Eccube/Resource/template/default/Shopping/index.twig:204 の条件が「ご注文の商品」節まで含めて囲っており（:330 が閉じ）、店内・支店店内アカウントではご注文主・お届け先に加えて注文商品の明細と小計も画面から消える
- 判定根拠: 非表示にすると設計が定めるのはご注文主とお届け先の2節のみ。実装は同じ条件で商品明細節も囲っているため、店頭PCアカウントでは注文内容を画面で確認できない。en版（index.en.twig:207）も同じ
- 確信度: med

### sheet-22-R082 店頭PC用アカウント制御 — 未実装／ふるまい／P2

- 正本: sheet-22（店頭PC用アカウント制御） HTML行 5056 付近
- 正本引用: 「お気に入り登録商品がセール状態になったことを知らせる通知メールは、顧客グループの店頭フロント区分または支店店頭フロント区分が立つ会員を配信対象から除外する。」
- 設計期待値: お気に入り商品のセール通知メールは、店頭PCアカウント（店内アカウント・支店店内アカウント）の会員には送らない
- 画像確認: レイアウト図に該当なし（メール配信のため画面表示なし）
- 実装参照: `src/Eccube/Repository/CustomerFavoriteProductRepository.php:248; src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:38`
- 実装実態: 配信対象の抽出条件は「セール中」と「本会員」だけで（src/Eccube/Repository/CustomerFavoriteProductRepository.php:248）、店頭フロント区分・支店店頭フロント区分による除外がない。送信側（src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:38）にも除外はない
- 判定根拠: 除外条件は旧実装の抽出（src/Eccube/Repository/DtbFavoriteProductRepository.php:61）にコメントとして残るのみで、現に使われている抽出・送信の経路には存在しない。店頭PCアカウントにもセール通知メールが送られる
- 確信度: high

### sheet-3-R146 新規会員登録 — 未実装／ふるまい／P2

- 正本: sheet-3（新規会員登録） HTML行 1344 付近
- 正本引用: 「国が日本なのに住所(都道府県)が「日本国外」、または国が日本以外なのに住所(都道府県)が「日本国外」以外 国欄に整合エラーを表示し、登録しない」
- 設計期待値: 国と都道府県の組み合わせが整合しない送信は、国欄にエラーを出して登録を行わない。
- 画像確認: レイアウト図(sheet-3_img6)の都道府県セレクトに「日本国外」を除く指定は描かれていない。
- 実装参照: `src/Eccube/Form/Type/Front/EntryType.php:218-252`
- 実装実態: 国が日本のときは都道府県が未選択かどうかしか見ておらず、都道府県に「日本国外」を選んでもエラーにならずそのまま登録できる。国が日本以外のときは送信値を無視して都道府県を「日本国外」に上書きするため、整合エラーも出ない。
- 判定根拠: 国と都道府県の突き合わせを行う箇所が無い（src/Eccube/Form/Type/Front/EntryType.php:218-229、src/Eccube/Form/Type/Front/EntryType.php:240-251）。都道府県の選択肢には「日本国外」が含まれる（app/DoctrineMigrations/Version20251125164358.php:295-298）。
- 確信度: high

### sheet-3-R152 新規会員登録 — 未実装／IO／P2

- 正本: sheet-3（新規会員登録） HTML行 1352 付近
- 正本引用: 「追加 同上 住所の付帯情報は既定の住所名を持ち、既定のお届け先として作る」
- 設計期待値: 会員登録の実行時に作られる住所には既定の住所名が付き、既定のお届け先として扱われる。
- 実装参照: `src/Eccube/Controller/Front/EntryController.php:158-171`
- 実装実態: 会員住所自体が作られないため、既定の住所名も既定のお届け先の指定も生まれない。
- 同じ実装実態でまとまる要求: sheet-3-R154（新規会員登録）
- 判定根拠: 登録処理には住所名・既定お届け先の設定が無い（src/Eccube/Controller/Front/EntryController.php:158-171）。既定の住所名を付ける処理は他機能にしか無い（src/Eccube/Controller/Front/Purchase/OtcBuyController.php:590-594）。
- 確信度: high

### sheet-4-R022 本会員登録 — 実装違い／ふるまい／P2

- 正本: sheet-4（本会員登録） HTML行 1480 付近
- 正本引用: 「・スマレジへのユーザー新規登録が成功した場合 ・ユーザーのステータスを「本会員」にして、ユーザー情報を保存する」
- 設計期待値: 会員のステータスが「本会員」として確定するのはスマレジへの会員登録が成功したときだけで、連携に失敗したときは本会員化されないまま残る
- 実装参照: `src/Eccube/Controller/Front/EntryController.php:296-333;src/Eccube/Controller/Front/EntryController.php:396-406`
- 実装実態: src/Eccube/Controller/Front/EntryController.php:296-303 で会員ステータスを先に本会員(REGULAR)へ更新して確定させ、その後 src/Eccube/Controller/Front/EntryController.php:317 でスマレジ連携を行う。連携が失敗しても本会員化は取り消されず、src/Eccube/Controller/Front/EntryController.php:400-404・src/Eccube/Controller/Front/EntryController.php:417 のログ文言も「本会員化は完了済み」と記している。結果、E-3画面が出た会員はスマレジID未設定のまま本会員になる。
- 判定根拠: 設計は本会員化をスマレジ登録成功時の処理として並べており、リニューアル後の表示メッセージでもスマレジ連携失敗時は「本会員化を確定しない」と定めているが、実装は順序が逆で失敗時も本会員のまま残る。
- 確信度: high

### sheet-8-R029 入荷待ち商品一覧 — 実装違い／ふるまい／P2

- 正本: sheet-8（入荷待ち商品一覧） HTML行 2311 付近
- 正本引用: 「7	同名カード検索	リンク	-	-	-	・押下すると、同じカードIDで検索した商品一覧画面へ遷移する」
- 設計期待値: 同名商品のリンクを押すと、そのカードと同じカードで絞り込まれた商品一覧が表示されること。
- 画像確認: sheet-8_img1/img2（入荷待ち商品一覧のPC・SP画面）とimg3（マイページボタン）を確認。img4は配送先登録画面で本シートの内容と無関係。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/notifylist.twig:70-75;src/Eccube/Resource/template/default/Mypage/notifylist.en.twig:70-75;src/Eccube/Controller/Front/ProductController.php:234-239`
- 実装実態: 商品一覧へは移動するが、絞り込みの指定が商品一覧側で読み取られない綴りで渡されているため、絞り込みのない商品一覧が表示される。
- 判定根拠: notifylist.twig:71 は card_id という名前で値を付けて商品一覧を開くが、ProductController.php:236-239 は cardId しか読み取らないため同名絞り込みが働かない。同じ導線でも Block/product.twig:374 は cardId で渡している。
- 確信度: high

### sheet-8-R036 入荷待ち商品一覧 — 実装違い／ふるまい／P2

- 正本: sheet-8（入荷待ち商品一覧） HTML行 2318 付近
- 正本引用: 「・入荷通知ボタンは入荷通知を解除したときのみ表示する（当画面へ遷移してきたとき、再読み込みしたときは表示しない）」
- 設計期待値: 画面を開いた直後や再読み込み直後は解除ボタンだけが並び、入荷通知ボタンは解除操作をした行にだけ現れること。
- 画像確認: sheet-8_img1/img2（入荷待ち商品一覧のPC・SP画面）とimg3（マイページボタン）を確認。img4は配送先登録画面で本シートの内容と無関係。
- 実装参照: `src/Eccube/Service/Front/Mypage/NotifyListEntryBuilder.php:73-91;src/Eccube/Resource/template/default/Mypage/notifylist.twig:95-102`
- 実装実態: 画面を開いた時点で、入荷通知を登録していない状態の行にも入荷通知ボタンを表示している。
- 同じ実装実態でまとまる要求: sheet-8-R011（入荷待ち商品一覧 / 実装参照 `src/Eccube/Service/Front/Mypage/NotifyListEntryBuilder.php:73-91;src/Eccube/Resource/template/default/Mypage/notifylist.twig:78-105;src/Eccube/Resource/template/default/Mypage/notifylist.en.twig:78-105`）、sheet-8-R044（入荷待ち商品一覧 / 実装参照 `src/Eccube/Resource/template/default/Mypage/notifylist.twig:106-123;src/Eccube/Service/Front/Mypage/NotifyListEntryBuilder.php:84-97`）
- 判定根拠: NotifyListEntryBuilder.php:74-88 が未登録の商品規格も一覧に含めるため、notifylist.twig:95-102 の入荷通知ボタンが初回表示・再読み込み時にも描画される。
- 確信度: high

### sheet-9-R045 お気に入り商品一覧 — 実装違い／IO／P2

- 正本: sheet-9（お気に入り商品一覧） HTML行 2494 付近
- 正本引用: 「表示するのは、ログイン会員がお気に入りに登録した商品のうち公開中のものに限る。高額商品コードを持つ商品は、在庫があるものだけを表示する。同一商品でも言語が異なれば別の行として並べる。」
- 設計期待値: 高額商品コードが付いた商品は、在庫があるものだけを一覧に出す。在庫が無いものは一覧に出さない。
- 画像確認: 図では一覧に並ぶ商品の高額商品コードの有無が判別できないため、図からは否定できない。
- 実装参照: `src/Eccube/Repository/DtbFavoriteProductRepository.php:97-138`
- 実装実態: src/Eccube/Repository/DtbFavoriteProductRepository.php:99-108 の絞り込みは公開中かどうかと言語だけで、高額商品コードの有無や在庫数を見ていない。高額商品コードを持つ在庫0の商品もそのまま一覧に並ぶ。
- 判定根拠: 公開中限定と言語別の行分けは実装されているが、高額商品コードを持つ商品を在庫のあるものだけに限る条件が無い。
- 確信度: med

### sheet-9-R047 お気に入り商品一覧 — 実装違い／IO／P2

- 正本: sheet-9（お気に入り商品一覧） HTML行 2496 付近
- 正本引用: 「明細に出すのは、状態がニアミント、または販売価格が状態表示の下限価格（現行設定は100円）以上のものに限る。高額商品コードを持つ明細は、状態に続けて高額商品コードを併記する。」
- 設計期待値: 状態ごとの明細に出すのは、ニアミントの明細と、販売価格が状態表示の下限価格以上の明細だけにする。高額商品コードを持つ明細は状態に続けて高額商品コードも並べて出す。
- 画像確認: img1 は NM/SP/MP/HP の4明細を並べるが、いずれも下限価格を上回る価格で描かれており、下限価格未満の明細を出すかどうかは図からは読み取れない。高額商品コードを持つ明細も図には現れない。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/favorite.twig:161-197`
- 実装実態: src/Eccube/Resource/template/default/Mypage/favorite.twig:162 は表示可で言語が一致する規格をすべて明細として出しており、ニアミントかどうかも下限価格も見ていない。src/Eccube/Resource/template/default/Mypage/favorite.twig:170 が状態欄に出すのは規格のメモまたはカード状態コードだけで、高額商品コードは併記されない。
- 判定根拠: 明細の絞り込み条件と高額商品コードの併記のどちらも実装が持っていない。
- 確信度: med

### sheet-10-R007 ポイント履歴 — 実装違い／ふるまい／P3

- 正本: sheet-10（ポイント履歴） HTML行 2596 付近
- 正本引用: 「・ポイント履歴は、ポイント履歴IDの降順で表示する」
- 設計期待値: ポイント履歴の一覧は、ポイント履歴IDの降順（後から登録された履歴ほど上）に並ぶこと。
- 画像確認: sheet-10_img1（ポイント履歴一覧の全体図。上下に「最初 1 2 3 最後」のページャ、「[11 ~ 20 件] 23 件あります」の件数表示、注文番号リンク、内容列、マイページボタンを確認）、img2（内容欄「キャンペーン」の断片）、img3（利用時の注文番号とマイナス表示の断片）を確認。図の日付は「2025年08月18日」表記だが、項目表の書式指定は日本語 Y/n/j であり項目表を正とした。
- 実装参照: `src/Eccube/Repository/DtbPointHistoryRepository.php:133-140;src/Eccube/Controller/Front/Mypage/MypageController.php:248-258`
- 実装実態: 一覧の並びは第1キーがポイント発行日の降順で、ポイント履歴IDの降順は同一発行日のときの第2キーにとどまる。
- 判定根拠: src/Eccube/Repository/DtbPointHistoryRepository.php:135-139 が orderBy('p.issueDate','DESC')->addOrderBy('p.id','DESC') を返し、src/Eccube/Controller/Front/Mypage/MypageController.php:250-256 がこれをそのままページングしている。発行日が後から登録された履歴より新しい履歴（スマレジ取引日を発行日に持つ履歴の後追い登録など）があると、設計の並び（ID降順）と表示順が食い違う。
- 確信度: med

### sheet-10-R022 ポイント履歴 — 実装違い／IO／P3

- 正本: sheet-10（ポイント履歴） HTML行 2612 付近
- 正本引用: 「・ポイント履歴の全件数のうち、現在表示している範囲を表示する」
- 設計期待値: 日本語ページの一覧上部に、全件数のうち現在表示している範囲（何件目から何件目か）が表示されること。
- 画像確認: sheet-10_img1（ポイント履歴一覧の全体図。上下に「最初 1 2 3 最後」のページャ、「[11 ~ 20 件] 23 件あります」の件数表示、注文番号リンク、内容列、マイページボタンを確認）、img2（内容欄「キャンペーン」の断片）、img3（利用時の注文番号とマイナス表示の断片）を確認。図の日付は「2025年08月18日」表記だが、項目表の書式指定は日本語 Y/n/j であり項目表を正とした。
- 実装参照: `src/Eccube/Resource/locale/messages.ja.yaml:828;src/Eccube/Resource/template/default/Mypage/point_history.twig:52-57`
- 実装実態: 日本語ページの表示は「件数: 23件」で、全件数だけが出て現在表示している範囲は出ない。
- 判定根拠: src/Eccube/Resource/template/default/Mypage/point_history.twig:52-56 は開始・終了・全件数の3つを翻訳キー front.mypage.point_history.range_info に渡しているが、src/Eccube/Resource/locale/messages.ja.yaml:828 の文言が '件数: %total%件' で開始・終了を使っていないため、画面には範囲が現れない。レイアウト図の「[11 ~ 20 件] 23 件あります」に相当する表示にならない。
- 確信度: high

### sheet-10-R024 ポイント履歴 — 実装違い／IO／P3

- 正本: sheet-10（ポイント履歴） HTML行 2614 付近
- 正本引用: 「・(5)ポイント履歴表示件数で分けたページの中で、最初のページに遷移する」
- 設計期待値: ページ送りに「最初」の導線が並び、押すと1ページ目の一覧が表示されること。
- 画像確認: sheet-10_img1（ポイント履歴一覧の全体図。上下に「最初 1 2 3 最後」のページャ、「[11 ~ 20 件] 23 件あります」の件数表示、注文番号リンク、内容列、マイページボタンを確認）、img2（内容欄「キャンペーン」の断片）、img3（利用時の注文番号とマイナス表示の断片）を確認。図の日付は「2025年08月18日」表記だが、項目表の書式指定は日本語 Y/n/j であり項目表を正とした。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/point_history.twig:59;src/Eccube/Resource/template/default/Mypage/point_history.twig:134;src/Eccube/Resource/template/default/pager.twig:11-69`
- 実装実態: ポイント履歴のページ送りには「最初」の導線が無く、代わりに「前」「次」と先頭・末尾のページ番号だけが並ぶ。先頭ページへの番号リンクも、先頭ページが番号の並びに含まれていないときにしか出ない。
- 同じ実装実態でまとまる要求: sheet-10-R025（ポイント履歴 / 実装参照 `src/Eccube/Resource/template/default/pager.twig:22-26;src/Eccube/Resource/template/default/Mypage/point_history.twig:59;src/Eccube/Resource/template/default/Mypage/point_history.twig:134`）、sheet-10-R029（ポイント履歴）、sheet-10-R030（ポイント履歴 / 実装参照 `src/Eccube/Resource/template/default/pager.twig:56-60;src/Eccube/Resource/template/default/Mypage/point_history.twig:59;src/Eccube/Resource/template/default/Mypage/point_history.twig:134`）、sheet-12-R038（マイイベント・デッキ登録 / 実装参照 `src/Eccube/Resource/template/default/pager.twig:22-26;src/Eccube/Resource/template/default/pager.twig:56-60`）
- 判定根拠: src/Eccube/Resource/template/default/Mypage/point_history.twig:59,134 が共通のページ送りを読み込み、src/Eccube/Resource/template/default/pager.twig:15-19 は「前」、src/Eccube/Resource/template/default/pager.twig:22-26 は先頭ページの番号リンク、src/Eccube/Resource/template/default/pager.twig:63-67 は「次」を出す。「最初」の文言（messages.ja.yaml:34 common.first）を使う実装は買取履歴用のページ送り（src/Eccube/Resource/template/default/Mypage/purchase_history_pager.twig:10-16）にはあるが、ポイント履歴は共通のページ送りを使うため出ない。レイアウト図では「最初」「最後」が1・2・3の両側に並んでいる。
- 確信度: high

### sheet-10-R028 ポイント履歴 — 実装違い／IO／P3

- 正本: sheet-10（ポイント履歴） HTML行 2618 付近
- 正本引用: 「・ページ番号は現在表示しているページ番号から前後最大4つまで表示できる」
- 設計期待値: ページ番号の並びには、現在のページを中心に前後それぞれ最大4つまでのページ番号が並ぶこと。
- 画像確認: sheet-10_img1（ポイント履歴一覧の全体図。上下に「最初 1 2 3 最後」のページャ、「[11 ~ 20 件] 23 件あります」の件数表示、注文番号リンク、内容列、マイページボタンを確認）、img2（内容欄「キャンペーン」の断片）、img3（利用時の注文番号とマイナス表示の断片）を確認。図の日付は「2025年08月18日」表記だが、項目表の書式指定は日本語 Y/n/j であり項目表を正とした。
- 実装参照: `src/Eccube/Controller/Front/Mypage/MypageController.php:250-256;src/Eccube/Resource/template/default/pager.twig:36-46`
- 実装実態: ページ番号の並びは前後最大2つ（合計5つ）までで、前後4つは並ばない。
- 同じ実装実態でまとまる要求: sheet-12-R036（マイイベント・デッキ登録 / 実装参照 `src/Eccube/Controller/Front/Mypage/EventHistoryController.php:99;src/Eccube/Resource/template/default/pager.twig:36-46`）、sheet-12-R037（マイイベント・デッキ登録 / 実装参照 `src/Eccube/Controller/Front/Mypage/EventHistoryController.php:99;src/Eccube/Resource/template/default/pager.twig:36-46`）
- 判定根拠: src/Eccube/Controller/Front/Mypage/MypageController.php:252-257 はページ番号の並び幅を指定せず既定のまま呼び出しており、既定値は5（vendor/knplabs/knp-paginator-bundle/src/DependencyInjection/Configuration.php:49-51）。リポジトリ内に既定値を上書きする設定は無い。同じ「前後4つ」を satisfying する実装は src/Eccube/Resource/template/default/Block/js/product_detail_same_name_js.twig:29-31 のように幅4を明示している。
- 確信度: med

### sheet-10-R043 ポイント履歴 — 未実装／IO／P3

- 正本: sheet-10（ポイント履歴） HTML行 2633 付近
- 正本引用: 「・英語サイトの場合は英語の内容を表示する」
- 設計期待値: 英語ページの内容欄には、その履歴の内容が英語で表示されること。
- 画像確認: sheet-10_img1（ポイント履歴一覧の全体図。上下に「最初 1 2 3 最後」のページャ、「[11 ~ 20 件] 23 件あります」の件数表示、注文番号リンク、内容列、マイページボタンを確認）、img2（内容欄「キャンペーン」の断片）、img3（利用時の注文番号とマイナス表示の断片）を確認。図の日付は「2025年08月18日」表記だが、項目表の書式指定は日本語 Y/n/j であり項目表を正とした。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/point_history.en.twig:124-127;src/Eccube/Entity/DtbPointHistory.php:49-50;src/Eccube/Entity/DtbPointHistory.php:92-95`
- 実装実態: 英語ページも日本語ページと同じ内容の文字列をそのまま表示する。英語の内容を保持する項目そのものが無い。
- 判定根拠: src/Eccube/Resource/template/default/Mypage/point_history.en.twig:126 は日本語ページ（src/Eccube/Resource/template/default/Mypage/point_history.twig:126）と同じ note をそのまま出力している。src/Eccube/Entity/DtbPointHistory.php:49-50 のポイント履歴が持つ内容の項目は note の1つだけで、英語用の項目は存在せず、リポジトリ全体を note_en/noteEn で検索しても該当が無い。翻訳して出し分ける処理も無い。
- 確信度: high

### sheet-10-R053 ポイント履歴 — 実装違い／ふるまい／P3

- 正本: sheet-10（ポイント履歴） HTML行 2647 付近
- 正本引用: 「常にログイン会員自身のポイント履歴のみを対象とする。ページ番号と1ページ表示件数はクエリで受け取る。いずれも数値として解釈し、指定が無いとき・0のとき・数値として解釈できないときは既定に戻す（ページ番号の既定は1ページ目）。ページ送りのリンクは、押下時点の表示件数の指定をそのまま引き継ぐ。」
- 設計期待値: 1ページの表示件数の指定が0や数値として読めない値だったときは、既定の10件表示に戻ること。
- 画像確認: sheet-10_img1（ポイント履歴一覧の全体図。上下に「最初 1 2 3 最後」のページャ、「[11 ~ 20 件] 23 件あります」の件数表示、注文番号リンク、内容列、マイページボタンを確認）、img2（内容欄「キャンペーン」の断片）、img3（利用時の注文番号とマイナス表示の断片）を確認。図の日付は「2025年08月18日」表記だが、項目表の書式指定は日本語 Y/n/j であり項目表を正とした。
- 実装参照: `src/Eccube/Controller/Front/Mypage/MypageController.php:250`
- 実装実態: 表示件数の指定が0や数値でない値のとき、既定の10件ではなく1件表示になる。
- 判定根拠: src/Eccube/Controller/Front/Mypage/MypageController.php:250 は指定が無いときだけ既定の10件を使い、指定があるときは数値化した値と1の大きい方を採る。そのため 0 や数値として読めない値（数値化すると0）を与えると10件に戻らず1件ずつの表示になる。ログイン会員自身のみを対象とする点（src/Eccube/Repository/DtbPointHistoryRepository.php:135-137）とページ送りが表示件数の指定を引き継ぐ点（src/Eccube/Resource/template/default/pager.twig:43）、ページ番号が0や不正値のとき1ページ目に戻る点（src/Eccube/Controller/Front/Mypage/MypageController.php:252-253）は設計どおり。
- 確信度: med

### sheet-10-R057 ポイント履歴 — 実装違い／ふるまい／P3

- 正本: sheet-10（ポイント履歴） HTML行 2651 付近
- 正本引用: 「有効期限はプラスの履歴にのみ表示し、発行日にポイント失効日数の設定を加えた日とする。注文番号のリンクは別タブで開く。」
- 設計期待値: 一覧の注文番号を押したとき、購入履歴詳細が新しいタブで開き、ポイント履歴の一覧はそのまま残ること。
- 画像確認: sheet-10_img1（ポイント履歴一覧の全体図。上下に「最初 1 2 3 最後」のページャ、「[11 ~ 20 件] 23 件あります」の件数表示、注文番号リンク、内容列、マイページボタンを確認）、img2（内容欄「キャンペーン」の断片）、img3（利用時の注文番号とマイナス表示の断片）を確認。図の日付は「2025年08月18日」表記だが、項目表の書式指定は日本語 Y/n/j であり項目表を正とした。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/point_history.twig:102;src/Eccube/Resource/template/default/Mypage/point_history.en.twig:102`
- 実装実態: 注文番号のリンクは同じタブで開き、ポイント履歴の一覧から離れる。
- 判定根拠: src/Eccube/Resource/template/default/Mypage/point_history.twig:102 のリンクには別タブで開く指定（target）が無いため、押下すると同じタブで購入履歴詳細に移る。同じ行の他の記述（プラスのときだけ有効期限を出す src/Eccube/Resource/template/default/Mypage/point_history.twig:119-121、発行日＋失効日数 src/Eccube/Resource/template/default/Mypage/point_history.twig:120、「+」付きの表示と獲得・利用の色分け src/Eccube/Resource/template/default/Mypage/point_history.twig:112-114）は設計どおり実装されている。
- 確信度: med

### sheet-11-R011 オンライン本人確認 — 実装違い／IO／P3

- 正本: sheet-11（オンライン本人確認） HTML行 2720 付近
- 正本引用: 「ステータスは「未確認」「現在、確認中です」「オンラインで本人確認済み」「簡易書留で本人確認済み」のいずれかが表示される」
- 設計期待値: 本人確認状況には「未確認」「現在、確認中です」「オンラインで本人確認済み」「簡易書留で本人確認済み」のいずれかが表示される
- 画像確認: img1・img2は「未確認」のみで、他3ステータスの表示例は図に無い。
- 実装参照: `app/DoctrineMigrations/Version20251125145047.php:62-84; src/Eccube/Resource/template/default/Mypage/online_identification.twig:53-55`
- 実装実態: 画面は本人確認ステータスの登録名称をそのまま表示するが、登録されている名称は「未確認」「確認中」「オンライン本人確認済み」「簡易書留確認済み」で、4つのうち3つが正本の文言と違う。
- 同じ実装実態でまとまる要求: sheet-11-R025（オンライン本人確認）
- 判定根拠: src/Eccube/Resource/template/default/Mypage/online_identification.twig:54 が本人確認ステータスの日本語名をそのまま出力し、その名称の登録元は app/DoctrineMigrations/Version20251125145047.php:62-84。正本の文言「現在、確認中です」は申請完了画面用の固定文言 src/Eccube/Resource/locale/messages.ja.yaml:949 にしか無く、ステータス名称としては存在しない。
- 確信度: med

### sheet-12-R027 マイイベント・デッキ登録 — 実装違い／IO／P3

- 正本: sheet-12（マイイベント・デッキ登録） HTML行 2988 付近
- 正本引用: 「※カスタマイズ対応、デッキ登録済みの大会の表示追加のため、「未登録」を追加」
- 設計期待値: 申込が無くデッキだけを登録しているイベントの処理状態は「未登録」と表示する。
- 画像確認: img1 の2行目は処理状態が「未登録」（橙）でデッキ登録が「登録済み」。デッキだけ登録済みの行の文言が「未登録」であることを図が示している。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/event_history.twig:117-118;src/Eccube/Resource/locale/messages.ja.yaml:661`
- 実装実態: src/Eccube/Resource/template/default/Mypage/event_history.twig:117-118 は申込が無いイベントの処理状態に src/Eccube/Resource/locale/messages.ja.yaml:661 の「未申込」を表示する。「未登録」という文言はこの列には出ない。
- 判定根拠: [gate7/refute] 重要度を P3 へ。乖離自体は実在する。引用は sheets/sheet-12.txt:71（識別ID5 処理状態の画面部品の説明）に逐語で在り「『未登録』を追加」と述語を持つ。images/sheet-12_img1.png の2行目は処理状態が「未登録」（橙）でデッキ登録が「登録済み」となっており図も一致。実装は src/Eccube/Resource/template/default/Mypage/event_ 設計の項目説明と一覧のレイアウト図がどちらも「未登録」を指定しているのに対し、実装の文言は「未申込」である。
- 確信度: high

### sheet-12-R030 マイイベント・デッキ登録 — 実装違い／IO／P3

- 正本: sheet-12（マイイベント・デッキ登録） HTML行 2991 付近
- 正本引用: 「・マウスカーソルを合わせると、以下の文言でツールチップを表示する「決済が中断されましたお手数ですが、約30分後に再度お申込みいただけますようお願いいたします」」
- 設計期待値: 決済中のヘルプに触れたとき「決済が中断されました」で始まる案内を出す。
- 画像確認: sheet-12_img1.png（一覧本体）/ img2（イベントを探す・マイページへ戻る）/ img3（件数・ページネーション・表示件数）を確認。
- 実装参照: `src/Eccube/Resource/locale/messages.ja.yaml:664;src/Eccube/Resource/template/default/Mypage/event_history.twig:128`
- 実装実態: src/Eccube/Resource/template/default/Mypage/event_history.twig:128 が出す文言は src/Eccube/Resource/locale/messages.ja.yaml:664 の「決済が中断されましたら お手数ですが、約30分後に再度お申込みいただけますようお願いいたします」で、冒頭が「中断されましたら」と条件形になっている。
- 判定根拠: 設計が定める文言は「決済が中断されました」（完了形）で始まるが、実装の文言は「決済が中断されましたら」で始まり、文意が変わっている。
- 確信度: med

### sheet-13-R022 大会デッキ登録編集 — 実装違い／ふるまい／P3

- 正本: sheet-13（大会デッキ登録編集） HTML行 3143 付近
- 正本引用: 「・ボード選択ボタン(14)とデッキリストのメインボード(18)サイドボード(19)入力欄は、選択している方が強調表示される」
- 設計期待値: 選択中のボード側の入力欄(メインボードまたはサイドボード)が強調表示される
- 画像確認: sheet-13_img1.png(SP)/img3.png(PC) の編集画面を確認。レイアウト図ではメインボード入力欄の枠線が濃く描かれ選択側が強調されている
- 実装参照: `src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:38-40; src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:276-290`
- 実装実態: ボタン側は選択状態が強調されるが、入力欄側は強調されない(強調用のクラスを付ける処理が無い)
- 同じ実装実態でまとまる要求: sheet-13-R023（大会デッキ登録編集）
- 判定根拠: src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:38-40 はボタンの選択値を控えるだけで入力欄の見た目を変えない。src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:276-290 の入力欄にも選択状態を示す指定が無い
- 確信度: med

### sheet-13-R068 大会デッキ登録編集 — 未実装／IO／P3

- 正本: sheet-13（大会デッキ登録編集） HTML行 3190 付近
- 正本引用: 「・分割カードは両側のカード名をご入力ください 例)摩耗/損耗 ・「Through the Omenpaths」のカードは「マジック：ザ・ギャザリング | マーベル スパイダーマン」のカードに変換されます」
- 設計期待値: 入力形式に関する注意事項に、該当セットのカードが別セットのカードへ変換される旨の案内が表示される
- 画像確認: sheet-13_img1.png(SP)/img3.png(PC) の編集画面を確認。レイアウト図の注意事項には『「領界路の彼方」のカードは「マジック：ザ・ギャザリング｜マーベル スパイダーマン」のカードに変換されます』が6項目目として描かれている
- 実装参照: `src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:302-308; src/Eccube/Resource/template/default/Mypage/deck_entry_edit.en.twig:292-297`
- 実装実態: 注意事項は5項目だけで、カード変換に関する案内が日本語・英語のどちらにも無い
- 判定根拠: src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:302-308 の一覧は分割カードの例で終わっており、変換に関する項が存在しない
- 確信度: high

### sheet-13-R090 大会デッキ登録編集 — 未実装／IO／P3

- 正本: sheet-13（大会デッキ登録編集） HTML行 3250 付近
- 正本引用: 「2	検索結果総数	ラベル	-	-	-	- 3	表示件数	ラベル	-	-	-	- 4	ページング	リンク	-	-	-	1ページあたりの最大表示数は20件ページ切り替えは動的に処理する」
- 設計期待値: マイデッキ取得のモーダルに、該当するデッキの総件数が表示される
- 画像確認: sheet-13_img8.png(SP)/img9.png/img10.png(PC) のマイデッキ取得モーダルを確認。『検索結果: 1,000件』が描かれている
- 実装参照: `src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:368-390`
- 実装実態: モーダルには絞り込みとデッキ一覧だけがあり、総件数の表示が無い
- 同じ実装実態でまとまる要求: sheet-13-R091（大会デッキ登録編集）、sheet-13-R092（大会デッキ登録編集 / 実装参照 `src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:390-420`）
- 判定根拠: src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:368-390 のモーダル本文に件数を出す要素が無い
- 確信度: high

### sheet-13-R109 大会デッキ登録編集 — 実装違い／ふるまい／P3

- 正本: sheet-13（大会デッキ登録編集） HTML行 3274 付近
- 正本引用: 「マイデッキを指定したときは、そのデッキの内容で入力を上書きする。上書きするのは選択中のフォーマットの入力欄だけとする。マイデッキのフォーマットがそのイベントで選べるものなら、選択フォーマットをそのデッキのフォーマットに合わせる。」
- 設計期待値: 取り込んだマイデッキのフォーマットがその大会で選べるものなら、選択中のフォーマットがそのデッキのフォーマットへ変わる
- 画像確認: sheet-13_img8.png(SP)/img9.png/img10.png(PC) のマイデッキ取得モーダルを確認
- 実装参照: `src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:119-125`
- 実装実態: 入力欄は上書きされるが、選択中のフォーマットは変わらない(デッキのフォーマットを持っていながら選択に反映しない)
- 判定根拠: src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:119-125 は入力欄への反映だけを行い、フォーマットの選択状態には触れていない
- 確信度: high

### sheet-13-R111 大会デッキ登録編集 — 実装違い／IO／P3

- 正本: sheet-13（大会デッキ登録編集） HTML行 3276 付近
- 正本引用: 「デッキの取得が成功し、かつそのデッキの所有者がログイン中の選手本人であるときだけ上書きする。本人のデッキでないときは上書きしない。 取り込むカード名は、日本語名があれば日本語名を、無ければ英語名を用いる。統率領域のボードに置かれたカードは、メインボードの先頭に足して取り込む。」
- 設計期待値: 統率領域に置かれたカードがメインボードの先頭に足された状態で取り込まれる
- 画像確認: sheet-13_img8.png(SP)/img9.png/img10.png(PC) のマイデッキ取得モーダルを確認
- 実装参照: `src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:392-396; src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:119-125`
- 実装実態: マイデッキのメイン欄・サイド欄のテキストだけを写しており、統率領域の内容は取り込まれない
- 判定根拠: src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:392-396 が画面へ渡すのはメイン・サイドのテキストだけで、src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:119-125 もその2つしか入力欄へ入れない。統率領域のテキストは扱っていない
- 確信度: med

### sheet-13-R118 大会デッキ登録編集 — 実装違い／ふるまい／P3

- 正本: sheet-13（大会デッキ登録編集） HTML行 3283 付近
- 正本引用: 「カード名を囲む二重山括弧は取り除く。分割カードの区切りは、二重スラッシュ・全角プラス・前後に半角スペースを置いたスラッシュのいずれで書かれていても同じ区切りとして扱う。」
- 設計期待値: カード名が二重山括弧で囲まれていても、分割カードの区切りがどの書き方でも、同じカードとして扱われる
- 実装参照: `src/Eccube/Service/Deck/CardListParserService.php:135-140`
- 実装実態: 丸括弧の中身を落とすだけで、二重山括弧の除去も分割カードの区切りの読み替えもしない
- 判定根拠: src/Eccube/Service/Deck/CardListParserService.php:135-140 のカード名整形は丸括弧の除去と前後の空白落としだけ。二重山括弧・区切り記号に触れる処理が無い
- 確信度: med

### sheet-13-R127 大会デッキ登録編集 — 実装違い／ふるまい／P3

- 正本: sheet-13（大会デッキ登録編集） HTML行 3293 付近
- 正本引用: 「フォーマットが送られてこないときは、そのイベントで選べるフォーマットの先頭を選択フォーマットとする。送られてきた値がそのイベントで選べるフォーマットに無いときは確定できないものとして扱う。」
- 設計期待値: フォーマットの指定が無い提出でも、その大会で選べるフォーマットの先頭を選んだものとして登録できる
- 実装参照: `src/Eccube/Controller/Front/Mypage/DeckEntryController.php:118-135`
- 実装実態: 選べるフォーマットが1つ以上あるとき、指定が無い提出は該当なしとして扱われ画面を表示しない
- 判定根拠: src/Eccube/Controller/Front/Mypage/DeckEntryController.php:120-131 は指定値と一致するフォーマットだけを探し、指定が無い場合(0)の既定を持たない。先頭を採るのは選べるフォーマットが1つも無いときだけ(src/Eccube/Controller/Front/Mypage/DeckEntryController.php:122-123)
- 確信度: med

### sheet-13-R131 大会デッキ登録編集 — 実装違い／IO／P3

- 正本: sheet-13（大会デッキ登録編集） HTML行 3297 付近
- 正本引用: 「選手情報の英字の姓名を半角スペースでつないだものをプレイヤー名とする。英字の姓名がいずれも空のときは、会員の住所地が海外なら会員の氏名を、そうでなければ会員の氏名カナを用いる。」
- 設計期待値: 英字の姓名が無い会員のデッキには、住所地が海外なら会員の氏名、そうでなければ会員の氏名カナがプレイヤー名として登録される
- 実装参照: `src/Eccube/Service/Front/Mypage/DeckEntryAction.php:85-107`
- 実装実態: 英字姓名が無いときは選手情報の日本語姓名を使い、それも空なら残った1つを使う。会員の氏名・氏名カナも住所地も見ていない
- 同じ実装実態でまとまる要求: sheet-14-R049（大会デッキ登録確認～完了）
- 判定根拠: src/Eccube/Service/Front/Mypage/DeckEntryAction.php:92-106 の代替はすべて選手情報の姓名で、会員の氏名/氏名カナや海外判定を参照していない
- 確信度: med

### sheet-13-R137 大会デッキ登録編集 — 実装違い／ふるまい／P3

- 正本: sheet-13（大会デッキ登録編集） HTML行 3303 付近
- 正本引用: 「キャンセルを選んだときは、入力中の内容を登録せずにイベント一覧へ戻る。」
- 設計期待値: キャンセルすると入力内容は登録されず、参加した大会の一覧画面へ戻る
- 画像確認: sheet-13_img1.png(SP)/img3.png(PC) の編集画面を確認
- 実装参照: `src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:315; src/Eccube/Resource/template/default/Mypage/event_history.twig:146`
- 実装実態: 登録はされないが、戻り先が大会の一覧ではなくマイページのトップになっている
- 判定根拠: src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:315 の戻り先はマイページトップ。大会一覧は別画面として存在し(src/Eccube/Resource/template/default/Mypage/event_history.twig:146 がこの編集画面への入口、src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:97 も『大会一覧に戻る』でそこへ戻す)
- 確信度: med

### sheet-14-R022 大会デッキ登録確認～完了 — 実装違い／IO／P3

- 正本: sheet-14（大会デッキ登録確認～完了） HTML行 3468 付近
- 正本引用: 「3 大会名 ラベル - - - ()内にフォーマットを表示」
- 設計期待値: 大会名の後ろの括弧内に、その大会に設定されたフォーマットが表示される。
- 画像確認: sheet-14_img3で大会名が「初心者体験会 in アキハバラ(SP)」と括弧付きで描かれていることを確認。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:18`
- 実装実態: 大会名は大会名称だけを出力し、括弧内のフォーマット表示が無い(src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:18、英語版もsrc/Eccube/Resource/template/default/Mypage/deck_entry_check.en.twig:18)。
- 同じ実装実態でまとまる要求: sheet-14-R054（大会デッキ登録確認～完了 / 実装参照 `src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:18;src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:36-40`）
- 判定根拠: レイアウト図では「初心者体験会 in アキハバラ(SP)」と括弧付きで描かれているが、実装は大会名称のみ。フォーマットは別枠でのみ表示される(src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:36-40)。
- 確信度: high

### sheet-14-R034 大会デッキ登録確認～完了 — 実装違い／ふるまい／P3

- 正本: sheet-14（大会デッキ登録確認～完了） HTML行 3480 付近
- 正本引用: 「15 大会一覧に戻る ボタン - - - イベント・大会のトップページに遷移する」
- 設計期待値: 「大会一覧に戻る」を押すと、イベント・大会のトップページが表示される。
- 画像確認: sheet-14_img1/img3（SP/PC完成イメージ）とsheet-14_img2（パンくず）を確認済み。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:97;src/Eccube/Controller/Front/EventTopController.php:46`
- 実装実態: 「大会一覧に戻る」はマイページの大会・デッキ登録履歴一覧へ戻る(src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:97、英語版もsrc/Eccube/Resource/template/default/Mypage/deck_entry_check.en.twig:97)。イベント・大会のトップページは別に用意されている(src/Eccube/Controller/Front/EventTopController.php:46)。
- 判定根拠: 遷移先の画面そのものが設計と異なる。マイページの履歴一覧はログイン会員の参加履歴で、イベント・大会トップとは別画面。
- 確信度: med

### sheet-14-R055 大会デッキ登録確認～完了 — 実装違い／IO／P3

- 正本: sheet-14（大会デッキ登録確認～完了） HTML行 3506 付近
- 正本引用: 「カード画像を持たないカードは代替画像を表示する。」
- 設計期待値: カード画像が登録されていないカードでも、代替の画像が枚数とともに表示される。
- 画像確認: sheet-14_img1/img3（SP/PC完成イメージ）とsheet-14_img2（パンくず）を確認済み。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:70-72;src/Eccube/Resource/template/default/Mypage/deck_entry_check.en.twig:70-72`
- 実装実態: 画像URLが無いカードは画像要素そのものを出力せず、枚数だけが残る(src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:70-72, src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:84-86)。代替画像の差し替えは行っていない。
- 判定根拠: 商品側には代替画像の仕組みがある(src/Eccube/Twig/Extension/EccubeExtension.php:162)が、デッキ登録完了画面では使われていない。
- 確信度: high

### sheet-15-R040 会員情報変更 — 実装違い／IO／P3

- 正本: sheet-15（会員情報変更） HTML行 3680 付近
- 正本引用: 「1-2	お名前(姓)	半角・全角	◯	16	-	・未入力で(1-27)変更するを押下すると、動的に必須入力のエラーメッセージを表示する」
- 設計期待値: お名前(姓)は16文字までしか受け付けず、17文字以上を入力して変更するを押下するとエラーになる。
- 画像確認: img1/img2のお名前欄に桁数の表示は無く、画像からは上限を読み取れない。
- 実装参照: `src/Eccube/Form/Type/NameType.php:99-103; app/config/eccube/packages/eccube.yaml:180; src/Eccube/Resource/template/default/Mypage/change.twig:100-108`
- 実装実態: お名前(姓)の上限は50文字で（src/Eccube/Form/Type/NameType.php:101 が参照する app/config/eccube/packages/eccube.yaml:180 の値が50）、入力欄にも桁数の上限指定が無い（src/Eccube/Resource/template/default/Mypage/change.twig:100-108）。17〜50文字がそのまま登録できる。
- 同じ実装実態でまとまる要求: sheet-15-R041（会員情報変更 / 実装参照 `src/Eccube/Form/Type/NameType.php:110-118; app/config/eccube/packages/eccube.yaml:180; src/Eccube/Resource/template/default/Mypage/change.twig:117-125`）、sheet-16-R060（配送先新規登録・変更 / 実装参照 `src/Eccube/Form/Type/Front/CustomerAddressType.php:68-70;src/Eccube/Form/Type/NameType.php:100-110;app/config/eccube/packages/eccube.yaml:180`）、sheet-18-R038（お問い合わせ / 実装参照 `src/Eccube/Form/Type/Front/ContactType.php:58-60;src/Eccube/Form/Type/NameType.php:103-112;app/config/eccube/packages/eccube.yaml:180`）、sheet-3-R032（新規会員登録 / 実装参照 `app/config/eccube/packages/eccube.yaml:180; src/Eccube/Form/Type/NameType.php:103-111`）、sheet-3-R033（新規会員登録 / 実装参照 `app/config/eccube/packages/eccube.yaml:180; src/Eccube/Form/Type/NameType.php:117-125`）
- 判定根拠: 設計の最大文字数16に対し、実装は50文字まで通す。必須入力の動的エラー表示側は実装されている（change.twig:103-104）。
- 確信度: med

### sheet-15-R042 会員情報変更 — 実装違い／IO／P3

- 正本: sheet-15（会員情報変更） HTML行 3682 付近
- 正本引用: 「1-4	フリガナ(姓)	半角・全角	◯	25	-	・未入力で(1-27)変更するを押下すると、動的に必須入力のエラーメッセージを表示する」
- 設計期待値: フリガナ(姓)は25文字までしか受け付けず、26文字以上を入力して変更するを押下するとエラーになる。
- 画像確認: img1/img2のフリガナ欄に桁数の表示は無い。
- 実装参照: `src/Eccube/Form/Type/KanaType.php:55-66; app/config/eccube/packages/eccube.yaml:181; src/Eccube/Resource/template/default/Mypage/change.twig:154-162`
- 実装実態: フリガナ(姓)の上限は50文字で（src/Eccube/Form/Type/KanaType.php:61-63 が参照する app/config/eccube/packages/eccube.yaml:181 の値が50）、入力欄にも桁数の上限指定が無い（src/Eccube/Resource/template/default/Mypage/change.twig:154-162）。
- 同じ実装実態でまとまる要求: sheet-15-R043（会員情報変更 / 実装参照 `src/Eccube/Form/Type/KanaType.php:69-80; app/config/eccube/packages/eccube.yaml:181; src/Eccube/Resource/template/default/Mypage/change.twig:171-179`）
- 判定根拠: 設計の最大文字数25に対し、実装は50文字まで通す。
- 確信度: med

### sheet-15-R075 会員情報変更 — 実装違い／ふるまい／P3

- 正本: sheet-15（会員情報変更） HTML行 3715 付近
- 正本引用: 「1-28	戻る	ボタン	-	-	-	・押下すると、ECTOP画面へ遷移する」
- 設計期待値: 会員情報変更(入力)画面の戻るボタンを押すと、本店ECTOP画面が表示される。
- 画像確認: img1/img2の「戻る」ボタンの遷移先は画像からは読み取れない。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/change.twig:690`
- 実装実態: 戻るボタンの遷移先がマイページになっており、ECTOP画面には遷移しない（src/Eccube/Resource/template/default/Mypage/change.twig:690）。
- 判定根拠: 同じ設計書の完了画面側（2-2 戻る）は本店ECTOPへ遷移する実装（src/Eccube/Resource/template/default/Mypage/change_complete.twig:48-50）になっており、入力画面側だけ遷移先が異なる。
- 確信度: med

### sheet-16-R025 配送先新規登録・変更 — 実装違い／IO／P3

- 正本: sheet-16（配送先新規登録・変更） HTML行 3875 付近
- 正本引用: 「1-8 マイページ ボタン - - - ・押下すると、マイページに遷移する」
- 設計期待値: 配送先一覧画面の最下部ボタンのラベルを「マイページ」と表示する。
- 画像確認: 一覧レイアウト図（img2）の下部ボタンは「マイページ」表記
- 実装参照: `src/Eccube/Resource/locale/messages.ja.yaml:768;src/Eccube/Resource/template/default/Mypage/delivery.twig:134`
- 実装実態: ラベルが「マイページへ戻る」と表示される（src/Eccube/Resource/locale/messages.ja.yaml:768 front.mypage.button.back_to_mypage、src/Eccube/Resource/template/default/Mypage/delivery.twig:134）。遷移先はマイページで設計どおり
- 判定根拠: 遷移先は設計どおりだが、項目表のラベル欄とレイアウト図の表記「マイページ」に対して実装の表示文言が異なる。同シートの他ラベル（新しい住所を追加/編集/削除/戻る/登録する/会員情報住所 / Membership Information Address）はいずれも逐語一致しており、ラベル欄が画面文言であることは一貫している
- 確信度: med

### sheet-16-R061 配送先新規登録・変更 — 実装違い／IO／P3

- 正本: sheet-16（配送先新規登録・変更） HTML行 3961 付近
- 正本引用: 「2-5 配送先氏名(名) 半角・全角 ◯ 16 - ・未入力で(2-27)変更するを押下すると、動的に必須入力のエラーメッセージを表示する」
- 設計期待値: 配送先氏名(名)は16文字を超える入力を受け付けない。
- 実装参照: `src/Eccube/Form/Type/Front/CustomerAddressType.php:68-70;src/Eccube/Form/Type/NameType.php:114-124;app/config/eccube/packages/eccube.yaml:180`
- 実装実態: 配送先氏名(名)は50文字まで受け付ける（src/Eccube/Form/Type/NameType.php:118-119 が app/config/eccube/packages/eccube.yaml:180 の eccube_name_len=50 を上限にしている）。画面側にも文字数の上限指定は無い（src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:128-136）
- 同じ実装実態でまとまる要求: sheet-16-R062（配送先新規登録・変更 / 実装参照 `src/Eccube/Form/Type/Front/CustomerAddressType.php:71-97;app/config/eccube/packages/eccube.yaml:181`）、sheet-16-R063（配送先新規登録・変更 / 実装参照 `src/Eccube/Form/Type/Front/CustomerAddressType.php:71-97;app/config/eccube/packages/eccube.yaml:181`）
- 判定根拠: R060と同一の欠陥。姓・名とも同じ設定値を上限にしている
- 確信度: med

### sheet-16-R075 配送先新規登録・変更 — 実装違い／IO／P3

- 正本: sheet-16（配送先新規登録・変更） HTML行 3975 付近
- 正本引用: 「2-16 確認画面へ ボタン - - - ・押下すると、フォームに入力した情報で入力チェックを実施し、入力チェックが正常に完了した場合は登録/更新を行い、エラーが発生した場合はエラーメッセージを画面に表示する」
- 設計期待値: 入力・変更画面の送信ボタンのラベルを「確認画面へ」と表示する。
- 画像確認: 入力レイアウト図（img4/img5）の送信ボタンは「確認画面へ」表記
- 実装参照: `src/Eccube/Resource/locale/messages.ja.yaml:1526;src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:500-503`
- 実装実態: ボタンのラベルが「確認する」と表示される（src/Eccube/Resource/locale/messages.ja.yaml:1526 front.shopping.go_to_confirm、src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:501）。押下時の入力チェックと確認画面への遷移、エラー時の画面表示（src/Eccube/Controller/Front/Mypage/DeliveryController.php:171-188、src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:90-91）は設計どおり
- 判定根拠: 挙動は設計どおりだが表示文言だけが異なる。同シートの他ラベルは逐語一致しており、ラベル欄が画面文言であることは一貫している
- 確信度: med

### sheet-16-R126 配送先新規登録・変更 — 実装違い／IO／P3

- 正本: sheet-16（配送先新規登録・変更） HTML行 4054 付近
- 正本引用: 「配送先氏名カナは日本語ページでだけ表示する。海外言語ページでは入力欄も確認画面の表示も設けない。」
- 設計期待値: 海外言語ページでは、配送先の入力画面にも確認画面にも配送先氏名フリガナの欄・行を出さない。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/delivery_confirm.twig:74-79;src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:1-449`
- 実装実態: 入力画面は海外言語ページ用の版でフリガナ欄を外している（src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig に kana の入力欄が無い）が、確認画面は言語別の版が無く日本語版が共用されるため（src/Eccube/Resource/template/default/Mypage/delivery_confirm.twig:74-79）、海外言語ページでもフリガナの行が見出しごと表示される
- 判定根拠: 入力側は設計どおりだが確認側だけ未対応。確認画面のフリガナ行は言語の条件なしで描かれている（src/Eccube/Resource/template/default/Mypage/delivery_confirm.twig:74-79）
- 確信度: med

### sheet-16-R128 配送先新規登録・変更 — 実装違い／ふるまい／P3

- 正本: sheet-16（配送先新規登録・変更） HTML行 4056 付近
- 正本引用: 「新規登録では、会員の配送先数が上限（20件）以上のとき登録できない。上限に達しているときはエラーを表示して配送先一覧へ戻し、入力画面・確認画面へ進ませない。判定は入力画面と確認画面の双方で行う。既存の配送先を編集する経路（識別子ありの経路）では上限を判定しない。」
- 設計期待値: 新規登録で配送先数が上限に達しているときは、配送先一覧へ戻したうえで一覧上部にエラーを表示する。入力画面・確認画面のどちらから来ても同じ扱いにする。
- 実装参照: `src/Eccube/Controller/Front/Mypage/DeliveryController.php:88-96;src/Eccube/Controller/Front/Mypage/DeliveryController.php:204-217`
- 実装実態: 入力画面では上限到達時に一覧へ戻さずHTTP404を返す（src/Eccube/Controller/Front/Mypage/DeliveryController.php:93-95）ため、利用者にはエラー文言が出ず一覧にも戻らない。確認画面から登録を確定する側（src/Eccube/Controller/Front/Mypage/DeliveryController.php:204-217）には上限の判定が無い。上限の値20と、編集経路で判定しない点（src/Eccube/Controller/Front/Mypage/DeliveryController.php:90）は設計どおり
- 同じ実装実態でまとまる要求: sheet-16-R140（配送先新規登録・変更 / 実装参照 `src/Eccube/Controller/Front/Mypage/DeliveryController.php:88-96`）、sheet-16-R147（配送先新規登録・変更 / 実装参照 `src/Eccube/Controller/Front/Mypage/DeliveryController.php:88-96;src/Eccube/Controller/Front/Mypage/DeliveryController.php:98-108`）
- 判定根拠: [gate7/refute] 重要度を P3 へ。事実関係は確認できた。src/Eccube/Controller/Front/Mypage/DeliveryController.php:90-95 は上限到達時に NotFoundHttpException を投げ、一覧へのリダイレクトもエラー文言も無い。確認確定側 :204-217 には上限判定が無い。ただし一覧画面は src/Eccube/Resource/template/default/ 上限到達時の扱いが「エラー表示＋一覧へ戻す」ではなくHTTP404になっている。上限超過の文言は実装のどこにも無い（「お届け先登録数の上限を超えています。」は src/Eccube/Resource/locale/messages.ja.yaml に存在しない）
- 確信度: high

### sheet-16-R130 配送先新規登録・変更 — 未実装／ふるまい／P3

- 正本: sheet-16（配送先新規登録・変更） HTML行 4058 付近
- 正本引用: 「国が日本で都道府県が国外を指すとき、または国が日本以外で都道府県が国内の都道府県を指すときは不整合とし、送信後の検証で国にエラーを付ける。国と都道府県のどちらかが未選択のときは、この整合判定を行わない。」
- 設計期待値: 国が日本で都道府県が「日本国外」のとき、または国が日本以外で都道府県が国内の都道府県のときは、国の項目にエラーを付けて登録させない。
- 実装参照: `src/Eccube/Form/Type/Front/CustomerAddressType.php:152-188;src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:305-316`
- 実装実態: 国と都道府県の組み合わせを見る検証が無い（src/Eccube/Form/Type/Front/CustomerAddressType.php:152-188 には郵便番号と海外時の都道府県の確定しかない）。都道府県の選択肢は master をそのまま出すため（src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:307-313）、国が日本のままで「日本国外」を選んでもエラーにならず登録できる。国が日本以外のときは都道府県を「日本国外」で確定するため（src/Eccube/Form/Type/Front/CustomerAddressType.php:185-186）その向きの不整合は起きない
- 同じ実装実態でまとまる要求: sheet-16-R141（配送先新規登録・変更 / 実装参照 `src/Eccube/Form/Type/Front/CustomerAddressType.php:152-188`）
- 判定根拠: 組み合わせの検証そのものが実装されていない。対応する文言も実装に無い（「国と都道府県の組み合わせが正しくありません。」は locale に存在しない）
- 確信度: high

### sheet-16-R143 配送先新規登録・変更 — 実装違い／IO／P3

- 正本: sheet-16（配送先新規登録・変更） HTML行 4072 付近
- 正本引用: 「削除対象が無い・会員に紐づかない HTTP404とする」
- 設計期待値: 削除で対象の配送先が無いとき、およびログイン会員に紐づかない配送先を指定したときは、HTTP404を返す。
- 実装参照: `src/Eccube/Controller/Front/Mypage/DeliveryController.php:255-266`
- 実装実態: 存在しない識別子のときは404になるが（src/Eccube/Controller/Front/Mypage/DeliveryController.php:255 の識別子の条件）、他の会員に紐づく配送先を指定したときは404ではなくHTTP400を返す（src/Eccube/Controller/Front/Mypage/DeliveryController.php:264-266）
- 判定根拠: 削除経路だけ、会員に紐づかないときの応答が設計の404と異なる。入力・確認画面側（R132/R142）は404で設計どおり
- 確信度: med

### sheet-16-R149 配送先新規登録・変更 — 実装違い／IO／P3

- 正本: sheet-16（配送先新規登録・変更） HTML行 4081 付近
- 正本引用: 「更新 削除済みへの変更による配送先の削除」
- 設計期待値: 配送先の削除は、記録を残したまま削除済みの状態へ変える。
- 実装参照: `src/Eccube/Repository/CustomerAddressRepository.php:43-48`
- 実装実態: 削除は記録そのものを消している（src/Eccube/Repository/CustomerAddressRepository.php:46）
- 判定根拠: R136と同一の欠陥。永続化の表でも削除は更新として書かれている
- 確信度: med

### sheet-17-R061 退会 — 未実装／ふるまい／P3

- 正本: sheet-17（退会） HTML行 4295 付近
- 正本引用: 「退会完了メールの送信内容を、会員のメール送信履歴として残す」
- 設計期待値: 退会完了メールを送ったとき、その件名と本文が当該会員のメール送信履歴として残り、後から会員ごとに参照できる。
- 画像確認: sheet-17_img1〜img6の6枚すべてを確認した。
- 実装参照: `src/Eccube/Service/MailService.php:253-307`
- 実装実態: 退会完了メールは送信するだけで、送信内容を会員のメール送信履歴として残していない。他の会員向けメールは送信後に履歴を残している（src/Eccube/Service/MailService.php:1195,1229,2052）。
- 判定根拠: 退会完了メールの送信処理を全文確認したが履歴保存の呼び出しが無く、退会経路の他の場所にも履歴を残す処理が無い。
- 確信度: high

### sheet-18-R037 お問い合わせ — 未実装／IO／P3

- 正本: sheet-18（お問い合わせ） HTML行 4442 付近
- 正本引用: 「1-3 件名（タイトル） 単一選択(セレクトボックス) ◯ - 通販に関するお問い合わせ ・マスターデータから選択肢を取得する。 1 通販に関するお問い合わせ 2 ネット買取に関するお問い合わせ 3 店舗でのお買い物・イベントに関するお問い合わせ 4 委託販売に関するお問い合わせ 5 デッキ構築機能に関するお問い合わせ 6 記事・動画に関するお問い合わせ 7 その他のお問い合わせ 8 協賛関連」
- 設計期待値: 件名（タイトル）の選択肢に「協賛関連」が表示され、選択して問い合わせを送信できる
- 画像確認: img1/img2/img4/img5/img6（お問い合わせ入力画面のレイアウト図）を確認。図の件名セレクトにも協賛関連は写っていないが、正本の項目表が選択肢を8件と定義している
- 実装参照: `app/DoctrineMigrations/Version20251125141030.php:63-128;src/Eccube/Form/Type/Front/ContactType.php:88-102`
- 実装実態: 件名マスタに登録されるのは1〜7の7件のみで（app/DoctrineMigrations/Version20251125141030.php:63-128）、8件目の「協賛関連」に相当するデータが無い。選択肢はマスタから取得するため（src/Eccube/Form/Type/Front/ContactType.php:88-102）、画面の件名に「協賛関連」が出ない
- 判定根拠: [gate7/refute] 重要度を P3 へ。事実関係は反証できず成立する。正本 sheets/sheet-18.txt:82-90 が件名の選択肢を1〜8として列挙し8に「協賛関連」を挙げるのに対し、種データは7件しか登録しない（/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125141030.php:62-127、他6件は名 設計は件名の選択肢を1〜8として列挙し、8に「協賛関連」を挙げている。ee のマスタ登録は7件で、他の7件は名称・順序とも一致するが8件目だけが存在しない
- 確信度: high

### sheet-18-R041 お問い合わせ — 実装違い／IO／P3

- 正本: sheet-18（お問い合わせ） HTML行 4446 付近
- 正本引用: 「1-5 氏名(名) 半角・全角 ◯ 16 - ・未入力で(1-9)確認画面へを押下すると、動的に必須入力のエラーメッセージを表示する」
- 設計期待値: 氏名(名)は16文字を超える入力を受け付けず、超えたときは確認画面へ進めない
- 画像確認: img1/img2/img4/img5/img6（お問い合わせ入力画面のレイアウト図）を確認
- 実装参照: `src/Eccube/Form/Type/Front/ContactType.php:58-60;src/Eccube/Form/Type/NameType.php:117-126;app/config/eccube/packages/eccube.yaml:180`
- 実装実態: 氏名は NameType の既定長で検証され（src/Eccube/Form/Type/NameType.php:117-126）、上限は eccube_name_len=50（app/config/eccube/packages/eccube.yaml:180）。お問い合わせ画面では上限を上書きしていない（src/Eccube/Form/Type/Front/ContactType.php:58-60）ため、17〜50文字も受け付けて確認画面へ進む
- 判定根拠: 項目表は1-5の最大文字数を16と定めるが、実装の上限は50文字。入力欄にも maxlength 指定が無い
- 確信度: med

### sheet-18-R068 お問い合わせ — 実装違い／IO／P3

- 正本: sheet-18（お問い合わせ） HTML行 4473 付近
- 正本引用: 「4-5 イベント実施店舗 単一選択(セレクトボックス) ◯ - - ・管理画面＞モール設定＞店舗登録に登録されている全店舗名を選択肢とする」
- 設計期待値: イベント実施店舗の選択肢に、店舗登録された全店舗が表示される
- 画像確認: img1/img2/img4/img5/img6（お問い合わせ入力画面のレイアウト図）を確認
- 実装参照: `src/Eccube/Form/Type/Front/ContactType.php:141-154`
- 実装実態: イベント実施店舗の選択肢は公開かつ営業中の店舗に絞られている（src/Eccube/Form/Type/Front/ContactType.php:147-152）。閉店・非公開の店舗は選べない
- 判定根拠: 項目表は4-2のお問い合わせ店舗選択にだけ「閉店または非公開の店舗を除く」条件を置き、4-5のイベント実施店舗は全店舗としている。実装は4-5にも4-2と同じ絞り込みを適用している
- 確信度: med

### sheet-19-R021 お問い合わせ履歴 — 実装違い／IO／P3

- 正本: sheet-19（お問い合わせ履歴） HTML行 4705 付近
- 正本引用: 「お問い合わせが1件も無いときも、件数欄には「0件」を表示する。」
- 設計期待値: お問い合わせ履歴が1件も無いときも、一覧画面の件数欄に「0件」が表示される。
- 画像確認: sheet-19_img1/img2 は3件のケースで、0件時のレイアウトは図に無い。
- 実装参照: `src/Eccube/Resource/template/default/Contact/history.twig:17-25;src/Eccube/Resource/template/default/Contact/history.en.twig:17-25`
- 実装実態: src/Eccube/Resource/template/default/Contact/history.twig:17 で履歴が空のときは件数欄を含むブロックごと描画しないため、0件のときは件数欄が画面に出ず「お問い合わせ履歴はありません。」だけが表示される。
- 判定根拠: 件数欄は src/Eccube/Resource/template/default/Contact/history.twig:19-25 にあるが、src/Eccube/Resource/template/default/Contact/history.twig:17 の分岐で履歴が空のときは出力されない。同ブロックの改行反映（src/Eccube/Resource/template/default/Contact/history_detail.twig:41 の nl2br）は実装済みで、差分は0件時の件数欄のみ。リニューアル後の仕様の空メッセージは画面上部の別位置であり、件数欄の表示要求と両立する。
- 確信度: med

### sheet-19-R023 お問い合わせ履歴 — 実装違い／IO／P3

- 正本: sheet-19（お問い合わせ履歴） HTML行 4707 付近
- 正本引用: 「送信日時の書式は、日本語表示時は一覧が Y年m月d日 H:i、詳細が Y/m/d H:i、英語表示時は一覧・詳細とも m/d/Y H:i とする。」
- 設計期待値: 日本語表示のお問い合わせ履歴一覧では、送信日時が「2025年09月26日 13:10」のように年月日を漢字で区切った書式で表示される。
- 画像確認: sheet-19_img1/img2 のレイアウト図でも一覧は「2025年09月26日 13:10」と表示されており、設計側の書式を裏付ける。
- 実装参照: `src/Eccube/Resource/template/default/Contact/history.twig:32-36`
- 実装実態: src/Eccube/Resource/template/default/Contact/history.twig:33 で日本語表示時の一覧の日時を「2025/09/26 13:10」の形式で出力しており、年月日を漢字で区切る書式になっていない。詳細（src/Eccube/Resource/template/default/Contact/history_detail.twig:18）と英語表示（src/Eccube/Resource/template/default/Contact/history.twig:35）は設計どおり。
- 判定根拠: 設計は一覧と詳細で日本語表示時の書式を書き分けているが、実装は一覧も詳細と同じスラッシュ区切りにしている。リニューアル後の仕様には日時書式の記述が無く、現行仕様の書式が踏襲対象。
- 確信度: high

### sheet-23-R021 【新規】パスワード設定（ポリシー違反用） — 実装違い／ふるまい／P3

- 正本: sheet-23（【新規】パスワード設定（ポリシー違反用）） HTML行 5186 付近
- 正本引用: 「5 TOPへ戻る ボタン - - - ・押下すると、TOP画面へ遷移する」
- 設計期待値: パスワード変更完了画面のボタンは「TOPへ戻る」で、押下するとサイトのTOP画面が表示される。
- 画像確認: sheet-23_img2（完了画面のレイアウト図）は「パスワードを変更しました。」の下に「TOPページへ戻る」ボタンを描いており、識別ID5の遷移先がTOP画面であることを裏付ける。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/password_change_complete.twig:22-24;src/Eccube/Resource/template/default/Mypage/password_change_complete.en.twig:22-24`
- 実装実態: src/Eccube/Resource/template/default/Mypage/password_change_complete.twig:23 の完了画面のボタンは「マイページへ戻る」で、押下するとマイページが表示される。TOP画面へ戻る導線は完了画面に無い。
- 判定根拠: 完了画面 src/Eccube/Resource/template/default/Mypage/password_change_complete.twig:22-24（英語版 src/Eccube/Resource/template/default/Mypage/password_change_complete.en.twig:22-24）のリンク先はマイページで、文言もマイページへ戻るになっている。TOP画面へ戻る文言は別画面（マイページ）でのみ使われており、完了画面では使われていない。
- 確信度: high

### sheet-3-R034 新規会員登録 — 実装違い／IO／P3

- 正本: sheet-3（新規会員登録） HTML行 1175 付近
- 正本引用: 「1-4 フリガナ(姓) 半角・全角 ◯ 25 - ・未入力で(1-26)同意するを押下すると、動的に必須入力のエラーメッセージを表示する」
- 設計期待値: フリガナ(姓)は25文字を超える入力を受け付けず、超過時は文字数超過として登録できない。
- 画像確認: レイアウト図(sheet-3_img3)には文字数の記載が無く、判断材料は項目表のみ。
- 実装参照: `app/config/eccube/packages/eccube.yaml:181; src/Eccube/Form/Type/KanaType.php:56-64`
- 実装実態: フリガナ(姓)の文字数上限が50文字として検査されるため、26〜50文字のフリガナがそのまま受け付けられる。
- 同じ実装実態でまとまる要求: sheet-3-R035（新規会員登録 / 実装参照 `app/config/eccube/packages/eccube.yaml:181; src/Eccube/Form/Type/KanaType.php:70-78`）
- 判定根拠: 上限値は app/config/eccube/packages/eccube.yaml:181 の 50 で、フリガナの検査に使われている（src/Eccube/Form/Type/KanaType.php:56-64）。現行仕様の同項目は25文字（pf-eccube3 constant.yml.dist の kana_len)。
- 確信度: med

### sheet-4-R013 本会員登録 — 未実装／ふるまい／P3

- 正本: sheet-4（本会員登録） HTML行 1471 付近
- 正本引用: 「3　2のチェックで存在したユーザーがすでにスマレジIDを持っていないかを確認」
- 設計期待値: 秘密鍵で見つかった仮会員が既にスマレジ会員IDを持っている場合は、会員登録済みとして本会員化を行わずエラー画面を出す
- 実装参照: `src/Eccube/Controller/Front/EntryController.php:284-333;src/Eccube/Repository/Views/RegisterCustomerViewRepository.php:113-134`
- 実装実態: src/Eccube/Controller/Front/EntryController.php:284-294 は仮会員の有無と本会員済みの有無しか見ておらず、見つかった仮会員がスマレジIDを持つかどうかを確認していない。スマレジID保持の判定は本会員化後の連携処理 src/Eccube/Controller/Front/EntryController.php:355-360 にしかなく、そこでは「既に連携済みなら何もしない」として正常完了扱いになる。
- 同じ実装実態でまとまる要求: sheet-4-R014（本会員登録 / 実装参照 `src/Eccube/Controller/Front/EntryController.php:284-333`）、sheet-4-R042（本会員登録 / 実装参照 `src/Eccube/Controller/Front/EntryController.php:284-294;src/Eccube/Controller/Front/EntryController.php:355-360`）
- 判定根拠: src/Eccube/Repository/Views/RegisterCustomerViewRepository.php:113-119 の本会員済み判定は customer_status_id しか見ておらず、スマレジIDを参照する検索は本会員登録の入口処理に存在しない。
- 確信度: high

### sheet-4-R017 本会員登録 — 実装違い／IO／P3

- 正本: sheet-4（本会員登録） HTML行 1475 付近
- 正本引用: 「・2,3の条件でエラーになった場合、E-2.ユーザー存在チェックエラー画面を表示」
- 設計期待値: 秘密鍵の書式は正しいがその秘密鍵を持つユーザーが見つからないときは、ユーザー存在チェックエラー画面（完了済みです。／既に会員登録が完了されております。）を表示する
- 画像確認: sheet-4_img2.png=E-1「アクセスできません。」/ sheet-4_img3.png=E-2「完了済みです。」で、2画面の文言が別物であることを確認。
- 実装参照: `src/Eccube/Controller/Front/EntryController.php:286-294;src/Eccube/Controller/Front/EntryController.php:265-268;src/Eccube/Resource/locale/messages.ja.yaml:451-454`
- 実装実態: src/Eccube/Controller/Front/EntryController.php:288-293 は、仮会員が取れず本会員としても取れないときに EntryInvalidSecretKeyException を投げ、src/Eccube/Controller/Front/EntryController.php:267-268 で error_type=forbidden、すなわちE-1の「アクセスできません。」画面を表示する。E-2の「完了済みです。」画面が出るのは本会員として取れたときだけ。
- 同じ実装実態でまとまる要求: sheet-4-R041（本会員登録 / 実装参照 `src/Eccube/Controller/Front/EntryController.php:286-294;src/Eccube/Controller/Front/EntryController.php:265-268`）
- 判定根拠: 設計はユーザー存在チェック（条件2）の失敗をE-2に割り当てているが、実装は書式エラー用のE-1画面を返す。表示される見出し・本文が設計と異なる。
- 確信度: med

### sheet-4-R053 本会員登録 — 未実装／ふるまい／P3

- 正本: sheet-4（本会員登録） HTML行 1531 付近
- 正本引用: 「直前の商品検索の戻り先が残っているときは、本登録完了画面を表示せずその戻り先へ移す。移した時点で戻り先は消え、以後は残らない。」
- 設計期待値: 本会員登録が完了したとき、直前の商品検索の戻り先が残っていれば本登録完了画面を出さずにその画面へ移し、移した後は戻り先が残らない
- 実装参照: `src/Eccube/Controller/Front/EntryController.php:233-274;src/Eccube/Resource/template/default/Entry/activate.twig:1-31`
- 実装実態: src/Eccube/Controller/Front/EntryController.php:255-263 は本会員化のあと常に activate.twig（本登録完了画面）を返しており、直前の商品検索の戻り先へ移す分岐が無い。src/Eccube/Controller/Front/EntryController.php:248-251 で扱うのはログイン後の既定遷移先の設定だけで、完了画面の表示を省く処理は存在しない。
- 判定根拠: 戻り先へ移す挙動に対応する実装がフロント側に見当たらない。リニューアル後の表示メッセージ表も完了画面の表示条件を「商品検索の戻り先が無いとき」としており、戻り先がある場合の分岐が前提になっている。
- 確信度: med

### sheet-5-R050 ログイン — 実装違い／ふるまい／P3

- 正本: sheet-5（ログイン） HTML行 1708 付近
- 正本引用: 「店舗基本情報でログイン状態の保持が有効なときに、保持の選択欄を表示する。保持を有効にした場合は、ログイン状態を既定で1年間保持する。」
- 設計期待値: ログイン状態の保持を有効にしたとき、その状態は既定で1年間続く
- 画像確認: sheet-5_img1.png（リニューアル後レイアウト図）に保持の選択欄は無い。sheet-5_img2.png は現行画面の例で「次回から自動的にログインする」欄がある。
- 実装参照: `app/config/eccube/packages/security.yaml:73-81;src/Eccube/Resource/template/default/Mypage/login.twig:70-72`
- 実装実態: app/config/eccube/packages/security.yaml:75 の会員側の保持期間が 86400 秒（1日）に設定されており、保持を有効にしても1日で切れる。
- 判定根拠: 保持期間は利用者が再ログインを求められるまでの時間として画面のふるまいに現れる。設計の「既定で1年間」に対し実装は1日。なお保持の選択欄自体はリニューアル後のレイアウト図・項目定義（識別ID1〜6）に無く、src/Eccube/Resource/template/default/Mypage/login.twig:70-72 が選択欄を出さずに保持を有効として送る形になっているため、選択欄の有無は指摘に含めない。
- 確信度: med

### sheet-5-R052 ログイン — 実装違い／ふるまい／P3

- 正本: sheet-5（ログイン） HTML行 1710 付近
- 正本引用: 「遷移先の指定があればその指定先へ、無ければ既定の遷移先へ進む。ログアウトすると会員の認証状態を終了し、直前に見ていた画面へ戻す。直前の画面が分からないときはトップへ戻す。」
- 設計期待値: ログアウトしたときは直前に見ていた画面へ戻り、直前の画面が分からないときだけトップへ戻る
- 実装参照: `app/config/eccube/packages/security.yaml:95-97;src/Eccube/Security/Http/Authentication/EccubeLogoutSuccessHandler.php:27-33`
- 実装実態: app/config/eccube/packages/security.yaml:95-97 のログアウト後の遷移先が常に homepage に固定されており、src/Eccube/Security/Http/Authentication/EccubeLogoutSuccessHandler.php:27-33 にも直前の画面へ戻す処理は無い。ログイン後の遷移（指定先／既定先）は src/Eccube/Resource/template/default/Mypage/login.twig:38-43 と app/config/eccube/packages/security.yaml:84 で設計どおり。
- 判定根拠: ログイン後の遷移は一致するが、ログアウト後は直前の画面に関わらず常にトップへ戻る。
- 確信度: med

### sheet-6-R050 パスワード再発行 — 実装違い／IO／P3

- 正本: sheet-6（パスワード再発行） HTML行 1846 付近
- 正本引用: 「・1の条件でエラーになった場合、E-1. リセットキー書式エラー画面を表示」
- 設計期待値: リセットキーの書式が不正なURLでアクセスしたとき、「アクセスできません。」「お探しのページはアクセスができない状況にあるか、移動もしくは削除された可能性があります。」を本文とし「トップページへ」ボタンを持つエラー画面が表示される
- 画像確認: img7: E-1 は「アクセスできません。」「お探しのページはアクセスができない状況にあるか、移動もしくは削除された可能性があります。」＋「トップページへ」ボタン
- 実装参照: `src/Eccube/Controller/Front/ForgotController.php:184-187;src/Eccube/EventListener/ExceptionListener.php:159-186`
- 実装実態: 書式エラー時は src/Eccube/Controller/Front/ForgotController.php:186 でページ不存在として扱われ、src/Eccube/EventListener/ExceptionListener.php:180-183 の分岐により「ページがみつかりません。」「URLに間違いがないかご確認ください。」（src/Eccube/Resource/locale/messages.ja.yaml:3819-3820）のエラー画面が出る。E-1で指定された文言の画面は表示されない。
- 同じ実装実態でまとまる要求: sheet-6-R051（パスワード再発行 / 実装参照 `src/Eccube/Controller/Front/ForgotController.php:192-195;src/Eccube/EventListener/ExceptionListener.php:180-183`）、sheet-6-R081（パスワード再発行 / 実装参照 `src/Eccube/Controller/Front/ForgotController.php:176-187;src/Eccube/EventListener/ExceptionListener.php:180-183`）、sheet-6-R087（パスワード再発行 / 実装参照 `src/Eccube/Controller/Front/ForgotController.php:189-195;src/Eccube/EventListener/ExceptionListener.php:180-183`）、sheet-6-R098（パスワード再発行 / 実装参照 `src/Eccube/Controller/Front/ForgotController.php:184-187;src/Eccube/EventListener/ExceptionListener.php:180-183`）、sheet-6-R100（パスワード再発行 / 実装参照 `src/Eccube/Controller/Front/ForgotController.php:189-195;src/Eccube/EventListener/ExceptionListener.php:180-183`）
- 判定根拠: [gate7/refute] 重要度を P3 へ。事実は成立。引用「・1の条件でエラーになった場合、E-1. リセットキー書式エラー画面を表示」は sheets/sheet-6.txt に逐語で実在し、画像 sheet-6_img7.png が E-1＝「アクセスできません。／お探しのページはアクセスができない状況にあるか、移動もしくは削除された可能性があります。」＋「トップページへ」であることを裏付ける。実装は src/Eccube/Contr [gate7/refute] 重要度をP3へ。共通エラー画面のtitle/messageの選択違いのみで、error.twigの同一画面・同一「トップページへ」導線が出るため業務は回る（規約: 文言差はP3）。 ee には E-1 の文言（src/Eccube/Resource/locale/messages.ja.yaml:3815-3816）が別状態として存在するが、当機能からは到達しない。
- 確信度: high

### sheet-6-R077 パスワード再発行 — 実装違い／IO／P3

- 正本: sheet-6（パスワード再発行） HTML行 1880 付近
- 正本引用: 「4-2戻るボタン---・押下すると、ECTOP画面へ遷移する」
- 設計期待値: パスワード再設定完了画面のボタンは「戻る」と表示され、押下するとECTOPへ遷移する
- 画像確認: img6: 再設定完了画面のボタン文言は「戻る」
- 実装参照: `src/Eccube/Resource/template/default/Forgot/reset_complete.twig:22`
- 実装実態: 遷移先はECTOPで設計どおりだが、ボタン文言が「ホームへ戻る」（src/Eccube/Resource/locale/messages.ja.yaml:505 の共通文言を流用）になっており「戻る」ではない。
- 判定根拠: 遷移先は src/Eccube/Resource/template/default/Forgot/reset_complete.twig:22 の url('homepage') で一致。差は表示文言のみ。
- 確信度: med

### sheet-6-R104 パスワード再発行 — 未実装／ふるまい／P3

- 正本: sheet-6（パスワード再発行） HTML行 1921 付近
- 正本引用: 「貼り付け操作を受け付けず、警告を表示して貼り付けを取り消す」
- 設計期待値: 新しいパスワード（確認）欄では貼り付け操作が受け付けられず、警告が表示されて貼り付けた内容が取り消される
- 画像確認: img4/img5: 確認欄の下は「（確認のためもう一度入力してください）」の常時表示のみ
- 実装参照: `src/Eccube/Resource/template/default/Forgot/reset.twig:70-90`
- 実装実態: 確認欄（src/Eccube/Resource/template/default/Forgot/reset.twig:70-90）には貼り付けを取り消す仕掛けが無く、貼り付けはそのまま入力される。フロント側の共通スクリプトにも当欄向けの貼り付け抑止は無い。
- 判定根拠: html/template/default/assets 以下のフロントスクリプトを検索したが、当画面向けの貼り付け抑止は見つからなかった（唯一の paste 参照は選択入力部品のもので当欄とは無関係）。
- 確信度: med

### sheet-6-R105 パスワード再発行 — 実装違い／IO／P3

- 正本: sheet-6（パスワード再発行） HTML行 1922 付近
- 正本引用: 「会員の保存パスワードがメールアドレスと同一の状態のときに限り、異なる文字列の使用を促す注意を欄の下に表示する」
- 設計期待値: 会員の保存パスワードがメールアドレスと同一のときに限り、新しいパスワード欄の下に、メールアドレスとは異なる文字列を使うよう促す注意が表示される
- 画像確認: img4/img5（再設定画面PC/SP）では新しいパスワード欄の下は桁数の注意のみで、条件付きの注意は図にも現れない
- 実装参照: `src/Eccube/Resource/template/default/Forgot/reset.twig:62-64;src/Eccube/Form/Type/Front/PasswordResetType.php:54-59`
- 実装実態: 新しいパスワード欄の下には会員の状態に関わらず常時「半角英数字記号 12文字以上、50文字以内で入力してください。IDと同様のパスワードは入力できません。」（src/Eccube/Resource/locale/messages.ja.yaml:512-514）が出るだけで、保存パスワードがメールアドレスと同一の会員に限った注意は出ない。メールアドレスとの同値判定は送信後に入力値どうしを比べるもの（src/Eccube/Form/Type/Front/PasswordResetType.php:56）で、画面表示の条件にはなっていない。
- 判定根拠: 設計の表示条件（会員の保存パスワードがメールアドレスと同一のとき限定）に相当する切り分けが src/Eccube/Resource/template/default/Forgot/reset.twig:62-64 にも src/Eccube/Form/Type/Front/PasswordResetType.php:54-59 にも無く、注意は常時表示である。注意そのものは存在するため未実装ではなく実装違いとした。
- 確信度: med

### sheet-7-R076 マイページ — 未実装／ふるまい／P3

- 正本: sheet-7（マイページ） HTML行 2168 付近
- 正本引用: 「その後マイページを開いたときに戻り先が保持されていれば、戻り先を取り出して消去し、その画面へ戻す。このときマイページは表示しない。」
- 設計期待値: 未ログインのまま入荷お知らせを申し込んだ会員がログイン後にマイページを開くと、マイページを表示せず、申し込んだ画面へ戻される
- 画像確認: レイアウト図に該当なし（遷移のふるまいのため）
- 実装参照: `src/Eccube/Controller/Front/Mypage/MypageController.php:120; src/Eccube/Controller/Front/Mypage/NotifylistController.php:100`
- 実装実態: 申込画面を戻り先として控える処理は src/Eccube/Controller/Front/Mypage/NotifylistController.php:100 にあるが、マイページ表示（src/Eccube/Controller/Front/Mypage/MypageController.php:120）は控えた戻り先を一切参照せず、常にマイページを表示する。控えた値を読み出す箇所はee全体に存在しない
- 同じ実装実態でまとまる要求: sheet-7-R087（マイページ）
- 判定根拠: 現行（pf-eccube3 の Mypage/MypageController.php index）はマイページ表示時に戻り先を取り出して消去し遷移していた。eeでは書き込みだけが移植され、取り出し・遷移・消去が無いため、申し込んだ画面へ戻らずマイページが表示される
- 確信度: high

### sheet-8-R022 入荷待ち商品一覧 — 実装違い／ふるまい／P3

- 正本: sheet-8（入荷待ち商品一覧） HTML行 2304 付近
- 正本引用: 「4	商品画像	画像	-	-	-	・押下すると、商品詳細画面へ遷移する」
- 設計期待値: 一覧の商品画像を押すと、その商品の商品詳細画面が開くこと。
- 画像確認: sheet-8_img1/img2（入荷待ち商品一覧のPC・SP画面）とimg3（マイページボタン）を確認。img4は配送先登録画面で本シートの内容と無関係。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/notifylist.twig:50-56;src/Eccube/Resource/template/default/Mypage/notifylist.en.twig:50-56`
- 実装実態: 商品画像は画像拡大用のボタンとして出力されており、押しても商品詳細画面へは移動せず画像が拡大表示されるだけ。
- 同じ実装実態でまとまる要求: sheet-8-R067（入荷待ち商品一覧）
- 判定根拠: notifylist.twig:51-55 は画像をボタンで包んでおり遷移先を持たない。商品詳細への導線は商品名リンク（59行）だけである。
- 確信度: med

### sheet-8-R068 入荷待ち商品一覧 — 実装違い／ふるまい／P3

- 正本: sheet-8（入荷待ち商品一覧） HTML行 2354 付近
- 正本引用: 「商品画像	商品の言語を指定して商品詳細を開く。高額商品コードを持つ規格では、あわせてその規格を指定する
商品名	商品の言語を指定して商品詳細を開く」
- 設計期待値: 商品名を押したとき、入荷通知を登録した言語が選ばれた状態の商品詳細が開くこと。
- 画像確認: sheet-8_img1/img2（入荷待ち商品一覧のPC・SP画面）とimg3（マイページボタン）を確認。img4は配送先登録画面で本シートの内容と無関係。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/notifylist.twig:59;src/Eccube/Resource/template/default/Mypage/notifylist.en.twig:59;src/Eccube/Controller/Front/ProductController.php:525-534`
- 実装実態: 商品名のリンクは商品を指定するだけで言語の指定を伴わないため、商品詳細は表示中サイトの既定言語で開く。
- 判定根拠: notifylist.twig:59 は商品IDだけで商品詳細を開く。ProductController.php:527-534 は言語の指定が無いとき日本語ページならJPを初期表示にする。同じマイページのお気に入り一覧（favorite.twig:148）は登録言語を指定して開いている。
- 確信度: high

### sheet-9-R021 お気に入り商品一覧 — 実装違い／ふるまい／P3

- 正本: sheet-9（お気に入り商品一覧） HTML行 2466 付近
- 正本引用: 「・押下すると、商品詳細画面へ遷移する」
- 設計期待値: 一覧の商品画像を押すと、その商品の商品詳細画面へ移動する。
- 画像確認: img1・img3 の商品画像には拡大アイコンが描かれている。拡大の操作は図にあるが、画像から商品詳細へ移動する導線の有無は図からは読み取れない。
- 実装参照: `src/Eccube/Resource/template/default/Mypage/favorite.twig:133-145`
- 実装実態: src/Eccube/Resource/template/default/Mypage/favorite.twig:134-144 の商品画像は押しても画像を拡大するだけで、商品詳細画面へは移動しない。商品詳細へ移動できるのは商品名（src/Eccube/Resource/template/default/Mypage/favorite.twig:148）だけである。
- 判定根拠: [gate7/refute] 重要度を P3 へ。乖離自体は成立する。引用は sheets/sheet-9.txt:87（識別ID6 商品画像の画面部品の説明）に実在し述語を持つ。src/Eccube/Resource/template/default/Mypage/favorite.twig:134-144 の商品画像は `<button data-js-target="product-img-zoom">` で拡大専用、商品詳細へのリンクは同 項目定義は識別ID:6 商品画像の押下先を商品詳細画面と定めているが、実装では画像の押下は拡大表示に割り当てられている。画像用の説明文言 messages.ja.yaml:712「商品詳細へ」が定義されたまま使われていないことからも、遷移先が実装されていないことが確認できる。
- 確信度: med

### sheet-9-R053 お気に入り商品一覧 — 実装違い／ふるまい／P3

- 正本: sheet-9（お気に入り商品一覧） HTML行 2502 付近
- 正本引用: 「価格順の並び替えは、同一商品の状態ごとの販売価格のうち最も高い価格を基準にする。」
- 設計期待値: 価格の高い順・低い順のどちらでも、同一商品の状態ごとの販売価格のうち最も高い価格を並べ替えの基準にする。
- 画像確認: 図は色順の表示だけで価格順の並びを描いていない。
- 実装参照: `src/Eccube/Repository/DtbFavoriteProductRepository.php:118-129`
- 実装実態: src/Eccube/Repository/DtbFavoriteProductRepository.php:124-129 の高い順は最高価格を基準にしているが、src/Eccube/Repository/DtbFavoriteProductRepository.php:118-123 の低い順は同一商品の最安価格を基準にしている。
- 判定根拠: 価格の低い順のとき、設計が定める基準（最も高い価格）と実装の基準（最も安い価格）が違うため、商品の並びが変わる。
- 確信度: med

## 掲載しなかった判定

- 実装実態が空欄の判定 17件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）
- 区分が「表示メッセージ」の指摘 51件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0306/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 7 | 0 | 0 | 0 | 7 |
| sheet-2 | 目次 | 31 | 0 | 0 | 0 | 31 |
| sheet-3 | 新規会員登録 | 177 | 5 | 4 | 2 | 166 |
| sheet-4 | 本会員登録 | 64 | 3 | 6 | 2 | 53 |
| sheet-5 | ログイン | 62 | 1 | 2 | 0 | 59 |
| sheet-6 | パスワード再発行 | 121 | 2 | 11 | 1 | 107 |
| sheet-7 | マイページ | 89 | 2 | 1 | 2 | 84 |
| sheet-8 | 入荷待ち商品一覧 | 73 | 0 | 7 | 0 | 66 |
| sheet-9 | お気に入り商品一覧 | 66 | 0 | 4 | 2 | 60 |
| sheet-10 | ポイント履歴 | 69 | 1 | 11 | 0 | 57 |
| sheet-11 | オンライン本人確認 | 119 | 0 | 5 | 0 | 114 |
| sheet-12 | マイイベント・デッキ登録 | 68 | 0 | 12 | 1 | 55 |
| sheet-13 | 大会デッキ登録編集 | 160 | 17 | 16 | 1 | 126 |
| sheet-14 | 大会デッキ登録確認～完了 | 84 | 0 | 15 | 2 | 67 |
| sheet-15 | 会員情報変更 | 118 | 2 | 10 | 2 | 104 |
| sheet-16 | 配送先新規登録・変更 | 162 | 4 | 14 | 1 | 143 |
| sheet-17 | 退会 | 83 | 3 | 8 | 1 | 71 |
| sheet-18 | お問い合わせ | 155 | 3 | 4 | 1 | 147 |
| sheet-19 | お問い合わせ履歴 | 37 | 0 | 2 | 0 | 35 |
| sheet-20 | お問い合わせ履歴詳細 | 36 | 0 | 0 | 0 | 36 |
| sheet-21 | 店頭注文呼び出し番号表示 | 49 | 0 | 0 | 0 | 49 |
| sheet-22 | 店頭PC用アカウント制御 | 91 | 1 | 1 | 0 | 89 |
| sheet-23 | 【新規】パスワード設定（ポリシー違反用） | 21 | 0 | 1 | 0 | 20 |

