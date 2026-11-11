/**
 * F06-18 会員情報変更。正本: cases/F06-18_test_cases.tsv
 * テストデータの読み替え（依頼者の方針 2026-11-10）は seeds/f06-18.ts の先頭と、各シードの注記（シード作成時の問題）に残す。
 * 記録 review/F06-18_progress_2026-11-10.md
 */
import { Browser, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { 会員の値, 会員の行全体, 選手の値, 選手の行全体, 配送先, 配送先の行全体 } from "../../db/f06_18";
import { openEditFromResult, readEdit, resultCustomerId, resultRow, searchCustomer, deliveryRows } from "../../pages/admin/f06_customer";
import { オンライン本人確認のポップアップを読む } from "../../pages/admin/f06_18_setup";
import { M08CustomerEditPage } from "../../pages/admin/m08_customer_edit";
import { LoginPage } from "../../pages/front/f06_03_login";
import { ChangePage, 会員としてログインする, 完了画面のパス, 変更画面のパス, 自動ログイン用Cookieだけを入れる } from "../../pages/front/f06_18_change";
import { PC_ADMIN, ブラックリストの値, 会員, 印つきメール, 既定でない配送先, 自動ログインのCookie } from "../../seeds/f06-18";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 送信の注記 = (sent: boolean) => { if (!sent) note("「変更する」を押したが、ブラウザ側の入力チェックが送信を止めた（画面は送り直されていない）"); };

/** 「サイトデータを消去したブラウザで、この会員として会員ログインを完了する」（ケースの新しいブラウザで本店の会員ログイン画面からログイン） */
async function ログインする(page: Page, seedId: string): Promise<ChangePage> {
  const m = 会員(seedId);
  await 会員としてログインする(page, m.メール, m.パスワード);
  return new ChangePage(page);
}
const 郵便番号の形 = (v: string | null | undefined) => { const d = (v ?? "").replace(/\D/g, ""); return d.length === 7 ? `${d.slice(0, 3)}-${d.slice(3)}` : (v ?? ""); };
const 電話 = (r: Record<string, string | null> | undefined) => `${r?.電話1 ?? ""}${r?.電話2 ?? ""}${r?.電話3 ?? ""}`;
const 郵便番号の比べ方 = "郵便番号はDBに数字7桁で保存される（画面は3桁と4桁の2つの欄）。保存された値を3桁-4桁の形にして比べた";

// ---------------------------------------------------------------------------
// 画面に入れる条件（自動ログイン）
// ---------------------------------------------------------------------------
caseTest("IT-F06-18-002", async ({ page, step, expected }) => {
  await 自動ログイン用Cookieだけを入れる(page.context(), 自動ログインのCookie("S-F06-18-AUTO-002"));
  const c = new ChangePage(page);
  await step(1, async () => { await c.開く(); });
  await expected(async () => {
    expect.soft(await c.変更画面である(), "会員情報変更画面の入力フォームが表示されている").toBe(false);
    expect.soft(c.path, "開いた結果の画面のアドレス（会員情報変更画面でない）").not.toBe(変更画面のパス);
  });
});

caseTest("IT-F06-18-003", async ({ page, notes, step, expected }) => {
  await 自動ログイン用Cookieだけを入れる(page.context(), 自動ログインのCookie("S-F06-18-AUTO-003"));
  const m = 会員("S-F06-18-AUTO-003");
  const c = new ChangePage(page);
  await step(1, async () => {
    note(`会員ログイン画面のログインIDの欄はメールアドレス（会員IDでは照合しない作り）。会員ID ${notes.get("〔会員ID-F0618-003〕")} の会員のメールアドレス ${m.メール} を入れた`);
    const l = new LoginPage(page);
    await l.ログイン画面を開く("本店");
    await l.ログインする(m.メール, "Passw0rd!0618");
  });
  await step(2, async () => { await c.開く(); });
  await expected(async () => {
    expect.soft(c.path, "開いた画面のアドレス").toBe(変更画面のパス);
    expect.soft(await c.変更画面である(), "会員情報変更画面の入力フォームが表示されている").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 表示（共有の参照会員）
// ---------------------------------------------------------------------------
caseTest("IT-F06-18-004", async ({ page, step, expected }) => {
  const m = 会員("S-F06-18-JP");
  const c = await ログインする(page, "S-F06-18-JP");
  const v: Record<string, string> = {};
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => {
    for (const [k, n] of [["姓", "name][name01"], ["名", "name][name02"], ["セイ", "kana][kana01"], ["メイ", "kana][kana02"], ["メール", "email][first"],
      ["郵便1", "postalCode][postalCode01"], ["郵便2", "postalCode][postalCode02"], ["住所1", "address][addr01"], ["住所2", "address][addr02"],
      ["電話1", "tel][tel01"], ["電話2", "tel][tel02"], ["電話3", "tel][tel03"], ["会社名", "company_name"], ["MTG姓", "Player][lastNameEn"], ["MTG名", "Player][firstNameEn"]]) v[k] = await c.値(n);
    for (const [k, n] of [["年", "birth][year"], ["月", "birth][month"], ["日", "birth][day"], ["性別", "sex"], ["都道府県", "address][pref"], ["職業", "job"]]) v[k] = await c.選択中の表示(n);
    v["本人確認"] = await c.本人確認状況();
  });
  await expected(async () => {
    expect.soft(`${v.姓} ${v.名}`, "お名前（姓 名）").toBe("佐藤 太郎");
    expect.soft(`${v.セイ} ${v.メイ}`, "フリガナ（姓 名）").toBe("サトウ タロウ");
    expect.soft(`${v.年}/${v.月}/${v.日}`, "生年月日（年/月/日の選択の表示）").toMatch(/^1990\D*\/0?1\D*\/0?2\D*$/);
    expect.soft(v.性別, "性別").toBe("男性");
    expect.soft(v.メール, "メールアドレス").toBe(m.メール);
    expect.soft(`${v.郵便1}-${v.郵便2}`, "郵便番号").toBe("100-0001");
    expect.soft(`${v.都道府県} ${v.住所1} ${v.住所2}`, "住所（都道府県 住所1 住所2）").toBe("東京都 千代田区千代田 1番");
    expect.soft(`${v.電話1}${v.電話2}${v.電話3}`, "電話番号").toBe("0311111111");
    expect.soft(v.会社名, "会社名").toBe("試験会社");
    expect.soft(v.職業, "職業").toBe("会社員");
    expect.soft(v.本人確認, "本人確認状況ステータス（シードで管理画面に登録した値）").toBe(m.本人確認);
    expect.soft(v.MTG姓, "MTG Campaign 登録名(姓)").toBe("SATO");
    expect.soft(v.MTG名, "MTG Campaign 登録名(名)").toBe("TARO");
  });
});

caseTest("IT-F06-18-006", async ({ page, step, expected }) => {
  const c = await ログインする(page, "S-F06-18-JP");
  let opts: string[] = [];
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => {
    note("ブラウザの選択欄の一覧（ネイティブの選択肢の窓）は画面のキャプチャに写らないので、職業の選択欄を押したうえで、選択欄が持つ選択肢を読んだ");
    await c.f("job").click({ timeout: 30_000 });
    opts = await c.職業の選択肢();
    await page.keyboard.press("Escape").catch(() => undefined);
  });
  await expected(async () => {
    expect.soft(opts, "職業の選択肢に「会社員」がある").toContain("会社員");
    expect.soft(opts, "職業の選択肢に「学生」がある").toContain("学生");
  });
});

/** 国の切り替え（007〜009）: 選んだあとの郵便番号の形・都道府県・住所3 */
function 国切替(seedId: string, 国: string, 日本か: boolean) {
  return async ({ page, step, expected }: CaseCtx) => {
    const c = await ログインする(page, seedId);
    await step(1, async () => { await c.開いて待つ(); });
    await step(2, async () => {
      const reloaded = await c.国を選ぶ(国);
      if (!reloaded) note(`国はすでに「${国}」なので、選び直しても画面は読み込み直さない`);
    });
    await expected(async () => {
      if (日本か) {
        expect.soft(await c.郵便番号の印が見えるか(), "郵便番号の前の「〒」").toBe(true);
        expect.soft(await c.日本の郵便番号欄(), "郵便番号の欄が3桁と4桁の2つに分かれて表示される").toBe(true);
        expect.soft(await c.郵便番号の区切りが見えるか(), "郵便番号の2つの欄の間の区切り").toBe(true);
        expect.soft(await c.海外の郵便番号欄(), "汎用の郵便番号の欄（1つの欄）").toBe(false);
        expect.soft(await c.都道府県欄(), "住所(都道府県)の欄").toBe(true);
        expect.soft(await c.住所3欄(), "住所(住所3)の欄").toBe(false);
      } else {
        expect.soft(await c.海外の郵便番号欄(), "汎用の郵便番号の欄（1つの欄）").toBe(true);
        expect.soft(await c.日本の郵便番号欄(), "日本の郵便番号の欄（3桁と4桁の2つ）").toBe(false);
        expect.soft(await c.郵便番号の印が見えるか(), "郵便番号の前の「〒」").toBe(false);
        expect.soft(await c.都道府県欄(), "住所(都道府県)の欄").toBe(false);
        expect.soft(await c.住所3欄(), "住所(住所3)の欄").toBe(true);
      }
    });
  };
}
caseTest("IT-F06-18-007", 国切替("S-F06-18-JP", "Japan", true));
caseTest("IT-F06-18-008", 国切替("S-F06-18-JP", "United States", false));
caseTest("IT-F06-18-009", 国切替("S-F06-18-OVERSEAS", "Japan", true));

caseTest("IT-F06-18-010", async ({ page, step, expected }) => {
  const c = await ログインする(page, "S-F06-18-JP");
  let got: [string, string] = ["", ""];
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => { await c.MTG登録名を入れる("COUNTRY", "SWITCH"); });
  await step(3, async () => {
    const reloaded = await c.国を選ぶ("United States");
    expect(reloaded, "国を変えて画面が読み込み直された").toBe(true);
    got = await c.MTG登録名();
  });
  await expected(async () => {
    expect.soft(got[0], "再表示されたフォームの MTG Campaign 登録名(姓)").toBe("COUNTRY");
    expect.soft(got[1], "再表示されたフォームの MTG Campaign 登録名(名)").toBe("SWITCH");
  });
});

caseTest("IT-F06-18-011", async ({ page, step, expected }) => {
  const c = await ログインする(page, "S-F06-18-JP");
  let sent = false;
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => { await c.MTG登録名を入れる("VALIDATION", "ERROR"); });
  await step(3, async () => { await c.入れる("name][name01", ""); });
  await step(4, async () => { sent = (await c.変更するを押す()).sent; 送信の注記(sent); });
  await expected(async () => {
    const err = await c.エラー文();
    expect.soft(err.length, `検証エラーの表示の数（${err.join(" / ")}）`).toBeGreaterThan(0);
    expect.soft(c.path, "会員情報変更画面のまま（完了画面へ移らない）").toBe(変更画面のパス);
    const [姓, 名] = await c.MTG登録名();
    expect.soft(姓, "MTG Campaign 登録名(姓)").toBe("VALIDATION");
    expect.soft(名, "MTG Campaign 登録名(名)").toBe("ERROR");
  });
});

caseTest("IT-F06-18-012", async ({ page, step, expected }) => {
  const c = await ログインする(page, "S-F06-18-JP");
  let n = -1;
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => {
    expect(await c.日本の郵便番号欄(), "郵便番号の欄が表示されている").toBe(true);
    n = await c.郵便番号から自動入力ボタンの数();
  });
  await expected(async () => { expect.soft(n, "「郵便番号から自動入力」ボタンの数").toBe(0); });
});

