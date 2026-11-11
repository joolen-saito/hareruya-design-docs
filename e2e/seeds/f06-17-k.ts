// 取り込み注記: 同じ機能の作り方を main 側も実装していたため、栗野側の版を別ファイルにした。main が登録済みのシードは登録しない（seeds/main_defined.ts）。
/**
 * F06-17 大会デッキ登録確認～完了（フロント・マイページ）のシード（画面操作）。正本: cases/F06-17_seed_data.tsv
 *
 * 作り方は、シード表の投入方法のとおり。シード表と違えたところ（解釈）:
 * - 会員: シード表は「管理画面の会員登録画面」で登録すると定めるが、管理画面には会員を新しく登録する画面が無い。フロントの会員登録画面で登録し、
 *   管理画面の会員登録/編集で会員ステータスを本会員にする（本登録のメールは読まない。pages/admin/f06_17_setup.ts）。
 *   メールアドレスの前半には実行の印を付ける。お名前(名)は「試験＋番号＋実行の印」（ほかの会員と重ならない値）。フリガナはシード表に値が無ければ
 *   ヤマダ タロウ（海外の会員はスミス アレックス。日本語のサイトでは必須）。生年月日・住所・電話番号は登録できる任意の値。
 *   ログインID（f0617_001 など）を入れる項目は無く、フロントのログインはメールアドレスとパスワードで行う（シード表のとおり）。
 * - 選手ID: シード表はイベント申込登録画面のプレイヤー検索で読むと定めるが、同じお名前の選手が実行ごとに増えるので、
 *   DBの参照（読むだけ）で会員IDから読む（F06-16・F07-04 と同じ）。申込は登録しない（シード表のとおり）。
 * - 参照マスタ（REF・PE-REF）は、名前の決まった共有のマスタとして「あれば使い、無ければ作る」。フォーマットは同じ名前があれば編集画面で
 *   記載の値へそろえる。カードは同じ名前があれば使う（取り込み直さない。共有のカードの内容を書き換えないため）。
 *   フォーマット名(英)・カード名(英)はシード表では任意の値なので、ほかと重ならない値（F0617 …）にした（カード登録CSVはフォーマットを英語名で指定する）。
 *   PE-REF のフォーマット名(英)はシード表の「Link Format」がほかの機能のものと重なりうるので「Link Format F0617」にした（ケースは確かめない）。
 * - 「イベントを登録する管理者がこの店舗を編集できる権限を持つ」: 全権限の管理者（SETUP_ADMIN）は編集可能店舗を持たず、イベント登録の店舗の
 *   選択肢が空になるので、晴れる屋テスト店を所属・編集可能店舗とする試験管理者 f0617_admin（システム管理者）をメンバー管理で用意し、
 *   イベント・日程の登録とデッキの更新はこの管理者で行う（共有の管理者を書き換えない）。
 * - PE-REF の管理者のパスワード「Passw0rd-PE」は11文字で、管理画面の規則（12文字以上）に合わないので「Passw0rd-PE-F0617」にした（ケースは値を確かめない）。
 *   店舗の登録は試験店舗の共通の部品（支店URL・略称つき、メールアドレスの4欄は支店URLの値）で行う。
 * - アーキタイプ: 管理画面のデッキの登録・更新ではアーキタイプが必須。スタンダード試験に属するアーキタイプ「F0617-スタンダード試験」を
 *   REF で用意し（あれば使う）、デッキの更新でアーキタイプが空のときと、イベントなしの大会デッキ（028）の登録で選ぶ。
 * - デッキの公開状態の「非表示」（028）は、選択肢に無いので「非公開」を選ぶ。
 * - イベント: 大会名には実行の印を付ける（ケースの大会名も印つきの名前として確かめる）。イベント名(英)・ルール適用度など任意の値は
 *   F06-16 と同じ（名(英)は大会名と同じ、ルール適用度は初心者歓迎、公開、定員10・参加費0）。日程は受付なし・公開。開始時間の「任意の未来の日時」は 2099-12-20 10:00。
 *   PE のルール適用度は「プルダウン先頭の選択肢」を画面から読む。
 * - 「同じメールアドレスの会員が残っていれば削除する」は、メールアドレスに実行の印を付けるので起きない（削除しない）。
 * - DBで直接設定するもののうち「番号が未登録であること」（012 のイベント詳細ID 61749012・026 のデッキID 61759026）は、DBの参照で無いことを
 *   確かめ、あれば止める（DBを書き換えない。PM 方針「既にあるデータを用意するだけなら存在を確かめる形に」）。
 *   「不明カードX」が「あれば削除する」（015・016）は、カード一覧で無いことを確かめ、あれば止める（共有のマスタを消さない）。
 * - DCIナンバーのDBでの設定（001）は行わない（画面で指定できない。001 の期待結果は DCIナンバーを確かめない）。
 *
 * 作らないシード（ケースを実装しない）: CASE-002・020（DCIナンバーをDBで設定し、ケースがそれを確かめる）、CASE-004（試験メールの受信箱）、
 * CASE-010（ケースの手順がDBで選手情報を消す）、CASE-011（イベントのフォーマット0件をDBで設定）、CASE-013（デッキ登録なしの日程の登録期限をDBで設定）、
 * CASE-025（ログイン会員の選手情報をDBで消す）。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { プレイヤーID } from "../db/f03_07";
import { デッキの件数, 日程のデッキ件数, 日程の件数 } from "../db/f06_17";
import { available } from "../lib/db";
import { Notes } from "../lib/notes";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { registerEvent } from "../pages/admin/event";
import { 試験店舗を登録する } from "../pages/admin/f07_01_setup";
import { カードを名前で探す } from "../pages/admin/f06_16_setup_k";
import {
  F0617会員, イベントなしの大会デッキを登録する, カードを取り込む, デッキを更新する, フォーマットのアーキタイプ, フォーマットを用意する, ルール適用度の先頭, 会員を登録して本会員にする,
} from "../pages/admin/f06_17_setup_k";
import { アーキタイプを登録する, カード名リストを作成する } from "../pages/admin/f09_01_setup";
import { カードを登録する } from "../pages/admin/m14_card";
import { デッキ一覧 } from "../pages/admin/m15_deck";
import { ensureMember, findMemberId } from "../pages/admin/member";
import { registerSchedule } from "../pages/admin/schedule";
import { DeckEntryEditPage } from "../pages/front/f06_16_deck_entry_k";

// ---------------------------------------------------------------------------
// 共有の値
// ---------------------------------------------------------------------------

export const 店名 = "晴れる屋テスト店";
const 管理者名 = "F0617試験管理者";
export const F0617_ADMIN: Account = { loginId: "f0617_admin", password: "Passw0rd!F0617adm" };

export type 形式キー = "A" | "B" | "C" | "D" | "E" | "F";
export const 形式: Record<形式キー, { 名日: string; 名英: string; 並び順: string; 枚数?: [string, string, string, string]; 呼び名: string }> = {
  A: { 名日: "スタンダード試験", 名英: "F0617 Standard Test", 並び順: "9711", 枚数: ["1", "60", "0", "15"], 呼び名: "〔フォーマットID-F0617-共有A〕" },
  B: { 名日: "モダン試験", 名英: "F0617 Modern Test", 並び順: "9712", 呼び名: "〔フォーマットID-F0617-共有B〕" },
  C: { 名日: "登録停止試験形式", 名英: "F0617 Stopped Test", 並び順: "9713", 呼び名: "〔フォーマットID-F0617-共有C〕" },
  D: { 名日: "期限超過試験形式", 名英: "F0617 Expired Test", 並び順: "9714", 呼び名: "〔フォーマットID-F0617-共有D〕" },
  E: { 名日: "未割当試験形式", 名英: "F0617 Unassigned Test", 並び順: "9715", 呼び名: "〔フォーマットID-F0617-共有E〕" },
  F: { 名日: "エラー試験形式", 名英: "F0617 Error Test", 並び順: "9716", 枚数: ["0", "3", "0", "2"], 呼び名: "〔フォーマットID-F0617-共有F〕" },
};
/** 管理画面のデッキの登録・更新で選ぶ、スタンダード試験のアーキタイプ */
export const アーキタイプ名 = "F0617-スタンダード試験";

