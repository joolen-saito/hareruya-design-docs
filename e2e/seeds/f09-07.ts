/**
 * F09-07 デッキリスト書き出し のシードの作り方（画面操作）。正本: cases/F09-07_seed_data.tsv
 *
 * - 操作する管理者: 全権限の管理者（SETUP_ADMIN）。フォーマット・アーキタイプ・デッキ・カードは店舗に属さないので、
 *   編集可能店舗を持たない全権限の管理者で足りる（F09-01・F09-02 と同じ）。
 * - 決め打ちの識別の値（フォーマット名・アーキタイプ名・カード名・会員のメールアドレス）は、「F0907-001」のような
 *   ケースの前半に実行の印を付けて作る（例: F0907-001-ALPHA → F0907-001-<印>-ALPHA）。カード名はデッキのカードの欄の
 *   英語名の照合に使われるので、前の実行の残りに当たらないようにするため。ケースの期待結果の行も同じ印つきの値で読む。
 *   アーキタイプの英語名に空白を含む 008（「F0907-008 F0907-008-ARC」）は、空白で区切った両方の「F0907-008」に印を付ける
 *   （空白は残るので、ファイル名の空白の置き換えは確かめられる）。
 * - フォーマットは毎回新しく登録する（印つきの名前）。フォーマットコードは10文字以内の規則に合わせ、名前から作る（F09-01 の部品）。
 * - 「登録済みの任意のフォーマット」は、このファイルが作る「F0907-FMT-ARENA」を使う。「登録済みの任意のアーキタイプ」（002・023）は、
 *   書き出しの入口を控えるデッキ（S-F09-07-REFDECK）のアーキタイプ「F0907-REF-ARC」を使う。
 * - 大会デッキの「必須の表示が出るイベント名(日)・イベント名(英)・開催日」の任意の値: イベント名(日)「<ケースの前半>-大会」・
 *   (英)「<ケースの前半>-Event」・開催日は実施日の 12:00。シード表がこの3つに触れない大会デッキ（002・003・006・023・026）にも
 *   同じ値を入れる（入れても書き出しの内容に関わらない）。ユーザーデッキ（005・024）には入れない。
 * - カードはカード詳細(登録)画面で、カード名(英)・(日)・点数で見たマナ・コスト 0・アリーナカード名(英)（シード表にあるときだけ）を
 *   入れて登録する。詳細情報は追加しない（シード表は詳細情報に触れない。F09-01・F09-02 と同じ）。
 * - 会員（020・037）: フロントの新規会員登録で作り、本登録のメールのURLを開いて本会員にする（依頼者決定 2026-10-31。
 *   front/member_entry.ts）。シード表の「会員管理の会員編集画面で会員種別を本会員にして登録」は、本登録で本会員になるため、
 *   会員一覧でその会員が本会員であることを確かめる形で代える。
 * - シード表の「登録後、このデッキをデッキビルダーで編集しない」は、何もしないことで守る（デッキビルダーを開かない）。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { reportSeedIssue, SeedBuilder } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { rc } from "../lib/run_marker";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { customerStateByEmail } from "../pages/admin/customer";
import { 採用カードを他の配置にする } from "../db/f09_07";
import { アーキタイプを登録する, 日付, 表示日付 } from "../pages/admin/f09_01_setup";
import { デッキIDで検索する, デッキを削除する, フォーマットを用意する } from "../pages/admin/f09_07_setup";
import { findFormatId } from "../pages/admin/m12_09_used_card";
import { カードを登録する } from "../pages/admin/m14_card";
import { デッキを登録する } from "../pages/admin/m15_05_deck_edit";
import { 一時保存の札, 一時保存を作る } from "../pages/front/f09_07_deck_builder_api";
import { registerFrontMember } from "../pages/front/member_entry";

/** 正本の値「F0907-<ケース>-<名>」を、実行の印つきの値にする（印はケースの前半に付ける） */
export const N = (ケース: string, 名: string) => `${rc(`F0907-${ケース}`)}-${名}`;
/** フォーマット名（実行の印つき） */
export const 形式名 = (k: "ARENA" | "NOARENA") => rc(`F0907-FMT-${k}`);
/** 008 のアーキタイプの英語名「F0907-008 F0907-008-ARC」（実行の印つき） */
export const アーキタイプ名008 = () => `${rc("F0907-008")} ${N("008", "ARC")}`;

