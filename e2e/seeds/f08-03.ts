/**
 * F08-03（店頭買取査定申込登録確認～完了）の画面シード。正本: cases/F08-03_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）で、シード表の「DBで準備」は、画面で作れる同じ前提か既存データへ読み替えた。DB へは書き込まない。
 * 読み替えたことは、そのシードを使うケースの注記（シード作成時の問題）に残す（reportSeedIssue）。
 *
 * - 店舗（STORE・STORE-NNN・L-STORE-NNN）: ケースごとの店舗を作らず、F08-05 と共通の試験店舗「店頭買取PD0805-003」（支店URL itf0805pd003。
 *   無ければ登録）を使う。店舗識別名（it-f0803-NNN）は画面で指定できずDBで設定する前提だったので、この店舗の支店URLに読み替える。
 *   「試験実行日の査定申込み=0件」は、申込みの返却希望サプライ（その他）に実行・ケースの印を入れ、その申込みだけを探して数えることで代えた。
 * - 会員（MEMBER-JP・MEMBER-EN・EXISTING-EMAIL・L-MEMBER-NNN）: 正本のメールアドレスのまま、あれば使い無ければフロントの会員登録で作る
 *   （仮会員になったら管理画面で本会員にする）。共有可のシードなので、メールアドレスに印は付けない。
 * - 会員登録フォームに入れるメールアドレス（ENTRY-INPUT・ENTRY-INPUT-NNN）・ブラックリストに一致する会員のメールアドレス:
 *   前半に実行の印を付けた新しいアドレスにして、同じメールアドレスの会員・プレイヤーのDBでの削除は行わない。
 * - ブラックリスト（BLACKLIST-NNN）: 種別「名称」は管理画面の種別「氏名」として、印つきの姓＋名を登録する。一致する行の削除は、印で一致する行が無いので行わない。
 * - 仮会員設定（ACTIVATE-ON）: 共有の設定なので、共有の環境では書き換えず、いまの値が有効であることを確かめて使う（違えば止める）。
 * - 追加システム設定の自動遷移秒数（OPTION）: 共有の設定なので書き換えない。ケースが完了画面の表示（N秒後）で15秒であることを確かめて使う。
 * - 査定番号の連番（STORE-015・SEQUENCE-015）: 共通の店舗には試験実行日の査定申込みが既にあり、連番を0007にそろえられない。
 *   ケースは「新しい査定番号の連番=同日の先に登録された件数+1」で確かめる。
 * - 管理者（L-ADM）: 店頭買取管理の参照権限の代わりに、システム管理者にした（F08-05 と同じ）。
 *
 * 作らないシード（ケースを実装しない）: 受信箱（MAILBOX）と、それだけを使う店舗・会員登録対象（STORE-020・ENTRY-INPUT-020。IT-F08-03-020）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { available } from "../lib/db";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { ensureBlacklist } from "../pages/admin/f06_masters";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore } from "../pages/admin/m04_24_store";
import { customerIdByEmail } from "../pages/admin/m06_04_member";
import { 管理画面で本会員にする } from "../pages/admin/member_activate";
import { EntryPage } from "../pages/front/f06_01_entry";
import * as db from "../db/f08_03";
import { PD_STORE, 仮会員設定を } from "./f08-05";

export { PD_STORE };

// ---- 値の取り決め ----

export const F0803_PASSWORD = "Passw0rd!F0803";
export const 会員JPのメール = "member-f0803@example.test";
export const 会員ENのメール = "member-en-f0803@example.test";
export const 英語会員のパスワード = "Passw0rd!F0803EN";
export const 登録済みメール = "existing-f0803@example.test";
export const ブラックリスト会員のパスワード = "Passw0rd!Blacklist";
export const F0803_ADMIN: Account = { loginId: "f0803l_admin", password: "Passw0rd!F0803L" };

/** 会員登録フォームに入れる新しいメールアドレス（正本の new-f0803@example.test などの前半に実行の印を付けた値） */
export const 印つきメール = (前半: string) => `${rc(前半)}@example.test`;
/** 申込みを見分ける印（申込みの返却希望サプライ（その他）に入れる。実行・ケースごとに違う） */
export const 申込みの印 = (n: string) => rc(`F0803-${n}`);

/** ブラックリスト会員の氏名（姓に実行の印）。正本の姓名「拒否」「対象」などに当たる */
export const 拒否の氏名 = { "021": { 姓: rc("拒否"), 名: "対象" }, "040": { 姓: rc("禁止"), 名: "四十" }, "041": { 姓: rc("禁止"), 名: "四十一" } } as const;
export const ブラックリスト会員のメール = (n: "021" | "040" | "041") => 印つきメール(n === "021" ? "blacklist-f0803" : `blacklist-f0803-${n}`);

