/**
 * M10-09 メール設定（メールテンプレート編集）。正本: cases/M10-09_test_cases.tsv
 *
 * 読み替えは seeds/m10-09.ts の冒頭に書いた。要点:
 * - 正本の固定IDのテンプレートは、メール設定の新規作成画面で、テンプレート名の末尾に実行の印を付けて作ったものに読み替える（ID は画面が振る。
 *   ケースは作ったテンプレートの ID を使う。エビデンスに正本の名前と印つきの名前の対応が出る）。自動送信のテンプレートだけは画面で作れないので、
 *   正本の ID のまま E2E の行として DB へ足す（M10-08 と同じ作り）。作った・足したテンプレートは、ケースの終わりに基盤が DB で消す。
 * - 正本の「本文」は、画面で編集できる本文の欄（ヘッダー）に読み替える（本文ファイルの配置は行えない。メール種別「固定情報なし」の雛形はヘッダーとフッターだけ）。
 * - 専用店舗（店舗ID 9100001 など）は作らない。テンプレートはモール共有の一覧で、店舗で分かれない。
 * 実装しないケース: なし（30件すべて実装）。
 */
import { Page, test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { Account, adminUrl, loginAdmin } from "../../lib/session";
import { テンプレートの全件数, テンプレートを読む, 今との差 } from "../../db/m10_09_mail";
import { CustomerManualMailPage } from "../../pages/admin/m08_08_manual_mail";
import { MallMailListPage, MallMailPage, OrderMailPage } from "../../pages/admin/m10_09_mall_mail";
import { M1009_ADMIN, M1009L_ADMIN, M1009_CASE_ADMIN, テンプレートIDの, 印の名前, 太郎 } from "../../seeds/m10-09";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 本文の読み替え = "正本の「本文」は、画面で編集できる本文の欄（ヘッダー）に読み替えた（本文ファイルは配置できない。メール種別「固定情報なし」の雛形は、ヘッダーとフッターだけの本文）";

async function 開く(page: Page, account: Account = M1009_ADMIN): Promise<MallMailPage> {
  await loginAdmin(page, account);
  return new MallMailPage(page);
}
const ID = (seedId: string, 名前: string) => テンプレートIDの(seedId, 名前);
const 対応 = (seedId: string, 名前: string) => note(`正本の「${名前}」は、準備で作った「${印の名前(名前)}」（ID ${ID(seedId, 名前)}）にあたる`);
const 編集画面のパス = (id: string) => new RegExp(`/mall/mail/${id}$`);
/** 画面の日時（例 2026/08/01 9:00）を「YYYY-MM-DD HH:MM」にそろえる */
const 日時をそろえる = (s: string): string => {
  const m = /(\d{4})\D(\d{1,2})\D(\d{1,2})\D+(\d{1,2}):(\d{2})/.exec(s);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")} ${m[4].padStart(2, "0")}:${m[5]}` : s;
};
/** 未選択の画面で登録を押す: 送信が送られて応答の画面へ移ったか、ブラウザの入力チェック（件名は必須の欄）で止まったかを確かめる */
async function 押して送信か入力チェックを見る(p: MallMailPage): Promise<void> {
  const st = await p.登録を押して応答を見る();
  // ブラウザの入力チェックは、入力の漏れた欄のうち画面の上にある欄（テンプレート名・件名の順）から知らせる。止められた欄を読む
  const 止めた欄 = st === null ? await p.page.locator("#form1").evaluate((f) => {
    const e = (f as HTMLFormElement).querySelector(":invalid") as HTMLInputElement | null;
    const n = e?.name ?? "";
    return n.endsWith("[name]") ? "テンプレート名" : n.endsWith("[mail_subject]") ? "件名" : n ? "入力の漏れた欄" : "";
  }).catch(() => "") : "";
  const 止まった = 止めた欄 !== "";
  note(`登録の送信の応答: ${st ?? "なし"}${止まった ? `（${止めた欄}の欄のブラウザの入力チェックで送信が止まった）` : ""}・登録のあとのお知らせ: ${JSON.stringify(await p.お知らせ())}`);
  // どちらだったかを、画像の文にそのまま書く（「送られたか止まったか」の両方に読めないように）
  if (st !== null) expect(st !== null, `登録の送信が送られた（応答 ${st}）`).toBe(true);
  else expect(止まった, `${止めた欄 || "入力の漏れた"}の欄（未入力）のブラウザの入力チェックで登録の送信が止まった`).toBe(true);
}
const 日時の注記 = "最終更新日時は、画面の表示（年月日の区切り・時の桁）を「YYYY-MM-DD HH:MM」にそろえて比べた";

// ---- 001・002 テンプレートの選択肢 ----

caseTest("IT-M10-09-001", async ({ page, step, expected }) => {
  const p = await 開く(page);
  let 名前: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    名前 = (await p.選択肢()).map((o) => o.名前);
    note(`選択肢は${名前.length}件（モール共有の一覧で、ほかのテンプレートも並ぶ）。D自動送信テンプレート-001 は自動送信のテンプレートとして DB へ足した（ID 4009001）`);
  });
  await expected(async () => {
    for (const n of ["Aテンプレート-001", "Bテンプレート-001", "Cテンプレート-001", "D自動送信テンプレート-001"]) {
      expect.soft(名前, `選択肢に「${n}」（印つきの名前）が表示される`).toContain(印の名前(n));
    }
  });
});

