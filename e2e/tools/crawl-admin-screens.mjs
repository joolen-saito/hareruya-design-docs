/**
 * 稼働中の管理画面を巡回して「/admin/ から辿れる画面」を確定させる。
 *
 * URL対応表（endpoint_reports/url_map_admin.tsv）の対象を、ルート定義の全件ではなく
 * 実際に到達できる画面だけに絞るための入力を作る（2026-08-14 ユーザー決定）。
 *
 * 安全のため GET の画面遷移だけを辿る。削除・出力・印刷・ログアウトなど、状態を変える
 * リンクや画面でない応答（CSV/PDF）は辿らない。フォーム送信もログイン以外は行わない。
 *
 *   node e2e/tools/crawl-admin-screens.mjs > endpoint_reports/admin_reachable_screens.tsv
 */
import { chromium } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:8080";
const ADMIN = process.env.ECCUBE_ADMIN_ROUTE ?? "admin";
const USER = process.env.ECCUBE_ADMIN_USER ?? "admin";
const PASS = process.env.ECCUBE_ADMIN_PASS ?? "password";
const MAX_PAGES = Number(process.env.CRAWL_MAX_PAGES ?? 400);

// 状態を変える・画面でない応答を返すリンクは辿らない。
const SKIP = [
  "logout", "delete", "destroy", "remove", "csv", "export", "download", "print",
  "pdf", "cache", "install", "plugin/install", "mailmagazine/send", "send",
];

const seen = new Set();
const queue = [`/${ADMIN}/`];
const results = [];

function normalize(href, current) {
  try {
    const url = new URL(href, current);
    if (url.origin !== new URL(BASE).origin) return null;
    if (!url.pathname.startsWith(`/${ADMIN}`)) return null;
    url.hash = "";
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

/**
 * 画面の同一性はパスの形で決まる。ID・ページ番号・並び替えクエリで別画面扱いにすると
 * 一覧のページングだけでキューが際限なく伸びる（実測: 400画面で残キュー11万）。
 */
function pattern(pathWithQuery) {
  const [path] = pathWithQuery.split("?");
  const segments = path.split("/").filter(Boolean);
  return (
    "/" +
    segments
      .map((s, i) => (i === 0 ? s : /^\d+$/.test(s) || /^[0-9a-f]{8}-[0-9a-f-]+$/.test(s) ? "{}" : s))
      .join("/")
  );
}

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "ja-JP" });
const page = await context.newPage();

await page.goto(`${BASE}/${ADMIN}/login`, { waitUntil: "domcontentloaded" });
await page.fill("#login_id", USER);
await page.fill("#password", PASS);
await Promise.all([
  page.waitForLoadState("domcontentloaded"),
  page.click('button[type="submit"], input[type="submit"]'),
]);

while (queue.length && results.length < MAX_PAGES) {
  const path = queue.shift();
  const key = pattern(path);
  if (seen.has(key)) continue;
  seen.add(key);
  if (SKIP.some((word) => path.toLowerCase().includes(word))) continue;

  let status = 0;
  let title = "";
  try {
    const response = await page.goto(`${BASE}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    status = response?.status() ?? 0;
    const type = response?.headers()["content-type"] ?? "";
    if (!type.includes("text/html")) continue; // CSV/PDF などは画面ではない
    title = (await page.title()).trim();
  } catch (error) {
    results.push([path, "0", `取得できない: ${String(error).slice(0, 60)}`]);
    continue;
  }
  if (status >= 400) continue;
  // ログイン画面へ戻された＝到達できていない
  if (page.url().includes("/login")) continue;

  // 画面見出し（ページタイトルより具体的なことが多い）
  const heading =
    (await page.locator("h1, .c-pageTitle, .c-contentsArea__title").first().textContent().catch(() => ""))?.trim() ??
    "";
  results.push([path, String(status), title, heading]);

  for (const href of await page.locator("a[href]").evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute("href"))
  )) {
    if (!href || href.startsWith("javascript:") || href.startsWith("#")) continue;
    const next = normalize(href, page.url());
    if (next && !seen.has(pattern(next))) queue.push(next);
  }
}

await browser.close();

console.log(["パス", "HTTPステータス", "ページタイトル", "画面見出し"].join("\t"));
for (const row of results) console.log(row.join("\t"));
console.error(`巡回: ${results.length}画面 / 訪問済み ${seen.size} / 残キュー ${queue.length}`);
