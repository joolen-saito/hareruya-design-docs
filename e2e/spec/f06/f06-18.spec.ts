/**
 * F06-18 会員情報変更。正本: cases/F06-18_test_cases.tsv
 * 001（シード無し）と、画面で作った試験会員で流せるもの（004・006〜012・017・019〜021・023・024・027・029・034・036・041・045・046・051〜058・060・070）。
 * 実装しないケース（理由は review/recheck_not_buildable_F06-18.tsv）:
 *  - 014・015・025・039・069・071: スマレジ試験環境の会員と、会員情報更新先の設定を要する（スマレジは後回し）
 *  - 072〜078: 上に加え、ブラックリストを0件にする（ほかの方の行を消す）
 * シードの読み替えは seeds/f06-18.ts の先頭。記録 review/F06-18_progress_2026-11-11_dev.md
 */
import { test } from "@playwright/test";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { 会員の保存内容 } from "../../db/m08_04";
import { 行の写し } from "../../db/f06_18";
import { LoginPage } from "../../pages/front/f06_03_login";
import { ChangePage } from "../../pages/front/f06_18_change";
import { 試験会員 } from "../../seeds/f06-18";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const ECTOP = /^\/(ja\/?)?$/;
const 開発者ツールの注記 = "開発者ツールの代わりに、画面の要素をスクリプトで取り除く・値を変えることで同じ状態にしてから押した";

/** シードで作った試験会員でログインし、会員情報変更画面の部品を返す（ログインは前提条件） */
async function ログイン(page: import("@playwright/test").Page, シードID: string): Promise<{ c: ChangePage; 会員ID: string; メール: string }> {
  const m = 試験会員(シードID);
  const c = new ChangePage(page);
  await c.ログインする(m.メール, m.パスワード);
  return { c, 会員ID: m.会員ID, メール: m.メール };
}

/** 「変更する」を押し、送信されたか・移った先を注記に残す */
async function 変更する(c: ChangePage): Promise<boolean> {
  const r = await c.変更するを押す();
  if (!r.sent) note("「変更する」を押したが、画面の入力チェックで送信されなかった");
  return r.sent;
}

caseTest("IT-F06-18-001", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.URLを開く("/ja/mypage/change"); });
  await expected(async () => {
    expect.soft(l.path(), "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await l.ログイン画面である(), "会員ログイン画面が表示される").toBe(true);
  });
});

// ---- 初期表示 ----
caseTest("IT-F06-18-004", async ({ page, step, expected }) => {
  const { c, メール } = await ログイン(page, "S-F06-18-JP");
  await step(1, async () => { await c.開く(); });
  let v!: Awaited<ReturnType<ChangePage["表示値"]>>;
  await step(2, async () => { v = await c.表示値(); });
  await expected(async () => {
    expect.soft([v.姓, v.名], "お名前").toEqual(["佐藤", "太郎"]);
    expect.soft([v.セイ, v.メイ], "フリガナ").toEqual(["サトウ", "タロウ"]);
    expect.soft(v.生年月日, "生年月日").toBe("1990-01-02");
    expect.soft(v.性別, "性別").toBe("男性");
    expect.soft(v.メール, "メールアドレス（シード表の f0618@example.com の前半に実行の印を付けたもの）").toBe(メール);
    expect.soft(v.郵便番号, "郵便番号").toBe("100-0001");
    expect.soft([v.都道府県, v.住所1, v.住所2], "住所").toEqual(["東京都", "千代田区千代田", "1番"]);
    expect.soft(v.電話番号, "電話番号").toBe("0311111111");
    expect.soft(v.会社名, "会社名").toBe("試験会社");
    expect.soft(v.職業, "職業").toBe("会社員");
    expect.soft(v.本人確認状況, "本人確認状況ステータス（確認済み）").toBe("オンライン本人確認済み");
    expect.soft([v.MTG姓, v.MTG名], "MTG Campaign 登録名（姓・名）").toEqual(["SATO", "TARO"]);
  });
});