caseTest("IT-M10-09-002", async ({ page, step, expected }) => {
  const p = await 開く(page);
  let 名前: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { 名前 = (await p.選択肢()).map((o) => o.名前); });
  await expected(async () => {
    expect.soft(名前, "選択肢が読めている（未削除の「Bテンプレート-002」が出ている）").toContain(印の名前("Bテンプレート-002"));
    expect.soft(名前, "削除済みの「E削除済みテンプレート-002」が選択肢に表示されない").not.toContain(印の名前("E削除済みテンプレート-002"));
  });
});

// ---- 004・005 テンプレートの切り替え ----

function 選んで移る(seedId: string, 名前: string, 件名: string, 本文: string) {
  return async ({ page, step, expected }: CaseCtx) => {
    const p = await 開く(page);
    const id = ID(seedId, 名前);
    let 選べた = false;
    let 値 = { 件名: "", ヘッダー: "", フッター: "" };
    await step(1, async () => { await p.開く(); });
    await step(2, async () => {
      try {
        await p.選ぶ(印の名前(名前));
        選べた = true;
      } catch (e) {
        note(`「${印の名前(名前)}」を選べなかった: ${String((e as Error).message).slice(0, 200)}`);
      }
      if (await p.編集画面である()) 値 = await p.値を読む();
      note(本文の読み替え);
    });
    await expected(async () => {
      expect.soft(選べた, `テンプレートで「${名前}」を選べた`).toBe(true);
      expect.soft(new URL(page.url()).pathname, `「${名前}」（ID ${id}）の編集画面に移る`).toMatch(編集画面のパス(id));
      expect.soft(値.件名, "件名").toBe(件名);
      expect.soft(値.ヘッダー, "本文（ヘッダー）").toBe(本文);
    });
  };
}
caseTest("IT-M10-09-004", 選んで移る("S-M10-09-SWITCH-004", "Aテンプレート-004", "A更新前件名", "A更新前本文"));
caseTest("IT-M10-09-005", 選んで移る("S-M10-09-AUTO-005", "D自動送信テンプレート-005", "自動送信更新前件名", "自動送信更新前本文"));

// ---- 006・007 未選択に戻す・無いID ----

caseTest("IT-M10-09-006", async ({ page, step, expected }) => {
  const S = "S-M10-09-BASE-006";
  const p = await 開く(page);
  let 選択 = "（読めない）";
  await step(1, async () => { await p.開く(ID(S, "Bテンプレート-006")); 対応(S, "Bテンプレート-006"); });
  await step(2, async () => { await p.未選択に戻す(); if (await p.編集画面である()) 選択 = await p.選ばれている(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "テンプレート未選択のメールテンプレート編集画面のアドレス").toMatch(/\/mall\/mail\/?$/);
    expect.soft(選択, "テンプレートの選択（未選択）").toBe("");
  });
});

