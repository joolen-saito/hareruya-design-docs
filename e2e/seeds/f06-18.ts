/**
 * F06-18 会員情報変更のシード（画面操作）。正本: cases/F06-18_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）: テストデータは「既存データ または 自分で画面から作ったデータ」に読み替えてよい。DB へは書き込まない。
 * 読み替えたことは、シードの注記（エビデンスの「シード作成時の問題」）に残す。
 *
 * - 会員: フロントの会員情報登録画面で登録し、本会員にする（本登録のメールを読める手元の環境はメールのURL、読めない環境は管理画面で本会員にする。
 *   pages/front/m08_member.ts）。メールアドレスの前半には実行の印を付ける（依頼者決定 2026-10-28）。パスワードには付けない。
 *   「DBフィクスチャで同じ専用IDのデータを削除してから登録する」は、印を付けた新しいメールアドレスで登録することに読み替える（削除はしない）。
 *   シード表の決め打ちの会員レコードID・会員ID（306180015・member06180001-015 など）は画面で指定できないので、登録時に画面が振った番号を使う。
 * - 本人確認ステータス: 「確認済み」は管理画面の会員登録/編集で「オンライン本人確認済み」を選んで登録する（S-F06-18-JP の投入方法のとおり）。
 *   「簡易書留確認済み」も同じ画面で選ぶ。067 の「オンライン本人確認済み（身分証有効期限 2030/12/31）」はオンライン本人確認のポップアップで行う。
 * - スマレジ: スマレジ試験環境の接続・会員番号は共有の環境の設定のまま使う（書き換えない・スマレジ側で会員番号を設定しない）。
 *   「スマレジ会員番号なし（DBで空にする）」は行わない。ケースはスマレジ会員番号を確かめない。
 * - 選手情報更新日時（2026-09-01）は画面で指定できないので設定しない。ケースは変更の前後を比べる。
 * - 共有の設定（自動ログイン機能・仮会員機能）は書き換えない。いまの値が前提と同じかを管理画面で確かめ、違えば止める。
 * - 職業（会社員・学生）は共有のマスタに足さない。職業マスタに既にあることを確かめて使う（無ければ止める）。
 * - ブラックリスト（S-F06-18-BLACKLIST。PM 指示 2026-11-10）: 氏名・住所のキーワードは実行の印つきの値（「禁止会員-印」「東京都ブラックリスト住所1番地-印」）で登録し、
 *   ケースの会員も同じ印つきの値（お名前(名)「会員-印」・住所2「1番地-印」）に変えて照合させる。電話番号は数字なので固定の「0399999999」を、あれば使い無ければ登録する。
 *   行は消さない。PC-ENV の「0件にする」は、ケースが使う値と一致する行が無いことを確かめる形に読み替える（消さない）。
 */
import { Browser, Cookie } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 選手情報ID } from "../db/f06_18";
import { available } from "../lib/db";
import { rc } from "../lib/run_marker";
import { reportSeedIssue, SeedCtx } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { blacklistRows, ensureBlacklist, ensureMemberAdmin, readRememberMe, readTempMember } from "../pages/admin/f06_masters";
import { お届け先, お届け先を足す, スマレジIDを読む, 配送先の番号 } from "../pages/admin/f06_18_setup";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { 職業の行を読む, 職業マスタを開く } from "../pages/admin/m11_05_master";
import { 入力値 } from "../pages/front/f06_01_entry";
import { 会員としてログインする, 自動ログイン用Cookie } from "../pages/front/f06_18_change";
import { フロントで会員登録する } from "../pages/front/m08_member";

// ---------------------------------------------------------------------------
// 値
// ---------------------------------------------------------------------------

/** メールアドレスの前半に実行の印を付ける（ドメインはシード表のまま） */
export const 印つきメール = (addr: string): string => {
  const [前半, ドメイン] = addr.split("@");
  return `${rc(前半)}@${ドメイン}`;
};

export const PC_ADMIN = { loginId: "f0618pc-admin", password: "Passw0rd-PC0618" };

type 登録値 = Omit<入力値, "メール" | "パスワード">;

