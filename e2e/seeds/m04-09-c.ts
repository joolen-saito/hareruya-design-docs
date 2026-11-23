/**
 * M04-09 在庫移動・振替登録/編集の続き（2026-11-23 依頼者「残りの齋藤分を進めて終わらせて」「DB の直接の設定は E2E の行だけなら流してよい」）のシード。
 * 正本: cases/M04-09_seed_data.tsv の S-M04-09-RD-*（163〜169 の在庫履歴・在庫検索一覧との連携）と S-M04-09-GF-MOVE-DONE-105。
 * 作り方の部品（商品・入庫・移動）は seeds/m04-09.ts の runScenario を使う。
 *
 * 正本の外の補い（そのシードを使ったケースの報告に「シード作成時の問題」として出す）:
 * - 店舗: M04-09 RD店舗A・RD店舗B は作らず、試験支店・本店（店舗ID 1）で読み替える（試験店舗の使い回し・2026-11-13 依頼者決定。M04-09 のほかのケースと同じ）。
 * - 所属: M04-09 RD所属A・RD所属B は作らず、M04-09 の試験所属A（試験支店）・試験所属B（本店）で読み替える（店舗の読み替えに合わせる）。
 * - 管理者: M04-09 RD作業者・RD承認者・RD入庫先承認者は、名前・ログインIDに決まった印（-E2E）を付けて1度だけ作り、使い回す
 *   （開発環境のメンバーの膨らみを止める決まり・2026-11-11）。権限は、承認権限なし＝M04-09 の試験用の権限（承認権限だけを外したもの）、
 *   承認権限あり＝システム管理者（M04-09 のほかの管理者と同じ）。編集可能店舗は試験支店・本店、所属店舗・所属はシード表のとおり（読み替えたもの）。
 * - 在庫編集（入庫）の登録・承認、事前の在庫移動（167・169）の登録・出庫承認・移動指示・送り状No.は、runScenario の作りのとおり
 *   M04-09作業者・M04-09承認者で行う（シード表は RD作業者・RD承認者。どのケースの期待結果も、事前の操作をした管理者を確かめない）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { rc, rcFixed } from "../lib/run_marker";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { Account } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import { ensureMemberWithDepartment } from "../pages/admin/m04_13_setup";
import { M0409_NO_APPROVAL_AUTHORITY } from "../pages/admin/m04_09_setup";
import {
  inboundApprovalPath, MoveTransferList, pressApprove, requestInbound, 入庫, 入庫担当者名, 店A, 店B, 所属A, 所属B, 承認者名, 作業者名,
} from "../pages/admin/m04_09_move";
import * as dbm from "../db/m04_09_move";
import * as dbc from "../db/m04_09_c";
import { ensureEnv, ensureReceiver, Goods, M0409_APP, M0409_RCV, Op, runScenario, session, StockCheck } from "./m04-09";

// ---------------------------------------------------------------- 管理者（RD作業者・RD承認者・RD入庫先承認者）

export const RD作業者名 = rcFixed("M04-09 RD作業者");
export const RD承認者名 = rcFixed("M04-09 RD承認者");
export const RD入庫先承認者名 = rcFixed("M04-09 RD入庫先承認者");
export const RD_OP: Account = { loginId: rcFixed("m0409rd-op").toLowerCase(), password: "Passw0rd-M0409RDop" };
export const RD_APR: Account = { loginId: rcFixed("m0409rd-apr").toLowerCase(), password: "Passw0rd-M0409RDapr" };
export const RD_APRB: Account = { loginId: rcFixed("m0409rd-aprb").toLowerCase(), password: "Passw0rd-M0409RDaprb" };

/** シード表の文に、作り方に書いた値が出てくること（写し間違いを止める） */
function mustSay(seedId: string, fragments: string[]): void {
  const s = getSeed(seedId);
  const text = s["状態・属性"] + s.投入方法;
  const missing = fragments.filter((f) => !text.includes(f));
  if (missing.length) throw new Error(`${seedId}: 作り方の値がシード表に無い: ${missing.join(" / ")}`);
}

const ensured = new Set<string>();

type RD管理者 = {
  account: Account; 正本のID: string; 正本の名前: string; 名前: string; 所属店舗: string; 正本の所属: string; 所属: string; 承認権限: boolean;
};

