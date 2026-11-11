/**
 * F05-04 ネット買取商品詳細（フロント）。正本: cases/F05-04_test_cases.tsv
 *
 * 実装しなかったケース（理由は PM への報告に書く）:
 * - 外部の商品検索サービスの索引から出る一覧を確かめる 004・021・022・024〜030・042・050・051・054・062・065（055・060・061・063 は、索引を使わない部分だけを確かめるので実装した）
 * - 販売側の販促バナーを DB へ直接設定する 056
 * - 共有のマスタ（カードセット・ブロック・イラストレーター）の値を使う 019
 * - DB での準備が要る 017（販売数量）・044〜046（旧商品コード対応。アプリに旧商品コードから転送する入口が無い）
 * 002・003（SP版のパンくずリスト）は f05-04-sp.spec.ts。
 *
 * 画面の作り（アプリの Purchase/detail.twig で確かめた）:
 * - 言語・商品クラスはアドレスの lang（言語のコード JP・EN）・class（商品規格ID）で指定する。正本の「言語EN」「商品クラスEN-EX」はそれに当てた。
 * - 価格の表は、言語ごとにその言語の先頭の商品規格の1行だけを出す。
 * - 金額は「1,200」のように桁区切りで出る。
 * ネット買取カートはブラウザのセッションに持つ（ログインは要らない）。ケースごとに新しいブラウザで始まるので、開始時のカートは空。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { NetBuyCartPage, NetBuyDetailPage, カテゴリ一覧の構成, カテゴリ一覧の構成を読む, カテゴリ一覧の描画を待つ, 販売側の商品一覧を開く } from "../../pages/front/f05_04_net_detail";
import { F0504カテゴリ, f0504カートのCookie, f0504商品 } from "../../seeds/f05-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const ファイル名 = (src: string) => src.split("?")[0].split("/").pop() ?? "";

/** 開いて、応答が400未満で商品名の見出しが見えることを確かめる */
async function 詳細を開く(page: Page, 商品ID: string, 指定?: { 言語?: string; 商品クラス?: string }): Promise<NetBuyDetailPage> {
  const d = new NetBuyDetailPage(page);
  const status = await d.開く(商品ID, 指定);
  expect(status, `商品ID ${商品ID} のネット買取商品詳細の応答`).toBeLessThan(400);
  await expect(d.商品名, "ネット買取商品詳細の商品名の見出し").toBeVisible();
  return d;
}

/** 開始時のネット買取カートが空であること（新しいブラウザで始める） */
async function カートを空で始める(page: Page): Promise<void> {
  await page.context().clearCookies();
  note("開始前にブラウザのCookie（サイトデータ）を消し、新しいセッションで始めた");
}

// ---- 001 ----
caseTest("IT-F05-04-001", async ({ page, notes, step, expected }) => {
  let d!: NetBuyDetailPage;
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-001〕")); await expect(d.カード説明, "カード説明の領域（読み込みの済んだ画面）").toBeVisible(); });
  await expected(async () => {
    expect(await d.文の数("このカードはこんなデッキで使われています"), "「このカードはこんなデッキで使われています」の領域の数").toBe(0);
  });
});

// ---- 007 ----
caseTest("IT-F05-04-007", async ({ page, notes, step, expected }) => {
  const 見る = async (d: NetBuyDetailPage) => ({
    言語切替: await d.言語切替.count(), 状態: await d.状態の列.count(), 他のバージョン: await d.他のバージョンボタン.count(),
    査定例: await d.査定例はこちら.count(), カード説明: await d.カード説明.count(),
  });
  let カード!: Awaited<ReturnType<typeof 見る>>;
  let サプライ!: Awaited<ReturnType<typeof 見る>>;
  await step(1, async () => { const d = await 詳細を開く(page, notes.get("〔商品ID-F0504-007A〕")); カード = await 見る(d); });
  await step(2, async () => { const d = await 詳細を開く(page, notes.get("〔商品ID-F0504-007B〕")); サプライ = await 見る(d); });
  await expected(async () => {
    expect.soft(カード.言語切替, "カード商品の言語切替のボタンの数").toBeGreaterThan(0);
    expect.soft(カード.状態, "カード商品の状態の列の数").toBeGreaterThan(0);
    expect.soft(カード.他のバージョン, "カード商品の「他のバージョン」の数").toBeGreaterThan(0);
    expect.soft(カード.査定例, "カード商品の「査定例はこちら」の数").toBeGreaterThan(0);
    expect.soft(カード.カード説明, "カード商品のカード説明の数").toBeGreaterThan(0);
    expect.soft(サプライ.言語切替, "サプライ商品の言語切替のボタンの数").toBe(0);
    expect.soft(サプライ.状態, "サプライ商品の状態の列の数").toBe(0);
    expect.soft(サプライ.他のバージョン, "サプライ商品の「他のバージョン」の数").toBe(0);
    expect.soft(サプライ.査定例, "サプライ商品の「査定例はこちら」の数").toBe(0);
    expect.soft(サプライ.カード説明, "サプライ商品のカード説明の数").toBe(0);
  });
});

