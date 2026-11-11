/** M16-04 MTGマスターデータ編集。正本: cases/M16-04_test_cases.tsv */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { MasterEntryLinks, MtgMasterEditPage,マスターデータ管理の選択肢 } from "../../pages/admin/m16_04_master";
import { M1604_ADMIN } from "../../seeds/m16-04";

caseTest("IT-M16-04-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  await expected(async () => {
    expect.soft(await m.選ばれている表示名(), "MTGマスターデータ選択の初期値").toBe("カードタイプ");
  });
});

caseTest("IT-M16-04-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  await step(2, async () => { await expect(m.選択欄).toBeVisible(); });
  await expected(async () => {
    expect.soft(await m.一覧の領域.count(), "一覧の領域の数").toBe(0);
    expect.soft(await m.登録ボタン.count(), "登録ボタンの数").toBe(0);
  });
});

caseTest("IT-M16-04-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  await step(2, async () => { await m.送信値を書き換える("invalid-master"); });
  await step(3, async () => { await m.選択を押す(); });
  await expected(async () => {
    expect.soft(await m.一覧の領域.count(), "一覧の領域の数").toBe(0);
    expect.soft(await m.登録ボタン.count(), "登録ボタンの数").toBe(0);
  });
});

caseTest("IT-M16-04-010", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  let 選択肢: string[] = [];
  await step(2, async () => { 選択肢 = await m.選択肢の表示名(); });
  await expected(async () => {
    expect.soft(選択肢.length, "選択肢の数（確かめる前に選択肢が出ている）").toBeGreaterThan(0);
    expect.soft(選択肢.includes("店舗"), "「店舗」が選択肢に含まれる").toBe(false);
    expect.soft(選択肢.includes("場所"), "「場所」が選択肢に含まれる").toBe(false);
  });
});

caseTest("IT-M16-04-011", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  let 編集側: string[] = [], 管理側: string[] = [];
  await step(1, async () => { await m.open(); 編集側 = await m.選択肢の表示名(); });
  await step(2, async () => { 管理側 = await マスターデータ管理の選択肢(page); });
  await expected(async () => {
    expect.soft(編集側.includes("お問い合わせ件名"), "MTGマスターデータ編集画面の選択肢に「お問い合わせ件名」がある").toBe(true);
    expect.soft(管理側.length, "マスターデータ管理画面の選択肢の数（確かめる前に選択肢が出ている）").toBeGreaterThan(0);
    expect.soft(管理側.includes("お問い合わせ件名"), "マスターデータ管理画面の選択肢に「お問い合わせ件名」がある").toBe(false);
  });
});

caseTest("IT-M16-04-035", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  // 説明文の中のリンクは、マスターデータを選ぶと出る（一覧の領域の中）。選ばずに出ていなければ、カードタイプを選んで出す
  await step(2, async () => {
    if ((await m.カード名リスト作成リンク.count()) === 0) {
      test.info().annotations.push({ type: "手順の注記", description: "「カード名リスト作成」のリンクは、マスターデータを選ぶ（選択を押す）まで画面に出ない。正本の手順に無い「選択を押す」操作で補った" });
      await m.選択を押す();
    }
    await Promise.all([m.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), m.カード名リスト作成リンク.click({ timeout: 20_000 })]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先の画面（カード一覧）").toMatch(/\/card\/?$/);
  });
});

// ---- 以下は、共有のマスタ（MTGマスターデータ）の既存の行を読んで確かめるケース。試験用の行を足さず、既存の行を書き換えない ----
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 読み替えの注記 = "シード表の試験用の行（例: 試験カードタイプA）は、共有のマスタに足さない決まりのため作らず、画面に既にある行で確かめた";

