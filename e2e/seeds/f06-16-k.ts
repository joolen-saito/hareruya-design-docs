// 取り込み注記: 同じ機能の作り方を main 側も実装していたため、栗野側の版を別ファイルにした。main が登録済みのシードは登録しない（seeds/main_defined.ts）。
/**
 * F06-16 大会デッキ登録編集（フロント・マイページ）のシード（画面操作）。正本: cases/F06-16_seed_data.tsv
 *
 * 作り方は、シード表の投入方法のとおり。シード表と違えたところ（解釈）:
 * - 会員: シード表は「管理画面の会員管理＞会員登録画面」で登録すると定めるが、管理画面には会員を新しく登録する画面が無い（会員の編集だけ）。
 *   フロントの新規会員登録で作り、本登録のメールのURLを開いて本会員にする（依頼者決定 2026-10-31。F06-01・F07-04 と同じ作り方）。
 *   会員IDは管理画面の会員一覧をメールアドレスで検索して控える。メールアドレスの前半には実行の印を付ける（依頼者決定 2026-10-28）。
 *   パスワードは、シード表が値を定める組合せのケース（065〜075）はその値、ほかは試験用の固定の値。
 *   フロントの会員登録は生年月日・住所・電話番号が必須なので、登録できる任意の値を入れる。海外の会員（044・070）は国に「United States」を選び、
 *   お名前(カナ)（日本語のサイトでは必須）に「スミス」「ジョン」を入れる（シード表にカナの値は無い）。
 * - 選手ID: 会員登録と同時に作られる選手情報の番号。シード表はプレイヤー検索の全ページで最も大きいIDと定めるが、検索結果は並びが決まらず、
 *   同じ名前の選手が実行のたびに増えるので、DBの参照（読むだけ）で会員IDから読んで控える（F06-14・F07-04 と同じ）。
 * - マイデッキを持つ会員（017・019・020・060・061・062・073・074・075）は、管理画面のデッキ登録のプレイヤー検索で1人に絞れるよう、
 *   お名前(名)の末尾に「F0616＋ケース番号＋実行の印」を付ける（ケースはお名前を確かめない）。プレイヤー検索にはこの語を入れる。
 * - 管理者: 全権限の管理者（SETUP_ADMIN）は編集可能店舗を持たず、イベント登録の店舗の選択肢が空になる。シード表の「シードを登録する管理者の
 *   編集可能店舗に晴れる屋2を加える」は、共有の管理者を書き換えないため、晴れる屋2を所属店舗・編集可能店舗とする試験管理者（f0616_admin・
 *   システム管理者）をメンバー管理で用意し、イベントと日程はこの管理者で登録する。ほかの登録（店舗・フォーマット・カード・デッキ）は SETUP_ADMIN。
 * - フォーマット（Standard・Modern・Legacy・Commander）とカード（Island・Negate・Alpha Wolf・Alpha Strike など）の名前は、末尾に実行の印を付けて
 *   毎回作る（例: Standard → Standard-印）。同じ名前の既存のマスタ（実在の Standard・Island など）に当てて、共有のマスタ（使用可能フォーマット・
 *   ランキング表示など）を書き換えないため。ケースの手順・期待結果の同じ名前も、印つきの名前として読む。
 *   フォーマットコードは「F16St印」のように互いに重ならない値。メタゲーム分析日数は 30（必須の欄。任意の値）。
 *   シード表に無いが、イベント登録画面の選択肢に出すため「イベントに表示」を、マイデッキ取得ポップアップの「フォーマットで絞り込む」に出すため
 *   「デッキビルダーで利用」を、4つとも付ける（062・073〜075 がポップアップで Legacy・Modern・Commander を選ぶ）。
 * - アーキタイプ: デッキ登録画面のアーキタイプは必須で、選択肢はフォーマットに属するものだけ。新しく作るフォーマットにはアーキタイプが無いので、
 *   フォーマットごとにアーキタイプを1つ（「F0616-<フォーマット>-印」）登録し、マイデッキの「アーキタイプに任意の値」はそれを選ぶ。
 * - マイデッキの公開状態(デッキ全体の公開設定)は「非公開」（任意の値）。
 * - イベント: ルール適用度は「初心者歓迎」、公開状態は公開、定員10・参加費0（任意の値）。日程の公開状態は公開。
 * - フォーマットの「ランキング表示」「メタ分布簡易化」を「違っていれば直す」は、このシードが作った印つきのフォーマットだけを使うので行わない（REF の値のまま）。
 * - 「Unknown Card」「F0616-056-Ghost」のカードが「あれば削除する」は、共有のマスタを消さないため、カード一覧で検索して無いことを確かめ、
 *   あれば止める（判断待ち）。038 の「イベントID 999999 の日程があれば削除する」も、DBの参照で無いことを確かめ、あれば止める。
 *
 * 作らないシード（ケースを実装しない）: 大会デッキのカード情報・マイデッキの作成日・選手情報の削除をDBへ直接設定するもの
 * （CASE-001・009・015・018・026・027・030・032・034・035・037・050・051、CBEX*-065〜068・071）、試験環境のメール受信サービスの停止（MAIL）、
 * レイアウトのブロック配置（ARENABLOCK-054）、連携試験（PE-REF・PE-CASE-063）。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { プレイヤーID } from "../db/f03_07";
import { 番号の日程の件数 } from "../db/f06_16_k";
import { 旧カード, 旧カード情報を足す, 選手情報を会員から外す, マイデッキの日時を設定する } from "../db/f06_16_write";
import { available } from "../lib/db";
import { Notes } from "../lib/notes";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { registerEvent } from "../pages/admin/event";
import { 申込を登録する } from "../pages/admin/f06_14_setup";
import { アーキタイプを登録する, カード名リストを作成する } from "../pages/admin/f09_01_setup";
import { 試験店舗を登録する } from "../pages/admin/f07_01_setup";
import { 会員IDをメールから } from "../pages/admin/f07_04_setup";
import { カードを名前で探す, フォーマットを用意する, ユーザーデッキを登録する } from "../pages/admin/f06_16_setup_k";
import { カードを登録する } from "../pages/admin/m14_card";
import { ensureMember } from "../pages/admin/member";
import { registerSchedule } from "../pages/admin/schedule";
import { DeckEntryEditPage } from "../pages/front/f06_16_deck_entry_k";
import { 海外の会員を登録する } from "../pages/front/f06_16_member";
import { registerFrontMember } from "../pages/front/member_entry";

// ---------------------------------------------------------------------------
// 共有の値
// ---------------------------------------------------------------------------

export const 店名 = "晴れる屋2";
export const F0616_ADMIN: Account = { loginId: "f0616_admin", password: "Passw0rd!F0616" };
const 会員のパスワード = "Passw0rd!F0616";

export type 形式キー = "Standard" | "Modern" | "Legacy" | "Commander";
/** フォーマット名（実行の印つき）。ケースの「Standard」などは、この名前として読む */
export const 形式 = (k: 形式キー): string => rc(k);
/** カード名（実行の印つき）。ケースの「Island」などは、この名前として読む */
export const 札 = (正本の名前: string): string => rc(正本の名前);
/** 大会名（実行の印つき） */
export const 大会名 = (正本の名前: string): string => rc(正本の名前);

