/**
 * F06-20 配送先新規登録・変更のシード（画面操作）。正本: cases/F06-20_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）: テストデータは「既存データ または 自分で画面から作ったデータ」に読み替えてよい。DB へは書き込まない。
 * 読み替えたことは、シードの注記（エビデンスの「シード作成時の問題」）に残す。
 *
 * - 会員: フロントの会員情報登録画面で登録し、本会員にする（pages/front/m08_member.ts）。メールアドレスの前半には実行の印を付ける（依頼者決定 2026-10-28）。
 *   パスワードには付けない。シード表の決め打ちのメールアドレス（f06-20-001@example.test など）は、印を付けた値に読み替える。
 * - 配送先: その会員でフロントにログインし、マイページの配送先一覧から「新しい住所を追加」で登録する。配送先IDは一覧の編集リンクの番号を控える。
 * - 既定の配送先: フロントの会員登録で、会員の住所と同じ内容の既定の配送先が1件できる（一覧には出ない。上限の件数にはこれも数えられる）。
 *   シード表の「登録配送先が19件・20件」は、上限の判定に使われる件数（既定の配送先を含む）が19件・20件になるように読み替えた。
 *   つまり画面で追加する配送先は18件・19件（名称の連番01〜）で、最後の番号（-19 / -20）の呼び名には既定の配送先の番号を控える（DBの参照で読む。読めない環境は追加した最後の配送先で代える）。
 * - 会員情報住所: シード表の「東京都千代田区丸の内1-1」は、郵便番号100-0005・都道府県東京都・住所1「千代田区丸の内」・住所2「1-1」で登録した。
 * - ブラックリスト（CBBLEDIT-059・CBBLNEW-060）: 氏名のキーワード「禁止配送F0620CB059」「禁止配送F0620CB060」は、あれば使い無ければ画面で登録する（行は消さない）。
 *   実行の印は付けない（ケースが入れる名前が配送先の名の最大文字数に収まらなくなるため。キーワードはこのシード専用の文字列）。
 * - 共有の設定（配送先登録上限・仮会員機能・ブラックリスト）は書き換えない。上限20件はアプリの既定（設定ファイル）で、シード表の定めと同じ。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 既定の配送先ID } from "../db/f06_20_k";
import { available } from "../lib/db";
import { Notes } from "../lib/notes";
import { reportSeedIssue, SeedCtx } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { blacklistRows, ensureBlacklist, ensureMemberAdmin, readTempMember } from "../pages/admin/f06_masters";
import { DeliveryPage, 配送先の入力 } from "../pages/front/f06_20_delivery_k";
import { 会員としてログインする } from "../pages/front/f06_18_change";
import { フロントで会員登録する } from "../pages/front/m08_member";
import { markedMail } from "./f06-member";

export const PC_ADMIN = { loginId: "f0620pc-admin", password: "Passw0rd-PC0620" };

/** メールアドレス（前半に実行の印を付ける。ドメインはシード表のまま） */
export const 印つきメール = (前半: string): string => markedMail(前半);

export type 作った会員 = { 会員ID: string; メール: string; パスワード: string; 配送先: Record<string, string> };
const 会員一覧 = new Map<string, 作った会員>();
/** この実行のシードが作った会員。キーはシードID（他会員は「シードID#other」） */
export function 会員(key: string): 作った会員 {
  const m = 会員一覧.get(key);
  if (!m) throw new Error(`${key} の会員を、この実行のシードが作っていない`);
  return m;
}

/** 会員情報住所の既定（シード表の「東京都千代田区丸の内1-1」「03-1111-2222」「晴屋本社」） */
const 丸の内 = { 郵便番号: "100-0005", 都道府県: "東京都", 住所1: "千代田区丸の内", 住所2: "1-1", 電話番号: "0311112222", 会社名: "晴屋本社" };
/** PC-MEMBER の会員情報住所（シード表のとおり） */
const 千代田 = { 郵便番号: "1000001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1番", 電話番号: "0312345678", 会社名: undefined as string | undefined };

