/**
 * M16-01 バナー設定・画像のアップロード（トップバナー管理）のシード（画面操作）。正本: cases/M16-01_seed_data.tsv
 *
 * 読み替え（依頼者の方針 2026-11-11。共有のマスタは書き換えない。共有の設定は、夜の1本流しで控えて必ず戻す）:
 * - 店舗A・店舗B（店舗ID 161601・161602、パス指定値 store-a・store-b）は、店舗を作らず（依頼者 2026-11-15）、E2E の店舗 221（店舗A）・4973（店舗B）に読み替える。
 *   画像の保管先のフォルダ名は店名略称（保管先の「banner/top/略称/」）。略称は店舗編集画面から読む。M16-02 も同じ2店舗を使う（画像の増えた分・前後の差で見るので共存できる。同時には流さない）。
 * - 管理者 S-M16-01-ADM は、メンバー登録画面で登録する（ログインID m1601_admin）。権限は「システム管理者」にした（データ管理を操作でき、店舗の行の制限を受けず全店舗が選択肢に出る）。
 *   編集可能店舗は店舗Aと店舗B。S-M16-01-NOEDIT-ADM（ログインID m1601_noedit）は同じ権限で、編集可能店舗を店舗Bだけにした（店舗Aは編集不可）。所属店舗はどちらも本店。
 *   S-M16-01-L-ADM（ログインID m1601l_admin）も同じ権限で、所属・編集可能店舗は本店。
 * - 保管先へ名前を決めた画像を置く準備（S-M16-01-PREP-nnn の「店舗Aのフォルダには…だけが存在する」）は、試験店舗Aへ画面から画像をアップロード
 *   （ファイル名は画面が採番する）に読み替える。バナー用フォルダ直下（店舗を選ばない保管先）へは、画面からアップロードできない（店舗の選択が必須）ので置かない。
 * - 入力ファイル（S-M16-01-UPLOAD-FILES）は e2e/fixtures/m16-02/ のものを使う（limit.png は m1602-520000.png、valid.gif・valid.jpg・valid.png は m1602-valid.gif・jpeg・png）。
 * - 2000件超のファイルの準備（003・004）は行わない（それを使うケースは実装しない）。
 *
 * ≪共有の設定を書き換える≫ 共有トップバナー設定（S-M16-01-BASE。機能全体で1組。開発環境は ID 1〜15 の15行）:
 * - 各ケースの準備のシード（PREP-nnn・L-PREP-nnn・CBPREP-nnn・RETURN-050）が、書き換える直前に画面から全行の全項目（画像URL・リンク先URL・言語・表示タイプ・
 *   画像alt属性）を控え、lib/shared_restore.ts の registerRestore に「画面で全行を控えた値へ戻して保存し、開き直して控えと同じかを確かめる」を登録してから書き換える。
 *   ケースの手順がさらに書き換えても、ケースの終わり（成否によらず）に基盤が控えた値へ戻す。戻せなければ以降の共有の書き換えを止める（STOP）。
 * - 元の値を画面から保存し直せない（入力規則に合わない・画像URLが空なのに表示タイプが「表示」など、保存すると値が変わる）ときは、書き換えずに止まる。
 * - 書き換えてよいのは、夜に1本だけで流す回（E2E_ALLOW_SHARED=1）か手元の環境だけ。ほかの共有の環境では書き換えずに止まる。
 * - 「ID 1とID 2の2件だけ」「ID 1〜11の11件だけ」など行の数をそろえる操作（行の削除）は画面に無い。正本に値の無い行は、画像URL・リンク先URL・画像alt属性を空、
 *   言語のチェックを外し、表示タイプ「非表示」にした（シード表の「状態・属性に記載の無い項目は空にする」。画像URLが空の行はトップ画面に出ない）。
 * - 019・020 の「ID 3＝画像URL空・表示」は、画面では保存すると「非表示」になる（シード表も DB で直接設定すると定める）。画面で入れられる値（画像URL空・表示を選んで保存）のまま使う。
 * - 保存すると、並び順は行の位置（ID と同じ値）で保存される。元の並び順（画面に出ない値）は控えられないので、戻したあとの並び順は行の ID と同じ値になる。
 */
