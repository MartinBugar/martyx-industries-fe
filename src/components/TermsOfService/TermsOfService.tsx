import React from 'react';
import '../PrivacyPolicy/PrivacyPolicy.css'; // Reuse styles

/**
 * Terms of Service component
 * Obchodné podmienky pre e-shop Martyx Industries
 */
const TermsOfService: React.FC = () => {
    return (
        <div className="privacy-policy-container">
            <div className="privacy-policy-content">
                <h1>Obchodné podmienky (Terms of Service)</h1>
                <p className="last-updated">Posledná aktualizácia: {new Date().toLocaleDateString('sk-SK')}</p>
                <p className="version">Verzia: 1.0</p>

                <section className="policy-section">
                    <h2>1. Všeobecné ustanovenia</h2>
                    <p>
                        Tieto obchodné podmienky upravujú vzájomnéprávne vzťahy medzi predávajúcim a
                        kupujúcim pri nákupe tovaru a služieb prostredníctvom e-shopu Martyx Industries.
                    </p>
                    <p>
                        <strong>Predávajúci:</strong> Martyx Industries<br />
                        <strong>Email:</strong> <a href="mailto:info@martyx-industries.com">info@martyx-industries.com</a><br />
                        <strong>Web:</strong> <a href="https://martyx-industries.com">https://martyx-industries.com</a>
                    </p>
                </section>

                <section className="policy-section">
                    <h2>2. Registrácia a používateľský účet</h2>
                    <h3>2.1 Vytvorenie účtu</h3>
                    <p>Pri registrácii je potrebné:</p>
                    <ul>
                        <li>Poskytnúť pravdivé a aktuálne údaje</li>
                        <li>Súhlasiť s ochranou osobných údajov (povinné)</li>
                        <li>Potvrdiť email adresu kliknutím na aktivačný link</li>
                    </ul>

                    <h3>2.2 Zodpovednosť používateľa</h3>
                    <ul>
                        <li>Zabezpečenie hesla a prístupových údajov</li>
                        <li>Okamžité nahlásenie neoprávneného prístupu</li>
                        <li>Používateľ zodpovedá za všetky aktivity na svojom účte</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>3. Objednávky a kúpna zmluva</h2>
                    <h3>3.1 Vznik kúpnej zmluvy</h3>
                    <p>Kúpna zmluva vzniká:</p>
                    <ol>
                        <li>Vložením tovaru do košíka</li>
                        <li>Vyplnením objednávkového formulára</li>
                        <li>Potvrdením objednávky kupujúcim</li>
                        <li>Prijatím objednávky predávajúcim (potvrdenie emailom)</li>
                    </ol>

                    <h3>3.2 Ceny a platba</h3>
                    <ul>
                        <li>Všetky ceny sú uvedené s DPH (ak je predávajúci platca DPH)</li>
                        <li>Platobné metódy: bankový prevod, platobná karta, online platba</li>
                        <li>Objednávka je spracovaná po pripísaní platby</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>4. Doručenie tovaru</h2>
                    <h3>4.1 Spôsoby doručenia</h3>
                    <ul>
                        <li>Kuriérska služba (2-5 pracovných dní)</li>
                        <li>Slovenská pošta (3-7 pracovných dní)</li>
                        <li>Osobný odber (po dohode)</li>
                    </ul>

                    <h3>4.2 Dodacie lehoty</h3>
                    <p>
                        Dodacie lehoty sú orientačné a závisia od dostupnosti tovaru.
                        V prípade nedostupnosti vás budeme kontaktovať do 3 pracovných dní.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>5. Právo na odstúpenie od zmluvy</h2>
                    <p>
                        V súlade so Zákonom č. 102/2014 Z. z. o ochrane spotrebiteľa pri predaji tovaru alebo poskytovaní služieb
                        na základe zmluvy uzavretej na diaľku, má spotrebiteľ právo odstúpiť od zmluvy do <strong>14 dní</strong>
                        od prevzatia tovaru bez uvedenia dôvodu.
                    </p>

                    <h3>5.1 Postup odstúpenia</h3>
                    <ol>
                        <li>Písomné oznámenie na email: returns@martyx-industries.com</li>
                        <li>Vrátenie tovaru v pôvodnom stave a obale</li>
                        <li>Tovar nesmie vykazovať známky použitia</li>
                        <li>Vrátenie kúpnej ceny do 14 dní od vrátenia tovaru</li>
                    </ol>

                    <h3>5.2 Výnimky z práva na odstúpenie</h3>
                    <p>Právo na odstúpenie sa nevzťahuje na:</p>
                    <ul>
                        <li>Tovar vyrobený na mieru alebo podľa špecifikácie kupujúceho</li>
                        <li>Tovar podliehajúci rýchlej skaze</li>
                        <li>Digitálny obsah (ak bol začatý jeho prenos)</li>
                        <li>Tovar v pošk odenom obale</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>6. Záruka a reklamácie</h2>
                    <h3>6.1 Záručná doba</h3>
                    <p>
                        Záručná doba je <strong>24 mesiacov</strong> od prevzatia tovaru (pokiaľ nie je uvedené inak).
                    </p>

                    <h3>6.2 Uplatnenie reklamácie</h3>
                    <ol>
                        <li>Kontaktujte nás na: reklamacie@martyx-industries.com</li>
                        <li>Uveďte číslo objednávky a popis problému</li>
                        <li>Priložte fotografie (ak je to možné)</li>
                        <li>Vybavíme reklamáciu do 30 dní</li>
                    </ol>

                    <h3>6.3 Spôsoby vybavenia</h3>
                    <ul>
                        <li>Oprava tovaru</li>
                        <li>Výmena za nový tovar</li>
                        <li>Vrátenie kúpnej ceny</li>
                        <li>Poskytnutie primeranej zľavy</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>7. Ochrana osobných údajov (GDPR)</h2>
                    <p>
                        Vaše osobné údaje spracúvame v súlade s GDPR a našou{' '}
                        <a href="/privacy-policy">Privacy Policy</a>.
                    </p>
                    <p><strong>Vaše práva:</strong></p>
                    <ul>
                        <li>Právo na prístup k údajom (Article 15)</li>
                        <li>Právo na opravu (Article 16)</li>
                        <li>Právo na výmaz (Article 17)</li>
                        <li>Právo odvolať súhlas (Article 7(3))</li>
                    </ul>
                    <p>
                        Všetky tieto práva môžete uplatniť v sekcii{' '}
                        <a href="/gdpr-management">GDPR Management</a>.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>8. Zodpovednosť za obsah</h2>
                    <p>
                        Predávajúci nezodpovedá za:
                    </p>
                    <ul>
                        <li>Dočasné technické problémy a výpadky služby</li>
                        <li>Chyby spôsobené tretími stranami (platobné brány, dopravcovia)</li>
                        <li>Nesprávne údaje poskytnuté kupujúcim</li>
                    </ul>
                    <p>
                        Fotografie a popisy produktov sú informatívne a môžu sa mierne líšiť od skutočnosti.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>9. Riešenie sporov</h2>
                    <h3>9.1 Mimosúdne riešenie</h3>
                    <p>
                        Pred podaním súdnej žaloby sa pokúsime vyriešiť spor mimosúdne.
                        Spotrebiteľ môže kontaktovať:
                    </p>
                    <p>
                        <strong>Slovenská obchodná inšpekcia (SOI)</strong><br />
                        Prievozská 32, 827 99 Bratislava<br />
                        Web: <a href="https://www.soi.sk">https://www.soi.sk</a>
                    </p>

                    <h3>9.2 Online riešenie sporov (ODR)</h3>
                    <p>
                        Platforma EÚ pre online riešenie sporov:{' '}
                        <a href="https://ec.europa.eu/consumers/odr">https://ec.europa.eu/consumers/odr</a>
                    </p>
                </section>

                <section className="policy-section">
                    <h2>10. Záverečné ustanovenia</h2>
                    <p>
                        Tieto obchodné podmienky sú platné a účinné od {new Date().toLocaleDateString('sk-SK')}.
                        Predávajúci si vyhradzuje právo zmeniť obchodné podmienky, pričom zmeny budú zverejnené
                        na tejto stránke.
                    </p>

                    <h3>Aplikovateľné právne predpisy:</h3>
                    <ul>
                        <li>Zákon č. 40/1964 Zb. Občiansky zákonník</li>
                        <li>Zákon č. 513/1991 Zb. Obchodný zákonník</li>
                        <li>Zákon č. 102/2014 Z. z. o ochrane spotrebiteľa pri predaji tovaru na diaľku</li>
                        <li>Zákon č. 22/2004 Z. z. o elektronickom obchode</li>
                        <li>GDPR - Nariadenie EÚ 2016/679</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>11. Kontakt</h2>
                    <p>
                        <strong>Martyx Industries</strong><br />
                        Email: <a href="mailto:info@martyx-industries.com">info@martyx-industries.com</a><br />
                        Objednávky: <a href="mailto:orders@martyx-industries.com">orders@martyx-industries.com</a><br />
                        Reklamácie: <a href="mailto:reklamacie@martyx-industries.com">reklamacie@martyx-industries.com</a><br />
                        GDPR: <a href="mailto:gdpr@martyx-industries.com">gdpr@martyx-industries.com</a>
                    </p>
                </section>

                <div className="policy-footer">
                    <p>Ďakujeme za dôveru a prajeme príjemný nákup!</p>
                    <p><strong>Martyx Industries Team</strong></p>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
