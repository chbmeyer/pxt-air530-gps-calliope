/**
 * Air530 GNSS(GPS) - Info
 */

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
    //% block="Latitude, Longitude"
    latlon,
    //% block="Altitude"
    alt,
    //% block="all position information"
    all
}
enum MoveType {
    //% block="Speed in km/h"
    speed_kmh,
    //% block="Speed in m/s"
    speed_ms,
    //% block="Course"
    course,
    //% block="all movement information"
    all
}
enum CoordinateFormat {
    //% block="h ddd mm ss.s"
    DMS, // Grad, Minuten, Sekunden
    //% block="h ddd mm.mmm"
    DMM, // Grad, Dezimalminuten
    //% block="h ddd.ddddd"
    DDD  // Dezimalgrad
}

enum InfoType {
    //% block="used Satellites"
    UsedSatellites,
    //% block="quality"
    Quality,
    //% block="HDOP"
    HDOP,
    //% block="status"
    Status
}

//% weight=20 color=#0fbc11 icon="\uf0ac" blockId="GNSS_Air530" block="GNSS Data Air530"
namespace GNSS_Air530 {
    let rxPin = SerialPin.C16
    let txPin = SerialPin.C17
    let baudRate = BaudRate.BaudRate9600
    let sentences: { [key: string]: string } = { RMC: "", GGA: "", GSA: "", GSV: "", ZDA: "" }

    //% blockId="Air530_init" block="Initialize Air-530 GPS with RX $rx TX $tx"
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

    //% blockId="Air530_getTimeAndDate" block="GNSS Time and Date $TD"
    //% TD.defl = TimeDateType.DateTime
    export function getTimeAndDate(TD: TimeDateType): string {
        let s = sentences.RMC || sentences.ZDA
        if (!s) return "No data"
        let p = s.split(',')
        let time = formatTime(p[1])
        let date = s === sentences.RMC ? formatDate(p[9]) : `${p[4]}-${p[3]}-${p[2]}`
        switch (TD) {
            case TimeDateType.date: return date
            case TimeDateType.time: return time
            case TimeDateType.datetime: return `${date} ${time}`
        }
    }


    //% blockId="Air530_getPosition" block="GNSS Position $position, format %format"
    export function getPosition(position: PositionType, format: CoordinateFormat): string {
        if (!sentences.GGA) return "No data"
        let p = sentences.GGA.split(',')
        let lat = formatCoord(p[2], p[3], "NS", format)
        let lon = formatCoord(p[4], p[5], "EW", format)
        let alt = p[9] + p[10]
        switch (position) {
            case PositionType.lat: return lat
            case PositionType.lon: return lon
            case PositionType.latlon: return `${lat}, ${lon}`
            case PositionType.alt: return alt
            case PositionType.all: return `${lat}, ${lon}, Altitude: ${alt}`
        }
    }

    //% blockId="Air530_getMovement" block="GNSS movement $movement"
    export function getMovement(movement: MoveType): string {
        if (!sentences.RMC) return "No data"
        let p = sentences.RMC.split(',')
        let speed_kmh = Math.round(parseFloat(p[7]) * 1.852 * 100) / 100
        let speed_ms = Math.round(parseFloat(p[7]) * 0.51444444444 * 100) / 100
        let course = p[8]
        switch (movement) {
            case MoveType.speed_kmh: return `${speed_kmh}`
            case MoveType.speed_ms: return `${speed_ms}`
            case MoveType.course: return `${course}`
            case MoveType.all: return `Speed: ${speed_kmh} km/h, Course: ${course}°`
        }
    }

    //% blockId="Air530_getDetails" block="GNSS details $info"
    export function getDetails(info: InfoType): string {
        let details: (() => string)[] = [
            () => sentences.GGA ? sentences.GGA.split(',')[7] : "No data", // Benutzte Satelliten
            () => {
                if (!sentences.GGA) return "No data"
                let quality = ["Invalid", "GPS", "DGPS", "PPS", "RTK", "FloatRTK", "Estimated", "Manual", "Simulated"][parseInt(sentences.GGA.split(',')[6])] || "Unknown"
                // siehe: https://github.com/mikalhart/TinyGPSPlus
                // GPS  = 2 - 10 Metern im Freien
                // DGPS = Differential GPS, 0,3 - 2,5 m Genauigkeit
                // RTK  = Real Time Kinematic (zentimetergenau)
                return quality
            },
            () => sentences.GGA ? sentences.GGA.split(',')[8] : "No data", // HDOP
            () => sentences.RMC ? (sentences.RMC.split(',')[2] === "A" ? "Aktiv" : "Invalid") : "No data", // Status
        ]
        return details[info]();
    }

    function formatTime(t: string): string {
        return t.length >= 6 ? `${t.substr(0, 2)}:${t.substr(2, 2)}:${t.substr(4, 2)}` : "Invalid"
    }

    function formatDate(d: string): string {
        return d.length === 6 ? `20${d.substr(4, 2)}-${d.substr(2, 2)}-${d.substr(0, 2)}` : "Invalid"
    }

    function formatCoord(c: string, d: string, t: string, format: CoordinateFormat): string {
        if (c && d) {
            let deg = t === "EW" ? c.slice(0, 3) : c.slice(0, 2);
            let min = t === "EW" ? c.slice(3) : c.slice(2);
            let numericDeg = parseFloat(deg);
            let numericMin = parseFloat(min);

            switch (format) {
                case CoordinateFormat.DMS:
                    let sec = (numericMin % 1) * 60;
                    return `${d}${Math.floor(numericDeg)}° ${Math.floor(numericMin)}' ${Math.round(sec * 100) / 100}"`;
                case CoordinateFormat.DMM:
                    return `${d}${Math.floor(numericDeg)}° ${Math.round(numericMin * 10000) / 10000}'`;
                case CoordinateFormat.DDD:
                    let decimalDeg = numericDeg + (numericMin / 60);
                    return `${d}${Math.round(decimalDeg * 1000000) / 1000000}°`;
                default:
                    return `${d}${deg}° ${min}'`;
            }
        }
        return "Invalid"
    }
}
