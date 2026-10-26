/** M03-41 カテゴリCSV登録。正本: cases/M03-41_test_cases.tsv */
import { Page, test } from "@playwright/test";
import { expect, CaseBody, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import {
  カテゴリの保存内容, 名称か英名が一致するカテゴリ, 名称のカテゴリ, 親の下の名称のカテゴリ,
} from "../../db/m03_41_category";
import { CategoryCsvUploadPage, describeUpload, UploadResult } from "../../pages/admin/m03_41_category_csv";
import { caseCsvFile, deleteFlagFileUnverifiable, M0341_ADMIN, M0341_VALUES } from "../../seeds/m03-41";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const show = (r: カテゴリの保存内容 | null) => (r ? JSON.stringify(r) : "行なし（削除済み）");
const showAll = (rows: カテゴリの保存内容[]) => (rows.length ? rows.map((r) => show(r)).join(" / ") : "0件");

/** 正本の「新しいブラウザセッションで管理者としてログインしている」 */
async function signIn(page: Page): Promise<CategoryCsvUploadPage> {
  await loginAdmin(page, M0341_ADMIN);
  return new CategoryCsvUploadPage(page);
}

/** 正本のファイルを選んで「CSVファイルのアップロード」を押す。ファイルの中身と結果を報告に載せる */
async function uploadCase(csv: CategoryCsvUploadPage, name: string): Promise<UploadResult> {
  const file = caseCsvFile(name);
  await test.info().attach(`アップロードしたファイル ${name}`, { body: file.bytes, contentType: "text/csv" });
  note(`${name}（${file.文字コード}・改行${file.改行}）の内容: ${JSON.stringify(file.内容)}`);
  const r = await csv.upload(file);
  note(`${name} のアップロードの結果: ${describeUpload(r)}`);
  return r;
}

/** 正本の「…を1ファイルずつ選択してCSVファイルのアップロードボタンを押す」。前のファイルのあとで登録画面に居なければ開き直す（注記を残す） */
async function uploadEach(csv: CategoryCsvUploadPage, names: string[]): Promise<Record<string, UploadResult>> {
  const out: Record<string, UploadResult> = {};
  for (const name of names) {
    if (!(await csv.isOnScreen())) {
      note(`${name} の前に、表示中の画面がカテゴリCSV登録画面ではなかったので開き直した（${csv.page.url()}）`);
      await csv.open();
    }
    out[name] = await uploadCase(csv, name);
  }
  return out;
}

/**
 * 拒まれるはずのファイルのアップロードが、操作として効いたことを確かめる（DBが変わらないことだけでは、送信されなかったときや
 * サーバーがエラーを返したときも合格になってしまうため）。送信され、取込の要求が応答302で戻り、取込のエラーが1件以上出たこと。
 */
function expectUploadRejected(name: string, r: UploadResult | undefined): void {
  expect.soft(r?.送信した, `${name}: アップロードが送信された（${r ? describeUpload(r) : "結果なし"}）`).toBe(true);
  expect.soft(r?.応答, `${name}: 取込の要求の応答が302（カテゴリCSV登録画面へ戻す）`).toBe(302);
  const errors = r ? [...r.上部のエラー, ...r.フォーム下のエラー, ...r.入力項目直下のエラー] : [];
  expect.soft(errors.length, `${name}: 取込のエラーが1件以上出た（表示の場所は問わない。出た文: ${errors.join(" / ") || "なし"}）`).toBeGreaterThan(0);
}

/** 正本の「DBでカテゴリIDを確認する」 */
function readCategory(id: string): カテゴリの保存内容 | null {
  const r = カテゴリの保存内容(id);
  note(`DBのカテゴリID ${id}: ${show(r)}`);
  return r;
}

/** 正本の「DBで各ファイルのカテゴリ名を確認する」（カテゴリ名(日)・カテゴリ名(英)のどちらかが一致する行） */
function readByNames(names: string[]): Record<string, カテゴリの保存内容[]> {
  const out: Record<string, カテゴリの保存内容[]> = {};
  for (const n of names) {
    out[n] = 名称か英名が一致するカテゴリ(n);
    note(`DBのカテゴリ名「${n.length > 40 ? `${n.slice(0, 3)}…（${n.length}文字）` : n}」: ${showAll(out[n])}`);
  }
  return out;
}

/**
 * ファイルをアップロードし、DBで名前を確かめて、どの名前のカテゴリも追加されていないことを確かめる
 * （手順: 1 画面を開く／2 ファイルをアップロード／3 DBで確認する）。各ファイルのアップロードが効いたこと（送信・応答302・取込のエラー）も確かめる。
 */
function notAdded(files: string[], names: string[]): CaseBody {
  return async ({ page, step, expected }) => {
    const csv = await signIn(page);
    let found: Record<string, カテゴリの保存内容[]> = {};
    let uploads: Record<string, UploadResult> = {};
    await step(1, () => csv.open());
    await step(2, async () => { uploads = await uploadEach(csv, files); });
    await step(3, async () => { found = readByNames(names); });
    await expected(async () => {
      for (const f of files) expectUploadRejected(f, uploads[f]);
      for (const n of names) {
        const shown = n.length > 40 ? `${n.slice(0, 3)}…（${n.length}文字）` : n;
        expect.soft(found[n].map((r) => show(r)), `カテゴリ名「${shown}」のカテゴリは追加されない`).toEqual([]);
      }
    });
  };
}

type 比べる項目 = "名称" | "表示順" | "親カテゴリID" | "階層";
/** 確かめる値。値が〔…〕の呼び名なら、控えた番号に置き換えて比べる */
type 値の確かめ = { 項目: 比べる項目; 値: string; 文: string };

/**
 * 登録済みのカテゴリを更新しようとするファイルをアップロードし、DBでそのカテゴリを確かめる
 * （手順: 1 画面を開く／2 ファイルをアップロード／3 DBで確認する）。
 * 開始時の値をDBで控えておき、期待結果で次を確かめる。
 * - そのカテゴリの行が残っている（削除済みにならない。カテゴリの表に削除済みの印の列は無いので、行が残ることで見る）
 * - 開始時: シードが作った値（前提の確かめ）
 * - 変わらない: 全項目と更新日時が開始時と同じ（登録内容が更新されない）
 * - 値: 終わったあとの項目の値
 * どのファイルも拒まれるはずのものなので、各ファイルのアップロードが効いたこと（送信・応答302・取込のエラー）も確かめる。
 */
function checkAfterUpload(label: string, files: string[],
  what: { 開始時?: 値の確かめ[]; 変わらない?: string; 値?: 値の確かめ[] }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const csv = await signIn(page);
    const id = notes.get(label);
    const resolve = (v: string) => (/^〔[^〕]+〕$/.test(v) ? notes.get(v) : v);
    const before = カテゴリの保存内容(id);
    note(`開始時のDBのカテゴリID ${id}: ${show(before)}`);
    let after: カテゴリの保存内容 | null = null;
    let uploads: Record<string, UploadResult> = {};
    await step(1, () => csv.open());
    await step(2, async () => { uploads = await uploadEach(csv, files); });
    await step(3, async () => { after = readCategory(id); });
    await expected(async () => {
      for (const f of files) expectUploadRejected(f, uploads[f]);
      for (const c of what.開始時 ?? []) expect.soft(before?.[c.項目], c.文).toBe(resolve(c.値));
      expect(after ? "行がある" : "行なし（削除済み）", `カテゴリID ${id} が削除済みにならない（行が残る）`).toBe("行がある");
      if (what.変わらない) expect.soft(after, what.変わらない).toEqual(before);
      for (const c of what.値 ?? []) expect.soft(after?.[c.項目], c.文).toBe(resolve(c.値));
    });
  };
}

