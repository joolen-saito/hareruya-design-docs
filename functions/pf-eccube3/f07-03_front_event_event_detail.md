# F07-03（大会詳細）

イベント詳細1件の開催情報・事前予約情報を表示し、申込・キャンセル申込・デッキ登録への導線を出し分ける、フロントのイベント詳細参照画面である。

## 業務ロジック

### 事前予約情報の表示

エントリーフラグが真のときにかぎり、事前予約情報の見出しと、事前予約期間・事前予約の参加費を表示する。残り予約数は事前予約の申込期限前のときだけ表示し、値はイベント詳細の定員から申込済み人数を引き、チーム人数で割った数である。申込済み人数は、定員に数える申込状況の申込件数にチーム人数を掛けた数である。

### バナー画像と備考の表示

バナー画像は、イベントに登録されているときだけ画面最上部に表示し、登録が無いときは画像を出さない。イベントの備考は、登録されたHTMLとして解釈して表示する。

### 表示値の求め方

日本語表示では、参加費・事前予約参加費は0円のとき「無料」、それ以外は金額を桁区切りで「（金額）円」と表示する。定員は「（人数）人」と表示する。開催日時・受付時間・事前予約期間は「（年）年（月）月（日）日 （時）時（分）分」の形式で表示する。受付時間は受付開始・受付終了の双方が設定されているときだけ表示する。フォーマットが複数あるときは、名称を空白区切りで並べて表示する。英語表示では、日時を「（年）/（月）/（日） （時）:（分） am」「（年）/（月）/（日） （時）:（分） pm」の形式、参加費を0円のとき「Free」・それ以外を桁区切りの「（金額）JPY」と表示し、定員には単位を付けない。

### 申込済みの判定とデッキ登録済みの扱い

申込済みの判定は、ログイン会員に対応する選手情報が、当該イベント詳細の取消以外の申込に含まれることである。未ログインのとき、およびログイン会員に対応する選手情報が無いときは、申込済みを偽として扱う。デッキ登録のボタンは、申込のボタン領域を表示する状態のときにかぎり、ログイン会員の選手情報で当該イベント詳細のデッキが登録済みならデッキ編集の文言で表示する。申込のボタン領域を表示せずデッキ登録だけができる状態のときは、登録済みでも文言はデッキ登録のままである。

### 申込・キャンセル申込の表示条件

申込とキャンセル申込の導線は、エントリーフラグが真で、現在日時が事前予約期間の開始日時以上かつ終了日時以下で、定員が申込済み人数より多いときだけ表示する。事前予約期間の開始日時・終了日時ちょうどは、期間内として扱う。

キャンセル申込の導線は、この条件を満たすときにかぎり、申込済みの会員に表示する。定員到達・事前予約期間外・エントリーフラグが偽のいずれかにあたるときは、申込済みの会員にもキャンセル申込の導線を表示しない。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| イベント詳細が存在しない | ページが見つからない（HTTP404）として扱う |
| ログイン会員に選手情報が無い | デッキ登録済みとして扱わず、申込済みを偽として扱う |

利用者向けの個別エラー文言は専用に定義せず、共通の例外処理に委ねる。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | イベント詳細ID、ログイン会員の認証情報（デッキ登録状況・申込済み判定に用いる） |
| 成功時出力 | イベント詳細の画面（開催情報・事前予約情報・状態別ボタン） |
| 失敗時出力 | イベント詳細が存在しないときのページが見つからない（HTTP404） |

本機能は詳細表示のみで入力フォームを持たず、ボタン押下による遷移のみを受け付ける。データの更新は行わない。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| — | 項目見出し | 備考 | 詳細表示時 | 静的表示 |
| — | 事前予約欄の見出し | 事前予約情報／事前予約期間／残り予約数／参加費(事前予約) | エントリーフラグが真のとき | 静的表示 |
| — | 参加費欄 | 無料 | 参加費が0円のとき | 静的表示 |
| — | ボタン | デッキ編集 | デッキ登録済みで、申込のボタン領域を表示する状態のとき | デッキ登録の画面へ遷移する |

英語表示では、備考の見出しを General Information、事前予約欄の見出しを Pre-registration Information／Pre-registration Period／Remaining Seats for Event／Entry Fee (For Pre-registration)、参加費が0円のときの文言を Free とする。デッキ登録のボタンは、登録済みかどうかにかかわらず Decklist と表示する。本画面は操作結果のメッセージを生成しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 事前予約情報の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Event/show.twig:84 |
| 事前予約情報の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Entity/DtbEventDetail.php:931 |
| 事前予約情報の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbEventDetailRepository.php:164 |
| バナー画像と備考の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Event/show.twig:15 |
| バナー画像と備考の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Event/show.twig:82 |
| 表示値の求め方 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Event/show.twig:67 |
| 表示値の求め方 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Event/show.en.twig:32 |
| 申込済みの判定とデッキ登録済みの扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Entity/DtbEventEntry.php:411 |
| 申込済みの判定とデッキ登録済みの扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/EventController.php:136 |
| 申込済みの判定とデッキ登録済みの扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Event/show.twig:128 |
| 申込済みの判定とデッキ登録済みの扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Event/show.twig:135 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/EventController.php:120 |
| 申込・キャンセル申込の表示条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Entity/DtbEventDetail.php:836-843 |
| 申込・キャンセル申込の表示条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Event/show.twig:113-125 |
