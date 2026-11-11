/**
 * F09-05 その他デッキ一覧 のシードとケースで使う、管理画面のフォーマット管理の操作。セレクタはここだけに置く。
 * - F09-01 の「フォーマットを登録する」は、フォーマット名(英)とフォーマットコードにフォーマット名(日)と同じ値を入れる。
 *   この機能のシード表はフォーマット名(英)に別の値（「…-FormatA」）を定めるので、この機能用に置く。
 * - フォーマットコードは 10 文字までの半角英数字（画面の入力規則）。公開側の検索条件の選択肢は、コードを識別子に使うので空にしない。
 * - デッキ・デッキタグの登録は、既存の部品（m15_05_deck_edit・m14_04_master）を使う。アーキタイプは下の理由でここに置く。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved, setChecked } from "./common";

type Issue = (m: string) => void;

export type F0905フォーマット = {
  名日: string; 名英: string; 並び順: string; メタ日数: string;
  検索対象: boolean; ランキング: boolean; その他メタ: boolean;
};

/** フォーマット名(英)から作る、10 文字の半角英数字のフォーマットコード（実行ごとに違う値になる） */
export function フォーマットコード(名英: string): string {
  let h = 2166136261;
  for (const ch of 名英) { h ^= ch.codePointAt(0)!; h = Math.imul(h, 16777619) >>> 0; }
  let h2 = 5381;
  for (const ch of 名英) h2 = (Math.imul(h2, 33) + ch.codePointAt(0)!) >>> 0;
  return `F5${(h.toString(36) + h2.toString(36)).toUpperCase().padEnd(8, "0").slice(0, 8)}`;
}

const 欄 = (page: Page, n: string) => page.locator(`[name="admin_format[${n}]"]`);
const 登録ボタン = (page: Page) => page.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).first();

/** フォーマット一覧の「新規登録」から登録し、フォーマットの番号（編集画面のアドレスの番号）を返す */
export async function F0905フォーマットを登録する(page: Page, v: F0905フォーマット, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  await 欄(page, "nameJp").fill(v.名日);
  await 欄(page, "nameEn").fill(v.名英);
  await 欄(page, "code").fill(フォーマットコード(v.名英));
  await 欄(page, "rank").fill(v.並び順);
  await 欄(page, "MetaRange").fill(v.メタ日数);
  await setChecked(欄(page, "searchFlg"), v.検索対象);
  await setChecked(欄(page, "rankingFlg"), v.ランキング);
  await setChecked(欄(page, "OtherMetaFlg"), v.その他メタ);
  await 登録ボタン(page).click();
  for (const w of await expectSaved(page, `フォーマット「${v.名日}」の登録`)) issue(`フォーマット「${v.名日}」の登録時の警告「${w}」`);
  const m = /\/format\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`フォーマット「${v.名日}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** フォーマット一覧の行（番号と、リンクの表示「名(日) / 名(英)」の名(日)） */
export async function フォーマット一覧の行(page: Page): Promise<{ 番号: string; 名日: string }[]> {
  const res = await page.goto(adminUrl("/format"));
  if (!res || !res.ok()) throw new Error(`フォーマット一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  const rows = await page.locator("td a[href*='/format/'][href$='/edit']").evaluateAll((as) => as.map((a) => ({
    番号: /\/format\/(\d+)\/edit/.exec((a as HTMLAnchorElement).getAttribute("href") ?? "")?.[1] ?? "",
    名日: ((a.textContent ?? "").replace(/\s+/g, " ").trim().split(" / ")[0] ?? "").trim(),
  })).filter((r) => r.番号 !== "" && r.名日 !== ""));
  const seen = new Set<string>();
  return rows.filter((r) => (seen.has(r.番号) ? false : (seen.add(r.番号), true)));
}

/**
 * ランキング表示もメタ分布簡易化もチェックが無いフォーマット（その他デッキの対象）を、フォーマット一覧の全件の編集画面を開いて調べる。
 * 画面を開くだけで、何も書き換えない。
 */
export async function その他デッキの対象のフォーマット(page: Page): Promise<string[]> {
  const out: string[] = [];
  for (const r of await フォーマット一覧の行(page)) {
    await page.goto(adminUrl(`/format/${r.番号}/edit`));
    await page.waitForLoadState("load");
    const rk = await 欄(page, "rankingFlg").isChecked();
    const om = await 欄(page, "OtherMetaFlg").isChecked();
    if (!rk && !om) out.push(r.名日);
  }
  return out;
}

/** フォーマット一覧を開き、フォーマット名(日)の行のリンクを押して編集画面を開く。フォーマットの番号を返す */
export async function フォーマット一覧から編集画面を開く(page: Page, 名日: string): Promise<string> {
  const res = await page.goto(adminUrl("/format"));
  if (!res || !res.ok()) throw new Error(`フォーマット一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  const link = page.locator("td a[href*='/format/'][href$='/edit']").filter({ hasText: new RegExp(`^\\s*${名日.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} / `) });
  await expect(link, `フォーマット一覧の「${名日}」の行`).toHaveCount(1);
  await Promise.all([page.waitForURL(/\/format\/\d+\/edit/, { waitUntil: "load" }), link.click()]);
  await expect(欄(page, "nameJp"), "フォーマット編集画面のフォーマット名(日)").toHaveValue(名日);
  return /\/format\/(\d+)\/edit/.exec(page.url())![1];
}

/**
 * アーキタイプ一覧の「新規登録」で、いつも新しく登録する（アーキタイプ名(日)・(英)・公開・フォーマット）。アーキタイプの番号を返す。
 * M15-05 の「アーキタイプを用意する」は同じ名前があれば編集し直すので、同じ名前をフォーマットごとに登録するこの機能では使わない。
 * F09-01 の「アーキタイプを登録する」はアーキタイプ名(英)に(日)と同じ値を入れるので、(英)を定めるこの機能では使わない。
 */
export async function F0905アーキタイプを登録する(page: Page, v: { 名日: string; 名英: string; フォーマット: string }, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/archetype/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_archetype[${n}]"]`);
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  await chooseByLabel(f("Disp"), "公開");
  await chooseByLabel(f("Format"), v.フォーマット);
  await page.locator('button[type="submit"][form="admin_archetype"]').first().click();
  for (const w of await expectSaved(page, `アーキタイプ「${v.名日}」の登録`)) issue(`アーキタイプ「${v.名日}」の登録時の警告「${w}」`);
  const m = /\/archetype\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`アーキタイプ「${v.名日}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** 開いているフォーマット編集画面で、欄（ランキング表示・メタ分布簡易化）にチェックを付けて「登録」を押す */
export async function 欄にチェックを付けて保存する(page: Page, 名: "ランキング表示" | "メタ分布簡易化", what: string): Promise<string[]> {
  const box = 欄(page, 名 === "ランキング表示" ? "rankingFlg" : "OtherMetaFlg");
  await setChecked(box, true);
  await 登録ボタン(page).click();
  const warnings = await expectSaved(page, what);
  await expect(box, `${what}: 保存したあとも「${名}」にチェックが付いている`).toBeChecked();
  return warnings;
}
