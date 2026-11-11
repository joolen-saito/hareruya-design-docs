/**
 * M08-13 ブラックリスト登録/編集/削除。正本: cases/M08-13_test_cases.tsv
 * 開発環境のブラックリストには、ほかの方の行がある。ケースは、シードが控えたブラックリストIDの行と、実行の印を付けたキーワードの行だけを見る
 * （正本の「一覧をN件だけにする」は行わない。件数は、このケースのキーワードの行だけで数える）。
 * 「ブラックリストがN件のまま」は、このケースの行（シードの最初の行以降のIDで、このケースの印を含む行と、キーワードが空の行）だけで数える。
 * 実装しないケース（記録 review/M08-13_progress_2026-11-11_dev.md）: 電話番号・実在の形の氏名・住所をブラックリストに入れて会員登録などを確かめるもの（判断待ち）。
 */
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { M0813BlacklistPage } from "../../pages/admin/m08_13_blacklist";
import { ブラックリスト, キーワードのブラックリスト, キーワードに含むブラックリスト, ケースの行, 保存されたブラックリスト } from "../../db/m08_13";
import { M0813_ADMIN, 印, ケースの印, 印の部分, 実行の印の文字, 文字数の値, 数字でない電話番号 } from "../../seeds/m08-13";
import { Page } from "@playwright/test";

async function 画面を開く(page: Page): Promise<M0813BlacklistPage> {
  const bl = new M0813BlacklistPage(page);
  expect(await bl.開く(), "ブラックリスト登録/編集/削除画面の応答").toBe(200);
  return bl;
}

caseTest("IT-M08-13-002", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブラックリストID-M0813-002〕");
  const 更新 = 印("更新氏名Test"), 住所 = 印("東京都千代田区新町1");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.行の項目を選ぶ(id, "氏名"); await bl.行のキーワードを入れる(id, 更新); });
  await step(3, async () => { await bl.新規登録行で項目を選ぶ("住所"); await bl.新規登録行のキーワードを入れる(住所); });
  await step(4, async () => { await bl.登録する(); });
  let 行: 保存されたブラックリスト | null = null, 追加: 保存されたブラックリスト[] = [];
  await step(5, async () => { 行 = ブラックリスト(id); 追加 = キーワードのブラックリスト(住所); });
  await expected(async () => {
    expect.soft(行?.キーワード, `保存前にキーワードが「${印("編集前氏名-002")}」だったブラックリスト（ID ${id}）のキーワードが「${更新}」に更新される`).toBe(更新);
    expect.soft(追加.map((r) => r.項目), `住所「${住所}」が1件追加される`).toEqual(["住所"]);
  });
});

caseTest("IT-M08-13-003", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブラックリストID-M0813-003〕");
  const 氏名 = 印("遷移確認氏名");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.新規登録行で項目を選ぶ("氏名"); await bl.新規登録行のキーワードを入れる(氏名); });
  await step(3, async () => { await bl.登録する(); });
  await expected(async () => {
    expect.soft(bl.一覧の画面か(), `ブラックリスト登録/編集/削除画面の保存済み一覧が再表示される（いまの画面: ${bl.いまのパス}）`).toBe(true);
    expect.soft((await bl.一致する行("氏名", 氏名)).length, `一覧に氏名「${氏名}」が表示される`).toBe(1);
    expect.soft(await bl.行(id).count(), `一覧にシードの行（ID ${id}）も表示されている`).toBe(1);
  });
});

caseTest("IT-M08-13-005", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブラックリストID-M0813-005〕");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.新規登録行で項目を選ぶ("住所"); await bl.新規登録行のキーワードを入れる(""); });
  await step(3, async () => { await bl.登録する(); });
  await expected(async () => {
    expect.soft(bl.一覧の画面か(), `ブラックリスト登録/編集/削除画面の保存済み一覧が再表示される（いまの画面: ${bl.いまのパス}）`).toBe(true);
    expect.soft(await bl.行(id).count(), `再表示された一覧にシードの行（ID ${id}）が表示される`).toBe(1);
  });
});

