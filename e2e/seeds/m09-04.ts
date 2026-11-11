/**
 * M09-04 ページ管理 のシード（実装したケースが使うもの）。正本: cases/M09-04_seed_data.tsv
 * - ページ名・URL・ファイル名は決め打ちの識別の値なので、実行の印を付ける（識別。依頼者決定 2026-10-28）。値はシード表の「状態・属性」から読む。
 * - 「DBシード」「DBへ直接」「テンプレート保管領域へ配置」を作り方とするシード（一覧除外用ページ・開発者作成ページ・ページ情報の置き換え・
 *   既定メタテンプレートなど）は画面だけでは作れないので、作り方を書かない。それらを使うケースは実装しない（記録の振り分け）。
 * - 「あれば画面から削除して0件にする」シード（登録前状態）は、印つきの値で作るので前回の残りに当たらない。0件であることだけを画面で確かめる。
 * - 試験管理者の権限は、コンテンツ管理を操作できる「システム管理者」にした（メンバー管理に、コンテンツ管理だけの権限が無いため）。
 */
import { expect } from "@playwright/test";
import { getSeed } from "../lib/catalog";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { RUN_MARK, rc } from "../lib/run_marker";
import { writeTestData } from "../db/write_adapter";
import { Account, withAdminSession } from "../lib/session";
import { ページ管理, ページの値 } from "../pages/admin/m09_04_page";
import { レイアウトを登録する } from "../pages/admin/m09_layout";
import { ensureAnalysisAdmin } from "./m12-common";

export const M0904_ADMIN: Account = { loginId: "m0904_admin", password: "Passw0rd!M0904" };

/** 決め打ちの識別の値に実行の印を付ける。末尾が「/」の値は印を「/」の前に、最後の区切りが「/user_data」の値は「/user_data」の前に付ける */
export function 識別(v: string): string {
  if (v.endsWith("/")) return rc(v.slice(0, -1)) + "/";
  if (v.endsWith("/user_data") && !v.startsWith("user_data/")) return rc(v.slice(0, -"/user_data".length)) + "/user_data";
  return rc(v);
}

export const 試験PCレイアウト = () => rc("試験PCレイアウト");
export const 試験モバイルレイアウト = () => rc("試験モバイルレイアウト");

export type シードのページ = {
  ページ名: string; URL: string; ファイル名: string; 日本語コード?: string; 英語コード?: string;
  author?: string; description?: string; keyword?: string; robot?: string; metatag?: string;
};

/** シード表の「状態・属性」から、ページの値を読んで実行の印を付ける（URL・ファイル名・ページ名） */
export function シードのページ(seedId: string): シードのページ {
  const segs = getSeed(seedId)["状態・属性"].split("／");
  const pick = (key: string): string | undefined => segs.find((s) => s.startsWith(key + "="))?.slice(key.length + 1);
  const name = pick("ページ名"); const url = pick("URL"); const file = pick("twigファイル");
  if (!name || !url || !file) throw new Error(`${seedId} の状態からページ名・URL・twigファイルを読めない`);
  return {
    ページ名: 識別(name), URL: 識別(url), ファイル名: 識別(file),
    日本語コード: pick("日本語コード"), 英語コード: pick("英語コード"),
    author: pick("author"), description: pick("description"), keyword: pick("keyword"), robot: pick("robot"), metatag: pick("metatag"),
  };
}

async function シードのページを作る(browser: import("@playwright/test").Browser, seedId: string, 追加: Partial<ページの値> = {}): Promise<string> {
  const v = シードのページ(seedId);
  return withAdminSession(browser, M0904_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const pa = new ページ管理(page);
    const 入力: ページの値 & { 言語?: "ja" | "en" } = {
      ページ名: v.ページ名, URL: v.URL, ファイル名: v.ファイル名, 言語: "ja",
      author: v.author, description: v.description, keyword: v.keyword, robot: v.robot, metatag: v.metatag, ...追加,
    };
    if (v.日本語コード !== undefined) 入力.コード = v.日本語コード;
    const id = await pa.作る(入力);
    if (v.英語コード !== undefined) {
      // 続けて、その編集画面の言語で「英語」を選び、コードを書き換えて登録する（英語のテンプレートだけが書き換わる）
      await pa.言語を選ぶ("英語");
      await pa.コードを入れる(v.英語コード);
      const r = await pa.登録して結果を読む();
      if (!r.成功) throw new Error(`${seedId}: 英語のコードを登録できない: ${r.入力エラー.join(" / ")}`);
    }
    return id;
  });
}

defineSeed("S-M09-04-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M09-04試験管理者", account: M0904_ADMIN, メール: "m0904_admin@example.test" });
});

