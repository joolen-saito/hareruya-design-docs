/**
 * F07-04 イベント申込（フロント）のシード（画面操作）。正本: cases/F07-04_seed_data.tsv
 *
 * 作り方は、シード表の投入方法のとおり。
 * - 会員は、フロントの新規会員登録で作る（本登録のメールは手元の受け口で読む）。メールアドレスの前半と氏名には実行の印を付ける（run_marker）。
 *   シード表のパスワード・氏名は「任意の値」なので、試験用の固定の値にした。
 * - 大会（イベント）と日程は、イベント登録画面と「日程追加」で登録する。大会名にも実行の印を付ける。
 *   開始時間は「現在より後の任意の日時」なので、実行日の30日後からにした。オンライン受付時間は、受付中＝実行日の2日前〜開始時間の前日、
 *   受付開始前＝実行日の10日後〜20日後、受付終了後＝実行日の5日前〜3日前。
 * - 選手IDは、イベント申込登録のプレイヤー検索の結果一覧のID列から控える。申込を登録するものは、登録後の画面の申込IDを控える。
 * - 申込選手ID・登録時履歴ID（画面に出ない番号）は、DB の参照（SELECT）で控える（依頼者決定 2026-11-03。M05-05 の前例）。
 * - 店舗は、編集できる任意の店舗（Hareruya）、フォーマットは「スタンダード」にした（シード表の「任意の値」。070〜073 の店舗ID 1・フォーマットID 1 の名前は、
 *   この環境の店舗ID 1 の店名と違うので代えた。ケースは店舗・フォーマットの値を確かめない）。
 * - 支払方法「クレジットカード」は、この環境の選択肢の名前「クレジットカード決済」にした（イベント登録画面にある唯一の支払方法）。
 */
import { Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 会員の選手ID, 申込の申込選手ID, 申込の登録時履歴ID } from "../db/f07_04";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { RUN_MARK } from "../lib/run_marker";
import { createMember } from "../pages/admin/member";
import { FormatPage } from "../pages/admin/f03_03_masters";
import { 試験店舗を登録する } from "../pages/admin/f07_01_setup";
import {
  デッキ登録締切を直す, フォーマットのランキング表示とイベントに表示を付ける, 会員を作る, 会員IDをメールから, 申込登録で選手を読む, 大会を登録する, 日程の設定, 試験会員, 大会,
} from "../pages/admin/f07_04_setup";

const 中 = (定員 = "10", 参加費 = "0"): 日程の設定 => ({ 受付: "中", 定員, 参加費 });
const label = (項目: string, 呼び名: string): string => `〔${項目}-F0704-${呼び名}〕`;

/** この実行で作った会員（ケースがログインに使う）。キーは「シード番号＋符号」（例: 003A、002） */
export const 会員一覧 = new Map<string, 試験会員>();
/** この実行で作った大会（ケースが開催日・イベント名を見る） */
export const 大会一覧 = new Map<string, 大会>();

type 会員の指定 = {
  /** 呼び名の末尾の符号（A・B・空） */
  符号: string; ベース: string;
  /** 選手IDを読む日程の番号 */
  日程: number;
  /** 申込を登録するときの、申込IDの呼び名（申込ID-F0704-<n><これ>）。書かなければ登録しない */
  申込符号?: string;
};
type 作り方 = {
  n: string; 大会名: string; チーム戦?: boolean; 支払方法?: string[]; 日程: 日程の設定[];
  /** 日程の番号順の、イベント詳細IDの呼び名の末尾（イベント詳細ID-F0704-<これ>） */
  日程の呼び名: string[]; 会員: 会員の指定[];
};