// ---------------------------------------------------------------------------
// 保存（DB確認）
// ---------------------------------------------------------------------------
caseTest("IT-F06-18-014", async ({ page, notes, step, expected }) => {
  const c = await ログインする(page, "S-F06-18-JP-014");
  const 新メール = 印つきメール("f0618-updated@example.com");
  let r: ReturnType<typeof 会員の値>;
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => {
    note("国を変えると画面がフォームを送り直して入力欄が入れ替わるので、先に国を「United States」にしてから、ほかの項目を入れた");
    await c.国を選ぶ("United States");
    await c.お名前を入れる("山田", "花子");
    await c.フリガナを入れる("ヤマダ", "ハナコ");
    await c.生年月日を選ぶ("1991", "2", "3");
    await c.選ぶ("sex", "女性");
    await c.メールを入れる(新メール);
    await c.海外の郵便番号を入れる("1234567890");
    await c.入れる("address][addr01", "350 Fifth Avenue");
    await c.入れる("address][addr02", "New York");
    await c.入れる("address][addr03", "Room 1801");
    await c.電話番号を入れる("0312345678");
    await c.入れる("company_name", "更新会社");
    await c.選ぶ("job", "会社員");
  });
  await step(3, async () => { 送信の注記((await c.変更するを押す()).sent); });
  await step(4, async () => { r = 会員の値(notes.get("〔会員ID-F0618-014〕")); });
  await expected(async () => {
    expect.soft(`${r?.姓} ${r?.名}`, "氏名").toBe("山田 花子");
    expect.soft(`${r?.セイ} ${r?.メイ}`, "カナ").toBe("ヤマダ ハナコ");
    expect.soft(r?.生年月日, "生年月日").toBe("1991-02-03");
    expect.soft(r?.性別, "性別").toBe("女性");
    expect.soft(r?.メールアドレス, "メールアドレス（更新先に実行の印つき）").toBe(新メール);
    expect.soft(r?.国, "国").toBe("United States");
    expect.soft(r?.海外郵便番号, "郵便番号（海外の郵便番号）").toBe("1234567890");
    expect.soft(r?.住所1, "住所1").toBe("350 Fifth Avenue");
    expect.soft(r?.住所2, "住所2").toBe("New York");
    expect.soft(r?.住所3, "住所3").toBe("Room 1801");
    expect.soft(電話(r), "電話番号（3つの欄をつなげた値）").toBe("0312345678");
    expect.soft(r?.会社名, "会社名").toBe("更新会社");
    expect.soft(r?.職業, "職業").toBe("会社員");
  });
});