caseTest("IT-F06-18-006", async ({ page, step, expected }) => {
  const { c } = await ログイン(page, "S-F06-18-JP");
  await step(1, async () => { await c.開く(); });
  let opts: string[] = [];
  await step(2, async () => { await c.欄("職業").click({ timeout: 30_000 }).catch(() => undefined); opts = await c.選択肢("職業"); });
  await expected(async () => {
    expect.soft(opts, "職業の選択肢").toContain("会社員");
    expect.soft(opts, "職業の選択肢").toContain("学生");
  });
});

// ---- 国の切り替え ----
async function 日本の形式か(c: ChangePage, 何: string): Promise<void> {
  expect.soft(await c.日本の郵便番号欄(), `${何}: 郵便番号が3桁・4桁の2つの欄`).toBe(true);
  expect.soft(await c.郵便番号の印(), `${何}: 郵便番号の前の印`).toBe("〒");
  expect.soft(await c.海外の郵便番号欄(), `${何}: 汎用の郵便番号の欄が出ない`).toBe(false);
  expect.soft(await c.都道府県欄(), `${何}: 住所(都道府県)が表示される`).toBe(true);
  expect.soft(await c.住所3欄(), `${何}: 住所(住所3)が表示されない`).toBe(false);
}
async function 汎用の形式か(c: ChangePage, 何: string): Promise<void> {
  expect.soft(await c.海外の郵便番号欄(), `${何}: 汎用の郵便番号の欄`).toBe(true);
  expect.soft(await c.日本の郵便番号欄(), `${何}: 日本の郵便番号の欄が出ない`).toBe(false);
  expect.soft(await c.都道府県欄(), `${何}: 住所(都道府県)が表示されない`).toBe(false);
  expect.soft(await c.住所3欄(), `${何}: 住所(住所3)が表示される`).toBe(true);
}

caseTest("IT-F06-18-007", async ({ page, step, expected }) => {
  const { c } = await ログイン(page, "S-F06-18-JP");
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { const moved = await c.国を選ぶ("Japan"); note(`国は初めから Japan。選び直して${moved ? "画面が読み込み直された" : "画面は読み込み直されなかった"}`); });
  await expected(async () => {
    expect.soft(await c.選択中("国"), "国").toBe("Japan");
    await 日本の形式か(c, "国 Japan");
  });
});

caseTest("IT-F06-18-008", async ({ page, step, expected }) => {
  const { c } = await ログイン(page, "S-F06-18-JP");
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.国を選ぶ("United States"); });
  await expected(async () => {
    expect.soft(await c.選択中("国"), "国").toBe("United States");
    await 汎用の形式か(c, "国 United States（読み込み後）");
  });
});

caseTest("IT-F06-18-009", async ({ page, step, expected }) => {
  const { c } = await ログイン(page, "S-F06-18-OVERSEAS");
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.国を選ぶ("Japan"); });
  await expected(async () => {
    expect.soft(await c.選択中("国"), "国").toBe("Japan");
    await 日本の形式か(c, "国 Japan（読み込み後）");
  });
});

caseTest("IT-F06-18-010", async ({ page, step, expected }) => {
  const { c } = await ログイン(page, "S-F06-18-JP");
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入れる("MTG Campaign 登録名(姓)", "COUNTRY"); await c.入れる("MTG Campaign 登録名(名)", "SWITCH"); });
  await step(3, async () => { await c.国を選ぶ("United States"); });
  await expected(async () => {
    expect.soft(await c.選択中("国"), "再表示されたフォームの国").toBe("United States");
    expect.soft([await c.値("MTG Campaign 登録名(姓)"), await c.値("MTG Campaign 登録名(名)")], "MTG Campaign 登録名（姓・名）").toEqual(["COUNTRY", "SWITCH"]);
  });
});