caseTest("IT-M10-09-007", async ({ page, step, expected }) => {
  const S = "S-M10-09-NOTFOUND-007";
  const p = await 開く(page);
  let 状態 = 0;
  let 編集画面 = true;
  await step(1, async () => { await p.開く(ID(S, "Bテンプレート-007")); 対応(S, "Bテンプレート-007"); });
  await step(2, async () => {
    const url = page.url().replace(/\/mall\/mail\/\d+$/, "/mall/mail/999999");
    状態 = (await page.goto(url, { timeout: 60_000, waitUntil: "load" }))?.status() ?? 0;
    編集画面 = await p.編集画面である();
    note(`メールテンプレートID 999999 のアドレスを開いた応答: ${状態}`);
  });
  await expected(async () => {
    expect(編集画面, "メールテンプレートID 999999 の編集画面が表示されない").toBe(false);
  });
});

// ---- 008〜016 保存 ----

caseTest("IT-M10-09-008", async ({ page, step, expected }) => {
  const S = "S-M10-09-BASE-008";
  const id = ID(S, "Bテンプレート-008");
  const p = await 開く(page);
  let t: ReturnType<typeof テンプレートを読む> = null;
  await step(1, async () => { await p.開く(id); 対応(S, "Bテンプレート-008"); });
  await step(2, async () => { await p.入れる({ 件名: "更新後Subject123", ヘッダー: "更新後Body123" }); note(本文の読み替え); });
  await step(3, async () => { await p.登録を押す(); note(`登録のあとのお知らせ: ${JSON.stringify(await p.お知らせ())}`); });
  await step(4, async () => { t = テンプレートを読む(id); });
  await expected(async () => {
    expect.soft(t?.件名, `DBのID ${id}の件名`).toBe("更新後Subject123");
    expect.soft(t?.ヘッダー, `DBのID ${id}の本文（ヘッダー）`).toBe("更新後Body123");
  });
});

caseTest("IT-M10-09-009", async ({ page, step, expected }) => {
  const S = "S-M10-09-BASE-009";
  const id = ID(S, "Bテンプレート-009");
  const p = await 開く(page);
  let 編集画面 = false;
  let 選択 = "";
  await step(1, async () => { await p.開く(id); 対応(S, "Bテンプレート-009"); });
  await step(2, async () => { await p.入れる({ 件名: "遷移確認件名", ヘッダー: "遷移確認本文" }); note(本文の読み替え); });
  await step(3, async () => {
    // 押す前も同じアドレスの画面なので、送信が送られ、応答の画面へ移ったことを見る（送られずに「再表示」では確かめにならない）
    const st = await p.登録を押して応答を見る();
    note(`登録の送信の応答: ${st ?? "なし"}・登録のあとのお知らせ: ${JSON.stringify(await p.お知らせ())}`);
    expect(st, "登録の送信が送られた（送信の応答がある）").not.toBeNull();
    編集画面 = await p.編集画面である();
    if (編集画面) 選択 = await p.選ばれている();
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, `ID ${id}のメールテンプレート編集画面のアドレス`).toMatch(編集画面のパス(id));
    expect.soft(編集画面, "メールテンプレート編集画面が表示されている").toBe(true);
    expect.soft(選択, "テンプレートの選択（同じテンプレート）").toBe(id);
  });
});