caseTest("IT-F06-18-015", async ({ page, step, expected }) => {
  const m = 会員("S-F06-18-JP-015");
  const 新メール = 印つきメール("player-updated@example.com");
  const 前 = 選手の値(m.会員ID);
  note(`変更前の選手情報更新日時（DBの参照）: ${前?.更新日時}`);
  const c = await ログインする(page, "S-F06-18-JP-015");
  let p: ReturnType<typeof 選手の値>;
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => {
    await c.お名前を入れる("山田", "花子");
    await c.メールを入れる(新メール);
    await c.MTG登録名を入れる("YAMADA", "HANAKO");
  });
  await step(3, async () => { 送信の注記((await c.変更するを押す()).sent); });
  await step(4, async () => { p = 選手の値(m.会員ID); });
  await expected(async () => {
    expect.soft(p?.連絡先アドレス, "選手情報の連絡先アドレス（実行の印つき）").toBe(新メール);
    expect.soft(`${p?.英字姓}・${p?.英字名}`, "英字姓・名").toBe("YAMADA・HANAKO");
    expect.soft(`${p?.和文姓}・${p?.和文名}`, "和文姓・名").toBe("山田・花子");
    expect.soft(p?.更新日時, `更新日時（変更前 ${前?.更新日時} から変わる）`).not.toBe(前?.更新日時);
  });
});

caseTest("IT-F06-18-017", async ({ page, step, expected }) => {
  const c = await ログインする(page, "S-F06-18-JP-017");
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => { await c.入れる("company_name", "完了遷移確認会社"); });
  await step(3, async () => { 送信の注記((await c.変更するを押す()).sent); });
  await expected(async () => {
    expect.soft(c.path, "遷移した画面のアドレス（会員情報変更完了画面）").toBe(完了画面のパス);
    await expect.soft(c.パンくず現在地.first(), "会員情報変更完了画面の見出し（パンくずの現在地）").toHaveText(/会員情報変更\(完了\)/);
  });
});

/** パスワードを変える（019・034・036・058・060）。期待結果: DBのパスワードが従前の値から変わる（019 は平文と違う暗号化された値も） */
function パスワード変更(seedId: string, 新: string, 平文も見る: boolean) {
  return async ({ page, step, expected }: CaseCtx) => {
    const m = 会員(seedId);
    const 前 = 会員の値(m.会員ID)?.パスワード ?? "";
    note("開始時のパスワードの保存値をDBの参照で控えた");
    const c = await ログインする(page, seedId);
    let 後 = "";
    await step(1, async () => { await c.開いて待つ(); });
    await step(2, async () => { await c.パスワードを入れる(新); });
    await step(3, async () => { 送信の注記((await c.変更するを押す()).sent); });
    await step(4, async () => { 後 = 会員の値(m.会員ID)?.パスワード ?? ""; });
    await expected(async () => {
      expect.soft(後, "DBのパスワード（従前の値から変わる）").not.toBe(前);
      if (平文も見る) {
        expect.soft(後, `DBのパスワード（入力した平文「${新}」とは異なる）`).not.toBe(新);
        expect.soft(後.length, "DBのパスワード（暗号化された値として空でない）").toBeGreaterThan(新.length);
      }
    });
  };
}
caseTest("IT-F06-18-019", パスワード変更("S-F06-18-JP-019", "NewPass!0618", true));
caseTest("IT-F06-18-034", パスワード変更("S-F06-18-JP-034", "Ab1!xyZ9", false));
caseTest("IT-F06-18-036", パスワード変更("S-F06-18-JP-036", "Ab1!".repeat(8), false));
caseTest("IT-F06-18-058", パスワード変更("S-F06-18-JP-058", "Ab1!xyZ9Qw2#", false));
caseTest("IT-F06-18-060", パスワード変更("S-F06-18-JP-060", "Ab1!".repeat(12) + "Zq", false));

/** 本人確認ステータスの変化（020・021・069・070）。期待: 変更後のステータス */
function 本人確認の変化(seedId: string, 変更: (c: ChangePage) => Promise<void>, 期待: (前: string) => string, 文: string) {
  return async ({ page, step, expected }: CaseCtx) => {
    const m = 会員(seedId);
    const 前 = 選手の値(m.会員ID)?.本人確認ステータス ?? "";
    note(`変更前の本人確認ステータス（DBの参照）: ${前}`);
    const c = await ログインする(page, seedId);
    let 後 = "";
    await step(1, async () => { await c.開いて待つ(); });
    await step(2, async () => { await 変更(c); });
    await step(3, async () => { 送信の注記((await c.変更するを押す()).sent); });
    await step(4, async () => { 後 = 選手の値(m.会員ID)?.本人確認ステータス ?? ""; });
    await expected(async () => {
      expect.soft(前, "変更前の本人確認ステータス（シードで登録した値）").toBe(m.本人確認);
      expect.soft(後, 文).toBe(期待(前));
    });
  };
}
caseTest("IT-F06-18-020", 本人確認の変化("S-F06-18-JP-020", (c) => c.日本の郵便番号を入れる("101-0001"), () => "未確認", "本人確認ステータス（未確認へ戻る）"));
caseTest("IT-F06-18-021", 本人確認の変化("S-F06-18-REGISTERED-MAIL-021", (c) => c.入れる("address][addr01", "千代田区丸の内"), () => "未確認", "本人確認ステータス（未確認へ戻る）"));
caseTest("IT-F06-18-069", 本人確認の変化("S-F06-18-REGSTAT-069", async (c) => {
  await c.お名前を入れる("確認", "変更"); await c.フリガナを入れる("カクニン", "ヘンコウ"); await c.生年月日を選ぶ("1992", "3", "4");
}, (前) => 前, "本人確認ステータス（簡易書留確認済みのまま）"));
caseTest("IT-F06-18-070", 本人確認の変化("S-F06-18-COMPANY-070", (c) => c.入れる("company_name", "変更後会社"), (前) => 前, "本人確認ステータス（確認済みのまま）"));

