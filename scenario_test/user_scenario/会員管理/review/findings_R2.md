主張: `matrix_UMB-03/exceptions.tsv:4,7` のE3・E6は、ログイン後の操作をT01に差し込む（`matrix.md:27-28`）。T01は制限中（C2）で、入口も支店（D2）である。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1677-1679` は「30分間ログイン不可」と定める。同ファイル`:1731-1732` の支店への共有トークンも「本店でログインが成立したとき」に発行される。T01ではE3のログアウトもE6の本店ログイン後の支店表示も始められない。
判定: 事実の誤り
修正案: E3はログイン成功行へ、E6は本店でログインできる行へ差し込み、必要なC・Dの水準を条件に加える。

主張: `matrix_UMB-22/exceptions.tsv:3` のE2は商品詳細のボタン非表示をA1・B1だけで差し込み、`matrix.md:33` では注文手続き（C3）のT10に割り当てている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/会員管理/matrix_UMB-22/fl_table.tsv:7,9` はC3を「本店の注文手続き」、商品詳細をC1の画面と定める。設計書 `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:5109` の非表示対象は「入荷時通知」と「お気に入り登録/解除」のボタンで、T10の画面を開くだけでは確認できない。
判定: 事実の誤り
修正案: E2の差し込み条件にC1を加え、商品詳細を開く行に割り当てる。

主張: `matrix_UMB-23/exceptions.tsv:6` のE5はブラックリスト該当の登録エラーをB1だけで差し込み、`matrix.md:29` では部分一致（C3）のT04に割り当てている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0207_基本設計仕様書(会員管理機能).html:2916` は「ブラックリスト判定は完全一致で行う」「登録キーワードを一部に含むだけでは該当しない」と定める。T04ではE5の登録エラー画面に到達しない。
判定: 事実の誤り
修正案: E5の条件に完全一致するC1またはC2を指定し、該当する新規会員登録行へ差し込む。

主張: `matrix_UMB-14/exceptions.tsv:3` のE2は「その他キャンセル理由」が履歴詳細にも出るとし、未ログイン（C2）のT10に割り当てている（`matrix.md:34`）。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php:221-229` は履歴詳細を`ROLE_USER`に限り、ログイン会員に紐づく問い合わせを取得する。設計書 `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4720` も「ログイン会員に紐づくお問い合わせを…表示する」と定める。E2の手順には送信後のログインが無い。
判定: 事実の誤り
修正案: 履歴詳細まで確かめるE2はログイン会員（C1）の行に差し込み、未ログイン送信後の確認はE7で扱う。

主張: `matrix_UMB-22/exceptions.tsv:2` のE1は許可IP設定を空にする例外を、許可IP（B1）のT01へ差し込んでいる（`matrix.md:32`）。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:5142` は「設定値が空のときは、いずれのIPアドレスからのアクセスも許可しない」と定める。空にした時点でT01のB1「許可されたIPアドレス」は成立しない。
判定: 事実の誤り
修正案: E1は許可外IP（B2）の行へ差し込み、条件にB2を加える。
