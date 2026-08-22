# 実装乖離監査 — 0214_基本設計仕様書(イベント管理).html

- 正本: `excel_to_html/output/0214_基本設計仕様書(イベント管理).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **1254要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 14 | ○ |
| 実装違い | 実装はあるが設計と違う | 49 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 7 | — |
| 設計どおり | 設計どおり実装されている | 868 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 315 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 1 | — |
| **合計** | | **1254** | |

## 不具合 38件（P1 0 / P2 14 / P3 24）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 19件は重複として代表へ折り畳んだ（判定そのものは 57件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-10-R080 | イベント申込一覧(検索入力) | 実装違い | ふるまい | P2 | イベント名に複数の語を入れると、空白やカンマで区切った語ごとに判定し、指定した語をすべて含む申込だけが残る。 |
| sheet-10-R081 | イベント申込一覧(検索入力) | 実装違い | ふるまい | P2 | プレイヤー名も空白やカンマで区切った語ごとに判定し、会員の姓・名、その読み仮名、プレイヤーの英語姓・英語名のいずれかに含まれていれば該当する。 |
| sheet-10-R100 | イベント申込一覧(検索入力) | 実装違い | ふるまい | P2 | 並び順が不正なときは並び順エラーを表示して初期表示に戻す。 |
| sheet-13-R001 | デッキ表示 | 未実装 | ふるまい | P2 | デッキ表示には担当者が権限を持つ店舗のイベントのデッキだけが並び、権限の無い店舗のイベントのデッキは出ない。 |
| sheet-13-R037 | デッキ表示 | 実装違い | ふるまい | P2 | カード一覧にメインボードとサイドボードの両方が並び、それぞれの見出しに合計枚数が出る。 |
| sheet-13-R039 | デッキ表示 | 実装違い | ふるまい | P2 | 1つのデッキのメインカードが40枚を超えるときはページを分けて印刷し、プレイヤー名の後ろにはそのデッキの中での現在ページ番号と総ページ数が出る。 |
| sheet-15-R085 | イベント申込詳細・編集 | 未実装 | ふるまい | P2 | 更新時に、指定された参加者が同じ日程の別の申込に既に登録されていれば、申込が重複している旨のメッセージを表示して更新せず編集画面を描き直す。 |
| sheet-15-R095 | イベント申込詳細・編集 | 実装違い | IO | P2 | 正規の更新送信として受け付けられなかったときは、更新できなかったことを示すメッセージを管理画面上部に表示したうえで編集画面へ戻す。 |
| sheet-16-R002 | イベント申込登録(検索入力) | 未実装 | ふるまい | P2 | 検索結果には担当者が権限を持つ店舗のイベントだけが並び、権限の無い店舗のイベントは一覧に出ない。 |
| sheet-17-R018 | イベント申込登録(検索結果) | 未実装 | ふるまい | P2 | 「新規登録」ボタンは、メンバーが編集権限を持つ店舗のイベントの日程行にだけ表示されること。 |
| sheet-18-R089 | イベント新規申込登録 | 未実装 | ふるまい | P2 | 同じイベント日程に既に申し込んでいるプレイヤーで登録しようとしたときは、申込は作られず、重複している旨のメッセージを表示して新規申込画面へ戻る。 |
| sheet-3-R027 | イベント一覧(検索入力) | 実装違い | ふるまい | P2 | イベント名に複数の語を入れたときは、区切った語をすべて含むものだけが一覧に残る。 |
| sheet-5-R145 | イベント編集 | 未実装 | ふるまい | P2 | イベント削除の要求は、なりすまし対策のための検証に通らなければ削除せずアクセス拒否として扱う。 |
| sheet-7-R001 | 日程登録 | 実装違い | ふるまい | P2 | 編集権限を持たない店舗のイベントでは、日程の登録・更新が行われず保存されない。 |
| sheet-10-R023 | イベント申込一覧(検索入力) | 実装違い | IO | P3 | 支払番号の入力欄は64字を超える文字を受け付けない。 |
| sheet-10-R025 | イベント申込一覧(検索入力) | 実装違い | IO | P3 | 開始時間(From)は日付と時刻を指定して検索でき、初期値には表示日が入る。 |
| sheet-10-R058 | イベント申込一覧(検索入力) | 実装違い | IO | P3 | モーダルのイベント名欄は50字を超える文字を受け付けない。 |
| sheet-10-R082 | イベント申込一覧(検索入力) | 実装違い | ふるまい | P3 | 支払番号は入力した番号と完全に一致する申込だけが該当する。 |
| sheet-10-R088 | イベント申込一覧(検索入力) | 実装違い | ふるまい | P3 | 一覧を初期表示したときは、前回の検索条件・ページ番号・表示件数をすべて捨て、空の一覧・1ページ目・既定の表示件数で表示する。 |
| sheet-10-R090 | イベント申込一覧(検索入力) | 実装違い | ふるまい | P3 | 前回の検索条件が残っていないままページ番号だけを指定して開いたときは、検索を行わず空の一覧（初期表示）に戻る。 |
| sheet-10-R095 | イベント申込一覧(検索入力) | 未実装 | ふるまい | P3 | 最終ページの表示対象が無くなったときは、1つ前のページを表示する。 |
| sheet-10-R097 | イベント申込一覧(検索入力) | 実装違い | ふるまい | P3 | 特定の日程を指定して開いたときは、その日程を検索条件にした一覧を既定の並び順で表示する。 |
| sheet-11-R045 | イベント申込一覧(検索結果) | 実装違い | IO | P3 | デッキ登録検索の結果でも一覧上部に「一括編集」の項目が置かれ、選択できるデータが無いため使えない状態になっている。 |
| sheet-13-R018 | デッキ表示 | 実装違い | IO | P3 | デッキ表示の Event 欄にはイベント名の英語表記が出る。 |
| sheet-13-R035 | デッキ表示 | 実装違い | ふるまい | P3 | Name 欄にはデッキに登録されたプレイヤー名を前後の空白を取り除いて出し、それが空のときだけ会員のカナ姓とカナ名を半角空白でつないだ名前を出す。 |
| sheet-16-R020 | イベント申込登録(検索入力) | 実装違い | ふるまい | P3 | 検索イベント名に入れた語がイベントの略称（日本語・英語）に含まれる日程も検索結果に出る。 |
| sheet-18-R040 | イベント新規申込登録 | 実装違い | IO | P3 | 画面左下の戻りリンクには、遷移元であるイベント申込登録（検索結果）画面の名称が文言として表示される。 |
| sheet-18-R087 | イベント新規申込登録 | 実装違い | ふるまい | P3 | 申込が登録されないまま新規申込画面へ戻ったときは、登録できなかったことが画面上のメッセージとして操作者に伝わる。 |
| sheet-22-R015 | 画像設定 | 実装違い | IO | P3 | アップロード先の店舗欄は、画面を開いたときに担当者のデフォルト表示店舗が選ばれた状態になる。 |
| sheet-22-R030 | 画像設定 | 実装違い | ふるまい | P3 | 画像一覧は保管先のパスの降順で並び、全店舗を表示すると店舗ごとにまとまって並ぶ。表示するのは先頭2000件まで。 |
| sheet-3-R034 | イベント一覧(検索入力) | 実装違い | ふるまい | P3 | 一覧を初期表示で開いたときは、直前に選んだ表示件数が残らず既定の表示件数に戻り、その後の検索も既定の件数で表示される。 |
| sheet-3-R036 | イベント一覧(検索入力) | 実装違い | ふるまい | P3 | 並び順の指定が昇順・降順のいずれでもないときは、並び順が不正である旨を画面に表示し、空の一覧の初期表示に戻る。 |
| sheet-5-R030 | イベント編集 | 実装違い | IO | P3 | イベント規模の選択肢は、おすすめイベント／デイリーイベント／特別イベント／大型イベントの4つになる |
| sheet-5-R047 | イベント編集 | 実装違い | IO | P3 | イベント規模は未選択のままでもイベントを保存でき、必須項目としては扱わない |
| sheet-5-R094 | イベント編集 | 実装違い | IO | P3 | イベント編集画面で入力値を確定するボタンには「更新」と表示される |
| sheet-5-R099 | イベント編集 | 実装違い | IO | P3 | 日程一覧下部のボタン群に「繰返日程追加」と表示されたボタンがあり、押すと繰返日程追加画面が開く。 |
| sheet-7-R025 | 日程登録 | 実装違い | ふるまい | P3 | デッキ登録ありがオンのとき、デッキ登録締め切りを空にしたまま保存しようとすると入力エラーが表示され、保存されない。 |
| sheet-7-R040 | 日程登録 | 実装違い | IO | P3 | 新規の日程登録画面では、実行ボタンに「登録」と表示される。 |

### sheet-10-R080 イベント申込一覧(検索入力) — 実装違い／ふるまい／P2

- 正本: sheet-10（イベント申込一覧(検索入力)） HTML行 2248 付近
- 正本引用: 「イベント名は、空白またはカンマで区切った語ごとに絞り込む。語ごとに、イベント名（日本語）・イベント名（英語）・略称（日本語）・略称（英語）のいずれかへ部分一致すれば該当とし、指定した語すべてに一致するものだけを残す。」
- 設計期待値: イベント名に複数の語を入れると、空白やカンマで区切った語ごとに判定し、指定した語をすべて含む申込だけが残る。
- 画像確認: レイアウト図に店舗・申込情報・支払方法・支払番号・プレイヤー名・開始時間・デッキ登録有無・イベント詳細ID・検索種別・検索する・イベント情報を検索・検索条件をクリアが描かれ、DCIナンバー/チームメンバー確認状況/決済中処理バッチ実行も現行の姿として描かれている（後者3つは項目表で削除指定）。
- 実装参照: `src/Eccube/Repository/DtbEventEntryRepository.php:72-76`
- 実装実態: 入力文字列を区切らず1つの語として扱い、その並びをそのまま含むものだけに絞り込む。「A B」と入れると「A B」という並びを含む申込しか該当しない。
- 判定根拠: src/Eccube/Repository/DtbEventEntryRepository.php:72-76 は入力全体を1つの部分一致条件にしているだけで、語への分割も語どうしの積み上げも無い。同じ設計書のイベント検索モーダル側は src/Eccube/Repository/DtbEventRepository.php:157-176 で語分割を実装しており、申込一覧側だけ欠けている。なお「略称」はイベントの項目として本設計書に定義が無いため、指摘の根拠にしていない。
- 確信度: high

### sheet-10-R081 イベント申込一覧(検索入力) — 実装違い／ふるまい／P2

- 正本: sheet-10（イベント申込一覧(検索入力)） HTML行 2249 付近
- 正本引用: 「プレイヤー名も同じ区切りで語ごとに絞り込み、会員の姓・名、その読み仮名、プレイヤーの英語姓・英語名のいずれかへ部分一致すれば該当とする。」
- 設計期待値: プレイヤー名も空白やカンマで区切った語ごとに判定し、会員の姓・名、その読み仮名、プレイヤーの英語姓・英語名のいずれかに含まれていれば該当する。
- 画像確認: レイアウト図に店舗・申込情報・支払方法・支払番号・プレイヤー名・開始時間・デッキ登録有無・イベント詳細ID・検索種別・検索する・イベント情報を検索・検索条件をクリアが描かれ、DCIナンバー/チームメンバー確認状況/決済中処理バッチ実行も現行の姿として描かれている（後者3つは項目表で削除指定）。
- 実装参照: `src/Eccube/Repository/DtbEventEntryRepository.php:103-120`
- 実装実態: 入力を語に区切らず、プレイヤーの日本語姓名をつないだ文字列とニックネームにしか当てない。読み仮名や英語の姓・名で検索しても該当しない。
- 判定根拠: src/Eccube/Repository/DtbEventEntryRepository.php:103-120 の照合先は日本語姓名の連結2通りとニックネームのみ。ee にも英語姓・英語名（src/Eccube/Entity/DtbPlayer.php:58,64）と会員の読み仮名は存在するのに条件に入っていない。語分割も無い。
- 確信度: high

### sheet-10-R100 イベント申込一覧(検索入力) — 実装違い／ふるまい／P2

- 正本: sheet-10（イベント申込一覧(検索入力)） HTML行 2270 付近
- 正本引用: 「失敗時出力	並び順が不正なときは並び順エラーを表示して初期表示へ戻す。」
- 設計期待値: 並び順が不正なときは並び順エラーを表示して初期表示に戻す。
- 画像確認: レイアウト図に店舗・申込情報・支払方法・支払番号・プレイヤー名・開始時間・デッキ登録有無・イベント詳細ID・検索種別・検索する・イベント情報を検索・検索条件をクリアが描かれ、DCIナンバー/チームメンバー確認状況/決済中処理バッチ実行も現行の姿として描かれている（後者3つは項目表で削除指定）。
- 実装参照: `src/Eccube/Controller/Admin/Event/EntryController.php:225-228`
- 実装実態: 不正な並び順は黙って降順として扱われ、エラーの表示も初期表示への差し戻しも起きない。
- 同じ実装実態でまとまる要求: sheet-10-R091（イベント申込一覧(検索入力)）
- 判定根拠: src/Eccube/Controller/Admin/Event/EntryController.php:225-228 に不正値の通知が無い。sheet-10-R091 と同一の実装欠陥。
- 確信度: high

### sheet-13-R001 デッキ表示 — 未実装／ふるまい／P2

- 正本: sheet-13（デッキ表示） HTML行 2592 付近
- 正本引用: 「・権限を保持している店舗のイベントのデッキのみ表示を可能とする」
- 設計期待値: デッキ表示には担当者が権限を持つ店舗のイベントのデッキだけが並び、権限の無い店舗のイベントのデッキは出ない。
- 画像確認: レイアウト図(sheet-13_img1.png)を確認。印刷するボタン/Name/First Letter of Last Name/Table Number/DCI Number/Event/Date/メインボード(60)とサイドボード(15)を含むカード一覧/Deck Check Rd・Status・Judgeの記入欄が描かれている。
- 実装参照: `src/Eccube/Controller/Admin/Event/EntryController.php:582-609;src/Eccube/Repository/DtbDeckRepository.php:730-762`
- 実装実態: デッキ表示は申込一覧で使った検索条件をそのまま渡してデッキを取得しており、担当者が権限を持つ店舗かどうかでの絞り込みはどこにも無い。店舗の絞り込み条件も全店舗から選べる（src/Eccube/Form/Type/Admin/SearchEntryType.php:68-78）ため、権限の無い店舗を指定するとその店舗のデッキが印刷できる。
- 判定根拠: EntryController.php:582-609 の deckList は申込一覧の検索条件を復元して DtbDeckRepository.php:730-762 に渡すだけで、担当者の権限店舗を条件に足す箇所が無い。同じイベント管理でもモーダル検索側（src/Eccube/Controller/Admin/Event/EntryController.php:471-495）は権限店舗で絞っており、デッキ表示だけ絞りが無いことを確認した。
- 確信度: high

### sheet-13-R037 デッキ表示 — 実装違い／ふるまい／P2

- 正本: sheet-13（デッキ表示） HTML行 2634 付近
- 正本引用: 「メインとサイドそれぞれの枚数を合計し、各見出しに枚数を表示する。」
- 設計期待値: カード一覧にメインボードとサイドボードの両方が並び、それぞれの見出しに合計枚数が出る。
- 画像確認: レイアウト図(sheet-13_img1.png)を確認。印刷するボタン/Name/First Letter of Last Name/Table Number/DCI Number/Event/Date/メインボード(60)とサイドボード(15)を含むカード一覧/Deck Check Rd・Status・Judgeの記入欄が描かれている。
- 実装参照: `src/Eccube/Service/Admin/Event/EntryDeckListDisplayBuilder.php:127-148;src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:333-401`
- 実装実態: 組み立てるのはメインボードだけで、サイドボードのカードも合計枚数も画面に出ない。見出しはメインボードの合計枚数だけである。
- 判定根拠: src/Eccube/Service/Admin/Event/EntryDeckListDisplayBuilder.php:127-148 が返すのは mainboard だけで、サイドのカードを取り出す処理が無い（src/Eccube/Service/Admin/Event/EntryDeckListDisplayBuilder.php:151-178 もメインの板のカードだけを拾う）。src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:333-401 にもサイドボードを出す記述は無い。レイアウト図にはサイドボード(15)が明記されており、合計枚数付きの見出しが必要である。
- 確信度: high

### sheet-13-R039 デッキ表示 — 実装違い／ふるまい／P2

- 正本: sheet-13（デッキ表示） HTML行 2636 付近
- 正本引用: 「プレイヤー名の後ろに、そのデッキの中での現在ページ番号と総ページ数を表示する。」
- 設計期待値: 1つのデッキのメインカードが40枚を超えるときはページを分けて印刷し、プレイヤー名の後ろにはそのデッキの中での現在ページ番号と総ページ数が出る。
- 画像確認: レイアウト図(sheet-13_img1.png)を確認。印刷するボタン/Name/First Letter of Last Name/Table Number/DCI Number/Event/Date/メインボード(60)とサイドボード(15)を含むカード一覧/Deck Check Rd・Status・Judgeの記入欄が描かれている。
- 実装参照: `src/Eccube/Service/Admin/Event/EntryDeckListDisplayBuilder.php:45-79;src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:306-309`
- 実装実態: デッキ1件につき必ず1ページしか作らず、メインカードが40枚を超えても分割しない。プレイヤー名の後ろに出る番号は印刷対象のデッキ全体の通し番号と総デッキ数なので、2件目のデッキでは「2 / 3」のように、そのデッキの中でのページ番号とは違う値が出る。
- 判定根拠: src/Eccube/Service/Admin/Event/EntryDeckListDisplayBuilder.php:56-69 はデッキ1件につき buildPage を1回だけ呼び、40枚での分割を行わない。src/Eccube/Service/Admin/Event/EntryDeckListDisplayBuilder.php:71-75 は全デッキを通した連番と総件数を pageNo・totalPages に入れており、src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:306-309 がそれをプレイヤー名の後ろに出す。設計の「そのデッキの中での」ページ番号にならない。
- 確信度: high

### sheet-15-R085 イベント申込詳細・編集 — 未実装／ふるまい／P2

- 正本: sheet-15（イベント申込詳細・編集） HTML行 2914 付近
- 正本引用: 「参加者が実在し、同じ日程の他の申込に登録されていないか 実在しないか重複するときは申込重複のメッセージを表示し、編集画面を再描画する」
- 設計期待値: 更新時に、指定された参加者が同じ日程の別の申込に既に登録されていれば、申込が重複している旨のメッセージを表示して更新せず編集画面を描き直す。
- 画像確認: sheet-15_img1.png を確認。本行に対応する図中の記述は無い。
- 実装参照: `src/Eccube/Service/Admin/Event/EntryUpdateAction.php:39-83;src/Eccube/Controller/Admin/Event/EntryController.php:295-325`
- 実装実態: 参加者が実在するかは確認してメッセージを出す（存在しないプレイヤーIDのとき）が、同じ日程の他の申込への登録済みかどうかは更新時に一切確認せず、重複したまま更新が成功する。重複を知らせる文言も存在しない。
- 同じ実装実態でまとまる要求: sheet-15-R096（イベント申込詳細・編集 / 実装参照 `src/Eccube/Service/Admin/Event/EntryUpdateAction.php:39-83;src/Eccube/Resource/locale/messages.ja.yaml`）
- 判定根拠: src/Eccube/Service/Admin/Event/EntryUpdateAction.php:49-52 でプレイヤーの実在のみ確認し、src/Eccube/Service/Admin/Event/EntryUpdateAction.php:54-78 の更新は重複判定を行わない。同一日程の登録済み判定（src/Eccube/Entity/DtbEventDetail.php:540-549）は検索モーダルの表示にしか使われておらず（src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:300-307）、更新経路からは呼ばれない。申込重複を表す文言も src/Eccube/Resource/locale/messages.ja.yaml に無い。
- 確信度: med

### sheet-15-R095 イベント申込詳細・編集 — 実装違い／IO／P2

- 正本: sheet-15（イベント申込詳細・編集） HTML行 2925 付近
- 正本引用: 「更新の送信でない 更新失敗を表示し編集画面へ戻す」
- 設計期待値: 正規の更新送信として受け付けられなかったときは、更新できなかったことを示すメッセージを管理画面上部に表示したうえで編集画面へ戻す。
- 画像確認: sheet-15_img1.png を確認。本行に対応する図中の記述は無い。
- 実装参照: `src/Eccube/Controller/Admin/Event/EntryController.php:295-325;src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:207-216`
- 実装実態: 更新の送信として妥当でなかったとき（なりすまし対策トークンの不一致など）は、何のメッセージも出さずに編集画面を描き直すだけになる。
- 同じ実装実態でまとまる要求: sheet-15-R100（イベント申込詳細・編集）、sheet-15-R084（イベント申込詳細・編集）
- 判定根拠: src/Eccube/Controller/Admin/Event/EntryController.php:297 の分岐が不成立のときエラーを積む処理が無く src/Eccube/Controller/Admin/Event/EntryController.php:333-338 の描画へ落ちる。テンプレートにもフォーム全体のエラーを出す記述が無い（src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:207-216、src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:387）。管理画面上部の通知は src/Eccube/Resource/template/admin/alert.twig:31-50 で描かれるが、この経路では何も積まれない。
- 確信度: med

### sheet-16-R002 イベント申込登録(検索入力) — 未実装／ふるまい／P2

- 正本: sheet-16（イベント申込登録(検索入力)） HTML行 3014 付近
- 正本引用: 「・権限を保持している店舗のイベントの情報のみ表示を可能とする」
- 設計期待値: 検索結果には担当者が権限を持つ店舗のイベントだけが並び、権限の無い店舗のイベントは一覧に出ない。
- 画像確認: レイアウト図(sheet-16_img1.png)を確認。検索イベント名のテキスト欄、店舗のプルダウン、開催日の2つの日付欄を「〜」でつないだ範囲指定、下部中央の「検索する＞」ボタンが描かれている。一覧領域は図に含まれない。
- 実装参照: `src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:128-145;src/Eccube/Repository/DtbEventRepository.php:151-202`
- 実装実態: 検索は入力された店舗（未指定なら全店舗）でしか絞られず、担当者が権限を持つ店舗かどうかでの絞り込みが無い。店舗の選択肢も全店舗が出る（src/Eccube/Form/Type/Admin/EntryRegisterSearchType.php:41-52）ため、権限の無い店舗を選ぶとその店舗のイベントと日程が一覧に出る。
- 判定根拠: src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:128-145 は検索条件をそのまま src/Eccube/Repository/DtbEventRepository.php:151-202 へ渡すだけで、担当者の権限店舗を条件に足していない。同じイベント管理でも、申込一覧のイベント検索枠（src/Eccube/Controller/Admin/Event/EntryController.php:470-496）や申込登録画面の入口（src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:161-166）は権限店舗で弾いており、この検索一覧だけ絞りが無いことを確認した。
- 確信度: high

### sheet-17-R018 イベント申込登録(検索結果) — 未実装／ふるまい／P2

- 正本: sheet-17（イベント申込登録(検索結果)） HTML行 3124 付近
- 正本引用: 「4	新規登録	ボタン	-	-	-	イベント新規申込登録画面へ遷移 権限を保持している店舗のイベントのみ表示」
- 設計期待値: 「新規登録」ボタンは、メンバーが編集権限を持つ店舗のイベントの日程行にだけ表示されること。
- 画像確認: sheet-17_img1.png を確認。列は左から ID／イベント名／日程／イベント申込登録。イベント名欄は「イベント名（日） イベント名（英）」「開催店舗」「フォーマット」の3行組。ID5656 は3日程をまたいでID・イベント名が1セルに結合され、日程ごとに青い「新規登録」ボタンが並ぶ。日程の並びは 06/12→06/11→06/30 で日付順ではなく日程IDの降順に見える。下部にページャ。ボタンの表示可否を分ける描き分けは図には無い。
- 実装参照: `src/Eccube/Resource/template/admin/Event/EntryRegistration/index.twig:110`
- 実装実態: ボタンは開催店舗を見ずに全ての日程行へ描画される。権限の無い店舗のイベントの行にも同じボタンが並ぶ。
- 同じ実装実態でまとまる要求: sheet-17-R004（イベント申込登録(検索結果)）
- 判定根拠: 項目表の「新規登録」ボタンに付された表示条件だが、実装は開催店舗を見ずに全ての日程行へボタンを描画する（src/Eccube/Resource/template/admin/Event/EntryRegistration/index.twig:110）。行データには開催店舗が入っている（src/Eccube/Service/Admin/Event/EntryRegistrationScheduleRowBuilder.php:71, src/Eccube/Service/Admin/Event/EntryRegistrationScheduleRowBuilder.php:72）ものの、表示の可否を分ける判定が無い。sheet-17-R004 と同じ1つの実装欠陥。
- 確信度: high

### sheet-18-R089 イベント新規申込登録 — 未実装／ふるまい／P2

- 正本: sheet-18（イベント新規申込登録） HTML行 3295 付近
- 正本引用: 「参加者重複 申込重複のメッセージを表示し、新規申込画面へ戻す」
- 設計期待値: 同じイベント日程に既に申し込んでいるプレイヤーで登録しようとしたときは、申込は作られず、重複している旨のメッセージを表示して新規申込画面へ戻る。
- 画像確認: レイアウト図 sheet-18_img1.png を確認。プレイヤー検索モーダルの図はこのシートには無く、項目表のみで突合した。
- 実装参照: `src/Eccube/Service/Admin/Event/EntryRegistrationStoreAction.php:39-76;src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:188-211`
- 実装実態: src/Eccube/Service/Admin/Event/EntryRegistrationStoreAction.php:39-75 は参加プレイヤーが同じイベント日程に既に申し込んでいるかを確かめずに申込と申込プレイヤーを登録する。src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:188-211 にも重複時の分岐が無く、重複した申込がそのまま登録される。検索モーダルで登録済のプレイヤーを選べなくしているだけで、登録時の判定は無い。
- 判定根拠: src/Eccube/Service/Admin/Event/EntryRegistrationStoreAction.php と src/Eccube/Controller/Admin/Event/EntryRegistrationController.php の登録経路に重複判定が無く、申込プレイヤーにも重複を防ぐ一意制約が無い（src/Eccube/Entity/DtbEntryPlayer.php:22 のテーブル定義に一意制約の指定が無い）。
- 確信度: med

### sheet-3-R027 イベント一覧(検索入力) — 実装違い／ふるまい／P2

- 正本: sheet-3（イベント一覧(検索入力)） HTML行 1110 付近
- 正本引用: 「イベント名	全角空白を半角にしたうえで、半角空白・全角空白・カンマで語に分割する。各語について、イベント名（日）・イベント名（英）・略称（日）・略称（英）への部分一致をORで束ね、語どうしをANDで積み上げる」
- 設計期待値: イベント名に複数の語を入れたときは、区切った語をすべて含むものだけが一覧に残る。
- 画像確認: レイアウト図(sheet-3_img1.png)には新規登録ボタン・イベント名の入力欄・開催日From〜To・フォーマット・会場・ルール適用度・検索条件をクリア・検索するボタンが描かれている。図は現行の姿のため会場が単一選択で描かれているが、カスタマイズ説明と項目表では店舗の複数選択に置き換わっており、後者を正とした。文字数上限は図から読み取れない。
- 実装参照: `src/Eccube/Repository/DtbEventRepository.php:66-91`
- 実装実態: 語ごとの条件をすべてORでつないでいるため、いずれか1語でも含めば該当してしまう。「A B」と入れるとAだけを含むものもBだけを含むものも一覧に出る。
- 判定根拠: src/Eccube/Repository/DtbEventRepository.php:77-87 で語ごとの条件を1つの配列に積み、src/Eccube/Repository/DtbEventRepository.php:88-90 でその全体をORで結んで1つの条件にしている。語の単位でANDにするには語ごとに条件をまとめる必要があるが、そうなっていない。全角空白の半角化と語への分割(src/Eccube/Repository/DtbEventRepository.php:70-72)、部分一致(src/Eccube/Repository/DtbEventRepository.php:81)は設計どおり。略称はイベントの項目として本設計書に定義が無く、指摘の根拠にしていない。
- 確信度: high

### sheet-5-R145 イベント編集 — 未実装／ふるまい／P2

- 正本: sheet-5（イベント編集） HTML行 1473 付近
- 正本引用: 「2 なりすまし対策トークン 不正なら共通のアクセス拒否として扱う」
- 設計期待値: イベント削除の要求は、なりすまし対策のための検証に通らなければ削除せずアクセス拒否として扱う。
- 画像確認: sheet-5_img1（イベント編集レイアウト図）とsheet-5_img2（編集ボタンのポップアップ:編集/削除）を確認。
- 実装参照: `src/Eccube/Controller/Admin/Event/EventController.php:352-368;src/Eccube/Controller/AbstractController.php:252-263`
- 実装実態: イベント削除処理は受け取った検証用の値を一切確かめずに削除まで進む。同じ画面の日程一括削除(src/Eccube/Controller/Admin/Event/ScheduleController.php:222)は検証しており、そこでは不正時にアクセス拒否となる。
- 同じ実装実態でまとまる要求: sheet-5-R160（イベント編集 / 実装参照 `src/Eccube/Controller/Admin/Event/EventController.php:352-368;src/Eccube/Controller/AbstractController.php:252-263;src/Eccube/Controller/Admin/Event/ScheduleController.php:222`）
- 判定根拠: EventController.php:352-368 に検証呼び出しが無く、AbstractController.php:252-263 の共通検証（不正ならアクセス拒否）を通らない。画面側は src/Eccube/Resource/template/admin/Event/edit.twig:524 で値を送っているが、受け側が確かめていない。外部サイトからの誘導で意図しない削除が成立しうる。
- 確信度: med

### sheet-7-R001 日程登録 — 実装違い／ふるまい／P2

- 正本: sheet-7（日程登録） HTML行 1621 付近
- 正本引用: 「・編集権限を保持している店舗のイベントのみ編集を可能とする」
- 設計期待値: 編集権限を持たない店舗のイベントでは、日程の登録・更新が行われず保存されない。
- 画像確認: sheet-7_img1.png（日程編集画面：イベントID/イベント詳細ID/イベント名（日）/イベントページURL/開始時間/受付あり/受付時間/デッキ登録あり/デッキ登録締切/デッキ登録を終了する/オンライン受付あり/オンライン受付時間/定員/参加費/公開状態/賞品（日）/賞品（英））、img2.png（ボタン群「日程登録」「日程更新」「削除」「戻る」）、img3.png（定員欄の右の接尾辞「人/組」）を確認。
- 実装参照: `src/Eccube/Controller/Admin/Event/ScheduleController.php:67-101;src/Eccube/Controller/Admin/Event/ScheduleController.php:133-165;src/Eccube/Resource/template/admin/Event/Schedule/edit.twig:258`
- 実装実態: 日程登録画面・日程編集画面は編集可能店舗かどうかを画面表示用に求めるだけで（src/Eccube/Controller/Admin/Event/ScheduleController.php:92-93, src/Eccube/Controller/Admin/Event/ScheduleController.php:156-157）、登録処理（src/Eccube/Controller/Admin/Event/ScheduleController.php:67-90）と更新処理（src/Eccube/Controller/Admin/Event/ScheduleController.php:133-154）の手前では確かめていない。画面上の抑止は実行ボタンを押せなくすること（src/Eccube/Resource/template/admin/Event/Schedule/edit.twig:258, src/Eccube/Resource/template/admin/Event/Schedule/edit.twig:264）だけで、送信内容が届けば編集権限の無い店舗のイベントでも日程が登録・更新される。
- 同じ実装実態でまとまる要求: sheet-7-R004（日程登録 / 実装参照 `src/Eccube/Controller/Admin/Event/ScheduleController.php:67-101;src/Eccube/Resource/template/admin/Event/Schedule/edit.twig:264`）
- 判定根拠: [gate7/refute] 重要度を P2 へ。指摘そのものは成立する。引用「・編集権限を保持している店舗のイベントのみ編集を可能とする」はsheets/sheet-7.txt:60に逐語で実在し、カスタマイズ要件の仕様文（述語あり）。実装も確認: src/Eccube/Controller/Admin/Event/ScheduleController.php:67-90（登録）と133-154（更新）は保存前に編集可能店舗を確かめず、isEd 削除（src/Eccube/Controller/Admin/Event/ScheduleController.php:174-179）・一括削除（src/Eccube/Controller/Admin/Event/ScheduleController.php:224-229）と繰返し日程登録（src/Eccube/Controller/Admin/Event/RepeatScheduleController.php:59-65）では保存前に編集可能店舗かを確かめて不正なリクエストとして差し戻すのに対し、日程の登録・更新だけがその判定を持たない。
- 確信度: high

### sheet-10-R023 イベント申込一覧(検索入力) — 実装違い／IO／P3

- 正本: sheet-10（イベント申込一覧(検索入力)） HTML行 2183 付近
- 正本引用: 「1-5	支払番号	全角・半角	-	64字	-	デッキ登録を検索時は操作不可」
- 設計期待値: 支払番号の入力欄は64字を超える文字を受け付けない。
- 画像確認: レイアウト図に店舗・申込情報・支払方法・支払番号・プレイヤー名・開始時間・デッキ登録有無・イベント詳細ID・検索種別・検索する・イベント情報を検索・検索条件をクリアが描かれ、DCIナンバー/チームメンバー確認状況/決済中処理バッチ実行も現行の姿として描かれている（後者3つは項目表で削除指定）。文字数上限は図から読み取れないため項目表の最大値列で判断。
- 実装参照: `src/Eccube/Form/Type/Admin/SearchEntryType.php:98-101`
- 実装実態: 支払番号欄に文字数の上限が無く、64字を超える入力もそのまま受け付けて検索する。
- 同じ実装実態でまとまる要求: sheet-10-R024（イベント申込一覧(検索入力) / 実装参照 `src/Eccube/Form/Type/Admin/SearchEntryType.php:102-105`）
- 判定根拠: src/Eccube/Form/Type/Admin/SearchEntryType.php:98-101 の支払番号はテキスト欄のみで長さの制限が付いていない。同じフォームのイベント詳細IDには src/Eccube/Form/Type/Admin/SearchEntryType.php:152-158 で10字の上限が付いており、上限を設ける仕組みはある。現行(pf-eccube3 app/Plugin/HareruyaEc/Form/Type/Admin/Entry/EntryListType.php:70-77)では同項目に入力可能文字数の上限を設定していた。
- 確信度: med

### sheet-10-R025 イベント申込一覧(検索入力) — 実装違い／IO／P3

- 正本: sheet-10（イベント申込一覧(検索入力)） HTML行 2185 付近
- 正本引用: 「1-7	開始時間(From)	日付時刻	-	-	表示日	開始時間(From)>開始時間(To)の場合エラー」
- 設計期待値: 開始時間(From)は日付と時刻を指定して検索でき、初期値には表示日が入る。
- 画像確認: レイアウト図では当該欄の見出しは「開始時間」で、入力欄が2つ（〜で連結）並ぶ。
- 実装参照: `src/Eccube/Form/Type/Admin/SearchEntryType.php:106-123`
- 実装実態: 開始時間(From)は日付だけを選ぶ欄で、時刻を指定できない（初期値に当日が入る点は設計どおり）。画面上の見出しも「開催日」になっている。
- 同じ実装実態でまとまる要求: sheet-10-R026（イベント申込一覧(検索入力) / 実装参照 `src/Eccube/Form/Type/Admin/SearchEntryType.php:124-140`）
- 判定根拠: src/Eccube/Form/Type/Admin/SearchEntryType.php:106-111 は日付だけの入力欄で、時刻の桁を持たない。項目表の書式は「日付時刻」で、同シート下部のモーダル側（識別ID:1-3/1-4）はあえて「日付」と書き分けられている。現行(pf-eccube3 app/Plugin/HareruyaEc/Form/Type/Admin/Entry/EntryListType.php:96-115)は YYYY-MM-DD HH:MI の日時入力。見出し文言は src/Eccube/Resource/template/admin/Event/Entry/index.twig:284 が「開催日」。
- 確信度: med

### sheet-10-R058 イベント申込一覧(検索入力) — 実装違い／IO／P3

- 正本: sheet-10（イベント申込一覧(検索入力)） HTML行 2222 付近
- 正本引用: 「1-1	イベント名、略称	テキスト	-	50	-	部分一致
1-2	店舗	単一選択	-	-	デフォルト表示の店舗	選択肢:全店舗」
- 設計期待値: モーダルのイベント名欄は50字を超える文字を受け付けない。
- 画像確認: モーダルはレイアウト図に描かれていない（図は検索入力の現行姿のみ）。
- 実装参照: `src/Eccube/Form/Type/Admin/SearchEntryEventModalType.php:37-40`
- 実装実態: イベント名欄に文字数の上限が無く、50字を超える入力もそのまま受け付けて検索する。
- 同じ実装実態でまとまる要求: sheet-3-R015（イベント一覧(検索入力) / 実装参照 `src/Eccube/Form/Type/Admin/SearchEventType.php:39-42;src/Eccube/Resource/template/admin/Event/index.twig:47-49`）
- 判定根拠: src/Eccube/Form/Type/Admin/SearchEntryEventModalType.php:37-40 はテキスト欄のみで長さの制限が付いていない。部分一致で絞り込む点は src/Eccube/Repository/DtbEventRepository.php:157-176 で実装済みで、欠けているのは入力文字数の上限だけ。なお「略称」は本設計書にイベントの項目としての定義が無く（イベント編集シートの項目表はイベント名(日)/(英)のみ）、指摘の根拠にしていない。
- 確信度: med

### sheet-10-R082 イベント申込一覧(検索入力) — 実装違い／ふるまい／P3

- 正本: sheet-10（イベント申込一覧(検索入力)） HTML行 2250 付近
- 正本引用: 「支払番号は完全一致で絞り込む。」
- 設計期待値: 支払番号は入力した番号と完全に一致する申込だけが該当する。
- 画像確認: レイアウト図に店舗・申込情報・支払方法・支払番号・プレイヤー名・開始時間・デッキ登録有無・イベント詳細ID・検索種別・検索する・イベント情報を検索・検索条件をクリアが描かれ、DCIナンバー/チームメンバー確認状況/決済中処理バッチ実行も現行の姿として描かれている（後者3つは項目表で削除指定）。
- 実装参照: `src/Eccube/Repository/DtbEventEntryRepository.php:97-101`
- 実装実態: 部分一致で絞り込むため、入力した番号を一部に含む別の申込まで該当する。
- 判定根拠: src/Eccube/Repository/DtbEventEntryRepository.php:97-101 は前後を任意とする部分一致で照合している。現行(pf-eccube3 app/Plugin/HareruyaEc/Repository/DtbEntryPlayerRepository.php:106-110)は完全一致。
- 確信度: high

### sheet-10-R088 イベント申込一覧(検索入力) — 実装違い／ふるまい／P3

- 正本: sheet-10（イベント申込一覧(検索入力)） HTML行 2256 付近
- 正本引用: 「一覧の初期表示では、保持していた検索条件・ページ番号・表示件数を破棄し、空の一覧・ページ番号1・既定の表示件数で表示する。」
- 設計期待値: 一覧を初期表示したときは、前回の検索条件・ページ番号・表示件数をすべて捨て、空の一覧・1ページ目・既定の表示件数で表示する。
- 画像確認: レイアウト図に店舗・申込情報・支払方法・支払番号・プレイヤー名・開始時間・デッキ登録有無・イベント詳細ID・検索種別・検索する・イベント情報を検索・検索条件をクリアが描かれ、DCIナンバー/チームメンバー確認状況/決済中処理バッチ実行も現行の姿として描かれている（後者3つは項目表で削除指定）。
- 実装参照: `src/Eccube/Controller/Admin/Event/EntryController.php:209-214`
- 実装実態: 初期表示で検索条件とページ番号は初期化されるが、表示件数だけは前回選んだ値が残り、既定の表示件数に戻らない。
- 判定根拠: src/Eccube/Controller/Admin/Event/EntryController.php:209-214 の初期表示では検索条件とページ番号を初期化しているが、表示件数は初期化しておらず、src/Eccube/Controller/Admin/Event/EntryController.php:126-129 が前回値を優先して読み出す。現行(pf-eccube3 app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:56-59)は表示件数も破棄していた。
- 確信度: med

### sheet-10-R090 イベント申込一覧(検索入力) — 実装違い／ふるまい／P3

- 正本: sheet-10（イベント申込一覧(検索入力)） HTML行 2258 付近
- 正本引用: 「検索条件を受け取れないときは、保持していた前回の検索条件で検索する。保持もしていないときは初期表示へ戻す。」
- 設計期待値: 前回の検索条件が残っていないままページ番号だけを指定して開いたときは、検索を行わず空の一覧（初期表示）に戻る。
- 画像確認: レイアウト図に店舗・申込情報・支払方法・支払番号・プレイヤー名・開始時間・デッキ登録有無・イベント詳細ID・検索種別・検索する・イベント情報を検索・検索条件をクリアが描かれ、DCIナンバー/チームメンバー確認状況/決済中処理バッチ実行も現行の姿として描かれている（後者3つは項目表で削除指定）。
- 実装参照: `src/Eccube/Controller/Admin/Event/EntryController.php:200-208`
- 実装実態: 前回の検索条件が残っていなくても空の条件で検索してしまい、初期表示に戻らず全件が一覧に並ぶ。
- 判定根拠: src/Eccube/Controller/Admin/Event/EntryController.php:200-208 はページ番号付きで開かれたとき、保持した条件が空でもそのまま検索を実行している（検索取りやめの分岐が無い）。現行(pf-eccube3 app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:166-172)は条件が無いときに初期表示へ戻していた。
- 確信度: med

### sheet-10-R095 イベント申込一覧(検索入力) — 未実装／ふるまい／P3

- 正本: sheet-10（イベント申込一覧(検索入力)） HTML行 2263 付近
- 正本引用: 「最終ページの表示対象が無くなったときは、ページ番号を1つ前に戻す。」
- 設計期待値: 最終ページの表示対象が無くなったときは、1つ前のページを表示する。
- 画像確認: レイアウト図に店舗・申込情報・支払方法・支払番号・プレイヤー名・開始時間・デッキ登録有無・イベント詳細ID・検索種別・検索する・イベント情報を検索・検索条件をクリアが描かれ、DCIナンバー/チームメンバー確認状況/決済中処理バッチ実行も現行の姿として描かれている（後者3つは項目表で削除指定）。
- 実装参照: `src/Eccube/Controller/Admin/Event/EntryController.php:232-246`
- 実装実態: 対象が無くなったページ番号のまま検索し、空のページを表示する。ページ番号を戻す処理が無い。
- 判定根拠: src/Eccube/Controller/Admin/Event/EntryController.php:232-246 の検索実行にページ番号を戻す判定が無い。同じ設計書のイベント一覧では src/Eccube/Controller/Admin/Event/EventController.php:390-394 に同じ処理が実装されており、申込一覧だけ欠けている。
- 確信度: high

### sheet-10-R097 イベント申込一覧(検索入力) — 実装違い／ふるまい／P3

- 正本: sheet-10（イベント申込一覧(検索入力)） HTML行 2265 付近
- 正本引用: 「特定の日程を指定して開いたときは、その日程を検索条件に設定し、並び順は既定とする。検索モードはイベント申込検索に固定する。」
- 設計期待値: 特定の日程を指定して開いたときは、その日程を検索条件にした一覧を既定の並び順で表示する。
- 画像確認: レイアウト図に店舗・申込情報・支払方法・支払番号・プレイヤー名・開始時間・デッキ登録有無・イベント詳細ID・検索種別・検索する・イベント情報を検索・検索条件をクリアが描かれ、DCIナンバー/チームメンバー確認状況/決済中処理バッチ実行も現行の姿として描かれている（後者3つは項目表で削除指定）。
- 実装参照: `src/Eccube/Controller/Admin/Event/EntryController.php:192-199`
- 実装実態: 日程が検索条件に入り検索種別がイベント申込検索になる点は設計どおりだが、並び順は直前に使っていた並び順が引き継がれ、既定の並び順に戻らない。
- 判定根拠: src/Eccube/Controller/Admin/Event/EntryController.php:192-199 は日程を条件に入れるだけで並び順を既定に戻していない。src/Eccube/Controller/Admin/Event/EntryController.php:221-228 が前回の並び順を優先するため、直前の並び替えがそのまま残る。現行(pf-eccube3 app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:951-953,976-984)は既定の並び順に固定していた。
- 確信度: med

### sheet-11-R045 イベント申込一覧(検索結果) — 実装違い／IO／P3

- 正本: sheet-11（イベント申込一覧(検索結果)） HTML行 2403 付近
- 正本引用: 「（デッキ登録検索結果ではデータを選択できないので使用不可）」
- 設計期待値: デッキ登録検索の結果でも一覧上部に「一括編集」の項目が置かれ、選択できるデータが無いため使えない状態になっている。
- 画像確認: sheet-11_img2（デッキ登録検索結果のレイアウト図）を確認。申込IDに「なし」、申込日時・支払状況・番号の列は「-」のみ、チェックボックス列は空欄、並べかえは「デッキ登録日｜降順」。上部の「一括編集」は淡色で描かれている。
- 実装参照: `src/Eccube/Resource/template/admin/Event/Entry/index.twig:343-345`
- 実装実態: デッキ登録検索の結果では「一括編集」自体が画面に出力されず、項目そのものが無くなる。
- 同じ実装実態でまとまる要求: sheet-11-R046（イベント申込一覧(検索結果)）
- 判定根拠: src/Eccube/Resource/template/admin/Event/Entry/index.twig:343 でデッキ登録検索時は「一括編集」を出力しない。正本は同じ項目表で識別ID2-1を「デッキ登録検索結果では非表示」と明記する一方、1-1は「使用不可」と書き分けており、レイアウト図（sheet-11_img2）にも「一括編集」が淡色で描かれている。sheet-11-R046と同一の実装欠陥。
- 確信度: med

### sheet-13-R018 デッキ表示 — 実装違い／IO／P3

- 正本: sheet-13（デッキ表示） HTML行 2611 付近
- 正本引用: 「イベント名（英）を表示」
- 設計期待値: デッキ表示の Event 欄にはイベント名の英語表記が出る。
- 画像確認: レイアウト図(sheet-13_img1.png)を確認。印刷するボタン/Name/First Letter of Last Name/Table Number/DCI Number/Event/Date/メインボード(60)とサイドボード(15)を含むカード一覧/Deck Check Rd・Status・Judgeの記入欄が描かれている。
- 実装参照: `src/Eccube/Service/Admin/Event/EntryDeckListDisplayBuilder.php:144;src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:323-326`
- 実装実態: Event 欄に入るのはイベント名の日本語表記である（src/Eccube/Service/Admin/Event/EntryDeckListDisplayBuilder.php:144 が日本語名を eventName に入れている）。英語名は画面のどこにも出ない。
- 判定根拠: 識別ID:6 Event の画面部品の説明は「イベント名（英）を表示」だが、src/Eccube/Service/Admin/Event/EntryDeckListDisplayBuilder.php:144 は getNameJp() の値を eventName に設定し、src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:323-326 がそれを Event 欄へ出している。DtbEvent には英語名の項目があり（src/Eccube/Entity/DtbEvent.php:200-203）取得できるにもかかわらず使っていない。
- 確信度: high

### sheet-13-R035 デッキ表示 — 実装違い／ふるまい／P3

- 正本: sheet-13（デッキ表示） HTML行 2632 付近
- 正本引用: 「デッキに登録されたプレイヤー名から前後の空白を除いて用いる。プレイヤー名が空のときは、会員のカナ姓とカナ名を半角空白で連結して表示する。」
- 設計期待値: Name 欄にはデッキに登録されたプレイヤー名を前後の空白を取り除いて出し、それが空のときだけ会員のカナ姓とカナ名を半角空白でつないだ名前を出す。
- 画像確認: レイアウト図(sheet-13_img1.png)を確認。印刷するボタン/Name/First Letter of Last Name/Table Number/DCI Number/Event/Date/メインボード(60)とサイドボード(15)を含むカード一覧/Deck Check Rd・Status・Judgeの記入欄が描かれている。
- 実装参照: `src/Eccube/Service/Admin/Event/EntryDeckListDisplayBuilder.php:338-357`
- 実装実態: 会員のカナ姓・カナ名が入っていればそれを最優先で出し、次にプレイヤーの日本語の姓名、最後にデッキのプレイヤー名という順で選ぶ。デッキにプレイヤー名が登録されていても、会員のカナ名がある限りその名前は画面に出ない。
- 判定根拠: src/Eccube/Service/Admin/Event/EntryDeckListDisplayBuilder.php:338-357 の優先順位は会員カナ→プレイヤー日本語姓名→デッキのプレイヤー名で、設計が定める順序（デッキのプレイヤー名が先、空のときだけ会員カナ）と逆である。設計に無いプレイヤー日本語姓名の段も挟まっており、Name 欄に出る名前が設計と変わる。
- 確信度: high

### sheet-16-R020 イベント申込登録(検索入力) — 実装違い／ふるまい／P3

- 正本: sheet-16（イベント申込登録(検索入力)） HTML行 3038 付近
- 正本引用: 「イベント名（日本語）・イベント名（英語）・略称（日本語）・略称（英語）のいずれかに含まれていれば該当とする。」
- 設計期待値: 検索イベント名に入れた語がイベントの略称（日本語・英語）に含まれる日程も検索結果に出る。
- 画像確認: レイアウト図(sheet-16_img1.png)を確認。検索イベント名のテキスト欄、店舗のプルダウン、開催日の2つの日付欄を「〜」でつないだ範囲指定、下部中央の「検索する＞」ボタンが描かれている。一覧領域は図に含まれない。
- 実装参照: `src/Eccube/Repository/DtbEventRepository.php:157-176;src/Eccube/Entity/DtbEvent.php:46-50`
- 実装実態: 語ごとの判定はイベント名（日本語）とイベント名（英語）の2つだけで、略称は見ていない。略称でしか呼ばれないイベントを略称で検索しても結果に出ない。イベントに略称を持たせる項目自体が無い。
- 判定根拠: src/Eccube/Repository/DtbEventRepository.php:162 が照合対象をイベント名の日本語と英語の2つに限っている。src/Eccube/Entity/DtbEvent.php:46-50 にもイベント名の日本語・英語しかなく、略称に相当する項目が無いため略称での該当は起こり得ない。語の区切り（半角空白・全角空白・カンマ）と、どれか1つでも当たれば該当という扱いは src/Eccube/Repository/DtbEventRepository.php:159-175 で満たされている。
- 確信度: high

### sheet-18-R040 イベント新規申込登録 — 実装違い／IO／P3

- 正本: sheet-18（イベント新規申込登録） HTML行 3237 付近
- 正本引用: 「「戻る」は、前の画面名を表示する」
- 設計期待値: 画面左下の戻りリンクには、遷移元であるイベント申込登録（検索結果）画面の名称が文言として表示される。
- 画像確認: レイアウト図 sheet-18_img1.png を確認。図には席順・DCIナンバー・チームメンバー確認済の列と画面右上の「イベント申込を登録」「戻る」ボタンが描かれ、図の注記に「登録 ボタンの位置を画面下部に移動する」「「戻る」は、前の画面名を表示する」「※ 一行目の会員が支払会員に設定されます。」がある。
- 実装参照: `src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:339-344;src/Eccube/Resource/locale/messages.ja.yaml:5955`
- 実装実態: src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:342 は新規登録時の戻りリンク文言に固定の訳語（src/Eccube/Resource/locale/messages.ja.yaml:5955「戻る」）を使っており、遷移先はイベント申込登録の検索画面だが、画面名は文言として出ない。
- 判定根拠: 遷移先自体は識別ID:3-2の説明どおりイベント申込登録（検索結果）画面だが、レイアウト図の注記が求める「前の画面名を表示する」が満たされておらず、表示文言が設計と異なる。
- 確信度: med

### sheet-18-R087 イベント新規申込登録 — 実装違い／ふるまい／P3

- 正本: sheet-18（イベント新規申込登録） HTML行 3293 付近
- 正本引用: 「登録失敗を表示し、新規申込画面へ戻す」
- 設計期待値: 申込が登録されないまま新規申込画面へ戻ったときは、登録できなかったことが画面上のメッセージとして操作者に伝わる。
- 画像確認: レイアウト図 sheet-18_img1.png を確認。プレイヤー検索モーダルの図はこのシートには無く、項目表のみで突合した。
- 実装参照: `src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:188-227;src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:207-220;src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:387`
- 実装実態: src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:188-211 は登録に成功したときと登録処理で例外が出たときにだけメッセージを出す。入力内容の検証に通らず登録されなかった場合は src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:221-226 でそのまま新規申込画面を描き直すだけで、src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:207-220 と src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:387 は参加プレイヤーやフォーム全体の検証エラーを描画しないため、画面には何も出ない。
- 同じ実装実態でまとまる要求: sheet-18-R092（イベント新規申込登録）
- 判定根拠: 検証エラーの描画は src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:300-320 の申込状況・支払方法・支払金額に限られ、参加プレイヤー欄（src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:220）とフォーム全体のエラーは出力されない。登録されなかったことが画面上で分からない。
- 確信度: med

### sheet-22-R015 画像設定 — 実装違い／IO／P3

- 正本: sheet-22（画像設定） HTML行 3641 付近
- 正本引用: 「1	店舗	単一選択	〇	-	デフォルト表示の店舗	編集権限のある店舗のみ表示」
- 設計期待値: アップロード先の店舗欄は、画面を開いたときに担当者のデフォルト表示店舗が選ばれた状態になる。
- 画像確認: レイアウト図(sheet-22_img1.png)には上段に店舗の単一選択・画像のアップロード（ファイルを選択）・アップロードボタン、下段に「全て」の絞り込みプルダウンと、画像／更新日付／画面URL／削除の4列の一覧が描かれている。一覧の画像欄は上段に画像、下段にURL(https://stg-files.hareruyamtg.com/banner/)が置かれ、URL欄に「画像URLコピー」、右端に「削除」のリンクがある。図には並び順・保管フォルダ・確認ダイアログの文言は描かれていないため、それらは本文の記述で判定した。
- 実装参照: `src/Eccube/Controller/Admin/Event/BannerController.php:205-224;src/Eccube/Form/Type/Admin/Event/EventBannerUploadType.php:42-54`
- 実装実態: 担当者のデフォルト表示店舗を初期値にする処理が無い。店舗で絞り込んで開いたときだけその店舗が初期選択になり、全店舗表示で開いたときは初期値が決まらず、編集できる店舗のうち先頭の店舗が選ばれた状態になる。
- 判定根拠: src/Eccube/Controller/Admin/Event/BannerController.php:212-215 は絞り込み中の店舗だけを初期値にしており、担当者のデフォルト表示店舗を取り出す処理が src/Eccube/Controller/Admin/Event/BannerController.php のどこにも無い（同じ設計書のイベント一覧では src/Eccube/Controller/Admin/Event/EventController.php:70-75 でデフォルト表示店舗を初期値にしている）。src/Eccube/Form/Type/Admin/Event/EventBannerUploadType.php:49 は空の選択肢を出さない設定のため、初期値が無いと先頭の店舗が選ばれた状態になる。単一選択・必須・編集権限のある店舗のみ表示は設計どおり（src/Eccube/Form/Type/Admin/Event/EventBannerUploadType.php:42-54, src/Eccube/Controller/Admin/Event/BannerController.php:317-327）。
- 確信度: med

### sheet-22-R030 画像設定 — 実装違い／ふるまい／P3

- 正本: sheet-22（画像設定） HTML行 3660 付近
- 正本引用: 「画像一覧は保管先のパスの降順で並べ、表示するのは先頭2000件までとする。更新日付の順ではないので、全店舗を表示するときは店舗ごとの区分の降順にまとまり、同じ区分の中では後から保管したものほど先に並ぶ。保管先の区分（フォルダ）そのものは一覧に出さず、ファイルだけを並べる。」
- 設計期待値: 画像一覧は保管先のパスの降順で並び、全店舗を表示すると店舗ごとにまとまって並ぶ。表示するのは先頭2000件まで。
- 画像確認: レイアウト図(sheet-22_img1.png)には上段に店舗の単一選択・画像のアップロード（ファイルを選択）・アップロードボタン、下段に「全て」の絞り込みプルダウンと、画像／更新日付／画面URL／削除の4列の一覧が描かれている。一覧の画像欄は上段に画像、下段にURL(https://stg-files.hareruyamtg.com/banner/)が置かれ、URL欄に「画像URLコピー」、右端に「削除」のリンクがある。図には並び順・保管フォルダ・確認ダイアログの文言は描かれていないため、それらは本文の記述で判定した。
- 実装参照: `src/Eccube/Service/Admin/Event/EventBannerStorageService.php:207-219`
- 実装実態: 更新日時の新しい順に並べている。全店舗を表示すると店舗ごとにまとまらず、各店舗の画像が更新日時の順で入り混じって並ぶ。2000件の上限とフォルダ自体を一覧に出さない点は設計どおり。
- 判定根拠: src/Eccube/Service/Admin/Event/EventBannerStorageService.php:209-216 は更新日時(LastModified)の降順で並べ替えており、保管先のパスでは並べていない。正本は「更新日付の順ではないので」とわざわざ断って店舗ごとにまとまることを述べているため、並び順そのものが要求である。件数上限は src/Eccube/Service/Admin/Event/EventBannerStorageService.php:218 で2000件、フォルダを出さない点は src/Eccube/Service/S3AccessService.php:109-113 で満たしている。
- 確信度: high

### sheet-3-R034 イベント一覧(検索入力) — 実装違い／ふるまい／P3

- 正本: sheet-3（イベント一覧(検索入力)） HTML行 1117 付近
- 正本引用: 「一覧の初期表示では、保持している検索条件・ページ番号・表示件数を破棄し、空の一覧・ページ番号1・既定の表示件数で表示する。検索結果の表は描画しない。」
- 設計期待値: 一覧を初期表示で開いたときは、直前に選んだ表示件数が残らず既定の表示件数に戻り、その後の検索も既定の件数で表示される。
- 画像確認: レイアウト図(sheet-3_img1.png)には新規登録ボタン・イベント名の入力欄・開催日From〜To・フォーマット・会場・ルール適用度・検索条件をクリア・検索するボタンが描かれている。図は現行の姿のため会場が単一選択で描かれているが、カスタマイズ説明と項目表では店舗の複数選択に置き換わっており、後者を正とした。文字数上限は図から読み取れない。
- 実装参照: `src/Eccube/Controller/Admin/Event/EventController.php:87-90;src/Eccube/Controller/Admin/Event/EventController.php:192-198`
- 実装実態: 初期表示で検索条件とページ番号は破棄されるが、表示件数だけは前に選んだ値が残る。100件表示に変えてから一覧を開き直して検索すると、既定の件数ではなく100件のまま表示される。
- 判定根拠: src/Eccube/Controller/Admin/Event/EventController.php:192-198 の初期表示の分岐は検索条件とページ番号だけを書き戻しており、表示件数には触れていない。表示件数は src/Eccube/Controller/Admin/Event/EventController.php:87-90 で常に保持値が優先され、破棄する箇所がどこにも無い。空の一覧（src/Eccube/Resource/template/admin/Event/index.twig:206-207 で表を描かない）とページ番号1は設計どおり。
- 確信度: med

### sheet-3-R036 イベント一覧(検索入力) — 実装違い／ふるまい／P3

- 正本: sheet-3（イベント一覧(検索入力)） HTML行 1119 付近
- 正本引用: 「ソートキーの既定はイベントIDで、イベント名で並べるときは日本語のイベント名を用いる。ソートキーと並び順は、リクエストの指定・保持している値・既定の順に決める。並び順の既定は降順とする。並び順が昇順・降順のいずれでもないときは、並び順のエラーを表示して初期表示へ戻す。」
- 設計期待値: 並び順の指定が昇順・降順のいずれでもないときは、並び順が不正である旨を画面に表示し、空の一覧の初期表示に戻る。
- 画像確認: レイアウト図(sheet-3_img1.png)には新規登録ボタン・イベント名の入力欄・開催日From〜To・フォーマット・会場・ルール適用度・検索条件をクリア・検索するボタンが描かれている。図は現行の姿のため会場が単一選択で描かれているが、カスタマイズ説明と項目表では店舗の複数選択に置き換わっており、後者を正とした。文字数上限は図から読み取れない。
- 実装参照: `src/Eccube/Repository/DtbEventRepository.php:133-140;src/Eccube/Controller/Admin/Event/EventController.php:106-143`
- 実装実態: 並び順が昇順を表す値でなければ、どんな値でも黙って降順として扱い、そのまま検索結果を表示する。不正な並び順を示すメッセージは出ず、初期表示にも戻らない。
- 同じ実装実態でまとまる要求: sheet-3-R047（イベント一覧(検索入力) / 実装参照 `src/Eccube/Repository/DtbEventRepository.php:133-140;src/Eccube/Controller/Admin/Event/EventController.php:106-143;src/Eccube/Form/Type/Admin/SearchEventType.php:107-112`）、sheet-3-R052（イベント一覧(検索入力) / 実装参照 `src/Eccube/Repository/DtbEventRepository.php:133-140;src/Eccube/Controller/Admin/Event/EventController.php:106-143;src/Eccube/Form/Type/Admin/SearchEventType.php:107-112`）
- 判定根拠: src/Eccube/Repository/DtbEventRepository.php:38-41 の既定のソートキーはイベントID、イベント名は日本語名、src/Eccube/Repository/DtbEventRepository.php:135 の並び順の既定は降順で、ここまでは設計どおり。しかし src/Eccube/Repository/DtbEventRepository.php:135 は昇順以外をすべて降順に丸めるだけで、不正な並び順を検出する箇所が src/Eccube/Form/Type/Admin/SearchEventType.php:107-112 にも src/Eccube/Controller/Admin/Event/EventController.php:106-143 にも無い。
- 確信度: high

### sheet-5-R030 イベント編集 — 実装違い／IO／P3

- 正本: sheet-5（イベント編集） HTML行 1351 付近
- 正本引用: 「・識別ID:1-8 「イベント規模」を追加する、おすすめイベント、デイリーイベント、特別イベント、大型イベントから選択」
- 設計期待値: イベント規模の選択肢は、おすすめイベント／デイリーイベント／特別イベント／大型イベントの4つになる
- 画像確認: img1のイベント規模欄は選択肢が描かれていないため、文言は本文の記載で判定した。
- 実装参照: `app/DoctrineMigrations/Version20260514110000.php:32-37`
- 実装実態: 選択肢の2つ目が「デイリーイベント」ではなく「定番イベント」として登録される。当初は「デイリーイベント」で投入されていた（app/DoctrineMigrations/Version20260219100000.php:57）が、後続で名称が上書きされている。
- 判定根拠: イベント規模の選択肢はマスタ登録値をそのまま並べる（src/Eccube/Form/Type/Admin/EventType.php:100-109）。現在の登録値は おすすめイベント／定番イベント／特別イベント／大型イベント で、設計の「デイリーイベント」と1件食い違う。上書き側は別設計書（F07-01 イベント大会TOP）を根拠としており、どちらの名称を採るかは設計裁定が要る可能性がある。
- 確信度: med

### sheet-5-R047 イベント編集 — 実装違い／IO／P3

- 正本: sheet-5（イベント編集） HTML行 1369 付近
- 正本引用: 「1-8 イベント規模 単一選択 - - - 選択肢:大型イベント 特別イベント デイリーイベント おすすめイベント」
- 設計期待値: イベント規模は未選択のままでもイベントを保存でき、必須項目としては扱わない
- 画像確認: img1のイベント規模欄には必須の朱書きが無く、任意項目として描かれている。
- 実装参照: `src/Eccube/Form/Type/Admin/EventType.php:100-109;src/Eccube/Resource/template/admin/Event/edit.twig:147-160;src/Eccube/Entity/DtbEvent.php:80-82`
- 実装実態: イベント規模が未選択だと入力エラーになり保存できず、画面にも必須の印が付いている。
- 同じ実装実態でまとまる要求: sheet-9-R033（複製新規 / 実装参照 `src/Eccube/Form/Type/Admin/EventType.php:100-109; src/Eccube/Resource/template/admin/Event/edit.twig:146-153`）
- 判定根拠: 項目表の必須列はイベント規模だけ「-」（任意）で、バナーURL等の任意項目は実装でも任意になっている。イベント規模のみ空欄を許さない検証が入り（src/Eccube/Form/Type/Admin/EventType.php:103-106）、ラベル横に必須バッジが出る（src/Eccube/Resource/template/admin/Event/edit.twig:151-153）。保持側は未設定を許す作りで（src/Eccube/Entity/DtbEvent.php:80-82 は値なしを許容）、入力段だけが空欄を拒んでいる。
- 確信度: med

### sheet-5-R094 イベント編集 — 実装違い／IO／P3

- 正本: sheet-5（イベント編集） HTML行 1416 付近
- 正本引用: 「3-2 更新 ボタン - - - フォームに入力された値でイベント編集」
- 設計期待値: イベント編集画面で入力値を確定するボタンには「更新」と表示される
- 画像確認: img1のボタン群では最上部に「イベント更新」と描かれており、項目表の「更新」と合わせて、少なくとも「登録」ではない。
- 実装参照: `src/Eccube/Resource/template/admin/Event/edit.twig:499;src/Eccube/Resource/locale/messages.ja.yaml:1633`
- 実装実態: 確定ボタンの表示文言は新規登録時も編集時も「登録」で、「更新」とは表示されない。押したときの動作（入力値でイベントを更新）は設計どおり。
- 判定根拠: 編集画面の送信ボタンは表示文言を admin.common.registration（=登録）で描画しており（src/Eccube/Resource/template/admin/Event/edit.twig:499）、新規/編集の出し分けもない。ふるまい自体はsrc/Eccube/Controller/Admin/Event/EventController.php:296-316 で設計どおり更新される。
- 確信度: med

### sheet-5-R099 イベント編集 — 実装違い／IO／P3

- 正本: sheet-5（イベント編集） HTML行 1421 付近
- 正本引用: 「3-4 繰返日程追加 ボタン - - - 繰返日程追加画面へ遷移」
- 設計期待値: 日程一覧下部のボタン群に「繰返日程追加」と表示されたボタンがあり、押すと繰返日程追加画面が開く。
- 画像確認: sheet-5_img1（イベント編集レイアウト図）とsheet-5_img2（編集ボタンのポップアップ:編集/削除）を確認。img1右上のボタン列に「繰返日程追加」と描かれており、ラベルは図でも確認できる。
- 実装参照: `src/Eccube/Resource/template/admin/Event/edit.twig:493;src/Eccube/Resource/locale/messages.ja.yaml:6111`
- 実装実態: ボタンの表示文言は「繰返日程」。押下時の遷移先は繰返日程追加画面で設計どおりだが、ラベルの「追加」が欠けている。
- 判定根拠: edit.twig:493 のボタン文言は admin.event.repeat_schedule で、messages.ja.yaml:6111 の値が「繰返日程」。設計の項目表とレイアウト図はいずれも「繰返日程追加」。遷移先自体は繰返日程追加画面（src/Eccube/Controller/Admin/Event/RepeatScheduleController.php 相当のadmin_repeat_schedule_createへのリンク）で一致。
- 確信度: high

### sheet-7-R025 日程登録 — 実装違い／ふるまい／P3

- 正本: sheet-7（日程登録） HTML行 1647 付近
- 正本引用: 「デッキ登録ありの場合必須」
- 設計期待値: デッキ登録ありがオンのとき、デッキ登録締め切りを空にしたまま保存しようとすると入力エラーが表示され、保存されない。
- 画像確認: sheet-7_img1.png（日程編集画面：イベントID/イベント詳細ID/イベント名（日）/イベントページURL/開始時間/受付あり/受付時間/デッキ登録あり/デッキ登録締切/デッキ登録を終了する/オンライン受付あり/オンライン受付時間/定員/参加費/公開状態/賞品（日）/賞品（英））、img2.png（ボタン群「日程登録」「日程更新」「削除」「戻る」）、img3.png（定員欄の右の接尾辞「人/組」）を確認。
- 実装参照: `src/Eccube/Form/Type/Admin/ScheduleType.php:131-136;src/Eccube/Resource/template/admin/Event/Schedule/edit.twig:35-39`
- 実装実態: デッキ登録締め切りには入力必須の指定が無く（src/Eccube/Form/Type/Admin/ScheduleType.php:131-136）、画面側もデッキ登録ありのオン・オフで入力可否を切り替えるだけで必須にはしない（src/Eccube/Resource/template/admin/Event/Schedule/edit.twig:35-39）。受付時間とオンライン受付時間では同じ画面で必須の切替を行っている（src/Eccube/Resource/template/admin/Event/Schedule/edit.twig:29-32, src/Eccube/Resource/template/admin/Event/Schedule/edit.twig:44-51）。
- 同じ実装実態でまとまる要求: sheet-8-R026（繰返日程追加 / 実装参照 `src/Eccube/Form/Type/Admin/RepeatScheduleType.php:147-151;src/Eccube/Resource/template/admin/Event/RepeatSchedule/create.twig:37-41`）、sheet-8-R029（繰返日程追加 / 実装参照 `src/Eccube/Form/Type/Admin/RepeatScheduleType.php:152-157;src/Eccube/Resource/template/admin/Event/RepeatSchedule/create.twig:37-41`）
- 判定根拠: 自動入力された値を消して送っても入力エラーにならず、デッキ登録ありのまま締め切りが未設定の日程が保存される（src/Eccube/Service/Admin/Event/ScheduleStoreAction.php:52, src/Eccube/Service/Admin/Event/ScheduleUpdateAction.php:51）。
- 確信度: med

### sheet-7-R040 日程登録 — 実装違い／IO／P3

- 正本: sheet-7（日程登録） HTML行 1662 付近
- 正本引用: 「20 登録 ボタン - - - 新規日程登録時のみ表示」
- 設計期待値: 新規の日程登録画面では、実行ボタンに「登録」と表示される。
- 画像確認: sheet-7_img1.png（日程編集画面：イベントID/イベント詳細ID/イベント名（日）/イベントページURL/開始時間/受付あり/受付時間/デッキ登録あり/デッキ登録締切/デッキ登録を終了する/オンライン受付あり/オンライン受付時間/定員/参加費/公開状態/賞品（日）/賞品（英））、img2.png（ボタン群「日程登録」「日程更新」「削除」「戻る」）、img3.png（定員欄の右の接尾辞「人/組」）を確認。
- 実装参照: `src/Eccube/Resource/template/admin/Event/Schedule/edit.twig:262-266`
- 実装実態: 新規登録時に表示される実行ボタンの文言は「保存」（src/Eccube/Resource/template/admin/Event/Schedule/edit.twig:264、文言は src/Eccube/Resource/locale/messages.ja.yaml:1631）。表示条件（新規のときだけ出す）は設計どおりだが、文言が「登録」ではない。
- 同じ実装実態でまとまる要求: sheet-7-R041（日程登録 / 実装参照 `src/Eccube/Resource/template/admin/Event/Schedule/edit.twig:247-260`）
- 判定根拠: 同じ設計書の繰返し日程登録画面では「登録」（src/Eccube/Resource/locale/messages.ja.yaml:1633）を使っており（src/Eccube/Controller/Admin/Event/RepeatScheduleController.php:41-43 の画面）、日程登録画面だけ「保存」になっている。レイアウト図の文言は「日程登録」で、いずれとも異なる。
- 確信度: med

## 掲載しなかった判定

- 実装実態が空欄の判定 1件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）
- 区分が「表示メッセージ」の指摘 9件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0214/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 6 | 0 | 0 | 0 | 6 |
| sheet-2 | 目次 | 30 | 0 | 0 | 0 | 30 |
| sheet-3 | イベント一覧(検索入力) | 56 | 3 | 4 | 0 | 49 |
| sheet-4 | イベント一覧(検索結果) | 28 | 0 | 0 | 0 | 28 |
| sheet-5 | イベント編集 | 196 | 2 | 5 | 0 | 189 |
| sheet-6 | イベント削除 | 6 | 0 | 0 | 1 | 5 |
| sheet-7 | 日程登録 | 61 | 0 | 5 | 0 | 56 |
| sheet-8 | 繰返日程追加 | 63 | 0 | 2 | 0 | 61 |
| sheet-9 | 複製新規 | 100 | 0 | 1 | 2 | 97 |
| sheet-10 | イベント申込一覧(検索入力) | 103 | 1 | 14 | 0 | 88 |
| sheet-11 | イベント申込一覧(検索結果) | 67 | 0 | 2 | 1 | 64 |
| sheet-12 | イベント申込一括編集 | 22 | 0 | 0 | 0 | 22 |
| sheet-13 | デッキ表示 | 46 | 1 | 5 | 0 | 40 |
| sheet-14 | CSVダウンロード | 51 | 0 | 0 | 0 | 51 |
| sheet-15 | イベント申込詳細・編集 | 111 | 2 | 3 | 0 | 106 |
| sheet-16 | イベント申込登録(検索入力) | 32 | 1 | 2 | 0 | 29 |
| sheet-17 | イベント申込登録(検索結果) | 19 | 2 | 0 | 0 | 17 |
| sheet-18 | イベント新規申込登録 | 100 | 2 | 4 | 1 | 93 |
| sheet-19 | イベント一括登録 | 8 | 0 | 0 | 0 | 8 |
| sheet-20 | イベント一括登録CSV | 61 | 0 | 0 | 0 | 61 |
| sheet-21 | バナー設定 | 34 | 0 | 0 | 0 | 34 |
| sheet-22 | 画像設定 | 54 | 0 | 2 | 2 | 50 |