caseTest("IT-F06-18-023", async ({ page, notes, step, expected }) => {
  const 会員ID = notes.get("〔会員レコードID-F0618-共有JP〕");
  const 選手ID = notes.get("〔選手情報レコードID-F0618-共有JP〕");
  const 配送先ID = notes.get("〔既定配送先レコードID-F0618-共有JP〕");
  const 前 = { 会員: 会員の行全体(会員ID), 選手: 選手の行全体(選手ID), 配送先: 配送先の行全体(配送先ID) };
  note("シード表の選手情報更新日時（2026-09-01）は設定できないので、開始時の会員・選手情報・既定配送先の保存内容をDBの参照で控え、手順のあとと比べた");
  const c = await ログインする(page, "S-F06-18-JP");
  let 後 = { 会員: "", 選手: "", 配送先: "" };
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => {
    const r = await c.国を空にする();
    if (!r.あった) note("国の選択欄に未選択の選択肢が無いので、国は空にできない（Japan のまま）");
    else if (r.送り直した) note("国を未選択にすると画面がフォームを送り直して入力欄が入れ替わるので、先に国を空にしてから、ほかの項目を空にした");
    const 無い: string[] = [];
    const 空に = async (name: string, 名: string) => { if (await c.欄がある(name)) await c.入れる(name, ""); else 無い.push(名); };
    const 選択を空に = async (name: string, 名: string) => { if (!(await c.欄がある(name)) || !(await c.選択を空にする(name))) 無い.push(名); };
    await 空に("name][name01", "お名前(姓)"); await 空に("name][name02", "お名前(名)");
    await 空に("kana][kana01", "フリガナ(姓)"); await 空に("kana][kana02", "フリガナ(名)");
    await 選択を空に("birth][year", "生年月日(年)"); await 選択を空に("birth][month", "生年月日(月)"); await 選択を空に("birth][day", "生年月日(日)");
    await 空に("email][first", "メールアドレス"); await 空に("email][second", "メールアドレス(確認)");
    await 空に("plain_password][first", "パスワード"); await 空に("plain_password][second", "パスワード(確認)");
    if (await c.欄がある("postalCode][postalCode01")) { await 空に("postalCode][postalCode01", "郵便番号(前)"); await 空に("postalCode][postalCode02", "郵便番号(後)"); }
    else await 空に("abroadPostalCode", "郵便番号");
    await 選択を空に("address][pref", "住所(都道府県)");
    await 空に("address][addr01", "住所1"); await 空に("address][addr02", "住所2");
    await 空に("tel][tel01", "電話番号1"); await 空に("tel][tel02", "電話番号2"); await 空に("tel][tel03", "電話番号3");
    if (無い.length) note(`画面に欄が無い・空の選択肢が無いため空にできなかった項目: ${無い.join("、")}`);
  });
  await step(3, async () => { 送信の注記((await c.変更するを押す()).sent); });
  await step(4, async () => { 後 = { 会員: 会員の行全体(会員ID), 選手: 選手の行全体(選手ID), 配送先: 配送先の行全体(配送先ID) }; });
  await expected(async () => {
    expect.soft(後.会員, "会員の保存内容（開始時と同じ）").toBe(前.会員);
    expect.soft(後.選手, "選手情報の保存内容（開始時と同じ）").toBe(前.選手);
    expect.soft(後.配送先, "既定配送先の保存内容（開始時と同じ）").toBe(前.配送先);
  });
});

caseTest("IT-F06-18-024", async ({ page, step, expected }) => {
  const m = 会員("S-F06-18-JP-024");
  const c = await ログインする(page, "S-F06-18-JP-024");
  let r: ReturnType<typeof 会員の値>; let p: ReturnType<typeof 選手の値>;
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => {
    expect(await c.選択を空にする("sex"), "性別の選択欄に未選択の選択肢がある").toBe(true);
    await c.入れる("company_name", "");
    expect(await c.選択を空にする("job"), "職業の選択欄に未選択の選択肢がある").toBe(true);
    await c.MTG登録名を入れる("", "");
  });
  await step(3, async () => { 送信の注記((await c.変更するを押す()).sent); });
  await step(4, async () => { r = 会員の値(m.会員ID); p = 選手の値(m.会員ID); });
  await expected(async () => {
    expect.soft(r?.性別 ?? "", "性別（空）").toBe("");
    expect.soft(r?.会社名 ?? "", "会社名（空）").toBe("");
    expect.soft(r?.職業 ?? "", "職業（空）").toBe("");
    expect.soft(p?.英字姓 ?? "", "MTG Campaign 登録名(姓)＝選手情報の英字姓（空）").toBe("");
    expect.soft(p?.英字名 ?? "", "MTG Campaign 登録名(名)＝選手情報の英字名（空）").toBe("");
  });
});

caseTest("IT-F06-18-025", async ({ page, step, expected }) => {
  const m = 会員("S-F06-18-JP-025");
  const c = await ログインする(page, "S-F06-18-JP-025");
  let r: ReturnType<typeof 会員の値>; let p: ReturnType<typeof 選手の値>;
  const v = { 名: "あ".repeat(16), カナ: "ア".repeat(25), 住所: "あ".repeat(90), 会社: "あ".repeat(100), MTG: "A".repeat(128) };
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => {
    await c.お名前を入れる(v.名, v.名); await c.フリガナを入れる(v.カナ, v.カナ);
    await c.入れる("address][addr01", v.住所); await c.入れる("address][addr02", v.住所);
    await c.入れる("company_name", v.会社); await c.MTG登録名を入れる(v.MTG, v.MTG);
  });
  await step(3, async () => { 送信の注記((await c.変更するを押す()).sent); });
  await step(4, async () => { r = 会員の値(m.会員ID); p = 選手の値(m.会員ID); });
  await expected(async () => {
    expect.soft(r?.姓, "お名前(姓)（「あ」16文字）").toBe(v.名);
    expect.soft(r?.名, "お名前(名)（「あ」16文字）").toBe(v.名);
    expect.soft(r?.セイ, "フリガナ(姓)（「ア」25文字）").toBe(v.カナ);
    expect.soft(r?.メイ, "フリガナ(名)（「ア」25文字）").toBe(v.カナ);
    expect.soft(r?.住所1, "住所1（「あ」90文字）").toBe(v.住所);
    expect.soft(r?.住所2, "住所2（「あ」90文字）").toBe(v.住所);
    expect.soft(r?.会社名, "会社名（「あ」100文字）").toBe(v.会社);
    expect.soft(p?.英字姓, "MTG Campaign 登録名(姓)（「A」128文字）").toBe(v.MTG);
    expect.soft(p?.英字名, "MTG Campaign 登録名(名)（「A」128文字）").toBe(v.MTG);
  });
});

