# 実装乖離監査 — 0204_基本設計仕様書(商品管理).html

- 正本: `excel_to_html/output/0204_基本設計仕様書(商品管理).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **3968要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 114 | ○ |
| 実装違い | 実装はあるが設計と違う | 123 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 28 | — |
| 設計どおり | 設計どおり実装されている | 2447 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 1239 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 17 | — |
| **合計** | | **3968** | |

## 不具合 104件（P1 5 / P2 48 / P3 51）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 123件は重複として代表へ折り畳んだ（判定そのものは 227件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-48-R049 | 高額商品価格変更CSVアップロード | 実装違い | ふるまい | P1 | 高額対象の規格が無い行に当たったとき、その時点で取込を止め、それまでの行の価格更新も後続の行の更新も一切残らないこと。また削除済みの商品・規格は価格更新の対象にならないこと。 |
| sheet-62-R011 | 別添資料__スマレジ連携機能一覧 | 未実装 | ふるまい | P1 | 買取・基準価格一括編集で更新した価格が、その場でスマレジ側の商品にも反映される |
| sheet-62-R036 | 別添資料__スマレジ連携機能一覧 | 未実装 | ふるまい | P1 | 高額商品価格変更CSV登録で更新した価格がスマレジ側へ反映される |
| sheet-66-R006 | 別添資料__スマレジ連携__呼び出しAPIについて | 未実装 | ふるまい | P1 | 商品を廃止したとき、その商品に紐づく規格がスマレジ側から取り除かれる |
| sheet-66-R038 | 別添資料__スマレジ連携__呼び出しAPIについて | 未実装 | ふるまい | P1 | 部門更新CSV登録で商品に設定した部門が、スマレジ側の商品の部門にも反映される（常に更新として扱われる） |
| sheet-11-R089 | グッズ商品CSV登録 | 実装違い | ふるまい | P2 | 商品カテゴリ(ID)列には、サプライ・グッズ／予約グッズ／情報商材の系統に属するカテゴリだけを受け付け、それ以外のカテゴリを指定した行はエラーにして取り込まない。 |
| sheet-13-R039 | グッズ商品CSVフォーマット | 実装違い | IO | P2 | CSVの原価単価に設定した値が、取り込んだ商品に登録・更新される。 |
| sheet-16-R024 | 売上分析タグ登録編集 | 実装違い | IO | P2 | 編集の画面を開いているときは、新規登録の入力欄へ戻す操作が画面にある。存在しない売上分析タグを指定した編集表示・保存は、画面を出さず・何も登録せず、見つからない旨の応答になる。 |
| sheet-16-R029 | 売上分析タグ登録編集 | 実装違い | ふるまい | P2 | 登録済みの売上分析タグと同じ値を保存しようとしたときは登録・更新されず、重複している旨のエラーを付けた一覧と入力欄の画面が返る。 |
| sheet-19-R044 | 商品公開CSV登録 | 実装違い | ふるまい | P2 | 設定された大きさの上限を超えるファイルを送った時に、取込が行われないだけでなく、その理由が分かるメッセージが画面に出る。 |
| sheet-22-R010 | 商品規格登録編集 | 未実装 | ふるまい | P2 | 公開ステータスが「非公開」または「廃止」の商品規格は、フロント（商品詳細・商品一覧）に表示されない。 |
| sheet-22-R129 | 商品規格登録編集 | 未実装 | ふるまい | P2 | 商品規格を更新したとき、当該商品の更新が支店システムへ通知される。 |
| sheet-22-R132 | 商品規格登録編集 | 未実装 | ふるまい | P2 | 販売価格に買取価格を下回る値を入れて登録・更新すると、保存されず販売価格欄の直下に買取価格を差し込んだエラー文言が表示される。 |
| sheet-22-R136 | 商品規格登録編集 | 実装違い | ふるまい | P2 | 削除された商品規格は記録として残したまま一覧や選択肢から外れ、価格履歴など関連する記録も消えない。 |
| sheet-23-R051 | 買取・基準価格一括編集 | 実装違い | IO | P2 | 基準価格(NM)は必須項目で、未入力のまま登録できない。未入力で登録すると更新されずエラーが表示される。 |
| sheet-23-R080 | 買取・基準価格一括編集 | 実装違い | ふるまい | P2 | 良品(NM)規格が実在しない行や買取価格マスタに該当が無い行があっても、その行だけがエラーとして通知され、残りの行の買取価格更新と価格履歴追加は実施される。 |
| sheet-23-R103 | 買取・基準価格一括編集 | 未実装 | ふるまい | P2 | 登録が完了したとき、対象商品の商品情報が更新されたことが支店システムへ通知される。通知に失敗しても画面は完了のままとし、失敗した対象が連携エラーとして記録される。 |
| sheet-27-R026 | タグ登録 | 未実装 | ふるまい | P2 | タイトル(日)に値があるとき、その値が日本語の商品検索ページのページタイトルとして表示される。 |
| sheet-27-R041 | タグ登録 | 実装違い | ふるまい | P2 | 存在しないタグIDを指定して開いたときは、画面を返さず要求を受け付けない。 |
| sheet-28-R036 | 略称タグ登録 | 未実装 | ふるまい | P2 | 既存の略称タグと同じ名称で保存しようとしたときは保存せず、一覧画面へ戻して失敗を知らせる。 |
| sheet-3-R034 | 商品マスター(検索入力) | 実装違い | IO | P2 | 商品名(日/英)欄に語を入れて検索すると、日本語の商品名に一致する商品だけでなく、英語の商品名に一致する商品も結果に出る。 |
| sheet-3-R037 | 商品マスター(検索入力) | 実装違い | IO | P2 | カード名欄に語を入れて検索すると、日本語のカード名に一致する商品だけでなく、英語のカード名に一致する商品も結果に出る。 |
| sheet-3-R077 | 商品マスター(検索入力) | 実装違い | IO | P2 | 商品名・カード名・コード欄は空白やカンマで区切った複数の語を受け付け、入力した語をすべて含む商品だけが結果に出る。ID欄は入力した値と一致する商品だけが結果に出る。 |
| sheet-3-R083 | 商品マスター(検索入力) | 未実装 | IO | P2 | 部門の検索条件で「未設定」を選ぶことができ、選ぶと部門が設定されていない規格も検索結果に出る。 |
| sheet-32-R045 | 部門登録 | 実装違い | IO | P2 | 存在しない部門IDで編集画面を開こうとしたときは、その旨（見つかりません）の応答を返し、画面を出さない。 |
| sheet-32-R050 | 部門登録 | 未実装 | ふるまい | P2 | 部門名または部門コードが既存の部門と同じ値のときは登録・更新せず、値が重複している旨を画面にエラー表示する。 |
| sheet-34-R033 | 部門登録CSVアップロード | 未実装 | ふるまい | P2 | 同じファイルの中でID・部門名・部門コードが重複していたら、どの列の何行目かを示すエラーを出して1件も取り込まない。 |
| sheet-36-R036 | 棚番登録 編集 | 実装違い | ふるまい | P2 | 存在しない棚番号を指定した要求に対しては、ページが見つからない扱いの応答を返す。 |
| sheet-38-R009 | 購入グループ管理 | 実装違い | ふるまい | P2 | 予約商品フラグが立っている購入グループに属する商品は、フロントの買取一覧にも買取詳細にも出てこない。 |
| sheet-39-R061 | 買取・販売価格履歴検索 | 実装違い | ふるまい | P2 | 商品マスターの一覧から価格履歴を開いたときは、渡された商品（NM指定の導線では加えて状態）だけを条件に検索し、一覧は登録日時の新しい順、同じ日時では状態の昇順で並ぶ。 |
| sheet-42-R047 | 基準価格変更CSVアップロード | 未実装 | IO | P2 | 基準価格変更CSVアップロード画面から低価格帯カード価格変更CSVを出力できる。 |
| sheet-42-R060 | 基準価格変更CSVアップロード | 実装違い | ふるまい | P2 | 1行の買取価格が同じ行の基準価格（販売価格）を上回るときは、その行でエラーを表示して取込全体を打ち切り、価格を更新しない。 |
| sheet-42-R071 | 基準価格変更CSVアップロード | 未実装 | ふるまい | P2 | 取込確定後、取り込んだ商品IDが重複を除いて支店システムへ通知される。 |
| sheet-44-R006 | セール用価格変更CSVアップロード | 実装違い | ふるまい | P2 | セールフラグを無効へ切り替えた商品規格の販売価格が、登録済の基準価格と同じ額になること。 |
| sheet-44-R044 | セール用価格変更CSVアップロード | 実装違い | ふるまい | P2 | CSVの価格が反映されていない旨のアラートが画面に出たうえで、その取込自体は成功として扱われ、完了メッセージが出てCSVインポート履歴にも記録されること。 |
| sheet-44-R100 | セール用価格変更CSVアップロード | 未実装 | ふるまい | P2 | 取込が成功したとき、取り込んだ商品が重複なくまとめて支店システムへ通知され、支店側に価格の変更が伝わること。 |
| sheet-45-R007 | セール用価格変更CSVフォーマット | 実装違い | IO | P2 | セールフラグを空欄にした行はエラーとして扱われ、その行の販売価格・買取価格・セールフラグは更新されない。 |
| sheet-45-R022 | セール用価格変更CSVフォーマット | 実装違い | ふるまい | P2 | セール用価格変更CSVの取込で価格が変わり連携条件を満たすようになった商品規格は、スマレジ連携の対象（連携フラグ有効）になる。 |
| sheet-48-R011 | 高額商品価格変更CSVアップロード | 未実装 | ふるまい | P2 | 高額商品価格変更CSVで価格を更新したとき、その商品規格の買取・販売価格履歴が1件残り、履歴に基準価格の更新前と更新後が記録されること。 |
| sheet-5-R086 | 商品登録編集 | 実装違い | ふるまい | P2 | 商品名(英)・商品カテゴリ（1件以上）・購入グループ・サイズ・重量・割引率・販売制限を空／未選択のまま保存しようとした場合、商品は更新されず、編集画面に項目ごとのエラーを表示して留まる。 |
| sheet-50-R078 | セール用高額商品価格変更CSVアップロード | 実装違い | ふるまい | P2 | 削除済みの商品・商品規格は取込の更新対象にならず、該当行はデータ無しとして扱われる。 |
| sheet-51-R062 | セール用高額商品価格変更CSVフォーマット | 実装違い | IO | P2 | セールフラグが無効のままの行では、その商品の販売価格・買取価格は変更できない旨を画面上のアラートに表示する。 |
| sheet-55-R003 | 略称タグ更新CSVフォーマット | 未実装 | IO | P2 | 略称タグ更新CSVの1列目で商品IDを必須項目として受け付け、数値(整数)でない値や空の行、該当する商品が無い行はエラーとして取り込まない。 |
| sheet-6-R024 | セール用価格変更CSV出力 | 実装違い | IO | P2 | セール用価格変更CSVの1行は状態NMの規格1件に対応し、状態がNM以外の規格は行として出力されない。規格があっても状態NMの規格が1件も無い商品は行が出ない。 |
| sheet-63-R016 | 別添資料__スマレジ連携__商品連携項目 | 実装違い | IO | P2 | スマレジの品番には、スマレジ商品コードではなくECCUBEの商品コードが入る。 |
| sheet-63-R044 | 別添資料__スマレジ連携__商品連携項目 | 実装違い | ふるまい | P2 | 商品編集の商品削除でも、スマレジ側の該当商品が削除される。 |
| sheet-65-R013 | 別添資料__スマレジ連携対象商品 | 実装違い | ふるまい | P2 | いったんONになったスマレジ連携フラグは、手動でOFFにしない限り、その後に連携条件を満たさなくなってもONのままで連携が続くこと。 |
| sheet-65-R016 | 別添資料__スマレジ連携対象商品 | 実装違い | ふるまい | P2 | 商品の状態が公開・非公開のいずれでも連携対象になり、非公開にしただけでスマレジ連携が外れないこと。 |
| sheet-65-R037 | 別添資料__スマレジ連携対象商品 | 実装違い | ふるまい | P2 | カード商品CSV取込の自動判定は基準価格が300円以上かつ状態がSP・MP・HP・その他規格のときにスマレジ連携フラグがONになること。 |
| sheet-65-R052 | 別添資料__スマレジ連携対象商品 | 実装違い | ふるまい | P2 | 基準価格変更CSVでシングルカードの基準価格を閾値以上に上げたとき、スマレジ連携フラグがONになり連携対象に入ること。 |
| sheet-65-R076 | 別添資料__スマレジ連携対象商品 | 実装違い | IO | P2 | カード商品CSVで新規登録した状態NM以外の商品規格の部門が「ショーケース品」になり、その部門でスマレジに登録されること。 |
| sheet-8-R023 | カード商品CSV登録 | 実装違い | ふるまい | P2 | 新規登録行では、CSVの「基準価格」の値が商品規格の基準価格と販売価格の双方に反映される（セール外と同じ扱い）。 |
| sheet-8-R068 | カード商品CSV登録 | 未実装 | ふるまい | P2 | CSVファイルのアップロードボタンを押下すると確認モーダルが表示され、利用者が確認したうえで取込が始まる。 |
| sheet-11-R069 | グッズ商品CSV登録 | 未実装 | IO | P3 | CSVインポート履歴の一覧の上に、該当する履歴の全件数を表示する。 |
| sheet-16-R030 | 売上分析タグ登録編集 | 実装違い | IO | P3 | 保存が通ったあとの画面では、いま保存した売上分析タグの名称と並び順が入力欄に入った状態で表示される。 |
| sheet-19-R038 | 商品公開CSV登録 | 実装違い | IO | P3 | 雛形をダウンロードしたとき、保存されるファイルの名前が product_status.csv になる。 |
| sheet-19-R040 | 商品公開CSV登録 | 実装違い | ふるまい | P3 | 取込ファイルの見出しや値にゼロ幅スペースが混じっていても、混じっていない場合と同じように取り込める。 |
| sheet-21-R016 | 商品規格一覧 | 実装違い | IO | P3 | 稼働中の規格一覧の1列目の見出しが「公開ステータス」と表示される。 |
| sheet-22-R119 | 商品規格登録編集 | 実装違い | ふるまい | P3 | 編集画面・更新処理は、URLで指定された商品に属していない商品規格を指定された場合、見つからない扱い（HTTP404）にする。 |
| sheet-22-R121 | 商品規格登録編集 | 実装違い | ふるまい | P3 | 商品規格が1件しか無く削除できない商品では、編集画面に削除ボタンを出さない。 |
| sheet-22-R130 | 商品規格登録編集 | 実装違い | ふるまい | P3 | 商品規格の登録・更新が成功したとき、成功メッセージとともに当該商品規格の編集画面が表示される。 |
| sheet-22-R141 | 商品規格登録編集 | 実装違い | IO | P3 | 期間別の販売数は編集時だけ表示し、新規登録時は表示しない。 |
| sheet-23-R068 | 買取・基準価格一括編集 | 実装違い | IO | P3 | 画面左下のテキストリンクの表記は「商品検索に戻る」で、押すと商品マスター(検索結果)へ戻る。 |
| sheet-24-R032 | カテゴリ一覧 | 実装違い | IO | P3 | 直下にカテゴリが1件も無い親カテゴリを開いたとき、一覧領域にはデータが無い旨だけが表示される。 |
| sheet-24-R044 | カテゴリ一覧 | 実装違い | IO | P3 | 子カテゴリがあるため削除できない行では、削除できない理由が画面上の補足として読み取れる。 |
| sheet-25-R061 | カテゴリ登録 | 実装違い | IO | P3 | 当該チェックボックスのラベルが「フロント非表示フラグ」と表示される |
| sheet-25-R073 | カテゴリ登録 | 実装違い | IO | P3 | サブカテゴリ名のリンクを押すと、そのカテゴリの登録内容が入った編集画面が開く |
| sheet-25-R088 | カテゴリ登録 | 実装違い | IO | P3 | 上限（5）と同じ階層になるカテゴリでは入力欄と保存ボタンを表示せず、編集も子カテゴリ作成も本画面からできない |
| sheet-25-R095 | カテゴリ登録 | 実装違い | IO | P3 | 編集中のカテゴリは兄弟カテゴリ一覧で編集への入口が出ず、編集中であることが分かる表示になる |
| sheet-27-R052 | タグ登録 | 実装違い | ふるまい | P3 | 保存が完了すると、保存したタグの内容が入力欄に入った編集画面へ遷移する。 |
| sheet-27-R057 | タグ登録 | 実装違い | ふるまい | P3 | タグの削除は、ID 8 以上の登録済みタグに対してだけ受け付け、ID 7 以下のあらかじめ用意された固定タグは削除できない。 |
| sheet-28-R016 | 略称タグ登録 | 実装違い | IO | P3 | 略称タグ一覧の件数は10件・50件・100件・300件・500件・1000件・2000件・10000件・12000件から選べる。 |
| sheet-28-R028 | 略称タグ登録 | 実装違い | IO | P3 | 一覧のID・名称・並び順のいずれを押しても、その行の略称タグが入力欄へ読み込まれる。 |
| sheet-28-R031 | 略称タグ登録 | 実装違い | ふるまい | P3 | 存在しない略称タグを指定して編集画面を開こうとしたときは、ページが見つからない扱いになる。 |
| sheet-28-R038 | 略称タグ登録 | 実装違い | IO | P3 | 保存が終わった直後の一覧画面には、いま保存した略称タグが入力欄へ読み込まれた状態で表示され、新規登録へ戻るボタンも出る。 |
| sheet-3-R012 | 商品マスター(検索入力) | 実装違い | IO | P3 | 商品一覧の並びが棚番号の昇順になる。 |
| sheet-3-R090 | 商品マスター(検索入力) | 未実装 | ふるまい | P3 | 2ページ目以降を開いたときに該当件数が前のページまでで尽きている場合、1つ前のページの一覧が表示される。 |
| sheet-32-R026 | 部門登録 | 実装違い | IO | P3 | 既存の部門を選んで編集している状態では、画面下部の保存ボタンの表示名が「編集」になる。 |
| sheet-32-R053 | 部門登録 | 実装違い | ふるまい | P3 | 部門の新規登録画面を開いた直後、MTGBuyer表示フラグはチェックが入った（表示する）状態で表示される。 |
| sheet-36-R006 | 棚番登録 編集 | 実装違い | IO | P3 | 並び順は必須で、0以上32767以下の値だけを登録・更新できる。範囲を外れた値を送ったときは登録されず、入力の誤りとして知らされる。 |
| sheet-36-R011 | 棚番登録 編集 | 実装違い | ふるまい | P3 | 一覧の並び順欄を押すと、その行の名称と並び順が入力欄に読み込まれ編集できる状態になる。 |
| sheet-36-R024 | 棚番登録 編集 | 実装違い | ふるまい | P3 | 棚番号の登録・更新が完了した後は、保存した棚番号が編集対象として読み込まれた画面（見出しが編集、名称と並び順に保存値が入った状態）が表示される。 |
| sheet-37-R005 | 棚番号CSVフォーマット | 実装違い | IO | P3 | 棚番号登録CSVの並び順は0〜32767の整数だけを受け付け、範囲を超える値が書かれた行はエラーとして取り込まない。 |
| sheet-38-R029 | 購入グループ管理 | 実装違い | ふるまい | P3 | 購入グループを保存した後は、保存した購入グループが編集対象として読み込まれた状態の画面（見出しが編集、各入力欄に保存値が入った状態）が表示される。 |
| sheet-38-R037 | 購入グループ管理 | 実装違い | IO | P3 | 購入グループに支払方法・配送方法が1件も登録されていない一覧行では、その欄は何も表示されない空欄になる。 |
| sheet-39-R021 | 買取・販売価格履歴検索 | 実装違い | IO | P3 | Foil欄には『Foil』『ノーマル』『特殊』の3つのチェック項目が表示される。 |
| sheet-39-R049 | 買取・販売価格履歴検索 | 実装違い | ふるまい | P3 | 買取/販売価格履歴画面を新たに開くと、前回の検索条件・ページ番号・表示件数は残らず、次の検索は既定の表示件数（10件）から始まる。 |
| sheet-39-R063 | 買取・販売価格履歴検索 | 実装違い | IO | P3 | 画面から検索した一覧は、同じ商品規格の履歴がまとまって並び、その中で登録日時の新しい順に並ぶ。 |
| sheet-39-R067 | 買取・販売価格履歴検索 | 実装違い | IO | P3 | ダウンロードされるCSVのファイル名が『product_buy_sale_price_history_』＋実行時刻（年月日時分秒）＋『.csv』になる。 |
| sheet-42-R056 | 基準価格変更CSVアップロード | 実装違い | IO | P3 | 雛形ファイルのダウンロード名が simple_price.csv になる。 |
| sheet-44-R054 | セール用価格変更CSVアップロード | 実装違い | IO | P3 | CSVファイル選択のボタンに ファイルを選択 と表示されること。 |
| sheet-44-R066 | セール用価格変更CSVアップロード | 実装違い | ふるまい | P3 | CSV・TSV・テキスト・表計算のいずれでもない種類のファイルをアップロードしたとき、取込を行わずに同じ画面へ戻ること。 |
| sheet-48-R038 | 高額商品価格変更CSVアップロード | 実装違い | IO | P3 | 雛形ファイルダウンロードで保存されるファイルの名前が simple_high_price.csv であること。 |
| sheet-48-R041 | 高額商品価格変更CSVアップロード | 実装違い | IO | P3 | ファイルを選ばずにCSV取込を実行したとき、画面上部にCSVデータが無い旨のエラーが表示されること。 |
| sheet-5-R087 | 商品登録編集 | 実装違い | ふるまい | P3 | サイズ・重量は0以上999999999以下だけを受け付け、9桁を超える値や負の値では商品を更新せずエラーを表示する。 |
| sheet-5-R088 | 商品登録編集 | 実装違い | IO | P3 | 割引率・買取減額率が未選択のとき、選択欄の先頭に「割引率を選択してください」「買取減額率を選択してください」と表示される。 |
| sheet-5-R105 | 商品登録編集 | 実装違い | IO | P3 | 商品画像の追加要求にファイルが1件も含まれていない場合、不正要求（HTTP400）として拒否する。 |
| sheet-52-R026 | 部門更新CSV登録 | 実装違い | ふるまい | P3 | 削除されていない商品規格に一致しない商品コードの行は、商品コードでデータを取得できない旨のエラーとして取込全体を中止する。削除済みの規格しか一致しない商品コードもエラーとして扱う。 |
| sheet-56-R008 | 棚番号更新CSV登録 | 実装違い | IO | P3 | この画面のフォーマット表の見出しは「棚番号更新CSVファイルフォーマット」と表示される（画面名も「棚番号更新CSV」で統一される）。 |
| sheet-56-R020 | 棚番号更新CSV登録 | 実装違い | IO | P3 | 雛形ファイルダウンロードで受け取るファイルの名前が product_shelf_number.csv になる。 |
| sheet-58-R047 | カテゴリ登録CSVアップロード | 実装違い | IO | P3 | 雛形ファイルダウンロードで落ちてくるファイルの名前が category.csv であること。 |
| sheet-65-R014 | 別添資料__スマレジ連携対象商品 | 未実装 | ふるまい | P3 | スマレジ連携フラグを自動でONにする金額の閾値を、プログラム改修なしに変更できること。 |
| sheet-7-R058 | 商品情報カスタムCSV出力 | 未実装 | IO | P3 | 商品情報カスタムCSV出力の出力項目として「商品削除フラグ」を選べ、商品が削除済みかどうかを示す値が列に出力される。 |
| sheet-9-R108 | カード商品CSV出力 | 実装違い | IO | P3 | カード商品CSVの「発送日目安(ID)」列には、規格に設定された発送日目安の名称を出力する（未設定のときは空文字）。 |

### sheet-48-R049 高額商品価格変更CSVアップロード — 実装違い／ふるまい／P1

- 正本: sheet-48（高額商品価格変更CSVアップロード） HTML行 6375 付近
- 正本引用: 「高額対象の規格は、高額商品コードが設定された規格に限り、削除済みの商品・規格は対象としない。商品コードに該当する高額対象の規格が無い行は、行番号を付けたエラーを表示して取込全体を中止し、それまでに読み込んだ行も反映しない。」
- 設計期待値: 高額対象の規格が無い行に当たったとき、その時点で取込を止め、それまでの行の価格更新も後続の行の更新も一切残らないこと。また削除済みの商品・規格は価格更新の対象にならないこと。
- 画像確認: レイアウト図(sheet-48_img1.png)を確認。CSVファイル選択/CSVファイルのアップロード/高額商品価格変更CSVファイルフォーマット表(商品コード 必須・販売価格を取り消し線で消して基準価格 必須)/雛形ファイルダウンロード/件数プルダウン(10件)/CSVインポート履歴(ファイル名・アップロード日時・作業者)/ページャを確認した。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:75-105;src/Eccube/Service/Csv/Importer/CsvImporter.php:233-275;src/Eccube/Repository/ProductClassRepository.php:2217-2235`
- 実装実態: 高額対象の規格が無い行ではエラーを積むだけで取込を打ち切らないため、後続の行も処理され、エラーを表示しながら全行の価格更新が確定して残る。また対象規格の判定条件が商品コードと高額商品コードの有無だけで、削除済み（visible が false）の商品・規格を除いていない。
- 判定根拠: 対象規格が無い行の処理はエラーを積んで正常終了扱いで戻る（src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:99-104）ため打ち切りが立たず、打ち切りが無いときは更新を確定させる（src/Eccube/Service/Csv/Importer/CsvImporter.php:270-275）。対象規格の判定は商品コードと高額商品コードの有無だけで削除済みを除いていない（src/Eccube/Repository/ProductClassRepository.php:2217-2235）。エラー表示自体は行番号付きで出る（src/Eccube/Resource/locale/messages.ja.yaml:2016）。
- 確信度: high

