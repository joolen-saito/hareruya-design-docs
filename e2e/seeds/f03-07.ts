/**
 * F03-07 入荷時通知の画面シード。正本: cases/F03-07_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順）:
 * 1. 会員: フロント本店の新規会員登録画面で登録し、本登録のメールのURLを開いて本会員にする。管理画面の会員一覧でメールアドレスを検索して会員IDを控える。
 * 2. 商品: グッズ商品CSV登録で1行（または複数行）を取り込み（商品と、状態がニアミントの商品規格が在庫0で登録される）、
 *    商品マスターで商品コードを検索して商品IDを控え、商品規格一覧で公開でなければ公開にして登録する。
 *    2つ目以降の商品規格は商品規格一覧の「新規作成」で登録する（在庫0）。高額商品コードは商品規格登録編集画面で入れる。
 * 3. 入荷通知依頼: フロント本店に会員でログインし、商品詳細画面で商品規格の通知ボタンを押して登録する。
 *
 * 決め打ちの識別の値（会員のメールアドレス・商品コード・商品名）には、実行ごとの印を付ける（e2e/lib/run_marker.ts。依頼者決定 2026-10-28）。
 * パスワードは識別の値でないので印を付けない。
 *
 * 画面が振らず、画面にも出ない番号（プレイヤーID・依頼ID）は、ケースの文が呼び名で引くので、DBの参照で読んで控える（書き込みはしない）。
 *
 * 正本の外で補ったこと（記録にも書く）:
 * - グッズ商品CSVの「商品公開ステータスに2（公開）」は、画面の項目説明（1:公開 2:非公開）に従い、公開を表す値で書いた。
 * - 確認モーダルは取込の画面に無い（M03-27 の記録と同じ）ので、取込の結果（成功の表示）を確かめて進めた。
 * - 013 の商品名は「重複しない試験用の商品名」なので、商品コード（に印を付けたもの）と同じにした。
 * - 部門が未選択のときは、選択肢の先頭を選んだ（正本: 任意の部門）。
 * - 入荷通知完了モーダルの「OK」を押す手順（055・056・051・052）は、アプリに「OK」が無いので、通知の閉じるボタンで閉じた（記録に書く）。
 */
import { Browser, Page, expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { プレイヤーID, 規格の依頼ID, 商品単位の依頼ID } from "../db/f03_07";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, hideDebugToolbar, withAdminSession } from "../lib/session";
import { BASE_URL } from "../config/env";
import { customerIdByEmail, readArrivalMax, savePublishedClass, setArrivalMax } from "../pages/admin/f03_07_restock";
import { customerStateByEmail } from "../pages/admin/customer";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { addClass, openClassList } from "../pages/admin/m03_30_products";
import { ensureMember } from "../pages/admin/member";
import { FrontRestock } from "../pages/front/f03_07_restock_notify";
import { registerFrontMember } from "../pages/front/member_entry";

// ---- 実行中に控える対応（ケースの文の値 → 実際の値） ----

export type 規格の場所 = { productId: string; classId: string };
const classes = new Map<string, 規格の場所>();
export type 会員 = { mail: string; password: string; id: string };
const members = new Map<string, 会員>();

/** ケースの文の商品規格コード（正本の値）から、シードが作った商品ID・商品規格IDを引く */
export function classOf(正本の商品コード: string): 規格の場所 {
  const c = classes.get(rc(正本の商品コード));
  if (!c) throw new Error(`商品規格コード ${正本の商品コード} の商品はまだ作っていない`);
  return c;
}
/** ケースの文の会員（メールアドレスの@の前＝正本の値）から、シードが作った会員を引く */
export function memberOf(正本のメールの前半: string): 会員 {
  const m = members.get(rc(正本のメールの前半));
  if (!m) throw new Error(`会員 ${正本のメールの前半} はまだ作っていない`);
  return m;
}
/** メールアドレス（@の前に実行の印を付ける） */
export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;
export const passwordOf = (前半: string): string => `Passw0rd!${前半}`;

// ---- 会員 ----

