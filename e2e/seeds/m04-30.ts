/**
 * M04-30 バーコード貼替リストCSV出力の画面シード。正本: cases/M04-30_seed_data.tsv
 *
 * 作るのは、画面だけで準備できるケース（001・002）が使う S-M04-30-STORES・S-M04-30-ADM だけ。
 * - S-M04-30-STORES: 「店舗A」「店舗B」。シード表の状態は「両店舗とも営業中」「「店舗A」「店舗B」という名称の選択肢は各1件」で、
 *   ほかの必須項目は任意の値。同じ店名の店舗は、同時に動いている M04-22 のシード（seeds/m04-22.ts の S-M04-22-ADM-EDIT）も作る。
 *   店名が同じ店舗が2つになると「各1件」を満たせないので、次のようにする。
 *   - 店舗一覧に店名「店舗A」（「店舗B」）の店舗が1つだけあり、開店なら、その店舗を使う（ほかの必須項目は任意の値なので、作った機能を問わない）。
 *   - 無ければ、M04-22 のシードと同じ値（会社名「M04-22試験会社」・支店URL m0422a／m0422b など）で店舗登録画面から登録する。
 *     M04-22 のシードは店名・会社名で探して「あれば使う」ので、あとから流れても同じ店舗を使い、2つにならない。
 *   - 2つ以上あれば止める（シード表の状態を満たせない）。閉店の店舗だけがあるときも止める。
 *   最後に、バーコード貼替リストCSV出力画面の出力対象店舗に「店舗A」「店舗B」が各1件あることを確かめる（シード表の投入方法の最後の文）。
 * - S-M04-30-ADM: メンバー管理で「M04-30試験管理者」（ログインID m0430_admin）を登録する。あれば内容を確かめて使う。
 *   管理者ID 943000001 は画面が振るので指定できない（ケースの手順・期待結果には出てこない）。
 *   デフォルト検索店舗は店舗A（シード表の店舗ID 943000101 は画面が振るので、控えた〔店舗ID-M0430-共有A〕）。デフォルト検索表示店舗は所属店舗と同じ店舗しか
 *   選べない画面の作りなので、所属店舗も店舗Aにした。編集可能店舗はシード表に無いので、店舗A・店舗Bにした。権限は「システム管理者」（在庫管理を操作できる）。
 * - ほかのシード（STOCK-003 など）は在庫数・価格変更履歴などをDBへ直接設定するので作らない（それらを使うケースは実装しない）。
 */
import { expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { 本店ID, 店舗読み替えの注記, 試験支店ID, 試験店舗の名前を読む } from "../pages/admin/test_store";
import { BarcodeReplacementListPage } from "../pages/admin/m04_30_barcode";

export const M0430_ADMIN: Account = { loginId: "m0430_admin_t", password: "M0430AdminShared!" };
/** 試験管理者は、所属店舗を試験支店にして作り直した（前の「M04-30試験管理者」は消す予定の店舗に結びついている。2026-11-13） */
const ADMIN_NAME = "M04-30試験管理者（試験支店）";

/**
 * 店舗A・店舗Bは、依頼者決定（2026-11-13）で「試験支店」（店舗ID 1574）と本店（店舗ID 1）に読み替える（店舗は登録しない）。
 * 店舗Aは試験支店、店舗Bは本店。店名は画面の選択肢から読む（手順・期待結果の店名はこの店名で読む）。
 */
/** 店舗A・店舗Bに読み替えた店舗の店名（画面の選択肢から読んだもの。シードの中で決め、ケースは同じワーカーで読む）。シード表に無い呼び名を控えに使わないため、変数で持つ */
const 実際の店名 = new Map<string, string>();
export const 店名A = (): string => 実際の店名.get("A") ?? "試験支店";
export const 店名B = (): string => 実際の店名.get("B") ?? "本店";

defineSeed("S-M04-30-STORES", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const names = await 試験店舗の名前を読む(page);
    notes.set("〔店舗ID-M0430-共有A〕", 試験支店ID);
    notes.set("〔店舗ID-M0430-共有B〕", 本店ID);
    実際の店名.set("A", names.試験支店);
    実際の店名.set("B", names.本店);
    issue(店舗読み替えの注記("店舗A", names.試験支店, 試験支店ID));
    issue(店舗読み替えの注記("店舗B", names.本店, 本店ID));
    const screen = new BarcodeReplacementListPage(page);
    await screen.open();
    for (const id of [試験支店ID, 本店ID]) {
      expect(await screen.出力対象店舗.locator(`option[value="${id}"]`).count(), `${seed.シードID}: 出力対象店舗に店舗ID ${id} の選択肢がある`).toBe(1);
    }
  });
});

defineSeed("S-M04-30-ADM", { needs: ["S-M04-30-STORES"] }, async ({ browser, notes }) => {
  const a = notes.get("〔店舗ID-M0430-共有A〕");
  const b = notes.get("〔店舗ID-M0430-共有B〕");
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: ADMIN_NAME, ログインID: M0430_ADMIN.loginId, メールアドレス: "m0430_admin_t@example.test", パスワード: M0430_ADMIN.password,
    権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [a, b],
  }));
  // ログインでき（ロックされていない）、バーコード貼替リストCSV出力画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0430_ADMIN, async (page) => {
    await new BarcodeReplacementListPage(page).open();
  });
});
