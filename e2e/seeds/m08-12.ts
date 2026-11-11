/**
 * M08-12 顧客グループ管理の画面シード。正本: cases/M08-12_seed_data.tsv
 *
 * - 管理者（ADM）: メンバー管理で登録する。
 * - 顧客グループ: 顧客グループ管理画面で新規追加し、一覧の名称リンクから顧客グループIDを控える。名称には実行の印を付ける（前の実行の残りと取り違えない）。
 * - 会員: フロントの会員登録で作り、管理画面の会員編集で顧客グループと本会員を選ぶ。メールアドレスの前半には実行の印を付ける。
 *   プレイヤーIDは、正本は「イベント申込登録のプレイヤー検索」で控えると書くが、会員の保存内容と同じ番号なので、DBの参照（SELECT）で控える（申込画面を開かない）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 会員のプレイヤーID, 顧客グループの件数, 本店が登録済みか, 読み替える支払方法3件 } from "../db/m08_12";
import { 更新日時を設定する } from "../db/m08_12_write";
import { rc } from "../lib/run_marker";
import { SeedCtx } from "../lib/seeds";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { ensureM08Admin } from "../pages/admin/m08_common";
import { M08CustomerGroupPage } from "../pages/admin/m08_customer_group";
import { 管理画面で会員を整える, mailOf, 会員を登録する } from "./m08-common";

export const M0812_ADMIN: Account = { loginId: "m0812_admin", password: "Passw0rd!M0812" };

defineSeed("S-M08-12-ADM", async ({ browser }) => { await ensureM08Admin(browser, "M08-12試験管理者", M0812_ADMIN); });

/** 名称に実行の印を付けた顧客グループの名称 */
export const 名称 = (正本の名称: string): string => rc(正本の名称);

async function グループを作る(browser: Browser, 名称の値: string, 還元率: string, 店内: boolean, 支店: boolean, 支払方法ID?: string[]): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const g = new M08CustomerGroupPage(page);
    await g.open();
    await g.入れる({ 名称: 名称の値, 還元率, 店内注文専用: 店内, 支店店内注文専用: 支店 });
    if (支払方法ID) await g.支払方法を選ぶ(支払方法ID);
    const r = await g.登録する();
    if (!r.sent) throw new Error(`顧客グループ「${名称の値}」の登録: ブラウザの入力チェックが送信を止めた`);
    await g.open();
    return g.名称リンクを押してIDを読む(名称の値);
  });
}

async function 名称で消す(browser: Browser, 名称の値: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await new M08CustomerGroupPage(page).名称で消す(名称の値);
  });
}

// 名称が「ない」状態にするシード（正本の名称のまま。消すのはこの名称の顧客グループだけ）
defineSeed("S-M08-12-NEW-007", async ({ browser }) => { await 名称で消す(browser, "新規遷移確認グループ"); });
defineSeed("S-M08-12-NEW-028", async ({ browser }) => { await 名称で消す(browser, "トークン不正追加"); });

for (const k of ["023", "024", "031", "032"]) {
  defineSeed(`S-M08-12-DELETE-FREE-${k}`, async ({ browser, notes }) => {
    notes.set(`〔顧客グループID-M0812-${k}〕`, await グループを作る(browser, 名称(`削除対象顧客グループ-${k}`), "3", false, false));
  });
}
defineSeed("S-M08-12-STALE-034", async ({ browser, notes }) => {
  notes.set("〔顧客グループID-M0812-034〕", await グループを作る(browser, 名称("削除後操作確認グループ-034"), "6", false, false));
});

/** 顧客グループを作り、会員を登録して、その顧客グループに所属させる。呼び名を控える */
async function 所属会員つき(ctx: SeedCtx, k: string, グループ名: string, 還元率: string, 店内: boolean, 支店: boolean, メール前半: string, 姓: string, パスワード?: string): Promise<void> {
  const { browser, notes } = ctx;
  notes.set(`〔顧客グループID-M0812-${k}〕`, await グループを作る(browser, グループ名, 還元率, 店内, 支店));
  const { 会員ID } = await 会員を登録する(browser, notes, メール前半, { 姓, 名: "会員", セイ: "シケン", メイ: "カイイン", パスワード }, `〔会員ID-M0812-${k}〕`);
  await 管理画面で会員を整える(browser, 会員ID, async (edit) => {
    await edit.選ぶ("Player][CustomerGroup", グループ名);
    await edit.選ぶ("status", "本会員");
    await edit.登録する();
    const err = await edit.エラー文();
    if (err.length || (await edit.成功メッセージ()) === null) throw new Error(`会員ID ${会員ID} の顧客グループ指定の保存に失敗: ${err.join(" / ")}`);
  });
  const p = 会員のプレイヤーID(会員ID);
  if (!p) throw new Error(`会員ID ${会員ID} のプレイヤーIDをDBの参照で控えられない`);
  notes.set(`〔プレイヤーID-M0812-${k}〕`, p);
}
for (const k of ["025", "026"]) {
  defineSeed(`S-M08-12-MEMBER-LINKED-${k}`, async (ctx) => {
    await 所属会員つき(ctx, k, 名称(`会員登録済み顧客グループ-${k}`), "4", false, false, `m0812-${k}`, `試験${k}`);
  });
}
export const 会員メール = (前半: string): string => mailOf(前半);
export const PW047 = "Passw0rd-CBM0812047";
export const PW048 = "Passw0rd-CBM0812048";
defineSeed("S-M08-12-CBNONEMY-047", async (ctx) => {
  await 所属会員つき(ctx, "047", 名称("CB顧客グループ-M0812CB047"), "0", false, false, "cbm0812-047", "試験M0812CB047", PW047);
});
defineSeed("S-M08-12-CBBRMY-048", async (ctx) => {
  await 所属会員つき(ctx, "048", 名称("CB顧客グループ-M0812CB048"), "0", false, true, "cbm0812-048", "試験M0812CB048", PW048);
});

