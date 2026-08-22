# M13-05（複製新規）

## 業務ロジック

### 刷新後は実装しない（廃止）
- Excel基本設計 0214 識別ID:1-12 により廃止。刷新後は実装しない。
- Excel基本設計 0214 識別ID:1-13 により廃止。刷新後は実装しない。

### 複製新規画面の表示

複製元のイベントが見つからないときは404とする。

複製新規で開いた画面には、日程一覧と各日程の申込人数、日程の追加・繰返し追加・削除の操作、申込一覧へのリンクを表示しない。

### 複製しない項目

| 項目 | 複製時の扱い |
|------|--------------|
| イベントID | 載せない。保存したときに新規採番する |
| 登録者 | 載せない。保存したときにログイン中の管理者を設定する |
| 日程（イベント詳細）・申込・デッキ登録 | 引き継がない。保存しても新規のイベントに日程は紐づかない |

### 保存

検証を通過したときだけ、新規の1件として登録する。登録者にはログイン中の管理者を設定する。複製元のイベントは更新しない。保存に成功したときは、登録したイベントの編集画面へ遷移する。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 複製元イベントが存在しないとき | 404とする |
| 保存時の検証に失敗したとき | 登録せず、入力した値を保持したまま同じ画面を再表示する |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 複製元のイベント |
| 成功時出力 | 保存に成功したときは成功メッセージを表示し、登録したイベントの編集画面へ遷移する |
| 失敗時出力 | 複製元が存在しないときは404。保存時の検証に失敗したときは同じ画面を再表示する |

### 入出力: 永続化

| 操作 | 契機 |
|------|------|
| 追加 | 保存したとき。複製した内容を新規の1件として登録する。識別子は新規採番とし、登録者はログイン中の管理者とする |

複製元は更新しない。日程・申込・デッキ登録は登録しない。

## 表示メッセージ

本機能に固有のメッセージは無い。保存時のメッセージはM13-02を正とする。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 複製新規画面の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EventController.php:57-71 |
| 複製新規画面の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Event/eventdetail.twig:189-310 |
| 複製しない項目 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EventController.php:63-68 |
| 複製しない項目 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EventController.php:138 |
| 保存 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EventController.php:127-147 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EventController.php:59-61 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EventController.php:127-134 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EventController.php:138-147 |
