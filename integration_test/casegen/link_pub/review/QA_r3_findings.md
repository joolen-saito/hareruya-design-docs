### 指摘1（重大度: Minor）対象: IT-M03-02-QA009
変更: A（2巡目の反映）
主張: 著者は追加ケースを評価表・対応表・到達可能性に反映したとしている。
実際: QA009・QA011を追加した一方、報告書の組ごとの評価は M03-02→F03-01 を「不採用」のままとし、商品画像→一覧も「作らなかった候補」に残している。M03-09 と M03-10 の追加先にも同様の採否の矛盾がある（`integration_test/casegen/link_pub/gen_QA/report.md:18,20,25,27,55,84-91`）。
判定: 反映不備
修正案: 追加11件に合わせて組ごとの評価、対応表、到達可能性、作らなかった候補を更新し、採否の矛盾をなくす。

### 指摘2（重大度: Minor）対象: IT-M03-02-QA010
変更: 追加ケース
主張: フィード反映後すぐにネット買取TOPを開き直せば、非公開にした商品が消える。
実際: ケースの手順4〜5にはフィード反映待ちだけがある（`integration_test/casegen/link_pub/cases/QA_test_cases.tsv:11`）。ネット買取TOPの抽出結果は30秒間保持され、その間の商品更新は表示に反映されない（`functions/pf-eccube3/f05-01_front_online_purchase_buy_top.md:5-7`）。
判定: 手順不備
修正案: 手順4の後に、ネット買取TOPの抽出結果の30秒間の保持が終わるまで待ってから開き直す。

### 指摘3（重大度: Minor）対象: IT-M03-09-QA007
変更: 追加ケース
主張: 買取価格の変更とフィード反映後、ネット買取TOPには8000円が表示される。
実際: 手順4〜5に30秒間保持される抽出結果の更新待ちがない（`integration_test/casegen/link_pub/cases/QA_test_cases.tsv:22`、`functions/pf-eccube3/f05-01_front_online_purchase_buy_top.md:5-7`）。また、TOPは最大60件なのに、対象以外の「目玉買取商品」が59件以下というシードの条件が事前準備から抜けている（`excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:1284-1291`、`integration_test/casegen/link_pub/cases/QA_seed_data.tsv:37`、`integration_test/casegen/link_pub/cases/QA_test_cases.tsv:22`）。
判定: 前提不成立
修正案: 事前準備に「タグ『目玉買取商品』を付けた他の商品は59件以下」を加え、フィード反映と抽出結果の30秒間の保持が終わってからTOPを開き直す。
