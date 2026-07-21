/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロントネット買取
機能：買取依頼完了
課題カテゴリ：実装漏れ
課題：買取依頼完了画面のオンライン本人確認案内が画像リンクではなくテキストリンクになっている
設計書：0305_基本設計仕様書(フロント_ネット買取).xlsx

# 再現手順【必須】
1. http://localhost:8080/ja/purchase から買取依頼を完了し、買取依頼完了画面を表示する
2. 完了画面のオンライン本人確認案内を確認する
3. 案内が画像として表示され、押下時にオンライン本人確認画面へ遷移するか確認する

# 期待される挙動【必須】
- 買取依頼完了画面に「オンライン本人確認について」を画像として表示する
- その画像を押下するとオンライン本人確認について画面へ遷移する

# 現在の挙動【必須】
- ec-cube-enterprise の買取依頼完了画面は、オンライン本人確認案内について `TODO: デザインタスク QRコード画像を表示する` というコメントを残したまま、`mypage_identification` へのテキストリンクだけを表示している。設計が要求する画像リンクは出力されない。

ec-cube-enterprise 買取依頼完了画面のオンライン本人確認案内: `ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/complete.twig:58-68`
```twig
                        </tr>
                    </tbody>
                </table>

                <p class="ec-para">
                    {# TODO: デザインタスク QRコード画像を表示する #}
                    <a href="{{ path('mypage_identification') }}">{{ 'front.mypage.nav__identification'|trans }}</a>
                </p>

                <div class="submit-button-wrapper">
                    <div class="submit-button-container">
```
- ベース実装 pf-eccube3 では、同じ買取依頼完了画面でオンライン本人確認の説明文を出し、`mypage_identification` へのリンク内に `img/mypage_identification.png` の画像を表示している。

ベース実装 pf-eccube3 買取依頼完了画面のオンライン本人確認画像リンク: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Purchase/complete.twig:45-58`
```twig
                                </tbody>
                            </table>
                            <div class="recommend_online_identification_">
                                <p class="recommend_online_identification--text">
                                    ※オンライン本人確認をお済でないお客様<br>
                                    事前にオンライン本人確認を行うことで、査定金額振込までスムーズに行うことができます。<br>
                                    マイページにある「オンライン本人確認」から本人確認を行う事が可能です。<br>
                                    登録後は簡易書留の送付、及び取引毎の身分証提示が不要となります。<br>
                                    便利なオンライン本人確認をぜひご利用ください。<br>
                                </p>
                                <a href="{{ path('mypage_identification') }}" class="recommend_online_identification--qr">
                                    <img src="{{ path('assets', {path: 'img/mypage_identification.png'}) }}" alt="" />
                                </a>
                            </div>
```

# 根拠
- 設計：
  - オンライン本人確認については画像部品で、押下時にオンライン本人確認について画面へ遷移する: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:3104-3110`
- ec-cube-enterprise：
  - QRコード画像はTODOのままで、テキストリンクのみ表示している: `ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/complete.twig:62-65`
- ベース実装：
  - pf-eccube3ではオンライン本人確認のQR画像リンクを表示している: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Purchase/complete.twig:47-57`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f05-06_0305_sheet-9_sheet.json#f05-06_0305_sheet-9_sheet-conformance-b85abb812e39'`
- 確認コマンド: `rg -n "オンライン本人確認|mypage_identification|recommend_online_identification|QRコード|本人確認" hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書\(フロント_ネット買取\).html ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/complete.twig ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Purchase/complete.twig`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書\(フロント_ネット買取\).html | sed -n '3104,3110p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/complete.twig | sed -n '58,68p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Purchase/complete.twig | sed -n '45,58p'`