caseTest("IT-M08-13-009", async ({ page, step, expected }) => {
  const 値 = 文字数の値("あ", 255);
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.新規登録行で項目を選ぶ("氏名"); await bl.新規登録行のキーワードを入れる(値); });
  await step(3, async () => { await bl.登録する(); });
  let 追加: 保存されたブラックリスト[] = [];
  await step(4, async () => { 追加 = キーワードのブラックリスト(値); });
  await expected(async () => {
    expect.soft(追加.map((r) => r.項目), "氏名のキーワードが最大文字数255文字の値（「あ」と実行の印で255文字）で1件追加される").toEqual(["氏名"]);
    expect.soft([...(追加[0]?.キーワード ?? "")].length, "追加されたキーワードの文字数").toBe(255);
  });
});

caseTest("IT-M08-13-011", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブラックリストID-M0813-011〕");
  const 値 = 文字数の値("い", 255);
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.行のキーワードを入れる(id, 値); });
  await step(3, async () => { await bl.登録する(); });
  let 行: 保存されたブラックリスト | null = null;
  await step(4, async () => { 行 = ブラックリスト(id); });
  await expected(async () => {
    expect.soft(行?.キーワード, `キーワードが最大文字数255文字の値（「い」と実行の印で255文字）で更新される（ID ${id}）`).toBe(値);
    expect.soft([...(行?.キーワード ?? "")].length, "更新されたキーワードの文字数").toBe(255);
  });
});

caseTest("IT-M08-13-017", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブラックリストID-M0813-017〕");
  // 印は、空白を除いたあとの値の末尾に来るように入れる（正本の値の前後・途中の空白はそのまま）
  const 更新の入力 = ` 更　新 Space 値${印の部分("更新Space値")} `, 更新の期待 = 印("更新Space値");
  const 住所の入力 = ` 東京都　港区 2${印の部分("東京都港区2")} `, 住所の期待 = 印("東京都港区2");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.行のキーワードを入れる(id, 更新の入力); });
  await step(3, async () => { await bl.新規登録行で項目を選ぶ("住所"); await bl.新規登録行のキーワードを入れる(住所の入力); });
  await step(4, async () => { await bl.登録する(); });
  let 行: 保存されたブラックリスト | null = null, 住所: 保存されたブラックリスト[] = [];
  await step(5, async () => {
    行 = ブラックリスト(id);
    // この実行の「…2」と印で終わる住所（空白が残ったときも見つける）
    住所 = キーワードに含むブラックリスト(`2${印の部分("東京都港区2")}`).filter((r) => r.項目 === "住所" && (r.キーワード ?? "").includes("港区"));
  });
  await expected(async () => {
    expect.soft(行?.キーワード, `更新したキーワード（ID ${id}）が「${更新の期待}」となる`).toBe(更新の期待);
    expect.soft(住所.map((r) => r.キーワード), `新規の住所キーワードが「${住所の期待}」となる`).toEqual([住所の期待]);
  });
});

caseTest("IT-M08-13-018", async ({ page, step, expected }) => {
  const 氏名 = ケースの印("重複氏名", "018");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  let 前 = 0, 後 = 0;
  await step(1, async () => { bl = await 画面を開く(page); });
  // 件数は、このケースのキーワード（印つき）の行だけで数える（ほかの方の行を数えない）
  await step(2, async () => { 前 = キーワードのブラックリスト(氏名).length; });
  await step(3, async () => { await bl.新規登録行で項目を選ぶ("氏名"); await bl.新規登録行のキーワードを入れる(氏名); });
  await step(4, async () => { await bl.登録する(); });
  await step(5, async () => { 後 = キーワードのブラックリスト(氏名).length; });
  await expected(async () => {
    expect.soft(前, `登録前の氏名「${氏名}」の件数（シードの1件）`).toBe(1);
    expect.soft(後, `氏名「${氏名}」が重複して追加されず、件数が登録前から増えない`).toBe(前);
  });
});

