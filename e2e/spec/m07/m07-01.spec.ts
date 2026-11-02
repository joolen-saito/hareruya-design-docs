/**
 * M07-01 買取検索一覧。正本: cases/M07-01_test_cases.tsv
 *
 * 画面だけで準備できるケースを実装した（記録 review/M07-01_progress_2026-11-02.md）。
 * DBでの準備が要るシード（MASTER・MEMBER・STATUS-DATE-002/005/009/010/011 ほか）を使うケースは実装していない。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { loginAdmin, adminUrl } from "../../lib/session";
import { BuyListPage, 買取番号の表示 } from "../../pages/admin/m07_buy";
import { M0701_ADMIN } from "../../seeds/m07-01";
import "../../seeds/m07-01";
import { 買取情報の件数 } from "../../db/m07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 検索結果の件数（0件の案内が出ていれば 0、結果の表があれば行数） */
async function 結果の件数(l: BuyListPage): Promise<number> {
  if (await l.page.getByText("検索条件に該当するデータがありませんでした。").count()) return 0;
  return (await l.行()).length;
}

caseTest("IT-M07-01-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  await step(1, async () => { await l.open(); });
  await expected(async () => {
    await expect.soft(page.locator("form#search_form label.col-form-label", { hasText: /^買取依頼日$/ }), "（比べるため）買取依頼日の検索欄は表示される").toHaveCount(1);
    for (const 名 of ["本人確認日", "振込失敗日", "査定中断日", "査定再開日"]) {
      await expect.soft(page.locator("form#search_form label.col-form-label", { hasText: new RegExp(`^${名}$`) }), `「${名}」の検索欄（From・To）が表示されない`).toHaveCount(0);
    }
  });
});

caseTest("IT-M07-01-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => {
    await l.買取番号を入れる("7011001");
    await l.注文者名を入れる("山田");
    await l.商品名を入れる(1, "青い龍");
    await l.買取状況を選ぶ(["注文"]);
    await l.本人確認を選ぶ("未確認");
    note("買取状況は「注文」、本人確認は「未確認」を選んだ（正本は選ぶ値を決めていない）");
  });
  await step(3, async () => { await l.検索条件をクリアする(); });
  await expected(async () => {
    expect.soft(await l.買取番号の欄().inputValue(), "買取番号の入力欄").toBe("");
    expect.soft(await l.注文者名の欄().inputValue(), "注文者名の入力欄").toBe("");
    expect.soft(await page.locator("#admin_purchase_list_product_name1").inputValue(), "商品名(1)の入力欄").toBe("");
    expect.soft(await page.locator("#admin_purchase_list_buy_order_status").evaluate((e) => (e as HTMLSelectElement).selectedOptions.length), "選択中の買取状況の数").toBe(0);
    expect.soft(await page.locator('input[name*="identityConfirmStatus"]:checked').count(), "チェック中の本人確認の数").toBe(0);
  });
});

caseTest("IT-M07-01-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる("abc"); });
  await step(3, async () => { await l.検索する(); });
  await expected(async () => {
    expect.soft(await 結果の件数(l), "検索結果の件数").toBe(0);
  });
});

caseTest("IT-M07-01-023", async ({ page, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる("9999999"); });
  await step(3, async () => { await l.検索する(); });
  await expected(async () => {
    await expect.soft(page.getByText("検索条件に該当するデータがありませんでした。"), "0件の通知").toBeVisible();
    await expect.soft(l.結果の表の行(), "検索結果一覧の行").toHaveCount(0);
    await expect.soft(l.ダウンロードのボタン(), "出力操作（ダウンロード▼）").toHaveCount(0);
  });
});

caseTest("IT-M07-01-024", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  const 番号 = notes.get("〔買取番号-M0701-024〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる(番号); });
  await step(3, async () => { await l.検索する(); });
  await expected(async () => {
    expect.soft((await l.行()).map((r) => r.買取番号), "検索結果一覧の買取番号").toEqual([買取番号の表示(番号)]);
    await expect.soft(l.ダウンロードのボタン(), "出力操作（ダウンロード▼）が表示される").toBeVisible();
  });
});

