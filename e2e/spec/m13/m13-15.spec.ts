/**
 * M13-15 画像設定。正本: cases/M13-15_test_cases.tsv
 *
 * 依頼者の方針（2026-11-10）: 既存の店舗の画像は消さない・書き換えない。シード表の東京店・大阪店・名古屋店は、E2E の試験店舗（店名の末尾「-M1315」）に読み替えた
 * （seeds/m13-15.ts の先頭）。保管先へ名前を決めたファイルを置く準備は、ケースの冒頭（手順の前）で試験店舗へ画面から画像をアップロードする
 * （ファイル名は画面が採番する）に読み替え、増えた画像・アップロードの前後の差で確かめる。
 * 実装しないのは、012・017（2000件・2001件の大量の画像）、018（保管先の下の区分フォルダは画面のアップロードで作れない）の3件。
 *
 * 解釈:
 * - 「画像設定画面を開く」は、画面のアドレスで開く（メニューからと決めている 001・037 を除く）。
 * - 「追加された画像」は、アップロードの前の一覧に無く、あとの一覧にあるURL。004〜006・009 は東京店、032 は大阪店の画像を、シードで0件にしてある。
 * - アップロード欄の店舗はふつうの選択欄なので、「選択肢を開く」（003）は欄を押して、並んでいる選択肢を読む。
 */
import fs from "node:fs";
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { BannerImagePage, ファイル名, 準備のアップロード } from "../../pages/admin/m13_15_banner_image";
import { TopBannerPage, 準備のアップロード as トップバナーの準備のアップロード } from "../../pages/admin/m16_02_top_banner";
import { M1602_ADMIN } from "../../seeds/m16-02";
import { 大会特設ページ一覧, 大会特設ページ一覧のバナー } from "../../pages/front/event_special_banner";
import { EventTopPage } from "../../pages/front/f07_01_event_top";
import { QK1302_ADMIN, QK連携店舗 } from "../../seeds/m13-02-qk";
import { M1315_ADMIN, 入力ファイル, 大阪店, 大阪店の識別子, 名古屋店, 名古屋店の識別子, 東京店, 東京店の識別子 } from "../../seeds/m13-15";
import { withAdminSession } from "../../lib/session";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** アップロードの結果を注記に残す（成功・エラーの表示と、移った先） */
const 結果を残す = (what: string, r: { 送った: boolean; 成功: string[]; エラー: string[]; 行き先: string }) => {
  note(`${what}: ${r.送った ? "送信した" : "送信されなかった"}。成功の表示「${r.成功.join(" / ") || "なし"}」、エラーの表示「${r.エラー.join(" / ") || "なし"}」、移った先 ${new URL(r.行き先).pathname}${new URL(r.行き先).hash}`);
};

/** いまの一覧が 店名 の絞り込みでなければ、選択店舗で選び直す（選び直したことを注記に残す） */
async function 店舗の一覧にする(p: BannerImagePage, 店名: string): Promise<void> {
  const now = await p.選択店舗の表示();
  if (now === 店名) return;
  note(`アップロードのあとの一覧は選択店舗「${now}」だったので、「${店名}」の一覧を見るために選択店舗で「${店名}」を選んだ`);
  await p.選択店舗を選ぶ(店名);
}

const 追加分 = (前: string[], 後: string[]) => 後.filter((u) => !前.includes(u));
const 配下 = (識別子: string) => `/banner/event/${識別子}/`;
const 全て = "全て";

/** 事前準備: 試験店舗へ画面から画像をアップロードし、増えた画像のURLを返す（正本の「保管先へ名前を決めた画像を置く」の読み替え） */
async function 用意する(p: BannerImagePage, 店名: string, file: string, 呼び名: string): Promise<string> {
  const url = await 準備のアップロード(p, 店名, 入力ファイル(file));
  note(`事前の準備: 正本の「${呼び名}」の代わりに、「${店名}」へ画面から画像（${file}）をアップロードし、増えた画像 ${url} を使う（ファイル名は画面が採番するので、正本の名前の画像は置けない）`);
  return url;
}

/** 現在の選択店舗の一覧を、店名の絞り込みにして読む */
async function 店舗の画像(p: BannerImagePage, 店名: string): Promise<string[]> {
  await p.選択店舗を選ぶ(店名);
  return p.画像のURL();
}

// ---- メニューと初期表示 ----

