# pxt-air530-gps-calliope
MakeCode extension for air-530 GPS module

## Air-530
Das [Air530-modul](https://wiki.seeedstudio.com/Grove-GPS-Air530/) ist ein günstiges seeed-grove modul, dass GPS-Informationen bereitstellt.
Die Ausgabe erfolgt dabei seriell mit 9600 Baud im NMEA-Format.
Das [Datenblatt](https://files.seeedstudio.com/wiki/Grove-GPS_Air_530/Air530_GPS_User_Booklet.V1.7.pdf) ist recht aussagekräftig, aber leider nur auf chinesisch verfügbar.

## NMEA
Das Modul gibt seine Messwerte im NMEA-Format (https://de.wikipedia.org/wiki/NMEA_0183) an die Schnittstelle (auf der seriellen Konsole) aus.
Jeder Datensatz ("sentence", Zeile) beginnt dabei mit einem $, gefolgt von zwei Buchstaben, die die Quelle angeben: GL für Glonass, GA für Gallileo, GP für GPS und GN für eine kombinierte Positionslösung mehrere GNSS
Danach folgen drei Buchstaben für einen Datensatztyp, dann (kommagetrennt) die eigentlichen Daten, und zum Schluss (separiert durch einen *) eine Prüfsumme.

Wichtige Datensätze sind hierbei:
RMC (Minimal-Datensatz mit Zeit, Status, Länge, Breite, Geschwindigkeit, Richtung, Datum, (magnetische Abweichung, nicht beim Air530), Signalintegrität)
GGA: Zeit, Breite, Länge, Qualität, Benutzte Satelliten, Abweichung, Höhe

Interessant ist auch noch der Datensatztyp GSA, der angibt, welche Satelliten-IDs verwendet wurden, bzw. GSV (Satellites in view)
Außerdem setzt der Air-530 noch folgende Datensätze ab, die wir aber nicht benötigen: VTG, TXT, ZDA
www.nmea.de/nmea0183datensaetze.html

Kurz: Wir erhalten folgende Informationen:
Zeit: HHMMSS.mmm (ZDA, RMC, GGA), Datum (ZDA)
Position: Breite (GGA, GLL, RMC), Länge (GGA, GLL, RMC), Höhe (GGA)
Bewegung: Geschwindigkeit (RMC), Richtung (RMC)
Zusatzinfos: Qualität (GGA), benutzte Satelliten (GGA), Abweichung (GGA), Signalintegrität (RMC), Status (RMC)

## Realisierung
Das GPS-Modul Air-530 lässt sich am Arduino seriell (RX, TX) ansprechenm, die Übertragungsrate muss dabei auf 9600 Baud eingestellt sein.
Soweit ich gesehen habe existiert keine aktuelle Implementierung für Calliope.
Hilfreich sind jedoch [TinyGPSplus](https://github.com/mikalhart/TinyGPSPlus), ein [älteres GPS-Plugin](https://github.com/ElectronicCats/pxt-gps), sowie ein [GIST calliope-grove-gps](https://gist.github.com/kvico/92969f73c60c709bbcdb728514f62552).
Außerdem habe ich PerplexityAI bemüht.

TODO: Funktionstests!
TODO: Localisation
TODO: hat der Calliope wirklich nur eine einzige serielle Schnittstelle?
Das macht es schwierig, die Informationen mit WiFi / LoRaWAN zu versenden.
