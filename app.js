const videoInput = document.getElementById("videoInput");
const canvas = document.getElementById("output");
const ctx = canvas.getContext("2d");

let video = document.createElement("video");

let scoreMerah = 0;
let scoreBiru = 0;
let lastActionTime = 0;

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

// ================= ANGLE FUNCTION =================
function calculateAngle(a, b, c) {
    let radians =
        Math.atan2(c.y - b.y, c.x - b.x) -
        Math.atan2(a.y - b.y, a.x - b.x);

    let angle = Math.abs(radians * 180.0 / Math.PI);

    if (angle > 180) angle = 360 - angle;

    return angle;
}

// ================= PROCESS VIDEO =================
async function processVideo() {
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

    async function detect() {
        if (video.paused || video.ended) return;

        await pose.send({ image: video });
        requestAnimationFrame(detect);
    }

    detect();
}

// ================= DRAW RESULT =================
function drawResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (!results.poseLandmarks) return;

    const lm = results.poseLandmarks;
    let now = Date.now();

    if (now - lastActionTime < 1500) return;

    // ===== PUKULAN =====
    const shoulder = lm[12];
    const elbow = lm[14];
    const wrist = lm[16];

    let armAngle = calculateAngle(shoulder, elbow, wrist);

    if (armAngle > 155) {
        scoreMerah += 1;
        showStatus("👊 Pukulan +1");
        updateScore();
        lastActionTime = now;
        return;
    }

    // ===== TENDANGAN =====
    const hip = lm[24];
    const knee = lm[26];
    const ankle = lm[28];

    let legAngle = calculateAngle(hip, knee, ankle);

    if (legAngle > 160 && ankle.y < knee.y) {
        scoreMerah += 2;
        showStatus("🦵 Tendangan +2");
        updateScore();
        lastActionTime = now;
        return;
    }

    // ===== BANTINGAN =====
    if (Math.abs(shoulder.y - hip.y) > 0.25) {
        scoreMerah += 3;
        showStatus("🤼 Bantingan +3");
        updateScore();
        lastActionTime = now;
        return;
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