/** 状態・属性が「氏名=山田・花子…電話番号=03-1234-5678／会社名=晴屋商事」の配送先 */
export const 標準配送先 = (配送先名称: string): 配送先の入力 => ({
  配送先名称, 姓: "山田", 名: "花子", セイ: "ヤマダ", メイ: "ハナコ", 国: "Japan", 郵便番号: "101-0021", 都道府県: "東京都",
  住所1: "千代田区外神田", 住所2: "1-1", 電話: "03-1234-5678", 会社名: "晴屋商事",
});

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

type 会員の定め = {
  key: string; 前半: string; パスワード: string; 姓: string; 名: string;
  住所?: { 郵便番号: string; 都道府県: string; 住所1: string; 住所2: string; 電話番号: string; 会社名?: string };
  /** 会員IDを控える呼び名 */
  会員の呼び名?: string;
};

const 読み替え = {
  メール: "シード表の決め打ちのメールアドレスは、前半に実行の印を付けた値に読み替えた（同じ試験環境で流し直しても前の実行の会員に当たらない）",
  番号: "会員ID・配送先IDは画面で指定できないので、登録時に画面が振った番号を控えた",
};

async function 会員を作る(ctx: SeedCtx, o: 会員の定め): Promise<作った会員> {
  const メール = 印つきメール(o.前半);
  const a = o.住所 ?? 丸の内;
  await フロントで会員登録する(ctx.browser, {
    姓: o.姓, 名: o.名, セイ: "ハイソウ", メイ: "タロウ", 生年月日: ["1990", "1", "2"], メール, パスワード: o.パスワード,
    国: "Japan", 郵便番号: a.郵便番号, 都道府県: a.都道府県, 住所1: a.住所1, 住所2: a.住所2, 電話番号: a.電話番号, ...(a.会社名 !== undefined ? { 会社名: a.会社名 } : {}),
  });
  const 会員ID = await 会員IDを探す(ctx.browser, メール);
  if (o.会員の呼び名) ctx.notes.set(o.会員の呼び名, 会員ID);
  const m: 作った会員 = { 会員ID, メール, パスワード: o.パスワード, 配送先: {} };
  会員一覧.set(o.key, m);
  const id = ctx.seed.シードID;
  reportSeedIssue(id, 読み替え.メール);
  reportSeedIssue(id, 読み替え.番号);
  reportSeedIssue(id, `会員 ${メール}（会員ID ${会員ID}）を登録した`);
  return m;
}

/** 会員としてフロントにログインし、配送先を順に登録する。名称→配送先ID の対応を会員に控え、登録順の番号の配列を返す */
async function 配送先を登録する(ctx: SeedCtx, m: 作った会員, 配送先: 配送先の入力[]): Promise<string[]> {
  if (配送先.length === 0) return [];
  const context = await ctx.browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  const ids: string[] = [];
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    await 会員としてログインする(page, m.メール, m.パスワード);
    const d = new DeliveryPage(page);
    for (const v of 配送先) {
      const id = await d.配送先を登録する(v, `${ctx.seed.シードID} 配送先「${v.配送先名称}」`);
      m.配送先[v.配送先名称] = id;
      ids.push(id);
    }
  } finally { await context.close(); }
  reportSeedIssue(ctx.seed.シードID, `配送先 ${配送先.length} 件（${配送先.length > 3 ? `${配送先[0].配送先名称}〜${配送先[配送先.length - 1].配送先名称}` : 配送先.map((v) => v.配送先名称).join("・")}）を、フロントの配送先一覧から登録した`);
  return ids;
}

function 呼び名を控える(notes: Notes, 呼び名: string[], ids: string[]): void {
  呼び名.forEach((l, i) => { if (l) notes.set(l, ids[i]); });
}

/** PC-ENV を使うケースが登録・変更に使う氏名・住所・電話番号（ブラックリストの照合の値。空白を除いてつなげたもの） */
const 照合の値 = ["配送花子", "配送次郎", "配送三郎", "大阪市北区梅田1丁目1番", "名古屋市中区栄3丁目3番", "大阪市中央区難波5丁目5番", "0663334444", "0522223333", "0666667777"];

