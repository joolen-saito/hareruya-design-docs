/**
 * M08-01 会員検索一覧の画面シード。正本: cases/M08-01_seed_data.tsv
 *
 * - 管理者（ADM）: メンバー管理で登録する（権限は会員管理を操作できる「システム管理者」）。
 * - 検索パターン: 会員検索一覧(検索入力)画面で検索条件保存・検索パターン削除で作る・消す。検索パターンは店舗に1組で共有されるので、
 *   「全件削除」「同じ名称を0件」のシードは、消してよい名前（このシードたちが作る名前）だけを消す。ほかの名前のパターン（開発用のデータ）が見つかったら、消さずに止める。
 *   名前で選ぶ034・036・037のパターン名には、実行の印を付ける（前の実行の残りと取り違えない）。
 * - 会員（DELETE・CBALREADY）: フロントの会員登録で作り、会員一覧のメールアドレス検索で会員IDを控える。メールアドレスの前半には実行の印を付ける。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { M08CustomerListPage } from "../pages/admin/m08_customer_list";
import { ensureM08Admin } from "../pages/admin/m08_common";
import { 会員を登録する } from "./m08-common";

export const M0801_ADMIN: Account = { loginId: "m0801_admin", password: "Passw0rd!M0801" };

defineSeed("S-M08-01-ADM", async ({ browser }) => { await ensureM08Admin(browser, "M08-01試験管理者", M0801_ADMIN); });

/** このシードたちが作る名前（消してよい） */
const 消してよい名前 = /^(条件なしパターン|退会理由検索|あ+|退会理由パターン-\d{3}[AB]?(-[0-9A-Z]+)?|退会理由更新(-\d{3})?)$/;

async function 管理者の画面(browser: Browser, fn: (page: Page, list: M08CustomerListPage) => Promise<void>): Promise<void> {
  await withAdminSession(browser, M0801_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await fn(page, new M08CustomerListPage(page));
  });
}

/** 検索パターン欄にあるパターンのうち、条件に合うものを1つずつ選んで削除する（合わないものがあれば条件の外として返す） */
async function パターンを消す(list: M08CustomerListPage, 消す: (名前: string) => boolean): Promise<void> {
  for (let i = 0; i < 100; i++) {
    await list.open();
    const names = await list.patternLinkNames();
    const target = names.find(消す);
    if (target === undefined) return;
    await list.selectPattern(target);
    await list.deletePattern();
  }
  throw new Error("検索パターンを消しきれない");
}
async function 条件の外が無いこと(list: M08CustomerListPage, 消す: (名前: string) => boolean): Promise<void> {
  await list.open();
  const rest = (await list.patternLinkNames()).filter((n) => !消す(n));
  const ng = rest.filter((n) => !消してよい名前.test(n));
  if (ng.length) throw new Error(`会員一覧用の検索パターンに、このシードが作った名前でないもの（開発用のデータ）がある: ${ng.join("、")}。消さずに止める`);
}

async function 全件を消す(browser: Browser): Promise<void> {
  await 管理者の画面(browser, async (_page, list) => {
    await list.open();
    const names = await list.patternLinkNames();
    const ng = names.filter((n) => !消してよい名前.test(n));
    if (ng.length) throw new Error(`会員一覧用の検索パターンに、このシードが作った名前でないもの（開発用のデータ）がある: ${ng.join("、")}。消さずに止める`);
    await パターンを消す(list, () => true);
  });
}

async function 名前を0件にする(browser: Browser, 一致: (名前: string) => boolean): Promise<void> {
  await 管理者の画面(browser, async (_page, list) => {
    await パターンを消す(list, 一致);
    // 同じ名前が表示されなくなったことを確かめる
    await list.open();
    const left = (await list.patternLinkNames()).filter(一致);
    if (left.length) throw new Error(`同じ名称の検索パターンが消えない: ${left.join("、")}`);
  });
}

