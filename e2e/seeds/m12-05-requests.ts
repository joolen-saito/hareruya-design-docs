/**
 * M12-05 入荷通知依頼 一覧表示(検索項目) の、商品・会員・入荷通知依頼のシード。正本: cases/M12-05_seed_data.tsv
 *
 * 作り方（シード表の投入方法を、依頼者の方針（2026-11-10）で次のように読み替える）:
 * 1. 商品: グッズ商品CSV登録で取り込み（言語・販売価格は列で指定）、商品マスターで商品コードから商品IDを、商品規格一覧から商品規格IDを控える。
 *    規格が2つの商品は、商品規格一覧の「新規作成」で2つ目を登録する（1つ目と同じ言語・販売価格。状態は2つ目だけ別の状態にする）。
 *    売上分析タグ「タグT1」は、商品登録編集画面で選んで登録する。
 * 2. 会員: フロントの会員情報登録で登録し、本会員にして、管理画面の会員一覧のメールアドレス検索で会員IDを控える。
 * 3. 入荷通知依頼: 会員でフロントにログインし、商品詳細画面の通知ボタンを押す。取り消す依頼は、ボタンをもう一度押す。
 * 4. 依頼日時・削除日時は画面で指定できないので、DBで依頼に設定した（db/m12_05.ts。実行の印つきの会員の依頼だけ）。
 *    商品単位（規格を指さない）の依頼は、グッズ商品の詳細に「まとめて入荷通知」が無く画面で作れないので、DBで依頼を足した。
 *
 * 正本の外で補ったこと（備考に残す）:
 * - 決め打ちの識別の値（商品名・商品コード・会員のメールアドレス）に、実行ごとの印を付けた（lib/run_marker.ts）。商品名は
 *   「検索語（正本のキーワード）＋印」のあとに、正本の商品名の残り（JP・01 など）を続けた形にしたので、キーワードを「検索語＋印」にして引く。
 *   正本が別のシードの商品名に同じ検索語を含ませる組（001と004、014と018）は、前者の商品名に「-001」「-018」を足して、検索が取り違えないようにした。
 * - 商品名(英)は画面で空にできず（登録時に必須）、検索に使わない（検索語を含まない値を入れた）ので、DBで空にはしていない。
 * - 「会員ID-…A」「…B」のように複数の会員が書かれていても、会員の数が結果（通知待ち・削除の件数）に効かないシードは、
 *   会員1人が複数の商品へ依頼した形に読み替えた（会員の数が効く 024・025・030・032 は書かれた人数で作った）。
 * - シード表の会員の名前（検索太郎・M1205-026-A 太郎）は、その名前で登録した。
 * - 表示件数確認（013）は、会員1人が11商品へ依頼する形で、1件目だけ画面で、残りは1人あたりの依頼数の上限に当たらないようDBで足した。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { プレイヤーIDを引く, 依頼IDを引く, 依頼を足す, 規格の依頼日時を設定 } from "../db/m12_05";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { customerIdByEmail, savePublishedClass } from "../pages/admin/f03_07_restock";
import { customerStateByEmail } from "../pages/admin/customer";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { addClass, openClassList } from "../pages/admin/m03_30_products";
import { 売上分析タグを付ける } from "../pages/admin/m12_05_product_tag";
import { FrontRestock } from "../pages/front/f03_07_restock_notify";
import { registerFrontMember } from "../pages/front/member_entry";

/** 正本の商品名（検索語 base に、残り suffix を続けたもの）の実際の値。検索語は rc(base) */
export const 商品名 = (base: string, suffix = ""): string => rc(base) + suffix;

type 言語 = "ja" | "en" | "fr";
const 言語ID: Record<言語, string> = { ja: "1", en: "2", fr: "5" };

