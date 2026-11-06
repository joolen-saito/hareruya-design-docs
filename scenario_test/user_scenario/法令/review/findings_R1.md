主張: `通販/legal_check.md:25`（LC-03）と`店頭受取受注管理/legal_check.md:33`（LO-03）は、商品金額合計・送料・支払総額を確認するが、個々の商品の販売価格を確認項目に入れていない。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/外部資料観点/evidence.tsv:482` は「個々の商品の販売価格に加えて支払総額についても併せて表示」とする。設計書 `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1500` の4-4は「合計（税込）」であり、単価の定めはない。
判定: 事実の欠落
修正案: 両項目に個々の商品の販売価格の表示確認を加え、期待値は設計書の不足として扱う。

主張: `通販/legal_check.md:29`（LC-07）と`店頭受取受注管理/legal_check.md:36`（LO-06）は、申込みの撤回・解除について条件と方法を確認するが、効果を確認しない。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/外部資料観点/evidence.tsv:487` は「その条件、方法、効果等について表示する必要がある」とする。
判定: 事実の欠落
修正案: 撤回・解除の効果も表示の有無を記録する項目に加え、設計書に定めがなければ不足として記録する。

主張: `通販/legal_check.md:36`（LC-14）と`通販/scenario_list.md:96`は、本店フッターの根拠を設計書0302の「13-3」とする。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html:2549` の13-3は「支店PC版ナビゲーション」の項目。本店PC版の該当項目は同ファイル`:1498` の25-3「特定商取引法表示」である。
判定: 事実の誤り
修正案: 本店の根拠をPC版25-3に直し、支店版13-3と区別する。

主張: `店頭受取受注管理/scenario_list.md:76`（LO-03）は、新実装の支店表示を「合計のみ」とする。
実際: 設計書 `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1715` は「注文金額合計（税込）のみを表示する」とする。一方、新実装 `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:833`〜`:840` は、合計額に加えて「内税」額も表示する。
判定: 事実の誤り
修正案: 新実装の支店表示には内税もあると記述し、設計書の「のみ」との食い違いとして記録する。
