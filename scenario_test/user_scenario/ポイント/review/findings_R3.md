主張: `ポイント/scenario_list.md:74` の UPT-03 は、通常のレジ取引で受注が「（スマレジの取引から新規）→出荷完了」を通るとしている。
実際: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:324-331` は「新規受注は『出荷完了』で作成する」。持ち込んだ既存受注は `EccubeOtcPatternHandler.php:118-120` で「引き渡し済み」に更新する。
判定: 事実の誤り
修正案: UPT-03の状態欄を、新規受注は出荷完了で作成、持ち込んだ既存受注は引き渡し済みへ更新、と分ける。

主張: `ポイント/matrix_UPT-03/prohibitions.tsv:6-11` の X5・X6・X9・X10 は、ポイント専用取引と「使用だけ」「使用と付与の両方」の組を禁じている。
実際: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:209-222` は「レジ利用分が `spendPoint` に乗る形式にも備え、両者の差分（純増減）で判定する」とし、取引区分6・7の両方で使用ポイントを計算に入れる。
判定: 禁則の誤り
修正案: 使用ポイントが届く組を禁則から外し、純増減に応じた期待値をマトリクスに入れる。

主張: `ポイント/scenario_list.md:34` は英語サイトでの付与を UPM-05 だけに割り当て、「UPM-05のポイントの因子で確かめる」としている。
実際: `商品管理から注文確認メールまで/scenario_list.md:35` の UPM-05 は購入から注文確認メールまでで終わる。`matrix_UPM-05/fl_table.tsv:10-12` のポイント因子は「ためる・一部を使う・全額をポイントで払う」であり、出荷後の付与額と付与時点を確かめる条件はない。
判定: 事実の欠落
修正案: 英語サイトの注文をUPT-01の出荷完了につなぎ、付与額と付与時点を確かめる経路として記載する。