// ---- 008・009（買取価格の境界） ----
caseTest("IT-F05-04-008", async ({ page, notes, step, expected }) => {
  let d!: NetBuyDetailPage;
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-008〕")); await expect(d.見えている価格の表, "価格の表").toBeVisible(); });
  await expected(async () => {
    expect.soft(await d.数量.count(), "商品数の欄の数").toBe(0);
    expect.soft(await d.マイナス.count(), "マイナスボタンの数").toBe(0);
    expect.soft(await d.プラス.count(), "プラスボタンの数").toBe(0);
    expect.soft(await d.カートに追加ボタン.count(), "カートに入れるボタンの数").toBe(0);
  });
});

caseTest("IT-F05-04-009", async ({ page, notes, step, expected }) => {
  let d!: NetBuyDetailPage;
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-009〕")); await expect(d.見えている価格の表, "価格の表").toBeVisible(); });
  await expected(async () => {
    await expect.soft(d.数量, "商品数の欄").toBeVisible();
    await expect.soft(d.数量, "商品数の初期値").toHaveValue("1");
    await expect.soft(d.マイナス, "マイナスボタン").toBeVisible();
    await expect.soft(d.プラス, "プラスボタン").toBeVisible();
    await expect.soft(d.カートに追加ボタン, "カートに入れるボタン").toBeVisible();
  });
});

// ---- 010〜012（SNS） ----
caseTest("IT-F05-04-010", async ({ page, notes, step, expected }) => {
  let d!: NetBuyDetailPage;
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-010〕")); });
  await expected(async () => {
    await expect.soft(d.シェアの領域, "SNSでシェアする領域").toBeVisible();
    await expect.soft(d.Xのアイコン, "SNSでシェアする領域のXのアイコン").toBeVisible();
    await expect.soft(d.LINEのアイコン, "SNSでシェアする領域のLINEのアイコン").toBeVisible();
  });
});

/** 共有の文から取り出したアドレス */
const 文の中のアドレス = (text: string): string[] => text.match(/https?:\/\/\S+/g) ?? [];

caseTest("IT-F05-04-011", async ({ page, notes, step, expected }) => {
  let d!: NetBuyDetailPage;
  let 記録したURL = "";
  let 共有の文 = "";
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-011〕")); 記録したURL = page.url(); note(`記録した画面のURL: ${記録したURL}`); });
  await step(2, async () => {
    const opened = await d.SNSのアイコンを押す(d.Xのアイコン, page.context());
    共有の文 = new URL(opened).searchParams.get("text") ?? "";
    note(`Xのアイコンで開いた共有の画面: ${opened}（外部のXへは繋がず、開いたアドレスだけを読んだ）。共有の文: ${共有の文}`);
  });
  await expected(async () => {
    expect(文の中のアドレス(共有の文), "Xで共有する対象のページURL").toContain(記録したURL);
  });
});

caseTest("IT-F05-04-012", async ({ page, notes, step, expected }) => {
  let d!: NetBuyDetailPage;
  let 記録したURL = "";
  let 共有の文 = "";
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-012〕")); 記録したURL = page.url(); note(`記録した画面のURL: ${記録したURL}`); });
  await step(2, async () => {
    const opened = await d.SNSのアイコンを押す(d.LINEのアイコン, page.context());
    const m = /\/R\/msg\/text\/(.*)$/.exec(new URL(opened).pathname + new URL(opened).search);
    共有の文 = m ? decodeURIComponent(m[1]) : "";
    note(`LINEのアイコンで開いた共有の画面: ${opened}（外部のLINEへは繋がず、開いたアドレスだけを読んだ）。共有の文: ${共有の文}`);
  });
  await expected(async () => {
    expect(文の中のアドレス(共有の文), "LINEで共有する対象のページURL").toContain(記録したURL);
  });
});

// ---- 013（EN・EN-EX を指定して開く） ----
caseTest("IT-F05-04-013", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-F0504-013〕");
  const p = f0504商品("F0504-CARD-001-013");
  const enEx = p.規格["EN-EX"];
  let d!: NetBuyDetailPage;
  await step(1, async () => { d = await 詳細を開く(page, id, { 言語: "EN", 商品クラス: enEx }); });
  await expected(async () => {
    expect.soft(await d.言語ボタンは選択状態("EN"), "言語ENが選択状態").toBe(true);
    expect.soft(await d.選ばれている商品クラス(), "選択状態の商品クラス（EN-EXの商品規格ID）").toBe(enEx);
    expect.soft(await d.言語ボタンは非活性("EN"), "ENの言語切替が非活性").toBe(true);
    await expect.soft(d.言語ラベル, "商品名の先頭の言語").toHaveText("EN");
    expect.soft(await d.言語ラベルは商品名の前にある(), "言語のラベルが商品名の先頭にある").toBe(true);
    expect.soft((await d.見えている商品画像()).map(ファイル名), "表示されている商品画像（EN-EX用の画像）").toContain(p.画像["EN-EX"]);
    expect.soft(d.url.searchParams.get("lang"), "URLの言語の指定").toBe("EN");
    expect.soft(d.url.searchParams.get("class"), "URLの商品クラスの指定（EN-EX）").toBe(enEx);
  });
});

