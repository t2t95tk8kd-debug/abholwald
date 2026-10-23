# Abholwald

Offene Community-Plattform für Out-of-Home-Versand (OOH). **Keine Versand-Engine.** MVP-Grundgerüst mit zentraler Event-API, Carrier-Adaptern und schlanken Shop-Connectors.

## Architektur

```
plugins/{woocommerce,shopify,shopware6,prestashop,magento2}
    -> HTTPS + shop-spezifischer Token
api/ -> Auth -> Validation -> Idempotenz -> Event Store -> öffentliches Aggregat
carriers/{dhl,gls,dpd} -> optionale serverseitige Location/Tracking-Adapter
web/ -> Landingpage und Dokumentation
```

Die Carrier-Zugangsdaten liegen **ausschließlich serverseitig** in einem Secret-Manager bzw. in nicht versionierten Umgebungsvariablen, niemals in Plugins oder Git. Ein globaler Carrier-Schlüssel für fremde Shops ist **nicht automatisch zulässig**: Die Freigabe muss je Carrier, API-Produkt, Nutzungszweck, Mandant und Datenverarbeitungsregel vertraglich geprüft werden. Carrier-API-Zugänge ersetzen auch nicht die Versandverträge oder Absenderberechtigung einzelner Händler.

## Abgrenzung

- **Abholwald Connect** meldet erkannte, gültig abgeschlossene OOH-Bestellungen. Keine Carrier-API nötig.
- **Carrier-Module** dienen erst später optional zur Standortsuche oder autorisierten Statusverifikation. Keine Shop-spezifischen Zugangsdaten im Plugin.
- `ooh.booked` erhöht den Zähler **gemeldeter Buchungen**, nicht bestätigter Abholungen.
- `ooh.collected` darf nur mit autorisiertem Nachweis verarbeitet werden.
- Händler müssen der Datenübermittlung zustimmen. Keine Klartext-Sendungsnummern oder Kundenanschriften in Events.

## Projektstatus

Fundament/Vertragsentwurf, **nicht produktionsbereit**. Die Adapter enthalten Integrationsleitfäden, **noch keine installierbaren ZIPs**. Serverstart lokal: `cd api && npm test && npm start` (Node.js 20+). API-Token und Postgres-basierte Persistenz/Outbox werden vor dem öffentlichen Launch benötigt. Der Demo-Server ist nur für lokale Entwicklung; er verfügt über keine persistente Datenbank.

## Sicherheit und Recht

API-Zugang je Shop, HTTPS, serverseitige Schlüsselrotation, Signaturen oder kurzlebige Credentials, Rate-Limits, Replay-Schutz, Audit-Logs, Datenminimierung und Löschfristen vor öffentlichem Betrieb implementieren. Öffentliche Statistik nur als Aggregat, ohne Einzelereignisse. Impressum, Datenschutzerklärung, Händler-Einwilligung/Vertragsgrundlage, Carrier-Lizenzen und Werbeaussagen juristisch prüfen. Virtuelle Pixelbäume sind keine realen Pflanzungen oder nachgewiesene CO2-Einsparungen.