caseTest("IT-F06-18-027", async ({ page, step, expected }) => {
  const m = 会員("S-F06-18-OVERSEAS-027");
  const c = await ログインする(page, "S-F06-18-OVERSEAS-027");
  let r: ReturnType<typeof 会員の値>;
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => { if (!(await c.国を選ぶ("United States"))) note("国はすでに「United States」なので、選び直しても画面は読み込み直さない"); });
  await step(3, async () => { await c.入れる("address][addr03", "A".repeat(90)); });
  await step(4, async () => { 送信の注記((await c.変更するを押す()).sent); });
  await step(5, async () => { r = 会員の値(m.会員ID); });
  await expected(async () => { expect.soft(r?.住所3, "住所3（「A」90文字）").toBe("A".repeat(90)); });
});

caseTest("IT-F06-18-029", async ({ page, step, expected }) => {
  const m = 会員("S-F06-18-OVERSEAS-029");
  const c = await ログインする(page, "S-F06-18-OVERSEAS-029");
  let r: ReturnType<typeof 会員の値>;
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => { if (!(await c.国を選ぶ("United States"))) note("国はすでに「United States」なので、選び直しても画面は読み込み直さない"); });
  await step(3, async () => { await c.海外の郵便番号を入れる("1234567890"); });
  await step(4, async () => { 送信の注記((await c.変更するを押す()).sent); });
  await step(5, async () => { r = 会員の値(m.会員ID); });
  await expected(async () => {
    note("シードの郵便番号も「1234567890」なので、保存の値が変わらないこともありうる。保存されている値が「1234567890」であることを確かめた");
    expect.soft(r?.海外郵便番号, "郵便番号（海外の郵便番号）").toBe("1234567890");
  });
});

caseTest("IT-F06-18-039", async ({ page, step, expected }) => {
  const m = 会員("S-F06-18-JP-039");
  const c = await ログインする(page, "S-F06-18-JP-039");
  let r: ReturnType<typeof 会員の値>;
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => { note("電話番号の欄は3つに分かれているので、「03」「1234」「5678」に分けて入れた"); await c.電話番号を入れる("0312345678"); });
  await step(3, async () => { 送信の注記((await c.変更するを押す()).sent); });
  await step(4, async () => { r = 会員の値(m.会員ID); });
  await expected(async () => {
    note("電話番号はDBに3つの欄に分けて保存されるので、つなげた値で比べた");
    expect.soft(電話(r), "電話番号（3つの欄をつなげた値）").toBe("0312345678");
  });
});

caseTest("IT-F06-18-041", async ({ page, step, expected }) => {
  const m = 会員("S-F06-18-JP-041");
  const c = await ログインする(page, "S-F06-18-JP-041");
  let r: ReturnType<typeof 会員の値>;
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => { if (!(await c.国を選ぶ("Japan"))) note("国はすでに「Japan」なので、選び直しても画面は読み込み直さない"); });
  await step(3, async () => {
    await c.日本の郵便番号を入れる("100-0001"); await c.選ぶ("address][pref", "東京都");
    await c.入れる("address][addr01", "千代田区千代田"); await c.入れる("address][addr02", "1番");
  });
  await step(4, async () => { 送信の注記((await c.変更するを押す()).sent); });
  await step(5, async () => { r = 会員の値(m.会員ID); });
  await expected(async () => {
    note(郵便番号の比べ方);
    expect.soft(郵便番号の形(r?.郵便番号), `郵便番号（保存の値 ${r?.郵便番号} を3桁-4桁の形にしたもの）`).toBe("100-0001");
  });
});

/** なりすまし対策トークン（045・046） */
function トークン(会社名: string, 操作: (c: ChangePage) => Promise<number>, 文: string) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const 会員ID = notes.get("〔会員レコードID-F0618-共有JP〕");
    const 前 = 会員の値(会員ID)?.会社名;
    const c = await ログインする(page, "S-F06-18-JP");
    let 後: string | null | undefined;
    await step(1, async () => { await c.開いて待つ(); expect(await c.トークン欄.count(), "なりすまし対策トークンの入力要素がある").toBe(1); });
    await step(2, async () => { await c.入れる("company_name", 会社名); });
    await step(3, async () => { note(`開発者ツールの操作の代わりに、画面のスクリプトで${文}`); const n = await 操作(c); expect(n, "操作したトークンの入力要素の数").toBe(1); });
    await step(4, async () => { 送信の注記((await c.変更するを押す()).sent); });
    await step(5, async () => { 後 = 会員の値(会員ID)?.会社名; });
    await expected(async () => {
      expect.soft(前, "開始時の会社名").toBe("試験会社");
      expect.soft(後, `会社名（「${会社名}」に更新されない）`).toBe("試験会社");
    });
  };
}
caseTest("IT-F06-18-045", トークン("トークン欠落更新会社", (c) => c.トークン欄を消す(), "なりすまし対策トークンの入力要素を削除した"));
caseTest("IT-F06-18-046", トークン("トークン改ざん更新会社", (c) => c.トークンを書き換える("invalid-token"), "なりすまし対策トークンの値を「invalid-token」に書き換えた"));

caseTest("IT-F06-18-047", async ({ page, step, expected }) => {
  const b = ブラックリストの値;
  const c = await ログインする(page, "S-F06-18-BLACKLIST");
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => {
    note(`ブラックリストの氏名・住所のキーワードは実行の印つき（「${b.氏名キーワード()}」「${b.住所キーワード()}」）なので、お名前(名)を「${b.名()}」、住所2を「${b.住所2()}」として入れた（つなげるとキーワードと同じ値になる）`);
    await c.お名前を入れる(b.姓, b.名());
    await c.入れる("address][addr01", b.住所1);
    await c.入れる("address][addr02", b.住所2());
    await c.電話番号を入れる(b.電話番号);
  });
  await step(3, async () => { 送信の注記((await c.変更するを押す()).sent); });
  await expected(async () => { expect.soft(c.path, "遷移した画面のアドレス（会員情報更新エラー画面）").toBe("/ja/entry/regist_error"); });
});