/** 連携表示（L-MEMBER-NNN）の会員 */
export const 連携の会員 = {
  "037": { メール: "f0803l-001@example.test", パスワード: "Passw0rdF0803n037!F0803L001", 姓: "連携甲", 名: "一郎", セイ: "レンケイコウ", メイ: "イチロウ", 住所2: "連携ビル001", 電話: "0358030037" },
  "038": { メール: "f0803l-002@example.test", パスワード: "Passw0rdF0803n038!F0803L002", 姓: "連携乙", 名: "二郎", セイ: "レンケイオツ", メイ: "ジロウ", 住所2: "連携ビル002", 電話: "0358030038" },
  "039": { メール: "f0803l-003@example.test", パスワード: "Passw0rdF0803n039!F0803L003", 姓: "連携丙", 名: "三郎", セイ: "レンケイヘイ", メイ: "サブロウ", 住所2: "連携ビル003", 電話: "0358030039" },
} as const;

// ---- 店舗 ----

let 共通の店舗ID: Promise<string> | null = null;
/** 共通の試験店舗（あれば使い、無ければ登録）の店舗ID */
function 店舗IDを得る(browser: Browser, issue: (m: string) => void): Promise<string> {
  if (!共通の店舗ID) {
    共通の店舗ID = withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      return ensureStore(page, PD_STORE, issue);
    });
    共通の店舗ID.catch(() => { 共通の店舗ID = null; });
  }
  return 共通の店舗ID;
}

const 店舗の注記 = (店舗: string) =>
  `店舗「${店舗}」を新しく作らず、F08-05 と共通の試験店舗「${PD_STORE.店名}」（支店URL ${PD_STORE.支店URL}。無ければ登録）に読み替えた。` +
  "手順の店舗識別名もこの店舗の支店URLとして読む（店舗識別名は画面で指定できず、DBで設定する前提だった）。" +
  "査定申込み0件の前提は、申込みの返却希望サプライ（その他）に実行・ケースの印を入れ、その申込みだけを探して数えることで代えた";

defineSeed("S-F08-03-STORE", async ({ browser, notes, seed }) => {
  notes.set("〔店舗ID-F0803-共有〕", await 店舗IDを得る(browser, (m) => reportSeedIssue(seed.シードID, m)));
  reportSeedIssue(seed.シードID, 店舗の注記("結合試験店"));
});

const 店舗の番号 = [
  "009", "010", "011", "012", "013", "014", "016", "017", "018", "019", "021", "022", "023", "024", "025", "026", "027", "028", "029",
  "031", "032", "033", "036", "040", "041", "043", "044", "045",
];
for (const n of 店舗の番号) {
  defineSeed(`S-F08-03-STORE-${n}`, async ({ browser, notes, seed }) => {
    notes.set(`〔店舗ID-F0803-${n}〕`, await 店舗IDを得る(browser, (m) => reportSeedIssue(seed.シードID, m)));
    reportSeedIssue(seed.シードID, 店舗の注記(`結合試験店-${n}`));
  });
}
for (const n of ["037", "038", "039"] as const) {
  defineSeed(`S-F08-03-L-STORE-${n}`, async ({ browser, notes, seed }) => {
    notes.set(`〔店舗ID-F0803-${n}〕`, await 店舗IDを得る(browser, (m) => reportSeedIssue(seed.シードID, m)));
    reportSeedIssue(seed.シードID, 店舗の注記(`連携試験店${n === "037" ? "001" : n === "038" ? "002" : "003"}`) +
      "。管理画面の買取店舗に表示される店舗名は、この共通の試験店舗の店名になる");
  });
}
defineSeed("S-F08-03-STORE-015", async ({ browser, seed }) => {
  await 店舗IDを得る(browser, (m) => reportSeedIssue(seed.シードID, m));
  reportSeedIssue(seed.シードID, 店舗の注記("結合試験店-015") + "。店舗ID 46 の店舗をDBで登録する前提は、共通の試験店舗の店舗IDに読み替えた");
});
defineSeed("S-F08-03-SEQUENCE-015", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "査定番号の連番を0007にそろえる査定申込みをDBで登録しなかった（共通の試験店舗には試験実行日の査定申込みが既にあり、削除もしない）。" +
    "期待結果は「新しい査定番号の連番=同じ店舗の同じ日に先に登録された件数+1」で確かめる");
});