caseTest("IT-M08-13-019", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔ブラックリストID-M0813-019A〕"), b = notes.get("〔ブラックリストID-M0813-019B〕");
  const 編集前 = 印("編集前氏名-019"), 重複 = ケースの印("重複氏名", "019");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.行の項目を選ぶ(a, "氏名"); await bl.行のキーワードを入れる(a, 重複); });
  await step(3, async () => { await bl.登録する(); });
  let 行A: 保存されたブラックリスト | null = null, 行B: 保存されたブラックリスト | null = null;
  await step(4, async () => { 行A = ブラックリスト(a); 行B = ブラックリスト(b); });
  await expected(async () => {
    expect.soft(行A?.キーワード, `ID ${a} のキーワードが「${編集前}」から更新されない`).toBe(編集前);
    expect.soft(行B?.キーワード, `ID ${b} のキーワードが「${重複}」から更新されない`).toBe(重複);
  });
});

caseTest("IT-M08-13-020", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブラックリストID-M0813-020〕");
  const 編集前 = 印("編集前氏名-020"), 重複 = 印("保存後重複");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.行のキーワードを入れる(id, 重複); });
  await step(3, async () => { await bl.新規登録行で項目を選ぶ("氏名"); await bl.新規登録行のキーワードを入れる(重複); });
  await step(4, async () => { await bl.登録する(); });
  let 行: 保存されたブラックリスト | null = null, 同じ値: 保存されたブラックリスト[] = [];
  await step(5, async () => { 行 = ブラックリスト(id); 同じ値 = キーワードのブラックリスト(重複); });
  await expected(async () => {
    expect.soft(行?.キーワード, `既存キーワード（ID ${id}）が「${編集前}」から更新されない`).toBe(編集前);
    expect.soft(同じ値.map((r) => r.ブラックリストID), `氏名「${重複}」が追加されない`).toEqual([]);
  });
});

caseTest("IT-M08-13-021", async ({ page, step, expected }) => {
  const 氏名 = ケースの印("重複氏名", "021");
  const 入力 = 氏名.replace(/^重複氏名/, "重 複　氏名");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  let 前 = 0, 後 = 0;
  // 件数は、このケースの印を含むキーワードの行だけで数える（ほかの方の行を数えない）
  const このケースの行 = () => キーワードに含むブラックリスト(氏名.slice("重複氏名".length)).length;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { 前 = このケースの行(); });
  await step(3, async () => { await bl.新規登録行で項目を選ぶ("氏名"); await bl.新規登録行のキーワードを入れる(入力); });
  await step(4, async () => { await bl.登録する(); });
  await step(5, async () => { 後 = このケースの行(); });
  await expected(async () => {
    expect.soft(前, `登録前の、このケースのキーワードの件数（シードの氏名「${氏名}」1件）`).toBe(1);
    expect.soft(後, `空白除去後に氏名「${氏名}」と重複するレコードが追加されず、件数が登録前から増えない`).toBe(前);
  });
});

caseTest("IT-M08-13-023", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブラックリストID-M0813-023〕");
  const 編集前 = 印("編集前氏名-023"), 更新 = ケースの印("一括更新予定", "023");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.行のキーワードを入れる(id, 更新); });
  await step(3, async () => { await bl.新規登録行で項目を選ぶ("電話番号"); await bl.新規登録行のキーワードを入れる(数字でない電話番号); });
  await step(4, async () => { await bl.登録する(); });
  let 行: 保存されたブラックリスト | null = null, 電話: 保存されたブラックリスト[] = [];
  await step(5, async () => { 行 = ブラックリスト(id); 電話 = キーワードのブラックリスト(数字でない電話番号); });
  await expected(async () => {
    expect.soft(行?.キーワード, `既存キーワード（ID ${id}）が「${編集前}」から更新されない`).toBe(編集前);
    expect.soft(電話.map((r) => r.ブラックリストID), `電話番号「${数字でない電話番号}」が追加されない`).toEqual([]);
  });
});

