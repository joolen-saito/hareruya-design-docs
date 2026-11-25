/**
 * A15-07 アーキタイプ検索の 004 のシード（S-A15-07-NO-FORMAT）。既存の seeds/a15-07.ts は変えない。
 * シード表は、フォーマットID 159999 が未登録であることを確かめ、登録されていたら関連を消して削除する、と定める。
 * ここでは未登録であることを DB で読んで確かめるだけで、登録されていれば（ほかの方のフォーマットかもしれないので）消さずに止める。
 */
import { query } from "../lib/db";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import "./a15-07";

defineSeed("S-A15-07-NO-FORMAT", async ({ seed }) => {
  const n = Number(query("select count(*) as n from mtb_format where id = 159999", [])[0]?.n ?? "0");
  if (n !== 0) throw new Error(`${seed.シードID}: フォーマットID 159999 が登録されている（シード表は未登録。ほかの方のフォーマットかもしれないので消さずに止める）`);
  reportSeedIssue(seed.シードID, "フォーマットID 159999 が未登録であることを DB で読んで確かめた（シード表の「登録されていたら関連を消して削除する」は行わない）");
});
