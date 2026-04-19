const videoInput = document.getElementById("videoInput");
const canvas = document.getElementById("output");
const ctx = canvas.getContext("2d");

let video = document.createElement("video");

let scoreMerah = 0;
let scoreBiru = 0;

let lastActionTime = 0;
let actionCooldown = 2000;
let actionLocked = false;

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

// ================= VIDEO =================
videoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    scoreMerah = 0;
    scoreBiru = 0;
    updateScore();

    video.src = URL.createObjectURL(file);
    video.play();

    video.addEventListener("play", processVideo);
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

// ================= SKELETON =================
function drawLine(a, b) {
    ctx.beginPath();
    ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
    ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 3;
    ctx.stroke();
}

function drawPoint(p) {
    ctx.beginPath();
    ctx.arc(
        p.x * canvas.width,
        p.y * canvas.height,
        5,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = "red";
    ctx.fill();
}

// ================= VIDEO PROCESS =================
async function processVideo() {
    const pose = new Pose({
        locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
    });

    pose.onResults(drawResults);

    async function detect() {
        if (video.paused || video.ended) return;

        await pose.send({ image: video });
        requestAnimationFrame(detect);
    }

    detect();
}

// ================= MAIN ANALYSIS =================
function drawResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (!results.poseLandmarks) return;

    const lm = results.poseLandmarks;

    let shoulderR = lm[12];
    let elbowR = lm[14];
    let wristR = lm[16];

    let shoulderL = lm[11];
    let elbowL = lm[13];
    let wristL = lm[15];

    let angleR = calculateAngle(shoulderR, elbowR, wristR);
    let angleL = calculateAngle(shoulderL, elbowL, wristL);

    // ===== DRAW SKELETON =====
    drawLine(shoulderR, elbowR);
    drawLine(elbowR, wristR);

    drawLine(shoulderL, elbowL);
    drawLine(elbowL, wristL);

    drawPoint(shoulderR);
    drawPoint(elbowR);
    drawPoint(wristR);

    drawPoint(shoulderL);
    drawPoint(elbowL);
    drawPoint(wristL);

    // ===== UI ANGLE =====
    ctx.fillStyle = "lime";
    ctx.font = "28px Arial";
    ctx.fillText("Sudut Kanan: " + Math.round(angleR), 20, 40);
    ctx.fillText("Sudut Kiri: " + Math.round(angleL), 20, 80);

    // ===== SCORING FIX =====
    let now = Date.now();

    if (!actionLocked && now - lastActionTime > actionCooldown) {
        if (angleR > 160 || angleL > 160) {
            scoreMerah += 1;
            showStatus("👊 Pukulan +1");
            updateScore();

            actionLocked = true;
            lastActionTime = now;

            setTimeout(() => {
                actionLocked = false;
            }, actionCooldown);
        }
    }
}

// ================= UI =================
function updateScore() {
    document.getElementById("scoreMerah").innerText = scoreMerah;
    document.getElementById("scoreBiru").innerText = scoreBiru;
}

function showStatus(text) {
    document.getElementById("actionStatus").innerText = text;
}