type 画像ありのカード = { 名日: string; 名英: string; 使用可?: 形式キー[]; 使用制限?: 形式キー[]; 使用禁止?: 形式キー[]; 呼び名: string };
export const カード: Record<"通常A" | "通常B" | "旧" | "禁止B" | "制限R" | "範囲外O", 画像ありのカード> = {
  通常A: { 名日: "通常カードA", 名英: "F0617 Normal Card A", 使用可: ["A", "B", "F"], 呼び名: "〔カードID-F0617-共有A〕" },
  通常B: { 名日: "通常カードB", 名英: "F0617 Normal Card B", 使用可: ["A"], 呼び名: "〔カードID-F0617-共有B〕" },
  旧: { 名日: "旧カード", 名英: "F0617 Old Card", 使用可: ["A"], 呼び名: "〔カードID-F0617-共有C〕" },
  禁止B: { 名日: "禁止カードB", 名英: "F0617 Banned Card B", 使用禁止: ["F"], 呼び名: "〔カードID-F0617-共有E〕" },
  制限R: { 名日: "制限カードR", 名英: "F0617 Restricted Card R", 使用制限: ["F"], 呼び名: "〔カードID-F0617-共有F〕" },
  範囲外O: { 名日: "範囲外カードO", 名英: "F0617 Out Of Range Card O", 呼び名: "〔カードID-F0617-共有G〕" },
};
export const 画像なしカード = { 名日: "画像なしカード", 名英: "F0617 No Image Card", 呼び名: "〔カードID-F0617-共有D〕" };

