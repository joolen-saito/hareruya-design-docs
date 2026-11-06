主張: 通販/legal_check.md:26（LC-04）と:29（LC-07）は、コンビニ決済・銀行振込・郵便振替の支払期限を「注文日から7日後15時」として照合するが、休業日の扱いが抜けている。
実際: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1364 は「期限当日が金融機関の休業日に該当する場合は、その後の最初の営業日の15時」と案内する。一方、通販/scenario_list.md:35 の UTS-20 は「注文から1週間後」にキャンセルするため、休業日には案内と運用の照合が必要になる。
判定: 事実の欠落
修正案: LC-04・LC-07に休業日の期限延長を加え、UTS-20のキャンセル時点との食い違いも記録する。

主張: 通販/legal_check.md:29（LC-07）は、UTS-19の返金方法として「振込またはポイント付与」だけを明示している。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md:150 は「決済の減額か請求のキャンセル」が必要な場合のSPLINKS返金依頼を定め、通販/scenario_list.md:17・34 もカード決済の返金にSPLINKSを使うとしている。
判定: 事実の欠落
修正案: LC-07の返金方法の照合対象に、カード決済のSPLINKSでの減額・請求キャンセルを加える。

主張: 店頭受取受注管理/legal_check.md:38（LO-08）は支払方法・店舗別のボタン文言を列挙するが、本店の店頭PC注文（UOR-06、店頭支払（店内PC））の期待値が無い。
実際: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:123-139 はカード・コンビニ以外の本店注文を「注文する」にし、店頭受取受注管理/scenario_list.md:21 は UOR-06 の支払方法を「店頭支払（店内PC）」とする。
判定: 事実の欠落
修正案: LO-08に本店の店頭PC注文のボタン文言「注文する」を明記する。