async function パターンを作る(browser: Browser, 名前: string, 退会区分: string | undefined): Promise<string> {
  let id = "";
  await 管理者の画面(browser, async (_page, list) => {
    await list.open();
    await list.savePattern(名前, 退会区分);
    await list.open();
    id = await list.selectPattern(名前);
    if (!id) throw new Error(`検索パターン「${名前}」を押しても検索パターンIDがアドレスに出ない`);
  });
  return id;
}

defineSeed("S-M08-01-PATTERN-024", async ({ browser }) => { await 名前を0件にする(browser, (n) => n === "条件なしパターン"); });
defineSeed("S-M08-01-PATTERN-025", async ({ browser }) => { await 名前を0件にする(browser, (n) => n === "退会理由検索"); });
defineSeed("S-M08-01-PATTERN-029", async ({ browser }) => { await 名前を0件にする(browser, (n) => /^あ+$/.test(n)); });

defineSeed("S-M08-01-PATTERN-031", async ({ browser, notes }) => {
  await 全件を消す(browser);
  notes.set("〔検索パターンID-M0801-031〕", await パターンを作る(browser, "退会理由パターン-031", "不正利用"));
});
defineSeed("S-M08-01-PATTERN-060", async ({ browser, notes }) => {
  await 全件を消す(browser);
  notes.set("〔検索パターンID-M0801-060A〕", await パターンを作る(browser, "退会理由パターン-060A", "不正利用"));
  notes.set("〔検索パターンID-M0801-060B〕", await パターンを作る(browser, "退会理由パターン-060B", "不正利用"));
});
defineSeed("S-M08-01-PATTERN-061", async ({ browser, notes }) => {
  await 全件を消す(browser);
  notes.set("〔検索パターンID-M0801-061A〕", await パターンを作る(browser, "退会理由パターン-061A", "不正利用"));
  notes.set("〔検索パターンID-M0801-061B〕", await パターンを作る(browser, "退会理由パターン-061B", "不正利用"));
});

/** 名前で選ぶパターン（実行の印つきの名前）。シード表の「検索パターンID=83400001」は画面で指定できないので、画面が振るIDを控える */
export const 名前034 = (): string => rc("退会理由パターン-034");
export const 名前036 = (): string => rc("退会理由パターン-036");
export const 名前037 = (): string => rc("退会理由パターン-037");
defineSeed("S-M08-01-PATTERN-034", async ({ browser, notes }) => {
  notes.set("〔検索パターンID-M0801-034〕", await パターンを作る(browser, 名前034(), "不正利用"));
});
defineSeed("S-M08-01-PATTERN-036", async ({ browser, notes }) => {
  notes.set("〔検索パターンID-M0801-036〕", await パターンを作る(browser, 名前036(), "不正利用"));
});
defineSeed("S-M08-01-PATTERN-037", async ({ browser, notes }) => {
  notes.set("〔検索パターンID-M0801-037〕", await パターンを作る(browser, 名前037(), undefined));
  // 検索パターンID 999999は未登録であること（あれば削除、とシード表は定めるが、開発用のデータかもしれないので消さずに止める）
  await 管理者の画面(browser, async (page) => {
    const res = await page.goto(adminUrl("/customer/pattern/999999"), { timeout: 60_000 });
    if (res?.status() === 200) throw new Error("検索パターンID 999999が登録済み（開発用のデータの恐れがあるので消さずに止める）");
  });
});

for (const k of ["054", "055"]) {
  defineSeed(`S-M08-01-DELETE-${k}`, async ({ browser, notes }) => {
    await 会員を登録する(browser, notes, `m0801-del-${k}`, { 姓: "削除対象", 名: `会員-${k}`, セイ: "サクジョ", メイ: "タイショウ" }, `〔会員ID-M0801-${k}〕`);
  });
}
defineSeed("S-M08-01-CBALREADY-062", async ({ browser, notes }) => {
  await 会員を登録する(browser, notes, "cbm0801-062", { 姓: "削除済み確認", 名: "M0801-062", セイ: "サクジョズミ", メイ: "カクニン" }, "〔会員ID-M0801-062〕");
});