// ---- 014（言語切替） ----
caseTest("IT-F05-04-014", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-F0504-014〕");
  const p = f0504商品("F0504-CARD-001-014");
  let d!: NetBuyDetailPage;
  await step(1, async () => { d = await 詳細を開く(page, id, { 言語: "JP", 商品クラス: p.規格["JP-NM"] }); });
  await step(2, async () => { await d.言語ボタンを押す("EN"); });
  await expected(async () => {
    expect.soft(d.url.pathname, "表示している商品の詳細画面").toMatch(new RegExp(`/purchase/detail/${id}$`));
    expect.soft(await d.言語ボタンは選択状態("EN"), "言語ENの詳細（ENが選択状態）").toBe(true);
    expect.soft(d.url.searchParams.get("lang"), "URLの言語").toBe("EN");
    expect.soft(d.url.searchParams.get("class"), "URLの商品クラス（ENの先頭の商品クラスEN-NM）").toBe(p.規格["EN-NM"]);
  });
});

// ---- 015（商品クラス切替） ----
caseTest("IT-F05-04-015", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-F0504-015〕");
  const p = f0504商品("F0504-CARD-001-015");
  const jpEx = p.規格["JP-EX"];
  let d!: NetBuyDetailPage;
  await step(1, async () => { d = await 詳細を開く(page, id, { 言語: "JP", 商品クラス: p.規格["JP-NM"] }); });
  await step(2, async () => {
    const link = d.商品クラスのリンク(jpEx);
    if ((await link.count()) === 0) throw new Error(`状態の欄に商品クラスJP-EX（商品規格ID ${jpEx}）を選ぶリンクが無い。表示されている行: ${(await d.見えている価格の行()).join(" / ")}`);
    await link.click();
  });
  await expected(async () => {
    expect.soft(await d.選ばれている商品クラス(), "選択状態の商品クラス（JP-EX）").toBe(jpEx);
    expect.soft((await d.見えている商品画像()).map(ファイル名), "表示されている商品画像（JP-EX用の画像）").toContain(p.画像["JP-EX"]);
    expect.soft(d.url.searchParams.get("lang"), "URLの言語").toBe("JP");
    expect.soft(d.url.searchParams.get("class"), "URLの商品クラス（JP-EX）").toBe(jpEx);
  });
});

// ---- 016（画像の拡大） ----
caseTest("IT-F05-04-016", async ({ page, notes, step, expected }) => {
  const p = f0504商品("F0504-CARD-001-016");
  let d!: NetBuyDetailPage;
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-016〕")); });
  await step(2, async () => { await d.画像拡大ボタン.click(); });
  await expected(async () => {
    await expect.soft(d.拡大表示, "商品画像の拡大表示").toBeVisible();
    expect.soft(ファイル名((await d.拡大画像.getAttribute("src")) ?? ""), "拡大画像（商品の画像）").toBe(p.画像["JP-NM"]);
  });
});

// ---- 020（パワー・タフネス・忠誠度なし） ----
caseTest("IT-F05-04-020", async ({ page, notes, step, expected }) => {
  let d!: NetBuyDetailPage;
  let 項目: string[] = [];
  await step(1, async () => {
    d = await 詳細を開く(page, notes.get("〔商品ID-F0504-020〕"));
    await expect(d.カード説明, "カード説明の領域").toBeVisible();
    項目 = await d.カード説明の項目名();
    note(`カード説明の項目: ${項目.join("、")}`);
  });
  await expected(async () => {
    expect.soft(項目, "カード説明の項目（パワー・タフネス）").not.toContain("パワー・タフネス");
    expect.soft(項目, "カード説明の項目（忠誠度）").not.toContain("忠誠度");
  });
});

// ---- 033・034（数量の増減） ----
caseTest("IT-F05-04-033", async ({ page, notes, step, expected }) => {
  let d!: NetBuyDetailPage;
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-033〕")); await expect(d.数量, "商品数").toHaveValue("1"); });
  await step(2, async () => { await d.プラスを押す(1); });
  await expected(async () => { await expect(d.数量, "商品数").toHaveValue("2"); });
});

caseTest("IT-F05-04-034", async ({ page, notes, step, expected }) => {
  let d!: NetBuyDetailPage;
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-034〕")); await expect(d.数量, "商品数").toHaveValue("1"); });
  await step(2, async () => { await d.プラスを押す(1); await expect(d.数量, "プラスのあとの商品数").toHaveValue("2"); });
  await step(3, async () => { await d.マイナスを押す(1); });
  await expected(async () => { await expect(d.数量, "商品数").toHaveValue("1"); });
});