/** S-F06-18-JP の値（国内住所の会員。ほかの国内の会員も「その他の必須項目は有効」としてこの値で作る） */
export const 国内の値: 登録値 = {
  姓: "佐藤", 名: "太郎", セイ: "サトウ", メイ: "タロウ", 生年月日: ["1990", "1", "2"], 性別: "男性", 国: "Japan",
  郵便番号: "100-0001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1番", 電話番号: "0311111111", 会社名: "試験会社", 職業: "会社員",
};
/** S-F06-18-OVERSEAS の値（海外住所の会員） */
export const 海外の値: 登録値 = {
  姓: "Smith", 名: "John", セイ: "スミス", メイ: "ジョン", 生年月日: ["1985", "4", "5"], 性別: "男性", 国: "United States",
  郵便番号: "1234567890", 住所1: "350 Fifth Avenue", 住所2: "New York", 住所3: "Suite 1801", 電話番号: "0312222222", 会社名: "海外試験会社", 職業: "会社員",
};
/** PC-MEMBER の値（晴屋 太郎） */
export const PC会員の値: 登録値 = {
  姓: "晴屋", 名: "太郎", セイ: "ハレヤ", メイ: "タロウ", 生年月日: ["1990", "1", "2"], 性別: "男性", 国: "Japan",
  郵便番号: "1000001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1番", 電話番号: "0312345678", 会社名: "晴屋商事",
};

export type 本人確認 = "未確認" | "オンライン本人確認済み" | "簡易書留確認済み";

/** この実行で作った会員。キーはシードID */
export type 作った会員 = { 会員ID: string; メール: string; パスワード: string; 本人確認: string };
const 会員一覧 = new Map<string, 作った会員>();
export function 会員(seedId: string): 作った会員 {
  const m = 会員一覧.get(seedId);
  if (!m) throw new Error(`${seedId} の会員を、この実行のシードが作っていない`);
  return m;
}
/** 自動ログイン用Cookie（AUTO-002・003 が作る）。キーはシードID */
const 自動ログインの控え = new Map<string, Cookie[]>();
export function 自動ログインのCookie(seedId: string): Cookie[] {
  const c = 自動ログインの控え.get(seedId);
  if (!c) throw new Error(`${seedId} の自動ログイン用Cookieを、この実行のシードが作っていない`);
  return c;
}
/** S-F06-18-NONDEF-071 の既定でない配送先 */
export const 既定でない配送先: お届け先 = {
  配送先名称: "別宛", 姓: "別宛", 名: "花子", セイ: "ベツアテ", メイ: "ハナコ", 郵便番号: "530-0001", 都道府県: "大阪府",
  住所1: "大阪市北区梅田", 住所2: "3番", 会社名: "別宛会社", 電話: "0699998888",
};

// ---------------------------------------------------------------------------
// 作り方
// ---------------------------------------------------------------------------

const 管理画面 = <T>(browser: Browser, fn: (page: import("@playwright/test").Page) => Promise<T>) =>
  withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

/** 管理画面の会員一覧でメールアドレスを検索して会員IDを読む（登録直後は検索に出るまで遅れることがあるので、間をおいて検索し直す） */
async function 会員IDを探す(browser: Browser, メール: string): Promise<string> {
  return 管理画面(browser, async (page) => {
    for (let i = 0; ; i++) {
      await searchCustomer(page, メール);
      const id = await resultCustomerId(page, メール);
      if (id) return id;
      if (i >= 5) throw new Error(`登録した会員 ${メール} を会員一覧で探せない（約1分おいて検索し直しても同じ）`);
      await page.waitForTimeout(10_000);
    }
  });
}

const 読み替えの文 = {
  削除: "シード表の「DBフィクスチャで同じ専用IDのデータを削除してから登録する」を、フロントの会員情報登録画面での登録（メールアドレスの前半に実行の印）と本会員化に読み替えた（削除はしない）",
  番号: "シード表の決め打ちの会員レコードID・会員ID・選手情報レコードID・既定配送先レコードID は画面で指定できないので、登録時に画面が振った番号を使った",
  スマレジ: "スマレジ試験環境の接続・会員番号は共有の環境の設定のまま使った（スマレジ側で会員番号を初期値に設定する操作・EC側のスマレジ会員番号を空にする操作はしない。ケースはスマレジ会員番号を確かめない）",
  更新日時: "選手情報更新日時（2026-09-01 00:00:00+09:00）は画面で指定できないので設定していない（ケースは変更の前後を比べる）",
  確認済み: "本人確認ステータス「確認済み」は、管理画面の会員登録/編集で「オンライン本人確認済み」を選んで登録した",
};

