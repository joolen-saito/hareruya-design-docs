/**
 * M08-02 メール一括送信。正本: cases/M08-02_test_cases.tsv
 * 実装しないケース: メールの受信内容・受信数を確かめるもの（011・015・016・019・021・023〜026・030・031・033・034。開発環境にメールの受け口が無い）、
 * メール文字コードの設定を書き換えるもの（024・025・033・034。共有の設定は書き換えない）。
 * 会員の更新日時・登録日時は画面で指定できないので、シードが実行の印つきの会員に限り DB に書く。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { DBの現在時刻, 件名の送信履歴, 会員の送信履歴, 送信履歴の件数, 送信成否の列 } from "../../db/m08_02";
import { 会員レコード全体 } from "../../db/m08_04";
import { M08CustomerListPage } from "../../pages/admin/m08_customer_list";
import { M08CustomerMailPage, M08MailHistoryPage } from "../../pages/admin/m08_customer_mail";
import { M0802_ADMIN, M0802_RH_ADMIN, RH検索語, ページング語, 検索語 } from "../../seeds/m08-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 会員検索一覧で語を検索して結果画面を開く（事前準備の「検索結果画面を開く」） */
async function 結果を開く(ctx: Pick<CaseCtx, "page">, 語: string): Promise<M08CustomerListPage> {
  await loginAdmin(ctx.page, M0802_ADMIN);
  const list = new M08CustomerListPage(ctx.page);
  await list.open();
  await list.searchMulti(語);
  return list;
}

caseTest("IT-M08-02-001", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const [a, b, c] = ["A", "B", "C"].map((x) => notes.get(`〔会員ID-M0802-001${x}〕`));
  await 結果を開く(ctx, 検索語("001"));
  const m = new M08CustomerMailPage(page);
  let 対象: { 会員ID: string; 氏名: string }[] = []; let 確認: { 件名: string; 本文: string } = { 件名: "", 本文: "" };
  await step(1, async () => { await m.一覧で選ぶ([a, b, c]); await m.その他からメール一括送信を押す(); });
  await step(2, async () => { await m.入力する("一括Mail-01", "本文Body-01"); });
  await step(3, async () => {
    const before = await m.会員IDリストを読む();
    const sep = before.includes(",") ? "," : "\n";
    await m.会員IDリストを変える([c, "999999", a, b].join(sep));
  });
  await step(4, async () => { await m.送信内容を確認を押す(); 対象 = await m.配信対象者(); 確認 = await m.確認画面の件名と本文(); });
  await expected(async () => {
    expect.soft(await m.確認画面である(), "メール一括送信確認画面が表示されている").toBe(true);
    expect.soft(確認.件名, "確認画面のタイトル").toContain("一括Mail-01");
    expect.soft(確認.本文, "確認画面の本文").toBe("本文Body-01");
    expect.soft(対象.map((x) => x.会員ID), "配信対象者の会員ID（会員ID昇順の3件だけ）").toEqual([a, b, c]);
    expect.soft(対象.map((x) => x.氏名), "配信対象者の氏名").toEqual(["青山 一郎", "井上 二郎", "上田 三郎"]);
  });
});

caseTest("IT-M08-02-002", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const id = notes.get("〔会員ID-M0802-002〕");
  await 結果を開く(ctx, 検索語("002"));
  const m = new M08CustomerMailPage(page);
  await step(1, async () => { await m.一覧で選ぶ([id]); await m.その他からメール一括送信を押す(); });
  await step(2, async () => { await m.入力画面である(); });
  await expected(async () => {
    expect.soft(await m.入力画面である(), "メール一括送信画面が表示されている").toBe(true);
    expect.soft(await m.ids.isVisible(), "対象会員IDリストの欄が画面上に表示されない").toBe(false);
    const text = await page.locator("main, #main, .c-contentsArea, body").first().innerText();
    expect.soft(text.includes(id), `会員ID ${id} が画面上に表示されない`).toBe(false);
  });
});