/** 会員の共通パスワード（シード表 S-F09-07-COMMON） */
export const 会員のパスワード = "Passw0rd!F0907";
/** 会員のログインID（メールアドレス）。正本の「f0907-020@example.test」の前半に実行の印を付ける */
export const 会員のメール = (前半: string) => `${rc(前半)}@example.test`.toLowerCase();

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

/** "他" は、メイン・サイド・統率者以外の配置（画面では指定できないので、メインで登録してからDBで配置を変える） */
type 区画 = "統率" | "メイン" | "サイド" | "他";
type 札 = {
  区画: 区画; 枚数: number;
  /** カード名(英)の後半（例: ALPHA） */
  英: string;
  /** カード名(日)（印つきの値）。省略は「<ケースの前半>-<英>JP」 */
  日?: string;
  /** カード名(英)の全体（印つきの値）。省略は「<ケースの前半>-<英>」。名前に「/」を含むカードなど */
  英名?: string;
  /** アリーナカード名(英)の後半（例: ALPHA-ARENA）。省略は空のまま */
  アリーナ英?: string;
};
type 計画 = {
  ケース: string;
  種別?: "event" | "user";
  公開状態?: "公開" | "非公開" | "限定公開";
  リスト非公開?: boolean;
  形式?: "ARENA" | "NOARENA";
  /** アーキタイプの英語名（印つきの値）。省略は「<ケースの前半>-ARC」 */
  アーキタイプ?: string;
  札: 札[];
  /** 会員（ログインIDの前半・お名前の姓） */
  会員?: { 前半: string; 姓: string };
  /** デッキの持ち主にするプレイヤーを、プレイヤー検索でこの語（会員の姓）で探して選ぶ */
  プレイヤー検索?: string;
};

/** カード詳細(登録)画面でカードを登録する */
async function カードを作る(page: Page, seedId: string, ケース: string, c: 札): Promise<string> {
  return カードを登録する(page, {
    カード名英: c.英名 ?? N(ケース, c.英), カード名日: c.日 ?? N(ケース, `${c.英}JP`), アリーナ名英: c.アリーナ英 ? N(ケース, c.アリーナ英) : undefined,
    点数で見たマナ: "0", 詳細: false,
  }, `${seedId} のカード「${N(ケース, c.英)}」`, (m) => reportSeedIssue(seedId, m));
}

/** デッキ新規登録で登録し、デッキIDを返す */
async function デッキを作る(page: Page, seedId: string, p: Omit<計画, "札"> & { 札: 札[]; アーキタイプ: string }): Promise<string> {
  const 大会 = (p.種別 ?? "event") === "event";
  const 欄 = (k: 区画) => p.札.filter((c) => (k === "メイン" ? c.区画 === "メイン" || c.区画 === "他" : c.区画 === k)).map((c) => `${c.枚数} ${N(p.ケース, c.英)}`).join("\n");
  return デッキを登録する(page, {
    デッキ種別: p.種別 ?? "event", 公開状態: p.公開状態 ?? "公開", デッキリスト非公開: p.リスト非公開 ?? false,
    フォーマット: 形式名(p.形式 ?? "ARENA"), アーキタイプ: p.アーキタイプ,
    ...(大会 ? { イベント名日: N(p.ケース, "大会"), イベント名英: N(p.ケース, "Event"), 開催日: `${表示日付(日付(0))} 12:00` } : {}),
    統率: 欄("統率"), メイン: 欄("メイン"), サイド: 欄("サイド"),
    ...(p.プレイヤー検索 ? { プレイヤー検索: p.プレイヤー検索 } : {}),
  }, (m) => reportSeedIssue(seedId, m));
}