caseTest("IT-M07-01-026", async ({ page, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  await step(1, async () => {
    const res = await page.goto(adminUrl("/purchase/page/2"), { timeout: 60_000 });
    await page.waitForLoadState("load");
    note(`2ページ目を示すURL（/admin/purchase/page/2）を開いた。応答は ${res?.status()}`);
  });
  await expected(async () => {
    await expect.soft(l.検索フォーム(), "検索欄（初期表示と同じ）").toBeVisible();
    await expect.soft(l.結果の表の行(), "検索結果一覧の行").toHaveCount(0);
    await expect.soft(l.ページング(), "ページング").toHaveCount(0);
  });
});

caseTest("IT-M07-01-012", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  const 番号 = notes.get("〔買取番号-M0701-012〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる(番号); });
  await step(3, async () => { await l.検索する(); });
  await expected(async () => {
    expect.soft((await l.行()).map((r) => r.買取番号), "検索結果一覧の買取番号（それだけが表示される）").toEqual([買取番号の表示(番号)]);
  });
});

caseTest("IT-M07-01-043", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  const 番号 = notes.get("〔買取番号-M0701-043〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる(番号); });
  await step(3, async () => {
    // 検索の要求から、なりすまし対策トークンの欄を取り除いて送る
    const removed = await page.locator("form#search_form").evaluate((f) => {
      const els = Array.from(f.querySelectorAll('input[name="_token"], input[name$="[_token]"]'));
      els.forEach((e) => e.remove());
      return els.length;
    });
    note(`検索の送信前に、なりすまし対策トークンの欄を ${removed} 件取り除いた`);
    await l.検索する();
  });
  await expected(async () => {
    expect.soft((await l.行()).map((r) => r.買取番号), "トークンが無くても拒否されず、検索結果に出る買取番号").toEqual([買取番号の表示(番号)]);
  });
});

caseTest("IT-M07-01-045", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  const 番号 = notes.get("〔買取番号-M0701-045〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる(番号); await l.検索する(); });
  await step(3, async () => { await l.三点リーダーを押す(番号); });
  await step(4, async () => {
    const link = l.メニューの項目(番号).filter({ hasText: "編集" });
    await Promise.all([page.waitForLoadState("load"), link.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移した画面（買取編集画面）").toBe(`/admin/purchase/${Number(番号)}/edit`);
  });
});

caseTest("IT-M07-01-046", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  const 番号 = notes.get("〔買取番号-M0701-046〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる(番号); await l.検索する(); });
  await step(3, async () => { await l.三点リーダーを押す(番号); });
  let 行き先 = "";
  await step(4, async () => {
    const link = l.メニューの項目(番号).filter({ hasText: "メール通知" });
    行き先 = new URL((await link.getAttribute("href")) ?? "", page.url()).pathname;
    await Promise.all([page.waitForLoadState("load"), link.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移した画面（メール通知設定画面）").toBe(行き先);
    expect.soft(new URL(page.url()).pathname, "メール通知設定画面のアドレスに買取の番号を含む").toContain(String(Number(番号)));
    await expect.soft(page.locator("main, #contents, body").first(), "メール通知設定画面が表示される").toBeVisible();
  });
});

caseTest("IT-M07-01-047", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  const 番号 = notes.get("〔買取番号-M0701-047〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる(番号); await l.検索する(); });
  await step(3, async () => {
    // 三点リーダーから「削除」を押すと確認のダイアログが出る。次の手順でキャンセルを押すため、ここでは開いたままにしない
    await l.三点リーダーを押す(番号);
    await expect(l.メニューの項目(番号).filter({ hasText: "削除" }), "三点リーダーの「削除」").toBeVisible({ timeout: 30_000 });
  });
  let ダイアログ: string[] = [];
  await step(4, async () => { ダイアログ = await l.削除する(番号, "キャンセル"); });
  let 残り = -1;
  await step(5, async () => { 残り = 買取情報の件数(番号); });
  await expected(async () => {
    expect.soft(ダイアログ.length, "削除の確認のダイアログが出た回数").toBe(1);
    expect.soft(残り, "DBの、買取番号の買取情報の件数（削除されずに残る）").toBe(1);
  });
});

caseTest("IT-M07-01-048", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  const 番号 = notes.get("〔買取番号-M0701-048〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる(番号); await l.検索する(); });
  await step(3, async () => { await l.三点リーダーを押す(番号); });
  await step(4, async () => { await l.削除する(番号, "OK"); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移した画面（買取検索一覧画面）").toMatch(/^\/admin\/purchase\/(list|page\/\d+)?$/);
    await expect.soft(l.行の(番号), "削除した買取の行").toHaveCount(0);
  });
});

caseTest("IT-M07-01-052", async ({ page, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる("表示試験"); await l.検索する(); });
  await step(3, async () => { await l.ダウンロードを開く(); });
  const 項目 = ["古物台帳入力用CSV", "入金CSV", "買取商品一覧CSV", "買取商品（キャンセル）CSV", "戻しリストCSV", "戻しリストPDF"];
  const 一回目: boolean[] = [];
  await step(4, async () => {
    for (const 名 of 項目) 一回目.push(await l.ダウンロードの項目().filter({ hasText: 名 }).first().isVisible());
    await l.ダウンロードを開く();
  });
  await expected(async () => {
    項目.forEach((名, i) => expect.soft(一回目[i], `1回目の押下で「${名}」の操作が表示される`).toBe(true));
    for (const 名 of 項目) await expect.soft(l.ダウンロードの項目().filter({ hasText: 名 }).first(), `2回目の押下で「${名}」の操作が非表示になる`).toBeHidden();
  });
});

caseTest("IT-M07-01-053", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  const 番号 = notes.get("〔買取番号-M0701-053〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる(番号); await l.検索する(); });
  await step(3, async () => { await l.三点リーダーを押す(番号); });
  const 一回目: boolean[] = [];
  const 項目 = ["編集", "削除", "メール通知"];
  await step(4, async () => {
    for (const 名 of 項目) 一回目.push(await l.メニューの項目(番号).filter({ hasText: 名 }).first().isVisible());
    await l.三点リーダーを押す(番号);
  });
  await expected(async () => {
    項目.forEach((名, i) => expect.soft(一回目[i], `1回目の押下で「${名}」の操作が表示される`).toBe(true));
    for (const 名 of 項目) await expect.soft(l.メニューの項目(番号).filter({ hasText: 名 }).first(), `2回目の押下で「${名}」の操作が非表示になる`).toBeHidden();
  });
});

function 本人確認の表示(label: string, 期待: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M0701_ADMIN);
    const l = new BuyListPage(page);
    const 番号 = notes.get(label);
    await step(1, async () => { await l.open(); });
    await step(2, async () => { await l.検索条件をクリアする(); });
    await step(3, async () => { await l.買取番号を入れる(番号); await l.検索する(); });
    await step(4, async () => { await expect(l.行の(番号), "検索結果の対象の行").toBeVisible({ timeout: 30_000 }); });
    await expected(async () => {
      const r = (await l.行()).find((x) => x.番号 === String(Number(番号)));
      expect.soft(r?.本人確認 ?? "（行が無い）", "本人確認欄の表示").toBe(期待);
    });
  };
}
caseTest("IT-M07-01-085", 本人確認の表示("〔買取番号-M0701-085〕", "⚠️（未確認）"));
caseTest("IT-M07-01-086", 本人確認の表示("〔買取番号-M0701-086〕", "オンライン本人確認済み"));
caseTest("IT-M07-01-087", 本人確認の表示("〔買取番号-M0701-087〕", "簡易書留確認済み"));

caseTest("IT-M07-01-036", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  const 番号 = notes.get("〔買取番号-M0701-036〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる(番号); await l.検索する(); });
  await step(3, async () => { await expect(l.行の(番号), "検索結果の対象の行").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    const r = (await l.行()).find((x) => x.番号 === String(Number(番号)));
    expect.soft((await l.行()).length, "検索結果の行数（検索対象の1件だけ）").toBe(1);
    expect.soft(r?.利用回数 ?? "（行が無い）", "利用回数（全買取注文数）").toContain("4");
    expect.soft(r?.本人確認 ?? "（行が無い）", "本人確認の表示").toBe("確認中");
  });
});

caseTest("IT-M07-01-040", async ({ page, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる("表示試験"); await l.検索する(); });
  const 結果: { 名: string; ダイアログ: string[]; ファイル: boolean; ポップアップ: boolean }[] = [];
  await step(3, async () => {
    for (const 名 of ["古物台帳入力用CSV", "入金CSV", "買取商品一覧CSV", "買取商品（キャンセル）CSV", "戻しリストCSV", "戻しリストPDF"] as const) {
      const r = await l.ダウンロードを押す(名);
      結果.push({ 名, ダイアログ: r.ダイアログ, ファイル: r.file !== null, ポップアップ: r.popup !== null });
    }
  });
  await expected(async () => {
    for (const r of 結果) {
      expect.soft(r.ダイアログ.length, `「${r.名}」を選んだときの警告の数`).toBe(1);
      expect.soft(r.ファイル || r.ポップアップ, `「${r.名}」でファイル出力または戻しリスト画面への移動が始まる`).toBe(false);
    }
  });
});

caseTest("IT-M07-01-081", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.検索条件をクリアする(); });
  await step(3, async () => { await l.注文者名を入れる("M0701-081-X"); await l.検索する(); });
  await step(4, async () => { await expect(l.結果の表の行().first(), "検索結果の行").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    const rows = await l.行();
    for (const [x, 状況] of [["A", "注文"], ["B", "商品到着"], ["C", "査定中●"], ["D", "査定中断●"], ["E", "査定再開●"], ["F", "MTGBuyer査定完了●"]] as const) {
      const n = String(Number(notes.get(`〔買取番号-M0701-081${x}〕`)));
      expect.soft(rows.find((r) => r.番号 === n)?.買取状況 ?? "（行が無い）", `買取番号〔買取番号-M0701-081${x}〕の買取状況`).toBe(状況);
    }
  });
});