// ---- 035・036（カートへ追加） ----
function カートへ追加して確かめる(id: string, label: string, プラス: number, 期待の数量: string) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    await カートを空で始める(page);
    const 商品ID = notes.get(label);
    let d!: NetBuyDetailPage;
    const cart = new NetBuyCartPage(page);
    await step(1, async () => { d = await 詳細を開く(page, 商品ID); });
    await step(2, async () => { await d.プラスを押す(プラス); note(`プラスを${プラス}回押したあとの商品数: ${await d.数量.inputValue()}`); });
    await step(3, async () => { const r = await d.カートに追加を押す(); note(`「カートに追加」の応答 ${r.応答}・知らせ「${r.知らせ}」`); });
    await step(4, async () => { await cart.開く(); });
    await expected(async () => {
      expect(await cart.数量(商品ID), `ネット買取カートの商品ID ${商品ID} の行の商品数（${id}）`).toEqual([期待の数量]);
    });
  };
}
caseTest("IT-F05-04-035", カートへ追加して確かめる("035", "〔商品ID-F0504-035〕", 1, "2"));
caseTest("IT-F05-04-036", カートへ追加して確かめる("036", "〔商品ID-F0504-036〕", 19, "20"));

// ---- 037（上限超過と規格の指定なし） ----
caseTest("IT-F05-04-037", async ({ page, notes, step, expected }) => {
  await カートを空で始める(page);
  const 商品ID = notes.get("〔商品ID-F0504-037〕");
  let d!: NetBuyDetailPage;
  const cart = new NetBuyCartPage(page);
  let 手順2 = { 応答: 0, 知らせ: "" };
  let 手順3 = { 応答: 0, 知らせ: "" };
  await step(1, async () => {
    d = await 詳細を開く(page, 商品ID);
    await d.数量を入れる("20");
    await expect(d.数量, "買取数量").toHaveValue("20");
    const r = await d.カートに追加を押す();
    note(`手順1の「カートに追加」: 応答 ${r.応答}・知らせ「${r.知らせ}」`);
  });
  await step(2, async () => {
    await d.再読み込み();
    await expect(d.数量, "再読み込み後の買取数量").toHaveValue("1");
    手順2 = await d.カートに追加を押す();
    note(`手順2の「カートに追加」: 応答 ${手順2.応答}・知らせ「${手順2.知らせ}」`);
  });
  await step(3, async () => {
    await d.再読み込み();
    await d.カートに追加の規格の指定を空にする();
    note("開発者ツールでの書き換えの代わりに、画面のスクリプトで「カートに追加」の規格の指定（data-productclass）を空にした");
    手順3 = await d.カートに追加を押す();
    note(`手順3の「カートに追加」: 応答 ${手順3.応答}・知らせ「${手順3.知らせ}」`);
  });
  await step(4, async () => { await cart.開く(); });
  await expected(async () => {
    expect.soft(手順2.知らせ, "手順2の上限超過のダイアログ（知らせの文）").toBe("同一商品をカートに追加できるのは20点までです。");
    expect.soft(手順3.知らせ, "手順3の「カートに追加」付近の追加失敗の通知（知らせの文）").toBe("カートへの追加に失敗しました。しばらくしてから再度お試しください。");
    expect.soft(await cart.数量(商品ID), `ネット買取カートの商品ID ${商品ID} の商品数`).toEqual(["20"]);
  });
});

// ---- 039（言語・商品クラス未指定） ----
caseTest("IT-F05-04-039", async ({ page, notes, step, expected }) => {
  const p = f0504商品("F0504-CARD-001-039");
  let d!: NetBuyDetailPage;
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-039〕")); });
  await expected(async () => {
    expect.soft(await d.言語ボタンは選択状態("JP"), "先頭言語JPが選択状態").toBe(true);
    await expect.soft(d.価格の表("JP"), "JPの価格の表").toBeVisible();
    expect.soft(await d.選ばれている商品クラス(), "初期表示の商品クラス（JPの先頭JP-NM）").toBe(p.規格["JP-NM"]);
  });
});

// ---- 041（状態別の買取価格） ----
caseTest("IT-F05-04-041", async ({ page, notes, step, expected }) => {
  let 行: string[] = [];
  await step(1, async () => {
    const d = await 詳細を開く(page, notes.get("〔商品ID-F0504-041〕"), { 言語: "JP" });
    行 = await d.見えている価格の行();
    note(`価格の表の行: ${行.join(" / ")}（金額は桁区切りで比べた）`);
  });
  await expected(async () => {
    expect.soft(行.some((r) => /NM/.test(r) && /1,200/.test(r)), "状態JP-NMの行に買取価格1,200円").toBe(true);
    expect.soft(行.some((r) => /EX/.test(r) && /(^|[^\d,])800/.test(r)), "状態JP-EXの行に買取価格800円").toBe(true);
  });
});

