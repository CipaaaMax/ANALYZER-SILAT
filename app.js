const videoInput = document.getElementById("videoInput");
const canvas = document.getElementById("output");
const ctx = canvas.getContext("2d");

let video = document.createElement("video");

let scoreMerah = 0;
let scoreBiru = 0;

let lastAttackTime = 0;
const COOLDOWN = 1000; // 1 detik biar ga spam

videoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    video.src = URL.createObjectURL(file);
    video.play();
    processVideo();
});

async function processVideo() {
    const pose = new Pose({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
    });

    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    pose.onResults(drawResults);

    async function detect() {
        if (video.paused || video.ended) return;
        await pose.send({ image: video });
        requestAnimationFrame(detect);
    }

    detect();
}

function getBodySize(landmarks) {
    let minY = Math.min(...landmarks.map(p => p.y));
    let maxY = Math.max(...landmarks.map(p => p.y));
    return maxY - minY;
}

function drawResults(results) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    if (!results.poseLandmarks) return;

    // NOTE: Mediapipe default cuma 1 orang
    // workaround: kita tetap pakai 1 tapi simulate posisi lawan
    let lm = results.poseLandmarks;

    drawSkeleton(lm);

    detectAttack(lm);

    drawScoreboard();
}

function drawSkeleton(lm) {
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 2;

    const connections = [
        [11,13],[13,15],
        [12,14],[14,16],
        [11,12],
        [23,24],
        [23,25],[25,27],
        [24,26],[26,28]
    ];

    connections.forEach(([a,b]) => {
        ctx.beginPath();
        ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height);
        ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height);
        ctx.stroke();
    });
}

function distance(a, b) {
    return Math.sqrt(
        Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2)
    );
}

function detectAttack(lm) {
    let now = Date.now();
    if (now - lastAttackTime < COOLDOWN) return;

    let tanganKanan = lm[16];
    let kakiKanan = lm[28];
    let kepala = lm[0];

    // pukulan (dekat kepala)
    if (distance(tanganKanan, kepala) < 0.1) {
        scoreMerah += 1;
        lastAttackTime = now;
    }

    // tendangan
    if (distance(kakiKanan, kepala) < 0.15) {
        scoreMerah += 2;
        lastAttackTime = now;
    }

    // bantingan (posisi badan turun drastis)
    if (lm[0].y > 0.6) {
        scoreMerah += 3;
        lastAttackTime = now;
    }
}

function drawScoreboard() {
    const boxWidth = 250;
    const boxHeight = 80;

    const centerX = canvas.width / 2;

    // background box
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(centerX - boxWidth - 10, canvas.height - 100, boxWidth, boxHeight);
    ctx.fillRect(centerX + 10, canvas.height - 100, boxWidth, boxHeight);

    // MERAH
    ctx.fillStyle = "#ff3b3b";
    ctx.font = "bold 20px Orbitron, monospace";
    ctx.fillText("MERAH", centerX - boxWidth + 20 - 10, canvas.height - 65);

    ctx.font = "bold 32px Orbitron, monospace";
    ctx.fillText(scoreMerah, centerX - boxWidth + 20 - 10, canvas.height - 30);

    // BIRU
    ctx.fillStyle = "#3b8cff";
    ctx.font = "bold 20px Orbitron, monospace";
    ctx.fillText("BIRU", centerX + 30, canvas.height - 65);

    ctx.font = "bold 32px Orbitron, monospace";
    ctx.fillText(scoreBiru, centerX + 30, canvas.height - 30);
}