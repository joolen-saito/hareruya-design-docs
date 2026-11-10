/**
 * M05-11 受注情報編集の続き（-o）のシード。正本: cases/M05-11_seed_data.tsv
 * 仕分け直し（e2e/review/not_runnable_seed_recheck2.tsv。2026-11-10）で「流せる見込み」になったもの。
 *
 * 作り方の決まり（依頼者決定 2026-11-10「E2E が作った行だけ DB に書いてよい」）:
 * - 商品・会員・受注・ポイント履歴は、シード表のとおり画面で作る（商品はグッズ商品CSV登録＋在庫編集で入庫・別の管理者が承認。
 *   会員はフロントの会員登録＋本登録のメール。受注はフロントのご注文手続き。ポイント履歴は会員のポイント履歴追加）。
 * - 画面で作れない状態（キャンセル日・受注日・商品規格別の週間販売数・会員の最終購入日時・累計注文金額・受注のポイントの付帯情報）だけを、
 *   画面で作った E2E の行へ DB で書き足す（db/m05_11_o.ts → lib/db_write.ts）。
 * - 商品コード・商品名・会員のメールの前半には実行の印を付ける（依頼者決定 2026-10-28）。注文者姓など値そのものを確かめる項目には付けない。
 * - 店舗A は本店（seeds/m05-11.ts と同じ解釈）。配送方法「宅配便」は開発環境に無いので、注文の部品の既定（出荷指示リストから除外されない配送方法）で選ぶ。
 * - 商品は、既存の販売中の商品（ほかの方のデータ）を使わず、ケースごとに作る（購入で在庫を減らすため）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 商品の在庫 } from "../db/m05_11";
import { 受注のポイント } from "../db/m05_11_n";
import {
  会員の最終購入日時を書き足す, 会員の累計注文金額を書き足す, 受注のキャンセル日を書き足す, 受注のポイント付帯情報を書き足す,
  受注のポイント履歴, 受注日を前へずらす, 週間販売数, 週間販売数を書き足す, 受注の日付を書き足す,
} from "../db/m05_11_o";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { 商品を作って入庫する } from "../pages/admin/f04_setup";
import { OrderEditPage, 会員IDを一覧から読む, ポイントを付与する } from "../pages/admin/m05_11_order_edit";
import { 会員が注文する, 会員を用意する } from "../pages/front/m05_11_order";
import { FrontMember } from "../pages/front/member_entry";
import { M0511_ADMIN_A, 店舗Aの店名, 試験会員 } from "./m05-11";

const note = (seedId: string, m: string): void => console.log(`[${seedId}] ${m}`);
const onDialog = (seedId: string) => (m: string) => note(seedId, `ダイアログを受け入れた: ${m}`);

/** 商品を1点作って本店・EC-CUBE に入庫し、会員を用意してその商品を数量で注文する。注文番号を返す */
async function 商品を作って会員が注文する(browser: Browser, seedId: string, p: { 商品コード: string; 商品名: string; 価格?: string; 入庫数?: number; 数量?: number }, m: FrontMember): Promise<string> {
  const issue = (msg: string) => reportSeedIssue(seedId, msg);
  const made = await 商品を作って入庫する(browser, seedId, [{ 商品コード: p.商品コード, 商品名: p.商品名, 価格: p.価格 ?? "1000", 入庫数: p.入庫数 ?? 10, 入庫方法: "在庫編集" }], issue);
  await 会員を用意する(browser, m);
  const r = await 会員が注文する(browser, m, [{ 商品ID: made[0].productId, 数量: p.数量 ?? 1 }], seedId);
  note(seedId, `注文で選んだ配送方法: ${r.配送方法}`);
  return r.注文番号;
}

// ---- キャンセルの組合せ（CBCANC 255〜272） ----

