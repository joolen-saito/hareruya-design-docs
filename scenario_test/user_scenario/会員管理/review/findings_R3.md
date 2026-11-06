主張: `matrix_UMB-03/exceptions.tsv:3` の E2 は差し込み条件が空で、`matrix.md:29` では誤ったパスワードでログインに失敗する T02 に「ログイン済みの状態で」行う確認を割り当てている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1670` は「ログイン状態で本画面のURLにアクセスすると、マイページ画面へ遷移する」と定める。T02 の失敗後はこの前提を満たさない。
判定: 事実の誤り
修正案: E2 の差し込み条件にログインが成立する水準を指定し、成立する行へ割り当てる。

主張: `scenario_list.md:22` の UMB-05 は再設定画面に入力するメールアドレスが別会員のものの場合を扱わず、`scenario_list.md:171-185` の設計書との食い違いにも記録がない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2023` は「別の会員のメールアドレスを入力しても、リセットキーの会員のパスワードが更新される」とする。一方、新実装の `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Views/RegisterCustomerViewRepository.php:151-154` は入力メールアドレスの一致を検索条件に加え、一致しなければ更新しない。
判定: 事実の欠落
修正案: UMB-05 にメールアドレス不一致の分岐を加え、設計書と新実装で結果が異なることを記録する。

主張: `scenario_list.md:22-23` は UMB-05 で再発行メールの送信からURLを使った再設定までを1本とし、別の UMB-06 は期限切れだけを扱う。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1839-1840` は「有効時間:24時間」のリセットキーを保存してURLをメール送信し、同ファイル`:1887-1892` は後にURLを開いてキーと期限を確認する処理を定める。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:11-14` は、日をまたいでシステムの状態が待つ後日の処理を別の1本にする決まりである。
判定: 切り方の誤り
修正案: キー発行とメール送信を終点とするシナリオと、有効なURLから再設定するシナリオを分ける。

主張: `scenario_list.md:129-148` の「状態の遷移の網羅」には、本人確認の「未確認→簡易書留確認済み」と「確認中→未確認」がない。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ネット買取/scenario_list.md:73` は「未確認→簡易書留確認済み | UNK-07」、同ファイル`:75` は「確認中→未確認（再申請後に有効期限が残っていて、2週間前になった） | UNK-14」と記載する。
判定: 事実の欠落
修正案: 2つの遷移と、それぞれを通る UNK-07・UNK-14 を網羅表に加える。
