/**
 * M05-11 受注情報編集の続き（-q）のシード。正本: cases/M05-11_seed_data.tsv
 * 型は seeds/m05-11-f.ts（商品→入庫→会員登録→注文→受注番号を控え→整える）と同じ。
 *
 * 作り方の決まり（依頼者決定 2026-11-10「E2E が作った行だけ DB に書いてよい」）:
 * - 商品・会員・受注は画面で作る。画面で作れない状態（ゲスト購入・対応状況「引渡し済み」・注文確定日の未登録・スマレジ取引ID・
 *   ポイント連携エラー・手動変更履歴を1件にする・商品の在庫無制限）だけを、画面で作った印つきの受注・商品へ DB で書き足す。
 * - 受注ステータス「新規受付」は「入金待ち」、「引き渡し済み」は「引渡し済み」、配送方法「宅配便」は注文時に選べる先頭の配送方法で代える。
 * - QF 系（QF-ADM・QF-ORDER-199・200）は、シード表の固定のログインID・メールアドレス・パスワードをそのまま使う（共有の値）。
 *   商品の商品コード・商品名には実行の印を付ける（注記に残す）。
 */
import { 受注ID, 受注を整える } from "../db/m05_01_order_write";
import { 在庫無制限にする, 最初の手動変更履歴を消す, 注文確定日を設定, ゲスト購入にする } from "../db/m05_11_write";
import { ポイント連携エラーを設定 } from "../db/m05_11_q";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { OrderEditPage } from "../pages/admin/m05_11_order_edit";
import { メールで受注を開く } from "../pages/admin/m05_11_order_edit";
import { 会員が注文する, 会員を用意する } from "../pages/front/m05_11_order";
import { FrontMember } from "../pages/front/member_entry";
import { defineSeed } from "./current_seed";
import { M0511_ADMIN_A, 店舗Aの店名 } from "./m05-11";
import { 商品, 商品IDの控え, 商品を用意する, 商品注文のシード as 商品注文のシード本体 } from "./m05-11-f";
import { MAIN_DEFINED } from "./main_defined";

const 記録 = (seedId: string, m: string) => reportSeedIssue(seedId, m);
const 単品 = (code: string, name: string, 入庫: { 数量: number; 仕入単価: string }[] = [{ 数量: 10, 仕入単価: "100" }]): 商品 => ({ code, name, 入庫 });
const 引渡済 = ["引渡し済み", "引き渡し済み"];
const 商品注文のシード: typeof 商品注文のシード本体 = (seedId, s) => { if (!MAIN_DEFINED.has(seedId)) 商品注文のシード本体(seedId, s); };

/** 受注情報編集のお支払情報で、変更後お支払方法に「クレジットカード」を選ぶ（共有の BASE-READ と同じ選び方） */
export async function クレジットカードを選ぶ(p: OrderEditPage, seedId: string): Promise<void> {
  await p.お支払情報を開く();
  const pay = p.page.locator("#order_Payment");
  const opts = (await pay.locator("option").allTextContents()).map((t) => t.trim());
  const hit = opts.find((t) => t === "クレジットカード") ?? opts.find((t) => t.startsWith("クレジットカード"));
  if (!hit) throw new Error(`${seedId}: 変更後お支払方法に「クレジットカード」が無い（${opts.join("、")}）`);
  await pay.selectOption({ label: hit });
  if (hit !== "クレジットカード") 記録(seedId, `変更後お支払方法は「${hit}」を選んだ（シード表は「クレジットカード」）`);
}

// ---- 支払方法の変更（075）／お支払情報の履歴表示（137） ----
商品注文のシード("S-M05-11-PAYMENT-075", {
  番号: "075", メール前半: "m0511-075", 商品: [単品("PAYM-ITM-075", "支払方法編集確認商品")], 注文: [{ code: "PAYM-ITM-075", 数量: 1 }], ポイント: 1000,
  整える: async (p) => { await クレジットカードを選ぶ(p, "S-M05-11-PAYMENT-075"); await p.ポイント設定("5", "100"); },
});
商品注文のシード("S-M05-11-HISTP-137", {
  番号: "137", メール前半: "m0511-137", 商品: [単品("HISTP-ITM-137", "支払履歴確認商品")], 注文: [{ code: "HISTP-ITM-137", 数量: 1 }],
  整える: async (p) => { await クレジットカードを選ぶ(p, "S-M05-11-HISTP-137"); },
});

// ---- 履歴画面の入力欄（143）。ショップ用メモ欄・スマレジメモ・ポイント連携エラーを持つ手動変更履歴が1件 ----
商品注文のシード("S-M05-11-HISTR-143", {
  番号: "143", メール前半: "m0511-143", 商品: [単品("HISTR-ITM-143", "履歴入力欄確認商品")], 注文: [{ code: "HISTR-ITM-143", 数量: 1 }],
  注文後: async (browser, seedId, { 注文番号 }) => {
    await withAdminSession(browser, M0511_ADMIN_A, async (page) => {
      const p = new OrderEditPage(page);
      await p.openByOrderNo(注文番号, await 店舗Aの店名(browser));
      await p.note.fill("履歴メモ143");
      await page.locator("#order_smaregi_memo").fill("履歴スマレジメモ143", { timeout: 20_000 });
      await p.受注情報を登録する(() => undefined);
    });
    // ポイント連携エラーは受注情報編集の画面では入力できない欄（非活性）なので、2回目の登録の前に DB で値を入れる
    ポイント連携エラーを設定(受注ID(注文番号), "履歴エラー143");
    記録(seedId, "ポイント連携エラーは画面で入力できない欄のため、2回目の登録の前にDBで「履歴エラー143」を入れた");
  },
  整える: async (p) => { await p.注文者情報を開く(); await p.問い合わせ.fill("履歴143の問い合わせ"); },
  最後に: async (_b, seedId, { 注文番号 }) => { 最初の手動変更履歴を消す(受注ID(注文番号)); 記録(seedId, "DBで1回目の登録でできた手動変更履歴を削除した（手動変更履歴を1件にする）"); },
});

