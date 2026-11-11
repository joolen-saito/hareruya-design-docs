/**
 * M05-20 出荷指示リスト編集（続き）。正本: cases/M05-20_test_cases.tsv
 * 使用シードは、画面（フロントの注文・出荷指示リストの生成）で作り、画面で指定できない値だけ、実行の印つきのデータに限り DB で設定する（seeds/m05-20.ts）。
 * 実装しないのは IT-M05-20-019 だけ（受注タイプのマスタに試験の値「M05-20ページング-019」を足し、出荷指示リスト12件を作る必要がある。
 * 共有のマスタを書き換えず、大量のデータも残さない方針による）。005 までと 006・013・014・025・033 は m05-20.spec.ts。
 */
import { Page, test } from "@playwright/test";
import {
  出荷指示リストの記録を読む, 出荷指示リストの件数, 出荷指示リストの受注ID, 受注の状態を読む, 受注明細の写し, 管理者IDを読む,
} from "../../db/m05_20";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { StandbyDetailPage, 受注を注文番号で検索する, 検索結果の行を読む } from "../../pages/admin/m05_20_standby";
import { M0520_ADMIN, M0520_RE_ADMIN } from "../../seeds/m05-20";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 空白を詰める = (t: string) => t.replace(/\s+/g, " ").trim();

/** M05-20管理者でログインし、出荷指示リスト詳細の部品と、控えた出荷指示リストIDを返す */
async function 開く(page: Page, notes: { get(l: string): string }, 呼び名: string): Promise<{ d: StandbyDetailPage; id: string }> {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0520_ADMIN);
  return { d: new StandbyDetailPage(page), id: notes.get(呼び名) };
}

caseTest("IT-M05-20-001", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-001〕");
  const 受注 = ["001A", "001B"].map((k) => ({ 受注ID: notes.get(`〔受注ID-M0520-${k}〕`), 注文番号: notes.get(`〔注文番号-M0520-${k}〕`) }));
  let 情報 = { 出荷指示番号: "", 登録日: "", 更新日: "", 最終更新者: "" };
  const 行: Record<string, Record<string, string>> = {};
  await step(1, async () => { await d.open(id); });
  await step(2, async () => {
    情報 = await d.リスト情報();
    for (const o of 受注) {
      const r = d.受注行(o.受注ID);
      行[o.受注ID] = {
        注文番号: 空白を詰める(await r.注文番号.innerText()), お名前: 空白を詰める(await r.お名前.innerText()), 支払方法: 空白を詰める(await r.支払方法.innerText()),
        購入金額: 空白を詰める(await r.購入金額.innerText()), 合計点数: 空白を詰める(await r.合計点数.innerText()), 受注日: 空白を詰める(await r.受注日.innerText()),
        出荷指示日: 空白を詰める(await r.出荷指示日.innerText()), 対応状況: 空白を詰める(await r.対応状況.innerText()),
      };
    }
  });
  await expected(async () => {
    expect.soft(情報.出荷指示番号, "出荷指示番号").toBe(id);
    expect.soft(情報.登録日, "登録日").toBe("2026/08/01 10:20:30");
    expect.soft(情報.更新日, "更新日").toBe("2026/08/02 11:22:33");
    expect.soft(情報.最終更新者, "最終更新者").toBe("M05-20管理者");
    const want = [
      { お名前: "山田 太郎", 支払方法: "クレジットカード", 購入金額: "1,100", 合計点数: "2", 受注日: "2026/07/30", 出荷指示日: "2026/08/03", 対応状況: "出荷指示" },
      { お名前: "鈴木 花子", 支払方法: "銀行振込", 購入金額: "2,200", 合計点数: "3", 受注日: "2026/07/31", 出荷指示日: "2026/08/04", 対応状況: "出荷指示" },
    ];
    受注.forEach((o, i) => {
      expect.soft(行[o.受注ID]?.注文番号, `注文番号（${o.注文番号}）`).toBe(o.注文番号);
      for (const [k, v] of Object.entries(want[i])) expect.soft(行[o.受注ID]?.[k], `注文番号 ${o.注文番号} の${k}`).toBe(v);
    });
  });
  note("受注一覧の受注日・出荷指示日は日付だけの表示（年/月/日）、購入金額は桁区切り（1,100）の表示なので、その形で比べた");
});