import fs from "node:fs";
import path from "node:path";
import { Browser } from "@playwright/test";
import { REPO_ROOT, SETUP_ADMIN, SHARED_ENV } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { registerRestore } from "../lib/shared_restore";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { ensureMemberFixed as ensureMember } from "../pages/admin/member";
import { 本店の店名 } from "../pages/admin/m05_admin_member";
import { BannerSettingPage, バナー入力, バナー行 } from "../pages/admin/m16_01_banner_setting";
import { TopBannerPage, 店舗の店名と略称, 画像の種別, 画像の種別を見る, 準備のアップロード } from "../pages/admin/m16_02_top_banner";
import { TopSlidePage } from "../pages/front/m16_01_top_slide";
import { 店舗IDで選ぶ, 表の店舗 } from "../pages/admin/store_pick";
import { E2Eの店舗 } from "../lib/store_create_ban";

export const M1601_ADMIN: Account = { loginId: "m1601_admin", password: "Passw0rd!M1601" };
export const M1601_NOEDIT: Account = { loginId: "m1601_noedit", password: "Passw0rd!NoEdit" };
export const M1601L_ADMIN: Account = { loginId: "m1601l_admin", password: "Passw0rd!M1601L" };

/** 依頼者決定 2026-11-15「店舗は作るのもう禁止」: 店舗A = E2E の店舗 221、店舗B = E2E の店舗 4973。略称（保管先のフォルダ名）は S-M16-01-SHOPS が店舗編集画面から読んで入れる */
export const 店舗A = { 店名: 表の店舗("221").店名, 略称: "" };
export const 店舗B = { 店名: 表の店舗("4973").店名, 略称: "" };

export const M1601_FILES = path.join(REPO_ROOT, "e2e", "fixtures", "m16-02");
export const 入力ファイル = (name: string): string => path.join(M1601_FILES, name);

defineSeed("S-M16-01-SHOPS", async ({ browser, seed }) => {
  const id = seed.シードID;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const { 店, 店舗ID, 呼び名 } of [{ 店: 店舗A, 店舗ID: "221", 呼び名: "店舗A" }, { 店: 店舗B, 店舗ID: "4973", 呼び名: "店舗B" }]) {
      const s1 = await 店舗IDで選ぶ(page, 店舗ID, 呼び名, (m) => reportSeedIssue(id, m));
      const v = await 店舗の店名と略称(page, s1.id);
      if (!v.略称) throw new Error(`${id}: 店舗ID ${s1.id} の店名略称（保管先のフォルダ名）が空`);
      店.略称 = v.略称;
    }
    if (店舗A.略称 === 店舗B.略称) throw new Error(`${id}: 店舗A・店舗Bの店名略称が同じ（${店舗A.略称}）`);
    reportSeedIssue(id, `シード表の店舗A（店舗ID 161601・store-a）・店舗B（161602・store-b）は、E2E の店舗「${店舗A.店名}」（店舗ID 221・略称 ${店舗A.略称}）・「${店舗B.店名}」（店舗ID 4973・略称 ${店舗B.略称}）に読み替えた（店舗は作らない。依頼者 2026-11-15）。`);
  });
});

async function 管理者を作る(browser: Browser, account: Account, 名前: string, 編集可能: string[]): Promise<void> {
  const shop = await 本店の店名(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureMember(page, {
      名前, 所属店舗: shop, ログインID: account.loginId, メールアドレス: `${account.loginId}@example.test`,
      パスワード: account.password, 権限: "システム管理者", デフォルト検索表示店舗: 編集可能[0], 編集可能店舗: 編集可能,
    });
  });
}

defineSeed("S-M16-01-ADM", { needs: ["S-M16-01-SHOPS"] }, async ({ browser }) => {
  await 管理者を作る(browser, M1601_ADMIN, "m1601 トップバナー試験管理者", [店舗A.店名, 店舗B.店名]);
});
defineSeed("S-M16-01-NOEDIT-ADM", { needs: ["S-M16-01-SHOPS"] }, async ({ browser }) => {
  await 管理者を作る(browser, M1601_NOEDIT, "m1601 店舗A編集権限なし管理者", [店舗B.店名]);
});
defineSeed("S-M16-01-L-ADM", async ({ browser, seed }) => {
  await 管理者を作る(browser, M1601L_ADMIN, "m1601l トップバナー連携試験管理者", [await 本店の店名(browser)]);
  reportSeedIssue(seed.シードID, "データ管理を操作できる権限として「システム管理者」で作った（所属・編集可能店舗は本店）");
});
defineSeed("S-M16-01-L-ENV", async ({ browser, seed }) => {
  // 本店の日本語サイトと英語サイトのトップ画面が開けることを確かめるだけ（サイト設定・ブロックは書き換えない）
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, locale: "ja-JP" });
  try {
    const p = new TopSlidePage(await ctx.newPage());
    await p.開く("日本語");
    await p.開く("英語");
  } finally {
    await ctx.close();
  }
  reportSeedIssue(seed.シードID, "サイト設定・ブロック管理は書き換えず、ログアウトの状態で本店の日本語サイト（/ja/）と英語サイト（/en/）のトップ画面が開けることだけを確かめた。スライドの欄は、表示するバナーがあるときに出る");
});