### sheet-62-R011 別添資料__スマレジ連携機能一覧 — 未実装／ふるまい／P1

- 正本: sheet-62（別添資料__スマレジ連携機能一覧） HTML行 7622 付近
- 正本引用: 「9	商品登録	買取・基準価格一括編集	カスタマイズ	◯	即時」
- 設計期待値: 買取・基準価格一括編集で更新した価格が、その場でスマレジ側の商品にも反映される
- 画像確認: 本シートは画像0枚（別添資料の表のみ）。レイアウト図は無く、表本文で判定した。
- 実装参照: `src/Eccube/Controller/Admin/Product/ProductBulkUpdateBuyPriceController.php:85-120;src/Eccube/Service/Admin/Product/ProductBulkUpdateBuyPriceStoreAction.php:64-136`
- 実装実態: 一括編集は買取価格・基準価格の履歴登録と商品規格の更新を行うだけで、スマレジ側へは何も送られない。
- 同じ実装実態でまとまる要求: sheet-63-R015（別添資料__スマレジ連携__商品連携項目 / 実装参照 `src/Eccube/Service/Admin/Product/ProductBulkUpdateBuyPriceStoreAction.php:107-134; src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:79-95; src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:140-158`）、sheet-66-R018（別添資料__スマレジ連携__呼び出しAPIについて）、sheet-65-R047（別添資料__スマレジ連携対象商品 / 実装参照 `src/Eccube/Service/Admin/Product/ProductBulkUpdateBuyPriceStoreAction.php:65-137`）、sheet-65-R048（別添資料__スマレジ連携対象商品 / 実装参照 `src/Eccube/Service/Admin/Product/ProductBulkUpdateBuyPriceStoreAction.php:65-137`）、sheet-65-R050（別添資料__スマレジ連携対象商品 / 実装参照 `src/Eccube/Service/Admin/Product/ProductBulkUpdateBuyPriceStoreAction.php:65-137`）、sheet-65-R054（別添資料__スマレジ連携対象商品 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:75-100`）、sheet-66-R019（別添資料__スマレジ連携__呼び出しAPIについて）、sheet-66-R020（別添資料__スマレジ連携__呼び出しAPIについて）、sheet-66-R023（別添資料__スマレジ連携__呼び出しAPIについて）、sheet-68-R013（別添資料__スマレジ連携__機能改修一覧 / 実装参照 `src/Eccube/Service/Admin/Product/ProductBulkUpdateBuyPriceStoreAction.php:65-137`）、sheet-68-R014（別添資料__スマレジ連携__機能改修一覧 / 実装参照 `src/Eccube/Service/Admin/Product/ProductBulkUpdateBuyPriceStoreAction.php:65-137`）、sheet-68-R019（別添資料__スマレジ連携__機能改修一覧 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:75-100;src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:124-197`）、sheet-68-R020（別添資料__スマレジ連携__機能改修一覧 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:75-100`）
- 判定根拠: 実装位置 src/Eccube/Controller/Admin/Product/ProductBulkUpdateBuyPriceController.php:86（更新処理）と src/Eccube/Service/Admin/Product/ProductBulkUpdateBuyPriceStoreAction.php:64-136。両ファイルともスマレジ連携の呼び出しが無く、他のスマレジ連携箇所（src/Eccube/Controller/Admin/Product/ProductController.php:843, src/Eccube/Controller/Admin/Product/ProductClassController.php:403, src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:169）のような投入も行われない。
- 確信度: high

### sheet-62-R036 別添資料__スマレジ連携機能一覧 — 未実装／ふるまい／P1

- 正本: sheet-62（別添資料__スマレジ連携機能一覧） HTML行 7647 付近
- 正本引用: 「34	商品CSV管理	高額商品価格変更CSV登録	カスタマイズ（コア・超高）	◯	即時	◯」
- 設計期待値: 高額商品価格変更CSV登録で更新した価格がスマレジ側へ反映される
- 画像確認: 本シートは画像0枚（別添資料の表のみ）。レイアウト図は無く、表本文で判定した。
- 実装参照: `src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:124-200;src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:1-178`
- 実装実態: 高額商品価格変更CSVの取込は価格の更新だけを行い、スマレジ側へは何も送られない。
- 同じ実装実態でまとまる要求: sheet-66-R033（別添資料__スマレジ連携__呼び出しAPIについて）
- 判定根拠: 実装位置 src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:124（取込）と src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php。両者ともスマレジ連携の投入が無く、同種の他CSV（src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:169, src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:219, src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:186, src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:170）にはある投入処理が欠けている。
- 確信度: high

### sheet-66-R006 別添資料__スマレジ連携__呼び出しAPIについて — 未実装／ふるまい／P1

- 正本: sheet-66（別添資料__スマレジ連携__呼び出しAPIについて） HTML行 7893 付近
- 正本引用: 「２商品が廃止になった場合は紐付く規格を削除する」
- 設計期待値: 商品を廃止したとき、その商品に紐づく規格がスマレジ側から取り除かれる
- 画像確認: 本シートは画像0枚（別添資料の表のみ）。レイアウト図は無く、表本文で判定した。
- 実装参照: `src/Eccube/Controller/Admin/Product/ProductController.php:1077-1150;src/Eccube/Controller/Admin/Product/ProductController.php:1461-1520`
- 実装実態: 商品の削除でも公開ステータスを廃止に変更する一括操作でも、紐づく規格のスマレジ側削除は行われない。スマレジ側の削除が投入されるのは規格単位の削除・非表示化だけ。
- 同じ実装実態でまとまる要求: sheet-65-R017（別添資料__スマレジ連携対象商品 / 実装参照 `src/Eccube/Service/Admin/Product/ProductClassUpdateAction.php:57-64;src/Eccube/Service/Admin/Product/ProductClassUpdateAction.php:100-110;src/Eccube/MessageHandler/SmaregiProductClassUpsertMessageHandler.php:80-92`）、sheet-65-R057（別添資料__スマレジ連携対象商品 / 実装参照 `src/Eccube/Controller/Admin/Product/ProductController.php:760-856;src/Eccube/Controller/Admin/Product/ProductController.php:1459-1520`）、sheet-65-R058（別添資料__スマレジ連携対象商品 / 実装参照 `src/Eccube/Service/Admin/Product/ProductClassUpdateAction.php:57-110`）、sheet-65-R059（別添資料__スマレジ連携対象商品 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:688-694;src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:941-954`）、sheet-65-R060（別添資料__スマレジ連携対象商品 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:578-615`）
- 判定根拠: [gate7/refute+codex] sheet-65-R057 と同じ実装欠陥として畳む。実装事実自体は正しい（src/Eccube/Controller/Admin/Product/ProductController.php:1077-1150 の商品削除、同:1461-1520 の bulkProductStatus のいずれにもスマレジ削除投入が無く、grep の結果 dispatchDeleteMessage の呼び出しは src/Eccube/Service/Admin/Pr 実装位置 src/Eccube/Controller/Admin/Product/ProductController.php:1078（商品削除）と src/Eccube/Controller/Admin/Product/ProductController.php:1461-1520（公開ステータス一括変更）。どちらにもスマレジ削除の投入が無い。削除投入は src/Eccube/Controller/Admin/Product/ProductClassController.php:432-484 と src/Eccube/Service/Admin/Product/ProductClassDeleteAction.php:54-76 の規格単位の経路のみで、送信は src/Eccube/MessageHandler/SmaregiProductClassDeleteMessageHandler.php:90。
- 確信度: high

### sheet-66-R038 別添資料__スマレジ連携__呼び出しAPIについて — 未実装／ふるまい／P1

- 正本: sheet-66（別添資料__スマレジ連携__呼び出しAPIについて） HTML行 7925 付近
- 正本引用: 「必ず更新となる」
- 設計期待値: 部門更新CSV登録で商品に設定した部門が、スマレジ側の商品の部門にも反映される（常に更新として扱われる）
- 画像確認: 本シートは画像0枚（別添資料の表のみ）。レイアウト図は無く、表本文で判定した。
- 実装参照: `src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:124-200;src/Eccube/Service/Csv/Importer/Event/ProductSectionUpdateImportHandler.php:1-198`
- 実装実態: 部門更新CSVの取込は商品側の部門を更新するだけで、スマレジ側へは何も送られない。
- 同じ実装実態でまとまる要求: sheet-62-R040（別添資料__スマレジ連携機能一覧）、sheet-63-R010（別添資料__スマレジ連携__商品連携項目 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductSectionUpdateImportHandler.php:87; src/Eccube/Service/Csv/Importer/Event/ProductSectionUpdateImportHandler.php:152-170`）、sheet-65-R045（別添資料__スマレジ連携対象商品 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductSectionUpdateImportHandler.php:186-197;src/Eccube/Repository/ProductClassRepository.php:2179-2188`）、sheet-65-R080（別添資料__スマレジ連携対象商品 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductSectionUpdateImportHandler.php:186-197;src/Eccube/Service/Admin/Product/ProductClassUpdateAction.php:100-110`）、sheet-68-R023（別添資料__スマレジ連携__機能改修一覧 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductSectionUpdateImportHandler.php:180-197;src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:150-200`）
- 判定根拠: 実装位置 src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:124 と src/Eccube/Service/Csv/Importer/Event/ProductSectionUpdateImportHandler.php。どちらにもスマレジ連携の投入が無い。部門マスタ側のCSV取込（src/Eccube/Service/Csv/Importer/Event/SectionMasterImportHandler.php:80-88）には投入があるのと対照的である。
- 確信度: high

### sheet-11-R089 グッズ商品CSV登録 — 実装違い／ふるまい／P2

- 正本: sheet-11（グッズ商品CSV登録） HTML行 2420 付近
- 正本引用: 「商品カテゴリ サプライ・グッズ・予約グッズ・情報商材のカテゴリだけを選べる。対象のカテゴリが 1 件も無いときは必須にせず選択の検証も行わない。登録時は指定したカテゴリに加えて祖先カテゴリを付ける」
- 設計期待値: 商品カテゴリ(ID)列には、サプライ・グッズ／予約グッズ／情報商材の系統に属するカテゴリだけを受け付け、それ以外のカテゴリを指定した行はエラーにして取り込まない。
- 画像確認: レイアウト図(sheet-11_img1.png)を確認。グッズ登録CSVのファイル選択/アップロードボタン、グッズCSVファイルフォーマット表と雛形ファイルダウンロード、CSVインポート履歴(全件数・件数プルダウン・一覧・ページャ)が描かれている。 図の中略部分にカテゴリ欄の説明は写っていないため、画面上の案内文は実装（{GC}:354-358）で確認した。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:370-371;src/Eccube/Service/Csv/Importer/Validator/Repository/CategoryIdValidator.php:48-71`
- 実装実態: カテゴリマスタに存在するIDであれば系統を問わず受け付ける。シングルカードなど他系統のカテゴリIDを書いた行もエラーにならず、その商品カテゴリとして登録される。
- 判定根拠: グッズ取込のカテゴリ列は存在チェックだけを持つ（src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:370-371, src/Eccube/Service/Csv/Importer/Validator/Repository/CategoryIdValidator.php:48-71）。系統を限定する選択肢の検証が付いていない。参照元の現行ソース pf-eccube3 では app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:274-288 でグッズ・予約グッズ・情報商材の配下カテゴリだけを選択肢として与えている。ec-cube-enterprise には同等の絞り込みが無く（src/Eccube/Util/CategoryMap.php:75-91 の配下カテゴリ収集はどこからも使われていない）、カテゴリ定数（src/Eccube/Entity/Category.php:42-45）も取込では使われていない。画面の項目説明にはグッズ系のIDだけを案内している（src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:354-358）ため、案内と受付範囲も食い違う。
- 確信度: high

### sheet-13-R039 グッズ商品CSVフォーマット — 実装違い／IO／P2