// ---------------------------------------------------------------------------
// 画面遷移
// ---------------------------------------------------------------------------
caseTest("IT-F06-18-051", async ({ page, step, expected }) => {
  const c = await ログインする(page, "S-F06-18-JP");
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => { await c.リンクを押す(c.オンライン本人確認リンク); });
  await expected(async () => { expect.soft(c.path, "遷移した画面のアドレス（オンライン本人確認画面）").toBe("/ja/mypage/identification"); });
});
caseTest("IT-F06-18-052", async ({ page, step, expected }) => {
  const c = await ログインする(page, "S-F06-18-JP");
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => { await c.リンクを押す(c.戻るボタン); });
  await expected(async () => { expect.soft(c.path.replace(/\/$/, ""), "遷移した画面のアドレス（ECTOP）").toBe("/ja"); });
});
caseTest("IT-F06-18-053", async ({ page, step, expected }) => {
  const c = await ログインする(page, "S-F06-18-JP");
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => { await c.リンクを押す(c.パンくずホーム); });
  await expected(async () => { expect.soft(c.path.replace(/\/$/, ""), "遷移した画面のアドレス（本店ECTOP）").toBe("/ja"); });
});
caseTest("IT-F06-18-054", async ({ page, step, expected }) => {
  const c = await ログインする(page, "S-F06-18-JP");
  let リンクか = true;
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => { リンクか = await c.現在地がリンクか(); await c.現在地を押す(); });
  await expected(async () => {
    expect.soft(リンクか, "パンくずの現在地「会員情報変更」がリンクになっている").toBe(false);
    expect.soft(c.path, "画面のアドレス（会員情報変更画面のまま）").toBe(変更画面のパス);
    expect.soft(await c.変更画面である(), "会員情報変更画面の入力フォームが表示されている").toBe(true);
  });
});

/** 完了画面からの遷移（055〜057）: 手順1で会社名を変え、手順2で変更する、手順3で完了画面の操作 */
function 完了画面から(seedId: string, 会社名: string, 操作: "ホーム" | "戻る" | "現在地") {
  return async ({ page, step, expected }: CaseCtx) => {
    const c = await ログインする(page, seedId);
    let リンクか = true;
    await step(1, async () => { await c.開いて待つ(); await c.入れる("company_name", 会社名); });
    await step(2, async () => {
      送信の注記((await c.変更するを押す()).sent);
      expect(c.path, "会員情報変更完了画面へ移った").toBe(完了画面のパス);
    });
    await step(3, async () => {
      if (操作 === "ホーム") await c.リンクを押す(c.パンくずホーム);
      else if (操作 === "戻る") await c.リンクを押す(c.完了画面の戻るボタン);
      else { リンクか = await c.現在地がリンクか(); await c.現在地を押す(); }
    });
    await expected(async () => {
      if (操作 === "現在地") {
        expect.soft(リンクか, "パンくずの現在地「会員情報変更(完了)」がリンクになっている").toBe(false);
        expect.soft(c.path, "画面のアドレス（会員情報変更完了画面のまま）").toBe(完了画面のパス);
      } else {
        expect.soft(c.path.replace(/\/$/, ""), `遷移した画面のアドレス（${操作 === "ホーム" ? "本店ECTOP" : "ECTOP"}）`).toBe("/ja");
      }
    });
  };
}
caseTest("IT-F06-18-055", 完了画面から("S-F06-18-JP-055", "完了画面ホーム確認会社", "ホーム"));
caseTest("IT-F06-18-056", 完了画面から("S-F06-18-JP-056", "完了画面戻る確認会社", "戻る"));
caseTest("IT-F06-18-057", 完了画面から("S-F06-18-JP-057", "完了画面パンくず確認会社", "現在地"));

// ---------------------------------------------------------------------------
// 管理画面との連携（ブラウザA＝フロント、ブラウザB＝管理画面）
// ---------------------------------------------------------------------------
async function ブラウザB(browser: Browser): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  return { page: await context.newPage(), close: () => context.close() };
}

type 連携 = { seedId: string; 変更: (c: ChangePage) => Promise<void>; 検索語: string };
/** 手順1〜6（ブラウザAでログイン → 変更 → 完了を確かめる → ブラウザBで管理者ログイン → 会員検索）。ブラウザBを返す */
async function 連携の手順1から6(ctx: CaseCtx, o: 連携): Promise<{ page: Page; close: () => Promise<void> }> {
  const { page, browser, step } = ctx;
  const m = 会員(o.seedId);
  const c = new ChangePage(page);
  const b = await ブラウザB(browser);
  try {
    await step(1, async () => {
      await page.goto(`${BASE_URL}/ja/`, { timeout: 60_000 });
      await page.waitForLoadState("load");
      await 会員としてログインする(page, m.メール, m.パスワード);
    });
    await step(2, async () => { await c.開いて待つ(); });
    await step(3, async () => { await o.変更(c); });
    await step(4, async () => {
      送信の注記((await c.変更するを押す()).sent);
      expect(c.path, "会員情報変更完了画面が表示された").toBe(完了画面のパス);
    });
    await step(5, async () => { await loginAdmin(b.page, PC_ADMIN); });
    await step(6, async () => { await searchCustomer(b.page, o.検索語); });
  } catch (e) { await b.close(); throw e; }
  return b;
}
const 住所の変更 = async (c: ChangePage) => {
  await c.日本の郵便番号を入れる("1500002"); await c.選ぶ("address][pref", "東京都");
  await c.入れる("address][addr01", "渋谷区渋谷"); await c.入れる("address][addr02", "2丁目2番");
};

caseTest("IT-F06-18-064", async (ctx) => {
  const 新 = 印つきメール("pc-f0618-001-new@example.test");
  const b = await 連携の手順1から6(ctx, { seedId: "S-F06-18-PC-MEMBER-064", 検索語: 新, 変更: async (c) => {
    await c.お名前を入れる("晴野", "次郎"); await c.メールを入れる(新); await c.電話番号を入れる("0398765432");
  } });
  try {
    let id: string | null = null; let 行 = "";
    await ctx.step(7, async () => {
      const row = resultRow(b.page, 新);
      await expect(row, "検索結果の該当行").toHaveCount(1, { timeout: 30_000 });
      id = await resultCustomerId(b.page, 新);
      行 = ((await row.first().innerText()) ?? "").replace(/\s+/g, " ");
    });
    await ctx.expected(async () => {
      expect.soft(id, "該当行の会員ID").toBe(ctx.notes.get("〔会員ID-F0618-PC001〕"));
      expect.soft(行, "該当行の会員名（「晴野」）").toContain("晴野");
      expect.soft(行, "該当行の会員名（「次郎」）").toContain("次郎");
      expect.soft(行, "該当行のメールアドレス").toContain(新);
    });
  } finally { await b.close(); }
});

