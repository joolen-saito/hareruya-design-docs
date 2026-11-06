主張: `matrix_UEV-01/matrix.md:18,22,24` のT06・T10・T12は、非公開または限定公開の親イベントと、親から引き継いだ「公開」の繰返日程を組み合わせている。`prohibitions.tsv` に禁則はない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html:1882`「作成した日程の…公開状態…には、親イベントの値をそのまま設定する。繰り返し日程登録の入力項目には、これらの項目は無い。」
判定: 禁則の誤り
修正案: 親の公開状態と異なる状態を「引き継ぐ」繰返日程の行を禁じ、後から日程を編集する場合は別の条件として明記する。

主張: `scenario_list.md:22` のUEV-07は「登録済みデッキの編集」をL3に含める一方、起点を「申込済みでデッキ未登録」の会員に限っている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3027`「イベントのデッキを登録されている場合は『デッキ編集』、未登録の場合は『デッキ登録』と表示する。」
判定: 事実の欠落
修正案: UEV-07に、デッキ登録済みの会員が「デッキ編集」から編集を完了する経路を加える。

主張: `scenario_list.md:22` のUEV-07は、一覧のボタンが出ない例外を締切超過と「デッキ登録を終了する」の二つだけとしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3006-3010`「開催日の23:59:59を過ぎたイベントは…『イベント終了』」「ステータスが『イベント終了』」の場合もデッキ登録・編集を表示しない。
判定: 事実の欠落
修正案: UEV-07の一覧から登録・編集できない条件に「イベント終了」を加える。

主張: `matrix_UEV-06/exceptions.tsv:3` のEX2と`README.md:20`は、プレイヤーを特定できなければ「何も登録せず」200を返すことを新実装の挙動としている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterRelayService.php:75,111-113` は先にスマレジへポイント加算を送り、その後にECへの反映を呼ぶ。`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:58-66` ではプレイヤー不明時にECへの反映だけを省く。設計書は `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0517_基本設計仕様書(API_その他).html:1759`「何も登録せずレスポンス200を返す」。
判定: 事実の誤り
修正案: EX2の新実装での期待値をスマレジへの加算とECへの未反映に分け、設計書との食い違いを記録する。

主張: `matrix_UEV-06/exceptions.tsv:4` のEX3は、スマレジ連携が失敗して400を返せば「ポイントは反映されない」と断定している。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterRelayService.php:116-121` は、タイムアウト・通信断・5xxではスマレジ側で「適用済みだった場合」があり、結果を自動判定できないとしている。
判定: 事実の誤り
修正案: EX3の期待値を、明確な未適用と反映結果が不明な失敗とで分ける。