caseTest("IT-M10-09-010", async ({ page, step, expected }) => {
  const S = "S-M10-09-BASE-010";
  const id = ID(S, "Bテンプレート-010");
  const p = await 開く(page);
  let t: ReturnType<typeof テンプレートを読む> = null;
  let 押した = "";
  await step(1, async () => { await p.開く(id); 対応(S, "Bテンプレート-010"); });
  await step(2, async () => { await p.入れる({ 件名: "更新履歴確認件名", ヘッダー: "更新履歴確認本文" }); note(本文の読み替え); });
  await step(3, async () => { 押した = new Date().toISOString(); await p.登録を押す(); note(`登録ボタンを押した時刻: ${押した}`); });
  await step(4, async () => { t = テンプレートを読む(id); });
  await expected(async () => {
    expect.soft(t?.更新者名, `DBのID ${id}の最終更新者`).toBe(太郎);
    expect.soft(t?.更新日時 ? 今との差(t.更新日時) : Number.POSITIVE_INFINITY, `DBのID ${id}の最終更新日（${t?.更新日時 ?? "なし"}）と今との差（秒。登録ボタンを押した時刻に更新された＝5分以内）`).toBeLessThan(300);
    expect.soft(t?.更新日時.startsWith("2026-08-01 09:00"), "最終更新日が準備の値（2026-08-01 09:00）のままでない").toBe(false);
  });
});

function 長さの境界(n: string, 件名: string, 本文: string, 見る: "件名" | "ヘッダー") {
  return async ({ page, step, expected }: CaseCtx) => {
    const S = `S-M10-09-BASE-${n}`;
    const id = ID(S, `Bテンプレート-${n}`);
    const p = await 開く(page);
    let t: ReturnType<typeof テンプレートを読む> = null;
    await step(1, async () => { await p.開く(id); 対応(S, `Bテンプレート-${n}`); });
    await step(2, async () => { await p.入れる({ 件名, ヘッダー: 本文 }); note(`${本文の読み替え}。件名 ${件名.length} 文字・本文 ${本文.length} 文字を入れた`); });
    await step(3, async () => { await p.登録を押す(); note(`登録のあとのお知らせ: ${JSON.stringify(await p.お知らせ())}`); });
    await step(4, async () => { t = テンプレートを読む(id); });
    await expected(async () => {
      const want = 見る === "件名" ? 件名 : 本文;
      const got = 見る === "件名" ? t?.件名 : t?.ヘッダー;
      expect.soft(got?.length, `DBのID ${id}の${見る === "件名" ? "件名" : "本文（ヘッダー）"}の文字数`).toBe(want.length);
      expect.soft(got === want, `DBのID ${id}の${見る === "件名" ? "件名" : "本文（ヘッダー）"}が入力した値に更新された`).toBe(true);
    });
  };
}
caseTest("IT-M10-09-011", 長さの境界("011", "あ".repeat(255), "件名境界確認本文", "件名"));
caseTest("IT-M10-09-013", 長さの境界("013", "本文境界確認件名", "あ".repeat(65536), "ヘッダー"));

caseTest("IT-M10-09-015", async ({ page, step, expected }) => {
  const p = await 開く(page);
  let 前 = -1;
  let 後 = -1;
  note("「店舗 9100015 のメールテンプレートの件数」は、店舗ごとに分かれないモール共有の一覧なので、メールテンプレートの全件数に読み替えた（ほかの回とぶつからないよう1本だけで流す）");
  await step(1, async () => { await p.開く(); 前 = テンプレートの全件数(); note(`登録ボタンを押す前の件数: ${前}`); });
  await step(2, async () => {
    // 送信が送られたか、ブラウザの入力チェックで止まったかを見る（何も起きずに「増えない」では確かめにならない）
    await 押して送信か入力チェックを見る(p);
  });
  await step(3, async () => { 後 = テンプレートの全件数(); });
  await expected(async () => {
    expect(後, `メールテンプレートの件数（押す前 ${前} 件から増えない）`).toBeLessThanOrEqual(前);
  });
});

caseTest("IT-M10-09-016", async ({ page, step, expected }) => {
  const p = await 開く(page);
  let 編集画面 = false;
  let 選択 = "（読めない）";
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    // 押す前も同じアドレスの画面なので、送信が送られ応答の画面へ移ったか、ブラウザの入力チェックで止まったかを見る（何も起きずに「再表示」では確かめにならない）
    await 押して送信か入力チェックを見る(p);
    編集画面 = await p.編集画面である();
    if (編集画面) 選択 = await p.選ばれている();
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "テンプレート未選択のメールテンプレート編集画面のアドレス").toMatch(/\/mall\/mail\/?$/);
    expect.soft(編集画面, "メールテンプレート編集画面が表示されている").toBe(true);
    expect.soft(選択, "テンプレートの選択（未選択）").toBe("");
  });
});

