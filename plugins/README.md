# Dünne Shop-Adapter

Jeder Shop hat eigene Hooks, Installation, Release und Checkout-Besonderheiten. **Ein gemeinsamer API-Vertrag, keine fünffache Carrier-Implementierung.**

Minimaler Ablauf:
1. Händler installiert Plugin und aktiviert freiwillig die Verbindung zu Abholwald.
2. Backend erstellt/erteilt einen individuellen Shop-Zugang (kein zentraler öffentlicher Schlüssel).
3. Adapter erkennt nach Abschluss der Bestellung eine tatsächlich gewählte OOH-Versandoption.
4. Adapter erzeugt stabile `event_id` und eine opaque, scoped `shipment_ref`, sendet `ooh.booked` asynchron und wiederholt fehlgeschlagene Übermittlungen.
5. Öffentliche Zähler melden **Buchungen**, nicht tatsächliche Abholungen.

Keine Kundennamen, Adressen, E-Mails oder Klartext-Trackingnummern senden. Adapter dürfen nicht versuchen, neue Carrier-Labels zu erstellen.
