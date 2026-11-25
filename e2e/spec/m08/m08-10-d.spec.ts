/**
 * M08-10 本人確認の変更と買取の表示の連携（023・027）。正本: cases/M08-10_test_cases.tsv
 * 書いた: 023・027
 * 補い: 会員の姓・メールアドレスは実行の印つき。023 の会員名「連携 試験」は姓に印を付けた値。買取依頼日（実行日の前日）は E2E が作った買取だけ DB で書いた。
 * 補い: 身分証有効期限の入力は日付の入力欄の形「2028-05-31」（画面の表記は 2028/05/31）。
 */
import { expect, caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { BuyListPage } from "../../pages/admin/m07_buy";
import { 一覧から編集を開く } from "../../pages/admin/m07_03_edit";
import { M0810IdentificationPage } from "../../pages/admin/m08_10_identification";
import { M0810L_ADMIN, M0810RH_ADMIN } from "../../seeds/m08-10-d";

const 編集画面のパス = (id: string) => new URL(adminUrl(`/customer/${id}/edit`)).pathname;

async function 編集画面を開く(page: import("@playwright/test").Page, 会員ID: string): Promise<M0810IdentificationPage> {
  const e = new M0810IdentificationPage(page);
  const status = await e.open(会員ID);
  expect(status, `会員ID ${会員ID} の会員編集画面の応答`).toBe(200);
  return e;
}

caseTest("IT-M08-10-023", async ({ page, notes, step, expected }) => {
  const 会員ID = notes.get("〔会員ID-M0810-023〕");
  const 買取番号 = notes.get("〔買取番号-M0810-023〕");
  let e!: M0810IdentificationPage;
  await step(1, async () => { await loginAdmin(page, M0810L_ADMIN); });
  await step(2, async () => {
    e = await 編集画面を開く(page, 会員ID);
    await e.モーダルを開く();
  });
  await step(3, async () => {
    await e.期限を入れる("2028-05-31");
    await e.確認済に変更するを押す();
  });
  await step(4, async () => {
    expect((await e.上部の表示()).join(" / "), "画面上部の表示").toContain("保存しました");
    expect(new URL(page.url()).pathname, "保存後の画面（会員編集画面）のアドレス").toBe(編集画面のパス(会員ID));
  });
  const l = new BuyListPage(page);
  await step(5, async () => {
    await l.open();
    await l.買取番号を入れる(String(Number(買取番号)));
    await l.検索する();
  });
  let 本人確認 = "";
  await step(6, async () => {
    const rows = await l.行();
    const r = rows.find((x) => x.番号 === String(Number(買取番号)));
    expect(r, `買取番号 ${買取番号} の行`).toBeDefined();
    本人確認 = r!.本人確認;
  });
  await expected(async () => {
    expect(本人確認, "買取番号の行の本人確認（手順3で確認済に変更した会員のステータス）").toContain("オンライン本人確認済み");
    expect(本人確認, "本人確認に未確認が表示されない").not.toContain("未確認");
  });
});

caseTest("IT-M08-10-027", async ({ page, notes, step, expected }) => {
  const 会員ID = notes.get("〔会員ID-M0810-001〕");
  const 買取番号 = notes.get("〔買取番号-M0810-001〕");
  let e!: M0810IdentificationPage;
  let 前: Awaited<ReturnType<Awaited<ReturnType<typeof 一覧から編集を開く>>["基本情報"]>> | undefined;
  let 後: typeof 前;
  await step(1, async () => { await loginAdmin(page, M0810RH_ADMIN); });
  await step(2, async () => {
    const l = new BuyListPage(page);
    await l.open();
    await l.買取番号を入れる(String(Number(買取番号)));
    await l.検索する();
  });
  await step(3, async () => {
    const edit = await 一覧から編集を開く(page, 買取番号);
    前 = await edit.基本情報();
  });
  await step(4, async () => {
    e = await 編集画面を開く(page, 会員ID);
    await e.モーダルを開く();
  });
  await step(5, async () => {
    await e.期限を入れる("2028-05-31");
    await e.確認済に変更するを押す();
  });
  await step(6, async () => {
    expect((await e.上部の表示()).join(" / "), "画面上部の表示").toContain("保存しました");
    expect(new URL(page.url()).pathname, "保存後の画面（会員編集画面）のアドレス").toBe(編集画面のパス(会員ID));
  });
  await step(7, async () => {
    const edit = await 一覧から編集を開く(page, 買取番号);
    後 = await edit.基本情報();
  });
  await expected(async () => {
    expect.soft(後?.買取番号, "買取情報編集画面の基本情報の買取番号").toContain(String(Number(買取番号)));
    expect.soft(前?.本人確認, "手順3で表示されていた本人確認ステータス").toContain("未確認");
    expect.soft(後?.本人確認, "手順5のあとの本人確認ステータス").toContain("オンライン本人確認済み");
    expect.soft(後?.本人確認, "手順3の表示から変わっている").not.toBe(前?.本人確認);
  });
});