caseTest("IT-F06-18-065", async (ctx) => {
  const 新 = 印つきメール("pc-f0618-002-new@example.test");
  const b = await 連携の手順1から6(ctx, { seedId: "S-F06-18-PC-MEMBER-065", 検索語: 新, 変更: async (c) => {
    await c.お名前を入れる("晴野", "次郎"); await c.フリガナを入れる("ハルノ", "ジロウ"); await c.メールを入れる(新);
    await 住所の変更(c); await c.電話番号を入れる("0398765432"); await c.入れる("company_name", "晴野商事F0618PC002");
  } });
  try {
    let got: Record<string, string> = {}; let kana = ["", ""];
    await ctx.step(7, async () => {
      await openEditFromResult(b.page, 新);
      got = await readEdit(b.page);
      const ed = new M08CustomerEditPage(b.page);
      kana = [await ed.get("kana][kana01"), await ed.get("kana][kana02")];
    });
    await ctx.expected(async () => {
      expect.soft(got["お名前姓"], "お名前の姓").toBe("晴野");
      expect.soft(got["お名前名"], "お名前の名").toBe("次郎");
      expect.soft(kana[0], "お名前(フリガナ)の姓").toBe("ハルノ");
      expect.soft(kana[1], "お名前(フリガナ)の名").toBe("ジロウ");
      expect.soft(got["会社名"], "会社名").toBe("晴野商事F0618PC002");
      expect.soft(got["国"], "国").toBe("Japan");
      expect.soft(got["都道府県"], "都道府県").toBe("東京都");
      expect.soft(got["住所1"], "住所1").toBe("渋谷区渋谷");
      expect.soft(got["住所2"], "住所2").toBe("2丁目2番");
      expect.soft(got["メールアドレス"], "メールアドレス（実行の印つき）").toBe(新);
    });
  } finally { await b.close(); }
});

caseTest("IT-F06-18-066", async (ctx) => {
  const メール = 会員("S-F06-18-PC-MEMBER-066").メール;
  const b = await 連携の手順1から6(ctx, { seedId: "S-F06-18-PC-MEMBER-066", 検索語: メール, 変更: async (c) => {
    await c.お名前を入れる("晴野", "次郎"); await 住所の変更(c); await c.電話番号を入れる("0398765432"); await c.入れる("company_name", "晴野商事F0618PC003");
  } });
  try {
    let rows: string[] = [];
    await ctx.step(7, async () => { await openEditFromResult(b.page, メール); rows = await deliveryRows(b.page); });
    await ctx.expected(async () => {
      const hit = rows.filter((t) => t.includes("晴野") && t.includes("次郎") && t.includes("渋谷区渋谷") && t.includes("2丁目2番"));
      expect.soft(hit.length, `お届け先住所欄の、名前「晴野」「次郎」・住所「渋谷区渋谷」「2丁目2番」を表示する行の数（行: ${rows.join(" | ")}）`).toBeGreaterThanOrEqual(1);
      expect.soft(rows.filter((t) => t.includes("千代田区千代田")).length, "お届け先住所欄の、変更前の住所「千代田区千代田」を表示する行の数").toBe(0);
    });
  } finally { await b.close(); }
});

caseTest("IT-F06-18-067", async (ctx) => {
  const メール = 会員("S-F06-18-PC-MEMBER-067").メール;
  const b = await 連携の手順1から6(ctx, { seedId: "S-F06-18-PC-MEMBER-067", 検索語: メール, 変更: 住所の変更 });
  try {
    let 状態 = "";
    await ctx.step(7, async () => {
      await openEditFromResult(b.page, メール);
      状態 = await new M08CustomerEditPage(b.page).ラジオ選択中("Player][IdentityConfirmStatus");
    });
    await ctx.expected(async () => { expect.soft(状態, "会員登録/編集画面の本人確認ステータスで選択されている値").toBe("未確認"); });
  } finally { await b.close(); }
});

caseTest("IT-F06-18-068", async (ctx) => {
  const メール = 会員("S-F06-18-PC-MEMBER-068").メール;
  const b = await 連携の手順1から6(ctx, { seedId: "S-F06-18-PC-MEMBER-068", 検索語: メール, 変更: async (c) => {
    await c.お名前を入れる("晴野", "次郎"); await c.フリガナを入れる("ハルノ", "ジロウ"); await 住所の変更(c);
  } });
  try {
    let 行: [string, string][] = [];
    await ctx.step(7, async () => {
      await openEditFromResult(b.page, メール);
      行 = await オンライン本人確認のポップアップを読む(b.page);
    });
    await ctx.expected(async () => {
      const 値 = (見出し: RegExp) => 行.find(([l]) => 見出し.test(l))?.[1] ?? "";
      const 全部 = 行.map(([, v]) => v);
      expect.soft(値(/^(お名前|氏名|名前)/), "ポップアップのお名前（「晴野」「次郎」）").toMatch(/晴野\s*次郎/);
      expect.soft(値(/フリガナ|カナ/), "ポップアップのお名前(フリガナ)（「ハルノ」「ジロウ」）").toMatch(/ハルノ\s*ジロウ/);
      expect.soft(全部, "ポップアップの国「Japan」").toContain("Japan");
      expect.soft(全部, "ポップアップの都道府県「東京都」").toContain("東京都");
      expect.soft(全部, "ポップアップの住所1「渋谷区渋谷」").toContain("渋谷区渋谷");
      expect.soft(全部, "ポップアップの住所2「2丁目2番」").toContain("2丁目2番");
    });
  } finally { await b.close(); }
});

// ---------------------------------------------------------------------------
// 配送先の更新・本人確認ステータス×変更項目×パスワード（DB確認）
// ---------------------------------------------------------------------------
caseTest("IT-F06-18-071", async ({ page, step, expected }) => {
  const m = 会員("S-F06-18-NONDEF-071");
  const c = await ログインする(page, "S-F06-18-NONDEF-071");
  let 既定: ReturnType<typeof 配送先> = []; let 他: ReturnType<typeof 配送先> = [];
  await step(1, async () => { await c.開いて待つ(); });
  await step(2, async () => {
    await c.お名前を入れる("配送", "更新"); await c.フリガナを入れる("ハイソウ", "コウシン");
    await c.日本の郵便番号を入れる("100-0001"); await c.選ぶ("address][pref", "東京都");
    await c.入れる("address][addr01", "千代田区千代田"); await c.入れる("address][addr02", "1番");
    await c.入れる("company_name", "配送更新会社"); await c.電話番号を入れる("0311112222");
  });
  await step(3, async () => { 送信の注記((await c.変更するを押す()).sent); });
  await step(4, async () => { 既定 = 配送先(m.会員ID, true); 他 = 配送先(m.会員ID, false); });
  await expected(async () => {
    note(郵便番号の比べ方);
    const d = 既定[0]; const o = 他[0]; const x = 既定でない配送先;
    expect.soft(既定.length, "既定配送先の数").toBe(1);
    expect.soft(`${d?.姓}・${d?.名}`, "既定配送先の氏名").toBe("配送・更新");
    expect.soft(`${d?.セイ}・${d?.メイ}`, "既定配送先のカナ").toBe("ハイソウ・コウシン");
    expect.soft(郵便番号の形(d?.郵便番号), "既定配送先の郵便番号").toBe("100-0001");
    expect.soft(`${d?.住所1} ${d?.住所2}`, "既定配送先の住所").toBe("千代田区千代田 1番");
    expect.soft(d?.国, "既定配送先の国").toBe("Japan");
    expect.soft(d?.都道府県, "既定配送先の都道府県").toBe("東京都");
    expect.soft(d?.会社名, "既定配送先の会社名").toBe("配送更新会社");
    expect.soft(電話(d), "既定配送先の電話番号").toBe("0311112222");
    expect.soft(他.length, "既定でない配送先の数").toBe(1);
    expect.soft(`${o?.姓}・${o?.名}`, "既定でない配送先の氏名（変わらない）").toBe(`${x.姓}・${x.名}`);
    expect.soft(`${o?.セイ}・${o?.メイ}`, "既定でない配送先のカナ（変わらない）").toBe(`${x.セイ}・${x.メイ}`);
    expect.soft(郵便番号の形(o?.郵便番号), "既定でない配送先の郵便番号（変わらない）").toBe(x.郵便番号);
    expect.soft(o?.都道府県, "既定でない配送先の都道府県（変わらない）").toBe(x.都道府県);
    expect.soft(`${o?.住所1} ${o?.住所2}`, "既定でない配送先の住所（変わらない）").toBe(`${x.住所1} ${x.住所2}`);
    expect.soft(o?.会社名, "既定でない配送先の会社名（変わらない）").toBe(x.会社名);
    expect.soft(電話(o), "既定でない配送先の電話番号（変わらない）").toBe(x.電話);
  });
});