/** キャンセル日の入り方: 既に入っている（2026-08-24）／新たに入る（受注日は試験実行日の n 日前） */
export type キャンセルの組 = { 既に: boolean; 日数: number; 二件: boolean };
export const キャンセルの組合せ: Record<string, キャンセルの組> = {
  "255": { 既に: true, 日数: 0, 二件: true }, "256": { 既に: true, 日数: 0, 二件: false },
  "257": { 既に: false, 日数: 0, 二件: true }, "258": { 既に: false, 日数: 0, 二件: false },
  "259": { 既に: false, 日数: 1, 二件: true }, "260": { 既に: false, 日数: 1, 二件: false },
  "261": { 既に: false, 日数: 2, 二件: true }, "262": { 既に: false, 日数: 2, 二件: false },
  "263": { 既に: false, 日数: 5, 二件: true }, "264": { 既に: false, 日数: 5, 二件: false },
  "265": { 既に: false, 日数: 20, 二件: true }, "266": { 既に: false, 日数: 20, 二件: false },
  "267": { 既に: false, 日数: 60, 二件: true }, "268": { 既に: false, 日数: 60, 二件: false },
  "269": { 既に: false, 日数: 120, 二件: true }, "270": { 既に: false, 日数: 120, 二件: false },
  "271": { 既に: false, 日数: 300, 二件: true }, "272": { 既に: false, 日数: 300, 二件: false },
};
export const キャンセル日の既定 = "2026-08-24";
export const キャンセルの会員 = (n: string): FrontMember => 試験会員(`cbm0511-${n}`, "試験姓", "試験名", "example.test");
export const キャンセルの商品コード = (n: string): string => rc(`M0511-CB${n}-ITM`);

for (const [n, c] of Object.entries(キャンセルの組合せ)) {
  const seedId = `S-M05-11-CBCANC-${n}`;
  defineSeed(seedId, { needs: ["S-M05-11-ADM-A"] }, async ({ browser, notes }) => {
    const code = キャンセルの商品コード(n);
    const m = キャンセルの会員(n);
    const no = await 商品を作って会員が注文する(browser, seedId, { 商品コード: code, 商品名: rc(`組合せキャンセル商品${n}`) }, m);
    const shop = await 店舗Aの店名(browser);
    // 受注情報編集でポイント還元率0・ポイント使用0にして登録する（ステータスは新規受付のまま）
    await withAdminSession(browser, M0511_ADMIN_A, async (page) => {
      const p = new OrderEditPage(page);
      await p.openByOrderNo(no, shop);
      await p.ポイント設定("0", "0");
      await p.受注情報を登録する(onDialog(seedId));
    });
    // 会員のポイント履歴追加: 注文番号なしで +1000、注文番号つきで +50（二件の組は続けて -50）
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const cid = await 会員IDを一覧から読む(page, m.メール);
      await ポイントを付与する(page, cid, 1000);
      await ポイントを付与する(page, cid, 50, no);
      if (c.二件) await ポイントを付与する(page, cid, -50, no);
    });
    // 画面で作れない状態だけ DB で書き足す（E2E の受注・商品規格の行だけ）
    if (c.既に) 受注のキャンセル日を書き足す(seedId, no, m.メール, `${キャンセル日の既定}T03:00:00Z`);
    if (c.日数 > 0) note(seedId, `受注日を ${c.日数} 日前へずらした: ${受注日を前へずらす(seedId, no, m.メール, c.日数)}`);
    週間販売数を書き足す(seedId, code, 5);
    // 出来た状態を確かめる（シード表の状態・属性）
    const stock = 商品の在庫(code).在庫;
    if (stock !== 9) throw new Error(`${seedId}: 在庫が ${stock}（9 のはず）`);
    const pt = 受注のポイント(no).会員の保持;
    if (pt !== 1000) throw new Error(`${seedId}: 会員の保持ポイントが ${pt}（1000 のはず）`);
    const hist = 受注のポイント履歴(no, m.メール);
    const want = c.二件 ? [50, -50] : [50];
    if (JSON.stringify(hist) !== JSON.stringify(want)) throw new Error(`${seedId}: 受注のポイント履歴が ${JSON.stringify(hist)}（${JSON.stringify(want)} のはず）`);
    const sales = 週間販売数(code);
    if (sales.length !== 8 || sales.some((v) => v !== 5)) throw new Error(`${seedId}: 週間販売数が ${JSON.stringify(sales)}（すべて5のはず）`);
    notes.set(`〔受注番号-M0511-${n}〕`, no);
  });
}

// ---- 共有の受注（BASE-READ）・会員（MEMBER-READ）・付帯情報なしの受注（NULL-READ）・店舗B の管理者（ADM-B） ----

/** MEMBER-READ の1人目・2人目（姓=会員姓・名=会員名。メールの前半に実行の印） */
export const 会員A = (): FrontMember => 試験会員("m0511-member-a", "会員姓", "会員名", "example.com");
export const 会員B = (): FrontMember => 試験会員("m0511-member-b", "会員姓", "会員名", "example.com");
export const 最終購入日時 = "2026-08-31 12:34:56";

