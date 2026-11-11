/**
 * M09-07 ブロック管理 の追加シード（画面操作＋印つきのブロックへの DB 設定）。正本: cases/M09-07_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）に従い、ブロックは画面で作り、画面で指定できない「削除不可」「SP向け」だけ、ブロック名に実行の印が入った
 * ブロックに限って DB で設定する（db/m09_07_prep.ts。db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） 経由）。注記に「DBで〜に設定した」を残す。
 * - 値（ブロック名・ファイル名）は実行の印を付けた値（seeds/m09-07.ts の方式）。
 * - 「ID 999999 が無い」（EDIT-017）: 削除せず、確かめもしない（登録されていればケースの期待が満たされず不合格に出る）。
 * - SP-DUPLICATE-035: ID 907035104 は決められない。画面で作ったブロックを SP向けに設定したものに読み替える。
 *   「同じファイル名のPC向けブロックが無い」状態は、SP向けにしたあとで成り立つ（元は PC向けとして登録したため、PC向けのテンプレートのファイルは残っている）。
 * - 作らないシード（ケースを実装しない）: LIST-001（PC向けがこの3件だけ。ほかのブロックが一覧に並ぶ）。
 */
import { RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { ブロックを削除不可にする, ブロックをSP向けにする } from "../db/m09_07_prep";
import { withAdminSession } from "../lib/session";
import { ブロック管理 } from "../pages/admin/m09_07_block";
import { M0907_ADMIN, ブロックを作る, ブロック名の識別, ファイル名の識別 } from "./m09-07";

/** ブロックを画面で作り、指定の控えをDBで削除不可・SP向けにする */
function define(seedKey: string, 削除不可: string[], SP向け: string[] = []): void {
  const seedId = `S-M09-07-${seedKey}`;
  defineSeed(seedId, { needs: ["S-M09-07-ADM"] }, async ({ browser, notes }) => {
    await ブロックを作る(browser, notes, seedId);
    for (const l of 削除不可) {
      ブロックを削除不可にする(notes.get(l), RUN_MARK);
      reportSeedIssue(seedId, `ブロック ${notes.get(l)}（${l}）の削除不可は画面で指定できないので、DBで印つきのブロックを削除不可に設定した`);
    }
    for (const l of SP向け) {
      ブロックをSP向けにする(notes.get(l), RUN_MARK);
      reportSeedIssue(seedId, `ブロック ${notes.get(l)}（${l}）のSP向けは画面で指定できないので、DBで印つきのブロックをSP向けに設定した`);
    }
  });
}
define("LIST-002", ["〔ブロックID-M0907-002B〕"]);
define("LIST-004", ["〔ブロックID-M0907-004B〕"], ["〔ブロックID-M0907-004D〕"]);
define("LIST-007", ["〔ブロックID-M0907-007〕"]);
define("LIST-010", ["〔ブロックID-M0907-010A〕"]);
define("DPMIX-044", ["〔ブロックID-M0907-044B〕"]);
define("DENY-013", []);
define("DENY-014", []);
define("EDIT-017", []);

/** 035: SP向けのブロック（ブロック名・ファイル名は印つき）。画面で作ったあと SP向けに設定する */
export const SP同名のファイル名 = "user_data/shared_device_name";
defineSeed("S-M09-07-SP-DUPLICATE-035", { needs: ["S-M09-07-ADM"] }, async ({ browser, seed }) => {
  let id = "";
  await withAdminSession(browser, M0907_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    id = await new ブロック管理(page).作る({ ブロック名: ブロック名の識別("SP同名ブロック-035"), ファイル名: ファイル名の識別(SP同名のファイル名), コード: "<div>SP端末種別確認</div>", 言語: "ja" });
  });
  ブロックをSP向けにする(id, RUN_MARK);
  reportSeedIssue(seed.シードID, `ID 907035104 は決められないので、画面で作ったブロック ${id}（ブロック名・ファイル名は実行の印つき）を、DBで SP向けに設定したものに読み替えた。` +
    "元は PC向けとして登録したので、PC向けのテンプレートのファイルは残っている（同じファイル名のPC向けブロックは無い）");
});