/** フロントの新規会員登録で会員を作り、会員一覧で本会員であることを確かめる */
async function 会員を作る(browser: Browser, seedId: string, m: { 前半: string; 姓: string }): Promise<void> {
  const メール = 会員のメール(m.前半);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await registerFrontMember(page, { 姓: m.姓, 名: "会員", セイ: "シケン", メイ: "カイイン", メール, パスワード: 会員のパスワード });
  } finally { await context.close(); }
  const 状態 = await 管理画面(browser, (page) => customerStateByEmail(page, メール));
  if (状態 !== "本会員") throw new Error(`${seedId}: 会員 ${メール} が会員一覧で本会員になっていない（${状態 ?? "見つからない"}）`);
  reportSeedIssue(seedId, `会員 ${メール} はフロントの本登録で本会員になったため、会員一覧で本会員であることを確かめた（会員編集画面での会員種別の変更は行っていない）`);
}

function definePlanSeed(seedId: string, p: 計画, needs: string[] = ["S-F09-07-FMT-ARENA"]): void {
  defineSeed(seedId, { needs: [...needs, ...(p.会員 ? ["S-F09-07-COMMON"] : [])] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const アーキタイプ = p.アーキタイプ ?? N(p.ケース, "ARC");
    const id = await 管理画面(browser, async (page) => {
      for (const c of p.札) await カードを作る(page, seedId, p.ケース, c);
      await アーキタイプを登録する(page, { 名: アーキタイプ, フォーマット: 形式名(p.形式 ?? "ARENA") }, issue);
      return デッキを作る(page, seedId, { ...p, アーキタイプ });
    });
    notes.set(`〔デッキID-F0907-${p.ケース}〕`, id);
    for (const c of p.札.filter((x) => x.区画 === "他")) {
      採用カードを他の配置にする(id, c.英名 ?? N(p.ケース, c.英));
      issue(`DBで、デッキ（ID ${id}）の採用カード「${c.英名 ?? N(p.ケース, c.英)}」の配置を、メインボード・サイドボード・統率者以外の配置に設定した（画面から指定できない配置のため。実行の印つきのカードだけ）`);
    }
    if (p.会員) await 会員を作る(browser, seedId, p.会員);
  });
}

/**
 * デッキビルダーの一時保存（デッキIDを鍵にしたキャッシュ）に、デッキのデッキリストが保存済みのデッキ。
 * 会員（フロントの新規会員登録）→ 採用カードとキャッシュのカード（カード詳細(登録)）→ アーキタイプ → デッキ（持ち主を会員のプレイヤーにして登録）
 * の順に画面で作り、会員のメールアドレスとパスワードでデッキビルダーのAPIにログインして、デッキ情報更新のAPIで一時保存を作る
 * （画面の外からのAPI呼び出しは、実行の印つきの会員・デッキに限る）。一時保存の保持時間は30分なので、作ったらすぐ書き出しを確かめる。
 */