caseTest("IT-M08-02-003", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const id = notes.get("〔会員ID-M0802-003〕");
  const 語 = 検索語("003");
  await loginAdmin(page, M0802_ADMIN);
  const list = new M08CustomerListPage(page);
  const m = new M08CustomerMailPage(page);
  let 件名 = "", 本文 = "";
  await step(1, async () => { await list.open(); await list.searchMulti(語); await m.一覧で選ぶ([id]); await m.その他からメール一括送信を押す(); });
  await step(2, async () => { await m.入力する("戻る確認Title", "戻る確認Body"); await m.送信内容を確認を押す(); });
  await step(3, async () => { await m.戻るを押す(); 件名 = await m.件名を読む(); 本文 = await m.本文を読む(); });
  await expected(async () => {
    expect.soft(await m.入力画面である(), "メール一括送信画面に戻っている").toBe(true);
    expect.soft(件名, "再表示されたタイトル").toBe("戻る確認Title");
    expect.soft(本文, "再表示された本文").toBe("戻る確認Body");
  });
});

caseTest("IT-M08-02-004", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const id = notes.get("〔会員ID-M0802-004〕");
  const 語 = 検索語("004");
  await loginAdmin(page, M0802_ADMIN);
  const list = new M08CustomerListPage(page);
  const m = new M08CustomerMailPage(page);
  await step(1, async () => { await list.open(); await list.searchMulti(語); await m.一覧で選ぶ([id]); await m.その他からメール一括送信を押す(); });
  await step(2, async () => { await m.入力する("会員遷移Title", "会員遷移Body"); await m.送信内容を確認を押す(); });
  await step(3, async () => { await m.配信対象者の氏名を押す(id); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, `会員ID ${id} の会員登録/編集画面のアドレス`).toBe(`/admin/customer/${id}/edit`);
    expect.soft(await page.locator('[name="admin_customer[email]"]').count(), "会員登録/編集画面が表示されている").toBe(1);
  });
});

caseTest("IT-M08-02-012", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const ids = ["A", "B", "C"].map((x) => notes.get(`〔会員ID-M0802-012${x}〕`));
  await 結果を開く(ctx, 検索語("012"));
  const m = new M08CustomerMailPage(page);
  let r: { 遷移した: boolean; ダイアログ: string | null } = { 遷移した: false, ダイアログ: null };
  let 件数: number[] = [];
  await step(1, async () => { await m.一覧で全部外す(); });
  await step(2, async () => { r = await m.その他からメール一括送信を押す(); note(`押した結果: 画面遷移${r.遷移した ? "あり" : "なし"}、ダイアログ ${r.ダイアログ ?? "なし"}`); });
  await step(3, async () => { 件数 = ids.map(送信履歴の件数); });
  await expected(async () => {
    ids.forEach((id, i) => expect.soft(件数[i], `会員ID ${id} の送信履歴の件数（0件のまま）`).toBe(0));
  });
});

// ---- 会員一覧への戻り（005〜009） ----
const 全件を検索して開く = async (list: M08CustomerListPage): Promise<void> => {
  await list.open();
  await list.検索する();
};
const 全件検索の注記 = "会員検索一覧の初期表示には会員が並ばない（検索するまで結果が出ない）ので、条件を入れずに「検索」を押して全会員を更新日時の降順で表示し、その1ページ目で選んだ";

async function 戻り先の画面を読む(list: M08CustomerListPage): Promise<{ 検索語: string; 件数: string; ページ: string | null; ids: string[] }> {
  return { 検索語: await list.multi.inputValue(), 件数: await list.選択中の件数(), ページ: await list.現在のページ(), ids: await list.結果の会員ID() };
}

caseTest("IT-M08-02-005", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const L = notes.get("〔会員ID-M0802-005L〕");
  const 語 = ページング語("005");
  await loginAdmin(page, M0802_ADMIN);
  const list = new M08CustomerListPage(page);
  const m = new M08CustomerMailPage(page);
  await step(1, async () => { await list.open(); await list.searchMulti(語); });
  await step(2, async () => { await list.件数を選ぶ(10); await list.ページを開く(2); });
  await step(3, async () => { await m.一覧で選ぶ([L]); await m.その他からメール一括送信を押す(); });
  await step(4, async () => { await m.会員一覧を押す(); });
  await expected(async () => {
    const r = await 戻り先の画面を読む(list);
    expect.soft(r.検索語, "保持された検索条件（会員ID・メールアドレス・お名前）").toBe(語);
    expect.soft(r.件数, "保持された表示件数").toBe("10件");
    expect.soft(r.ページ, "現在のページ（2ページ目）").toBe("2");
    expect.soft(r.ids, `2ページ目の結果に会員ID ${L} がある`).toContain(L);
  });
});

