// RBS bit Bluetooth receiver (Roboticschools)
// Turns Bluetooth on (no pairing needed) so the RBS Circuit Lab and the Roboticschools controller app can find the RBS bit,
// and runs the commands they send, one per line:
//   forward, backward, left, right, z (curve left), x (curve right), stop, speed0 … speed255
//     on the RBS bit Driver Expansion Board: left wheels M1 + M3, right wheels M2 + M4 (mounted mirrored, so they turn the other way).
//     If a wheel turns the wrong way, swap that motor's two wires.
//   on, off, red, green, blue, yellow, cyan, magenta, white, rgb off
//     on an RGB LED at P0 (red), P1 (green), P2 (blue); "on" also lights the whole 5 × 5 display.
// Button A stops the motors. Button B scrolls this board's Bluetooth name, the five letters shown in the search list.
// It answers "ok <command>" (or "? <command>") over Bluetooth.

const PCA = 0x40   // the driver board's PCA9685
let ready = false
let speed = 200
let motion = "stop"

function reg(r: number, v: number) {
    const b = pins.createBuffer(2)
    b[0] = r
    b[1] = v
    pins.i2cWriteBuffer(PCA, b)
}
function regRead(r: number): number {
    pins.i2cWriteNumber(PCA, r, NumberFormat.UInt8BE)
    return pins.i2cReadNumber(PCA, NumberFormat.UInt8BE)
}
function initDriver() {   // 50 Hz, as the driver board's own MakeCode extension sets it
    reg(0x00, 0x00)
    const old = regRead(0x00)
    reg(0x00, (old & 0x7F) | 0x10)
    reg(0xFE, 121)
    reg(0x00, old)
    control.waitMicros(5000)
    reg(0x00, old | 0xa1)
    ready = true
}
function pwm(ch: number, off: number) {
    const b = pins.createBuffer(5)
    b[0] = 0x06 + 4 * ch
    b[1] = 0
    b[2] = 0
    b[3] = off & 0xff
    b[4] = (off >> 8) & 0xff
    pins.i2cWriteBuffer(PCA, b)
}
function motor(m: number, v: number) {   // v from -255 to 255
    if (!ready) initDriver()
    let s = v * 16
    if (s > 4095) s = 4095
    if (s < -4095) s = -4095
    const pn = (4 - m) * 2
    const pp = pn + 1
    if (s >= 0) {
        pwm(pp, s)
        pwm(pn, 0)
    } else {
        pwm(pp, 0)
        pwm(pn, -s)
    }
}
function drive(l: number, r: number) {   // + is forward for both sides
    motor(1, l)
    motor(3, l)
    motor(2, -r)
    motor(4, -r)
}
function apply() {
    if (motion == "forward") drive(speed, speed)
    else if (motion == "backward") drive(-speed, -speed)
    else if (motion == "left") drive(-speed, speed)
    else if (motion == "right") drive(speed, -speed)
    else if (motion == "z") drive(0, speed)
    else if (motion == "x") drive(speed, 0)
    else drive(0, 0)
}
function rgb(r: number, g: number, b: number) {
    pins.digitalWritePin(DigitalPin.P0, r)
    pins.digitalWritePin(DigitalPin.P1, g)
    pins.digitalWritePin(DigitalPin.P2, b)
}
function clean(s: string): string {
    let a = 0
    let e = s.length
    while (a < e && s.charCodeAt(a) <= 32) a++
    while (e > a && s.charCodeAt(e - 1) <= 32) e--
    return s.substr(a, e - a)
}
const BT_ICON = images.createImage(`
    . . # # .
    # . # . #
    . # # # .
    # . # . #
    . . # # .
    `)

function run(cmd: string): boolean {
    if (cmd == "forward" || cmd == "backward" || cmd == "left" || cmd == "right" || cmd == "z" || cmd == "x") {
        motion = cmd
        apply()
        if (cmd == "forward") images.arrowImage(ArrowNames.North).showImage(0, 0)
        else if (cmd == "backward") images.arrowImage(ArrowNames.South).showImage(0, 0)
        else if (cmd == "left") images.arrowImage(ArrowNames.West).showImage(0, 0)
        else if (cmd == "right") images.arrowImage(ArrowNames.East).showImage(0, 0)
        else if (cmd == "z") images.arrowImage(ArrowNames.NorthWest).showImage(0, 0)
        else images.arrowImage(ArrowNames.NorthEast).showImage(0, 0)
    } else if (cmd == "stop") {
        motion = "stop"
        apply()
        images.iconImage(IconNames.SmallSquare).showImage(0, 0)
    } else if (cmd.length > 5 && cmd.substr(0, 5) == "speed") {
        const n = parseInt(cmd.substr(5))
        if (!(n >= 0)) return false
        speed = Math.min(255, n)
        if (motion != "stop") apply()
    } else if (cmd == "on") {
        rgb(1, 1, 1)
        for (let i = 0; i < 25; i++) led.plot(i % 5, Math.idiv(i, 5))
    } else if (cmd == "off") {
        rgb(0, 0, 0)
        basic.clearScreen()
    } else if (cmd == "red") rgb(1, 0, 0)
    else if (cmd == "green") rgb(0, 1, 0)
    else if (cmd == "blue") rgb(0, 0, 1)
    else if (cmd == "yellow") rgb(1, 1, 0)
    else if (cmd == "cyan") rgb(0, 1, 1)
    else if (cmd == "magenta") rgb(1, 0, 1)
    else if (cmd == "white") rgb(1, 1, 1)
    else if (cmd == "rgb off") rgb(0, 0, 0)
    else return false
    return true
}

bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    const cmd = clean(bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine)))
    if (cmd.length == 0) return
    bluetooth.uartWriteLine((run(cmd) ? "ok " : "? ") + cmd)
})
bluetooth.onBluetoothConnected(function () {
    images.iconImage(IconNames.Yes).showImage(0, 0)
})
bluetooth.onBluetoothDisconnected(function () {   // the link dropped: stop the wheels
    motion = "stop"
    if (ready) apply()
    BT_ICON.showImage(0, 0)
})
input.onButtonPressed(Button.A, function () {
    motion = "stop"
    if (ready) apply()
    images.iconImage(IconNames.SmallSquare).showImage(0, 0)
})
input.onButtonPressed(Button.B, function () {
    basic.showString(control.deviceName())
    BT_ICON.showImage(0, 0)
})

bluetooth.startUartService()
BT_ICON.showImage(0, 0)