// ---- 018・019 入力項目 ----

caseTest("IT-M10-09-018", async ({ page, step, expected }) => {
  const S = "S-M10-09-BASE-018";
  const p = await 開く(page);
  await step(1, async () => { await p.開く(ID(S, "Bテンプレート-018")); 対応(S, "Bテンプレート-018"); });
  await step(2, async () => { await expect(p.件名, "編集画面の件名の欄").toBeVisible(); });
  await expected(async () => {
    await expect(p.名称, "テンプレ名称（テンプレート名）の入力欄が表示されない").toBeHidden();
  });
});

caseTest("IT-M10-09-019", async ({ page, step, expected }) => {
  const S = "S-M10-09-BASE-019";
  const p = await 開く(page);
  let 欄の数 = 0;
  let 値 = "";
  await step(1, async () => { await p.開く(ID(S, "Bテンプレート-019")); 対応(S, "Bテンプレート-019"); });
  await step(2, async () => {
    await p.入れる({ ヘッダー: "本文編集確認" });
    値 = (await p.値を読む()).ヘッダー;
    欄の数 = await p.本文の編集欄.count();
    note(`${本文の読み替え}。本文として入力できる欄（書き込める欄）は ${欄の数} 個`);
  });
  await expected(async () => {
    expect.soft(欄の数, "本文の編集欄の数（1つ）").toBe(1);
    expect.soft(値, "本文の編集欄に入力できた値").toBe("本文編集確認");
  });
});

// ---- 020〜023 更新履歴の表示 ----

function 履歴を見る(seedId: string, 名前: string, 期待: { 更新者: string; 日時: string } | null, 未選択 = false, account: Account = M1009_ADMIN) {
  return async ({ page, step, expected }: CaseCtx) => {
    const p = await 開く(page, account);
    let 更新者: string | null = null;
    let 日時: string | null = null;
    let 編集画面 = false;
    await step(1, async () => {
      if (未選択) await p.開く();
      else { await p.開く(ID(seedId, 名前)); 対応(seedId, 名前); }
    });
    await step(2, async () => {
      編集画面 = await p.編集画面である();
      if (await p.項目がある("最終更新者")) 更新者 = await p.行の値("最終更新者");
      if (await p.項目がある("最終更新日")) 日時 = await p.行の値("最終更新日");
      note(`画面上部の更新履歴: 最終更新者=${更新者 ?? "表示なし"}／最終更新日=${日時 ?? "表示なし"}`);
    });
    await expected(async () => {
      expect.soft(編集画面, "メールテンプレート編集画面が表示されている").toBe(true);
      if (期待) {
        note(日時の注記);
        expect.soft(更新者, "最終更新者").toBe(期待.更新者);
        expect.soft(日時 === null ? null : 日時をそろえる(日時), "最終更新日時").toBe(期待.日時);
      } else {
        expect.soft(更新者, "最終更新者が表示されない").toBeNull();
        expect.soft(日時, "最終更新日時が表示されない").toBeNull();
      }
    });
  };
}
caseTest("IT-M10-09-020", 履歴を見る("S-M10-09-HISTORY-020", "Bテンプレート-020", { 更新者: 太郎, 日時: "2026-08-01 09:00" }));
caseTest("IT-M10-09-021", 履歴を見る("S-M10-09-HIST-DELETED-021", "F履歴テンプレート-021", { 更新者: 印の名前("退任 花子-021"), 日時: "2026-07-15 14:30" }));
caseTest("IT-M10-09-022", 履歴を見る("S-M10-09-NOHIST-022", "G履歴なしテンプレート-022", null));
caseTest("IT-M10-09-023", 履歴を見る("S-M10-09-BASE-023", "Bテンプレート-023", null, true));

// ---- 024・025 見出し横の導線 ----