caseTest("IT-M16-04-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  await step(2, async () => { await m.種別を選んで表示する("カードタイプ"); });
  let 末尾 = { 空行の数: 0, 末尾が空行: false, 入力値: [] as string[], 登録済み: 0 };
  await step(3, async () => {
    const last = m.一覧の領域.locator("tbody tr").last();
    末尾 = {
      空行の数: await m.入力用の空行.count(),
      末尾が空行: (await last.locator('[name^="rows[new]"]').count()) > 0,
      入力値: await last.locator("input").evaluateAll((es) => es.map((e) => (e as HTMLInputElement).value)),
      登録済み: await m.登録済みの行.count(),
    };
  });
  note(読み替えの注記);
  await expected(async () => {
    expect.soft(末尾.登録済み, "登録済みの行の数（確かめる前に既存の行が出ている）").toBeGreaterThan(0);
    expect.soft(末尾.空行の数, "入力値が空の行の数").toBe(1);
    expect.soft(末尾.末尾が空行, "登録済みデータの末尾が空行である").toBe(true);
    expect.soft(末尾.入力値.length, "空行の入力欄の数").toBeGreaterThan(0);
    expect.soft(末尾.入力値.every((v) => v === ""), "空行の入力値がすべて空").toBe(true);
  });
});

const 二十一種別 = ["レアリティ", "デッキタグ", "色順", "カードタイプ", "サブタイプ", "特殊タイプ", "カラー", "カードレイアウト", "プロモーション", "イラストレーター", "リーガリティ", "ボード", "カードセットブロック", "認定", "言語", "マナシンボル", "ルール適用度", "キャンペーンタグ", "状態", "特殊サジェスト", "特殊制限"];
type 見出しの集め = Record<string, { 見出し: string[]; 先頭行の列数: number }>;
const 見出しを集める = async (m: MtgMasterEditPage, 種別: string[]): Promise<見出しの集め> => {
  const out: 見出しの集め = {};
  for (const k of 種別) {
    await m.種別を選んで表示する(k);
    const 見出し = await m.見出し();
    const 先頭行 = m.登録済みの行.first();
    out[k] = { 見出し, 先頭行の列数: (await 先頭行.count()) ? await 先頭行.locator("td").count() : 見出し.length };
  }
  return out;
};

caseTest("IT-M16-04-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  let 結果: 見出しの集め = {};
  await step(2, async () => { 結果 = await 見出しを集める(m, 二十一種別); });
  let 確認した種別 = 0;
  await step(3, async () => { 確認した種別 = Object.keys(結果).length; });
  note(`${読み替えの注記}。列の確認は既存の行の画面で行う。「行識別用の先頭項目」は見出しに「id」が出ないことで確かめた`);
  await expected(async () => {
    expect.soft(確認した種別, "確かめた種別の数").toBe(二十一種別.length);
    for (const k of 二十一種別) {
      const r = 結果[k];
      expect.soft(r?.見出し.length ?? 0, `${k}: 表示される列の数（1以上）`).toBeGreaterThan(0);
      expect.soft(r?.見出し.length ?? 99, `${k}: 表示される列の数（最大10列）`).toBeLessThanOrEqual(10);
      expect.soft((r?.見出し ?? []).some((h) => /^id$/i.test(h)), `${k}: 行識別用の先頭項目が列として表示されていない`).toBe(false);
      expect.soft(r?.先頭行の列数, `${k}: 行の列の数が見出しの数と同じ`).toBe(r?.見出し.length);
    }
  });
});

caseTest("IT-M16-04-009", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  await step(2, async () => { await m.種別を選んで表示する("カードタイプ"); });
  let 値: string[] = [];
  await step(3, async () => { 値 = await m.真偽値の表示(); });
  note(`${読み替えの注記}。「試験カードタイプA」の代わりに、既存のカードタイプの真偽値の列に偽の行があり、それが数値の0で出ることを確かめた`);
  await expected(async () => {
    expect.soft(値.length, "真偽値の列の数（確かめる前に既存の行が出ている）").toBeGreaterThan(0);
    expect.soft(値.every((v) => v === "0" || v === "1"), "真偽値は数値の0か1で表示される").toBe(true);
    expect.soft(値.includes("0"), "偽の値が数値の0として表示される行がある").toBe(true);
  });
});

