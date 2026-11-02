/**
 * M06-05 買取商品履歴(検索入力・検索結果) の画面シード。正本: cases/M06-05_seed_data.tsv
 *
 * 作るシード（画面だけで準備できるケースが使うもの）:
 * - S-M06-05-SHOPS: 東京店・大阪店。店舗一覧に同じ店名の店舗があれば登録しない（正本のとおり）。
 *   手元のDBには「東京店」が1件（会社名「株式会社送り元」）、「大阪店」が2件ある。いずれも店名が一致するので登録しない。
 * - S-M06-05-ADM-TOKYO・ADM-ALL: メンバー管理で登録する試験管理者。権限は正本が「店頭買取管理を操作できる権限」とするのでシステム管理者にした。
 *   所属店舗・編集可能店舗は東京店（正本が定めない）。ADM-ALL のデフォルト検索表示店舗は全店（未選択）。
 * - S-M06-05-CONFIG: 既定表示件数はアプリの設定値で、管理画面に項目が無い。書き換えられないので、いまの状態を報告に残すだけ。
 * - S-M06-05-PAGE-CHOICES: 表示件数マスタを管理画面のマスタデータ管理で整える（10〜12000の9件。11は未登録）。
 * - S-M06-05-RESTORE0-042: 保持済みの検索条件は「ケースの新しいブラウザセッションの中」でしか作れないので、ケース本体（prepareRestore0）で行う。
 *
 * DBでの準備が要るシード・MTGバイヤー（買取端末のアプリ）での査定が要るシードは作らない。
 */
import { Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { createStore } from "../pages/admin/m04_24_store";
import { PageCountConfigPage } from "../pages/admin/m03_01_page_count";
import { HistoryPage } from "../pages/admin/m06_05_history";
import { storeInput } from "./m06-common";

export const M0605_TOKYO: Account = { loginId: "m0605_tokyo", password: "Passw0rd!M0605T" };
export const M0605_ALL: Account = { loginId: "m0605_all", password: "Passw0rd!M0605A" };

/** 店舗一覧で、店名が一致する開店の店舗のID（複数あれば最も小さいID）。無ければ null */
async function 店名の店舗ID(page: Page, 店名: string): Promise<string | null> {
  const res = await page.goto(adminUrl("/mall/tenant/page/1?page_count=10000"), { timeout: 60_000 });
  if (!res || !res.ok()) throw new Error(`店舗一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  const rows = await page.locator('table.table tbody tr[id^="ex-tenant-"]').evaluateAll((trs) => trs.map((tr) => {
    const td = (i: number) => (tr.querySelectorAll("td")[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
    return { id: td(1), 店名: td(2), 開店: td(5) };
  }));
  const hits = rows.filter((r) => r.店名 === 店名 && r.開店 === "開店").map((r) => Number(r.id)).sort((a, b) => a - b);
  return hits.length ? String(hits[0]) : null;
}

async function ensureShop(page: Page, 店名: string, key: string, カナ: string, 英語: string, 略称: string): Promise<string> {
  const found = await 店名の店舗ID(page, 店名);
  if (found) return found;
  await createStore(page, storeInput(店名, カナ, 英語, key, 略称));
  const id = await 店名の店舗ID(page, 店名);
  if (!id) throw new Error(`店舗「${店名}」を登録したが、店舗一覧に出ない`);
  return id;
}

/** 東京店・大阪店の店舗ID（シードが作る／見つける） */
let shopIds: { 東京店: string; 大阪店: string } | undefined;

defineSeed("S-M06-05-SHOPS", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    shopIds = {
      東京店: await ensureShop(page, "東京店", "m0605tokyo", "トウキョウテン", "Tokyo", "K5T"),
      大阪店: await ensureShop(page, "大阪店", "m0605osaka", "オオサカテン", "Osaka", "K5O"),
    };
  });
});

function 東京店のID(): string {
  if (!shopIds) throw new Error("東京店・大阪店のシードがまだ作られていない");
  return shopIds.東京店;
}

defineSeed("S-M06-05-ADM-TOKYO", { needs: ["S-M06-05-SHOPS"] }, async ({ browser }) => {
  const t = 東京店のID();
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "M06-05東京店担当者", ログインID: M0605_TOKYO.loginId, メールアドレス: "m0605_tokyo@example.test", パスワード: M0605_TOKYO.password,
    権限: "システム管理者", 所属店舗ID: t, デフォルト検索表示店舗ID: t, 編集可能店舗ID: [t],
  }));
});

defineSeed("S-M06-05-ADM-ALL", { needs: ["S-M06-05-SHOPS"] }, async ({ browser }) => {
  const t = 東京店のID();
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "M06-05全店担当者", ログインID: M0605_ALL.loginId, メールアドレス: "m0605_all@example.test", パスワード: M0605_ALL.password,
    権限: "システム管理者", 所属店舗ID: t, デフォルト検索表示店舗ID: "", 編集可能店舗ID: [t],
  }));
});

defineSeed("S-M06-05-CONFIG", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "既定表示件数（50件）は管理画面に設定の項目が無く（アプリの設定値は10件）、書き換えられない。設定を書き換えずに流した");
});

defineSeed("S-M06-05-PAGE-CHOICES", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await new PageCountConfigPage(page).ensureExactOptions(["10", "50", "100", "300", "500", "1000", "2000", "10000", "12000"], (m) => reportSeedIssue(seed.シードID, m));
  });
});

defineSeed("S-M06-05-RESTORE0-042", async () => {
  // 保持済みの検索条件は、ケースのブラウザセッションの中で作る（prepareRestore0）
});

/**
 * 事前準備③（ケース専用シード RESTORE0-042 の作り方）: ケースのブラウザセッションで、買取商品履歴を開いて商品コード M0605-042-P を検索し（0件）、
 * 表示件数10件の指定で1ページ目を開き直す。これでセッションに検索条件（商品コード）と表示件数10が保持される。
 */
export async function prepareRestore0(page: Page): Promise<string> {
  const h = new HistoryPage(page);
  await h.open();
  await h.商品コードを入れる("M0605-042-P");
  await h.検索する();
  const text = await h.結果の欄の文();
  if (!text.includes("検索条件に該当するデータがありませんでした。")) throw new Error(`商品コード M0605-042-P の履歴が0件でない（${text.slice(0, 80)}）`);
  const status = await h.ページを開く(1, 10);
  if (status >= 400) throw new Error(`表示件数10件の指定で開けない（応答 ${status}）`);
  return text;
}
