主張: `UPM-03_本店と支店の公開状態を切り替え支店で買い注文確認メールが届く.md:36-38` は、終点であるメール受領の後に、支店を再び非公開にする手順13・14を置いている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:11` は「シナリオ1本（L2）は『起点の業務イベントから、業務として完了した状態になるまで』」と定める。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md:230` にも「注文完了メール受領」がある。
判定: 切り方の誤り
修正案: 支店を非公開に戻す確認は購入前に移し、再公開してから購入してメール受領を終点にする。

主張: `scenario_list.md:139` は、国内のお届け先を英語サイトで買うR2と海外のお届け先を日本語サイトで買うF2について、注文確認メールの言語を「判断待ち」として合否を付けない。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:462-467` は購入ロケールが `ja` なら日本語、それ以外なら英語のテンプレートを選ぶ。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:76` は、実装を見ても決まらないものだけを「判断待ち」とする。
判定: 事実の欠落
修正案: 通常の購入ではR2を英語、F2を日本語のメールとして期待値を定め、設計書に規定がない点は食い違いとして残す。

主張: `matrix_UPM-05/README.md:25` と `scenario_list.md:116` は、英語メールの税額付き本文を「国内のお届け先」で選ぶとしている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:478-481` は「`$Order->getCountry()->isJapan()`」で判定し、`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:350-365` は受注へ会員情報をコピーする。`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_credit.en.twig:6-9` はその判定で税額付き本文を切り替える。判定対象はお届け先の国ではない。
判定: 事実の誤り
修正案: 税額付き本文の条件を「受注にコピーされた会員の国が日本、かつ英語サイトで購入」に直す。