caseTest("IT-M13-15-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("001"));
  const p = new BannerImagePage(page);
  await step(1, async () => { await page.goto(adminUrl("/")); await page.waitForLoadState("load"); });
  await step(2, async () => { await p.イベント管理メニューを展開する(); });
  await step(3, async () => {
    const item = p.メニューの項目("画像設定");
    if ((await item.count()) === 0) {
      const have = await p.イベント管理メニューの項目();
      const 画面へ = (await p.画像設定画面へのメニュー.allInnerTexts()).map((t) => t.trim());
      throw new Error(`「イベント管理」の下に「画像設定」という項目が無く、押せない（ある項目: ${have.join("、")}。画像設定画面へのリンクの表示名: ${画面へ.join("、") || "なし"}）`);
    }
    await p.メニューを押す(item);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先のアドレス（画像設定画面）").toMatch(/\/event\/banner$/);
    await expect.soft(p.アップロードボタン, "画像設定画面のアップロード欄").toBeVisible();
  });
});

caseTest("IT-M13-15-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("002"));
  const p = new BannerImagePage(page);
  await step(1, async () => { await p.開く(); });
  let 値 = "";
  await step(2, async () => { 値 = await p.アップロード欄の店舗の値(); });
  await expected(async () => {
    expect(値, "アップロード欄の店舗の初期値").toBe(東京店);
  });
});

caseTest("IT-M13-15-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("003"));
  const p = new BannerImagePage(page);
  await step(1, async () => { await p.開く(); });
  let 選択肢: string[] = [];
  await step(2, async () => {
    await p.アップロード欄の店舗.click();
    note("アップロード欄の店舗はブラウザの選択欄で、開いた一覧は画面に撮れないため、欄を押したあと、並んでいる選択肢を読んだ");
    選択肢 = await p.アップロード欄の店舗の選択肢();
    await page.keyboard.press("Escape");
  });
  await expected(async () => {
    expect.soft([...選択肢].sort(), "アップロード欄の店舗の選択肢（東京店と大阪店だけ）").toEqual([東京店, 大阪店].sort());
    expect.soft(選択肢, "アップロード欄の店舗の選択肢に名古屋店が無い").not.toContain(名古屋店);
  });
});

// ---- アップロード ----

caseTest("IT-M13-15-004", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("004"));
  const p = new BannerImagePage(page);
  let 前: string[] = [];
  await step(1, async () => {
    await p.開く();
    note("東京店（試験店舗）の画像は消さないので、アップロードの前の一覧を読み、増えた分で確かめる");
    前 = await 店舗の画像(p, 東京店);
  });
  await step(2, async () => { 結果を残す("valid.gif", await p.アップロードする(東京店, 入力ファイル("valid.gif"))); });
  await step(3, async () => { 結果を残す("valid.jpg", await p.アップロードする(東京店, 入力ファイル("valid.jpg"))); });
  await step(4, async () => { 結果を残す("valid.png", await p.アップロードする(東京店, 入力ファイル("valid.png"))); });
  await expected(async () => {
    await 店舗の一覧にする(p, 東京店);
    const urls = 追加分(前, await p.画像のURL());
    const 拡張子 = urls.map((u) => ファイル名(u).split(".").pop() ?? "").sort();
    expect.soft(urls.length, "東京店の画像一覧に増えた画像の件数（3件追加）").toBe(3);
    expect.soft(拡張子.filter((e) => e === "gif").length, "GIF画像（拡張子 gif）が1件").toBe(1);
    expect.soft(拡張子.filter((e) => e === "jpg" || e === "jpeg").length, "JPEG画像（拡張子 jpg・jpeg）が1件").toBe(1);
    expect.soft(拡張子.filter((e) => e === "png").length, "PNG画像（拡張子 png）が1件").toBe(1);
  });
});

