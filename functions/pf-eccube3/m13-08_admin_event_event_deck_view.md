# M13-08（デッキ表示）

## 業務ロジック

### 刷新後は実装しない（廃止）
- Excel基本設計 0214 識別ID:5 により廃止。刷新後は実装しない。
- Excel基本設計 0214 識別ID:9-11 により廃止。刷新後は実装しない。

### 表示の対象

本画面では検索条件を入力させない。申込一覧側の検索条件が保持されていないときは、空の条件として扱い、登録デッキの取得結果に従う。並び順は既定の並びとする。表示は印刷向けのデッキリストとして、申込一覧とは別の画面に開く。

### プレイヤー名の決め方

デッキに登録されたプレイヤー名から前後の空白を除いて用いる。プレイヤー名が空のときは、会員のカナ姓とカナ名を半角空白で連結して表示する。

### カードリストの組み立て

カード一覧はカードごとに枚数とカード名を並べる。メインとサイドそれぞれの枚数を合計し、各見出しに枚数を表示する。

### ページの分割

メインのカード一覧を1ページ40枚で分割し、デッキ単位でページを構成する。サイドボードは先頭ページにだけ載せ、2ページ目以降のサイドは空とする。ページごとにプレイヤー名・日程・メインカード・メイン枚数・サイド枚数を並べる。プレイヤー名の後ろに、そのデッキの中での現在ページ番号と総ページ数を表示する。表番号の欄は値を出さず空欄とする。日程は開催日を年/月/日の書式で表示する。

### エラー時の扱い

| 事象 | 扱い |
| --- | --- |
| 申込の検索条件が保持されていない | 空の条件として扱い、登録デッキの取得結果に従う |
| データの読み取り障害 | 共通の例外処理に委ねる。本画面固有の利用者向けメッセージは設けない |

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 利用者が入力する項目は無い |
| 成功時出力 | 印刷向けのデッキリストの表示 |
| 失敗時出力 | 本画面固有のエラー画面は持たない |

## 表示メッセージ

この機能はメッセージを表示しない。画面はデッキ情報と印刷の導線だけで、操作結果を知らせる文言を出さない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 表示の対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:758 |
| 表示の対象 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Entry/entrylist.twig:201 |
| プレイヤー名の決め方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:793 |
| カードリストの組み立て | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:780 |
| カードリストの組み立て | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Entry/decklist.twig:34 |
| ページの分割 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:784 |
| ページの分割 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Entry/decklist.twig:19 |
| エラー時の扱い | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:758 |
