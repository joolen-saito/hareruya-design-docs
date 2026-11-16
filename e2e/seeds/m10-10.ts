/**
 * M10-10 CSV出力項目設定 のシード。正本: cases/M10-10_seed_data.tsv
 *
 * ≪共有の設定を書き換える／DB に足すもの≫ と、どう戻すか（書き換える前に registerRestore で登録。ケースの終わりに基盤が逆順で戻して確かめる）:
 * - CASE-003〜014・021〜023（専用の CSV 種別）: DB に「印つきの新しい行」だけ足す（CSV 種別 1〜2 件と、その出力項目）。種別の名称には実行の印を付ける。
 *   戻し方: 足した出力項目と種別を DB で消し、残っていないことを DB の参照で確かめる（db/m10_10.ts）。既存の行は書き換えない。
 * - CASE-015（標準の受注CSV）: 標準の種別の出力項目は入れ替えない。ケースは保存して遷移先を見るだけなので、保存前の左右の並びを画面から控え、
 *   保存のあとに同じ並びへ画面で登録し直し、画面の並びが控えと同じことを確かめる。
 * - L-SHIP-019・020（標準の配送CSV）: 画面で「注文番号・配送ID・会員ID」の3件だけを出力する側にする（ほかは出力しない）。
 *   戻し方: 保存前の左右の並びを画面から控え、ケースの終わりに画面で同じ並びへ登録し直し、画面の並びが控えと同じことを確かめる。
 *   これらのシードを使うケースは、共有の設定を書き換えるので夜に1本だけで流す（config/solo_cases.tsv）。
 *
 * 解釈（シード表から一意に決まらない／決められない値）:
 * - 種別の名称・管理者のログインID・名前には実行の印を付ける（rc。開発環境に同じ名前の行が残るのを避ける）。
 * - 種別の番号: 91023（CASE-023）は CSV 種別の番号の列（16ビット）に入らないので、空いている番号を使う。ほかはシード表の番号が空いていればそれを使う。
 *   出力項目の番号はDBが振る（画面は番号を使わない）。
 * - 出力項目の元になる実体の名前（項目の中身）は、画面に出ないので任意の値（受注の識別子）にした。
 * - 配送CSV（標準）に「連携出力列A-001M1010n019」などの名前の項目は足せない（標準の種別への追加は共有の書き換えになる）。
 *   代わりに、標準の項目「注文番号」を A、「配送ID」を B、「会員ID」を C として使う。
 * - ORDER-DEFAULT・EXCLUDED-TYPES（標準のマスタ）は、あることを DB の参照で確かめる。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { available } from "../lib/db";
import { rc } from "../lib/run_marker";
import { reportSeedIssue, SeedBuilder } from "../lib/seeds";
import { registerRestore } from "../lib/shared_restore";
import { Account, withAdminSession } from "../lib/session";
import { 標準の種別, 専用の種別を足す, 出力項目の定義 } from "../db/m10_10";
import { CsvSettingPage, 並び } from "../pages/admin/m10_10_csv";
import { OrderCsvPage } from "../pages/admin/m05_05_custom_csv";
import { ensureBuyer, M05_BUYER, 会員が注文する } from "../pages/front/m05_front_order";
import { defineSeed } from "./current_seed";
import { ensureAnalysisAdmin } from "./m12-common";

function 管理者(loginId: string, 名前: string, password: string) {
  const id = rc(loginId).toLowerCase();
  return { 名前: rc(名前), account: { loginId: id, password } as Account, メール: `${id}@example.test` };
}
const ADM = 管理者("m1010_admin", "M10-10試験管理者", "Passw0rd!M1010");
const LADM = 管理者("m1010l_admin", "M10-10連携試験管理者", "Passw0rd!M1010L");
export const M1010_ADMIN: Account = ADM.account;
export const M1010_L_ADMIN: Account = LADM.account;

defineSeed("S-M10-10-ADM", async ({ browser }) => { await ensureAnalysisAdmin(browser, ADM); });
defineSeed("S-M10-10-L-ADM", async ({ browser }) => { await ensureAnalysisAdmin(browser, LADM); });

/** 種別の名称（正本の名前に実行の印を付ける） */
export const 種別名 = (正本の名前: string): string => rc(正本の名前);