// ---- 入力値の取り決め ----

for (const id of ["S-F08-03-INPUT-JP", "S-F08-03-INPUT-EN", "S-F08-03-ENTRY-COMMON", "S-F08-03-INPUT-AGE17", "S-F08-03-INPUT-AGE18",
  "S-F08-03-INPUT-BLACKLIST-021", "S-F08-03-ENTRY-BLACKLIST", "S-F08-03-INPUT-BLACKLIST-040", "S-F08-03-INPUT-BLACKLIST-041"]) {
  defineSeed(id, async () => { /* 入力値の取り決め。投入は要らない（値は spec が持つ） */ });
}
defineSeed("S-F08-03-ENTRY-INPUT", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "メールアドレスの前半に実行の印を付けた新しいアドレスにした。同じメールアドレスの会員の削除は、印で新しいアドレスになることで代えた（削除しない）");
});
for (const n of ["018", "019", "027"]) {
  defineSeed(`S-F08-03-ENTRY-INPUT-${n}`, async ({ seed }) => {
    reportSeedIssue(seed.シードID, "メールアドレスの前半に実行の印を付けた新しいアドレスにした。同じメールアドレスの会員・プレイヤーのDBでの削除は、印で新しいアドレスになることで代えた（削除しない）");
  });
}

// ---- 会員 ----

type 会員の値 = {
  姓: string; 名: string; セイ: string; メイ: string; メール: string; パスワード: string; 住所2: string; 電話: string; 住所3?: string; 職業?: string;
};

/** 会員を用意する: メールアドレスの会員があれば使い（仮会員なら本会員にする）、無ければフロントの会員登録で作る。会員IDを返す */
async function 会員を用意する(browser: Browser, v: 会員の値, issue: (m: string) => void): Promise<string> {
  const 年 = String(new Date().getFullYear() - 30);
  const found = await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); return customerIdByEmail(page, v.メール); });
  if (found) {
    if (available) {
      const st = db.会員の状態(v.メール)[0]?.状態;
      if (st && st !== "本会員") {
        const r = await 管理画面で本会員にする(browser, v.メール);
        issue(`会員 ${v.メール} は会員ステータス「${r.前の状態}」だったので、管理画面で本会員にした`);
      }
    }
    issue(`会員 ${v.メール}（会員ID ${found}）はすでにあったので、登録せずに使った`);
    return found;
  }
  let 仮会員 = false;
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const e = new EntryPage(await context.newPage());
    e.page.setDefaultTimeout(60_000);
    await e.open();
    await e.fill({
      姓: v.姓, 名: v.名, セイ: v.セイ, メイ: v.メイ, 生年月日: [年, "1", "1"], メール: v.メール, パスワード: v.パスワード,
      国: "Japan", 郵便番号: "160-0023", 都道府県: "東京都", 住所1: "新宿区西新宿1-1-1", 住所2: v.住所2, 電話番号: v.電話, 職業: v.職業,
    });
    if (v.住所3 !== undefined) {
      if (await e.f("address][addr03").isVisible()) await e.f("address][addr03").fill(v.住所3);
      else issue(`会員情報登録画面に住所3の欄が無いので、住所3「${v.住所3}」は入れていない`);
    }
    if (!(await e.同意する()).sent) throw new Error(`会員 ${v.メール} の登録: 「同意して確認画面へ」を押しても確認画面へ進めない`);
    await e.登録する();
    if (e.登録エラー画面か) throw new Error(`会員 ${v.メール} の登録が登録エラーの画面になった（${e.path}）`);
    仮会員 = e.完了画面か;
  } finally {
    await context.close();
  }
  issue(`会員 ${v.メール} を新しく登録した。生年月日は ${年}年1月1日（試験実行日時点で30歳）、電話番号は ${v.電話}（ほかの会員と重ならない値）にした`);
  if (仮会員) {
    const r = await 管理画面で本会員にする(browser, v.メール);
    issue(`登録直後の会員ステータス「${r.前の状態}」を、管理画面の会員登録編集で本会員にした`);
    return r.会員ID;
  }
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const id = await customerIdByEmail(page, v.メール);
    if (!id) throw new Error(`会員 ${v.メール} が会員一覧に出ない`);
    return id;
  });
}