/** 大会名（実行の印つき）。ケースの大会名は、この名前として読む */
export const 大会名 = (正本の名前: string): string => rc(正本の名前);

/** この実行で作った会員（ケースがログインに使う）。キーは呼び名の末尾（例: 001・027A・CB044・PE001） */
export type 作った会員 = { メール: string; パスワード: string; 会員ID: string; 選手ID: string; 名: string };
export const 会員一覧 = new Map<string, 作った会員>();
export type 作った大会 = { 名: string; イベントID: string; イベント詳細ID: string };
export const 大会一覧 = new Map<string, 作った大会>();
/** ケースのデッキID（シードが提出・登録したもの）。キーは呼び名の末尾 */
export const デッキ一覧の控え = new Map<string, string>();

export function 会員(key: string): 作った会員 {
  const m = 会員一覧.get(key);
  if (!m) throw new Error(`ケース ${key} の会員を、この実行のシードが作っていない`);
  return m;
}
export function 大会(key: string): 作った大会 {
  const e = 大会一覧.get(key);
  if (!e) throw new Error(`ケース ${key} の大会を、この実行のシードが作っていない`);
  return e;
}

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>, account: Account = SETUP_ADMIN) =>
  withAdminSession(browser, account, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

/** カード一覧で名前を検索し、ちょうどその名前のカードIDを返す（1件でなければ止める） */
async function カードIDを読む(page: Page, seedId: string, 名: string): Promise<string> {
  const ids = await カードを名前で探す(page, 名);
  if (ids.length !== 1) throw new Error(`${seedId}: カード一覧で「${名}」のカードが ${ids.length} 件（1件であること）`);
  return ids[0];
}

// ---------------------------------------------------------------------------
// 会員・大会・デッキ（ケース専用）
// ---------------------------------------------------------------------------

type 会員指定 = {
  前半: string; パスワード: string;
  姓?: string; 名?: string; セイ?: string; メイ?: string;
  海外?: boolean;
  /** MTG Companion登録本名(英語)。undefined は空のまま */
  英姓?: string; 英名?: string;
  日本の住所?: Pick<F0617会員, "郵便番号" | "都道府県" | "住所1" | "住所2" | "電話番号">;
};

/** 会員を作り、会員IDと選手IDを控える（呼び名を渡したものだけ） */
async function 会員を作る(browser: Browser, notes: Notes, seedId: string, key: string, m: 会員指定, 呼び名: { 会員ID?: string; 選手ID?: string }): Promise<作った会員> {
  const メール = `${rc(m.前半)}@example.test`.toLowerCase();
  const 名 = m.名 ?? `試験${key}${RUN_MARK}`;
  const 会員ID = await 会員を登録して本会員にする(browser, {
    姓: m.姓 ?? "F0617", 名, セイ: m.セイ ?? (m.海外 ? "スミス" : "ヤマダ"), メイ: m.メイ ?? (m.海外 ? "アレックス" : "タロウ"),
    メール, パスワード: m.パスワード, 海外: m.海外 ?? false, 英姓: m.英姓, 英名: m.英名, ...(m.日本の住所 ?? {}),
  }, (x) => reportSeedIssue(seedId, x));
  if (!available) throw new Error(`${seedId}: 選手IDはDBの参照で読む。この環境はDBの参照ができない`);
  const 選手ID = プレイヤーID(会員ID);
  if (!選手ID) throw new Error(`${seedId}: 会員 ${メール}（会員ID ${会員ID}）に選手情報が無い`);
  if (呼び名.会員ID) notes.set(呼び名.会員ID, 会員ID);
  if (呼び名.選手ID) notes.set(呼び名.選手ID, 選手ID);
  const made = { メール, パスワード: m.パスワード, 会員ID, 選手ID, 名 };
  会員一覧.set(key, made);
  return made;
}

type 大会指定 = {
  名: string; 名英?: string; 形式: string[]; 開始?: string; 締切?: string; 店?: string;
  ルール適用度?: string;
};

/** イベントと日程を登録し、イベントID・イベント詳細IDを控える（n は呼び名の末尾） */
async function 大会を作る(browser: Browser, notes: Notes, key: string, n: string, e: 大会指定, account: Account = F0617_ADMIN): Promise<作った大会> {
  const 名 = 大会名(e.名);
  const made = await 管理画面(browser, async (page) => {
    const イベントID = await registerEvent(page, {
      イベント名日: 名, イベント名英: e.名英 ?? 名, 店舗: e.店 ?? 店名, フォーマット: e.形式, ルール適用度: e.ルール適用度 ?? "初心者歓迎", 公開状態: "公開", 定員: "10", 参加費: "0",
    });
    const イベント詳細ID = await registerSchedule(page, イベントID, {
      開始時間: e.開始 ?? "2099-12-20 10:00", 受付あり: false, デッキ登録あり: true, デッキ登録締切: e.締切 ?? "2099-12-31 23:59", デッキ登録を終了する: false, 公開状態: "公開",
    });
    return { 名, イベントID, イベント詳細ID };
  }, account);
  notes.set(`〔イベントID-F0617-${n}〕`, made.イベントID);
  notes.set(`〔イベント詳細ID-F0617-${n}〕`, made.イベント詳細ID);
  大会一覧.set(key, made);
  return made;
}

/** 管理画面のデッキ一覧でイベント詳細IDを検索し、表示されたデッキIDを返す（日付の条件は空にする） */
async function 日程のデッキを検索する(page: Page, イベント詳細ID: string): Promise<string[]> {
  const l = new デッキ一覧(page);
  await l.開く();
  await l.f("event_detail_id").fill(イベント詳細ID);
  await l.日付クリア.click();
  await l.検索する();
  return l.表示されたID();
}

/** 新しい日程の大会デッキが0件であることを、管理画面のデッキ一覧で確かめる */
async function デッキ0件を確かめる(browser: Browser, seedId: string, イベント詳細ID: string): Promise<void> {
  const ids = await 管理画面(browser, (page) => 日程のデッキを検索する(page, イベント詳細ID));
  if (ids.length) throw new Error(`${seedId}: デッキ一覧でイベント詳細ID ${イベント詳細ID} を検索するとデッキがある（${ids.join("、")}）`);
}

/** フロントで会員としてログインし、大会デッキ登録編集画面でデッキを提出して、デッキ登録完了画面のアドレスのデッキIDを返す */
async function 大会デッキを提出する(browser: Browser, seedId: string, m: 作った会員, e: 作った大会, 形式名: string, メイン: string, サイド: string): Promise<string> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    const d = new DeckEntryEditPage(page);
    await d.ログインする(m.メール, m.パスワード);
    const status = await d.開く(e.イベント詳細ID);
    if (status !== 200 || !(await d.編集画面である())) throw new Error(`${seedId}: 大会デッキ登録編集画面を開けない（応答 ${status}・${d.path}）`);
    if (await d.フォーマット選択エリア.isVisible()) await d.フォーマットを選ぶ(形式名);
    await d.メインボード.fill(メイン);
    await d.サイドボード.fill(サイド);
    const r = await d.提出する();
    const id = d.完了画面のデッキID();
    if (!r.sent || !id) throw new Error(`${seedId}: デッキを提出してもデッキ登録完了画面へ移らない（${d.path}・${(await d.入力形式の誤りの表示()).join(" / ")}）`);
    return id;
  } finally { await context.close(); }
}

