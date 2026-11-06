主張: L4 `UTH-05_*.md:41` は、欠品カードの在庫を0にする承認が済むまで「在庫は変わらない」とする。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:1678,1692-1693` の「在庫編集」では、承認状態を「未承認」で登録し、廃棄区分の在庫をロックするため「減算し登録する」。減算は承認前の登録処理で行う。
判定: 事実の誤り
修正案: 欠品カードの在庫は登録時に減り、承認時に承認状態を確かめる期待値に直す。

主張: L4 `UTH-05_*.md:74,76` の代表行T27は、カードDを1点欠品登録した後も、購入後の在庫3点が変わらないとして終える。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/12_在庫管理.md:241-244` の欠品対応8-3は「対象カードの通販在庫がある場合は在庫を一時的に0にし」「在庫を0にする場合は承認が必要」とする。T27には欠品登録後も通販在庫3点が残る。
判定: 事実の欠落
修正案: T27にも通販在庫を一時的に0にする操作と、その結果の確認を加える。

主張: `matrix_UTH-05/exceptions.tsv:20` のEX19は、郵便振替の5日後の案内で「受注の状態は出荷指示のまま変わらない」とし、`matrix.md:80` でF2のT14に差し込む。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:33` のUTS-18は、未入金受注の通る状態を「入金待ち／注文受領／出荷指示（未入金のまま。変わらない）」とする。`matrix.md:27` のT14は入金確認後に出荷準備するF2なので、案内時点では「注文受領」である。業務フロー `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md:129` も5日後の対応を定める。
判定: 事実の誤り
修正案: EX19のT14での期待状態を「注文受領のまま」に直し、F3に差し込む場合だけ「出荷指示のまま」とする。

主張: `scenario_list.md:32` のUTH-05は、L3を「44行と例外17件」とする。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通しシナリオ/UTH-05_フロント注文から出荷まで/matrix_UTH-05/matrix.md:5` は「テスト数: 43」と記す。同フォルダの `exceptions.tsv:2-26` にはEX1〜EX25の25件がある。
判定: 事実の誤り
修正案: UTH-05のL3欄を43行・例外25件に直す。