defineSeed("S-M05-11-MEMBER-READ", { needs: ["S-M05-11-ADM-A"] }, async ({ browser, notes }) => {
  for (const [m, key] of [[会員A(), "〔会員ID-M0511-共有A〕"], [会員B(), "〔会員ID-M0511-共有B〕"]] as const) {
    await 会員を用意する(browser, m);
    const id = await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを一覧から読む(page, m.メール));
    notes.set(key, id);
  }
  // 1人目の最終購入日時は、BASE-READ の購入のあとに書き足す（購入で上書きされるため。BASE-READ が行う）
});

/** BASE-READ の受注の値（シード表の状態・属性） */
export const BASE = {
  姓: "試験姓", 名: "試験名", セイ: "しけんせい", メイ: "しけんめい", 会社名: "試験会社", 郵便1: "123", 郵便2: "4567", 海外郵便: "12345",
  都道府県: "東京都", 住所1: "千代田1", 住所2: "千代田2", 住所3: "千代田3", メール: "base@example.com",
  電話: ["03", "1234", "5678"], FAX: ["03", "1234", "5679"], 支払: "クレジットカード", 還元率: "5", 使用: "100", 発生: 50,
  お届け日: "2026-10-01", お届け時間: "午前", 送り状: "SLIP-001", 合計: 3000, 累計: 10000, 問い合わせ: "初期問い合わせ",
};
export const BASEの商品コード = (k: "A" | "B"): string => rc(`BASE-${k}`);

defineSeed("S-M05-11-BASE-READ", { needs: ["S-M05-11-ADM-A", "S-M05-11-MEMBER-READ"] }, async ({ browser, notes, seed }) => {
  const seedId = seed.シードID;
  const issue = (msg: string) => reportSeedIssue(seedId, msg);
  const made = await 商品を作って入庫する(browser, seedId, (["A", "B"] as const).map((k) => ({
    商品コード: BASEの商品コード(k), 商品名: rc(`基本商品${k}`), 価格: "1000", 入庫数: 10, 入庫方法: "在庫編集" as const,
  })), issue);
  const m = 会員A();
  await 会員を用意する(browser, m);
  const r = await 会員が注文する(browser, m, [{ 商品ID: made[0].productId, 数量: 2 }, { 商品ID: made[1].productId, 数量: 1 }], seedId);
  const no = r.注文番号;
  note(seedId, `注文で選んだ配送方法: ${r.配送方法}`);
  const shop = await 店舗Aの店名(browser);
  await withAdminSession(browser, M0511_ADMIN_A, async (page) => {
    const p = new OrderEditPage(page);
    await p.openByOrderNo(no, shop);
    const fill = async (id: string, v: string) => { await page.locator(`#order_${id}`).fill(v, { timeout: 20_000 }); };
    const fillBoth = async (id: string, v: string) => { await fill(id, v); await page.locator(`#order_Shipping_${id}`).fill(v, { timeout: 20_000 }); };
    await p.注文者情報を開く();
    await p.お届け先情報を開く();
    for (const [id, v] of [["name_name01", BASE.姓], ["name_name02", BASE.名], ["kana_kana01", BASE.セイ], ["kana_kana02", BASE.メイ], ["company_name", BASE.会社名],
      ["postalCode_postalCode01", BASE.郵便1], ["postalCode_postalCode02", BASE.郵便2], ["address_addr01", BASE.住所1], ["address_addr02", BASE.住所2], ["address_addr03", BASE.住所3],
      ["tel_tel01", BASE.電話[0]], ["tel_tel02", BASE.電話[1]], ["tel_tel03", BASE.電話[2]],
      ["fax_fax01", BASE.FAX[0]], ["fax_fax02", BASE.FAX[1]], ["fax_fax03", BASE.FAX[2]]] as const) {
      if ((await page.locator(`#order_${id}`).count()) > 0) await fillBoth(id, v);
      else issue(`受注情報編集の入力欄「${id}」が無い（値「${v}」を入れていない）`);
    }
    for (const [id, v] of [["abroad_postal_code", BASE.海外郵便], ["email", BASE.メール]] as const) {
      if ((await page.locator(`#order_${id}`).count()) > 0) await fill(id, v); else issue(`受注情報編集の入力欄「${id}」が無い（値「${v}」を入れていない）`);
    }
    for (const sel of ["#order_address_pref", "#order_Shipping_address_pref"]) {
      if ((await page.locator(sel).count()) > 0) await page.locator(sel).selectOption({ label: BASE.都道府県 }, { timeout: 20_000 });
    }
    await page.locator("#order_message").fill(BASE.問い合わせ, { timeout: 20_000 }).catch(() => issue("問い合わせの欄が無い"));
    await p.お支払情報を開く();
    const pay = page.locator("#order_Payment");
    const opts = await pay.locator("option").allTextContents();
    const hit = opts.map((t) => t.trim()).find((t) => t === BASE.支払) ?? opts.map((t) => t.trim()).find((t) => t.startsWith(BASE.支払));
    if (hit) await pay.selectOption({ label: hit }); else issue(`変更後お支払方法に「${BASE.支払}」が無い（${opts.map((t) => t.trim()).join("、")}）`);
    if (hit && hit !== BASE.支払) issue(`変更後お支払方法は「${hit}」を選んだ（シード表は「${BASE.支払}」）`);
    await p.ポイント設定(BASE.還元率, BASE.使用);
    // お届け日・お届け時間・送り状No.
    const date = page.locator("#order_Shipping_shipping_delivery_date");
    if ((await date.count()) > 0) await date.fill(BASE.お届け日, { timeout: 20_000 }).catch(async () => { await date.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, BASE.お届け日); });
    else issue("お届け日の入力欄が無い");
    const time = page.locator("#order_Shipping_DeliveryTime");
    if ((await time.count()) > 0) {
      const ts = (await time.locator("option").allTextContents()).map((t) => t.trim());
      if (ts.includes(BASE.お届け時間)) await time.selectOption({ label: BASE.お届け時間 }); else issue(`変更後お届け時間に「${BASE.お届け時間}」が無い（${ts.join("、")}）`);
    }
    const slip = page.locator("#order_invoiceNumber");
    if ((await slip.count()) > 0) await slip.fill(BASE.送り状, { timeout: 20_000 }); else issue("送り状No.の入力欄が無い");
    // 受注金額が3000になるよう、送料・手数料を0、明細の価格を数量2×1000・数量1×1000 のままにする（小計3000）
    await page.locator("#order_delivery_fee_total").fill("0", { timeout: 20_000 });
    await page.locator("#order_charge").fill("0", { timeout: 20_000 });
    await page.locator("#order_discount").fill("0", { timeout: 20_000 });
    const warns = await p.受注情報を登録する(onDialog(seedId));
    for (const w of warns) issue(`受注情報の保存の警告「${w}」`);
  });
  // 画面で作れない値だけ書き足す: 発生ポイント50（登録のたびに計算し直される）・会員の累計注文金額10000・1人目の最終購入日時（MEMBER-READ）
  受注のポイント付帯情報を書き足す(seedId, no, m.メール, { 発生: BASE.発生 });
  会員の累計注文金額を書き足す(seedId, m.メール, BASE.累計);
  会員の最終購入日時を書き足す(seedId, m.メール, `${最終購入日時.replace(" ", "T")}+09:00`);
  会員の最終購入日時を書き足す(seedId, 会員B().メール, null);
  notes.set("〔受注番号-M0511-共有BASE〕", no);
  // シード表は BASE-READ でも注文者の会員IDを〔会員ID-M0511-共有A〕として控えると定める（MEMBER-READ が控えた番号と同じ）
  notes.set("〔会員ID-M0511-共有A〕", await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを一覧から読む(page, m.メール)));
});