caseTest("IT-M16-04-012", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  const 三種 = ["レアリティ", "デッキタグ", "色順"];
  await step(1, async () => { await m.open(); });
  let 結果: 見出しの集め = {};
  await step(2, async () => { 結果 = await 見出しを集める(m, 三種); });
  let 確認した種別 = 0;
  await step(3, async () => { 確認した種別 = Object.keys(結果).length; });
  await expected(async () => {
    expect.soft(確認した種別, "確かめた種別の数").toBe(三種.length);
    for (const k of 三種) {
      expect.soft(結果[k]?.見出し ?? [], `${k}: 項目に「sort_no」がある`).toContain("sort_no");
      expect.soft(結果[k]?.見出し ?? ["Rank"], `${k}: 項目に「Rank」が無い`).not.toContain("Rank");
    }
  });
});

caseTest("IT-M16-04-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  const 十八種 = ["カードタイプ", "サブタイプ", "特殊タイプ", "カラー", "カードレイアウト", "プロモーション", "イラストレーター", "リーガリティ", "ボード", "カードセットブロック", "認定", "言語", "マナシンボル", "ルール適用度", "キャンペーンタグ", "状態", "特殊サジェスト", "特殊制限"];
  await step(1, async () => { await m.open(); });
  let 結果: 見出しの集め = {};
  await step(2, async () => { 結果 = await 見出しを集める(m, 十八種); });
  let 確認した種別 = 0;
  await step(3, async () => { 確認した種別 = Object.keys(結果).length; });
  await expected(async () => {
    expect.soft(確認した種別, "確かめた種別の数").toBe(十八種.length);
    for (const k of 十八種) expect.soft(結果[k]?.見出し ?? [], `${k}: 項目に「sort_no」がある`).toContain("sort_no");
  });
});

caseTest("IT-M16-04-016", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  await step(2, async () => { await m.種別を選んで表示する("カードタイプ"); });
  let 数 = { 一覧の中: -1, 登録ボタン: -1, 登録の名前のボタン: -1 };
  await step(3, async () => {
    数 = { 一覧の中: await m.一覧の領域.locator('button, input[type="submit"]').count(), 登録ボタン: await m.登録ボタン.count(), 登録の名前のボタン: await m.登録の文字のボタン.count() };
  });
  await expected(async () => {
    expect.soft(数.一覧の中, "一覧の中に旧登録ボタン（一覧の内側の送信ボタン）が無い").toBe(0);
    expect.soft(数.登録ボタン, "登録ボタンの数").toBe(1);
    expect.soft(数.登録の名前のボタン, "「登録」の名前のボタンの数").toBe(1);
  });
});

/** 編集ロックの境界（シード表 LOCK-017/019 の指定値）。種別の表示名 → 境界のID */
const 境界: [string, number][] = [["カードレイアウト", 5], ["カードタイプ", 14], ["カードセットブロック", 27], ["ボード", 3], ["認定", 3], ["言語", 2], ["プロモーション", 32], ["レアリティ", 7], ["リーガリティ", 3], ["ルール適用度", 5], ["特殊タイプ", 7], ["サブタイプ", 378]];
type 行の入力可否の結果 = { 行の数: number; 見出し: string[]; 入力できない: boolean[] };
const 行の入力可否 = async (m: MtgMasterEditPage, 種別: string, id: number): Promise<行の入力可否の結果> => {
  await m.種別を選んで表示する(種別);
  const 見出し = await m.見出し();
  const 行 = m.番号の行(id);
  const n = await 行.count();
  return { 行の数: n, 見出し, 入力できない: n === 1 ? await m.入力できない列(行) : [] };
};

