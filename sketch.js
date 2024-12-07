// Definir ancho y alto del canvas y del video
var w = 640; // Ancho
var h = 480;
var capture;
var previousPixels;
var flow;
var step = 8;

var balls = []; // Arreglo de pelotitas

function setup() {
    createCanvas(w, h);
    capture = createCapture({
        audio: false,
        video: {
            width: w,
            height: h
        }
    }, function () {
        console.log('capture ready.');
    });
    capture.elt.setAttribute('playsinline', ''); // Para móviles
    capture.hide(); // Oculta la captura por defecto para manipularla en el canvas
    flow = new FlowCalculator(step);

    // Crear 20 pelotitas en posiciones aleatorias
    for (let i = 0; i < 20; i++) {
        balls.push(new Ball(random(width), random(height)));
    }
}

function copyImage(src, dst) {
    var n = src.length;
    if (!dst || dst.length != n) dst = new src.constructor(n);
    while (n--) dst[n] = src[n];
    return dst;
}

function same(a1, a2, stride, n) {
    for (var i = 0; i < n; i += stride) {
        if (a1[i] != a2[i]) {
            return false;
        }
    }
    return true;
}

function draw() {
    capture.loadPixels();
    if (capture.pixels.length > 0) {
        if (previousPixels) {
            // Ignorar cuadros duplicados
            if (same(previousPixels, capture.pixels, 4, width)) {
                return;
            }

            flow.calculate(previousPixels, capture.pixels, capture.width, capture.height);
        }
        previousPixels = copyImage(capture.pixels, previousPixels);

        // Aplicar efecto de desplazamiento de píxeles directamente sobre la captura
        applyPixelShiftOnCapture();

        // Mostrar la captura con las modificaciones
        capture.updatePixels();
        image(capture, 0, 0, w, h);

        // Actualizar y dibujar todas las pelotitas
        for (let ball of balls) {
            ball.update(flow.flow);
            ball.display();
        }
    }
}

// Función para aplicar un desplazamiento de píxeles directamente sobre la captura
function applyPixelShiftOnCapture() {
    if (flow.flow && flow.flow.zones.length > 0) {
        flow.flow.zones.forEach(zone => {
            let x = int(zone.x);
            let y = int(zone.y);
            if (x >= 0 && x < capture.width && y >= 0 && y < capture.height) {
                // Calcular el índice del píxel actual
                let index = (y * capture.width + x) * 4;

                // Calcular el nuevo índice desplazado por el flujo
                let newX = constrain(x + int(zone.u * 5), 0, capture.width - 1);
                let newY = constrain(y + int(zone.v * 5), 0, capture.height - 1);
                let newIndex = (newY * capture.width + newX) * 4;

                // Intercambiar colores entre el índice actual y el desplazado
                for (let i = 0; i < 3; i++) {
                    let temp = capture.pixels[newIndex + i];
                    capture.pixels[newIndex + i] = capture.pixels[index + i];
                    capture.pixels[index + i] = temp;
                }
            }
        });
    }
}

// Clase para la pelota
class Ball {
    constructor(x, y) {
        this.pos = createVector(x, y); // Posición
        this.vel = createVector(0, 0); // Velocidad inicial
        this.size = 20; // Tamaño de la pelota
    }

    update(flow) {
        // Aumentar la velocidad basada en el flujo óptico
        if (flow && flow.u != 0 && flow.v != 0) {
            this.vel.x += flow.u * 0.5; // Escala para ajustar el impacto del flujo
            this.vel.y += flow.v * 0.5;
        }

        // Actualizar posición
        this.pos.add(this.vel);

        // Rebote en los bordes
        if (this.pos.x <= 0 || this.pos.x >= width) {
            this.vel.x *= -1; // Invertir dirección en X
            this.pos.x = constrain(this.pos.x, 0, width);
        }
        if (this.pos.y <= 0 || this.pos.y >= height) {
            this.vel.y *= -1; // Invertir dirección en Y
            this.pos.y = constrain(this.pos.y, 0, height);
        }

        // Aplicar un poco de damping para suavizar el movimiento
        this.vel.mult(0.98);
    }

    display() {
        fill(255, 100, 200);
        noStroke();
        ellipse(this.pos.x, this.pos.y, this.size);
    }
}