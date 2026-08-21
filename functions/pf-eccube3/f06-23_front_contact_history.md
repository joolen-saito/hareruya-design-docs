# 会員 — お問い合わせ履歴（一覧・詳細）

## 業務ロジック

### 対象の絞り込み

詳細は、指定されたお問い合わせ番号とログイン会員の両方に一致する1件だけを対象とする。対象が無いとき、および他会員のお問い合わせ番号を指定したときは、当該内容を表示しない。閲覧専用のため画面上の明示エラーは出さない。

### 件数と本文の表示

お問い合わせが1件も無いときも、件数欄には「0件」を表示する。詳細のお問い合わせ内容は、入力時の改行を反映して表示する。

### 日時とお問い合わせ種別の表示

送信日時の書式は、日本語表示時は一覧が `Y年m月d日 H:i`、詳細が `Y/m/d H:i`、英語表示時は一覧・詳細とも `m/d/Y H:i` とする。お問い合わせ種別は、日本語表示時は種別の日本語名称、英語表示時は種別の英語名称を表示する。日本語と英語のロケールに対応する。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 一覧は入力なし。詳細はお問い合わせ番号 |
| 成功時出力 | 一覧画面・詳細画面のHTML表示 |
| 失敗時出力 | 対象が無い場合は当該内容を表示しない（閲覧専用のため明示エラーは出さない） |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| F06-23-MSG-001 | 画面上部 | お問い合わせ履歴はありません。 | お問い合わせ履歴を開き、履歴が1件もないとき | お問い合わせ履歴一覧画面に留まる |
| F06-23-MSG-001 | 画面上部（英語表示時） | You have no inquiry history. | お問い合わせ履歴を開き、履歴が1件もないとき | お問い合わせ履歴一覧画面に留まる |
| — | 一覧見出し | お問い合わせ履歴一覧 | 一覧画面の表示時 | 見出しの下に総件数と各件を表示する |
| — | 一覧見出し（英語表示時） | Contact Us History | 一覧画面の表示時 | 見出しの下に総件数と各件を表示する |
| — | 一覧の総件数欄 | N件（Nは件数） | 一覧画面の表示時 | 一覧画面に留まる |
| — | 一覧の総件数欄（英語表示時） | N Items（Nは件数） | 一覧画面の表示時 | 一覧画面に留まる |
| — | 一覧・詳細の各件 | (お問い合わせ番号 : 〈ID〉) | 一覧・詳細の各件の表示時 | 各画面に留まる |
| — | 一覧・詳細の各件（英語表示時） | (inquiry number : 〈ID〉) | 一覧・詳細の各件の表示時 | 各画面に留まる |
| — | 詳細見出し | お問い合わせ履歴詳細 | 詳細画面の表示時 | 見出しの下に当該お問い合わせの内容を表示する |
| — | 詳細見出し（英語表示時） | Contact Us History Details | 詳細画面の表示時 | 見出しの下に当該お問い合わせの内容を表示する |

本機能は閲覧専用であり、エラー・警告のインライン表示やフラッシュ・トーストは生成しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 対象の絞り込み | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ContactController.php:156 |
| 件数と本文の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/history.twig:11 |
| 件数と本文の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.twig:29 |
| 日時とお問い合わせ種別の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/history.twig:17 |
| 日時とお問い合わせ種別の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/history.en.twig:21 |
| 日時とお問い合わせ種別の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.twig:18 |
| 日時とお問い合わせ種別の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.en.twig:18 |
| 日時とお問い合わせ種別の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/history.twig:20 |
| 日時とお問い合わせ種別の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/history.en.twig:24 |
