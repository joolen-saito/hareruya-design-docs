# F06-10（ポイント履歴）

## 業務ロジック

### Excel基本設計により廃止された仕様（刷新後は実装不要）

- Excel基本設計 0306 ポイント履歴 識別ID:2 により廃止。刷新後は実装しない。現行実装のふるまいは本書に残すが、刷新後の実装・テストの対象外とする

### 画面上部の表示

画面の見出しは「ポイント履歴一覧」とする。現在のポイントと次に消失するポイントの数値は強調表示する。画面に出すポイント数はいずれも桁区切りで表示する。本画面専用のモーダルは持たない。

### 一覧の対象と受け取るクエリ

常にログイン会員自身のポイント履歴のみを対象とする。ページ番号と1ページ表示件数はクエリで受け取り、ページ番号の指定が無いときは1ページ目を表示する。

### 表示件数の選択肢

表示件数として選べるのは 10件・20件・50件・100件 の4つとする。

### ポイント値と有効期限の表示

履歴行のポイント値は、増減値がプラスのとき先頭に「+」を付けて表示し、マイナスはそのまま表示する。獲得と利用で表示色を切り替える。有効期限はプラスの履歴にのみ表示し、発行日にポイント失効日数の設定を加えた日とする。注文番号のリンクは別タブで開く。

### 失効見込みの算定

選手情報の現在ポイントを起点に、有効期限内の獲得履歴を新しい順に差し引き、残高を使い切る履歴を失効見込みとする。同じ発行日の獲得履歴は合算して1件分として扱う。表示額は、失効見込み額と現在ポイントのうち小さい方とする。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 未ログインアクセス | 会員ログインへ誘導する（会員ログイン機能を正とする） |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | ページ番号・1ページ件数のクエリ |
| 成功時出力 | ポイント履歴一覧と現在ポイント・失効見込みのHTML表示 |
| 失敗時出力 | 未ログイン時は会員ログインへ誘導する |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| F06-10-MSG-001 | 本文 | ポイント履歴はありません。 | ポイント履歴を開き、履歴がないとき | ポイント履歴画面に留まる |
| — | 一覧上部 | 現在のポイント：（保有ポイント）ポイント | 一覧表示時に常時 | — |
| — | 一覧上部 | 次に消失するポイント：（失効見込み額）ポイント（失効日） | 失効見込みがある場合 | — |
| — | 一覧上部 | （開始）~（終了）件 ／ （総件数）件あります | 一覧表示時に常時 | — |

英語の表示文言は、MSG-001 が No point history found.、現在ポイントが Current Points : （保有ポイント） Points、失効見込みが Next Points to be Expired: （失効見込み額） Points （失効日）、件数表示が [（開始） ~ （終了）] ／ （総件数） Items である。本機能はフォーム送信に伴うフラッシュ・インラインエラーを生成しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| Excel基本設計により廃止された仕様（刷新後は実装不要） | P3 | 0306:sheet-10 |
| 画面上部の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/point_history.twig:18-37 |
| 画面上部の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/point_history.twig:12-161 |
| 一覧の対象と受け取るクエリ | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbPointHistoryRepository.php:19-28 |
| 一覧の対象と受け取るクエリ | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/MypageController.php:115-126 |
| 表示件数の選択肢 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/point_history.twig:40-46 |
| ポイント値と有効期限の表示 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/point_history.twig:99-115 |
| ポイント値と有効期限の表示 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Entity/DtbPointHistory.php:231-235 |
| 失効見込みの算定 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbPointHistoryRepository.php:122-160 |
| 失効見込みの算定 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/point_history.twig:30-37 |
| エラー時の扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Util/LoginUtil.php:20-28 |
