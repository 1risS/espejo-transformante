class FlowZone {
    constructor(x, y, u, v) {
        this.x = x;
        this.y = y;
        this.u = u; // Horizontal flow
        this.v = v; // Vertical flow
    }
}

class FlowCalculator {
    constructor(step = 8) {
        this.step = step; // Resolution of the optical flow grid
    }

    calculate(oldPixels, newPixels, width, height) {
        let zones = [];
        let step = this.step;

        for (let y = step; y < height - step; y += step) {
            for (let x = step; x < width - step; x += step) {
                let dx = 0, dy = 0;
                let score = 0;

                // Calculate flow vector
                for (let j = -step; j <= step; j++) {
                    for (let i = -step; i <= step; i++) {
                        let oldIndex = ((y + j) * width + (x + i)) * 4;
                        let newIndex = ((y + j) * width + (x + i)) * 4;

                        let oldGray = (oldPixels[oldIndex] + oldPixels[oldIndex + 1] + oldPixels[oldIndex + 2]) / 3;
                        let newGray = (newPixels[newIndex] + newPixels[newIndex + 1] + newPixels[newIndex + 2]) / 3;

                        let diff = oldGray - newGray;
                        dx += i * diff;
                        dy += j * diff;
                        score += Math.abs(diff);
                    }
                }

                if (score > 50) {
                    zones.push(new FlowZone(x, y, dx / score, dy / score));
                }
            }
        }

        this.zones = zones; // Store zones
    }
}