defineSeed("S-F08-03-MEMBER-JP", async ({ browser, notes, seed }) => {
  notes.set("〔会員ID-F0803-共有A〕", await 会員を用意する(browser, {
    姓: "結合", 名: "太郎", セイ: "ケツゴウ", メイ: "タロウ", メール: 会員JPのメール, パスワード: F0803_PASSWORD, 住所2: "晴ビル1F", 電話: "0358030001", 住所3: "ITビル803",
  }, (m) => reportSeedIssue(seed.シードID, m)));
});
defineSeed("S-F08-03-MEMBER-EN", async ({ browser, notes, seed }) => {
  notes.set("〔会員ID-F0803-共有B〕", await 会員を用意する(browser, {
    姓: "Smith", 名: "Alice", セイ: "スミス", メイ: "アリス", メール: 会員ENのメール, パスワード: 英語会員のパスワード, 住所2: "Hare Bldg 1F", 電話: "0358030002",
  }, (m) => reportSeedIssue(seed.シードID, m)));
});
defineSeed("S-F08-03-EXISTING-EMAIL", async ({ browser, notes, seed }) => {
  notes.set("〔会員ID-F0803-共有C〕", await 会員を用意する(browser, {
    姓: "既存", 名: "会員", セイ: "キゾン", メイ: "カイイン", メール: 登録済みメール, パスワード: F0803_PASSWORD, 住所2: "晴ビル2F", 電話: "0358030003",
  }, (m) => reportSeedIssue(seed.シードID, m)));
});
for (const n of ["037", "038", "039"] as const) {
  defineSeed(`S-F08-03-L-MEMBER-${n}`, async ({ browser, notes, seed }) => {
    const m = 連携の会員[n];
    notes.set(`〔会員ID-F0803-${n}〕`, await 会員を用意する(browser, {
      姓: m.姓, 名: m.名, セイ: m.セイ, メイ: m.メイ, メール: m.メール, パスワード: m.パスワード, 住所2: m.住所2, 電話: m.電話, 職業: "会社員",
    }, (x) => reportSeedIssue(seed.シードID, x)));
    reportSeedIssue(seed.シードID, "生年月日は1990年1月15日でなく、会員登録の部品の既定（1990年1月1日）にした（成年であることだけが前提）。" +
      "申込情報入力画面で「変更せずに」進めるよう、必須の職業「会社員」を会員情報に入れて登録した（職業は会員登録の必須項目ではない）");
  });
}

// ---- ブラックリスト ----

for (const n of ["021", "040", "041"] as const) {
  defineSeed(`S-F08-03-BLACKLIST-${n}`, async ({ browser, notes, seed }) => {
    const 氏名 = 拒否の氏名[n].姓 + 拒否の氏名[n].名;
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await ensureBlacklist(page, "氏名", 氏名);
    });
    notes.set(`〔ブラックリストID-F0803-${n}〕`, `ブラックリスト管理の一覧の種別「氏名」・キーワード「${氏名}」の行`);
    reportSeedIssue(seed.シードID, `シード表の種別「名称」は、ブラックリスト管理の種別「氏名」として、キーワード「${氏名}」（姓に実行の印）で登録した。` +
      `メールアドレスは ${ブラックリスト会員のメール(n)}（前半に実行の印）にした。一致する行・会員・プレイヤーの削除は、印で一致するものが無いので行っていない`);
  });
}

// ---- 仮会員設定・追加システム設定（共有の設定） ----

defineSeed("S-F08-03-ACTIVATE-ON", async ({ browser, seed }) => {
  await 仮会員設定を(browser, true, "実行", (m) => reportSeedIssue(seed.シードID, m));
});
defineSeed("S-F08-03-OPTION", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "追加システム設定の買取査定申込み完了画面の自動遷移秒数（共有の設定）を15に書き換えなかった。" +
    "ケースが完了画面の「※N秒後に自動で…」の N が15であることを確かめて使う（違えば止める）");
});

// ---- 管理者 ----

defineSeed("S-F08-03-L-ADM", async ({ browser, seed }) => {
  const 店舗ID = await 店舗IDを得る(browser, (m) => reportSeedIssue(seed.シードID, m));
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "F0803 連携参照用管理者", ログインID: F0803_ADMIN.loginId, メールアドレス: "f0803l-admin@example.test", パスワード: F0803_ADMIN.password,
    権限: "システム管理者", 所属店舗ID: 店舗ID, デフォルト検索表示店舗ID: "", 編集可能店舗ID: [店舗ID],
  }));
  reportSeedIssue(seed.シードID, "店頭買取管理の参照権限の代わりに、システム管理者にした（デフォルト検索表示店舗は全店）");
});