defineSeed("S-M09-04-LAYOUT", { needs: ["S-M09-04-ADM"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, M0904_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔レイアウトID-M0904-共有A〕", await レイアウトを登録する(page, { 名称: 試験PCレイアウト(), 端末種別: "PC" }));
    notes.set("〔レイアウトID-M0904-共有B〕", await レイアウトを登録する(page, { 名称: 試験モバイルレイアウト(), 端末種別: "スマートフォン" }));
  });
  reportSeedIssue("S-M09-04-LAYOUT", "レイアウト名は決め打ちの識別の値なので実行の印を付けて登録した。シード表は端末種別「モバイル」と書くが、レイアウト管理の「モバイル」を選ぶとページ管理のモバイル欄の選択肢に出ない（モバイル欄に出るのは「スマートフォン」の端末種別のレイアウト）ので、前提（モバイル欄で選べる）を成り立たせるため「スマートフォン」で登録した（正本の外の補い）");
});

/** 画面から作るページのシード（番号ごと）。控えた番号の呼び名は 〔ページID-M0904-<番号>〕 */
const 通常: [string, string][] = [
  ...("002 005 008 009 013 014 015 016 017 018 019 021 023 029 036 037 038 039 040 041 043 046 052 053 060 061".split(" ").map((n) => [`PAGE-${n}`, n] as [string, string])),
  ["DELETE-048", "048"], ["DELETE-049", "049"], ["DELETE-050", "050"], ["DELETE-051", "051"],
  ["RENAME-042", "042"], ["LANG-059", "059"], ["LANG-062", "062"], ["DPEN-064", "064"], ["CBEDIT-068", "068"], ["CBRENAME-070", "070"],
];
for (const [key, n] of 通常) {
  const seedId = `S-M09-04-${key}`;
  defineSeed(seedId, { needs: ["S-M09-04-ADM"] }, async ({ browser, notes }) => {
    notes.set(`〔ページID-M0904-${n}〕`, await シードのページを作る(browser, seedId));
  });
}

/** 検索に当たる行が一覧に1件も無いこと（シード表の「確かめる」）。見えている行の数は、一覧を読み込んだあとで数える */
async function 一覧に無いことを確かめる(browser: import("@playwright/test").Browser, 語: string[]): Promise<void> {
  await withAdminSession(browser, M0904_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const pa = new ページ管理(page);
    await pa.一覧を開く();
    expect(await page.locator("table.table tr[id^='ex-page-']").count(), "ページ管理(一覧)にページが読み込まれている").toBeGreaterThan(0);
    for (const w of 語) {
      await pa.検索する(w);
      expect(await pa.見えている行.count(), `一覧に「${w}」を含む行が無い`).toBe(0);
    }
  });
}

defineSeed("S-M09-04-PAGE-006", { needs: ["S-M09-04-ADM"] }, async ({ browser, notes }) => {
  notes.set("〔ページID-M0904-006〕", await シードのページを作る(browser, "S-M09-04-PAGE-006"));
  await 一覧に無いことを確かめる(browser, ["MATCH-NONE-999"]);
});
defineSeed("S-M09-04-PAGE-010", { needs: ["S-M09-04-ADM"] }, async ({ browser, notes }) => {
  const id = await シードのページを作る(browser, "S-M09-04-PAGE-010");
  expect(Number(id), "控えたページIDが999999より小さい（999999は未登録）").toBeLessThan(999999);
  notes.set("〔ページID-M0904-010〕", id);
});

// 登録前状態（印つきの値のページが0件）
const 登録前: [string, string[]][] = [
  ["NEW-024", ["全項目登録ページ", "user_data/all_fields"]],
  ["NEW-025", ["日英生成ページ", "user_data/bilingual"]],
  ["NEW-026", ["任意項目空ページ", "user_data/optional_empty"]],
  ["NEW-058", ["登録後遷移ページ-M0904-058", "user_data/m0904-058-after"]],
  ["CBNEW-067", ["CB英語選択登録ページM0904CB067", "user_data/m0904cb067-new"]],
  ["NEW-035", ["URL重複新規ページ", "user_data/new_unique_file"]],
];
for (const [key, vals] of 登録前) {
  defineSeed(`S-M09-04-${key}`, { needs: ["S-M09-04-ADM"] }, async ({ browser }) => {
    await 一覧に無いことを確かめる(browser, vals.map(識別));
  });
}

// ---------- 画面で作ったページを DB で整えるシード（2026-11-10 依頼者の方針: 印つきの自分のデータに限り DB へ書いてよい） ----------
/**
 * 画面で作った（印つきの）ページを「開発者作成（編集可否区分=既定）」にする。開発者作成のページは画面で登録できないため。
 * 編集画面を開くページは、画面が「URL＝既存の画面のルート名」を前提にするので、ルート名へ読み替え、作成日時を1日前にする
 * （作成から2分以内は、テンプレートの同期待ちの案内になるため）。
 */