caseTest("IT-F06-18-011", async ({ page, step, expected }) => {
  const { c } = await ログイン(page, "S-F06-18-JP");
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入れる("MTG Campaign 登録名(姓)", "VALIDATION"); await c.入れる("MTG Campaign 登録名(名)", "ERROR"); });
  await step(3, async () => { await c.入れる("お名前(姓)", ""); });
  let sent = false;
  await step(4, async () => { sent = await 変更する(c); });
  await expected(async () => {
    expect.soft(c.完了画面か, "会員情報変更完了画面へ進まない").toBe(false);
    expect.soft(await c.変更画面である(), "会員情報変更画面のフォームが表示される").toBe(true);
    expect.soft((await c.エラー文()).length, `検証エラーが表示される（${sent ? "送信して画面が再表示された" : "画面の入力チェックで止まった"}）`).toBeGreaterThan(0);
    expect.soft([await c.値("MTG Campaign 登録名(姓)"), await c.値("MTG Campaign 登録名(名)")], "MTG Campaign 登録名（姓・名）").toEqual(["VALIDATION", "ERROR"]);
  });
});

caseTest("IT-F06-18-012", async ({ page, step, expected }) => {
  const { c } = await ログイン(page, "S-F06-18-JP");
  await step(1, async () => { await c.開く(); });
  let n = -1;
  await step(2, async () => { await c.欄("郵便番号(前半)").scrollIntoViewIfNeeded(); n = await c.郵便番号から自動入力の数(); });
  await expected(async () => {
    expect.soft(await c.日本の郵便番号欄(), "郵便番号欄が表示されている").toBe(true);
    expect.soft(n, "「郵便番号から自動入力」ボタンの数").toBe(0);
  });
});

// ---- 変更の保存 ----
caseTest("IT-F06-18-017", async ({ page, step, expected }) => {
  const { c } = await ログイン(page, "S-F06-18-JP-017");
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入れる("会社名", "完了遷移確認会社"); });
  await step(3, async () => { await 変更する(c); });
  await expected(async () => { expect.soft(c.path, "遷移した画面（会員情報変更完了画面）").toBe("/ja/mypage/change_complete"); });
});

/** パスワードを変えて保存し、DB のパスワードが従前の値から変わったか（平文と違うか）を確かめる */
function パスワードを変える(シードID: string, 新: string, 平文も: boolean): CaseBody {
  return async ({ page, step, expected }) => {
    const { c, 会員ID } = await ログイン(page, シードID);
    const 前 = 会員の保存内容(会員ID)?.パスワード ?? "";
    note("DB上の開始時のパスワードの値を控えた（記録には書かない）");
    await step(1, async () => { await c.開く(); });
    await step(2, async () => { note(`入れたパスワードの文字数: ${新.length}`); await c.パスワード(新); });
    await step(3, async () => { await 変更する(c); });
    let 後 = "";
    await step(4, async () => { 後 = 会員の保存内容(会員ID)?.パスワード ?? ""; });
    await expected(async () => {
      expect.soft(c.完了画面か, "会員情報変更完了画面へ進んだ").toBe(true);
      expect.soft(後 !== "" && 後 !== 前, "DBのパスワードが従前の値から変わった").toBe(true);
      if (平文も) expect.soft(後 !== 新, `DBのパスワードが平文の「${新}」と異なる（暗号化された値）`).toBe(true);
    });
  };
}
caseTest("IT-F06-18-019", パスワードを変える("S-F06-18-JP-019", "NewPass!0618", true));
caseTest("IT-F06-18-034", パスワードを変える("S-F06-18-JP-034", "Ab1!xyZ9", false));
caseTest("IT-F06-18-036", パスワードを変える("S-F06-18-JP-036", "Ab1!".repeat(8), false));
caseTest("IT-F06-18-058", パスワードを変える("S-F06-18-JP-058", "Ab1!xyZ9Qw2#", false));
caseTest("IT-F06-18-060", パスワードを変える("S-F06-18-JP-060", "Ab1!".repeat(12) + "Zq", false));

