/**
 * M13-12 イベント新規申込登録のシード（画面操作）。正本: cases/M13-12_seed_data.tsv
 *
 * - 店舗A・店舗B（S-M13-12-STORE-A・B）: シード表の投入方法は「DBシードで店舗ID 1301・1302 を登録する」。DB へは書かない決まりなので、
 *   店舗登録画面で実行の印つきの店名（店舗A-<印>・店舗B-<印>。開発環境に同名の店舗が複数あるため新しく作る。pages/admin/m13_marked_shop.ts）の店舗を用意し、店舗ID 1301・1302 の代わりにする。
 *   ケースは店舗の番号そのものを確かめない（032 は店名「店舗A」を見る）。会場（M13-12会場A・B）は、会場の概念が無くなった（設計書 L0071）ので作らない。
 * - 申込登録用マスタ（S-M13-12-MASTER）: 投入方法は「初期マスタデータとしてDBシードで登録する」。DB へは書かず、
 *   フォーマット「スタンダード」がイベント登録画面の選択肢にあることを確かめる。申込状況「申込済み」・支払方法「管理者追加」は、
 *   新規申込登録画面にだけ出る値なので、ケースの画面（003・018 ほか）で確かめる。
 * - 管理者（S-M13-12-ADM）: 管理者ID 131290000 は画面では決められないので、画面が振る番号のまま使う。
 *   権限は「モールオペレーター」で代える（「店舗オーナー」は所属店舗の店舗しか見えず、001 で店舗Bのイベントが一覧に出ない。M13-11 の記録 2026-11-09）。
 *   編集可能店舗は店舗Aだけ（店舗Bは選ばない）。
 * - 店舗Bのイベント（001）は、シード表の「店舗Bの編集権限を持つ別の管理者」で登録する。シード表に行が無いので、要るときに画面から作る
 *   （m1312_admin_b、店舗オーナー・所属店舗B・編集可能店舗B）。
 * - イベントの日程は、開始時間をシード表の値、オンライン受付を開始時間より前（2026-09-01〜2026-10-01）、受付時間を 12:00〜12:30、
 *   デッキ登録なし、公開で登録する。イベントは支払方法「クレジットカード決済」、ルール適用度「初心者歓迎」、公開状態「公開」、定員 16。
 * - 決め打ちの識別の値（「任意の名称」のイベント名・会員のメールアドレス・検索語）には実行の印を付ける（rc）。
 *   ケースが値そのものを見るもの（002 のイベント名、016 の会員の氏名、034 の MTG Companion登録名）は正本の値のまま。
 * - 会員はフロントの新規会員登録で作り（本登録のメールは手元の受け口で読む）、会員一覧をメールアドレスで検索して会員IDを控える。
 *   会員登録/編集画面で会員種別が本会員であることを確かめる（本登録で本会員になっていれば登録は押さない）。
 * - プレイヤーIDは、イベント新規申込登録画面のプレイヤー検索の結果一覧のID欄から控える。同じ氏名の行が複数あれば（016 を流し直したとき）、
 *   いちばん大きいID（いま作った会員のプレイヤー）を控える。
 * - 申込プレイヤーID（画面に出ない番号）は、DB の参照（SELECT）で控える（F07-04 の前例。依頼者決定 2026-11-03）。
 * - 作らないシード: S-M13-12-NORESULT-011（既存データから検索語を取り除く作業が DB への直接の設定）、
 *   S-M13-12-ABSENT-021（固定の日程ID 1399998・1400000 の登録と 1399999 の削除が DB シード）。
 * - S-M13-02-QK-ADM・QK-MASTERS は seeds/m13-02-qk.ts（M13-13 の担当が書いたものをそのまま使う）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 申込の申込選手ID } from "../db/f07_04";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { BASE_URL } from "../config/env";
import { openEventCreate, registerEvent } from "../pages/admin/event";
import { 会員IDをメールから } from "../pages/admin/f07_04_setup";
import { EntryNewPage, 会員を本会員にする, 金額 } from "../pages/admin/m13_12_entry_new";
import { ensureMember } from "../pages/admin/member";
import { registerSchedule } from "../pages/admin/schedule";
import { ensureMarkedTenant, 印店名 } from "../pages/admin/m13_marked_shop";
import { ensureTenant } from "../pages/admin/tenant";
import { registerFrontMember } from "../pages/front/member_entry";
import { QK1302_ADMIN, QK連携店舗 } from "./m13-02-qk";

export const M1312_ADMIN: Account = { loginId: "m1312_admin", password: "Passw0rd!M1312" };
const M1312_ADMIN_B: Account = { loginId: "m1312_admin_b", password: "Passw0rd!M1312B" };
export const M1312_RI_ADMIN: Account = { loginId: "m1312_ri_admin", password: "Passw0rd-M1312RI" };
const 会員のパスワード = "Passw0rd!M1312P";

// ---- 店舗・マスタ・管理者 ----


defineSeed("S-M13-12-STORE-A", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const id = await ensureMarkedTenant(page, "A", (m) => reportSeedIssue(seed.シードID, m));
    reportSeedIssue(seed.シードID, `投入方法の「DBシードで店舗ID 1301を登録する」は行わず（DBへ書かない決まり）、店舗登録画面の店名「店舗A」に実行の印を付けた店舗（店舗ID ${id}）を店舗ID 1301 の代わりにした。会場は設計書で項目が無くなったので作っていない`);
  });
});

defineSeed("S-M13-12-STORE-B", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const id = await ensureMarkedTenant(page, "B", (m) => reportSeedIssue(seed.シードID, m));
    reportSeedIssue(seed.シードID, `投入方法の「DBシードで店舗ID 1302を登録する」は行わず（DBへ書かない決まり）、店舗登録画面の店名「店舗B」に実行の印を付けた店舗（店舗ID ${id}）を店舗ID 1302 の代わりにした。会場は設計書で項目が無くなったので作っていない`);
  });
});

defineSeed("S-M13-12-MASTER", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const form = await openEventCreate(page);
    const have = await form.options(form.フォーマット);
    if (!have.includes("スタンダード")) throw new Error(`${seed.シードID}: イベント登録画面のフォーマットに「スタンダード」が無い（ある選択肢: ${have.join("、")}）`);
  });
  reportSeedIssue(seed.シードID, "投入方法の「DBシードで登録する」は行わず（DBへ書かない決まり）、フォーマット「スタンダード」がイベント登録画面の選択肢にあることを確かめた。申込状況「申込済み」・支払方法「管理者追加」は新規申込登録画面にだけ出るので、ケースの画面で確かめる");
});

defineSeed("S-M13-12-ADM", { needs: ["S-M13-12-STORE-A", "S-M13-12-STORE-B"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: "M13-12試験管理者", 所属店舗: 印店名.A, ログインID: M1312_ADMIN.loginId, メールアドレス: "m1312_admin@example.test",
      パスワード: M1312_ADMIN.password, 権限: "モールオペレーター", デフォルト検索表示店舗: 印店名.A, 編集可能店舗: [印店名.A],
    });
  });
  // ログインでき（稼働中）、イベント管理の画面を開けること
  await withAdminSession(browser, M1312_ADMIN, async (page) => { 待ちを区切る(page); await openEventCreate(page); });
});

async function 店舗B管理者を用意する(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: "M13-12店舗B管理者", 所属店舗: 印店名.B, ログインID: M1312_ADMIN_B.loginId, メールアドレス: "m1312_admin_b@example.test",
      パスワード: M1312_ADMIN_B.password, 権限: "店舗オーナー", デフォルト検索表示店舗: 印店名.B, 編集可能店舗: [印店名.B],
    });
  });
}

// ---- イベントと日程 ----

/**
 * シードの画面操作の待ちを2分で区切る。画面がシステムエラーを返して「新規作成」などが出ないと、
 * 区切りが無ければケースの時間切れ（30分）まで待ち続ける（2026-11-09 の 002・016・020）
 */