type 商品 = {
  /** 〔商品ID-M1205-…〕の接尾 */
  s: string; base: string; suffix?: string; lang?: 言語; price: number;
  /** 〔商品規格ID-M1205-…〕の接尾（並び順に規格を作る）。省略すると [s] */
  classes?: string[]; tag?: boolean;
};
type 依頼 = {
  /** 〔入荷通知依頼ID-M1205-…〕の接尾 */
  id: string;
  /** 〔会員ID-M1205-…〕の接尾 */
  m: string; p: string; c?: string;
  /** 依頼日時・削除日時（日本時間） */
  at: string; deleted?: string;
  /** 商品単位（規格を指さない）の依頼。DBで足す */
  bulk?: boolean;
  /** 画面ではなくDBで足す */
  db?: boolean;
};
type 定義 = {
  seedId: string; sfx: string; members: string[]; shareMember?: boolean; names?: Record<string, [string, string]>;
  products: 商品[]; requests: 依頼[];
};

const DEF_AT = "2026-07-15 12:00:00";
const DEF_DEL = "2026-07-16 00:00:00";
const STATE_SP = "スライトリープレイド";

type 会員 = { mail: string; password: string; id: string };

async function createMember(browser: Browser, local: string, name: [string, string], issue: (m: string) => void): Promise<会員> {
  const mail = `${rc(local)}@example.test`;
  const password = `Passw0rd!${local}`;
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    await registerFrontMember(await context.newPage(), { 姓: name[0], 名: name[1], セイ: "シケンカイイン", メイ: "ニュウカツウチ", メール: mail, パスワード: password });
  } finally {
    await context.close();
  }
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const state = await customerStateByEmail(page, mail);
    if (state !== "本会員") throw new Error(`会員 ${mail} を登録したが、会員一覧で本会員にならない（${state ?? "見つからない"}）`);
    return customerIdByEmail(page, mail);
  });
  issue(`会員 ${mail} を登録した（会員ID ${id}）`);
  return { mail, password, id };
}

type 作った商品 = { productId: string; classIds: string[] };

async function createProducts(browser: Browser, d: 定義, issue: (m: string) => void): Promise<作った商品[]> {
  const code = (i: number, j: number) => rc(`M1205-${d.sfx}-P${i + 1}${j > 0 ? `-C${j + 1}` : ""}`);
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = await readExistingGoodsChildCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${d.seedId} のグッズ商品CSV登録`, fileName: `${d.seedId}.csv`, categoryId,
      lines: d.products.map((p, i) => ({
        code: code(i, 0), nameJp: 商品名(p.base, p.suffix), nameEn: rc(`M1205-${d.sfx}-EN${i + 1}`),
        values: { "基準価格": String(p.price), "販売価格": String(p.price), ...(p.lang && p.lang !== "ja" ? { "言語(ID)": 言語ID[p.lang] } : {}) },
      })),
      onWarning: (w) => issue(`${d.seedId}: グッズ商品CSV登録の警告「${w}」`),
      uploadWaitMs: 120_000,
    });
    const out: 作った商品[] = [];
    for (const [i, p] of d.products.entries()) {
      const first = code(i, 0);
      const productId = await openProductEditByCode(page, first);
      const rows = await classRowsFromProductEdit(page, productId);
      if (rows.length !== 1 || rows[0].商品コード !== first) throw new Error(`${d.seedId}: ${first} の取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
      const classIds = [rows[0].商品規格ID];
      if (rows[0].公開状態 !== "公開") await savePublishedClass(page, { productId, classId: rows[0].商品規格ID }, `${d.seedId}: ${first}`, issue);
      const n = (p.classes ?? [p.s]).length;
      for (let j = 1; j < n; j++) {
        await openClassList(page, productId);
        classIds.push(await addClass(page, productId, {
          言語: "日本語", 状態: STATE_SP, 商品コード: code(i, j), 基準価格: String(p.price), 販売価格: String(p.price), 買取価格: "10",
        }, `${d.seedId}: ${code(i, j)}`, issue));
      }
      if (p.tag) await 売上分析タグを付ける(page, productId, "タグT1", (m) => issue(`${d.seedId}: ${m}`));
      out.push({ productId, classIds });
    }
    return out;
  });
}