/** NULL-READ: 受注のポイント付帯情報（発生・使用・付与率）と送り状No.・ポイント連携エラーが未設定の受注 */
export const NULLの会員 = (): FrontMember => 試験会員("m0511-共有NULL", "試験姓", "試験名", "example.com");
defineSeed("S-M05-11-NULL-READ", { needs: ["S-M05-11-ADM-A"] }, async ({ browser, notes, seed }) => {
  const seedId = seed.シードID;
  const m = NULLの会員();
  const no = await 商品を作って会員が注文する(browser, seedId, { 商品コード: rc("M0511-NULL-ITM"), 商品名: rc("付帯情報なし商品") }, m);
  受注のポイント付帯情報を書き足す(seedId, no, m.メール, { 発生: null, 使用: null, 付与率: null });
  notes.set("〔受注番号-M0511-共有NULL〕", no);
});

/**
 * ADM-B: 店舗Bだけを編集できる管理者（ログインID m0511_admin_b）。
 * シードでの解釈: 店舗B は、開発環境の既存の支店「トーナメントセンター 大阪」（店舗ID 5。F04 の E2E も使う）を当てる（店舗A=本店と別の店舗で、新しく作らない）。
 * 権限は ADM-A と同じ「システム管理者」（受注管理の画面を使える）。編集可能店舗を店舗Bだけにする。
 */
