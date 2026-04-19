const videoInput = document.getElementById("videoInput");
const canvas = document.getElementById("output");
const ctx = canvas.getContext("2d");

let video = document.createElement("video");

let scoreMerah = 0;
let scoreBiru = 0;
let lastScoreTime = 0;

// ================= LOGIN =================
function login() {
    let user = document.getElementById("username").value;

    if (user.trim() === "") {
        alert("Masukkan username dulu");
        return;
    }

    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    document.getElementById("welcomeUser").innerText = "Welcome, " + user;
}

document.getElementById("loginBtn").addEventListener("click", login);

// ================= VIDEO INPUT =================
videoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    scoreMerah = 0;
    scoreBiru = 0;
    lastScoreTime = 0;
    updateScore();

    document.getElementById("actionStatus").innerText = "Loading video...";

    video.src = URL.createObjectURL(file);
    video.muted = true;

    video.onloadeddata = () => {
        video.play();
        processVideo();
    };
});

// ================= ANGLE =================
function calculateAngle(a, b, c) {
    let radians =
        Math.atan2(c.y - b.y, c.x - b.x) -
        Math.atan2(a.y - b.y, a.x - b.x);

    let angle = Math.abs(radians * 180 / Math.PI);

    if (angle > 180) angle = 360 - angle;

    return angle;
}

// ================= PROCESS =================
async function processVideo() {
    document.getElementById("actionStatus").innerText = "Analisis dimulai...";

    const pose = new Pose({
        locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    pose.onResults(drawResults);

    async function detectFrame() {
        if (video.paused || video.ended) {
            document.getElementById("actionStatus").innerText = "Analisis selesai";
            return;
        }

        await pose.send({ image: video });
        requestAnimationFrame(detectFrame);
    }

    detectFrame();
}

// ================= DRAW =================
function drawResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    if (!results.poseLandmarks) {
        document.getElementById("actionStatus").innerText = "Pose tidak terdeteksi";
        return;
    }

    const lm = results.poseLandmarks;

    const shoulder = lm[12];
    const elbow = lm[14];
    const wrist = lm[16];

    // ===== DRAW SKELETON =====
    drawLine(shoulder, elbow);
    drawLine(elbow, wrist);

    drawPoint(shoulder);
    drawPoint(elbow);
    drawPoint(wrist);

    // ===== CALCULATE ANGLE =====
    let angle = calculateAngle(shoulder, elbow, wrist);

    ctx.fillStyle = "lime";
    ctx.font = "28px Arial";
    ctx.fillText("Sudut: " + Math.round(angle), 20, 40);

    let now = Date.now();

    // ===== SCORING =====
    if (angle > 155 && now - lastScoreTime > 2000) {
        scoreMerah += 1;
        updateScore();

        document.getElementById("actionStatus").innerText =
            "👊 Pukulan terdeteksi +1";

        lastScoreTime = now;
    }
}

// ================= DRAW TOOLS =================
function drawLine(a, b) {
    ctx.beginPath();
    ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
    ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 4;
    ctx.stroke();
}

function drawPoint(p) {
    ctx.beginPath();
    ctx.arc(
        p.x * canvas.width,
        p.y * canvas.height,
        6,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = "red";
    ctx.fill();
}

// ================= UI =================
function updateScore() {
    document.getElementById("scoreMerah").innerText = scoreMerah;
    document.getElementById("scoreBiru").innerText = scoreBiru;
}