caseTest("IT-M13-15-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("005"));
  const p = new BannerImagePage(page);
  let 前: string[] = [];
  await step(1, async () => { await p.開く(); 前 = await 店舗の画像(p, 東京店); });
  await step(2, async () => { 結果を残す("valid.png", await p.アップロードする(東京店, 入力ファイル("valid.png"))); });
  let url = ""; let 状態 = 0; let 種類 = ""; let 中身: Buffer = Buffer.alloc(0);
  await step(3, async () => {
    await 店舗の一覧にする(p, 東京店);
    const urls = 追加分(前, await p.画像のURL());
    if (urls.length !== 1) throw new Error(`東京店の画像一覧に増えた画像が ${urls.length} 件で、追加された画像を1つに決められない（${urls.join("、")}）`);
    url = urls[0];
    note(`追加された画像のURL: ${url}`);
    const res = await page.goto(new URL(url, page.url()).toString());
    状態 = res?.status() ?? 0; 種類 = res ? (await res.allHeaders())["content-type"] ?? "" : ""; 中身 = res ? await res.body() : Buffer.alloc(0);
  });
  await expected(async () => {
    note(`正本の保管先「/banner/tc/」は、東京店の支店URL（試験店舗では ${東京店の識別子}）の保管先「/banner/${東京店の識別子}/」に読み替えた`);
    expect.soft(url, `追加された画像のURL（/banner/${東京店の識別子}/ 配下）`).toContain(`/banner/${東京店の識別子}/`);
    expect.soft(状態, "画像のURLを開いた応答").toBe(200);
    expect.soft(種類, "画像のURLの応答の種類（画像）").toMatch(/^image\//);
    expect.soft(中身.equals(fs.readFileSync(入力ファイル("valid.png"))), "画像のURLで表示された内容がアップロードした valid.png と同じ").toBe(true);
  });
});

caseTest("IT-M13-15-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("006"));
  const p = new BannerImagePage(page);
  let 前: string[] = [];
  await step(1, async () => { await p.開く(); 前 = await 店舗の画像(p, 東京店); });
  await step(2, async () => { 結果を残す("original-name.JPG（1回目）", await p.アップロードする(東京店, 入力ファイル("original-name.JPG"))); });
  await step(3, async () => { 結果を残す("original-name.JPG（2回目）", await p.アップロードする(東京店, 入力ファイル("original-name.JPG"))); });
  let names: string[] = [];
  await step(4, async () => {
    await 店舗の一覧にする(p, 東京店);
    const urls = 追加分(前, await p.画像のURL());
    note(`東京店の画像一覧に増えた画像のURL: ${urls.join("、") || "なし"}`);
    names = urls.map(ファイル名);
  });
  await expected(async () => {
    expect.soft(names.length, "追加された画像の数").toBe(2);
    expect.soft(new Set(names).size, "2画像のファイル名が互いに異なる").toBe(names.length);
    for (const n of names) {
      expect.soft(n.toLowerCase(), `ファイル名「${n}」に original-name を含まない`).not.toContain("original-name");
      expect.soft(n, `ファイル名「${n}」が小文字の .png で終わる`).toMatch(/\.png$/);
    }
  });
});

caseTest("IT-M13-15-009", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("009"));
  const p = new BannerImagePage(page);
  await step(1, async () => { await p.開く(); });
  let 前 = -1;
  await step(2, async () => {
    note("東京店の画像件数は、選択店舗で「東京店」を選んだ一覧の行の数で数えた");
    await p.選択店舗を選ぶ(東京店);
    前 = (await p.画像のURL()).length;
    note(`送信前の東京店の画像件数: ${前}`);
  });
  await step(3, async () => { 結果を残す("size-520000.png", await p.アップロードする(東京店, 入力ファイル("size-520000.png"))); });
  await expected(async () => {
    await 店舗の一覧にする(p, 東京店);
    expect((await p.画像のURL()).length, `東京店の画像一覧の件数（送信前 ${前} 件から1件増える）`).toBe(前 + 1);
  });
});

caseTest("IT-M13-15-032", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("032"));
  const p = new BannerImagePage(page);
  let 前: string[] = [];
  await step(1, async () => { await p.開く(); 前 = await 店舗の画像(p, 大阪店); });
  await step(2, async () => { 結果を残す("valid.png", await p.アップロードする(大阪店, 入力ファイル("valid.png"))); });
  let urls: string[] = [];
  await step(3, async () => {
    await 店舗の一覧にする(p, 大阪店);
    urls = 追加分(前, await p.画像のURL());
    note(`大阪店の画像一覧に増えた画像のURL: ${urls.join("、") || "なし"}`);
  });
  await expected(async () => {
    note(`正本の保管先「/banner/event/os/」は、大阪店（試験店舗）の支店URL ${大阪店の識別子} の保管先に読み替えた`);
    expect.soft(urls.length, "追加された画像の数").toBe(1);
    for (const u of urls) expect.soft(u, `追加された画像のURL（${配下(大阪店の識別子)} 配下）`).toContain(配下(大阪店の識別子));
  });
});

// ---- 選択店舗の切り替え・一覧の並びと絞り込み ----