function 入力ファイルを確かめる(seedId: string, name: string, want: 画像の種別, ちょうど?: number): void {
  const p = 入力ファイル(name);
  if (!fs.existsSync(p)) throw new Error(`${seedId}: 入力ファイル ${name} が e2e/fixtures/m16-02/ に無い`);
  const b = fs.readFileSync(p);
  const got = 画像の種別を見る(b);
  if (got !== want) throw new Error(`${seedId}: ${name} の中身が${got}で、シード表の${want}と違う`);
  if (ちょうど !== undefined && b.length !== ちょうど) throw new Error(`${seedId}: ${name} が ${b.length} バイトで、${ちょうど} バイトでない`);
}

defineSeed("S-M16-01-UPLOAD-FILES", async ({ seed }) => {
  const id = seed.シードID;
  入力ファイルを確かめる(id, "m1602-520000.png", "PNG", 520000);
  入力ファイルを確かめる(id, "m1602-valid.gif", "GIF");
  入力ファイルを確かめる(id, "m1602-valid.jpeg", "JPEG");
  入力ファイルを確かめる(id, "m1602-valid.png", "PNG");
  reportSeedIssue(id, "入力ファイルは e2e/fixtures/m16-02/ のもの（limit.png=m1602-520000.png、valid.gif/jpg/png=m1602-valid.gif/jpeg/png）を使う");
});

const 画面から用意する = "シード表の「保管先へ名前を決めた画像を置く」は、ケースの中の事前の準備として試験店舗Aへ画面から画像をアップロードし、増えた画像（ファイル名は画面が採番する）を使う、に読み替えた";
for (const n of ["002", "027", "032", "034", "035", "036", "038", "039", "040", "041", "042", "044"]) {
  const sid = `S-M16-01-PREP-${n}`;
  defineSeed(sid, { needs: ["S-M16-01-SHOPS"] }, async () => { reportSeedIssue(sid, 画面から用意する); });
}

defineSeed("S-M16-01-BASE", async () => {
  reportSeedIssue("S-M16-01-BASE", "共有トップバナー設定は機能全体で1組。このシードでは書き換えない。値を使うケースは、準備のシードが書き換える直前に画面から全行を控え、ケースの終わりに画面で戻して確かめる（IT-M16-01-049 は書き換えず、いまの設定を読むだけ）");
});
defineSeed("S-M16-01-LANGOPT-049", async () => {
  reportSeedIssue("S-M16-01-LANGOPT-049", "言語の選択肢は設定の値によらないので、いまの設定のID 1とID 2の行を読む（設定は変えない）");
});

// ---- 共有トップバナー設定（全行を控えて書き換え、ケースの終わりに戻す） ----

/** 共有の設定を書き換えてよいのは、夜に1本だけで流す回（E2E_ALLOW_SHARED=1）か手元の環境だけ */
function 共有の書き換えを許す(seedId: string): void {
  if (SHARED_ENV && process.env.E2E_ALLOW_SHARED !== "1") {
    throw new Error(`${seedId}: 共有の環境では共有トップバナー設定を書き換えない。夜に1本だけで流す回（E2E_ALLOW_SHARED=1）でだけ書き換える`);
  }
}

const 全行を読む = (browser: Browser): Promise<バナー行[]> => withAdminSession(browser, SETUP_ADMIN, async (page) => {
  page.setDefaultTimeout(60_000);
  const p = new BannerSettingPage(page);
  await p.開く();
  return p.全行を読む();
});

