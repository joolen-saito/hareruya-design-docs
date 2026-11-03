/**
 * M09-04 ページ管理 のシード（実装したケースが使うもの）。正本: cases/M09-04_seed_data.tsv
 * - ページ名・URL・ファイル名は決め打ちの識別の値なので、実行の印を付ける（識別。依頼者決定 2026-10-28）。値はシード表の「状態・属性」から読む。
 * - 「DBシード」「DBへ直接」「テンプレート保管領域へ配置」を作り方とするシード（一覧除外用ページ・開発者作成ページ・ページ情報の置き換え・
 *   既定メタテンプレートなど）は画面だけでは作れないので、作り方を書かない。それらを使うケースは実装しない（記録の振り分け）。
 * - 「あれば画面から削除して0件にする」シード（登録前状態）は、印つきの値で作るので前回の残りに当たらない。0件であることだけを画面で確かめる。
 * - 試験管理者の権限は、コンテンツ管理を操作できる「システム管理者」にした（メンバー管理に、コンテンツ管理だけの権限が無いため）。
 */
import { expect } from "@playwright/test";
import { getSeed } from "../lib/catalog";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { ページ管理, ページの値 } from "../pages/admin/m09_04_page";
import { レイアウトを登録する } from "../pages/admin/m09_layout";
import { ensureAnalysisAdmin } from "./m12-common";

export const M0904_ADMIN: Account = { loginId: "m0904_admin", password: "Passw0rd!M0904" };

/** 決め打ちの識別の値に実行の印を付ける。末尾が「/」の値は印を「/」の前に、最後の区切りが「/user_data」の値は「/user_data」の前に付ける */
export function 識別(v: string): string {
  if (v.endsWith("/")) return rc(v.slice(0, -1)) + "/";
  if (v.endsWith("/user_data") && !v.startsWith("user_data/")) return rc(v.slice(0, -"/user_data".length)) + "/user_data";
  return rc(v);
}

export const 試験PCレイアウト = () => rc("試験PCレイアウト");
export const 試験モバイルレイアウト = () => rc("試験モバイルレイアウト");

export type シードのページ = {
  ページ名: string; URL: string; ファイル名: string; 日本語コード?: string; 英語コード?: string;
  author?: string; description?: string; keyword?: string; robot?: string; metatag?: string;
};

/** シード表の「状態・属性」から、ページの値を読んで実行の印を付ける（URL・ファイル名・ページ名） */
export function シードのページ(seedId: string): シードのページ {
  const segs = getSeed(seedId)["状態・属性"].split("／");
  const pick = (key: string): string | undefined => segs.find((s) => s.startsWith(key + "="))?.slice(key.length + 1);
  const name = pick("ページ名"); const url = pick("URL"); const file = pick("twigファイル");
  if (!name || !url || !file) throw new Error(`${seedId} の状態からページ名・URL・twigファイルを読めない`);
  return {
    ページ名: 識別(name), URL: 識別(url), ファイル名: 識別(file),
    日本語コード: pick("日本語コード"), 英語コード: pick("英語コード"),
    author: pick("author"), description: pick("description"), keyword: pick("keyword"), robot: pick("robot"), metatag: pick("metatag"),
  };
}

async function シードのページを作る(browser: import("@playwright/test").Browser, seedId: string, 追加: Partial<ページの値> = {}): Promise<string> {
  const v = シードのページ(seedId);
  return withAdminSession(browser, M0904_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const pa = new ページ管理(page);
    const 入力: ページの値 & { 言語?: "ja" | "en" } = {
      ページ名: v.ページ名, URL: v.URL, ファイル名: v.ファイル名, 言語: "ja",
      author: v.author, description: v.description, keyword: v.keyword, robot: v.robot, metatag: v.metatag, ...追加,
    };
    if (v.日本語コード !== undefined) 入力.コード = v.日本語コード;
    const id = await pa.作る(入力);
    if (v.英語コード !== undefined) {
      // 続けて、その編集画面の言語で「英語」を選び、コードを書き換えて登録する（英語のテンプレートだけが書き換わる）
      await pa.言語を選ぶ("英語");
      await pa.コードを入れる(v.英語コード);
      const r = await pa.登録して結果を読む();
      if (!r.成功) throw new Error(`${seedId}: 英語のコードを登録できない: ${r.入力エラー.join(" / ")}`);
    }
    return id;
  });
}

defineSeed("S-M09-04-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M09-04試験管理者", account: M0904_ADMIN, メール: "m0904_admin@example.test" });
});