caseTest("IT-M08-02-006", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const L = notes.get("〔会員ID-M0802-006L〕");
  const 語 = ページング語("006");
  await loginAdmin(page, M0802_ADMIN);
  const list = new M08CustomerListPage(page);
  const m = new M08CustomerMailPage(page);
  await step(1, async () => { await list.open(); await list.searchMulti(語); });
  await step(2, async () => { await list.件数を選ぶ(10); await list.ページを開く(2); });
  await step(3, async () => { await m.一覧で選ぶ([L]); await m.その他からメール一括送信を押す(); });
  await step(4, async () => { await m.入力する("検索復帰Title", "検索復帰Body"); await m.送信内容を確認を押す(); });
  await step(5, async () => { await m.検索結果へ戻るを押す(); });
  await expected(async () => {
    const r = await 戻り先の画面を読む(list);
    expect.soft(r.検索語, "保持された検索条件（会員ID・メールアドレス・お名前）").toBe(語);
    expect.soft(r.件数, "保持された表示件数").toBe("10件");
    expect.soft(r.ページ, "現在のページ（2ページ目）").toBe("2");
    expect.soft(r.ids, `2ページ目の結果に会員ID ${L} がある`).toContain(L);
  });
});

caseTest("IT-M08-02-007", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const L = notes.get("〔会員ID-M0802-007L〕");
  const 語 = ページング語("007");
  await loginAdmin(page, M0802_ADMIN);
  const list = new M08CustomerListPage(page);
  const m = new M08CustomerMailPage(page);
  await step(1, async () => { await list.open(); await list.searchMulti(語); });
  await step(2, async () => { await list.件数を選ぶ(10); await list.ページを開く(2); });
  await step(3, async () => { await m.一覧で選ぶ([L]); await m.その他からメール一括送信を押す(); });
  await step(4, async () => { await m.入力する("完了復帰Title", "完了復帰Body"); await m.送信内容を確認を押す(); });
  await step(5, async () => { await m.メール送信を押す(); });
  await step(6, async () => { await m.会員一覧を押す(); });
  await expected(async () => {
    const r = await 戻り先の画面を読む(list);
    expect.soft(r.検索語, "保持された検索条件（会員ID・メールアドレス・お名前）").toBe(語);
    expect.soft(r.件数, "保持された表示件数").toBe("10件");
    expect.soft(r.ページ, "現在のページ（2ページ目）").toBe("2");
    expect.soft(r.ids, `2ページ目の結果に会員ID ${L} がある`).toContain(L);
  });
});

caseTest("IT-M08-02-008", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const id = notes.get("〔会員ID-M0802-008〕");
  await loginAdmin(page, M0802_ADMIN);
  const list = new M08CustomerListPage(page);
  const m = new M08CustomerMailPage(page);
  await step(1, async () => { note(全件検索の注記); await 全件を検索して開く(list); await m.一覧で選ぶ([id]); await m.その他からメール一括送信を押す(); });
  await step(2, async () => { await m.会員一覧を押す(); });
  await expected(async () => {
    expect.soft(await list.現在のページ(), "現在のページ（1ページ目）").toBe("1");
    expect.soft(await list.結果の会員ID(), "1ページ目に会員ID が表示される（更新日時が最新）").toContain(id);
  });
});

caseTest("IT-M08-02-009", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const id = notes.get("〔会員ID-M0802-009〕");
  await loginAdmin(page, M0802_ADMIN);
  const list = new M08CustomerListPage(page);
  const m = new M08CustomerMailPage(page);
  await step(1, async () => { note(全件検索の注記); await 全件を検索して開く(list); await m.一覧で選ぶ([id]); await m.その他からメール一括送信を押す(); });
  await step(2, async () => { await m.入力する("既定ページTitle", "既定ページBody"); await m.送信内容を確認を押す(); });
  await step(3, async () => { await m.メール送信を押す(); });
  await step(4, async () => { await m.会員一覧を押す(); });
  await expected(async () => {
    expect.soft(await list.現在のページ(), "現在のページ（1ページ目）").toBe("1");
    expect.soft(await list.結果の会員ID(), "1ページ目に会員ID が表示される（更新日時が最新）").toContain(id);
  });
});

