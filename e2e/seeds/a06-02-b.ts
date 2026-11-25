/**
 * A06-02 の追加ケース（019・022・023）のシード。正本: cases/A06-02_seed_data.tsv。
 * 正本は、ケースごとに店舗・管理者を新しく登録する（店舗は作らない決まり。2026-11-13）。店舗は試験支店に読み替え、管理者は A06-05 と同じ決まった印つきの管理者
 * （所属は試験支店）を使い回す。店頭買取は、試験支店のフロントの店頭買取査定申込（会員登録なし・国は申込の部品の値）で作る。
 * 払い出し待ち（正本はステータスID 7）は、開発環境の店頭買取ステータスの「経理払い出し待ち」（ID 10）に読み替え、ステータス変更画面で変える。
 */
import { 査定IDの受注ID, 申込番号の査定ID } from "../db/a06";
import { 国の紐づけを外す } from "../db/a06_02";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { OtcStatusChangePage } from "../pages/admin/m06_04_status";
import { 試験支店 } from "../pages/admin/reuse_store";
import { 受注の今 } from "../db/a06_05";
import { A0605_ADM, ステータス名 } from "./a06-05";
import { 申込を行う, 申込者の } from "./m06-common";
import "./a06-03";

function 受注のシード(seedId: string, 番号: string, 作り: { 状況?: string; 国を外す?: boolean }): void {
  defineSeed(seedId, { needs: ["S-A06-03-ADM"] }, async ({ browser, notes, seed }) => {
    const 姓 = rc(`A0602-${番号}`);
    const [申込] = await 申込を行う(browser, 試験支店.支店URL, [申込者の(姓, `査定${番号}`, "ゼンテイ", "ジュチュウ")]);
    const 査定ID = 申込番号の査定ID(申込);
    const 受注ID = 査定IDの受注ID(査定ID);
    if (!受注ID) throw new Error(`${seed.シードID}: 申込んだ査定ID ${査定ID} の店頭買取の受注が DB に無い`);
    if (作り.状況) {
      await withAdminSession(browser, A0605_ADM, async (page) => {
        const s = new OtcStatusChangePage(page);
        await s.open(受注ID);
        await s.選ぶ(ステータス名[作り.状況!]);
        const r = await s.保存を押す();
        if (!r.sent) throw new Error(`${seed.シードID}: 受注 ${受注ID} のステータス変更の「保存」が送られない（${r.止めた理由}）`);
      });
    }
    if (作り.国を外す) 国の紐づけを外す(受注ID, 姓);
    notes.set(`〔店頭買取ID-A0602-${番号}〕`, 受注ID);
    reportSeedIssue(seed.シードID, `シード作成時の問題: 正本の店舗・管理者の新規登録はせず、店舗は試験支店、管理者は決まった印つきの試験管理者（所属は試験支店）に読み替えた。店頭買取（査定ID ${査定ID}・店頭買取ID ${受注ID}）は試験支店のフロントで申込んだ（国・職業は申込の部品の固定の値）。${作り.状況 ? `ステータスはステータス変更画面で「${ステータス名[作り.状況]}」にした（正本の払い出し待ち ID 7 は開発環境では「経理払い出し待ち」ID 10）。` : ""}${作り.国を外す ? "国との紐づけは E2E の受注にだけ DB で外した。" : ""}現在のステータス ID ${受注の今(受注ID)?.ステータスID}`);
  });
}
受注のシード("S-A06-02-CBHIT-019", "019", {});
受注のシード("S-A06-02-CBSTATUS-022", "022", { 状況: "10" });
受注のシード("S-A06-02-CBUNLINK-023", "023", { 国を外す: true });