caseTest("IT-M05-20-002", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-002〕");
  let 最終更新者 = "";
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { 最終更新者 = (await d.リスト情報()).最終更新者; });
  await expected(async () => {
    expect.soft(最終更新者, "削除済みの担当者名が最終更新者として表示される").toBe("削除済担当者");
  });
  note(`最終更新者の表示は「${最終更新者}」。アプリのメンバー削除は管理者の行を消す作りで、削除済み管理者の名前を残す仕組みが画面・DB から見当たらないため、この確かめは不合格になりうる（アプリに機能が無いことでの不合格）`);
});

caseTest("IT-M05-20-003", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-003〕");
  let 最終更新者: string | null = null;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { 最終更新者 = (await d.リスト情報()).最終更新者; });
  await expected(async () => {
    expect.soft(最終更新者, "最終更新者の名前欄が空で表示される").toBe("");
  });
});

caseTest("IT-M05-20-004", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-004〕");
  const A = notes.get("〔受注ID-M0520-004A〕");
  const B = notes.get("〔受注ID-M0520-004B〕");
  const 番号 = notes.get("〔注文番号-M0520-004〕");
  let a = "x", b = "x";
  await step(1, async () => { await d.open(id); });
  await step(2, async () => {
    a = 空白を詰める(await d.受注行(A).注文番号.innerText());
    b = 空白を詰める(await d.受注行(B).注文番号.innerText());
  });
  await expected(async () => {
    expect.soft(a, `注文番号を持つ受注行には「${番号}」が表示される`).toBe(番号);
    expect.soft(b, "注文番号を持たない受注行の注文番号だけが空で表示される").toBe("");
  });
});

caseTest("IT-M05-20-005", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-005〕");
  let 情報 = { 出荷指示番号: "", 登録日: "x", 更新日: "x", 最終更新者: "" };
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { 情報 = await d.リスト情報(); });
  await expected(async () => {
    expect.soft(情報.登録日, "登録日が空で表示される").toBe("");
    expect.soft(情報.更新日, "更新日が空で表示される").toBe("");
  });
});

caseTest("IT-M05-20-008", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-008〕");
  const 前 = 出荷指示リストの記録を読む(id);
  let 後 = 前;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.備考欄.fill("更新テストABC123"); });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => { 後 = 出荷指示リストの記録を読む(id); });
  const 管理者ID = 管理者IDを読む(M0520_ADMIN.loginId);
  await expected(async () => {
    expect.soft(後?.備考, "備考が「更新テストABC123」になる").toBe("更新テストABC123");
    expect.soft((後?.更新日時 ?? "") > (前?.更新日時 ?? ""), `更新日が操作前（${前?.更新日時}）から更新される（操作後 ${後?.更新日時}）`).toBe(true);
    expect.soft(後?.最終更新者ID, "最終更新者が「M05-20管理者」になる（管理者ID）").toBe(管理者ID);
  });
  note(`操作前の記録は、手順1の前に DB で読んだ（更新日 ${前?.更新日時}）。最終更新者は管理者ID で比べた`);
});

caseTest("IT-M05-20-009", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-009〕");
  let 後 = 出荷指示リストの記録を読む(id);
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.備考欄.fill(""); });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => { 後 = 出荷指示リストの記録を読む(id); });
  await expected(async () => {
    expect.soft(後 !== null, "出荷指示リストが残っている").toBe(true);
    expect.soft(後?.備考 ?? "", "備考が空に更新される").toBe("");
  });
});

caseTest("IT-M05-20-010", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-010〕");
  const ids = [notes.get("〔受注ID-M0520-010A〕"), notes.get("〔受注ID-M0520-010B〕")];
  const 前の受注 = 出荷指示リストの受注ID(id);
  const 前の明細 = 受注明細の写し(ids);
  const 前の状態 = ids.map((x) => JSON.stringify(受注の状態を読む(x)));
  let 後の受注: string[] = [], 後の明細 = "", 後の状態: string[] = [];
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.備考欄.fill("構成維持確認"); });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => {
    後の受注 = 出荷指示リストの受注ID(id);
    後の明細 = 受注明細の写し(ids);
    後の状態 = ids.map((x) => JSON.stringify(受注の状態を読む(x)));
  });
  await expected(async () => {
    expect.soft(後の受注, `リストに含まれる受注が ${ids.join("・")} のまま`).toEqual([...ids].sort((a, b) => Number(a) - Number(b)));
    expect.soft(後の受注, "リストに含まれる受注が操作前から変わらない").toEqual(前の受注);
    expect.soft(後の明細, "受注明細が操作前の値から変わらない").toBe(前の明細);
    expect.soft(後の状態, "対応状況（と出荷指示日）が操作前の値から変わらない").toEqual(前の状態);
  });
  note("操作前の受注・明細・対応状況は、手順1の前に DB で読んで控え、手順4で読んだ値と比べた");
});