// ---------------------------------------------------------------------------
// 会員と配送先1件（BASE・MISSING）
// ---------------------------------------------------------------------------
/** 会員と配送先1件のシード。n は番号（「001」など） */
function defineSingleSeed(id: string, n: string, 名: string, 配送先名称: string): void {
  defineSeed(id, async (ctx) => {
    const m = await 会員を作る(ctx, { key: id, 前半: `f06-20-${n}`, パスワード: `F0620-Passw0rd-${n}`, 姓: "配送", 名, 会員の呼び名: `〔会員ID-F0620-${n}〕` });
    const [配送先] = await 配送先を登録する(ctx, m, [標準配送先(配送先名称)]);
    ctx.notes.set(`〔配送先ID-F0620-${n}〕`, 配送先);
  });
}
defineSingleSeed("S-F06-20-BASE-002", "002", "太郎-002", "勤務先-002");
defineSingleSeed("S-F06-20-BASE-003", "003", "太郎-003", "勤務先-003");
defineSingleSeed("S-F06-20-BASE-009", "009", "太郎-009", "勤務先-009");
defineSingleSeed("S-F06-20-BASE-010", "010", "太郎-010", "勤務先-010");
defineSingleSeed("S-F06-20-BASE-011", "011", "太郎-011", "勤務先-011");
defineSingleSeed("S-F06-20-BASE-031", "031", "太郎-031", "勤務先-031");
defineSingleSeed("S-F06-20-BASE-032", "032", "太郎-032", "勤務先-032");
defineSingleSeed("S-F06-20-BASE-033", "033", "太郎-033", "勤務先-033");
defineSingleSeed("S-F06-20-BASE-034", "034", "太郎-034", "勤務先-034");
defineSingleSeed("S-F06-20-BASE-035", "035", "太郎-035", "勤務先-035");
defineSingleSeed("S-F06-20-MISSING-036", "036", "太郎-036", "勤務先-036");

// 2件（055・056）。A を消して B が残ることを見る
function definePairSeed(id: string, n: string): void {
  defineSeed(id, async (ctx) => {
    const m = await 会員を作る(ctx, { key: id, 前半: `f06-20-${n}`, パスワード: `F0620-Passw0rd-${n}`, 姓: "配送", 名: `太郎-F0620-${n}`, 会員の呼び名: `〔会員ID-F0620-${n}〕` });
    const ids = await 配送先を登録する(ctx, m, [標準配送先(`勤務先-F0620-${n}-A`), 標準配送先(`勤務先-F0620-${n}-B`)]);
    呼び名を控える(ctx.notes, [`〔配送先ID-F0620-${n}-A〕`, `〔配送先ID-F0620-${n}-B〕`], ids);
  });
}
definePairSeed("S-F06-20-BASE-055", "055");
definePairSeed("S-F06-20-BASE-056", "056");

// ---------------------------------------------------------------------------
// 配送先0件の会員（NEW）
// ---------------------------------------------------------------------------
function defineNewSeed(id: string, n: string): void {
  defineSeed(id, async (ctx) => {
    await 会員を作る(ctx, { key: id, 前半: `f06-20-${n}`, パスワード: `F0620-Passw0rd-${n}`, 姓: "配送", 名: `太郎-${n}`, 会員の呼び名: `〔会員ID-F0620-${n}〕` });
    reportSeedIssue(id, "配送先0件は、会員登録で作られる既定の配送先（会員情報住所と同じ内容）だけの状態。追加の配送先は登録していない");
  });
}
defineNewSeed("S-F06-20-NEW-013", "013");
defineNewSeed("S-F06-20-NEW-014", "014");
defineNewSeed("S-F06-20-NEW-015", "015");
defineNewSeed("S-F06-20-NEW-016", "016");
defineNewSeed("S-F06-20-NEW-017", "017");
defineNewSeed("S-F06-20-NEW-018", "018");
defineNewSeed("S-F06-20-NEW-019", "019");