function 待ちを区切る(page: Page): void {
  page.setDefaultTimeout(120_000);
}

type 大会 = { 名日: string; 名英: string; 店舗?: string; 参加費?: string; 開始?: string };

/** イベント登録画面で登録し、「日程追加」から日程を1件登録する。[イベントID, 日程ID] */
async function イベントと日程を登録する(browser: Browser, account: Account, v: 大会): Promise<[string, string]> {
  const 参加費 = v.参加費 ?? "2500";
  return withAdminSession(browser, account, async (page) => {
    待ちを区切る(page);
    const id = await registerEvent(page, {
      イベント名日: v.名日, イベント名英: v.名英, 店舗: v.店舗 ?? 印店名.A, フォーマット: ["スタンダード"], 支払方法: ["クレジットカード決済"],
      参加費, ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "16",
    });
    const d = await registerSchedule(page, id, {
      開始時間: v.開始 ?? "2026-10-10 13:00", 参加費, 受付あり: true, 受付時間: { 開始: "12:00", 終了: "12:30" },
      オンライン受付: { 開始: "2026-09-01 10:00", 終了: "2026-10-01 10:00" }, デッキ登録あり: false, 公開状態: "公開",
    });
    return [id, d];
  });
}

const 統合イベント: 大会 = { 名日: "M13-12統合イベント", 名英: "M13-12 Integration Event" };
/** 「ほかのイベントと重ならない任意の名称」のイベント名 */
export const 任意のイベント名 = (n: string): 大会 => ({ 名日: rc(`M1312-${n}大会`), 名英: `M1312 Event ${n} ${RUN_MARK}` });

