/**
 * GPS-Funktionen für das Air530 GPS-Modul
 */
//% weight=100 color=#0fbc11 icon="\uf0ac"

enum TimeDateType {
    //% block="Date"
    date,
    //% block="Time"
    time,
    //% block="Date and Time"
    datetime
}
enum PositionType {
    //% block="Latitude"
    lat,
    //% block="Longitude"
    lon,
    //% block="Altitude"
    alt,
    //% block="all position information"
    all
}
enum MoveType {
    //% block="Speed"
    speed,
    //% block="Course"
    course,
    //% block="all movement information"
    all
}

namespace Air530 {
    let rxPin = SerialPin.C16
    let txPin = SerialPin.C17
    let baudRate = BaudRate.BaudRate9600
    let sentences: { [key: string]: string } = { rmc: "", gga: "", gsa: "", gsv: "", zda: "" }

    //% block="Initialize Air-530 GPS with RX $rx TX $tx"
    //% rx.defl=SerialPin.C16 tx.defl=SerialPin.C17
    export function initAir530(rx: SerialPin, tx: SerialPin): void {
        rxPin = rx; txPin = tx; baudRate = BaudRate.BaudRate9600
        serial.redirect(txPin, rxPin, baudRate)
        serial.setRxBufferSize(128)
        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), () => {
            let line = serial.readLine()
            if (validateChecksum(line)) parseNMEA(line)
        })
    }

    function validateChecksum(sentence: string): boolean {
        if (sentence.indexOf('$') !== 0 || sentence.indexOf('*') === -1) return false
        let parts = sentence.split('*')
        let checksum = parseInt(parts[1], 16)
        return parts[0].slice(1).split('').reduce((acc, char) => acc ^ char.charCodeAt(0), 0) === checksum
    }

    function parseNMEA(sentence: string): void {
        let type = sentence.slice(3, 6);
        if (type === "RMC" || type === "GGA" || type === "GSA" || type === "GSV" || type === "ZDA") {
            sentences[type] = sentence
        }
    }

    //% blockId="Air530_getTime" block="GNSS Time and Date $TD"
    //% TD.defl = TimeDateType.DateTime
    export function getTimeAndDate(TD: TimeDateType): string {
        let s = sentences.RMC || sentences.zda
        if (!s) return "Keine Daten"
        let p = s.split(',')
        let time = formatTime(p[1])
        let date = s === sentences.rmc ? formatDate(p[9]) : `${p[4]}-${p[3]}-${p[2]}`
        switch (TD) {
            case TimeDateType.date: return date
            case TimeDateType.time: return time
            case TimeDateType.datetime: return `${date} ${time}`
            default: return "Ungültige Auswahl"
        }
    }


    //% blockId="Air530_getPos" block="GNSS Position $position"
    export function getPosition(position: PositionType): string {
        if (!sentences.gga) return "Keine Daten"
        let p = sentences.gga.split(',')
        let lat = formatCoord(p[2], p[3], "NS")
        let lon = formatCoord(p[4], p[5], "EW")
        let alt = p[9] + p[10]
        switch (position) {
            case PositionType.lat: return "Breite: " + lat
            case PositionType.lon: return "Länge: " + lon
            case PositionType.alt: return "Höhe: " + alt
            case PositionType.all: return `Breite: ${lat}, Länge: ${lon}, Höhe: ${alt}`
            default: return "Ungültige Auswahl"
        }
    }

    //% blockId="Air530_getMovement" block="GNSS Movement $movement"
    export function getMovement(movement: MoveType): string {
        if (!sentences.rmc) return "Keine Daten"
        let p = sentences.rmc.split(',')
        let speed = Math.round(parseFloat(p[7]) * 1.852 * 100) / 100
        let course = p[8]
        switch (movement) {
            case MoveType.speed: return `Geschwindigkeit: ${speed} km/h`
            case MoveType.course: return `Richtung: ${course}°`
            case MoveType.all: return `Geschwindigkeit: ${speed} km/h, Richtung: ${course}°`
            default: return "Ungültige Auswahl"
        }
    }

    //% blockId="Air530_getDetails" block="GNSS Details $info"
    function getDetails(info: number): string {
        let details: (() => string)[] = [
            () => sentences.gsv ? "Satelliten-IDs: " + sentences.gsv.split(',').slice(4).filter((_, i) => i % 4 === 0).join(", ") : "Keine Daten",
            () => sentences.gsv ? "GSV-Daten: " + sentences.gsv : "Keine Daten",
            () => {
                if (!sentences.gga) return "Keine Daten"
                let quality = ["Ungültig", "GPS", "DGPS", "PPS", "RTK", "Float RTK", "Geschätzt", "Manueller Eingabemodus", "Simulationsmodus"][parseInt(sentences.gga.split(',')[6])] || "Unbekannt"
                return "Qualität: " + quality
            },
            () => sentences.gga ? "Benutzte Satelliten: " + sentences.gga.split(',')[7] : "Keine Daten",
            () => sentences.gga ? "HDOP: " + sentences.gga.split(',')[8] : "Keine Daten",
            () => {
                if (!sentences.gsa) return "Keine Daten"
                let integrity = ["", "Keine Korrektur", "2D", "3D"][parseInt(sentences.gsa.split(',')[2])] || "Unbekannt"
                return "Signalintegrität: " + integrity
            },
            () => sentences.rmc ? "Status: " + (sentences.rmc.split(',')[2] === "A" ? "Aktiv" : "Ungültig") : "Keine Daten",
            () => details.slice(0, 7).map(f => f()).join("\n")
        ]
        return info >= 0 && info < details.length ? details[info]() : "Ungültige Auswahl"
    }

    function formatTime(t: string): string {
        return t.length >= 6 ? `${t.substr(0, 2)}:${t.substr(2, 2)}:${t.substr(4, 2)}` : "Ungültig"
    }

    function formatDate(d: string): string {
        return d.length === 6 ? `20${d.substr(4, 2)}-${d.substr(2, 2)}-${d.substr(0, 2)}` : "Ungültig"
    }

    function formatCoord(c: string, d: string, t: string): string {
        if (c && d) {
            let deg = t === "EW" ? c.slice(0, 3) : c.slice(0, 2)
            let min = t === "EW" ? c.slice(3) : c.slice(2)
            return `${deg}° ${min}' ${d}`
        }
        return "Ungültig"
    }
}
