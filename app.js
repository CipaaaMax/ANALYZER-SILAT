const videoInput = document.getElementById("videoInput");
const canvas = document.getElementById("output");
const ctx = canvas.getContext("2d");

let video = document.createElement("video");
let totalPunch = 0;

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

    totalPunch = 0;
    document.getElementById("punchCount").innerText = totalPunch;

    video.src = URL.createObjectURL(file);
    video.play();

    video.addEventListener("play", processVideo);
});

// ================= MEDIAPIPE =================
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

// ================= DRAW RESULT =================
function drawResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // simulasi punch detection sementara
    totalPunch++;
    document.getElementById("punchCount").innerText = totalPunch;
}