async function createMember(browser: Browser, 前半: string, password: string, issue: (m: string) => void): Promise<会員> {
  const mail = mailOf(前半);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    await registerFrontMember(await context.newPage(), { 姓: "試験会員", 名: "入荷通知", セイ: "シケンカイイン", メイ: "ニュウカツウチ", メール: mail, パスワード: password });
  } finally {
    await context.close();
  }
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const state = await customerStateByEmail(page, mail);
    if (state !== "本会員") throw new Error(`会員 ${mail} を登録したが、会員一覧で本会員にならない（${state ?? "見つからない"}）`);
    return customerIdByEmail(page, mail);
  });
  const m = { mail, password, id };
  members.set(rc(前半), m);
  issue(`会員 ${前半} を登録した（会員ID ${id}）`);
  return m;
}

// ---- 商品 ----

export type 規格の定義 = {
  /** 正本の商品規格コード（印はここで付ける） */
  code: string;
  /** 取込以外の規格の状態（商品規格登録編集画面の状態の選択肢）。1つ目の規格は取込で作られるニアミントなので書かない */
  state?: string;
  /** 高額商品コード（正本の値。印は付けない） */
  highPrice?: string;
};
export type 商品の定義 = { name: string; classes: 規格の定義[] };
export type 作った商品 = { productId: string; classIds: string[] };

/** 正本「商品規格…スライトリープレイド」「…モデレトリープレイド」の、画面の状態名 */
export const STATE_SP = "スライトリープレイド";
export const STATE_SP_BELOW = "モデレトリープレイド";

async function createProducts(browser: Browser, tag: string, defs: 商品の定義[], issue: (m: string) => void): Promise<作った商品[]> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const categoryId = await readExistingGoodsChildCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${tag} のグッズ商品CSV登録`, fileName: `${tag}.csv`, categoryId,
      lines: defs.map((d) => ({ code: rc(d.classes[0].code), nameJp: rc(d.name), nameEn: rc(d.name) })),
      onWarning: (w) => issue(`${tag}: グッズ商品CSV登録の警告「${w}」`),
      uploadWaitMs: 120_000,
    });
    const out: 作った商品[] = [];
    for (const d of defs) {
      const first = rc(d.classes[0].code);
      const productId = await openProductEditByCode(page, first);
      const rows = await classRowsFromProductEdit(page, productId);
      if (rows.length !== 1 || rows[0].商品コード !== first) throw new Error(`${tag}: ${first} の取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
      const classIds = [rows[0].商品規格ID];
      const high = d.classes[0].highPrice;
      if (rows[0].公開状態 !== "公開" || high !== undefined) {
        await savePublishedClass(page, { productId, classId: rows[0].商品規格ID, highPriceCode: high }, `${tag}: ${first}`, issue);
      }
      for (const extra of d.classes.slice(1)) {
        await openClassList(page, productId);
        const id = await addClass(page, productId, {
          言語: "日本語", 状態: extra.state ?? STATE_SP, 商品コード: rc(extra.code), 基準価格: "100", 販売価格: "100", 買取価格: "10", 高額商品コード: extra.highPrice,
        }, `${tag}: ${rc(extra.code)}`, issue);
        classIds.push(id);
      }
      d.classes.forEach((c, i) => classes.set(rc(c.code), { productId, classId: classIds[i] }));
      out.push({ productId, classIds });
    }
    return out;
  });
}

// ---- 入荷通知依頼（フロントで会員が通知ボタンを押す） ----

export type 依頼の定義 = { product: 作った商品; classIndex: number } | { product: 作った商品; bulk: true };

async function requestAs(browser: Browser, m: 会員, items: 依頼の定義[], tag: string, issue: (m: string) => void): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    const front = new FrontRestock(page);
    await front.login(m.mail, m.password);
    for (const it of items) {
      await front.openDetail(it.product.productId);
      if ("bulk" in it) {
        if ((await front.bulkButton.count()) === 0) {
          throw new Error(`${tag}: 商品ID ${it.product.productId} の商品詳細画面に「まとめて入荷通知」のボタンが無い（グッズ商品の詳細には出ない作り）。商品単位の入荷通知依頼を画面で作れない`);
        }
        const r = await front.press(front.bulkButton);
        if (!r.通知が出た) throw new Error(`${tag}: 「まとめて入荷通知」を押しても完了の通知が出ない`);
      } else {
        const btn = front.classButton(it.product.classIds[it.classIndex]);
        const r = await front.press(btn);
        if (!r.通知が出た || !/設定/.test(r.通知の文)) throw new Error(`${tag}: 商品規格ID ${it.product.classIds[it.classIndex]} の通知ボタンを押しても依頼の完了の通知が出ない（${JSON.stringify(r)}）`);
      }
    }
    issue(`${tag}: 会員 ${m.mail} が通知ボタンを押して入荷通知依頼を ${items.length} 件登録した`);
  } finally {
    await context.close();
  }
}

