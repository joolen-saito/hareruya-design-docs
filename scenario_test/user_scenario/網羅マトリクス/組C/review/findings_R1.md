主張: 店頭買取/step_scope.tsv:24 は、07のR198「価格更新」を「システムの外」とし、価格データのダウンロードはR192で数えるとしている。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/07_店頭買取_tobe.md:84 は、R198にも「バックオフィスから最新の価格データをダウンロードして」と明記する。R192の「シングルカードの全データをダウンロードする」とは別の工程行である（同:83）。
判定: 偽の対象外
修正案: R198を対象に戻し、バックオフィスからのダウンロードを通るシナリオとの対応を確認する。

主張: 仕入れ業務/factors.tsv:26 のB10-3「在庫移動一覧（トレードチーム）」は対象で、cond_map.tsv:12 はUSH-03が通るとしている。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/15_仕入れ業務.md:46-50 の棚戻しリストは「仕入れ統合作成ファイル」マクロで作る。/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/仕入れ業務/scenario_list.md:28 も、USH-03のシステム出力は「15のパターン2・3の工程の代わりとして数えず」と明記する。
判定: 偽の○
修正案: B10-3からUSH-03の対応を外し、B10-1・B10-2と同じマクロ作業の扱いに揃える。

主張: 仕入れ業務/cond_map.tsv:22 は、D5-2「却下する（入庫は反映されない）」をUSH-02に対応させ、引用を「USH-02のL3」としている。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/仕入れ業務/scenario_list.md:17 は、USH-02の終点を「承認済」とし、「承認／却下」の条件違いは「UZK-02で通す」と書く。同:53 の「USH-02のL3（条件違いはUZK-02）」も参照先を示す文であり、USH-02での却下操作ではない。
判定: 偽の○
修正案: USH-02の対応を外し、却下を実行するシナリオの手順にだけ対応させる。

主張: 店頭買取/step_map.tsv:78-79 は、07のR216「仕入れ統合作業」にUKA-08とUTH-03を対応させている。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/07_店頭買取_tobe.md:93 は「仕入れ統合作業を実施する」とする。一方、/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/店頭買取/scenario_list.md:25 のUKA-08は「仕入れ統合作業（別の業務）へ渡す」が終点で、/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通しシナリオ/UTH-03_店頭買取/UTH-03_店頭買取の持ち込みから査定_出金_入庫_店頭陳列と棚戻しまで.md:65 も「仕入れ統合作業へ渡す」を通しの終点とする。
判定: 偽の○
修正案: R216から引き渡しだけを行うUKA-08とUTH-03の対応を外し、実施するシナリオだけを残す。