- 正本: sheet-13（グッズ商品CSVフォーマット） HTML行 2655 付近
- 正本引用: 「28 原価単価  数値(整数※) 〇  300 新規項目追加」
- 設計期待値: CSVの原価単価に設定した値が、取り込んだ商品に登録・更新される。
- 画像確認: 本シートは画像0枚（レイアウト図なし）。判定は本文の項目表と機能仕様の記述のみを根拠にした。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:390;src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:658-661`
- 実装実態: 原価単価の列は受け付けるが値は捨てられ、どこにも登録されない。必須指定も無く、空欄でも取り込める。
- 同じ実装実態でまとまる要求: sheet-13-R056（グッズ商品CSVフォーマット）、sheet-13-R075（グッズ商品CSVフォーマット）
- 判定根拠: src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:658-661 の原価単価は値を使わない列として定義され、src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:390 でその定義を使う。src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:469-517 と src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:562-684 の登録項目に原価単価は無く、画面のフォーマット表も『出力フォーマット互換用。入力しても更新されない』と表示する(src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:409-413)。
- 確信度: high

### sheet-16-R024 売上分析タグ登録編集 — 実装違い／IO／P2

- 正本: sheet-16（売上分析タグ登録編集） HTML行 2923 付近
- 正本引用: 「編集の対象を指定しているときは、新規登録の入力欄へ切り替える操作を画面に出す。編集・保存・削除で指定した売上分析タグが存在しないときは、いずれもアクセス不可（HTTP 404）とする。」
- 設計期待値: 編集の画面を開いているときは、新規登録の入力欄へ戻す操作が画面にある。存在しない売上分析タグを指定した編集表示・保存は、画面を出さず・何も登録せず、見つからない旨の応答になる。
- 画像確認: sheet-16_img1.png（「新規登録」カードに 名称・並び順 の入力欄と右上の「登録」ボタン、その下に一覧表 ID／名称／並び順／編集ボタン／削除ボタン。ID・名称はリンク表示）、sheet-16_img2.png（ページャ 1 2 3 4 5 次へ）、sheet-16_img3.png（件数プルダウン「10件」）を確認した。並び順の上限値、ソート用の部品、編集中に新規登録へ戻す操作はいずれも図に描かれていない。
- 実装参照: `src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:57-95;src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:106-141;src/Eccube/Resource/template/admin/Product/tag_sales_analysis.twig:57-60`
- 実装実態: 編集画面には新規登録へ戻す操作が無い（src/Eccube/Resource/template/admin/Product/tag_sales_analysis.twig:57-60 の見出しが「編集」に変わるだけで、src/Eccube/Resource/template/admin/Product/tag_sales_analysis.twig:48-172 のどこにも新規登録へ切り替えるリンク・ボタンが無い）。また、存在しないIDを指定して編集画面を開いても見つからない応答にならず、空の新規登録画面がそのまま表示される（src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:57-61）。同じIDで保存すると、見つからない応答にならずに新しい売上分析タグが1件登録される（src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:106-110, src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:143-146）。削除だけは見つからない応答になる（src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:183）。
- 判定根拠: 編集・保存の受け口はいずれも対象をnull許容で受けており（src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:57, src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:106）、見つからないIDは未指定と同じ扱いになって src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:59-61 と src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:108-110 で新規扱いへ落ちる。新規登録へ切り替える操作は src/Eccube/Resource/template/admin/Product/tag_sales_analysis.twig 内を探したが無い。
- 確信度: high

### sheet-16-R029 売上分析タグ登録編集 — 実装違い／ふるまい／P2

- 正本: sheet-16（売上分析タグ登録編集） HTML行 2929 付近
- 正本引用: 「重複するときは保存せず、入力内容を保持しないまま新規登録の入力欄と一覧を表示する」
- 設計期待値: 登録済みの売上分析タグと同じ値を保存しようとしたときは登録・更新されず、重複している旨のエラーを付けた一覧と入力欄の画面が返る。
- 画像確認: sheet-16_img1.png（「新規登録」カードに 名称・並び順 の入力欄と右上の「登録」ボタン、その下に一覧表 ID／名称／並び順／編集ボタン／削除ボタン。ID・名称はリンク表示）、sheet-16_img2.png（ページャ 1 2 3 4 5 次へ）、sheet-16_img3.png（件数プルダウン「10件」）を確認した。並び順の上限値、ソート用の部品、編集中に新規登録へ戻す操作はいずれも図に描かれていない。
- 実装参照: `src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:143-158;src/Eccube/Entity/Master/MtbTagSalesAnalysis.php:27-28;src/Eccube/Entity/Master/MtbTagSalesAnalysis.php:40-41;src/Eccube/Entity/Master/MtbTagSalesAnalysis.php:55-56`
- 実装実態: 同じ名称・並び順の売上分析タグを続けて登録しても、そのまま2件目が登録されて「登録が完了しました。」になる。重複時の分岐は一意制約違反を捕まえる形でしか書かれていないが（src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:147-158）、売上分析タグには名称・並び順の一意制約が定義されていない（src/Eccube/Entity/Master/MtbTagSalesAnalysis.php:27-28, src/Eccube/Entity/Master/MtbTagSalesAnalysis.php:40-41, src/Eccube/Entity/Master/MtbTagSalesAnalysis.php:55-56）ため、この分岐に入ることがない。登録済みの値と重ならないかを保存前に確かめる処理も見当たらない。
- 同じ実装実態でまとまる要求: sheet-16-R042（売上分析タグ登録編集）
- 判定根拠: 重複を判定している箇所を ee 内で探したが、src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:147-158 の一意制約違反の捕捉以外に無い。売上分析タグの定義（src/Eccube/Entity/Master/MtbTagSalesAnalysis.php:27-56）には一意制約・一意インデックスが無く、マイグレーションにも追加は無いため、重複しても例外が起きず保存が通る。
- 確信度: high

### sheet-19-R044 商品公開CSV登録 — 実装違い／ふるまい／P2

- 正本: sheet-19（商品公開CSV登録） HTML行 3205 付近
- 正本引用: 「失敗時はメッセージを表示するだけで取込を始めない」
- 設計期待値: 設定された大きさの上限を超えるファイルを送った時に、取込が行われないだけでなく、その理由が分かるメッセージが画面に出る。
- 画像確認: sheet-19_img1.png はメッセージ表示位置を含まないため、現行仕様と表示メッセージ表で判定。
- 実装参照: `src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:134-140`
- 実装実態: 上限（設定のメガバイト値）を超えるファイルを送ると、取込は始まらないが画面には何も出ず、アップロード画面へ戻るだけになる。ファイル未選択は入力欄が必須指定のため画面上で送信自体が止まり、メッセージが出る。
- 同じ実装実態でまとまる要求: sheet-19-R058（商品公開CSV登録）
- 判定根拠: ファイル欄に付く不備（大きさの上限超過）は画面に出す対象から外れており（src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:134-140、上限の定義は src/Eccube/Form/Type/Admin/CsvImportType.php:54-56、既定値5メガは app/config/eccube/packages/eccube.yaml:102）、その後アップロード画面へ戻るため欄に残った不備も表示されない。同種の他CSV画面では欄に付く不備まで取り出して表示している（src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:192）。なお未選択は入力欄が必須指定で描画されるため（src/Eccube/Resource/template/admin/Form/bootstrap_4_horizontal_layout.html.twig:48-51）画面上で送信が止まり、この点は満たしている。
- 確信度: med

### sheet-22-R010 商品規格登録編集 — 未実装／ふるまい／P2

- 正本: sheet-22（商品規格登録編集） HTML行 3523 付近
- 正本引用: 「・フロント表示制御としては”公開”の場合は表示、”非公開（廃止）”の場合は非表示とする」
- 設計期待値: 公開ステータスが「非公開」または「廃止」の商品規格は、フロント（商品詳細・商品一覧）に表示されない。
- 画像確認: sheet-22_img1.png を確認。基本情報欄は 商品ID/商品規格ID/スマレジ商品ID/スマレジ商品コード/言語/状態/状態名/商品コード/在庫数/販売制限数/在庫変動理由(取消線=除去)/販売価格/セールフラグ/基準価格/買取価格/代表画像/画像表示(×に取消線)/帯URL/高額商品コード/下代/状態別称/部門/棚番号/スマレジ連携フラグ、右カラムに 商品規格を削除・登録日/更新日・期間別販売数、最下部に「<< 商品規格一覧」リンク・公開ステータスのプルダウン・「商品規格を登録」ボタン。
- 実装参照: `src/Eccube/Repository/ProductRepository.php:120-148;src/Eccube/Repository/ProductClassRepository.php:265-300`
- 実装実態: フロント商品詳細の取得（src/Eccube/Repository/ProductRepository.php:120-148 findForFrontDetail）は商品側のステータスが公開であること・規格の visible・販売価格>0 だけで規格を絞っており、商品規格の公開ステータスを条件にしていない。フロント向けの規格取得（src/Eccube/Repository/ProductClassRepository.php:265-300）も同様で、規格ステータスで絞り込む箇所が無い。そのため非公開・廃止の商品規格もフロントに表示される。
- 判定根拠: ee 全体を検索しても商品規格ステータスで絞る条件は管理画面側（規格一覧・商品検索）にしか無く、フロント経路（src/Eccube/Repository/ProductRepository.php:120-148、src/Eccube/Repository/ProductClassRepository.php:265-300）には存在しない。廃止は在庫0が前提のため実害は非公開規格の露出が中心で、業務は迂回可能と判断し P2。
- 確信度: med

### sheet-22-R129 商品規格登録編集 — 未実装／ふるまい／P2

- 正本: sheet-22（商品規格登録編集） HTML行 3648 付近
- 正本引用: 「支店システムへ当該商品の更新を通知する。」
- 設計期待値: 商品規格を更新したとき、当該商品の更新が支店システムへ通知される。
- 画像確認: sheet-22_img1.png を確認。基本情報欄は 商品ID/商品規格ID/スマレジ商品ID/スマレジ商品コード/言語/状態/状態名/商品コード/在庫数/販売制限数/在庫変動理由(取消線=除去)/販売価格/セールフラグ/基準価格/買取価格/代表画像/画像表示(×に取消線)/帯URL/高額商品コード/下代/状態別称/部門/棚番号/スマレジ連携フラグ、右カラムに 商品規格を削除・登録日/更新日・期間別販売数、最下部に「<< 商品規格一覧」リンク・公開ステータスのプルダウン・「商品規格を登録」ボタン。
- 実装参照: `src/Eccube/Service/Admin/Product/ProductClassUpdateAction.php:98-108;src/Eccube/Service/Product/InventoryReflectService.php:108-113`
- 実装実態: 更新処理はスマレジへの反映のみ行い（src/Eccube/Service/Admin/Product/ProductClassUpdateAction.php:108）、支店システムへの通知は行っていない。ee には支店システムへ通知する処理自体が無く、他機能でも「支店システムへ更新情報を連携／TODO: BranchUpdateService の移植が必要」とコメントで残されたまま（src/Eccube/Service/Product/InventoryReflectService.php:108-113、src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:87-93）。
- 同じ実装実態でまとまる要求: sheet-22-R137（商品規格登録編集 / 実装参照 `src/Eccube/Controller/Admin/Product/ProductClassController.php:360-391;src/Eccube/Service/Admin/Product/ProductClassDeleteAction.php:39-86`）
- 判定根拠: ee 全体を検索しても支店システムへ通知する実装は見つからず、未移植であることがコメントから確認できる。商品規格の更新・保存自体は成立し支店側は別経路で補えるため P2。
- 確信度: med

### sheet-22-R132 商品規格登録編集 — 未実装／ふるまい／P2

- 正本: sheet-22（商品規格登録編集） HTML行 3651 付近
- 正本引用: 「販売価格が買取価格を下回る場合は検証エラーとし、販売価格欄の直下に、買取価格の値を差し込んだ「販売価格は買取価格「（買取価格）」以上を指定してください。」を表示する。」
- 設計期待値: 販売価格に買取価格を下回る値を入れて登録・更新すると、保存されず販売価格欄の直下に買取価格を差し込んだエラー文言が表示される。
- 画像確認: sheet-22_img1.png を確認。基本情報欄は 商品ID/商品規格ID/スマレジ商品ID/スマレジ商品コード/言語/状態/状態名/商品コード/在庫数/販売制限数/在庫変動理由(取消線=除去)/販売価格/セールフラグ/基準価格/買取価格/代表画像/画像表示(×に取消線)/帯URL/高額商品コード/下代/状態別称/部門/棚番号/スマレジ連携フラグ、右カラムに 商品規格を削除・登録日/更新日・期間別販売数、最下部に「<< 商品規格一覧」リンク・公開ステータスのプルダウン・「商品規格を登録」ボタン。
- 実装参照: `src/Eccube/Form/Type/Admin/ProductClassType.php:104-207;src/Eccube/Controller/Admin/Product/ProductClassController.php:294-311`
- 実装実態: 商品規格のフォームは販売価格・買取価格それぞれに必須・桁数・数値のみの検査を持つだけで、両者の大小関係を確かめる検査が無い（src/Eccube/Form/Type/Admin/ProductClassType.php:104-207）。そのため販売価格が買取価格を下回っていてもそのまま保存される。
- 同じ実装実態でまとまる要求: sheet-22-R133（商品規格登録編集）
- 判定根拠: 販売価格と買取価格を比較する検査を ee 内で探したところ、価格一括更新やCSV取込には相当する文言が用意されているが（src/Eccube/Resource/locale/messages.ja.yaml:2642、src/Eccube/Resource/locale/messages.ja.yaml:2431）、この画面のフォームからは呼ばれていない。逆ざや価格が登録できてしまうがオペレーション上気付ける余地があるため P2。
- 確信度: med

### sheet-22-R136 商品規格登録編集 — 実装違い／ふるまい／P2

- 正本: sheet-22（商品規格登録編集） HTML行 3655 付近
- 正本引用: 「規格を論理削除する。」
- 設計期待値: 削除された商品規格は記録として残したまま一覧や選択肢から外れ、価格履歴など関連する記録も消えない。
- 画像確認: sheet-22_img1.png を確認。基本情報欄は 商品ID/商品規格ID/スマレジ商品ID/スマレジ商品コード/言語/状態/状態名/商品コード/在庫数/販売制限数/在庫変動理由(取消線=除去)/販売価格/セールフラグ/基準価格/買取価格/代表画像/画像表示(×に取消線)/帯URL/高額商品コード/下代/状態別称/部門/棚番号/スマレジ連携フラグ、右カラムに 商品規格を削除・登録日/更新日・期間別販売数、最下部に「<< 商品規格一覧」リンク・公開ステータスのプルダウン・「商品規格を登録」ボタン。
- 実装参照: `src/Eccube/Service/Admin/Product/ProductClassDeleteAction.php:39-67;src/Eccube/Controller/Admin/Product/ProductClassController.php:383-388`
- 実装実態: 削除処理は商品規格の実体と価格履歴・規格画像の紐づけを消す（src/Eccube/Service/Admin/Product/ProductClassDeleteAction.php:62-67）。記録が残らないため過去の価格履歴も失われ、受注などから参照されている規格では削除自体が失敗して削除できない旨のエラーになる（src/Eccube/Controller/Admin/Product/ProductClassController.php:383-388）。
- 判定根拠: 商品規格の削除で削除済みを表す状態に落とす処理は ee に無く、実体を消している。削除後の見え方は同じでも、価格履歴の消失と参照ありの場合に削除できない点が現行と異なる。
- 確信度: med

### sheet-23-R051 買取・基準価格一括編集 — 実装違い／IO／P2

- 正本: sheet-23（買取・基準価格一括編集） HTML行 3763 付近
- 正本引用: 「※NMは入力欄が必須となるため。割引率の算定基準価格となる。」
- 設計期待値: 基準価格(NM)は必須項目で、未入力のまま登録できない。未入力で登録すると更新されずエラーが表示される。
- 画像確認: img1では基準価格(NM)欄が入力可能なスピナーとして描かれており、必須表現の有無は図からは読めない。
- 実装参照: `src/Eccube/Form/Type/Admin/BulkUpdateProductPriceDetailType.php:30-37;src/Eccube/Service/Admin/Product/ProductBulkUpdateBuyPriceStoreAction.php:72;src/Eccube/Form/Type/Admin/BulkUpdateProductPriceType.php:95-97`
- 実装実態: 基準価格(NM)の入力欄は必須指定になっておらず（required=false）、空欄のまま登録できる。空欄で登録すると基準価格が0として保存され、さらに買取価格(NM)>基準価格(NM)の検査も未入力行では素通りするため、基準価格0・買取価格ありの状態が登録できてしまう。
- 判定根拠: 項目表の識別ID:10「基準価格(NM)」は必須◯だが、フォーム定義は required=false で必須検査もない。空欄送信時は null→0 に丸められて保存される。（最大値9999999999は画面側で指定し直した属性へ合成されて残るため、この指摘には含めない）
- 確信度: high

### sheet-23-R080 買取・基準価格一括編集 — 実装違い／ふるまい／P2

- 正本: sheet-23（買取・基準価格一括編集） HTML行 3797 付近
- 正本引用: 「良品（NM）規格が実在しない行と、買取価格マスタに該当が無い行は、その行だけをエラーとして通知し、残りの行の処理は続ける。」
- 設計期待値: 良品(NM)規格が実在しない行や買取価格マスタに該当が無い行があっても、その行だけがエラーとして通知され、残りの行の買取価格更新と価格履歴追加は実施される。
- 画像確認: img1(レイアウト図)確認済。img2は白紙で情報なし。
- 実装参照: `src/Eccube/Service/Admin/Product/ProductBulkUpdateBuyPriceStoreAction.php:90-103;src/Eccube/Controller/Admin/Product/ProductBulkUpdateBuyPriceController.php:117-129`
- 実装実態: 該当行で例外を投げて処理を打ち切るため、その行より後ろの行はまったく処理されない。エラー行より前に処理済みの行だけが更新された状態で編集画面が再表示され、利用者はどこまで更新されたか画面から判別できない。
- 判定根拠: 行単位のエラーで全体のループが中断される。エラーになった行以降の商品は買取価格更新も価格履歴追加も行われない。
- 確信度: high

### sheet-23-R103 買取・基準価格一括編集 — 未実装／ふるまい／P2

- 正本: sheet-23（買取・基準価格一括編集） HTML行 3823 付近
- 正本引用: 「登録が完了したとき、対象商品の商品情報が更新されたことを支店システムへ通知する。通知に失敗しても画面の結果は完了のままとし、失敗した対象を連携エラーとして記録する。」
- 設計期待値: 登録が完了したとき、対象商品の商品情報が更新されたことが支店システムへ通知される。通知に失敗しても画面は完了のままとし、失敗した対象が連携エラーとして記録される。
- 画像確認: img1(レイアウト図)確認済。img2は白紙で情報なし。
- 実装参照: `src/Eccube/Controller/Admin/Product/ProductBulkUpdateBuyPriceController.php:130-148;src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:87-93`
- 実装実態: 登録完了後に支店システムへ商品情報更新を伝える処理も、通知失敗を連携エラーとして残す処理も無い。ee全体でも支店連携は未移植のままで、他機能ではその旨のコメントだけが残っている。
- 判定根拠: 登録完了後の処理は完了メッセージの表示と商品一覧への遷移のみで、支店システムへの通知も連携エラーの記録も存在しない。
- 確信度: high

### sheet-27-R026 タグ登録 — 未実装／ふるまい／P2

- 正本: sheet-27（タグ登録） HTML行 4295 付近
- 正本引用: 「値がある場合、日本語の商品検索ページのページタイトルとする」
- 設計期待値: タイトル(日)に値があるとき、その値が日本語の商品検索ページのページタイトルとして表示される。
- 画像確認: 画像16枚を確認。画像5(C7)=タグ登録フォーム全体（名称(日)/名称(英)/並び順/優先表示商品のみを表示/その他の設定/登録ボタン）、画像4(B38)=一覧(ID/名称(日)/名称(英)/並び順/編集)、画像1(AU36)=件数プルダウン、画像16(F46)=ページング、画像2/3/7/9/11ほかはフリーエリア(日/英)・優先表示商品・タイトル・説明の各ラベル。
- 実装参照: `src/Eccube/Form/Type/Admin/TagType.php:112-145;src/Eccube/Resource/template/default/meta.twig:41-66;src/Eccube/Controller/Front/ProductController.php:393-451`
- 実装実態: 入力欄はあり値も保存されるが、保存した値を商品検索ページのページタイトル・ページ説明文に使う処理がどこにも無く、入力しても検索ページの表示は変わらない。
- 同じ実装実態でまとまる要求: sheet-27-R027（タグ登録）、sheet-27-R028（タグ登録）、sheet-27-R029（タグ登録）
- 判定根拠: src/Eccube/Form/Type/Admin/TagType.php:112-145 で4項目の入力欄を定義し src/Eccube/Entity/Tag.php:266-310 に保存されるが、保存値を読み出す箇所が実装側に無い。タグで絞り込んだ商品検索ページの説明文は src/Eccube/Resource/template/default/meta.twig:62-63 でカテゴリ名からの定型文だけを組み立てており、タグの値は src/Eccube/Controller/Front/ProductController.php:410-413 で名称のみが使われる。
- 確信度: high

### sheet-27-R041 タグ登録 — 実装違い／ふるまい／P2

- 正本: sheet-27（タグ登録） HTML行 4314 付近
- 正本引用: 「編集対象のIDの指定が無いときは、新規登録として空の入力欄を表示する。指定されたIDに該当するタグが無いときは、画面を表示せず要求を受け付けない。」
- 設計期待値: 存在しないタグIDを指定して開いたときは、画面を返さず要求を受け付けない。
- 画像確認: 画像16枚を確認。画像5(C7)=タグ登録フォーム全体（名称(日)/名称(英)/並び順/優先表示商品のみを表示/その他の設定/登録ボタン）、画像4(B38)=一覧(ID/名称(日)/名称(英)/並び順/編集)、画像1(AU36)=件数プルダウン、画像16(F46)=ページング、画像2/3/7/9/11ほかはフリーエリア(日/英)・優先表示商品・タイトル・説明の各ラベル。
- 実装参照: `src/Eccube/Controller/Admin/Product/TagController.php:63-71;src/Eccube/Controller/Admin/Product/TagController.php:116-121`
- 実装実態: 存在しないIDを指定しても要求は受け付けられ、新規登録として空の入力欄の画面が表示される。登録の要求でも同じで、存在しないIDを指定した保存が新規タグの追加として通る。IDの指定が無いときに新規登録になる点は設計どおり。
- 判定根拠: src/Eccube/Controller/Admin/Product/TagController.php:69-71 は該当タグが取れなかった場合と指定が無い場合を区別せず、どちらも新規タグとして画面を組み立てる。src/Eccube/Controller/Admin/Product/TagController.php:119-121 の登録処理も同様。存在しないIDでも受け付けを止める判定が無い。
- 確信度: high

### sheet-28-R036 略称タグ登録 — 未実装／ふるまい／P2

- 正本: sheet-28（略称タグ登録） HTML行 4461 付近
- 正本引用: 「3	名称が既存の略称タグと重複しないか	重複するときは保存せず、一覧画面へ戻す」
- 設計期待値: 既存の略称タグと同じ名称で保存しようとしたときは保存せず、一覧画面へ戻して失敗を知らせる。
- 画像確認: sheet-28_img2.png（レイアウト図本体）を確認。商品管理／略称タグ新規登録の見出し、CSV出力・CSV入力ボタン、新規追加カード（名称・並び順・アルファベット順ソートフラグ）、右上の登録ボタン、一覧（ID・名称・並び順・ソート・編集・削除）を確認。一覧のID・名称・並び順はいずれも青字のリンク表示、ソート列は「コレクター番号」。img1は件数の単一選択（10件）、img3はページング（1〜5・次へ）、img4は内容の無い空画像。
- 実装参照: `src/Eccube/Controller/Admin/Product/StorageCodeController.php:141-149`
- 実装実態: 既存と同じ名称でもそのまま保存され、同名の略称タグが複数登録できてしまう。
- 同じ実装実態でまとまる要求: sheet-28-R045（略称タグ登録 / 実装参照 `src/Eccube/Controller/Admin/Product/StorageCodeController.php:147-149`）、sheet-28-R047（略称タグ登録）
- 判定根拠: 保存処理は検証成立後すぐ保存しており、名称が既存の略称タグと重複していないかを見ていない（src/Eccube/Controller/Admin/Product/StorageCodeController.php:141-149）。入力定義にも名称の重複を禁じる指定は無く（src/Eccube/Form/Type/Admin/StorageCodeType.php:36-42）、保存先にも名称を一意に保つ仕組みは無い（src/Eccube/Entity/Master/MtbStorageCode.php:40-41）。CSV取込側には同名を弾く判定がある（src/Eccube/Service/Csv/StorageCodeCsv.php:97-106）ため、画面保存だけが素通りする。
- 確信度: high

### sheet-3-R034 商品マスター(検索入力) — 実装違い／IO／P2

- 正本: sheet-3（商品マスター(検索入力)） HTML行 1223 付近
- 正本引用: 「識別ID:32「検索」を押下するを押下すると、下記の項目で商品検索を行う ・商品名(日) ・商品名(英)」
- 設計期待値: 商品名(日/英)欄に語を入れて検索すると、日本語の商品名に一致する商品だけでなく、英語の商品名に一致する商品も結果に出る。
- 画像確認: sheet-3_img1.png（商品マスター(検索入力)のレイアウト図）を確認。図の最上段が商品名(日/英)欄で、入力欄は1つ。日英いずれの名称でも引ける前提の欄である。
- 実装参照: `src/Eccube/Repository/ProductRepository.php:1214-1219`
- 実装実態: 商品名(日/英)欄の値は日本語商品名（p.name）だけと突き合わせている。英語商品名（p.name_en）は突き合わせ対象に入っておらず、英語名だけが一致する商品は結果に出ない。同じ画面の一括キーワード欄では英語名も対象にしている（同 src/Eccube/Repository/ProductRepository.php:1258）ため、英語名の保持自体はある。
- 同じ実装実態でまとまる要求: sheet-3-R035（商品マスター(検索入力)）
- 判定根拠: 項目表の識別ID:1は説明セルで「下記の項目で商品検索を行う ・商品名(日) ・商品名(英)」と検索対象を2つ挙げている。実装の該当条件は日本語名のみ。
- 確信度: high

### sheet-3-R037 商品マスター(検索入力) — 実装違い／IO／P2

- 正本: sheet-3（商品マスター(検索入力)） HTML行 1226 付近
- 正本引用: 「識別ID:32「検索」を押下するを押下すると、下記の項目で商品検索を行う ・カード名(日) ・カード名(英)」
- 設計期待値: カード名欄に語を入れて検索すると、日本語のカード名に一致する商品だけでなく、英語のカード名に一致する商品も結果に出る。
- 画像確認: sheet-3_img1.png（商品マスター(検索入力)のレイアウト図）を確認。図の詳細検索枠の左上がカード名欄で、入力欄は1つ。
- 実装参照: `src/Eccube/Repository/ProductRepository.php:1221-1234`
- 実装実態: カード名欄の値は日本語カード名（ca_card.name_jp）だけと突き合わせている。英語カード名（name_en）は突き合わせ対象に入っておらず、英語名だけが一致する商品は結果に出ない。一括キーワード欄では英語カード名も対象にしている（同 src/Eccube/Repository/ProductRepository.php:1258）。
- 同じ実装実態でまとまる要求: sheet-3-R038（商品マスター(検索入力)）
- 判定根拠: 項目表の識別ID:3は説明セルで検索対象を「・カード名(日) ・カード名(英)」の2つと定めている。実装の該当条件は日本語カード名のみ。
- 確信度: high

### sheet-3-R077 商品マスター(検索入力) — 実装違い／IO／P2

- 正本: sheet-3（商品マスター(検索入力)） HTML行 1270 付近
- 正本引用: 「商品名(日/英)・カード名・コードは、空白（半角・全角）またはカンマで区切って複数の語を指定できる。指定した語をすべて含むものに絞り込み、語ごとの照合は部分一致とする。IDは完全一致で照合する。」
- 設計期待値: 商品名・カード名・コード欄は空白やカンマで区切った複数の語を受け付け、入力した語をすべて含む商品だけが結果に出る。ID欄は入力した値と一致する商品だけが結果に出る。
- 画像確認: sheet-3_img1.png（商品マスター(検索入力)のレイアウト図）を確認。図では商品名・カード名・ID・コードはいずれも単一のテキスト入力欄で、複数語入力を妨げる構造は無い。
- 実装参照: `src/Eccube/Repository/ProductRepository.php:1214-1250`
- 実装実態: 商品名・カード名・コードは入力文字列を区切らず、入力全体を1つの語として部分一致させている（同1216・1223・1247）。そのため「A B」と入れるとAとBを両方含む商品ではなく「A B」という並びを含む商品しか出ない。IDは半角数字のとき部分一致で突き合わせており（同1240）、1と入れると10や11も結果に出る。
- 判定根拠: 現行仕様の検索条件節は本シートで踏襲対象として書かれており、リニューアル後の仕様（カスタマイズ説明・項目表）に上書きする記述は無い。実装の該当4条件はいずれも区切り処理を持たず、IDは完全一致でない。
- 確信度: high

### sheet-3-R083 商品マスター(検索入力) — 未実装／IO／P2

- 正本: sheet-3（商品マスター(検索入力)） HTML行 1276 付近
- 正本引用: 「部門は「未設定」を選べる。選んだ場合は、部門が設定されていない規格も対象とする。」
- 設計期待値: 部門の検索条件で「未設定」を選ぶことができ、選ぶと部門が設定されていない規格も検索結果に出る。
- 画像確認: sheet-3_img1.png（商品マスター(検索入力)のレイアウト図）を確認。部門欄は「複数選択可」のセレクトボックスとしてのみ描かれ、未設定の選択肢の有無は図からは読み取れないため実装で判定した。
- 実装参照: `src/Eccube/Form/Type/Admin/SearchProductType.php:419-437; src/Eccube/Repository/ProductRepository.php:1471-1476`
- 実装実態: 部門の選択肢は部門マスタの登録値だけで（app/DoctrineMigrations/Version20251125164750.php:62-115 に「未設定」の登録は無い）、「未設定」に当たる選択肢が画面に出ない。絞り込みも選ばれた部門に一致する規格だけを残すため、部門が設定されていない規格を検索結果に含める手段が無い。
- 判定根拠: 部門欄の選択肢生成（src/Eccube/Form/Type/Admin/SearchProductType.php:419-427）と絞り込み（src/Eccube/Repository/ProductRepository.php:1471-1476）の双方に未設定の扱いが無いことを確認した。
- 確信度: med

### sheet-32-R045 部門登録 — 実装違い／IO／P2

- 正本: sheet-32（部門登録） HTML行 4794 付近
- 正本引用: 「編集モードで指定した部門が存在しないときは 404 応答とする。」
- 設計期待値: 存在しない部門IDで編集画面を開こうとしたときは、その旨（見つかりません）の応答を返し、画面を出さない。
- 画像確認: sheet-32_img1.png（部門新規登録／部門編集のレイアウト図）を確認済み。 レイアウト図には存在しないID指定時の表示は描かれていない。
- 実装参照: `src/Eccube/Controller/Admin/Product/SectionController.php:76-84`
- 実装実態: 部門が見つからないときも応答は返され、新規登録の状態の画面がそのまま表示される。編集対象の引数がnull許容のため、見つからないIDは「未指定」と同じ扱いになり、$isNew=true として新規登録フォームが描画される（src/Eccube/Controller/Admin/Product/SectionController.php:78-83）。
- 同じ実装実態でまとまる要求: sheet-32-R048（部門登録 / 実装参照 `src/Eccube/Controller/Admin/Product/SectionController.php:115-121`）、sheet-32-R058（部門登録）
- 判定根拠: 編集用の経路（src/Eccube/Controller/Admin/Product/SectionController.php:76）で部門が取れなかった場合の分岐が無く、src/Eccube/Controller/Admin/Product/SectionController.php:80-83 で新規扱いへ落ちる。
- 確信度: high

### sheet-32-R050 部門登録 — 未実装／ふるまい／P2

- 正本: sheet-32（部門登録） HTML行 4800 付近
- 正本引用: 「重複するときは登録・更新を行わず、値が重複している旨をエラーとして表示する」
- 設計期待値: 部門名または部門コードが既存の部門と同じ値のときは登録・更新せず、値が重複している旨を画面にエラー表示する。
- 画像確認: sheet-32_img1.png（部門新規登録／部門編集のレイアウト図）を確認済み。 レイアウト図には重複時のエラー表示は描かれていない。
- 実装参照: `src/Eccube/Form/Type/Admin/ProductDepartmentType.php:38-81;src/Eccube/Entity/Master/MtbSection.php:46-50;src/Eccube/Controller/Admin/Product/SectionController.php:137-158`
- 実装実態: 部門名・部門コードの重複を判定する処理が無く、同じ部門名・部門コードの部門を何件でも登録できる。入力項目の検証は必須・桁数・数字のみだけ（src/Eccube/Form/Type/Admin/ProductDepartmentType.php:42-64）で、一意性の検証は無く、保存も無条件に実行される（src/Eccube/Controller/Admin/Product/SectionController.php:157）。
- 判定根拠: src/Eccube/Form/Type/Admin/ProductDepartmentType.php と src/Eccube/Entity/Master/MtbSection.php のいずれにも一意性の検証が無く、src/Eccube/Controller/Admin/Product/SectionController.php にも既存部門との突き合わせが無い。
- 確信度: high

### sheet-34-R033 部門登録CSVアップロード — 未実装／ふるまい／P2

- 正本: sheet-34（部門登録CSVアップロード） HTML行 4980 付近
- 正本引用: 「6	同一ファイル内で ID・部門名・部門コードが重複しないこと。ID列が空の行は重複の判定から除く	重複があれば、列名と行番号を示すエラーを表示して全体を中止する」
- 設計期待値: 同じファイルの中でID・部門名・部門コードが重複していたら、どの列の何行目かを示すエラーを出して1件も取り込まない。
- 画像確認: sheet-34_img1.png（レイアウト図・1枚）を確認。『商品管理 部門登録CSVアップロード』の見出し、『部門登録CSV』枠のCSVファイル選択（ファイルを選択ボタンと選択済みファイル名 upload.csv）、『CSVファイルのアップロード』ボタン、『部門登録CSVファイルフォーマット』表（ID=新規登録時は入力不要／部門名 必須／部門コード 必須／免税区分 必須 0:対象外、1:一般品、2:消耗品／MTGBuyer表示フラグ 1:表示、0または空:非表示）、右上の『雛形ファイルダウンロード』ボタンを確認。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/SectionMasterImportHandler.php:103-132`
- 実装実態: ファイル内でID・部門名・部門コードが重複していても検出されず、そのまま全行が取り込まれる。
- 同じ実装実態でまとまる要求: sheet-34-R034（部門登録CSVアップロード / 実装参照 `src/Eccube/Service/Csv/Importer/Event/SectionMasterImportHandler.php:134-165`）、sheet-34-R046（部門登録CSVアップロード / 実装参照 `src/Eccube/Service/Csv/Importer/Event/SectionMasterImportHandler.php:182-187`）
- 判定根拠: 部門マスタ取込は行ごとの形式チェックとID列の存在確認しか行わず（src/Eccube/Service/Csv/Importer/Event/SectionMasterImportHandler.php:103-132）、行をまたいだ検証は空で登録されている（src/Eccube/Service/Csv/Importer/Event/SectionMasterImportHandler.php:182-187）。同一ファイル内でID・部門名・部門コードが重複していても中止せず、そのまま登録・更新される（src/Eccube/Service/Csv/Importer/Event/SectionMasterImportHandler.php:134-165）。同種の取込（棚番号）には重複エラーの用意がある（src/Eccube/Service/Csv/Importer/MessageStore.php:528-531）ため、部門だけ判定が無い。
- 確信度: high

### sheet-36-R036 棚番登録 編集 — 実装違い／ふるまい／P2

- 正本: sheet-36（棚番登録 編集） HTML行 5152 付近
- 正本引用: 「失敗時出力 同じ画面の再表示とエラーメッセージ、または棚番号登録CSVアップロード画面への戻り。対象が存在しないときは404」
- 設計期待値: 存在しない棚番号を指定した要求に対しては、ページが見つからない扱いの応答を返す。
- 画像確認: sheet-36_img1.png（棚番号一覧画面。上部に CSV出力／CSV入力、新規追加の名称・並び順欄と登録ボタン、一覧の ID／名称／並び順・編集・削除、img3 のページャ、img4 の10件セレクタを確認）
- 実装参照: `src/Eccube/Controller/Admin/Product/ShelfNumberController.php:70-79`
- 実装実態: 同じ画面の再表示とエラーメッセージ、CSVアップロード画面への戻りは実装されているが、対象が存在しないときの見つからない扱いは削除処理だけで、編集画面の表示では効かず正常応答が返る。
- 同じ実装実態でまとまる要求: sheet-36-R019（棚番登録 編集）
- 判定根拠: src/Eccube/Controller/Admin/Product/ShelfNumberController.php:150-156 の再表示と src/Eccube/Controller/Admin/Product/ShelfNumberController.php:342 の戻りは一致。存在しないIDの扱いは src/Eccube/Controller/Admin/Product/ShelfNumberController.php:74-78 で新規扱いに落ちる（sheet-36-R019 と同じ欠陥）。
- 確信度: high

### sheet-38-R009 購入グループ管理 — 実装違い／ふるまい／P2

- 正本: sheet-38（購入グループ管理） HTML行 5273 付近
- 正本引用: 「予約商品フラグ。このフラグが立っている購入グループの商品は、フロントの買取一覧、買取詳細に表示させない」
- 設計期待値: 予約商品フラグが立っている購入グループに属する商品は、フロントの買取一覧にも買取詳細にも出てこない。
- 画像確認: sheet-38_img1.png に予約商品フラグのチェックボックスがあることは確認したが、フロント側の除外可否は画像では判定できないため実装で確認した。
- 実装参照: `src/Eccube/Repository/ProductRepository.php:198-205`
- 実装実態: 予約商品フラグが立った購入グループの商品でも、買取詳細画面は通常どおり表示される。買取一覧だけが除外されている。
- 同じ実装実態でまとまる要求: sheet-38-R002（購入グループ管理）
- 判定根拠: src/Eccube/Service/UniSearch/UniSearchService.php:123 と src/Eccube/Service/UniSearch/UniSearchService.php:194-196 で買取一覧は除外している。買取詳細が使う src/Eccube/Repository/ProductRepository.php:198-205 には購入グループの予約商品フラグによる除外条件が無い（sheet-38-R002 と同じ欠陥）。
- 確信度: high

