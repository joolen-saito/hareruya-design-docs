# 実装乖離監査 — 0307_基本設計仕様書(フロント_イベント).html

- 正本: `excel_to_html/output/0307_基本設計仕様書(フロント_イベント).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **633要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 6 | ○ |
| 実装違い | 実装はあるが設計と違う | 42 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 8 | — |
| 設計どおり | 設計どおり実装されている | 317 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 260 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 0 | — |
| **合計** | | **633** | |

## 不具合 24件（P1 1 / P2 2 / P3 21）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 20件は重複として代表へ折り畳んだ（判定そのものは 44件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-6-R070 | 大会申込～完了 | 実装違い | ふるまい | P1 | 参加費が有料の申込は、外部決済が終わるまでは決済中の状態で作られ、決済が完了して初めて申込済みになる。 |
| sheet-3-R053 | イベント大会TOP | 実装違い | ふるまい | P2 | 店舗を指定せずにイベント大会TOPを開いたとき、前回選択した店舗（Cookieに保持された店舗）のイベントが一覧に表示される |
| sheet-3-R219 | イベント大会TOP | 実装違い | ふるまい | P2 | 月別で探すタブを開いた時点では、当日開催のイベントだけが一覧に並ぶ。 |
| sheet-3-R021 | イベント大会TOP | 実装違い | ふるまい | P3 | 同じ開催日時のイベントは、フォーマットの昇順に並んで一覧に表示される |
| sheet-3-R078 | イベント大会TOP | 未実装 | IO | P3 | 表示中のタブに応じてパンくずの階層が変わり、日別・月別では店舗名の後ろに「日別」「月別」と対象期間が加わって表示される |
| sheet-3-R091 | イベント大会TOP | 実装違い | ふるまい | P3 | バナー画像が5秒ごとに左方向へ自動で送られる |
| sheet-3-R101 | イベント大会TOP | 実装違い | ふるまい | P3 | 店舗を切り替えても、切り替え前に見ていた表示方式（イベント一覧／日別で探す／月別で探す）のままイベントが表示される |
| sheet-3-R113 | イベント大会TOP | 実装違い | IO | P3 | タグ行にはカードフォーマット、ルール適用度に続けてイベント規模（大型イベント）のタグが並び、大型イベントだけに絞り込める |
| sheet-3-R134 | イベント大会TOP | 実装違い | IO | P3 | イベント規模が「特別イベント」または「大型イベント」のイベントは、いずれも特別イベントのブロックにまとめて表示される |
| sheet-3-R159 | イベント大会TOP | 実装違い | ふるまい | P3 | イベント一覧タブで当日を含む期間を表示しているときは、前の期間へ戻すボタンを画面に出さない（過去へ戻せない）。 |
| sheet-3-R207 | イベント大会TOP | 実装違い | ふるまい | P3 | 前送りボタンは、いま出ている10日間より前の10日間のイベントリストに切り替える。 |
| sheet-4-R046 | 大会詳細検索 | 実装違い | IO | P3 | 検索条件チップには「平日」と表示する |
| sheet-4-R053 | 大会詳細検索 | 実装違い | IO | P3 | モーダルのキーワード入力欄のラベルに「キーワード検索」と表示する |
| sheet-4-R086 | 大会詳細検索 | 実装違い | IO | P3 | 開催場所の選択肢に会場を全件表示する |
| sheet-4-R089 | 大会詳細検索 | 実装違い | IO | P3 | 現在のページ番号を挟んで前後4ページ分までのページ番号を表示する |
| sheet-4-R091 | 大会詳細検索 | 実装違い | IO | P3 | 検索結果の開催日時は年月日と時までを表示する |
| sheet-4-R094 | 大会詳細検索 | 実装違い | IO | P3 | 条件が指定されているときは表題と説明文の両方をその条件から組み立て、条件が無いときはどちらも差し替えない |
| sheet-5-R020 | 大会詳細 | 実装違い | IO | P3 | パンくずリストの最後の階層に、そのイベントの開催日付が表示される。 |
| sheet-5-R023 | 大会詳細 | 実装違い | ふるまい | P3 | パンくずの店舗名・フォーマット・開催日付を押すと、その内容で絞り込まれたイベント一覧が表示される。 |
| sheet-5-R027 | 大会詳細 | 実装違い | IO | P3 | イベントに設定されたルール適用度に応じたアイコンと、その適応度名が表示される。 |
| sheet-5-R108 | 大会詳細 | 実装違い | IO | P3 | 日本語表示の開催日時・受付時間は「2025年3月20日 09時00分」のように年月日と時分を日本語の単位付きで表示される。英語表示では午前・午後の別を伴う日時表記と、桁区切りに JPY を付けた参加費 |
| sheet-5-R110 | 大会詳細 | 未実装 | IO | P3 | 申込ボタン領域が出ている状態で、そのイベント詳細のデッキを既に登録している会員には、ボタンの文言が「デッキ編集」で表示される。 |
| sheet-6-R009 | 大会申込～完了 | 実装違い | ふるまい | P3 | 別日程の同イベントがあるときは、選択済みイベントのチェックを外して申込対象から除けること。すべて未選択のときだけ次の画面へ進めない。別日程が無いときはチェックを外せない。 |
| sheet-6-R021 | 大会申込～完了 | 未実装 | IO | P3 | 申込同意にチェックが無い状態で支払いへ進むを押したとき、次の画面へ進まず、同意が必要であることを知らせるエラー文言が画面に表示される。 |

### sheet-6-R070 大会申込～完了 — 実装違い／ふるまい／P1

- 正本: sheet-6（大会申込～完了） HTML行 2416 付近
- 正本引用: 「無料はエントリー済み、有料は決済中で作成する。決済完了で確定、キャンセルで取消側へ」
- 設計期待値: 参加費が有料の申込は、外部決済が終わるまでは決済中の状態で作られ、決済が完了して初めて申込済みになる。
- 実装参照: `src/Eccube/Service/Front/Event/EventEntryRegisterAction.php:54-57; src/Eccube/Service/Front/Event/EventEntryRegisterAction.php:71-82; src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:88-127`
- 実装実態: 申込は無料・有料の区別なく申込済み（MtbEntryStatus::ENTERED）で作成される（EventEntryRegisterAction.php:54-57,71-82）。決済中で作成される経路が無いため、決済前の申込が定員に数えられ、決済中の申込を照会して確定する処理（PaymentStatusCheckAction.php:88-127）も対象0件で空振りする。
- 同じ実装実態でまとまる要求: sheet-6-R082（大会申込～完了 / 実装参照 `src/Eccube/Service/Front/Event/EventEntryRegisterAction.php:54-57; src/Eccube/Service/Front/Event/EventEntryCancelAction.php:47-56; src/Eccube/Controller/Front/Event/EventEntryController.php:255-276`）、sheet-6-R084（大会申込～完了 / 実装参照 `src/Eccube/Controller/Front/Event/EventEntryController.php:255-276; src/Eccube/Service/Front/Event/EventEntryRegisterAction.php:54-57`）、sheet-6-R085（大会申込～完了 / 実装参照 `src/Eccube/Service/Front/Event/EventEntryCancelAction.php:41-58; src/Eccube/Service/Front/Event/EventEntryRegisterAction.php:54-57`）、sheet-6-R101（大会申込～完了 / 実装参照 `src/Eccube/Service/Front/Event/EventEntryRegisterAction.php:54-57; src/Eccube/Controller/Front/Event/EventEntryController.php:255-276; src/Eccube/Service/Front/Event/EventEntryCancelAction.php:47-56`）
- 判定根拠: EventEntryRegisterAction.php:54 が ENTERED 固定で、リポジトリ全体を検索しても PROCESSING_PAYMENT を設定する箇所は無い（設定側は EventEntryCancelAction.php:49 の判定と PaymentStatusCheckAction の照会条件だけ）。
- 確信度: high

### sheet-3-R053 イベント大会TOP — 実装違い／ふるまい／P2

- 正本: sheet-3（イベント大会TOP） HTML行 1098 付近
- 正本引用: 「・Cookie等を加味して初期表示店舗を取得して表示させる(現行踏襲)」
- 設計期待値: 店舗を指定せずにイベント大会TOPを開いたとき、前回選択した店舗（Cookieに保持された店舗）のイベントが一覧に表示される
- 画像確認: img1/img15の店舗セレクトと一覧が同一店舗であることを前提とした図。実装ではCookie店舗と一覧の店舗が食い違う
- 実装参照: `html/template/default/assets/hareruya/js/hareruya-event.js:1; src/Eccube/Resource/template/default/Event/index.twig:191; src/Eccube/Controller/Front/EventTopController.php:88-101; src/Eccube/Controller/App/EventScheduleController.php:114-127`
- 実装実態: 画面枠（パンくず・店舗セレクト）はCookieの店舗で描画される（src/Eccube/Controller/Front/EventTopController.php:88-101、src/Eccube/Resource/template/default/Event/index.twig:191 が data-shop-id にその店舗IDを出力）が、イベント一覧のデータ取得はURLの店舗指定のみを見て、未指定なら常に店舗ID=1を送るため、Cookieの店舗と違うイベントが一覧に出る
- 同じ実装実態でまとまる要求: sheet-3-R057（イベント大会TOP / 実装参照 `html/template/default/assets/hareruya/js/hareruya-event.js:1; src/Eccube/Resource/template/default/Event/index.twig:191; src/Eccube/Controller/App/EventScheduleController.php:114-127`）
- 判定根拠: html/template/default/assets/hareruya/js/hareruya-event.js:1 の店舗ID取得はURLの検索文字列から shop を読むだけで、見つからない場合は 1 を返す。src/Eccube/Resource/template/default/Event/index.twig:191 の data-shop-id は参照されていない。取得先(src/Eccube/Controller/App/EventScheduleController.php:114-127)はCookieを見る実装だが、常に shop が明示送信されるためCookieが効かない
- 確信度: med

### sheet-3-R219 イベント大会TOP — 実装違い／ふるまい／P2

- 正本: sheet-3（イベント大会TOP） HTML行 1344 付近
- 正本引用: 「日付選択(4-23)は、現在日とする 現在日に開催しているイベントの一覧を表示」
- 設計期待値: 月別で探すタブを開いた時点では、当日開催のイベントだけが一覧に並ぶ。
- 画像確認: img24(月別カレンダー)は年月見出し・曜日行・過去日と定休日のグレー表示・大型イベントアイコンを描くが、選択済み日付(黒枠)は描かれていない。
- 実装参照: `html/template/default/assets/hareruya/js/hareruya-event.js:1; src/Eccube/Resource/template/default/Event/index.twig:241`
- 実装実態: 初期表示は当月のイベントを全件並べる（html/template/default/assets/hareruya/js/hareruya-event.js:1 の月別カレンダーの init が renderAllEvents を呼び、当日での絞り込みをしない）。当日開催分だけになるのは日付を選んだ後。
- 同じ実装実態でまとまる要求: sheet-3-R218（イベント大会TOP / 実装参照 `html/template/default/assets/hareruya/js/hareruya-event.js:1; src/Eccube/Resource/template/default/Event/index.twig:218-242`）
- 判定根拠: 初期表示の一覧の中身が当日分に絞られておらず、当月全体になる。R218 と同じ「当日が初期選択されない」ことに起因。設計図 img24 は一覧部分を含まないため図では確認できない。
- 確信度: med

### sheet-3-R021 イベント大会TOP — 実装違い／ふるまい／P3

- 正本: sheet-3（イベント大会TOP） HTML行 1066 付近
- 正本引用: 「・開催日時昇順、フォーマット昇順にイベントを表示する」
- 設計期待値: 同じ開催日時のイベントは、フォーマットの昇順に並んで一覧に表示される
- 画像確認: img15(PC一覧)でカードの並びを確認。同日開催の複数イベントの並びを決める第2キーは図からは読み取れない
- 実装参照: `src/Eccube/Repository/DtbEventRepository.php:291-310; html/template/default/assets/hareruya/js/hareruya-event.js:1`
- 実装実態: 一覧の並びは開催日時の昇順のあとイベントIDの昇順で決まる（src/Eccube/Repository/DtbEventRepository.php:307-308 の並び替え指定）。html/template/default/assets/hareruya/js/hareruya-event.js:1 側にもフォーマットでの並び替えは無い
- 同じ実装実態でまとまる要求: sheet-3-R050（イベント大会TOP）
- 判定根拠: JSONを返す取得処理の並び順は開催日時→イベントIDで、フロント側(html/template/default/assets/hareruya/js/hareruya-event.js:1)は受け取った順にカードを描画するだけでフォーマット順の並び替えを一切行わない
- 確信度: med

### sheet-3-R078 イベント大会TOP — 未実装／IO／P3

- 正本: sheet-3（イベント大会TOP） HTML行 1132 付近
- 正本引用: 「選択している店舗とタブに合わせて以下のように表示」
- 設計期待値: 表示中のタブに応じてパンくずの階層が変わり、日別・月別では店舗名の後ろに「日別」「月別」と対象期間が加わって表示される
- 画像確認: img1/img6のレイアウト図はパンくず3〜4階層（「パンくず > パンくずが入ります」）で描かれ、タブ別の階層追加は図では判別できない
- 実装参照: `src/Eccube/Resource/template/default/Event/index.twig:33-55; html/template/default/assets/hareruya/js/hareruya-event.js:1`
- 実装実態: パンくずは「ホーム > イベントTOP > 店舗名」の3階層で固定描画され（src/Eccube/Resource/template/default/Event/index.twig:33-55）、タブ切替でパンくずを書き換える処理は html/template/default/assets/hareruya/js/hareruya-event.js:1 にも無い
- 同じ実装実態でまとまる要求: sheet-3-R080（イベント大会TOP）、sheet-3-R081（イベント大会TOP）
- 判定根拠: src/Eccube/Resource/template/default/Event/index.twig:33-55 のパンくずはタブに依存しない静的な3件。バンドル(html/template/default/assets/hareruya/js/hareruya-event.js:1)にパンくず要素を操作する処理は存在しない
- 確信度: med

### sheet-3-R091 イベント大会TOP — 実装違い／ふるまい／P3

- 正本: sheet-3（イベント大会TOP） HTML行 1146 付近
- 正本引用: 「自動スクロールで5秒毎に左方向にスクロール
バナー画像をクリックすると、バナー設定で設定されているURLに遷移する」
- 設計期待値: バナー画像が5秒ごとに左方向へ自動で送られる
- 画像確認: img1/img6のバナー図。間隔は図では判別できない
- 実装参照: `src/Eccube/Resource/template/default/Event/index.twig:345-370`
- 実装実態: 自動送りの間隔が4秒（4000ミリ秒）で設定されている
- 同じ実装実態でまとまる要求: sheet-3-R085（イベント大会TOP）
- 判定根拠: sheet-3-R085 と同一の実装欠陥（自動送り間隔が設計の5秒でなく4秒）
- 確信度: high

### sheet-3-R101 イベント大会TOP — 実装違い／ふるまい／P3

- 正本: sheet-3（イベント大会TOP） HTML行 1159 付近
- 正本引用: 「下記のような引数でGETで遷移させる
/ja/events/?shop=19
modeの引数は現在のページの値を引き継ぐ」
- 設計期待値: 店舗を切り替えても、切り替え前に見ていた表示方式（イベント一覧／日別で探す／月別で探す）のままイベントが表示される
- 画像確認: img10/img11の店舗選択図。タブ引継ぎは図では判別できない
- 実装参照: `src/Eccube/Resource/template/default/Event/index.twig:304-309; html/template/default/assets/hareruya/js/hareruya-event.js:1`
- 実装実態: 店舗切替時の移動先URLには店舗IDだけが付き、表示方式は引き継がれない（src/Eccube/Resource/template/default/Event/index.twig:307）。さらに店舗が変わるとタブの保持状態が破棄されるため、常にイベント一覧タブに戻る（html/template/default/assets/hareruya/js/hareruya-event.js:1 の店舗変更検知でタブ状態を消去）
- 判定根拠: src/Eccube/Resource/template/default/Event/index.twig:304-309 は shop のみを付与。html/template/default/assets/hareruya/js/hareruya-event.js:1 は店舗IDが前回と異なると保存済みタブ状態を全消去するため、日別・月別を見ていても店舗切替後はイベント一覧が開く
- 確信度: med

### sheet-3-R113 イベント大会TOP — 実装違い／IO／P3

- 正本: sheet-3（イベント大会TOP） HTML行 1178 付近
- 正本引用: 「タグ(3-1)をカードフォーマット,ルール適用度,イベント規模(大型イベントのみ)の順で表示」
- 設計期待値: タグ行にはカードフォーマット、ルール適用度に続けてイベント規模（大型イベント）のタグが並び、大型イベントだけに絞り込める
- 画像確認: img10(SPタグ行)にもフォーマット8＋ルール4＋詳細検索しか描かれていないが、平日・休日と同様に月別のみ表示の可能性があるため本文の記述で判定
- 実装参照: `src/Eccube/Resource/template/default/Event/index.twig:119-188`
- 実装実態: タグ行はカードフォーマット8種（src/Eccube/Resource/template/default/Event/index.twig:122-155）とルール適用度4種＋月別専用の平日・休日（src/Eccube/Resource/template/default/Event/index.twig:156-181）だけで、イベント規模（大型イベント）のタグが無く、大型イベントだけの絞り込みができない
- 判定根拠: src/Eccube/Resource/template/default/Event/index.twig:119-188 のタグ要素を全数確認。value は format 8種と rule（beginner/casual/competitive/reservation/weekday/holiday）のみで、イベント規模に相当するタグは存在しない。絞り込み処理(html/template/default/assets/hareruya/js/hareruya-event.js:1)にも規模条件は無い
- 確信度: med

### sheet-3-R134 イベント大会TOP — 実装違い／IO／P3

- 正本: sheet-3（イベント大会TOP） HTML行 1237 付近
- 正本引用: 「下記条件で特別イベント(4-5),おすすめイベント(4-6)を抽出し、該当箇所に表示する。該当するイベントが0件の場合、トルツメとする
特別イベント　イベント規模が「特別イベント」または「大型イベント」」
- 設計期待値: イベント規模が「特別イベント」または「大型イベント」のイベントは、いずれも特別イベントのブロックにまとめて表示される
- 画像確認: img11/img12/img15のレイアウト図では見出しは「特別イベント」「おすすめイベント」「デイリーイベント」の3つで、大型イベントは特別イベント枠の中にタグ付きで並んでいる（大型イベント見出しは図に無い）
- 実装参照: `src/Eccube/Service/Front/Event/EventScheduleJsonBuilder.php:35-43; html/template/default/assets/hareruya/js/hareruya-event.js:1`
- 実装実態: 大型イベントは「大型イベント」という独立した見出しのセクションに分けて描画され、特別イベントのブロックにはイベント規模が「特別イベント」のものだけが入る（src/Eccube/Service/Front/Event/EventScheduleJsonBuilder.php:38-43 が大型/特別を別区分に写し、html/template/default/assets/hareruya/js/hareruya-event.js:1 が large/special を別セクションとして生成）
- 判定根拠: html/template/default/assets/hareruya/js/hareruya-event.js:1 は large・special・recommend・regular の4セクションを別見出しで連結する。src/Eccube/Service/Front/Event/EventScheduleJsonBuilder.php:38-43 の対応表も大型と特別を別の区分として渡している
- 確信度: high

### sheet-3-R159 イベント大会TOP — 実装違い／ふるまい／P3

- 正本: sheet-3（イベント大会TOP） HTML行 1262 付近
- 正本引用: 「・現在表示している表示期間が現在日を含む場合は、前14日選択(4-2)を非表示にする」
- 設計期待値: イベント一覧タブで当日を含む期間を表示しているときは、前の期間へ戻すボタンを画面に出さない（過去へ戻せない）。
- 画像確認: img15(PC イベント一覧)は特別/おすすめが開催時間展開・デイリーが折りたたみ、前送りの矢印は非表示。
- 実装参照: `html/template/default/assets/hareruya/js/hareruya-event.js:1; src/Eccube/Resource/template/default/Event/index.twig:201`
- 実装実態: 前送りボタンは表示期間が当日を含む初期状態でも押せる状態で表示され、押すと当日より前の14日間へ戻る。非表示になるのは2期間（28日）戻したときだけ（html/template/default/assets/hareruya/js/hareruya-event.js:1 の updateNavigationButtons は prev.disabled = 期間インデックス<=-2 のみ、CSS は :disabled のとき文字色を白にして見えなくする: html/template/default/assets/hareruya/css/hareruya-event.css）。
- 同じ実装実態でまとまる要求: sheet-3-R205（イベント大会TOP / 実装参照 `html/template/default/assets/hareruya/js/hareruya-event.js:1; src/Eccube/Resource/template/default/Event/index.twig:211`）
- 判定根拠: [gate7/refute] 重要度を P3 へ。事実は確認できた。引用はsheet-3.txt:260に逐語で実在し、実装は html/template/default/assets/hareruya/js/hareruya-event.js:1（バンドル内オフセット67661）の updateNavigationButtons が prev.disabled = currentPeriodIndex<=-2 のみで、当日を含む期間(index 初期表示（当日を含む期間）で前送りボタンが押せてしまい、設計が禁じている過去期間の表示ができる。img15 でも初期表示に前送り矢印は描かれていない。
- 確信度: high

### sheet-3-R207 イベント大会TOP — 実装違い／ふるまい／P3

- 正本: sheet-3（イベント大会TOP） HTML行 1321 付近
- 正本引用: 「4-16 前10日間取得 ボタン - - - 現在表示している10日間より前のイベントリストを取得する」
- 設計期待値: 前送りボタンは、いま出ている10日間より前の10日間のイベントリストに切り替える。
- 画像確認: img19/img22(日別で探す)は日付ボタンに黒枠選択・0件日グレー・大型イベントのトロフィーアイコン、初期表示に前送り矢印なし。
- 実装参照: `html/template/default/assets/hareruya/js/hareruya-event.js:1; src/Eccube/Resource/template/default/Event/index.twig:211`
- 実装実態: 前送りボタンは14日単位で期間を戻す（html/template/default/assets/hareruya/js/hareruya-event.js:1 の changePeriod(-1) が期間インデックスを1減らし、getDateRangeForPeriod が14日ぶんずらす）。
- 同じ実装実態でまとまる要求: sheet-3-R210（イベント大会TOP / 実装参照 `html/template/default/assets/hareruya/js/hareruya-event.js:1; src/Eccube/Resource/template/default/Event/index.twig:213`）、sheet-3-R193（イベント大会TOP / 実装参照 `html/template/default/assets/hareruya/js/hareruya-event.js:1; src/Eccube/Resource/template/default/Event/index.twig:210-214`）
- 判定根拠: 送り幅が設計の10日ではなく14日。日別タブの日付ボタン本数の相違と同じ原因。
- 確信度: high

### sheet-4-R046 大会詳細検索 — 実装違い／IO／P3

- 正本: sheet-4（大会詳細検索） HTML行 1749 付近
- 正本引用: 「※一部、長い文言については省略表記で表示する 平日　平日のイベントを表示する」
- 設計期待値: 検索条件チップには「平日」と表示する
- 画像確認: sheet-4_img2.png（PC）・sheet-4_img3.png（SP）を確認。見出し「イベント絞り込み結果」、右上に詳細検索ボタン、条件チップ（スタンダード×/カジュアル対戦×/平日×等）、「検索結果: 1,000件」、ページング 1 2 3 4 5 … 17 >、カードは フォーマットラベル＋タグ＋イベント名＋「2025年08月24日 18時　甲府店」。 チップ表記は「平日 ×」「休日 ×」で、「のみ」「含む」は付いていない。
- 実装参照: `src/Eccube/Resource/locale/messages.ja.yaml:6632; src/Eccube/Service/Front/Event/EventSearchChipBuilder.php:78-86`
- 実装実態: チップには「平日のみ」と表示される（src/Eccube/Resource/locale/messages.ja.yaml:6632）
- 同じ実装実態でまとまる要求: sheet-4-R047（大会詳細検索 / 実装参照 `src/Eccube/Resource/locale/messages.ja.yaml:6633; src/Eccube/Service/Front/Event/EventSearchChipBuilder.php:78-86`）、sheet-4-R048（大会詳細検索 / 実装参照 `src/Eccube/Resource/locale/messages.ja.yaml:6634; src/Eccube/Service/Front/Event/EventSearchChipBuilder.php:78-86`）
- 判定根拠: 設計は詳細条件のチップ表記を「平日」と定めている（同ブロックの「※一部、長い文言については省略表記で表示する」の直後に列挙）。sheet-4_img2/img3 のチップも「平日」「休日」であり、実装の「平日のみ」とは表記が異なる。
- 確信度: high

### sheet-4-R053 大会詳細検索 — 実装違い／IO／P3

- 正本: sheet-4（大会詳細検索） HTML行 1757 付近
- 正本引用: 「1-1 キーワード検索 半角・全角 - - - イベントをキーワード検索する」
- 設計期待値: モーダルのキーワード入力欄のラベルに「キーワード検索」と表示する
- 画像確認: sheet-4_img1.png（詳細検索モーダル）を確認。行ラベルは キーワード検索/開催日時/カテゴリー/フォーマット/開催場所/詳細、下部ボタンは リセット・検索。詳細は平日・休日がチェック済み、過去・大型・参加無料が未チェック。 1-1 の行ラベルは「キーワード検索」。
- 実装参照: `src/Eccube/Resource/locale/messages.ja.yaml:6613; src/Eccube/Resource/template/default/Block/event_detailed_search_modal.twig:25`
- 実装実態: ラベルは「キーワード」（src/Eccube/Resource/locale/messages.ja.yaml:6613 front.event.search.term.label）
- 同じ実装実態でまとまる要求: sheet-4-R056（大会詳細検索 / 実装参照 `src/Eccube/Resource/locale/messages.ja.yaml:6620; src/Eccube/Resource/template/default/Block/event_detailed_search_modal.twig:70`）、sheet-4-R057（大会詳細検索 / 実装参照 `src/Eccube/Resource/locale/messages.ja.yaml:6624; src/Eccube/Resource/template/default/Block/event_detailed_search_modal.twig:86`）、sheet-4-R066（大会詳細検索 / 実装参照 `src/Eccube/Resource/locale/messages.ja.yaml:6611; src/Eccube/Resource/template/default/Block/event_detailed_search_modal.twig:135`）
- 判定根拠: 部品一覧の 1-1 のラベルは「キーワード検索」で、sheet-4_img1 の行ラベルも「キーワード検索」。実装のラベルは「キーワード」で、末尾の「検索」が落ちている。キーワード検索そのもののふるまい（イベントのキーワード検索）は実装済み（src/Eccube/Repository/DtbEventDetailRepository.php:499-521）。
- 確信度: med

### sheet-4-R086 大会詳細検索 — 実装違い／IO／P3

- 正本: sheet-4（大会詳細検索） HTML行 1794 付近
- 正本引用: 「フォーマットの選択肢は表示順に並べる。開催場所の選択肢は会場を全件表示する。」
- 設計期待値: 開催場所の選択肢に会場を全件表示する
- 画像確認: sheet-4_img1.png（詳細検索モーダル）を確認。行ラベルは キーワード検索/開催日時/カテゴリー/フォーマット/開催場所/詳細、下部ボタンは リセット・検索。詳細は平日・休日がチェック済み、過去・大型・参加無料が未チェック。 開催場所には 外部会場 を含む多数の店舗が並ぶ。閉店店舗の有無は図から判断できない。
- 実装参照: `src/Eccube/Repository/BaseInfoRepository.php:186-203; src/Eccube/Controller/Block/EventDetailedSearchModalController.php:54`
- 実装実態: 開店中の店舗だけが選択肢になる（src/Eccube/Controller/Block/EventDetailedSearchModalController.php:54）
- 判定根拠: 設計は開催場所の選択肢を会場の全件とする。実装は開店中の店舗だけを選択肢にしており（src/Eccube/Controller/Block/EventDetailedSearchModalController.php:54、src/Eccube/Repository/BaseInfoRepository.php:186-203 で開店フラグ絞り込み）、閉店した会場で開催された過去イベントを開催場所で絞り込めない。フォーマット側の並びは並び順の列を持たないマスタのため id 順で、設計との差は認められない。
- 確信度: med

### sheet-4-R089 大会詳細検索 — 実装違い／IO／P3

- 正本: sheet-4（大会詳細検索） HTML行 1797 付近
- 正本引用: 「ページ送りは、現在のページ番号を挟んで前後4ページ分までのページ番号と、先頭・前・次・末尾への移動を表示する。表示できないページ番号がさらに続くときは省略記号を出す。移動先は現在の検索条件を引き継ぐ。」
- 設計期待値: 現在のページ番号を挟んで前後4ページ分までのページ番号を表示する
- 画像確認: sheet-4_img2.png（PC）・sheet-4_img3.png（SP）を確認。見出し「イベント絞り込み結果」、右上に詳細検索ボタン、条件チップ（スタンダード×/カジュアル対戦×/平日×等）、「検索結果: 1,000件」、ページング 1 2 3 4 5 … 17 >、カードは フォーマットラベル＋タグ＋イベント名＋「2025年08月24日 18時　甲府店」。 PC・SPともページ番号は 1 2 3 4 5 … 17 の並び。
- 実装参照: `src/Eccube/Resource/template/default/Event/_search_pagination.twig:13-14; src/Eccube/Resource/template/default/Event/list.twig:83`
- 実装実態: 前後2ページ分までしか表示しない（src/Eccube/Resource/template/default/Event/_search_pagination.twig:13-14）
- 判定根拠: 設計は現在ページの前後4ページ分までのページ番号を出すとしており、sheet-4_img2 のページングも1ページ目で「1 2 3 4 5 … 17」と5個並ぶ。実装は前後2ページ分しか出さないため、1ページ目では「1 2 3 … 17」となる（src/Eccube/Resource/template/default/Event/_search_pagination.twig:13-14）。先頭・前・次・末尾への移動と省略記号、条件の引き継ぎは実装済み（src/Eccube/Resource/template/default/Event/_search_pagination.twig:20-64、src/Eccube/Resource/template/default/Event/_search_pagination.twig:11）。
- 確信度: high

### sheet-4-R091 大会詳細検索 — 実装違い／IO／P3

- 正本: sheet-4（大会詳細検索） HTML行 1799 付近
- 正本引用: 「件数が1件以上のときは該当ページのイベント詳細を一覧に表示する。開催日時は年月日と時までを表示する。フォーマットは、1件だけ設定されているときはその名称を表示し、それ以外のときは「混合フォーマット」と表示する。」
- 設計期待値: 検索結果の開催日時は年月日と時までを表示する
- 画像確認: sheet-4_img2.png（PC）・sheet-4_img3.png（SP）を確認。見出し「イベント絞り込み結果」、右上に詳細検索ボタン、条件チップ（スタンダード×/カジュアル対戦×/平日×等）、「検索結果: 1,000件」、ページング 1 2 3 4 5 … 17 >、カードは フォーマットラベル＋タグ＋イベント名＋「2025年08月24日 18時　甲府店」。 カードの日時は「2025年08月24日 18時」で分は出ていない。
- 実装参照: `src/Eccube/Resource/template/default/Event/_search_event_card.twig:59; src/Eccube/Resource/template/default/Event/list.twig:92`
- 実装実態: 分まで含めた日時が表示される（src/Eccube/Resource/template/default/Event/_search_event_card.twig:59 の 'Y/m/d H:i'）
- 判定根拠: 設計は開催日時を年月日と時までの表示とし、sheet-4_img2/img3 のカードも「2025年08月24日 18時」。実装は分まで含めた「2025/08/24 18:00〜」を出す（src/Eccube/Resource/template/default/Event/_search_event_card.twig:59）。フォーマットは設計（1件ならその名称、それ以外は「混合フォーマット」）に対し実装は設定分すべてをラベル表示するが、リニューアル後のレイアウト図がフォーマットラベルを個別表示しているため、この点は指摘に含めない。
- 確信度: med

### sheet-4-R094 大会詳細検索 — 実装違い／IO／P3

- 正本: sheet-4（大会詳細検索） HTML行 1802 付近
- 正本引用: 「キーワード・開催日時の期間・平日休日過去の別・指定したフォーマットのいずれかが指定されているときは、それらを連ねた文字列からページの表題と説明文を組み立てる。フォーマットは表示順に連ねる。いずれの指定も無いときは、表題と説明文を差し替えない。」
- 設計期待値: 条件が指定されているときは表題と説明文の両方をその条件から組み立て、条件が無いときはどちらも差し替えない
- 画像確認: レイアウト図には表題・説明文の指定は現れない。
- 実装参照: `src/Eccube/Resource/template/default/meta.twig:99-110; src/Eccube/Resource/template/default/Event/list.twig:14-22`
- 実装実態: 表題だけを条件から組み立て、説明文は条件を反映しない。条件が無いときも既定の表題に差し替える（src/Eccube/Resource/template/default/Event/list.twig:14-22）
- 判定根拠: 設計は指定された条件から表題と説明文の両方を組み立てるとする。実装は条件チップを連ねた文字列でページの表題だけを作り（src/Eccube/Resource/template/default/Event/list.twig:14-22、src/Eccube/Resource/template/default/default_frame.twig:20-34）、説明文には検索条件を反映する分岐が無い（src/Eccube/Resource/template/default/meta.twig:99-110 に検索結果一覧の分岐が無く、Page.description 任せ）。加えて条件が無いときも既定の表題「MTGイベント一覧」に差し替える（src/Eccube/Resource/template/default/Event/list.twig:21）。
- 確信度: med

### sheet-5-R020 大会詳細 — 実装違い／IO／P3

- 正本: sheet-5（大会詳細） HTML行 1913 付近
- 正本引用: 「以下のようにイベント詳細情報に合わせて表示する ホーム > イベントTOP > [店舗名] > [フォーマット] > [イベント開催日付]」
- 設計期待値: パンくずリストの最後の階層に、そのイベントの開催日付が表示される。
- 画像確認: img4（PCレイアウト）ではパンくずが5階層。実装も5階層だが最終要素の内容が異なる。
- 実装参照: `src/Eccube/Resource/template/default/Event/detail.twig:31-74`
- 実装実態: 最後の階層はイベント名（eventName）を表示しており、開催日付は出ない（src/Eccube/Resource/template/default/Event/detail.twig:66-72）。ホーム/イベントTOP/店舗名/フォーマットの4階層は一致。
- 同じ実装実態でまとまる要求: sheet-5-R021（大会詳細）
- 判定根拠: src/Eccube/Resource/template/default/Event/detail.twig:67-70 が現在地の文言としてイベント名を出しているため、設計が指定する[イベント開催日付]が画面に出ない。
- 確信度: med

### sheet-5-R023 大会詳細 — 実装違い／ふるまい／P3

- 正本: sheet-5（大会詳細） HTML行 1917 付近
- 正本引用: 「パンくずリスト内の「店舗名」「フォーマット」「イベント開催日付」はそれぞれ押下可能」
- 設計期待値: パンくずの店舗名・フォーマット・開催日付を押すと、その内容で絞り込まれたイベント一覧が表示される。
- 画像確認: img3/img4でパンくずがリンク色（青）で描かれていることを確認。
- 実装参照: `src/Eccube/Resource/template/default/Event/detail.twig:47-65`
- 実装実態: 店舗名・フォーマットのリンク先はいずれも絞り込み条件を持たないイベント検索一覧（src/Eccube/Resource/template/default/Event/detail.twig:50、src/Eccube/Resource/template/default/Event/detail.twig:60）で、押しても全件一覧が出る。開催日付の階層自体が無い。
- 同じ実装実態でまとまる要求: sheet-5-R024（大会詳細 / 実装参照 `src/Eccube/Resource/template/default/Event/detail.twig:47-65;src/Eccube/Controller/Front/EventSearchController.php:38-46`）
- 判定根拠: [gate7/refute] 重要度を P3 へ。事実は確認。引用「パンくずリスト内の「店舗名」「フォーマット」「イベント開催日付」はそれぞれ押下可能」は sheets/sheet-5.txt:88 に逐語で実在（画面部品の説明セル＝述語あり）。実装は src/Eccube/Resource/template/default/Event/detail.twig:50 と :60 で url('event_search') を条件無しで張るのみ、開 リンクは張られている（押下可能）が、遷移先に店舗・フォーマットの絞り込みが引き継がれない。検索一覧は絞り込み条件を受け取れる（src/Eccube/Controller/Front/EventSearchController.php:38-39）のに渡していない。
- 確信度: high

### sheet-5-R027 大会詳細 — 実装違い／IO／P3

- 正本: sheet-5（大会詳細） HTML行 1921 付近
- 正本引用: 「イベントに設定されているルール適応度のアイコンと適応度名」
- 設計期待値: イベントに設定されたルール適用度に応じたアイコンと、その適応度名が表示される。
- 画像確認: img4のタグは丸い絵文字状アイコン＋「カジュアル対戦」。適用度ごとに絵柄が変わる前提の図。
- 実装参照: `src/Eccube/Resource/template/default/Event/detail.twig:84-91;src/Eccube/Resource/template/default/Event/_search_event_card.twig:27-41`
- 実装実態: 適応度名は設定値から表示するが、アイコンは icon-hareruya-player 固定で、ルール適用度がどれでも同じ絵柄になる（src/Eccube/Resource/template/default/Event/detail.twig:87）。一覧のカードでは適用度ごとにアイコンを出し分けている（_search_event_card.twig:27-41）。
- 判定根拠: 初心者向け・上級者向けのイベントでもカジュアル対戦と同じアイコンが出る。一覧側に適用度別アイコンの実装があるため、詳細側だけ固定になっている。
- 確信度: med

### sheet-5-R108 大会詳細 — 実装違い／IO／P3

- 正本: sheet-5（大会詳細） HTML行 2046 付近
- 正本引用: 「開催日時・受付時間・事前予約期間は「（年）年（月）月（日）日 （時）時（分）分」の形式で表示する。」
- 設計期待値: 日本語表示の開催日時・受付時間は「2025年3月20日 09時00分」のように年月日と時分を日本語の単位付きで表示される。英語表示では午前・午後の別を伴う日時表記と、桁区切りに JPY を付けた参加費、単位を付けない定員が表示される。
- 画像確認: img4/img3の開催日時・受付時間の表記を確認し、年月日時分形式であることを根拠にした。
- 実装参照: `src/Eccube/Resource/template/default/Event/detail.twig:99-138;src/Eccube/Resource/locale/messages.en.yaml:4251-4254`
- 実装実態: 日本語でも英語でも「2025/3/20 09:00」のスラッシュ区切り表記で出力している（src/Eccube/Resource/template/default/Event/detail.twig:102、src/Eccube/Resource/template/default/Event/detail.twig:109-111）。参加費は英語表示でも ¥ 付き（src/Eccube/Resource/template/default/Event/detail.twig:135）、定員は英語で「n players」と単位が付く（src/Eccube/Resource/locale/messages.en.yaml:4251-4252）。フォーマット複数時の区切りは空白ではなく「 / 」（src/Eccube/Resource/template/default/Event/detail.twig:120）。
- 判定根拠: 日本語の年月日時分表記はレイアウト図（img4「2025年3月20日 09時00分」「2025年3月20日09時00分〜09時00分」）でも同じ形で描かれており、現行仕様とリニューアルのレイアウト図が一致している。実装だけがスラッシュ区切り。参加費の「¥100」表記はレイアウト図に合わせた実装のため対象外とした。
- 確信度: high

### sheet-5-R110 大会詳細 — 未実装／IO／P3

- 正本: sheet-5（大会詳細） HTML行 2048 付近
- 正本引用: 「デッキ登録のボタンは、申込のボタン領域を表示する状態のときにかぎり、ログイン会員の選手情報で当該イベント詳細のデッキが登録済みならデッキ編集の文言で表示する。」
- 設計期待値: 申込ボタン領域が出ている状態で、そのイベント詳細のデッキを既に登録している会員には、ボタンの文言が「デッキ編集」で表示される。
- 画像確認: img9-img12のボタン図はいずれも「デッキ登録」表記で、デッキ編集状態の図は無い。
- 実装参照: `src/Eccube/Resource/template/default/Event/_event_detail_actions.twig:37-41;src/Eccube/Resource/locale/messages.ja.yaml:6670;src/Eccube/Controller/Front/EventDetailController.php:44-62`
- 実装実態: デッキ登録ボタンの文言は登録済みかどうかに関わらず「デッキ登録」固定で、デッキ編集の文言を出す分岐が無い（src/Eccube/Resource/template/default/Event/_event_detail_actions.twig:37-41、src/Eccube/Resource/locale/messages.ja.yaml:6670）。デッキ登録済みかどうかを画面へ渡す処理も無い（src/Eccube/Controller/Front/EventDetailController.php:44-62）。
- 判定根拠: 同行前半の申込済み判定（ログイン会員の選手情報が取消以外の申込に含まれるか、未ログイン・選手情報なしは偽）はsrc/Eccube/Repository/DtbEventEntryRepository.php:333-353 で一致。後半のデッキ編集文言だけが無い。R122と同一の実装欠陥。
- 確信度: high

### sheet-6-R009 大会申込～完了 — 実装違い／ふるまい／P3

- 正本: sheet-6（大会申込～完了） HTML行 2284 付近
- 正本引用: 「別日程の同イベントが存在する場合、大会詳細画面で申込をしたイベントは選択済みイベント選択(1-1)は選択済みの状態で変更可だが、イベントが未選択の状態で次の画面には遷移させない」
- 設計期待値: 別日程の同イベントがあるときは、選択済みイベントのチェックを外して申込対象から除けること。すべて未選択のときだけ次の画面へ進めない。別日程が無いときはチェックを外せない。
- 画像確認: sheet-6_img3(PC)・sheet-6_img4/5(チェックボックス部品)を確認。図では選択済イベントにチェック済みの箱、別日程に未チェックの箱が置かれており、操作不可かどうかは図から判別できないため本文の記述で判定した。
- 実装参照: `src/Eccube/Resource/template/default/Event/entry.twig:53-59`
- 実装実態: 選択済みイベントのチェックボックスは別日程の有無にかかわらず常にチェック済みかつ操作不可で描画され（entry.twig:58）、申込対象の主イベントは常に送信される固定値として持つ（entry.twig:53）。別日程だけを申し込みたい場合でも主イベントを外せない。
- 判定根拠: [gate7/refute] 重要度を P3 へ。指摘自体は成立。引用は sheets/sheet-6.txt:81-82 に逐語で実在し（改行を跨ぐだけ）、同ブロックの txt:83「別日程の同イベントが存在しない場合…変更不可とする」が対になっており、但し書きで否定されていない。実装も確認: src/Eccube/Resource/template/default/Event/entry.twig:58 は `checked disabled entry.twig:58 の checkbox は checked disabled が固定で、others の有無で分岐していない。EventEntryController.php:100 も detail を必須の主対象として読むため、主イベントを外した申込はできない。
- 確信度: high

