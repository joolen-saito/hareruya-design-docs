/**
 * M13-15 画像設定のシード（画面操作）。正本: cases/M13-15_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）による読み替え:
 * - 既存の店舗（「東京店」tc・「大阪店」os・「名古屋店」など）の画像は消さない・書き換えない。シード表の「東京店」「大阪店」「名古屋店」は、
 *   E2E の店舗（東京店 = 店舗ID 221・大阪店 = 4973・名古屋店 = 4974。店舗は作らない。依頼者 2026-11-15）に読み替える。
 *   シード表の識別子「tc」「os」「nk」は、試験店舗の支店URL（保管先のフォルダ名）に読み替える（名古屋店の識別子の食い違いもこれで無くなる）。
 * - 「画像URL=…／ほかのイベントバナー画像なし」「画像=0件」など、保管先へ名前を決めたファイルを置く・全て消す準備は行わない。
 *   ケースの冒頭（手順の前）で、試験店舗へ画面から画像をアップロードし（ファイル名は画面が採番する）、増えた分・アップロードの前後の差で確かめる。
 *   名古屋店の画像（管理者に編集権限が無い店舗の画像）だけは、名古屋店だけに編集権限のある管理者（m1315_admin-nagoya）が、無ければ1枚アップロードして用意する。
 * - S-M13-15-BANNER-SETTING（バナー設定の全枠を空・非表示にする）は共有の設定の書き換えなので行わない。ケースが前後の内容を比べる。
 * 作らない（実装しない）ケース: 012・017（2000件・2001件の大量の画像）、018（保管先の下の区分フォルダ。画面のアップロードでは作れない）。
 *
 * 作るシード:
 * - S-M13-15-SHOPS: 当てた3店舗（上の読み替え）が店舗一覧にあることを店舗IDで確かめ、店舗IDを控え、店舗編集画面から支店URL（保管先の識別子）を読む（3店舗で重ならないこと）。
 * - S-M13-15-UPLOAD-FILES: e2e/fixtures/m13-15/ に置いた入力ファイル（形式と大きさはシード表のとおり。作り方は同じ場所の README.md）。
 *   ファイルの大きさと、先頭の数バイトで画像の種別（GIF・JPEG・PNG・画像でない）を確かめる。
 * - S-M13-15-CASE-0NN（実装した各ケースの番号）: メンバー登録画面で管理者（ログインID m1315_admin-0NN）を登録し、メンバー編集画面のアドレスの番号を控える。
 *   権限は「モールオペレーター」で代える（シード表は「画像設定画面を利用できる権限」とだけ書く。「店舗オーナー」は所属店舗の店舗しか見えず、
 *   大阪店を扱えない。M13-11 の記録 2026-11-09）。登録済みなら内容を確かめて使う（ログインIDは決め打ちで、二重に登録できない）。
 *   画像を消して0件にする準備は行わない（ケースがアップロードの前後の差で見る）。
 * - S-M13-15-QK-IMAGE-037: 入力ファイル QK-1315-001.png（PNG・520000バイト以下）を確かめ、qk1302admin でバナー設定の画像URLを空にし、
 *   開き直して識別番号1〜15の画像URLが空であること、画像の一覧に QK-1315-001.png が無いことを確かめる。
 *   S-M13-02-QK-ADM・QK-MASTERS は seeds/m13-02-qk.ts（M13-13 の担当が書いたものをそのまま使う）。
 *
 * 作らないシード（それを使うケースは実装しない）:
 * - S-M13-15-CASE-012・017・018: 2000件・2001件の大量の画像、保管先の下の区分フォルダ（画面のアップロードでは作れない）。
 */
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, SETUP_ADMIN } from "../config/env";
import { rcFixed } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { BannerImagePage, ファイル名, 店舗の支店URL } from "../pages/admin/m13_15_banner_image";
import { ensureMemberFixed as ensureMember } from "../pages/admin/member";
import { 店舗IDで選ぶ, 表の店舗 } from "../pages/admin/store_pick";
import { QK1302_ADMIN } from "./m13-02-qk";