### sheet-39-R061 買取・販売価格履歴検索 — 実装違い／ふるまい／P2

- 正本: sheet-39（買取・販売価格履歴検索） HTML行 5462 付近
- 正本引用: 「商品マスターの一覧から価格履歴を開くと、URLで渡された商品と、NM指定の導線では加えて状態のコードを検索条件にする。この経路では画面の検索条件を使わず、URLで渡された条件だけで検索し、登録日時の降順・同じ日時では状態の昇順で並べる。」
- 設計期待値: 商品マスターの一覧から価格履歴を開いたときは、渡された商品（NM指定の導線では加えて状態）だけを条件に検索し、一覧は登録日時の新しい順、同じ日時では状態の昇順で並ぶ。
- 画像確認: 画像1(B7 買取・販売価格履歴一覧の画面キャプチャ)で検索フォーム・検索結果一覧の全項目を確認。画像2は枠線のみで文言なし。
- 実装参照: `src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:131-199;src/Eccube/Repository/DtbPriceHistoryRepository.php:392;src/Eccube/Util/SqlUtil.php:360-363`
- 実装実態: 渡された商品・状態は保持中の検索条件へ上書き合成される形で使われるため、前の検索で入れた条件（カテゴリや価格帯など）が残っていれば併せて絞り込まれる。並びは登録日時の降順と履歴IDの降順に固定で、同じ日時での状態の昇順にはならない。
- 判定根拠: src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:147-199 は渡された値を保持中の検索条件へマージしてから src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:135 で検索しており、渡された条件だけを使う経路になっていない。並び順は src/Eccube/Repository/DtbPriceHistoryRepository.php:392 で登録日時・履歴IDに固定され、src/Eccube/Util/SqlUtil.php:360-363 で降順のみが適用される。
- 確信度: med

### sheet-42-R047 基準価格変更CSVアップロード — 未実装／IO／P2

- 正本: sheet-42（基準価格変更CSVアップロード） HTML行 5724 付近
- 正本引用: 「5 低価格帯カード価格変更CSVダウンロード プルダウン - 低価格帯カード価格変更CSVを出力する」
- 設計期待値: 基準価格変更CSVアップロード画面から低価格帯カード価格変更CSVを出力できる。
- 画像確認: sheet-42_img1.png を確認。画面上部『商品管理 基準価格変更CSVアップロード』、CSVファイル選択＋『CSVファイルのアップロード』、『基準価格変更CSVファイルフォーマット』表（商品ID/言語(ID)/販売価格→基準価格/買取価格、いずれも必須バッジ）と『雛形ファイルダウンロード』、『低価格帯カード価格変更CSVファイルフォーマット』＋『低価格帯カード価格変更CSVダウンロード』、『CSVインポート履歴』（件数プルダウン10件/ファイル名・アップロード日時・作業者/ページング）を確認した。
- 実装参照: `src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:90-123;src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:80-113`
- 実装実態: 画面には雛形ファイルダウンロードしか無く、低価格帯カード価格変更CSVを出力する操作も出力処理も存在しない。
- 同じ実装実態でまとまる要求: sheet-42-R048（基準価格変更CSVアップロード）、sheet-42-R010（基準価格変更CSVアップロード）
- 判定根拠: 画面テンプレート src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:80-113 と描画データ src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:109-122 に該当する操作が無い。低価格帯カード価格変更CSVを出力する処理も実装に見当たらない。
- 確信度: high

### sheet-42-R060 基準価格変更CSVアップロード — 実装違い／ふるまい／P2

- 正本: sheet-42（基準価格変更CSVアップロード） HTML行 5741 付近
- 正本引用: 「行の検証は上から順に行い、1行でも不合格になった時点で、以降の行を読まずに取込全体を打ち切る。不合格の行だけを読み飛ばして続ける動作はしない。打ち切りになるのは、列数がヘッダの列数と一致しない行、必要な列名がヘッダに無い行、値が不正な行、言語IDが言語マスタに無い行、同じ行の買取価格が販売価格を上回る行、および商品IDに該当する商品が無い行である。削除済みの商品は無いものとして扱う。」
- 設計期待値: 1行の買取価格が同じ行の基準価格（販売価格）を上回るときは、その行でエラーを表示して取込全体を打ち切り、価格を更新しない。
- 画像確認: sheet-42_img1.png を確認。当該記述に対応する図示は無い。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:204-207;src/Eccube/Service/Csv/Importer/Validator/PriceConsistencyRowValidator.php:51-64`
- 実装実態: 列数不一致・列名なし・値不正・言語IDがマスタに無い・商品が無いの5条件は打ち切りになるが、買取価格が基準価格を上回る行の検査が無く、買取価格が基準価格より高いままでも取り込まれる。
- 判定根拠: src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:204-207 の行検証は空を返しており、他のCSV取込で使う買取価格と販売価格の大小検査(src/Eccube/Service/Csv/Importer/Validator/PriceConsistencyRowValidator.php:57-62)が基準価格変更CSVでは呼ばれない。列数・列名・値・言語ID・商品存在の検査は src/Eccube/Service/Csv/Importer/Event/BaseCsvImportHandler.php:72-98 と src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:225-263 で打ち切りになる。文言 src/Eccube/Resource/locale/messages.ja.yaml:2431 は定義済みだが本取込からは使われない。
- 確信度: high

### sheet-42-R071 基準価格変更CSVアップロード — 未実装／ふるまい／P2

- 正本: sheet-42（基準価格変更CSVアップロード） HTML行 5752 付近
- 正本引用: 「取込内容は、エラーメッセージが1件も無いか、打ち切りが起きなかったときに確定する。それ以外のときは、それまでに更新した内容もすべて取り消す。エラーメッセージが1件も無いときに限り、成功メッセージを表示し、取込履歴へファイル名と操作した担当者を1件追加する。確定した後、取り込んだ商品IDを重複を除いて支店システムへ通知する。取込の間だけ行ロックの待ち時間を5秒に変え、処理の後で元の値へ戻す。予期せぬ例外が起きたときは、取込内容の取り消しを試みたうえで例外を送出する。」
- 設計期待値: 取込確定後、取り込んだ商品IDが重複を除いて支店システムへ通知される。
- 画像確認: sheet-42_img1.png を確認。当該記述に対応する図示は無い。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:56-62;src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:87-93`
- 実装実態: 確定・取り消し・成功メッセージ・取込履歴1件追加・行ロック待ち5秒・例外時の取り消しは実装されているが、支店システムへの更新通知が無い。取り込んだ商品IDを集めて通知する処理自体が存在せず、同種の価格CSVでは通知箇所が保留のまま残されている。
- 同じ実装実態でまとまる要求: sheet-42-R073（基準価格変更CSVアップロード / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:56-62;src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:187-209`）
- 判定根拠: 確定と取り消しは src/Eccube/Service/Csv/Importer/CsvImporter.php:270-275、成功メッセージと履歴追加は src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:188-197、行ロック待ち5秒は src/Eccube/Service/Csv/Importer/Event/BaseCsvImportHandler.php:120-123 と src/Eccube/Service/Csv/Importer/CsvImporter.php:225-226,279、例外時の取り消しは src/Eccube/Service/Csv/Importer/CsvImporter.php:287-295 で実装済み。一方 src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:56-62 の取込後処理はスマレジ連携だけで支店システムへの通知が無く、セール用価格変更CSVの src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:87-93 では通知処理が保留のまま残されている。
- 確信度: high

### sheet-44-R006 セール用価格変更CSVアップロード — 実装違い／ふるまい／P2

- 正本: sheet-44（セール用価格変更CSVアップロード） HTML行 5902 付近
- 正本引用: 「基準価格を販売価格に反映する」
- 設計期待値: セールフラグを無効へ切り替えた商品規格の販売価格が、登録済の基準価格と同じ額になること。
- 画像確認: レイアウト図(sheet-44_img1.png)を確認。画面上に該当する表示は無く、取込処理の内部仕様のため図からは判定できない。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:326-336;src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:359`
- 実装実態: 基準価格を販売価格の元値に置いたあと、さらに規格の割引率を掛けて10円単位へ切り上げているため、販売価格が基準価格と一致しない。基準価格は既に規格別の割引適用後の額で保持されているため、割引が二重に掛かる。
- 同じ実装実態でまとまる要求: sheet-44-R041（セール用価格変更CSVアップロード / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:332;src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:359`）、sheet-44-R049（セール用価格変更CSVアップロード / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:339;src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:359`）、sheet-45-R055（セール用価格変更CSVフォーマット / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:359`）、sheet-45-R063（セール用価格変更CSVフォーマット / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:359`）、sheet-61-R081（別添資料_CSVアップロードによる基準価格と販売価格の更新 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:332;src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:359;src/Eccube/Repository/ProductClassRepository.php:2649`）、sheet-61-R088（別添資料_CSVアップロードによる基準価格と販売価格の更新 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:339;src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:359;src/Eccube/Repository/ProductClassRepository.php:2649`）、sheet-61-R110（別添資料_CSVアップロードによる基準価格と販売価格の更新 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:332;src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:359;src/Eccube/Repository/ProductClassRepository.php:2649`）、sheet-61-R118（別添資料_CSVアップロードによる基準価格と販売価格の更新 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:339;src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:359;src/Eccube/Repository/ProductClassRepository.php:2649`）
- 判定根拠: src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:332 で販売価格に基準価格(standardPrice)を代入した後、src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:359 で規格の割引率を再度掛けている。基準価格は基準価格変更CSV側で規格別に割引適用済みの額として保存される（src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:117-121）ため、コピー時の再割引は設計と一致しない。
- 確信度: med

### sheet-44-R044 セール用価格変更CSVアップロード — 実装違い／ふるまい／P2

- 正本: sheet-44（セール用価格変更CSVアップロード） HTML行 5941 付近
- 正本引用: 「・CSVに販売価格が設定されている場合は、CSVの価格は反映されていない旨(アラート)を画面上に表示する」
- 設計期待値: CSVの価格が反映されていない旨のアラートが画面に出たうえで、その取込自体は成功として扱われ、完了メッセージが出てCSVインポート履歴にも記録されること。
- 画像確認: レイアウト図(sheet-44_img1.png)を確認。画面上に該当する表示は無く、取込処理の内部仕様のため図からは判定できない。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:334;src/Eccube/Service/Csv/Importer/CsvImporter.php:283;src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:182-194`
- 実装実態: アラートがエラーと同じ入れ物に積まれるため、取込結果がエラーありと判定される。その結果、完了メッセージが出ず、CSVインポート履歴にも記録されない。一方でデータベースの更新は確定するので、画面上は失敗に見えるのに価格は書き換わった状態になる。
- 同じ実装実態でまとまる要求: sheet-44-R052（セール用価格変更CSVアップロード / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:341;src/Eccube/Service/Csv/Importer/CsvImporter.php:283;src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:182-194`）、sheet-61-R083（別添資料_CSVアップロードによる基準価格と販売価格の更新 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:334;src/Eccube/Service/Csv/Importer/MessageStore.php:85-90;src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:182-188`）、sheet-61-R112（別添資料_CSVアップロードによる基準価格と販売価格の更新 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:334;src/Eccube/Service/Csv/Importer/MessageStore.php:85-90;src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:182-188`）
- 判定根拠: src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:334 はアラートを addMessage（エラー側）で積んでいる（情報側は src/Eccube/Service/Csv/Importer/MessageStore.php:100-105 の addInfo）。src/Eccube/Service/Csv/Importer/CsvImporter.php:283 でエラー配列に入り、src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:182-186 のエラー分岐に落ちるため src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:188-194 の完了メッセージと履歴登録が実行されない。一方 src/Eccube/Service/Csv/Importer/CsvImporter.php:270-272 では hasBreak が偽なのでコミットされる。
- 確信度: high

### sheet-44-R100 セール用価格変更CSVアップロード — 未実装／ふるまい／P2

- 正本: sheet-44（セール用価格変更CSVアップロード） HTML行 6002 付近
- 正本引用: 「取込が成功したときだけ、取り込んだ商品を支店システムへ通知する。通知は取り込んだ商品IDから重複を除いた一覧で1回行う。」
- 設計期待値: 取込が成功したとき、取り込んだ商品が重複なくまとめて支店システムへ通知され、支店側に価格の変更が伝わること。
- 画像確認: レイアウト図(sheet-44_img1.png)を確認。画面上に該当する表示は無く、取込処理の内部仕様のため図からは判定できない。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:79-92`
- 実装実態: 支店システムへ通知する処理が入っていない。取込が成功しても支店システムには何も伝わらない。
- 同じ実装実態でまとまる要求: sheet-44-R101（セール用価格変更CSVアップロード）、sheet-44-R104（セール用価格変更CSVアップロード）、sheet-48-R052（高額商品価格変更CSVアップロード / 実装参照 `src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:41-46;src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:173-198;src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:81-95`）、sheet-50-R088（セール用高額商品価格変更CSVアップロード / 実装参照 `src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:58-67;src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:162-193`）、sheet-50-R089（セール用高額商品価格変更CSVアップロード / 実装参照 `src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:58-67;src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:162-193`）、sheet-50-R092（セール用高額商品価格変更CSVアップロード / 実装参照 `src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:162-193;src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:58-67`）
- 判定根拠: src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:84-90 で支店システムへの通知が丸ごとコメントとして無効化され、移植が必要である旨の注記だけが残っている。ee内に本画面から支店システムへ通知する実装は無い。
- 確信度: high

### sheet-45-R007 セール用価格変更CSVフォーマット — 実装違い／IO／P2

- 正本: sheet-45（セール用価格変更CSVフォーマット） HTML行 6057 付近
- 正本引用: 「※カスタマイズ対応、必須項目に変更 0: セールではない 1: セールである 指定が無い場合は エラー」
- 設計期待値: セールフラグを空欄にした行はエラーとして扱われ、その行の販売価格・買取価格・セールフラグは更新されない。
- 画像確認: 本シートに画像は添付されていない（シート冒頭に「画像 0枚」）ため、図からの追加確認は無し。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:165`
- 実装実態: セールフラグが空欄でもエラーにならず、セールではない(0)とみなして取り込まれる。結果としてセール中商品なら販売価格が基準価格へ戻される。
- 同じ実装実態でまとまる要求: sheet-45-R010（セール用価格変更CSVフォーマット）
- 判定根拠: src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:161-167 で必須指定があるのは商品ID・言語ID・販売価格・買取価格の4列だけで、セールフラグ列には必須指定が無い。列定義の既定は非必須（src/Eccube/Service/Csv/Importer/Model/BaseCsvColumn.php:57）で、必須検証は非必須列では働かない（src/Eccube/Service/Csv/Importer/Model/BaseCsvColumn.php:148）。空欄は src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:311-314 で無効(0)に丸められ、そのまま取り込まれる。取込画面の書式表には必須の印が出る（src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:232-241 / src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:99-103）が、これは表示だけで値の検証には使われない。
- 確信度: high

### sheet-45-R022 セール用価格変更CSVフォーマット — 実装違い／ふるまい／P2

- 正本: sheet-45（セール用価格変更CSVフォーマット） HTML行 6074 付近
- 正本引用: 「・条件を満たす場合スマレジ連携フラグを有効とする」
- 設計期待値: セール用価格変更CSVの取込で価格が変わり連携条件を満たすようになった商品規格は、スマレジ連携の対象（連携フラグ有効）になる。
- 画像確認: 本シートに画像は添付されていない（シート冒頭に「画像 0枚」）ため、図からの追加確認は無し。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:367`
- 実装実態: スマレジ連携フラグは取込前の値のまま書き戻され、価格変更後の条件で見直されない。条件を満たすようになっても連携対象にならない。
- 判定根拠: src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:367 は取込前に読み出したスマレジ連携フラグをそのまま渡し、src/Eccube/Repository/ProductClassRepository.php:2677 で同じ値を書き戻すだけである。連携条件（販売価格300円以上かつNM以外、非公開・廃止は対象外）による再判定はカードCSV側の src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:941-953 にしかなく、セール用価格変更CSVの経路では行われない。
- 確信度: med

### sheet-48-R011 高額商品価格変更CSVアップロード — 未実装／ふるまい／P2

- 正本: sheet-48（高額商品価格変更CSVアップロード） HTML行 6330 付近
- 正本引用: 「・買取・販売価格履歴を登録する際には、基準価格も登録する」
- 設計期待値: 高額商品価格変更CSVで価格を更新したとき、その商品規格の買取・販売価格履歴が1件残り、履歴に基準価格の更新前と更新後が記録されること。
- 画像確認: レイアウト図(sheet-48_img1.png)を確認。CSVファイル選択/CSVファイルのアップロード/高額商品価格変更CSVファイルフォーマット表(商品コード 必須・販売価格を取り消し線で消して基準価格 必須)/雛形ファイルダウンロード/件数プルダウン(10件)/CSVインポート履歴(ファイル名・アップロード日時・作業者)/ページャを確認した。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:75-105;src/Eccube/Repository/ProductClassRepository.php:2267-2325`
- 実装実態: この取込では価格履歴を一切残さない。基準価格・販売価格を直接書き換えるだけで、買取・販売価格履歴には1件も追加されないため、基準価格の更新前後も残らない。
- 同じ実装実態でまとまる要求: sheet-48-R059（高額商品価格変更CSVアップロード）
- 判定根拠: 1行の取込処理（src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:75-105）は価格の更新だけを行い、価格履歴を追加する呼び出しを持たない。同じ高額商品系のセール用取込は価格履歴を追加している（src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:148-157、src/Eccube/Repository/DtbPriceHistoryRepository.php:160）ため、実装漏れである。
- 確信度: high

### sheet-5-R086 商品登録編集 — 実装違い／ふるまい／P2

- 正本: sheet-5（商品登録編集） HTML行 1613 付近
- 正本引用: 「次の項目は、空・未選択のままでは登録できない。商品名、商品名(英)、商品カテゴリ（1件以上）、購入グループ、サイズ、重量、割引率、販売制限、商品公開ステータス。」
- 設計期待値: 商品名(英)・商品カテゴリ（1件以上）・購入グループ・サイズ・重量・割引率・販売制限を空／未選択のまま保存しようとした場合、商品は更新されず、編集画面に項目ごとのエラーを表示して留まる。
- 画像確認: レイアウト図(sheet-5_img1.png)を確認。必須表示は商品名の欄のみ。
- 実装参照: `src/Eccube/Form/Type/Admin/ProductType.php:85-95;src/Eccube/Form/Type/Admin/ProductType.php:165-235;src/Eccube/Form/Type/Admin/ProductType.php:248-257;src/Eccube/Form/Type/Admin/ProductType.php:284-288`
- 実装実態: 必須として検証されるのは商品名と商品公開ステータスだけ。商品名(英)・購入グループ・サイズ・重量・割引率・買取減額率・販売制限はいずれも任意扱いで、商品カテゴリにも件数の検証が無いため、これらを空／未選択のまま保存すると更新が成功する。画面上も必須の目印は商品名にしか出ない（src/Eccube/Resource/template/admin/Product/product.twig:188-195）。
- 判定根拠: 設計は9項目を空・未選択のままでは登録できないとするが、実装で入力必須が課されているのは商品名（src/Eccube/Form/Type/Admin/ProductType.php:85-90 のNotBlank）と商品公開ステータス（src/Eccube/Form/Type/Admin/ProductType.php:284-288 のNotBlank）のみ。商品名(英)は長さ上限だけ（src/Eccube/Form/Type/Admin/ProductType.php:91-95）、購入グループ・サイズ・重量・割引率・販売制限は required:false（src/Eccube/Form/Type/Admin/ProductType.php:165-235）、商品カテゴリは選択件数の検証が無い（src/Eccube/Form/Type/Admin/ProductType.php:248-257）。
- 確信度: med

### sheet-50-R078 セール用高額商品価格変更CSVアップロード — 実装違い／ふるまい／P2

- 正本: sheet-50（セール用高額商品価格変更CSVアップロード） HTML行 6588 付近
- 正本引用: 「対象は、行の商品コードに一致し、高額商品コードを持つ商品規格1件とする。削除済みの商品・商品規格は対象にしない。」
- 設計期待値: 削除済みの商品・商品規格は取込の更新対象にならず、該当行はデータ無しとして扱われる。
- 画像確認: レイアウト図(sheet-50_img1.png)で該当箇所を確認した。
- 実装参照: `src/Eccube/Repository/ProductClassRepository.php:2242-2259`
- 実装実態: 対象規格の検索条件が商品コードと高額商品コードの有無だけで、削除済み(visible=false)の商品規格を除外していないため、削除済みの規格が更新対象になりうる。
- 判定根拠: 同一リポジトリの他の検索は削除済み規格を除く条件を持つ(src/Eccube/Repository/ProductRepository.php:448、src/Eccube/Repository/ProductRepository.php:493)が、本取込の検索(src/Eccube/Repository/ProductClassRepository.php:2249-2258)には無い。
- 確信度: med

### sheet-51-R062 セール用高額商品価格変更CSVフォーマット — 実装違い／IO／P2