/** カード一覧で、名前のカードが無いことを確かめる（あれば止める。共有のマスタを消さない） */
async function カードが無いことを確かめる(browser: Browser, seedId: string, 名: string): Promise<void> {
  const have = await 管理画面(browser, (page) => カードを名前で探す(page, 名));
  if (have.length) throw new Error(`${seedId}: カード一覧に「${名}」のカードがある（カードID ${have.join("、")}）。シード表は「見つかったときは削除で消す」と定めるが、共有のマスタを消さないため止めた（判断待ち）`);
  reportSeedIssue(seedId, `カード一覧で「${名}」を検索し、0件であることを確かめた（削除はしていない）`);
}

const 共通 = ["S-F06-17-REF"];
const パスワード = (n: string) => `F0617-Passw0rd-${n}`;
const 標準 = (n: string, x: Partial<会員指定> = {}): 会員指定 => ({ 前半: `f0617-${n}`, パスワード: パスワード(n), 英姓: "TEST", 英名: "TARO", ...x });
const 単一形式大会 = (n: string): 大会指定 => ({ 名: `F06-17単一形式大会-${n}`, 形式: [形式.A.名日] });

type ケース = {
  会員?: 会員指定 | null;
  大会?: 大会指定 | null;
  /** 新しい日程の大会デッキが0件であることを、デッキ一覧で確かめる（シード表のとおり） */
  デッキ0件?: boolean;
  あと?: (ctx: { browser: Browser; notes: Notes; seedId: string; 会員?: 作った会員; 大会?: 作った大会 }) => Promise<void>;
};

