/**
 * M08-04 会員登録/編集。正本: cases/M08-04_test_cases.tsv
 * 実装しないケース（記録 review/M08-04_progress_*.md）: シードがDBで準備されるもの（累計注文回数・受注・買取・お届け先 など）、DBで会員を0件にする初期化が要るもの、
 * メール通知の受信・外部連携（スマレジ）を確かめるもの、決済・外部の試験環境が要るもの。
 * 本人確認ステータス変更の確認は、ブラウザの確認ダイアログ。「続行」は OK、「取り消し」はキャンセルで答える。
 */
import { Browser, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin, adminUrl, hideDebugToolbar } from "../../lib/session";
import { お届け先の氏名, 会員の保存内容, 会員住所の件数 } from "../../db/m08_04";
import { BuyListPage, 買取番号の表示 } from "../../pages/admin/m07_buy";
import { M0703EditPage } from "../../pages/admin/m07_03_edit";
import { 配送先編集の値, 住所リンクを押す } from "../../pages/admin/f06_20_delivery_k";
import { ChangePage, 会員としてログインする } from "../../pages/front/f06_18_change";
import { MypagePage } from "../../pages/front/f06_05_mypage";
import { M08CustomerEditPage } from "../../pages/admin/m08_customer_edit";
import { M0804_ADMIN, M0804_QH_ADMIN, M0804_RH_ADMIN, QH会員のパスワード, QH会員のメール, 更新後メール004, 重複先メール018, 重複前メール018, 長いメール010, 長いメール062 } from "../../seeds/m08-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 空 = (v: string | null | undefined): boolean => v === null || v === undefined || v === "";

async function 開く(page: Page, id: string): Promise<M08CustomerEditPage> {
  await loginAdmin(page, M0804_ADMIN);
  const e = new M08CustomerEditPage(page);
  const st = await e.open(id);
  if (st !== 200) throw new Error(`会員ID ${id} の会員登録/編集画面を開けない（応答 ${st}）`);
  return e;
}
const 保存内容 = (id: string) => {
  const r = 会員の保存内容(id);
  if (!r) throw new Error(`会員ID ${id} の保存内容をDBの参照で読めない`);
  return r;
};
const 保存後メッセージを注記 = async (e: M08CustomerEditPage) => {
  const err = await e.エラー文();
  if (err.length) note(`保存後の画面のエラー: ${err.join(" / ")}`);
};

// ---- 基本の更新 ----
caseTest("IT-M08-04-004", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-004〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.set("name][name01", "更新"); await e.set("address][addr03", "海外住所更新"); await e.set("email", 更新後メール004()); });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => {
    expect.soft(r.お名前姓, "お名前姓").toBe("更新");
    expect.soft(r.住所3, "住所3").toBe("海外住所更新");
    expect.soft(r.メールアドレス, "メールアドレス").toBe(更新後メール004());
  });
});

caseTest("IT-M08-04-005", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-005〕");
  let e!: M08CustomerEditPage;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.set("company_name", "遷移確認会社"); });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, `保存した会員ID ${id} の会員登録/編集画面のアドレス`).toBe(`/admin/customer/${id}/edit`);
    expect.soft(await e.f("company_name").inputValue(), "会社名が保存されている").toBe("遷移確認会社");
  });
});

caseTest("IT-M08-04-006", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-006〕");
  let e!: M08CustomerEditPage; let n = -1;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.set("company_name", "住所件数確認会社"); });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(4, async () => { n = 会員住所の件数(id); });
  await expected(async () => { expect.soft(n, `会員ID ${id} の会員住所の件数（1件のまま）`).toBe(1); });
});

caseTest("IT-M08-04-007", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-007〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => {
    for (const n of ["name][name02", "kana][kana01", "kana][kana02", "company_name", "postalCode][postalCode01", "postalCode][postalCode02", "abroadPostalCode", "fax][fax01", "fax][fax02", "fax][fax03", "address][addr03", "close_reason"]) await e.set(n, "");
    await e.選ぶ("country", "選択してください"); await e.選ぶ("job", "選択してください");
    await e.選ぶ("Player][CustomerGroup", "選択してください").catch(() => note("顧客グループには空の選択肢が無く、空にできない"));
    for (const n of ["birth][year", "birth][month", "birth][day"]) await e.値で選ぶ(n, "");
    supplement("性別は画面のラジオで、ブラウザの操作では選びを外せない。画面のスクリプトで選びを外して空にした");
    await e.ラジオの選びを外す("sex");
  });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => {
    for (const [k, l] of [["お名前名", "お名前名"], ["フリガナ姓", "お名前姓（カナ）"], ["フリガナ名", "お名前名（カナ）"], ["会社名", "会社名"], ["国", "国"], ["郵便番号", "郵便番号"], ["海外用郵便番号", "海外用郵便番号"],
      ["FAX1", "FAX番号1"], ["FAX2", "FAX番号2"], ["FAX3", "FAX番号3"], ["性別", "性別"], ["職業", "職業"], ["生年月日", "生年月日"], ["顧客グループ", "顧客グループ"], ["住所3", "住所3"], ["退会区分", "退会区分"]] as const) {
      expect.soft(空(r[k]), `${l}が空に更新されている（実際: ${r[k] ?? "空"}）`).toBe(true);
    }
  });
});

caseTest("IT-M08-04-009", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-009〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.選ぶ("status", "仮会員"); await e.set("close_reason", "BAN"); });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => {
    expect.soft(r.会員ステータス, "会員ステータス").toBe("仮会員");
    expect.soft(r.退会区分, "退会区分").toBe("BAN");
  });
});