// ---- 新規登録・更新 ----

caseTest("IT-M03-41-002", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const p = notes.get("〔カテゴリID-M0341-002〕");
  let parent: カテゴリの保存内容 | null = null;
  let rows: カテゴリの保存内容[] = [];
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "child_new-002.csv"); });
  await step(3, async () => {
    parent = readCategory(p);
    rows = 親の下の名称のカテゴリ(p, "CSV子カテゴリ-002");
    note(`DBの親カテゴリID ${p} の下の「CSV子カテゴリ-002」: ${showAll(rows)}`);
  });
  await expected(async () => {
    expect.soft(parent?.階層, `親カテゴリID ${p} の階層`).toBe("1");
    expect(rows.length, `親カテゴリID ${p} の下の「CSV子カテゴリ-002」の件数`).toBe(1);
    expect.soft(rows[0].階層, "「CSV子カテゴリ-002」の階層（親の階層1に1を足した2。CSVの99ではない）").toBe("2");
  });
});

caseTest("IT-M03-41-003", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  let rows: カテゴリの保存内容[] = [];
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "optional_empty-003.csv"); });
  await step(3, async () => { rows = readByNames(["任意空カテゴリ-003"])["任意空カテゴリ-003"]; });
  await expected(async () => {
    expect(rows.length, "「任意空カテゴリ-003」の件数").toBe(1);
    expect.soft(rows[0].検索パラメータ ?? "", "検索パラメータは空").toBe("");
    expect.soft(rows[0].バナー画像パス ?? "", "最新セット用バナー画像パスは空").toBe("");
    expect.soft(rows[0].アイコン画像パス ?? "", "カテゴリアイコン画像パスは空").toBe("");
  });
});