/** 会員1人・大会1つのケース専用のシード（n はケース番号。呼び名の末尾） */
function defineCaseSeed(seedId: string, n: string, c: ケース = {}): void {
  defineSeed(seedId, { needs: 共通 }, async ({ browser, notes }) => {
    const m = c.会員 === null ? undefined : await 会員を作る(browser, notes, seedId, n, c.会員 ?? 標準(n), { 会員ID: `〔会員ID-F0617-${n}〕`, 選手ID: `〔選手ID-F0617-${n}〕` });
    const e = c.大会 === null ? undefined : await 大会を作る(browser, notes, n, n, c.大会 ?? 単一形式大会(n));
    if (e && c.デッキ0件) await デッキ0件を確かめる(browser, seedId, e.イベント詳細ID);
    if (c.あと) await c.あと({ browser, notes, seedId, 会員: m, 大会: e });
  });
}

/** デッキを提出して〔デッキID-F0617-n〕に控える */
const 提出して控える = (n: string, 形式名: string, メイン: string, サイド: string) =>
  async ({ browser, notes, seedId, 会員: m, 大会: e }: { browser: Browser; notes: Notes; seedId: string; 会員?: 作った会員; 大会?: 作った大会 }) => {
    const id = await 大会デッキを提出する(browser, seedId, m!, e!, 形式名, メイン, サイド);
    notes.set(`〔デッキID-F0617-${n}〕`, id);
    デッキ一覧の控え.set(n, id);
  };
