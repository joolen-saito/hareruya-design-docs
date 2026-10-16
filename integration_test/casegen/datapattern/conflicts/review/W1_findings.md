### 指摘（C02 / IT-A17-04-018）
- 主張: 修正後の出典は「現行仕様 業務ロジック 取得対象」。
- 実際: 言語コードを商品名の先頭に付ける原文は [prov/A17-04.tsv](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/datapattern/conflicts/prov/A17-04.tsv:156) の埋め込み L0155「カード商品のときは、商品名の先頭に言語コードを付す」。[ケース](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/A17-04_test_cases.tsv:17) の出典欄が示す「取得対象」の節とは別の「カード商品の扱い」の節にある。
- 判定: 直しの誤り
- 修正案: 出典欄に「現行仕様 業務ロジック カード商品の扱い」を記す。

### 指摘（C31-1 / IT-M04-23-055）
- 主張: 裁定は「混在する3つ目のCSVを手順から外す」。
- 実際: [ケース](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/M04-23_test_cases.tsv:54) の手順は2ファイルだけになったが、事前準備は「3個の専用CSVを配置する」のまま。[シード](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/M04-23_seed_data.tsv:50) の投入方法⑥も、使わない `split_partial_source-055.csv` を作成する。
- 判定: 直しの誤り
- 修正案: 事前準備とシードの投入方法から、3つ目のCSVの作成・配置を外す。

### 指摘（C31-1 / QD-M04-23-01）
- 主張: 問いは、分割元商品コード・分割数が空の行を「前の行に続く分割先として有効ですか」と未決事項にしている。
- 実際: [prov/M04-23.tsv](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/datapattern/conflicts/prov/M04-23.tsv:65) の Excel L0064・L0065 は両列を「必須」とする。継続行を許す記述は同機能の原文にない。[questions.tsv](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/datapattern/conflicts/questions.tsv:8) の前段にある、正常行とエラー行が混在した場合の扱いとは別の論点である。
- 判定: 問いの誤り
- 修正案: 空欄行についての後段をこの問いから外し、正常行とエラー行が混在した場合の扱いだけを問う。

### 指摘（C49 / IT-M15-06-029）
- 主張: 裁定は「規則1」により、HTML未埋め込みの機能設計書を採らないとしている。
- 実際: [prov/M15-06.tsv](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/datapattern/conflicts/prov/M15-06.tsv:40) の L0039 は Excel 由来で、この機能の prov に埋め込み行はない。[merged.tsv](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/datapattern/conflicts/merged.tsv:67) も比較先を HTML に未埋め込みの `.md` と明記する。規則1が定めるのは Excel 由来本文と埋め込み現行仕様の優先関係である。
- 判定: 規則の当てはめの誤り
- 修正案: 「規則1で外部の `.md` より Excel を優先した」という裁定理由を撤回する。ケースの期待結果は、HTML内の Excel L0039・L0093を根拠として説明する。
