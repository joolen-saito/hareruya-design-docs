### 指摘1（IT-A07-07-003、IT-A07-07-004）
- 主張: `saleFlg`が文字列「true」／「false」で返る。
- 実際: HTML設計書も文字列としているが、実装では`boolean`型の`boiip.saleFlg`をそのまま取得するため、JSONでは真偽値になる（`A07-07_requirements.tsv:26`、`DtbBuyOrderIndivisualInputProduct.orm.yml:41-43`、`DtbBuyOrderIndivisualInputProductRepository.php:19-30`）。
- 判定: 設計書の誤り
- 修正案: `saleFlg`の型を真偽値へ訂正する。ケースの期待値も引用符のない`true`／`false`に直す。

### 指摘2（IT-A07-07-011）
- 主張: eeの認証トークン生成機能へ利用者ID 970707999を渡せば、pf-apiに対して署名が正しく管理者だけが存在しないトークンを用意できる。
- 実際: eeの現行生成機能は利用者IDを`sub`へ格納するが、pf-apiは`aud`を管理者IDとして参照する（`A07-07_mb_seed_data.tsv:4`、`ec-cube-enterprise/src/Eccube/Security/AccessToken/JwtTokenService.php:78-96`、`pf-api/src/Controller/BaseController.php:31-41`）。このままでは「管理者なし」以外の理由で拒否される。
- 判定: 成立しない前提・手順
- 修正案: pf-apiと同じ秘密値・形式で、`aud=970707999`を持つHS256トークンを生成する手順を明記する。事前にpf-apiで署名検証と`aud`取得が成功することも確認する。

### 指摘3（IT-A07-07-010）
- 主張: JWTの末尾1文字を「AならB、それ以外ならA」にすれば署名が必ず不正になる。
- 実際: HS256署名は32バイトを43文字のBase64URLで表すため、末尾文字にはパディング相当の未使用ビットがある。末尾がAのときA→Bは復号後の署名バイトを変えず、`JWT::decode`を通過し得る（`A07-07_mb_test_cases.tsv:11`、`pf-api/src/Controller/BaseController.php:29-33`、`pf-api/composer.lock:1613-1618`）。
- 判定: 成立しない前提・手順
- 修正案: 署名部分の先頭など、全ビットが有効な位置を変更する。変更前後の復号済み署名が異なることを保証する。

### 指摘4（A07-07）
- 主張: `ids`欠落時は根拠にふるまいがないためケースを書かない。
- 実際: HTML設計書は`ids`を必須としている一方、実装には必須検証がなく、取得値を直ちに`explode`して検索へ渡す（`A07-07_requirements.tsv:13`、`BuyOrderIndivisualInputProductController.php:23-27`）。したがって現行実装は欠落時にも抽出処理を実行する。
- 判定: 設計書の誤り
- 修正案: 設計書へ現行の欠落時動作を明記するか、必須違反として拒否する仕様へ改める。その確定後にIT-0214の要否を決める。

### 指摘5（IT-A07-07-001）
- 主張: HTTP 200とJSON配列を確認すればIT-0215を満たす。
- 実際: IT-0215はContent-Typeも判定対象だが、001にも003にもレスポンスヘッダの確認がない（`viewpoints_canonical.tsv:216`、`A07-07_mb_test_cases.tsv:2,4`）。実装はJSON形式を設定している（`pf-api/config/packages/fos_rest.yaml:6-15`）。
- 判定: 取りこぼし
- 修正案: 001で`Content-Type`がJSON用の値であることも確認する。

### 指摘6（IT-A07-07-001）
- 主張: REQ-R004のプロトコルHTTPを001で確認している。
- 実際: 要求はHTTPを指定しているが、手順は相対パス`/api/admin/...`を使うだけで、トップページのスキームもNetworkでの確認項目も定めていない（`A07-07_requirements.tsv:5`、`A07-07_mb_test_cases.tsv:2`）。それにもかかわらず報告書はR002〜R005を001で網羅したとしている（`report.md:9`）。
- 判定: 取りこぼし
- 修正案: HTTPで開いた試験URLを明示し、Networkで要求URLのスキームも確認する。

### 指摘7（IT-A07-07-006）
- 主張: IT-0011のケースで「HTTPステータスが200」と商品1件だけが返ることを同時に期待している。
- 実際: IT-0011は期待レコード件数の判定であり、HTTPステータスはIT-0215側の判定である（`viewpoints_canonical.tsv:12,216`）。ケースの要求IDにもR016がない一方、報告書は006をR016のケースとしている（`A07-07_mb_test_cases.tsv:7`、`report.md:12`）。
- 判定: 判定IDの誤り
- 修正案: 006からHTTP 200の期待を外し、該当商品1件だけが返る判定に限定する。報告書のR016対応から006も外す。

### 指摘8（IT-A07-07-012）
- 主張: IT-0080のケースでHTTP 200とDB非更新を同時に期待している。
- 実際: IT-0080の判定対象は参照処理による非更新であり、HTTPステータスではない（`viewpoints_canonical.tsv:81`）。ケースの要求IDにもR016がない一方、報告書は012をR016のケースとしている（`A07-07_mb_test_cases.tsv:13`、`report.md:12`）。
- 判定: 判定IDの誤り
- 修正案: 012は実行前後のDB不変だけを期待結果にする。HTTP 200は既存のIT-0215ケースへ任せ、報告書のR016対応も訂正する。
