const analyzeBtn = document.getElementById("analyzeBtn");

analyzeBtn.addEventListener("click", () => {

    const youtubeLink = document.getElementById("youtubeLink").value;

    if(youtubeLink === ""){
        alert("Please paste YouTube link!");
        return;
    }

    const videoId = getYoutubeVideoId(youtubeLink);

    if(!videoId){
        alert("Invalid YouTube Link!");
        return;
    }

    const iframe = document.getElementById("videoFrame");

    iframe.src = `https://www.youtube.com/embed/${videoId}`;

    runFakeAnalysis();

});


function getYoutubeVideoId(url){

    const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;

    const match = url.match(regExp);

    return match ? match[1] : null;
}


function runFakeAnalysis(){

    const kickCount = Math.floor(Math.random() * 50);
    const punchCount = Math.floor(Math.random() * 40);

    const movements = ["Low", "Medium", "High"];

    const movementLevel =
        movements[Math.floor(Math.random() * movements.length)];

    document.getElementById("kickCount").innerText = kickCount;

    document.getElementById("punchCount").innerText = punchCount;

    document.getElementById("movementLevel").innerText = movementLevel;

}