const 形式の設定: Record<形式キー, { コード: string; 並び順: string; ランキング表示: boolean; メタ分布簡易化: boolean; 統率を使う: boolean; 呼び名: string }> = {
  Standard: { コード: "F16St", 並び順: "9601", ランキング表示: true, メタ分布簡易化: false, 統率を使う: false, 呼び名: "〔フォーマットID-F0616-共有A〕" },
  Modern: { コード: "F16Mo", 並び順: "9602", ランキング表示: false, メタ分布簡易化: true, 統率を使う: false, 呼び名: "〔フォーマットID-F0616-共有B〕" },
  Legacy: { コード: "F16Le", 並び順: "9603", ランキング表示: false, メタ分布簡易化: false, 統率を使う: false, 呼び名: "〔フォーマットID-F0616-共有C〕" },
  Commander: { コード: "F16Co", 並び順: "9604", ランキング表示: false, メタ分布簡易化: false, 統率を使う: true, 呼び名: "〔フォーマットID-F0616-共有D〕" },
};
/** フォーマットごとの、マイデッキ登録で選ぶアーキタイプの名前 */
export const アーキタイプ名 = (k: 形式キー): string => rc(`F0616-${k}`);

/** この実行で作った会員（ケースがログインに使う）。キーは呼び名の末尾（例: 002・019A） */
export type 作った会員 = { メール: string; パスワード: string; 会員ID: string; 選手ID: string; 検索語: string };
export const 会員一覧 = new Map<string, 作った会員>();
export type 作った大会 = { 名: string; イベントID: string; イベント詳細ID: string };
export const 大会一覧 = new Map<string, 作った大会>();

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