caseTest("IT-M03-41-005", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const a = notes.get("〔カテゴリID-M0341-005A〕");
  const b = notes.get("〔カテゴリID-M0341-005B〕");
  const before = カテゴリの保存内容(b);
  note(`開始時のDBのカテゴリID ${b}: ${show(before)}`);
  const added: Record<string, カテゴリの保存内容[]> = {};
  let updated: カテゴリの保存内容 | null = null;
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "multi_success-005.csv"); });
  await step(3, async () => {
    for (const n of M0341_VALUES.新規005) {
      added[n] = 親の下の名称のカテゴリ(a, n);
      note(`DBの親カテゴリID ${a} の下の「${n}」: ${showAll(added[n])}`);
    }
    updated = readCategory(b);
  });
  await expected(async () => {
    for (const n of M0341_VALUES.新規005) expect.soft(added[n].length, `CSVの新規カテゴリ「${n}」の件数`).toBe(1);
    expect.soft(updated?.名称, `カテゴリID ${b} のカテゴリ名(日)がCSVの値に更新される`).toBe(M0341_VALUES.更新後005);
    expect.soft(updated?.更新日時, `カテゴリID ${b} の更新日時が変わる`).not.toBe(before?.更新日時);
  });
});

caseTest("IT-M03-41-006", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  let r: UploadResult | null = null;
  await step(1, () => csv.open());
  await step(2, async () => { r = await uploadCase(csv, "root_new-006.csv"); });
  await expected(async () => {
    expect.soft(r?.送信した, "アップロードが送信された").toBe(true);
    expect.soft(r?.上部の成功.length ?? 0, "登録完了のメッセージ").toBeGreaterThan(0);
    expect.soft(r?.上部のエラー ?? [], "エラーは出ない").toEqual([]);
    expect.soft(await csv.isOnScreen(), `カテゴリCSV登録画面に留まる（表示中の画面 ${page.url()}）`).toBe(true);
  });
});

// ---- 行ごとの検証 ----

caseTest("IT-M03-41-012", notAdded(
  ["jp_blank-012.csv", "en_blank-012.csv", "parent_blank-012.csv", "front_flag_blank-012.csv", "branch_flag_blank-012.csv"],
  ["必須日名空カテゴリ-012", "必須英名空カテゴリ-012", "必須親空カテゴリ-012", "必須フロント空カテゴリ-012", "必須支店空カテゴリ-012"],
));

caseTest("IT-M03-41-013", checkAfterUpload("〔カテゴリID-M0341-013B〕", ["update_rank_blank-013.csv"], {
  開始時: [{ 項目: "表示順", 値: "2", 文: "開始時の表示ランク（シード）" }],
  値: [{ 項目: "表示順", 値: "2", 文: "表示ランクが2のまま更新されない" }],
}));

caseTest("IT-M03-41-014", checkAfterUpload("〔カテゴリID-M0341-014B〕", ["category_id_text-014.csv"], {
  開始時: [{ 項目: "名称", 値: "更新前カテゴリ-014", 文: "開始時のカテゴリ名(日)（シード）" }],
  値: [{ 項目: "名称", 値: "更新前カテゴリ-014", 文: "カテゴリ名(日)が「更新前カテゴリ-014」のまま更新されない" }],
}));

caseTest("IT-M03-41-015", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  let row: カテゴリの保存内容 | null = null;
  let r: UploadResult | undefined;
  await step(1, () => csv.open());
  await step(2, async () => { r = await uploadCase(csv, "category_id_missing-015.csv"); });
  await step(3, async () => { row = readCategory("341999015"); });
  await expected(async () => {
    expectUploadRejected("category_id_missing-015.csv", r);
    expect(row ? show(row) : null, "カテゴリID 341999015 のカテゴリは追加されない").toBeNull();
  });
});