/** 正本の「東京店」は E2E の店舗 221、「大阪店」は 4973、「名古屋店」は 4974（店舗は作らない。依頼者 2026-11-15。画像のアップロードで書き換えるので E2E の店舗だけを使う） */
export const 東京店 = 表の店舗("221").店名;
export const 大阪店 = 表の店舗("4973").店名;
export const 名古屋店 = 表の店舗("4974").店名;
/** 当てた店舗の支店URL（保管先のフォルダ名。シード表の識別子 tc・os・nk の読み替え）。S-M13-15-SHOPS が店舗編集画面から読んで入れる */
export let 東京店の識別子 = "";
export let 大阪店の識別子 = "";
export let 名古屋店の識別子 = "";

/** 入力ファイルの置き場 */
export const M1315_FILES = path.join(REPO_ROOT, "e2e", "fixtures", "m13-15");
export const 入力ファイル = (name: string): string => path.join(M1315_FILES, name);

/** 名古屋店だけに編集権限のある管理者（名古屋店の画像を用意する。ケースの管理者は名古屋店を編集できない） */
export const M1315_NAGOYA: Account = { loginId: "m1315_admin-nagoya", password: "M1315PassNagoyaX" };

/**
 * ケースの番号（"001" など）の管理者。ログインID（＝名前）は正本の「m1315_admin-0NN」に決まった印を付けた値（m1315_admin-0NN-e2e）にする。
 * 開発環境には、試験店舗へ読み替える前の E2E（2026-11-10）が作った「m1315_admin-001」（所属・編集可能店舗が既存の東京店・大阪店）が残っていて、
 * ログインIDで選ぶと内容が違って止まる（2026-11-14 の 001）。ほかの方の試験の管理者とも重ならないよう、印つきの値で1度だけ作って使い回す。
 */
export const M1315_ADMIN = (n: string): Account => ({ loginId: rcFixed(`m1315_admin-${n}`).toLowerCase(), password: `M1315Pass${n}X` });

// ---- 店舗 ----

const 店舗 = [
  { 控え: "〔店舗ID-M1315-共有A〕", 店舗ID: "221", 呼び名: "東京店" },
  { 控え: "〔店舗ID-M1315-共有B〕", 店舗ID: "4973", 呼び名: "大阪店" },
  { 控え: "〔店舗ID-M1315-共有C〕", 店舗ID: "4974", 呼び名: "名古屋店" },
] as const;

defineSeed("S-M13-15-SHOPS", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const urls: string[] = [];
    for (const { 控え, 店舗ID, 呼び名 } of 店舗) {
      const s = await 店舗IDで選ぶ(page, 店舗ID, 呼び名, (m) => reportSeedIssue(seed.シードID, m));
      urls.push(await 店舗の支店URL(page, s.id));
      notes.set(控え, s.id);
    }
    if (new Set(urls).size !== urls.length || urls.some((u) => !u)) throw new Error(`${seed.シードID}: 当てた3店舗の支店URLが空か重なっている（${urls.join("・")}）`);
    [東京店の識別子, 大阪店の識別子, 名古屋店の識別子] = urls;
    reportSeedIssue(seed.シードID, "既存の店舗の画像は消さない・書き換えない方針のため、シード表の東京店（tc）・大阪店（os）・名古屋店（nk）は、E2E の店舗"
      + `（${[東京店, 大阪店, 名古屋店].map((n, i) => `「${n}」（店舗ID ${店舗[i].店舗ID}・支店URL ${urls[i]}）`).join("・")}）に読み替えた（店舗は作らない。依頼者 2026-11-15）`);
  });
});

// ---- 入力ファイル ----

type 種別 = "GIF" | "JPEG" | "PNG" | "画像でない";
const 種別を見る = (b: Buffer): 種別 => {
  if (b.subarray(0, 6).toString("latin1") === "GIF87a" || b.subarray(0, 6).toString("latin1") === "GIF89a") return "GIF";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "JPEG";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "PNG";
  return "画像でない";
};