function 開発者作成にする(seedId: string, ページID: string, ルート名?: string): void {
  const n = writeTestData({
    理由: `${seedId}: 画面では開発者作成のページを登録できないため、この実行で作った印つきのページの編集可否区分を「既定」にする${ルート名 ? "（編集画面が要る画面のルート名へURLを置き換え、作成日時を1日前にする）" : ""}`,
    sql: ルート名
      ? "update dtb_page set edit_type = 2, url = $2, create_date = now() - interval '1 day' where id = $1"
      : "update dtb_page set edit_type = 2 where id = $1",
    params: ルート名 ? [ページID, ルート名] : [ページID],
    対象の確かめ: "select page_name, file_name from dtb_page where id = $1", 確かめのparams: [ページID], 印: RUN_MARK, 最大行数: 1,
  });
  reportSeedIssue(seedId, `開発者作成のページは画面で登録できないため、画面で登録した印つきのページ（ID ${ページID}）の編集可否区分を、DBで「既定（開発者作成）」に設定した（${n}行）。${ルート名 ? `編集画面は URL が既存の画面のルート名であることを前提とするので、URL をルート名「${ルート名}」に置き換え、日英テンプレートは置いていない（ファイル配置は行わない）。` : ""}ID はシード表の固定値（914xxx）でなく画面が振った値を控えた`);
}

const 開発者のルート名 = "admin_content_news";

for (const n of ["011", "012"]) {
  const seedId = `S-M09-04-DEV-${n}`;
  defineSeed(seedId, { needs: ["S-M09-04-ADM"] }, async ({ browser, notes }) => {
    const id = await シードのページを作る(browser, seedId);
    開発者作成にする(seedId, id, n === "011" ? 開発者のルート名 : undefined);
    notes.set(`〔ページID-M0904-${n}〕`, id);
  });
}

defineSeed("S-M09-04-DPMIX-063", { needs: ["S-M09-04-ADM"] }, async ({ browser, notes }) => {
  const seedId = "S-M09-04-DPMIX-063";
  const 開発者 = await withAdminSession(browser, M0904_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return new ページ管理(page).作る({ ページ名: 識別("標準ページ-M0904-063"), URL: 識別("m0904-063-dev"), ファイル名: 識別("M0904-063/dev"), 言語: "ja" });
  });
  const 利用者 = await withAdminSession(browser, M0904_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return new ページ管理(page).作る({ ページ名: 識別("利用者ページ-M0904-063"), URL: 識別("user_data/m0904-063-user"), ファイル名: 識別("user_data/m0904-063-user"), コード: "{% extends 'default_frame.twig' %}{% block main %}{% endblock %}", 言語: "ja" });
  });
  開発者作成にする(seedId, 開発者);
  notes.set("〔ページID-M0904-063開発者〕", 開発者);
  notes.set("〔ページID-M0904-063〕", 利用者);
});

defineSeed("S-M09-04-PAGE-003", { needs: ["S-M09-04-ADM"] }, async ({ browser, notes }) => {
  const id = await withAdminSession(browser, M0904_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return new ページ管理(page).作る({ ページ名: 識別("検索名称Alpha-M0904-003"), URL: 識別("route_only_beta-003"), ファイル名: 識別("user_data/file_only_delta-003"), 言語: "ja" });
  });
  notes.set("〔ページID-M0904-003〕", id);
  reportSeedIssue("S-M09-04-PAGE-003", "シード表は、ルーティング名に表示URL「/user_data/route_target-003」を対応付ける（画面登録のあとに試験用画面URL定義へ直接設定）とするが、画面の定義（ルートの定義）は書き換えない方針なので対応付けはしていない。一覧のルーティング名欄はURL欄の値の表示であり、この欄での検索を確かめる");
});

defineSeed("S-M09-04-PAGE-022", { needs: ["S-M09-04-ADM"] }, async ({ browser, notes }) => {
  const id = await シードのページを作る(browser, "S-M09-04-PAGE-022");
  const n = writeTestData({
    理由: "S-M09-04-PAGE-022: 最終更新日時は画面で指定できないため、この実行で作った印つきのページの最終更新日時を 2025/10/25 10:30（日本時間）にする",
    sql: "update dtb_page set update_date = timestamptz '2025-10-25 10:30:00+09' where id = $1",
    params: [id], 対象の確かめ: "select page_name from dtb_page where id = $1", 確かめのparams: [id], 印: RUN_MARK, 最大行数: 1,
  });
  notes.set("〔ページID-M0904-022〕", id);
  reportSeedIssue("S-M09-04-PAGE-022", `最終更新日時は画面で指定できないため、DBで、画面で作った印つきのページ（ID ${id}）の最終更新日時を 2025/10/25 10:30（日本時間）に設定した（${n}行）`);
});