caseTest("IT-M03-41-016", checkAfterUpload("〔カテゴリID-M0341-016B〕", ["self_parent-016.csv"], {
  開始時: [{ 項目: "親カテゴリID", 値: "〔カテゴリID-M0341-016A〕", 文: "開始時の親カテゴリID（シード）" }],
  値: [{ 項目: "親カテゴリID", 値: "〔カテゴリID-M0341-016A〕", 文: "親カテゴリIDが 016A のまま更新されない" }],
}));

caseTest("IT-M03-41-017", notAdded(["parent_id_text-017.csv"], ["親ID文字カテゴリ"]));

caseTest("IT-M03-41-018", notAdded(["parent_id_missing-018.csv"], ["親ID不存在カテゴリ"]));

caseTest("IT-M03-41-019", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const e = notes.get("〔カテゴリID-M0341-019E〕");
  const parent = カテゴリの保存内容(e);
  note(`開始時のDBのカテゴリID ${e}（019E）: ${show(parent)}`);
  let rows: カテゴリの保存内容[] = [];
  let r: UploadResult | undefined;
  await step(1, () => csv.open());
  await step(2, async () => { r = await uploadCase(csv, "depth_over-019.csv"); });
  await step(3, async () => { rows = readByNames(["第6階層カテゴリ"])["第6階層カテゴリ"]; });
  await expected(async () => {
    expectUploadRejected("depth_over-019.csv", r);
    expect.soft(parent?.階層, "親に指定した 019E の階層（シード）").toBe("5");
    expect(rows.map((r) => show(r)), "「第6階層カテゴリ」は追加されない").toEqual([]);
  });
});

// 雛形の見出しに削除フラグの列が無いあいだは、シード（S-M03-41-CASE-020）がデータを作らずに合否未判定（スキップ）で止める（記録の裁定案1）
caseTest("IT-M03-41-020", checkAfterUpload("〔カテゴリID-M0341-020〕", ["delete_flag_invalid-020.csv"], {
  変わらない: "登録内容が更新されない（全項目と更新日時が開始時と同じ）",
}));

caseTest("IT-M03-41-021", notAdded(
  ["front_flag_invalid-021.csv", "branch_flag_invalid-021.csv"], ["フロントフラグ異常カテゴリ-021", "支店フラグ異常カテゴリ-021"],
));

caseTest("IT-M03-41-022", checkAfterUpload("〔カテゴリID-M0341-022B〕", ["display_rank_text-022.csv"], {
  開始時: [{ 項目: "表示順", 値: "2", 文: "開始時の表示ランク（シード）" }],
  値: [{ 項目: "表示順", 値: "2", 文: "表示ランクが2のまま更新されない" }],
}));

caseTest("IT-M03-41-023", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  const v = M0341_VALUES;
  let rows: カテゴリの保存内容[] = [];
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "text_max-023.csv"); });
  await step(3, async () => {
    note("正本の名前「文字列上限カテゴリ」はシード表に無いので、カテゴリ名(日)が「あ」128文字の行で確かめた（裁定案7）");
    rows = readByNames([v.名称128])[v.名称128];
  });
  await expected(async () => {
    expect(rows.length, "カテゴリ名(日)が「あ」128文字のカテゴリの件数").toBe(1);
    expect.soft(rows[0].名称, "カテゴリ名(日)128文字が欠落なく保存される").toBe(v.名称128);
    expect.soft(rows[0].英名, "カテゴリ名(英)128文字が欠落なく保存される").toBe(v.英名128);
    expect.soft(rows[0].検索パラメータ, "検索パラメータ128文字が欠落なく保存される").toBe(v.検索128);
  });
});

caseTest("IT-M03-41-024", notAdded(
  ["jp_129-024.csv", "en_129-024.csv", "search_129-024.csv"],
  ["日名129カテゴリ-024", "英名129カテゴリ-024", "検索129カテゴリ-024", M0341_VALUES.名称129, M0341_VALUES.英名129],
));

