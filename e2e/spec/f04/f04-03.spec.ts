/** F04-03 配送先の新規登録・変更（共有の設定に触れないケース）。正本: cases/F04-03_test_cases.tsv */
import { test, Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { アドレス帳の件数, 会員の配送先, 処理中受注ID一覧, 受注の配送先 } from "../../db/f04_02";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { ShippingEditPage, ShoppingPage } from "../../pages/front/f04_shopping";
import { 状態の } from "../../seeds/f04-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const login = async (page: Page, seedId: string) => { await frontLogin(page, 状態の(seedId).会員); };
const tel = async (ed: ShippingEditPage) => [await ed.値(ed.電話1), await ed.値(ed.電話2), await ed.値(ed.電話3)];

async function 変更画面を開く(page: Page, 名称: string): Promise<ShippingEditPage> {
  const sp = new ShoppingPage(page);
  await sp.お届け先を選ぶ(名称);
  await sp.押して配送先画面へ(sp.お届け先情報を変更するボタン);
  return new ShippingEditPage(page);
}

caseTest("IT-F04-03-001", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-BASE-001");
  const sp = new ShoppingPage(page);
  const ed = new ShippingEditPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.お届け先を選ぶ("自宅住所-001"); });
  await step(3, async () => { await sp.押して配送先画面へ(sp.お届け先情報を変更するボタン); });
  await expected(async () => {
    expect.soft(await ed.値(ed.配送先名称), "配送先名称").toBe("自宅住所-001");
    expect.soft([await ed.値(ed.姓), await ed.値(ed.名)], "氏名（姓・名）").toEqual(["晴", "太郎"]);
    expect.soft(await tel(ed), "電話番号（1〜3）").toEqual(["03", "1234", "5678"]);
    expect.soft(await ed.値(ed.国), "国").toBe("Japan");
    expect.soft([await ed.値(ed.郵便番号1), await ed.値(ed.郵便番号2)], "郵便番号（1・2）").toEqual(["100", "0001"]);
    expect.soft(await ed.値(ed.都道府県), "都道府県").toBe("東京都");
    expect.soft(await ed.値(ed.住所1), "住所1").toBe("千代田区千代田");
    expect.soft(await ed.値(ed.住所2), "住所2").toBe("1-1");
  });
});

caseTest("IT-F04-03-024", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-BASE-024");
  const sp = new ShoppingPage(page);
  const ed = new ShippingEditPage(page);
  await sp.買い物かごから開く();
  note("事前準備のご注文方法指定画面はシードが開いて閉じたので、ケースの開始時に買い物かごから開き直した（手順1の前の準備）");
  await step(1, async () => { await 変更画面を開く(page, "自宅住所-024"); });
  await step(2, async () => {
    await ed.カナ姓.fill("");
    await ed.カナ名.fill("");
    await ed.郵便番号2.fill("");
    await ed.会社名.fill("");
    await ed.確認画面へ();
  });
  await step(3, async () => { await ed.確認画面で登録する(); });
  let row = 会員の配送先(notes.get("〔会員ID-F0403-024〕"), "自宅住所-024");
  await step(4, async () => { row = 会員の配送先(notes.get("〔会員ID-F0403-024〕"), "自宅住所-024"); });
  await expected(async () => {
    expect.soft(row?.配送先ID, "更新された配送先の番号").toBe(notes.get("〔配送先ID-F0403-024〕"));
    expect.soft(row?.姓カナ, "配送先氏名カナ（姓）").toBe("");
    expect.soft(row?.名カナ, "配送先氏名カナ（名）").toBe("");
    expect.soft(row?.郵便番号.slice(3), "郵便番号2").toBe("");
    expect.soft(row?.住所3, "住所3").toBe("");
    expect.soft(row?.会社名, "会社名").toBe("");
  });
});

caseTest("IT-F04-03-046", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-BASE-046");
  const sp = new ShoppingPage(page);
  const ed = new ShippingEditPage(page);
  await sp.買い物かごから開く();
  note("事前準備のご注文方法指定画面はシードが開いて閉じたので、ケースの開始時に買い物かごから開き直した（手順1の前の準備）");
  await step(1, async () => { await 変更画面を開く(page, "F0403-046-自宅住所"); });
  await step(2, async () => { await ed.住所2.fill("9-9"); await ed.確認画面へ(); });
  let row = 会員の配送先(notes.get("〔会員ID-F0403-046〕"), "F0403-046-自宅住所");
  await step(3, async () => { row = 会員の配送先(notes.get("〔会員ID-F0403-046〕"), "F0403-046-自宅住所"); });
  await expected(async () => {
    expect(row?.住所2, "確認画面のままでの配送先の住所2").toBe("1-1");
  });
});