caseTest("IT-M13-15-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("007"));
  const p = new BannerImagePage(page);
  const 東京の画像 = await 用意する(p, 東京店, "valid.png", "/banner/tc/tc-001-007.png");
  await 用意する(p, 大阪店, "valid.png", "/banner/os/os-001-007.gif");
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.選択店舗を選ぶ(東京店); });
  await step(3, async () => {
    結果を残す("大阪店へ valid.png", await p.アップロードする(大阪店, 入力ファイル("valid.png")));
  });
  await expected(async () => {
    const 表示 = await p.選択店舗の表示();
    const urls = await p.画像のURL();
    expect.soft(表示, "アップロードのあとの画面の選択店舗").toBe(大阪店);
    expect.soft(urls.length, "大阪店の画像一覧の件数（1件以上）").toBeGreaterThan(0);
    for (const u of urls) expect.soft(u, `一覧の画像「${u}」が大阪店の保管先（${配下(大阪店の識別子)}）`).toContain(配下(大阪店の識別子));
    expect.soft(urls, "東京店の画像が一覧に無い").not.toContain(東京の画像);
  });
});

caseTest("IT-M13-15-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("013"));
  const p = new BannerImagePage(page);
  const 東1 = await 用意する(p, 東京店, "valid.png", "/banner/tc/tc-001-013.png");
  const 東2 = await 用意する(p, 東京店, "valid.jpg", "/banner/tc/tc-002-013.jpg");
  const 大1 = await 用意する(p, 大阪店, "valid.gif", "/banner/os/os-001-013.gif");
  let urls: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.選択店舗を選ぶ(東京店); });
  await step(3, async () => { urls = await p.画像のURL(); note(`東京店の一覧のURL（${urls.length}件）: ${urls.join("、")}`); });
  await expected(async () => {
    note("正本の「東京店の2画像だけ」は、東京店の一覧が東京店の保管先の画像だけで、準備した2画像が並び、大阪店・名古屋店の画像を含まないことで確かめた。東京店（試験店舗）の画像は消さないので、前の実行の画像も並ぶ");
    expect.soft(urls, "準備した東京店の画像が一覧にある").toEqual(expect.arrayContaining([東1, 東2]));
    expect.soft(urls, "大阪店の画像が一覧に無い").not.toContain(大1);
    for (const u of urls) expect.soft(u, `一覧の画像「${u}」が東京店の保管先（${配下(東京店の識別子)}）`).toContain(配下(東京店の識別子));
  });
});

caseTest("IT-M13-15-014", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("014"));
  const p = new BannerImagePage(page);
  const 準備 = [
    await 用意する(p, 東京店, "valid.png", "/banner/tc/tc-001-014.png"),
    await 用意する(p, 東京店, "valid.jpg", "/banner/tc/tc-002-014.jpg"),
    await 用意する(p, 大阪店, "valid.gif", "/banner/os/os-001-014.gif"),
  ];
  let urls: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.選択店舗を選ぶ(東京店); });
  await step(3, async () => { await p.選択店舗を選ぶ(全て); });
  await step(4, async () => { urls = await p.画像のURL(); note(`全店舗の一覧の件数: ${urls.length}`); });
  await expected(async () => {
    note("名古屋店の画像は、名古屋店だけに編集権限のある管理者がシードで用意した（このケースの管理者は名古屋店を編集できない）。ほかの店舗の画像もあるので、準備した画像が並ぶことと、名古屋店の画像が1件以上並ぶことで確かめた");
    expect.soft(await p.選択店舗の表示(), "選択店舗").toBe(全て);
    expect.soft(urls, "準備した東京店2画像と大阪店1画像が一覧にある").toEqual(expect.arrayContaining(準備));
    expect.soft(urls.filter((u) => u.includes(配下(名古屋店の識別子))).length, "名古屋店の画像の件数（1件以上）").toBeGreaterThan(0);
  });
});

caseTest("IT-M13-15-015", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("015"));
  const p = new BannerImagePage(page);
  const url = await 用意する(p, 東京店, "valid.png", "/banner/tc/tc-001-015.png");
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.選択店舗を選ぶ(東京店); });
  let 行数 = 0; let 画像 = "";
  await step(3, async () => {
    行数 = await p.行(url).count();
    画像 = 行数 === 1 ? await p.行の画像のアドレス(p.行(url)) : "";
  });
  await expected(async () => {
    expect.soft(行数, `URL「${url}」の行の数`).toBe(1);
    expect.soft(new URL(画像, page.url()).href, "同じ行の画像のアドレスが、行に表示されたURLと同じ").toBe(new URL(url, page.url()).href);
  });
});

