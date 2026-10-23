# Carrier-Adapter

Einmalig zentral implementierbare **serverseitige** Integrationen. Für den Abholwald-Connect-MVP **nicht erforderlich**.

Gemeinsame Schnittstellen (später): `findLocations(query, context)`, `verifyCollection(shipment, authorization)`.

Jeder Anbieter braucht eine eigene geprüfte Nutzungslizenz, Rate-Limits, Datenverarbeitungsregel und gegebenenfalls Händlerautorisation. Zentrale Betreiber-Schlüssel nur soweit die Carrier ausdrücklich Multi-Tenant-/Plattformnutzung erlauben. Kein Schlüssel im Git-Repository oder Plugin.

Die Unterordner sind bewusst unverknüpfte Platzhalter. Keine fiktiven Carrier-Endpunkte oder vorgetäuschten Live-Zugriffe.