/** 1項目を変えて保存し、DB の本人確認ステータスを確かめる */
function 本人確認を確かめる(シードID: string, 変える: (c: ChangePage) => Promise<void>, 前の値: string, 期待: string): CaseBody {
  return async ({ page, step, expected }) => {
    const { c, 会員ID } = await ログイン(page, シードID);
    expect.soft(会員の保存内容(会員ID)?.本人確認ステータス, "変更前の本人確認ステータス").toBe(前の値);
    await step(1, async () => { await c.開く(); });
    await step(2, async () => { await 変える(c); });
    await step(3, async () => { await 変更する(c); });
    let 後 = "";
    await step(4, async () => { 後 = String(会員の保存内容(会員ID)?.本人確認ステータス ?? ""); });
    await expected(async () => {
      expect.soft(c.完了画面か, "会員情報変更完了画面へ進んだ").toBe(true);
      expect.soft(後, `本人確認ステータス（変更前は「${前の値}」）`).toBe(期待);
    });
  };
}
caseTest("IT-F06-18-020", 本人確認を確かめる("S-F06-18-JP-020", (c) => c.日本の郵便番号("101-0001"), "オンライン本人確認済み", "未確認"));
caseTest("IT-F06-18-021", 本人確認を確かめる("S-F06-18-REGISTERED-MAIL-021", (c) => c.入れる("住所1", "千代田区丸の内"), "簡易書留確認済み", "未確認"));
caseTest("IT-F06-18-070", 本人確認を確かめる("S-F06-18-COMPANY-070", (c) => c.入れる("会社名", "変更後会社"), "オンライン本人確認済み", "オンライン本人確認済み"));

caseTest("IT-F06-18-023", async ({ page, step, expected }) => {
  const { c, 会員ID } = await ログイン(page, "S-F06-18-JP");
  const 前 = 行の写し(会員ID);
  await step(1, async () => { await c.開く(); });
  await step(2, async () => {
    // 国を空にすると画面が送り直されるので、国を先に空にしてから、残りの欄を空にする
    if (await c.未選択の選択肢があるか("国")) await c.国を選ぶ("");
    else note("国の選択欄に未選択の選択肢が無いため、国は空にできなかった");
    await c.お名前("", ""); await c.フリガナ("", "");
    await c.生年月日("", "", "");
    await c.メールアドレス(""); await c.パスワード("");
    if (await c.日本の郵便番号欄()) await c.日本の郵便番号("");
    if (await c.海外の郵便番号欄()) await c.入れる("郵便番号(海外)", "");
    if (await c.都道府県欄()) await c.選ぶ("住所(都道府県)", "");
    await c.入れる("住所1", ""); await c.入れる("住所2", "");
    await c.電話番号("");
  });
  await step(3, async () => { await 変更する(c); });
  let 後 = 前;
  await step(4, async () => { 後 = 行の写し(会員ID); });
  await expected(async () => {
    expect.soft(c.完了画面か, "会員情報変更完了画面へ進まない").toBe(false);
    expect.soft(後.会員, "会員の行（全項目）が変わらない").toBe(前.会員);
    expect.soft(後.選手情報, "選手情報の行（全項目）が変わらない").toBe(前.選手情報);
    expect.soft(後.既定配送先, "既定配送先の行（全項目）が変わらない").toBe(前.既定配送先);
  });
});

caseTest("IT-F06-18-024", async ({ page, step, expected }) => {
  const { c, 会員ID } = await ログイン(page, "S-F06-18-JP-024");
  await step(1, async () => { await c.開く(); });
  await step(2, async () => {
    await c.選ぶ("性別", ""); await c.入れる("会社名", ""); await c.選ぶ("職業", "");
    await c.入れる("MTG Campaign 登録名(姓)", ""); await c.入れる("MTG Campaign 登録名(名)", "");
  });
  await step(3, async () => { await 変更する(c); });
  let r: ReturnType<typeof 会員の保存内容>;
  await step(4, async () => { r = 会員の保存内容(会員ID); });
  await expected(async () => {
    expect.soft(c.完了画面か, "会員情報変更完了画面へ進んだ").toBe(true);
    expect.soft(r?.性別 ?? "", "性別が空").toBe("");
    expect.soft(r?.会社名 ?? "", "会社名が空").toBe("");
    expect.soft(r?.職業 ?? "", "職業が空").toBe("");
    expect.soft(r?.MTG姓 ?? "", "選手情報の英字姓（MTG Campaign 登録名(姓)）が空").toBe("");
    expect.soft(r?.MTG名 ?? "", "選手情報の英字名（MTG Campaign 登録名(名)）が空").toBe("");
  });
});