// ---- アップロードしてもバナー設定は変わらない ----

caseTest("IT-M13-15-019", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("019"));
  const p = new BannerImagePage(page);
  let 前 = "";
  let 前の画像: string[] = [];
  await step(1, async () => {
    note("DB でなく、画像設定画面の上部のバナー設定の全欄を画面で読んで記録した（共有のバナー設定は書き換えない）");
    await p.開く();
    前 = await p.バナー設定の内容();
    前の画像 = await 店舗の画像(p, 東京店);
  });
  await step(2, async () => { await p.開く(); });
  await step(3, async () => { 結果を残す("valid.png", await p.アップロードする(東京店, 入力ファイル("valid.png"))); });
  let 後 = "";
  let 後の画像: string[] = [];
  await step(4, async () => {
    await p.開く();
    後 = await p.バナー設定の内容();
    後の画像 = await 店舗の画像(p, 東京店);
  });
  await expected(async () => {
    expect.soft(追加分(前の画像, 後の画像).length, "画像ファイルが1件保管された").toBe(1);
    expect.soft(後, "バナー設定の内容がアップロードの前から変わらない").toBe(前);
  });
});

// ---- 削除リンクの権限と削除 ----

caseTest("IT-M13-15-020", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("020"));
  const p = new BannerImagePage(page);
  const 東 = await 用意する(p, 東京店, "valid.png", "/banner/tc/tc-001-020.png");
  const 大 = await 用意する(p, 大阪店, "valid.gif", "/banner/os/os-001-020.gif");
  let 結果: { url: string; 識別子: string; リンク: boolean }[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.選択店舗を選ぶ(全て); });
  await step(3, async () => {
    結果 = [];
    for (const row of await p.画像の行.all()) {
      const url = ((await row.locator("td:first-child div.small").innerText()) ?? "").trim();
      結果.push({ url, 識別子: BannerImagePage.店舗の識別子(url), リンク: (await p.削除リンク(row).count()) > 0 });
    }
    note(`全店舗の一覧 ${結果.length} 件の削除リンク: ${結果.map((r) => `${r.識別子 || "?"}=${r.リンク ? "あり" : "なし"}`).join(" ")}`);
  });
  await expected(async () => {
    const 編集できる = new Set([東京店の識別子, 大阪店の識別子]);
    expect.soft(結果.find((r) => r.url === 東)?.リンク, "東京店の画像に削除リンクがある").toBe(true);
    expect.soft(結果.find((r) => r.url === 大)?.リンク, "大阪店の画像に削除リンクがある").toBe(true);
    expect.soft(結果.filter((r) => r.識別子 === 名古屋店の識別子).length, "名古屋店の画像の件数（1件以上）").toBeGreaterThan(0);
    for (const r of 結果) expect.soft(r.リンク, `画像「${r.url}」の削除リンク（編集権限のある東京店・大阪店だけにある）`).toBe(編集できる.has(r.識別子));
  });
});

/** 削除のケース（021〜023・034）の共通。全店舗の表示か東京店の表示で、準備した画像の「削除」を押す */
function 削除のケース(n: string, 絞り込み: string, 答え: "OK" | "キャンセル", 呼び名: string) {
  return async ({ page, step, expected }: CaseCtx) => {
    await loginAdmin(page, M1315_ADMIN(n));
    const p = new BannerImagePage(page);
    const url = await 用意する(p, 東京店, "valid.png", 呼び名);
    await step(1, async () => { await p.開く(); });
    await step(2, async () => { await p.選択店舗を選ぶ(絞り込み); });
    let ダイアログ: string | null = null;
    await step(3, async () => {
      await expect(p.削除リンク(p.行(url)), "削除する画像の「削除」").toBeVisible();
      note("「削除」を押すと確認ダイアログが出る。押す操作とダイアログの答えは、次の手順の1回の操作で行った");
    });
    await step(4, async () => { ダイアログ = await p.削除を押す(p.行(url), 答え); });
    await expected(async () => {
      note(`確認ダイアログの文: ${ダイアログ ?? "出なかった"}`);
      expect.soft(ダイアログ, "確認ダイアログが出た").not.toBeNull();
      expect.soft(await p.画像設定画面か(), "画像設定画面にいる").toBe(true);
      expect.soft(await p.選択店舗の表示(), `選択店舗が「${絞り込み}」のまま（絞り込みを保つ）`).toBe(絞り込み);
      const n = await p.行(url).count();
      if (答え === "OK") expect.soft(n, `削除した画像「${url}」が一覧に表示されない`).toBe(0);
      else expect.soft(n, `キャンセルした画像「${url}」が引き続き表示される`).toBe(1);
    });
  };
}