caseTest("IT-M08-04-010", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-010〕");
  const v = {
    姓: "あ".repeat(16), 名: "い".repeat(16), セイ: "ア".repeat(25), メイ: "イ".repeat(25), 会社名: "社".repeat(100), 郵便1: "100", 郵便2: "0001", 海外郵便: "1".repeat(100),
    住所1: "住".repeat(90), 住所2: "所".repeat(90), メール: 長いメール010, 電話: "12345", FAX: "54321", パスワード: "Aa1!" + "x".repeat(28), MTG姓: "S".repeat(128), MTG名: "M".repeat(128), 退会区分: "R".repeat(255),
  };
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => {
    await e.set("name][name01", v.姓); await e.set("name][name02", v.名); await e.set("kana][kana01", v.セイ); await e.set("kana][kana02", v.メイ); await e.set("company_name", v.会社名);
    await e.set("postalCode][postalCode01", v.郵便1); await e.set("postalCode][postalCode02", v.郵便2); await e.set("abroadPostalCode", v.海外郵便);
    await e.set("address][addr01", v.住所1); await e.set("address][addr02", v.住所2); await e.set("email", v.メール);
    for (const n of ["tel][tel01", "tel][tel02", "tel][tel03"]) await e.set(n, v.電話);
    for (const n of ["fax][fax01", "fax][fax02", "fax][fax03"]) await e.set(n, v.FAX);
    await e.set("plain_password][first", v.パスワード); await e.set("plain_password][second", v.パスワード);
    await e.set("Player][lastNameEn", v.MTG姓); await e.set("Player][firstNameEn", v.MTG名); await e.set("close_reason", v.退会区分);
  });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => {
    expect.soft(r.お名前姓, "お名前姓（16文字）").toBe(v.姓); expect.soft(r.お名前名, "お名前名（16文字）").toBe(v.名);
    expect.soft(r.フリガナ姓, "お名前姓（カナ）（25文字）").toBe(v.セイ); expect.soft(r.フリガナ名, "お名前名（カナ）（25文字）").toBe(v.メイ);
    expect.soft(r.会社名, "会社名（100文字）").toBe(v.会社名); expect.soft(r.海外用郵便番号, "海外用郵便番号（100桁）").toBe(v.海外郵便);
    expect.soft(r.住所1, "住所1（90文字）").toBe(v.住所1); expect.soft(r.住所2, "住所2（90文字）").toBe(v.住所2);
    expect.soft(r.メールアドレス, "メールアドレス（85文字）").toBe(v.メール);
    expect.soft([r.電話1, r.電話2, r.電話3].join("-"), "電話番号（各5桁）").toBe([v.電話, v.電話, v.電話].join("-"));
    expect.soft([r.FAX1, r.FAX2, r.FAX3].join("-"), "FAX番号（各5桁）").toBe([v.FAX, v.FAX, v.FAX].join("-"));
    expect.soft(r.MTG姓, "MTG Companion登録本名の姓（128文字）").toBe(v.MTG姓); expect.soft(r.MTG名, "MTG Companion登録本名の名（128文字）").toBe(v.MTG名);
    expect.soft(r.退会区分, "退会区分（255文字）").toBe(v.退会区分);
  });
});

caseTest("IT-M08-04-012", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-012〕");
  const v = { 姓: "姓Sei", 名: "名Mei", セイ: "カナKana", メイ: "メイMei", 会社: "会社Company", 住所1: "住所Address1", 住所2: "建物Building2", 住所3: "海外Overseas3", MTG姓: "Player姓", MTG名: "Player名", 退会: "BAN理由Reason" };
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => {
    await e.set("name][name01", v.姓); await e.set("name][name02", v.名); await e.set("kana][kana01", v.セイ); await e.set("kana][kana02", v.メイ); await e.set("company_name", v.会社);
    await e.set("address][addr01", v.住所1); await e.set("address][addr02", v.住所2); await e.set("address][addr03", v.住所3);
    await e.set("Player][lastNameEn", v.MTG姓); await e.set("Player][firstNameEn", v.MTG名); await e.set("close_reason", v.退会);
  });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => {
    expect.soft(r.お名前姓, "お名前姓").toBe(v.姓); expect.soft(r.お名前名, "お名前名").toBe(v.名);
    expect.soft(r.フリガナ姓, "お名前姓（カナ）").toBe(v.セイ); expect.soft(r.フリガナ名, "お名前名（カナ）").toBe(v.メイ);
    expect.soft(r.会社名, "会社名").toBe(v.会社); expect.soft(r.住所1, "住所1").toBe(v.住所1); expect.soft(r.住所2, "住所2").toBe(v.住所2); expect.soft(r.住所3, "住所3").toBe(v.住所3);
    expect.soft(r.MTG姓, "MTG Companion登録本名の姓").toBe(v.MTG姓); expect.soft(r.MTG名, "MTG Companion登録本名の名").toBe(v.MTG名); expect.soft(r.退会区分, "退会区分").toBe(v.退会);
  });
});