caseTest("IT-F06-18-027", async ({ page, step, expected }) => {
  const { c, 会員ID } = await ログイン(page, "S-F06-18-OVERSEAS-027");
  const v = "A".repeat(90);
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.国を選ぶ("United States"); });
  await step(3, async () => { await c.入れる("住所3", v); });
  await step(4, async () => { await 変更する(c); });
  let r: ReturnType<typeof 会員の保存内容>;
  await step(5, async () => { r = 会員の保存内容(会員ID); });
  await expected(async () => {
    expect.soft(c.完了画面か, "会員情報変更完了画面へ進んだ").toBe(true);
    expect.soft(r?.住所3, "住所3（90文字）").toBe(v);
  });
});

caseTest("IT-F06-18-029", async ({ page, step, expected }) => {
  const { c, 会員ID } = await ログイン(page, "S-F06-18-OVERSEAS-029");
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.国を選ぶ("United States"); });
  await step(3, async () => { await c.入れる("郵便番号(海外)", "1234567890"); });
  await step(4, async () => { await 変更する(c); });
  let r: ReturnType<typeof 会員の保存内容>;
  await step(5, async () => { r = 会員の保存内容(会員ID); });
  await expected(async () => {
    expect.soft(c.完了画面か, "会員情報変更完了画面へ進んだ").toBe(true);
    expect.soft(r?.海外用郵便番号, "郵便番号（10文字）").toBe("1234567890");
  });
});

caseTest("IT-F06-18-041", async ({ page, step, expected }) => {
  const { c, 会員ID } = await ログイン(page, "S-F06-18-JP-041");
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.国を選ぶ("Japan"); });
  await step(3, async () => {
    await c.日本の郵便番号("100-0001"); await c.選ぶ("住所(都道府県)", "東京都");
    await c.入れる("住所1", "千代田区千代田"); await c.入れる("住所2", "1番");
  });
  await step(4, async () => { await 変更する(c); });
  let z = "";
  await step(5, async () => { z = String(会員の保存内容(会員ID)?.郵便番号 ?? ""); });
  await expected(async () => {
    expect.soft(c.完了画面か, "会員情報変更完了画面へ進んだ").toBe(true);
    // DB は区切りの「-」なしの7桁で持つ。3桁-4桁に区切って比べる
    const 形式 = /^\d{7}$/.test(z) ? `${z.slice(0, 3)}-${z.slice(3)}` : z;
    note(`DB の郵便番号の値: ${z}`);
    expect.soft(形式, "郵便番号（日本の郵便番号形式。DBの値を3桁-4桁に区切ったもの）").toBe("100-0001");
  });
});

// ---- なりすまし対策 ----
function 照合値を崩す(会社名: string, 崩す: (c: ChangePage) => Promise<number>): CaseBody {
  return async ({ page, step, expected }) => {
    const { c, 会員ID } = await ログイン(page, "S-F06-18-JP");
    expect.soft(会員の保存内容(会員ID)?.会社名, "変更前の会社名").toBe("試験会社");
    await step(1, async () => { await c.開く(); });
    await step(2, async () => { await c.入れる("会社名", 会社名); });
    await step(3, async () => { const n = await 崩す(c); note(`${開発者ツールの注記}（入力要素 ${n} 個）`); expect.soft(n, "なりすまし対策の照合値の入力要素の数").toBeGreaterThan(0); });
    await step(4, async () => { await 変更する(c); });
    let r: ReturnType<typeof 会員の保存内容>;
    await step(5, async () => { r = 会員の保存内容(会員ID); });
    await expected(async () => {
      expect.soft(c.完了画面か, "会員情報変更完了画面へ進まない").toBe(false);
      expect.soft(r?.会社名, "会社名が「試験会社」のまま").toBe("試験会社");
    });
  };
}
caseTest("IT-F06-18-045", 照合値を崩す("トークン欠落更新会社", (c) => c.照合値の入力要素を削除する()));
caseTest("IT-F06-18-046", 照合値を崩す("トークン改ざん更新会社", (c) => c.照合値を変える("invalid-token")));

