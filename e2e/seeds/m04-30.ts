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
import { createStore, expectStore, M0424StoreInput } from "../pages/admin/m04_24_store";
import { BarcodeReplacementListPage, listedStores } from "../pages/admin/m04_30_barcode";

export const M0430_ADMIN: Account = { loginId: "m0430_admin", password: "M0430AdminShared!" };
const ADMIN_NAME = "M04-30試験管理者";

/** 無ければ登録するときの値。M04-22 のシード（seeds/m04-22.ts の STORE_A・STORE_B）と同じ値にして、2つにならないようにする */
const store = (店名: string, url: string, digit: string): M0424StoreInput => ({
  店名, 店名カナ: "テンポ", 店名英語: `M0422 ${url}`, 支店URL: url, 店名略称3文字: digit, ショップ名略称: 店名,
  会社名: "M04-22試験会社", 会社名カナ: "エムゼロヨンニジュウニシケンガイシャ", 郵便番号: "160-0022", 都道府県: "東京都",
  住所1: "新宿区新宿4-22-1", 住所2: "試験ビル", 電話番号: "03-0422-0001",
});
const STORES = [
  { 呼び名: "〔店舗ID-M0430-共有A〕", input: store("店舗A", "m0422a", "Q2A") },
  { 呼び名: "〔店舗ID-M0430-共有B〕", input: store("店舗B", "m0422b", "Q2B") },
];

defineSeed("S-M04-30-STORES", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const s of STORES) {
      const name = s.input.店名;
      let hits = (await listedStores(page)).filter((r) => r.店名 === name);
      if (hits.length === 0) {
        let failure = "";
        try {
          await createStore(page, s.input);
        } catch (e) {
          failure = (e as Error).message.split("\n")[0];
        }
        hits = (await listedStores(page)).filter((r) => r.店名 === name);
        if (hits.length !== 1) throw new Error(`${seed.シードID}: 店舗「${name}」を登録できない（${failure || "店舗一覧に出ない"}）`);
        if (failure) issue(`店舗登録画面で「${name}」を登録したとき、登録は行われたが画面は成功を表示しなかった（${failure}）`);
        await expectStore(page, hits[0].id, s.input);
      } else {
        if (hits.length > 1) throw new Error(`${seed.シードID}: 店名「${name}」の店舗が${hits.length}件ある（ID ${hits.map((h) => h.id).join("・")}）。「各1件」を満たせない`);
        issue(`店名「${name}」の店舗は登録済み（店舗ID ${hits[0].id}・会社名「${hits[0].会社名}」）だったので、それを使った（ほかの必須項目は任意の値）`);
      }
      if (hits[0].開店 !== "開店") throw new Error(`${seed.シードID}: 店舗「${name}」（店舗ID ${hits[0].id}）が開店でない（${hits[0].開店}）`);
      notes.set(s.呼び名, hits[0].id);
    }
    const screen = new BarcodeReplacementListPage(page);
    await screen.open();
    for (const s of STORES) {
      expect(await screen.optionCount(s.input.店名), `${seed.シードID}: 出力対象店舗の選択肢「${s.input.店名}」の数`).toBe(1);
      const value = await screen.出力対象店舗.locator("option").filter({ hasText: new RegExp(`^\\s*${s.input.店名}\\s*$`) }).getAttribute("value");
      expect(value, `${seed.シードID}: 出力対象店舗の選択肢「${s.input.店名}」の店舗ID`).toBe(notes.get(s.呼び名));
    }
  });
});

defineSeed("S-M04-30-ADM", { needs: ["S-M04-30-STORES"] }, async ({ browser, notes }) => {
  const a = notes.get("〔店舗ID-M0430-共有A〕");
  const b = notes.get("〔店舗ID-M0430-共有B〕");
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: ADMIN_NAME, ログインID: M0430_ADMIN.loginId, メールアドレス: "m0430_admin@example.test", パスワード: M0430_ADMIN.password,
    権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [a, b],
  }));
  // ログインでき（ロックされていない）、バーコード貼替リストCSV出力画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0430_ADMIN, async (page) => {
    await new BarcodeReplacementListPage(page).open();
  });
});