type 作り方 = {
  メール: string; パスワード: string; 値: 登録値;
  /** 本人確認ステータス（省略すると登録したまま＝未確認） */
  本人確認?: 本人確認;
  /** オンライン本人確認のポップアップで身分証有効期限を入れて確認済みにする（067） */
  身分証有効期限?: string;
  /** 会員ID を控える呼び名 */
  呼び名?: string[];
  読み替え?: (keyof typeof 読み替えの文)[];
};

/** 会員を登録して本会員にし、本人確認ステータスを整え、会員IDを控える */
async function 会員を作る(ctx: SeedCtx, o: 作り方): Promise<作った会員> {
  const id = ctx.seed.シードID;
  const メール = 印つきメール(o.メール);
  await フロントで会員登録する(ctx.browser, { ...o.値, メール, パスワード: o.パスワード });
  const 会員ID = await 会員IDを探す(ctx.browser, メール);
  let 状態 = "";
  await 管理画面(ctx.browser, async (page) => {
    const ed = new M08CustomerEditPage(page);
    const st = await ed.open(会員ID);
    if (st !== 200) throw new Error(`${id}: 会員ID ${会員ID} の会員登録/編集画面を開けない（応答 ${st}）`);
    if (o.身分証有効期限) {
      await ed.オンライン本人確認済みにする(o.身分証有効期限);
      await ed.open(会員ID);
    } else if (o.本人確認 && o.本人確認 !== "未確認") {
      await ed.ラジオを選ぶ("Player][IdentityConfirmStatus", o.本人確認);
      await ed.登録する();
      const err = await ed.エラー文();
      if (err.length || (await ed.成功メッセージ()) === null) throw new Error(`${id}: 本人確認ステータスを「${o.本人確認}」にする保存が成功の表示にならない（${err.join(" / ")}）`);
      await ed.open(会員ID);
    }
    状態 = await ed.ラジオ選択中("Player][IdentityConfirmStatus");
  });
  const 求める = o.身分証有効期限 ? "オンライン本人確認済み" : (o.本人確認 ?? "未確認");
  if (状態 !== 求める) throw new Error(`${id}: 会員 ${メール} の本人確認ステータスが「${状態}」（求めるのは「${求める}」）`);
  for (const l of o.呼び名 ?? []) ctx.notes.set(l, 会員ID);
  const m: 作った会員 = { 会員ID, メール, パスワード: o.パスワード, 本人確認: 状態 };
  会員一覧.set(id, m);
  for (const k of o.読み替え ?? []) reportSeedIssue(id, 読み替えの文[k]);
  reportSeedIssue(id, `会員 ${メール}（会員ID ${会員ID}）を登録した。本人確認ステータス「${状態}」`);
  return m;
}

// ---- 共有の参照会員 ----
defineSeed("S-F06-18-JP", async (ctx) => {
  const m = await 会員を作る(ctx, {
    メール: "f0618@example.com", パスワード: "F0618-Passw0rd-JP", 値: { ...国内の値, MTG姓: "SATO", MTG名: "TARO" },
    本人確認: "オンライン本人確認済み", 呼び名: ["〔会員レコードID-F0618-共有JP〕"], 読み替え: ["番号", "スマレジ", "更新日時", "確認済み"],
  });
  const 配送先 = await 管理画面(ctx.browser, (page) => 配送先の番号(page, m.会員ID));
  if (配送先.length !== 1) throw new Error(`S-F06-18-JP: 会員 ${m.メール} の配送先が ${配送先.length} 件（既定の配送先1件であること）`);
  ctx.notes.set("〔既定配送先レコードID-F0618-共有JP〕", 配送先[0]);
  // 選手情報レコードIDは管理画面に表示されない（シード表のとおり、DBの参照で控える）
  if (!available) throw new Error("S-F06-18-JP: 選手情報レコードIDは画面に表示されず、DBの参照で控える（シード表のとおり）が、この環境はDB確認の接続先が無い");
  const p = 選手情報ID(m.会員ID);
  if (!p) throw new Error(`S-F06-18-JP: 会員ID ${m.会員ID} の選手情報をDBの参照で見つけられない`);
  ctx.notes.set("〔選手情報レコードID-F0618-共有JP〕", p);
  reportSeedIssue("S-F06-18-JP", "選手情報レコードIDは画面に表示されないので、シード表のとおりDBの参照（読むだけ）で控えた");
});

