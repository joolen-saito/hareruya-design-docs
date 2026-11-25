/**
 * A06-13 本人確認証明書更新（MTGBuyer の API）の追加のシード（006・007・012・013 用）。
 * 受注の作り方は seeds/a06-13.ts と同じ。「削除して0件」のシードは、コードは何も消さず、無いことを数えるだけ（あれば止める）。
 */
import { 査定IDの受注ID, 申込番号の査定ID, 店頭買取の受注, 店頭買取の受注がある, 本人確認証明書の名称, 本人確認証明書と更新担当者を書く } from "../db/a06";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedBuilder } from "../lib/seeds";
import { 試験支店 } from "../pages/admin/reuse_store";
import { 申込を行う, 申込者の } from "./m06-common";
import "./a06-13";

/** seeds/a06-13.ts の受注のシードと同じ作り方（試験支店のフロントで申込み、本人確認証明書ID=1・更新担当者を DB で書く） */
const 受注手順 = (n: string): SeedBuilder => async ({ browser, notes, seed }) => {
  const 姓 = rc("晴屋");
  const [番号] = await 申込を行う(browser, 試験支店.支店URL, [申込者の(姓, "太郎", "ハレルヤ", "タロウ")]);
  const 査定ID = 申込番号の査定ID(番号);
  const 受注ID = 査定IDの受注ID(査定ID);
  if (!受注ID) throw new Error(`${seed.シードID}: 申込んだ査定ID ${査定ID} の店頭買取の受注が DB に無い`);
  notes.set(`〔査定ID-A0613-${n}〕`, 査定ID);
  notes.set(`〔店頭買取ID-A0613-${n}〕`, 受注ID);
  本人確認証明書と更新担当者を書く(受注ID, "1", notes.get("〔更新前担当者ID-A0613-共有〕"), 姓);
  const r = 店頭買取の受注(受注ID);
  if (r?.本人確認証明書ID !== "1" || r?.更新担当者ID !== notes.get("〔更新前担当者ID-A0613-共有〕")) throw new Error(`${seed.シードID}: 受注ID ${受注ID} の本人確認証明書ID・更新担当者を書けていない`);
  reportSeedIssue(seed.シードID, `試験支店のフロントで申込んだ（査定ID ${査定ID}・店頭買取ID ${受注ID}。申込者の姓に実行の印）。本人確認証明書ID=1・更新担当者は DB で書いた（画面で指定できないため）`);
};

defineSeed("S-A06-13-ORDER-006", { needs: ["S-A06-13-AUTH", "S-A06-13-REFERENCES"] }, 受注手順("006"));
defineSeed("S-A06-13-ORDER-007", { needs: ["S-A06-13-AUTH", "S-A06-13-REFERENCES"] }, 受注手順("007"));

for (const n of ["006", "007"]) {
  defineSeed(`S-A06-13-NOIDENTIFICATION-${n}`, async ({ seed }) => {
    if (本人確認証明書の名称(`699999${n}`) !== null) throw new Error(`${seed.シードID}: 本人確認証明書ID 699999${n} がある（0件の前提を満たせない。消さない）`);
  });
}
for (const n of ["012", "013"]) {
  defineSeed(`S-A06-13-INVALID-${n}`, async ({ seed }) => {
    if (店頭買取の受注がある(`699999${n}`)) throw new Error(`${seed.シードID}: 店頭買取ID 699999${n} の受注がある（0件の前提を満たせない。消さない）`);
    if (本人確認証明書の名称(`699999${n}`) !== null) throw new Error(`${seed.シードID}: 本人確認証明書ID 699999${n} がある（0件の前提を満たせない。消さない）`);
  });
}
