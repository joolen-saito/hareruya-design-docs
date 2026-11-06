# 補A R3 の扱い

| # | 指摘の要旨 | 扱い | 確認（ファイル:行と引用） | 直したこと |
|---|---|---|---|---|
| 1 | 通販 C5-3「区分の無い配送方法」を判断待ちでなく適用外に | 採用 | `ec-cube-enterprise/eccube_db_20260907.sql.gz` の配送方法のテーブル定義（`dtb_delivery`、行5878）「is_abroad boolean DEFAULT false NOT NULL」。`ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:240` 「->join('s.Delivery', 'd', 'WITH', 'd.isAbroad = :isAbroad')」で納品書を振り分ける | factors.tsv の C5-3 を適用外にして理由を書いた。通販/scenario_list.md の判断待ち14を「解消」に書き換えた |
| 2 | 通販 D19-1（ポイント減算が1回だけ）の手順が UTS-15 に無い | 採用 | `excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1570` 「実行タイミング 毎日4時」、同:1573-1576 「1日分遡った期間のポイント履歴」「ポイント増減量がマイナスの履歴」「注文データIDとポイント増減量の組み合わせで検索し、複数個重複している」 | UTS-15 の L3 を、対象期間に減算履歴が1件だけの受注を用意し、4時のチェックのあと通知が届かず残高が変わらないことを確かめる手順に書き直し、D19-1 の引用をその文に付け替えた |

## 抜けの増減
- 値：C5-3 が判断待ちから適用外になった（判断待ちは通販で3件に減る）。抜けは0件のまま。