export const M0511_ADMIN_B = { loginId: "m0511_admin_b", password: "Passw0rd!M0511B" };
defineSeed("S-M05-11-ADM-B", { needs: ["S-M05-11-ENV"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const shopB = await storeNameById(page, "5");
    await ensureMember(page, {
      名前: "M0511管理者B", 所属店舗: shopB, ログインID: M0511_ADMIN_B.loginId, メールアドレス: "m0511_admin_b@example.test",
      パスワード: M0511_ADMIN_B.password, 権限: "システム管理者", デフォルト検索表示店舗: shopB, 編集可能店舗: [shopB],
    });
  });
});

// ---- 日付のクリア（DATES-011・012・013）・累計注文金額（BASE-041） ----
export const 日付の会員 = (n: string): FrontMember => 試験会員(`m0511-${n}`, "試験姓", "試験名", "example.com");
export const 日付の商品コード = (n: string): string => rc(`DATES-ITEM-${n}`);
export const 日付011 = { ピック中: "2026-08-20", 入金日: "2026-08-21", 出荷指示日: "2026-08-22", 出荷日: "2026-08-23", キャンセル日: "2026-08-24", 店頭予約日: "2026-08-25" } as const;
const 昼 = (d: string): string => `${d}T03:00:00Z`;

defineSeed("S-M05-11-DATES-011", { needs: ["S-M05-11-ADM-A"] }, async ({ browser, notes, seed }) => {
  const m = 日付の会員("011");
  const no = await 商品を作って会員が注文する(browser, seed.シードID, { 商品コード: 日付の商品コード("011"), 商品名: rc("日付確認商品011") }, m);
  受注の日付を書き足す(seed.シードID, no, m.メール, Object.fromEntries(Object.entries(日付011).map(([k, d]) => [k, 昼(d)])));
  notes.set("〔受注番号-M0511-011〕", no);
});

defineSeed("S-M05-11-DATES-012", { needs: ["S-M05-11-ADM-A"] }, async ({ browser, notes, seed }) => {
  const m = 日付の会員("012");
  const no = await 商品を作って会員が注文する(browser, seed.シードID, { 商品コード: 日付の商品コード("012"), 商品名: rc("日付確認商品012"), 数量: 2 }, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ポイントを付与する(page, await 会員IDを一覧から読む(page, m.メール), 1000);
  });
  受注の日付を書き足す(seed.シードID, no, m.メール, { キャンセル日: 昼("2026-08-24") });
  const stock = 商品の在庫(日付の商品コード("012")).在庫;
  if (stock !== 8) throw new Error(`${seed.シードID}: 在庫が ${stock}（8 のはず）`);
  const pt = 受注のポイント(no).会員の保持;
  if (pt !== 1000) throw new Error(`${seed.シードID}: 会員の保持ポイントが ${pt}（1000 のはず）`);
  notes.set("〔受注番号-M0511-012〕", no);
});

defineSeed("S-M05-11-DATES-013", { needs: ["S-M05-11-ADM-A"] }, async ({ browser, notes, seed }) => {
  const m = 日付の会員("013");
  const no = await 商品を作って会員が注文する(browser, seed.シードID, { 商品コード: 日付の商品コード("013"), 商品名: rc("日付確認商品013") }, m);
  受注の日付を書き足す(seed.シードID, no, m.メール, { 入金日: 昼("2026-08-21") });
  notes.set("〔受注番号-M0511-013〕", no);
});

defineSeed("S-M05-11-BASE-041", { needs: ["S-M05-11-ADM-A"] }, async ({ browser, notes, seed }) => {
  const seedId = seed.シードID;
  const m = 日付の会員("041");
  // 価格1000・数量1で注文し、受注情報編集で価格を3000（送料・手数料0・値引き0）にして受注金額を3000にする
  const no = await 商品を作って会員が注文する(browser, seedId, { 商品コード: rc("BASE041-ITEM"), 商品名: rc("累計確認商品041") }, m);
  const shop = await 店舗Aの店名(browser);
  await withAdminSession(browser, M0511_ADMIN_A, async (page) => {
    const p = new OrderEditPage(page);
    await p.openByOrderNo(no, shop);
    await p.先頭明細の価格("3000");
    await page.locator("#order_delivery_fee_total").fill("0", { timeout: 20_000 });
    await page.locator("#order_charge").fill("0", { timeout: 20_000 });
    await page.locator("#order_discount").fill("0", { timeout: 20_000 });
    for (const w of await p.受注情報を登録する(onDialog(seedId))) reportSeedIssue(seedId, `受注情報の保存の警告「${w}」`);
  });
  会員の累計注文金額を書き足す(seedId, m.メール, 10000);
  notes.set("〔受注番号-M0511-041〕", no);
});