// ---- 受注ステータス（249）。ゲスト購入・変更前の対応状況は引渡し済み・注文確定日は未登録 ----
商品注文のシード("S-M05-11-CBP4ST-249", {
  番号: "249", メール前半: "cbm0511-249", 商品: [単品("CBM0511-249-X", "ステータス確認商品249")], 注文: [{ code: "CBM0511-249-X", 数量: 1 }],
  最後に: async (_b, seedId, { 注文番号 }) => {
    const id = 受注ID(注文番号);
    ゲスト購入にする(id);
    受注を整える(id, { 対応状況: 引渡済 });
    注文確定日を設定(id, null);
    記録(seedId, "ゲスト購入は、会員の注文を画面で作ったあと、DBで受注の会員を外して作った。対応状況「引き渡し済み」は「引渡し済み」で、DBで設定した（画面の変更後のステータスは経由しない）。注文確定日は未登録（DBで空にした）");
  },
});

// ---- スマレジ取引の受注（150）。スマレジ取引IDを持つ受注 ----
商品注文のシード("S-M05-11-SMAITEM-150", {
  番号: "150", メール前半: "m0511-150", 商品: [単品("SMAITEM-ITM-150", "スマレジ項目確認商品")], 注文: [{ code: "SMAITEM-ITM-150", 数量: 1 }],
  注文番号の呼び名: "〔受注番号-M0511-150〕",
  最後に: async (_b, seedId, { 注文番号 }) => {
    受注を整える(受注ID(注文番号), { スマレジ取引ID: rc("TRX-M0511-150") });
    記録(seedId, "スマレジ取引は画面で作れないため、画面で作った受注へDBでスマレジ取引IDを書き足した。受注番号は画面が振った番号のまま（シード表の M0511-150-ORD ではない）");
  },
});

// ---- QF（固定のログインID・メール・パスワードを使う） ----
export const QF管理者: Account = { loginId: "qf-m0511-admin", password: "Passw0rd-QFM0511" };
defineSeed("S-M05-11-QF-ADM", async ({ browser, seed }) => {
  await ensureM05Admin(browser, { 名前: "M05-11QF管理者", account: QF管理者, メール: "qf-m0511-admin@example.test" });
  記録(seed.シードID, "権限は、受注情報編集を操作できる「システム管理者」にした（正本に権限の名前が無い）。所属店舗・編集可能店舗は本店（店舗ID 1）");
});
export const QF会員 = (n: "001" | "002"): FrontMember => ({
  姓: "QF会員", 名: n, セイ: "キューエフカイイン", メイ: "テスト", メール: `qf-m0511-${n}@example.test`, パスワード: n === "001" ? "Passw0rd-QF0511A" : "Passw0rd-QF0511B",
});

/** QF の注文: 商品を作り（在庫無制限）、会員が1点を数量1で注文して、注文番号を控える */
function QF注文のシード(seedId: string, n: "001" | "002", 控え: string, 商品定義: { code: string; name: string }[], 注文の商品: string): void {
  defineSeed(seedId, { needs: ["S-M05-11-ADM-A", "S-M05-11-QF-ADM"] }, async ({ browser, notes, seed }) => {
    await 商品を用意する(browser, seed.シードID, 商品定義.map((d) => 単品(d.code, d.name, [])));
    for (const d of 商品定義) 在庫無制限にする(rc(d.code));
    記録(seed.シードID, "商品の在庫数無制限は、画面で指定できないため、画面で作った商品の規格へDBで設定した。商品コード・商品名には実行の印を付けた。受注ステータス「入金待ち」・配送方法は注文時に選べる先頭の配送方法（銀行振込）");
    const m = QF会員(n);
    await 会員を用意する(browser, m);
    const r = await 会員が注文する(browser, m, [{ 商品ID: 商品IDの控え(注文の商品), 数量: 1 }], seed.シードID);
    const shop = await 店舗Aの店名(browser);
    const no = await withAdminSession(browser, M0511_ADMIN_A, async (page) => (await メールで受注を開く(page, m.メール, shop, seed.シードID)).注文番号);
    if (no !== r.注文番号) 記録(seed.シードID, `注文確定画面の注文番号（${r.注文番号}）と受注一覧の注文番号（${no}）が違う。受注一覧の番号を控えた`);
    notes.set(控え, no);
  });
}
QF注文のシード("S-M05-11-QF-ORDER-199", "001", "〔注文番号-M0511-QF001〕", [{ code: "QF-M0511-001", name: "QF受注編集商品-001" }], "QF-M0511-001");
QF注文のシード("S-M05-11-QF-ORDER-200", "002", "〔注文番号-M0511-QF002〕", [{ code: "QF-M0511-002A", name: "QF元商品-002" }, { code: "QF-M0511-002B", name: "QF追加商品-002" }], "QF-M0511-002A");