caseTest("IT-M03-41-025", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  const v = M0341_VALUES;
  let rows: カテゴリの保存内容[] = [];
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "image_path_max-025.csv"); });
  await step(3, async () => { rows = readByNames(["画像パス上限カテゴリ"])["画像パス上限カテゴリ"]; });
  await expected(async () => {
    expect(rows.length, "「画像パス上限カテゴリ」の件数").toBe(1);
    expect.soft(rows[0].バナー画像パス, "最新セット用バナー画像パス255文字が欠落なく保存される").toBe(v.バナー255);
    expect.soft(rows[0].アイコン画像パス, "カテゴリアイコン画像パス255文字が欠落なく保存される").toBe(v.アイコン255);
  });
});

caseTest("IT-M03-41-026", notAdded(
  ["banner_path_256-026.csv", "icon_path_256-026.csv"], ["バナー画像パス256カテゴリ-026", "アイコン画像パス256カテゴリ-026"],
));

caseTest("IT-M03-41-027", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const a = notes.get("〔カテゴリID-M0341-027A〕");
  const b = notes.get("〔カテゴリID-M0341-027B〕");
  let r: UploadResult | null = null;
  let after: カテゴリの保存内容 | null = null;
  await step(1, () => csv.open());
  await step(2, async () => { r = await uploadCase(csv, "numeric_11-027.csv"); });
  await step(3, async () => { after = readCategory(b); });
  await expected(async () => {
    expect.soft(r?.送信した, "アップロードが送信された").toBe(true);
    const errors = r ? [...r.上部のエラー, ...r.フォーム下のエラー, ...r.入力項目直下のエラー] : [];
    expect.soft(errors, "11桁表記の値が受理される（エラーが出ない。表示の場所は問わない）").toEqual([]);
    expect.soft(after?.表示順, "表示ランクが8で保存される").toBe("8");
    expect.soft(after?.親カテゴリID, "親カテゴリIDが 027A で保存される").toBe(a);
  });
});

caseTest("IT-M03-41-028", checkAfterUpload("〔カテゴリID-M0341-028B〕",
  ["category_id_12-028.csv", "display_rank_12-028.csv", "parent_id_12-028.csv"], {
    開始時: [{ 項目: "表示順", 値: "2", 文: "開始時の表示ランク（シード）" }],
    変わらない: "3ファイルによって更新されない（全項目と更新日時が開始時と同じ）",
  }));

caseTest("IT-M03-41-029", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  let rows: カテゴリの保存内容[] = [];
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "trim_names-029.csv"); });
  await step(3, async () => { rows = readByNames(["前後空白カテゴリ-029"])["前後空白カテゴリ-029"]; });
  await expected(async () => {
    expect(rows.length, "カテゴリ名(日)が「前後空白カテゴリ-029」（前後の空白なし）のカテゴリの件数").toBe(1);
    expect.soft(rows[0].名称, "カテゴリ名(日)").toBe("前後空白カテゴリ-029");
    expect.soft(rows[0].英名, "カテゴリ名(英)が前後の空白を除いて保存される").toBe("Trimmed Category-029");
  });
});

// ---- 削除の指定 ----
// 030・031・033・034・053 は、雛形の見出しに削除フラグの列が無いあいだは、シードがデータを作らずに合否未判定（スキップ）で止める
// （020 と同じ。記録の裁定案1）

caseTest("IT-M03-41-030", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const a = notes.get("〔カテゴリID-M0341-030A〕");
  const b = notes.get("〔カテゴリID-M0341-030B〕");
  const beforeA = カテゴリの保存内容(a);
  const beforeB = カテゴリの保存内容(b);
  note(`開始時のDB: 030A ${show(beforeA)}／030B ${show(beforeB)}`);
  let afterA: カテゴリの保存内容 | null = null;
  let afterB: カテゴリの保存内容 | null = null;
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "delete_unused-030.csv"); });
  await step(3, async () => { afterA = readCategory(a); afterB = readCategory(b); });
  await expected(async () => {
    expect.soft(beforeA?.表示順, "開始時の 030A の表示順（シード）").toBe("3");
    expect.soft(beforeB?.表示順, "開始時の 030B の表示順（シード）").toBe("4");
    expect.soft(afterB?.親カテゴリID, "030B は 030A と同じ親").toBe(beforeA?.親カテゴリID);
    // カテゴリの表に削除済みの印の列は無いので、行が無いことを削除済みとみなす（db/m03_41_category.ts）
    expect.soft(afterA ? show(afterA) : null, "030A が削除済みになる").toBeNull();
    expect.soft(afterB?.表示順, "後続の 030B の表示順が4から3へ1つ繰り上がる").toBe("3");
  });
});