caseTest("IT-M05-20-011", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-011〕");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.備考欄.fill("遷移確認"); });
  await step(3, async () => { await d.登録を押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "出荷指示リスト詳細画面へ遷移する").toMatch(new RegExp(`/standby/${id}/edit$`));
    expect.soft(await d.出荷指示番号の表示.count(), "詳細画面の出荷指示番号が表示されている").toBe(1);
  });
});

caseTest("IT-M05-20-016", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-016〕");
  let 確認 = { 確認の文: null as string | null };
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { 確認 = await d.リスト削除を押す(); });
  await step(3, async () => { await d.確認ダイアログでキャンセルを押す(); });
  await expected(async () => {
    expect.soft(確認.確認の文 !== null, "削除の確認ダイアログが表示される").toBe(true);
    expect.soft(new URL(page.url()).pathname, "出荷指示リスト詳細画面に留まる").toMatch(new RegExp(`/standby/${id}/edit$`));
    expect.soft(await d.出荷指示番号の表示.count(), "詳細画面の出荷指示番号が表示されている").toBe(1);
  });
});

caseTest("IT-M05-20-017", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-017〕");
  let 件数 = -1;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.リスト削除を押す(); });
  await step(3, async () => { await d.確認ダイアログでOKを押す(); });
  await step(4, async () => { 件数 = 出荷指示リストの件数(id); });
  await expected(async () => {
    expect.soft(件数, `出荷指示リストID ${id} がDBから削除されている（登録されている件数）`).toBe(0);
  });
});

caseTest("IT-M05-20-018", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-018〕");
  const ids = [notes.get("〔受注ID-M0520-018A〕"), notes.get("〔受注ID-M0520-018B〕")];
  const 前の明細 = 受注明細の写し(ids);
  let 状態 = ids.map((x) => 受注の状態を読む(x));
  let 後の明細 = "";
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.リスト削除を押す(); });
  await step(3, async () => { await d.確認ダイアログでOKを押す(); });
  await step(4, async () => { 状態 = ids.map((x) => 受注の状態を読む(x)); 後の明細 = 受注明細の写し(ids); });
  await expected(async () => {
    ids.forEach((x, i) => {
      expect.soft(状態[i] !== null && 状態[i]!.削除日時 === null, `受注ID ${x} が残っている`).toBe(true);
      expect.soft(状態[i]?.対応状況, `受注ID ${x} の対応状況が「出荷指示」のまま`).toBe("出荷指示");
      expect.soft(状態[i]?.出荷指示日, `受注ID ${x} の出荷指示日だけが空になる`).toBeNull();
    });
    expect.soft(後の明細, "各受注明細が残っている（削除前と同じ）").toBe(前の明細);
  });
});

caseTest("IT-M05-20-020", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-020〕");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.リスト削除を押す(); });
  await step(3, async () => { await d.確認ダイアログでOKを押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "出荷指示リスト検索画面の初期表示（ページ番号なし）へ遷移する").toMatch(/\/standby\/search$/);
  });
  note("このテストの専用ブラウザは、ログインしたばかりで出荷指示リスト検索の検索条件・ページ番号を持たない");
});

caseTest("IT-M05-20-021", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-021〕");
  let r = { 応答: null as number | null };
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.削除要求のトークンを書き換える("invalid-token"); });
  await step(3, async () => { await d.リスト削除を押す(); });
  await step(4, async () => { r = await d.確認ダイアログでOKを押す(); });
  await expected(async () => {
    expect.soft(r.応答, "権限が無い旨の応答（403）が表示される").toBe(403);
  });
});