defineSeed("S-M10-10-ORDER-DEFAULT", async () => {
  if (!available) { reportSeedIssue("S-M10-10-ORDER-DEFAULT", "DB の接続先が無いので、標準の種別の有無を DB で確かめず、画面の選択肢だけで確かめる"); return; }
  const t = 標準の種別(3);
  if (!t || t.名称 !== "受注CSV" || t.表示順 !== 1) throw new Error(`標準の CSV 種別 3 が「受注CSV」・表示順 1 でない（${JSON.stringify(t)}）`);
});
/** 選択肢に出てはならない種別（番号 6・7）の、DB にある名称。シード表の名称とは別に、DB の名称でも確かめる */
export const 除外される種別の名称: string[] = ["規格名CSV", "規格分類CSV"];
defineSeed("S-M10-10-EXCLUDED-TYPES", async ({ seed }) => {
  if (!available) { reportSeedIssue(seed.シードID, "DB の接続先が無いので、CSV 種別 6・7 の有無を DB で確かめない"); return; }
  const a = 標準の種別(6), b = 標準の種別(7);
  if (!a || !b) throw new Error(`CSV 種別 6・7 が DB に無い（6: ${JSON.stringify(a)}、7: ${JSON.stringify(b)}）`);
  if (a.名称 !== "規格名CSV" || b.名称 !== "規格分類CSV") {
    reportSeedIssue(seed.シードID, `DB の CSV 種別 6 の名称は「${a.名称}」、7 は「${b.名称}」（シード表は「規格名CSV」「規格分類CSV」）。ケースでは両方の名称が選択肢に出ないことを確かめる`);
  }
  for (const n of [a.名称, b.名称]) if (!除外される種別の名称.includes(n)) 除外される種別の名称.push(n);
});

const 標準の5件 = (非出力の数 = 2): 出力項目の定義[] => [
  ...(非出力の数 === 2 ? [
    { 表示名: "非出力列A", 有効: false, 並び順: 10 }, { 表示名: "非出力列B", 有効: false, 並び順: 20 },
    { 表示名: "出力列A", 有効: true, 並び順: 10 }, { 表示名: "出力列B", 有効: true, 並び順: 20 }, { 表示名: "出力列C", 有効: true, 並び順: 30 },
  ] : [
    { 表示名: "非出力列A", 有効: false, 並び順: 10 }, { 表示名: "非出力列B", 有効: false, 並び順: 20 }, { 表示名: "非出力列C", 有効: false, 並び順: 30 },
    { 表示名: "出力列A", 有効: true, 並び順: 10 }, { 表示名: "出力列B", 有効: true, 並び順: 20 },
  ]),
];

/** ケース専用の種別を足す作り方（CASE-003〜014・021〜022。受注情報用の出力項目5件。004 は切替先の種別も足す） */
const 専用種別を足す = (n: string): SeedBuilder => async ({ seed }) => {
  専用の種別を足す(`${seed.シードID} の専用種別`, { 希望ID: 10100 + Number(n), 名称: 種別名(`受注CSV-M1010-${n}`), 表示順: 1000 + Number(n), 項目: 標準の5件() });
  if (n === "004") {
    専用の種別を足す(`${seed.シードID} の切替先の種別`, {
      希望ID: 10204, 名称: 種別名("切替確認CSV"), 表示順: 2004,
      項目: [{ 表示名: "切替非出力列", 有効: false, 並び順: 10 }, { 表示名: "切替出力列", 有効: true, 並び順: 10 }],
    });
  }
};
defineSeed("S-M10-10-CASE-003", 専用種別を足す("003"));
defineSeed("S-M10-10-CASE-004", 専用種別を足す("004"));
defineSeed("S-M10-10-CASE-005", 専用種別を足す("005"));
defineSeed("S-M10-10-CASE-006", 専用種別を足す("006"));
defineSeed("S-M10-10-CASE-007", 専用種別を足す("007"));
defineSeed("S-M10-10-CASE-008", 専用種別を足す("008"));
defineSeed("S-M10-10-CASE-009", 専用種別を足す("009"));
defineSeed("S-M10-10-CASE-010", 専用種別を足す("010"));
defineSeed("S-M10-10-CASE-011", 専用種別を足す("011"));
defineSeed("S-M10-10-CASE-012", 専用種別を足す("012"));
defineSeed("S-M10-10-CASE-013", 専用種別を足す("013"));
defineSeed("S-M10-10-CASE-014", 専用種別を足す("014"));
defineSeed("S-M10-10-CASE-021", 専用種別を足す("021"));
defineSeed("S-M10-10-CASE-022", 専用種別を足す("022"));

defineSeed("S-M10-10-CASE-023", async ({ seed }) => {
  // 種別の番号 91023 は番号の列に入らないので、空いている番号を使う。表示順は 6823（シード表のまま）
  専用の種別を足す(`${seed.シードID} の専用種別`, { 希望ID: 10123, 名称: 種別名("受注CSV-M1010-023"), 表示順: 6823, 項目: 標準の5件(3) });
});

// ---- 標準の種別（画面で並びを控えて、画面で戻す） ----

/** 種別の左右の並び（項目の番号と名前）を画面から控える */
async function 並びを控える(browser: Browser, 種別ID: string): Promise<並び> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const p = new CsvSettingPage(page);
    await p.openType(種別ID);
    return p.並びを読む();
  });
}