caseTest("IT-M03-41-031", checkAfterUpload("〔カテゴリID-M0341-031A〕", ["delete_with_child-031.csv"], {}));

caseTest("IT-M03-41-033", checkAfterUpload("〔カテゴリID-M0341-033〕", ["delete_name_blank-033.csv"], {}));

caseTest("IT-M03-41-034", checkAfterUpload("〔カテゴリID-M0341-034〕", ["delete_parent_missing-034.csv"], {}));

// ---- 取込の確定・ファイルの形式 ----

caseTest("IT-M03-41-035", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  let r: UploadResult | null = null;
  let rows: カテゴリの保存内容[] = [];
  await step(1, () => csv.open());
  await step(2, async () => { r = await uploadCase(csv, "rollback-035.csv"); });
  await step(3, async () => { rows = readByNames(["ロールバック先行カテゴリ-035"])["ロールバック先行カテゴリ-035"]; });
  await expected(async () => {
    // 2行目のデータ行は、見出し行を1行目として数えたファイル上の3行目（設計書 行ごとの判定順序）
    const errors = [...(r?.上部のエラー ?? []), ...(r?.フォーム下のエラー ?? []), ...(r?.入力項目直下のエラー ?? [])];
    expect.soft(errors, "取込が2行目のデータ行（ファイル上の3行目）でエラーになる")
      .toEqual(expect.arrayContaining([expect.stringMatching(/(^|[^0-9])3\s*行目/)]));
    expect.soft(rows.map((x) => show(x)), "1行目の「ロールバック先行カテゴリ-035」もDBに追加されない").toEqual([]);
  });
});

caseTest("IT-M03-41-036", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  let r: UploadResult | null = null;
  let below: string[] = [];
  let top: string[] = [];
  await step(1, () => csv.open());
  await step(2, async () => { r = await uploadCase(csv, "rollback-036.csv"); });
  await step(3, async () => {
    const m = await csv.messages();
    below = m.フォーム下のエラー;
    top = m.上部のエラー;
    note(`アップロードフォーム下のエラー一覧: ${below.join(" / ") || "なし"}（画面上部のエラー: ${top.join(" / ") || "なし"}）`);
  });
  await expected(async () => {
    expect.soft(r?.送信した, "アップロードが送信された").toBe(true);
    expect(below, `アップロードフォーム下のエラー一覧に、見出し行を含めたファイル上の3行目としてエラーが示される（画面上部のエラー: ${top.join(" / ") || "なし"}）`)
      .toEqual(expect.arrayContaining([expect.stringMatching(/(^|[^0-9])3\s*行目/)]));
  });
});

caseTest("IT-M03-41-037", notAdded(["no_header-037.csv"], ["見出しなしカテゴリ-037"]));

caseTest("IT-M03-41-038", notAdded(["required_header_missing-038.csv"], ["必須見出し欠落カテゴリ"]));

caseTest("IT-M03-41-040", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  const v = M0341_VALUES.列順040;
  let rows: カテゴリの保存内容[] = [];
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "reordered_columns-040.csv"); });
  await step(3, async () => { rows = readByNames([v["カテゴリ名(日)"]])[v["カテゴリ名(日)"]]; });
  await expected(async () => {
    expect(rows.length, "「列順変更カテゴリ-040」の件数").toBe(1);
    const r = rows[0];
    expect.soft(r.英名, "カテゴリ名(英)").toBe(v["カテゴリ名(英)"]);
    expect.soft(r.親カテゴリID, "親カテゴリID 0（最上位。親なし）").toBeNull();
    expect.soft(r.階層, "階層（最上位）").toBe("1");
    expect.soft(r.フロント非表示, "フロント非表示フラグ1").toBe("true");
    expect.soft(r.支店非表示, "支店非表示フラグ0").toBe("false");
    expect.soft(r.検索パラメータ, "検索パラメータ").toBe(v["検索パラメータ"]);
    expect.soft(r.バナー画像パス, "最新セット用バナー画像パス").toBe(v["最新セット用バナー画像パス"]);
    expect.soft(r.アイコン画像パス, "カテゴリアイコン画像パス").toBe(v["カテゴリアイコン画像パス"]);
  });
});

