# F07-01（イベント大会TOP）

店舗ごとに、選択した月のイベントをカレンダーと日付リストで表示する、フロントのイベント大会TOP画面である。

## 業務ロジック

### 表示店舗の決定とクッキーの更新

表示店舗はクエリの店舗指定、クッキーの店舗、既定店舗（ID＝1）の順に決定する。クエリで店舗が指定され、それがクッキーの店舗と異なるときだけクッキーの店舗を更新する。更新したクッキーはサイト全体で有効とし、ブラウザを閉じるまで保持する。指定された店舗が存在しないときはページが見つからない（HTTP404）として扱う。

### 表示対象のイベント

公開状態のイベントに属し、かつ公開状態の開催日程だけを表示対象とする。イベントと開催日程のいずれかが非公開のものは、カレンダーにも日付リストにも出さない。同一日に同一イベントの開催日程が2件目以降現れたときは複数日程として束ね、同一日内で同じイベントを重複表示しない。同じ店舗・同じ月の取得結果は60秒間キャッシュの対象とし、キャッシュが有効な環境では、その間に行ったイベントや開催日程の追加・変更・非公開化が画面へ即時に反映されないことがある。

### 過去の大会ブロック

表示月の初日が当日より前のときは過去の大会があり、末日が当日以降のときは今後の大会があると判定する。両方があるときだけ開閉の見出しを出す。今後の大会があるときは、過去の大会ブロックを閉じた状態で表示する。過去の大会ブロックには、当日より前の日付とその日のイベントを収める。

### 初回アクセスかどうかによる表題と説明文

店舗指定と月指定がいずれも無いアクセスをTOPとみなし、既定の表題と説明文を出す。どちらかが指定されているときは、表題の先頭に店舗名と表示月（`Y年n月`形式）を付け、説明文も店舗名と表示月を含むものに差し替える。英語表示では、この表題・説明文の差し替えを行わない。イベントの抽出条件は変えない。

### 複数日程イベントの日別表示

イベント識別子は数値、日付指定は `Ymd` 形式または `all` に限り、これに当てはまらないアクセスはページが見つからない（HTTP404）として扱う。日付指定が `Ymd` 形式のときは当該日1日分を対象とし、当該日が現在より前のときは過去として扱う。日付指定が `all` のときは当日以降を対象とする。対象は公開状態のイベントと公開状態の開催日程に限り、過去として扱うとき以外は現在時刻以降に始まる開催日程だけを、開始日時の昇順で最大25件まで取る。該当が1件のときはその詳細画面（F07-03）へ遷移する。該当が0件のときは当該イベントの最新の開催日程の詳細画面へ遷移する。この最新の開催日程は公開状態を問わない。最新日程も無いときはHTTP404とする。該当が複数件のときは日別画面で開催日程の一覧を表示する。ログインしていなくても閲覧でき、ログイン会員のときは、その会員の選手情報を伴って表示する。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 店舗IDが存在しない | ページが見つからない（HTTP404）として扱う |
| 日別パラメータが不正 | ページが見つからない（HTTP404）として扱う |
| 日別で該当も最新日程も無い | ページが見つからない（HTTP404）として扱う |

本画面は利用者向けの個別エラー文言を専用に定義せず、共通の異常処理に委ねる。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | クエリの店舗指定・月指定、クッキーの店舗。日別はパスのイベント識別子・日付指定 |
| 成功時出力 | 月間カレンダーと日付リストのHTML。日別は開催日程一覧のHTML、または詳細画面・最新日程詳細への遷移 |
| 失敗時出力 | 店舗なし・不正な日別パラメータ・該当0件かつ最新日程なしのときのページが見つからない（HTTP404） |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 更新 | クエリで指定された店舗が現在のクッキーの店舗と異なるときの、クッキーの店舗 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| F07-01-MSG-001 | イベント一覧付近 | 他の期間か内容で再チェックしてください！ | イベント検索・絞り込みの条件に一致する結果が無いとき | イベント大会TOPに留まり、カレンダーを表示し日付リストにイベントを表示しない |
| F07-01-MSG-002 | イベント一覧付近 | 対象のイベントはありません。 | 選択中の店舗・期間に表示対象のイベントがないとき | イベント大会TOPに留まり、カレンダーを表示し日付リストにイベントを表示しない |
| — | 過去の大会ブロックの見出し | 過去の大会を開く／過去の大会を閉じる | 過去の大会と今後の大会が両方ある月の表示時 | 過去の大会ブロックを開閉する |
| — | タブ・ページ送り | （選択月）年（月）月（`Y年n月`形式） | 月間表示のとき | — |

英語の表示文言は、MSG-001 が Try a different period or filters.、MSG-002 が No events found.、過去の大会の開閉が Click to open past events／Click to close past events、月表示が `Y/n` 形式（例: 2026/6）である。本画面は操作結果のフラッシュ・トーストを生成しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 表示店舗の決定とクッキーの更新 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/CookieUtil.php:16 |
| 表示店舗の決定とクッキーの更新 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/EventController.php:53 |
| 表示対象のイベント | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbEventDetailRepository.php:104 |
| 表示対象のイベント | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/EventController.php:81 |
| 表示対象のイベント | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbEventDetailRepository.php:119 |
| 過去の大会ブロック | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Event/index.twig:146 |
| 初回アクセスかどうかによる表題と説明文 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Event/index.twig:5 |
| 初回アクセスかどうかによる表題と説明文 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Event/LocaleEvent.php:45 |
| 初回アクセスかどうかによる表題と説明文 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Event/index.en.twig:1 |
| 複数日程イベントの日別表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/EventController.php:169 |
| 複数日程イベントの日別表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/ControllerProvider/Front/EventControllerProvider.php:24 |
| 複数日程イベントの日別表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbEventDetailRepository.php:341 |
| 複数日程イベントの日別表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/EventController.php:197 |
| 複数日程イベントの日別表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/EventController.php:205 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/EventController.php:57 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/CookieUtil.php:23 |