defineSeed("S-M09-04-LAYOUT", { needs: ["S-M09-04-ADM"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, M0904_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔レイアウトID-M0904-共有A〕", await レイアウトを登録する(page, { 名称: 試験PCレイアウト(), 端末種別: "PC" }));
    notes.set("〔レイアウトID-M0904-共有B〕", await レイアウトを登録する(page, { 名称: 試験モバイルレイアウト(), 端末種別: "スマートフォン" }));
  });
  reportSeedIssue("S-M09-04-LAYOUT", "レイアウト名は決め打ちの識別の値なので実行の印を付けて登録した。シード表は端末種別「モバイル」と書くが、レイアウト管理の「モバイル」を選ぶとページ管理のモバイル欄の選択肢に出ない（モバイル欄に出るのは「スマートフォン」の端末種別のレイアウト）ので、前提（モバイル欄で選べる）を成り立たせるため「スマートフォン」で登録した（正本の外の補い）");
});

/** 画面から作るページのシード（番号ごと）。控えた番号の呼び名は 〔ページID-M0904-<番号>〕 */
const 通常: [string, string][] = [
  ...("002 005 008 009 013 014 015 016 017 018 019 021 023 029 036 040 041 043 046 060 061".split(" ").map((n) => [`PAGE-${n}`, n] as [string, string])),
  ["DELETE-048", "048"], ["DELETE-049", "049"], ["DELETE-050", "050"], ["DELETE-051", "051"],
  ["RENAME-042", "042"], ["LANG-059", "059"], ["LANG-062", "062"], ["DPEN-064", "064"], ["CBEDIT-068", "068"], ["CBRENAME-070", "070"],
];
for (const [key, n] of 通常) {
  const seedId = `S-M09-04-${key}`;
  defineSeed(seedId, { needs: ["S-M09-04-ADM"] }, async ({ browser, notes }) => {
    notes.set(`〔ページID-M0904-${n}〕`, await シードのページを作る(browser, seedId));
  });
}

/** 検索に当たる行が一覧に1件も無いこと（シード表の「確かめる」）。見えている行の数は、一覧を読み込んだあとで数える */
async function 一覧に無いことを確かめる(browser: import("@playwright/test").Browser, 語: string[]): Promise<void> {
  await withAdminSession(browser, M0904_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const pa = new ページ管理(page);
    await pa.一覧を開く();
    expect(await page.locator("table.table tr[id^='ex-page-']").count(), "ページ管理(一覧)にページが読み込まれている").toBeGreaterThan(0);
    for (const w of 語) {
      await pa.検索する(w);
      expect(await pa.見えている行.count(), `一覧に「${w}」を含む行が無い`).toBe(0);
    }
  });
}

defineSeed("S-M09-04-PAGE-006", { needs: ["S-M09-04-ADM"] }, async ({ browser, notes }) => {
  notes.set("〔ページID-M0904-006〕", await シードのページを作る(browser, "S-M09-04-PAGE-006"));
  await 一覧に無いことを確かめる(browser, ["MATCH-NONE-999"]);
});
defineSeed("S-M09-04-PAGE-010", { needs: ["S-M09-04-ADM"] }, async ({ browser, notes }) => {
  const id = await シードのページを作る(browser, "S-M09-04-PAGE-010");
  expect(Number(id), "控えたページIDが999999より小さい（999999は未登録）").toBeLessThan(999999);
  notes.set("〔ページID-M0904-010〕", id);
});
defineSeed("S-M09-04-LAYPAGE-056", { needs: ["S-M09-04-ADM", "S-M09-04-LAYOUT"] }, async ({ browser, notes }) => {
  notes.set("〔ページID-M0904-056〕", await シードのページを作る(browser, "S-M09-04-LAYPAGE-056", { PC: 試験PCレイアウト() }));
});

// 登録前状態（印つきの値のページが0件）
const 登録前: [string, string[]][] = [
  ["NEW-024", ["全項目登録ページ", "user_data/all_fields"]],
  ["NEW-025", ["日英生成ページ", "user_data/bilingual"]],
  ["NEW-026", ["任意項目空ページ", "user_data/optional_empty"]],
  ["NEW-058", ["登録後遷移ページ-M0904-058", "user_data/m0904-058-after"]],
  ["CBNEW-067", ["CB英語選択登録ページM0904CB067", "user_data/m0904cb067-new"]],
];
for (const [key, vals] of 登録前) {
  defineSeed(`S-M09-04-${key}`, { needs: ["S-M09-04-ADM"] }, async ({ browser }) => {
    await 一覧に無いことを確かめる(browser, vals.map(識別));
  });
}