caseTest("IT-M16-04-017", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  const 結果: Record<string, 行の入力可否の結果> = {};
  await step(2, async () => { for (const [k, id] of 境界) 結果[k] = await 行の入力可否(m, k, id); });
  let 確認した種別 = 0;
  await step(3, async () => { 確認した種別 = Object.keys(結果).length; });
  note(`${読み替えの注記}。境界のIDの行は、各種別の既存の行（シード表の指定IDと同じID）を使った`);
  await expected(async () => {
    expect.soft(確認した種別, "確かめた種別の数").toBe(境界.length);
    for (const [k, id] of 境界) {
      const r = 結果[k];
      expect.soft(r?.行の数, `${k}: ID ${id} の行がある（既存の行）`).toBe(1);
      const s = r?.見出し.indexOf("sort_no") ?? -1;
      expect.soft(s, `${k}: sort_no の列がある`).toBeGreaterThanOrEqual(0);
      (r?.入力できない ?? []).forEach((ro, i) => {
        if (i === s) expect.soft(ro, `${k}: ID ${id} の行の sort_no は入力できる`).toBe(false);
        else expect.soft(ro, `${k}: ID ${id} の行の「${r?.見出し[i]}」は読み取り専用`).toBe(true);
      });
    }
  });
});

caseTest("IT-M16-04-019", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  const 結果: Record<string, 行の入力可否の結果> = {};
  await step(2, async () => { for (const [k, id] of 境界) 結果[k] = await 行の入力可否(m, k, id + 1); });
  let 確認した種別 = 0;
  await step(3, async () => { 確認した種別 = Object.keys(結果).length; });
  note(`${読み替えの注記}。境界より1大きいIDの行は、各種別の既存の行（シード表の指定IDと同じID）を使った`);
  await expected(async () => {
    expect.soft(確認した種別, "確かめた種別の数").toBe(境界.length);
    for (const [k, id] of 境界) {
      const r = 結果[k];
      expect.soft(r?.行の数, `${k}: ID ${id + 1} の行がある（既存の行）`).toBe(1);
      expect.soft(r?.入力できない.length ?? 0, `${k}: 行の列の数`).toBeGreaterThan(0);
      (r?.入力できない ?? []).forEach((ro, i) => expect.soft(ro, `${k}: ID ${id + 1} の行の「${r?.見出し[i]}」に入力できる`).toBe(false));
    }
  });
});

caseTest("IT-M16-04-020", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  const 九種 = ["カラー", "イラストレーター", "マナシンボル", "デッキタグ", "キャンペーンタグ", "状態", "色順", "特殊サジェスト", "特殊制限"];
  await step(1, async () => { await m.open(); });
  const 結果: Record<string, { 行の数: number; 入力できない: boolean[][] }> = {};
  await step(2, async () => {
    for (const k of 九種) {
      await m.種別を選んで表示する(k);
      const 行 = m.登録済みの行;
      const n = await 行.count();
      const 各行: boolean[][] = [];
      for (let i = 0; i < n; i++) 各行.push(await m.入力できない列(行.nth(i)));
      結果[k] = { 行の数: n, 入力できない: 各行 };
    }
  });
  let 確認した種別 = 0;
  await step(3, async () => { 確認した種別 = Object.keys(結果).length; });
  note(`${読み替えの注記}。各種別の「シード行」の代わりに、既存の行のすべてを確かめた。既存の行が1件も無い種別は、確かめる行が無いので「既存の行が無い」として不合格にする`);
  await expected(async () => {
    expect.soft(確認した種別, "確かめた種別の数").toBe(九種.length);
    for (const k of 九種) {
      expect.soft(結果[k]?.行の数, `${k}: 確かめる既存の行がある`).toBeGreaterThan(0);
      (結果[k]?.入力できない ?? []).forEach((cols, i) => expect.soft(cols.every((ro) => !ro), `${k}: ${i + 1}行目の主キー以外の列にすべて入力できる`).toBe(true));
    }
  });
});

caseTest("IT-M16-04-033", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); await m.種別を選んで表示する("カラー"); });
  let 書き換えた数 = 0;
  await step(2, async () => { 書き換えた数 = await m.トークンを書き換える("invalid-token"); });
  await step(3, async () => { await m.登録を押す(); });
  await expected(async () => {
    expect.soft(書き換えた数, "書き換えたなりすまし対策トークンの数").toBeGreaterThan(0);
    expect.soft((await m.入力エラーの文()).length, "入力チェックのエラー内容が画面に表示されている").toBeGreaterThan(0);
  });
});