// ---------------------------------------------------------------------------
// 参照マスタ（共有）
// ---------------------------------------------------------------------------

/** REF のカード: 名前（正本）・使用可能フォーマット・呼び名 */
const 共有カード: { 名: string; 使用可: 形式キー[]; 呼び名: string }[] = [
  { 名: "Island", 使用可: ["Standard"], 呼び名: "〔カードID-F0616-共有A〕" },
  { 名: "Negate", 使用可: ["Standard", "Modern"], 呼び名: "〔カードID-F0616-共有B〕" },
  { 名: "Alpha Wolf", 使用可: ["Standard"], 呼び名: "〔カードID-F0616-共有C〕" },
  { 名: "Alpha Strike", 使用可: ["Modern"], 呼び名: "〔カードID-F0616-共有D〕" },
];

type カード定義 = { 英: string; 日?: string; 使用可?: 形式キー[]; 禁止?: 形式キー[] };

/** カードを、カード一覧に同じ名前があれば使い、無ければカード詳細(登録)で登録する。カードID（カード一覧のカードID列）を返す */
async function カードを用意する(page: Page, seedId: string, c: カード定義): Promise<string> {
  const 探す名 = c.日 ?? c.英;
  const have = await カードを名前で探す(page, 探す名);
  if (have.length > 1) throw new Error(`${seedId}: カード一覧に「${探す名}」が ${have.length} 件ある（同じ実行の印で流し直した）`);
  if (have.length === 1) { reportSeedIssue(seedId, `カード「${探す名}」はこの実行で作り済みのものを使った（カードID ${have[0]}）`); return have[0]; }
  const リーガリティ = [
    ...(c.使用可 ?? []).map((k) => ({ フォーマット: 形式(k), リーガリティ: "使用可" })),
    ...(c.禁止 ?? []).map((k) => ({ フォーマット: 形式(k), リーガリティ: "禁止" })),
  ];
  const id = await カードを登録する(page, { カード名日: c.日, カード名英: c.英, 点数で見たマナ: "0", リーガリティ }, `${seedId} のカード「${探す名}」`, (w) => reportSeedIssue(seedId, w));
  const found = await カードを名前で探す(page, 探す名);
  if (!found.includes(id)) throw new Error(`${seedId}: 登録したカード「${探す名}」（ID ${id}）がカード一覧の検索に出ない（${found.join("、") || "0件"}）`);
  return id;
}

// ---------------------------------------------------------------------------
// 会員・大会（ケース専用）
// ---------------------------------------------------------------------------

type 会員指定 = {
  /** メールアドレスの前半（実行の印を付ける） */
  前半: string;
  パスワード?: string;
  姓?: string; 名?: string; セイ?: string; メイ?: string;
  /** MTG Companion 登録本名(英語)。undefined は空のまま */
  英姓?: string; 英名?: string;
  海外?: boolean;
  /** マイデッキを持つ会員: お名前(名)の末尾に、プレイヤー検索で1人に絞れる語を付ける */
  識別?: string;
};

