主張: 会員管理/scenario_list.md:25 の UMB-08 は、本店のEC在庫が0から1以上になれば入荷通知メールが届くとしている。
実際: ec-cube-enterprise/src/Eccube/Service/Stock/RestockNotificationMailSender.php:82-83 は、入荷通知メールの許可設定がオフなら送信せず終了する。通しシナリオ/UTH-05_フロント注文から出荷まで/scenario_list.md:147 も「システム設定の許可がオフなら送らない」とする。
判定: 事実の欠落
修正案: UMB-08の受信条件に「入荷通知メールの許可設定がオン」を加える。