async function 作る(ctx: SeedCtx, p: 作り方): Promise<void> {
  const { browser, notes } = ctx;
  // 会員は、フロントの新規会員登録で作る（管理画面のセッションと別に）
  const 作った: (Omit<試験会員, "会員ID"> & { 指定: 会員の指定 })[] = [];
  for (const m of p.会員) 作った.push({ ...(await 会員を作る(browser, m.ベース, `S${p.n}${m.符号}`)), 指定: m });
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 会員たち: 試験会員[] = [];
    for (const m of 作った) {
      const 会員ID = await 会員IDをメールから(page, m.メール);
      const full: 試験会員 = { メール: m.メール, パスワード: m.パスワード, 姓: m.姓, 名: m.名, 氏名: m.氏名, 会員ID };
      会員たち.push(full);
      会員一覧.set(`${p.n}${m.指定.符号}`, full);
      notes.set(label("会員ID", `${p.n}${m.指定.符号}`), 会員ID);
    }
    const 大 = await 大会を登録する(page, { イベント名: rc(p.大会名), チーム戦: p.チーム戦, 支払方法: p.支払方法, 日程: p.日程 });
    大会一覧.set(p.n, 大);
    notes.set(label("大会ID", p.n), 大.イベントID);
    p.日程の呼び名.forEach((l, i) => notes.set(label("イベント詳細ID", l), 大.日程ID[i]));
    for (const [i, m] of 作った.entries()) {
      const r = await 申込登録で選手を読む(page, 大, m.指定.日程, m.氏名, m.指定.申込符号 !== undefined);
      const 呼び名 = `${p.n}${m.指定.符号}`;
      if (会員の選手ID(会員たち[i].会員ID) !== r.選手ID) throw new Error(`${呼び名}: プレイヤー検索で読んだ選手ID ${r.選手ID} が、会員の選手と違う`);
      notes.set(label("選手ID", 呼び名), r.選手ID);
      if (r.申込ID) 申込を控える(notes, `${p.n}${m.指定.申込符号}`, r.申込ID);
    }
  });
}

function 申込を控える(notes: Notes, 呼び名: string, 申込ID: string): void {
  notes.set(label("申込ID", 呼び名), 申込ID);
  // 画面に出ない番号は、DB の参照で控える
  notes.set(label("申込選手ID", 呼び名), 申込の申込選手ID(申込ID));
  notes.set(label("登録時履歴ID", 呼び名), 申込の登録時履歴ID(申込ID));
}

const A = (n: string, 日程 = 0): 会員の指定 => ({ 符号: "", ベース: `member-a-f0704-${n}`, 日程 });

/** 会員1人・日程1つ（定員10・参加費0円・受付中）。申込は登録しない */
function 単純(seedId: string, n: string, 大会名: string, チーム戦 = false): void {
  defineSeed(seedId, (ctx) => 作る(ctx, { n, 大会名, チーム戦, 日程: [中()], 日程の呼び名: [n], 会員: [A(n)] }));
}
単純("S-F07-04-CASE-002", "002", "大会B");
単純("S-F07-04-CASE-004", "004", "チーム戦大会", true);
単純("S-F07-04-CASE-005", "005", "チーム戦大会", true);
単純("S-F07-04-CASE-022", "022", "大会A");
単純("S-F07-04-CASE-025", "025", "大会B");
単純("S-F07-04-CASE-026", "026", "大会B");
単純("S-F07-04-CASE-027", "027", "大会B");
単純("S-F07-04-CASE-028", "028", "大会B");
単純("S-F07-04-CASE-029", "029", "大会B");
単純("S-F07-04-TOKEN-056", "056", "大会B");
単純("S-F07-04-TOKEN-057", "057", "大会B");
単純("S-F07-04-TOKEN-058", "058", "大会B");

defineSeed("S-F07-04-CASE-003", (ctx) => 作る(ctx, {
  n: "003", 大会名: "大会C",
  日程: [中(), 中(), { 受付: "前", 定員: "10", 参加費: "0" }, { 受付: "後", 定員: "10", 参加費: "0" }, 中("1"), 中()],
  日程の呼び名: ["003A", "003B", "003C", "003D", "003E", "003F"],
  // 会員A は日程C6 に申込、満席用会員は日程C5 に申込（定員1を埋める）
  会員: [{ 符号: "A", ベース: "member-a-f0704-003", 日程: 5, 申込符号: "B" }, { 符号: "B", ベース: "member-full-f0704-003", 日程: 4, 申込符号: "A" }],
}));

defineSeed("S-F07-04-CASE-019", (ctx) => 作る(ctx, {
  n: "019", 大会名: "大会D", 日程: [中()], 日程の呼び名: ["019"], 会員: [{ ...A("019"), 申込符号: "" }],
}));
defineSeed("S-F07-04-CASE-043", (ctx) => 作る(ctx, {
  n: "043", 大会名: "大会K", 日程: [中()], 日程の呼び名: ["043"], 会員: [{ ...A("043"), 申込符号: "" }],
}));