// ---------------------------------------------------------------------------
// 他会員の配送先（OWNERSHIP）
// ---------------------------------------------------------------------------
function defineOwnerSeed(id: string, n: string): void {
  defineSeed(id, async (ctx) => {
    const a = await 会員を作る(ctx, { key: id, 前半: `f06-20-${n}`, パスワード: `F0620-Passw0rd-${n}`, 姓: "配送", 名: `太郎-${n}A`, 会員の呼び名: `〔会員ID-F0620-${n}A〕` });
    const [ida] = await 配送先を登録する(ctx, a, [標準配送先(`操作会員の配送先-${n}`)]);
    ctx.notes.set(`〔配送先ID-F0620-${n}A〕`, ida);
    const b = await 会員を作る(ctx, { key: `${id}#other`, 前半: `f06-20-other-${n}`, パスワード: `F0620-Passw0rd-o${n}`, 姓: "配送", 名: `太郎-${n}B`, 会員の呼び名: `〔会員ID-F0620-${n}B〕` });
    const [idb] = await 配送先を登録する(ctx, b, [標準配送先(`他会員の配送先-${n}`)]);
    ctx.notes.set(`〔配送先ID-F0620-${n}B〕`, idb);
  });
}
defineOwnerSeed("S-F06-20-OWNERSHIP-027", "027");
defineOwnerSeed("S-F06-20-OWNERSHIP-028", "028");
defineOwnerSeed("S-F06-20-OWNERSHIP-037", "037");