function defineEventSeed(seedId: string, n: string, v: 大会): void {
  defineSeed(seedId, { needs: ["S-M13-12-ADM"] }, async ({ browser, notes }) => {
    const [e, d] = await イベントと日程を登録する(browser, M1312_ADMIN, v);
    notes.set(`〔イベントID-M1312-${n}〕`, e);
    notes.set(`〔イベント日程ID-M1312-${n}〕`, d);
  });
}
defineEventSeed("S-M13-12-EVENT-002", "002", 統合イベント);
defineEventSeed("S-M13-12-EVENT-003", "003", 統合イベント);
defineEventSeed("S-M13-12-EVENT-004", "004", 統合イベント);
defineEventSeed("S-M13-12-EVENT-005", "005", 統合イベント);
defineEventSeed("S-M13-12-EVENT-006", "006", 統合イベント);
defineEventSeed("S-M13-12-EVENT-007", "007", 統合イベント);
defineEventSeed("S-M13-12-EVENT-008", "008", 統合イベント);
defineEventSeed("S-M13-12-EVENT-020", "020", 統合イベント);
defineEventSeed("S-M13-12-EVENT-032", "032", 任意のイベント名("032"));
defineEventSeed("S-M13-12-EVENT-033", "033", 任意のイベント名("033"));

/** 001 の検索語（イベント名に「M13-12権限制御-001」を含む。印は検索語の側に付ける） */
export const 権限制御の検索語 = () => rc("M13-12権限制御-001");

defineSeed("S-M13-12-EVENT-001", { needs: ["S-M13-12-ADM"] }, async ({ browser, notes }) => {
  const [ea, da] = await イベントと日程を登録する(browser, M1312_ADMIN, { 名日: `${権限制御の検索語()}-A`, 名英: "M13-12 Permission Event 001 A" });
  await 店舗B管理者を用意する(browser);
  const [eb, db] = await イベントと日程を登録する(browser, M1312_ADMIN_B, {
    名日: `${権限制御の検索語()}-B`, 名英: "M13-12 Permission Event 001 B", 店舗: 印店名.B, 参加費: "3000", 開始: "2026-10-11 13:00",
  });
  notes.set("〔イベントID-M1312-001A〕", ea);
  notes.set("〔イベント日程ID-M1312-001A〕", da);
  notes.set("〔イベントID-M1312-001B〕", eb);
  notes.set("〔イベント日程ID-M1312-001B〕", db);
});

// ---- 会員・プレイヤー・申込 ----

type 会員 = { 姓: string; 名: string; メール: string; MTG姓?: string; MTG名?: string };