defineSeed("S-F07-04-CASE-024", (ctx) => 作る(ctx, {
  n: "024", 大会名: "大会C", 日程: [中(), 中("1")], 日程の呼び名: ["024A", "024B"],
  会員: [{ 符号: "A", ベース: "member-a-f0704-024", 日程: 0 }, { 符号: "B", ベース: "member-b-f0704-024", 日程: 1 }],
}));
for (const n of ["036", "037"]) {
  defineSeed(`S-F07-04-CASE-${n}`, (ctx) => 作る(ctx, {
    n, 大会名: "大会L", 日程: [中("1")], 日程の呼び名: [n],
    会員: [{ 符号: "A", ベース: `member-a-f0704-${n}`, 日程: 0 }, { 符号: "B", ベース: `member-b-f0704-${n}`, 日程: 0 }],
  }));
}
// 定員1・参加費1000円の日程。会員B の申込を登録済み（定員に達している）、会員A は申込なし
defineSeed("S-F07-04-CASE-054", (ctx) => 作る(ctx, {
  n: "054", 大会名: "大会F", 支払方法: ["クレジットカード決済"], 日程: [中("1", "1000")], 日程の呼び名: ["054"],
  会員: [{ 符号: "A", ベース: "member-a-f0704-054", 日程: 0 }, { 符号: "B", ベース: "member-b-f0704-054", 日程: 0, 申込符号: "" }],
}));
defineSeed("S-F07-04-FREEMULTI-063", (ctx) => 作る(ctx, {
  n: "063", 大会名: "大会H", 日程: [中(), 中()], 日程の呼び名: ["063A", "063B"], 会員: [A("063")],
}));
defineSeed("S-F07-04-JOINED-065", (ctx) => 作る(ctx, {
  n: "065", 大会名: "大会J", 日程: [中(), 中()], 日程の呼び名: ["065A", "065B"], 会員: [A("065")],
}));

// ---- 申込完了画面のデッキ登録ボタン（070〜073） ----
type デッキ設定 = { 締切: string; 終了する: boolean; 登録後の締切?: string };
function デッキ(seedId: string, n: string, 設定: デッキ設定 | null): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    // 会員は、お名前「試験 F0704-CBnnn」・メール cbf0704-nnn。実行の印を付ける
    const m = await 会員を作る(browser, `cbf0704-${n}`, `CB${n}`, { 姓: "試験", 名: rc(`F0704-CB${n}`) });
    会員一覧.set(n, { ...m, 会員ID: "" });
    await withAdminSession(browser, SETUP_ADMIN, async (page: Page) => {
      page.setDefaultTimeout(60_000);
      const 大 = await 大会を登録する(page, {
        イベント名: rc(`F0704-CB${n}-大会`),
        日程: [{ 受付: "中", 定員: "10", 参加費: "0", 固定の時間: { 開始: "2099-12-20 10:00", オンライン受付: { 開始: "2020-01-01 00:00", 終了: "2099-12-20 09:00" } }, ...(設定 ? { デッキ登録: { 締切: 設定.締切, 終了する: 設定.終了する } } : {}) }],
      });
      大会一覧.set(n, 大);
      if (設定?.登録後の締切) await デッキ登録締切を直す(page, 大.イベントID, 大.日程ID[0], 設定.登録後の締切);
      notes.set(label("イベントID", n), 大.イベントID);
      notes.set(label("イベント詳細ID", n), 大.日程ID[0]);
    });
  });
}
const 締切前 = "2099-12-19 23:59";
デッキ("S-F07-04-CBDECK-070", "070", { 締切: 締切前, 終了する: false });
デッキ("S-F07-04-CBDECK-071", "071", null);
デッキ("S-F07-04-CBDECK-072", "072", { 締切: 締切前, 終了する: true });
デッキ("S-F07-04-CBDECK-073", "073", { 締切: 締切前, 終了する: false, 登録後の締切: "2020-12-31 23:59" });