defineCaseSeed("S-F06-17-CASE-006", "006", {
  会員: { 前半: "f0617-006", パスワード: パスワード("006"), 姓: "Alex", 名: "Smith", セイ: "アレックス", メイ: "スミス", 海外: true }, デッキ0件: true,
});

// ---- 既存のデッキの上書き（005: 編集者を設定してから） ----
defineCaseSeed("S-F06-17-CASE-005", "005", {
  あと: async (ctx) => {
    await 提出して控える("005", 形式.A.名日, `1 ${カード.旧.名日}`, "")(ctx);
    const id = デッキ一覧の控え.get("005")!;
    await 管理画面(ctx.browser, async (page) => {
      const ids = await 日程のデッキを検索する(page, ctx.大会!.イベント詳細ID);
      if (ids.length !== 1 || ids[0] !== id) throw new Error(`${ctx.seedId}: デッキ一覧でイベント詳細ID ${ctx.大会!.イベント詳細ID} のデッキが提出したデッキ ${id} の1件だけでない（${ids.join("、")}）`);
      await デッキを更新する(page, id, { 空のときのアーキタイプ: アーキタイプ名 }, (x) => reportSeedIssue(ctx.seedId, x));
    }, F0617_ADMIN);
    const 編集者 = await 管理画面(ctx.browser, async (page) => {
      const mid = await findMemberId(page, 管理者名);
      if (!mid) throw new Error(`${ctx.seedId}: メンバー管理に「${管理者名}」がいない`);
      return mid;
    });
    ctx.notes.set("〔編集者ID-F0617-005〕", 編集者);
    reportSeedIssue(ctx.seedId, `デッキ ${id} を管理画面のデッキ編集画面で試験管理者（${F0617_ADMIN.loginId}）が「更新」し、その管理者のメンバー編集画面の番号 ${編集者} を編集者IDとして控えた`);
  },
});

// ---- 送信先・フォーマットの書き換え（012・014） ----
defineCaseSeed("S-F06-17-CASE-012", "012", {
  大会: { 名: "F06-17送信元大会-012", 形式: [形式.A.名日] },
  あと: async ({ seedId }) => {
    if (!available) throw new Error(`${seedId}: イベント詳細ID 61749012 が無いことはDBの参照で確かめる。この環境はDBの参照ができない`);
    const k = 日程の件数("61749012"), d = 日程のデッキ件数("61749012");
    if (k > 0 || d > 0) throw new Error(`${seedId}: イベント詳細ID 61749012 の日程（${k}件）か、それに結び付く大会デッキ（${d}件）がある。シード表は「あれば削除する」と定めるが、DBを書き換えないため止めた（判断待ち）`);
    reportSeedIssue(seedId, "イベント詳細ID 61749012 の日程と、それに結び付く大会デッキが無いことをDBの参照で確かめた（削除はしていない）");
  },
});

// ---- 内容エラー（015・016） ----
const 内容エラー = (n: string): ケース => ({
  大会: { 名: `F06-17内容エラー大会-${n}`, 形式: [形式.F.名日] }, デッキ0件: true,
  あと: ({ browser, seedId }) => カードが無いことを確かめる(browser, seedId, "不明カードX"),
});

// ---- デッキ登録完了画面（提出済みのデッキ） ----
const 標準のデッキ = (n: string) => 提出して控える(n, 形式.A.名日, `1 ${カード.通常A.名日}`, `1 ${カード.通常B.名日}`);

