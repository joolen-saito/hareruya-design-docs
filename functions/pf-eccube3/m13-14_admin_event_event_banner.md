# イベント管理 — バナー設定

## 業務ロジック

### 並び順の扱い

並び順は保存しない。設定画面を開くたびに、各バナーの並び順欄にはそのバナーの識別番号が初期表示される。

バナー設定を保存すると、入力された並び順の小さい順に各バナーの入力内容を並べ替え、先頭から1・2・3…と番号を振り直したうえで、その番号のバナーへ入力内容を割り当てて保存する。並び順を入れ替えて保存すると、入力内容そのものが並び順のとおりに別のバナーへ移る。

### 保存できなかったとき

入力の検証に通らなかったときは、1件も保存せずに設定画面を再表示する。バナーごとの部分保存は行わず、1件でも検証に通らなければ他のバナーの入力も保存しない。

### 表示店舗の選択肢の表記

表示店舗の選択肢は、店舗名から「晴れる屋」を除いた表記で示す。

### リンク先URLの未入力

リンク先URLを空欄のまま保存したときは、空文字として保存する。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 各バナーの設定内容と並び順、なりすまし対策の検証値 |
| 成功時出力 | 設定内容を保存し、設定画面へ戻る |
| 失敗時出力 | 保存せず設定画面を再表示する |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 登録・更新 | バナー設定の保存 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M13-14-MSG-001 | 管理画面上部 | 保存しました | イベントバナー設定を保存したとき | イベント管理 — バナー設定画面に遷移する |
| M13-14-MSG-002 | 入力項目直下 | 「admin.hareruyamtg.com」は指定できません。 | 画像URLに指定できないドメインを入力して保存したとき | 保存せずイベント管理 — バナー設定画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 並び順の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/BannerController.php:291-326 |
| 並び順の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Banner/banner.twig:114 |
| 保存できなかったとき | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/BannerController.php:240-281 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/BannerController.php:312-327 |
| 表示店舗の選択肢の表記 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/Banner/BannerType.php:36 |
| リンク先URLの未入力 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/BannerController.php:314 |