// ---- 支払方法（共有のマスタ。足さず・書き換えず、既にあるものを読み替える） ----
export const 支払ラベル = { A: "〔支払方法ID-M0812-共有A〕", B: "〔支払方法ID-M0812-共有B〕", C: "〔支払方法ID-M0812-共有C〕" } as const;
defineSeed("S-M08-12-PAYMENTS", async ({ notes }) => {
  const p = 読み替える支払方法3件();
  if (p.length < 3) throw new Error("読み替えに使える支払方法（名前も表示順も他と重ならないもの）が3件無い。共有のマスタなので足さずに止める（判断待ち）");
  notes.set(支払ラベル.A, p[0].id);
  notes.set(支払ラベル.B, p[1].id);
  notes.set(支払ラベル.C, p[2].id);
  reportCurrentSeedIssue(
    `支払方法「試験支払A・B・C」（表示順30・20・10）は共有のマスタなので足さず・書き換えず、既にある支払方法で読み替えた（試験支払A=「${p[0].名前}」表示順${p[0].表示順}、試験支払B=「${p[1].名前}」表示順${p[1].表示順}、試験支払C=「${p[2].名前}」表示順${p[2].表示順}。名前も表示順も他と重ならない支払方法の、表示順の降順の上から3件）`,
  );
});

/** 本店（フロントの既定のアドレスが本店として判定される）。共有の設定なので書き換えず、いまの値を確かめる */
defineSeed("S-M08-12-MAIN-SHOP", async () => {
  if (!本店が登録済みか()) throw new Error("店舗ID 1 が本店として登録されていない。共有の設定なので書き換えずに止める");
  reportCurrentSeedIssue("本店は共有の設定なので書き換えず、既にある本店（店舗ID 1）のフロント（既定のアドレス）を使った。試験用の本店は作っていない");
});

// ---- 名称が「ない」状態（印つきの名称にして、前の実行の残りと取り違えない） ----
for (const [k, n] of [["005", "新規GroupＡ"], ["006", "任意項目空グループ"], ["044", "一件支払M0812-044"], ["045", "支店のみM0812-045"]] as const) {
  defineSeed(`S-M08-12-NEW-${k}`, async ({ browser }) => {
    await 名称で消す(browser, 名称(n));
    reportCurrentSeedIssue(`名称は実行の印を付けた「${名称(n)}」で読み替えた（同名の他人のグループを消さない）`);
  });
}

// ---- 編集前の顧客グループ（名称・ポイント還元率5・支店店内注文専用・支払方法B・更新日時2026-01-01 00:00:00） ----
for (const k of ["002", "003", "008", "009", "013", "014", "016", "017", "018", "029", "030", "033"]) {
  defineSeed(`S-M08-12-BASE-${k}`, { needs: ["S-M08-12-PAYMENTS"] }, async ({ browser, notes }) => {
    const id = await グループを作る(browser, 名称(`編集前顧客グループ-${k}`), "5", false, true, [notes.get(支払ラベル.B)]);
    notes.set(`〔顧客グループID-M0812-${k}〕`, id);
    更新日時を設定する(id, "2026-01-01 00:00:00");
    if (k === "033" && 顧客グループの件数("999999") !== 0) throw new Error("顧客グループID 999999 が登録されている（不存在の前提を満たさない）");
    reportCurrentSeedIssue("名称は実行の印を付けた値で読み替えた。DBで、画面で作った印つきの顧客グループの更新日時を2026-01-01 00:00:00に設定した（更新日時は画面で指定できない）");
  });
}
for (const [k, n, r, ids] of [["042", "M0812-042-GROUP", "37", ["B"]], ["043", "M0812-043-GROUP", "8", ["A", "C"]]] as const) {
  defineSeed(`S-M08-12-LIST-${k}`, { needs: ["S-M08-12-PAYMENTS"] }, async ({ browser, notes }) => {
    const id = await グループを作る(browser, 名称(n), r, false, false, ids.map((x) => notes.get(支払ラベル[x])));
    notes.set(`〔顧客グループID-M0812-${k}〕`, id);
    reportCurrentSeedIssue("名称は実行の印を付けた値で読み替えた");
  });
}

// ---- 店内注文専用・支店店内注文専用の会員 ----
export const OTC会員 = { "035": { 前半: "otc_m0812-035", pw: "Passw0rd-035!M0812O" }, "036": { 前半: "branch_m0812-036", pw: "Passw0rd-036!M0812B" }, "046": { 前半: "cbm0812-046", pw: "Passw0rd-CBM0812046" } } as const;
defineSeed("S-M08-12-OTC-CUSTOMER-035", async (ctx) => {
  await 所属会員つき(ctx, "035", 名称("店内注文専用試験グループ-035"), "0", true, false, OTC会員["035"].前半, "試験035", OTC会員["035"].pw);
});
defineSeed("S-M08-12-BRANCH-CUSTOMER-036", async (ctx) => {
  await 所属会員つき(ctx, "036", 名称("支店店内注文専用試験グループ-036"), "0", false, true, OTC会員["036"].前半, "試験036", OTC会員["036"].pw);
});
defineSeed("S-M08-12-CBOTCMAIN-046", async (ctx) => {
  await 所属会員つき(ctx, "046", 名称("CB顧客グループ-M0812CB046"), "0", true, false, OTC会員["046"].前半, "試験M0812CB046", OTC会員["046"].pw);
});