/** フロントの新規会員登録で会員を作る（本登録まで） */
async function 会員を登録する(browser: Browser, m: 会員, パスワード = 会員のパスワード, セイ = "シケン", メイ = "カイイン"): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await registerFrontMember(page, { 姓: m.姓, 名: m.名, セイ, メイ, メール: m.メール, パスワード, MTG姓: m.MTG姓, MTG名: m.MTG名 });
  } finally {
    await context.close();
  }
}

/** 会員一覧をメールアドレスで検索して会員IDを読み、会員登録/編集画面で本会員にする */
async function 会員IDを読んで本会員にする(browser: Browser, メール: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const id = await 会員IDをメールから(page, メール);
    await 会員を本会員にする(page, id);
    return id;
  });
}

/**
 * イベント申込登録（検索結果）の日程の行の「新規登録」からイベント新規申込登録画面を開き、プレイヤー検索で語を検索して、
 * 氏名が一致する行のうちいちばん大きいIDを読む。申込するなら、その行の決定を押して登録し、申込IDも返す。
 * 申込しないなら、決定を押さずに閉じるボタンで閉じ、登録を押さずに画面を離れる。
 */
async function プレイヤーIDを読む(browser: Browser, イベント名: string, 日程ID: string, 語: string, 氏名: string, 申込する: boolean): Promise<{ プレイヤーID: string; 申込ID?: string }> {
  return withAdminSession(browser, M1312_ADMIN, async (page) => {
    const f = new EntryNewPage(page);
    await f.検索結果から開く(イベント名, 日程ID);
    await f.ポップアップを開く();
    await f.プレイヤーを検索する(語);
    const rows = (await f.全ページの結果()).filter((r) => r.名前 === 氏名 || r.名前.startsWith(`${氏名} `));
    if (rows.length === 0) throw new Error(`プレイヤー検索「${語}」の結果に、氏名「${氏名}」の行が無い`);
    const プレイヤーID = String(Math.max(...rows.map((r) => Number(r.ID))));
    if (!申込する) {
      await f.ポップアップを閉じる();
      await page.goto(BASE_URL);
      return { プレイヤーID };
    }
    await f.IDの行のページへ(プレイヤーID);
    await f.決定する(プレイヤーID);
    // 登録の前に、申込状況・支払方法・支払金額の表示を確かめる（シード表の投入方法）
    const 状況 = await f.選ばれている(f.申込状況); const 方法 = await f.選ばれている(f.支払方法); const 金 = 金額(await f.支払金額.inputValue());
    if (状況 !== "申込済み" || 方法 !== "管理者追加" || 金 !== "2500") {
      throw new Error(`イベント新規申込登録画面の表示がシード表と違う: 申込状況「${状況}」・支払方法「${方法}」・支払金額「${金}」（求めるのは 申込済み・管理者追加・2500）`);
    }
    return { プレイヤーID, 申込ID: await f.登録して申込IDを読む(`イベント申込（${イベント名}・${氏名}）の登録`) };
  });
}

/** プレイヤー検索に入れる語（会員のお名前(姓)）。ケースもこの語で検索する */
export function 会員の姓(n: string): string {
  if (n === "013") return rc("登録済選手-013");
  if (n === "016") return "会員姓桜井";
  return rc(`M1312選手${n}`);
}
/** 会員の氏名（プレイヤー検索の結果のプレイヤー名の1行目） */
export function 会員の氏名(n: string): string {
  return n === "016" ? "会員姓桜井 会員名光" : `${会員の姓(n)} テスト`;
}

