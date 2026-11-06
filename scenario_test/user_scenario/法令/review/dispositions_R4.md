# R4 の指摘の扱い（codex・法令・支払方法6種類〔裁定R13〕に合わせた見直し・新しい回の1巡目）

指摘3件。1件ずつ正本を開いて確かめた。全件、指摘どおり正しかった。

| # | 指摘 | 確認 | 扱い | 直したところ |
|---|---|---|---|---|
| 1 | LC-04・LC-07 の支払期限に休業日の扱いが無く、UTS-20（1週間後にキャンセル）との食い違いも未記録 | `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml` 1364行（`front.shopping.payment_modal.deadline.body`）：「ご注文いただいた日から起算して7日後の15時までとさせていただきます。<br>期限当日が金融機関の休業日に該当する場合は、その後の最初の営業日の15時となります。…例：注文日が4月1日の場合、4月7日15時に満了（4月7日が日曜なら、翌4月8日15時に満了）」。`通販/scenario_list.md` 35行 UTS-20「入金が無いまま注文から1週間が過ぎた受注をキャンセルする」、業務フロー16 R281（`scenario_test/markdown/16_通販受注管理.md` 130行）「キャンセルは受注1週間後に対応」。休業日に当たると案内の期限（翌営業日15時）より前にキャンセルしうる | 採用 | `通販/legal_check.md` の LC-04（①）に休業日の延長と案内の例を、LC-07（②）に休業日の期限と、UTS-20 のキャンセル時点との食い違い（記録）を書き、根拠欄の引用に休業日の文を足した。UTS-20 の見直しの要否は `scenario_list.md` 側の判断（直していない。報告に記載） |
| 2 | LC-07 の UTS-19 の返金方法が「振込またはポイント付与」だけで、カード決済の SPLINKS が無い | `scenario_test/markdown/16_通販受注管理.md` 150行 R337「SPLINKS返金依頼｜顧客対応で決済の減額か請求のキャンセルが必要な要項が発生したため」。`通販/scenario_list.md` 34行 UTS-19 の終点「支払方法に合わせた返金（UTS-02と同じ）」、17行 UTS-02「SPLINKS（…）」。UTS-19 のL3の「振込またはポイント付与の二択」は、カード決済以外の話と読める | 採用 | LC-07 ①の返金方法を「支払方法に合わせて返す：クレジットカード決済・登録済みクレジットカード決済は SPLINKS での決済の減額または請求のキャンセル、そのほかは振込またはポイント付与」に直した |
| 3 | LO-08 に本店の店頭PC注文（UOR-06）のボタン文言が無い | `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig` 128〜139行：カード決済は `front.shopping.checkout.credit`、コンビニ決済は `.cvs`、それ以外は本店なら `front.shopping.checkout`、支店なら `front.shopping.purchase`。`messages.ja.yaml` 1508・1509行：`front.shopping.purchase: 購入する`、`front.shopping.checkout: 注文する`。`店頭受取受注管理/scenario_list.md` 21行 UOR-06「注文受領（店頭支払（店内PC））」。本店の店頭PC注文はそれ以外の枝で「注文する」、支店は「購入する」 | 採用 | `店頭受取受注管理/legal_check.md` の LO-08 に「本店の店頭PC注文（UOR-06。店頭支払（店内PC））は「注文する」、支店は店頭PC注文を含め「購入する」」を明記した |

## 結果

- 採用3件・一部採用0件・却下0件
- 直したのは `通販/legal_check.md`（LC-04・LC-07）と `店頭受取受注管理/legal_check.md`（LO-08）。`scenario_list.md` は直していない
- 報告事項：UTS-20（注文から1週間後にキャンセル）は、休業日で期限が翌営業日15時になる注文では案内の期限より早くなりうる。UTS-20 の起点・L3 に休業日の扱いを足すかは `scenario_list.md` 側の判断
