主張: `scenario_list.md:17` の UDK-02 と `matrix_UDK-02/README.md:16` は、上書き提出後もデッキを「非公開で保存」とする。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/DeckEntryAction.php:57-62` は、既存デッキではカードリストだけを更新する。公開状態を非公開に設定するのは同ファイル `:63-84` の新規作成時だけであり、公開済みデッキへの上書きは公開状態を維持する。
判定: 事実の誤り
修正案: 非公開になるのは初回提出時に限り、上書き時は既存の公開状態を維持すると書く。

主張: `matrix_UDK-01/matrix.md:16,21` の T04・T09 は、CSV取り込み（C2）と「イベント検索から日程を選ぶ」（D2）を組み合わせ、禁則表には禁則がない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:1523` の「イベント検索のポップアップを表示」はデッキ編集画面のボタンである。CSV側は同ファイル `:1826` に「イベント詳細ID」の入力欄がある。
判定: 禁則の誤り
修正案: D2を登録方法ごとに実行可能な操作へ書き分けるか、C2と現行のD2の組を禁則にする。

主張: `scenario_list.md:18` の UDK-03 は「公開する」シナリオだが、`matrix_UDK-03/matrix.md:15-16` の T03・T04 は非公開のまま終わる。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/18_デッキ登録.md:37` は工程2-2を「デッキ公開」とする。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/scenario/SCN-DECK-オンライン入力された-002_オンライン入力されたデッキリストの公開（原典実線の代表経路）.md:13` も、最終業務状態を「公開状態で確認できること」とする。
判定: 切り方の誤り
修正案: 非公開のままの更新を「公開完了」の正常行から外し、中断・保留として扱う。

主張: `scenario_list.md:90` は、旧シナリオ007の「登録内容の誤りを顧客確認して訂正」を UDK-03 の EX4 で扱ったとするが、`matrix_UDK-03/exceptions.tsv:5` の EX4 はカード行を書式不正にして更新エラーを起こす。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/scenario/SCN-DECK-オンライン入力された-007_オンライン入力されたデッキリストの公開（登録内容の誤りを顧客確認して訂正）.md:69-70` は、書式上は登録できた誤カード「59 Plains／1 Island」を顧客回答に従い「60 Plains」へ訂正して公開する経路である。
判定: 事実の欠落
修正案: 登録済みのカード内容が実際のデッキと異なる場合に、顧客確認後、同じデッキを訂正して公開するバリエーションを加える。

主張: `scenario_list.md:52` は、UDK-01 が「デッキリスト 非公開→公開」の遷移を通るとする。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/18_デッキ登録.md:31` は工程1-4を「デッキを登録する」とし、`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:1452` も「デッキの新規登録」と「登録済みデッキの内容変更」を区別している。UDK-01 の公開行は新規作成であり、保存済みの非公開状態からの変更ではない。
判定: 事実の誤り
修正案: UDK-01 の遷移を「デッキなし→デッキリスト公開」とし、「非公開→公開」は UDK-03 のみに割り当てる。
