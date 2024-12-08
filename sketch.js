var w = 900; // Width
var h = 600; // Height
var capture;
var previousPixels;
var flow;
var step = 8;

var balls = []; // Array of balls

// Synthesizers for edges
let leftSynth, rightSynth, topSynth, bottomSynth;

let soundEnabled = false; // Declare globally so all functions can access it


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

    // Añade event listener para el botón de sonido
    let toggleSoundButton = document.getElementById("toggle-sound");
    toggleSoundButton.addEventListener("click", toggleSound);
}

function toggleSound() {
    soundEnabled = !soundEnabled; // Toggle the sound state
    const toggleSoundButton = document.getElementById("toggle-sound");
    toggleSoundButton.innerHTML = soundEnabled ? "Sonido OFF" : "Sonido ON";
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
        this.pos = createVector(x, y); // Position
        this.vel = createVector(random(-2, 2), random(-2, 2)); // Initial velocity
        this.size = 30; // Size of the ball
        this.bounceSoundCooldown = { left: 0, right: 0, top: 0, bottom: 0 }; // Cooldown timers for sounds
    }

    update(flow) {
        // Apply optical flow to velocity
        if (flow && flow.zones && flow.zones.length > 0) {
            let closestFlow = this.getClosestFlowZone(flow.zones);
            if (closestFlow) {
                this.vel.x += closestFlow.u * 0.5;
                this.vel.y += closestFlow.v * 0.5;
            }
        }

        // Add damping and limit velocity
        this.vel.mult(0.95);
        this.vel.limit(5);

        // Update position
        this.pos.add(this.vel);

        // Handle edges and play sounds
        this.handleEdges();
    }

    handleEdges() {
        let now = Tone.now(); // Get the current time from Tone.js

        if (this.pos.x <= 0) {
            this.pos.x = 0;
            this.vel.x *= -1;
            if (now > this.bounceSoundCooldown.left) {
                this.playSound(leftSynth, "C4");
                this.bounceSoundCooldown.left = now + 0.2; // Cooldown of 200ms
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
        // Check if sound is enabled before playing
        if (soundEnabled) {
            try {
                synth.triggerAttackRelease(note, "8n", Tone.now());
            } catch (error) {
                console.error("Audio playback error: ", error);
            }
        }
    }

    display() {
        fill(255, 100, 200, 150); // Bubble effect
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