// ---- 043（未登録の商品ID） ----
caseTest("IT-F05-04-043", async ({ page, step, expected }) => {
  const 記録: { url: string; status: number }[] = [];
  await step(1, async () => {
    page.on("response", (r) => { if (r.request().resourceType() === "document") 記録.push({ url: r.url(), status: r.status() }); });
    note("開発者ツールの代わりに、ブラウザの画面の要求の応答を記録した");
  });
  await step(2, async () => { await new NetBuyDetailPage(page).開く("999999"); });
  await expected(async () => {
    const hit = 記録.filter((r) => new URL(r.url).pathname.endsWith("/purchase/detail/999999"));
    expect(hit.map((r) => r.status), "商品ID 999999 への要求の応答").toEqual([404]);
  });
});

// ---- 047・048（カード言語ラベル） ----
caseTest("IT-F05-04-047", async ({ page, notes, step, expected }) => {
  const p = f0504商品("F0504-047-A");
  let d!: NetBuyDetailPage;
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-047〕"), { 言語: "EN", 商品クラス: p.規格["EN-NM"] }); });
  await step(2, async () => { note(`商品名「${await d.商品名.innerText()}」・カード言語ラベル「${(await d.言語ラベル.allInnerTexts()).join(",")}」`); });
  await expected(async () => {
    await expect.soft(d.言語ラベル, "商品名とは別のカード言語ラベル").toHaveText("EN");
    await expect.soft(d.商品名, "商品名（言語ラベルを含まない）").toHaveText(rc("F0504-047-A"));
  });
});

caseTest("IT-F05-04-048", async ({ page, notes, step, expected }) => {
  let d!: NetBuyDetailPage;
  let n = -1;
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-048〕")); });
  await step(2, async () => { n = await d.言語ラベル.count(); });
  await expected(async () => { expect(n, "サプライ商品のカード言語ラベルの数").toBe(0); });
});

// ---- 049（査定例はこちら） ----
caseTest("IT-F05-04-049", async ({ page, notes, step, expected }) => {
  const p = f0504商品("F0504-049-A");
  let d!: NetBuyDetailPage;
  let モーダル = -1;
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-049〕"), { 言語: "JP", 商品クラス: p.規格["JP-NM"] }); });
  await step(2, async () => {
    const before = page.url();
    await d.査定例はこちら.click();
    await page.waitForURL((u) => u.toString() !== before, { timeout: 15_000 }).catch(() => undefined);
    await page.waitForLoadState("load");
    モーダル = await d.開いているモーダルの数();
  });
  await expected(async () => {
    expect.soft(モーダル, "商品詳細画面上の開いているモーダルの数").toBe(0);
    expect.soft(new URL(page.url()).pathname, "遷移先（査定例ページ）").toMatch(/\/user_data\/purchase_example$/);
  });
});

// ---- 052・053（数量の上限・下限） ----
caseTest("IT-F05-04-052", async ({ page, notes, step, expected }) => {
  await カートを空で始める(page);
  const 商品ID = notes.get("〔商品ID-F0504-052〕");
  let d!: NetBuyDetailPage;
  const cart = new NetBuyCartPage(page);
  let 最大 = 0;
  await step(1, async () => { d = await 詳細を開く(page, 商品ID); });
  await step(2, async () => {
    for (let i = 0; i < 22; i++) { await d.プラスを押す(1); 最大 = Math.max(最大, Number(await d.数量.inputValue())); }
    note(`プラスを22回押す間の商品数の最大: ${最大}`);
  });
  await step(3, async () => { const r = await d.カートに追加を押す(); note(`「カートに追加」の応答 ${r.応答}・知らせ「${r.知らせ}」`); });
  await step(4, async () => { await cart.開く(); });
  await expected(async () => {
    expect.soft(最大, "プラスを押す間の商品数の最大（21以上にならない）").toBeLessThanOrEqual(20);
    expect.soft(await cart.数量(商品ID), `ネット買取カートの商品ID ${商品ID} の商品数`).toEqual(["20"]);
  });
});

caseTest("IT-F05-04-053", async ({ page, notes, step, expected }) => {
  await カートを空で始める(page);
  const 商品ID = notes.get("〔商品ID-F0504-053〕");
  let d!: NetBuyDetailPage;
  const cart = new NetBuyCartPage(page);
  let 最小 = Infinity;
  await step(1, async () => { d = await 詳細を開く(page, 商品ID); await expect(d.数量, "商品数").toHaveValue("1"); });
  await step(2, async () => {
    let 無効 = 0;
    for (let i = 0; i < 3; i++) { 無効 += await d.マイナスを押す(1); 最小 = Math.min(最小, Number(await d.数量.inputValue())); }
    note(`マイナスを3回押した（うち${無効}回は、画面がマイナスを無効にしていたので、その位置を押した）。押す間の商品数の最小: ${最小}`);
  });
  await step(3, async () => { const r = await d.カートに追加を押す(); note(`「カートに追加」の応答 ${r.応答}・知らせ「${r.知らせ}」`); });
  await step(4, async () => { await cart.開く(); });
  await expected(async () => {
    expect.soft(最小, "マイナスを押す間の商品数の最小（0以下にならない）").toBeGreaterThanOrEqual(1);
    expect.soft(await cart.数量(商品ID), `ネット買取カートの商品ID ${商品ID} の商品数`).toEqual(["1"]);
  });
});