caseTest("IT-M05-20-022", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-022〕");
  let 記録 = 出荷指示リストの記録を読む(id);
  let 件数 = -1;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.削除要求のトークンを書き換える("invalid-token"); });
  await step(3, async () => { await d.リスト削除を押す(); });
  await step(4, async () => { await d.確認ダイアログでOKを押す(); });
  await step(5, async () => { 件数 = 出荷指示リストの件数(id); 記録 = 出荷指示リストの記録を読む(id); });
  await expected(async () => {
    expect.soft(件数, `出荷指示リストID ${id} が削除されない（登録されている件数）`).toBe(1);
    expect.soft(記録?.備考, "備考「保護対象備考」を持つレコードが残る").toBe("保護対象備考");
  });
});

caseTest("IT-M05-20-023", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-023〕");
  let r = { 応答: null as number | null };
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.削除要求の送信先からIDを削除する(); });
  await step(3, async () => { await d.リスト削除を押す(); });
  await step(4, async () => { r = await d.確認ダイアログでOKを押す(); });
  await expected(async () => {
    expect.soft(r.応答, "見つからない旨の応答（404）が表示される").toBe(404);
  });
  note("送信先の「…/standby/<出荷指示リストID>/delete」から出荷指示リストIDの部分を取り除き「…/standby/delete」にした");
});

caseTest("IT-M05-20-024", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-024〕");
  let 記録 = 出荷指示リストの記録を読む(id);
  let 件数 = -1;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.削除要求の送信先からIDを削除する(); });
  await step(3, async () => { await d.リスト削除を押す(); });
  await step(4, async () => { await d.確認ダイアログでOKを押す(); });
  await step(5, async () => { 件数 = 出荷指示リストの件数(id); 記録 = 出荷指示リストの記録を読む(id); });
  await expected(async () => {
    expect.soft(件数, `出荷指示リストID ${id} が削除されない（登録されている件数）`).toBe(1);
    expect.soft(記録?.備考, "備考「保護対象備考」を持つレコードが残る").toBe("保護対象備考");
  });
  note("送信先の「…/standby/<出荷指示リストID>/delete」から出荷指示リストIDの部分を取り除き「…/standby/delete」にした");
});

caseTest("IT-M05-20-027", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-027〕");
  let 記録 = 出荷指示リストの記録を読む(id);
  let 件数 = -1;
  let r = { 応答: null as number | null };
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.削除要求の方式を書き換える("GET"); });
  await step(3, async () => {
    await d.リスト削除を押す();
    r = await d.確認ダイアログでOKを押す();
  });
  await step(4, async () => { 件数 = 出荷指示リストの件数(id); 記録 = 出荷指示リストの記録を読む(id); });
  await expected(async () => {
    expect.soft(件数, `出荷指示リストID ${id} が削除されない（登録されている件数）`).toBe(1);
    expect.soft(記録?.備考, "備考「保護対象備考」を持つレコードが残る").toBe("保護対象備考");
  });
  note(`ボタンを押すと出る確認ダイアログは、要求を送るためにOKを押した（削除要求の応答 ${r.応答}）。要求の方式は、ボタンの方式の指定（data-method）を GET に変えた`);
});

caseTest("IT-M05-20-030", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-030〕");
  const 受注ID = notes.get("〔受注ID-M0520-030〕");
  const 注文番号 = notes.get("〔注文番号-M0520-030〕");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => {
    const link = d.注文番号のリンク(受注ID);
    await expect(link, `注文番号「${注文番号}」のリンク`).toHaveText(new RegExp(`^\\s*${注文番号}\\s*$`));
    await Promise.all([page.waitForURL(/\/order\/\d+\/edit/, { waitUntil: "domcontentloaded" }), link.click()]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, `注文番号 ${注文番号} の編集画面（受注ID ${受注ID}）へ遷移する`).toMatch(new RegExp(`/order/${受注ID}/edit$`));
  });
});

caseTest("IT-M05-20-031", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-031〕");
  const ids = [notes.get("〔受注ID-M0520-031A〕"), notes.get("〔受注ID-M0520-031B〕")];
  let オン: boolean[] = [], オフ: boolean[] = [];
  const 状態 = async () => Promise.all(ids.map((x) => d.受注行(x).選択.isChecked()));
  await step(1, async () => { await d.open(id); });
  await step(2, async () => {
    // 画面を開いた直後は全件選択がオン。押してオンになる動きを確かめるため、いったんオフにしてからオンにする
    if (await d.全件選択.isChecked()) await d.全件選択を設定する(false);
    await d.全件選択を設定する(true);
  });
  await step(3, async () => { オン = await 状態(); });
  await step(4, async () => { await d.全件選択を設定する(false); });
  await step(5, async () => { オフ = await 状態(); });
  await expected(async () => {
    expect.soft(オン, "全件選択をオンにすると2件すべての選択チェックボックスがオンになる").toEqual([true, true]);
    expect.soft(オフ, "全件選択をオフにすると2件すべてがオフになる").toEqual([false, false]);
  });
  note("詳細画面は開いた直後に全件選択がオンなので、手順2は、いったんオフにしてからオンにした");
});