caseTest("IT-M07-01-083", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.検索条件をクリアする(); });
  await step(3, async () => { await l.注文者名を入れる("M0701-083-X"); await l.検索する(); });
  await step(4, async () => { await expect(l.結果の表の行().first(), "検索結果の行").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    const rows = await l.行();
    for (const [x, 状況] of [["A", "未登録在庫あり★"], ["B", "入庫待ち★"], ["C", "入庫済み（仕入れ完了）"]] as const) {
      const n = String(Number(notes.get(`〔買取番号-M0701-083${x}〕`)));
      expect.soft(rows.find((r) => r.番号 === n)?.買取状況 ?? "（行が無い）", `買取番号〔買取番号-M0701-083${x}〕の買取状況`).toBe(状況);
    }
  });
});

caseTest("IT-M07-01-035", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  const 番号 = notes.get("〔買取番号-M0701-035〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる(番号); await l.検索する(); });
  await expected(async () => {
    const r = (await l.行()).find((x) => x.番号 === String(Number(番号)));
    expect.soft(r !== undefined, "検索結果に買取番号の行がある").toBe(true);
    expect.soft(r?.取り消し注記 ?? false, "行にキャンセルを含む旨が表示される").toBe(true);
  });
});

caseTest("IT-M07-01-084", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  const 番号 = notes.get("〔買取番号-M0701-084〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.検索条件をクリアする(); });
  await step(3, async () => { await l.買取番号を入れる(番号); await l.検索する(); });
  await step(4, async () => { await expect(l.行の(番号), "検索結果の対象の行").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    const r = (await l.行()).find((x) => x.番号 === String(Number(番号)));
    expect.soft(r !== undefined, "検索結果に買取番号の行がある").toBe(true);
    expect.soft(r?.取り消し注記 ?? true, "行にキャンセルを含む旨が表示されない").toBe(false);
  });
});