async function build(d: 定義, browser: Browser, notes: Notes): Promise<void> {
  const issue = (m: string) => reportSeedIssue(d.seedId, m);
  // 会員
  const real = d.shareMember ? [d.members[0]] : d.members;
  const mem = new Map<string, 会員>();
  for (const [i, s] of real.entries()) {
    mem.set(s, await createMember(browser, `m1205-${d.sfx.toLowerCase()}-m${i + 1}`, d.names?.[s] ?? ["試験会員", "入荷通知依頼"], issue));
  }
  const memberOf = (s: string): 会員 => (d.shareMember ? mem.get(d.members[0])! : mem.get(s)!);
  // 商品
  const made = await createProducts(browser, d, issue);
  const productOf = new Map(d.products.map((p, i) => [p.s, { def: p, made: made[i] }]));
  const classOf = (p: string, c?: string): { productId: string; classId: string } => {
    const x = productOf.get(p)!;
    const names = x.def.classes ?? [x.def.s];
    const j = c === undefined ? 0 : names.indexOf(c);
    if (j < 0) throw new Error(`${d.seedId}: 商品 ${p} に規格 ${c} が無い`);
    return { productId: x.made.productId, classId: x.made.classIds[j] };
  };
  // 依頼（画面）
  const players = new Map<string, string>();
  const playerOf = (m: 会員): string => { if (!players.has(m.id)) players.set(m.id, プレイヤーIDを引く(m.id)); return players.get(m.id)!; };
  const byMember = new Map<会員, 依頼[]>();
  for (const r of d.requests) byMember.set(memberOf(r.m), [...(byMember.get(memberOf(r.m)) ?? []), r]);
  const screenMissing = new Set<依頼>();
  for (const [m, rs] of byMember) {
    const screen = rs.filter((r) => !r.db && !r.bulk);
    if (screen.length === 0) continue;
    const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(context);
      const page = await context.newPage();
      page.setDefaultTimeout(60_000);
      const front = new FrontRestock(page);
      await front.login(m.mail, m.password);
      for (const r of screen) {
        const { productId, classId } = classOf(r.p, r.c);
        await front.openDetail(productId);
        const btn = front.classButton(classId);
        if ((await btn.count()) === 0) { screenMissing.add(r); issue(`商品ID ${productId} の商品詳細画面に商品規格ID ${classId} の入荷通知ボタンが無い。依頼はDBで足した`); continue; }
        const res = await front.press(btn);
        if (!res.通知が出た || !/設定/.test(res.通知の文)) throw new Error(`${d.seedId}: 商品規格ID ${classId} の通知ボタンを押しても依頼の完了の通知が出ない（${JSON.stringify(res)}）`);
        if (r.deleted) {
          await page.waitForTimeout(1500);
          await front.press(btn);
          await page.waitForTimeout(2500);
        }
      }
    } finally {
      await context.close();
    }
  }
  // 依頼日時・削除日時（DB）と控え
  for (const r of d.requests) {
    const m = memberOf(r.m);
    const player = playerOf(m);
    const del = r.deleted ?? null;
    if (r.bulk) {
      const { productId } = classOf(r.p, r.c);
      依頼を足す({ プレイヤーID: player, 商品ID: productId, 言語ID: 言語ID[productOf.get(r.p)!.def.lang ?? "ja"], 依頼日時: r.at, 削除日時: del });
      notes.set(`〔入荷通知依頼ID-M1205-${r.id}〕`, 依頼IDを引く(player, { 商品ID: productId }));
      continue;
    }
    const { classId } = classOf(r.p, r.c);
    if (r.db || screenMissing.has(r)) 依頼を足す({ プレイヤーID: player, 商品規格ID: classId, 依頼日時: r.at, 削除日時: del });
    else 規格の依頼日時を設定(player, classId, r.at, del);
    notes.set(`〔入荷通知依頼ID-M1205-${r.id}〕`, 依頼IDを引く(player, { 商品規格ID: classId }));
  }
  // 控え（商品・規格・会員）
  for (const p of d.products) {
    notes.set(`〔商品ID-M1205-${p.s}〕`, productOf.get(p.s)!.made.productId);
    (p.classes ?? [p.s]).forEach((cs, j) => notes.set(`〔商品規格ID-M1205-${cs}〕`, productOf.get(p.s)!.made.classIds[j]));
  }
  for (const s of d.members) notes.set(`〔会員ID-M1205-${s}〕`, memberOf(s).id);
  if (d.shareMember && d.members.length > 1) issue("シード表は会員を複数書くが、会員の数が結果に効かないので、会員1人が複数の商品へ依頼した形にした（〔会員ID-…〕はすべて同じ会員のID）");
}

