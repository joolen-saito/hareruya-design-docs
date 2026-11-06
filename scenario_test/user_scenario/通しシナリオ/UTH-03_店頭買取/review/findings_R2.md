主張: `scenario_list.md:41`（UTH-03）は、終点で買取店舗のEC在庫が買取数だけ増えるとしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:2723` は在庫移動時に「移動点数分、在庫移動対象商品の在庫と総原価を減らし」とする。代表手順の `UTH-03_*.md:57` も、店頭商品QのEC在庫を3減らしてスマレジ在庫へ移す。終点でQのEC在庫は買取直後の増加数のままではない。
判定: 事実の誤り
修正案: 終点の在庫期待値を、入庫直後の増加と、店頭商品を移動した後のEC・スマレジ双方の残数に分けて書く。

主張: `scenario_list.md:71` はT12を業務フロー06のパターン3「手動入庫」を通る行に割り当てるが、`matrix.md:24` のT12は店頭商品だけで、戻し作業を行わない。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/06_店頭買取.md:82-84` は、3-4の在庫変更CSV登録に続く3-5を「戻し作業」とし、「使用する棚戻し業務用PDFは3-2で出力した買取を対象に出力したもの」とする。T12はこの工程を通らない。
判定: 事実の誤り
修正案: T12をパターン3の全工程を通る行として数えず、3-5まで通す行との対応を明示する。

主張: `exceptions.tsv:22-24` のEX21・EX22・EX23は、未登録の個別入力商品に起きる例外の差し込み条件をF2だけにしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0601_基本設計仕様書(その他_MTGBuyer).html:1110,1127` は金額指定の追加でも商品規格IDを0とし、「個別入力や金額指定で追加した行の場合は項目ごと送らない」とする。`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html:1670` は個別入力商品があれば「未登録在庫あり」にするとする。F3の金額指定行でも同じ未登録在庫の例外が成立する。
判定: 事実の欠落
修正案: EX21・EX22・EX23の差し込み先にF3の該当行も加える。
