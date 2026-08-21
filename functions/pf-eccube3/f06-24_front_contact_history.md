# 会員 — お問い合わせ履歴詳細

## 業務ロジック

### 表示対象の絞り込み

指定されたお問い合わせ番号が、ログイン会員自身のお問い合わせであるときだけ内容を表示する。

| 事象 | 扱い |
|------|------|
| 指定したお問い合わせが存在しないとき、または他会員のお問い合わせ番号のとき | 当該内容を表示しない。閲覧専用の画面であり、明示のエラーは出さない |
| ログイン会員として特定できないとき | 対象を絞り込む会員が定まらないため、当該内容を表示しない |

### 表示する値の扱い

| 観点 | 内容 |
| --- | --- |
| お問い合わせ日時の書式 | 日本語ページは `Y/m/d H:i`、英語ページは `m/d/Y H:i` |
| お問い合わせ種別 | 日本語ページは種別の日本語名称、英語ページは種別の英語名称を表示する |
| お問い合わせ内容 | お問い合わせ時に入力した改行を反映して表示する |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 表示するお問い合わせ番号。 |
| 成功時出力 | 該当するお問い合わせの内容。 |
| 失敗時出力 | 該当が無いときは当該内容を表示しない。 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| — | 一覧見出し | お問い合わせ履歴一覧 | 一覧画面を表示したとき | 一覧画面に留まる |
| — | 一覧見出し（英語ページ） | Contact Us History | 一覧画面を表示したとき | 一覧画面に留まる |
| — | 一覧の総件数 | N件（Nは件数） | 一覧画面を表示したとき | 一覧画面に留まる |
| — | 一覧の総件数（英語ページ） | N Items（Nは件数） | 一覧画面を表示したとき | 一覧画面に留まる |
| — | 一覧・詳細の各件 | (お問い合わせ番号 : 〈ID〉) | 一覧・詳細の各件の表示時 | 当該画面に留まる |
| — | 一覧・詳細の各件（英語ページ） | (inquiry number : 〈ID〉) | 一覧・詳細の各件の表示時 | 当該画面に留まる |
| — | 詳細見出し | お問い合わせ履歴詳細 | 詳細画面の表示時 | 詳細画面に留まる |
| — | 詳細見出し（英語ページ） | Contact Us History Details | 詳細画面の表示時 | 詳細画面に留まる |

本機能は閲覧専用であり、エラー・警告のインライン表示とフラッシュ・トーストは生成しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 表示対象の絞り込み | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ContactController.php:156 |
| 表示対象の絞り込み | P1 | pf-eccube3:app/Plugin/HareruyaEc/Util/LoginUtil.php:22 |
| 表示する値の扱い | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.twig:18 |
| 表示する値の扱い | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.twig:19 |
| 表示する値の扱い | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.twig:29 |
| 表示する値の扱い | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.en.twig:18 |
| 表示する値の扱い | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.en.twig:19 |
