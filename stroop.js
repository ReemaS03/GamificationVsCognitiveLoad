const colors = ["red", "green", "blue", "yellow"];
const words = ["RED", "GREEN", "BLUE", "YELLOW"];
let attemptCount = 0;
const maxAttempts = 2;
let wordIndex = 0;
const totalWords = 3;
let stroopData = null;


function generateStroopWord() {
    if (wordIndex >= totalWords) {
        d3.select("#plot-btn").style("display", "block");
        d3.select("#feedback").text("Test Completed! 🥳").style("color", "black");
        return null;
    }

    attemptCount = 0;
    const word = getRandomElement(words);
    let color = getRandomElement(colors);

    while (color.toUpperCase() === word) {  
        color = getRandomElement(colors);
    }

    d3.select("#stroop-word")
        .text(word)
        .style("color", color);


    wordIndex++;
    return { word, color };
}
function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

stroopData = generateStroopWord();
document.addEventListener("keydown", function(event) {
    if (!stroopData) return;

    const keyMap = { 'r': "red", 'g': "green", 'b': "blue", 'y': "yellow" };
    const userResponse = keyMap[event.key.toLowerCase()];

    if (userResponse) {
        attemptCount++;

        if (userResponse === stroopData.color) {
            d3.select("#plot-btn").style("display", "block");
            d3.select("#feedback")
              .text("✅ Correct!")
              .style("color", "green");

            setTimeout(() => {
                d3.select("#feedback").text("");
                stroopData = generateStroopWord();
            }, 1000);
        } 
        else {
            if (attemptCount < maxAttempts) {
                d3.select("#feedback")
                  .text("❌ Incorrect, try again!")
                  .style("color", "red");
            } else {
                d3.select("#feedback")
                  .html(`❌ Incorrect! Correct answer: <strong>${stroopData.color.toUpperCase()}</strong>`)
                  .style("color", "red");

                setTimeout(() => {
                    d3.select("#feedback").text("");
                    stroopData = generateStroopWord();
                }, 1500);
            }
        }
    } else {
        attemptCount++;

        if (attemptCount < maxAttempts) {
            d3.select("#feedback")
              .text("❌ Invalid key! Use R, G, B, or Y.")
              .style("color", "red");
        } else {
            d3.select("#feedback")
              .html(`❌ Incorrect! Correct answer: <strong>${stroopData.color.toUpperCase()}</strong>`)
              .style("color", "red");

            setTimeout(() => {
                d3.select("#feedback").text("");
                stroopData = generateStroopWord();
            }, 1500);
        }
    }
});




