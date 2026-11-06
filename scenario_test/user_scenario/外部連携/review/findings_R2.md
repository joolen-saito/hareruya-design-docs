主張: `外部連携/scenario_list.md:99` の UEX-02 は「読者が記事ページを開く」を起点にしながら、記事保存時の通知を L3 に含めている。
実際: `ec-cube-enterprise/src/Eccube/Controller/App/ArticleController.php:42,46-49,53-60` は「記事保存のたび」の POST と、投稿 ID による記事取得の GET を別の契機として記す。`hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:11` は L2 を一つの起点イベントから業務完了までと定める。
判定: 切り方の誤り
修正案: 記事保存の通知を独立した L2 にし、保存時に整数 1 が返って記事サイトの保存が続くことを終点にする。

主張: `外部連携/scenario_list.md:103` の UEX-06 は、デッキの削除・複製とアーキタイプ CSV 取込を一つのシナリオにしている。
実際: `hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:1693-1696` はデッキ編集からの複製・削除を、同ファイル`:2297-2299` は「取込ファイル1件」を起点とするアーキタイプ登録を記す。両者は起点も完了結果も異なる。
判定: 切り方の誤り
修正案: アーキタイプ CSV 取込を別の L2 に分け、記事の紐付けが上書きされない結果まで扱う。

主張: `matrix_UEX-07/prohibitions.tsv:2-3` の X1・X2 は、閲覧用トークンを持つ人と公開・非公開デッキの組を禁じている。
実際: `hareruya-design-docs/excel_to_html/output/0515_基本設計仕様書(API_デッキビルダー).html:582` は更新時に公開範囲を選べると記す。`ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:94-110,118-119` は更新時に既存の閲覧用トークンを保持する。限定公開時に案内を受けた人は、その後に公開・非公開へ変更されたデッキのトークンを持ち続けられる。
判定: 禁則の誤り
修正案: X1・X2 を外し、公開範囲の変更後に古い案内から開く組を残す。

主張: `matrix_UEX-07/prohibitions.tsv:4` の X3 は、閲覧用トークンを持つ人が公開検索を使う組を禁じている。
実際: `hareruya-design-docs/excel_to_html/output/0515_基本設計仕様書(API_デッキビルダー).html:654` は公開検索を「認証不要」とし、対象を公開デッキとする。トークンを検索に使わないことは、検索できない理由にならない。
判定: 禁則の誤り
修正案: X3 を外し、案内を受けた人の公開検索では限定公開デッキが結果に出ないことを確かめる。

主張: `matrix_UEX-15/exceptions.tsv:6` の EX5 は、印刷結果に見つからない受注が混じれば「ほかの受注は更新される」とし、`matrix.md:30` では印刷失敗の T05 に差し込んでいる。
実際: `ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:80-100` は各結果の失敗を先に判定して更新せず、成功した結果についてだけ受注を探して更新する。T05 の残りの結果も失敗なら更新されない。
判定: 事実の誤り
修正案: EX5 の差し込み先を成功の行にするか、ほかの受注の印刷結果が成功であることを例外条件に加える。

主張: `外部連携/scenario_list.md:113` の UEX-16 は、店頭注文番号が未採番なら印刷欄を空欄にすると期待するが、設計書との食い違いにはこの点が無い。
実際: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1188` は「店頭注文番号が採番されていないときは空欄」と記す。一方、`ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1845-1849,1907-1911` は本店・支店とも未採番の受注を印刷対象から除く。
判定: 事実の欠落
修正案: 空欄印刷という設計上の期待値は残し、新実装ではその受注が印刷対象にならない食い違いを記録する。

主張: `外部連携/scenario_list.md:57` は、管理画面でデッキビルダーのユーザ作成デッキを探す処理を UDK-03 に割り当てている。
実際: `hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:1102` は「ユーザ作成のデッキは検索結果に表示しない」と定める。`hareruya-design-docs/scenario_test/user_scenario/デッキ登録/scenario_list.md:18` の UDK-03 が探すのは大会後の入賞者の提出デッキである。
判定: 事実の誤り
修正案: この行の「ユーザ作成デッキを探す」と UDK-03 の割当てを撤回し、検索結果に出ない条件として扱う。

主張: `外部連携/scenario_list.md:58` は、フロントのメタゲーム・採用枚数ランキングを UDK-01・UDK-03・UDK-04 で確かめる行としている。
実際: `hareruya-design-docs/scenario_test/user_scenario/デッキ登録/scenario_list.md:36` は「閲覧機能そのものは結合テストで確かめる」と明記し、既存 ID の終点は公開デッキや直近大会の表示に限る。`hareruya-design-docs/excel_to_html/output/0309_基本設計仕様書(フロント_デッキ検索).html:359,390` にはメタゲーム一覧と採用枚数ランキングが別機能としてある。
判定: 事実の誤り
修正案: この行で既存 ID が確かめる範囲を公開デッキと直近大会の表示に絞り、メタゲーム一覧・採用枚数ランキングの割当てを訂正する。

主張: `matrix_UEX-15/fl_table.tsv:7` の B2 はスムーズ店頭受取の支払方法を「クレジットカード決済・支払いなし」だけと記す。
実際: `hareruya-design-docs/scenario_test/user_scenario/店頭受取受注管理/scenario_list.md:113` は登録済みクレジットカード決済もスムーズ店頭受取に結び付くと記す。`ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1855-1859,1873` の印刷対象にも通常と登録済みの両クレジット決済が含まれる。
判定: 事実の欠落
修正案: B2 の水準名に登録済みクレジットカード決済を含め、同じ印刷処理を通ることを明示する。