// ---- 057（カートに19点あるところへ1点） ----
caseTest("IT-F05-04-057", async ({ page, notes, step, expected }) => {
  const cookies = f0504カートのCookie.get("S-F05-04-LIMIT19-057");
  if (!cookies) throw new Error("シードがカートに19点入れたブラウザのCookieが無い");
  await page.context().clearCookies();
  await page.context().addCookies(cookies);
  note("シードでネット買取カートに同じ規格を19点入れたブラウザのCookieを、このケースのブラウザへ移して始めた");
  const 商品ID = notes.get("〔商品ID-F0504-057〕");
  let d!: NetBuyDetailPage;
  const cart = new NetBuyCartPage(page);
  let 追加 = { 応答: 0, 知らせ: "" };
  await step(1, async () => { d = await 詳細を開く(page, 商品ID); await expect(d.数量, "買取数量").toHaveValue("1"); });
  await step(2, async () => { 追加 = await d.カートに追加を押す(); note(`「カートに追加」の応答 ${追加.応答}・知らせ「${追加.知らせ}」`); });
  await step(3, async () => { await cart.開く(); });
  await expected(async () => {
    expect.soft(await cart.数量(商品ID), `ネット買取カートの商品ID ${商品ID} の商品数（合計ちょうど20点）`).toEqual(["20"]);
    expect.soft(追加.知らせ, "「カートに追加」のあとの知らせ（上限超過のダイアログでない）").not.toMatch(/までです/);
  });
});

// ---- 058（同じ規格を2回追加） ----
caseTest("IT-F05-04-058", async ({ page, notes, step, expected }) => {
  await カートを空で始める(page);
  const 商品ID = notes.get("〔商品ID-F0504-058〕");
  let d!: NetBuyDetailPage;
  const cart = new NetBuyCartPage(page);
  await step(1, async () => { d = await 詳細を開く(page, 商品ID); });
  await step(2, async () => {
    await d.プラスを押す(1);
    await expect(d.数量, "買取数量").toHaveValue("2");
    const r = await d.カートに追加を押す();
    note(`1回目の「カートに追加」: 応答 ${r.応答}・知らせ「${r.知らせ}」`);
  });
  await step(3, async () => {
    await d.再読み込み();
    await d.プラスを押す(2);
    await expect(d.数量, "買取数量").toHaveValue("3");
    const r = await d.カートに追加を押す();
    note(`2回目の「カートに追加」: 応答 ${r.応答}・知らせ「${r.知らせ}」`);
  });
  await step(4, async () => { await cart.開く(); });
  await expected(async () => {
    expect(await cart.数量(商品ID), `ネット買取カートの商品ID ${商品ID} の行（1行・商品数5）`).toEqual(["5"]);
  });
});

// ---- 059（状態ごとに買取価格が違う） ----
caseTest("IT-F05-04-059", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-F0504-059〕");
  const p = f0504商品("F0504-MIXPRICE-059");
  const 見る = async (d: NetBuyDetailPage) => ({
    数量: await d.数量.count(), マイナス: await d.マイナス.count(), プラス: await d.プラス.count(), カート: await d.カートに追加ボタン.count(),
    選択: await d.選ばれている商品クラス(),
  });
  let nm!: Awaited<ReturnType<typeof 見る>>;
  let ex!: Awaited<ReturnType<typeof 見る>>;
  await step(1, async () => { nm = await 見る(await 詳細を開く(page, id, { 言語: "JP", 商品クラス: p.規格["JP-NM"] })); note(`JP-NM: ${JSON.stringify(nm)}`); });
  await step(2, async () => { ex = await 見る(await 詳細を開く(page, id, { 言語: "JP", 商品クラス: p.規格["JP-EX"] })); note(`JP-EX: ${JSON.stringify(ex)}`); });
  await expected(async () => {
    expect.soft(nm.選択, "手順1で選ばれている商品クラス（JP-NM）").toBe(p.規格["JP-NM"]);
    expect.soft(nm.数量, "JP-NMの商品数の欄の数").toBe(1);
    expect.soft(nm.マイナス, "JP-NMのマイナスボタンの数").toBe(1);
    expect.soft(nm.プラス, "JP-NMのプラスボタンの数").toBe(1);
    expect.soft(nm.カート, "JP-NMのカートに入れるボタンの数").toBe(1);
    expect.soft(ex.選択, "手順2で選ばれている商品クラス（JP-EX）").toBe(p.規格["JP-EX"]);
    expect.soft(ex.数量, "JP-EXの商品数の欄の数").toBe(0);
    expect.soft(ex.マイナス, "JP-EXのマイナスボタンの数").toBe(0);
    expect.soft(ex.プラス, "JP-EXのプラスボタンの数").toBe(0);
    expect.soft(ex.カート, "JP-EXのカートに入れるボタンの数").toBe(0);
  });
});