caseTest("IT-M08-13-024", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブラックリストID-M0813-024〕");
  const 編集前 = 印("編集前氏名-024"), 更新 = ケースの印("一括更新予定", "024");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.行のキーワードを入れる(id, 更新); });
  await step(3, async () => { await bl.新規登録行で項目を選ぶ("電話番号"); await bl.新規登録行のキーワードを入れる(数字でない電話番号); });
  await step(4, async () => { await bl.登録する(); });
  await expected(async () => {
    expect.soft(bl.一覧の画面か(), `ブラックリスト登録/編集/削除画面の保存済み一覧が開き直される（いまの画面: ${bl.いまのパス}）`).toBe(true);
    expect.soft(await bl.行のキーワード(id).inputValue().catch(() => "（行が無い）"), `ID ${id} の行に「${編集前}」が表示される`).toBe(編集前);
    expect.soft((await bl.キーワードの行(更新)).length, `入力した「${更新}」が一覧に残らない`).toBe(0);
    expect.soft(await bl.新規登録行のキーワード.inputValue(), `入力した「${数字でない電話番号}」が新規登録行に残らない`).not.toBe(数字でない電話番号);
  });
});

caseTest("IT-M08-13-026", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブラックリストID-M0813-026〕");
  const 編集前 = 印("編集前氏名-026");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.行のキーワードを入れる(id, 印("トークン欠落更新")); });
  await step(3, async () => { await bl.トークンの入力要素を消す(); });
  await step(4, async () => { await bl.登録する(); });
  let 行: 保存されたブラックリスト | null = null;
  await step(5, async () => { 行 = ブラックリスト(id); });
  await expected(async () => {
    expect.soft(行?.キーワード, `キーワード（ID ${id}）が「${編集前}」から更新されない`).toBe(編集前);
  });
});

caseTest("IT-M08-13-027", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブラックリストID-M0813-027〕");
  const 編集前 = 印("編集前氏名-027");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.行のキーワードを入れる(id, 印("トークン改ざん更新")); });
  await step(3, async () => { await bl.トークンを書き換える("invalid-token"); });
  await step(4, async () => { await bl.登録する(); });
  let 行: 保存されたブラックリスト | null = null;
  await step(5, async () => { 行 = ブラックリスト(id); });
  await expected(async () => {
    expect.soft(行?.キーワード, `キーワード（ID ${id}）が「${編集前}」から更新されない`).toBe(編集前);
  });
});

caseTest("IT-M08-13-040", async ({ page, step, expected }) => {
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  let 選択 = "", 値 = "";
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { 選択 = await bl.新規登録行で選ばれている項目(); 値 = await bl.新規登録行の項目.inputValue(); });
  await expected(async () => {
    expect.soft(選択, "新規登録用の項目が未選択（選択してください）の表示").toBe("選択してください");
    expect.soft(["住所", "電話番号", "氏名"].includes(選択) || 値 !== "", `住所・電話番号・氏名のいずれも選択されていない（選ばれている値: 「${値}」）`).toBe(false);
  });
});

caseTest("IT-M08-13-041", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブラックリストID-M0813-041〕");
  const キーワード = 印("M0813-041-変更対象");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.行の項目を選ぶ(id, "住所"); });
  await step(3, async () => { await bl.登録する(); });
  let 行: 保存されたブラックリスト | null = null;
  await step(4, async () => { 行 = ブラックリスト(id); });
  await expected(async () => {
    expect.soft(行?.項目, `ID ${id} のブラックリストの項目が氏名から住所に更新される`).toBe("住所");
    expect.soft(行?.キーワード, `キーワードが「${キーワード}」のまま`).toBe(キーワード);
  });
});