// ---- 管理画面のイベント申込一覧への連携（059〜062） ----
// 会員は、シード表は管理画面の会員登録だが、フロントの新規会員登録で作る（依頼者決定 2026-10-31）。メール・名には実行の印を付ける。
// 店舗・フォーマットは共有シード PE-REF が作る（名前に実行の印）。管理者のログインIDは英数字（実行の印つき）。
// イベント登録画面の「店舗」には編集できる店舗だけが並ぶので、大会と日程は、連携店を編集できる PE-REF の管理者で登録する。
export const 連携店名 = (): string => rc("連携店F07-04");
export const 連携形式名 = (): string => rc("連携形式F07-04");
export let PE管理者: Account = { loginId: "", password: "" };
const PE管理者のパスワード = "Passw0rd-PE";

defineSeed("S-F07-04-PE-REF", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔店舗ID-F0704-共有〕", await 試験店舗を登録する(page, 連携店名(), "pe0704", (m) => reportSeedIssue(seed.シードID, m)));
    const f = new FormatPage(page);
    await f.openNew();
    await f.fill({ 名称日: 連携形式名(), 名称英: `Link Format ${RUN_MARK}`, 並び順: "1" });
    await フォーマットのランキング表示とイベントに表示を付ける(page);
    notes.set("〔フォーマットID-F0704-共有〕", await f.register(`フォーマット「${連携形式名()}」の登録`));
    const loginId = `pef0704admin${RUN_MARK.toLowerCase()}`;
    const 入力 = { 名前: `PE管理者-${RUN_MARK}`, 所属店舗: 連携店名(), ログインID: loginId, メールアドレス: `${loginId}@example.test`, 権限: "システム管理者", デフォルト検索表示店舗: 連携店名(), 編集可能店舗: [連携店名()] };
    let password = PE管理者のパスワード;
    try {
      await createMember(page, { ...入力, パスワード: password });
    } catch (e) {
      // シード表のパスワードを画面が受け付けないときは、受け付ける値で代えて報告に残す
      password = "Passw0rd-PE-F0704";
      reportSeedIssue(seed.シードID, `管理者のパスワード「${PE管理者のパスワード}」を管理画面が受け付けなかった（${(e as Error).message.split("\n")[0]}）ので、代わりの値で登録した`);
      await createMember(page, { ...入力, パスワード: password });
    }
    PE管理者 = { loginId, password };
  });
});

const PEパスワード = (n: string): string => `F0704-Passw0rd-PE${n}`;
export const PE大会名 = (n: string): string => rc(`連携申込大会-F0704-PE${n}`);

for (const [seedId, n, 呼び名] of [["S-F07-04-PE-CASE-059", "001", "001"], ["S-F07-04-PE-CASE-060", "002", "002"], ["S-F07-04-PE-CASE-061", "003", "003"], ["S-F07-04-PE-CASE-062", "004", "004"]] as const) {
  defineSeed(seedId, { needs: ["S-F07-04-PE-REF"] }, async ({ browser, notes }) => {
    const m = await 会員を作る(browser, `pe-f0704-${n}`, "", { 姓: "F07-04", 名: `F0704PE${n}${RUN_MARK}` }, PEパスワード(n));
    const 会員ID = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      return 会員IDをメールから(page, m.メール);
    });
    会員一覧.set(`PE${n}`, { ...m, 会員ID });
    notes.set(label("会員ID", 呼び名), 会員ID);
    await withAdminSession(browser, PE管理者, async (page) => {
      page.setDefaultTimeout(60_000);
      const 大 = await 大会を登録する(page, {
        イベント名: PE大会名(n), イベント名英: `Link Entry Cup F07-04 F0704PE${n} ${RUN_MARK}`, 店舗: 連携店名(), フォーマット: 連携形式名(),
        日程: [{ 受付: "中", 定員: "10", 参加費: "0", 固定の時間: { 開始: "2099-12-20 10:00", オンライン受付: { 開始: "2026-01-01 00:00", 終了: "2099-12-19 00:00" } } }],
      });
      大会一覧.set(`PE${n}`, 大);
      notes.set(label("イベントID", 呼び名), 大.イベントID);
      notes.set(label("イベント詳細ID", 呼び名), 大.日程ID[0]);
    });
  });
}