caseTest("IT-M13-15-021", 削除のケース("021", 全て, "OK", "/banner/tc/tc-001-021.png"));
caseTest("IT-M13-15-022", 削除のケース("022", 東京店, "OK", "/banner/tc/tc-002-022.jpg"));
caseTest("IT-M13-15-023", 削除のケース("023", 全て, "キャンセル", "/banner/tc/tc-001-023.png"));
caseTest("IT-M13-15-034", 削除のケース("034", 東京店, "キャンセル", "/banner/event/tc/M1315-034-A.png"));

// ---- イベント用とTOP用の保管先 ----

caseTest("IT-M13-15-030", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("030"));
  const p = new BannerImagePage(page);
  const url = await 用意する(p, 東京店, "valid.png", "/banner/event/tc/M1315-030-EVT.png");
  let urls: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.選択店舗を選ぶ(東京店); });
  await step(3, async () => { urls = await p.画像のURL(); });
  await expected(async () => {
    expect.soft(urls, "イベント用の保管先に置いた画像が一覧に表示される").toContain(url);
    expect.soft(url, `その画像のURL（${配下(東京店の識別子)} 配下）`).toContain(配下(東京店の識別子));
  });
});

caseTest("IT-M13-15-031", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("031"));
  const p = new BannerImagePage(page);
  const イベント用 = await 用意する(p, 東京店, "valid.png", "/banner/event/tc/M1315-031-EVT.png");
  // TOPバナー用の画像は、メニュー「データ管理」→「トップバナー管理」から、東京店（試験店舗）へアップロードして置く
  const TOP用 = await withAdminSession(browser, M1602_ADMIN, async (tp) => トップバナーの準備のアップロード(new TopBannerPage(tp), 東京店, 入力ファイル("valid.png")));
  note(`事前の準備: 正本の「/banner/tc/M1315-031-TOP.png」の代わりに、トップバナー管理から東京店（試験店舗）へ画像（valid.png）をアップロードし、増えた画像 ${TOP用} を使う`);
  let urls: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.選択店舗を選ぶ(東京店); });
  await step(3, async () => { urls = await p.画像のURL(); });
  await expected(async () => {
    expect.soft(urls, "イベント用の画像は一覧に表示される").toContain(イベント用);
    expect.soft(urls, "TOPバナー用の画像が一覧に表示されない").not.toContain(TOP用);
    expect.soft(urls.filter((u) => u.includes("/banner/top/")), "一覧にTOPバナー用の保管先の画像が無い").toEqual([]);
  });
});

// ---- 画像URLコピー ----

caseTest("IT-M13-15-033", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("033"));
  const p = new BannerImagePage(page);
  const url = await 用意する(p, 東京店, "valid.png", "/banner/event/tc/M1315-033-A.png");
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.選択店舗を選ぶ(東京店); });
  let 写した = "";
  await step(3, async () => {
    const r = await p.画像URLをコピーする(p.行(url));
    写した = r.写した文字;
    note(`「画像URLコピー」で写された文字（${r.方法}）: ${r.写した文字}`);
  });
  await step(4, async () => {
    note("ブラウザのアドレスバーへの貼り付けは自動では行えないので、クリップボードに入った文字（または入力ダイアログの文字）を読んで確かめた");
  });
  await expected(async () => {
    expect.soft(new URL(写した, page.url()).href, "貼り付けた内容が、行の下段に表示されているURLと同じ").toBe(new URL(url, page.url()).href);
  });
});

// ---- 店舗が空のアップロード ----