const 番号の並び = (b: 並び) => ({ 出力しない: b.出力しない.map((o) => o.value), 出力する: b.出力する.map((o) => o.value) });

/** 書き換える前に、控えた並びへ戻すことを登録する（戻したあと、画面の並びが控えと同じことを確かめる） */
async function 戻すことを登録する(browser: Browser, 種別ID: string, 名前: string): Promise<並び> {
  const 前 = await 並びを控える(browser, 種別ID);
  registerRestore(
    名前,
    { 出力しない: 前.出力しない, 出力する: 前.出力する },
    async () => {
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        const p = new CsvSettingPage(page);
        await p.openType(種別ID);
        await p.並びを指定して登録する(番号の並び(前));
      });
    },
    async () => {
      const 後 = await 並びを控える(browser, 種別ID);
      return JSON.stringify(番号の並び(後)) === JSON.stringify(番号の並び(前));
    },
  );
  return 前;
}

defineSeed("S-M10-10-CASE-015", async ({ browser }) => {
  // 標準の受注CSV（種別 3）の出力項目は入れ替えない。保存で並びが変わらないはずだが、保存前の並びを控えて画面で戻せるようにする
  await 戻すことを登録する(browser, "3", "標準の受注CSVの出力項目の並び");
});

/** 配送CSV（標準・種別 4）の出力を「注文番号（A）・配送ID（B）・会員ID（C）」の3件だけにする。戻すことを先に登録する */
async function 配送CSVを3件だけ出力にする(browser: Browser, seedId: string): Promise<void> {
  await 戻すことを登録する(browser, "4", `標準の配送CSVの出力項目の並び（${seedId}）`);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const p = new CsvSettingPage(page);
    await p.openType("4");
    const now = await p.並びを読む();
    const all = [...now.出力しない, ...now.出力する];
    const pick = (label: string) => {
      const hit = all.filter((o) => o.label === label);
      if (hit.length !== 1) throw new Error(`${seedId}: 配送CSV の出力項目に「${label}」が ${hit.length} 件ある（1件のはず）`);
      return hit[0].value;
    };
    const 出す = [pick("注文番号"), pick("配送ID"), pick("会員ID")];
    await p.並びを指定して登録する({ 出力しない: all.map((o) => o.value).filter((v) => !出す.includes(v)), 出力する: 出す });
    await p.openType("4");
    const 後 = (await p.表示名の並び()).出力する;
    if (JSON.stringify(後) !== JSON.stringify(["注文番号", "配送ID", "会員ID"])) throw new Error(`${seedId}: 配送CSV の出力する項目が指定と違う（画面: ${後.join("、")}）`);
  });
}
defineSeed("S-M10-10-L-SHIP-019", async ({ browser, seed }) => { await 配送CSVを3件だけ出力にする(browser, seed.シードID); });
defineSeed("S-M10-10-L-SHIP-020", async ({ browser, seed }) => { await 配送CSVを3件だけ出力にする(browser, seed.シードID); });

/** 出力対象の受注: 本会員が代金引換で注文する（対応状況は新規受付）。注文番号を控える */
async function 受注を用意する(browser: Browser, seedId: string, 呼び名: string, notes: { set(k: string, v: string): void }): Promise<void> {
  await ensureBuyer(browser);
  // シード表のとおり代金引換で注文する（郵便振替は対応状況が「注文受領」になる）。商品の既定の配送方法で代金引換が出ないときは、出る配送方法に替える
  const 注文番号 = await 会員が注文する(browser, { メール: M05_BUYER.メール, パスワード: M05_BUYER.パスワード }, `${seedId} の注文`, { 代金引換で: true });
  await withAdminSession(browser, LADM.account, async (page) => {
    const csv = new OrderCsvPage(page);
    await csv.openSearch();
    const n = await csv.注文番号で検索する(注文番号);
    if (n < 1) throw new Error(`${seedId}: 注文番号 ${注文番号} の受注が受注一覧に出ない`);
    const row = page.locator("tr").filter({ hasText: 注文番号 }).first();
    const text = (await row.textContent()) ?? "";
    if (!text.includes("新規受付")) throw new Error(`${seedId}: 注文番号 ${注文番号} の対応状況が「新規受付」でない（行: ${text.replace(/\s+/g, " ").slice(0, 120)}）`);
  });
  notes.set(呼び名, 注文番号);
}
defineSeed("S-M10-10-L-ORDER-019", { needs: ["S-M10-10-L-ADM"] }, async ({ browser, notes, seed }) => { await 受注を用意する(browser, seed.シードID, "〔注文番号-M1010-019〕", notes); });
defineSeed("S-M10-10-L-ORDER-020", { needs: ["S-M10-10-L-ADM"] }, async ({ browser, notes, seed }) => { await 受注を用意する(browser, seed.シードID, "〔注文番号-M1010-020〕", notes); });