function seed(d: 定義) {
  return ({ browser, notes }: { browser: Browser; notes: Notes }) => build(d, browser, notes);
}

const one = (sfx: string): { members: string[]; shareMember: true } => ({ members: [sfx], shareMember: true });

defineSeed("S-M12-05-KEYWORD-001", seed({
  seedId: "S-M12-05-KEYWORD-001", sfx: "KEYWORD-001", ...one("001"),
  products: [{ s: "001", base: "晴れる屋トレカ特選", suffix: "-001", price: 1000 }],
  requests: [{ id: "001", m: "001", p: "001", at: DEF_AT }],
}));

defineSeed("S-M12-05-KEYWORD-004", seed({
  seedId: "S-M12-05-KEYWORD-004", sfx: "KEYWORD-004", ...one("004"),
  products: [{ s: "004", base: "晴れる屋トレカ特選", price: 1000 }],
  requests: [{ id: "004", m: "004", p: "004", at: DEF_AT }],
}));

defineSeed("S-M12-05-LANGUAGE", seed({
  seedId: "S-M12-05-LANGUAGE", sfx: "LANGUAGE", members: ["共有言語A", "共有言語B", "共有言語C"], shareMember: true,
  products: [
    { s: "共有言語A", base: "言語確認商品", suffix: "JP", lang: "ja", price: 1000 },
    { s: "共有言語B", base: "言語確認商品", suffix: "EN", lang: "en", price: 2000 },
    { s: "共有言語C", base: "言語確認商品", suffix: "FR", lang: "fr", price: 3000 },
  ],
  requests: [
    { id: "共有言語A", m: "共有言語A", p: "共有言語A", at: "2026-06-01 12:00:00" },
    { id: "共有言語B", m: "共有言語B", p: "共有言語B", at: "2026-07-01 12:00:00" },
    { id: "共有言語C", m: "共有言語C", p: "共有言語C", at: "2026-08-01 12:00:00" },
  ],
}));

defineSeed("S-M12-05-DATE-006", seed({
  seedId: "S-M12-05-DATE-006", sfx: "DATE-006", members: ["006A", "006B"], shareMember: true,
  products: [
    { s: "006A", base: "依頼日境界", suffix: "当日", price: 1000 },
    { s: "006B", base: "依頼日境界", suffix: "翌日", price: 1000 },
  ],
  requests: [
    { id: "006A", m: "006A", p: "006A", at: "2026-07-31 23:59:59" },
    { id: "006B", m: "006B", p: "006B", at: "2026-08-01 00:00:00" },
  ],
}));

defineSeed("S-M12-05-PRICE", seed({
  seedId: "S-M12-05-PRICE", sfx: "PRICE", members: ["共有金額A", "共有金額B", "共有金額C", "共有金額D"], shareMember: true,
  products: (["A", "B", "C", "D"] as const).map((x, i) => ({ s: `共有金額${x}`, base: "販売金額境界", suffix: String([1000, 1200, 1500, 1600][i]), price: [1000, 1200, 1500, 1600][i] })),
  requests: (["A", "B", "C", "D"] as const).map((x) => ({ id: `共有金額${x}`, m: `共有金額${x}`, p: `共有金額${x}`, at: DEF_AT })),
}));

defineSeed("S-M12-05-KEYWORD-010", seed({
  seedId: "S-M12-05-KEYWORD-010", sfx: "KEYWORD-010", ...one("010"), names: { "010": ["検索", "太郎"] },
  products: [{ s: "010", base: "会員条件対象外商品", price: 1000 }],
  requests: [{ id: "010", m: "010", p: "010", at: DEF_AT }],
}));