// ---- 表示されない（026〜028） ----
defineCaseSeed("S-F06-17-CASE-026", "026", {
  大会: null,
  あと: async ({ seedId }) => {
    if (!available) throw new Error(`${seedId}: デッキID 61759026 が無いことはDBの参照で確かめる。この環境はDBの参照ができない`);
    const k = デッキの件数("61759026");
    if (k > 0) throw new Error(`${seedId}: デッキID 61759026 のデッキがある（${k}件）。シード表は「あれば削除する」と定めるが、DBを書き換えないため止めた（判断待ち）`);
    reportSeedIssue(seedId, "デッキID 61759026 のデッキが無いことをDBの参照で確かめた（削除はしていない）");
  },
});
defineCaseSeed("S-F06-17-CASE-028", "028", {
  大会: null,
  あと: async ({ browser, notes, seedId, 会員: m }) => {
    const id = await 管理画面(browser, (page) => イベントなしの大会デッキを登録する(page, {
      フォーマット: 形式.A.名日, アーキタイプ: アーキタイプ名, 公開状態: "非公開", 検索語: m!.名, 選手ID: m!.選手ID, メイン: `1 ${カード.通常A.名日}`,
    }, (x) => reportSeedIssue(seedId, x)));
    notes.set("〔デッキID-F0617-028〕", id);
    デッキ一覧の控え.set("028", id);
    reportSeedIssue(seedId, `デッキタイプ「event」（大会のデッキ種別）・イベントなしで登録した。公開状態の「非表示」は選択肢に無いので「非公開」、アーキタイプ（必須）は「${アーキタイプ名}」を選んだ`);
  },
});

// ---- 組合せ（会員の氏名・英字の姓名・住所地） ----
const CB = (n: string, x: Partial<会員指定> = {}): 会員指定 => ({ 前半: `cbf0617-${n}`, パスワード: `Passw0rd-CBF0617${n}`, 姓: `F0617CB${n}`, 名: "Ab", ...x });
const CB大会 = (n: string): 大会指定 => ({ 名: `F06-17単一形式大会-CB${n}`, 形式: [形式.A.名日] });

/** CB の上書きケース: 旧カードのデッキを提出し、管理画面のデッキ編集画面でプレイヤー名を「F0617-CBnnn-KEEP」にして更新する */
function CB上書き(n: string) {
  return async (ctx: { browser: Browser; notes: Notes; seedId: string; 会員?: 作った会員; 大会?: 作った大会 }) => {
    await 提出して控える(`CB${n}`, 形式.A.名日, `1 ${カード.旧.名日}`, "")(ctx);
    const id = デッキ一覧の控え.get(`CB${n}`)!;
    await 管理画面(ctx.browser, async (page) => {
      const ids = await 日程のデッキを検索する(page, ctx.大会!.イベント詳細ID);
      if (ids.length !== 1 || ids[0] !== id) throw new Error(`${ctx.seedId}: デッキ一覧でイベント詳細ID ${ctx.大会!.イベント詳細ID} のデッキが提出したデッキ ${id} の1件だけでない（${ids.join("、")}）`);
      await デッキを更新する(page, id, { プレイヤー名: `F0617-CB${n}-KEEP`, 空のときのアーキタイプ: アーキタイプ名 }, (x) => reportSeedIssue(ctx.seedId, x));
    }, F0617_ADMIN);
  };
}
const CB会員の呼び名 = (n: string) => ({ 会員ID: `〔会員ID-F0617-CB${n}〕`, 選手ID: `〔選手ID-F0617-CB${n}〕` });

function defineCBSeed(seedId: string, n: string, m: 会員指定, 上書き: boolean): void {
  defineSeed(seedId, { needs: 共通 }, async ({ browser, notes }) => {
    const 会 = await 会員を作る(browser, notes, seedId, `CB${n}`, m, CB会員の呼び名(n));
    const e = await 大会を作る(browser, notes, `CB${n}`, `CB${n}`, CB大会(n));
    if (上書き) await CB上書き(n)({ browser, notes, seedId, 会員: 会, 大会: e });
    else await デッキ0件を確かめる(browser, seedId, e.イベント詳細ID);
  });
}
defineCBSeed("S-F06-17-CBNEW-044", "044", CB("044", { 海外: true, 英姓: "TEST", 英名: "TARO" }), false);
defineCBSeed("S-F06-17-CBUPD-045", "045", CB("045", { 海外: true, 英姓: "TEST", 英名: "TARO" }), true);
defineCBSeed("S-F06-17-CBUPD-046", "046", CB("046", { セイ: "サトウ", メイ: "ジロウ", 英姓: "TEST", 英名: "TARO" }), true);
defineCBSeed("S-F06-17-CBUPD-047", "047", CB("047", { 海外: true }), true);
defineCBSeed("S-F06-17-CBUPD-048", "048", CB("048", { セイ: "スズキ", メイ: "サブロウ" }), true);