defineSeed("S-F06-18-OVERSEAS", async (ctx) => {
  await 会員を作る(ctx, {
    メール: "f0618-overseas@example.com", パスワード: "F0618-Passw0rd-OVERSEAS", 値: { ...海外の値, MTG姓: "SMITH", MTG名: "JOHN" },
    本人確認: "オンライン本人確認済み", 呼び名: ["〔会員レコードID-F0618-共有OVERSEAS〕", "〔会員ID-F0618-共有OVERSEAS〕"], 読み替え: ["スマレジ", "確認済み"],
  });
});

// ---- マスタ・環境（確かめるだけ。共有のマスタ・設定を書き換えない） ----
defineSeed("S-F06-18-OCCUPATION", async ({ browser }) => {
  const rows = await 管理画面(browser, async (page) => { await 職業マスタを開く(page); return 職業の行を読む(page); });
  const 無い = ["会社員", "学生"].filter((n) => !rows.some((r) => r.name === n));
  if (無い.length) throw new Error(`S-F06-18-OCCUPATION: 職業マスタに「${無い.join("」「")}」が無い（共有のマスタに足さない方針なので止める）`);
  reportSeedIssue("S-F06-18-OCCUPATION", `職業マスタに既にある「会社員」（番号 ${rows.find((r) => r.name === "会社員")?.id}）・「学生」（番号 ${rows.find((r) => r.name === "学生")?.id}）を使った（シード表の職業レコードID 306185001・306185002 では登録しない。共有のマスタに足さない）`);
});

defineSeed("S-F06-18-SMAREGI-OK", async () => {
  reportSeedIssue("S-F06-18-SMAREGI-OK", "スマレジ試験環境の接続先・契約情報・認証情報は、環境に設定済みの値をそのまま使った（書き換えない。画面では確かめていない）");
});

defineSeed("S-F06-18-REMEMBER-ME", async ({ browser }) => {
  const on = await 管理画面(browser, (page) => readRememberMe(page));
  if (!on) throw new Error("S-F06-18-REMEMBER-ME: 共有の設定（店舗基本設定の自動ログイン機能）が無効。ケースの前提（有効）と違うので止める（共有の設定は書き換えない）");
  reportSeedIssue("S-F06-18-REMEMBER-ME", "店舗基本設定の自動ログイン機能は書き換えず、いまの値が有効であることを管理画面で確かめて使った");
});

defineSeed("S-F06-18-PC-ADM", async ({ browser }) => {
  await 管理画面(browser, (page) => ensureMemberAdmin(page, "F06-18会員情報変更の管理者", PC_ADMIN.loginId, PC_ADMIN.password));
});

/** PC-ENV を使うケースが更新・登録に使う、氏名・電話番号・住所（ブラックリストの照合の値。空白を除いてつなげたもの） */
const 照合の値 = {
  氏名: ["晴屋太郎", "晴野次郎", "佐藤太郎", "確認変更"],
  電話番号: ["0312345678", "0398765432", "0311111111"],
  住所: ["東京都千代田区千代田1番", "東京都渋谷区渋谷2丁目2番"],
};
defineSeed("S-F06-18-PC-ENV", async ({ browser }) => {
  const [仮会員, 行] = await 管理画面(browser, async (page) => [await readTempMember(page), await blacklistRows(page)] as const);
  if (!仮会員) throw new Error("S-F06-18-PC-ENV: 共有の設定（店舗基本設定の仮会員機能）が無効。ケースの前提（有効）と違うので止める（共有の設定は書き換えない）");
  const 当たる = 行.filter((r) => (照合の値 as Record<string, string[]>)[r.種別]?.includes(r.キーワード));
  if (当たる.length) throw new Error(`S-F06-18-PC-ENV: ブラックリストに、ケースが使う値と一致する行がある（${当たる.map((r) => `${r.種別}「${r.キーワード}」`).join("、")}）。共有のブラックリストは消さないので止める`);
  reportSeedIssue("S-F06-18-PC-ENV", `仮会員機能は書き換えず、有効であることを管理画面で確かめた。ブラックリストの「残っている行を削除して0件にする」は、共有の環境では行わず、ケースが使う氏名・電話番号・住所と一致する行が無いことを確かめる形に読み替えた（いまの行数 ${行.length}。消していない）。スマレジ試験環境とメールの配送先は環境の設定のまま使った`);
});

