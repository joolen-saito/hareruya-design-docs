/**
 * M16-02 画像設定（トップバナー管理）のシード（画面操作）。正本: cases/M16-02_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）による読み替え:
 * - 店舗ID 1（本店）の店名・店名略称は書き換えない。シード表の「トーナメントセンター東京（tc）」と「結合試験店舗（zz）」は、
 *   E2E の試験用店舗（店名の末尾に印「-M1602」。3店）に読み替える。ケースの店舗「トーナメントセンター東京」は試験店舗A（略称 zy1）、
 *   「結合試験店舗」は試験店舗B（略称 zy2）。試験店舗C（略称 zy0）は、アップロードを一度もしない（画像が無い店舗を作るため）。
 *   略称はアップロード先のフォルダ名になる（保管先の「banner/top/略称/」）。一覧は保管先のキーの降順なので、他の店舗（tc など）より後ろに並ぶ「zy」で始めた。
 * - 保管先のトップバナー用フォルダ全体を空にする（PREP-008 など）は行わない（既存の画像は消さない）。0件のケースは試験店舗Cの絞り込みで、
 *   それ以外のケースは「アップロードの前後の一覧の差」で見る。
 * - 保管先へ名前を決めたファイルを置く準備（PREP-002 など）は、画面のアップロード（ファイル名は画面が採番する）に読み替える。
 *   ケースの中の事前の準備として、試験店舗へ画面から画像をアップロードし、増えた画像のURLを使う（spec の注記に残す）。
 *   2000件・2001件の準備（PREP-006・007）は大量のデータなので作らない（ケースは実装しない）。
 *
 * 作るシード:
 * - S-M16-02-ADM: メンバー登録画面で管理者（ログインID m1602_admin）を登録する（あれば内容を確かめて使う）。管理者IDは画面が振るので、シード表の 160200 にはならない。
 *   権限は「システム管理者」にした（シード表は「画像設定を操作できる」とだけ書く。データ管理を操作でき、店舗の行の制限を受けず全店舗が選択肢に出る。
 *   「店舗オーナー」「店舗オペレーター」は所属店舗しか見えない。M13-11 の記録 2026-11-09）。所属店舗は店舗ID 1。
 * - S-M16-02-STORES: 試験店舗A・B・C を店舗登録画面で用意する（あれば使い、店名略称が決めた値であることを確かめる。書き換えない）。
 *   ほかの必須項目はシード表が「任意の有効な値」とするだけなので、他の店舗と重ならない値にした（店名(英語表記)・支店URL など）。店舗Bの店舗IDを控える。
 * - S-M16-02-UPLOAD: e2e/fixtures/m16-02/ に置いた入力ファイル（種別と大きさはシード表のとおり。作り方は同じ場所の README.md）。
 *   ファイルの大きさと、先頭の数バイトで画像の種別を確かめる。
 * - S-M16-02-PREP-008・009・010・011・012・015・016・022: 何も消さない。試験店舗を確かめるだけ（上の読み替え）。
 * - S-M16-02-PREP-002〜005・017〜020・025、PREPDP-026〜028、CBPREP-029〜036: 画像は作らない。ケースが事前の準備として画面からアップロードする（上の読み替え）。
 *
 * 作らないシード（それを使うケースは実装しない）:
 * - S-M16-02-PREP-006・007: 2000件・2001件の画像（大量のデータ）。
 */
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { ensureMemberFixed as ensureMember } from "../pages/admin/member";
import { 本店の店名 } from "../pages/admin/m05_admin_member";
import { 店舗の店名と略称, 画像の種別, 画像の種別を見る } from "../pages/admin/m16_02_top_banner";
import { 店舗IDで選ぶ, 表の店舗 } from "../pages/admin/store_pick";

export const M1602_ADMIN: Account = { loginId: "m1602_admin", password: "Passw0rd!M1602" };