// ---- 呼び名の控え ----

type 控えの材料 = { members: 会員[]; products: 作った商品[]; requests: 依頼の定義[]; requestMember?: number[] };

/** シード表の状態・属性・投入方法に出てくる呼び名を、作ったものから決めて控える */
function noteLabels(seedId: string, notes: Notes, ctx: 控えの材料): void {
  const seed = getSeed(seedId);
  const letter = (suffix: string): number => (/[A-Z]$/.test(suffix) && !/^PF/.test(suffix) ? suffix.charCodeAt(suffix.length - 1) - 65 : 0);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    const m = /^〔(.+?)-F0307-(.+)〕$/.exec(label);
    if (!m) throw new Error(`${seedId}: 呼び名 ${label} の形が読めない`);
    const [, kind, suffix] = m;
    const idx = letter(suffix);
    if (kind === "会員ID") notes.set(label, ctx.members[ctx.members.length > 1 ? idx : 0].id);
    else if (kind === "プレイヤーID") {
      const mem = ctx.members[ctx.members.length > 1 ? idx : 0];
      const p = プレイヤーID(mem.id);
      if (!p) throw new Error(`${seedId}: 会員ID ${mem.id} のプレイヤーが見つからない`);
      notes.set(label, p);
    } else if (kind === "商品ID") notes.set(label, ctx.products[0].productId);
    else if (kind === "商品規格ID") {
      const p = ctx.products[0];
      notes.set(label, p.classIds[p.classIds.length > 1 ? Math.min(idx, p.classIds.length - 1) : 0]);
    } else if (kind === "依頼ID") {
      const rq = ctx.requests[Math.min(idx, ctx.requests.length - 1)];
      const mem = ctx.members[(ctx.requestMember ?? [])[Math.min(idx, ctx.requests.length - 1)] ?? 0];
      const id = "bulk" in rq ? 商品単位の依頼ID(mem.id, rq.product.productId) : 規格の依頼ID(mem.id, rq.product.classIds[rq.classIndex]);
      if (!id) throw new Error(`${seedId}: 依頼を画面で登録したのに、DBの参照で依頼IDが見つからない`);
      notes.set(label, id);
    } else throw new Error(`${seedId}: 呼び名 ${label} の種類が未対応`);
  }
}

// ---- 標準の形: 会員（任意）＋商品1件（＋依頼） ----

type 標準 = {
  sfx: string;
  /** 会員を作らないシードは undefined。メールの前半・パスワードを変えるときだけ書く */
  member?: { local?: string; password?: string } | false;
  product: 商品の定義;
  /** 作った会員が依頼を登録する規格の番号（商品の規格の並びの何番目か）。bulk は商品単位 */
  request?: ({ classIndex: number } | { bulk: true })[];
};

function defineStandard(a: 標準): void {
  const seedId = `S-F03-07-${a.sfx}`;
  defineSeed(seedId, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const mems: 会員[] = [];
    if (a.member !== false && a.member !== undefined) {
      const local = a.member.local ?? `f0307-a-${/(\d+)$/.exec(a.sfx)![1]}`;
      mems.push(await createMember(browser, local, a.member.password ?? passwordOf(local), issue));
    }
    const [product] = await createProducts(browser, seedId, [a.product], issue);
    const reqs: 依頼の定義[] = (a.request ?? []).map((r) => ("bulk" in r ? { product, bulk: true as const } : { product, classIndex: r.classIndex }));
    if (reqs.length) await requestAs(browser, mems[0], reqs, seedId, issue);
    noteLabels(seedId, notes, { members: mems, products: [product], requests: reqs });
  });
}

const S = (code: string) => ({ code });