// ---- 自動ログイン（AUTO-002・003） ----
async function 自動ログインの会員(ctx: SeedCtx, n: "002" | "003", パスワード: string): Promise<void> {
  const m = await 会員を作る(ctx, {
    メール: `f0618-auto-${n}@example.com`, パスワード, 値: 国内の値,
    呼び名: [`〔会員レコードID-F0618-${n}〕`, `〔会員ID-F0618-${n}〕`], 読み替え: ["スマレジ"],
  });
  // 専用のブラウザでログインする（自動ログイン機能が有効なので、ログイン画面は保持の指定を送り、自動ログイン用Cookieが発行される）
  const context = await ctx.browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    await 会員としてログインする(await context.newPage(), m.メール, m.パスワード);
    const all = await context.cookies();
    const remember = 自動ログイン用Cookie(all);
    if (remember.length === 0) throw new Error(`${ctx.seed.シードID}: ログインしても自動ログイン用Cookieが発行されない（あるCookie: ${all.map((c) => c.name).join("、")}）`);
    自動ログインの控え.set(ctx.seed.シードID, remember);
    reportSeedIssue(ctx.seed.シードID, `「開発者ツールで会員ログインのセッション情報だけを消去する」は、ログインしたブラウザの Cookie のうち自動ログイン用のもの（${remember.map((c) => c.name).join("、")}）だけを、ケースの新しいブラウザへ入れる形にした。店舗基本設定の自動ログイン機能は書き換えず、有効であることを確かめた（S-F06-18-REMEMBER-ME）`);
  } finally { await context.close(); }
}
defineSeed("S-F06-18-AUTO-002", { needs: ["S-F06-18-REMEMBER-ME"] }, async (ctx) => { await 自動ログインの会員(ctx, "002", "F0618-Passw0rd-002"); });
defineSeed("S-F06-18-AUTO-003", { needs: ["S-F06-18-REMEMBER-ME"] }, async (ctx) => { await 自動ログインの会員(ctx, "003", "Passw0rd!0618"); });

// ---- ケース専用の会員 ----
defineSeed("S-F06-18-JP-014", async (ctx) => {
  const m = await 会員を作る(ctx, {
    メール: "f0618-014@example.com", パスワード: "F0618-Passw0rd-014", 値: 国内の値, 本人確認: "オンライン本人確認済み",
    呼び名: ["〔会員レコードID-F0618-014〕", "〔会員ID-F0618-014〕"], 読み替え: ["確認済み"],
  });
  const sid = await 管理画面(ctx.browser, (page) => スマレジIDを読む(page, m.会員ID));
  if (!sid) throw new Error(`S-F06-18-JP-014: 会員 ${m.メール} の会員登録/編集画面のスマレジIDが空（本会員にしたときにスマレジ試験環境の会員が作られていない）。事前準備②を満たせない`);
  ctx.notes.set("〔スマレジ会員番号-F0618-014〕", sid);
  reportSeedIssue("S-F06-18-JP-014", "「f0618-updated@example.com の会員が残っていれば削除する」は、更新先のメールアドレスにも実行の印を付けるので起きない（削除はしない）");
});