// ---------------------------------------------------------------------------
// 上限（CAP・CB）。上限の判定に使われる件数（既定の配送先を含む）が 総件数 になるように追加する
// ---------------------------------------------------------------------------
type 上限 = {
  前半: string; パスワード: string; 姓: string; 名: string; 会員の呼び名: string;
  /** 上限の判定に使われる件数（既定の配送先を含む）。追加する配送先は 総件数-1（ただし 追加数 を指定したときはそれ） */
  総件数?: number; 追加数?: number;
  名称: (i: string) => string;
  /** 呼び名の前半（〔配送先ID-<接頭>-NN〕） */
  接頭: string;
  ブラックリスト?: string;
};
function defineCapSeed(id: string, s: 上限): void {
  defineSeed(id, async (ctx) => {
    const m = await 会員を作る(ctx, { key: id, 前半: s.前半, パスワード: s.パスワード, 姓: s.姓, 名: s.名, 会員の呼び名: s.会員の呼び名 });
    const 既定を数える = s.追加数 === undefined;
    const 追加 = s.追加数 ?? (s.総件数 as number) - 1;
    const 配送先 = Array.from({ length: 追加 }, (_, i) => 標準配送先(s.名称(String(i + 1).padStart(2, "0"))));
    const ids = await 配送先を登録する(ctx, m, 配送先);
    // 既定の配送先は、追加した配送先の次の番号（総件数）として控える（追加数が総件数-1のとき）
    const all = [...ids];
    if (既定を数える) {
      let 既定: string | null = null;
      if (available) 既定 = 既定の配送先ID(m.会員ID);
      if (!既定) {
        既定 = ids[ids.length - 1];
        reportSeedIssue(id, `最後の番号の呼び名には既定の配送先の番号を控える決めだが、この環境はDBの参照ができないので、追加した最後の配送先の番号で代えた`);
      }
      all.push(既定);
    }
    for (let i = 0; i < all.length; i++) {
      const l = `〔配送先ID-${s.接頭}-${String(i + 1).padStart(2, "0")}〕`;
      // シード表が呼び名に出していない番号は控えない（範囲の中間は控えない）。控えるのは先頭・末尾と、表に出ているもの
      if ([...(ctx.seed["状態・属性"] + ctx.seed.投入方法).matchAll(/〔[^〕]+〕/g)].some((x) => x[0] === l)) ctx.notes.set(l, all[i]);
    }
    if (既定を数える) reportSeedIssue(id, `シード表の「登録配送先${s.総件数}件」は、上限の判定に使われる件数（会員登録で作られる既定の配送先を含む）が${s.総件数}件になるように、画面で追加する配送先を${追加}件（名称の連番01〜${String(追加).padStart(2, "0")}）にした。最後の番号は既定の配送先`);
    if (s.ブラックリスト) {
      let 足した = false;
      await 管理画面(ctx.browser, async (page) => {
        足した = await ensureBlacklist(page, "氏名", s.ブラックリスト as string);
        const rows = await blacklistRows(page);
        if (rows.filter((r) => r.種別 === "氏名" && r.キーワード === s.ブラックリスト).length !== 1) throw new Error(`${id}: ブラックリストの氏名「${s.ブラックリスト}」の行が1つに定まらない`);
      });
      reportSeedIssue(id, `ブラックリストの氏名「${s.ブラックリスト}」は、${足した ? "無かったので画面で登録した（行は消さない）" : "既にあったので使った"}`);
    }
  });
}
defineCapSeed("S-F06-20-CAP20-005", { 前半: "f06-20-005", パスワード: "F0620-Passw0rd-005", 姓: "上限到達", 名: "会員-005", 会員の呼び名: "〔会員ID-F0620-005〕", 総件数: 20, 名称: (i) => `上限確認住所${i}-005`, 接頭: "F0620-005" });
defineCapSeed("S-F06-20-CAP20-007", { 前半: "f06-20-007", パスワード: "F0620-Passw0rd-007", 姓: "上限到達", 名: "会員-007", 会員の呼び名: "〔会員ID-F0620-007〕", 総件数: 20, 名称: (i) => `上限確認住所${i}-007`, 接頭: "F0620-007" });
defineCapSeed("S-F06-20-CBBLEDIT-059", { 前半: "cbf06-20-059", パスワード: "Passw0rd-CBF0620059", 姓: "F0620CB059", 名: "会員", 会員の呼び名: "〔会員ID-F0620-CB059〕", 総件数: 20, 名称: (i) => `住所${i}-F0620-CB059`, 接頭: "F0620-CB059", ブラックリスト: "禁止配送F0620CB059" });
defineCapSeed("S-F06-20-CBBLNEW-060", { 前半: "cbf06-20-060", パスワード: "Passw0rd-CBF0620060", 姓: "F0620CB060", 名: "会員", 会員の呼び名: "〔会員ID-F0620-CB060〕", 追加数: 1, 名称: (i) => `住所${i}-F0620-CB060`, 接頭: "F0620-CB060", ブラックリスト: "禁止配送F0620CB060" });

// ---------------------------------------------------------------------------
// 連携（PC）
// ---------------------------------------------------------------------------
function definePcSeed(id: string, 番号: "052" | "053" | "054", n: string, k: string): void {
  defineSeed(id, async (ctx) => {
    const m = await 会員を作る(ctx, { key: id, 前半: `pc-f0620-${k}`, パスワード: "Passw0rd-PC0620a", 姓: "配送", 名: "太郎", 住所: 千代田, 会員の呼び名: `〔会員ID-F0620-${n}〕` });
    if (番号 === "054") {
      await 配送先を登録する(ctx, m, [{
        配送先名称: "実家F0620PC003", 姓: "配送", 名: "花子", セイ: "ハイソウ", メイ: "ハナコ", 国: "Japan", 郵便番号: "5300001", 都道府県: "大阪府",
        住所1: "大阪市北区梅田", 住所2: "1丁目1番", 電話: "0663334444", 会社名: "配送実家商事F0620PC003",
      }]);
    }
  });
}
definePcSeed("S-F06-20-PC-MEMBER-052", "052", "PC001", "001");
definePcSeed("S-F06-20-PC-MEMBER-053", "053", "PC002", "002");
definePcSeed("S-F06-20-PC-MEMBER-054", "054", "PC003", "003");