// ---- 送信（013〜022・027） ----
/** 検索結果から会員を選んでメール一括送信画面を開く（手順1） */
async function 対象で入力画面を開く(ctx: Pick<CaseCtx, "page">, 語: string, ids: string[]): Promise<M08CustomerMailPage> {
  const list = new M08CustomerListPage(ctx.page);
  const m = new M08CustomerMailPage(ctx.page);
  await list.open(); await list.searchMulti(語); await m.一覧で選ぶ(ids); await m.その他からメール一括送信を押す();
  return m;
}

caseTest("IT-M08-02-013", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const id = notes.get("〔会員ID-M0802-013〕");
  await loginAdmin(page, M0802_ADMIN);
  const m = new M08CustomerMailPage(page); let 履歴 = -1;
  await step(1, async () => { await 対象で入力画面を開く(ctx, 検索語("013"), [id]); });
  await step(2, async () => { await m.入力する("送信遷移Title", "送信遷移Body"); await m.送信内容を確認を押す(); });
  await step(3, async () => { await m.メール送信を押す(); 履歴 = 送信履歴の件数(id); });
  await expected(async () => {
    expect.soft(await m.完了画面である(), "メール一括送信完了画面が表示されている").toBe(true);
    expect.soft(履歴, "会員ID の送信履歴の件数（メール送信が実行された）").toBe(1);
  });
});

caseTest("IT-M08-02-014", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const ids = ["A", "B"].map((x) => notes.get(`〔会員ID-M0802-014${x}〕`));
  await loginAdmin(page, M0802_ADMIN);
  const m = new M08CustomerMailPage(page); let 文 = ""; let 行数 = -1;
  await step(1, async () => { await 対象で入力画面を開く(ctx, 検索語("014"), ids); });
  await step(2, async () => { await m.入力する("完了表示Title", "完了表示Body"); await m.送信内容を確認を押す(); });
  await step(3, async () => { await m.メール送信を押す(); });
  await step(4, async () => { 文 = await m.完了画面の文(); 行数 = await m.完了画面の宛先の行数(); });
  await expected(async () => {
    expect.soft(await m.完了画面である(), "メール一括送信完了画面が表示されている").toBe(true);
    expect.soft(文, "送信できた件数が表示されない").not.toMatch(/送信できた/);
    expect.soft(文, "送信できなかった件数が表示されない").not.toMatch(/送信できなかった|失敗/);
    expect.soft(文, "宛先一覧が表示されない").not.toMatch(/宛先/);
    expect.soft(行数, "宛先一覧の行数").toBe(0);
    for (const id of ids) expect.soft(文.includes(id), `会員ID ${id} が完了画面に表示されない`).toBe(false);
  });
});

caseTest("IT-M08-02-017", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const ids = ["A", "B"].map((x) => notes.get(`〔会員ID-M0802-017${x}〕`));
  await loginAdmin(page, M0802_ADMIN);
  const m = new M08CustomerMailPage(page); let t0 = 0; let t1 = 0;
  let 履歴: ReturnType<typeof 会員の送信履歴>[] = [];
  await step(1, async () => { await 対象で入力画面を開く(ctx, 検索語("017"), ids); });
  await step(2, async () => { await m.入力する("履歴Title-01", "履歴Body-01"); await m.送信内容を確認を押す(); });
  await step(3, async () => { t0 = DBの現在時刻(); await m.メール送信を押す(); t1 = DBの現在時刻(); });
  await step(4, async () => { 履歴 = ids.map(会員の送信履歴); note("送信日時が送信実行時かは、メール送信を押す前後のDBの現在時刻の幅（前後60秒の余裕つき）に入るかで確かめた"); });
  await expected(async () => {
    ids.forEach((id, i) => {
      const h = 履歴[i];
      expect.soft(h.length, `会員ID ${id} の送信履歴の件数`).toBe(1);
      const r = h[0];
      if (!r) return;
      expect.soft(r.件名, `会員ID ${id} の履歴の件名`).toBe("履歴Title-01");
      expect.soft(r.本文, `会員ID ${id} の履歴の本文`).toBe("履歴Body-01");
      expect.soft(r.会員ID, "履歴の宛先会員").toBe(id);
      expect.soft(r.送信日時 >= t0 - 60 && r.送信日時 <= t1 + 60, `会員ID ${id} の履歴の送信日時が送信実行時（${t0}〜${t1}）`).toBe(true);
      expect.soft(r.テンプレートID, `会員ID ${id} の履歴にテンプレートが記録されない`).toBeNull();
      expect.soft(r.作成者ID, `会員ID ${id} の履歴に作成者が記録されない`).toBeNull();
    });
    expect.soft(送信成否の列(), "送信履歴に送信成否が記録されない（成否を持つ項目が無い）").toEqual([]);
  });
});

