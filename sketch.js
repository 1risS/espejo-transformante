var w = 900; // Width
var h = 600; // Height
var capture;
var previousPixels;
var flow;
var step = 8;

var balls = []; // Array of balls

// Synthesizers for edges
let leftSynth, rightSynth, topSynth, bottomSynth;

function setup() {
    // Selecciona el contenedor donde se insertará el canvas
    let canvas = createCanvas(w, h);
    canvas.parent("canvas-container"); // Asocia el canvas al contenedor

    capture = createCapture({
        audio: false,
        video: {
            width: w,
            height: h
        }
    }, function () {
        console.log('Capture ready.');
    });
    capture.elt.setAttribute('playsinline', ''); // Para móviles
    capture.hide(); // Oculta la captura por defecto
    flow = new FlowCalculator(step);

    // Crear sintetizadores
    leftSynth = new Tone.Synth().toDestination();
    rightSynth = new Tone.Synth().toDestination();
    topSynth = new Tone.Synth().toDestination();
    bottomSynth = new Tone.Synth().toDestination();

    // Crear pelotas en posiciones aleatorias
    for (let i = 0; i < 20; i++) {
        balls.push(new Ball(random(width), random(height)));
    }
}

function draw() {
    capture.loadPixels();
    if (capture.pixels.length > 0) {
        if (previousPixels) {
            flow.calculate(previousPixels, capture.pixels, capture.width, capture.height);
        }
        previousPixels = capture.pixels.slice();

        // Display the video
        image(capture, 0, 0, w, h);

        // Update and draw all balls
        for (let ball of balls) {
            ball.update(flow);
            ball.display();
        }
    }
}

// Ball class
class Ball {
    constructor(x, y) {
        this.pos = createVector(x, y); // Posición
        this.vel = createVector(random(-2, 2), random(-2, 2)); // Velocidad inicial
        this.size = 30; // Tamaño de la pelota
        this.bounceSoundCooldown = { left: 0, right: 0, top: 0, bottom: 0 }; // Temporizadores para sonidos
    }

    update(flow) {
        // Aplicar el flujo óptico a la velocidad
        if (flow && flow.zones && flow.zones.length > 0) {
            let closestFlow = this.getClosestFlowZone(flow.zones);
            if (closestFlow) {
                this.vel.x += closestFlow.u * 0.5; // Ajustar impacto del flujo
                this.vel.y += closestFlow.v * 0.5;
            }
        }

        // Agregar amortiguación para evitar velocidades altas
        this.vel.mult(0.95);

        // Limitar velocidad máxima
        this.vel.limit(5);

        // Actualizar posición
        this.pos.add(this.vel);

        // Manejar los bordes
        this.handleEdges();
    }

    handleEdges() {
        let now = Tone.now(); // Obtener el tiempo actual

        if (this.pos.x <= 0) {
            this.pos.x = 0;
            this.vel.x *= -1;
            if (now > this.bounceSoundCooldown.left) {
                this.playSound(leftSynth, "C4");
                this.bounceSoundCooldown.left = now + 0.2; // 200 ms de enfriamiento
            }
        } else if (this.pos.x >= width) {
            this.pos.x = width;
            this.vel.x *= -1;
            if (now > this.bounceSoundCooldown.right) {
                this.playSound(rightSynth, "E4");
                this.bounceSoundCooldown.right = now + 0.2;
            }
        }

        if (this.pos.y <= 0) {
            this.pos.y = 0;
            this.vel.y *= -1;
            if (now > this.bounceSoundCooldown.top) {
                this.playSound(topSynth, "G4");
                this.bounceSoundCooldown.top = now + 0.2;
            }
        } else if (this.pos.y >= height) {
            this.pos.y = height;
            this.vel.y *= -1;
            if (now > this.bounceSoundCooldown.bottom) {
                this.playSound(bottomSynth, "B4");
                this.bounceSoundCooldown.bottom = now + 0.2;
            }
        }
    }

    playSound(synth, note) {
        try {
            synth.triggerAttackRelease(note, "8n", Tone.now());
        } catch (error) {
            console.error("Audio playback error: ", error);
        }
    }

    display() {
        fill(255, 100, 200, 150); // Añadir transparencia para efecto de burbuja
        noStroke();
        ellipse(this.pos.x, this.pos.y, this.size);
    }

    getClosestFlowZone(zones) {
        let closest = null;
        let minDist = Infinity;

        for (let zone of zones) {
            let d = dist(this.pos.x, this.pos.y, zone.x, zone.y);
            if (d < minDist) {
                minDist = d;
                closest = zone;
            }
        }

        return closest;
    }
}