caseTest("IT-F04-03-052", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-DP-OVS-052");
  const sp = new ShoppingPage(page);
  const ed = new ShippingEditPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.お届け先を選ぶ("海外確認住所-052"); });
  await step(3, async () => { await sp.押して配送先画面へ(sp.お届け先情報を変更するボタン); });
  await expected(async () => {
    expect.soft(await ed.値(ed.配送先名称), "配送先名称").toBe("海外確認住所-052");
    expect.soft(await ed.値(ed.国), "国").toBe("United States");
    expect.soft(await ed.値(ed.海外郵便番号), "海外住所用の郵便番号").toBe("10001");
    expect.soft(await ed.値(ed.住所1), "住所1").toBe("1 Main St");
    expect.soft(await ed.値(ed.住所2), "住所2").toBe("New York");
    expect.soft(await ed.値(ed.住所3), "住所3").toBe("Apt 5");
    expect.soft(await ed.表示されている(ed.都道府県), "都道府県の欄が表示されている").toBe(false);
    expect.soft(await ed.表示されている(ed.郵便番号1), "日本国内用の郵便番号の欄が表示されている").toBe(false);
  });
});


caseTest("IT-F04-03-057", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-CBNEW-057");
  const sp = new ShoppingPage(page);
  const ed = new ShippingEditPage(page);
  const 会員ID = () => notes.get("〔会員ID-F0403-057〕");
  await sp.買い物かごから開く();
  note("事前準備のご注文方法指定画面はシードが開いて閉じたので、ケースの開始時に買い物かごから開き直した（手順1の前の準備）");
  const before = アドレス帳の件数(会員ID());
  await step(1, async () => { await sp.押して配送先画面へ(sp.新しいお届け先を登録するボタン); });
  await step(2, async () => {
    await ed.配送先名称.fill("新規登録住所CBF0403-057");
    await ed.姓.fill("姓"); await ed.名.fill("名");
    await ed.電話1.fill("12345"); await ed.電話2.fill("12345"); await ed.電話3.fill("12345");
    await ed.郵便番号1.fill("100"); await ed.郵便番号2.fill("0001");
    await ed.国.selectOption({ label: "Japan" });
    await ed.都道府県.selectOption({ label: "東京都" });
    await ed.住所1.fill("千代田区千代田"); await ed.住所2.fill("1-1");
    await ed.確認画面へ();
  });
  await step(3, async () => { await ed.確認画面で登録する(); });
  let after = 0; let row = 会員の配送先(会員ID(), "新規登録住所CBF0403-057"); let ship = 受注の配送先(処理中受注ID一覧(会員ID())[0] ?? "0");
  await step(4, async () => {
    after = アドレス帳の件数(会員ID()); row = 会員の配送先(会員ID(), "新規登録住所CBF0403-057");
    ship = 受注の配送先(処理中受注ID一覧(会員ID())[0]);
  });
  await expected(async () => {
    expect.soft([before, after], "アドレス帳の件数（登録前・登録後）").toEqual([1, 2]);
    expect.soft(row?.配送先名称, "登録された配送先の配送先名称").toBe("新規登録住所CBF0403-057");
    expect.soft([ship.姓, ship.名, ship.住所1, ship.住所2], "注文手続き中の1件目の配送の配送先（姓・名・住所1・住所2）").toEqual(["姓", "名", "千代田区千代田", "1-1"]);
  });
});

caseTest("IT-F04-03-062", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-CBOPENNEW-062");
  const sp = new ShoppingPage(page);
  const ed = new ShippingEditPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.押して配送先画面へ(sp.新しいお届け先を登録するボタン); });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "配送先の新規登録・変更画面").toMatch(/\/shopping\/shipping_edit\//);
    await expect(ed.配送先名称, "配送先名称の入力欄").toBeVisible();
  });
});

caseTest("IT-F04-03-063", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-CBOPENCHG-063");
  const sp = new ShoppingPage(page);
  const ed = new ShippingEditPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.お届け先を選ぶ("変更表示住所CBF0403-063"); });
  await step(3, async () => { await sp.押して配送先画面へ(sp.お届け先情報を変更するボタン); });
  await expected(async () => {
    expect.soft(await ed.値(ed.配送先名称), "配送先名称").toBe("変更表示住所CBF0403-063");
    expect.soft(await ed.値(ed.住所1), "住所1").toBe("千代田区千代田");
    expect.soft(await ed.値(ed.住所2), "住所2").toBe("1-1");
  });
});
