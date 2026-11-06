主張: `matrix_UOR-01/matrix.md:17` のT05は「カード（2つ以上の状態をまとめてカートに追加）」と「1点」を組み合わせている。`prohibitions.tsv:1-7` にD2・E1の禁則がない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:1329` は「数量が1以上のものを全てカートに追加」とする。2つ以上の状態を追加すれば合計は最低2点になる。
判定: 禁則の誤り
修正案: D2・E1を禁則に加え、T05を含むマトリクスを再生成する。

主張: `matrix_UOR-01/exceptions.tsv:8` のE7は、空の買い物かごの例外を「買い物かごを開くとき」に差し込む。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1298` の「ご注文方法指定」シートは「カート内に商品がない場合はエラーとして買い物かご画面へ遷移する」とする。
判定: 事実の誤り
修正案: E7の差し込み手順を、空のカートから「ご注文方法指定」へ進むときに直す。

主張: `matrix_UOR-01/exceptions.tsv:2` のE1の期待値は、在庫不足の文言と購入完了画面が出ないことを記すが、遷移先を記さない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2080` は、購入前の在庫チェックでエラーなら「カート内の商品そのままの状態でシステムエラーの画面へ遷移する」とする。
判定: 事実の欠落
修正案: E1の期待値に、カートの商品を保持してエラー画面へ遷移する結果を加える。

主張: `scenario_list.md:17,22` のUOR-02・07は、店頭受取同士のまとめ受け取りや「ついで買い」を挙げるが、店頭受取の受注と店頭PCの受注を同時決済する経路を挙げない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1546-1550` の「複数受注購入パターン」は「店頭受取の会員が店頭PC購入でついで買いをする」を例示し、既存の受注を全て「引き渡し済み」にして統合した新規受注を作る。
判定: 事実の欠落
修正案: 店頭受取と店頭PCの受注を同時に引き渡す組み合わせをL3に明記し、両方の元受注と統合後の受注を確認対象にする。

主張: `scenario_list.md:46` は、店頭注文番号の毎日0時の初期化を「業務フロー05に工程が無い」として対象外にし、結合テストへ回している。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1325-1328` は「本店＋支店の店頭受取番号を削除する」「毎日0時」と定める。`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/TruncateWaitingNumberAction.php:40-41` にも番号と採番カウンタの初期化処理がある。
判定: 事実の欠落
修正案: 翌日の番号初期化を独立したL2に入れ、番号と採番カウンタが初期化される結果を終点にする。