/** 試験店舗A（シード表の「トーナメントセンター東京」「tc」の読み替え）・B（「結合試験店舗」「zz」）・C（画像を上げない店舗） */
/**
 * 依頼者決定 2026-11-15「店舗は作るのもう禁止」により、E2E の店舗 221・4973 を A・B に、4974 を C に当てる（店舗は作らない）。
 * 一覧は保管先のキー（banner/top/略称/）の降順で、005 は「B の画像が A の画像より前」と確かめるので、A・B は店名略称（保管先のフォルダ名）の小さい方を A にする。
 * 店名・略称は S-M16-02-STORES が店舗編集画面から読んで入れる（ケースは実行時に読む）。C は画像をアップロードしない（4974 には誰もトップバナーを上げない）。
 */
export const 店舗A = { 店名: "", 略称: "" };
export const 店舗B = { 店名: "", 略称: "" };
export const 店舗C = { 店名: 表の店舗("4974").店名, 略称: "" };

/** 入力ファイルの置き場 */
export const M1602_FILES = path.join(REPO_ROOT, "e2e", "fixtures", "m16-02");
export const 入力ファイル = (name: string): string => path.join(M1602_FILES, name);

// ---- 管理者 ----

defineSeed("S-M16-02-ADM", async ({ browser }) => {
  const shop = await 本店の店名(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureMember(page, {
      名前: "m1602 画像設定試験管理者", 所属店舗: shop, ログインID: M1602_ADMIN.loginId, メールアドレス: `${M1602_ADMIN.loginId}@example.test`,
      パスワード: M1602_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
    });
  });
});

// ---- 店舗 ----

defineSeed("S-M16-02-STORES", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const issue = (m: string) => reportSeedIssue(id, m);
    const 候補 = [] as { 店舗ID: string; 店名: string; 略称: string }[];
    for (const 店舗ID of ["221", "4973"]) {
      const s1 = await 店舗IDで選ぶ(page, 店舗ID, "トップバナー試験店舗", () => undefined);
      const v = await 店舗の店名と略称(page, s1.id);
      候補.push({ 店舗ID: s1.id, 店名: s1.店名, 略称: v.略称 });
    }
    const c = await 店舗IDで選ぶ(page, "4974", "画像のない店舗", issue);
    const vc = await 店舗の店名と略称(page, c.id);
    店舗C.店名 = c.店名; 店舗C.略称 = vc.略称;
    const [a, b] = [...候補].sort((x, y) => (x.略称 < y.略称 ? -1 : 1));
    if (!a.略称 || !b.略称 || a.略称 === b.略称 || !vc.略称) throw new Error(`${id}: 当てた店舗の店名略称（保管先のフォルダ名）が空か重なっている（${候補.map((x) => `${x.店舗ID}=${x.略称}`).join("・")}・4974=${vc.略称}）`);
    店舗A.店名 = a.店名; 店舗A.略称 = a.略称; 店舗B.店名 = b.店名; 店舗B.略称 = b.略称;
    notes.set("〔店舗ID-M1602-共有〕", b.店舗ID);
    reportSeedIssue(id, `店舗ID 1 の店名・店名略称の書き換えは行わず、E2E の店舗に読み替えた（店舗は作らない。依頼者 2026-11-15）: 試験店舗A「${a.店名}」（店舗ID ${a.店舗ID}・略称 ${a.略称}）・試験店舗B「${b.店名}」（店舗ID ${b.店舗ID}・略称 ${b.略称}）・試験店舗C「${c.店名}」（店舗ID ${c.id}・略称 ${vc.略称}）。`
      + "「トーナメントセンター東京（tc）」は試験店舗A、「結合試験店舗（zz）」は試験店舗B。試験店舗Cは画像をアップロードしない店舗（0件のケース用）。AとBは、一覧の並び（保管先のキーの降順）で B が A より前になるよう、略称の小さい方を A にした");
  });
});

// ---- 入力ファイル ----

/** シード表の条件（種別と大きさ）を満たすかを確かめる。満たさなければ止める */
function 入力ファイルを確かめる(seedId: string, name: string, want: 画像の種別, size: { 以下?: number; ちょうど?: number }): void {
  const p = 入力ファイル(name);
  if (!fs.existsSync(p)) throw new Error(`${seedId}: 入力ファイル ${name} が e2e/fixtures/m16-02/ に無い`);
  const b = fs.readFileSync(p);
  const got = 画像の種別を見る(b);
  if (got !== want) throw new Error(`${seedId}: ${name} の中身が${got}で、シード表の${want}と違う`);
  if (size.以下 !== undefined && b.length > size.以下) throw new Error(`${seedId}: ${name} が ${b.length} バイトで、${size.以下} バイトを超える`);
  if (size.ちょうど !== undefined && b.length !== size.ちょうど) throw new Error(`${seedId}: ${name} が ${b.length} バイトで、${size.ちょうど} バイトでない`);
}