caseTest("IT-M08-02-018", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const id = notes.get("〔会員ID-M0802-018〕");
  await loginAdmin(page, M0802_ADMIN);
  const m = new M08CustomerMailPage(page); let 前 = ""; let 後 = "";
  await step(1, async () => { 前 = 会員レコード全体(id); });
  await step(2, async () => { await 対象で入力画面を開く(ctx, 検索語("018"), [id]); });
  await step(3, async () => { await m.入力する("非更新Title", "非更新Body"); await m.送信内容を確認を押す(); });
  await step(4, async () => { await m.メール送信を押す(); });
  await step(5, async () => { 後 = 会員レコード全体(id); });
  await expected(async () => {
    expect.soft(前.length > 0, "送信前の会員レコードを読めた").toBe(true);
    expect.soft(後, "会員レコードが送信前の値から更新されていない").toBe(前);
  });
});

caseTest("IT-M08-02-020", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const [a, b] = ["A", "B"].map((x) => notes.get(`〔会員ID-M0802-020${x}〕`));
  await loginAdmin(page, M0802_ADMIN);
  const m = new M08CustomerMailPage(page); let 履歴: ReturnType<typeof 件名の送信履歴> = [];
  await step(1, async () => { await 対象で入力画面を開く(ctx, 検索語("020"), [a]); });
  await step(2, async () => { await m.会員IDリストを変える([b, a, b].join(",")); });
  await step(3, async () => { await m.入力する("重複履歴Title", "重複履歴Body"); await m.送信内容を確認を押す(); });
  await step(4, async () => { await m.メール送信を押す(); });
  await step(5, async () => { 履歴 = 件名の送信履歴("重複履歴Title", [a, b]); });
  await expected(async () => {
    expect.soft(履歴.filter((r) => r.会員ID === b).length, `会員ID ${b} の送信履歴の件数`).toBe(2);
    expect.soft(履歴.filter((r) => r.会員ID === a).length, `会員ID ${a} の送信履歴の件数`).toBe(1);
    expect.soft(履歴.length, "送信履歴の合計").toBe(3);
  });
});

caseTest("IT-M08-02-022", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const [a, b] = ["A", "B"].map((x) => notes.get(`〔会員ID-M0802-022${x}〕`));
  await loginAdmin(page, M0802_ADMIN);
  const m = new M08CustomerMailPage(page); let 履歴: ReturnType<typeof 件名の送信履歴> = [];
  await step(1, async () => { await 対象で入力画面を開く(ctx, 検索語("022"), [a]); });
  await step(2, async () => { await m.会員IDリストを変える([a, "999999", b].join(",")); });
  await step(3, async () => { await m.入力する("中断履歴Title", "中断履歴Body"); await m.送信内容を確認を押す(); });
  await step(4, async () => { await m.メール送信を押す(); });
  await step(5, async () => { 履歴 = 件名の送信履歴("中断履歴Title", [a, b]); });
  await expected(async () => {
    expect.soft(履歴.filter((r) => r.会員ID === a).length, `会員ID ${a} の送信履歴の件数`).toBe(1);
    expect.soft(履歴.filter((r) => r.会員ID === b).length, `会員ID ${b} の送信履歴の件数（登録されない）`).toBe(0);
    expect.soft(履歴.length, `送信履歴の合計（会員ID ${a} の1件だけ）`).toBe(1);
  });
});