/** 会員を作り、会員IDと選手IDを控える（呼び名を渡したものだけ） */
async function 会員を作る(browser: Browser, notes: Notes, seedId: string, key: string, m: 会員指定, 呼び名: { 会員ID?: string; 選手ID?: string }): Promise<作った会員> {
  const メール = `${rc(m.前半)}@example.test`.toLowerCase();
  const パスワード = m.パスワード ?? 会員のパスワード;
  const 検索語 = m.識別 ? `F0616${m.識別}${RUN_MARK}`.replace(/[^0-9A-Za-z]/g, "") : "";
  const 姓 = m.姓 ?? "山田", 名 = `${m.名 ?? "太郎"}${検索語}`;
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    if (m.海外) await 海外の会員を登録する(page, { 姓, 名, セイ: m.セイ ?? "スミス", メイ: m.メイ ?? "ジョン", メール, パスワード, MTG姓: m.英姓, MTG名: m.英名 });
    else await registerFrontMember(page, { 姓, 名, セイ: m.セイ ?? "ヤマダ", メイ: m.メイ ?? "タロウ", メール, パスワード, MTG姓: m.英姓, MTG名: m.英名 });
  } finally { await context.close(); }
  const 会員ID = await 管理画面(browser, (page) => 会員IDをメールから(page, メール));
  if (!available) throw new Error(`${seedId}: 選手IDはDBの参照で読む。この環境はDBの参照ができない`);
  const 選手ID = プレイヤーID(会員ID);
  if (!選手ID) throw new Error(`${seedId}: 会員 ${メール}（会員ID ${会員ID}）に選手情報が無い`);
  if (呼び名.会員ID) notes.set(呼び名.会員ID, 会員ID);
  if (呼び名.選手ID) notes.set(呼び名.選手ID, 選手ID);
  const made = { メール, パスワード, 会員ID, 選手ID, 検索語 };
  会員一覧.set(key, made);
  return made;
}

type 大会指定 = { 名: string; 形式: 形式キー[]; デッキ登録?: boolean; 締切?: string };