caseTest("IT-M08-13-044", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔ブラックリストID-M0813-044-A〕"), b = notes.get("〔ブラックリストID-M0813-044-B〕"), c = notes.get("〔ブラックリストID-M0813-044-C〕");
  const 削除対象 = 印("削除対象氏名M0813-044-C"), 残A = 印("残存氏名M0813-044-A"), 残B = 印("残存住所M0813-044-B");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  let 一覧: { ID: string; 項目: string; キーワード: string }[] = [];
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.削除する(c); });
  await step(3, async () => {
    一覧 = (await bl.行の一覧()).filter((r) => [a, b, c].includes(r.ブラックリストID)).map((r) => ({ ID: r.ブラックリストID, 項目: r.項目, キーワード: r.キーワード }));
  });
  let 行A: 保存されたブラックリスト | null = null, 行B: 保存されたブラックリスト | null = null, 行C: 保存されたブラックリスト | null = null;
  await step(4, async () => { 行A = ブラックリスト(a); 行B = ブラックリスト(b); 行C = ブラックリスト(c); });
  await expected(async () => {
    expect.soft(一覧, `一覧から氏名「${削除対象}」（ID ${c}）だけが消え、氏名「${残A}」と住所「${残B}」が残る`).toEqual([
      { ID: a, 項目: "氏名", キーワード: 残A }, { ID: b, 項目: "住所", キーワード: 残B },
    ]);
    expect.soft(行C, `DBから氏名「${削除対象}」（ID ${c}）が消える`).toBeNull();
    expect.soft([行A?.項目, 行A?.キーワード], `DBに氏名「${残A}」（ID ${a}）が残る`).toEqual(["氏名", 残A]);
    expect.soft([行B?.項目, 行B?.キーワード], `DBに住所「${残B}」（ID ${b}）が残る`).toEqual(["住所", 残B]);
  });
});

caseTest("IT-M08-13-045", async ({ page, step, expected }) => {
  const 住所 = 印("東京都港区M0813-045-1-2-3");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.新規登録行で項目を選ぶ("住所"); await bl.新規登録行のキーワードを入れる(住所); });
  await step(3, async () => { await bl.登録する(); });
  let 追加: 保存されたブラックリスト[] = [];
  await step(4, async () => { 追加 = キーワードのブラックリスト(住所); });
  await expected(async () => {
    expect.soft(追加.map((r) => [r.項目, r.キーワード]), `住所「${住所}」がハイフンを含んだまま1件追加される`).toEqual([["住所", 住所]]);
  });
});

caseTest("IT-M08-13-046", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブラックリストID-M0813-046〕");
  const キーワード = 印("氏名ABC-M0813-046");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.行の項目を選ぶ(id, "電話番号"); });
  await step(3, async () => { await bl.登録する(); });
  let 行: 保存されたブラックリスト | null = null;
  await step(4, async () => { 行 = ブラックリスト(id); });
  await expected(async () => {
    expect.soft([行?.項目, 行?.キーワード], `ID ${id} のブラックリストが氏名・「${キーワード}」から更新されない`).toEqual(["氏名", キーワード]);
  });
});

caseTest("IT-M08-13-047", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブラックリストID-M0813-047〕");
  const 編集前 = 印("編集前氏名M0813-047"), 新規 = 印("新規追加氏名M0813-047");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.行のキーワードを入れる(id, ""); });
  await step(3, async () => { await bl.新規登録行で項目を選ぶ("氏名"); await bl.新規登録行のキーワードを入れる(新規); });
  await step(4, async () => { await bl.登録する(); });
  let 行: 保存されたブラックリスト | null = null, 追加: 保存されたブラックリスト[] = [];
  await step(5, async () => { 行 = ブラックリスト(id); 追加 = キーワードのブラックリスト(新規); });
  await expected(async () => {
    expect.soft(行?.キーワード, `ID ${id} のキーワードが「${編集前}」から更新されない`).toBe(編集前);
    expect.soft(追加.map((r) => r.ブラックリストID), `氏名「${新規}」が追加されない`).toEqual([]);
  });
});

/** 「項目・キーワード」の組（期待結果の「ID … が氏名・「…」のまま」を確かめる形） */
const 組 = (r: 保存されたブラックリスト | null): [string, string] | null => (r ? [r.項目, r.キーワード ?? ""] : null);