// 001 通知単位と一覧での表示
defineStandard({ sfx: "CASE-001", member: {}, product: { name: "通知単位確認商品-001", classes: [S("UNIT-NM-001"), { code: "UNIT-SP-001", state: STATE_SP }] } });
// 002 状態別の表示（NM・SP・SP以下）
defineStandard({ sfx: "CASE-002", member: {}, product: { name: "状態別通知確認商品-002", classes: [S("STATE-NM-002"), { code: "STATE-SP-002", state: STATE_SP }, { code: "STATE-SPLOW-002", state: STATE_SP_BELOW }] } });
// 003 高額商品
defineStandard({ sfx: "CASE-003", member: {}, product: { name: "高額商品確認商品-003", classes: [{ code: "HIGH-NM-003", highPrice: "HP-F0307-003" }] } });
// 005 未ログインで通知ボタンを押す
defineStandard({ sfx: "CASE-005", member: false, product: { name: "通知単位確認商品-005", classes: [S("UNIT-NM-005"), { code: "UNIT-SP-005", state: STATE_SP }] } });
for (const n of ["006", "007", "025"]) {
  defineStandard({ sfx: `CASE-${n}`, member: {}, product: { name: `通知単位確認商品-${n}`, classes: [S(`UNIT-NM-${n}`)] } });
}
for (const n of ["008", "009", "010", "026"]) {
  defineStandard({ sfx: `CASE-${n}`, member: {}, product: { name: `既存依頼商品-${n}`, classes: [S(`EXIST-001-${n}`)] }, request: [{ classIndex: 0 }] });
}
defineStandard({ sfx: "CASE-011", member: {}, product: { name: "まとめて通知確認商品-011", classes: [S("BULK-NM-011"), { code: "BULK-SP-011", state: STATE_SP }] } });
defineStandard({ sfx: "CASE-012", member: {}, product: { name: "一覧SOLDOUT商品-012", classes: [S("LISTSO-NM-012"), { code: "LISTSO-SP-012", state: STATE_SP }] } });
for (const n of ["020", "021"]) {
  defineStandard({ sfx: `CASE-${n}`, member: false, product: { name: `通知単位確認商品-${n}`, classes: [S(`UNIT-NM-${n}`)] } });
}
for (const n of ["022", "023"]) {
  defineStandard({ sfx: `CASE-${n}`, member: { password: `Passw0rd-F0307-${n}!F0307A-${n}` }, product: { name: `通知単位確認商品-${n}`, classes: [S(`UNIT-NM-${n}`)] } });
}
// 一覧からの通知（商品一覧に出る商品）
for (const n of ["036", "037"]) {
  defineStandard({ sfx: `LISTLOGIN${n === "037" ? "C" : ""}-${n}`, member: false, product: { name: `一覧未ログイン確認商品-${n}`, classes: [S(`F0307-${n}-NM`)] } });
}
for (const n of ["038", "039"]) {
  defineStandard({ sfx: `LISTDONE${n === "039" ? "C" : ""}-${n}`, member: {}, product: { name: `一覧ログイン済み確認商品-${n}`, classes: [S(`F0307-${n}-NM`)] } });
}
for (const n of ["040", "041"]) {
  // 商品単位（まとめて入荷通知）の依頼が前提。グッズ商品の詳細に「まとめて入荷通知」が無いので、シードは画面で作れず止まる
  defineStandard({ sfx: `LISTCANCEL${n === "041" ? "C" : ""}-${n}`, member: {}, product: { name: `一覧取消確認商品-${n}`, classes: [S(`F0307-${n}-NM`)] }, request: [{ bulk: true }] });
}
defineStandard({ sfx: "LOGINCLOSE-044", member: false, product: { name: "ログインモーダル閉じる確認商品-044", classes: [S("F0307-044-NM")] } });
defineStandard({ sfx: "DONEX-045", member: {}, product: { name: "依頼完了閉じる確認商品-045", classes: [S("F0307-045-NM")] } });
defineStandard({ sfx: "DONEOK-046", member: {}, product: { name: "依頼完了OK確認商品-046", classes: [S("F0307-046-NM")] } });
defineStandard({ sfx: "CANCELX-047", member: {}, product: { name: "取消完了閉じるボタン確認商品-047", classes: [S("F0307-047-NM")] }, request: [{ classIndex: 0 }] });
defineStandard({ sfx: "CANCELOK-048", member: {}, product: { name: "取消完了OK確認商品-048", classes: [S("F0307-048-NM")] }, request: [{ classIndex: 0 }] });
defineStandard({ sfx: "BTNREQ-049", member: {}, product: { name: "依頼後表示切替確認商品-049", classes: [S("F0307-049-NM")] } });
defineStandard({ sfx: "BTNCANCEL-050", member: {}, product: { name: "取消後表示切替確認商品-050", classes: [S("F0307-050-NM")] }, request: [{ classIndex: 0 }] });
defineStandard({ sfx: "RELOAD-054", member: { local: "dpf0307-054" }, product: { name: "再依頼商品-054", classes: [S("RE-REQ-F0307-054")] } });
// 055・056 の会員は固定のメールアドレスとパスワード
defineStandard({ sfx: "CBWAIT-055", member: { local: "cbf0307-055", password: "Passw0rd-CBF0307055" }, product: { name: "F0307-CB055-GOODS", classes: [S("F0307-CB055-NM")] }, request: [{ classIndex: 0 }] });
defineStandard({ sfx: "CBLIST-056", member: { local: "cbf0307-056", password: "Passw0rd-CBF0307056" }, product: { name: "F0307-CB056-LIST", classes: [S("F0307-CB056-NM")] }, request: [{ classIndex: 0 }] });
// 連携（051）: 会員のメールアドレス・パスワードは固定
defineStandard({ sfx: "PF-REQ-051", member: { local: "f0307-pf-001", password: "Passw0rd-PF001" }, product: { name: "連携入荷通知商品F0307PF001", classes: [S("F0307PF001-NM")] } });