caseTest("IT-M05-20-032", async ({ page, notes, step, expected }) => {
  const { d, id } = await 開く(page, notes, "〔出荷指示リストID-M0520-032〕");
  const 前任ID = notes.get("〔管理者ID-M0520-032〕");
  let 前の表示 = "";
  let 後 = 出荷指示リストの記録を読む(id);
  await step(1, async () => { await d.open(id); });
  await step(2, async () => {
    前の表示 = (await d.リスト情報()).最終更新者;
    expect.soft(前の表示, "最終更新者が「M0520-032-前任管理者」と表示されている").toBe("M0520-032-前任管理者");
  });
  await step(3, async () => { await d.備考欄.fill("更新テストM0520-032-A"); });
  await step(4, async () => { await d.登録を押す(); });
  await step(5, async () => { 後 = 出荷指示リストの記録を読む(id); });
  const 操作者ID = 管理者IDを読む(M0520_ADMIN.loginId);
  await expected(async () => {
    expect.soft(後?.最終更新者ID, `最終更新者が前任管理者（管理者ID ${前任ID}）から操作者の「M05-20管理者」に変わる（管理者ID）`).toBe(操作者ID);
    expect.soft(後?.最終更新者ID !== 前任ID, "最終更新者が前任管理者のままではない").toBe(true);
    expect.soft((await d.リスト情報()).最終更新者, "登録後の詳細画面の最終更新者の表示").toBe("M05-20管理者");
  });
});

caseTest("IT-M05-20-034", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const id = notes.get("〔出荷指示リストID-M0520-RE001〕");
  const 注文番号 = notes.get("〔注文番号-M0520-RE001〕");
  const d = new StandbyDetailPage(page);
  let 前 = { 件数: 0, 出荷指示日: "", 対応状況: "" };
  let 後 = { 件数: 0, 出荷指示日: "x", 対応状況: "" };
  let 確認 = { 確認の文: null as string | null };
  let 帯 = "";
  await step(1, async () => { await loginAdmin(page, M0520_RE_ADMIN); });
  await step(2, async () => { await 受注を注文番号で検索する(page, 注文番号); });
  await step(3, async () => { 前 = await 検索結果の行を読む(page, 注文番号); });
  await step(4, async () => { await d.open(id); });
  await step(5, async () => { 確認 = await d.リスト削除を押す(); });
  await step(6, async () => { await d.確認ダイアログでOKを押す(); });
  await step(7, async () => {
    帯 = 空白を詰める((await page.locator(".alert-success").allInnerTexts()).join(" "));
    expect.soft(new URL(page.url()).pathname, "出荷指示リスト検索画面へ遷移した").toMatch(/\/standby\/search$/);
  });
  await step(8, async () => { await 受注を注文番号で検索する(page, 注文番号); });
  await step(9, async () => { 後 = await 検索結果の行を読む(page, 注文番号); });
  await expected(async () => {
    expect.soft(確認.確認の文 !== null, "削除の確認ダイアログが表示される").toBe(true);
    expect.soft(帯, "画面上部に「削除しました」が表示される").toContain("削除しました");
    expect.soft(前.件数 >= 1, `手順3で注文番号 ${注文番号} の行が検索結果にある`).toBe(true);
    expect.soft(前.対応状況, "手順3: 注文番号の行の対応状況が「出荷指示」").toBe("出荷指示");
    expect.soft(前.出荷指示日 !== "", `手順3: 出荷指示日に日付が表示されている（${前.出荷指示日}）`).toBe(true);
    expect.soft(後.対応状況, "手順9: 同じ行の対応状況が「出荷指示」のまま").toBe("出荷指示");
    expect.soft(後.出荷指示日, "手順9: 出荷指示日だけが空になる").toBe("");
  });
  note("受注情報検索は、店舗に全店を選び、対応状況はすべて選んで検索した。同じ注文番号の古い受注の行が複数あるときは、受注IDが最大の行を見た");
});