/** 試験管理者でイベントと日程を登録し、イベントID・イベント詳細IDを控える */
async function 大会を作る(browser: Browser, notes: Notes, seedId: string, key: string, n: string, e: 大会指定): Promise<作った大会> {
  const 名 = 大会名(e.名);
  const made = await 管理画面(browser, async (page) => {
    const イベントID = await registerEvent(page, {
      イベント名日: 名, イベント名英: 名, 店舗: 店名, フォーマット: e.形式.map(形式), ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "10", 参加費: "0",
    });
    // 「デッキ登録あり」を外すと、日程登録画面はデッキ登録締切と「デッキ登録を終了する」の欄を隠して無効にする（入れられない）
    const あり = e.デッキ登録 ?? true;
    if (!あり) reportSeedIssue(seedId, "「デッキ登録あり」のチェックを外すと日程登録画面はデッキ登録締切の欄を隠して無効にするため、締切（2099-12-19 23:59）は入れられなかった");
    const イベント詳細ID = await registerSchedule(page, イベントID, {
      開始時間: "2099-12-20 10:00", 受付あり: false, デッキ登録あり: あり, ...(あり ? { デッキ登録締切: e.締切 ?? "2099-12-19 23:59", デッキ登録を終了する: false } : {}),
      公開状態: "公開",
    });
    return { 名, イベントID, イベント詳細ID };
  }, F0616_ADMIN);
  notes.set(`〔イベントID-F0616-${n}〕`, made.イベントID);
  notes.set(`〔イベント詳細ID-F0616-${n}〕`, made.イベント詳細ID);
  大会一覧.set(key, made);
  return made;
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

/** マイデッキ（ユーザーデッキ）を管理画面で登録し、デッキIDを返す */
async function マイデッキを作る(browser: Browser, seedId: string, 持ち主: 作った会員, v: { デッキ名: string; 形式: 形式キー; メイン?: string; サイド?: string; 統率?: string }): Promise<string> {
  if (!持ち主.検索語) throw new Error(`${seedId}: マイデッキの持ち主にプレイヤー検索の語が無い（会員の指定に「識別」が要る）`);
  return 管理画面(browser, (page) => ユーザーデッキを登録する(page, {
    デッキ名: v.デッキ名, フォーマット: 形式(v.形式), アーキタイプ: アーキタイプ名(v.形式), 検索語: 持ち主.検索語, 選手ID: 持ち主.選手ID,
    メイン: v.メイン ?? `1 ${札("Island")}`, サイド: v.サイド, 統率: v.統率,
  }, (m) => reportSeedIssue(seedId, m)));
}

/** カード一覧で、正本の名前のカードが無いことを確かめる（あれば止める。共有のマスタを消さない） */
async function カードが無いことを確かめる(browser: Browser, seedId: string, 名: string): Promise<void> {
  const have = await 管理画面(browser, (page) => カードを名前で探す(page, 名));
  if (have.length) throw new Error(`${seedId}: カード一覧に「${名}」のカードがある（カードID ${have.join("、")}）。シード表は「あれば削除する」と定めるが、共有のマスタを消さないため止めた（判断待ち）`);
  reportSeedIssue(seedId, `カード一覧で「${名}」を検索し、同じ名前のカードが無いことを確かめた（削除はしていない）`);
}

const 共通 = ["S-F06-16-REF"];
const 三つ: 形式キー[] = ["Standard", "Modern", "Legacy"];
const 二つ: 形式キー[] = ["Standard", "Modern"];
const 二つの大会 = (n: string): 大会指定 => ({ 名: `F06-16結合大会-${n}`, 形式: 二つ });
const 標準会員 = (n: string): 会員指定 => ({ 前半: `f0616-${n}`, 英姓: "YAMADA", 英名: "TARO" });

type ケース = {
  会員?: 会員指定 | null; 大会?: 大会指定 | null;
  あと?: (ctx: { browser: Browser; notes: Notes; seedId: string; 会員?: 作った会員; 大会?: 作った大会 }) => Promise<void>;
};

/** 会員1人・大会1つのケース専用のシード（n はケース番号。呼び名の末尾） */
function defineCaseSeed(seedId: string, n: string, c: ケース = {}): void {
  defineSeed(seedId, { needs: 共通 }, async ({ browser, notes }) => {
    const m = c.会員 === null ? undefined : await 会員を作る(browser, notes, seedId, n, c.会員 ?? 標準会員(n), { 会員ID: `〔会員ID-F0616-${n}〕`, 選手ID: `〔選手ID-F0616-${n}〕` });
    const e = c.大会 === null ? undefined : await 大会を作る(browser, notes, seedId, n, n, c.大会 ?? { 名: `F06-16結合大会-${n}`, 形式: 三つ });
    if (c.あと) await c.あと({ browser, notes, seedId, 会員: m, 大会: e });
  });
}

/** 統率領域のカードと島のカード（Commander で使用可） */
async function 統率のカードを作る(browser: Browser, notes: Notes, seedId: string, defs: { 呼び名: string; c: カード定義 }[]): Promise<void> {
  await 管理画面(browser, async (page) => {
    for (const d of defs) notes.set(d.呼び名, await カードを用意する(page, seedId, d.c));
  });
}

// ---- 組合せ（会員の氏名・英字の姓名・住所地の組合せ）。パスワードはシード表の値 ----
const CB = (n: string, x: Partial<会員指定> = {}): 会員指定 => ({ 前半: `cbf0616-${n}`, パスワード: `Passw0rd-CBF0616${n}`, 英姓: "YAMADA", 英名: "TARO", ...x });
const 組合せ大会 = (n: string, 形式一覧: 形式キー[] = 二つ): 大会指定 => ({ 名: `F06-16組合せ大会-${n}`, 形式: 形式一覧 });
/** 統率者のマイデッキ（074・075） */
function 統率者デッキ(n: "074" | "075", 形式一覧: 形式キー[]): ケース {
  return {
    会員: CB(n, { 識別: n }), 大会: 組合せ大会(n, 形式一覧),
    あと: async ({ browser, notes, seedId: id, 会員: m }) => {
      await 統率のカードを作る(browser, notes, id, [
        { 呼び名: `〔カードID-F0616-${n}A〕`, c: { 日: 札(`統率者-F0616-CB${n}`), 英: 札(`F0616-${n} Commander`), 使用可: ["Commander"] } },
        { 呼び名: `〔カードID-F0616-${n}B〕`, c: { 日: 札(`島-F0616-CB${n}`), 英: 札(`F0616-${n} Island`), 使用可: ["Commander"] } },
      ]);
      notes.set(`〔マイデッキID-F0616-${n}〕`, await マイデッキを作る(browser, id, m!, {
        デッキ名: `F0616-CB${n}-Commander`, 形式: "Commander", 統率: `1 ${札(`統率者-F0616-CB${n}`)}`, メイン: `4 ${札(`島-F0616-CB${n}`)}`,
      }));
    },
  };
}

// ---------------------------------------------------------------------------
// 依頼者方針 2026-11-10（テストデータは画面で作る。画面で作れない部分は、実行の印つきのデータに限り DB へ書く）で足したシード
//
// 読み替え:
// - 大会デッキのカード情報（シード表の固定の番号 61651xxxxx など）: 内容テキストのカード名（Old Standard Main など）は現行カード情報に無く、
//   画面から提出してもカード情報は作られない。カード情報が確かめに要るケース（026・027・034・035・051・065〜068・071）だけ、
//   画面で提出した大会デッキに、DBでカード情報を足す（db/f06_16_write.ts）。カード情報の番号は DB が振る（シード表の固定の番号にはしない）。
//   足すカードは「Old …」という名前のカードが無いので、REF が作った印つきのカード（Standard は Alpha Wolf、Modern は Alpha Strike）を指す
//   （旧カード情報であることだけが要る。ケースは旧カードの名前を確かめない）。
//   表示だけを確かめるケース（001・009・018）・入力の差し戻しだけのケース（030・032・050）は、カード情報を足さない。
// - マイデッキの作成日・更新日（015）: DBで設定した。
// - 会員に紐づく選手情報なし（037）: 会員登録と同時に作られる選手情報の、会員との紐づけだけをDBで外した（行は削除しない）。
// - 001 は、マイイベント・デッキ登録画面に大会が並ぶよう、管理画面のイベント申込登録で会員の申込を足した（シード表に無い）。
// - 048・049 のメール受信サービス停止（S-F06-16-MAIL）: 開発環境にはメールの受け口が無い（依頼者 2026-11-10）ので、止める操作はせず、
//   その状態をそのまま使う。
// ---------------------------------------------------------------------------

type 提出 = { 形式: 形式キー; 呼び名: string; メイン: string; サイド: string; カード?: boolean };
const 旧Standard = (呼び名: string, カード = false): 提出 => ({ 形式: "Standard", 呼び名, メイン: "1 Old Standard Main", サイド: "1 Old Standard Side", カード });
const 旧Modern = (呼び名: string, カード = false): 提出 => ({ 形式: "Modern", 呼び名, メイン: "2 Old Modern Main", サイド: "1 Old Modern Side", カード });

/** 旧カード情報（カード名は REF が作った印つきのカード） */
function 旧カード一覧(形: 形式キー): 旧カード[] {
  return 形 === "Modern"
    ? [{ ボード: "メイン", 枚数: 2, カード名英: 札("Alpha Strike") }, { ボード: "サイド", 枚数: 1, カード名英: 札("Alpha Strike") }]
    : [{ ボード: "メイン", 枚数: 1, カード名英: 札("Alpha Wolf") }, { ボード: "サイド", 枚数: 1, カード名英: 札("Alpha Wolf") }];
}

/** 大会デッキを会員の画面で提出し、デッキIDを控える。カードがあれば、カード情報をDBで足す */
async function 旧デッキを用意する(browser: Browser, notes: Notes, seedId: string, m: 作った会員, e: 作った大会, 一覧: 提出[]): Promise<void> {
  for (const x of 一覧) {
    const id = await 大会デッキを提出する(browser, seedId, m, e, 形式(x.形式), x.メイン, x.サイド);
    notes.set(x.呼び名, id);
    if (x.カード) {
      if (!available) throw new Error(`${seedId}: カード情報はDBへ足す。この環境はDBへ接続できない`);
      旧カード情報を足す(id, 旧カード一覧(x.形式));
      reportSeedIssue(seedId, `DBで大会デッキ ${id}（${x.形式}）にカード情報（メイン・サイド各1件）を足した（内容テキストのカード名が現行カード情報に無く、画面ではカード情報が作られないため）`);
    }
  }
}

/** 管理画面のイベント申込登録で、会員の申込を足す（マイイベント・デッキ登録画面に大会を並べる） */
async function 申込を足す(browser: Browser, seedId: string, m: 作った会員, e: 作った大会): Promise<void> {
  if (!m.検索語) throw new Error(`${seedId}: 申込のプレイヤー検索の語が無い（会員の指定に「識別」が要る）`);
  await 管理画面(browser, (page) => 申込を登録する(page, e.イベント詳細ID, m.検索語, m.選手ID, `申込（${e.名}）の登録`), F0616_ADMIN);
  reportSeedIssue(seedId, "マイイベント・デッキ登録画面に大会が並ぶよう、管理画面のイベント申込登録で会員の申込を足した（シード表に無い）");
}

defineSeed("S-F06-16-MAIL", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "メール受信サービスの停止はしない。開発環境にはメールの受け口が無い（依頼者 2026-11-10）ので、メールが送れない状態をそのまま使った");
});