type 専用 = { id: string; メール: string; パスワード: string; 値?: Partial<登録値>; 海外?: boolean; 本人確認?: 本人確認 };
const 専用の会員: 専用[] = [
  { id: "S-F06-18-JP-015", メール: "f0618-015@example.com", パスワード: "F0618-Passw0rd-015", 値: { MTG姓: "SATO", MTG名: "TARO" } },
  { id: "S-F06-18-JP-017", メール: "f0618-017@example.com", パスワード: "F0618-Passw0rd-017" },
  { id: "S-F06-18-JP-019", メール: "f0618-019@example.com", パスワード: "F0618-Passw0rd-019" },
  { id: "S-F06-18-JP-020", メール: "f0618-020@example.com", パスワード: "F0618-Passw0rd-020", 本人確認: "オンライン本人確認済み" },
  { id: "S-F06-18-REGISTERED-MAIL-021", メール: "f0618-registered-021@example.com", パスワード: "F0618-Passw0rd-021", 本人確認: "簡易書留確認済み" },
  { id: "S-F06-18-JP-024", メール: "f0618-024@example.com", パスワード: "F0618-Passw0rd-024", 値: { MTG姓: "SATO", MTG名: "TARO" } },
  { id: "S-F06-18-JP-025", メール: "f0618-025@example.com", パスワード: "F0618-Passw0rd-025", 値: { MTG姓: "SATO", MTG名: "TARO" } },
  { id: "S-F06-18-OVERSEAS-027", メール: "f0618-overseas-027@example.com", パスワード: "F0618-Passw0rd-027", 海外: true },
  { id: "S-F06-18-OVERSEAS-029", メール: "f0618-overseas-029@example.com", パスワード: "F0618-Passw0rd-029", 海外: true },
  { id: "S-F06-18-JP-034", メール: "f0618-034@example.com", パスワード: "F0618-Passw0rd-034" },
  { id: "S-F06-18-JP-036", メール: "f0618-036@example.com", パスワード: "F0618-Passw0rd-036" },
  { id: "S-F06-18-JP-039", メール: "f0618-039@example.com", パスワード: "F0618-Passw0rd-039" },
  { id: "S-F06-18-JP-041", メール: "f0618-041@example.com", パスワード: "F0618-Passw0rd-041" },
  { id: "S-F06-18-JP-055", メール: "f0618-055@example.com", パスワード: "F0618-Passw0rd-055" },
  { id: "S-F06-18-JP-056", メール: "f0618-056@example.com", パスワード: "F0618-Passw0rd-056" },
  { id: "S-F06-18-JP-057", メール: "f0618-057@example.com", パスワード: "F0618-Passw0rd-057" },
  { id: "S-F06-18-JP-058", メール: "f0618-058@example.com", パスワード: "F0618-Passw0rd-058" },
  { id: "S-F06-18-JP-060", メール: "f0618-060@example.com", パスワード: "F0618-Passw0rd-060" },
  { id: "S-F06-18-REGSTAT-069", メール: "f0618-069@example.com", パスワード: "F0618-Passw0rd-069", 本人確認: "簡易書留確認済み" },
  { id: "S-F06-18-COMPANY-070", メール: "f0618-070@example.com", パスワード: "F0618-Passw0rd-070", 本人確認: "オンライン本人確認済み" },
  { id: "S-F06-18-CBSTAT-072", メール: "cbf0618-072@example.com", パスワード: "Passw0rd-CBF0618072", 本人確認: "未確認" },
  { id: "S-F06-18-CBSTAT-073", メール: "cbf0618-073@example.com", パスワード: "Passw0rd-CBF0618073", 本人確認: "未確認" },
  { id: "S-F06-18-CBSTAT-074", メール: "cbf0618-074@example.com", パスワード: "Passw0rd-CBF0618074", 本人確認: "未確認" },
  { id: "S-F06-18-CBSTAT-075", メール: "cbf0618-075@example.com", パスワード: "Passw0rd-CBF0618075", 本人確認: "オンライン本人確認済み" },
  { id: "S-F06-18-CBSTAT-076", メール: "cbf0618-076@example.com", パスワード: "Passw0rd-CBF0618076", 本人確認: "オンライン本人確認済み" },
  { id: "S-F06-18-CBSTAT-077", メール: "cbf0618-077@example.com", パスワード: "Passw0rd-CBF0618077", 本人確認: "簡易書留確認済み" },
  { id: "S-F06-18-CBSTAT-078", メール: "cbf0618-078@example.com", パスワード: "Passw0rd-CBF0618078", 本人確認: "簡易書留確認済み" },
];
for (const s of 専用の会員) {
  defineSeed(s.id, async (ctx) => {
    const 読み替え: (keyof typeof 読み替えの文)[] = ["削除", "番号", "スマレジ"];
    if (s.本人確認 === "オンライン本人確認済み") 読み替え.push("確認済み");
    if (s.id === "S-F06-18-JP-015") 読み替え.push("更新日時");
    await 会員を作る(ctx, { メール: s.メール, パスワード: s.パスワード, 値: { ...(s.海外 ? 海外の値 : 国内の値), ...(s.値 ?? {}) }, 本人確認: s.本人確認, 読み替え });
  });
}