async function ensureRdMember(browser: Browser, seedId: string, v: RD管理者): Promise<void> {
  mustSay(seedId, [
    `ログインID=${v.正本のID}`, `パスワード=${v.account.password}`, `管理者名=${v.正本の名前}`, "稼働中",
    v.承認権限 ? "承認権限あり" : "承認権限なし", `所属=${v.正本の所属}`, "編集可能店舗=M04-09 RD店舗A・M04-09 RD店舗B",
  ]);
  const issue = (m: string) => reportSeedIssue(seedId, m);
  issue(`管理者「${v.正本の名前}」は、名前「${v.名前}」・ログインID「${v.account.loginId}」（決まった印つき）で1度だけ作り、使い回した。`
    + `所属店舗は「${v.所属店舗}」、所属は「${v.所属}」（${v.正本の所属}の読み替え）、編集可能店舗は「${店A}」「${店B}」、`
    + `権限は「${v.承認権限 ? "システム管理者" : M0409_NO_APPROVAL_AUTHORITY}」`);
  if (ensured.has(v.account.loginId)) return;
  await ensureEnv(browser, seedId);
  await session(browser, SETUP_ADMIN, (page) => ensureMemberWithDepartment(page, {
    名前: v.名前, 所属店舗: v.所属店舗, 所属: v.所属, ログインID: v.account.loginId, メールアドレス: `${v.account.loginId}@example.test`, パスワード: v.account.password,
    権限: v.承認権限 ? "システム管理者" : M0409_NO_APPROVAL_AUTHORITY, デフォルト検索表示店舗: v.所属店舗, 編集可能店舗: [店A, 店B],
  }));
  await session(browser, v.account, async () => undefined); // ログインできる（稼働中）こと
  ensured.add(v.account.loginId);
}

export async function ensureRdOperator(browser: Browser, seedId = "S-M04-09-RD-OP"): Promise<void> {
  await ensureRdMember(browser, seedId, {
    account: RD_OP, 正本のID: "m0409rd-op", 正本の名前: "M04-09 RD作業者", 名前: RD作業者名, 所属店舗: 店A, 正本の所属: "M04-09 RD所属A", 所属: 所属A, 承認権限: false,
  });
}
export async function ensureRdApprover(browser: Browser, seedId = "S-M04-09-RD-APR"): Promise<void> {
  await ensureRdMember(browser, seedId, {
    account: RD_APR, 正本のID: "m0409rd-apr", 正本の名前: "M04-09 RD承認者", 名前: RD承認者名, 所属店舗: 店A, 正本の所属: "M04-09 RD所属A", 所属: 所属A, 承認権限: true,
  });
}
export async function ensureRdInboundApprover(browser: Browser, seedId = "S-M04-09-RD-APRB"): Promise<void> {
  await ensureRdMember(browser, seedId, {
    account: RD_APRB, 正本のID: "m0409rd-aprb", 正本の名前: "M04-09 RD入庫先承認者", 名前: RD入庫先承認者名, 所属店舗: 店B, 正本の所属: "M04-09 RD所属B", 所属: 所属B, 承認権限: true,
  });
}

defineSeed("S-M04-09-RD-OP", async ({ browser, seed }) => { await ensureRdOperator(browser, seed.シードID); });
defineSeed("S-M04-09-RD-APR", async ({ browser, seed }) => { await ensureRdApprover(browser, seed.シードID); });
defineSeed("S-M04-09-RD-APRB", async ({ browser, seed }) => { await ensureRdInboundApprover(browser, seed.シードID); });

defineSeed("S-M04-09-RD-STORES", async ({ browser, seed }) => {
  const seedId = seed.シードID;
  mustSay(seedId, ["店舗=M04-09 RD店舗A・M04-09 RD店舗B", "所属=M04-09 RD所属A（M04-09 RD店舗Aに属する）", "所属=M04-09 RD所属B（M04-09 RD店舗Bに属する）"]);
  await ensureEnv(browser, seedId);
  reportSeedIssue(seedId, `店舗「M04-09 RD店舗A」「M04-09 RD店舗B」は作らず「${店A}」・本店「${店B}」で読み替え、`
    + `所属「M04-09 RD所属A」「M04-09 RD所属B」は作らず「${所属A}」「${所属B}」で読み替えた（試験店舗の使い回し・2026-11-13 依頼者決定）`);
});

// ---------------------------------------------------------------- 商品・在庫（RD-STOCK-163〜169）

const EC = "EC-CUBE" as const;
/** RD の商品（基準価格1000・販売価格1000・買取価格100。シード表のとおり） */
const rdGoods = (code: string, name: string): Goods => ({ code: rc(code), name: rc(name), 基準価格: 1000, 販売価格: 1000, 買取価格: 100 });
const inA = (code: string, qty: number, unit: number): 入庫 => ({ code: rc(code), store: 店A, zone: EC, qty, unit });
const chk = (code: string, store: string, stock: number, total: number): StockCheck => ({ code: rc(code), store, zone: EC, stock, total });

const 事前の操作の補い = "在庫編集（入庫）の登録・承認は M04-09作業者・M04-09承認者で行った（シード表は M04-09 RD作業者・M04-09 RD承認者。在庫数・総原価はシード表のとおり）";

