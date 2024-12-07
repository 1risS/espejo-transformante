// FlowCalculator.js
class FlowZone {
    constructor(x, y, u, v) {
        this.x = x;
        this.y = y;
        this.u = u;
        this.v = v;
    }
}

class FlowCalculator {
    constructor(step = 8) {
        this.step = step;
    }

    calculate(oldImage, newImage, width, height) {
        let zones = [];
        let step = this.step;
        let winStep = step * 2 + 1;

        for (let y = step + 1; y < height - step - 1; y += winStep) {
            for (let x = step + 1; x < width - step - 1; x += winStep) {
                let A2 = 0,
                    A1B2 = 0,
                    B1 = 0,
                    C1 = 0,
                    C2 = 0;

                for (let ly = -step; ly <= step; ly++) {
                    for (let lx = -step; lx <= step; lx++) {
                        let address = (y + ly) * width + x + lx;

                        let gradX = newImage[(address - 1) * 4] - newImage[(address + 1) * 4];
                        let gradY = newImage[(address - width) * 4] - newImage[(address + width) * 4];
                        let gradT = oldImage[address * 4] - newImage[address * 4];

                        A2 += gradX * gradX;
                        A1B2 += gradX * gradY;
                        B1 += gradY * gradY;
                        C2 += gradX * gradT;
                        C1 += gradY * gradT;
                    }
                }

                let delta = A1B2 * A1B2 - A2 * B1;

                let u = 0, v = 0;
                if (delta !== 0) {
                    let Idelta = 1 / delta;
                    u = -(C1 * A1B2 - C2 * B1) * Idelta;
                    v = -(A1B2 * C2 - A2 * C1) * Idelta;
                }

                if (Math.abs(u) < winStep && Math.abs(v) < winStep) {
                    zones.push(new FlowZone(x, y, u, v));
                }
            }
        }

        this.zones = zones;
    }
}