defineSeed("S-M09-04-DUPLICATE", { needs: ["S-M09-04-ADM"] }, async ({ browser, notes }) => {
  const seedId = "S-M09-04-DUPLICATE";
  const 作る = (v: ページの値) => withAdminSession(browser, M0904_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return new ページ管理(page).作る({ ...v, 言語: "ja" });
  });
  const 利用者 = await 作る({ ページ名: 識別("利用者重複基準ページ"), URL: 識別("user_data/duplicate_url"), ファイル名: 識別("user_data/duplicate_user_file") });
  const 標準 = await 作る({ ページ名: 識別("標準重複基準ページ"), URL: 識別("system/duplicate_standard"), ファイル名: 識別("default/duplicate_standard_file") });
  開発者作成にする(seedId, 標準);
  notes.set("〔ページID-M0904-共有〕", 利用者);
  notes.set("〔ページID-M0904-共有標準〕", 標準);
  reportSeedIssue(seedId, "シード表の標準ページ（ID 40）は固定IDだが、画面が振ったIDの印つきのページで読み替えた（既存のページは使わない）");
});

defineSeed("S-M09-04-LIST-001", { needs: ["S-M09-04-ADM", "S-M09-04-LAYOUT"] }, async ({ browser, notes }) => {
  const seedId = "S-M09-04-LIST-001";
  const 作る = (v: ページの値) => withAdminSession(browser, M0904_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return new ページ管理(page).作る({ ...v, 言語: "ja" });
  });
  const 開発者 = await 作る({ ページ名: 識別("標準ページ-001"), URL: 識別("user_data/m0904-001-dev"), ファイル名: 識別("user_data/m0904-001-dev"), PC: 試験PCレイアウト() });
  const モバイル = await 作る({ ページ名: 識別("モバイル除外ページ-001"), URL: 識別("user_data/m0904-001-mobile"), ファイル名: 識別("user_data/m0904-001-mobile"), PC: null, モバイル: 試験モバイルレイアウト() });
  const PC = await 作る({ ページ名: 識別("検索名称Alpha-M0904-001"), URL: 識別("user_data/m0904-001-pc"), ファイル名: 識別("user_data/m0904-001-pc"), PC: 試験PCレイアウト() });
  開発者作成にする(seedId, 開発者);
  notes.set("〔ページID-M0904-001開発者〕", 開発者);
  notes.set("〔ページID-M0904-001モバイル〕", モバイル);
  notes.set("〔ページID-M0904-001PC〕", PC);
  reportSeedIssue(seedId, "シード表は「ページ情報をこの4件だけに置き換える」（既存のページ情報を置き換える）が、既存のページは書き換えない・消さない方針なので置き換えない。ID 914001・924001・934001は、画面が振ったIDの印つきのページ3件（PC・開発者作成／モバイル用レイアウトのみ・利用者作成／PC・利用者作成）で読み替えた。「ほかのページが無い」ことは作れないので確かめない。モバイルの端末種別は、モバイル欄で選べる端末種別のレイアウトを設定したページとした");
});
defineSeed("S-M09-04-ZERO", async () => {
  reportSeedIssue("S-M09-04-ZERO", "ID 0 のページは作らない（共有のデータ。ID 0 を DB へ書かない）。一覧に ID 0 の行が無いことを、画面の行で確かめる");
});

defineSeed("S-M09-04-MOBURL-057", { needs: ["S-M09-04-ADM", "S-M09-04-LAYOUT"] }, async ({ browser, notes }) => {
  const seedId = "S-M09-04-MOBURL-057";
  await 一覧に無いことを確かめる(browser, ["PC同URL新規ページ-M0904-057", "user_data/m0904-057-new-file"].map(識別));
  const id = await シードのページを作る(browser, seedId, { PC: null, モバイル: 試験モバイルレイアウト() });
  notes.set("〔ページID-M0904-057〕", id);
  reportSeedIssue(seedId, "端末種別「モバイル」は画面では指定できない（DBへ直接設定とシード表にある）が、このアプリのページは端末種別の項目を持たず、設定したレイアウトの端末種別で決まる。そこで、PC欄を空にしモバイル欄に試験用のレイアウト（モバイル欄で選べる端末種別）を選んで登録した（DBは書いていない）");
});

/** 初期データのTOPページ（ID 1）は書き換えない。いまの値が前提どおりかは、ケースの中で読んで確かめる（違えば止める） */
defineSeed("S-M09-04-DEFAULT-PAGE", async () => {
  reportSeedIssue("S-M09-04-DEFAULT-PAGE", "シード表は初期データのTOPページ（ID 1）を指定値へ戻す（DB）とするが、共有の初期データは書き換えない。ケースの中で、いまの値（URL=homepage・twigファイル=index・編集可否区分=既定）を読んで確かめ、違えば止める");
});