- 正本: sheet-51（セール用高額商品価格変更CSVフォーマット） HTML行 6714 付近
- 正本引用: 「・通常商品の販売価格、買取価格は変更できない旨(アラート)を画面上に表示する」
- 設計期待値: セールフラグが無効のままの行では、その商品の販売価格・買取価格は変更できない旨を画面上のアラートに表示する。
- 画像確認: 本シートは画像0枚。レイアウト図は無く、確認対象の文言は本文のみ。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:137;src/Eccube/Resource/locale/messages.ja.yaml:2023;src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:162-166`
- 実装実態: アラートは出るが、文言が『%d行目: 通常商品のため、買取価格はCSVの値で更新しました。』で、買取価格を更新したと伝えている。
- 判定根拠: src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:137 で当該分岐の警告を積み、src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:162-166 で画面に出している。ただし文言（src/Eccube/Resource/locale/messages.ja.yaml:2023）は『買取価格はCSVの値で更新しました。』であり、設計が求める『販売価格、買取価格は変更できない旨』と逆の内容を伝える。実際にこの分岐で買取価格は更新されない（src/Eccube/Repository/ProductClassRepository.php:2605-2613 の更新文に買取価格は無い）ため、担当者が更新済みと誤認する。
- 確信度: med

### sheet-55-R003 略称タグ更新CSVフォーマット — 未実装／IO／P2

- 正本: sheet-55（略称タグ更新CSVフォーマット） HTML行 6994 付近
- 正本引用: 「M03-37 略称タグ更新CSV登録
識別ID	項目名	主キー	書式・制限	必須	最大文字数
または最大値	入力例	備考
1	商品ID	◯	数値(整数)	◯	-	1」
- 設計期待値: 略称タグ更新CSVの1列目で商品IDを必須項目として受け付け、数値(整数)でない値や空の行、該当する商品が無い行はエラーとして取り込まない。
- 画像確認: 画像0枚のシート（design_audit/0204/images に sheet-55_img*.png が存在しない）。レイアウト図が無く、図中の文言で判定が変わる余地は無い。
- 実装参照: `app/config/eccube/packages/eccube_nav.yaml:40;src/Eccube/Entity/Master/MtbCsvImportType.php:39;src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:315`
- 実装実態: 商品の略称タグをCSVで一括更新する取込画面も取込処理も存在しない。商品CSV管理メニューにはカード商品・グッズ商品・売上分析タグ更新・商品タグ更新・部門更新・棚番号更新などが並ぶが、略称タグ更新CSVの項目が無い。略称タグに関するCSV取込は略称タグマスタ（ID・名称・並び順）の登録用アップロードだけで、商品を対象にしていない。取込種別「略称タグ更新」は用意されているが、どこからも使われていない。
- 同じ実装実態でまとまる要求: sheet-55-R004（略称タグ更新CSVフォーマット）、sheet-54-R004（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R006（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R008（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R009（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R011（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R012（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R013（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R014（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R015（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R016（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R003（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R005（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R019（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R020（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R022（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R023（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R025（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R027（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R028（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R029（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R030（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R031（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R032（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R034（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R035（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R037（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R038（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R040（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R041（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R042（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R044（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R046（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R047（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R049（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R050（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）、sheet-54-R051（略称タグ更新CSV登録 / 実装参照 `app/config/eccube/packages/eccube_nav.yaml:40-76;src/Eccube/Controller/Admin/Product/StorageCodeController.php:284-377;src/Eccube/Entity/Master/MtbCsvImportType.php:39`）
- 判定根拠: 略称タグ／storage_code を含むコントローラ・取込処理・画面テンプレート・メニュー定義を全走査したが、商品IDと略称タグ名称の2列を取り込む処理は存在しない。商品CSV管理メニューは app/config/eccube/packages/eccube_nav.yaml:40-77 に略称タグ更新の項目を持たない。略称タグのCSVは src/Eccube/Controller/Admin/Product/StorageCodeController.php:305 のマスタ登録用アップロード（見出しはID・名称・並び順、src/Eccube/Service/Csv/StorageCodeCsv.php:33）だけで、これは別機能（略称タグCSVアップロード）である。取込種別 src/Eccube/Entity/Master/MtbCsvImportType.php:39 は定義のみで参照が無い。略称タグの列定義 src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:315 はカード商品CSV／グッズ商品CSVからのみ使われ、しかもIDでの指定で、本シートの名称指定とは異なる。
- 確信度: high

### sheet-6-R024 セール用価格変更CSV出力 — 実装違い／IO／P2

- 正本: sheet-6（セール用価格変更CSV出力） HTML行 1703 付近
- 正本引用: 「1行は状態NMの規格1件に対応する。同じ商品に状態NMの規格が複数あるときは、その件数だけ行が出る。規格があっても状態NMの規格が1件も無い商品は、行を出さない。規格の並び順は商品一覧の表示順との一致を保証しない。」
- 設計期待値: セール用価格変更CSVの1行は状態NMの規格1件に対応し、状態がNM以外の規格は行として出力されない。規格があっても状態NMの規格が1件も無い商品は行が出ない。
- 画像確認: 本シートはレイアウト図0枚のため画像確認対象なし（images/ に sheet-6_img* は存在しない）。
- 実装参照: `src/Eccube/Service/Csv/ProductPriceCsv.php:97-111`
- 実装実態: 商品に紐づく規格を状態で絞らずに全件出力するため、状態がSP/MP/HP等の規格も行になり、状態NMの規格が無い商品でも規格があれば行が出る。
- 判定根拠: 出力対象の規格を状態で絞り込む処理が無く、商品に紐づく規格をすべて1行ずつ出力している（src/Eccube/Service/Csv/ProductPriceCsv.php:97-111）。ee でも規格はカード状態を持ち（src/Eccube/Entity/ProductClass.php:263-264）、NM/SP/MP/HP が別々の規格として存在する（src/Eccube/Entity/Master/MtbCardCondition.php:34-38）。現行仕様は状態NMの規格だけを行にすると定めており、行数と対象が食い違う。
- 確信度: med

### sheet-63-R016 別添資料__スマレジ連携__商品連携項目 — 実装違い／IO／P2

- 正本: sheet-63（別添資料__スマレジ連携__商品連携項目） HTML行 7684 付近
- 正本引用: 「6 品番 商品コード 〇 〇 〇 〇 7 税区分 - 0：税込 を連携する」
- 設計期待値: スマレジの品番には、スマレジ商品コードではなくECCUBEの商品コードが入る。
- 画像確認: 本シートは画像0枚（レイアウト図なし）。表本文のセルのみで判定した。
- 実装参照: `src/Eccube/MessageHandler/SmaregiProductClassUpsertMessageHandler.php:273; src/Eccube/MessageHandler/SmaregiProductClassUpsertMessageHandler.php:266`
- 実装実態: 品番にあたる値へ、商品コードと同じスマレジ商品コードをそのまま設定している（src/Eccube/MessageHandler/SmaregiProductClassUpsertMessageHandler.php:273。商品コード側は同:266）。ECCUBEの商品コード（商品規格の商品コード、src/Eccube/Entity/ProductClass.php:184-185,375-378）は送信値に含まれていない。tests/Eccube/Tests/MessageHandler/SmaregiProductClassUpsertMessageHandlerTest.php:73-74 も同じ値になることを前提にしている。
- 判定根拠: 正本の項目表は、スマレジ「商品コード」←ECCUBE「スマレジ商品コード」、スマレジ「品番」←ECCUBE「商品コード」と別々の項目を対応させている。ee は両方にスマレジ商品コードを入れており、スマレジ側で品番からECの商品コードを辿れない。
- 確信度: high

### sheet-63-R044 別添資料__スマレジ連携__商品連携項目 — 実装違い／ふるまい／P2

- 正本: sheet-63（別添資料__スマレジ連携__商品連携項目） HTML行 7712 付近
- 正本引用: 「※商品画像は登録を行わない 商品削除できる機能 〇 〇 〇 〇」
- 設計期待値: 商品編集の商品削除でも、スマレジ側の該当商品が削除される。
- 画像確認: 本シートは画像0枚（レイアウト図なし）。表本文のセルのみで判定した。
- 実装参照: `src/Eccube/Controller/Admin/Product/ProductController.php:1077-1146`
- 実装実態: 商品編集からの商品削除は商品と配下の商品規格を消すだけで、スマレジ側の商品削除を投入しない（src/Eccube/Controller/Admin/Product/ProductController.php:1077-1146。同メソッドにスマレジ連携の呼び出しは無い）。規格登録からの削除は投入している（src/Eccube/Service/Admin/Product/ProductClassDeleteAction.php:54-79、src/Eccube/Controller/Admin/Product/ProductClassController.php:441-486）。商品画像は送信値に含めていない（src/Eccube/MessageHandler/SmaregiProductClassUpsertMessageHandler.php:259-286）ので前段の記述は充足。
- 判定根拠: 正本は「商品削除できる機能」として商品編集・規格登録・カード商品CSV登録・グッズ商品CSV登録に〇を付けている。ee で削除連携があるのは規格登録経路だけで、商品編集から商品を消すとスマレジ側に商品が残り、POSで販売できる状態が続く。カード/グッズCSVには削除手段自体が無いためその2列は判断を保留し、商品編集の欠落のみを指摘する。
- 確信度: high

### sheet-65-R013 別添資料__スマレジ連携対象商品 — 実装違い／ふるまい／P2

- 正本: sheet-65（別添資料__スマレジ連携対象商品） HTML行 7812 付近
- 正本引用: 「・新規登録時や更新時、一度でも連携条件（基準価格が300円以上かつ状態がSP、MP、HP、その他規格）を満たせば、フラグを手動でOFFにしない限りは条件を満たさなくなっても連携され続ける」
- 設計期待値: いったんONになったスマレジ連携フラグは、手動でOFFにしない限り、その後に連携条件を満たさなくなってもONのままで連携が続くこと。
- 画像確認: 本シートに画像は0枚（別添資料のためレイアウト図なし）。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:691;src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:709-721;src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:941-954`
- 実装実態: カード商品CSVの更新は毎回スマレジ連携フラグを再計算し、条件を満たさない行では既存のONを無条件にOFFへ上書きする。値下げ等で条件から外れた時点で連携が止まる。
- 同じ実装実態でまとまる要求: sheet-65-R067（別添資料__スマレジ連携対象商品）
- 判定根拠: src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:941-954 の自動判定は条件を満たさない場合に必ず無効を返し、src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:709-721 の更新はその値をそのままスマレジ連携フラグに書き込む。既存値を読んで「ONは維持する」分岐は無い。
- 確信度: high

### sheet-65-R016 別添資料__スマレジ連携対象商品 — 実装違い／ふるまい／P2

- 正本: sheet-65（別添資料__スマレジ連携対象商品） HTML行 7815 付近
- 正本引用: 「シングルカード以外　・連携対象の商品について、商品規格編集画面またはグッズ商品CSV登録画面でスマレジ連携フラグを手動で立てた商品規格のみ連携を行う
共通の条件　・商品の状態が公開または非公開」
- 設計期待値: 商品の状態が公開・非公開のいずれでも連携対象になり、非公開にしただけでスマレジ連携が外れないこと。
- 画像確認: 本シートに画像は0枚（別添資料のためレイアウト図なし）。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:941-946;src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:578-582`
- 実装実態: カード商品CSV・グッズ商品CSVのいずれも、商品公開ステータスが非公開の行はスマレジ連携フラグを強制的にOFFにする。非公開の商品は連携対象から外れる。
- 判定根拠: src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:944-946 と src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:579-582 が DISPLAY_HIDE を廃止と同列に扱い、連携フラグを無効へ落としている。正本は非公開も連携対象と定めている。
- 確信度: high

### sheet-65-R037 別添資料__スマレジ連携対象商品 — 実装違い／ふるまい／P2

- 正本: sheet-65（別添資料__スマレジ連携対象商品） HTML行 7836 付近
- 正本引用: 「基準価格が300円以上かつ状態がSP、MP、HP、その他規格である場合は自動でスマレジ連携フラグがONになる」
- 設計期待値: カード商品CSV取込の自動判定は基準価格が300円以上かつ状態がSP・MP・HP・その他規格のときにスマレジ連携フラグがONになること。
- 画像確認: 本シートに画像は0枚（別添資料のためレイアウト図なし）。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:688-694;src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:941-954`
- 実装実態: 自動判定に渡しているのは基準価格ではなく販売価格（商品の割引率を掛けた値）で、基準価格が300円以上でも販売価格が300円未満ならフラグがONにならない。
- 判定根拠: src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:689 で算出した販売価格を src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:691 で自動判定に渡している。基準価格 $newStandardPrice は src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:685-690 で別に算出され判定に使われない。状態の条件（NM以外）は src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:949 で一致している。
- 確信度: high

### sheet-65-R052 別添資料__スマレジ連携対象商品 — 実装違い／ふるまい／P2

- 正本: sheet-65（別添資料__スマレジ連携対象商品） HTML行 7851 付近
- 正本引用: 「基準価格の変更については、300円以上に更新された場合にスマレジ連携フラグをONにする」
- 設計期待値: 基準価格変更CSVでシングルカードの基準価格を閾値以上に上げたとき、スマレジ連携フラグがONになり連携対象に入ること。
- 画像確認: 本シートに画像は0枚（別添資料のためレイアウト図なし）。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:135-181`
- 実装実態: 基準価格変更CSVの取込は既存のスマレジ連携フラグをそのまま使い、価格が閾値を超えてもフラグをONにしない。フラグがOFFの商品規格は価格を上げても連携されない。
- 同じ実装実態でまとまる要求: sheet-68-R016（別添資料__スマレジ連携__機能改修一覧 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:135-182`）
- 判定根拠: src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:175-181 は既存のフラグ値をそのまま連携投入の可否に使うだけで、価格からフラグを決め直す処理が無い。連携自体（フラグONの行）は同箇所で行われている。
- 確信度: med

### sheet-65-R076 別添資料__スマレジ連携対象商品 — 実装違い／IO／P2

- 正本: sheet-65（別添資料__スマレジ連携対象商品） HTML行 7875 付近
- 正本引用: 「ショーケース品	カード商品CSV登録で新規登録時NM以外は必ずショーケース品になる」
- 設計期待値: カード商品CSVで新規登録した状態NM以外の商品規格の部門が「ショーケース品」になり、その部門でスマレジに登録されること。
- 画像確認: 本シートに画像は0枚（別添資料のためレイアウト図なし）。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:956-975;src/Eccube/Entity/Master/MtbSection.php:36-39;app/DoctrineMigrations/Version20251125164750.php:61-76`
- 実装実態: NM以外に割り当てている部門IDは暫定値の2で、部門マスタの2は「スタンダードシングル」。「ショーケース品」という部門はマスタに存在せず、別部門でスマレジに登録される。
- 判定根拠: src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:972-974 が NM 以外に MtbSection::SHOWCASE_ID を割り当てるが、src/Eccube/Entity/Master/MtbSection.php:38 に『TODO: ショーケース品のIDが決定次第修正する』と明記され値は2のまま。部門マスタ投入（app/DoctrineMigrations/Version20251125164750.php:67-73）の id=2 は「スタンダードシングル」で、マスタ全件にショーケース品は無い。
- 確信度: high

### sheet-8-R023 カード商品CSV登録 — 実装違い／ふるまい／P2

- 正本: sheet-8（カード商品CSV登録） HTML行 1933 付近
- 正本引用: 「・新規登録の場合、セールフラグ無効(セール外)の処理を行う」
- 設計期待値: 新規登録行では、CSVの「基準価格」の値が商品規格の基準価格と販売価格の双方に反映される（セール外と同じ扱い）。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:660-691;src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:753-772;src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:695-706`
- 実装実態: 新規登録行の販売価格はCSVの「販売価格」列から算出した値で登録され、基準価格（CSVの基準価格から算出した値）は販売価格に反映されない。CSVの基準価格と販売価格が異なる値のとき、登録される販売価格が設計と食い違う。
- 判定根拠: 更新時はセールフラグ無効の分岐で販売価格を基準価格で上書きするが（src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:698-701）、新規登録（商品規格のinsert）ではその分岐を通らず、販売価格にはCSVの「販売価格」列に割引率を適用した値がそのまま入る（src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:660-691、src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:753-772）。新規規格はセールフラグ無効で作られるため、同ブロックのパターン(1-1)（本文61行目「CSVフォーマット 識別ID 25:「基準価格」の値を、商品データ「販売価格」「基準価格」に反映させる」）どおりなら基準価格が販売価格にも反映されるはずだが、そうならない。
- 確信度: med

### sheet-8-R068 カード商品CSV登録 — 未実装／ふるまい／P2

- 正本: sheet-8（カード商品CSV登録） HTML行 1979 付近
- 正本引用: 「押下後、確認モーダルを表示」
- 設計期待値: CSVファイルのアップロードボタンを押下すると確認モーダルが表示され、利用者が確認したうえで取込が始まる。
- 画像確認: sheet-8_img1.png（管理画面 カード登録CSVアップロード）を確認。レイアウト図には「CSVファイルのアップロード」ボタンのみが描かれ、モーダル自体の図はない。
- 実装参照: `src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:22-34;src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:72-77;src/Eccube/Resource/template/admin/Product/csv_product_card_bulk.twig:11-20`
- 実装実態: ボタン押下で確認を挟まずにCSV取込が実行される。確認モーダルは画面に存在しない。
- 同じ実装実態でまとまる要求: sheet-11-R066（グッズ商品CSV登録 / 実装参照 `src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:72-77;src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:22-34`）、sheet-19-R026（商品公開CSV登録 / 実装参照 `src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:72-77`）
- 判定根拠: アップロードボタンはフォームをそのまま送信し、ローディング表示に切り替えるだけで確認モーダルを表示しない（src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:22-34、src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:72-77）。カード商品CSVの画面は当テンプレートを継承しているだけで独自の確認処理も持たない（src/Eccube/Resource/template/admin/Product/csv_product_card_bulk.twig:11-20）。
- 確信度: high

### sheet-11-R069 グッズ商品CSV登録 — 未実装／IO／P3

- 正本: sheet-11（グッズ商品CSV登録） HTML行 2394 付近
- 正本引用: 「5 該当件数 - - - - 6 件数 単一選択 - - - 選択肢: 10件 50件 100件 300件 500件 1000件 2000件 10000件 12000件」
- 設計期待値: CSVインポート履歴の一覧の上に、該当する履歴の全件数を表示する。
- 画像確認: レイアウト図(sheet-11_img1.png)を確認。グッズ登録CSVのファイル選択/アップロードボタン、グッズCSVファイルフォーマット表と雛形ファイルダウンロード、CSVインポート履歴(全件数・件数プルダウン・一覧・ページャ)が描かれている。 図では『CSVインポート履歴』の見出し直下に『全件数 xxx 件』が描かれている。実装にはこの表示が無い。
- 実装参照: `src/Eccube/Resource/template/admin/Product/csv_import_history.twig:1-20;src/Eccube/Resource/template/admin/Product/csv_import_history.twig:35-60`
- 実装実態: 履歴一覧には件数プルダウン・一覧・ページャだけがあり、該当件数（全件数）を示す表示が無い。
- 同じ実装実態でまとまる要求: sheet-19-R029（商品公開CSV登録 / 実装参照 `src/Eccube/Resource/template/admin/Product/csv_import_history.twig:2-18`）
- 判定根拠: 履歴一覧のテンプレートには表題・件数プルダウン・明細表・ページャしか無く、総件数を出す記述が無い（src/Eccube/Resource/template/admin/Product/csv_import_history.twig:1-20, src/Eccube/Resource/template/admin/Product/csv_import_history.twig:35-65）。画面を組み立てる側も総件数を渡していない（src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:113-128）。引用は画面構成表の識別ID 5 と 6 の2行を続けて採った（識別ID 5 の行は項目名だけで述語が無いため、同じ表の隣接行を含めた）。指摘の対象は識別ID 5『該当件数』のみ。
- 確信度: high

### sheet-16-R030 売上分析タグ登録編集 — 実装違い／IO／P3

- 正本: sheet-16（売上分析タグ登録編集） HTML行 2930 付近
- 正本引用: 「登録または更新し、保存した売上分析タグを入力欄に読み込んだ状態で表示する」
- 設計期待値: 保存が通ったあとの画面では、いま保存した売上分析タグの名称と並び順が入力欄に入った状態で表示される。
- 画像確認: sheet-16_img1.png（「新規登録」カードに 名称・並び順 の入力欄と右上の「登録」ボタン、その下に一覧表 ID／名称／並び順／編集ボタン／削除ボタン。ID・名称はリンク表示）、sheet-16_img2.png（ページャ 1 2 3 4 5 次へ）、sheet-16_img3.png（件数プルダウン「10件」）を確認した。並び順の上限値、ソート用の部品、編集中に新規登録へ戻す操作はいずれも図に描かれていない。
- 実装参照: `src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:169-171;src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:53-61`
- 実装実態: 保存後に戻る先が一覧だけの画面で、入力欄は空の新規登録の状態になる。保存した対象を示す値は付いて回るものの、戻り先の画面はその値を読み取らないため（src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:57-61 は対象が取れないと新規として扱う）、保存した名称・並び順は入力欄に入らない。
- 判定根拠: 保存完了時の戻り先は識別子を伴わない一覧の受け口（src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:56, src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:169-171）で、src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:57 の対象はnull許容のため未指定と同じ扱いになり src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:59-61 で空の入力欄になる。保存した対象を入力欄へ読み込む経路は src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php 内に見当たらない。
- 確信度: high

### sheet-19-R038 商品公開CSV登録 — 実装違い／IO／P3

- 正本: sheet-19（商品公開CSV登録） HTML行 3198 付近
- 正本引用: 「ファイル名は product_status.csv とし、ファイルとしてダウンロードさせる。」
- 設計期待値: 雛形をダウンロードしたとき、保存されるファイルの名前が product_status.csv になる。
- 画像確認: sheet-19_img1.png にはファイル名の記載が無く、現行仕様の記述で判定。
- 実装参照: `src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:55-61`
- 実装実態: 雛形の保存名が product_status_template.csv になっている。
- 判定根拠: 雛形の応答に付ける保存名が 'product_status_template.csv' で渡されている（src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:55-61、src/Eccube/Controller/AbstractController.php:425-440）。見出し行のみ・先頭BOM・区切り文字は設定値、という他の記述は満たしている（src/Eccube/Service/CsvExportService.php:267-291）。
- 確信度: high

### sheet-19-R040 商品公開CSV登録 — 実装違い／ふるまい／P3

- 正本: sheet-19（商品公開CSV登録） HTML行 3200 付近
- 正本引用: 「ゼロ幅スペースと BOM は読む前に取り除く。」
- 設計期待値: 取込ファイルの見出しや値にゼロ幅スペースが混じっていても、混じっていない場合と同じように取り込める。
- 画像確認: sheet-19_img1.png に取込ファイルの前処理に関する記載は無く、現行仕様の記述で判定。
- 実装参照: `src/Eccube/Service/CsvImportService.php:160-207`
- 実装実態: 見出しの先頭のBOMは取り除くが、ゼロ幅スペースは取り除かない。見出しにゼロ幅スペースが混じると列が見つからない扱いになり、その行以降が取り込まれない。
- 同じ実装実態でまとまる要求: sheet-44-R067（セール用価格変更CSVアップロード / 実装参照 `src/Eccube/Service/CsvImportService.php:178-179;src/Eccube/Service/Csv/Importer/CsvImporter.php:164-176`）、sheet-48-R047（高額商品価格変更CSVアップロード / 実装参照 `src/Eccube/Service/CsvImportService.php:99-110;src/Eccube/Service/CsvImportService.php:170-182`）、sheet-50-R064（セール用高額商品価格変更CSVアップロード / 実装参照 `src/Eccube/Service/CsvImportService.php:174-180`）、sheet-52-R031（部門更新CSV登録 / 実装参照 `src/Eccube/Service/CsvImportService.php:95-113`）
- 判定根拠: 取込ファイルの読み取り側でBOM除去だけが行われ（src/Eccube/Service/CsvImportService.php:176-181）、ゼロ幅スペースを取り除く処理はどこにも無い。列名が一致しないと列不在エラーで中断する（src/Eccube/Service/Csv/Importer/Event/BaseCsvImportHandler.php:84-91）。
- 確信度: med

### sheet-21-R016 商品規格一覧 — 実装違い／IO／P3

- 正本: sheet-21（商品規格一覧） HTML行 3366 付近
- 正本引用: 「4 公開ステータス - - - - ※カスタマイズ対応、項目を追加、廃止ではない規格の情報を一覧で出力する」
- 設計期待値: 稼働中の規格一覧の1列目の見出しが「公開ステータス」と表示される。
- 画像確認: sheet-21_img1.png の一覧表1列目の見出しは「公開ステータス」と2行で描かれており、「公開状態」ではない。
- 実装参照: `src/Eccube/Resource/template/admin/Product/ProductClass/index.twig:53`
- 実装実態: 列自体は追加され値も出るが、見出しの文言が「公開状態」になっている。
- 判定根拠: 一覧の1列目の見出しに使う語が「公開状態」と定義されている（src/Eccube/Resource/template/admin/Product/ProductClass/index.twig:53、src/Eccube/Resource/locale/messages.ja.yaml:2056）。列の追加と出力対象（廃止でない規格）は満たしている。
- 確信度: high

### sheet-22-R119 商品規格登録編集 — 実装違い／ふるまい／P3

- 正本: sheet-22（商品規格登録編集） HTML行 3638 付近
- 正本引用: 「編集（規格IDあり）では、指定商品に属する当該規格を読み込み、見つからなければ見つからない（HTTP404）とする。」
- 設計期待値: 編集画面・更新処理は、URLで指定された商品に属していない商品規格を指定された場合、見つからない扱い（HTTP404）にする。
- 画像確認: sheet-22_img1.png を確認。基本情報欄は 商品ID/商品規格ID/スマレジ商品ID/スマレジ商品コード/言語/状態/状態名/商品コード/在庫数/販売制限数/在庫変動理由(取消線=除去)/販売価格/セールフラグ/基準価格/買取価格/代表画像/画像表示(×に取消線)/帯URL/高額商品コード/下代/状態別称/部門/棚番号/スマレジ連携フラグ、右カラムに 商品規格を削除・登録日/更新日・期間別販売数、最下部に「<< 商品規格一覧」リンク・公開ステータスのプルダウン・「商品規格を登録」ボタン。
- 実装参照: `src/Eccube/Controller/Admin/Product/ProductClassController.php:233-240;src/Eccube/Controller/Admin/Product/ProductClassController.php:271-282`
- 実装実態: 編集（src/Eccube/Controller/Admin/Product/ProductClassController.php:233-240）・更新（src/Eccube/Controller/Admin/Product/ProductClassController.php:271-282）とも規格IDだけで商品規格を読み込んでおり、その規格が指定商品に属するかを確かめていない。別商品の規格IDを指定しても見つからない扱いにならず編集画面が開き、更新すると当該規格の所属商品が指定商品へ付け替えられる（src/Eccube/Service/Admin/Product/ProductClassUpdateAction.php:78-79）。
- 判定根拠: 商品と規格の対応を検証する箇所を ee 内で探したが見当たらない。存在しない規格IDは404になるが、商品と規格の組み合わせ違いは404にならない。誤操作より不正なURL操作で起きるため P3。
- 確信度: med

### sheet-22-R121 商品規格登録編集 — 実装違い／ふるまい／P3

- 正本: sheet-22（商品規格登録編集） HTML行 3640 付近
- 正本引用: 「編集時かつ規格が削除可能な場合だけ、削除ボタンを表示する。」
- 設計期待値: 商品規格が1件しか無く削除できない商品では、編集画面に削除ボタンを出さない。
- 画像確認: sheet-22_img1.png を確認。基本情報欄は 商品ID/商品規格ID/スマレジ商品ID/スマレジ商品コード/言語/状態/状態名/商品コード/在庫数/販売制限数/在庫変動理由(取消線=除去)/販売価格/セールフラグ/基準価格/買取価格/代表画像/画像表示(×に取消線)/帯URL/高額商品コード/下代/状態別称/部門/棚番号/スマレジ連携フラグ、右カラムに 商品規格を削除・登録日/更新日・期間別販売数、最下部に「<< 商品規格一覧」リンク・公開ステータスのプルダウン・「商品規格を登録」ボタン。
- 実装参照: `src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:607-614;src/Eccube/Service/Admin/Product/ProductClassDeleteAction.php:39-67`
- 実装実態: 編集時であれば常に削除ボタンを表示する（src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:607-614 の条件は商品規格IDの有無だけ）。削除できるかどうかの判定が無く、削除処理側にも当該商品の規格が最後の1件かを確かめる箇所が無い（src/Eccube/Service/Admin/Product/ProductClassDeleteAction.php:39-67）。
- 同じ実装実態でまとまる要求: sheet-22-R135（商品規格登録編集 / 実装参照 `src/Eccube/Service/Admin/Product/ProductClassDeleteAction.php:39-67;src/Eccube/Controller/Admin/Product/ProductClassController.php:360-391`）
- 判定根拠: 削除可否を判定する処理を ee 内で探したが商品規格には存在しない（他エンティティには isDeletable がある）。削除ボタンの表示条件と最後の1件を残す制限は同じ「削除可否」の欠落から出るため、根本原因を同じにした。
- 確信度: med

### sheet-22-R130 商品規格登録編集 — 実装違い／ふるまい／P3

