/**
 * M14-02 カード情報CSV出力項目 のシードの作り方（画面操作）。正本: cases/M14-02_seed_data.tsv
 * - 試験管理者・マスター: 画面で「あれば使い、無ければ登録する」。
 * - 画面で登録するカードは、カード名・検索語に実行ごとの印を付ける（検索語 T は rc(T)、カード名の中の T も同じ）。
 * - カードCSVで登録するカード（019・023・024・025）は、正本がカード詳細IDを固定で定める（2402019001 など）ので、名前には印を付けない。
 *   正本の手順どおり、先に検索語で絞った一覧から1件ずつ削除してから取り込む（前の実行のカードを消すのは、この手順による）。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { buildCardCsv, downloadCardCsvTemplate, uploadCardCsv } from "../pages/admin/card_csv";
import { CardSearchPage, カードを登録する, カード詳細IDs, ensureFormatByName, ensureMaster, 検索結果を1件ずつ削除する } from "../pages/admin/m14_card";
import { ensureCardset } from "../pages/admin/product_masters";
import { ensureAnalysisAdmin } from "./m12-common";
import { 印 } from "./m14-01";

export const M1402_ADMIN: Account = { loginId: "m1402fg_admin", password: "Passw0rd-FGM1402" };
/**
 * 正本のカード詳細ID（2402019001 など）は、カード詳細IDの上限（約21億）を超えて保存できない（カードCSVの取り込みが失敗する）。
 * 上限に収まるように先頭の「24」を「14」に置き換えた番号（1402019001 など）で取り込む。番号は行の見分けにだけ使うので、他の中身は正本のとおり。
 */
export const 詳細ID = (正本のID: string): string => `14${正本のID.slice(2)}`;
const セット = "M1402-FG-SET", レアリティ = "M1402-FG-RARITY", レイアウト = "M1402-FG-LAYOUT", プロモ = "M1402-FG-PROMO";

defineSeed("S-M14-02-FGADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M14-02追加試験管理者", account: M1402_ADMIN, メール: "m1402fg_admin@example.test" });
});

defineSeed("S-M14-02-FGMASTER", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureCardset(page, セット, セット, "M1402FGS", (m) => reportSeedIssue(seed.シードID, m));
    // 正本のコード「M1402FGR」はレアリティのコード欄（2文字まで）に入らないので、2文字の「FG」で登録する（コードは試験が確かめない値）
    await ensureMaster(page, "レアリティ", レアリティ, レアリティ, seed.シードID, "FG");
    await ensureMaster(page, "カードレイアウト", レイアウト, レイアウト, seed.シードID);
    reportSeedIssue(seed.シードID, "レアリティのコードは、正本の「M1402FGR」（8文字）が欄の上限（2文字）を超えて保存できないので「FG」で登録した");
    await ensureMaster(page, "プロモーション", プロモ, プロモ, seed.シードID, "M1402FGP");
  });
});

const 共通詳細 = { レアリティ, レイアウト, プロモ種別: プロモ };

/** 画面で登録するカードを1件登録し、検索して控える */
async function 登録して控える(browser: import("@playwright/test").Browser, seedId: string, token: string, 入力: Parameters<typeof カードを登録する>[1], 呼び名: string): Promise<{ id: string; page詳細: string[] }> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await カードを登録する(page, 入力, seedId, (m) => reportSeedIssue(seedId, m));
    const l = new CardSearchPage(page);
    await l.open();
    await l.キーワードで検索する(rc(token));
    const ids = await l.表示中のカードID();
    if (ids.length !== 1) throw new Error(`${seedId}: 検索語「${rc(token)}」で ${ids.length} 件出た（1件のはず）`);
    void 呼び名;
    await page.goto(adminUrl(`/card/${ids[0]}/edit`));
    await page.waitForLoadState("load");
    return { id: ids[0], page詳細: await カード詳細IDs(page) };
  });
}

function 白(token: string, extra: Partial<Parameters<typeof カードを登録する>[1]> = {}): Parameters<typeof カードを登録する>[1] {
  return { カード名日: 印(token, `${token}-Card`), カード名英: 印(token, `${token}-Card`), 点数で見たマナ: "0", カラー: ["白"], 詳細: 共通詳細, ...extra };
}

defineSeed("S-M14-02-FGROWS-015", { needs: ["S-M14-02-FGMASTER"] }, async ({ browser, notes, seed }) => {
  const t = "M1402-FG015";
  const r = await 登録して控える(browser, seed.シードID, t, 白(t, { 詳細: [{ ...共通詳細, カードセット: セット }, { ...共通詳細 }] }), "");
  if (r.page詳細.length !== 2) throw new Error(`${seed.シードID}: カード詳細IDを2つ読めない（${r.page詳細.join("、")}）`);
  notes.set("〔カードID-M1402-015〕", r.id);
  notes.set("〔カード詳細ID-M1402-015A〕", r.page詳細[0]);
  notes.set("〔カード詳細ID-M1402-015B〕", r.page詳細[1]);
});

