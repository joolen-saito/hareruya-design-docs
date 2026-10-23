# レビュー依頼: 結合テストケースの「実在しない試験用URL（example.test）」の置き換え

あなたはレビュアー。著者が見落とした誤りを、実ソースで確かめて指摘する。読み取りだけ。ファイルは書き換えない。

## 依頼者の決定（2026-10-21。これは前提であり、是非は指摘対象外）

- 結合テストケースに `https://example.test/...` のような実在しないURLが書かれている。値そのものはテストに必要なので消さない。
- カード画像のURL（カード登録CSVの「画像URL(日本語)」「画像URL(英語)」、DBに直接入れるカード画像、APIが返すカード画像URL）は、
  設計書の記入例と同じ形の相対パス `img/goods/<元のパス>` にする。M14-04 の1件だけ `img/m1404/029-1.jpg`（同じシードの2行目 `img/m1404/029-2.jpg` に揃える）。
- それ以外（バナー画像URL・リンク先URL、帯URL、GOOGLE MAP URL、デッキの出典URL・引用元URL、記事URL、サイトマップの配信の基点など）は
  検証用ドメイン `https://replace-dev.hareruyamtg.com:8443` にする。サブドメインはパスの先頭へ移す。
- スマレジの接続先（`smaregi-*.example.test`）は外部システムなので変えない。メールアドレス（`…@example.test`）は変えない。
- `example.com`・`example.invalid`・`before.example` など example.test 以外のドメインは今回の対象外（指摘しない）。

## 見てほしいもの

1. 置き換え規則: `/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/dummy_url/urlmap.py`
2. 当てた結果（セル単位の変更前・変更後 521セル）: `/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/dummy_url/review/changes.tsv`
3. パイプラインの変更（`git -C /home/y-saito/Developments/hareruya-design-docs diff -- integration_test/casegen/<path>` で差分が見られる）:
   `integration_test/casegen/dummy_url/apply.py`（新規。最後に当てる段）、
   `datapattern/conflicts/apply_rulings.py`、`product_csv/apply.py`、`runnable/apply.py`、`seed_screen/apply.py`、`precond/gate_precond.py`

## 正本

- 設計書（HTML）: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/`。機能ごとの写しは
  `/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/datapattern/units/<機能ID>/design.txt`（行番号 L0001…）。
- 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/`（例: カード登録CSV `Eccube/Service/Csv/CardCsv.php`、
  カード検索API `Eccube/Repository/Master/MtbCardRepository.php`、店舗登録 `Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php`）。

## 重点観点

A. 分類の誤り: カード画像なのに検証用ドメインにしたもの、カード画像でない（バナー・リンク等）のに相対パスにしたもの。
B. 入力チェック・保存先との衝突: 置き換え後の値が、その項目の入力チェック（URL形式、最大文字数、禁止ドメイン「admin.hareruyamtg.com」等）や
   DBの列の長さで弾かれて、ケースが書かれたとおりに実行できなくなるもの。実装（Form の制約・Entity の length）で確かめる。
C. 期待結果の食い違い: 実装がURLを加工して返す・表示する（ホストを前に付ける、相対パスを絶対URLに直す等）ために、
   置き換え後の期待結果が実際の出力と合わなくなるもの。特に A14-03・A15-12 のAPI応答、B16-09 のサイトマップ（配信の基点＋登録値の組み立て）。
D. 文字数の境界値: 「https://replace-dev.hareruyamtg.com:8443/」（41文字）に a を連結した合計字数が、ケースが言う字数（128・129・255・256）と合うか。
   ほかに、URLの長さに依存するのに直していないケースが残っていないか。
E. 区別の崩れ: 置き換え前は別のURLだったものが、置き換え後に同じ値になってケースの意味（見分け・一意性）が崩れたもの。
F. パイプライン: 変更したスクリプトで、流し直し（merge → seed_screen/apply.py → apply_rulings.py → exclude_open.py → exclude_scope.py →
   build_all_test_cases.py → precond/gate_precond.py --all）が止まる・結果が揺れる・関係ないケースの文を変える経路。
   著者は seed_screen から2回流して同じ結果に収束すること、変更前（HEAD）との差分がすべて urlmap.N で説明できること、
   gate_precond --all と datapattern/gate_dp.py の合格を確かめている。

## 対象外（指摘しない）

- 依頼者の決定そのもの（相対パスにするか、検証用ドメインにするか、対象を example.test に限ること）。
- 置き換えと関係のない既存ケースの内容。
- 文章の言い回し・体裁の好み。

## 出力形式

指摘が無ければ `NONE` の1語だけを出す。指摘があれば1件ずつ次の形で書く。

```
主張: （何が誤りか。1文）
実際: （根拠。file:line または changes.tsv の該当行のID・列）
判定: 事実の誤り / 実行できない / 期待結果の食い違い / パイプラインの不具合 / その他
修正案: （1文）
```