- 正本: sheet-22（商品規格登録編集） HTML行 3649 付近
- 正本引用: 「「登録が完了しました。」の成功フラッシュを設定し、同じ規格の編集画面へリダイレクトする。」
- 設計期待値: 商品規格の登録・更新が成功したとき、成功メッセージとともに当該商品規格の編集画面が表示される。
- 画像確認: sheet-22_img1.png を確認。基本情報欄は 商品ID/商品規格ID/スマレジ商品ID/スマレジ商品コード/言語/状態/状態名/商品コード/在庫数/販売制限数/在庫変動理由(取消線=除去)/販売価格/セールフラグ/基準価格/買取価格/代表画像/画像表示(×に取消線)/帯URL/高額商品コード/下代/状態別称/部門/棚番号/スマレジ連携フラグ、右カラムに 商品規格を削除・登録日/更新日・期間別販売数、最下部に「<< 商品規格一覧」リンク・公開ステータスのプルダウン・「商品規格を登録」ボタン。
- 実装参照: `src/Eccube/Controller/Admin/Product/ProductClassController.php:355-357;src/Eccube/Controller/Admin/Product/ProductClassController.php:225-227`
- 実装実態: 更新成功後は当該商品の商品規格一覧画面へ遷移する（src/Eccube/Controller/Admin/Product/ProductClassController.php:355-357）。新規登録の成功後も同じく一覧画面へ遷移する（src/Eccube/Controller/Admin/Product/ProductClassController.php:225-227）。編集画面には戻らないため、続けて同じ規格を確認・修正するには一覧から入り直す必要がある。
- 同じ実装実態でまとまる要求: sheet-22-R144（商品規格登録編集 / 実装参照 `src/Eccube/Controller/Admin/Product/ProductClassController.php:355-357;src/Eccube/Service/Admin/Product/ProductClassUpdateAction.php:100-107`）
- 判定根拠: 遷移先は src/Eccube/Controller/Admin/Product/ProductClassController.php:76-111 の商品規格一覧画面。同シートのリニューアル後の表示メッセージ表も表示条件を「規格更新が成功し編集画面へリダイレクトしたとき」としており、編集画面へ戻す前提が維持されている。業務は一覧経由で回るため P3。
- 確信度: med

### sheet-22-R141 商品規格登録編集 — 実装違い／IO／P3

- 正本: sheet-22（商品規格登録編集） HTML行 3660 付近
- 正本引用: 「編集時だけ表示し、新規登録時は表示しない。集計済みの値の読み取り表示で、この画面からは変更できない。」
- 設計期待値: 期間別の販売数は編集時だけ表示し、新規登録時は表示しない。
- 画像確認: sheet-22_img1.png を確認。基本情報欄は 商品ID/商品規格ID/スマレジ商品ID/スマレジ商品コード/言語/状態/状態名/商品コード/在庫数/販売制限数/在庫変動理由(取消線=除去)/販売価格/セールフラグ/基準価格/買取価格/代表画像/画像表示(×に取消線)/帯URL/高額商品コード/下代/状態別称/部門/棚番号/スマレジ連携フラグ、右カラムに 商品規格を削除・登録日/更新日・期間別販売数、最下部に「<< 商品規格一覧」リンク・公開ステータスのプルダウン・「商品規格を登録」ボタン。
- 実装参照: `src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:682-764;src/Eccube/Controller/Admin/Product/ProductClassController.php:144-150`
- 実装実態: 期間別販売数のカードは編集時限定の囲みの外にあり、新規登録画面でも常に出力される（src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:682-764）。新規登録時は集計対象の規格が無いため全項目が 0 で表示される（src/Eccube/Controller/Admin/Product/ProductClassController.php:144-150 と src/Eccube/Controller/Admin/Product/ProductClassController.php:741-762 が既定値0を返す）。
- 判定根拠: 読み取り表示で変更できない点は設計どおり（src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:698-761 は値の出力のみ）。差があるのは新規登録時に表示しない点だけ。表示上の差で業務は回るため P3。
- 確信度: med

### sheet-23-R068 買取・基準価格一括編集 — 実装違い／IO／P3

- 正本: sheet-23（買取・基準価格一括編集） HTML行 3780 付近
- 正本引用: 「商品検索に戻る	テキストリンク	-	-	-	商品マスター(検索結果)に遷移」
- 設計期待値: 画面左下のテキストリンクの表記は「商品検索に戻る」で、押すと商品マスター(検索結果)へ戻る。
- 画像確認: img1左下に「<< 商品検索に戻る」と明記されており、実装表記と異なることを図で確認。
- 実装参照: `src/Eccube/Resource/template/admin/Product/edit_bulk_update_buy_price.twig:356-361;src/Eccube/Resource/locale/messages.ja.yaml:1921`
- 実装実態: 遷移先は商品一覧(直前の表示ページ)で設計どおりだが、リンクの表記が「商品一覧」になっており、設計・レイアウト図の「<< 商品検索に戻る」と異なる。
- 判定根拠: テキストリンクの文言に admin.product.product_list（値=商品一覧）を用いている。
- 確信度: high

### sheet-24-R032 カテゴリ一覧 — 実装違い／IO／P3

- 正本: sheet-24（カテゴリ一覧） HTML行 3893 付近
- 正本引用: 「一覧の各行はカテゴリ名に英語名称を並べて表示し、選ぶとそのカテゴリの直下を表示した一覧へ移る。該当するカテゴリが1件も無いときは、データが無い旨だけを表示する。」
- 設計期待値: 直下にカテゴリが1件も無い親カテゴリを開いたとき、一覧領域にはデータが無い旨だけが表示される。
- 画像確認: sheet-24_img1.png を確認。図には一覧行に≡（ドラッグ用ハンドル）・↑・↓・鉛筆・×が並び、右上に「サイドメニューJSON作成」「CSVダウンロード」「CSV出力項目設定」、右側に「全カテゴリ」ツリー（各行に子件数）が描かれている。 図はカテゴリが6件ある状態で、0件時の表示は図に描かれていない。
- 実装参照: `src/Eccube/Resource/template/admin/Product/category.twig:420`
- 実装実態: 0件のときは一覧の見出し行だけが残り、データが無い旨は表示されない。
- 判定根拠: 前半（カテゴリ名と英語名称の並記、押下で直下の一覧へ移動）は src/Eccube/Resource/template/admin/Product/category.twig:429-434 で満たす。しかし src/Eccube/Resource/template/admin/Product/category.twig:420 の分岐は0件のとき何も描かず、0件を知らせる文言・分岐がテンプレートに無い。見出し行（src/Eccube/Resource/template/admin/Product/category.twig:413-419）だけが残る。文言資源にもカテゴリ一覧の0件表示に当たるものが無い（src/Eccube/Resource/locale/messages.ja.yaml:2155-2177）。
- 確信度: med

### sheet-24-R044 カテゴリ一覧 — 実装違い／IO／P3

- 正本: sheet-24（カテゴリ一覧） HTML行 3905 付近
- 正本引用: 「子カテゴリを持つカテゴリ、および商品が紐づいているカテゴリは削除できない。一覧では削除の入口を選べない状態にし、子カテゴリが存在するため削除できない旨を補足として示す。すでに削除済みのカテゴリを削除しようとした場合は、その旨を表示して一覧へ戻る。」
- 設計期待値: 子カテゴリがあるため削除できない行では、削除できない理由が画面上の補足として読み取れる。
- 画像確認: sheet-24_img1.png を確認。図には一覧行に≡（ドラッグ用ハンドル）・↑・↓・鉛筆・×が並び、右上に「サイドメニューJSON作成」「CSVダウンロード」「CSV出力項目設定」、右側に「全カテゴリ」ツリー（各行に子件数）が描かれている。 図の削除アイコンには補足の吹き出しは描かれておらず、図からは補足の有無を判定できない。
- 実装参照: `src/Eccube/Resource/template/admin/Product/category.twig:455`
- 実装実態: 削除の入口が選べなくなるだけで、添えられる説明は「削除」のみ。理由は画面に出ない。
- 判定根拠: 削除できない条件（子カテゴリあり・商品紐づきあり）で削除の入口を選べなくする点は src/Eccube/Resource/template/admin/Product/category.twig:458 で満たし、削除済みカテゴリの削除は警告を出して一覧へ戻す点も src/Eccube/Controller/Admin/Product/CategoryController.php:730-735, 762-766 で満たす。しかし選べない行に添えられる説明は src/Eccube/Resource/template/admin/Product/category.twig:455-457 の「削除」だけで（src/Eccube/Resource/locale/messages.ja.yaml:1641）、子カテゴリが存在するため削除できない旨を伝える表示がテンプレートにも文言資源にも無い。
- 確信度: med

### sheet-25-R061 カテゴリ登録 — 実装違い／IO／P3

- 正本: sheet-25（カテゴリ登録） HTML行 4054 付近
- 正本引用: 「フロント非表示フラグ 数値(0, 1) - - - フロント非表示フラグが立っていると、支店ページも含めて全て非表示」
- 設計期待値: 当該チェックボックスのラベルが「フロント非表示フラグ」と表示される
- 画像確認: レイアウト図(sheet-25_img1.png)を確認。レイアウト図のラベルは「フロント非表示フラグ」。
- 実装参照: `src/Eccube/Resource/locale/messages.ja.yaml:2166`
- 実装実態: ラベルが「フロント非表フラグ」と表示され、「示」が欠けている（フラグの効き方自体は設計どおり支店を含めて非表示になる）
- 判定根拠: 表示文言は src/Eccube/Resource/locale/messages.ja.yaml:2166 の admin.product.category_front_search_hide を src/Eccube/Form/Type/Admin/CategoryType.php:65 と src/Eccube/Resource/template/admin/Product/category.twig:352-353 で表示している。値は「フロント非表フラグ」。
- 確信度: high

### sheet-25-R073 カテゴリ登録 — 実装違い／IO／P3

- 正本: sheet-25（カテゴリ登録） HTML行 4066 付近
- 正本引用: 「サブカテゴリ名(日/英) テキストリンク - - - 当該のカテゴリ編集画面へ遷移」
- 設計期待値: サブカテゴリ名のリンクを押すと、そのカテゴリの登録内容が入った編集画面が開く
- 画像確認: レイアウト図(sheet-25_img1.png)を確認。一覧に「統率者2011 / Commander 2011」のテキストリンクとペンアイコンが並んで図示されている。
- 実装参照: `src/Eccube/Resource/template/admin/Product/category.twig:431;src/Eccube/Resource/template/admin/Product/category.twig:433;src/Eccube/Controller/Admin/Product/CategoryController.php:69-85`
- 実装実態: サブカテゴリ名(日)(英)のリンク先は当該カテゴリを親とする子カテゴリ一覧画面で、開いても当該カテゴリの値は入らず、空の子カテゴリ作成フォームが表示される（編集画面へはペンアイコンからのみ到達する）
- 判定根拠: src/Eccube/Resource/template/admin/Product/category.twig:431 と src/Eccube/Resource/template/admin/Product/category.twig:433 のリンク先は admin_product_category_show（親カテゴリ指定の子一覧）。同じ行のペンアイコン src/Eccube/Resource/template/admin/Product/category.twig:448-453 だけが編集画面 admin_product_category_edit を指す。子一覧側の画面は src/Eccube/Controller/Admin/Product/CategoryController.php:69-85 で空のフォームを組み立てる。
- 確信度: med

### sheet-25-R088 カテゴリ登録 — 実装違い／IO／P3

- 正本: sheet-25（カテゴリ登録） HTML行 4085 付近
- 正本引用: 「新規登録・編集のどちらも、入力欄と保存ボタンは対象の階層がカテゴリ階層の上限（確認値 5）未満のときだけ表示する。上限と同じ階層になるカテゴリは、編集も子カテゴリの作成も本画面から行えない。」
- 設計期待値: 上限（5）と同じ階層になるカテゴリでは入力欄と保存ボタンを表示せず、編集も子カテゴリ作成も本画面からできない
- 画像確認: レイアウト図(sheet-25_img1.png)を確認。レイアウト図は階層に応じた表示制御を描いていない（判断は本文の記述による）。
- 実装参照: `src/Eccube/Resource/template/admin/Product/category.twig:339;src/Eccube/Resource/template/admin/Product/category.twig:552;src/Eccube/Controller/Admin/Product/CategoryController.php:605-610`
- 実装実態: 階層を見ずに入力欄と保存ボタンを表示する。上限階層のカテゴリでも編集フォームが出て更新でき、上限階層のカテゴリを開くと子カテゴリ作成フォームも出るが、その状態で保存すると不正な要求として処理が中止され、入力内容が失われる
- 判定根拠: 入力欄の表示条件は src/Eccube/Resource/template/admin/Product/category.twig:339、保存ボタンは src/Eccube/Resource/template/admin/Product/category.twig:552 で、いずれも親カテゴリの有無と編集中かどうかだけで決まり階層を参照していない。階層上限の判定は保存時の src/Eccube/Controller/Admin/Product/CategoryController.php:605-610 のみ（ルート直下の新規登録を出さない点は src/Eccube/Resource/template/admin/Product/category.twig:339 で満たされている）。
- 確信度: med

### sheet-25-R095 カテゴリ登録 — 実装違い／IO／P3

- 正本: sheet-25（カテゴリ登録） HTML行 4093 付近
- 正本引用: 「編集中のカテゴリは、兄弟カテゴリの一覧で編集への入口を持たず、編集中である旨を示す。」
- 設計期待値: 編集中のカテゴリは兄弟カテゴリ一覧で編集への入口が出ず、編集中であることが分かる表示になる
- 画像確認: レイアウト図(sheet-25_img1.png)を確認。レイアウト図の一覧は各行に一様にペン・×アイコンを描いており、編集中行の区別は描かれていない。
- 実装参照: `src/Eccube/Resource/template/admin/Product/category.twig:420-468;src/Eccube/Controller/Admin/Product/CategoryController.php:615-634`
- 実装実態: 兄弟カテゴリ一覧は編集中のカテゴリも他と同じ行として描き、編集アイコンもリンクもそのまま出る。編集中である旨の表示も無い
- 判定根拠: 一覧行の描画は src/Eccube/Resource/template/admin/Product/category.twig:420-468 で、行ごとに編集中カテゴリと突き合わせる分岐が無い。表示データを組む src/Eccube/Controller/Admin/Product/CategoryController.php:615-634 でも編集対象は渡すが一覧側では使っていない。
- 確信度: med

### sheet-27-R052 タグ登録 — 実装違い／ふるまい／P3

- 正本: sheet-27（タグ登録） HTML行 4325 付近
- 正本引用: 「保存が完了したときは、保存したタグの編集画面へ遷移する。」
- 設計期待値: 保存が完了すると、保存したタグの内容が入力欄に入った編集画面へ遷移する。
- 画像確認: 画像16枚を確認。画像5(C7)=タグ登録フォーム全体（名称(日)/名称(英)/並び順/優先表示商品のみを表示/その他の設定/登録ボタン）、画像4(B38)=一覧(ID/名称(日)/名称(英)/並び順/編集)、画像1(AU36)=件数プルダウン、画像16(F46)=ページング、画像2/3/7/9/11ほかはフリーエリア(日/英)・優先表示商品・タイトル・説明の各ラベル。
- 実装参照: `src/Eccube/Controller/Admin/Product/TagController.php:173;src/Eccube/Controller/Admin/Product/TagController.php:63-71`
- 実装実態: 保存後に遷移する先はタグ登録/編集画面だが、保存したタグが編集対象として引き継がれず、入力欄が空の新規登録状態で表示される。続けて同じタグを直すには一覧から編集ボタンを押し直す必要がある。
- 判定根拠: [gate7/refute+codex] 重要度を P3 へ。事実関係は正しい。src/Eccube/Controller/Admin/Product/TagController.php:173 は redirectToRoute('admin_product_tag', ['id' => ...]) だが、同:66（path '/product/tag'、defaults id=null）は id を経路に持たないためクエリ ?id=N として生成され、遷 src/Eccube/Controller/Admin/Product/TagController.php:173 は保存したタグのIDを付けて戻しているが、遷移先の画面はIDを画面の経路から受け取る作りのため(src/Eccube/Controller/Admin/Product/TagController.php:63-67)、この形で渡したIDは編集対象として拾われない。結果として src/Eccube/Controller/Admin/Product/TagController.php:69-71 の新規登録扱いになる。
- 確信度: high

### sheet-27-R057 タグ登録 — 実装違い／ふるまい／P3

- 正本: sheet-27（タグ登録） HTML行 4330 付近
- 正本引用: 「削除は、IDの指定があり、そのIDが 8 以上で、該当するタグが存在するときだけ受け付ける。IDが 7 以下のものはあらかじめ用意された固定のタグで、削除の対象にできない。」
- 設計期待値: タグの削除は、ID 8 以上の登録済みタグに対してだけ受け付け、ID 7 以下のあらかじめ用意された固定タグは削除できない。
- 画像確認: 画像16枚を確認。画像5(C7)=タグ登録フォーム全体（名称(日)/名称(英)/並び順/優先表示商品のみを表示/その他の設定/登録ボタン）、画像4(B38)=一覧(ID/名称(日)/名称(英)/並び順/編集)、画像1(AU36)=件数プルダウン、画像16(F46)=ページング、画像2/3/7/9/11ほかはフリーエリア(日/英)・優先表示商品・タイトル・説明の各ラベル。
- 実装参照: `src/Eccube/Controller/Admin/Product/TagController.php:186-218`
- 実装実態: IDの大小を見る判定が無く、ID 7 以下の固定タグ（最新入荷アイテム等）でも、商品に紐付いてさえいなければ削除が通ってしまう。該当タグが存在しないときに受け付けないことは満たしている。
- 判定根拠: src/Eccube/Controller/Admin/Product/TagController.php:186-218 の削除処理は、商品との紐付け件数(src/Eccube/Controller/Admin/Product/TagController.php:191)だけを見て削除しており、IDが8以上かどうかを確かめる判定がどこにも無い。 重要度は、削除ボタンが画面に出ない（シート本文の処理概要でも削除ボタンは非表示と記載）ため画面操作で固定タグを消せる導線が無く、業務影響が小さいことからP3とする。
- 確信度: high

### sheet-28-R016 略称タグ登録 — 実装違い／IO／P3

- 正本: sheet-28（略称タグ登録） HTML行 4436 付近
- 正本引用: 「7	件数	単一選択	-	-	-	選択肢: 10件 50件 100件 300件 500件 1000件 2000件 10000件 12000件」
- 設計期待値: 略称タグ一覧の件数は10件・50件・100件・300件・500件・1000件・2000件・10000件・12000件から選べる。
- 画像確認: sheet-28_img2.png（レイアウト図本体）を確認。商品管理／略称タグ新規登録の見出し、CSV出力・CSV入力ボタン、新規追加カード（名称・並び順・アルファベット順ソートフラグ）、右上の登録ボタン、一覧（ID・名称・並び順・ソート・編集・削除）を確認。一覧のID・名称・並び順はいずれも青字のリンク表示、ソート列は「コレクター番号」。img1は件数の単一選択（10件）、img3はページング（1〜5・次へ）、img4は内容の無い空画像。
- 実装参照: `src/Eccube/Resource/template/admin/Product/storage_code.twig:113-119`
- 実装実態: 選べるのは10件・50件・100件・300件・500件・1000件の6通りだけで、2000件・10000件・12000件が選べない。
- 判定根拠: 一覧の件数プルダウンで選べるのは10・50・100・300・500・1000件の6通りだけで、設計が挙げる2000件・10000件・12000件が無い（src/Eccube/Resource/template/admin/Product/storage_code.twig:113-119）。選んだ値はそのまま1ページの表示件数になる（src/Eccube/Controller/Admin/Product/StorageCodeController.php:97-101）。同じ0204の他画面（例 商品一覧）では12000件まで選べるため、本画面だけ選択肢が不足している。
- 確信度: high

### sheet-28-R028 略称タグ登録 — 実装違い／IO／P3

- 正本: sheet-28（略称タグ登録） HTML行 4452 付近
- 正本引用: 「一覧の ID・名称・並び順は、いずれも当該の略称タグを入力欄へ読み込むリンクである。」
- 設計期待値: 一覧のID・名称・並び順のいずれを押しても、その行の略称タグが入力欄へ読み込まれる。
- 画像確認: sheet-28_img2.png（レイアウト図本体）を確認。商品管理／略称タグ新規登録の見出し、CSV出力・CSV入力ボタン、新規追加カード（名称・並び順・アルファベット順ソートフラグ）、右上の登録ボタン、一覧（ID・名称・並び順・ソート・編集・削除）を確認。一覧のID・名称・並び順はいずれも青字のリンク表示、ソート列は「コレクター番号」。img1は件数の単一選択（10件）、img3はページング（1〜5・次へ）、img4は内容の無い空画像。
- 実装参照: `src/Eccube/Resource/template/admin/Product/storage_code.twig:144-146`
- 実装実態: ID・名称は押すと入力欄へ読み込まれるが、並び順は文字が表示されるだけで押せない。
- 判定根拠: ID列と名称列は当該略称タグを入力欄へ読み込む画面へのリンクだが（src/Eccube/Resource/template/admin/Product/storage_code.twig:138-143）、並び順列は値をそのまま出すだけでリンクになっていない（src/Eccube/Resource/template/admin/Product/storage_code.twig:144-146）。レイアウト図でも並び順はID・名称と同じ青字のリンク表示になっている。
- 確信度: high

### sheet-28-R031 略称タグ登録 — 実装違い／ふるまい／P3

- 正本: sheet-28（略称タグ登録） HTML行 4455 付近
- 正本引用: 「指定した略称タグが存在しないときは 404 とする。」
- 設計期待値: 存在しない略称タグを指定して編集画面を開こうとしたときは、ページが見つからない扱いになる。
- 画像確認: sheet-28_img2.png（レイアウト図本体）を確認。商品管理／略称タグ新規登録の見出し、CSV出力・CSV入力ボタン、新規追加カード（名称・並び順・アルファベット順ソートフラグ）、右上の登録ボタン、一覧（ID・名称・並び順・ソート・編集・削除）を確認。一覧のID・名称・並び順はいずれも青字のリンク表示、ソート列は「コレクター番号」。img1は件数の単一選択（10件）、img3はページング（1〜5・次へ）、img4は内容の無い空画像。
- 実装参照: `src/Eccube/Controller/Admin/Product/StorageCodeController.php:68-76`
- 実装実態: 存在しないIDを指定しても画面が開き、略称タグ新規登録の空の入力欄が表示される。
- 判定根拠: 編集画面の対象引数が省略可として宣言されているため、存在しないIDを指定しても404にはならず、対象なし（新規登録）として200で画面が開く（src/Eccube/Controller/Admin/Product/StorageCodeController.php:68-76）。削除側は対象を必須で受けるため存在しないIDで404になり（src/Eccube/Controller/Admin/Product/StorageCodeController.php:174, tests/Eccube/Tests/Web/Admin/Product/StorageCodeControllerTest.php:246-253）、一覧・編集側だけ挙動が異なる。
- 確信度: high

### sheet-28-R038 略称タグ登録 — 実装違い／IO／P3

- 正本: sheet-28（略称タグ登録） HTML行 4463 付近
- 正本引用: 「保存できたときは、保存した略称タグを入力欄へ読み込んだ状態で一覧画面を再表示する。続けて新規登録するときは、新規の入力欄へ戻るボタンを押す。」
- 設計期待値: 保存が終わった直後の一覧画面には、いま保存した略称タグが入力欄へ読み込まれた状態で表示され、新規登録へ戻るボタンも出る。
- 画像確認: sheet-28_img2.png（レイアウト図本体）を確認。商品管理／略称タグ新規登録の見出し、CSV出力・CSV入力ボタン、新規追加カード（名称・並び順・アルファベット順ソートフラグ）、右上の登録ボタン、一覧（ID・名称・並び順・ソート・編集・削除）を確認。一覧のID・名称・並び順はいずれも青字のリンク表示、ソート列は「コレクター番号」。img1は件数の単一選択（10件）、img3はページング（1〜5・次へ）、img4は内容の無い空画像。
- 実装参照: `src/Eccube/Controller/Admin/Product/StorageCodeController.php:162`
- 実装実態: 保存後の一覧画面は入力欄が空の新規登録状態で表示され、新規登録へ戻るボタンも出ない。
- 同じ実装実態でまとまる要求: sheet-28-R044（略称タグ登録 / 実装参照 `src/Eccube/Controller/Admin/Product/StorageCodeController.php:160-162`）
- 判定根拠: 保存後は一覧画面へ戻すが、対象の指定が画面の受け口に届かない形で渡されるため、戻った一覧では対象が読み込まれず『略称タグ新規登録』の空の入力欄が表示される（src/Eccube/Controller/Admin/Product/StorageCodeController.php:162）。一覧画面の入口は対象未指定を既定値として受けるため、付加された指定は無視される（src/Eccube/Controller/Admin/Product/StorageCodeController.php:71-76）。結果として新規登録へ戻るボタンも現れない（src/Eccube/Resource/template/admin/Product/storage_code.twig:56-60）。
- 確信度: high

### sheet-3-R012 商品マスター(検索入力) — 実装違い／IO／P3