type CB = { seedId: string; 変更: (c: ChangePage) => Promise<void>; 状態: "そのまま" | "未確認"; パスワード?: string; 配送先: "郵便番号" | "氏名カナ" | "会社名" };
function CBケース(o: CB) {
  return async ({ page, step, expected }: CaseCtx) => {
    const m = 会員(o.seedId);
    const 前のパスワード = 会員の値(m.会員ID)?.パスワード ?? "";
    const 前の状態 = 選手の値(m.会員ID)?.本人確認ステータス ?? "";
    note(`開始時のパスワードの保存値・本人確認ステータス（${前の状態}）をDBの参照で控えた`);
    const c = await ログインする(page, o.seedId);
    let r: ReturnType<typeof 会員の値>; let p: ReturnType<typeof 選手の値>; let d: ReturnType<typeof 配送先> = [];
    await step(1, async () => { await c.開いて待つ(); });
    await step(2, async () => { await o.変更(c); if (o.パスワード) await c.パスワードを入れる(o.パスワード); });
    await step(3, async () => { 送信の注記((await c.変更するを押す()).sent); });
    await step(4, async () => { r = 会員の値(m.会員ID); p = 選手の値(m.会員ID); d = 配送先(m.会員ID, true); });
    await expected(async () => {
      expect.soft(前の状態, "変更前の本人確認ステータス（シードで登録した値）").toBe(m.本人確認);
      if (o.状態 === "そのまま") expect.soft(p?.本人確認ステータス, `本人確認ステータス（変更前の「${前の状態}」のまま）`).toBe(前の状態);
      else expect.soft(p?.本人確認ステータス, `本人確認ステータス（変更前の「${前の状態}」から未確認へ戻る）`).toBe("未確認");
      if (o.パスワード) {
        expect.soft(r?.パスワード, "パスワード（従前の値から変わる）").not.toBe(前のパスワード);
        expect.soft(r?.パスワード, `パスワード（入力した平文「${o.パスワード}」とは異なる）`).not.toBe(o.パスワード);
        expect.soft((r?.パスワード ?? "").length, "パスワード（暗号化された値として空でない）").toBeGreaterThan(o.パスワード.length);
      } else {
        expect.soft(r?.パスワード, "パスワード（従前の値のまま）").toBe(前のパスワード);
      }
      if (o.配送先 === "郵便番号") { note(郵便番号の比べ方); expect.soft(郵便番号の形(d[0]?.郵便番号), "既定配送先の郵便番号").toBe("101-0001"); }
      else if (o.配送先 === "氏名カナ") {
        expect.soft(`${d[0]?.姓}・${d[0]?.名}`, "既定配送先の氏名").toBe("確認・変更");
        expect.soft(`${d[0]?.セイ}・${d[0]?.メイ}`, "既定配送先のカナ").toBe("カクニン・ヘンコウ");
      } else expect.soft(d[0]?.会社名, "既定配送先の会社名").toBe("変更後会社");
    });
  };
}
const 郵便番号を変える = (c: ChangePage) => c.日本の郵便番号を入れる("101-0001");
const 氏名カナ生年月日を変える = async (c: ChangePage) => { await c.お名前を入れる("確認", "変更"); await c.フリガナを入れる("カクニン", "ヘンコウ"); await c.生年月日を選ぶ("1992", "3", "4"); };
const 会社名を変える = (c: ChangePage) => c.入れる("company_name", "変更後会社");
caseTest("IT-F06-18-072", CBケース({ seedId: "S-F06-18-CBSTAT-072", 変更: 郵便番号を変える, 状態: "そのまま", 配送先: "郵便番号" }));
caseTest("IT-F06-18-073", CBケース({ seedId: "S-F06-18-CBSTAT-073", 変更: 氏名カナ生年月日を変える, 状態: "そのまま", パスワード: "NewPass-CBF0618073", 配送先: "氏名カナ" }));
caseTest("IT-F06-18-074", CBケース({ seedId: "S-F06-18-CBSTAT-074", 変更: 会社名を変える, 状態: "そのまま", 配送先: "会社名" }));
caseTest("IT-F06-18-075", CBケース({ seedId: "S-F06-18-CBSTAT-075", 変更: 氏名カナ生年月日を変える, 状態: "未確認", 配送先: "氏名カナ" }));
caseTest("IT-F06-18-076", CBケース({ seedId: "S-F06-18-CBSTAT-076", 変更: 郵便番号を変える, 状態: "未確認", パスワード: "NewPass-CBF0618076", 配送先: "郵便番号" }));
caseTest("IT-F06-18-077", CBケース({ seedId: "S-F06-18-CBSTAT-077", 変更: 会社名を変える, 状態: "そのまま", パスワード: "NewPass-CBF0618077", 配送先: "会社名" }));
caseTest("IT-F06-18-078", CBケース({ seedId: "S-F06-18-CBSTAT-078", 変更: 郵便番号を変える, 状態: "未確認", 配送先: "郵便番号" }));

// ---------------------------------------------------------------------------
// 001（シード無し）
// ---------------------------------------------------------------------------
caseTest("IT-F06-18-001", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.URLを開く("/ja/mypage/change"); });
  await expected(async () => {
    expect.soft(l.path(), "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await l.ログイン画面である(), "会員ログイン画面が表示される").toBe(true);
  });
});
