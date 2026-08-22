# 実装乖離監査 — 0207_基本設計仕様書(会員管理機能).html

- 正本: `excel_to_html/output/0207_基本設計仕様書(会員管理機能).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **1091要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 6 | ○ |
| 実装違い | 実装はあるが設計と違う | 31 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 1 | — |
| 設計どおり | 設計どおり実装されている | 678 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 366 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 9 | — |
| **合計** | | **1091** | |

## 不具合 30件（P1 0 / P2 11 / P3 19）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 5件は重複として代表へ折り畳んだ（判定そのものは 35件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-10-R014 | ポイント付与 | 実装違い | ふるまい | P2 | 付与後のポイント残高が0未満になるかどうかは、画面に表示され付与で更新される当該会員の選手情報のポイント残高で判定し、0未満になる入力だけを付与できないようにする。 |
| sheet-11-R012 | ポイント付与（キャンペーン、特別対応） | 実装違い | IO | P2 | ポイント増減量に999999999を超える値を入力して保存すると入力エラーとなり、ポイント履歴は登録されない。 |
| sheet-18-R037 | オンライン本人確認 | 未実装 | ふるまい | P2 | モーダルに表示されている身分証画像を押すと、その種別の画像だけが大きく表示される。 |
| sheet-20-R016 | 顧客グループ管理 | 実装違い | ふるまい | P2 | 「店内注文専用アカウント」を有効にした顧客グループに属する会員が注文したとき、その注文に店頭用の注文番号が発行される。 |
| sheet-20-R041 | 顧客グループ管理 | 実装違い | ふるまい | P2 | ポイント還元率に負の数を入力して登録したとき、保存されずに入力エラーが表示される。 |
| sheet-20-R044 | 顧客グループ管理 | 実装違い | IO | P2 | 顧客グループの支払方法欄に、支払方法設定に登録されている支払方法がすべて選択肢として並ぶ。 |
| sheet-21-R017 | ブラックリスト管理 | 実装違い | ふるまい | P2 | 行の削除ボタンを押した時点で、その行のブラックリスト登録が削除される。 |
| sheet-22-R035 | 会員登録仮登録完了メール再送 | 未実装 | ふるまい | P2 | 仮登録メールを再送すると、その会員のメール履歴に1件（対象会員・用いたテンプレート・件名・本文・送信日時）が残り、会員のメール履歴画面から確認できる。 |
| sheet-3-R089 | 会員検索一覧(検索入力) | 実装違い | ふるまい | P2 | 会員ID・メールアドレス・お名前の欄に空白またはカンマで区切って複数の語を入れたとき、語ごとに会員ID・メールアドレス・氏名・氏名カナのいずれかへ部分一致し、すべての語を満たす会員だけが検索結果に出る |
| sheet-9-R038 | 会員登録編集 | 未実装 | ふるまい | P2 | 本人確認ステータスを未確認以外から未確認へ変えて会員情報を登録したとき、身分証有効期限が入力済みなら身分証有効期限が空欄になって保存される。 |
| sheet-9-R138 | 会員登録編集 | 実装違い | IO | P2 | 買取履歴欄の買取番号リンクを押すと、その買取申込の買取詳細画面が開く。 |
| sheet-14-R009 | メール配信履歴 | 実装違い | IO | P3 | 絞り込み欄の見出しは「テンプレートで絞り込む」と表示され、テンプレートを選んでいない状態では選択欄に「すべてのメールを表示する」と表示される。 |
| sheet-15-R021 | 手動メール通知(入力画面) | 実装違い | ふるまい | P3 | 会員向けベース（会員・会員英語・ベースなし）に該当しないテンプレートや自動送信メールのテンプレートを指定して手動メール作成画面を開こうとしたときは、画面を開かずページが見つからない扱いにする。 |
| sheet-17-R032 | 配送先編集 | 実装違い | IO | P3 | 配送先の一覧では、配送先ごとに配送先名称・郵便番号・配送先都道府県・住所・配送先氏名・配送先氏名カナ・電話番号・配送先会社名が並ぶ。都道府県が海外または未登録の配送先は、郵便番号と都道府県の代わりに海 |
| sheet-17-R033 | 配送先編集 | 実装違い | IO | P3 | 既定の配送先として印が付いた配送先には編集と削除の操作を出さず、それ以外の配送先にだけ出す。 |
| sheet-17-R039 | 配送先編集 | 実装違い | IO | P3 | 配送先の削除確認には、対象の配送先名称が示される。 |
| sheet-18-R035 | オンライン本人確認 | 未実装 | IO | P3 | 本人確認の閲覧権限が無い担当者がオンライン本人確認のモーダルを開いたとき、身分証画像は表示されず、各画像枠に「閲覧不可」という文言が表示される。 |
| sheet-20-R039 | 顧客グループ管理 | 実装違い | IO | P3 | 顧客グループ管理画面を開いた直後は入力フォームの見出しが「新規追加」と表示され、一覧から既存の顧客グループを選ぶと「編集」に変わる。 |
| sheet-20-R040 | 顧客グループ管理 | 実装違い | ふるまい | P3 | 名称を空のまま、または255文字を超える名称で登録したとき、保存されずに入力エラーが表示される。 |
| sheet-20-R058 | 顧客グループ管理 | 実装違い | ふるまい | P3 | 存在しない顧客グループを指定して編集画面を開こうとしたとき、画面も一覧も表示されず、ページが見つからない扱いになる。 |
| sheet-22-R029 | 会員登録仮登録完了メール再送 | 実装違い | IO | P3 | 再送される仮登録メールの差出人が、店舗基本情報の返信受付メールアドレス（表示名は店名）で届く。 |
| sheet-22-R033 | 会員登録仮登録完了メール再送 | 実装違い | IO | P3 | 管理画面の表示言語が英語のときも、再送される仮登録メールは日本語のテンプレートの内容（件名・本文）で届く。 |
| sheet-22-R036 | 会員登録仮登録完了メール再送 | 実装違い | ふるまい | P3 | 仮登録メールを再送しても会員の登録内容は変わらず、先に送った仮登録メールに載っていた本登録用URLもそのまま使える。 |
| sheet-4-R055 | 会員検索一覧(検索結果) | 実装違い | IO | P3 | 行末のサブメニューを開くと、編集・削除・メール通知・仮会員メール再送の4つが選べる。 |
| sheet-5-R036 | メール一括送信 | 実装違い | IO | P3 | メールの文字コード設定を iso-2022-jp にしているとき、一括送信されるメールの本文が iso-2022-jp の文字コードで届く（設定していないときは変換されない）。 |
| sheet-6-R012 | メール一括送信確認 | 実装違い | IO | P3 | メール一括送信確認画面の下部の操作領域に「戻る」という名のボタンが置かれ、押すとメール一括送信入力画面に戻る。 |
| sheet-9-R109 | 会員登録編集 | 実装違い | IO | P3 | 会員ステータスは「仮会員」「本会員」の2つが画面上に並んで表示され、どちらか一方を直接選べる。 |
| sheet-9-R156 | 会員登録編集 | 実装違い | IO | P3 | 購入履歴欄には新しいものから最大100件までが表示され、それより古い受注は画面に出ない。 |
| sheet-9-R159 | 会員登録編集 | 実装違い | IO | P3 | 受注番号が付いていない受注は、購入履歴欄の受注番号の欄に「-」が表示される。 |
| sheet-9-R160 | 会員登録編集 | 実装違い | IO | P3 | 買取履歴欄の買取番号は7桁のゼロ埋め（例 0012345）で表示される。 |

### sheet-10-R014 ポイント付与 — 実装違い／ふるまい／P2

- 正本: sheet-10（ポイント付与） HTML行 1900 付近
- 正本引用: 「注文番号を入力したのに、その番号に一致する受注が見つからないときは付与しない。付与後のポイント残高が0未満になるときも付与しない。」
- 設計期待値: 付与後のポイント残高が0未満になるかどうかは、画面に表示され付与で更新される当該会員の選手情報のポイント残高で判定し、0未満になる入力だけを付与できないようにする。
- 画像確認: sheet-10_img1.png を確認。左カードに「・キャンペーンによるポイント付与／・特別対応（クレーム対応/不手際お詫び）」、右カードに「・余剰入金への返金／・欠品、状態不備、誤発送などでの返金」の2つのリンクが並ぶ。ヘッダ右に「会員編集画面に戻る」ボタン（赤矢印で画面下部の戻り導線に対応付け）。入力フォームや一覧は図に無い。
- 実装参照: `src/Eccube/Form/Type/Admin/CustomerPointType.php:131;src/Eccube/Resource/template/admin/Customer/point_update.twig:105;src/Eccube/Controller/Admin/Customer/CustomerPointController.php:107`
- 実装実態: 付与後残高の判定に、画面に表示され付与時に更新される選手情報の残高ではなく、会員自身が持つ別のポイント欄の値を用いている（src/Eccube/Form/Type/Admin/CustomerPointType.php:131）。画面表示は選手情報の残高（src/Eccube/Resource/template/admin/Customer/point_update.twig:105）、付与時の更新も選手情報の残高（src/Eccube/Controller/Admin/Customer/CustomerPointController.php:107）で、会員自身のポイント欄は会員登録時に0が入るだけで本機能の付与では増減しない（src/Eccube/Repository/CustomerRepository.php:96、src/Eccube/Entity/Customer.php:882-894）。
- 判定根拠: 同シートは残高を「その会員の選手情報が持つポイント残高」と定めており（同ブロックの「ポイント付与が成立したとき、その会員の選手情報が持つポイント残高を…に更新する」）、画面のポイント残高（src/Eccube/Resource/template/admin/Customer/point_update.twig:105）も付与時の更新（src/Eccube/Controller/Admin/Customer/CustomerPointController.php:107）も選手情報の残高を使う。ところが0未満判定だけが会員自身のポイント欄を見ている（src/Eccube/Form/Type/Admin/CustomerPointType.php:131）。この欄は会員作成時に0が設定されるだけで本機能では増減しないため（src/Eccube/Repository/CustomerRepository.php:96）、選手情報の残高が十分にあっても減算の付与が「ポイント残高を0未満にすることはできません。」で弾かれる。同じ行の注文番号不一致時に付与しない点は実装済み（src/Eccube/Form/Type/Admin/CustomerPointType.php:123-128）。スマレジ連携失敗時の扱いは、連携が後追いで実行される作りのため静的には確かめられず、この指摘には含めていない。
- 確信度: high

### sheet-11-R012 ポイント付与（キャンペーン、特別対応） — 実装違い／IO／P2

- 正本: sheet-11（ポイント付与（キャンペーン、特別対応）） HTML行 1969 付近
- 正本引用: 「3 ポイント増減量 数値 ○ 999999999 - 最大値はスマレジ連携に合わせる」
- 設計期待値: ポイント増減量に999999999を超える値を入力して保存すると入力エラーとなり、ポイント履歴は登録されない。
- 画像確認: sheet-11_img1.png を確認。上部に「ポイント履歴追加（キャンペーン、特別対応）」の折りたたみカード、下部に「ポイント履歴」一覧（ID/会員名/注文番号/増減量/備考/発行日/設定日/有効期限）とポイント残高、右上の「会員編集画面に戻る」ボタンから下部固定バーへ引出線があり下部エリア配置を示す。
- 実装参照: `src/Eccube/Form/Type/Admin/CustomerPointType.php:74-84`
- 実装実態: 増減量の入力チェックは必須と整数書式だけで上限がなく、999999999を超える値（例 2000000000）でもそのまま履歴として登録され、会員のポイント残高およびスマレジ側のポイントへ反映される。
- 同じ実装実態でまとまる要求: sheet-12-R012（ポイント付与（余剰入金へのご返金、注文金額変更によるご返金）
- 判定根拠: src/Eccube/Form/Type/Admin/CustomerPointType.php:74-84 の入力チェックは必須と整数書式のみで、上限値の検査が無い。src/Eccube/Form/Type/Admin/CustomerPointType.php:115-134 の追加検査も残高がマイナスにならないことだけを見ており上限は見ていない。CSV取込側には0〜999999999の範囲検査（src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:648）があり、本項目にだけ上限が無い。
- 確信度: high

### sheet-18-R037 オンライン本人確認 — 未実装／ふるまい／P2

- 正本: sheet-18（オンライン本人確認） HTML行 2540 付近
- 正本引用: 「身分証画像の拡大表示 表示されている身分証画像を押すと、その種別の画像だけを大きく表示する。閲覧不可の枠と未登録の枠には拡大表示を設けない」
- 設計期待値: モーダルに表示されている身分証画像を押すと、その種別の画像だけが大きく表示される。
- 画像確認: sheet-18_img1.png を確認。モーダル「オンライン本人確認」に お名前／お名前（フリガナ）／国／郵便番号／海外用郵便番号／都道府県／住所（3行目に（海外用住所3））／生年月日／職業 のラベルと、本人写真・顔写真付きの身分証明書（表）（裏）（斜め）の画像枠、身分証有効期限の入力欄、右下に「取消」「確認済に変更する」ボタンが描かれている。
- 実装参照: `src/Eccube/Resource/template/admin/Customer/edit.twig:250-299; html/template/admin/assets/css/customer.css:1-14`
- 実装実態: 身分証画像にはクラス名が付くだけで、押下したときに拡大表示する処理も拡大用の様式も存在せず、押しても画像は大きくならない。
- 判定根拠: src/Eccube/Resource/template/admin/Customer/edit.twig:255,268,283,296 の画像に付く expand-image は、会員編集画面の画面内処理にも html/template/admin/assets/css/customer.css:1-14 にも対応する定義が無い。受注編集画面には同種の拡大表示があるが、会員編集画面のモーダルには移されていない。
- 確信度: high

### sheet-20-R016 顧客グループ管理 — 実装違い／ふるまい／P2

- 正本: sheet-20（顧客グループ管理） HTML行 2683 付近
- 正本引用: 「・店内注文専用アカウントがチェックされた場合のフロント側の処理
・注文時に注文番号を発行」
- 設計期待値: 「店内注文専用アカウント」を有効にした顧客グループに属する会員が注文したとき、その注文に店頭用の注文番号が発行される。
- 画像確認: sheet-20_img1（顧客グループ管理／編集画面）を確認。
- 実装参照: `src/Eccube/Service/PurchaseFlow/Processor/WaitingNumberProcessor.php:41-58`
- 実装実態: 注文番号（整理番号）の発番条件が顧客グループの店内注文専用アカウントの値ではなく、あらかじめ決められた2つの顧客グループIDのいずれかであるかで判定されている（src/Eccube/Service/PurchaseFlow/Processor/WaitingNumberProcessor.php:44）。管理画面で新たに顧客グループを作り店内注文専用アカウントを有効にしても、そのグループの会員の注文には注文番号が発番されない。
- 同じ実装実態でまとまる要求: sheet-20-R028（顧客グループ管理）
- 判定根拠: src/Eccube/Service/PurchaseFlow/Processor/WaitingNumberProcessor.php:43-44 のコメントどおり「店頭販売グループ」判定は src/Eccube/Entity/DtbCustomerGroup.php:235-238 の固定ID一覧（OTC_GROUP）で行われており、src/Eccube/Form/Type/Admin/CustomerGroupType.php:46-49 の店内注文専用アカウントのチェック値は参照されていない。同じ画面のアクセス制限（src/Eccube/EventListener/CustomerGroupAccessListener.php:74）はチェック値で判定しており、発番だけ条件が異なる。
- 確信度: med

### sheet-20-R041 顧客グループ管理 — 実装違い／ふるまい／P2

- 正本: sheet-20（顧客グループ管理） HTML行 2709 付近
- 正本引用: 「・登録ボタン押下時、フォーム内容の入力チェックをサーバ側で行う」
- 設計期待値: ポイント還元率に負の数を入力して登録したとき、保存されずに入力エラーが表示される。
- 画像確認: sheet-20_img1（顧客グループ管理／編集画面）を確認。 図のポイント還元率(%)欄は単純な数値入力欄で、符号の入力を妨げる表現は無い。
- 実装参照: `src/Eccube/Form/Type/Admin/CustomerGroupType.php:39-45`
- 実装実態: ポイント還元率の検証パターンが先頭のマイナス記号を許しており（src/Eccube/Form/Type/Admin/CustomerGroupType.php:43）、-1 などの負の整数がそのまま保存される。
- 判定根拠: 項目定義の識別ID3「ポイント還元率」の画面部品の説明は「0以上の整数のみ」。実装の検証は必須と整数形式だけで、src/Eccube/Form/Type/Admin/CustomerGroupType.php:43 のパターンが符号を任意に受け付ける。ポイント還元率は購入時の付与ポイント計算に使われるため、負値の保存は業務影響がある。
- 確信度: med

### sheet-20-R044 顧客グループ管理 — 実装違い／IO／P2

- 正本: sheet-20（顧客グループ管理） HTML行 2712 付近
- 正本引用: 「支払方法設定に登録されている支払方法をすべて表示する」
- 設計期待値: 顧客グループの支払方法欄に、支払方法設定に登録されている支払方法がすべて選択肢として並ぶ。
- 画像確認: sheet-20_img1（顧客グループ管理／編集画面）を確認。 図の支払方法チェックボックス群には「コンビニ決済」「クレジットカード決済」が並んでおり、実装ではこの2件が表示されない。
- 実装参照: `src/Eccube/Form/Type/Admin/CustomerGroupType.php:59-65`
- 実装実態: 支払方法の選択肢から2件（クレジットカード決済・コンビニ決済）が明示的に除外されており（src/Eccube/Form/Type/Admin/CustomerGroupType.php:62-63）、支払方法設定の一覧には出るこの2件が顧客グループの支払方法欄に現れない。
- 判定根拠: 支払方法設定画面は絞り込み無しで全件を一覧する（src/Eccube/Controller/Admin/Setting/Shop/PaymentController.php:51-55）のに対し、顧客グループの選択肢は src/Eccube/Form/Type/Admin/CustomerGroupType.php:62-63 で2件を除いている。除外対象の識別値は src/Eccube/Entity/Payment.php:49-50 のクレジットカード決済・コンビニ決済。
- 確信度: med

### sheet-21-R017 ブラックリスト管理 — 実装違い／ふるまい／P2

- 正本: sheet-21（ブラックリスト管理） HTML行 2798 付近
- 正本引用: 「・削除ボタン押下時、該当レコードを削除する」
- 設計期待値: 行の削除ボタンを押した時点で、その行のブラックリスト登録が削除される。
- 画像確認: sheet-21_img1.png: 上段に新規登録用の項目プルダウン(選択してください)とキーワード欄、下段に登録済み行(項目プルダウン+キーワード+削除ボタン)の繰り返し。説明文「項目を選択し、キーワードに入力してください。電話番号は半角数字のみで入力してください。」。右上の登録ボタンは赤枠+矢印で画面下部バーの登録ボタンに対応付け。確認ダイアログの図示は無い。
- 実装参照: `src/Eccube/Resource/template/admin/Customer/blacklist.twig:12-20;src/Eccube/Resource/template/admin/Customer/blacklist.twig:74-81;src/Eccube/Service/Admin/Customer/BlacklistUpdateAction.php:38-45`
- 実装実態: 削除ボタンは行を画面から消して非表示の削除印を立てるだけで(src/Eccube/Resource/template/admin/Customer/blacklist.twig:13-19, src/Eccube/Resource/template/admin/Customer/blacklist.twig:74-81)、登録は残る。実際に消えるのは画面下部の登録ボタンを押して src/Eccube/Service/Admin/Customer/BlacklistUpdateAction.php:42-44 が動いたときであり、登録ボタンを押さずに画面を離れると登録は残ったままになる。
- 判定根拠: src/Eccube/Resource/template/admin/Customer/blacklist.twig:13-19 の削除ボタン押下時の処理は行の非表示化と削除印のチェックだけで、削除要求は送っていない。削除が実際に効くのは登録ボタンでの送信後(src/Eccube/Service/Admin/Customer/BlacklistUpdateAction.php:38-45)。
- 確信度: med

### sheet-22-R035 会員登録仮登録完了メール再送 — 未実装／ふるまい／P2

- 正本: sheet-22（会員登録仮登録完了メール再送） HTML行 2925 付近
- 正本引用: 「会員の送信履歴 再送を行ったときに1件追加する。記録するのは、対象会員・用いたテンプレート・送信した件名・本文・送信日時だけとする。操作した管理者は記録しない」
- 設計期待値: 仮登録メールを再送すると、その会員のメール履歴に1件（対象会員・用いたテンプレート・件名・本文・送信日時）が残り、会員のメール履歴画面から確認できる。
- 画像確認: レイアウト図(sheet-22_img1.png)を確認。会員マスターの検索結果一覧の行末「…」サブメニューに「編集／削除／メール通知／仮会員メール再送」が並び、仮会員メール再送はこのサブメニュー内のリンクとして描かれている。
- 実装参照: `src/Eccube/Controller/Admin/Customer/CustomerController.php:207-243;src/Eccube/Service/MailService.php:530-588`
- 実装実態: 再送してもメール送信履歴が1件も登録されない。会員のメール履歴画面には再送の記録が現れず、いつ誰に再送したかを画面から確認できない。
- 判定根拠: src/Eccube/Controller/Admin/Customer/CustomerController.php:207-243 の再送処理はメール送信と成功メッセージ・遷移だけで、送信履歴を保存する呼び出しが無い。src/Eccube/Service/MailService.php:530-588 も履歴を保存せず戻り値を返さない。同じ書の会員メール一括送信（src/Eccube/Controller/Admin/Customer/CustomerMailController.php:114-116）や手動メール通知（同:266）では履歴を保存しており、再送だけが抜けている。履歴の一覧は src/Eccube/Controller/Admin/Customer/CustomerMailController.php:145-183 と src/Eccube/Resource/template/admin/Customer/mail_history.twig が表示する。
- 確信度: high

### sheet-3-R089 会員検索一覧(検索入力) — 実装違い／ふるまい／P2

- 正本: sheet-3（会員検索一覧(検索入力)） HTML行 1162 付近
- 正本引用: 「フリーワードは空白またはカンマで区切って複数の語を指定でき、指定したすべての語を満たす会員に絞り込む。各語は会員ID・メールアドレス・氏名・氏名カナのいずれかへの部分一致で照合する。」
- 設計期待値: 会員ID・メールアドレス・お名前の欄に空白またはカンマで区切って複数の語を入れたとき、語ごとに会員ID・メールアドレス・氏名・氏名カナのいずれかへ部分一致し、すべての語を満たす会員だけが検索結果に出る。
- 画像確認: 画像1最上部の会員ID・メールアドレス・お名前欄が単一のフリーワード欄であることを確認した(欄の形は一致し、差は照合のしかた)。
- 実装参照: `src/Eccube/Repository/CustomerRepository.php:156-168`
- 実装実態: 入力値から空白(半角/全角)をすべて取り除いて1つの語につなげ、その1語だけで会員ID・氏名・氏名カナ・メールアドレスに部分一致させる。カンマは区切りとして扱われず文字として残るため、「山田,田中」は文字列「山田,田中」を含む会員しか該当しない。複数語の絞り込み(すべての語を満たす)にはならない。
- 判定根拠: src/Eccube/Repository/CustomerRepository.php:156-168 は空白を除去したうえで単一のパラメータで照合しており、語ごとの繰り返し条件が無い。検索条件を加工する箇所は他に無く、app/Plugin/QueryCustomize/Repository/AdminCustomerCustomizer.php:30-37 も条件を追加しない。カスタマイズ要件に会員ID・メールアドレス・お名前欄の変更は挙げられておらず現行踏襲が要求される。
- 確信度: med

### sheet-9-R038 会員登録編集 — 未実装／ふるまい／P2

- 正本: sheet-9（会員登録編集） HTML行 1644 付近
- 正本引用: 「識別ID:37「本人確認ステータス」が未確認以外から未確認に変更、かつ身分証有効期限が入力済みの場合に身分証有効期限を空欄で更新する」
- 設計期待値: 本人確認ステータスを未確認以外から未確認へ変えて会員情報を登録したとき、身分証有効期限が入力済みなら身分証有効期限が空欄になって保存される。
- 画像確認: img1に本人確認ステータス（未確認／確認中／オンライン本人確認済み／簡易書留確認済み）の行があることを確認。身分証有効期限はオンライン本人確認ポップアップ（img1右の導線）側の項目。
- 実装参照: `src/Eccube/Controller/Admin/Customer/CustomerEditController.php:155-199; src/Eccube/Resource/template/admin/Customer/edit.twig:33-46; src/Eccube/Form/Type/Admin/PlayerType.php:79-96`
- 実装実態: 会員情報を登録したときの保存処理には本人確認ステータスの変化を見る処理が無く、身分証有効期限を空にする処理も無い（src/Eccube/Controller/Admin/Customer/CustomerEditController.php:155-199）。身分証有効期限はオンライン本人確認のポップアップからの確定操作でしか書き換わらず（src/Eccube/Controller/Admin/Customer/CustomerEditController.php:230-311）、そこでは本人確認ステータスを確認済みにするだけである。登録ボタン側は本人確認用情報の変更時にステータスを未確認へ書き換えるが（src/Eccube/Resource/template/admin/Customer/edit.twig:33-46）、身分証有効期限は手つかずのまま残る。
- 判定根拠: 本人確認ステータスを未確認へ戻す経路のうち、身分証有効期限を消しているのは有効期限切れ通知の定期処理だけである（src/Eccube/Service/Admin/Customer/IdExpireNotificationAction.php:55-63）。会員登録編集画面からの更新経路には同等の処理が無く、未確認に戻した会員に古い身分証有効期限が残る。
- 確信度: high

### sheet-9-R138 会員登録編集 — 実装違い／IO／P2

- 正本: sheet-9（会員登録編集） HTML行 1760 付近
- 正本引用: 「リンク押下時、買取詳細画面に遷移する」
- 設計期待値: 買取履歴欄の買取番号リンクを押すと、その買取申込の買取詳細画面が開く。
- 画像確認: sheet-9_img4（買取履歴欄の図。買取依頼日／買取番号／申込時金額／査定金額／買取ステータス）を確認。 図では買取番号が青字リンクで描かれており、遷移先が買取詳細であることは項目定義に明記されている。
- 実装参照: `src/Eccube/Resource/template/admin/Customer/edit.twig:975-979`
- 実装実態: 買取番号のリンク先が受注管理の編集画面になっており（src/Eccube/Resource/template/admin/Customer/edit.twig:976）、しかも渡している番号は買取申込の番号のため、同じ番号の受注が開かれるか、無ければページが見つからない扱いになる。買取詳細画面には到達できない。
- 判定根拠: 買取詳細画面は src/Eccube/Controller/Admin/Purchase/PurchaseController.php:220-221 が描画する画面で、買取申込の番号を受け取る。src/Eccube/Resource/template/admin/Customer/edit.twig:976 が指しているのは src/Eccube/Controller/Admin/Order/EditController.php の受注編集画面と同じ遷移先で、購入履歴欄（src/Eccube/Resource/template/admin/Customer/edit.twig:895）と同一の遷移先になっている。
- 確信度: high

### sheet-14-R009 メール配信履歴 — 実装違い／IO／P3

- 正本: sheet-14（メール配信履歴） HTML行 2183 付近
- 正本引用: 「1 テンプレートで絞り込む 単一選択(セレクトボックス) - - すべてのメールを表示する メールテンプレ管理で登録したテンプレートを取得する」
- 設計期待値: 絞り込み欄の見出しは「テンプレートで絞り込む」と表示され、テンプレートを選んでいない状態では選択欄に「すべてのメールを表示する」と表示される。
- 画像確認: sheet-14_img1.png を確認。上段は「メール配信履歴」枠で、左に「テンプレートで絞り込む」の見出し、右のセレクトボックスには「すべてのメールを表示する」が表示されている。一覧は 処理日/通知メール/件名 の3列。下段は件名を見出しとした本文のポップアップで、右下に「閉じる」ボタンがある。
- 実装参照: `src/Eccube/Form/Type/Admin/CustomerMailHistoryType.php:32-36;src/Eccube/Resource/template/admin/Customer/mail_history.twig:40;src/Eccube/Resource/locale/messages.ja.yaml:2561`
- 実装実態: 絞り込み欄の見出しは「テンプレート」と表示され（src/Eccube/Resource/template/admin/Customer/mail_history.twig:40、src/Eccube/Resource/locale/messages.ja.yaml:2561）、未選択時の選択肢は「選択してください」と表示される（src/Eccube/Form/Type/Admin/CustomerMailHistoryType.php:32-36 が見出しも未選択時の文言も指定しないため既定の文言が使われる。src/Eccube/Form/Type/Master/MailTemplateType.php:35）。
- 判定根拠: 項目表の識別ID:1 はラベルを「テンプレートで絞り込む」、初期値を「すべてのメールを表示する」と定めており、レイアウト図でも同じ2つの文言が描かれている。実装の画面文言はいずれも異なる（src/Eccube/Resource/template/admin/Customer/mail_history.twig:40、src/Eccube/Resource/locale/messages.ja.yaml:2561、src/Eccube/Form/Type/Master/MailTemplateType.php:35）。絞り込みそのもののふるまい（選択で絞り込み・未選択で全件）は一致しており、差は画面に出る文言だけなのでP3とした。
- 確信度: high

### sheet-15-R021 手動メール通知(入力画面) — 実装違い／ふるまい／P3

- 正本: sheet-15（手動メール通知(入力画面)） HTML行 2281 付近
- 正本引用: 「テンプレートは会員向けベース（会員・会員英語・ベースなし）に該当するものだけを選択対象とし、自動送信メールのテンプレートは選択対象に含めない。選択肢はテンプレ名称の昇順に並べる。選択対象に該当しないテンプレートを指定したときはページが見つからない扱い（404）とする。」
- 設計期待値: 会員向けベース（会員・会員英語・ベースなし）に該当しないテンプレートや自動送信メールのテンプレートを指定して手動メール作成画面を開こうとしたときは、画面を開かずページが見つからない扱いにする。
- 画像確認: レイアウト図(sheet-15_img1.png)を確認。会員名(値表示)・テンプレ選択(セレクト)・件名・大きな本文欄、右上に「会員編集画面に戻る」ボタン、右に「送信」ボタン、フッタ右に「確認」ボタン、フッタ左に「会員登録」導線。
- 実装参照: `src/Eccube/Controller/Admin/Customer/CustomerMailController.php:188-235;src/Eccube/Form/Type/Admin/CustomerManualMailType.php:44-61`
- 実装実態: 選択肢の絞り込み（会員向けベースのみ・自動送信を除く）と名称昇順は実装されているが、URLで直接指定されたテンプレートIDが選択対象かどうかは検査していない。選択対象外のテンプレートIDを指定しても作成画面が開き、そのテンプレートの件名・本文が読み込まれ、そのまま送信すると送信履歴にもそのテンプレートが記録される。
- 同じ実装実態でまとまる要求: sheet-15-R033（手動メール通知(入力画面) / 実装参照 `src/Eccube/Controller/Admin/Customer/CustomerMailController.php:188-235`）
- 判定根拠: src/Eccube/Form/Type/Admin/CustomerManualMailType.php:51-58 の絞り込みはセレクトボックスの選択肢にだけ効き、src/Eccube/Controller/Admin/Customer/CustomerMailController.php:190 はURLのテンプレートIDを絞り込み無しで解決する。src/Eccube/Controller/Admin/Customer/CustomerMailController.php:213-224 はその値をそのまま使って件名・本文を組み立て、src/Eccube/Controller/Admin/Customer/CustomerMailController.php:266 が送信履歴にそのテンプレートを記録する。ページが見つからない扱いにする分岐は src/Eccube/Controller/Admin/Customer/CustomerMailController.php:188-235 に存在しない。なお選択肢の絞り込み（src/Eccube/Form/Type/Admin/CustomerManualMailType.php:51-58、autoMail=false は src/Eccube/Controller/Admin/Customer/CustomerMailController.php:198）と名称昇順（src/Eccube/Form/Type/Admin/CustomerManualMailType.php:59）は設計どおりである。
- 確信度: high

### sheet-17-R032 配送先編集 — 実装違い／IO／P3

- 正本: sheet-17（配送先編集） HTML行 2434 付近
- 正本引用: 「一覧は会員に紐づく配送先を1件ずつ枠で並べ、配送先ごとに配送先名称・郵便番号・配送先都道府県・住所・配送先氏名・配送先氏名カナ・電話番号・配送先会社名を表示する。配送先都道府県が海外のとき、および配送先都道府県が登録されていないときは、郵便番号と配送先都道府県の代わりに配送先海外用郵便番号と国名を表示する。配送先名称が登録されていない配送先は「名称未設定」と表示する。」
- 設計期待値: 配送先の一覧では、配送先ごとに配送先名称・郵便番号・配送先都道府県・住所・配送先氏名・配送先氏名カナ・電話番号・配送先会社名が並ぶ。都道府県が海外または未登録の配送先は、郵便番号と都道府県の代わりに海外用郵便番号と国名が出る。名称が未登録の配送先は「名称未設定」と出る。
- 画像確認: sheet-17_img1.png: 配送先情報カードに国/配送先氏名/氏名カナ/電話番号/郵便番号(＋郵便番号から自動入力ボタン・郵便番号(海外))/住所(都道府県+3行)/会社名。右上の「会員編集画面に戻る」「配送先情報を更新」は赤枠+矢印で下部バーの「会員登録」リンクと「登録」ボタンに対応付け。「配送先一覧に戻る」は取り消し線で削除指示。
- 実装参照: `src/Eccube/Resource/template/admin/Customer/edit.twig:747-812`
- 実装実態: 一覧に出るのは配送先名称(src/Eccube/Resource/template/admin/Customer/edit.twig:762)・配送先氏名(src/Eccube/Resource/template/admin/Customer/edit.twig:765)・郵便番号と都道府県と住所(src/Eccube/Resource/template/admin/Customer/edit.twig:769)・電話番号(src/Eccube/Resource/template/admin/Customer/edit.twig:773)だけで、配送先氏名カナと配送先会社名は出ない。都道府県が海外・未登録でも表示は郵便番号と都道府県のままで、海外用郵便番号と国名に切り替わらない。名称未登録時に出るのは「会員情報住所 / Membership Information Address」(src/Eccube/Resource/locale/messages.ja.yaml:5702)で「名称未設定」ではない。
- 判定根拠: 配送先の一覧は会員編集画面に埋め込まれた src/Eccube/Resource/template/admin/Customer/edit.twig:747-812 が唯一の実装。設計が挙げる表示項目のうちカナと会社名が欠け、海外時の表示切替も無く、名称未登録時の文言も異なる。
- 確信度: med

### sheet-17-R033 配送先編集 — 実装違い／IO／P3

- 正本: sheet-17（配送先編集） HTML行 2435 付近
- 正本引用: 「既定の配送先として印が付いた配送先には編集・削除の操作を出さない。それ以外の配送先にだけ編集と削除の操作を出す。」
- 設計期待値: 既定の配送先として印が付いた配送先には編集と削除の操作を出さず、それ以外の配送先にだけ出す。
- 画像確認: sheet-17_img1.png: 配送先情報カードに国/配送先氏名/氏名カナ/電話番号/郵便番号(＋郵便番号から自動入力ボタン・郵便番号(海外))/住所(都道府県+3行)/会社名。右上の「会員編集画面に戻る」「配送先情報を更新」は赤枠+矢印で下部バーの「会員登録」リンクと「登録」ボタンに対応付け。「配送先一覧に戻る」は取り消し線で削除指示。
- 実装参照: `src/Eccube/Resource/template/admin/Customer/edit.twig:759-810;src/Eccube/Entity/CustomerAddress.php:418-429`
- 実装実態: 一覧のすべての配送先に編集リンク(src/Eccube/Resource/template/admin/Customer/edit.twig:768)と削除操作(src/Eccube/Resource/template/admin/Customer/edit.twig:775-807)が出る。既定の配送先かどうかで出し分ける記述が無い（既定を示す印自体は src/Eccube/Entity/CustomerAddress.php:418-419 に存在する）。
- 判定根拠: 既定の配送先を守る出し分けが実装に無いため、既定の配送先も管理画面から編集・削除できてしまう。
- 確信度: med

### sheet-17-R039 配送先編集 — 実装違い／IO／P3

- 正本: sheet-17（配送先編集） HTML行 2441 付近
- 正本引用: 「削除の操作は、対象の配送先名称を含む確認を出し、了承したときだけ実行する。」
- 設計期待値: 配送先の削除確認には、対象の配送先名称が示される。
- 画像確認: sheet-17_img1.png: 配送先情報カードに国/配送先氏名/氏名カナ/電話番号/郵便番号(＋郵便番号から自動入力ボタン・郵便番号(海外))/住所(都道府県+3行)/会社名。右上の「会員編集画面に戻る」「配送先情報を更新」は赤枠+矢印で下部バーの「会員登録」リンクと「登録」ボタンに対応付け。「配送先一覧に戻る」は取り消し線で削除指示。
- 実装参照: `src/Eccube/Resource/template/admin/Customer/edit.twig:783-807;src/Eccube/Resource/locale/messages.ja.yaml:1790`
- 実装実態: 確認に差し込まれるのは郵便番号・都道府県・配送先氏名(src/Eccube/Resource/template/admin/Customer/edit.twig:795)で、配送先名称は入らない。
- 判定根拠: 了承したときだけ削除する点(src/Eccube/Resource/template/admin/Customer/edit.twig:783-807)は設計どおりだが、確認文に配送先名称が含まれないため、同じ氏名・地域の配送先が複数あるとどれを消すのか読み取れない。
- 確信度: med

### sheet-18-R035 オンライン本人確認 — 未実装／IO／P3

- 正本: sheet-18（オンライン本人確認） HTML行 2538 付近
- 正本引用: 「閲覧不可の文言 本人確認の閲覧権限が無いとき、各画像枠に表示する」
- 設計期待値: 本人確認の閲覧権限が無い担当者がオンライン本人確認のモーダルを開いたとき、身分証画像は表示されず、各画像枠に「閲覧不可」という文言が表示される。
- 画像確認: sheet-18_img1.png を確認。モーダル「オンライン本人確認」に お名前／お名前（フリガナ）／国／郵便番号／海外用郵便番号／都道府県／住所（3行目に（海外用住所3））／生年月日／職業 のラベルと、本人写真・顔写真付きの身分証明書（表）（裏）（斜め）の画像枠、身分証有効期限の入力欄、右下に「取消」「確認済に変更する」ボタンが描かれている。
- 実装参照: `src/Eccube/Resource/template/admin/Customer/edit.twig:245-299; src/Eccube/Resource/locale/messages.ja.yaml:2797-2801`
- 実装実態: モーダルは閲覧権限を見ずに画像枠を出力し、未登録のときだけ「登録データなし」を出す。「閲覧不可」という文言は画面にも文言定義にも存在せず、権限が無い担当者には画像が取得できないまま枠だけが残る。
- 同じ実装実態でまとまる要求: sheet-18-R051（オンライン本人確認）
- 判定根拠: src/Eccube/Resource/template/admin/Customer/edit.twig:245-299 に権限による表示分岐が無く、src/Eccube/Resource/locale/messages.ja.yaml:2797-2801 の身分証画像まわりの文言にも「閲覧不可」が無い。「閲覧不可」の語は権限名の設定値（app/config/eccube/packages/eccube.yaml）にあるだけで画面文言ではない。
- 確信度: high

### sheet-20-R039 顧客グループ管理 — 実装違い／IO／P3

- 正本: sheet-20（顧客グループ管理） HTML行 2707 付近
- 正本引用: 「初期表示は「新規追加」、既存の顧客グループ選択時は「編集」」
- 設計期待値: 顧客グループ管理画面を開いた直後は入力フォームの見出しが「新規追加」と表示され、一覧から既存の顧客グループを選ぶと「編集」に変わる。
- 画像確認: sheet-20_img1（顧客グループ管理／編集画面）を確認。 図の入力フォームの見出しは「編集」。実装は常に「顧客グループ管理」。
- 実装参照: `src/Eccube/Resource/template/admin/CustomerGroup/index.twig:20; src/Eccube/Controller/Admin/Customer/CustomerGroupController.php:44-53`
- 実装実態: 入力フォームのカード見出しは常に固定文言「顧客グループ管理」で（src/Eccube/Resource/template/admin/CustomerGroup/index.twig:20、src/Eccube/Resource/locale/messages.ja.yaml:4155）、新規時と既存グループ選択時で表示が切り替わらない。画面見出し（src/Eccube/Resource/template/admin/CustomerGroup/index.twig:5-6）も常に「顧客グループ管理／顧客グループ編集」で固定。
- 判定根拠: レイアウト図では入力フォームのカード見出しが「編集」になっており、識別ID1のラベルが状態によって切り替わる想定であることが読み取れる。実装のテンプレート全文を読んだが分岐は無い。
- 確信度: med

### sheet-20-R040 顧客グループ管理 — 実装違い／ふるまい／P3

- 正本: sheet-20（顧客グループ管理） HTML行 2708 付近
- 正本引用: 「・登録ボタン押下時、フォーム内容の入力チェックをサーバ側で行う」
- 設計期待値: 名称を空のまま、または255文字を超える名称で登録したとき、保存されずに入力エラーが表示される。
- 画像確認: sheet-20_img1（顧客グループ管理／編集画面）を確認。
- 実装参照: `src/Eccube/Form/Type/Admin/CustomerGroupType.php:36-38`
- 実装実態: 名称の入力欄にはサーバ側の必須・文字数の検証が付いていない（src/Eccube/Form/Type/Admin/CustomerGroupType.php:36-38）。ブラウザの必須指定を経由しない送信では空の名称がそのまま保存され、255文字超はデータベース側のエラーになる。
- 判定根拠: 項目定義の識別ID2「名称」は必須○・最大255文字。src/Eccube/Form/Type/Admin/CustomerGroupType.php 全文を読んだが name には制約が無く（同ファイル 36-38 行）、検証定義ファイルも存在しない。同じフォームのポイント還元率には src/Eccube/Form/Type/Admin/CustomerGroupType.php:41-44 のようにサーバ側制約が付いている。
- 確信度: med

### sheet-20-R058 顧客グループ管理 — 実装違い／ふるまい／P3

- 正本: sheet-20（顧客グループ管理） HTML行 2731 付近
- 正本引用: 「画面も一覧も表示せず、ページが見つからない扱い（404）とする」
- 設計期待値: 存在しない顧客グループを指定して編集画面を開こうとしたとき、画面も一覧も表示されず、ページが見つからない扱いになる。
- 画像確認: sheet-20_img1（顧客グループ管理／編集画面）を確認。
- 実装参照: `src/Eccube/Controller/Admin/Customer/CustomerGroupController.php:42-48`
- 実装実態: 編集用のIDを受け取る側が「見つからなければ空」を許す指定になっているため（src/Eccube/Controller/Admin/Customer/CustomerGroupController.php:44）、存在しないIDを指定しても404にならず、新規追加状態のフォームと一覧を伴う画面が正常表示される（src/Eccube/Controller/Admin/Customer/CustomerGroupController.php:46-48）。削除側は404になる（src/Eccube/Controller/Admin/Customer/CustomerGroupController.php:93）。
- 判定根拠: 見つからないときに404を出すかどうかは受け取り側が空を許すかで決まる（vendor/symfony/doctrine-bridge/ArgumentResolver/EntityValueResolver.php:85-86）。削除は空を許さない指定のため404になり、編集は空を許すため404にならない。
- 確信度: med

### sheet-22-R029 会員登録仮登録完了メール再送 — 実装違い／IO／P3

- 正本: sheet-22（会員登録仮登録完了メール再送） HTML行 2918 付近
- 正本引用: 「差出人 店舗基本情報の返信受付メールアドレス。表示名は店舗基本情報の店名」
- 設計期待値: 再送される仮登録メールの差出人が、店舗基本情報の返信受付メールアドレス（表示名は店名）で届く。
- 画像確認: レイアウト図(sheet-22_img1.png)を確認。会員マスターの検索結果一覧の行末「…」サブメニューに「編集／削除／メール通知／仮会員メール再送」が並び、仮会員メール再送はこのサブメニュー内のリンクとして描かれている。
- 実装参照: `src/Eccube/Service/MailService.php:549`
- 実装実態: 差出人には店舗基本情報の送信元メールアドレスを設定しており、返信受付メールアドレスではない。表示名は店名で一致する。
- 判定根拠: src/Eccube/Service/MailService.php:549 は getEmail01()（送信元メールアドレス）を差出人に設定している。返信受付メールアドレス getEmail03() は src/Eccube/Service/MailService.php:552 の返信先にだけ使われている。正本は同じ書の sheet-5 では差出人をメールアドレス1と明記しており、本シートだけ返信受付メールアドレスと書き分けているため、記述の取り違えではないと判断した。
- 確信度: med

### sheet-22-R033 会員登録仮登録完了メール再送 — 実装違い／IO／P3

- 正本: sheet-22（会員登録仮登録完了メール再送） HTML行 2922 付近
- 正本引用: 「言語 画面の表示言語が英語のときも、日本語のテンプレートで送る。英語のテンプレートを用いる場合は無い」
- 設計期待値: 管理画面の表示言語が英語のときも、再送される仮登録メールは日本語のテンプレートの内容（件名・本文）で届く。
- 画像確認: レイアウト図(sheet-22_img1.png)を確認。会員マスターの検索結果一覧の行末「…」サブメニューに「編集／削除／メール通知／仮会員メール再送」が並び、仮会員メール再送はこのサブメニュー内のリンクとして描かれている。
- 実装参照: `src/Eccube/Service/MailService.php:535-537;app/config/eccube/packages/eccube.yaml:229-231`
- 実装実態: 再送に使うテンプレートを画面の表示言語で切り替えており、表示言語が英語のときは英語の仮会員登録テンプレート（【販売/英】仮会員登録）で送られる。
- 判定根拠: src/Eccube/Service/MailService.php:536 が表示言語をキーにしてテンプレートのmail_keyを選び、app/config/eccube/packages/eccube.yaml:229-231 が ja/en で別のテンプレートを割り当てている。英語時は app/DoctrineMigrations/Version20251204111453.php:110-119 の「【販売/英】仮会員登録」が使われ、件名・本文とも英語になる。日本語固定にする分岐は無い。
- 確信度: med

### sheet-22-R036 会員登録仮登録完了メール再送 — 実装違い／ふるまい／P3

- 正本: sheet-22（会員登録仮登録完了メール再送） HTML行 2926 付近
- 正本引用: 「会員データ自体は、いずれの場合も更新しない。」
- 設計期待値: 仮登録メールを再送しても会員の登録内容は変わらず、先に送った仮登録メールに載っていた本登録用URLもそのまま使える。
- 画像確認: レイアウト図(sheet-22_img1.png)を確認。会員マスターの検索結果一覧の行末「…」サブメニューに「編集／削除／メール通知／仮会員メール再送」が並び、仮会員メール再送はこのサブメニュー内のリンクとして描かれている。
- 実装参照: `src/Eccube/Controller/Admin/Customer/CustomerController.php:218-221`
- 実装実態: 再送のたびに会員の本登録用URLの鍵を作り直して会員を更新するため、先に送った仮登録メールの本登録用URLは使えなくなる。
- 判定根拠: src/Eccube/Controller/Admin/Customer/CustomerController.php:218-221 が会員に新しい秘密鍵を設定して保存し、src/Eccube/Controller/Admin/Customer/CustomerController.php:223-227 がその鍵で本登録用URLを作る。会員を更新しない実装ではないため、再送前に届いていたメールのURLは無効になる。
- 確信度: med

### sheet-4-R055 会員検索一覧(検索結果) — 実装違い／IO／P3

- 正本: sheet-4（会員検索一覧(検索結果)） HTML行 1279 付近
- 正本引用: 「11	サブメニュー	リンク	-	-	-	選択肢:編集、削除、メール通知、仮会員メール再送」
- 設計期待値: 行末のサブメニューを開くと、編集・削除・メール通知・仮会員メール再送の4つが選べる。
- 画像確認: sheet-4_img1.png: 検索結果ヘッダ左からチェック欄・会員ID・会員名・電話番号・メールアドレス・メール履歴アイコン、行末は「…」1つ。上部に顧客分析タグ/既存タグ削除/新規タグ追加/件数/CSVダウンロード/その他、下部にページャ。
- 実装参照: `src/Eccube/Resource/template/admin/Customer/index.twig:465-487`
- 実装実態: サブメニュー(src/Eccube/Resource/template/admin/Customer/index.twig:480-487)に並ぶのはメール通知と仮会員メール再送の2つだけで、編集と削除はサブメニューの外に別アイコンとして置かれている(src/Eccube/Resource/template/admin/Customer/index.twig:467-475)。
- 判定根拠: レイアウト図では各行の右端は「…」1つだけで、編集・削除の独立アイコンは無い。項目表も識別ID:11 サブメニューの選択肢として編集・削除を含めている。実装は編集・削除をサブメニュー外の別ボタンに出しており、行の操作の並びが設計と異なる。
- 確信度: med

### sheet-5-R036 メール一括送信 — 実装違い／IO／P3

- 正本: sheet-5（メール一括送信） HTML行 1354 付近
- 正本引用: 「メールの文字コード設定が iso-2022-jp のときは、本文を iso-2022-jp へ変換し、転送方式を 7bit にする。設定していないときは変換も転送方式の指定もしない。」
- 設計期待値: メールの文字コード設定を iso-2022-jp にしているとき、一括送信されるメールの本文が iso-2022-jp の文字コードで届く（設定していないときは変換されない）。
- 画像確認: レイアウト図(sheet-5_img1.png)を確認。上部にタイトル・本文の入力欄、下部に「送信内容を確認」ボタンと「検索結果へ戻る」リンク、フッタ左に「会員一覧」導線。
- 実装参照: `src/Eccube/Service/MailService.php:1066-1087;src/Eccube/Util/MailUtil.php:49-61`
- 実装実態: 会員メール一括送信の経路では文字コード変換も転送方式の指定も一切行っておらず、設定を iso-2022-jp にしても本文は UTF-8 のまま送られる。
- 判定根拠: src/Eccube/Service/MailService.php:1070-1077 は Email を組み立てて src/Eccube/Service/MailService.php:1080 で送信するだけで、文字コード変換を行う src/Eccube/Util/MailUtil.php:49-61 を呼んでいない。MailUtil を呼ぶ箇所は src/Eccube/Service/MailService.php:503-504 など他機能の4か所のみで、一括送信は含まれない。設定していないときの挙動（変換しない）は一致するため、差が出るのは iso-2022-jp を設定したときに限られる。
- 確信度: med

### sheet-6-R012 メール一括送信確認 — 実装違い／IO／P3

- 正本: sheet-6（メール一括送信確認） HTML行 1413 付近
- 正本引用: 「5	戻る	ボタン	-	-	-	メール一括送信入力画面に遷移」
- 設計期待値: メール一括送信確認画面の下部の操作領域に「戻る」という名のボタンが置かれ、押すとメール一括送信入力画面に戻る。
- 画像確認: sheet-6_img1.png を確認。見出しは「会員管理 メール一括送信」。上部の「メール配信」カードは「タイトル」「本文」を編集不可の文字で並べ、右横に「以下のユーザーに一括送信します。」の注記。中央の赤枠に「戻る」「メール送信」の2ボタンがあり、赤線で画面下部の固定バーにある同じ2ボタン（左に「戻る」、右に「メール送信」）へ結ばれている。下部の「配信対象者」カードは会員ID／会員名の2列で、会員名は青いリンク、会員IDは1〜5の昇順で並ぶ。検索結果へ戻る導線は図中に無い。
- 実装参照: `src/Eccube/Resource/template/admin/Customer/mail_confirm.twig:99`
- 実装実態: 戻り操作は下部操作領域の左端に置かれた「メール一括送信」という名のリンク（左向き矢印付き）で、「戻る」という名のボタンは無い。押下でメール一括送信入力画面へ戻る点は一致する。
- 判定根拠: src/Eccube/Resource/template/admin/Customer/mail_confirm.twig:99 の戻り導線の文言は src/Eccube/Resource/locale/messages.ja.yaml:2835 の「メール一括送信」で、遷移先の画面名がそのまま名前になっている。設計の項目表とレイアウト図はどちらもこの操作を「戻る」という名のボタンとして描き、下部バーの右側に「メール送信」と並べている。名前が「メール一括送信」だと、この画面から先へ進む操作と読めてしまい、戻る操作であることが画面から読み取れない。遷移先（src/Eccube/Controller/Admin/Customer/CustomerMailController.php:132-139 で入力画面を再描画）は設計どおり。
- 確信度: high

### sheet-9-R109 会員登録編集 — 実装違い／IO／P3

- 正本: sheet-9（会員登録編集） HTML行 1716 付近
- 正本引用: 「単一選択(ラジオボタン) - - - 選択肢：仮会員、本会員」
- 設計期待値: 会員ステータスは「仮会員」「本会員」の2つが画面上に並んで表示され、どちらか一方を直接選べる。
- 画像確認: sheet-9_img1（会員登録・編集の全体図）を確認。 図の右上枠は「◯仮会員 ◯本会員」のラジオ2択。図下部の現行バーは「単一選択▼」のプルダウンで、赤矢印は下部バーの部品が右上枠へ移ることを示す。
- 実装参照: `src/Eccube/Form/Type/Master/CustomerStatusType.php:42-46; src/Eccube/Resource/template/admin/Customer/edit.twig:1076`
- 実装実態: 会員ステータスの入力部品はプルダウン（折りたたみ形式）として作られており（src/Eccube/Form/Type/Master/CustomerStatusType.php:42-46）、選択肢も会員ステータスの区分値を全件並べるため「仮会員」「本会員」に加えて「退会」が並ぶ（src/Eccube/Form/Type/MasterType.php:29-37、区分値は src/Eccube/Entity/Master/CustomerStatus.php:45-59）。
- 判定根拠: レイアウト図の右上枠には「仮会員」「本会員」のラジオボタンが2つ並んで描かれている。実装は src/Eccube/Form/Type/Master/CustomerStatusType.php:44 で展開表示を無効にしているためプルダウンで描画され、src/Eccube/Resource/template/admin/Customer/edit.twig:1076 でそのまま出力される。
- 確信度: med

### sheet-9-R156 会員登録編集 — 実装違い／IO／P3

- 正本: sheet-9（会員登録編集） HTML行 1782 付近
- 正本引用: 「先頭100件までを表示する」
- 設計期待値: 購入履歴欄には新しいものから最大100件までが表示され、それより古い受注は画面に出ない。
- 画像確認: sheet-9_img3（購入履歴欄の図。注文日時／受注番号／購入金額／発送日／支払方法）を確認。
- 実装参照: `src/Eccube/Controller/Admin/Customer/CustomerEditController.php:117-125`
- 実装実態: 購入履歴欄は件数上限を持たず、ページ送りで全件を辿れる（src/Eccube/Controller/Admin/Customer/CustomerEditController.php:117-125、1ページの表示件数は既定値または画面上の件数選択で決まる src/Eccube/Controller/Admin/Customer/CustomerEditController.php:99-115、ページ送りは src/Eccube/Resource/template/admin/Customer/edit.twig:908-912）。100件で打ち切る扱いは無い。
- 同じ実装実態でまとまる要求: sheet-9-R157（会員登録編集 / 実装参照 `src/Eccube/Controller/Admin/Customer/CustomerEditController.php:144-153`）
- 判定根拠: src/Eccube/Repository/OrderRepository.php:608-619 の取得条件にも src/Eccube/Controller/Admin/Customer/CustomerEditController.php:117-125 にも件数の上限指定が無い。表示は src/Eccube/Resource/template/admin/Customer/edit.twig:891-905 の繰り返しで、src/Eccube/Resource/template/admin/Customer/edit.twig:874-877 の件数選択に従う。
- 確信度: med

### sheet-9-R159 会員登録編集 — 実装違い／IO／P3

- 正本: sheet-9（会員登録編集） HTML行 1785 付近
- 正本引用: 「受注番号を持たない受注は、受注番号の欄に「-」と表示する。」
- 設計期待値: 受注番号が付いていない受注は、購入履歴欄の受注番号の欄に「-」が表示される。
- 画像確認: sheet-9_img3（購入履歴欄の図。注文日時／受注番号／購入金額／発送日／支払方法）を確認。
- 実装参照: `src/Eccube/Resource/template/admin/Customer/edit.twig:895-897`
- 実装実態: 受注番号の欄は受注番号をそのまま出力しており（src/Eccube/Resource/template/admin/Customer/edit.twig:896）、受注番号が未設定の受注では空のリンクが表示されるだけで「-」は出ない。
- 判定根拠: 受注番号は未設定を許す項目（src/Eccube/Entity/Order.php:693-694）。同じ表の発送日は src/Eccube/Resource/template/admin/Customer/edit.twig:901 で未設定時の代替文言を持つのに対し、受注番号（src/Eccube/Resource/template/admin/Customer/edit.twig:896）には代替文言が無い。
- 確信度: med

### sheet-9-R160 会員登録編集 — 実装違い／IO／P3

- 正本: sheet-9（会員登録編集） HTML行 1786 付近
- 正本引用: 「買取番号は7桁のゼロ埋めで表示する。」
- 設計期待値: 買取履歴欄の買取番号は7桁のゼロ埋め（例 0012345）で表示される。
- 画像確認: sheet-9_img4（買取履歴欄の図。買取依頼日／買取番号／申込時金額／査定金額／買取ステータス）を確認。
- 実装参照: `src/Eccube/Resource/template/admin/Customer/edit.twig:975-978`
- 実装実態: 買取番号をゼロ埋めせずそのまま出力している（src/Eccube/Resource/template/admin/Customer/edit.twig:977）。
- 判定根拠: 同じ買取番号は他の管理画面ではゼロ埋め表示になっている（src/Eccube/Resource/template/admin/Purchase/detail.twig:136、src/Eccube/Resource/template/admin/Purchase/index.twig:235）。会員編集の買取履歴欄だけ書式が異なる。
- 確信度: high

## 掲載しなかった判定

- 区分が「表示メッセージ」の指摘 2件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0207/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 6 | 0 | 0 | 0 | 6 |
| sheet-2 | 目次 | 25 | 0 | 0 | 0 | 25 |
| sheet-3 | 会員検索一覧(検索入力) | 120 | 0 | 1 | 0 | 119 |
| sheet-4 | 会員検索一覧(検索結果) | 57 | 0 | 1 | 0 | 56 |
| sheet-5 | メール一括送信 | 40 | 0 | 1 | 0 | 39 |
| sheet-6 | メール一括送信確認 | 14 | 0 | 1 | 1 | 12 |
| sheet-7 | メール一括送信完了 | 5 | 0 | 0 | 0 | 5 |
| sheet-8 | 顧客情報CSV出力項目設定 | 64 | 0 | 0 | 0 | 64 |
| sheet-9 | 会員登録編集 | 210 | 1 | 6 | 0 | 203 |
| sheet-10 | ポイント付与 | 27 | 0 | 2 | 0 | 25 |
| sheet-11 | ポイント付与（キャンペーン、特別対応） | 25 | 0 | 1 | 0 | 24 |
| sheet-12 | ポイント付与（余剰入金へのご返金、注文金額変更によるご返金 | 25 | 0 | 1 | 0 | 24 |
| sheet-13 | ポイント履歴確認 | 29 | 0 | 0 | 0 | 29 |
| sheet-14 | メール配信履歴 | 28 | 0 | 1 | 0 | 27 |
| sheet-15 | 手動メール通知(入力画面) | 36 | 0 | 2 | 0 | 34 |
| sheet-16 | 【新規】手動メール通知(確認画面) | 15 | 0 | 0 | 0 | 15 |
| sheet-17 | 配送先編集 | 52 | 0 | 3 | 0 | 49 |
| sheet-18 | オンライン本人確認 | 63 | 4 | 0 | 0 | 59 |
| sheet-19 | 【新規】顧客分析タグ | 39 | 0 | 0 | 0 | 39 |
| sheet-20 | 顧客グループ管理 | 67 | 0 | 7 | 0 | 60 |
| sheet-21 | ブラックリスト管理 | 53 | 0 | 1 | 0 | 52 |
| sheet-22 | 会員登録仮登録完了メール再送 | 37 | 1 | 3 | 0 | 33 |
| sheet-23 | 【新規】顧客分析タグ登録CSV入力項目設定 | 8 | 0 | 0 | 0 | 8 |
| sheet-24 | 【新規】会員顧客分析タグ情報CSV出力項目設定 | 7 | 0 | 0 | 0 | 7 |
| sheet-25 | 配送先情報CSV登録 | 14 | 0 | 0 | 0 | 14 |
| sheet-26 | 配送先情報登録CSV入力項目設定 | 25 | 0 | 0 | 0 | 25 |