// ---- 大会デッキのある結合ケース ----
defineCaseSeed("S-F06-16-CASE-001", "001", { 会員: { ...標準会員("001"), 識別: "001" },
  あと: async ({ browser, notes, seedId, 会員: m, 大会: e }) => {
    await 旧デッキを用意する(browser, notes, seedId, m!, e!, [旧Standard("〔大会デッキID-F0616-001〕")]);
    await 申込を足す(browser, seedId, m!, e!);
  },
});
defineCaseSeed("S-F06-16-CASE-009", "009", {
  あと: ({ browser, notes, seedId, 会員: m, 大会: e }) => 旧デッキを用意する(browser, notes, seedId, m!, e!, [旧Standard("〔大会デッキID-F0616-009A〕"), 旧Modern("〔大会デッキID-F0616-009B〕")]),
});
defineCaseSeed("S-F06-16-CASE-018", "018", { 会員: { ...標準会員("018"), 識別: "018" }, 大会: 二つの大会("018"),
  あと: async ({ browser, notes, seedId, 会員: m, 大会: e }) => {
    await 旧デッキを用意する(browser, notes, seedId, m!, e!, [旧Standard("〔大会デッキID-F0616-018A〕"), 旧Modern("〔大会デッキID-F0616-018B〕")]);
    notes.set("〔マイデッキID-F0616-018〕", await マイデッキを作る(browser, seedId, m!, {
      デッキ名: "Own Modern", 形式: "Modern", メイン: `3 ${札("Alpha Strike")}`, サイド: `2 ${札("Negate")}`,
    }));
  },
});
defineCaseSeed("S-F06-16-CASE-026", "026", { 大会: 二つの大会("026"),
  あと: ({ browser, notes, seedId, 会員: m, 大会: e }) => 旧デッキを用意する(browser, notes, seedId, m!, e!, [旧Standard("〔大会デッキID-F0616-026A〕", true), 旧Modern("〔大会デッキID-F0616-026B〕", true)]),
});
defineCaseSeed("S-F06-16-CASE-027", "027", { 大会: 二つの大会("027"),
  あと: ({ browser, notes, seedId, 会員: m, 大会: e }) => 旧デッキを用意する(browser, notes, seedId, m!, e!, [旧Standard("〔大会デッキID-F0616-027〕", true)]),
});
for (const [n, カード] of [["030", false], ["032", false], ["034", true], ["035", true], ["050", false], ["051", true]] as const) {
  defineCaseSeed(`S-F06-16-CASE-${n}`, n, { 大会: 二つの大会(n),
    あと: ({ browser, notes, seedId, 会員: m, 大会: e }) => 旧デッキを用意する(browser, notes, seedId, m!, e!, [旧Standard(`〔大会デッキID-F0616-${n}〕`, カード)]),
  });
}