function defineRdSeed(seedId: string, ops: Op[], extra: string[] = []): void {
  defineSeed(seedId, async (ctx: SeedCtx) => {
    await runScenario(ctx, ops);
    for (const m of [事前の操作の補い, ...extra]) reportSeedIssue(seedId, m);
  });
}

/** 移動元の商品1件（店舗A・EC-CUBE に10点・仕入単価100。店舗B は0） */
function defineRdMoveSource(seedId: string, code: string, name: string): void {
  defineRdSeed(seedId, [
    { op: "goods", items: [rdGoods(code, name)] },
    { op: "in", items: [inA(code, 10, 100)] },
    { op: "check", items: [chk(code, 店B, 0, 0)] },
  ]);
}

/** 振替元（店舗A に10点・仕入単価100）と振替先（店舗A に4点・仕入単価150） */
function defineRdTransferPair(seedId: string, n: string): void {
  defineRdSeed(seedId, [
    { op: "goods", items: [rdGoods(`M0409RD-${n}-A`, `M04-09 RD振替元${n}`), rdGoods(`M0409RD-${n}-B`, `M04-09 RD振替先${n}`)] },
    { op: "in", items: [inA(`M0409RD-${n}-A`, 10, 100), inA(`M0409RD-${n}-B`, 4, 150)] },
  ]);
}

/** 移動中の移動（店舗A・EC-CUBE → 店舗B・EC-CUBE、移動点数3。入庫承認申請はしていない） */
function defineRdTransit(seedId: string, n: string): void {
  const code = `M0409RD-${n}`;
  const label = `〔在庫移動ID-M0409-RD${n}〕`;
  defineRdSeed(seedId, [
    { op: "goods", items: [rdGoods(code, `M04-09 RD移動商品${n}`)] },
    { op: "in", items: [inA(code, 10, 100)] },
    {
      op: "move", label, from: { store: 店A, zone: EC }, to: { store: 店B, zone: EC }, lines: [{ code: rc(code), qty: 3 }], until: "transit",
      tracking: rc(`M0409RD-TRK-${n}`), mention: [label, "入庫先店舗=M04-09 RD店舗B", "入庫先在庫区分=EC-CUBE", `${code}の移動点数=3`, `送り状No.=M0409RD-TRK-${n}`],
    },
    {
      // 「在庫移動指示作成」で移った在庫移動指示一覧の在庫移動指示IDを控える（シード表）。一覧の行の移動指示リストIDを読む
      op: "do", run: async (ctx) => {
        const id = ctx.notes.get(label);
        const listId = await session(ctx.browser, M0409_APP, async (page) => {
          const list = new MoveTransferList(page);
          await list.searchById(id);
          return (await list.rowState(id)).移動指示リストID;
        });
        if (!/^\d+$/.test(listId)) throw new Error(`${ctx.seed.シードID}: 在庫移動 ${id} の移動指示リストIDを読めない（「${listId}」）`);
        ctx.notes.set(`〔在庫移動指示ID-M0409-RD${n}〕`, listId);
      },
    },
    { op: "check", items: [chk(code, 店A, 7, 700), chk(code, 店B, 0, 0)] },
  ], [
    `在庫移動 ${label} の登録・出庫承認申請は M04-09作業者、出庫承認・在庫移動指示作成・送り状No.の登録は M04-09承認者で行った`
    + "（シード表は登録・指示作成・送り状No.が M04-09 RD作業者、出庫承認が M04-09 RD承認者。承認通知先は試験所属A・M04-09承認者）。送り状No.は実行の印つき",
  ]);
}

defineRdMoveSource("S-M04-09-RD-STOCK-163", "M0409RD-001", "M04-09 RD移動商品001");
defineRdMoveSource("S-M04-09-RD-STOCK-164", "M0409RD-002", "M04-09 RD移動商品002");
defineRdTransferPair("S-M04-09-RD-STOCK-165", "003");
defineRdMoveSource("S-M04-09-RD-STOCK-166", "M0409RD-004", "M04-09 RD移動商品004");
defineRdTransit("S-M04-09-RD-STOCK-167", "005");
defineRdTransferPair("S-M04-09-RD-STOCK-168", "006");
defineRdTransit("S-M04-09-RD-STOCK-169", "007");

// ---------------------------------------------------------------- 105: ステータス変更履歴4件の入庫完了の移動