### sheet-6-R021 大会申込～完了 — 未実装／IO／P3

- 正本: sheet-6（大会申込～完了） HTML行 2296 付近
- 正本引用: 「申込同意(1-10)にチェックが入っていない状態で「支払いへ進む」(1-11)を押しても次の画面には遷移させずエラーを動的に表示する」
- 設計期待値: 申込同意にチェックが無い状態で支払いへ進むを押したとき、次の画面へ進まず、同意が必要であることを知らせるエラー文言が画面に表示される。
- 画像確認: sheet-6_img3にエラー表示状態は描かれていないため、本文の記述で判定した。
- 実装参照: `src/Eccube/Resource/template/default/Event/entry.twig:123-129; html/template/default/assets/hareruya/js/hareruya-event.js:1; src/Eccube/Resource/locale/messages.ja.yaml:6706`
- 実装実態: 支払いへ進むボタンは同意チェックが付くまで disabled で、押しても何も起きずエラー文言は表示されない（entry.twig:124-129 と hareruya-event.js の disabled 切替のみ）。用意済みの文言 front.event.entry.error.agree_required（messages.ja.yaml:6706）はどのテンプレート・スクリプトからも参照されていない。
- 判定根拠: entry.twig:129 のボタンは初期 disabled、hareruya-event.js は checked に応じて disabled を切り替え、disabled 時のクリックを preventDefault するだけでメッセージ描画が無い。agree_required の文言は ja/en 両方に存在するが未使用。
- 確信度: med

## 掲載しなかった判定

- 実装実態が空欄の判定 4件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）
- 区分が「表示メッセージ」の指摘 6件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0307/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 6 | 0 | 0 | 0 | 6 |
| sheet-2 | 目次 | 8 | 0 | 0 | 0 | 8 |
| sheet-3 | イベント大会TOP | 282 | 3 | 17 | 3 | 259 |
| sheet-4 | 大会詳細検索 | 102 | 0 | 12 | 0 | 90 |
| sheet-5 | 大会詳細 | 123 | 2 | 7 | 4 | 110 |
| sheet-6 | 大会申込～完了 | 112 | 1 | 6 | 1 | 104 |