/** シード表の条件（種別と大きさ）を満たすかを確かめる。満たさなければ止める */
export function 入力ファイルを確かめる(seedId: string, name: string, want: 種別, size: { 以下?: number; ちょうど?: number }): void {
  const p = 入力ファイル(name);
  if (!fs.existsSync(p)) throw new Error(`${seedId}: 入力ファイル ${name} が e2e/fixtures/m13-15/ に無い`);
  const b = fs.readFileSync(p);
  const got = 種別を見る(b);
  if (got !== want) throw new Error(`${seedId}: ${name} の中身が${got}で、シード表の${want}と違う`);
  if (size.以下 !== undefined && b.length > size.以下) throw new Error(`${seedId}: ${name} が ${b.length} バイトで、${size.以下} バイトを超える`);
  if (size.ちょうど !== undefined && b.length !== size.ちょうど) throw new Error(`${seedId}: ${name} が ${b.length} バイトで、${size.ちょうど} バイトでない`);
}

defineSeed("S-M13-15-UPLOAD-FILES", async ({ seed }) => {
  const id = seed.シードID;
  入力ファイルを確かめる(id, "valid.gif", "GIF", { 以下: 520000 });
  入力ファイルを確かめる(id, "valid.jpg", "JPEG", { 以下: 520000 });
  入力ファイルを確かめる(id, "valid.png", "PNG", { 以下: 520000 });
  入力ファイルを確かめる(id, "original-name.JPG", "PNG", { 以下: 520000 });
  入力ファイルを確かめる(id, "size-520000.png", "PNG", { ちょうど: 520000 });
  入力ファイルを確かめる(id, "size-520001.png", "PNG", { ちょうど: 520001 });
  入力ファイルを確かめる(id, "not-image.png", "画像でない", { 以下: 520000 });
});

// ---- ケースごとの管理者 ----

async function 管理者を用意する(browser: import("@playwright/test").Browser, n: string): Promise<string> {
  const a = M1315_ADMIN(n);
  return withAdminSession(browser, SETUP_ADMIN, async (page) => ensureMember(page, {
    名前: a.loginId, 所属店舗: 東京店, ログインID: a.loginId, メールアドレス: `${a.loginId}@example.test`, パスワード: a.password,
    権限: "モールオペレーター", デフォルト検索表示店舗: 東京店, 編集可能店舗: [東京店, 大阪店],
  }));
}

/** 名古屋店だけに編集権限のある管理者で、名古屋店の画像が無ければ1枚アップロードする（画像のあるときは何もしない） */
async function 名古屋店の画像を用意する(browser: import("@playwright/test").Browser, seedId: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: M1315_NAGOYA.loginId, 所属店舗: 名古屋店, ログインID: M1315_NAGOYA.loginId, メールアドレス: `${M1315_NAGOYA.loginId}@example.test`,
      パスワード: M1315_NAGOYA.password, 権限: "モールオペレーター", デフォルト検索表示店舗: 名古屋店, 編集可能店舗: [名古屋店],
    });
  });
  await withAdminSession(browser, M1315_NAGOYA, async (page) => {
    const p = new BannerImagePage(page);
    await p.開く();
    await p.選択店舗を選ぶ(名古屋店);
    if ((await p.画像のURL()).length > 0) return;
    const r = await p.アップロードする(名古屋店, 入力ファイル("valid.png"));
    if (!r.送った) throw new Error("名古屋店の画像のアップロードで要求が送られない");
    reportSeedIssue(seedId, "シード表の名古屋店の画像（名前を決めて保管先へ直接置く）は、名古屋店だけに編集権限のある管理者が画面から valid.png をアップロードして用意した（名前は画面が採番する）");
  });
}

/** ケースの番号の管理者のシード。名古屋店を書いたものは、名古屋店の画像（編集権限の無い店舗の画像）も用意する */
function defineCaseAdminSeed(seedId: string, n: string, o: { 名古屋店の画像?: boolean; needs?: string[] } = {}): void {
  defineSeed(seedId, { needs: ["S-M13-15-SHOPS", ...(o.needs ?? [])] }, async ({ browser, notes, seed }) => {
    notes.set(`〔管理者ID-M1315-${n}〕`, await 管理者を用意する(browser, n));
    reportSeedIssue(seed.シードID, `管理者（ログインID m1315_admin-${n}）は、ログインID・名前に決まった印を付けた「${M1315_ADMIN(n).loginId}」で作った（開発環境に、試験店舗へ読み替える前に作った同じログインIDの管理者が残っていて、所属・編集可能店舗が違うため）`);
    if (o.名古屋店の画像) await 名古屋店の画像を用意する(browser, seed.シードID);
  });
}

