/**
 * M16-01 トップバナー管理のバナー設定欄（上半分）の読み取り。
 * 言語は「日本語」「英語」のチェックボックスが並ぶ（行ごとに、バナーの ID を名前に持つ）。
 */
import { Page } from "@playwright/test";

export class BannerSettingPage {
  constructor(readonly page: Page) {}

  /** ID が id のバナー行の、言語の選択肢の表示名（上から順） */
  async 言語の選択肢(id: number): Promise<string[]> {
    const boxes = this.page.locator(`input[type=checkbox][name="top_banner[language_${id}][]"]`);
    await boxes.first().waitFor({ state: "attached", timeout: 30_000 });
    return boxes.evaluateAll((els) =>
      els.map((e) => ((e as HTMLInputElement).labels?.[0]?.innerText ?? "").replace(/\s+/g, " ").trim()));
  }
}