defineSeed("S-F06-18-NONDEF-071", async (ctx) => {
  const m = await 会員を作る(ctx, {
    メール: "f0618-071@example.com", パスワード: "F0618-Passw0rd-071", 値: 国内の値, 読み替え: ["削除", "番号", "スマレジ"],
  });
  await 管理画面(ctx.browser, (page) => お届け先を足す(page, m.会員ID, 既定でない配送先, "S-F06-18-NONDEF-071 既定でない配送先"));
  reportSeedIssue("S-F06-18-NONDEF-071", "既定でない配送先（別宛 花子）は、管理画面の会員の配送先編集（新規）で登録した（配送先名称は「別宛」）");
});

// ---- 連携ケースの会員（PC-MEMBER-064〜068） ----
for (const [n, k] of [["064", "001"], ["065", "002"], ["066", "003"], ["067", "004"], ["068", "005"]] as const) {
  defineSeed(`S-F06-18-PC-MEMBER-${n}`, async (ctx) => {
    await 会員を作る(ctx, {
      メール: `pc-f0618-${k}@example.test`, パスワード: "Passw0rd-PC0618a", 値: PC会員の値,
      ...(n === "067" ? { 身分証有効期限: "2030-12-31" } : { 本人確認: "未確認" as const }),
      呼び名: [`〔会員ID-F0618-PC${k}〕`], 読み替え: ["スマレジ"],
    });
  });
}

// ---- ブラックリスト一致（047） ----
/** 047 のブラックリストのキーワードと、ケースが入れる値（氏名・住所は実行の印つき） */
export const ブラックリストの値 = {
  氏名キーワード: () => rc("禁止会員"), 住所キーワード: () => rc("東京都ブラックリスト住所1番地"), 電話番号: "0399999999",
  /** ケースの入力: お名前「禁止」「会員-印」、住所1「ブラックリスト住所」、住所2「1番地-印」（つなげるとキーワードと同じ） */
  姓: "禁止", 名: () => rc("会員"), 住所1: "ブラックリスト住所", 住所2: () => rc("1番地"),
};
defineSeed("S-F06-18-BLACKLIST", async (ctx) => {
  const id = ctx.seed.シードID;
  await 会員を作る(ctx, {
    メール: "f0618-blacklist@example.com", パスワード: "F0618-Passw0rd-BLACKLIST", 値: 国内の値,
    呼び名: ["〔会員レコードID-F0618-共有BLACKLIST〕", "〔会員ID-F0618-共有BLACKLIST〕"], 読み替え: ["スマレジ"],
  });
  const 行 = [
    { 種別: "氏名" as const, キーワード: ブラックリストの値.氏名キーワード(), 呼び名: "〔ブラックリストレコードID-F0618-共有BLACKLIST-A〕" },
    { 種別: "住所" as const, キーワード: ブラックリストの値.住所キーワード(), 呼び名: "〔ブラックリストレコードID-F0618-共有BLACKLIST-B〕" },
    { 種別: "電話番号" as const, キーワード: ブラックリストの値.電話番号, 呼び名: "〔ブラックリストレコードID-F0618-共有BLACKLIST-C〕" },
  ];
  const 足した: string[] = [];
  await 管理画面(ctx.browser, async (page) => {
    for (const r of 行) if (await ensureBlacklist(page, r.種別, r.キーワード)) 足した.push(`${r.種別}「${r.キーワード}」`);
    const rows = await blacklistRows(page);
    for (const r of 行) {
      const hit = rows.filter((x) => x.種別 === r.種別 && x.キーワード === r.キーワード);
      if (hit.length !== 1 || !hit[0].id) throw new Error(`${id}: ブラックリストの${r.種別}「${r.キーワード}」の行が1つに定まらない（${hit.length} 行）`);
      ctx.notes.set(r.呼び名, hit[0].id);
    }
  });
  reportSeedIssue(id, `ブラックリストの氏名・住所のキーワードは、シード表の「禁止会員」「東京都ブラックリスト住所1番地」に実行の印を付けた値で登録した（ケースの会員も同じ印つきの値に変えて照合させる）。電話番号「0399999999」は印を付けられないので、あれば使い、無ければ登録した（1行が残る）。行は消さない。この実行で足した行: ${足した.join("、") || "なし"}。番号は一覧の各行の削除ボタンに付いている番号を画面から読んだ`);
});
