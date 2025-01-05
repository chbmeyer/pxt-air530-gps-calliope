# pxt-air530-gps-calliope
MakeCode Erweiterung für das air-530 GPS-Modul

![grafik](https://github.com/user-attachments/assets/afce1c66-bf7c-4262-9194-4c8be8d8fd62)

## Air-530
Das [Air530-modul](https://wiki.seeedstudio.com/Grove-GPS-Air530/) ist ein günstiges seeed-grove modul, dass GPS-Informationen bereitstellt.
Die Ausgabe erfolgt dabei seriell mit 9600 Baud im NMEA-Format.
Das [Datenblatt](https://files.seeedstudio.com/wiki/Grove-GPS_Air_530/Air530_GPS_User_Booklet.V1.7.pdf) ist recht aussagekräftig, aber leider nur auf chinesisch verfügbar.

## NMEA
Das Modul gibt seine Messwerte im NMEA-Format (https://de.wikipedia.org/wiki/NMEA_0183) an die Schnittstelle (auf der seriellen Konsole) aus.
Jeder Datensatz ("sentence", Zeile) beginnt dabei mit einem $, gefolgt von zwei Buchstaben, die die Quelle angeben: GL für Glonass, GA für Gallileo, GP für GPS und GN für eine kombinierte Positionslösung mehrere GNSS
Danach folgen drei Buchstaben für einen Datensatztyp, dann (kommagetrennt) die eigentlichen Daten, und zum Schluss (separiert durch einen *) eine Prüfsumme.

Wichtige Datensätze sind hierbei ([Übersicht über die NMEA-Datensätze](https://www.nmea.de/nmea0183datensaetze.html)):
- RMC (Minimal-Datensatz mit Zeit, Status, Länge, Breite, Geschwindigkeit, Richtung, Datum, (magnetische Abweichung, nicht beim Air530), Signalintegrität)
- GGA: Zeit, Breite, Länge, Qualität, Benutzte Satelliten, Abweichung, Höhe

Interessant ist auch noch der Datensatztyp GSA, der angibt, welche Satelliten-IDs verwendet wurden, bzw. GSV (Satellites in view)
Außerdem setzt der Air-530 noch folgende Datensätze ab, die wir aber nicht zwingend benötigen: VTG, TXT, ZDA

**Kurz**: Wir erhalten folgende Informationen:
- Zeit: HHMMSS.mmm (ZDA, RMC, GGA), Datum (ZDA)
- Position: Breite (GGA, GLL, RMC), Länge (GGA, GLL, RMC), Höhe (GGA)
- Bewegung: Geschwindigkeit (RMC), Richtung (RMC)
- Zusatzinfos: benutzte Satelliten (GGA), Qualität (GGA), HDOP ("Horizontale Genauigkeitsverschlechterung", GGA), Status (RMC)

## Realisierung
Das GPS-Modul Air-530 lässt sich am Arduino seriell (RX, TX) ansprechen, die Übertragungsrate muss dabei auf 9600 Baud eingestellt sein.
Soweit ich gesehen habe existierte bislang keine Implementierung für Calliope.

Hilfreich sind jedoch [TinyGPSplus](https://github.com/mikalhart/TinyGPSPlus), ein [älteres GPS-Plugin](https://github.com/ElectronicCats/pxt-gps), sowie ein [GIST calliope-grove-gps](https://gist.github.com/kvico/92969f73c60c709bbcdb728514f62552).
Außerdem habe ich PerplexityAI bemüht und dabei die Vorschläge nachvollzogen und überprüft.

**TODO: hat der Calliope wirklich nur eine einzige serielle Schnittstelle?**
Das macht es schwierig, die Informationen mit WiFi / LoRaWAN zu versenden.

**Technischer Ablauf:**
Die NMEA-Daten werden kontinuierlich über die serielle Schnittstelle eingelesen, anhand ihrer Prüfsumme überprüft und in passenden Variablen abgelegt.
Die einzelnen Blöcke lesen die gespeicherten Informationen aus den Variablen und geben das gewünschte Format zurück.

## Detailinformationen
- UsedSatellites,
- Quality ("Ungültig", "GPS", "DGPS", "PPS", "RTK", "Float RTK", "Geschätzt", "Manueller Eingabemodus", "Simulationsmodus")
- HDOP ("Horizontal Dilution of Precision" oder auf Deutsch "Horizontale Genauigkeitsverschlechterung"), beeinflusst durch die geometrische Anordnung der Satelliten.
   - Ein HDOP-Wert von 1,0 zeigt an, dass die GPS-Satelliten sehr präzise sind und dass der Empfänger mindestens vier Satelliten sieht, was eine genaue Positionsbestimmung ermöglicht.
   - Ein HDOP-Wert von 2,0 oder höher zeigt eine schlechtere Genauigkeit an, da die GPS-Satelliten möglicherweise schwer zu orten sind oder dass der Empfänger nicht genügend Satelliten sieht.
   - In der Regel gilt ein HDOP-Wert unter 2,0 als ausreichend genau für die meisten Anwendungen.
- Status (A = Aktiv bzw. gültig und V = Void bzw. ungültig)

- Der GSV-Datensatz ist sehr interessant und ergiebig. Da ein Datensatz maximal vier Satelliten umfassen kann, gibt es häufig mehrere GSV-Nachrichten für alle verschiedenen GNSS. In einer Abwägung von Aufwand und Nutzen kam ich zum Ergebnis, dass dies für den schulischen IoT-Einsatz zu komplex wäre. Nicht implementiert sind daher z.B.:
   - PRN (Identifikationsnummer) jedes Satelliten
   - Elevation (Höhenwinkel) jedes Satelliten
   - Azimut (Richtungswinkel) jedes Satelliten
   - Signal-Rausch-Verhältnis (SNR) jedes Satelliten
 

## Als Erweiterung verwenden

Dieses Repository kann als **Erweiterung** in MakeCode hinzugefügt werden.

* öffne [https://makecode.calliope.cc/](https://makecode.calliope.cc/)
* klicke auf **Neues Projekt**
* klicke auf **Erweiterungen** unter dem Zahnrad-Menü
* nach **https://github.com/chbmeyer/pxt-air530-gps-calliope** suchen und importieren

### Dieses Projekt bearbeiten und weiterentwickeln

Um dieses Repository in MakeCode zu bearbeiten.

* öffne [https://makecode.calliope.cc/](https://makecode.calliope.cc/)
* klicke auf **Importieren** und dann auf **Importiere URL**
* füge **https://github.com/chbmeyer/pxt-air530-gps-calliope** ein und klicke auf Importieren