defineSeed("S-M12-05-TAG-012", seed({
  seedId: "S-M12-05-TAG-012", sfx: "TAG-012", members: ["012A", "012B"], shareMember: true,
  products: [
    { s: "012A", base: "売上分析タグ確認", suffix: "あり", price: 1000, tag: true },
    { s: "012B", base: "売上分析タグ確認", suffix: "なし", price: 1000 },
  ],
  requests: [{ id: "012A", m: "012A", p: "012A", at: DEF_AT }, { id: "012B", m: "012B", p: "012B", at: DEF_AT }],
}));

const L = "ABCDEFGHIJK".split("");
defineSeed("S-M12-05-LIMIT-013", seed({
  seedId: "S-M12-05-LIMIT-013", sfx: "LIMIT-013", members: L.map((x) => `013${x}`), shareMember: true,
  products: L.map((x, i) => ({ s: `013${x}`, base: "表示件数確認商品", suffix: String(i + 1).padStart(2, "0"), price: 1000 })),
  requests: L.map((x, i) => ({ id: `013${x}`, m: `013${x}`, p: `013${x}`, at: DEF_AT, db: i > 0 })),
}));

defineSeed("S-M12-05-PENDING-014", seed({
  seedId: "S-M12-05-PENDING-014", sfx: "PENDING-014", ...one("014"),
  products: [{ s: "014", base: "集計確認通知待ち", price: 1000, classes: ["014A", "014B"] }],
  requests: [{ id: "014A", m: "014", p: "014", c: "014A", at: DEF_AT }, { id: "014B", m: "014", p: "014", c: "014B", at: DEF_AT }],
}));

defineSeed("S-M12-05-DELETED-015", seed({
  seedId: "S-M12-05-DELETED-015", sfx: "DELETED-015", ...one("015"),
  products: [{ s: "015", base: "集計確認削除", price: 1000, classes: ["015A", "015B"] }],
  requests: [{ id: "015A", m: "015", p: "015", c: "015A", at: DEF_AT, deleted: DEF_DEL }, { id: "015B", m: "015", p: "015", c: "015B", at: DEF_AT, deleted: DEF_DEL }],
}));

defineSeed("S-M12-05-BULK-016", seed({
  seedId: "S-M12-05-BULK-016", sfx: "BULK-016", ...one("016"),
  products: [{ s: "016", base: "商品単位通知確認", lang: "en", price: 1000 }],
  requests: [{ id: "016", m: "016", p: "016", at: DEF_AT, bulk: true }],
}));

defineSeed("S-M12-05-NONE-017", seed({
  seedId: "S-M12-05-NONE-017", sfx: "NONE-017", ...one("017"),
  products: [{ s: "017", base: "M1205-NONE-CONTROL-017", price: 1000 }],
  requests: [{ id: "017", m: "017", p: "017", at: DEF_AT }],
}));

defineSeed("S-M12-05-PENDING-018", seed({
  seedId: "S-M12-05-PENDING-018", sfx: "PENDING-018", ...one("018"),
  products: [{ s: "018", base: "集計確認通知待ち-018", price: 1000, classes: ["018A", "018B"] }],
  requests: [{ id: "018A", m: "018", p: "018", c: "018A", at: DEF_AT }, { id: "018B", m: "018", p: "018", c: "018B", at: DEF_AT }],
}));

defineSeed("S-M12-05-CSV-019", seed({
  seedId: "S-M12-05-CSV-019", sfx: "CSV-019", members: ["019A", "019B"], shareMember: true,
  products: [{ s: "019A", base: "CSV対象商品", price: 1000 }, { s: "019B", base: "CSV比較商品", price: 1000 }],
  requests: [{ id: "019A", m: "019A", p: "019A", at: DEF_AT }, { id: "019B", m: "019B", p: "019B", at: DEF_AT }],
}));

defineSeed("S-M12-05-DATEFROM-023", seed({
  seedId: "S-M12-05-DATEFROM-023", sfx: "DATEFROM-023", members: ["023A", "023B", "023C"], shareMember: true,
  products: [
    { s: "023A", base: "依頼日From境界", suffix: "前日", price: 1000 },
    { s: "023B", base: "依頼日From境界", suffix: "当日", price: 1000 },
    { s: "023C", base: "依頼日From境界", suffix: "翌日", price: 1000 },
  ],
  requests: [
    { id: "023A", m: "023A", p: "023A", at: "2026-07-14 12:00:00" },
    { id: "023B", m: "023B", p: "023B", at: "2026-07-15 12:00:00" },
    { id: "023C", m: "023C", p: "023C", at: "2026-07-16 12:00:00" },
  ],
}));