defineSeed("S-M16-02-UPLOAD", async ({ seed }) => {
  const id = seed.シードID;
  入力ファイルを確かめる(id, "m1602-valid.gif", "GIF", { 以下: 520000 });
  入力ファイルを確かめる(id, "m1602-valid.jpeg", "JPEG", { 以下: 520000 });
  入力ファイルを確かめる(id, "m1602-valid.png", "PNG", { 以下: 520000 });
  入力ファイルを確かめる(id, "OriginalBanner.PNG", "PNG", { 以下: 520000 });
  入力ファイルを確かめる(id, "m1602-520000.png", "PNG", { ちょうど: 520000 });
  入力ファイルを確かめる(id, "m1602-520001.png", "PNG", { ちょうど: 520001 });
  入力ファイルを確かめる(id, "m1602-not-image.png", "画像でない", { 以下: 520000 });
});

// ---- 保管先の画像（読み替え。何も消さない・直接置かない） ----

const 空にしない = "保管先のトップバナー用フォルダ全体を空にすることは行わず（既存の画像は消さない）、ケースの中でアップロードの前後の一覧の差、または画像を上げない試験店舗Cの絞り込みで見る";
function defineEmptySeed(seedId: string): void {
  defineSeed(seedId, { needs: ["S-M16-02-ADM", "S-M16-02-STORES"] }, async () => {
    reportSeedIssue(seedId, `シード表の「ストレージシードで空にする」は、${空にしない}`);
  });
}

function definePutSeed(seedId: string): void {
  defineSeed(seedId, { needs: ["S-M16-02-ADM", "S-M16-02-STORES", "S-M16-02-UPLOAD"] }, async () => {
    reportSeedIssue(seedId, "シード表の「ストレージシードで名前を決めた画像を置く」は、ケースの中の事前の準備として試験店舗へ画面から画像（m1602-valid.png）をアップロードし、"
      + "増えた画像（ファイル名は画面が採番する）を使う、に読み替えた。保管先のそのほかの画像（ほかの店舗・既存）は消さないので、「だけが存在する」は、使う画像が見えるか・見えないかで確かめる");
  });
}

defineEmptySeed("S-M16-02-PREP-008");
defineEmptySeed("S-M16-02-PREP-009");
defineEmptySeed("S-M16-02-PREP-010");
defineEmptySeed("S-M16-02-PREP-011");
defineEmptySeed("S-M16-02-PREP-012");
defineEmptySeed("S-M16-02-PREP-015");
defineEmptySeed("S-M16-02-PREP-016");
defineEmptySeed("S-M16-02-PREP-022");
definePutSeed("S-M16-02-PREP-002");
definePutSeed("S-M16-02-PREP-003");
definePutSeed("S-M16-02-PREP-004");
definePutSeed("S-M16-02-PREP-005");
definePutSeed("S-M16-02-PREP-017");
definePutSeed("S-M16-02-PREP-018");
definePutSeed("S-M16-02-PREP-019");
definePutSeed("S-M16-02-PREP-020");
definePutSeed("S-M16-02-PREP-025");
definePutSeed("S-M16-02-PREPDP-026");
definePutSeed("S-M16-02-PREPDP-027");
definePutSeed("S-M16-02-PREPDP-028");
definePutSeed("S-M16-02-CBPREP-029");
definePutSeed("S-M16-02-CBPREP-030");
definePutSeed("S-M16-02-CBPREP-031");
definePutSeed("S-M16-02-CBPREP-032");
definePutSeed("S-M16-02-CBPREP-033");
definePutSeed("S-M16-02-CBPREP-034");
definePutSeed("S-M16-02-CBPREP-035");
definePutSeed("S-M16-02-CBPREP-036");
