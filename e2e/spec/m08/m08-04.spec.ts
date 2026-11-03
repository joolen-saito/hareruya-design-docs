/**
 * M08-04 会員登録/編集。正本: cases/M08-04_test_cases.tsv
 * 実装しないケース（記録 review/M08-04_progress_*.md）: シードがDBで準備されるもの（累計注文回数・受注・買取・お届け先 など）、DBで会員を0件にする初期化が要るもの、
 * メール通知の受信・外部連携（スマレジ）を確かめるもの、決済・外部の試験環境が要るもの。
 * 本人確認ステータス変更の確認は、ブラウザの確認ダイアログ。「続行」は OK、「取り消し」はキャンセルで答える。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin, adminUrl } from "../../lib/session";
import { 会員の保存内容, 会員住所の件数 } from "../../db/m08_04";
import { M08CustomerEditPage } from "../../pages/admin/m08_customer_edit";
import { M0804_ADMIN, 更新後メール004, 重複先メール018, 重複前メール018, 長いメール010, 長いメール062 } from "../../seeds/m08-04";

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
