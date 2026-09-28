# F06-05（マイページ）

## 業務ロジック

### フェーズ2対応（フェーズ1では実装しない）
- Excel基本設計 0306「マイページ上の通知」はフェーズ2対応。フェーズ1では実装しない。

### 保持された戻り先への遷移

未ログインのまま入荷お知らせを申し込むと、申し込んだ画面が戻り先として保持される。その後マイページを開いたときに戻り先が保持されていれば、戻り先を取り出して消去し、その画面へ戻す。このときマイページは表示しない。

### 機能ブロックの並べ方

各機能ブロックはアイコン画像とタイトルで構成する。ブロックは「過去の購入、入荷待ち商品の確認」「晴れる屋ポイントの確認」「ネット買取申込みの確認、本人確認」「イベント・大会の予約確認、デッキ登録」「会員情報の変更」「その他」の見出しでグループ化して並べる。本画面専用のモーダルは無い。利用者入力のフォームは持たない。

### 会員番号とバーコードの内容

会員番号には、会員に割り当てられたスマレジ側の会員番号を表示する。バーコードは、その会員番号に接頭番号を付けて桁数分をゼロ埋めし、末尾にチェックディジットを加えたコードを、EAN-13形式で表示する。

接頭番号と全体の桁数は設定値で、現在の設定では接頭番号「29」、全体13桁である。会員番号は、全体の桁数から接頭番号の桁数とチェックディジットの1桁を除いた桁数（現在の設定では10桁）にゼロ埋めして接頭番号の後ろに続け、末尾に1桁のチェックディジットを加える。

### 期限の近いポイントの値

期限の近いポイントは、失効期限が同じポイント履歴が複数あるときは、それらの失効ポイントを合算した数を表示する。合算した数が現在の保有ポイントを上回るときは、現在の保有ポイントを表示する。ポイントの計算・付与・失効はポイント機能を正とし、本機能では表示のみを行う。

### ヘッダー表示用のポイント

共通ヘッダーに出す保有ポイントは、マイページ本体とは別の要求で取得して返す。

共通ヘッダーの保有ポイントは、ログインした状態で共通ヘッダーを表示するたびに、ヘッダー用のポイント表示（言語別のパス配下の /mypage/point_in_header）を呼び出して取得する。ヘッダー用のポイント表示は、ログイン会員の選手情報から保有ポイントだけを取得して返し、外部システムへは問い合わせない。マイページ本体は、これとは別に選手情報を取得する。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 保持された戻り先（未ログインでの入荷お知らせ申込時に保持したもの） |
| 出力（戻り先が保持されていないとき） | マイページ画面 |
| 出力（戻り先が保持されているとき） | 保持された戻り先の画面への遷移 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| F06-05-MSG-001 | バーコード表示付近 | コードの有効期限が切れました。 | 表示中のバーコードの有効時間が終了したとき | バーコード表示を期限切れ文言と再表示リンクに置き換え、マイページに留まる |

MSG-001 の英語の表示文言は This code has expired. である。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 保持された戻り先への遷移 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/MypageController.php:163 |
| 保持された戻り先への遷移 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/CartController.php:139 |
| 機能ブロックの並べ方 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/index.twig:64 |
| 会員番号とバーコードの内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/index.twig:27 |
| 会員番号とバーコードの内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/point_barcode_js.twig:12 |
| 会員番号とバーコードの内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Entity/DtbPlayer.php:934 |
| 期限の近いポイントの値 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/index.twig:49 |
| 期限の近いポイントの値 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbPointHistoryRepository.php:148 |
| ヘッダー表示用のポイント | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/MypageController.php:185 |
| 会員番号とバーコードの内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/config.yml:269-271 |
| 会員番号とバーコードの内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Entity/DtbPlayer.php:934-945 |
| ヘッダー表示用のポイント | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/base_header.twig:53-56 |
| ヘッダー表示用のポイント | P2 | pf-eccube3:app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:129-130 |
| ヘッダー表示用のポイント | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/MypageController.php:170 |