// ==== 読み替えで実装したケース（005・006・055・060・061・063。依頼者の方針 2026-11-10） ====

// ---- 005（PC版） ----
caseTest("IT-F05-04-005", async ({ page, notes, step, expected }) => {
  let d!: NetBuyDetailPage;
  await step(1, async () => {
    d = await 詳細を開く(page, notes.get("〔商品ID-F0504-005〕"));
    await カテゴリ一覧の描画を待つ(page);
    note("カテゴリ「タルキール：龍嵐録」・販促バナーは、共有のカテゴリを書き換えないため、シード表どおりには用意していない。このケースが確かめる『PC版ではカテゴリ一覧が出て、パンくずリストが出ない』は、商品のカテゴリに依らない画面の作りで確かめた");
  });
  await expected(async () => {
    await expect.soft(d.カテゴリ一覧, "カテゴリ一覧").toBeVisible();
    expect.soft(await d.カテゴリ一覧の第一階層.count(), "カテゴリ一覧の第一階層の項目の数").toBeGreaterThan(0);
    await expect.soft(d.パンくず, "パンくずリスト（PC版では表示されない）").toBeHidden();
  });
});

// ---- 006（販売側のカテゴリ一覧との比較） ----
caseTest("IT-F05-04-006", async ({ page, notes, step, expected }) => {
  let 販売側!: カテゴリ一覧の構成;
  let 買取側!: カテゴリ一覧の構成;
  await step(1, async () => {
    expect(await 販売側の商品一覧を開く(page), "販売側の商品一覧の応答").toBeLessThan(400);
    販売側 = await カテゴリ一覧の構成を読む(page);
    note(`販売側のカテゴリ一覧の構成（枠ごとの第一階層と、先頭の子を持つ項目を展開したときの子）: ${JSON.stringify(販売側)}`);
  });
  await step(2, async () => {
    await 詳細を開く(page, notes.get("〔商品ID-F0504-006〕"));
    買取側 = await カテゴリ一覧の構成を読む(page);
    note(`ネット買取商品詳細のカテゴリ一覧の構成: ${JSON.stringify(買取側)}`);
  });
  await expected(async () => {
    note("ツリーの構成と表示項目は、3つの枠（最新セット・フォーマット別・その他）の第一階層の名称の並びと、各枠の先頭の『子を持つ項目』を展開したときの子の名称の並びで比べた。販促バナーは比べる対象に含めていない（カテゴリの名称だけを読んだ）");
    const latest = 買取側.find((g) => g.枠 === "latest-set");
    const others = 買取側.find((g) => g.枠 === "others");
    expect.soft(latest?.第一階層.length ?? 0, "最新セットの枠の第一階層の数（最新セットのカテゴリが1件以上）").toBeGreaterThan(0);
    expect.soft(others?.第一階層.length ?? 0, "その他の枠の第一階層の数（最新セット以外のカテゴリが1件以上）").toBeGreaterThan(0);
    expect.soft(買取側, "ネット買取商品詳細のカテゴリ一覧の構成が、販売側と同じ").toEqual(販売側);
  });
});

// ---- 055（PC版。カテゴリ一覧のカテゴリを押す） ----
caseTest("IT-F05-04-055", async ({ page, notes, step, expected }) => {
  let d!: NetBuyDetailPage;
  let 移った先!: URL;
  await step(1, async () => {
    d = await 詳細を開く(page, notes.get("〔商品ID-F0504-055A〕"));
    await カテゴリ一覧の描画を待つ(page);
  });
  await step(2, async () => {
    note("カテゴリ「タルキール：龍嵐録」は、実行の印つきのカテゴリ（最新セットの下の親と子）に代えた。子のカテゴリを押した");
    await d.サイドバーの子カテゴリを押す(rc(F0504カテゴリ.最新セットの親), rc(F0504カテゴリ.最新セットの子));
  });
  await step(3, async () => { 移った先 = new URL(page.url()); note(`遷移後の画面のURL: ${移った先.href}`); });
  await expected(async () => {
    note("並び順の指定は、アドレスの中の並び順を指定する項目と読んだ。商品A・Bが一覧に出ることは、検索サービスの索引を使うので確かめていない");
    await expect.soft(page.locator("body.purchase_search"), "ネット買取商品一覧の画面").toHaveCount(1);
    expect.soft(移った先.pathname, "遷移先のアドレス").toMatch(/\/purchase\/search\/cate\/\d+/);
    expect.soft([...移った先.searchParams.keys()].filter((k) => /orderby|sort/i.test(k)), "遷移先のアドレスにある並び順の指定").toEqual([]);
  });
});

// ---- 060・061・063（基本土地の組合せ） ----
/** パワー・タフネスの文「3 / 4」を、スラッシュの前後の空白を除いて比べる */
const 詰める = (s: string | undefined) => (s ?? "").replace(/\s+/g, "");