function 店舗が空のアップロード(n: string, 見る店: string[]) {
  return async ({ page, step, expected }: CaseCtx) => {
    await loginAdmin(page, M1315_ADMIN(n));
    const p = new BannerImagePage(page);
    const 前: Record<string, string[]> = {};
    await p.開く();
    for (const 店 of 見る店) 前[店] = await 店舗の画像(p, 店);
    note(`準備: アップロードの前の画像一覧を読んだ（${見る店.map((s) => `${s} ${前[s].length}件`).join("、")}）。画像は消さないので、あとの一覧と同じかで確かめる`);
    await step(1, async () => { await p.開く(); });
    await step(2, async () => { await p.ファイルを選ぶ(入力ファイル("valid.png")); });
    await step(3, async () => {
      await p.アップロード欄の店舗を空にする();
      note("開発者ツールで選択値を空にするのにあたる操作として、店舗の選択欄に空の選択肢を足してそれを選び、ブラウザの必須の検査の印を外した");
    });
    let 送った = false;
    await step(4, async () => { const r = await p.アップロードを押す(); 送った = r.送った; 結果を残す("店舗を空にして送信", r); });
    const 後: Record<string, string[]> = {};
    await step(5, async () => {
      for (const 店 of 見る店) 後[店] = await 店舗の画像(p, 店);
    });
    await expected(async () => {
      expect.soft(送った, "アップロードの要求が送られた").toBe(true);
      for (const 店 of 見る店) {
        expect.soft(追加分(前[店], 後[店]), `「${店}」の画像一覧に増えた画像が無い（画像が保管されていない）`).toEqual([]);
        expect.soft(後[店].length, `「${店}」の画像一覧の件数が送信前と同じ`).toBe(前[店].length);
      }
    });
  };
}

caseTest("IT-M13-15-035", 店舗が空のアップロード("035", [東京店, 大阪店]));
caseTest("IT-M13-15-036", 店舗が空のアップロード("036", [全て]));

// ---- 並び順 ----

/** 保管先のパスの降順か（上から順に、前の行のURLが次の行のURL以上か） */
const 降順か = (urls: string[]): boolean => urls.every((u, i) => i === 0 || urls[i - 1] >= u);

caseTest("IT-M13-15-039", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("039"));
  const p = new BannerImagePage(page);
  const 準備 = [
    await 用意する(p, 東京店, "valid.png", "/banner/event/tc/tc-001-039.png"),
    await 用意する(p, 東京店, "valid.jpg", "/banner/event/tc/tc-002-039.jpg"),
    await 用意する(p, 大阪店, "valid.gif", "/banner/event/os/os-001-039.gif"),
  ];
  let urls: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.選択店舗を選ぶ(全て); });
  await step(3, async () => { urls = await p.画像のURL(); note(`全店舗の一覧 ${urls.length} 件の先頭5件: ${urls.slice(0, 5).join("、")}`); });
  await expected(async () => {
    note("名前を決めた4画像の並びは、画面が採番する名前に変わったため、一覧全体が保管先のパスの降順に並ぶこと、準備した画像（東京店2・大阪店1）と名古屋店の画像が並ぶことで確かめた");
    expect.soft(urls, "準備した画像が一覧にある").toEqual(expect.arrayContaining(準備));
    expect.soft(urls.filter((u) => u.includes(配下(名古屋店の識別子))).length, "名古屋店の画像の件数（1件以上）").toBeGreaterThan(0);
    expect.soft(降順か(urls), "一覧全体が保管先のパスの降順に並ぶ").toBe(true);
  });
});

caseTest("IT-M13-15-040", async ({ page, step, expected }) => {
  await loginAdmin(page, M1315_ADMIN("040"));
  const p = new BannerImagePage(page);
  const 準備 = [
    await 用意する(p, 東京店, "valid.png", "/banner/event/tc/tc-001-040.png"),
    await 用意する(p, 東京店, "valid.jpg", "/banner/event/tc/tc-002-040.jpg"),
  ];
  await 用意する(p, 大阪店, "valid.gif", "/banner/event/os/os-001-040.gif");
  let urls: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.選択店舗を選ぶ(東京店); });
  await step(3, async () => { urls = await p.画像のURL(); note(`東京店の一覧 ${urls.length} 件: ${urls.join("、")}`); });
  await expected(async () => {
    note("名前を決めた2画像の並びは、画面が採番する名前に変わったため、東京店の一覧が東京店の画像だけで保管先のパスの降順に並ぶこと、準備した2画像が並ぶことで確かめた");
    expect.soft(urls, "準備した東京店の2画像が一覧にある").toEqual(expect.arrayContaining(準備));
    for (const u of urls) expect.soft(u, `一覧の画像「${u}」が東京店の保管先`).toContain(配下(東京店の識別子));
    expect.soft(降順か(urls), "一覧が保管先のパスの降順に並ぶ").toBe(true);
  });
});