function defineCacheSeed(seedId: string, ケース: string, 採用: 札[], キャッシュ: 札[]): void {
  defineSeed(seedId, { needs: ["S-F09-07-FMT-ARENA", "S-F09-07-COMMON"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 会員 = { 前半: `f0907-c${ケース}`, 姓: rc(`F0907-C${ケース}`) };
    await 会員を作る(browser, seedId, 会員);
    const アーキタイプ = N(ケース, "ARC");
    const r = await 管理画面(browser, async (page) => {
      for (const c of 採用) await カードを作る(page, seedId, ケース, c);
      const カードID: string[] = [];
      for (const c of キャッシュ) カードID.push(await カードを作る(page, seedId, ケース, c));
      const フォーマットID = await findFormatId(page, 形式名("ARENA"));
      if (!フォーマットID) throw new Error(`${seedId}: フォーマット「${形式名("ARENA")}」が見つからない`);
      const アーキタイプID = await アーキタイプを登録する(page, { 名: アーキタイプ, フォーマット: 形式名("ARENA") }, issue);
      const デッキID = await デッキを作る(page, seedId, { ケース, 札: 採用, アーキタイプ, プレイヤー検索: 会員.姓 });
      return { カードID, フォーマットID, アーキタイプID, デッキID };
    });
    const 札一覧: 一時保存の札[] = キャッシュ.map((c, i) => ({ カードID: r.カードID[i], ボード: c.区画 as "統率" | "メイン" | "サイド", 枚数: c.枚数 }));
    await 一時保存を作る({ メール: 会員のメール(会員.前半), パスワード: 会員のパスワード, デッキID: r.デッキID, フォーマットID: r.フォーマットID, アーキタイプID: r.アーキタイプID, 札: 札一覧 });
    notes.set(`〔デッキID-F0907-${ケース}〕`, r.デッキID);
    issue(`デッキ（ID ${r.デッキID}）の持ち主を会員 ${会員のメール(会員.前半)} のプレイヤーにして登録し、その会員でデッキビルダーのAPIにログインして、デッキ情報の更新（即時保存にしない）で一時保存（デッキIDを鍵にしたキャッシュ）を作った。キャッシュの保持時間は30分`);
  });
}

const 札 = (区画: 区画, 枚数: number, 英: string, x: Partial<札> = {}): 札 => ({ 区画, 枚数, 英, ...x });
const メイン4 = (x: Partial<札> = {}) => [札("メイン", 4, "ALPHA", x)];

// ---------------------------------------------------------------------------
// 共有（共通設定・フォーマット・入口を控えるデッキ）
// ---------------------------------------------------------------------------

defineSeed("S-F09-07-COMMON", async () => {
  // 会員の共通パスワードの取り決めだけで、画面で作るものは無い（会員を作るシードがこのパスワードで登録する）
  reportSeedIssue("S-F09-07-COMMON", `会員の共通パスワードは「${会員のパスワード}」。会員を作るシード（020・037）がこのパスワードで登録する`);
});

defineSeed("S-F09-07-FMT-ARENA", async ({ browser }) => {
  const seedId = "S-F09-07-FMT-ARENA";
  await 管理画面(browser, (page) => フォーマットを用意する(page, { 名: 形式名("ARENA"), 並び順: "9999", メタ日数: "30", アリーナ導入済: true }, (m) => reportSeedIssue(seedId, m)));
});

defineSeed("S-F09-07-FMT-NOARENA", async ({ browser }) => {
  const seedId = "S-F09-07-FMT-NOARENA";
  await 管理画面(browser, (page) => フォーマットを用意する(page, { 名: 形式名("NOARENA"), 並び順: "9999", メタ日数: "30", アリーナ導入済: false }, (m) => reportSeedIssue(seedId, m)));
});

defineSeed("S-F09-07-REFDECK", { needs: ["S-F09-07-FMT-ARENA"] }, async ({ browser, notes }) => {
  const seedId = "S-F09-07-REFDECK";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  // 共有可。デッキIDは画面が振るので、1回の実行（プロセス）で1度だけ作り、控えた番号を持ち回す（lib/seeds）。
  // カード名・アーキタイプ名に実行の印が付くので、前の実行の残りは使わない（あれば使う、の対象が無い）
  const id = await 管理画面(browser, async (page) => {
    const c = 札("メイン", 4, "ALPHA");
    await カードを作る(page, seedId, "REF", c);
    await アーキタイプを登録する(page, { 名: N("REF", "ARC"), フォーマット: 形式名("ARENA") }, issue);
    return デッキを作る(page, seedId, { ケース: "REF", 札: [c], アーキタイプ: N("REF", "ARC") });
  });
  notes.set("〔デッキID-F0907-共有〕", id);
});

// ---------------------------------------------------------------------------
// ファイルとして受け取る経路（Magic Online用テキスト）
// ---------------------------------------------------------------------------

definePlanSeed("S-F09-07-FEMPTY-001", { ケース: "001", 札: メイン4() });

/** 002・023: デッキを登録してデッキIDを控え、削除して、デッキIDで検索して該当が無いことを確かめる */
function 不存在のシード(seedId: string, ケース: string): SeedBuilder {
  return async ({ browser, notes }) => {
    const id = await 管理画面(browser, async (page) => {
      const id = await デッキを作る(page, seedId, { ケース, 公開状態: "非公開", 札: [], アーキタイプ: N("REF", "ARC") });
      await デッキを削除する(page, id);
      const hit = await デッキIDで検索する(page, id);
      if (hit.length !== 0) throw new Error(`${seedId}: 削除したデッキ（ID ${id}）が、デッキIDで検索すると出る（${hit.join("、")}）`);
      return id;
    });
    notes.set(`〔デッキID-F0907-${ケース}〕`, id);
    reportSeedIssue(seedId, `デッキ（ID ${id}）を登録して削除し、デッキ一覧をデッキIDで検索して該当が無いことを確かめた。アーキタイプは登録済みの「${N("REF", "ARC")}」を選んだ`);
  };
}
defineSeed("S-F09-07-FNOTFOUND-002", { needs: ["S-F09-07-REFDECK"] }, 不存在のシード("S-F09-07-FNOTFOUND-002", "002"));

definePlanSeed("S-F09-07-FDISPPRIVATE-003", { ケース: "003", 公開状態: "非公開", 札: メイン4() });
definePlanSeed("S-F09-07-FLISTPRIVATE-004", { ケース: "004", リスト非公開: true, 札: メイン4() });
definePlanSeed("S-F09-07-FUSERDECK-005", { ケース: "005", 種別: "user", 札: メイン4() });
definePlanSeed("S-F09-07-FLIMITED-006", { ケース: "006", 公開状態: "限定公開", 札: メイン4() });
definePlanSeed("S-F09-07-FRESP-007", { ケース: "007", 札: メイン4() });
definePlanSeed("S-F09-07-FNAME-008", { ケース: "008", アーキタイプ: アーキタイプ名008(), 札: メイン4() });
definePlanSeed("S-F09-07-FLINES-009", { ケース: "009", 札: [札("メイン", 4, "ALPHA"), 札("メイン", 2, "BETA")] });
definePlanSeed("S-F09-07-FNOHEAD-011", { ケース: "011", 札: [札("統率", 1, "COMMANDER"), 札("メイン", 4, "ALPHA")] });
definePlanSeed("S-F09-07-FORDER-012", { ケース: "012", 札: [札("メイン", 4, "ALPHA"), 札("統率", 1, "COMMANDER"), 札("サイド", 2, "BETA")] });
definePlanSeed("S-F09-07-FNOSIDE-017", { ケース: "017", 札: メイン4() });
definePlanSeed("S-F09-07-FZERO-019", { ケース: "019", 札: [] });
definePlanSeed("S-F09-07-FLOGIN-020", { ケース: "020", 札: メイン4(), 会員: { 前半: "f0907-020", 姓: "F0907-020" } });

// ---------------------------------------------------------------------------
// テキストとして受け取る経路（アリーナ形式のテキスト）
// ---------------------------------------------------------------------------

definePlanSeed("S-F09-07-TEMPTY-022", { ケース: "022", 札: メイン4() });
defineSeed("S-F09-07-TNOTFOUND-023", { needs: ["S-F09-07-REFDECK"] }, 不存在のシード("S-F09-07-TNOTFOUND-023", "023"));
definePlanSeed("S-F09-07-TUSERDECK-024", { ケース: "024", 種別: "user", 札: メイン4() });
definePlanSeed("S-F09-07-TRESP-025", { ケース: "025", 札: メイン4() });
definePlanSeed("S-F09-07-TDISPPRIVATE-026", { ケース: "026", 公開状態: "非公開", 札: メイン4() });
definePlanSeed("S-F09-07-TLISTPRIVATE-027", { ケース: "027", リスト非公開: true, 札: メイン4() });
definePlanSeed("S-F09-07-TENNAME-028", { ケース: "028", 札: メイン4({ アリーナ英: "ALPHA-ARENA" }) });
definePlanSeed("S-F09-07-TENHEAD-029", { ケース: "029", 札: [札("統率", 1, "COMMANDER"), 札("メイン", 4, "ALPHA"), 札("サイド", 2, "BETA")] });
definePlanSeed("S-F09-07-TJPNAME-030", { ケース: "030", 札: メイン4({ アリーナ英: "ALPHA-ARENA" }) });
definePlanSeed("S-F09-07-TJPHEAD-031", { ケース: "031", 札: [札("統率", 1, "COMMANDER"), 札("メイン", 4, "ALPHA"), 札("サイド", 2, "BETA")] });
definePlanSeed("S-F09-07-TNOCMD-032", { ケース: "032", 札: メイン4() });
definePlanSeed("S-F09-07-TZEROSTATUS-035", { ケース: "035", 札: [] });
definePlanSeed("S-F09-07-TZEROBODY-036", { ケース: "036", 札: [] });
definePlanSeed("S-F09-07-TLOGIN-037", { ケース: "037", 札: メイン4(), 会員: { 前半: "f0907-039", 姓: "F0907-037" } });

// ---------------------------------------------------------------------------
// デッキリスト詳細の書き出しの入口
// ---------------------------------------------------------------------------

definePlanSeed("S-F09-07-EMTGO-040", { ケース: "040", 札: [札("メイン", 4, "ALPHA", { アリーナ英: "ALPHA-ARENA" }), 札("サイド", 2, "BETA")] });
definePlanSeed("S-F09-07-EARENA-041", { ケース: "041", 札: [札("統率", 1, "COMMANDER"), 札("メイン", 4, "ALPHA", { アリーナ英: "ALPHA-ARENA" })] });
definePlanSeed("S-F09-07-EJP-042", { ケース: "042", 札: [札("統率", 1, "COMMANDER"), 札("メイン", 4, "ALPHA", { アリーナ英: "ALPHA-ARENA" })] });
definePlanSeed("S-F09-07-EPRIVATE-045", { ケース: "045", リスト非公開: true, 札: メイン4({ アリーナ英: "ALPHA-ARENA" }) });
definePlanSeed("S-F09-07-ENOARENA-046", { ケース: "046", 形式: "NOARENA", 札: メイン4() }, ["S-F09-07-FMT-NOARENA"]);
definePlanSeed("S-F09-07-EJPLANG-047", { ケース: "047", 札: [札("統率", 1, "COMMANDER"), 札("メイン", 4, "ALPHA", { アリーナ英: "ALPHA-ARENA" })] });

// ---------------------------------------------------------------------------
// 要因の組合せ（一時保存の無いもの）
// ---------------------------------------------------------------------------

definePlanSeed("S-F09-07-CBFHDPOQ-050", { ケース: "050", 札: メイン4({ アリーナ英: "ALPHA-ARENA" }) });
definePlanSeed("S-F09-07-CBFNDPBQ-052", { ケース: "052", 札: [札("メイン", 4, "ALPHA"), 札("サイド", 2, "BETA")] });
definePlanSeed("S-F09-07-CBTHDSBQ-054", {
  ケース: "054",
  札: [札("メイン", 4, "ALPHA", { 日: `${N("054", "ALPHAJP")}/${N("054", "ALPHAXJP")}`, アリーナ英: "ALPHA-ARENA" }), 札("サイド", 2, "BETA", { アリーナ英: "BETA-ARENA" })],
});
definePlanSeed("S-F09-07-CBTNDPOQ-056", { ケース: "056", 札: メイン4() });
definePlanSeed("S-F09-07-CBTHDPBK-058", {
  ケース: "058",
  札: [札("統率", 1, "CMD", { アリーナ英: "CMD-ARENA" }), 札("メイン", 4, "ALPHA", { アリーナ英: "ALPHA-ARENA" }), 札("サイド", 2, "BETA", { アリーナ英: "BETA-ARENA" })],
});

// ---------------------------------------------------------------------------
// 追加の実装（2026-11-11）: DBで配置を設定するもの・DBで確かめるもの・デッキビルダーの一時保存があるもの
// ---------------------------------------------------------------------------

// 018・034: メイン・サイド・統率者以外の配置の採用カード（画面で登録したあと、DBで配置を変える）
definePlanSeed("S-F09-07-FOTHERBOARD-018", { ケース: "018", 札: [札("メイン", 4, "ALPHA"), 札("他", 3, "OTHER")] });
definePlanSeed("S-F09-07-TOTHERBOARD-034", { ケース: "034", 札: [札("メイン", 4, "ALPHA"), 札("他", 3, "OTHER")] });

// 021・038: 書き出しの要求でデータが変わらないことをDBで確かめる（登録後、デッキビルダーで編集しない）
definePlanSeed("S-F09-07-FNOUPDATE-021", { ケース: "021", 札: [札("メイン", 4, "ALPHA"), 札("サイド", 2, "BETA")] });
definePlanSeed("S-F09-07-TNOUPDATE-038", { ケース: "038", 札: [札("メイン", 4, "ALPHA"), 札("サイド", 2, "BETA")] });

// 一時保存（デッキIDを鍵にしたキャッシュ）があるデッキ。採用カードとキャッシュのカードは別のカード
defineCacheSeed("S-F09-07-TCACHE-039", "039", [札("メイン", 2, "ADOPTED")], [札("メイン", 3, "CACHED")]);
defineCacheSeed("S-F09-07-CBFHCPBQ-049", "049", [札("メイン", 2, "ADOPTED")], [
  札("メイン", 3, "CACHED", { アリーナ英: "CACHED-ARENA" }), 札("サイド", 2, "CSIDE", { アリーナ英: "CSIDE-ARENA" }),
]);
defineCacheSeed("S-F09-07-CBFNCPOQ-051", "051", [札("メイン", 2, "ADOPTED")], [札("メイン", 3, "CACHED")]);
defineCacheSeed("S-F09-07-CBTHCPOK-053", "053", [札("メイン", 2, "ADOPTED")], [
  札("統率", 1, "CCMD", { アリーナ英: "CCMD-ARENA" }), 札("メイン", 3, "CACHED", { アリーナ英: "CACHED-ARENA" }),
]);
defineCacheSeed("S-F09-07-CBTNCSBK-055", "055", [札("メイン", 2, "ADOPTED")], [
  札("統率", 1, "CCMD"),
  札("メイン", 3, "CACHED", { 英名: `${N("055", "CACHED")}/${N("055", "CACHEDX")}` }),
  札("サイド", 2, "CSIDE"),
]);
defineCacheSeed("S-F09-07-CBTHCPBQ-057", "057", [札("メイン", 2, "ADOPTED")], [
  札("メイン", 3, "CACHED", { アリーナ英: "CACHED-ARENA" }), 札("サイド", 2, "CSIDE", { アリーナ英: "CSIDE-ARENA" }),
]);
defineCacheSeed("S-F09-07-CBTHCSOK-059", "059", [札("メイン", 2, "ADOPTED")], [
  札("統率", 1, "CCMD", { アリーナ英: "CCMD-ARENA" }),
  札("メイン", 3, "CACHED", { 日: `${N("059", "CACHEDJP")}/${N("059", "CACHEDXJP")}`, アリーナ英: "CACHED-ARENA" }),
]);