caseTest("IT-M10-09-024", async ({ page, step, expected }) => {
  const S = "S-M10-09-BASE-024";
  const p = await 開く(page);
  await step(1, async () => { await p.開く(ID(S, "Bテンプレート-024")); 対応(S, "Bテンプレート-024"); });
  await step(2, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000}), p.新規作成への導線.click({ noWaitAfter: true })]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "メールテンプレート新規作成画面のアドレス").toMatch(/\/mall\/mail\/new(\/\d+)?\/?$/);
    await expect.soft(page.locator('[name="mail[base_type]"]'), "新規作成画面のメール種別の選択").toBeVisible();
  });
});

caseTest("IT-M10-09-025", async ({ page, step, expected }) => {
  const S = "S-M10-09-BASE-025";
  const p = await 開く(page);
  const l = new MallMailListPage(page);
  await step(1, async () => { await p.開く(ID(S, "Bテンプレート-025")); 対応(S, "Bテンプレート-025"); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000}), p.一覧への導線.click({ noWaitAfter: true })]); });
  await expected(async () => {
    expect.soft(l.パス, "メールテンプレート一覧画面のアドレス").toMatch(/\/mall\/mail\/list\/?$/);
    await expect.soft(l.見出し, "メールテンプレート一覧画面の見出し").toHaveText("テンプレート一覧");
  });
});

// ---- 026〜028 テンプレート一覧 ----

async function 一覧へ(page: Page, p: MallMailPage, seedId: string, n: string): Promise<MallMailListPage> {
  const l = new MallMailListPage(page);
  await p.開く(ID(seedId, `Bテンプレート-${n}`));
  対応(seedId, `Bテンプレート-${n}`);
  return l;
}

caseTest("IT-M10-09-026", async ({ page, step, expected }) => {
  const S = "S-M10-09-LIST-026";
  const p = await 開く(page);
  let l!: MallMailListPage;
  const 本文: Record<string, string | null> = {};
  const 入力欄: Record<string, number> = {};
  await step(1, async () => { l = await 一覧へ(page, p, S, "026"); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000}), p.一覧への導線.click({ noWaitAfter: true })]); });
  await step(3, async () => {
    for (const x of ["A", "B", "C"]) {
      const id = ID(S, `${x}テンプレート-026`);
      本文[x] = await l.本文(id);
      入力欄[x] = await l.入力欄の数(id);
    }
    note(`${本文の読み替え}。一覧の本文は、雛形にヘッダー・フッターを差し込んだ文面`);
  });
  await expected(async () => {
    for (const x of ["A", "B", "C"]) {
      expect.soft(本文[x] ?? "", `「${x}テンプレート-026」の本文の文面に「${x}更新前本文」`).toContain(`${x}更新前本文`);
      expect.soft(入力欄[x], `「${x}テンプレート-026」の区画の入力欄の数（編集欄ではなく文面）`).toBe(0);
    }
  });
});

caseTest("IT-M10-09-027", async ({ page, step, expected }) => {
  const S = "S-M10-09-LIST-027";
  const p = await 開く(page);
  let l!: MallMailListPage;
  let 並び: string[] = [];
  await step(1, async () => { l = await 一覧へ(page, p, S, "027"); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000}), p.一覧への導線.click({ noWaitAfter: true })]); });
  await step(3, async () => {
    並び = await l.名前の並び();
    note(`一覧は${並び.length}件（モール共有の一覧で、ほかのテンプレートも並ぶ）。準備で作った3件の互いの順を見た`);
  });
  await expected(async () => {
    const 自分 = [印の名前("Aテンプレート-027"), 印の名前("Bテンプレート-027"), 印の名前("Cテンプレート-027")];
    expect(並び.filter((n) => 自分.includes(n)), "一覧の「Aテンプレート-027」「Bテンプレート-027」「Cテンプレート-027」の順").toEqual(自分);
  });
});

caseTest("IT-M10-09-028", async ({ page, step, expected }) => {
  const S = "S-M10-09-LIST-028";
  const p = await 開く(page);
  let l!: MallMailListPage;
  let 並び: string[] = [];
  await step(1, async () => { l = await 一覧へ(page, p, S, "028"); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000}), p.一覧への導線.click({ noWaitAfter: true })]); });
  await step(3, async () => { 並び = await l.名前の並び(); });
  await expected(async () => {
    expect.soft(並び, "一覧が読めている（「Aテンプレート-028」が出ている）").toContain(印の名前("Aテンプレート-028"));
    expect.soft(並び, "自動送信メールの「D自動送信テンプレート-028」が一覧に表示されない").not.toContain(印の名前("D自動送信テンプレート-028"));
  });
});