caseTest("IT-M16-04-036", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  const e = new MasterEntryLinks(page);
  await step(1, async () => { await e.カードセット管理を開く(); });
  await step(2, async () => {
    note("正本の「ブロックを追加」は、画面では「ブロックの追加」のリンク");
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), e.ブロックの追加.click({ timeout: 20_000 })]);
  });
  note("正本の「ブロックタグ」は、MTGマスターデータ選択では「カードセットブロック」の表示名");
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先の画面（MTGマスターデータ編集）").toMatch(/\/data\/mtg_master_data\/?$/);
    expect.soft(await m.選ばれている表示名(), "選択されている種別").toBe("カードセットブロック");
    expect.soft(await m.一覧の領域.count(), "一覧の領域の数").toBe(1);
    expect.soft(await m.登録済みの行.count(), "ブロックのマスターデータの行数（一覧表示されている）").toBeGreaterThan(0);
  });
});

caseTest("IT-M16-04-037", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  const e = new MasterEntryLinks(page);
  await step(1, async () => { await e.デッキ管理を開く(); });
  let ある = false;
  await step(2, async () => {
    ある = (await e.デッキタグ一覧.count()) > 0;
    if (ある) await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), e.デッキタグ一覧.first().click({ timeout: 20_000 })]);
  });
  await expected(async () => {
    expect.soft(ある, "デッキ管理に「デッキタグ一覧」のボタンがある").toBe(true);
    expect.soft(new URL(page.url()).pathname, "遷移先の画面（MTGマスターデータ編集）").toMatch(/\/data\/mtg_master_data\/?$/);
    if (/mtg_master_data/.test(page.url())) {
      expect.soft(await m.選ばれている表示名(), "選択されている種別").toBe("デッキタグ");
      expect.soft(await m.登録済みの行.count(), "デッキタグの行数（一覧表示されている）").toBeGreaterThan(0);
    }
  });
});

caseTest("IT-M16-04-041", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  await step(2, async () => { await m.選択欄.selectOption({ label: "お問い合わせ件名" }); });
  await step(3, async () => { await m.選択を押す(); });
  let 見出し: string[] = [];
  const 各行: boolean[][] = [];
  await step(4, async () => {
    見出し = await m.見出し();
    const 行 = m.登録済みの行;
    for (let i = 0; i < (await 行.count()); i++) 各行.push(await m.入力できない列(行.nth(i)));
  });
  note(`${読み替えの注記}。ID 〔お問い合わせ件名ID-M1604-041〕 の行の代わりに、既存のすべての行の2列目（件名）を確かめた`);
  await expected(async () => {
    expect.soft(見出し[1], "2列目の見出し").toBe("subject");
    expect.soft(各行.length, "確かめる既存の行がある").toBeGreaterThan(0);
    expect.soft(各行.every((c) => c[1] === false), "すべての行の2列目が読み取り専用にならず入力できる").toBe(true);
  });
});

caseTest("IT-M16-04-047", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  await step(2, async () => { await m.選択欄.selectOption({ label: "お問い合わせ件名" }); });
  await step(3, async () => { await m.選択を押す(); });
  let 見出し: string[] = [], 行の数 = 0, 入力できない: boolean[] = [];
  await step(4, async () => {
    見出し = await m.見出し();
    const 行 = m.番号の行(1);
    行の数 = await 行.count();
    if (行の数 === 1) 入力できない = await m.入力できない列(行);
  });
  note(`${読み替えの注記}。ID 1 の行の2列目は、シードが書き換える値（M1604-047-件名）ではなく、既存の値のまま確かめた`);
  await expected(async () => {
    expect.soft(行の数, "ID 1 の行がある（既存の行）").toBe(1);
    expect.soft(見出し[1], "2列目の見出し").toBe("subject");
    expect.soft(入力できない[1], "ID 1 の行の2列目が読み取り専用にならず入力できる").toBe(false);
  });
});