defineSeed("S-M14-02-FGFORMATS-017", { needs: ["S-M14-02-FGMASTER"] }, async ({ browser, notes, seed }) => {
  const t = "M1402-FG017";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [i, x] of ["A", "B", "C", "D", "E", "F"].entries()) {
      await ensureFormatByName(page, { 名日: `${t}-FMT${x}`, 名英: `${t}-FMT${x}`, コード: "", 並び順: String(9051 + i) }, seed.シードID, (m) => reportSeedIssue(seed.シードID, m));
    }
  });
  const r = await 登録して控える(browser, seed.シードID, t, 白(t, {
    リーガリティ: [["A", "使用可"], ["B", "使用可"], ["C", "制限"], ["D", "制限"], ["E", "禁止"], ["F", "禁止"]].map(([x, l]) => ({ フォーマット: `${t}-FMT${x}`, リーガリティ: l })),
  }), "");
  notes.set("〔カードID-M1402-017〕", r.id);
});

for (const [id, t, label] of [["S-M14-02-FGBLANKS-018", "M1402-FG018", "018"], ["S-M14-02-FGKEYWORD-020", "M1402-FG020", "020"], ["S-M14-02-FGNOSEL-022", "M1402-FG022", "022"]] as const) {
  defineSeed(id, { needs: ["S-M14-02-FGMASTER"] }, async ({ browser, notes, seed }) => {
    const r = await 登録して控える(browser, seed.シードID, t, 白(t), "");
    notes.set(`〔カードID-M1402-${label}〕`, r.id);
  });
}

/** カードCSVで登録するカード（カード詳細IDは正本の固定値）。先に検索語で絞った一覧から1件ずつ削除する */
async function CSVで登録する(browser: import("@playwright/test").Browser, seedId: string, token: string, 行: { name: string; detailId: string; backId?: string }[], 期待件数 = 行.length): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 消した = await 検索結果を1件ずつ削除する(page, token);
    if (消した) issue(`前の実行で作ったカード ${消した} 件を、正本の手順（検索して1件ずつ削除）で消してから取り込んだ`);
    issue("カード詳細IDは、正本の値（2402…）がIDの上限を超えて保存できないため、先頭の「24」を「14」にした番号で取り込んだ");
    const headers = await downloadCardCsvTemplate(page);
    const csv = buildCardCsv(headers, 行.map((r) => ({
      name_en: r.name, set: セット, rarity: レアリティ, layout: レイアウト, image_en: `img/goods/${token.toLowerCase()}.jpg`,
      card_detail_id: r.detailId, ...(r.backId ? { back_card_detail_id: r.backId } : {}),
    })));
    await uploadCardCsv(page, csv, `${token.toLowerCase()}-cards.csv`, `${seedId} のカードCSV登録`, issue);
    const l = new CardSearchPage(page);
    await l.open();
    await l.キーワードで検索する(token);
    const n = (await l.検索結果件数()) ?? 0;
    if (n !== 期待件数) throw new Error(`${seedId}: 取り込み後の検索で ${n} 件出た（${期待件数} 件のはず）`);
  });
}
defineSeed("S-M14-02-FGBACK-019", { needs: ["S-M14-02-FGMASTER"] }, async ({ browser, seed }) => {
  await CSVで登録する(browser, seed.シードID, "M1402-FG019", [{ name: "M1402-FG019-Card", detailId: 詳細ID("2402019002") }, { name: "M1402-FG019-Card", detailId: 詳細ID("2402019001"), backId: 詳細ID("2402019002") }], 1);
});
defineSeed("S-M14-02-FGPAGE-023", { needs: ["S-M14-02-FGMASTER"] }, async ({ browser, seed }) => {
  await CSVで登録する(browser, seed.シードID, "M1402-FG023", Array.from({ length: 11 }, (_, i) => ({
    name: `M1402-FG023-Card-${String(i + 1).padStart(2, "0")}`, detailId: 詳細ID(String(2402023001 + i)),
  })));
});
defineSeed("S-M14-02-FGPARTIAL-024", { needs: ["S-M14-02-FGMASTER"] }, async ({ browser, seed }) => {
  await CSVで登録する(browser, seed.シードID, "M1402-FG024", [{ name: "M1402-FG024-Card-A", detailId: 詳細ID("2402024001") }, { name: "M1402-FG024-Card-B", detailId: 詳細ID("2402024002") }]);
});
defineSeed("S-M14-02-FGALLGONE-025", { needs: ["S-M14-02-FGMASTER"] }, async ({ browser, seed }) => {
  await CSVで登録する(browser, seed.シードID, "M1402-FG025", [{ name: "M1402-FG025-Card-A", detailId: 詳細ID("2402025001") }, { name: "M1402-FG025-Card-B", detailId: 詳細ID("2402025002") }]);
});