/** 会員・プレイヤー（申込するなら申込も）を持つシード */
function defineMemberSeed(seedId: string, n: string, メールの前半: string, opt: { 申込する: boolean; MTG?: { 姓: string; 名: string } }): void {
  defineSeed(seedId, { needs: ["S-M13-12-ADM"] }, async ({ browser, notes }) => {
    const 大 = 任意のイベント名(n);
    const [e, d] = await イベントと日程を登録する(browser, M1312_ADMIN, 大);
    notes.set(`〔イベントID-M1312-${n}〕`, e);
    notes.set(`〔イベント日程ID-M1312-${n}〕`, d);
    const 名 = n === "016" ? "会員名光" : "テスト";
    const メール = `${rc(メールの前半)}@example.test`.toLowerCase();
    await 会員を登録する(browser, { 姓: 会員の姓(n), 名, メール, MTG姓: opt.MTG?.姓, MTG名: opt.MTG?.名 });
    notes.set(`〔会員ID-M1312-${n}〕`, await 会員IDを読んで本会員にする(browser, メール));
    const r = await プレイヤーIDを読む(browser, 大.名日, d, 会員の姓(n), 会員の氏名(n), opt.申込する);
    notes.set(`〔プレイヤーID-M1312-${n}〕`, r.プレイヤーID);
    if (opt.申込する) {
      notes.set(`〔申込ID-M1312-${n}〕`, r.申込ID!);
      notes.set(`〔申込プレイヤーID-M1312-${n}〕`, 申込の申込選手ID(r.申込ID!));
    }
  });
}
defineMemberSeed("S-M13-12-PLAYER-014", "014", "m1312-player-014", { 申込する: false });
defineMemberSeed("S-M13-12-PLAYER-015", "015", "m1312-player-015", { 申込する: false });
defineMemberSeed("S-M13-12-PLAYER-016", "016", "m1312-player-016", { 申込する: false });
defineMemberSeed("S-M13-12-PLAYER-017", "017", "m1312-player-017", { 申込する: false });
defineMemberSeed("S-M13-12-PLAYER-018", "018", "m1312-player-018", { 申込する: false });
defineMemberSeed("S-M13-12-PLAYER-019", "019", "m1312-player-019", { 申込する: false });
defineMemberSeed("S-M13-12-PLAYER-026", "026", "m1312-player-026", { 申込する: false });
defineMemberSeed("S-M13-12-PLAYER-027", "027", "m1312-player-027", { 申込する: false });
defineMemberSeed("S-M13-12-REGISTERED-013", "013", "m1312-registered-013", { 申込する: true });
defineMemberSeed("S-M13-12-REGISTERED-024", "024", "m1312-registered-024", { 申込する: true });
defineMemberSeed("S-M13-12-REGISTERED-025", "025", "m1312-registered-025", { 申込する: true });
defineMemberSeed("S-M13-12-PLAYER-034", "034", "m1312-034-player", { 申込する: false, MTG: { 姓: "M1312-034-Yamada", 名: "M1312-034-Taro" } });

/** 012 の検索語（プレイヤー名「ページ対象選手01〜11」。印は検索語の側に付ける） */
export const ページ対象の検索語 = () => rc("ページ対象");

defineSeed("S-M13-12-PAGING-012", { needs: ["S-M13-12-ADM"] }, async ({ browser, notes }) => {
  const 大 = 任意のイベント名("012");
  const [e, d] = await イベントと日程を登録する(browser, M1312_ADMIN, 大);
  notes.set("〔イベントID-M1312-012〕", e);
  notes.set("〔イベント日程ID-M1312-012〕", d);
  const 姓 = (i: number) => `${ページ対象の検索語()}選手${String(i).padStart(2, "0")}`;
  const メール一覧: string[] = [];
  for (let i = 1; i <= 11; i++) {
    const メール = `${rc(`m1312-paging-012-${String(i).padStart(2, "0")}`)}@example.test`.toLowerCase();
    await 会員を登録する(browser, { 姓: 姓(i), 名: "テスト", メール });
    メール一覧.push(メール);
  }
  for (const m of メール一覧) await 会員IDを読んで本会員にする(browser, m);
  await withAdminSession(browser, M1312_ADMIN, async (page) => {
    const f = new EntryNewPage(page);
    await f.検索結果から開く(大.名日, d);
    await f.ポップアップを開く();
    await f.プレイヤーを検索する(ページ対象の検索語());
    const rows = await f.全ページの結果();
    if (rows.length !== 11) throw new Error(`プレイヤー検索「${ページ対象の検索語()}」の結果が ${rows.length} 件（この11件だけのはず）: ${rows.map((r) => r.名前).join("、")}`);
    const idOf = (i: number) => {
      const r = rows.filter((x) => x.名前.startsWith(`${姓(i)} `));
      if (r.length !== 1) throw new Error(`プレイヤー検索の結果に「${姓(i)}」の行が ${r.length} 件`);
      return r[0].ID;
    };
    // 呼び名は、シード表に名前で出てくる 01（A）と 11（K）だけを控える（02〜10 は「〜」の範囲でしか書かれていない）
    notes.set("〔プレイヤーID-M1312-012A〕", idOf(1));
    notes.set("〔プレイヤーID-M1312-012K〕", idOf(11));
    await f.ポップアップを閉じる();
  });
});