caseTest("IT-M08-13-043", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔ブラックリストID-M0813-043-A〕"), b = notes.get("〔ブラックリストID-M0813-043-B〕");
  const 新A = 印("更新後住所M0813-043-A"), 新B = 印("更新後氏名M0813-043-B");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.行の項目を選ぶ(a, "住所"); await bl.行のキーワードを入れる(a, 新A); });
  await step(3, async () => { await bl.行の項目を選ぶ(b, "氏名"); await bl.行のキーワードを入れる(b, 新B); });
  await step(4, async () => { await bl.登録する(); });
  let 行A: 保存されたブラックリスト | null = null, 行B: 保存されたブラックリスト | null = null, 件: 保存されたブラックリスト[] = [];
  await step(5, async () => { 行A = ブラックリスト(a); 行B = ブラックリスト(b); 件 = ケースの行(a, ["M0813-043-", 実行の印の文字]); });
  await expected(async () => {
    expect.soft(組(行A), `ID ${a} が住所・「${新A}」に更新される`).toEqual(["住所", 新A]);
    expect.soft(組(行B), `ID ${b} が氏名・「${新B}」に更新される`).toEqual(["氏名", 新B]);
    expect.soft(件.map((r) => r.ブラックリストID), "このケースのブラックリストが2件のまま").toEqual([a, b]);
  });
});

/** 048〜052: 氏名の行（A）・住所の行（B）の2件のシードに対し、登録ボタンを押してDBで確かめるケース */
type 基準 = { a: string; b: string; 氏名: string; 住所: string; 印の文字列: string[] };
function 基準の2件(notes: { get: (l: string) => string }, 番号: string): 基準 {
  return {
    a: notes.get(`〔ブラックリストID-M0813-${番号}-A〕`), b: notes.get(`〔ブラックリストID-M0813-${番号}-B〕`),
    氏名: 印(`基準氏名M0813CB${番号}`), 住所: 印(`基準住所M0813CB${番号}`), 印の文字列: [`M0813CB${番号}`, 実行の印の文字],
  };
}

caseTest("IT-M08-13-048", async ({ page, notes, step, expected }) => {
  const k = 基準の2件(notes, "048");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.新規登録行で項目を選ぶ("住所"); await bl.新規登録行のキーワードを入れる(""); });
  await step(3, async () => { await bl.登録する(); });
  let 行A: 保存されたブラックリスト | null = null, 行B: 保存されたブラックリスト | null = null, 件: 保存されたブラックリスト[] = [];
  await step(4, async () => { 行A = ブラックリスト(k.a); 行B = ブラックリスト(k.b); 件 = ケースの行(k.a, k.印の文字列); });
  await expected(async () => {
    expect.soft(組(行A), `ID ${k.a} が氏名・「${k.氏名}」のまま`).toEqual(["氏名", k.氏名]);
    expect.soft(組(行B), `ID ${k.b} が住所・「${k.住所}」のまま`).toEqual(["住所", k.住所]);
    expect.soft(件.map((r) => r.ブラックリストID), "このケースのブラックリストが2件のまま（キーワードが空の行も足されない）").toEqual([k.a, k.b]);
  });
});

caseTest("IT-M08-13-049", async ({ page, notes, step, expected }) => {
  const k = 基準の2件(notes, "049");
  const 入力 = `追加 住所　M0813CB049${印の部分("追加住所M0813CB049")}`, 期待 = 印("追加住所M0813CB049");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.新規登録行で項目を選ぶ("住所"); await bl.新規登録行のキーワードを入れる(入力); });
  await step(3, async () => { await bl.登録する(); });
  let 行A: 保存されたブラックリスト | null = null, 行B: 保存されたブラックリスト | null = null, 件: 保存されたブラックリスト[] = [];
  await step(4, async () => { 行A = ブラックリスト(k.a); 行B = ブラックリスト(k.b); 件 = ケースの行(k.a, k.印の文字列); });
  await expected(async () => {
    expect.soft(組(行A), `ID ${k.a} が氏名・「${k.氏名}」のまま`).toEqual(["氏名", k.氏名]);
    expect.soft(組(行B), `ID ${k.b} が住所・「${k.住所}」のまま`).toEqual(["住所", k.住所]);
    expect.soft(件.filter((r) => ![k.a, k.b].includes(r.ブラックリストID)).map(組), `住所「${期待}」が1件追加される`).toEqual([["住所", 期待]]);
    expect.soft(件.length, "このケースのブラックリストが3件になる").toBe(3);
  });
});

