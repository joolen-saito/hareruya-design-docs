/**
 * A06-02 の追加ケース 021 のシード。正本: cases/A06-02_seed_data.tsv（S-A06-02-CBOTHER-021）。
 * 正本は店舗 X・Y を新しく登録し、管理者を店舗 X 所属で登録し、店頭買取を別の店舗 Y に作る。店舗は作らない決まり（2026-11-13）なので、
 * 店舗 X は試験支店（管理者は A06-05 と同じ決まった印つきの試験管理者で、所属は試験支店）、店舗 Y は本店（店舗ID 1）に読み替え、
 * 店頭買取は本店のフロントの店頭買取査定申込（支店URL tc・会員登録なし・国は申込の部品の値）で作る。ステータスは申込直後の「査定前」。
 */
import { 申込番号の査定ID, 査定IDの受注ID } from "../db/a06";
import { 受注の今 } from "../db/a06_05";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { 本店の店舗ID } from "../pages/admin/reuse_store";
import { 申込を行う, 申込者の } from "./m06-common";
import "./a06-03";

/** 本店（店舗ID 1）の店頭買取査定申込の支店URL（店舗表の支店URLの値） */
const 本店の支店URL = "tc";

defineSeed("S-A06-02-CBOTHER-021", { needs: ["S-A06-03-ADM"] }, async ({ browser, notes, seed }) => {
  const 姓 = rc("A0602-021");
  const [申込] = await 申込を行う(browser, 本店の支店URL, [申込者の(姓, "査定021", "ゼンテイ", "ジュチュウ")]);
  const 査定ID = 申込番号の査定ID(申込);
  const 受注ID = 査定IDの受注ID(査定ID);
  if (!受注ID) throw new Error(`${seed.シードID}: 申込んだ査定ID ${査定ID} の店頭買取の受注が DB に無い`);
  notes.set("〔店頭買取ID-A0602-021〕", 受注ID);
  reportSeedIssue(seed.シードID, `シード作成時の問題: 正本の店舗 X・Y・管理者の新規登録はせず、店舗 X は試験支店（管理者は決まった印つきの試験管理者・所属は試験支店）、店舗 Y は本店（店舗ID ${本店の店舗ID}）に読み替えた。店頭買取（査定ID ${査定ID}・店頭買取ID ${受注ID}）は本店のフロント（支店URL ${本店の支店URL}）で申込んだ（国・職業は申込の部品の固定の値）。現在のステータス ID ${受注の今(受注ID)?.ステータスID}`);
});