caseTest("IT-M08-04-016", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-016〕");
  const d = new Date(); d.setDate(d.getDate() - 1);
  const [y, m, dd] = [String(d.getFullYear()), String(d.getMonth() + 1), String(d.getDate())];
  const 日付 = `${y}-${m.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.値で選ぶ("birth][year", y); await e.値で選ぶ("birth][month", m); await e.値で選ぶ("birth][day", dd); });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => { expect.soft(r.生年月日, `生年月日（試験実行日の前日 ${日付}）`).toBe(日付); });
});

caseTest("IT-M08-04-018", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-018A〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.set("email", 重複先メール018()); });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => { expect.soft(r.メールアドレス, "メールアドレスが更新されない（重複前のまま）").toBe(重複前メール018()); });
});

caseTest("IT-M08-04-021", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-021〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.set("fax][fax01", "03"); await e.set("fax][fax02", "1234"); await e.set("fax][fax03", "5678"); });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => { expect.soft([r.FAX1, r.FAX2, r.FAX3].join("・"), "FAX番号").toBe("03・1234・5678"); });
});

// ---- パスワード ----
caseTest("IT-M08-04-024", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-024〕");
  let e!: M08CustomerEditPage; let before = "", after = "";
  await step(1, async () => { before = String(保存内容(id).パスワード); });
  await step(2, async () => { e = await 開く(page, id); });
  await step(3, async () => {
    expect.soft(await e.get("plain_password][first"), "パスワード欄の初期値").toBe("**********");
    expect.soft(await e.get("plain_password][second"), "パスワード（確認）欄の初期値").toBe("**********");
    await e.set("company_name", "パスワード保持会社");
  });
  await step(4, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(5, async () => { after = String(保存内容(id).パスワード); });
  await expected(async () => { expect.soft(after, "暗号化されたパスワード値が保存前と同じ").toBe(before); });
});

caseTest("IT-M08-04-025", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-025〕");
  let e!: M08CustomerEditPage; let before = "", after = "";
  await step(1, async () => { before = String(保存内容(id).パスワード); });
  await step(2, async () => { e = await 開く(page, id); });
  await step(3, async () => { await e.set("plain_password][first", "NewPass8004!"); await e.set("plain_password][second", "NewPass8004!"); });
  await step(4, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(5, async () => { after = String(保存内容(id).パスワード); });
  await expected(async () => {
    expect.soft(after !== before, "暗号化されたパスワード値が保存前から更新されている").toBe(true);
    expect.soft(after !== "NewPass8004!" && after !== "", "保存された値が入力値そのままでなく、暗号化された値").toBe(true);
  });
});

// ---- 本人確認ステータス ----
caseTest("IT-M08-04-026", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-026〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.ラジオを選ぶ("Player][IdentityConfirmStatus", "未確認"); });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => { expect.soft(空(r.身分証有効期限), `身分証有効期限が空欄に更新されている（実際: ${r.身分証有効期限 ?? "空"}）`).toBe(true); });
});

caseTest("IT-M08-04-028", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-028〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => {
    await e.set("name][name01", "書留"); await e.set("name][name02", "変更"); await e.set("kana][kana01", "カキトメ"); await e.set("kana][kana02", "ヘンコウ");
    await e.値で選ぶ("birth][year", "1991"); await e.値で選ぶ("birth][month", "2"); await e.値で選ぶ("birth][day", "3");
  });
  await step(3, async () => { const p = await e.登録を押す(); if (p.ダイアログの文) { note(`確認ダイアログが出た: ${p.ダイアログの文}`); await p.答える("続行"); } });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => { expect.soft(r.本人確認ステータス, "本人確認ステータス").toBe("簡易書留確認済み"); });
});

function 降格(k: string, 変更: (e: M08CustomerEditPage) => Promise<void>) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const id = notes.get(`〔会員ID-M0804-${k}〕`);
    let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
    let p!: Awaited<ReturnType<M08CustomerEditPage["登録を押す"]>>;
    await step(1, async () => { e = await 開く(page, id); });
    await step(2, async () => { await 変更(e); });
    await step(3, async () => { p = await e.登録を押す(); });
    await step(4, async () => { note(`本人確認ステータス変更の確認ダイアログ: ${p.ダイアログの文 ?? "出なかった"}`); await p.答える("続行"); });
    await step(5, async () => { r = 保存内容(id); });
    await expected(async () => {
      expect.soft(p.ダイアログの文 !== null, "本人確認ステータス変更の確認が表示された").toBe(true);
      expect.soft(r.本人確認ステータス, "本人確認ステータス").toBe("未確認");
    });
  };
}
const 氏名変更 = (姓: string, 名: string, セイ: string, メイ: string) => async (e: M08CustomerEditPage) => {
  await e.set("name][name01", 姓); await e.set("name][name02", 名); await e.set("kana][kana01", セイ); await e.set("kana][kana02", メイ);
};
const 生日変更 = async (e: M08CustomerEditPage) => { await e.値で選ぶ("birth][year", "1991"); await e.値で選ぶ("birth][month", "2"); await e.値で選ぶ("birth][day", "3"); };
caseTest("IT-M08-04-030", 降格("030", async (e) => { await 氏名変更("確認", "変更", "カクニン", "ヘンコウ")(e); await 生日変更(e); }));
caseTest("IT-M08-04-083", 降格("083", async (e) => { await e.set("name][name01", "更新姓"); await e.set("name][name02", "更新名"); }));
caseTest("IT-M08-04-084", 降格("084", async (e) => { await e.set("kana][kana01", "コウシン"); await e.set("kana][kana02", "ガクシン"); }));
caseTest("IT-M08-04-085", 降格("085", 生日変更));

caseTest("IT-M08-04-032", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-032〕");
  let e!: M08CustomerEditPage; let status = 0; let body = "";
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => {
    const url = new URL(page.url());
    const res = await page.goto(`${url.origin}${url.pathname.replace(`/customer/${id}/`, "/customer/999999/")}`, { timeout: 60_000 });
    status = res?.status() ?? 0;
    await page.waitForLoadState("load");
    body = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 200);
  });
  await expected(async () => {
    expect.soft(status, "会員ID 999999の会員登録/編集画面のHTTPステータス").toBe(404);
    expect.soft(await e.f("email").count(), "会員登録/編集の入力画面が表示されない").toBe(0);
    note(`表示された画面の文: ${body}`);
  });
});

caseTest("IT-M08-04-044", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-044〕");
  let e!: M08CustomerEditPage;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await page.locator("#orderHistory").scrollIntoViewIfNeeded(); });
  await expected(async () => {
    expect.soft(await page.locator("#orderHistory table tbody tr").count(), "購入履歴の行数").toBe(0);
    expect.soft(await page.locator("#orderHistory .data-empty").count(), "購入履歴が0件の表示（購入履歴がない旨）").toBe(1);
    void e;
  });
});

function 遷移(k: string, ボタン: string, 画面: string) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const id = notes.get(`〔会員ID-M0804-${k}〕`);
    let e!: M08CustomerEditPage; let href = ""; let status = 0;
    await step(1, async () => { e = await 開く(page, id); });
    await step(2, async () => {
      const b = page.locator("#ex-conversion-action a.btn", { hasText: ボタン });
      await expect(b, `「${ボタン}」ボタンが1つある`).toHaveCount(1);
      href = new URL((await b.getAttribute("href")) ?? "", page.url()).pathname;
      const [res] = await Promise.all([page.waitForResponse((r) => r.request().resourceType() === "document", { timeout: 60_000 }), b.click({ timeout: 30_000 })]);
      status = res.status();
      await page.waitForLoadState("load");
    });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, `${画面}のアドレス`).toBe(href);
      expect.soft(status, `${画面}のHTTPステータス`).toBeLessThan(400);
      expect.soft(await e.f("email").count(), "会員登録/編集の画面ではなくなっている").toBe(0);
    });
  };
}
caseTest("IT-M08-04-050", 遷移("050", "ポイント管理・履歴一覧", "ポイント管理・履歴一覧画面"));
caseTest("IT-M08-04-051", 遷移("051", "ポイント確認", "ポイント確認画面"));
caseTest("IT-M08-04-052", 遷移("052", "送信履歴", "送信履歴画面"));
caseTest("IT-M08-04-053", 遷移("053", "手動メール通知", "手動メール通知画面"));

caseTest("IT-M08-04-060", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-060〕");
  let e!: M08CustomerEditPage;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.f("plain_password][first").scrollIntoViewIfNeeded(); });
  await expected(async () => {
    expect.soft(await e.get("plain_password][first"), "パスワード欄の入力値").toBe("**********");
    expect.soft(await e.get("plain_password][second"), "パスワード（確認）欄の入力値").toBe("**********");
  });
});

caseTest("IT-M08-04-061", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-061〕");
  let e!: M08CustomerEditPage;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await page.locator("#ordererInfo").scrollIntoViewIfNeeded(); });
  await expected(async () => {
    const t = (await page.locator("#ordererInfo .row.mb-2").first().innerText()).replace(/\s+/g, " ");
    expect.soft(t, "会員IDの表示").toContain(id);
    expect.soft(/会員ID\s*\??\s*(\d+)/.exec(t)?.[1] ?? null, "会員IDの表示の値").toBe(id);
    void e;
  });
});

caseTest("IT-M08-04-062", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-062〕");
  const v = { 会社: "M0804-062-" + "あ".repeat(40), 住所: "M0804-062-" + "あ".repeat(190), メール: 長いメール062, 退会: "M0804-062-" + "あ".repeat(246) };
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => {
    await e.set("company_name", v.会社); await e.set("address][addr01", v.住所); await e.set("address][addr02", v.住所); await e.set("address][addr03", v.住所);
    await e.set("email", v.メール); await e.set("close_reason", v.退会);
  });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => {
    expect.soft(r.会社名, "会社名（50文字）").toBe(v.会社); expect.soft(r.住所1, "住所1（200文字）").toBe(v.住所); expect.soft(r.住所2, "住所2（200文字）").toBe(v.住所); expect.soft(r.住所3, "住所3（200文字）").toBe(v.住所);
    expect.soft(r.メールアドレス, "メールアドレス（255文字）").toBe(v.メール); expect.soft(r.退会区分, "退会区分（256文字）").toBe(v.退会);
  });
});

caseTest("IT-M08-04-069", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-069〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.set("Player][lastNameEn", ""); await e.set("Player][firstNameEn", ""); });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => {
    expect.soft(空(r.MTG姓), `MTG Companion登録本名(英語)の姓が空に更新されている（実際: ${r.MTG姓 ?? "空"}）`).toBe(true);
    expect.soft(空(r.MTG名), `MTG Companion登録本名(英語)の名が空に更新されている（実際: ${r.MTG名 ?? "空"}）`).toBe(true);
  });
});

function メルマガ(k: string, 新: "配信可" | "配信不可", 旧: "配信可" | "配信不可") {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const id = notes.get(`〔会員ID-M0804-${k}〕`);
    let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>; let 前 = "";
    await step(1, async () => { e = await 開く(page, id); 前 = await e.ラジオ選択中("Player][mailMagazineFlg"); });
    await step(2, async () => { await e.ラジオを選ぶ("Player][mailMagazineFlg", 新); });
    await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
    await step(4, async () => { r = 保存内容(id); });
    await expected(async () => {
      expect.soft(前, "保存前のメールマガジン配信フラグ").toBe(旧);
      expect.soft(r.メルマガ配信 === "true" ? "配信可" : "配信不可", "メールマガジン配信フラグ").toBe(新);
    });
  };
}
caseTest("IT-M08-04-071", メルマガ("071", "配信可", "配信不可"));
caseTest("IT-M08-04-072", メルマガ("072", "配信不可", "配信可"));

caseTest("IT-M08-04-086", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-086〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  let p!: Awaited<ReturnType<M08CustomerEditPage["登録を押す"]>>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.set("address][addr01", "新確認中住所1"); });
  await step(3, async () => { p = await e.登録を押す(); if (p.ダイアログの文) await p.答える("続行"); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => {
    expect.soft(p.ダイアログの文, "本人確認ステータス変更の確認（表示されない）").toBeNull();
    expect.soft(r.本人確認ステータス, "本人確認ステータス").toBe("確認中");
  });
});

caseTest("IT-M08-04-087", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-087〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.ラジオを選ぶ("Player][IdentityConfirmStatus", "オンライン本人確認済み"); });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => { expect.soft(r.身分証有効期限, "身分証有効期限").toBe("2027-12-31"); });
});

caseTest("IT-M08-04-093", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-093〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  let p!: Awaited<ReturnType<M08CustomerEditPage["登録を押す"]>>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await 氏名変更("保留撤回", "変更", "ホリュウ", "ヘンコウ")(e); await 生日変更(e); });
  await step(3, async () => { p = await e.登録を押す(); });
  await step(4, async () => { await p.答える("取り消し"); });
  await step(5, async () => { r = 保存内容(id); });
  await expected(async () => {
    expect.soft(p.ダイアログの文 !== null, "本人確認ステータス変更の確認が表示された").toBe(true);
    expect.soft(`${r.お名前姓} ${r.お名前名}`, "氏名（更新されない）").toBe("保留撤回 会員");
    expect.soft(`${r.フリガナ姓} ${r.フリガナ名}`, "カナ（更新されない）").toBe("ホリュウ カイイン");
    expect.soft(r.生年月日, "生年月日（更新されない）").toBe("1990-01-02");
    expect.soft(r.本人確認ステータス, "本人確認ステータス（更新されない）").toBe("オンライン本人確認済み");
  });
});

caseTest("IT-M08-04-094", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-094〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  let p!: Awaited<ReturnType<M08CustomerEditPage["登録を押す"]>>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.set("company_name", "更新会社"); });
  await step(3, async () => { p = await e.登録を押す(); if (p.ダイアログの文) await p.答える("続行"); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => {
    expect.soft(p.ダイアログの文, "本人確認ステータス変更の確認（表示されない）").toBeNull();
    expect.soft(r.会社名, "会社名").toBe("更新会社");
    expect.soft(r.本人確認ステータス, "本人確認ステータス").toBe("オンライン本人確認済み");
  });
});

caseTest("IT-M08-04-095", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-095〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.ラジオを選ぶ("Player][IdentityConfirmStatus", "未確認"); });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => { expect.soft(空(r.身分証有効期限), `身分証有効期限が空欄のまま（実際: ${r.身分証有効期限 ?? "空"}）`).toBe(true); });
});
void adminUrl;

// =====================================================================================================
// 残りのケース（2026-11-11 追加）。選択項目の「試験…A」は、共有のマスタに足さず、既存の別の選択肢で読み替える（シード S-M08-04-MASTERS の注記）。
// =====================================================================================================
const 読み替え注記 = (何: string, 値: string) => note(`${何}の「試験…A」は共有のマスタに足さないため、既存の選択肢「${値}」を選んだ`);
const 数字だけ = (t: string): string => t.replace(/\D/g, "");

caseTest("IT-M08-04-002", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-002〕");
  let e!: M08CustomerEditPage; let 回数 = ""; let 金額 = "";
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { 回数 = await e.項目の値("累計注文回数"); 金額 = await e.項目の値("累計注文金額"); });
  await expected(async () => {
    expect.soft(回数, "累計注文回数の表示").toBe("12回");
    expect.soft(金額.replace(/[^\d,]/g, ""), "累計注文金額の表示（桁区切り）").toBe("345,600");
  });
});

caseTest("IT-M08-04-008", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-008〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  let 国 = ""; let 職業 = ""; let グループ = "";
  const 都道府県 = "大阪府"; const 性別 = "女性";
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => {
    国 = await e.別の選択肢("country"); 職業 = await e.別の選択肢("job"); グループ = await e.別の選択肢("Player][CustomerGroup");
    await e.選ぶ("country", 国); await e.選ぶ("address][pref", 都道府県); await e.ラジオを選ぶ("sex", 性別);
    await e.選ぶ("job", 職業); await e.選ぶ("Player][CustomerGroup", グループ);
    読み替え注記("国・都道府県・性別・職業・顧客グループ", `${国}・${都道府県}・${性別}・${職業}・${グループ}`);
  });
  await step(3, async () => { await e.登録する(); await 保存後メッセージを注記(e); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => {
    expect.soft(r.国, "国").toBe(国); expect.soft(r.都道府県, "都道府県").toBe(都道府県); expect.soft(r.性別, "性別").toBe(性別);
    expect.soft(r.職業, "職業").toBe(職業); expect.soft(r.顧客グループ, "顧客グループ").toBe(グループ);
  });
});

// ---- 本人確認ステータスの降格（027・074〜079） ----
caseTest("IT-M08-04-027", 降格("027", async (e) => {
  const 国 = await e.別の選択肢("country");
  await e.選ぶ("country", 国); await e.set("postalCode][postalCode01", "101"); await e.set("postalCode][postalCode02", "0001");
  await e.set("abroadPostalCode", "123456"); await e.選ぶ("address][pref", "大阪府"); await e.set("address][addr01", "変更住所1"); await e.set("address][addr02", "変更住所2");
  読み替え注記("国・都道府県", `${国}・大阪府`);
}));
caseTest("IT-M08-04-074", 降格("074", async (e) => { const 国 = await e.別の選択肢("country"); await e.選ぶ("country", 国); 読み替え注記("国", 国); }));
caseTest("IT-M08-04-075", 降格("075", async (e) => { await e.set("postalCode][postalCode01", "101"); await e.set("postalCode][postalCode02", "0001"); }));
caseTest("IT-M08-04-076", 降格("076", async (e) => { await e.set("abroadPostalCode", "123456"); }));
caseTest("IT-M08-04-077", 降格("077", async (e) => { await e.選ぶ("address][pref", "大阪府"); 読み替え注記("都道府県", "大阪府"); }));
caseTest("IT-M08-04-078", 降格("078", async (e) => { await e.set("address][addr01", "変更住所1"); }));
caseTest("IT-M08-04-079", 降格("079", async (e) => { await e.set("address][addr02", "変更住所2"); }));

caseTest("IT-M08-04-029", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-029〕");
  let e!: M08CustomerEditPage; let 前!: ReturnType<typeof 保存内容>; let 後!: ReturnType<typeof 保存内容>;
  let p!: Awaited<ReturnType<M08CustomerEditPage["登録を押す"]>>;
  await step(1, async () => { e = await 開く(page, id); 前 = 保存内容(id); });
  await step(2, async () => {
    const 国 = await e.別の選択肢("country");
    await e.選ぶ("country", 国); await e.set("address][addr01", "取消確認住所");
    読み替え注記("国", 国);
  });
  await step(3, async () => { p = await e.登録を押す(); });
  await step(4, async () => { note(`本人確認ステータス変更の確認ダイアログ: ${p.ダイアログの文 ?? "出なかった"}`); await p.答える("取り消し"); });
  await step(5, async () => { 後 = 保存内容(id); });
  await expected(async () => {
    expect.soft(p.ダイアログの文 !== null, "本人確認ステータス変更の確認が表示された").toBe(true);
    expect.soft(後.国, "国が保存前の値のまま").toBe(前.国);
    expect.soft(後.住所1, "住所1が保存前の値のまま").toBe(前.住所1);
    expect.soft(後.本人確認ステータス, "本人確認ステータスが保存前の値のまま").toBe(前.本人確認ステータス);
  });
});

// ---- お届け先住所 ----
const お届け先文を確かめる = (文: string, 氏名: string, 住所: string, 電話: string, 何: string): void => {
  expect.soft(文, `${何}: 氏名`).toContain(氏名);
  expect.soft(文, `${何}: 住所`).toContain(住所);
  expect.soft(数字だけ(文), `${何}: 電話番号（ハイフンを除いて比べる）`).toContain(数字だけ(電話));
};
caseTest("IT-M08-04-033", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-033〕");
  let e!: M08CustomerEditPage; let 文 = "";
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { 文 = await e.お届け先の文("配送 太郎"); });
  await expected(async () => {
    expect.soft(文, "お届け先住所欄: 氏名").toContain("配送 太郎");
    お届け先文を確かめる(文, "配送 太郎", "東京都千代田区1-1", "03-1111-2222", "お届け先住所欄");
  });
});
caseTest("IT-M08-04-088", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-088〕");
  let e!: M08CustomerEditPage; let 太郎 = ""; let 花子 = "";
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { 太郎 = await e.お届け先の文("配送 太郎"); 花子 = await e.お届け先の文("配送 花子"); });
  await expected(async () => {
    expect.soft(太郎, "お届け先住所欄の1件目: 氏名").toContain("配送 太郎");
    お届け先文を確かめる(太郎, "配送 太郎", "東京都千代田区1-1", "03-0884-1111", "お届け先住所欄の1件目");
    お届け先文を確かめる(花子, "配送 花子", "東京都港区2-2", "03-0884-2222", "お届け先住所欄の2件目");
  });
});
caseTest("IT-M08-04-034", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-034〕"); const did = notes.get("〔お届け先ID-M0804-034〕");
  let v: Record<string, string> = {};
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => { await 住所リンクを押す(page, "千代田区"); v = await 配送先編集の値(page); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "お届け先登録画面のアドレス").toMatch(new RegExp(`/customer/${id}/delivery/${did}/edit$`));
    expect.soft(`${v.姓} ${v.名}`, "お届け先登録画面の氏名").toBe("配送 太郎");
  });
});
caseTest("IT-M08-04-035", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-035〕");
  let e!: M08CustomerEditPage;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => {
    await expect(e.お届け先住所を追加ボタン, "「お届け先住所を追加」ボタンが1つある").toHaveCount(1);
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), e.お届け先住所を追加ボタン.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "お届け先登録画面（新規）のアドレス").toMatch(new RegExp(`/customer/${id}/delivery/new$`));
    expect.soft(await page.locator('[name="customer_address[address_name]"]').count(), "お届け先登録画面の入力欄が表示されている").toBe(1);
  });
});
function お届け先の削除(k: string, 残り: string[]) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const id = notes.get(`〔会員ID-M0804-${k}〕`);
    let e!: M08CustomerEditPage; let 氏名: string[] = [];
    await step(1, async () => { e = await 開く(page, id); });
    await step(2, async () => { await e.お届け先の削除ボタンを押す("配送 太郎"); });
    await step(3, async () => { await e.お届け先削除のモーダルで削除する("配送 太郎"); });
    await step(4, async () => { 氏名 = お届け先の氏名(id); });
    await expected(async () => {
      expect.soft(氏名, `会員ID ${id} の削除されていないお届け先住所`).toEqual(残り);
    });
  };
}
caseTest("IT-M08-04-036", お届け先の削除("036", []));
caseTest("IT-M08-04-089", お届け先の削除("089", ["配送 花子"]));

// ---- 購入履歴 ----
const 日付 = (y: number, m: number, d: number) => new RegExp(`${y}\\D0?${m}\\D0?${d}(\\D|$)`);
const 時刻つき = (y: number, m: number, d: number, hh: string) => new RegExp(`${y}\\D0?${m}\\D0?${d}\\D+${hh}:00`);
type 購入履歴の行 = Awaited<ReturnType<M08CustomerEditPage["購入履歴"]>>;
type 買取履歴の行 = Awaited<ReturnType<M08CustomerEditPage["買取履歴"]>>;
caseTest("IT-M08-04-038", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-共有購入〕");
  let 行: 購入履歴の行 = [];
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => { 行 = await new M08CustomerEditPage(page).購入履歴(); });
  await expected(async () => {
    const r = 行.find((x) => x.受注番号 === "920001");
    expect.soft(r !== undefined, `受注番号920001の行がある（実際の受注番号: ${行.map((x) => x.受注番号).join("、")}）`).toBe(true);
    if (!r) return;
    expect.soft(r.注文日時, "注文日時").toMatch(時刻つき(2026, 8, 1, "10"));
    expect.soft(r.購入金額.replace(/[^\d,]/g, ""), "購入金額").toBe("1,200");
    expect.soft(r.発送日, "発送日").toMatch(日付(2026, 8, 2));
    expect.soft(r.支払方法, "支払方法").toBe("試験支払A");
  });
});
caseTest("IT-M08-04-039", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-039〕");
  let 行: 購入履歴の行 = [];
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => { 行 = await new M08CustomerEditPage(page).購入履歴(); });
  await expected(async () => {
    expect.soft(行.map((x) => x.受注番号), "購入履歴に決済処理中の930001が出ない").not.toContain("930001");
    expect.soft(行.map((x) => x.受注番号), "購入履歴に購入処理中の930002が出ない").not.toContain("930002");
    expect.soft(行.length, "購入履歴の行数（受注はこの2件だけ）").toBe(0);
  });
});
caseTest("IT-M08-04-042", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-042〕");
  let 行: 購入履歴の行 = [];
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => { 行 = await new M08CustomerEditPage(page).購入履歴(); });
  await expected(async () => {
    expect.soft(行.length, "購入履歴の行数").toBe(1);
    expect.soft(行[0]?.受注番号, "受注番号欄").toBe("-");
    expect.soft(行[0]?.発送日, "発送日欄").toBe("未発送");
  });
});
caseTest("IT-M08-04-043", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-共有購入〕");
  let e!: M08CustomerEditPage; let href = ""; let status = 0;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => {
    const link = page.locator("#orderHistory table tbody tr a").filter({ hasText: /^\s*920001\s*$/ });
    await expect(link, "受注番号920001のリンクが1つある").toHaveCount(1);
    href = new URL((await link.getAttribute("href")) ?? "", page.url()).pathname;
    const [res] = await Promise.all([page.waitForResponse((r) => r.request().resourceType() === "document", { timeout: 60_000 }), link.click({ timeout: 30_000 })]);
    status = res.status();
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "受注管理編集画面のアドレス").toBe(href);
    expect.soft(href, "受注の編集画面のアドレス").toMatch(/\/order\/\d+\/edit$/);
    expect.soft(status, "受注管理編集画面のHTTPステータス").toBeLessThan(400);
    expect.soft(await page.locator("body").innerText(), "画面に受注番号920001がある").toContain("920001");
    expect.soft(await e.f("email").count(), "会員登録/編集の画面ではなくなっている").toBe(0);
  });
});
caseTest("IT-M08-04-082", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-082〕");
  let 行: 購入履歴の行 = [];
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => { 行 = await new M08CustomerEditPage(page).購入履歴(); });
  await expected(async () => {
    expect.soft(行.map((x) => x.受注番号), "購入履歴の受注番号（940821だけ。決済処理中の940822は出ない）").toEqual(["940821"]);
  });
});

// ---- 買取履歴 ----
caseTest("IT-M08-04-045", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-045〕"); const 買取ID = notes.get("〔買取ID-M0804-045〕");
  let 行: 買取履歴の行 = [];
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => { 行 = await new M08CustomerEditPage(page).買取履歴(); note(`買取IDは画面・DBが振った番号 ${買取ID} を使った（正本の321045ではない）`); });
  await expected(async () => {
    const r = 行.find((x) => x.買取番号 === 買取番号の表示(買取ID));
    expect.soft(r !== undefined, `買取ID ${買取ID} の行がある（実際の買取番号: ${行.map((x) => x.買取番号).join("、")}）`).toBe(true);
    if (!r) return;
    expect.soft(r.買取依頼日, "買取依頼日").toMatch(日付(2026, 8, 3));
    expect.soft(r.申込時金額.replace(/[^\d,]/g, ""), "申込時金額").toBe("5,000");
    expect.soft(r.査定金額.replace(/[^\d,]/g, ""), "査定金額").toBe("4,500");
    expect.soft(r.買取ステータス, "買取ステータス").toBe("査定済み");
  });
});
caseTest("IT-M08-04-046", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-共有買取〕"); const 買取ID = notes.get("〔買取ID-M0804-共有買取〕");
  let 行: 買取履歴の行 = [];
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => { 行 = await new M08CustomerEditPage(page).買取履歴(); note(`買取IDは画面・DBが振った番号 ${買取ID} を使った（正本の321ではない）。7桁表記はその番号を0埋めした値`); });
  await expected(async () => {
    expect.soft(行.length, "買取履歴の行数").toBe(1);
    expect.soft(行[0]?.買取番号, "買取番号（7桁）").toBe(買取番号の表示(買取ID));
    expect.soft(行[0]?.買取番号, "買取番号は7桁").toMatch(/^\d{7}$/);
  });
});
caseTest("IT-M08-04-049", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-共有買取〕"); const 買取ID = notes.get("〔買取ID-M0804-共有買取〕");
  let e!: M08CustomerEditPage; let status = 0;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => {
    const link = page.locator("#buyOrderHistory table tbody tr a").filter({ hasText: new RegExp(`^\\s*${買取番号の表示(買取ID)}\\s*$`) });
    await expect(link, `買取番号${買取番号の表示(買取ID)}のリンクが1つある`).toHaveCount(1);
    const [res] = await Promise.all([page.waitForResponse((r) => r.request().resourceType() === "document", { timeout: 60_000 }), link.click({ timeout: 30_000 })]);
    status = res.status();
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "買取詳細画面のアドレス").toMatch(new RegExp(`/purchase/${買取ID}/edit$`));
    expect.soft(status, "買取詳細画面のHTTPステータス").toBeLessThan(400);
    expect.soft(await page.locator("#purchase_detail_form").count(), "買取詳細（買取情報編集）の画面が表示されている").toBe(1);
    expect.soft(await e.f("email").count(), "会員登録/編集の画面ではなくなっている").toBe(0);
  });
});

caseTest("IT-M08-04-070", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-070〕");
  let e!: M08CustomerEditPage;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => { await e.f("Player][smaregiId").scrollIntoViewIfNeeded(); });
  await expected(async () => {
    const f = e.f("Player][smaregiId");
    expect.soft(await f.inputValue(), "スマレジIDの表示").toBe("7080070");
    expect.soft(await f.isEditable(), "スマレジIDは編集できない（編集用の入力欄ではなく表示だけ）").toBe(false);
    note("スマレジIDの欄は、値が入った編集不可（disabled）の入力欄として表示される。「編集用の入力欄が表示されない」は「編集できる入力欄が無い」と解釈した");
  });
});

// ---- 更新の反映（ブラウザA＝フロントの会員、ブラウザB＝管理画面） ----
async function 別のブラウザを開く(browser: Browser) {
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(ctx);
  return { ctx, A: await ctx.newPage() };
}
caseTest("IT-M08-04-080", async ({ page, browser, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-QH001〕");
  const { ctx, A } = await 別のブラウザを開く(browser);
  try {
    let 変更!: ChangePage; let e!: M08CustomerEditPage;
    let 後 = { 姓: "", 会社: "", 住所1: "", 住所2: "" };
    await step(1, async () => { await 会員としてログインする(A, QH会員のメール("001"), QH会員のパスワード("001")); });
    await step(2, async () => {
      変更 = new ChangePage(A); await 変更.開いて待つ();
      expect(await 変更.値("name][name01"), "更新前のお名前(姓)").toBe("旧姓001");
      expect(await 変更.値("company_name"), "更新前の会社名").toBe("旧会社M0804QH001");
      expect(await 変更.値("address][addr01"), "更新前の住所1").toBe("千代田区旧町001");
      expect(await 変更.値("address][addr02"), "更新前の住所2").toBe("旧ビル001");
    });
    await step(3, async () => { await loginAdmin(page, M0804_QH_ADMIN); });
    await step(4, async () => { e = new M08CustomerEditPage(page); if ((await e.open(id)) !== 200) throw new Error(`会員ID ${id} の会員登録/編集画面を開けない`); });
    await step(5, async () => { await e.set("name][name01", "新姓001"); await e.set("company_name", "新会社M0804QH001"); await e.set("address][addr01", "港区新町001"); await e.set("address][addr02", "新ビル001"); });
    await step(6, async () => {
      await e.登録する();
      expect(await e.成功メッセージ(), `「保存しました」が表示される（エラー: ${(await e.エラー文()).join(" / ")}）`).toContain("保存しました");
    });
    await step(7, async () => {
      await 変更.開いて待つ();
      後 = { 姓: await 変更.値("name][name01"), 会社: await 変更.値("company_name"), 住所1: await 変更.値("address][addr01"), 住所2: await 変更.値("address][addr02") };
    });
    await expected(async () => {
      expect.soft(後.姓, "お名前(姓)").toBe("新姓001"); expect.soft(後.会社, "会社名").toBe("新会社M0804QH001");
      expect.soft(後.住所1, "住所(住所1)").toBe("港区新町001"); expect.soft(後.住所2, "住所(住所2)").toBe("新ビル001");
      for (const old of ["旧姓001", "旧会社M0804QH001", "千代田区旧町001", "旧ビル001"]) expect.soft(Object.values(後), `更新前の「${old}」は表示されない`).not.toContain(old);
    });
  } finally { await ctx.close(); }
});
caseTest("IT-M08-04-081", async ({ page, browser, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-QH002〕");
  const { ctx, A } = await 別のブラウザを開く(browser);
  try {
    let マイページ!: MypagePage; let e!: M08CustomerEditPage; let 名前 = "";
    await step(1, async () => { await 会員としてログインする(A, QH会員のメール("002"), QH会員のパスワード("002")); });
    await step(2, async () => {
      マイページ = new MypagePage(A); await マイページ.開く();
      expect(await マイページ.名前の表示(), "更新前のマイページの名前(姓)").toContain("旧姓002");
    });
    await step(3, async () => { await loginAdmin(page, M0804_QH_ADMIN); });
    await step(4, async () => { e = new M08CustomerEditPage(page); if ((await e.open(id)) !== 200) throw new Error(`会員ID ${id} の会員登録/編集画面を開けない`); });
    await step(5, async () => { await e.set("name][name01", "新姓002"); });
    await step(6, async () => {
      await e.登録する();
      expect(await e.成功メッセージ(), `「保存しました」が表示される（エラー: ${(await e.エラー文()).join(" / ")}）`).toContain("保存しました");
    });
    await step(7, async () => { await マイページ.開く(); 名前 = await マイページ.名前の表示(); });
    await expected(async () => {
      expect.soft(名前, "マイページの名前(姓)").toContain("新姓002");
      expect.soft(名前, "更新前の「旧姓002」は表示されない").not.toContain("旧姓002");
    });
  } finally { await ctx.close(); }
});

// ---- 買取情報・本人確認の連携（RH） ----
async function 買取を検索する(page: Page, 番号: string): Promise<{ list: BuyListPage; 行: Awaited<ReturnType<BuyListPage["行"]>> }> {
  const list = new BuyListPage(page);
  await list.open(); await list.買取番号を入れる(String(Number(番号))); await list.検索する();
  return { list, 行: await list.行() };
}
caseTest("IT-M08-04-090", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-001〕"); const 番号 = notes.get("〔買取番号-M0804-001〕");
  let list!: BuyListPage; let e!: M08CustomerEditPage;
  let 前!: Awaited<ReturnType<M0703EditPage["基本情報"]>>; let 後!: Awaited<ReturnType<M0703EditPage["基本情報"]>>;
  const 編集を読む = async () => { await list.編集画面を開く(番号); const ed = new M0703EditPage(page); await ed.読み込みを待つ(); return ed.基本情報(); };
  await step(1, async () => { await loginAdmin(page, M0804_RH_ADMIN); });
  await step(2, async () => { ({ list } = await 買取を検索する(page, 番号)); });
  await step(3, async () => { 前 = await 編集を読む(); });
  await step(4, async () => { e = new M08CustomerEditPage(page); if ((await e.open(id)) !== 200) throw new Error(`会員ID ${id} の会員登録/編集画面を開けない`); });
  await step(5, async () => {
    await e.set("name][name01", "更新後"); await e.set("name][name02", "次郎"); await e.set("kana][kana01", "コウシンゴ"); await e.set("kana][kana02", "ジロウ");
    await e.登録する();
  });
  await step(6, async () => { expect(await e.成功メッセージ(), `「保存しました」が表示される（エラー: ${(await e.エラー文()).join(" / ")}）`).toContain("保存しました"); });
  await step(7, async () => { ({ list } = await 買取を検索する(page, 番号)); 後 = await 編集を読む(); });
  await expected(async () => {
    expect.soft(前.氏名, "更新前の買取依頼者氏名").toBe("更新前 太郎");
    expect.soft(後.氏名, "買取依頼者氏名に会員の姓名が反映されている").toBe("更新後 次郎");
    expect.soft(後.氏名カナ, "買取依頼者氏名カナに会員の姓名カナが反映されている").toBe("コウシンゴ ジロウ");
    expect.soft(後.氏名, "更新前の氏名から変わっている").not.toBe(前.氏名);
    expect.soft(後.氏名カナ, "更新前の氏名カナから変わっている").not.toBe(前.氏名カナ);
  });
});
caseTest("IT-M08-04-091", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-002〕"); const 番号 = notes.get("〔買取番号-M0804-002〕");
  let e!: M08CustomerEditPage; let 前 = ""; let 後 = "";
  let p!: Awaited<ReturnType<M08CustomerEditPage["登録を押す"]>>;
  const 本人確認を読む = async () => {
    const { 行 } = await 買取を検索する(page, 番号);
    const r = 行.find((x) => Number(x.番号) === Number(番号));
    if (!r) throw new Error(`一覧に買取番号${買取番号の表示(番号)}の行が無い`);
    return r.本人確認;
  };
  await step(1, async () => { await loginAdmin(page, M0804_RH_ADMIN); });
  await step(2, async () => { await 買取を検索する(page, 番号); });
  await step(3, async () => { 前 = await 本人確認を読む(); });
  await step(4, async () => {
    e = new M08CustomerEditPage(page); if ((await e.open(id)) !== 200) throw new Error(`会員ID ${id} の会員登録/編集画面を開けない`);
    await e.set("address][addr02", "結合ビル804更新"); p = await e.登録を押す();
  });
  await step(5, async () => { note(`本人確認ステータス変更の確認ダイアログ: ${p.ダイアログの文 ?? "出なかった"}`); await p.答える("続行"); });
  await step(6, async () => { expect(await e.成功メッセージ(), `「保存しました」が表示される（エラー: ${(await e.エラー文()).join(" / ")}）`).toContain("保存しました"); });
  await step(7, async () => { 後 = await 本人確認を読む(); });
  await expected(async () => {
    expect.soft(前, "更新前の本人確認").toContain("オンライン本人確認済み");
    expect.soft(後, "買取検索一覧の本人確認に「未確認」が表示される").toContain("未確認");
    expect.soft(後, "更新前の「オンライン本人確認済み」は表示されない").not.toContain("オンライン本人確認済み");
  });
});

// ---- 101件の履歴（100件上限・新しい順） ----
function 購入101(k: "040" | "041") {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const id = notes.get("〔会員ID-M0804-共有購入101〕");
    let 番号: string[] = [];
    await step(1, async () => { await 開く(page, id); });
    await step(2, async () => { 番号 = (await new M08CustomerEditPage(page).購入履歴()).map((x) => x.受注番号); });
    await expected(async () => {
      if (k === "040") {
        expect.soft(番号.length, "購入履歴の表示件数").toBe(100);
        expect.soft(番号, "最も古い受注番号910001が表示されない").not.toContain("910001");
      } else {
        const want = Array.from({ length: 100 }, (_, i) => String(910101 - i));
        expect.soft(番号, "購入履歴の受注番号の並び（910101から910002まで新しい順）").toEqual(want);
      }
    });
  };
}
caseTest("IT-M08-04-040", 購入101("040"));
caseTest("IT-M08-04-041", 購入101("041"));
function 買取101(k: "047" | "048") {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const id = notes.get("〔会員ID-M0804-共有買取101〕");
    const 最古 = Number(notes.get("〔買取ID-M0804-共有買取101-最古〕")); const 最新 = Number(notes.get("〔買取ID-M0804-共有買取101-最新〕"));
    let 番号: string[] = [];
    await step(1, async () => { await 開く(page, id); });
    await step(2, async () => { 番号 = (await new M08CustomerEditPage(page).買取履歴()).map((x) => x.買取番号); note(`買取IDは振られた番号（最古 ${最古}・最新 ${最新}）を使った（正本の1〜101ではない）`); });
    await expected(async () => {
      if (k === "047") {
        expect.soft(番号.length, "買取履歴の表示件数").toBe(100);
        expect.soft(番号, "最も古い買取IDの履歴が表示されない").not.toContain(買取番号の表示(String(最古)));
      } else {
        const want = 番号.slice().sort().reverse();
        expect.soft(番号[0], "先頭は最新の買取番号").toBe(買取番号の表示(String(最新)));
        expect.soft(番号, "買取番号が新しい順（降順）に並ぶ").toEqual(want);
      }
    });
  };
}
caseTest("IT-M08-04-047", 買取101("047"));
caseTest("IT-M08-04-048", 買取101("048"));