// 013 会員A・会員Bと、会員ごとの入荷待ち商品
defineSeed("S-F03-07-CASE-013", async ({ browser, notes }) => {
  const seedId = "S-F03-07-CASE-013";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const a = await createMember(browser, "f0307-a-013", passwordOf("f0307-a-013"), issue);
  const b = await createMember(browser, "f0307-b-013", passwordOf("f0307-b-013"), issue);
  const defs: 商品の定義[] = ["OWN-A-001-013", "OWN-A-002-013", "OWN-B-001-013"].map((c) => ({ name: c, classes: [S(c)] }));
  const ps = await createProducts(browser, seedId, defs, issue);
  await requestAs(browser, a, [{ product: ps[0], classIndex: 0 }, { product: ps[1], classIndex: 0 }], seedId, issue);
  await requestAs(browser, b, [{ product: ps[2], classIndex: 0 }], seedId, issue);
  issue("商品名は正本が「重複しない試験用の商品名」と定めるだけなので、商品コード（に印を付けたもの）と同じにした");
  noteLabels(seedId, notes, {
    members: [a, b], products: [ps[0]], requests: [{ product: ps[2], classIndex: 0 }], requestMember: [1],
  });
});

// ---- 共有の設定: 入荷通知最大数 ----

/** シードを作る前の入荷通知最大数（ケースが終わるたびに戻す） */
let arrivalMaxBefore: string | null = null;
defineSeed("S-F03-07-ARRIVAL-LIMIT", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    if (arrivalMaxBefore === null) arrivalMaxBefore = await readArrivalMax(page);
    reportSeedIssue("S-F03-07-ARRIVAL-LIMIT", `入荷通知最大数のいまの値は ${arrivalMaxBefore}。ケースが終わったら戻す`);
  });
});
/** ケースが終わるたびに、控えた値へ戻す（正本: このシードを使うケースが終わるたびに控えた値へ戻す） */
export async function restoreArrivalMax(browser: Browser): Promise<void> {
  if (arrivalMaxBefore === null) return;
  const before = arrivalMaxBefore;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { await setArrivalMax(page, before); });
}
/** 正本「開始時に追加システム設定の入荷通知最大数を20に設定する」 */
export async function setArrivalMaxAtStart(browser: Browser, value: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { await setArrivalMax(page, value); });
}