// ---- 035（QK連携） ----

export const QK会員 = () => ({ 姓: "試験", 名: rc("QK1312-001"), メール: `${rc("qk1312-001")}@example.test`.toLowerCase(), パスワード: "QkPw1312001!" });
export const QKイベント名 = () => rc("QK申込登録大会-1312-001");

defineSeed("S-M13-12-QK-ENTRY-035", { needs: ["S-M13-02-QK-ADM"] }, async ({ browser, notes }) => {
  const m = QK会員();
  await 会員を登録する(browser, { 姓: m.姓, 名: m.名, メール: m.メール }, m.パスワード, "シケン", "キューケー");
  await withAdminSession(browser, QK1302_ADMIN, async (page) => {
    const id = await registerEvent(page, {
      イベント名日: QKイベント名(), イベント名英: "QK Entry 1312-001", 店舗: QK連携店舗, フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎",
      公開状態: "公開", 定員: "16", 参加費: "500",
    });
    notes.set("〔イベントID-M1312-QK001〕", id);
    // 受付あり・デッキ登録ありは外し、オンライン受付ありはチェックを入れない。定員・参加費・公開状態は初期表示のまま
    await registerSchedule(page, id, { 開始時間: "2030-10-21 10:00", 受付あり: false, デッキ登録あり: false });
  });
});

// ---- 036（連携: 申込の前後のイベント編集の日程一覧） ----

export const RI会員の姓 = () => rc("検証M1312RI-001");
export const RIイベント名 = () => rc("RI申込大会-001");

defineSeed("S-M13-12-RI-ADM", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    notes.set("〔店舗ID-M1312-RI共有〕", await ensureTenant(page, {
      店名: "連携店舗M1312", 店名カナ: "レンケイテンポエムイチサンイチニ", 店名英語: "Link Shop RI Twelve", 支店URL: "m1312ri", 店名略称3文字: "R12", ショップ名略称: "連携店舗M1312",
    }, (m) => reportSeedIssue(seed.シードID, m)));
    await ensureMember(page, {
      名前: "M13-12連携試験管理者", 所属店舗: "連携店舗M1312", ログインID: M1312_RI_ADMIN.loginId, メールアドレス: "m1312_ri_admin@example.test",
      パスワード: M1312_RI_ADMIN.password, 権限: "店舗オーナー", デフォルト検索表示店舗: "連携店舗M1312", 編集可能店舗: ["連携店舗M1312"],
    });
  });
  await withAdminSession(browser, M1312_RI_ADMIN, async (page) => { await openEventCreate(page); });
});

defineSeed("S-M13-12-RI-ENTRY-036", { needs: ["S-M13-12-RI-ADM"] }, async ({ browser, notes }) => {
  await 会員を登録する(browser, { 姓: RI会員の姓(), 名: "一郎", メール: `${rc("m1312ri-001")}@example.test`.toLowerCase() }, 会員のパスワード, "ケンショウ", "イチロウ");
  await withAdminSession(browser, M1312_RI_ADMIN, async (page) => {
    const id = await registerEvent(page, {
      イベント名日: RIイベント名(), イベント名英: "RI Entry Cup 001", 店舗: "連携店舗M1312", フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎",
      公開状態: "公開", 定員: "16", 参加費: "0",
    });
    notes.set("〔イベントID-M1312-RI001〕", id);
    notes.set("〔日程ID-M1312-RI001〕", await registerSchedule(page, id, {
      開始時間: "2026-12-14 10:00", 受付あり: true, 受付時間: { 開始: "09:00", 終了: "09:30" },
      オンライン受付: { 開始: "2026-10-01 00:00", 終了: "2026-11-30 00:00" }, デッキ登録あり: false,
    }));
  });
});