defineSeed("S-M12-05-DPPEND-024", seed({
  seedId: "S-M12-05-DPPEND-024", sfx: "DPPEND-024", members: ["024A", "024B"],
  products: [{ s: "024", base: "複数会員通知待ち", price: 1000 }],
  requests: [{ id: "024A", m: "024A", p: "024", at: DEF_AT }, { id: "024B", m: "024B", p: "024", at: DEF_AT }],
}));

defineSeed("S-M12-05-DPDEL-025", seed({
  seedId: "S-M12-05-DPDEL-025", sfx: "DPDEL-025", members: ["025A", "025B"],
  products: [{ s: "025", base: "複数会員削除済み", price: 1000 }],
  requests: [{ id: "025A", m: "025A", p: "025", at: DEF_AT, deleted: DEF_DEL }, { id: "025B", m: "025B", p: "025", at: DEF_AT, deleted: DEF_DEL }],
}));

defineSeed("S-M12-05-DPMIX-026", seed({
  seedId: "S-M12-05-DPMIX-026", sfx: "DPMIX-026", ...one("026"), names: { "026": ["M1205-026-A", "太郎"] },
  products: [{ s: "026A", base: "混在確認", suffix: "通知待ち", price: 1000 }, { s: "026B", base: "混在確認", suffix: "削除済み", price: 1000 }],
  requests: [{ id: "026A", m: "026", p: "026A", at: DEF_AT }, { id: "026B", m: "026", p: "026B", at: DEF_AT, deleted: DEF_DEL }],
}));

defineSeed("S-M12-05-CBBULKDEL-030", seed({
  seedId: "S-M12-05-CBBULKDEL-030", sfx: "CBBULKDEL-030", members: ["030A", "030B"],
  products: [{ s: "030", base: "組合せ確認商品単位削除", price: 1000 }],
  requests: [
    { id: "030A", m: "030A", p: "030", at: DEF_AT, deleted: DEF_DEL, bulk: true },
    { id: "030B", m: "030B", p: "030", at: DEF_AT, deleted: DEF_DEL, bulk: true },
  ],
}));

defineSeed("S-M12-05-CBSINGLEPEND-031", seed({
  seedId: "S-M12-05-CBSINGLEPEND-031", sfx: "CBSINGLEPEND-031", ...one("031"),
  products: [{ s: "031", base: "組合せ確認単一規格待ち", price: 1000 }],
  requests: [{ id: "031", m: "031", p: "031", at: DEF_AT }],
}));

defineSeed("S-M12-05-CBMULTIPEND-032", seed({
  seedId: "S-M12-05-CBMULTIPEND-032", sfx: "CBMULTIPEND-032", members: ["032A", "032B"],
  products: [{ s: "032", base: "組合せ確認複数規格複数会員待ち", price: 1000, classes: ["032A", "032B"] }],
  requests: [
    { id: "032A1", m: "032A", p: "032", c: "032A", at: DEF_AT }, { id: "032A2", m: "032A", p: "032", c: "032B", at: DEF_AT },
    { id: "032B1", m: "032B", p: "032", c: "032A", at: DEF_AT }, { id: "032B2", m: "032B", p: "032", c: "032B", at: DEF_AT },
  ],
}));

defineSeed("S-M12-05-CBMULTIMIX-033", seed({
  seedId: "S-M12-05-CBMULTIMIX-033", sfx: "CBMULTIMIX-033", ...one("033"),
  products: [{ s: "033", base: "組合せ確認複数規格併存", price: 1000, classes: ["033A", "033B"] }],
  requests: [{ id: "033A", m: "033", p: "033", c: "033A", at: DEF_AT }, { id: "033B", m: "033", p: "033", c: "033B", at: DEF_AT, deleted: DEF_DEL }],
}));