// ---------------------------------------------------------------------------
// 連携（PE）: 管理画面のイベント申込一覧・デッキ一覧への連携
// ---------------------------------------------------------------------------

export const 連携店名 = "連携店F06-17";
export const 連携形式 = { 名日: "連携形式F06-17", 名英: "Link Format F0617" };
export const 連携カード = [
  { 名日: "連携稲妻", 名英: "Link Bolt" },
  { 名日: "連携島", 名英: "Link Island" },
  { 名日: "連携否認", 名英: "Link Negate" },
];
const PE管理者名 = "PE管理者F0617";
export const PE管理者: Account = { loginId: "pe-f0617-admin", password: "Passw0rd-PE-F0617" };

const definePESeed = (seedId: string, 番号: string, 英姓: string, 大会: { 名日: string; 名英: string; 開始: string }) => {
  defineSeed(seedId, { needs: ["S-F06-17-PE-REF"] }, async ({ browser, notes }) => {
    const key = `PE${番号}`;
    await 会員を作る(browser, notes, seedId, key, {
      前半: `pe-f0617-${番号}`, パスワード: `F0617-Passw0rd-PE${番号}`, 姓: "F06-17", 名: `F0617PE${番号}`, セイ: "レンケイ", メイ: "テスト", 英姓, 英名: "TARO",
      日本の住所: { 郵便番号: "1000001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1-1", 電話番号: "0312345678" },
    }, { 会員ID: `〔会員ID-F0617-${番号}〕` });
    const ルール = await 管理画面(browser, (page) => ルール適用度の先頭(page), PE管理者);
    await 大会を作る(browser, notes, key, 番号, { 名: 大会.名日, 名英: rc(大会.名英), 形式: [連携形式.名日], 開始: 大会.開始, 店: 連携店名, ルール適用度: ルール }, PE管理者);
    reportSeedIssue(seedId, `ルール適用度はプルダウン先頭の選択肢「${ルール}」。住所の市区町村・番地は「千代田区千代田」「1-1」に分けて入れた`);
  });
};
definePESeed("S-F06-17-PE-CASE-037", "001", "ALPHA", { 名日: "連携デッキ大会-F0617-PE001", 名英: "Link Deck Cup F06-17 F0617PE001", 開始: "2099-12-20 10:00" });
definePESeed("S-F06-17-PE-CASE-039", "003", "CHARLIE", { 名日: "連携デッキ大会-F0617-PE003", 名英: "Link Deck Cup F06-17 F0617PE003", 開始: "2099-12-20 10:00" });
definePESeed("S-F06-17-PE-CASE-040", "004", "DELTA", { 名日: "連携デッキ大会-F0617-PE004", 名英: "Link Deck Cup F06-17 F0617PE004", 開始: "2099-12-20 10:00" });
definePESeed("S-F06-17-PE-CASE-041", "005", "ECHO", { 名日: "連携デッキ大会M15-F0617-PE005", 名英: "Link Deck Cup M15 F06-17 F0617PE005", 開始: "2026-01-01 10:00" });
definePESeed("S-F06-17-PE-CASE-042", "006", "FOXTROT", { 名日: "連携デッキ大会M15-F0617-PE006", 名英: "Link Deck Cup M15 F06-17 F0617PE006", 開始: "2026-01-01 10:00" });
definePESeed("S-F06-17-PE-CASE-043", "007", "GOLF", { 名日: "連携デッキ大会M15-F0617-PE007", 名英: "Link Deck Cup M15 F06-17 F0617PE007", 開始: "2026-01-01 10:00" });