/** 全行に値を入れて「バナー設定」を押し、保存できたことを確かめる */
const 全行を保存する = (browser: Browser, 行: バナー行[], 何を: string): Promise<void> => withAdminSession(browser, SETUP_ADMIN, async (page) => {
  page.setDefaultTimeout(60_000);
  const p = new BannerSettingPage(page);
  await p.開く();
  const ids = await p.行のID();
  if (JSON.stringify(ids) !== JSON.stringify(行.map((r) => r.ID))) throw new Error(`${何を}: 画面の行（ID ${ids.join("・")}）が入れる行（ID ${行.map((r) => r.ID).join("・")}）と違う`);
  for (const r of 行) await p.行に入れる(r.ID, { 画像URL: r.画像URL, リンク先URL: r.リンク先URL, 言語: r.言語, 表示タイプ: r.表示タイプ, 画像alt属性: r.画像alt属性, 並び順: String(r.ID) });
  const res = await p.設定を押す();
  if (!res.送った) throw new Error(`${何を}: バナー設定の要求が送られない`);
  if (res.エラー.length || !res.成功.length) throw new Error(`${何を}: 保存できなかった（成功の表示=${res.成功.join(" / ") || "なし"}／エラーの表示=${res.エラー.join(" / ") || "なし"}／移った先=${res.行き先}）`);
});

/** 保存すると画面の値がどうなるか（画像URLが空の行は「非表示」、並び順は行の ID） */
const 保存後の形 = (行: バナー行[]): バナー行[] => 行.map((r) => ({ ...r, 表示タイプ: r.画像URL.trim() === "" ? "非表示" : r.表示タイプ, 並び順: String(r.ID) }));
const 同じ = (a: バナー行[], b: バナー行[]): boolean => JSON.stringify(a) === JSON.stringify(b);

/** 元の値を画面から保存し直せるか（保存し直しても同じ値になるか）。戻せない行の説明を返す（空なら戻せる） */
function 戻せない行(前: バナー行[]): string[] {
  const out: string[] = [];
  for (const r of 前) {
    const why: string[] = [];
    if (r.画像URL.length > 255 || r.リンク先URL.length > 255) why.push("画像URLかリンク先URLが255文字を超える");
    if (/admin\.hareruyamtg\.com/.test(r.画像URL)) why.push("画像URLが管理画面のホストを指す（入力規則で保存できない）");
    for (const [k, v] of [["画像URL", r.画像URL], ["リンク先URL", r.リンク先URL], ["画像alt属性", r.画像alt属性]] as const) if (v !== v.trim()) why.push(`${k}の前後に空白がある（保存すると消える）`);
    if (r.画像URL.trim() === "" && r.表示タイプ !== "非表示") why.push("画像URLが空なのに表示タイプが「非表示」でない（保存すると「非表示」になる）");
    if (!["表示", "非表示"].includes(r.表示タイプ)) why.push(`表示タイプが「${r.表示タイプ}」`);
    if (why.length) out.push(`ID ${r.ID}: ${why.join("・")}`);
  }
  return out;
}

const 空の行: Omit<バナー行, "ID"> = { 画像URL: "", リンク先URL: "", 言語: [], 表示タイプ: "非表示", 画像alt属性: "", 並び順: "" };

/**
 * 共有トップバナー設定を、全行を控えてから 値 にする（値に無い行は空・非表示）。ケースの終わりに基盤が控えた値へ戻して確かめる。
 * 書き換えたあと、画面の値が求める値になったかを確かめる。
 */
export async function バナー設定を控えて書き換える(browser: Browser, seedId: string, 値: Record<number, バナー入力>): Promise<void> {
  共有の書き換えを許す(seedId);
  const 前 = await 全行を読む(browser);
  const 無いID = Object.keys(値).map(Number).filter((id) => !前.some((r) => r.ID === id));
  if (無いID.length) throw new Error(`${seedId}: トップバナー管理画面に ID ${無いID.join("・")} の行が無い（行は ID ${前.map((r) => r.ID).join("・")}）`);
  const 戻せない = 戻せない行(前);
  if (戻せない.length) throw new Error(`${seedId}: いまの共有トップバナー設定は、画面から保存し直すと値が変わり元に戻せないので書き換えない（${戻せない.join("／")}）`);
  registerRestore(
    `共有トップバナー設定（全${前.length}行。${seedId}）`,
    前,
    async () => { await 全行を保存する(browser, 前, "共有トップバナー設定を元の値へ戻す"); },
    async () => 同じ(await 全行を読む(browser), 保存後の形(前)),
  );
  const 後: バナー行[] = 前.map((r) => ({ ID: r.ID, ...空の行, ...(値[r.ID] ?? {}), 並び順: String(r.ID) }));
  await 全行を保存する(browser, 後, `${seedId} の共有トップバナー設定`);
  const 今 = await 全行を読む(browser);
  if (!同じ(今, 保存後の形(後))) {
    const 違う = 今.filter((r, i) => JSON.stringify(r) !== JSON.stringify(保存後の形(後)[i])).map((r) => `ID ${r.ID}`);
    throw new Error(`${seedId}: 共有トップバナー設定を書き換えたが、開き直した画面の値が求める値と違う（${違う.join("・")}）`);
  }
  reportSeedIssue(seedId, `共有トップバナー設定（全${前.length}行）を、画面で全項目を控えてから、正本の値（ID ${Object.keys(値).join("・") || "なし"}）に書き換えた。正本に値の無い行は空・非表示にした。ケースの終わりに画面で控えた値へ戻し、開き直して同じことを確かめる`);
}