// ---- 029・030 ほかの画面との連携 ----

caseTest("IT-M10-09-029", async ({ page, notes, step, expected }) => {
  const S = "S-M10-09-L-TPL-029";
  const id = ID(S, "連携テンプレート-001");
  const p = await 開く(page, M1009L_ADMIN);
  const o = new OrderMailPage(page);
  let 件名 = "";
  await step(1, async () => { await p.開く(id); 対応(S, "連携テンプレート-001"); });
  await step(2, async () => { await p.入れる({ 件名: "連携更新後件名-001", ヘッダー: "連携更新後本文-001" }); note(本文の読み替え); });
  await step(3, async () => { await p.登録して保存を確かめる("連携テンプレート-001 の登録"); });
  await step(4, async () => { await o.開く(notes.get("〔受注レコードID-M1009-029〕")); });
  await step(5, async () => { await o.選ぶ(印の名前("連携テンプレート-001")); 件名 = await o.件名.inputValue(); });
  await expected(async () => {
    expect(件名, "受注のメール通知画面の件名欄").toBe("連携更新後件名-001");
  });
});

caseTest("IT-M10-09-030", async ({ page, notes, step, expected }) => {
  const S = "S-M10-09-L-TPL-030";
  const id = ID(S, "連携テンプレート-002");
  const p = await 開く(page, M1009L_ADMIN);
  const m = new CustomerManualMailPage(page);
  let 履歴: Awaited<ReturnType<CustomerManualMailPage["配信履歴"]>> = [];
  await step(1, async () => { await p.開く(id); 対応(S, "連携テンプレート-002"); });
  await step(2, async () => { await p.入れる({ 件名: "連携更新後件名-002", ヘッダー: "連携更新後本文-002" }); note(本文の読み替え); });
  await step(3, async () => { await p.登録して保存を確かめる("連携テンプレート-002 の登録"); });
  await step(4, async () => {
    const res = await page.goto(adminUrl(`/customer/mail/${notes.get("〔会員ID-M1009-030〕")}/history`), { timeout: 60_000, waitUntil: "load" });
    note(`メール配信履歴画面の応答: ${res?.status() ?? "なし"}`);
  });
  await step(5, async () => {
    履歴 = await m.配信履歴();
    note(`配信履歴の行: ${履歴.map((r) => `処理日=${r.処理日}・通知メール=${r.通知メール}・件名=${r.件名}`).join(" / ") || "なし"}（会員登録のときのメールなど、ほかの履歴が並ぶことがある。準備で送った「送信時件名-002」の行を見る）`);
  });
  await expected(async () => {
    const 行 = 履歴.filter((r) => r.件名 === "送信時件名-002");
    expect(行.length, "準備で送った履歴（件名「送信時件名-002」）の行の数").toBe(1);
    expect.soft(行[0]?.通知メール, "通知メール欄").toBe("連携更新後件名-002");
    expect.soft(行[0]?.件名, "件名欄（送信時の件名のまま）").toBe("送信時件名-002");
  });
});

// ---- 033〜036 ケース専用の管理者 ----

caseTest("IT-M10-09-033", async ({ page, step, expected }) => {
  const p = await 開く(page, M1009_CASE_ADMIN("033"));
  let 状態 = 0;
  let 編集画面 = true;
  await step(1, async () => {
    状態 = await p.開く(4009033);
    編集画面 = await p.編集画面である();
    note(`ID 4009033（準備で DB へ足した自動送信のテンプレート「${印の名前("D自動送信テンプレート-033")}」）のアドレスを開いた応答: ${状態}`);
  });
  await expected(async () => {
    expect(編集画面, "ID 4009033のメールテンプレート編集画面が表示されない").toBe(false);
  });
});