defineCaseSeed("S-F06-16-CASE-037", "037", { 会員: { 前半: "f0616-037" }, 大会: { 名: "F06-16結合大会-037", 形式: 三つ },
  あと: async ({ seedId, 会員: m }) => {
    if (!available) throw new Error(`${seedId}: 選手情報の紐づけはDBで外す。この環境はDBへ接続できない`);
    選手情報を会員から外す(m!.会員ID);
    reportSeedIssue(seedId, "DBで、会員に紐づく選手情報の紐づけを外した（会員登録と同時に作られる選手情報は画面から外せないため。選手情報の行は削除していない）。MTG Companion登録本名(英語)は姓・名とも空のまま");
  },
});

defineCaseSeed("S-F06-16-CASE-048", "048", { 大会: 二つの大会("048") });
defineCaseSeed("S-F06-16-CASE-049", "049", { 大会: 二つの大会("049") });

// ---- マイデッキの一覧（作成日・更新日をDBで設定） ----
defineSeed("S-F06-16-CASE-015", { needs: 共通 }, async ({ browser, notes }) => {
  const seedId = "S-F06-16-CASE-015";
  const a = await 会員を作る(browser, notes, seedId, "015A", { ...標準会員("015"), 識別: "015A" }, { 会員ID: "〔会員ID-F0616-015A〕", 選手ID: "〔選手ID-F0616-015A〕" });
  await 大会を作る(browser, notes, seedId, "015", "015", { 名: "F06-16結合大会-015", 形式: 二つ });
  const b = await 会員を作る(browser, notes, seedId, "015B", { 前半: "f0616-015-other", 姓: "他", 名: "次郎", セイ: "ホカ", メイ: "ジロウ", 英姓: "OTHER", 英名: "JIRO", 識別: "015B" }, { 会員ID: "〔会員ID-F0616-015B〕", 選手ID: "〔選手ID-F0616-015B〕" });
  const 作る: [string, 作った会員, string, 形式キー, string, { 作成: string; 更新?: string }][] = [
    ["〔マイデッキID-F0616-015A〕", a, "Own New", "Standard", `1 ${札("Island")}`, { 作成: "2026-08-03 10:00", 更新: "2026-08-03 11:00" }],
    ["〔マイデッキID-F0616-015B〕", a, "Own Modern", "Modern", `1 ${札("Negate")}`, { 作成: "2026-08-02 10:00", 更新: "2026-08-02 11:00" }],
    ["〔マイデッキID-F0616-015C〕", a, "Own Old", "Standard", `1 ${札("Island")}`, { 作成: "2026-08-01 10:00", 更新: "2026-08-01 11:00" }],
    ["〔マイデッキID-F0616-015D〕", b, "Other Deck", "Standard", `1 ${札("Island")}`, { 作成: "2026-08-04 10:00" }],
  ];
  if (!available) throw new Error(`${seedId}: マイデッキの作成日・更新日はDBで設定する。この環境はDBへ接続できない`);
  for (const [呼び名, 持ち主, 名, 形, メイン, 日時] of 作る) {
    const id = await マイデッキを作る(browser, seedId, 持ち主, { デッキ名: 名, 形式: 形, メイン });
    notes.set(呼び名, id);
    マイデッキの日時を設定する(id, 日時);
  }
  reportSeedIssue(seedId, "マイデッキの作成日・更新日（Own New=2026-08-03 10:00・11:00、Own Modern=08-02、Own Old=08-01、Other Deckの作成日=08-04 10:00）は画面で指定できないので、DBで設定した。Modern のマイデッキのメインは、Modern で使える Negate にした（任意の1行）");
});