const U = (p: string) => `https://replace-dev.hareruyamtg.com:8443/${p}`;
/** 正本の「先頭行・次行」の2行（ID 1＝日本語・表示、ID 2＝英語・表示） */
export const 二行の値 = (前: string, alt: string): Record<number, バナー入力> => ({
  1: { 画像URL: U(`cdn/${前}-1.png`), リンク先URL: U(`${前}-one`), 言語: ["日本語"], 表示タイプ: "表示", 画像alt属性: `${alt}-1` },
  2: { 画像URL: U(`cdn/${前}-2.png`), リンク先URL: U(`${前}-two`), 言語: ["英語"], 表示タイプ: "表示", 画像alt属性: `${alt}-2` },
});

/** 準備のシードがアップロードした画像（シードID → 画像のURL）。ケースが使う */
const 準備した = new Map<string, string[]>();
export function 準備した画像(seedId: string): string[] {
  const v = 準備した.get(seedId);
  if (!v) throw new Error(`${seedId} の準備の画像がまだ無い`);
  return v;
}

async function 店舗Aへ用意する(browser: Browser, seedId: string, 呼び名: string[]): Promise<string[]> {
  const urls = await withAdminSession(browser, M1601_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new TopBannerPage(page);
    const out: string[] = [];
    for (let i = 0; i < 呼び名.length; i++) out.push(await 準備のアップロード(p, 店舗A.店名, 入力ファイル("m1602-valid.png")));
    return out;
  });
  準備した.set(seedId, urls);
  reportSeedIssue(seedId, `正本の「${呼び名.join("」「")}」の代わりに、「${店舗A.店名}」へ画面から画像（有効なPNG）をアップロードした（ファイル名は画面が採番する）: ${urls.join("、")}`);
  return urls;
}

const 二行のケース: [string, string, string][] = [
  ["S-M16-01-PREP-001", "m1601c001", "M1601C001"], ["S-M16-01-PREP-006", "m1601c006", "M1601C006"], ["S-M16-01-PREP-007", "m1601c007", "M1601C007"],
  ["S-M16-01-PREP-008", "m1601c008", "M1601C008"], ["S-M16-01-PREP-017", "m1601c017", "M1601C017"], ["S-M16-01-PREP-018", "m1601c018", "M1601C018"],
  ["S-M16-01-PREP-022", "m1601c022", "M1601C022"], ["S-M16-01-PREP-023", "m1601c023", "M1601C023"], ["S-M16-01-PREP-033", "m1601c033", "M1601C033"],
  ["S-M16-01-RETURN-050", "m1601-050", "M1601-050"], ["S-M16-01-CBPREP-052", "m1601cb052", "M1601CB052"], ["S-M16-01-CBPREP-053", "m1601cb053", "M1601CB053"],
  ["S-M16-01-CBPREP-054", "m1601cb054", "M1601CB054"], ["S-M16-01-CBPREP-055", "m1601cb055", "M1601CB055"],
];
for (const [sid, 前, alt] of 二行のケース) {
  defineSeed(sid, { needs: ["S-M16-01-ADM"] }, async ({ browser }) => { await バナー設定を控えて書き換える(browser, sid, 二行の値(前, alt)); });
}