caseTest("IT-M10-09-034", async ({ page, step, expected }) => {
  const S = "S-M10-09-BASE-034";
  const id = ID(S, "Bテンプレート-034");
  const p = await 開く(page, M1009_CASE_ADMIN("034"));
  let 前の雛形 = "";
  let 前の定型文: string[] = [];
  let 後の定型文: string[] = [];
  let t: ReturnType<typeof テンプレートを読む> = null;
  await step(1, async () => {
    await p.開く(id);
    対応(S, "Bテンプレート-034");
    前の雛形 = テンプレートを読む(id)?.雛形 ?? "";
    前の定型文 = await p.雛形の表示();
    note(`正本の定型文「定型文-M1009-034」は作れないので、メール種別「会員情報から作成(日本語)」の雛形（${前の雛形}）の定型文で確かめる`);
  });
  await step(2, async () => { await p.入れる({ ヘッダー: "更新後ヘッダー-034", フッター: "更新後フッター-034" }); });
  await step(3, async () => { await p.登録を押す(); note(`登録のあとのお知らせ: ${JSON.stringify(await p.お知らせ())}`); if (await p.編集画面である()) 後の定型文 = await p.雛形の表示(); });
  await step(4, async () => { t = テンプレートを読む(id); });
  await expected(async () => {
    expect.soft(t?.ヘッダー, `DBのID ${id}の本文のヘッダー`).toBe("更新後ヘッダー-034");
    expect.soft(t?.フッター, `DBのID ${id}の本文のフッター`).toBe("更新後フッター-034");
    expect.soft(t?.雛形, `DBのID ${id}の本文の雛形（定型文）が変わらない`).toBe(前の雛形);
    expect.soft(後の定型文, "画面の定型文の表示が登録の前と同じ").toEqual(前の定型文);
  });
});

caseTest("IT-M10-09-035", async ({ page, step, expected }) => {
  const S = "S-M10-09-BASE-035";
  const id = ID(S, "Bテンプレート-035");
  const p = await 開く(page, M1009_CASE_ADMIN("035"));
  let t: ReturnType<typeof テンプレートを読む> = null;
  await step(1, async () => { await p.開く(id); 対応(S, "Bテンプレート-035"); note(`登録の前の最終更新者は、削除済みの「${印の名前("退任 花子-035")}」`); });
  await step(2, async () => { await p.入れる({ 件名: "更新者確認件名-035" }); });
  await step(3, async () => { await p.登録を押す(); note(`登録のあとのお知らせ: ${JSON.stringify(await p.お知らせ())}`); });
  await step(4, async () => { t = テンプレートを読む(id); });
  await expected(async () => {
    expect.soft(t?.更新者名, `DBのID ${id}の最終更新者（操作した管理者の名前）`).toBe(太郎);
    expect.soft(t?.更新者の記録名, `DBのID ${id}の記録された最終更新者名`).toBe(太郎);
  });
});

caseTest("IT-M10-09-036", async ({ page, step, expected }) => {
  const S = "S-M10-09-NOHIST-036";
  const id = ID(S, "G履歴なしテンプレート-036");
  const p = await 開く(page, M1009_CASE_ADMIN("036"));
  let t: ReturnType<typeof テンプレートを読む> = null;
  await step(1, async () => { await p.開く(id); 対応(S, "G履歴なしテンプレート-036"); });
  await step(2, async () => { await p.入れる({ 件名: "履歴付与確認件名-036" }); });
  await step(3, async () => { await p.登録を押す(); note(`登録のあとのお知らせ: ${JSON.stringify(await p.お知らせ())}`); });
  await step(4, async () => { t = テンプレートを読む(id); });
  await expected(async () => {
    expect.soft(t?.更新者名, `DBのID ${id}の最終更新者`).toBe(太郎);
    expect.soft(t?.更新日時 ? 今との差(t.更新日時) : Number.POSITIVE_INFINITY, `DBのID ${id}の最終更新日（${t?.更新日時 ?? "なし"}）と今との差（秒。登録ボタンを押した時刻に設定された＝5分以内）`).toBeLessThan(300);
  });
});
