/**
 * A06-02 の追加ケース（001・012・013）のシード。正本: cases/A06-02_seed_data.tsv（S-A06-02-ORDERS・S-A06-02-ADM-001・012・013）。
 * 正本は店舗 A・管理者・店頭買取（共有A〜H）を新しく登録するが、店舗は作らない決まり（2026-11-13）なので、店舗は試験支店、管理者は決まった印つきの
 * 試験管理者（所属は試験支店）に読み替える（a06-02-b.ts と同じ）。管理者を「削除して作り直す」作り方は行わない（管理者は消さない）。
 * 店頭買取は試験支店のフロントの店頭買取査定申込（会員登録なし）で作る。このシードが作るのは、使うケースが読む次の3件だけ。
 *   共有A=査定前（住所を 東京都 千代田区 晴海1-1 にする）・共有B=査定中（国を United States・住所1 New York, NY・住所2 123 Main St にする）・共有C=査定中断。
 * 画面で作れない住所・国は、E2E の店頭買取の行だけ DB で書く（db/a06_02_addr.ts）。
 */
import { 査定IDの受注ID, 申込番号の査定ID } from "../db/a06";
import { 住所を書く } from "../db/a06_02_addr";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { OtcStatusChangePage } from "../pages/admin/m06_04_status";
import { 試験支店, 試験支店の店舗ID } from "../pages/admin/reuse_store";
import { A0605_ADM, ステータス名 } from "./a06-05";
import { 申込を行う, 申込者の } from "./m06-common";
import "./a06-02-b";
import "./a06-03";

defineSeed("S-A06-02-ORDERS", { needs: ["S-A06-03-ADM", "S-A06-02-MASTERS"] }, async ({ browser, notes, seed }) => {
  const 一覧 = [
    { 番号: "A", 姓: rc("A0602-共有A"), 状況: undefined as string | undefined },
    { 番号: "B", 姓: rc("A0602-共有B"), 状況: "6" },
    { 番号: "C", 姓: rc("A0602-共有C"), 状況: "8" },
  ];
  const 申込 = await 申込を行う(browser, 試験支店.支店URL, 一覧.map((x) => 申込者の(x.姓, `査定${x.番号}`, "ゼンテイ", "ジュチュウ")));
  for (const [i, x] of 一覧.entries()) {
    const 査定ID = 申込番号の査定ID(申込[i]);
    const 受注ID = 査定IDの受注ID(査定ID);
    if (!受注ID) throw new Error(`${seed.シードID}: 申込んだ査定ID ${査定ID} の店頭買取の受注が DB に無い`);
    if (x.状況) {
      await withAdminSession(browser, A0605_ADM, async (page) => {
        const s = new OtcStatusChangePage(page);
        await s.open(受注ID);
        await s.選ぶ(ステータス名[x.状況!]);
        const r = await s.保存を押す();
        if (!r.sent) throw new Error(`${seed.シードID}: 受注 ${受注ID} のステータス変更の「保存」が送られない（${r.止めた理由}）`);
      });
    }
    if (x.番号 === "A") 住所を書く(受注ID, x.姓, { 国名: "Japan", 都道府県名: "東京都", 住所1: "千代田区", 住所2: "晴海1-1" });
    if (x.番号 === "B") 住所を書く(受注ID, x.姓, { 国名: "United States", 都道府県名: null, 住所1: "New York, NY", 住所2: "123 Main St" });
    notes.set(`〔店頭買取ID-A0602-共有${x.番号}〕`, 受注ID);
    notes.set(`〔査定ID-A0602-共有${x.番号}〕`, 査定ID);
  }
  notes.set("〔店舗ID-A0602-共有A〕", 試験支店の店舗ID());
  reportSeedIssue(seed.シードID, "シード作成時の問題: 正本の店舗・店頭買取8件（共有A〜H）の新規登録はせず、使うケース（001・012・013）が読む3件だけを試験支店のフロントで申込んで作った" +
    "（共有A=査定前・共有B=査定中・共有C=査定中断。査定前以外は管理者「" + A0605_ADM.名前 + "」でステータス変更画面から変えた）。" +
    "共有A・Bの住所と共有Bの国は画面で作れないので、E2E の行だけ DB で書いた。共有Bの正本のステータス 6（査定中）は読み替えなし。" +
    "本人確認・適格請求書発行事業者口座・査定担当者・フリーコメント・氏名の記載値は作っていない（001・012・013 は読まない）");
});

for (const 番号 of ["001", "012", "013"]) {
  defineSeed(`S-A06-02-ADM-${番号}`, { needs: ["S-A06-03-ADM"] }, async ({ notes, seed }) => {
    notes.set(`〔管理者ID-A0602-${番号}〕`, notes.get("〔管理者ID-A0603-共有A〕"));
    reportSeedIssue(seed.シードID, "シード作成時の問題: 正本の管理者の「削除して作り直す」・新規登録はせず、決まった印つきの試験管理者（所属は試験支店）に読み替えた（管理者は消さない）");
  });
}
