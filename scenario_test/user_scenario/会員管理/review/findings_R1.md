主張: `matrix_UMB-22/prohibitions.tsv:2-3` の P1・P2 は、許可外IP（B2）と制限画面・注文画面（C2・C3）の組を、通常会員（A3）にも禁じている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/IpCheckSubscriber.php:50-51` は、通常会員ならIP照合前に処理を終える。設計書 `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:5067` も即時ログアウトの対象を「本店・各支店の店頭PCアカウント」とする。
判定: 禁則の誤り
修正案: P1・P2は店頭PC用アカウントにだけ適用し、通常会員のB2×C2・B2×C3をマトリクスに残す。

主張: `matrix_UMB-03/prohibitions.tsv:2-7` の P1〜P6 は、ログインに失敗する条件では「保持を選ぶ」（E2）や「マイページから誘導された」（F2）組を禁じている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1735` はログイン画面に「保持の選択欄を表示する」と定め、同ファイル `:1739` は遷移先の指定を定める。どちらも認証成功前に成立する条件で、失敗時にも選択や誘導は起こりうる。
判定: 禁則の誤り
修正案: P1〜P6を外し、失敗時は保持や遷移の効果が発生しない期待値にする。

主張: `matrix_UMB-14/exceptions.tsv:5` の E4 は、差し込み先をイベントのキャンセル申込（A5）とし、手順を「送信したあとで」としながら、キャンセル申込ではない件名で送信した結果を期待している（`matrix.md:21,37` の T09）。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4650` は「イベントキャンセル以外で送信したときは、イベント関連の入力値を消してから送信する」と定める。T09の件名のままでは、その分岐を通らない。
判定: 事実の誤り
修正案: E4はキャンセル申込以外の件名で送信する行に差し込み、送信前にイベント関連の入力値を用意する。

主張: `matrix_UMB-11/exceptions.tsv:5` の E4 は差し込み条件が空欄で、生成結果 `matrix.md:33` は住所変更だけの T04 にスマレジ更新失敗を差し込んでいる。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/ChangeController.php:177-185` は「スマレジ連携対象（氏名・カナ・電話番号）」の変更とスマレジIDの存在を更新条件にしている。住所だけを変える T04 では更新失敗を発生させられない。
判定: 事実の誤り
修正案: E4の差し込み条件に氏名・カナ・電話番号の変更とスマレジIDの存在を指定し、条件を満たす行に割り当てる。

主張: `matrix_UMB-22/exceptions.tsv:4` の E3 は差し込み条件を A1・B1 だけとし、生成結果 `matrix.md:30` では制限画面を開く T01（`matrix.md:13`）に注文手続きと番号採番を差し込んでいる。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:5072` は「ご注文方法指定画面で注文者情報を非表示」と定める。この期待値を確かめるには、開く画面が注文手続き（C3）である必要がある。
判定: 事実の誤り
修正案: E3の条件にC3を加え、注文手続きのT03へ差し込む。

主張: `matrix_UMB-22/exceptions.tsv:3` の E2 は、商品詳細の通知・お気に入りボタン非表示を店内アカウント（A1）だけで確かめ、支店用店内アカウント（A2）を含めていない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:5109` は対象を「本店・各支店の店頭PCアカウント」と定める。`matrix_UMB-22/matrix.md:29` の差し込み先もA1のT03だけである。
判定: 事実の欠落
修正案: A2の許可IPから商品詳細を開く行にも、両ボタンの非表示を差し込む。