// ---- 組合せ（会員の氏名・英字の姓名・住所地）で、既存デッキを更新する ----
const CBデッキ = (n: string, カード名を確かめる: boolean): ケース["あと"] => async ({ browser, notes, seedId, 会員: m, 大会: e }) => {
  if (カード名を確かめる) await カードが無いことを確かめる(browser, seedId, "Unknown Card");
  await 旧デッキを用意する(browser, notes, seedId, m!, e!, [旧Standard(`〔大会デッキID-F0616-${n}〕`, true)]);
};
defineCaseSeed("S-F06-16-CBEXOVRUNM-065", "065", { 会員: CB("065"), 大会: 組合せ大会("065"), あと: CBデッキ("065", true) });
defineCaseSeed("S-F06-16-CBEXFAMUNM-066", "066", { 会員: CB("066", { 姓: "John", 名: "Smith", 海外: true, 英姓: undefined }), 大会: 組合せ大会("066"), あと: CBデッキ("066", true) });
defineCaseSeed("S-F06-16-CBEXGIVALL-067", "067", { 会員: CB("067", { 英名: undefined }), 大会: 組合せ大会("067"), あと: CBデッキ("067", false) });
defineCaseSeed("S-F06-16-CBEXBOTHUNM-068", "068", { 会員: CB("068", { 姓: "佐藤", 名: "花子", セイ: "サトウ", メイ: "ハナコ", 英姓: undefined, 英名: undefined }), 大会: 組合せ大会("068"), あと: CBデッキ("068", true) });
defineCaseSeed("S-F06-16-CBEXOVRALL-071", "071", { 会員: CB("071", { 姓: "John", 名: "Smith", 海外: true }), 大会: 組合せ大会("071"), あと: CBデッキ("071", false) });
