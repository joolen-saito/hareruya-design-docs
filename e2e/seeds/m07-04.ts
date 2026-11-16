/**
 * M07-04 手動メール通知(入力画面) の画面シード。正本: cases/M07-04_seed_data.tsv
 *
 * 作るシード: ADM（管理者）と ORDER-001・002・003・005・008・009・011・012・013・014・018・019・020・021・022・024（買取受注・会員）、
 *   SHOP・TEMPLATES・AUTOPLAIN・NOHISTORY-018。
 * ≪共有のものを書き換える≫
 * - SHOP: 本店の店舗基本設定の「店名」と「送信エラー通知メールアドレス」、追加システム設定の「買取用メール送信元アドレス」を書き換える。
 *   書き換える前に、店舗基本設定と追加システム設定の全項目の値を控え、基盤（lib/shared_restore.ts の registerRestore）がケースの終わりに
 *   画面から全項目を元の値へ戻し、戻ったことを確かめる。書き換えている時間を短くするため、買取受注などを先に作ってから書き換える（TEMPLATES を先に作らせる）。
 * - TEMPLATES・AUTOPLAIN: メールテンプレート（ID 70401・70411〜70416・70497〜70499）は、E2E が作る行としてDBへ足す（メール識別キーに実行の印。
 *   決まった番号が空いていなければ足さない）。足した行は基盤がケースの終わりに必ず消す。既存の共有のテンプレートは書き換えない。
 *   シードでの解釈: 「02査定テンプレ」の選択時のメール本文「刷新本文Ｂ2」は、本文の雛形（ファイル）に差し込まれる本文上部（ヘッダー）に入れて表す。
 *   雛形（ファイル）はテンプレートごとに既存のものを割り当てる（01買取受付＝買取受付、02査定＝査定、03送料込み＝送料込み、04〜06＝各旧版、07＝雛形なし、08受注向け＝受注の雛形、00・09＝自動送信専用）。
 *   「現在の店舗の他の買取向け手動送信テンプレートを候補外にする」は、共有の既存テンプレートを書き換えるため行わない（004・023 は実装しない）。
 * - NOHISTORY-018: 買取申込のときに記録される通知送信履歴を、E2E が作った買取受注（メールアドレスに印）のものだけ、DBで消して0件にする。
 * 作らないシード: NOHISTORY-010・015・016・SENT1-025・RG-*（テスト受信箱を読む・ほかの機能の画面で新規テンプレートを登録する前提で、開発環境では行わない）。
 * ORDER-019 の氏名などの指定値（晴山 試験・申込日時 2026-09-01 など）は、ケースが買取受注レコードの変化だけを確かめるので、画面で作った買取受注のまま使う。
 * - 会員は、正本は新規会員登録の固定メールだが、実行の印つきのメールでフロントの会員登録で作る（依頼者決定 2026-10-31）。姓は買取ごとに別の値にして、一覧の先頭行から買取番号を控える。
 * - 申込日時・更新日時・生年月日などのDB直接設定は行わない（使うケースがこれらの値を確かめない）。
 * 作らないシード: SHOP（共有の店舗設定の書き換え）・TEMPLATES・AUTOPLAIN・SENT1・NOHISTORY・RG-*（テンプレートの登録と通知送信履歴のDB確認）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 手動送信の店舗, テンプレートがあるか, テンプレートを消す, テンプレートを足す, 使われている番号, 足すテンプレート } from "../db/m10_08_mail";
import { テンプレートを使った通知履歴を消す, 通知送信履歴を消す } from "../db/m07_04_mail";
import { registerRestore } from "../lib/shared_restore";
import { 買取用メール送信元の項目, 追加システム設定を書く, 追加システム設定を読む } from "../pages/admin/m07_04_shop";
import { 本店の基本設定を控えて書き換える } from "./shop-restore";
import { defineSeed } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { 会員を作る, 申込みを行う, 試験管理者を用意する, 買取状況を設定する } from "./m07-common";

export const M0704_ADMIN: Account = { loginId: "m0704_admin", password: "Passw0rd!M0704" };

defineSeed("S-M07-04-ADM", async ({ browser }) => {
  await 試験管理者を用意する(browser, M0704_ADMIN, "M07-04試験管理者");
});

async function 会員IDを読む(browser: Browser, メール: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await page.goto(adminUrl("/customer"));
    await page.waitForLoadState("load");
    await page.locator('[name="admin_search_customer[multi]"]').fill(メール);
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }), page.locator("#search_form button[type=submit]").filter({ hasText: "検索" }).first().click({ noWaitAfter: true })]);
    await page.waitForLoadState("load");
    const id = /ex-customer-(\d+)/.exec((await page.locator('tr[id^="ex-customer-"]').first().getAttribute("id")) ?? "")?.[1];
    if (!id) throw new Error(`会員 ${メール} が会員一覧に無い`);
    return id;
  });
}

function 注文(n: string): void {
  defineSeed(`S-M07-04-ORDER-${n}`, { needs: ["S-M07-04-ADM"] }, async ({ browser, notes }) => {
    const 姓 = `M0704-${n}-会員`;
    const 会員 = await 会員を作る(browser, 姓, `m0704${n}`);
    notes.set(`〔会員ID-M0704-${n}〕`, await 会員IDを読む(browser, 会員.メール));
    const [番号] = await 申込みを行う(browser, 会員, 1);
    await 買取状況を設定する(browser, [[番号, "査定中"]]);
    notes.set(`〔買取番号-M0704-${n}〕`, 番号);
  });
}

for (const n of ["001", "002", "003", "005", "008", "009", "011", "012", "013", "014", "018", "019", "020", "021", "022", "024"]) 注文(n);

// ---- 共有のもの（メールテンプレート・店舗のメール設定） ----
const 手動 = (id: number, 名称: string, 雛形: string, 他: Partial<足すテンプレート> = {}): 足すテンプレート => ({ id, 名称, 件名: `${名称}の件名`, 雛形, 自動送信: false, ...他 });
const 雛形 = { 受付: "Mail/buy_order.twig", 査定: "Mail/buy_order_assessment.twig", 送料込み: "Mail/buy_order_include_delivery_fee.twig", 受付旧: "Mail/buy_order_old.twig",
  査定旧: "Mail/buy_order_assessment_old.twig", 送料込み旧: "Mail/buy_order_include_delivery_fee_old.twig", なし: "Mail/no_base.twig", 受注: "Mail/sell_order.twig" };

function テンプレートを用意する(seedId: string, 行: 足すテンプレート[]): void {
  const 使用 = 使われている番号(行.map((r) => r.id));
  if (使用.length) throw new Error(`${seedId}: メールテンプレートの番号 ${使用.join("・")} が既に使われているので足さない（既存の行は上書きしない）`);
  const ids = 行.map((r) => r.id);
  registerRestore(`メールテンプレート ${ids.join("・")}（${seedId}）`, { 足す番号: ids }, async () => { テンプレートを使った通知履歴を消す(`${seedId} の後始末（テンプレートを参照するテストの通知履歴）`, ids); テンプレートを消す(`${seedId} の後始末`, ids); }, async () => !ids.some(テンプレートがあるか));
  テンプレートを足す(seedId, 手動送信の店舗(), 行);
}
defineSeed("S-M07-04-TEMPLATES", async ({ seed }) => {
  テンプレートを用意する(seed.シードID, [
    手動(70411, "01買取受付", 雛形.受付),
    手動(70401, "02査定テンプレ", 雛形.査定, { 件名: "刷新件名Ａ1", 本文上部: "刷新本文Ｂ2" }),
    手動(70412, "03送料込み", 雛形.送料込み),
    手動(70413, "04買取受付旧版", 雛形.受付旧),
    手動(70414, "05査定旧版", 雛形.査定旧),
    手動(70415, "06送料込み旧版", 雛形.送料込み旧),
    手動(70416, "07雛形なし", 雛形.なし),
    手動(70498, "00自動送信専用", 雛形.受付, { 自動送信: true }),
    手動(70499, "08受注向け", 雛形.受注),
  ]);
});
defineSeed("S-M07-04-AUTOPLAIN", { needs: ["S-M07-04-TEMPLATES"] }, async ({ seed }) => {
  テンプレートを用意する(seed.シードID, [手動(70497, "09自動送信専用雛形なし", 雛形.なし, { 自動送信: true })]);
});

// 店舗名・買取用メール送信元・エラー通知先（共有の設定）。買取受注などを先に作ってから書き換える
defineSeed("S-M07-04-SHOP", { needs: ["S-M07-04-TEMPLATES"] }, async ({ browser, seed }) => {
  await 本店の基本設定を控えて書き換える(browser, seed.シードID, { 店名: "晴れる屋テスト店", 送信エラー通知メールアドレス: "purchase-error@example.test" }, false);
  const 元 = await withAdminSession(browser, SETUP_ADMIN, (page) => 追加システム設定を読む(page));
  // 戻すのは、いまの値が元と違う項目だけ（全項目を書き戻すと、触っていない項目まで書くことになる）
  const 戻す = () => withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 今 = await 追加システム設定を読む(page);
    const 差 = Object.fromEntries(Object.entries(元).filter(([k, v]) => 今[k] !== v));
    if (Object.keys(差).length) await 追加システム設定を書く(page, 差, "追加システム設定を元の値へ戻す");
  });
  const 同じか = async () => { const 今 = await withAdminSession(browser, SETUP_ADMIN, (page) => 追加システム設定を読む(page)); return Object.keys(元).every((k) => 元[k] === 今[k]); };
  registerRestore(`追加システム設定（${seed.シードID}）`, 元, 戻す, 同じか);
  await withAdminSession(browser, SETUP_ADMIN, (page) => 追加システム設定を書く(page, { [買取用メール送信元の項目]: "purchase-mail@example.test" }, `${seed.シードID} 買取用メール送信元の設定`));
});

defineSeed("S-M07-04-NOHISTORY-018", { needs: ["S-M07-04-ORDER-018"] }, async ({ notes, seed }) => {
  通知送信履歴を消す(seed.シードID, notes.get("〔買取番号-M0704-018〕"));
});