caseTest("IT-F05-04-060", async ({ page, notes, step, expected }) => {
  const p = f0504商品("F0504-CB060-A");
  let d!: NetBuyDetailPage;
  await step(1, async () => {
    d = await 詳細を開く(page, notes.get("〔商品ID-F0504-060A〕"), { 言語: "EN", 商品クラス: p.規格["EN-EX"] });
    await expect(d.カード説明, "カード説明").toBeVisible();
    note("共通の検索結果が2件の比較商品Bは作っていない（基本土地は同名カードの一覧を出さない作りなので、期待結果の確かめに使わない）");
  });
  await expected(async () => {
    const 説明 = await d.カード説明の値();
    expect.soft(await d.言語ボタンは選択状態("EN"), "言語ENが選択状態").toBe(true);
    expect.soft(await d.選ばれている商品クラス(), "選択状態の商品クラス（EN-EXの商品規格ID）").toBe(p.規格["EN-EX"]);
    expect.soft(詰める(説明["パワー・タフネス"]), "カード説明のパワー・タフネス").toBe("3/4");
    expect.soft(Object.keys(説明), "カード説明の項目名").not.toContain("忠誠度");
    expect.soft(await d.数量.count(), "商品数の欄の数").toBe(0);
    expect.soft(await d.マイナス.count(), "マイナスボタンの数").toBe(0);
    expect.soft(await d.プラス.count(), "プラスボタンの数").toBe(0);
    expect.soft(await d.カートに追加ボタン.count(), "カートに入れるボタンの数").toBe(0);
    expect.soft(await d.同名カードの一覧.count(), "同名カードの一覧の区画の数").toBe(0);
  });
});

caseTest("IT-F05-04-061", async ({ page, notes, step, expected }) => {
  const p = f0504商品("F0504-CB061-A");
  let d!: NetBuyDetailPage;
  await step(1, async () => {
    d = await 詳細を開く(page, notes.get("〔商品ID-F0504-061A〕"), { 言語: "JP", 商品クラス: p.規格["JP-EX"] });
    await expect(d.カード説明, "カード説明").toBeVisible();
    note("共通の検索結果が2件の比較商品Bは作っていない（基本土地は同名カードの一覧を出さない作りなので、期待結果の確かめに使わない）");
  });
  await expected(async () => {
    const 説明 = await d.カード説明の値();
    expect.soft(await d.言語ボタンは選択状態("JP"), "言語JPが選択状態").toBe(true);
    expect.soft(await d.選ばれている商品クラス(), "選択状態の商品クラス（JP-EXの商品規格ID）").toBe(p.規格["JP-EX"]);
    expect.soft(説明["忠誠度"], "カード説明の忠誠度").toBe("5");
    expect.soft(Object.keys(説明), "カード説明の項目名").not.toContain("パワー・タフネス");
    await expect.soft(d.数量, "商品数の欄").toBeVisible();
    await expect.soft(d.数量, "商品数の初期値").toHaveValue("1");
    await expect.soft(d.マイナス, "マイナスボタン").toBeVisible();
    await expect.soft(d.プラス, "プラスボタン").toBeVisible();
    await expect.soft(d.カートに追加ボタン, "カートに入れるボタン").toBeVisible();
    expect.soft(await d.同名カードの一覧.count(), "同名カードの一覧の区画の数").toBe(0);
  });
});

caseTest("IT-F05-04-063", async ({ page, notes, step, expected }) => {
  const p = f0504商品("F0504-CB063-A");
  let d!: NetBuyDetailPage;
  await step(1, async () => {
    d = await 詳細を開く(page, notes.get("〔商品ID-F0504-063A〕"), { 言語: "ZZ", 商品クラス: "UNKNOWN-CLASS" });
    await expect(d.カード説明, "カード説明").toBeVisible();
    note("共通の検索結果が2件の比較商品Bは作っていない（基本土地は同名カードの一覧を出さない作りなので、期待結果の確かめに使わない）");
  });
  await expected(async () => {
    const 説明 = await d.カード説明の値();
    expect.soft(await d.言語ボタンは選択状態("JP"), "先頭言語JPが選択状態").toBe(true);
    expect.soft(await d.選ばれている商品クラス(), "選択状態の商品クラス（JPの先頭の商品クラスJP-NMの商品規格ID）").toBe(p.規格["JP-NM"]);
    expect.soft(詰める(説明["パワー・タフネス"]), "カード説明のパワー・タフネス").toBe("3/4");
    expect.soft(Object.keys(説明), "カード説明の項目名").not.toContain("忠誠度");
    await expect.soft(d.数量, "商品数の欄").toBeVisible();
    await expect.soft(d.数量, "商品数の初期値").toHaveValue("1");
    await expect.soft(d.マイナス, "マイナスボタン").toBeVisible();
    await expect.soft(d.プラス, "プラスボタン").toBeVisible();
    await expect.soft(d.カートに追加ボタン, "カートに入れるボタン").toBeVisible();
    expect.soft(await d.同名カードの一覧.count(), "同名カードの一覧の区画の数").toBe(0);
  });
});