caseTest("IT-M03-41-041", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  let rows: カテゴリの保存内容[] = [];
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "sjis_crlf_quoted-041.csv"); });
  await step(3, async () => { rows = readByNames(["CSV,正規化-041"])["CSV,正規化-041"]; });
  await expected(async () => {
    expect(rows.length, "カテゴリ名(日)が「CSV,正規化-041」のカテゴリの件数").toBe(1);
    expect.soft(rows[0].名称, "カテゴリ名(日)が欠落なく保存される").toBe("CSV,正規化-041");
  });
});

caseTest("IT-M03-41-042", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  const names = [
    "no_header-042.csv", "header_only-042.csv", "category_id_text-042.csv", "category_id_missing-042.csv", "self_parent-042.csv",
    "parent_id_missing-042.csv", "depth_over-042.csv", "delete_with_child-042.csv", "delete_name_blank-042.csv",
  ];
  const results: { name: string; r: UploadResult; stayed: boolean }[] = [];
  await step(1, () => csv.open());
  await step(2, async () => {
    for (const name of names) {
      if (!(await csv.isOnScreen())) {
        note(`${name} の前に、表示中の画面がカテゴリCSV登録画面ではなかったので開き直した（${page.url()}）`);
        await csv.open();
      }
      const r = await uploadCase(csv, name);
      results.push({ name, r, stayed: await csv.isOnScreen() });
    }
  });
  await expected(async () => {
    for (const { name, r, stayed } of results) {
      // 留まることは、送信した結果として画面が返されたことで見る（ブラウザの入力チェックが止めたときは、押す前の画面が残っているだけ。043 と同じ）
      expect.soft(r.送信した, `${name}: アップロードが送信された（${describeUpload(r)}）`).toBe(true);
      const errors = [...r.上部のエラー, ...r.フォーム下のエラー, ...r.入力項目直下のエラー, ...r.止めた項目];
      expect.soft(errors.length, `${name}: エラーになる`).toBeGreaterThan(0);
      expect.soft(stayed, `${name}: エラーのあとカテゴリCSV登録画面に留まる（表示中の画面 ${r.移った画面}）`).toBe(true);
    }
  });
  // 雛形の見出しに削除フラグの列が無いあいだは、シード（S-M03-41-CASE-042）がデータを作らずに合否未判定（スキップ）で止めるので、ここまで来ない。
  // 次は、シードが止めなかったときの備え。削除フラグの値を書いた2ファイルは、雛形の見出しに削除フラグの列が無いと、取込が列の数の違いで止まる。
  // ファイル名の条件（子カテゴリがある・名称が空）のエラーを確かめられないので、ほかの7ファイルが期待どおりでも合格に数えない（記録の裁定案1）
  const unverifiable = names.filter(deleteFlagFileUnverifiable);
  if (unverifiable.length) {
    const reason = `合否未判定（正本の前提を作れない。記録の裁定案1の判断待ち）。${unverifiable.join("・")} は削除フラグの列を足したファイルだが、` +
      "カテゴリCSV登録画面の雛形の見出しに削除フラグの列が無く、取込が列の数の違いで値を見ずにファイル全体を止めるので、" +
      "ファイル名の条件（子カテゴリがある・名称が空）のエラーのあとに留まることを確かめられない。ほかのファイルの結果は報告の期待結果の確かめのとおり";
    note(reason);
    if (test.info().errors.length === 0) test.skip(true, reason);
  }
});

caseTest("IT-M03-41-043", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  let r!: UploadResult;
  await step(1, () => csv.open());
  await step(2, async () => {
    await expect(csv.ファイル, "ファイルが選択されていない").toHaveValue("");
    r = await csv.pressUpload();
    note(`ファイルを選択せずに押した結果: ${describeUpload(r)}`);
  });
  await expected(async () => {
    // 出典の表示メッセージ M03-41-MSG-011 は、ファイルを選ばずに登録したときにサーバーが返すエラー（表示位置は入力項目直下）で、
    // 後続処理が「カテゴリCSV登録画面に留まる」。期待結果は、送信した結果として画面が返されることを見るものなので、
    // ブラウザの入力チェックが送信を止めたときは、ボタンを押す前の画面が残っているだけで合格にしない（M03-21 の012 と同じ形）
    expect(r.送信した
      ? "アップロードの要求が送られ、画面が返された"
      : `ブラウザの入力チェックで送信が止まり、アップロードの要求が送られていない（${r.止めた項目.join(" / ") || "止めた項目なし"}）`,
    "CSVファイルのアップロードボタンを押したあとのカテゴリCSV登録画面").toBe("アップロードの要求が送られ、画面が返された");
    expect.soft(await csv.isOnScreen(), `カテゴリCSV登録画面に留まる（表示中の画面 ${page.url()}）`).toBe(true);
  });
});