/** 上限を試す3シード（014・015・019）の共通の形 */
async function limitSeed(a: {
  seedId: string; sfx: string; targetCode: string; targetName: string; fillerCount: number; bulkCount?: number; includeTargetRequest?: boolean;
}, browser: Browser, notes: Notes): Promise<void> {
  const issue = (m: string) => reportSeedIssue(a.seedId, m);
  const m = await createMember(browser, `f0307-a-${a.sfx}`, passwordOf(`f0307-a-${a.sfx}`), issue);
  const defs: 商品の定義[] = [{ name: a.targetName, classes: [S(a.targetCode)] }];
  for (let i = 1; i <= a.fillerCount; i++) {
    const nn = String(i).padStart(2, "0");
    defs.push({ name: `上限充足商品-${nn}-${a.sfx}`, classes: [S(`LIMIT-FILL-${nn}-${a.sfx}`)] });
  }
  const ps = await createProducts(browser, a.seedId, defs, issue);
  await setArrivalMaxAtStart(browser, "20");
  const reqs: 依頼の定義[] = ps.slice(a.includeTargetRequest ? 0 : 1).map((p) => ({ product: p, classIndex: 0 }));
  await requestAs(browser, m, reqs, a.seedId, issue);
  noteLabels(a.seedId, notes, { members: [m], products: [ps[0]], requests: [reqs[0]] });
}
defineSeed("S-F03-07-CASE-014", { needs: ["S-F03-07-ARRIVAL-LIMIT"] }, ({ browser, notes }) => limitSeed({
  seedId: "S-F03-07-CASE-014", sfx: "014", targetCode: "LIMIT-NEW-001-014", targetName: "上限境界商品", fillerCount: 19,
}, browser, notes));
defineSeed("S-F03-07-CASE-019", { needs: ["S-F03-07-ARRIVAL-LIMIT"] }, ({ browser, notes }) => limitSeed({
  seedId: "S-F03-07-CASE-019", sfx: "019", targetCode: "LIMIT-EXIST-001-019", targetName: "上限内既存依頼商品", fillerCount: 19, includeTargetRequest: true,
}, browser, notes));

// 015: 商品・日本語単位10件と規格単位10件。グッズ商品の詳細に「まとめて入荷通知」が無いので、商品単位の依頼を画面で作れず止まる
defineSeed("S-F03-07-CASE-015", { needs: ["S-F03-07-ARRIVAL-LIMIT"] }, async ({ browser }) => {
  const seedId = "S-F03-07-CASE-015";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const m = await createMember(browser, "f0307-a-015", passwordOf("f0307-a-015"), issue);
  const defs: 商品の定義[] = [{ name: "上限超過商品", classes: [S("LIMIT-NEW-001-015")] }, { name: "既存の上限内商品-015", classes: [S("LIMIT-EXIST-001-015")] }];
  for (let i = 1; i <= 19; i++) {
    const nn = String(i).padStart(2, "0");
    defs.push({ name: `上限充足商品-${nn}-015`, classes: [S(`LIMIT-FILL-${nn}-015`)] });
  }
  // 先に1商品だけで「まとめて入荷通知」の有無を確かめる（無ければ、残りの商品を作らずに止める）
  const first = await createProducts(browser, `${seedId}-first`, [defs[2]], issue);
  await setArrivalMaxAtStart(browser, "20");
  await requestAs(browser, m, [{ product: first[0], bulk: true }], seedId, issue);
  throw new Error(`${seedId}: 想定外。商品単位の依頼を作れたが、残りの19件の作り方は実装していない`);
});

// ---- 連携の確認に使う管理者（共有可。あれば内容を確かめて使い、無ければ登録する） ----

export const PF_ADMIN: Account = { loginId: "pf0307admin", password: "Passw0rd-PF0307" };
/**
 * 正本: ログインID pf0307admin・パスワード Passw0rd-PF0307・稼働中・分析・集計管理機能を閲覧・操作できる。
 * 権限の種類は「分析・集計管理機能」を含むものとして、全機能を使える「システム管理者」にした（権限の細かい名前が正本に無い。記録に書く）。
 */
defineSeed("S-F03-07-PF-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await page.goto(adminUrl("/setting/system/member/new"));
    const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((os) => os
      .map((o) => o as HTMLOptionElement).filter((o) => o.value !== "").map((o) => o.textContent?.trim() ?? "").filter(Boolean));
    if (stores.length === 0) throw new Error("PF-ADM: メンバーに割り当てられる店舗が画面に無い");
    await ensureMember(page, {
      名前: "F03-07連携試験管理者", 所属店舗: stores[0], ログインID: PF_ADMIN.loginId, メールアドレス: "pf0307admin@example.test",
      パスワード: PF_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: stores[0], 編集可能店舗: [stores[0]],
    });
  });
  reportSeedIssue("S-F03-07-PF-ADM", "権限は、分析・集計管理機能を含む「システム管理者」にした（正本に権限の名前が無い）");
});