defineSeed("S-M16-01-PREP-010", { needs: ["S-M16-01-ADM", "S-M16-01-SHOPS"] }, async ({ browser, seed }) => {
  await バナー設定を控えて書き換える(browser, seed.シードID, 二行の値("m1601c010", "M1601C010"));
  await 店舗Aへ用意する(browser, seed.シードID, ["m1601c010-store.png"]);
  reportSeedIssue(seed.シードID, "バナー用フォルダ直下へ m1601c010-root.png を置く準備は、画面に店舗を選ばないアップロードが無いので行っていない。店舗Aのフォルダとバナー用フォルダ直下を空にする操作も行っていない（ほかの方の画像があるため）");
});

defineSeed("S-M16-01-PREP-043", { needs: ["S-M16-01-ADM", "S-M16-01-SHOPS"] }, async ({ browser, seed }) => {
  const [url] = await 店舗Aへ用意する(browser, seed.シードID, ["referenced.png"]);
  const v = 二行の値("m1601c043", "M1601C043");
  v[1] = { ...v[1], 画像URL: url };
  await バナー設定を控えて書き換える(browser, seed.シードID, v);
  reportSeedIssue(seed.シードID, `ID 1の画像URLは、正本の「…/files/banner/top/store-a/referenced.png」の代わりに、店舗Aへアップロードした画像のURL（${url}）にした`);
});

defineSeed("S-M16-01-CBPREP-056", { needs: ["S-M16-01-ADM", "S-M16-01-SHOPS"] }, async ({ browser, seed }) => {
  await 店舗Aへ用意する(browser, seed.シードID, ["cb056-unref.png"]);
  await バナー設定を控えて書き換える(browser, seed.シードID, 二行の値("m1601cb056", "M1601CB056"));
  reportSeedIssue(seed.シードID, "店舗Aのフォルダを空にする操作は行っていない（E2E の試験店舗の前の実行の画像が残ることがある）。ケースは、アップロードした画像が消えることを確かめる");
});

defineSeed("S-M16-01-PREP-019", async ({ browser, seed }) => {
  await バナー設定を控えて書き換える(browser, seed.シードID, {
    1: { 画像URL: U("cdn/m1601c019-jp.png"), 表示タイプ: "表示", 言語: ["日本語"], 画像alt属性: "JP表示対象バナー" },
    2: { 画像URL: U("cdn/m1601c019-en.png"), 表示タイプ: "表示", 言語: ["英語"], 画像alt属性: "EN非対象バナー-019" },
    3: { 画像URL: "", 表示タイプ: "表示", 言語: ["日本語"] },
    4: { 画像URL: U("cdn/m1601c019-hidden.png"), 表示タイプ: "非表示", 言語: ["日本語"] },
    5: { 画像URL: U("cdn/m1601c019-nolang.png"), 表示タイプ: "表示", 言語: [] },
  });
  reportSeedIssue(seed.シードID, "ID 3（画像URL空・表示）は、画面で「表示」を選んで保存したが、画像URLが空なので「非表示」で保存される（シード表は DB で直接設定すると定める。画面では作れない）");
});
defineSeed("S-M16-01-PREP-020", async ({ browser, seed }) => {
  await バナー設定を控えて書き換える(browser, seed.シードID, {
    1: { 画像URL: U("cdn/m1601c020-jp.png"), 表示タイプ: "表示", 言語: ["日本語"], 画像alt属性: "JP非対象バナー-020" },
    2: { 画像URL: U("cdn/m1601c020-en.png"), 表示タイプ: "表示", 言語: ["英語"], 画像alt属性: "EN表示対象バナー" },
    3: { 画像URL: "", 表示タイプ: "表示", 言語: ["英語"] },
    4: { 画像URL: U("cdn/m1601c020-hidden.png"), 表示タイプ: "非表示", 言語: ["英語"] },
    5: { 画像URL: U("cdn/m1601c020-nolang.png"), 表示タイプ: "表示", 言語: [] },
  });
  reportSeedIssue(seed.シードID, "ID 3（画像URL空・表示）は、画面で「表示」を選んで保存したが、画像URLが空なので「非表示」で保存される（シード表は DB で直接設定すると定める。画面では作れない）");
});
defineSeed("S-M16-01-PREP-021", async ({ browser, seed }) => {
  const v: Record<number, バナー入力> = {};
  for (let i = 1; i <= 11; i++) v[i] = { 画像URL: U(`cdn/m1601c021-${String(i).padStart(2, "0")}.png`), 言語: ["日本語"], 表示タイプ: "表示" };
  await バナー設定を控えて書き換える(browser, seed.シードID, v);
});
defineSeed("S-M16-01-PREP-051", async ({ browser, seed }) => {
  await バナー設定を控えて書き換える(browser, seed.シードID, {
    1: { 画像URL: U("cdn/m1601c051-both.png"), 言語: ["日本語", "英語"], 表示タイプ: "表示", 画像alt属性: "両言語表示バナー-M1601-051" },
  });
});
for (const [sid, 前, alt] of [["S-M16-01-L-PREP-047", "m1601l001", "L001M1601n047連携バナー"], ["S-M16-01-L-PREP-048", "m1601l002", "L002M1601n048連携バナー"]] as const) {
  defineSeed(sid, { needs: ["S-M16-01-L-ADM"] }, async ({ browser }) => {
    const v: Record<number, バナー入力> = {
      1: { 画像URL: U(`cdn/${前}-1.png`), リンク先URL: U(`${前}-one`), 言語: ["日本語"], 表示タイプ: "表示", 画像alt属性: `${alt}1` },
      2: { 画像URL: U(`cdn/${前}-2.png`), リンク先URL: U(`${前}-two`), 言語: ["日本語"], 表示タイプ: "表示", 画像alt属性: `${alt}2` },
    };
    for (let i = 3; i <= 11; i++) v[i] = { 画像URL: "", 言語: ["日本語"], 表示タイプ: "非表示" };
    await バナー設定を控えて書き換える(browser, sid, v);
  });
}