// ---- 画面の移動 ----
caseTest("IT-F06-18-051", async ({ page, step, expected }) => {
  const { c } = await ログイン(page, "S-F06-18-JP");
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.押す(c.オンライン本人確認リンク); });
  await expected(async () => { expect.soft(c.path, "遷移した画面（オンライン本人確認画面）").toMatch(/^\/ja\/mypage\/identification\/?$/); });
});
caseTest("IT-F06-18-052", async ({ page, step, expected }) => {
  const { c } = await ログイン(page, "S-F06-18-JP");
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.押す(c.戻るリンク); });
  await expected(async () => { expect.soft(c.path, "遷移した画面（ECTOP）").toMatch(ECTOP); });
});
caseTest("IT-F06-18-053", async ({ page, step, expected }) => {
  const { c } = await ログイン(page, "S-F06-18-JP");
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.押す(c.パンくずホーム); });
  await expected(async () => { expect.soft(c.path, "遷移した画面（本店ECTOP）").toMatch(ECTOP); });
});
caseTest("IT-F06-18-054", async ({ page, step, expected }) => {
  const { c } = await ログイン(page, "S-F06-18-JP");
  await step(1, async () => { await c.開く(); });
  let moved = true;
  await step(2, async () => {
    expect.soft(await c.パンくず現在地.innerText(), "パンくずの現在表示中ページ").toContain("会員情報変更");
    moved = await c.押す(c.パンくず現在地, false);
  });
  await expected(async () => {
    expect.soft(await c.現在地がリンクか(), "現在表示中ページはリンクでない").toBe(false);
    expect.soft(moved, "画面が移らない").toBe(false);
    expect.soft(c.path, "会員情報変更画面に留まる").toBe("/ja/mypage/change");
  });
});

/** 会社名を変えて「変更する」を押し、会員情報変更完了画面へ進む（手順1・2） */
async function 完了画面まで(c: ChangePage, step: (n: number, b: () => Promise<void>) => Promise<void>, 会社名: string): Promise<void> {
  await step(1, async () => { await c.開く(); await c.入れる("会社名", 会社名); });
  await step(2, async () => {
    await 変更する(c);
    expect(c.完了画面か, "会員情報変更完了画面へ進んだ").toBe(true);
  });
}
caseTest("IT-F06-18-055", async ({ page, step, expected }) => {
  const { c } = await ログイン(page, "S-F06-18-JP-055");
  await 完了画面まで(c, step, "完了画面ホーム確認会社");
  await step(3, async () => { await c.押す(c.パンくずホーム); });
  await expected(async () => { expect.soft(c.path, "遷移した画面（本店ECTOP）").toMatch(ECTOP); });
});
caseTest("IT-F06-18-056", async ({ page, step, expected }) => {
  const { c } = await ログイン(page, "S-F06-18-JP-056");
  await 完了画面まで(c, step, "完了画面戻る確認会社");
  await step(3, async () => { await c.押す(c.完了画面の戻る); });
  await expected(async () => { expect.soft(c.path, "遷移した画面（ECTOP）").toMatch(ECTOP); });
});
caseTest("IT-F06-18-057", async ({ page, step, expected }) => {
  const { c } = await ログイン(page, "S-F06-18-JP-057");
  await 完了画面まで(c, step, "完了画面パンくず確認会社");
  let moved = true;
  await step(3, async () => {
    expect.soft(await c.パンくず現在地.innerText(), "パンくずの現在表示中ページ").toContain("会員情報変更(完了)");
    moved = await c.押す(c.パンくず現在地, false);
  });
  await expected(async () => {
    expect.soft(await c.現在地がリンクか(), "現在表示中ページはリンクでない").toBe(false);
    expect.soft(moved, "画面が移らない").toBe(false);
    expect.soft(c.path, "会員情報変更完了画面に留まる").toBe("/ja/mypage/change_complete");
  });
});