- 正本: sheet-3（商品マスター(検索入力)） HTML行 1199 付近
- 正本引用: 「・表示順は、棚番号昇順とする」
- 設計期待値: 商品一覧の並びが棚番号の昇順になる。
- 画像確認: sheet-3_img1.png（商品マスター(検索入力)のレイアウト図）を確認。図は検索入力画面のみで一覧の並びは描かれていないため、並び順は本文と実装で判定した。
- 実装参照: `src/Eccube/Repository/ProductRepository.php:1485-1497`
- 実装実態: 既定の並びは商品IDの降順（同1491）で、その後に言語・状態を昇順で足しているだけ。棚番号は並び順の要素に入っておらず、一覧の並びは棚番号と無関係になる。
- 判定根拠: 同ブロック（R008〜R012）は一覧表示のカスタマイズを述べており、R012はその並び順を定めた行。実装の並び順生成は src/Eccube/Repository/ProductRepository.php:1485-1497 に集約されているが、棚番号（pc.ShelfNumber）は絞り込み条件（同1479）にしか使われず並び替えには使われていない。
- 確信度: high

### sheet-3-R090 商品マスター(検索入力) — 未実装／ふるまい／P3

- 正本: sheet-3（商品マスター(検索入力)） HTML行 1283 付近
- 正本引用: 「2ページ目以降を表示するとき、該当件数が前のページまでで表示し尽くされる件数と一致する場合は、1つ前のページを表示する。」
- 設計期待値: 2ページ目以降を開いたときに該当件数が前のページまでで尽きている場合、1つ前のページの一覧が表示される。
- 画像確認: sheet-3_img1.png（商品マスター(検索入力)のレイアウト図）を確認。図は検索入力画面のみでページ送りは描かれていないため、実装で判定した。
- 実装参照: `src/Eccube/Controller/Admin/Product/ProductController.php:206-262`
- 実装実態: 指定されたページ番号をそのまま使って一覧を組み立てており、該当件数がそのページに届かない場合にページ番号を繰り下げる処理が無い。範囲外のページは既定動作（app/config/eccube/reference.php:1462 の page_out_of_range は ignore）のまま扱われ、明細が1件も無い一覧が表示される。
- 判定根拠: 商品一覧のページ処理（src/Eccube/Controller/Admin/Product/ProductController.php:206-262）にページ番号を戻す分岐が無いことを確認した。ページ番号の丸め込み設定も既定のまま。
- 確信度: med

### sheet-32-R026 部門登録 — 実装違い／IO／P3

- 正本: sheet-32（部門登録） HTML行 4771 付近
- 正本引用: 「・ボタンの位置を変更する（ECCUBE4に合わせて画面下部に表示）・編集モードの際はボタン名が「編集」に変わる」
- 設計期待値: 既存の部門を選んで編集している状態では、画面下部の保存ボタンの表示名が「編集」になる。
- 画像確認: sheet-32_img1.png（部門新規登録／部門編集のレイアウト図）を確認済み。 図の下段（部門編集）では画面下部のボタンが「編集」と描かれており、上段（部門新規登録）の「登録」と描き分けられている。
- 実装参照: `src/Eccube/Resource/template/admin/Product/section.twig:154-156;src/Eccube/Resource/locale/messages.ja.yaml:1633`
- 実装実態: 編集中かどうかに関わらず、画面下部の保存ボタンは常に「登録」と表示される（src/Eccube/Resource/template/admin/Product/section.twig:155 で admin.common.registration=登録 を固定表示）。カード見出しだけが「編集」に変わる（src/Eccube/Resource/template/admin/Product/section.twig:59）。
- 判定根拠: 編集モードは id が非nullで判定でき、見出しは切り替えているが、下部ボタンの文言は切り替えていない（src/Eccube/Resource/template/admin/Product/section.twig:154-156）。
- 確信度: high

### sheet-32-R053 部門登録 — 実装違い／ふるまい／P3

- 正本: sheet-32（部門登録） HTML行 4803 付近
- 正本引用: 「MTGBuyer表示フラグは、新規登録の初期表示ではチェックが入った状態（表示する）である。」
- 設計期待値: 部門の新規登録画面を開いた直後、MTGBuyer表示フラグはチェックが入った（表示する）状態で表示される。
- 画像確認: sheet-32_img1.png（部門新規登録／部門編集のレイアウト図）を確認済み。 図の新規登録フォームのチェックボックスは未チェックで描かれており、項目定義（識別ID7）の初期値欄も「-」のため、正本内でこの初期値を裏づける記述は現行仕様の当該行だけである。
- 実装参照: `src/Eccube/Entity/Master/MtbSection.php:52-53;src/Eccube/Form/Type/Admin/ProductDepartmentType.php:78-81;src/Eccube/Controller/Admin/Product/SectionController.php:80-83`
- 実装実態: 新規登録画面のMTGBuyer表示フラグはチェックが外れた状態で表示される。新規の部門は表示フラグに初期値を持たず（src/Eccube/Entity/Master/MtbSection.php:52-53 は既定値の代入が無い）、フォームには未設定として渡るため、チェックボックスは未チェックで描画される（src/Eccube/Form/Type/Admin/ProductDepartmentType.php:78-81）。そのまま登録すると非表示で保存される。
- 判定根拠: 新規時に生成する部門（src/Eccube/Controller/Admin/Product/SectionController.php:82）は表示フラグを設定しておらず、フォーム側でも初期値を与えていない（src/Eccube/Form/Type/Admin/ProductDepartmentType.php:78-81）。
- 確信度: med

### sheet-36-R006 棚番登録 編集 — 実装違い／IO／P3

- 正本: sheet-36（棚番登録 編集） HTML行 5115 付近
- 正本引用: 「4 並び順 - ◯ 0〜32767 - -」
- 設計期待値: 並び順は必須で、0以上32767以下の値だけを登録・更新できる。範囲を外れた値を送ったときは登録されず、入力の誤りとして知らされる。
- 画像確認: sheet-36_img1.png（棚番号一覧画面。上部に CSV出力／CSV入力、新規追加の名称・並び順欄と登録ボタン、一覧の ID／名称／並び順・編集・削除、img3 のページャ、img4 の10件セレクタを確認）
- 実装参照: `src/Eccube/Form/Type/Admin/ShelfNumberType.php:46-52`
- 実装実態: 並び順は必須と整数であることだけを検査し、上限・下限の検査が無い。32768以上や負数を入力しても登録・更新できる。
- 判定根拠: src/Eccube/Form/Type/Admin/ShelfNumberType.php:46-52 に NotBlank しか付いておらず Range 相当の検査が無い。DBの列定義（src/Eccube/Entity/DtbShelfNumber.php:37-38）も PostgreSQL では上限を強制しない。
- 確信度: med

### sheet-36-R011 棚番登録 編集 — 実装違い／ふるまい／P3

- 正本: sheet-36（棚番登録 編集） HTML行 5120 付近
- 正本引用: 「9 並び順 - - - - 押下で該当行の情報を(3)(4)に反映」
- 設計期待値: 一覧の並び順欄を押すと、その行の名称と並び順が入力欄に読み込まれ編集できる状態になる。
- 画像確認: sheet-36_img1.png のレイアウト図では一覧の ID・名称・並び順の3列がいずれもリンク色（青字）で描かれており、並び順も押下対象であることを裏づける。
- 実装参照: `src/Eccube/Resource/template/admin/Product/shelf_number.twig:134-136`
- 実装実態: 一覧の並び順欄は値をそのまま表示するだけで、押しても何も起きない。ID欄・名称欄・編集ボタンだけがリンクになっている。
- 判定根拠: src/Eccube/Resource/template/admin/Product/shelf_number.twig:134-136 は数値をそのまま出力しており、src/Eccube/Resource/template/admin/Product/shelf_number.twig:129 や src/Eccube/Resource/template/admin/Product/shelf_number.twig:132 のようなリンクになっていない。
- 確信度: high

### sheet-36-R024 棚番登録 編集 — 実装違い／ふるまい／P3

- 正本: sheet-36（棚番登録 編集） HTML行 5138 付近
- 正本引用: 「3 上記を満たす 登録完了を表示し、保存した棚番号を編集対象とした画面へ戻る」
- 設計期待値: 棚番号の登録・更新が完了した後は、保存した棚番号が編集対象として読み込まれた画面（見出しが編集、名称と並び順に保存値が入った状態）が表示される。
- 画像確認: sheet-36_img1.png（棚番号一覧画面。上部に CSV出力／CSV入力、新規追加の名称・並び順欄と登録ボタン、一覧の ID／名称／並び順・編集・削除、img3 のページャ、img4 の10件セレクタを確認）
- 実装参照: `src/Eccube/Controller/Admin/Product/ShelfNumberController.php:178-180`
- 実装実態: 「登録が完了しました。」は表示されるが、戻り先が編集対象を持たない棚番号一覧画面になり、保存した棚番号は入力欄に読み込まれない（見出しも「新規追加」のままになる）。
- 判定根拠: [gate7/refute+codex] 重要度を P3 へ。事実関係は反証できず成立する。src/Eccube/Controller/Admin/Product/ShelfNumberController.php:180 は `redirectToRoute('admin_product_shelf_number', ['id' => $ShelfNumber->getId()])` だが、同ファイル73行のルート `admin_product_shelf src/Eccube/Controller/Admin/Product/ShelfNumberController.php:180 の戻り先は src/Eccube/Controller/Admin/Product/ShelfNumberController.php:73 の一覧用URLで、パスに棚番号IDを持たないため付与したIDが画面に効かない。編集対象付きで戻るなら src/Eccube/Controller/Admin/Product/ShelfNumberController.php:72 の編集用URLでなければならない。
- 確信度: high

### sheet-37-R005 棚番号CSVフォーマット — 実装違い／IO／P3

- 正本: sheet-37（棚番号CSVフォーマット） HTML行 5208 付近
- 正本引用: 「並び順 数値(整数) 〇 0〜32767」
- 設計期待値: 棚番号登録CSVの並び順は0〜32767の整数だけを受け付け、範囲を超える値が書かれた行はエラーとして取り込まない。
- 画像確認: 本シートは画像0枚（レイアウト図なし）。項目表はシート本文のテキストで全文を確認した。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ShelfNumberMasterImportHandler.php:48-51`
- 実装実態: 並び順は「0以上の整数か」だけを検査しており上限が無いため、32767を超える値（例 99999）を書いた行もエラーにならずそのまま棚番号の並び順として登録される。
- 判定根拠: 並び順列に付く検証は数値検証だけで（src/Eccube/Service/Csv/Importer/Event/ShelfNumberMasterImportHandler.php:48-51）、その中身は0以上の整数かの判定のみ（src/Eccube/Service/Csv/Importer/Validator/NumericValidator.php:35-52、src/Eccube/Util/SqlUtil.php:73-76）。上限を見る検証は付いておらず、登録先の並び順も32ビット整数のため32767超でも保存される（src/Eccube/Entity/DtbShelfNumber.php:37-38）。設計の最大値0〜32767が入力の受け付け範囲として効いていない。
- 確信度: high

### sheet-38-R029 購入グループ管理 — 実装違い／ふるまい／P3

- 正本: sheet-38（購入グループ管理） HTML行 5297 付近
- 正本引用: 「保存後は、保存した購入グループを編集対象とした状態の同じ画面へ戻る。」
- 設計期待値: 購入グループを保存した後は、保存した購入グループが編集対象として読み込まれた状態の画面（見出しが編集、各入力欄に保存値が入った状態）が表示される。
- 画像確認: sheet-38_img1.png（購入グループ管理画面。新規追加欄に 名称(日)/名称(英)/予約商品フラグのチェックボックス/メモ、支払方法・配送方法のチェックボックス群、右上に登録ボタンと新規登録ボタン、一覧は 名称(日)/名称(英)/メモ/支払方法/配送方法/削除の6列）
- 実装参照: `src/Eccube/Controller/Admin/Product/SellGroupController.php:186-188`
- 実装実態: 検証通過時だけ保存する点、新規は作成日時を入れ更新では変えない点、更新日時と更新者を記録する点は一致する。保存後の戻り先が編集対象を持たない購入グループ管理画面で、保存した購入グループは入力欄に読み込まれず、見出しも「新規追加」に戻る。
- 判定根拠: src/Eccube/Controller/Admin/Product/SellGroupController.php:172-175 の検証と保存、src/Eccube/Controller/Admin/Product/SellGroupController.php:252-264 の日時と更新者記録は一致。戻り先は新規登録・更新とも src/Eccube/Controller/Admin/Product/SellGroupController.php:103 / src/Eccube/Controller/Admin/Product/SellGroupController.php:188 で一覧用URLとなり、src/Eccube/Controller/Admin/Product/SellGroupController.php:44-64 が新しい空の購入グループを描画する（src/Eccube/Resource/template/admin/Product/sell_group.twig:67-71 の見出しも新規側になる）。
- 確信度: med

### sheet-38-R037 購入グループ管理 — 実装違い／IO／P3

- 正本: sheet-38（購入グループ管理） HTML行 5307 付近
- 正本引用: 「一覧の支払方法欄・配送方法欄には、その購入グループに登録されている方法の名称を、カンマ区切りで1つの欄に連ねて表示する。登録が無いときは空欄とする。」
- 設計期待値: 購入グループに支払方法・配送方法が1件も登録されていない一覧行では、その欄は何も表示されない空欄になる。
- 画像確認: sheet-38_img1.png の一覧では支払方法・配送方法が全行埋まっており、未登録行の見え方は画像からは確認できない。メモ欄は未登録行が空欄で描かれている。
- 実装参照: `src/Eccube/Resource/template/admin/Product/sell_group.twig:115-128`
- 実装実態: 支払方法・配送方法の名称を1つの欄に区切り文字で連ねて表示する点は一致するが、登録が無い行は空欄ではなくダッシュ記号（—）が表示される。
- 判定根拠: src/Eccube/Resource/template/admin/Product/sell_group.twig:116-117 と src/Eccube/Resource/template/admin/Product/sell_group.twig:123-124 で名称を区切り文字で連結している。登録が無いときは src/Eccube/Resource/template/admin/Product/sell_group.twig:118-119 と src/Eccube/Resource/template/admin/Product/sell_group.twig:125-126 の分岐で「—」を出力しており、空欄にならない。
- 確信度: med

### sheet-39-R021 買取・販売価格履歴検索 — 実装違い／IO／P3

- 正本: sheet-39（買取・販売価格履歴検索） HTML行 5418 付近
- 正本引用: 「※カスタマイズ対応、選択肢追加 チェック項目: Foil、ノーマル、特殊」
- 設計期待値: Foil欄には『Foil』『ノーマル』『特殊』の3つのチェック項目が表示される。
- 画像確認: 画像1(B7 買取・販売価格履歴一覧の画面キャプチャ)で検索フォーム・検索結果一覧の全項目を確認。画像2は枠線のみで文言なし。
- 実装参照: `src/Eccube/Form/Type/Admin/SearchProductType.php:164-174;src/Eccube/Resource/locale/messages.ja.yaml:2213-2215`
- 実装実態: チェック項目は3つあるが、画面に出る文言は『なし』『通常』『特殊』で、設計の『Foil』『ノーマル』の2語が別の語に置き換わっている。
- 判定根拠: src/Eccube/Form/Type/Admin/SearchProductType.php:164-174 の選択肢ラベルは src/Eccube/Resource/locale/messages.ja.yaml:2213-2215 に対応し、それぞれ『なし』『通常』『特殊』と定義されている。画像1でも該当欄は『Foil』『ノーマル』表記。
- 確信度: med

### sheet-39-R049 買取・販売価格履歴検索 — 実装違い／ふるまい／P3

- 正本: sheet-39（買取・販売価格履歴検索） HTML行 5450 付近
- 正本引用: 「空の検索フォームだけを表示し、一覧は表示しない。初期表示を開いた時点で、保持していた検索条件・ページ番号・表示件数は破棄される。表示件数は設定の既定値で始まる。」
- 設計期待値: 買取/販売価格履歴画面を新たに開くと、前回の検索条件・ページ番号・表示件数は残らず、次の検索は既定の表示件数（10件）から始まる。
- 画像確認: 画像1(B7 買取・販売価格履歴一覧の画面キャプチャ)で検索フォーム・検索結果一覧の全項目を確認。画像2は枠線のみで文言なし。
- 実装参照: `src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:206-226;src/Eccube/Controller/Admin/SearchControllerTrait.php:154-166`
- 実装実態: 初期表示は検索フォームだけを組み立てて返すが、前回の検索条件・ページ番号・表示件数は残ったままで、続けて検索すると前回選んだ表示件数（例: 500件）のまま結果が出る。
- 判定根拠: [gate7/refute] 重要度を P3 へ。事実は正しい。src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:204-224 の indexInitialForm はフォームを組むだけでセッション（eccube.admin.product.buy_sale_price_history.search*）を一切消しておらず、src/Eccube/Contro src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:206-226 の初期表示は保持済みの検索条件・ページ番号・表示件数を消していない。src/Eccube/Controller/Admin/SearchControllerTrait.php:154-166 は保持値があればそれを優先して表示件数に使うため、既定値には戻らない。
- 確信度: high

### sheet-39-R063 買取・販売価格履歴検索 — 実装違い／IO／P3

- 正本: sheet-39（買取・販売価格履歴検索） HTML行 5464 付近
- 正本引用: 「送信が無いときは、保持している検索条件を復元して検索する。復元する検索条件も無いときは初期表示に戻る。検索後はページ番号・並び順・表示件数・検索条件を保持する。並び順の指定は保持するが、一覧の検索には反映されず、画面から検索した一覧は商品規格と登録日時の降順で並ぶ。」
- 設計期待値: 画面から検索した一覧は、同じ商品規格の履歴がまとまって並び、その中で登録日時の新しい順に並ぶ。
- 画像確認: 画像1(B7 買取・販売価格履歴一覧の画面キャプチャ)で検索フォーム・検索結果一覧の全項目を確認。画像2は枠線のみで文言なし。
- 実装参照: `src/Eccube/Repository/DtbPriceHistoryRepository.php:392;src/Eccube/Repository/DtbPriceHistoryRepository.php:44;src/Eccube/Util/SqlUtil.php:360-363`
- 実装実態: 一覧は登録日時の降順と履歴IDの降順で並ぶだけで、商品規格ごとにまとまらない。検索条件の復元・保持と、復元対象が無いときに初期表示へ戻る動きは設計どおり。
- 判定根拠: src/Eccube/Repository/DtbPriceHistoryRepository.php:392 の並びキーは登録日時と履歴IDで、商品規格が入っていない（現行の並びキーは src/Eccube/Repository/DtbPriceHistoryRepository.php:44 にコメントとして残っており商品規格が先頭）。検索条件の復元は src/Eccube/Controller/Admin/SearchControllerTrait.php:172-180、保持は src/Eccube/Controller/Admin/SearchControllerTrait.php:189-194 で設計どおり。画像1の一覧も同一商品コードがまとまって並んでいる。
- 確信度: high

### sheet-39-R067 買取・販売価格履歴検索 — 実装違い／IO／P3

- 正本: sheet-39（買取・販売価格履歴検索） HTML行 5468 付近
- 正本引用: 「CSVダウンロードの導線は、検索結果が1件以上あるときだけ画面に出る。ファイル名は「product_buy_sale_price_history_」に実行時刻（年月日時分秒）と拡張子「.csv」を連結したものとする。」
- 設計期待値: ダウンロードされるCSVのファイル名が『product_buy_sale_price_history_』＋実行時刻（年月日時分秒）＋『.csv』になる。
- 画像確認: 画像1(B7 買取・販売価格履歴一覧の画面キャプチャ)で検索フォーム・検索結果一覧の全項目を確認。画像2は枠線のみで文言なし。
- 実装参照: `src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:272-274;src/Eccube/Resource/template/admin/Product/buy_sale_price_history.twig:220-249`
- 実装実態: 保存されるファイル名は『buy_sale_price_』＋実行時刻＋『.csv』で、先頭の『product_』と『_history』が欠けている。ダウンロード導線が検索結果1件以上のときだけ出る点は設計どおり。
- 判定根拠: src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:272 でファイル名を buy_sale_price_ + YmdHis + .csv として組み立てている。導線の出し分けは src/Eccube/Resource/template/admin/Product/buy_sale_price_history.twig:220 の判定と src/Eccube/Resource/template/admin/Product/buy_sale_price_history.twig:249 のリンクで設計どおり。
- 確信度: high

### sheet-42-R056 基準価格変更CSVアップロード — 実装違い／IO／P3

- 正本: sheet-42（基準価格変更CSVアップロード） HTML行 5737 付近
- 正本引用: 「雛形は見出し行だけを持ち、データ行を含まない。ファイル名は simple_price.csv とし、先頭にバイト順マークを付ける。」
- 設計期待値: 雛形ファイルのダウンロード名が simple_price.csv になる。
- 画像確認: sheet-42_img1.png を確認。当該記述に対応する図示は無い。
- 実装参照: `src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:62-69;src/Eccube/Controller/AbstractController.php:425-440`
- 実装実態: 雛形の中身は見出し行だけで先頭にバイト順マークも付くが、ダウンロード名は product_standard_price_template.csv で simple_price.csv ではない。
- 判定根拠: src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:68 が出力ファイル名に 'product_standard_price_template.csv' を渡し、src/Eccube/Controller/AbstractController.php:437 がそのまま添付名にする。見出し行だけの出力(src/Eccube/Controller/AbstractController.php:431-434)とバイト順マーク(src/Eccube/Service/CsvExportService.php:275-277)は設計どおり。本シートに雛形ファイル名の変更を述べた記述は無い。
- 確信度: med

### sheet-44-R054 セール用価格変更CSVアップロード — 実装違い／IO／P3

- 正本: sheet-44（セール用価格変更CSVアップロード） HTML行 5952 付近
- 正本引用: 「1	ファイルを選択	ボタン	-	ボタン押下で、OS標準のファイル選択ウィンドウを表示」
- 設計期待値: CSVファイル選択のボタンに ファイルを選択 と表示されること。
- 画像確認: レイアウト図(sheet-44_img1.png)を確認。ファイルを選択ボタン・CSVファイルのアップロードボタン・セール用価格変更CSVファイルフォーマット表(商品ID/言語(ID)/販売価格/買取価格/セールフラグ/帯URL/タグ(ID))・雛形ファイルダウンロード・10件プルダウン・CSVインポート履歴(ファイル名/アップロード日時/作業者)・ページャを確認した。
- 実装参照: `src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:9-12;src/Eccube/Resource/locale/messages.ja.yaml:1751`
- 実装実態: 同じ位置のボタンに 参照 と表示される。押下でOS標準のファイル選択ウィンドウが開く挙動は設計どおり。
- 判定根拠: src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:9-12 がファイル選択ボタンの表示文字に admin.common.browse を当てており、src/Eccube/Resource/locale/messages.ja.yaml:1751 でその文言は 参照 と定義されている。レイアウト図のラベルは ファイルを選択。
- 確信度: med

### sheet-44-R066 セール用価格変更CSVアップロード — 実装違い／ふるまい／P3

- 正本: sheet-44（セール用価格変更CSVアップロード） HTML行 5968 付近
- 正本引用: 「ファイルが選ばれていない、ファイルの大きさが上限を超える、ファイルの種類がCSV・TSV・テキスト・表計算のいずれでもない、のいずれかに当たるときは取込を行わず、同じ画面を再表示する。」
- 設計期待値: CSV・TSV・テキスト・表計算のいずれでもない種類のファイルをアップロードしたとき、取込を行わずに同じ画面へ戻ること。
- 画像確認: レイアウト図(sheet-44_img1.png)を確認。画面上に該当する表示は無く、取込処理の内部仕様のため図からは判定できない。
- 実装参照: `src/Eccube/Form/Type/Admin/CsvImportType.php:48-58;src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:20`
- 実装実態: アップロードされたファイルの種類を検査していないため、CSV以外の種類のファイルでも取込処理に進む。ファイル未選択とサイズ超過は取込に進まない点は設計どおり。
- 同じ実装実態でまとまる要求: sheet-52-R022（部門更新CSV登録 / 実装参照 `src/Eccube/Form/Type/Admin/CsvImportType.php:48-58`）
- 判定根拠: [gate7/refute] 重要度を P3 へ。実装事実は正しい。src/Eccube/Form/Type/Admin/CsvImportType.php:47-56 の import_file 制約は Assert\NotBlank と Assert\File(['maxSize' => ...])（54-55行）だけで mimeTypes 指定が無く、ee 全体を grep しても CSV 取込系フォームに mimeTypes は無い（ある src/Eccube/Form/Type/Admin/CsvImportType.php:52-57 の検査は未入力とサイズ上限だけで、ファイル種類の検査が無い。src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:20 の accept 指定は画面側の候補絞り込みにすぎず、送信されたファイルの種類は検査されない。
- 確信度: high

### sheet-48-R038 高額商品価格変更CSVアップロード — 実装違い／IO／P3

- 正本: sheet-48（高額商品価格変更CSVアップロード） HTML行 6363 付近
- 正本引用: 「見出し行だけを持つCSVを出力する。ファイル名は simple_high_price.csv とする。列の説明文言は持たない。」
- 設計期待値: 雛形ファイルダウンロードで保存されるファイルの名前が simple_high_price.csv であること。
- 画像確認: レイアウト図(sheet-48_img1.png)を確認。CSVファイル選択/CSVファイルのアップロード/高額商品価格変更CSVファイルフォーマット表(商品コード 必須・販売価格を取り消し線で消して基準価格 必須)/雛形ファイルダウンロード/件数プルダウン(10件)/CSVインポート履歴(ファイル名・アップロード日時・作業者)/ページャを確認した。
- 実装参照: `src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:52-70;src/Eccube/Controller/AbstractController.php:425-440`
- 実装実態: 保存されるファイル名は simple_high_price_template.csv で、設計の名前と異なる。中身が見出し行だけで説明文言を持たない点は設計どおり。
- 判定根拠: 雛形の出力名を simple_high_price_template.csv で渡している（src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:55-59）。出力内容は列名だけを1行書き出す（src/Eccube/Controller/AbstractController.php:425-440）ため、見出し行のみ・説明文言なしは一致する。
- 確信度: high

