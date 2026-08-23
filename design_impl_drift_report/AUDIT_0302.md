# 実装乖離監査 — 0302_基本設計仕様書(フロント_グローバルナビ).html

- 正本: `excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **961要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 5 | ○ |
| 実装違い | 実装はあるが設計と違う | 10 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 7 | — |
| 設計どおり | 設計どおり実装されている | 499 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 428 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 12 | — |
| **合計** | | **961** | |

## 不具合 9件（P1 0 / P2 3 / P3 6）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 6件は重複として代表へ折り畳んだ（判定そのものは 15件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-3-R128 | PC版ナビゲーション | 実装違い | ふるまい | P2 | メニュー一覧の「デッキ構築」を押下するとデッキTOP画面へ遷移する。 |
| sheet-3-R225 | PC版ナビゲーション | 未実装 | ふるまい | P2 | サイトマップの「FAQ」を押下するとFAQ画面へ遷移する。 |
| sheet-4-R196 | スマホ版ナビゲーション | 実装違い | IO | P2 | 英語表示のスマホ版メニュー一覧では、買取とデッキ構築だけが落ち、選手一覧の項目は残って押下すると選手紹介ページが開く。 |
| sheet-3-R198 | PC版ナビゲーション | 実装違い | IO | P3 | (19-3)フォーマットのメニュー5番目に「統率者」と表示する。 |
| sheet-3-R230 | PC版ナビゲーション | 実装違い | IO | P3 | 会社情報の1件目に「利用規約」と表示し、押下すると利用規約画面へ遷移する。 |
| sheet-5-R101 | 支店PC版ナビゲーション | 未実装 | IO | P3 | 支店サイトのヘッダのカート一覧に、その店舗に登録された送料無料条件（金額）までの残り金額を表示する。 |
| sheet-5-R151 | 支店PC版ナビゲーション | 実装違い | IO | P3 | フォーマットのメニュー5番目を「統率者」と表示する |
| sheet-6-R028 | 支店スマホ版ナビゲーション | 実装違い | ふるまい | P3 | 支店スマホ版で画面を下方向にスクロールしても、支店名ロゴ・ご当地晴れる屋くん・ポイント・カードセット・商品検索テキストボックス・検索の6つが常に画面上部に見えている |
| sheet-6-R154 | 支店スマホ版ナビゲーション | 実装違い | ふるまい | P3 | 支店サイトのフッタで当サイトについて／プライバシーポリシー／特定商取引法に基づく表記／お問い合わせを押すと、本店サイトの該当ページが開く |

### sheet-3-R128 PC版ナビゲーション — 実装違い／ふるまい／P2

- 正本: sheet-3（PC版ナビゲーション） HTML行 1216 付近
- 正本引用: 「・押下すると、デッキTOP画面へ遷移する」
- 設計期待値: メニュー一覧の「デッキ構築」を押下するとデッキTOP画面へ遷移する。
- 画像確認: sheet-3_img17: メニュー一覧に「デッキ構築」が他項目と同列で並んでおり、遷移しない項目としては描かれていない。
- 実装参照: `src/Eccube/Resource/template/default/Block/mega_menu.twig:42-48`
- 実装実態: メニュー一覧のデッキ構築はリンク先が「#」のままで、押下しても同じ画面に留まりデッキTOP画面へ遷移しない（遷移先未設定のTODOコメント付き）。ヘッダの並びの方（src/Eccube/Resource/template/default/Block/header.twig:93-95）はデッキ構築のページを指しており、遷移先自体は存在する。
- 同じ実装実態でまとまる要求: sheet-4-R129（スマホ版ナビゲーション）
- 判定根拠: メニュー一覧の他10項目はすべて遷移先が設定されている中で、デッキ構築だけが「#」。
- 確信度: high

### sheet-3-R225 PC版ナビゲーション — 未実装／ふるまい／P2

- 正本: sheet-3（PC版ナビゲーション） HTML行 1358 付近
- 正本引用: 「・押下すると、FAQ画面へ遷移する」
- 設計期待値: サイトマップの「FAQ」を押下するとFAQ画面へ遷移する。
- 画像確認: レイアウト図(sheet-3_img3.png / sheet-3_img21.png)ではサイトマップの最終項目としてFAQが他項目と同じリンクとして描かれている。
- 実装参照: `src/Eccube/Resource/template/default/Block/footer_sitemap.twig:50-53`
- 実装実態: 「FAQ」のリンク先が「#」のままで、押下しても同じ画面に留まりFAQ画面へ遷移しない。直前行に「TODO: FAQ ページ実装後に href を差し替え」と残っている。
- 同じ実装実態でまとまる要求: sheet-4-R168（スマホ版ナビゲーション / 実装参照 `src/Eccube/Resource/template/default/Block/footer_sitemap.twig:50-52`）
- 判定根拠: src/Eccube/Resource/template/default/Block/footer_sitemap.twig:52 の href が "#"。他のサイトマップ項目は実画面のURLを持つのに対しFAQだけ未接続で、FAQ画面自体は src/Eccube/Resource/template/default/Help/guide.twig:126 で /user_data/hareruya_faq として参照されている。
- 確信度: high

### sheet-4-R196 スマホ版ナビゲーション — 実装違い／IO／P2

- 正本: sheet-4（スマホ版ナビゲーション） HTML行 1963 付近
- 正本引用: 「英語版サイトのスマホ版ナビでは、買取とデッキ構築を表示しない。記事と選手一覧は、いずれも英語表示の外部ページを開く。」
- 設計期待値: 英語表示のスマホ版メニュー一覧では、買取とデッキ構築だけが落ち、選手一覧の項目は残って押下すると選手紹介ページが開く。
- 画像確認: sheet-4_img12（スマホのメニュー一覧を開いた図）で、ショップ/買取/記事/デッキ検索/デッキ構築/選手一覧/店舗一覧/イベント/ヘルプ/お問い合わせの10項目と、右上のメニュー表示アイコンを確認した。
- 実装参照: `src/Eccube/Resource/template/default/Block/mega_menu.en.twig:17-60`
- 実装実態: 英語表示のメニュー一覧は Shop / Article / Deck Search / Event / Shop Info / Help / Contact の7項目で、選手一覧（Players）の項目そのものが無い。日本語表示（4-7 選手一覧）には有る項目が英語表示だけ落ちている。
- 判定根拠: src/Eccube/Resource/template/default/Block/mega_menu.en.twig:17-60 に front.nav.menu.pros を出す項目が無い。日本語版 src/Eccube/Resource/template/default/Block/mega_menu.twig:49-54 には有る。設計が英語版で落とすと明記しているのは買取とデッキ構築の2つだけ。なお項目名の英訳（Event/Event Schedule）や並び順の差は、リニューアル後の項目表（4-2〜4-11）が優先するため指摘に含めない。
- 確信度: med

### sheet-3-R198 PC版ナビゲーション — 実装違い／IO／P3

- 正本: sheet-3（PC版ナビゲーション） HTML行 1316 付近
- 正本引用: 「・以下1~6のフォーマットをメニュー表示する 1 スタンダード 2 パイオニア 3 モダン 4 レガシー 5 統率者 6 その他」
- 設計期待値: (19-3)フォーマットのメニュー5番目に「統率者」と表示する。
- 画像確認: レイアウト図(sheet-3_img4.png / sheet-3_img20.png)のカテゴリバーは「統率者」。
- 実装参照: `src/Eccube/Resource/template/default/Block/category_nav_pc.twig:90; src/Eccube/Resource/locale/messages.ja.yaml:6444`
- 実装実態: 5番目のメニューは「コマンダー」と表示される。
- 同じ実装実態でまとまる要求: sheet-3-R183（PC版ナビゲーション）
- 判定根拠: 項目定義表側でも同じ文言が要求されているが、実装のラベル定義 src/Eccube/Resource/locale/messages.ja.yaml:6444 は「コマンダー」。src/Eccube/Resource/template/default/Block/category_nav_pc.twig:90 が唯一の参照元で、他に上書きは無い。sheet-3-R183 と同一の実装欠陥。
- 確信度: high

### sheet-3-R230 PC版ナビゲーション — 実装違い／IO／P3

- 正本: sheet-3（PC版ナビゲーション） HTML行 1373 付近
- 正本引用: 「25-1 利用規約 リンク - - - ・押下すると、利用規約画面へ遷移する」
- 設計期待値: 会社情報の1件目に「利用規約」と表示し、押下すると利用規約画面へ遷移する。
- 画像確認: レイアウト図(sheet-3_img3.png / sheet-3_img22.png)の会社情報は1件目が「利用規約」。
- 実装参照: `src/Eccube/Resource/template/default/Block/footer_company.twig:21; src/Eccube/Resource/locale/messages.ja.yaml:6480`
- 実装実態: 遷移先は利用規約画面だが、表示ラベルが「当サイトについて」になっている。
- 同じ実装実態でまとまる要求: sheet-4-R174（スマホ版ナビゲーション / 実装参照 `src/Eccube/Resource/template/default/Block/footer_company.twig:21;src/Eccube/Resource/locale/messages.ja.yaml:6480`）
- 判定根拠: src/Eccube/Resource/template/default/Block/footer_company.twig:21 のリンク先は利用規約画面（src/Eccube/Controller/Front/HelpController.php:63）で正しいが、参照する文言 src/Eccube/Resource/locale/messages.ja.yaml:6480 が「当サイトについて」。設計・レイアウト図の「利用規約」と表示が異なる。
- 確信度: high

### sheet-5-R101 支店PC版ナビゲーション — 未実装／IO／P3

- 正本: sheet-5（支店PC版ナビゲーション） HTML行 2353 付近
- 正本引用: 「・店舗の「送料無料条件(金額)」までの残り金額を表示する」
- 設計期待値: 支店サイトのヘッダのカート一覧に、その店舗に登録された送料無料条件（金額）までの残り金額を表示する。
- 画像確認: sheet-5_img6.png のカートホバー図には「あと¥1,000,000で送料無料」の行があり、支店シートでもこの行を含む図が採用されている。
- 実装参照: `src/Eccube/Service/Block/CartBlockPayloadBuilder.php:106-110; src/Eccube/Resource/template/default/Block/cart.twig:34-36`
- 実装実態: 残り金額は本店を閲覧しているときだけ算出され、支店を閲覧しているときは常に未設定になる。カート一覧の残り金額の行は支店では一度も表示されない。
- 同じ実装実態でまとまる要求: sheet-5-R102（支店PC版ナビゲーション / 実装参照 `src/Eccube/Service/Block/CartBlockPayloadBuilder.php:106-110; src/Eccube/Service/Cart/CartHeaderViewService.php:55-68`）
- 判定根拠: src/Eccube/Service/Block/CartBlockPayloadBuilder.php:106-110 は「支店は店舗受取のみで送料が存在しない」として本店閲覧時のみ残り金額を算出する。src/Eccube/Resource/template/default/Block/cart.twig:34 は残り金額が未設定なら行そのものを出さない。したがって支店PC版ナビゲーションのカート一覧には (9-3) が現れない。カート画面側も同様（src/Eccube/Resource/template/default/Cart/index.twig:281）。
- 確信度: high

### sheet-5-R151 支店PC版ナビゲーション — 実装違い／IO／P3

- 正本: sheet-5（支店PC版ナビゲーション） HTML行 2407 付近
- 正本引用: 「・以下1~6のフォーマットをメニュー表示する 1 スタンダード 2 パイオニア 3 モダン 4 レガシー 5 統率者」
- 設計期待値: フォーマットのメニュー5番目を「統率者」と表示する
- 画像確認: sheet-5_img1・img5（支店ヘッダ）とimg9・img10で カテゴリ／最新セット／スタンダード／パイオニア／モダン／レガシー／統率者／その他 のカテゴリバーを確認した
- 実装参照: `src/Eccube/Resource/template/default/Block/category_nav_pc.twig:90;src/Eccube/Resource/locale/messages.ja.yaml:6444;src/Eccube/Resource/template/default/Block/category_nav_pc.twig:96`
- 実装実態: メニュー5番目の表示文言が「コマンダー」になっている（src/Eccube/Resource/locale/messages.ja.yaml:6444、表示は src/Eccube/Resource/template/default/Block/category_nav_pc.twig:90,96）。
- 同じ実装実態でまとまる要求: sheet-5-R136（支店PC版ナビゲーション）
- 判定根拠: 項目表10-3のメニュー列挙と機能仕様★(10-3)はいずれも「統率者」、レイアウト図のカテゴリバーも「統率者」。実装の文言だけが異なる。sheet-5-R136 と同一の実装欠陥。
- 確信度: high

### sheet-6-R028 支店スマホ版ナビゲーション — 実装違い／ふるまい／P3

- 正本: sheet-6（支店スマホ版ナビゲーション） HTML行 2686 付近
- 正本引用: 「・(1)~(6)の画面上部固定エリアは、画面全体でスクロールしても常に上部に固定して表示する」
- 設計期待値: 支店スマホ版で画面を下方向にスクロールしても、支店名ロゴ・ご当地晴れる屋くん・ポイント・カードセット・商品検索テキストボックス・検索の6つが常に画面上部に見えている
- 画像確認: layout図 sheet-6_img1(支店ヘッダ: HARERUYA+支店名+ご当地晴れる屋くん+ポイント+カードセット+検索欄)、sheet-6_img3(下部固定ナビ: 通販サイト/カート/詳細検索/カテゴリ/マイページ)、sheet-6_img2(支店フッタ: サイトマップ/お得な情報/店舗ロゴ/支店名/〒/住所/GOOGLE MAP/TEL/営業時間/Copyright)を確認
- 実装参照: `src/Eccube/Resource/template/default/Block/branch_header.twig:14;html/template/default/assets/hareruya/js/hareruya-main.js:1`
- 実装実態: スマホ幅では下方向へスクロールするとヘッダ全体の固定が外れ、カードセットと商品検索テキストボックスの帯だけが画面上部に貼り付く。支店名ロゴ・ご当地晴れる屋くん・ポイントは画面外へ流れ、上方向へ50px戻したときにヘッダ全体が再び上部へ固定される
- 判定根拠: スマホ幅(max-width:1023px)でのヘッダ固定はスクロール方向で切り替わる作りになっている（html/template/default/assets/hareruya/js/hareruya-main.js:1 のスクロール処理が、下方向ではヘッダから is-fixed を外して検索帯に付け替え、上方向へ50px戻したときだけヘッダへ戻す）。PC幅(min-width:1024px)ではCSSでヘッダ自体が常時固定されるが、スマホ幅の既定は position:relative であり、支店ヘッダ（src/Eccube/Resource/template/default/Block/branch_header.twig:14）も同じ仕組みに乗る。したがって(1)〜(3)は常時上部固定にならない
- 確信度: med

### sheet-6-R154 支店スマホ版ナビゲーション — 実装違い／ふるまい／P3

- 正本: sheet-6（支店スマホ版ナビゲーション） HTML行 2855 付近
- 正本引用: 「サイトマップの導線の遷移先 サイトマップに並ぶ当サイトについて・プライバシーポリシー・特定商取引法に基づく表記・お問い合わせは、いずれも支店サイト内の画面ではなく、本店サイトの該当ページを開く。」
- 設計期待値: 支店サイトのフッタで当サイトについて／プライバシーポリシー／特定商取引法に基づく表記／お問い合わせを押すと、本店サイトの該当ページが開く
- 画像確認: layout図 sheet-6_img1(支店ヘッダ: HARERUYA+支店名+ご当地晴れる屋くん+ポイント+カードセット+検索欄)、sheet-6_img3(下部固定ナビ: 通販サイト/カート/詳細検索/カテゴリ/マイページ)、sheet-6_img2(支店フッタ: サイトマップ/お得な情報/店舗ロゴ/支店名/〒/住所/GOOGLE MAP/TEL/営業時間/Copyright)を確認
- 実装参照: `src/Eccube/Resource/template/default/Block/branch_footer.twig:26;src/Eccube/Resource/template/default/Block/branch_footer.twig:29;src/Eccube/Resource/template/default/Block/branch_footer.twig:32;src/Eccube/Resource/template/default/Block/branch_footer.twig:35`
- 実装実態: 支店フッタのサイトマップ4リンクはいずれも現在の支店を引き継いだ支店サイト配下のアドレスになっており、押しても支店サイト内の該当ページが開く。本店を指す指定は付いていない
- 判定根拠: 支店フッタのサイトマップ4リンク（src/Eccube/Resource/template/default/Block/branch_footer.twig:26 当サイトについて / src/Eccube/Resource/template/default/Block/branch_footer.twig:29 プライバシーポリシー / src/Eccube/Resource/template/default/Block/branch_footer.twig:32 特定商取引法に基づく表記 / src/Eccube/Resource/template/default/Block/branch_footer.twig:35 お問い合わせ）は、いずれも遷移先の店舗を指定していない。支店配下の画面では店舗の指定が引き継がれる作りのため（src/Eccube/EventListener/TwigInitializeListener.php:93-94、app/config/eccube/routes.yaml:20）、生成されるのは支店サイト配下のアドレスになる。同じ支店の下部固定ナビの通販サイト導線は src/Eccube/Resource/template/default/Block/bottom_nav.twig:32 で本店を明示しており、本店を指す書き方は実装側にも存在する。サイトマップ欄は正本が現行踏襲と明言している（カスタマイズ要件なし）ため、現行仕様の遷移先が要求として残る
- 確信度: med

## 掲載しなかった判定

- 実装実態が空欄の判定 4件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0302/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 7 | 0 | 0 | 0 | 7 |
| sheet-2 | 目次 | 10 | 0 | 0 | 0 | 10 |
| sheet-3 | PC版ナビゲーション | 302 | 1 | 4 | 1 | 296 |
| sheet-4 | スマホ版ナビゲーション | 205 | 2 | 2 | 3 | 198 |
| sheet-5 | 支店PC版ナビゲーション | 218 | 2 | 2 | 1 | 213 |
| sheet-6 | 支店スマホ版ナビゲーション | 160 | 0 | 2 | 2 | 156 |
| sheet-7 | 通知 | 33 | 0 | 0 | 0 | 33 |
| sheet-8 | 別添資料_通知一覧 | 26 | 0 | 0 | 0 | 26 |

