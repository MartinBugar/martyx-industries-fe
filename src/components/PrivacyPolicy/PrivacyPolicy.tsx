import React from 'react';
import './PrivacyPolicy.css';

/**
 * Privacy Policy component - GDPR compliant
 * Implements GDPR Article 13 - Information to be provided where personal data are collected from the data subject
 */
const PrivacyPolicy: React.FC = () => {
    return (
        <div className="privacy-policy-container">
            <div className="privacy-policy-content">
                <h1>Ochrana osobných údajov (Privacy Policy)</h1>
                <p className="last-updated">Posledná aktualizácia: {new Date().toLocaleDateString('sk-SK')}</p>
                <p className="version">Verzia: 1.0</p>

                <section className="policy-section">
                    <h2>1. Prevádzkovateľ osobných údajov</h2>
                    <p>
                        <strong>Martyx Industries</strong><br />
                        Email: <a href="mailto:info@martyx-industries.com">info@martyx-industries.com</a><br />
                        Web: <a href="https://martyx-industries.com">https://martyx-industries.com</a>
                    </p>
                </section>

                <section className="policy-section">
                    <h2>2. Aké osobné údaje zbierame</h2>
                    <p>V súlade s GDPR Article 13(1)(c) spracúvame nasledujúce kategórie osobných údajov:</p>
                    <ul>
                        <li><strong>Identifikačné údaje:</strong> Email, meno, priezvisko</li>
                        <li><strong>Kontaktné údaje:</strong> Telefónne číslo, adresa</li>
                        <li><strong>Technické údaje:</strong> IP adresa, User-Agent, dátum a čas súhlasu</li>
                        <li><strong>Obchodné údaje:</strong> História objednávok, faktúry, platobné informácie</li>
                        <li><strong>Súhlasy:</strong> História súhlasov s GDPR a marketingom</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>3. Účel spracovania a právny základ</h2>
                    <p>Vaše osobné údaje spracúvame na základe nasledujúcich právnych základov (GDPR Article 6):</p>

                    <div className="purpose-item">
                        <h3>a) Registrácia a správa účtu</h3>
                        <p><strong>Právny základ:</strong> Súhlas (GDPR Article 6(1)(a))</p>
                        <p><strong>Účel:</strong> Vytvorenie a správa používateľského účtu</p>
                        <p><strong>Doba uchovávania:</strong> Do zmazania účtu + 30 dní</p>
                    </div>

                    <div className="purpose-item">
                        <h3>b) Spracovanie objednávok</h3>
                        <p><strong>Právny základ:</strong> Plnenie zmluvy (GDPR Article 6(1)(b))</p>
                        <p><strong>Účel:</strong> Vybavenie objednávok, doručenie tovaru, vystavenie faktúr</p>
                        <p><strong>Doba uchovávania:</strong> 10 rokov (zákonná povinnosť - účtovníctvo)</p>
                    </div>

                    <div className="purpose-item">
                        <h3>c) Marketing a newsletter</h3>
                        <p><strong>Právny základ:</strong> Súhlas (GDPR Article 6(1)(a))</p>
                        <p><strong>Účel:</strong> Zasielanie marketingových materiálov a noviniek</p>
                        <p><strong>Doba uchovávania:</strong> Do odvolania súhlasu</p>
                        <p><strong>Poznámka:</strong> Súhlas môžete kedykoľvek odvolať v sekcii GDPR Management</p>
                    </div>

                    <div className="purpose-item">
                        <h3>d) Audit trail a compliance</h3>
                        <p><strong>Právny základ:</strong> Právna povinnosť (GDPR Article 6(1)(c))</p>
                        <p><strong>Účel:</strong> Preukázanie súhlasu, audit GDPR compliance</p>
                        <p><strong>Doba uchovávania:</strong> Neurčito (dôkaz o súhlase)</p>
                    </div>

                    <div className="purpose-item">
                        <h3>e) Ochrana pred podvodmi</h3>
                        <p><strong>Právny základ:</strong> Oprávnený záujem (GDPR Article 6(1)(f))</p>
                        <p><strong>Účel:</strong> Zabránenie zneužitiu, ochrana pred podvodmi</p>
                        <p><strong>Doba uchovávania:</strong> 90 dní (IP adresy)</p>
                    </div>
                </section>

                <section className="policy-section">
                    <h2>4. Príjemcovia osobných údajov</h2>
                    <p>Vaše osobné údaje môžeme zdieľať s nasledujúcimi kategóriami príjemcov:</p>
                    <ul>
                        <li><strong>Poskytovatelia emailových služieb:</strong> Pre zasielanie potvrdení a notifikácií</li>
                        <li><strong>Platobné brány:</strong> Pre spracovanie platieb</li>
                        <li><strong>Dopravcovia:</strong> Pre doručenie tovaru</li>
                        <li><strong>Účtovné služby:</strong> Pre vedenie účtovníctva (10 rokov)</li>
                        <li><strong>Hosting poskytovateľ:</strong> Uloženie databázy</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>5. Vaše práva podľa GDPR</h2>
                    <p>Máte nasledujúce práva týkajúce sa vašich osobných údajov:</p>

                    <div className="right-item">
                        <h3>📋 Právo na prístup (Article 15)</h3>
                        <p>Máte právo získať kópiu všetkých vašich osobných údajov.</p>
                        <p><strong>Ako uplatniť:</strong> V sekcii <a href="/gdpr-management">GDPR Management</a> → "Stiahnuť moje dáta"</p>
                    </div>

                    <div className="right-item">
                        <h3>✏️ Právo na opravu (Article 16)</h3>
                        <p>Máte právo požiadať o opravu nesprávnych údajov.</p>
                        <p><strong>Ako uplatniť:</strong> Kontaktujte nás na info@martyx-industries.com</p>
                    </div>

                    <div className="right-item">
                        <h3>🗑️ Právo na výmaz (Article 17)</h3>
                        <p>Máte právo na vymazanie vašich osobných údajov ("právo byť zabudnutý").</p>
                        <p><strong>Ako uplatniť:</strong> V sekcii <a href="/gdpr-management">GDPR Management</a> → "Zmazať môj účet"</p>
                        <p><strong>Výnimka:</strong> Faktúry musia byť uchovávané 10 rokov (SK zákon č. 431/2002 Z. z.)</p>
                    </div>

                    <div className="right-item">
                        <h3>🚫 Právo odvolať súhlas (Article 7(3))</h3>
                        <p>Môžete kedykoľvek odvolať súhlas s marketingovými materiálmi.</p>
                        <p><strong>Ako uplatniť:</strong> V sekcii <a href="/gdpr-management">GDPR Management</a> → "Odvolať marketing súhlas"</p>
                    </div>

                    <div className="right-item">
                        <h3>📤 Právo na prenosnosť (Article 20)</h3>
                        <p>Máte právo preniesť vaše údaje k inému poskytovateľovi.</p>
                        <p><strong>Ako uplatniť:</strong> Export dát v JSON formáte v sekcii GDPR Management</p>
                    </div>

                    <div className="right-item">
                        <h3>⚖️ Právo podať sťažnosť</h3>
                        <p>Máte právo podať sťažnosť na Úrade na ochranu osobných údajov SR:</p>
                        <p>
                            <strong>Úrad na ochranu osobných údajov Slovenskej republiky</strong><br />
                            Hraničná 12, 820 07 Bratislava<br />
                            Tel: +421 2 3231 3214<br />
                            Email: <a href="mailto:statny.dozor@pdp.gov.sk">statny.dozor@pdp.gov.sk</a><br />
                            Web: <a href="https://dataprotection.gov.sk">https://dataprotection.gov.sk</a>
                        </p>
                    </div>
                </section>

                <section className="policy-section">
                    <h2>6. Bezpečnosť osobných údajov</h2>
                    <p>Implementovali sme nasledujúce bezpečnostné opatrenia (GDPR Article 32):</p>
                    <ul>
                        <li>Šifrovanie dát v prenose (HTTPS/TLS)</li>
                        <li>Hashované heslá (bcrypt)</li>
                        <li>Pseudonymizácia IP adries</li>
                        <li>Prístupové kontroly k databáze</li>
                        <li>Audit trail všetkých zmien súhlasov</li>
                        <li>Pravidelné bezpečnostné audity</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>7. Cookies a tracking</h2>
                    <p>Náš web používa nasledujúce cookies:</p>
                    <ul>
                        <li><strong>Nevyhnutné cookies:</strong> JWT token pre autentifikáciu (session storage)</li>
                        <li><strong>Funkčné cookies:</strong> Jazykové nastavenia (local storage)</li>
                    </ul>
                    <p><strong>Analytické cookies:</strong> Momentálne nepoužívame žiadne analytické nástroje.</p>
                </section>

                <section className="policy-section">
                    <h2>8. Kontakt a dátové požiadavky</h2>
                    <p>Ak máte akékoľvek otázky týkajúce sa ochrany osobných údajov alebo chcete uplatniť vaše práva:</p>
                    <p>
                        <strong>Email:</strong> <a href="mailto:gdpr@martyx-industries.com">gdpr@martyx-industries.com</a><br />
                        <strong>Odozva:</strong> Do 30 dní od prijatia požiadavky
                    </p>
                </section>

                <section className="policy-section">
                    <h2>9. Zmeny Privacy Policy</h2>
                    <p>
                        Vyhradzujeme si právo aktualizovať túto Privacy Policy. O významných zmenách vás budeme informovať emailom.
                        Aktuálna verzia je vždy dostupná na tejto stránke.
                    </p>
                    <p><strong>História verzií:</strong></p>
                    <ul>
                        <li>Verzia 1.0 - {new Date().toLocaleDateString('sk-SK')} - Prvé vydanie</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>10. Aplikovateľné právne predpisy</h2>
                    <ul>
                        <li>GDPR - Nariadenie EÚ 2016/679</li>
                        <li>Zákon č. 18/2018 Z. z. o ochrane osobných údajov (SK)</li>
                        <li>Zákon č. 431/2002 Z. z. o účtovníctve (SK)</li>
                        <li>Zákon č. 22/2004 Z. z. o elektronickom obchode (SK)</li>
                    </ul>
                </section>

                <div className="policy-footer">
                    <p>Ďakujeme za dôveru.</p>
                    <p><strong>Martyx Industries Team</strong></p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