// ---- 階層の計算と判定 ----

caseTest("IT-M03-41-051", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const b = notes.get("〔カテゴリID-M0341-051B〕");
  const c = notes.get("〔カテゴリID-M0341-051C〕");
  const parent = カテゴリの保存内容(b);
  note(`開始時のDBのカテゴリID ${b}（051B）: ${show(parent)}`);
  let after: カテゴリの保存内容 | null = null;
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "update_parent-051.csv"); });
  await step(3, async () => { after = readCategory(c); });
  await expected(async () => {
    expect.soft(parent?.階層, "親に指定した 051B の階層（シード）").toBe("2");
    expect.soft(after?.親カテゴリID, "親カテゴリIDが 051B になる").toBe(b);
    expect.soft(after?.階層, "階層は親の階層2に1を足した3（CSVの99ではない）").toBe("3");
  });
});

caseTest("IT-M03-41-052", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const d = notes.get("〔カテゴリID-M0341-052D〕");
  const parent = カテゴリの保存内容(d);
  note(`開始時のDBのカテゴリID ${d}（052D）: ${show(parent)}`);
  let all: カテゴリの保存内容[] = [];
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "depth_five-052.csv"); });
  await step(3, async () => {
    all = 名称のカテゴリ("第5階層カテゴリ-052");
    note(`DBのカテゴリ名「第5階層カテゴリ-052」: ${showAll(all)}`);
  });
  await expected(async () => {
    expect.soft(parent?.階層, "親に指定した 052D の階層（シード）").toBe("4");
    expect(all.length, "「第5階層カテゴリ-052」が1件追加される").toBe(1);
    expect.soft(all[0].親カテゴリID, "親カテゴリIDは 052D").toBe(d);
    expect.soft(all[0].階層, "階層5").toBe("5");
  });
});

caseTest("IT-M03-41-053", checkAfterUpload("〔カテゴリID-M0341-053F〕", ["delete_depth_over-053.csv"], {
  開始時: [
    { 項目: "親カテゴリID", 値: "〔カテゴリID-M0341-053B〕", 文: "開始時の 053F の親（シード）" },
    { 項目: "階層", 値: "3", 文: "開始時の 053F の階層（シード）" },
  ],
  値: [
    { 項目: "親カテゴリID", 値: "〔カテゴリID-M0341-053B〕", 文: "親カテゴリIDが 053B のまま変わらない" },
    { 項目: "階層", 値: "3", 文: "階層が3のまま変わらない" },
  ],
}));

caseTest("IT-M03-41-054", async ({ page, step, expected }) => {
  const csv = await signIn(page);
  let r: UploadResult | null = null;
  let below: string[] = [];
  let stayed = false;
  let rows: カテゴリの保存内容[] = [];
  await step(1, () => csv.open());
  await step(2, async () => { r = await uploadCase(csv, "parent_blank_depth3-054.csv"); });
  await step(3, async () => {
    const m = await csv.messages();
    below = m.フォーム下のエラー;
    stayed = await csv.isOnScreen();
    note(`アップロードフォーム下のエラー一覧: ${below.join(" / ") || "なし"}（画面上部のエラー: ${m.上部のエラー.join(" / ") || "なし"}）。表示中の画面 ${page.url()}`);
  });
  await step(4, async () => { rows = readByNames(["親未指定階層3カテゴリ-054"])["親未指定階層3カテゴリ-054"]; });
  await expected(async () => {
    expect.soft(r?.送信した, "アップロードが送信された").toBe(true);
    expect.soft(below, "アップロードフォーム下のエラー一覧に「行目の親カテゴリIDが存在しません。」が表示される")
      .toEqual(expect.arrayContaining([expect.stringContaining("行目の親カテゴリIDが存在しません。")]));
    expect.soft(stayed, "カテゴリCSV登録画面に留まる").toBe(true);
    expect.soft(rows.map((x) => show(x)), "「親未指定階層3カテゴリ-054」は追加されない").toEqual([]);
  });
});
