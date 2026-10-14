/**
 * 「開発者ツールから要求を送信する」「開発者ツールでなりすまし対策トークンを変える」手順のための操作。
 * 画面には無い要求を、ログイン中の画面の中から送る（ログインの状態はそのまま使われる）。
 */
import { Locator, Page } from "@playwright/test";

/** なりすまし対策トークンの扱い。有効＝いまの画面のものをそのまま／なし＝付けない／それ以外の文字列＝その値に変える */
export type Token = "有効" | "なし" | string;

/** いま開いている管理画面の、なりすまし対策トークン */
export async function currentToken(page: Page): Promise<string> {
  const t = await page.locator('meta[name="eccube-csrf-token"]').getAttribute("content");
  if (!t) throw new Error("いまの画面から、なりすまし対策トークンを読めない");
  return t;
}

/**
 * 画面の中にフォームを作って送信する。fields は [項目名, 値] の並び（同じ項目名を複数書ける）。
 * 画面が削除リンクを押したときに送る要求と同じ形（方式は _method、トークンは _token）で送る。
 */
export async function sendForm(page: Page, path: string, fields: [string, string][], token: Token, method?: "DELETE"): Promise<void> {
  const all: [string, string][] = [...fields];
  if (method) all.push(["_method", method]);
  if (token === "有効") all.push(["_token", await currentToken(page)]);
  else if (token !== "なし") all.push(["_token", token]);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.evaluate(([action, items]) => {
      const form = document.createElement("form");
      form.method = "post";
      form.action = action as string;
      for (const [name, value] of items as [string, string][]) {
        const i = document.createElement("input");
        i.type = "hidden"; i.name = name; i.value = value;
        form.appendChild(i);
      }
      document.body.appendChild(form);
      form.submit();
    }, [path, all] as const),
  ]);
}

/** フォームの中のなりすまし対策トークンを、消すか別の値に変える */
export async function tamperToken(form: Locator, token: "なし" | string): Promise<void> {
  const input = form.locator('input[name="_token"], input[name$="[_token]"]');
  if ((await input.count()) !== 1) throw new Error("フォームの中のなりすまし対策トークンを特定できない");
  await input.evaluate((e, t) => { if (t === "なし") e.remove(); else (e as HTMLInputElement).value = t; }, token);
}