// ---- 005 店舗A・店舗Bのフォルダの画像（E2E の試験店舗だけを空にしてから、画面でアップロードする） ----

/** 試験店舗のフォルダの画像を、画面の「削除」で全部消す（E2E が作った試験店舗だけ。店名の末尾の印で確かめる） */
async function 試験店舗の画像を空にする(p: TopBannerPage, 店名: string): Promise<number> {
  // 店舗は作らず E2E の店舗（店舗ID 221・4973 など。使い回す店舗の表の区分が E2E のもの）を店舗A・Bにしたので、店名の末尾の印でなく表で確かめる
  if (!店名.endsWith("-M1601") && !E2Eの店舗.some((x) => x.店名 === 店名)) throw new Error(`「${店名}」は E2E の試験店舗でないので、画像を消さない`);
  await p.開く();
  await p.絞り込みを選ぶ(店名);
  let n = 0;
  for (let guard = 0; guard < 500; guard++) {
    const 行 = p.画像の行.first();
    if (!(await 行.count())) break;
    await p.削除してOKを押す(行);
    if ((await p.絞り込みの値()) !== 店名) await p.絞り込みを選ぶ(店名);
    n++;
  }
  if (await p.画像の行.count()) throw new Error(`「${店名}」の画像を消し切れない`);
  return n;
}

defineSeed("S-M16-01-PREP-005", { needs: ["S-M16-01-ADM", "S-M16-01-SHOPS"] }, async ({ browser, seed }) => {
  const r = await withAdminSession(browser, M1601_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new TopBannerPage(page);
    const 消したA = await 試験店舗の画像を空にする(p, 店舗A.店名);
    const 消したB = await 試験店舗の画像を空にする(p, 店舗B.店名);
    const a: string[] = [];
    for (let i = 0; i < 3; i++) a.push(await 準備のアップロード(p, 店舗A.店名, 入力ファイル("m1602-valid.png")));
    const b = await 準備のアップロード(p, 店舗B.店名, 入力ファイル("m1602-valid.png"));
    return { 消したA, 消したB, a, b };
  });
  準備した.set(seed.シードID, [...r.a, r.b]);
  reportSeedIssue(seed.シードID,
    `E2E の試験店舗A・Bのフォルダの画像（前の実行の残り。A ${r.消したA}件・B ${r.消したB}件）を画面の「削除」で消して空にし、` +
    `正本の a-001.png・a-002.png・a-003.png の代わりに店舗Aへ3回、m1601c005-b001.png の代わりに店舗Bへ1回、画面から画像をアップロードした（ファイル名は画面が採番する。` +
    `アップロードした順に a-001・a-002・a-003 にあたる）: A ${r.a.join("、")}／B ${r.b}。バナー用フォルダ直下の m1601c005-root.png は、画面に店舗を選ばないアップロードが無いので置いていない`);
});