### sheet-48-R041 高額商品価格変更CSVアップロード — 実装違い／IO／P3

- 正本: sheet-48（高額商品価格変更CSVアップロード） HTML行 6367 付近
- 正本引用: 「2	ファイルが選択されていないとき	CSVデータが無い旨のエラーを表示し、取込を開始しない」
- 設計期待値: ファイルを選ばずにCSV取込を実行したとき、画面上部にCSVデータが無い旨のエラーが表示されること。
- 画像確認: レイアウト図(sheet-48_img1.png)を確認。CSVファイル選択/CSVファイルのアップロード/高額商品価格変更CSVファイルフォーマット表(商品コード 必須・販売価格を取り消し線で消して基準価格 必須)/雛形ファイルダウンロード/件数プルダウン(10件)/CSVインポート履歴(ファイル名・アップロード日時・作業者)/ページャを確認した。
- 実装参照: `src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:133-147;src/Eccube/Form/Type/Admin/CsvImportType.php:47-58`
- 実装実態: ファイル未選択のときはファイル項目に付いた必須エラーで送信内容が妥当でないと判定され、画面上部にはフォーム全体のエラーだけを出すため、メッセージが1件も出ないまま取込画面へ戻る。CSVデータが無い旨を出す分岐はその手前で処理が戻るため到達しない。
- 判定根拠: ファイル項目に必須の制約が付いており（src/Eccube/Form/Type/Admin/CsvImportType.php:47-58）、未選択なら妥当でない側へ入る（src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:133-139）。そこで画面へ出すのはフォーム自身に付いたエラーだけで、ファイル項目に付いたエラーは拾わない。CSVデータが無い旨のメッセージ（src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:143-147、src/Eccube/Resource/locale/messages.ja.yaml:1759）はその後段にあり到達しない。取込を開始しない点は設計どおり。 ファイル項目には必須の指定が出力され（src/Eccube/Resource/template/admin/Form/bootstrap_4_horizontal_layout.html.twig:48-51）、送信フォームに検証の抑止も付いていない（src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:54）ため、通常操作ではブラウザ側で送信が止まり、この分岐に至らない。業務影響は限定的なので重要度をP3とする。
- 確信度: high

### sheet-5-R087 商品登録編集 — 実装違い／ふるまい／P3

- 正本: sheet-5（商品登録編集） HTML行 1614 付近
- 正本引用: 「サイズと重量は9桁を超える値を登録できない。入力欄が受け付ける範囲は0以上999999999以下とする。」
- 設計期待値: サイズ・重量は0以上999999999以下だけを受け付け、9桁を超える値や負の値では商品を更新せずエラーを表示する。
- 画像確認: レイアウト図(sheet-5_img1.png)を確認。
- 実装参照: `src/Eccube/Form/Type/Admin/ProductType.php:177-194;src/Eccube/Resource/template/admin/Product/product.twig:365-386;src/Eccube/Resource/template/admin/Product/product.twig:124`
- 実装実態: サイズ・重量に上限の検証が無く、入力欄に付く maxlength は数値入力欄では効かない。フォームはブラウザ検証を無効化している（novalidate）ため min の指定も効かず、10桁の値や負の値をそのまま保存できる。
- 判定根拠: 設計は0以上999999999以下という受付範囲を定めるが、実装のサイズ・重量には値域の検証が無く（src/Eccube/Form/Type/Admin/ProductType.php:177-194）、画面側も数値入力欄に maxlength を付けるだけで（src/Eccube/Resource/template/admin/Product/product.twig:365-386）、フォームは novalidate 指定（src/Eccube/Resource/template/admin/Product/product.twig:124）のため下限も効かない。
- 確信度: med

### sheet-5-R088 商品登録編集 — 実装違い／IO／P3

- 正本: sheet-5（商品登録編集） HTML行 1615 付近
- 正本引用: 「割引率と買取減額率は、未選択のとき選択肢に「割引率を選択してください」「買取減額率を選択してください」を表示する。」
- 設計期待値: 割引率・買取減額率が未選択のとき、選択欄の先頭に「割引率を選択してください」「買取減額率を選択してください」と表示される。
- 画像確認: レイアウト図(sheet-5_img1.png)を確認。レイアウト図では両欄に「単一選択」と書かれており、未選択時の文言は図からは確定できない。
- 実装参照: `src/Eccube/Form/Type/Admin/ProductType.php:195-222;src/Eccube/Resource/template/admin/Product/product.twig:387-408`
- 実装実態: どちらの選択欄も未選択時の案内文言が設定されておらず、先頭に文言の無い空の選択肢が並ぶだけになる。「割引率を選択してください」「買取減額率を選択してください」という文言は文言定義にも存在しない。
- 判定根拠: 実装の割引率・買取減額率は未選択時の表示文言を持たず（src/Eccube/Form/Type/Admin/ProductType.php:195-222）、画面もそのまま出力する（src/Eccube/Resource/template/admin/Product/product.twig:387-408）。文言定義（src/Eccube/Resource/locale/messages.ja.yaml）にも当該2文言は無い。
- 確信度: med

### sheet-5-R105 商品登録編集 — 実装違い／IO／P3

- 正本: sheet-5（商品登録編集） HTML行 1632 付近
- 正本引用: 「アップロードされたファイルが1件も無い場合は不正要求（HTTP400）とする。」
- 設計期待値: 商品画像の追加要求にファイルが1件も含まれていない場合、不正要求（HTTP400）として拒否する。
- 画像確認: レイアウト図(sheet-5_img1.png)を確認。
- 実装参照: `src/Eccube/Controller/Admin/Product/ProductController.php:396-400;src/Eccube/Controller/Admin/Product/ProductController.php:434`
- 実装実態: ファイルが1件も無い場合の判定が無い。画像の入れ物ごと欠けた要求では件数を数える時点で処理が異常終了しサーバエラーになり、空の入れ物が来た場合は本文が空のまま正常応答（200）を返す。いずれも不正要求（HTTP400）にならない。
- 判定根拠: 実装は受け取った画像の入れ物をそのまま件数判定に掛けるだけで（src/Eccube/Controller/Admin/Product/ProductController.php:396-400）、0件のときに不正要求を返す分岐が無く、そのまま応答を返す（src/Eccube/Controller/Admin/Product/ProductController.php:434）。
- 確信度: med

### sheet-52-R026 部門更新CSV登録 — 実装違い／ふるまい／P3

- 正本: sheet-52（部門更新CSV登録） HTML行 6789 付近
- 正本引用: 「削除されていない商品の規格に、商品コードが一致するものが無いとき 商品コードでデータを取得できない旨のエラーを積み、全体を中止する」
- 設計期待値: 削除されていない商品規格に一致しない商品コードの行は、商品コードでデータを取得できない旨のエラーとして取込全体を中止する。削除済みの規格しか一致しない商品コードもエラーとして扱う。
- 画像確認: レイアウト図3枚を確認。img1=部門更新CSVアップロード画面（CSVファイル選択＋『ファイルを選択』ボタン、『CSVファイルのアップロード』ボタン、部門更新CSVファイルフォーマット表（商品コード=必須／部門コード）と『雛形ファイルダウンロード』、CSVインポート履歴一覧＝ファイル名・アップロード日時・作業者）。img2=ページャ（1-5・次へ）。img3=表示件数プルダウン『10件』。なお実装は書式表で部門コードにも必須バッジを付ける（src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:215-220）点がレイアウト図と異なるが、本文に対応する記述が無いため指摘化していない。
- 実装参照: `src/Eccube/Repository/ProductClassRepository.php:2144-2153`
- 実装実態: 削除済みの規格も存在判定に含めるため、削除済みの規格しか無い商品コードでもエラーにならず、部門の更新が削除済みの規格にも及ぶ。
- 判定根拠: 商品コードの一致だけで存在ありと判定しており、削除済み（非表示）の規格を除外していない（src/Eccube/Repository/ProductClassRepository.php:2144-2153）。ee でも規格の削除は表示可否の切替で表現される（src/Eccube/Controller/Admin/Product/ProductClassController.php:420、src/Eccube/Entity/ProductClass.php:202-203）ため、削除済みの規格しか一致しない商品コードでもエラーにならず取込が続く。更新側も同じ商品コードの行を無条件に書き換える（src/Eccube/Repository/ProductClassRepository.php:2179-2188）。
- 確信度: med

### sheet-56-R008 棚番号更新CSV登録 — 実装違い／IO／P3

- 正本: sheet-56（棚番号更新CSV登録） HTML行 7048 付近
- 正本引用: 「3	棚番号更新CSVファイルフォーマット	テーブル	-	-	登録/更新に使用するCSVのファイルをーマットをテーブルで表現」
- 設計期待値: この画面のフォーマット表の見出しは「棚番号更新CSVファイルフォーマット」と表示される（画面名も「棚番号更新CSV」で統一される）。
- 画像確認: sheet-56_img2.png（見出し「商品管理 棚番号更新CSVアップロード」。カード「棚番号更新CSV」にCSVファイル選択欄＋「ファイルを選択」ボタンと「CSVファイルのアップロード」ボタン、カード「棚番号更新CSVファイルフォーマット」に 商品コード（必須）／棚番号 の表と右上の「雛形ファイルダウンロード」ボタン、カード「CSVインポート履歴」に ファイル名・アップロード日時・作業者 の表）、sheet-56_img1.png（ページャ 1 2 3 4 5 次へ）、sheet-56_img3.png（件数プルダウン「10件」）を確認した。
- 実装参照: `src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:107-108;src/Eccube/Resource/template/admin/Product/csv_product_shelf_number_update.twig:5;src/Eccube/Resource/locale/messages.ja.yaml:2041-2043`
- 実装実態: フォーマット表の見出しが「棚番号登録CSVファイルフォーマット」と出る。あわせて画面見出しが「棚番号登録CSVアップロード」、アップロード欄のカード見出しが「棚番号登録CSV」となり、いずれも「更新」ではなく「登録」の表記になっている（src/Eccube/Resource/locale/messages.ja.yaml:2041, src/Eccube/Resource/locale/messages.ja.yaml:2042, src/Eccube/Resource/locale/messages.ja.yaml:2043）。
- 判定根拠: フォーマット表そのものは src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:80-112 に描画されており、表の中身（商品コード・棚番号名称）はシート「棚番号更新CSVフォーマット」と一致する（src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:204-210, src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:217-223）。食い違うのは見出しの語で、レイアウト図（sheet-56_img2.png）は3か所とも「棚番号更新」と描いている。
- 確信度: high

### sheet-56-R020 棚番号更新CSV登録 — 実装違い／IO／P3

- 正本: sheet-56（棚番号更新CSV登録） HTML行 7064 付近
- 正本引用: 「見出し行だけを1行出力する。先頭に BOM を書き、区切り文字は設定の値（配布既定はカンマ）とする。ファイル名は product_shelf_number.csv とし、ファイルとしてダウンロードさせる。」
- 設計期待値: 雛形ファイルダウンロードで受け取るファイルの名前が product_shelf_number.csv になる。
- 画像確認: sheet-56_img2.png（見出し「商品管理 棚番号更新CSVアップロード」。カード「棚番号更新CSV」にCSVファイル選択欄＋「ファイルを選択」ボタンと「CSVファイルのアップロード」ボタン、カード「棚番号更新CSVファイルフォーマット」に 商品コード（必須）／棚番号 の表と右上の「雛形ファイルダウンロード」ボタン、カード「CSVインポート履歴」に ファイル名・アップロード日時・作業者 の表）、sheet-56_img1.png（ページャ 1 2 3 4 5 次へ）、sheet-56_img3.png（件数プルダウン「10件」）を確認した。
- 実装参照: `src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:59-63;src/Eccube/Controller/AbstractController.php:425-440`
- 実装実態: 受け取るファイルの名前が product_shelf_number_template.csv になる（src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:62 で渡す名前がそのまま添付名になる: src/Eccube/Controller/AbstractController.php:436-437）。
- 判定根拠: 見出し行だけを1行書くこと（src/Eccube/Controller/AbstractController.php:431-434）、先頭にBOMを書くこと（src/Eccube/Service/CsvExportService.php:267-279、出力の文字コード設定は app/config/eccube/packages/eccube.yaml:164）、区切り文字が設定の値（配布既定はカンマ。app/config/eccube/packages/eccube.yaml:162、src/Eccube/Service/CsvExportService.php:284-291）であること、ファイルとしてダウンロードさせること（src/Eccube/Controller/AbstractController.php:435-437）はいずれも一致する。食い違うのはファイル名だけ。
- 確信度: high

### sheet-58-R047 カテゴリ登録CSVアップロード — 実装違い／IO／P3

- 正本: sheet-58（カテゴリ登録CSVアップロード） HTML行 7238 付近
- 正本引用: 「見出し行だけを持つファイルを出力し、データ行は含めない。ファイル名は category.csv とし、文字コードと区切り文字は出力設定に従う（配布値はシフトJISとカンマ）。」
- 設計期待値: 雛形ファイルダウンロードで落ちてくるファイルの名前が category.csv であること。
- 画像確認: レイアウト図(sheet-58_img1.png)を確認。CSVファイル選択とCSVファイルのアップロードボタン、カテゴリ登録CSVファイルフォーマット表（カテゴリID／表示ランク／カテゴリ名(日)／カテゴリ名(英)／親カテゴリID／階層／フロント非表示フラグ／支店非表示フラグ／検索パラメータ／最新セット用バナー画像パス／カテゴリアイコン画像パス／対象商品数の12行。削除フラグの行は無い）と雛形ファイルダウンロード、CSVインポート履歴（ファイル名・アップロード日時・作業者、件数プルダウン、ページャ）が描かれている。
- 実装参照: `src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:64`
- 実装実態: 雛形は見出し行だけを出力し文字コード・区切り文字も出力設定に従うが、落ちてくるファイルの名前は category_registration_template.csv になっている。
- 判定根拠: 雛形の出力内容は設計どおり見出し行だけで（src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:56-63、src/Eccube/Service/CsvExportService.php:267-291）、名前だけが設計と異なる（src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:64）。設計の category.csv は旧カテゴリCSV取込側に残っている（src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1301）。
- 確信度: med

### sheet-65-R014 別添資料__スマレジ連携対象商品 — 未実装／ふるまい／P3

- 正本: sheet-65（別添資料__スマレジ連携対象商品） HTML行 7813 付近
- 正本引用: 「閾値は保守の範囲で設定変更できるようにしたい」
- 設計期待値: スマレジ連携フラグを自動でONにする金額の閾値を、プログラム改修なしに変更できること。
- 画像確認: 本シートに画像は0枚（別添資料のためレイアウト図なし）。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:941-954;src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:163`
- 実装実態: 閾値300円はカード商品CSVの自動判定（src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:949）と商品規格編集画面の警告判定（src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:163）にそれぞれ数値で直書きされており、変更する手段が無い。
- 同じ実装実態でまとまる要求: sheet-65-R082（別添資料__スマレジ連携対象商品 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:941-954;src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:163;src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:265-282`）
- 判定根拠: ee 全体を検索してもスマレジ連携の金額閾値を保持する設定項目・マスタは存在せず、300 が2か所に直書きされているだけ。
- 確信度: high

### sheet-7-R058 商品情報カスタムCSV出力 — 未実装／IO／P3

- 正本: sheet-7（商品情報カスタムCSV出力） HTML行 1812 付近
- 正本引用: 「商品情報をCSV出力することが可能」
- 設計期待値: 商品情報カスタムCSV出力の出力項目として「商品削除フラグ」を選べ、商品が削除済みかどうかを示す値が列に出力される。
- 画像確認: sheet-7には画像が無い（images/sheet-7_img*.png 不在）。正本テキストのみで判断した
- 実装参照: `app/DoctrineMigrations/Version20260804120000.php:48-155;src/Eccube/Service/ProductAllCsv.php:177-757`
- 実装実態: 選択できる出力列は106件登録されているが「商品削除フラグ」に相当する列が無く、商品・商品規格に削除状態を保持する項目も無いため、この列は出力できない。
- 判定根拠: 設計は識別ID1〜99を出力項目として定義しているが、57「商品削除フラグ」だけが実装側の列定義に存在しない。出力列の台帳(app/DoctrineMigrations/Version20260804120000.php:48-155)と列定義(src/Eccube/Service/ProductAllCsv.php:177-757)の双方に該当ラベルが無く、残る98項目はすべて対応する列がある。商品・商品規格の項目定義(src/Eccube/Entity/Product.php:1-60, src/Eccube/Entity/ProductClass.php:1-60)にも削除フラグに当たる項目が無いため値の元も無い。重要度は、欠けるのが1列で他の98列の出力・後続業務は成立するためP3とした。
- 確信度: high

### sheet-9-R108 カード商品CSV出力 — 実装違い／IO／P3

- 正本: sheet-9（カード商品CSV出力） HTML行 2193 付近
- 正本引用: 「列名は(ID)だが、出力する値は規格に設定された発送日目安の名称。未設定のときは空文字」
- 設計期待値: カード商品CSVの「発送日目安(ID)」列には、規格に設定された発送日目安の名称を出力する（未設定のときは空文字）。
- 画像確認: sheet-9 はレイアウト図0枚（images/ に sheet-9_img* は無い）。文言・列定義は本文のみで確認。
- 実装参照: `src/Eccube/Service/Csv/ProductCardCsv.php:163`
- 実装実態: 発送日目安の識別子（数値）を出力しており、名称は出力されない。
- 判定根拠: 規格ごとの列「発送日目安(ID)」の出力値が、設計の言う発送日目安の名称ではなく発送日目安の識別子になっている。現行実装（pf-eccube3 app/Plugin/HareruyaEc/Service/Csv/ProductCardCsv.php:465）はマスタの表示名を書き出していた。列自体はヘッダ定義 src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:363 に存在し、未設定時に空文字になる点は設計どおり。
- 確信度: med

## 掲載しなかった判定

- 実装実態が空欄の判定 14件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）
- 区分が「表示メッセージ」の指摘 17件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0204/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 6 | 0 | 0 | 0 | 6 |
| sheet-2 | 目次 | 71 | 0 | 0 | 0 | 71 |
| sheet-3 | 商品マスター(検索入力) | 101 | 2 | 6 | 0 | 93 |
| sheet-4 | 商品マスター(検索結果) | 77 | 0 | 0 | 0 | 77 |
| sheet-5 | 商品登録編集 | 119 | 0 | 4 | 2 | 113 |
| sheet-6 | セール用価格変更CSV出力 | 42 | 0 | 1 | 0 | 41 |
| sheet-7 | 商品情報カスタムCSV出力 | 105 | 1 | 0 | 0 | 104 |
| sheet-8 | カード商品CSV登録 | 152 | 1 | 1 | 0 | 150 |
| sheet-9 | カード商品CSV出力 | 114 | 0 | 1 | 0 | 113 |
| sheet-10 | カード商品CSVフォーマット | 60 | 0 | 0 | 0 | 60 |
| sheet-11 | グッズ商品CSV登録 | 136 | 2 | 1 | 0 | 133 |
| sheet-12 | グッズ商品CSV出力 | 93 | 0 | 0 | 0 | 93 |
| sheet-13 | グッズ商品CSVフォーマット | 83 | 0 | 3 | 0 | 80 |
| sheet-14 | 商品タグ更新CSV登録 | 68 | 0 | 0 | 0 | 68 |
| sheet-15 | 商品タグ更新CSVフォーマット | 4 | 0 | 0 | 0 | 4 |
| sheet-16 | 売上分析タグ登録編集 | 55 | 0 | 5 | 1 | 49 |
| sheet-17 | 売上分析タグ更新CSV登録 | 56 | 0 | 0 | 0 | 56 |
| sheet-18 | 売上分析タグ更新CSVフォーマット | 4 | 0 | 0 | 0 | 4 |
| sheet-19 | 商品公開CSV登録 | 71 | 2 | 4 | 0 | 65 |
| sheet-20 | 商品公開CSVフォーマット | 13 | 0 | 0 | 1 | 12 |
| sheet-21 | 商品規格一覧 | 71 | 0 | 1 | 0 | 70 |
| sheet-22 | 商品規格登録編集 | 157 | 5 | 7 | 0 | 145 |
| sheet-23 | 買取・基準価格一括編集 | 106 | 1 | 3 | 1 | 101 |
| sheet-24 | カテゴリ一覧 | 63 | 0 | 2 | 0 | 61 |
| sheet-25 | カテゴリ登録 | 113 | 0 | 4 | 0 | 109 |
| sheet-26 | カテゴリCSV出力 | 47 | 0 | 0 | 0 | 47 |
| sheet-27 | タグ登録 | 74 | 4 | 3 | 0 | 67 |
| sheet-28 | 略称タグ登録 | 58 | 1 | 7 | 0 | 50 |
| sheet-29 | 略称タグCSV出力 | 14 | 0 | 0 | 0 | 14 |
| sheet-30 | 略称タグCSVアップロード | 45 | 0 | 0 | 0 | 45 |
| sheet-31 | 略称タグCSVフォーマット | 6 | 0 | 0 | 0 | 6 |
| sheet-32 | 部門登録 | 71 | 1 | 5 | 0 | 65 |
| sheet-33 | 部門CSV出力 | 31 | 0 | 0 | 0 | 31 |
| sheet-34 | 部門登録CSVアップロード | 58 | 3 | 0 | 0 | 55 |
| sheet-35 | 部門登録CSVフォーマット | 22 | 0 | 0 | 0 | 22 |
| sheet-36 | 棚番登録 編集 | 52 | 0 | 5 | 0 | 47 |
| sheet-37 | 棚番号CSVフォーマット | 6 | 0 | 1 | 0 | 5 |
| sheet-38 | 購入グループ管理 | 50 | 0 | 4 | 0 | 46 |
| sheet-39 | 買取・販売価格履歴検索 | 75 | 0 | 6 | 0 | 69 |
| sheet-40 | 買取 販売価格履歴情報CSV出力 | 16 | 0 | 0 | 0 | 16 |
| sheet-41 | 重複商品コード確認 | 21 | 0 | 0 | 0 | 21 |
| sheet-42 | 基準価格変更CSVアップロード | 84 | 5 | 2 | 0 | 77 |
| sheet-43 | 基準価格変更CSVフォーマット | 42 | 0 | 0 | 0 | 42 |
| sheet-44 | セール用価格変更CSVアップロード | 114 | 5 | 9 | 1 | 99 |
| sheet-45 | セール用価格変更CSVフォーマット | 67 | 0 | 5 | 1 | 61 |
| sheet-46 | 低価格帯カード価格変更CSV出力 | 31 | 0 | 0 | 0 | 31 |
| sheet-47 | 低価格帯カード価格変更CSVフォーマット | 32 | 0 | 0 | 0 | 32 |
| sheet-48 | 高額商品価格変更CSVアップロード | 68 | 3 | 5 | 0 | 60 |
| sheet-49 | 高額商品価格変更CSVフォーマット | 26 | 0 | 0 | 0 | 26 |
| sheet-50 | セール用高額商品価格変更CSVアップロード | 99 | 2 | 3 | 7 | 87 |
| sheet-51 | セール用高額商品価格変更CSVフォーマット | 63 | 0 | 1 | 4 | 58 |
| sheet-52 | 部門更新CSV登録 | 38 | 0 | 3 | 0 | 35 |
| sheet-53 | 部門更新CSVフォーマット | 4 | 0 | 0 | 0 | 4 |
| sheet-54 | 略称タグ更新CSV登録 | 62 | 47 | 0 | 0 | 15 |
| sheet-55 | 略称タグ更新CSVフォーマット | 4 | 2 | 0 | 0 | 2 |
| sheet-56 | 棚番号更新CSV登録 | 55 | 0 | 2 | 0 | 53 |
| sheet-57 | 棚番号更新CSVフォーマット | 4 | 0 | 0 | 0 | 4 |
| sheet-58 | カテゴリ登録CSVアップロード | 62 | 0 | 1 | 0 | 61 |
| sheet-59 | カテゴリ登録CSVフォーマット | 37 | 0 | 0 | 1 | 36 |
| sheet-60 | 別添資料_カテゴリ子検索条件について | 68 | 0 | 0 | 0 | 68 |
| sheet-61 | 別添資料_CSVアップロードによる基準価格と販売価格の更新 | 120 | 0 | 6 | 2 | 112 |
| sheet-62 | 別添資料__スマレジ連携機能一覧 | 43 | 3 | 0 | 2 | 38 |
| sheet-63 | 別添資料__スマレジ連携__商品連携項目 | 72 | 0 | 4 | 0 | 68 |
| sheet-64 | 別添資料__スマレジ部門連携項目 | 30 | 0 | 0 | 0 | 30 |
| sheet-65 | 別添資料__スマレジ連携対象商品 | 82 | 12 | 7 | 1 | 62 |
| sheet-66 | 別添資料__スマレジ連携__呼び出しAPIについて | 45 | 7 | 0 | 2 | 36 |
| sheet-67 | 別添資料__一括更新系の処理結果について | 5 | 0 | 0 | 0 | 5 |
| sheet-68 | 別添資料__スマレジ連携__機能改修一覧 | 25 | 5 | 1 | 2 | 17 |