caseTest("IT-M08-13-050", async ({ page, notes, step, expected }) => {
  const k = 基準の2件(notes, "050");
  const 更新 = 印("更新氏名M0813CB050");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.行のキーワードを入れる(k.a, 更新); });
  await step(3, async () => { await bl.新規登録行で項目を選ぶ("住所"); await bl.新規登録行のキーワードを入れる(""); });
  await step(4, async () => { await bl.登録する(); });
  let 行A: 保存されたブラックリスト | null = null, 行B: 保存されたブラックリスト | null = null, 件: 保存されたブラックリスト[] = [];
  await step(5, async () => { 行A = ブラックリスト(k.a); 行B = ブラックリスト(k.b); 件 = ケースの行(k.a, k.印の文字列); });
  await expected(async () => {
    expect.soft(組(行A), `ID ${k.a} が氏名・「${更新}」に更新される`).toEqual(["氏名", 更新]);
    expect.soft(組(行B), `ID ${k.b} が住所・「${k.住所}」のまま`).toEqual(["住所", k.住所]);
    expect.soft(件.map((r) => r.ブラックリストID), "このケースのブラックリストが2件のまま（キーワードが空の行も足されない）").toEqual([k.a, k.b]);
  });
});

caseTest("IT-M08-13-051", async ({ page, notes, step, expected }) => {
  const k = 基準の2件(notes, "051");
  const 追加 = 印("追加住所M0813CB051");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  await step(2, async () => { await bl.新規登録行で項目を選ぶ("住所"); await bl.新規登録行のキーワードを入れる(追加); });
  await step(3, async () => { await bl.登録する(); });
  let 行A: 保存されたブラックリスト | null = null, 行B: 保存されたブラックリスト | null = null, 件: 保存されたブラックリスト[] = [];
  await step(4, async () => { 行A = ブラックリスト(k.a); 行B = ブラックリスト(k.b); 件 = ケースの行(k.a, k.印の文字列); });
  await expected(async () => {
    expect.soft(組(行A), `ID ${k.a} が氏名・「${k.氏名}」のまま`).toEqual(["氏名", k.氏名]);
    expect.soft(組(行B), `ID ${k.b} が住所・「${k.住所}」のまま`).toEqual(["住所", k.住所]);
    expect.soft(件.filter((r) => ![k.a, k.b].includes(r.ブラックリストID)).map(組), `住所「${追加}」が1件追加される`).toEqual([["住所", 追加]]);
    expect.soft(件.length, "このケースのブラックリストが3件になる").toBe(3);
  });
});

caseTest("IT-M08-13-052", async ({ page, notes, step, expected }) => {
  const k = 基準の2件(notes, "052");
  await loginAdmin(page, M0813_ADMIN);
  let bl!: M0813BlacklistPage;
  await step(1, async () => { bl = await 画面を開く(page); });
  // 既存の2行と新規登録行には何も入れない（画面に出た値のまま）
  await step(2, async () => {
    expect(await bl.行(k.a).count(), `ID ${k.a} の行が一覧にある`).toBe(1);
    expect(await bl.行(k.b).count(), `ID ${k.b} の行が一覧にある`).toBe(1);
  });
  await step(3, async () => { await bl.登録する(); });
  let 行A: 保存されたブラックリスト | null = null, 行B: 保存されたブラックリスト | null = null, 件: 保存されたブラックリスト[] = [];
  await step(4, async () => { 行A = ブラックリスト(k.a); 行B = ブラックリスト(k.b); 件 = ケースの行(k.a, k.印の文字列); });
  await expected(async () => {
    expect.soft(組(行A), `ID ${k.a} が氏名・「${k.氏名}」（空白なし）`).toEqual(["氏名", k.氏名]);
    expect.soft(組(行B), `ID ${k.b} が住所・「${k.住所}」のまま`).toEqual(["住所", k.住所]);
    expect.soft(件.map((r) => r.ブラックリストID), "このケースのブラックリストが2件のまま").toEqual([k.a, k.b]);
  });
});