caseTest("IT-M08-02-027", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const id = notes.get("〔会員ID-M0802-027〕");
  await loginAdmin(page, M0802_ADMIN);
  const m = new M08CustomerMailPage(page); let 履歴: ReturnType<typeof 件名の送信履歴> = [];
  await step(1, async () => { await 対象で入力画面を開く(ctx, 検索語("027"), [id]); });
  await step(2, async () => { await m.入力する("無変換履歴Title", "日本語本文たちつてと"); await m.送信内容を確認を押す(); });
  await step(3, async () => { await m.メール送信を押す(); });
  await step(4, async () => { 履歴 = 件名の送信履歴("無変換履歴Title", [id]); });
  await expected(async () => {
    expect.soft(履歴.length, "送信履歴の件数").toBe(1);
    expect.soft(履歴[0]?.本文, "送信履歴の本文（入力値のまま）").toBe("日本語本文たちつてと");
  });
});

// ---- 結合（032。専用の管理者） ----
caseTest("IT-M08-02-032", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const [a, b] = ["A", "B"].map((x) => notes.get(`〔会員ID-M0802-001${x}〕`));
  const 語 = RH検索語();
  const 件名 = "RH一括件名001";
  const list = new M08CustomerListPage(page);
  const m = new M08CustomerMailPage(page);
  const h = new M08MailHistoryPage(page);
  const 検索して開く = async (): Promise<void> => { await list.open(); await list.searchMulti(語); };
  const 履歴を開く = async (id: string): Promise<void> => { await 検索して開く(); await list.メール履歴を押す(id); };
  const 日付 = (): string => new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const 前日付 = 日付();
  const 前 = [0, 0]; const 後の行数 = [0, 0];
  let 対象: string[] = []; let 完了 = false;
  const 行: { 処理日: string; 通知メール: string }[] = []; const 窓: { 件名: string; 本文: string }[] = [];
  await step(1, async () => { await loginAdmin(page, M0802_RH_ADMIN); });
  await step(2, async () => { await 検索して開く(); });
  await step(3, async () => { await 履歴を開く(a); 前[0] = await h.件名の行の数(件名); });
  await step(4, async () => { await 履歴を開く(b); 前[1] = await h.件名の行の数(件名); });
  await step(5, async () => { await 検索して開く(); await m.一覧で選ぶ([a, b]); await m.その他からメール一括送信を押す(); });
  await step(6, async () => { await m.入力する(件名, "RH一括本文001"); await m.送信内容を確認を押す(); });
  await step(7, async () => { 対象 = (await m.配信対象者()).map((x) => x.会員ID); await m.メール送信を押す(); });
  await step(8, async () => { 完了 = await m.完了画面である(); });
  await step(9, async () => {
    await 履歴を開く(a);
    後の行数[0] = await h.件名の行の数(件名);
    行.push(await h.行の内容(件名));
    窓.push(await h.件名を押してポップアップを読む(件名));
  });
  await step(10, async () => {
    await 履歴を開く(b);
    後の行数[1] = await h.件名の行の数(件名);
    行.push(await h.行の内容(件名));
    窓.push(await h.件名を押してポップアップを読む(件名));
  });
  const 後日付 = 日付();
  await expected(async () => {
    expect.soft(前, "送信前の各会員の件名の行の数").toEqual([0, 0]);
    expect.soft([...対象].sort(), "確認画面の配信対象者").toEqual([a, b].sort());
    expect.soft(完了, "メール一括送信完了画面が表示された").toBe(true);
    expect.soft(後の行数, "送信後の各会員のメール配信履歴画面の件名の行の数").toEqual([1, 1]);
    [a, b].forEach((会員, i) => {
      expect.soft([前日付, 後日付].includes(行[i]?.処理日), `会員ID ${会員} の処理日が送信実行当日（${前日付}）`).toBe(true);
      expect.soft(行[i]?.通知メール, `会員ID ${会員} の通知メール`).toBe("テンプレート無し");
      expect.soft(窓[i]?.件名, `会員ID ${会員} のポップアップの件名`).toBe(件名);
      expect.soft(窓[i]?.本文, `会員ID ${会員} のポップアップの本文`).toBe("RH一括本文001");
    });
  });
});