// ---- アップロードした画像をバナー設定に使い、公開側に届く ----

caseTest("IT-M13-15-037", async ({ page, notes, step, expected, capture }) => {
  const 店舗ID = notes.get("〔店舗ID-M1302-QK共有〕");
  const top = new EventTopPage(page);
  const p = new BannerImagePage(page);
  const ALT = "QK特設バナー-1315-001";
  let 前のバナー: { alt: string; src: string }[] = [];
  await step(1, async () => {
    await top.open(店舗ID);
    前のバナー = await 大会特設ページ一覧のバナー(page);
    note(`手順1の大会特設ページ一覧のバナー: ${前のバナー.map((b) => b.alt || "（alt なし）").join("、") || "なし（一覧が出ていない）"}`);
  });
  await step(2, async () => { await loginAdmin(page, QK1302_ADMIN); });
  let 前のURL: string[] = [];
  await step(3, async () => {
    await p.イベント管理メニューを展開する();
    const item = p.メニューの項目("画像設定");
    if ((await item.count()) === 0) {
      const 画面へ = (await p.画像設定画面へのメニュー.allInnerTexts()).map((t) => t.trim());
      if (画面へ.length === 0) throw new Error(`「イベント管理」の下に画像設定画面を開く項目が無い（ある項目: ${(await p.イベント管理メニューの項目()).join("、")}）`);
      note(`「イベント管理」の下に「画像設定」という名前の項目が無いので、画像設定画面を開く項目「${画面へ.join("、")}」を押した（期待結果は公開側のバナーを見るもので、メニューの名前によらない）`);
      await p.メニューを押す(p.画像設定画面へのメニュー.first());
    } else {
      await p.メニューを押す(item);
    }
    await p.読み込みを待つ();
    前のURL = await p.画像のURL();
    await p.アップロード欄の店舗を選ぶ(QK連携店舗);
    await p.ファイルを選ぶ(入力ファイル("QK-1315-001.png"));
    結果を残す("QK-1315-001.png", await p.アップロードを押す());
  });
  let 控えたURL = "";
  await step(4, async () => {
    const added = (await p.画像のURL()).filter((u) => !前のURL.includes(u));
    if (added.length !== 1) throw new Error(`アップロードのあとの一覧に新しく出た画像が ${added.length} 件で、アップロードした画像の行を1つに決められない（${added.join("、")}）`);
    控えたURL = added[0];
    const row = p.行(控えたURL);
    const copied = await p.画像URLをコピーする(row);
    note(`画像の下段に表示されたURL（控えた）: ${控えたURL}。「画像URLコピー」で写された文字（${copied.方法}）: ${copied.写した文字}`);
    await capture("画像URLコピーを押した行");
  });
  await step(5, async () => {
    await p.イベント管理メニューを展開する();
    await p.メニューを押す(p.メニューの項目("バナー設定"));
    await p.読み込みを待つ();
    await p.バナー設定を入れる(1, {
      画像URL: 控えたURL, リンク先URL: "https://replace-dev.hareruyamtg.com:8443/qk1315-001-link", 表示店舗: [QK連携店舗], 言語: ["日本語"],
      表示タイプ: "特設のみ", 画像alt属性: ALT,
    });
    await p.バナー設定を押す("識別番号1のバナー設定");
  });
  let 後のバナー: { alt: string; src: string }[] = [];
  await step(6, async () => {
    await top.open(店舗ID);
    後のバナー = await 大会特設ページ一覧のバナー(page);
    note(`手順6の大会特設ページ一覧のバナー: ${後のバナー.map((b) => `${b.alt || "（alt なし）"}＝${b.src}`).join("、") || "なし（一覧が出ていない）"}`);
  });
  await expected(async () => {
    expect.soft(前のバナー.filter((b) => b.alt === ALT).length, `手順1の大会特設ページ一覧に alt「${ALT}」のバナーが無い`).toBe(0);
    const hit = 後のバナー.filter((b) => b.alt === ALT);
    expect.soft(hit.length, `手順6の大会特設ページ一覧に alt「${ALT}」のバナーが1件ある`).toBe(1);
    expect.soft(hit.map((b) => b.src), "そのバナーの画像が手順4で控えたURL").toContain(控えたURL);
    if ((await 大会特設ページ一覧(page).count()) > 0) {
      await 大会特設ページ一覧(page).first().scrollIntoViewIfNeeded();
      await capture("手順6の大会特設ページ一覧");
    }
  });
});