defineCaseAdminSeed("S-M13-15-CASE-001", "001");
defineCaseAdminSeed("S-M13-15-CASE-002", "002");
defineCaseAdminSeed("S-M13-15-CASE-003", "003");
defineCaseAdminSeed("S-M13-15-CASE-004", "004");
defineCaseAdminSeed("S-M13-15-CASE-005", "005");
defineCaseAdminSeed("S-M13-15-CASE-006", "006");
defineCaseAdminSeed("S-M13-15-CASE-007", "007");
defineCaseAdminSeed("S-M13-15-CASE-009", "009");
defineCaseAdminSeed("S-M13-15-CASE-013", "013");
defineCaseAdminSeed("S-M13-15-CASE-014", "014", { 名古屋店の画像: true });
defineCaseAdminSeed("S-M13-15-CASE-015", "015");
defineCaseAdminSeed("S-M13-15-CASE-019", "019");
defineCaseAdminSeed("S-M13-15-CASE-020", "020", { 名古屋店の画像: true });
defineCaseAdminSeed("S-M13-15-CASE-021", "021");
defineCaseAdminSeed("S-M13-15-CASE-022", "022");
defineCaseAdminSeed("S-M13-15-CASE-023", "023");
defineCaseAdminSeed("S-M13-15-CASE-030", "030");
defineCaseAdminSeed("S-M13-15-CASE-031", "031", { needs: ["S-M16-02-ADM"] });
defineCaseAdminSeed("S-M13-15-CASE-032", "032");
defineCaseAdminSeed("S-M13-15-CASE-033", "033");
defineCaseAdminSeed("S-M13-15-CASE-034", "034");
defineCaseAdminSeed("S-M13-15-CASE-035", "035");
defineCaseAdminSeed("S-M13-15-CASE-036", "036");
defineCaseAdminSeed("S-M13-15-CBSORT-039", "039", { 名古屋店の画像: true });
defineCaseAdminSeed("S-M13-15-CBSORT-040", "040");

// 共有のバナー設定（識別番号1〜15）の全枠を空・非表示にする準備は、共有の設定の書き換えなので行わない。019 は前後の内容が同じことを確かめる
defineSeed("S-M13-15-BANNER-SETTING", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "共有のバナー設定（識別番号1〜15）は書き換えない。ケース（019）は、アップロードの前後でバナー設定の内容が変わらないことを、画面で読んで比べる");
});

// ---- 037 ----

defineSeed("S-M13-15-QK-IMAGE-037", { needs: ["S-M13-02-QK-ADM"] }, async ({ browser, seed }) => {
  入力ファイルを確かめる(seed.シードID, "QK-1315-001.png", "PNG", { 以下: 520000 });
  await withAdminSession(browser, QK1302_ADMIN, async (page) => {
    const p = new BannerImagePage(page);
    // ログインのあとの画面で、メニューの「イベント管理」→「バナー設定」を開く
    await p.イベント管理メニューを展開する();
    await p.メニューを押す(p.メニューの項目("バナー設定"));
    await p.読み込みを待つ();
    const n = await p.バナー設定の数();
    if (n < 15) throw new Error(`${seed.シードID}: バナー設定の識別番号が ${n} 個しかない（1〜15を求める）`);
    const filled: number[] = [];
    for (let i = 1; i <= n; i++) if ((await p.バナー設定の画像URL(i)).trim() !== "") filled.push(i);
    if (filled.length) {
      for (const i of filled) await p.バナー設定の画像URLを入れる(i, "");
      await p.バナー設定を押す("バナー設定の画像URLを空にする");
      reportSeedIssue(seed.シードID, `バナー設定の識別番号 ${filled.join("・")} の画像URLを空にして「バナー設定」を押した`);
    }
    await p.開く();
    const left: number[] = [];
    for (let i = 1; i <= 15; i++) if ((await p.バナー設定の画像URL(i)).trim() !== "") left.push(i);
    if (left.length) throw new Error(`${seed.シードID}: 開き直しても識別番号 ${left.join("・")} の画像URLが空でない`);
    const same = (await p.画像のURL()).filter((u) => ファイル名(u) === "QK-1315-001.png");
    if (same.length) throw new Error(`${seed.シードID}: 画像の一覧に QK-1315-001.png がある（${same.join("、")}）`);
  });
});