export const L105 = "〔在庫移動ID-M0409-105〕";
const 履歴105 = [
  { st: /^新規登録$/, 正本: "新規登録", at: "2026-03-01 09:00:00", who: 作業者名, 正本の更新者: "M04-09作業者" },
  { st: /^出庫承認待ち$/, 正本: "出庫承認待ち", at: "2026-03-01 09:30:00", who: 作業者名, 正本の更新者: "M04-09作業者" },
  { st: /^出庫承認済み$/, 正本: "出庫承認済み", at: "2026-03-01 10:00:00", who: 承認者名, 正本の更新者: "M04-09承認者" },
  { st: /^入庫(完了|済み)$/, 正本: "入庫完了", at: "2026-03-01 11:00:00", who: 入庫担当者名, 正本の更新者: "M04-09入庫担当者" },
];

defineSeed("S-M04-09-GF-MOVE-DONE-105", async (ctx: SeedCtx) => {
  const seedId = ctx.seed.シードID;
  const code = rc("M0409-105-A");
  const issue = (m: string) => reportSeedIssue(seedId, m);
  mustSay(seedId, ["ID=409510501", "入庫完了", "試験店舗Aから試験店舗B", "商品コード=M0409-105-A・移動点数3", ...履歴105.map((h) => `${h.at}・${h.正本}・${h.正本の更新者}`)]);
  // 商品・入庫・移動中まで（シード表は「DBシードで登録する」。画面で作れるところまで画面で作る。商品と入庫の値はシード表が決めていない）
  // 在庫移動・振替IDはシード表が決め打ち（409510501）で「控える」と定めていないので、ケースが引く番号として setExtra で控える（呼び名の突き合わせに入れない）
  const local = new Notes();
  await runScenario({ ...ctx, notes: local }, [
    { op: "goods", items: [{ code }], free: true },
    { op: "in", items: [{ code, store: 店A, zone: EC, qty: 10, unit: 100 }], free: true },
    { op: "move", label: L105, from: { store: 店A, zone: EC }, to: { store: 店B, zone: EC }, lines: [{ code, qty: 3 }], until: "transit", mention: [`${店A}から${店B}`] },
  ]);
  const id = local.get(L105);
  ctx.notes.setExtra(L105, id);
  // 入庫承認申請（M04-09入庫担当者。承認通知先は所属を選ばずメンバーに M04-09承認者。裁定 E11）→ 入庫承認（申請した本人は承認できないので M04-09承認者）
  await ensureReceiver(ctx.browser, "S-M04-09-APP-B");
  await session(ctx.browser, M0409_RCV, (page) => requestInbound(page, id, { 所属: "", メンバー: 承認者名 }, `${seedId}: 在庫移動 ${id} の入庫承認申請`, issue));
  await session(ctx.browser, M0409_APP, async (page) => {
    const list = new MoveTransferList(page);
    await list.searchById(id);
    await list.openFromRow(id);
    if (!inboundApprovalPath(id).test(new URL(page.url()).pathname)) throw new Error(`${seedId}: 在庫移動 ${id} の行から入庫承認画面が開かない（${page.url()}）`);
    await pressApprove(page, "inbound_approval_approve_btn");
    for (const w of await expectSaved(page, `${seedId}: 在庫移動 ${id} の入庫承認`)) issue(w);
  });
  const st = dbm.在庫移動振替(id)?.ステータス ?? "";
  if (!/^入庫(完了|済み)$/.test(st)) throw new Error(`${seedId}: 入庫承認のあと、在庫移動 ${id} のステータスが「${st}」`);
  // ステータス変更履歴を、シード表の4件（更新日・ステータス・更新者）にそろえる。日時は時差が書いていないので日本時間の値として書く
  const rows = dbc.履歴の行(id);
  const keep: string[] = [];
  for (const h of 履歴105) {
    const hit = rows.filter((r) => h.st.test(r.ステータス));
    if (hit.length !== 1) throw new Error(`${seedId}: 在庫移動 ${id} のステータス変更履歴に「${h.正本}」の行が ${hit.length} 件（${JSON.stringify(rows)}）`);
    keep.push(hit[0].番号);
    dbc.履歴を整える(`${seedId}: ステータス変更履歴（${hit[0].ステータス}）の更新日・更新者`, hit[0].番号, `${h.at}+09`, h.who);
  }
  const drop = rows.filter((r) => !keep.includes(r.番号));
  dbc.履歴を消す(`${seedId}: シード表の4件に入らないステータス変更履歴`, drop.map((r) => r.番号));
  issue(`在庫移動は画面で入庫完了まで進め（在庫移動・振替IDは画面が振った ${id}。シード表の ID 409510501 の読み替え）、ステータス変更履歴だけを DB でシード表の4件にそろえた`
    + `（画面の操作でできた ${drop.map((r) => r.ステータス).join("・") || "なし"} の履歴は消した。日時は時差が書いていないので日本時間の値として書いた）`);
  if (st !== "入庫完了") issue(`入庫完了の状態の DB の名前は「${st}」（シード表は「入庫完了」）。そのままにした`);
});
