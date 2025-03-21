// Total number of birds in the population for the genetic algorithm
let totalPopulation = 1000;
// Array to hold birds that are currently active (haven't collided with a pipe)
let activeBirds = [];
// Array to hold all birds created for a given population
let allBirds = [];
// Array to hold the pipes on the screen
let pipes = [];

// Variables for the UI controls and displays
let speedSlider;
let ss;
let ps;
let speedSpan;
let highScoreSpan;
let allTimeHighScoreSpan;

// Stores the all time high score reached during gameplay
let highScore = 0;
// Counter to track frames for generating pipes
let counter = 0;

// Different game states for user control and various AI modes
let STATE_USER = "USER";
let STATE_BEST_RUN = "BEST RUN";
let STATE_TRAIN = "TRAIN";
let STATE_PRE_TRAINED = "PRE TRAINED";

// Set the initial state to user-controlled mode
let currentState = STATE_USER;

// Flags for handling user input (jumping action)
let goUp = false;
let canGoUp = true;

// Bird objects for different modes of play
let bird;
let bestBird;
let preTrainedBird;
let preTrainedBrain;

// Variables for images used in the game (pipes, birds, and background)
let pipe_up_img;
let pipe_down_img;
let birdImages = [];
let background_img;

// Preload assets such as images and the pre-trained neural network data
function preload() {
  // Load the pre-trained brain for the AI bird
  preTrainedBrain = loadJSON("best_brain.json");
  // Load images for the pipes (upper and lower parts)
  pipe_up_img = loadImage("sprites/pipe-green.png");
  pipe_down_img = loadImage("sprites/pipe-green-down.png");
  // Load images for the bird animation (flapping animation frames)
  birdImages[0] = loadImage("sprites/bluebird-downflap.png");
  birdImages[1] = loadImage("sprites/bluebird-midflap.png");
  birdImages[2] = loadImage("sprites/bluebird-upflap.png");
  // Load the background image for the game
  background_img = loadImage("sprites/background-day.png");
}

// Setup function runs once at the start to initialize the game
function setup() {
  // Create a canvas and assign it to a container in the HTML
  let canvas = createCanvas(600, 400);
  canvas.parent("canvascontainer");

  // Disable text selection on the page for a better game experience
  document.body.style.userSelect = "none";
  document.body.style.webkitUserSelect = "none";
  document.body.style.msUserSelect = "none";
  document.body.style.mozUserSelect = "none";

  // Access and initialize the UI elements
  speedSlider = select("#speedSlider");
  ss = select("#ss");
  ps = select("#ps");
  speedSpan = select("#speed");
  highScoreSpan = select("#hs");
  allTimeHighScoreSpan = select("#ahs");
  // Add event listeners to radio buttons for switching game modes
  let radios = document.getElementsByName("radios");
  for (let i = 0; i < radios.length; i++) {
    radios[i].addEventListener("change", handleRadioChange);
  }

  // Initialize birds for different modes: user-controlled, best run, and pre-trained AI
  bird = new Bird(null, true);
  bestBird = new Bird(null, true);
  preTrainedBird = new Bird(NeuralNetwork.deserialize(preTrainedBrain), false);

  // Create a population of birds for the genetic algorithm training mode
  for (let i = 0; i < totalPopulation; i++) {
    let bird = new Bird(null, true);
    activeBirds[i] = bird;
    allBirds[i] = bird;
  }
}

// The draw function is called repeatedly to update the game state and render the frame
function draw() {
  // Draw the background image repeatedly to fill the canvas width
  for (let i = 0; i < width; i += background_img.width) {
    image(background_img, i, 0);
  }

  // Get the number of cycles (frames) to simulate per draw call from the slider
  let cycles = speedSlider.value();
  // Update the speed display in the UI
  speedSpan.html(cycles);
  // In user mode, force the game to run one cycle per draw call for smoother control
  if (currentState == STATE_USER) {
    cycles = 1;
  }

  // Run the game simulation for the given number of cycles
  for (let n = 0; n < cycles; n++) {
    // Update and display all the pipes on the screen
    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].update();
      // Remove pipes that have moved offscreen
      if (pipes[i].offscreen()) {
        pipes.splice(i, 1);
      }
    }

    // Handle behavior based on the current game state
    if (currentState == STATE_USER) {
      // In user mode, check if the bird should move upward
      if (goUp) {
        bird.up();
        goUp = false;
      }
      // Update bird's position and state
      bird.update();
      // Check collision with each pipe; if hit, reset the game
      for (let j = 0; j < pipes.length; j++) {
        if (pipes[j].hits(bird)) {
          resetGame();
          break;
        }
      }
      // Reset game if the bird goes out of vertical bounds
      if (bird.bottomTop()) {
        resetGame();
      }
    } else if (currentState == STATE_BEST_RUN) {
      // In best run mode, let the best bird use its AI to decide actions
      bestBird.think(pipes);
      bestBird.update();
      // Check for collisions and reset if necessary
      for (let j = 0; j < pipes.length; j++) {
        if (pipes[j].hits(bestBird)) {
          resetGame();
          break;
        }
      }
      if (bestBird.bottomTop()) {
        resetGame();
      }
    } else if (currentState == STATE_PRE_TRAINED) {
      // In pre-trained mode, the pre-trained bird uses its neural network to decide actions
      preTrainedBird.think(pipes);
      preTrainedBird.update();
      // Check for collisions and reset if necessary
      for (let j = 0; j < pipes.length; j++) {
        if (pipes[j].hits(preTrainedBird)) {
          resetGame();
          break;
        }
      }
      if (preTrainedBird.bottomTop()) {
        resetGame();
      }
    } else {
      // In training mode, if only one bird is left, check if it has the highest score so far
      if (activeBirds.length == 1) {
        if (activeBirds[0].score > highScore) {
          highScore = activeBirds[0].score;
          bestBird = activeBirds[0];
        }
      }
      // Iterate through the active birds in reverse order for safe removal during iteration
      for (let i = activeBirds.length - 1; i >= 0; i--) {
        let tmpBird = activeBirds[i];
        // Let each bird use its AI to decide actions
        tmpBird.think(pipes);
        tmpBird.update();

        // Check collision with each pipe; if hit, remove the bird from the active population
        for (let j = 0; j < pipes.length; j++) {
          if (pipes[j].hits(activeBirds[i])) {
            activeBirds.splice(i, 1);
            break;
          }
        }
        // Remove birds that go out of vertical bounds
        if (tmpBird.bottomTop()) {
          activeBirds.splice(i, 1);
        }
      }
    }

    // Add a new pipe periodically based on the counter value
    if (counter % 75 == 0) {
      pipes.push(new Pipe());
    }
    counter++;
  }

  // Determine the current high score based on the game state
  let tempHighScore = 0;
  if (currentState == STATE_USER) {
    tempHighScore = bird.score;
    if (tempHighScore > highScore) {
      highScore = tempHighScore;
    }
  } else if (currentState == STATE_BEST_RUN) {
    tempHighScore = bestBird.score;
    if (tempHighScore > highScore) {
      highScore = tempHighScore;
    }
  } else if (currentState == STATE_PRE_TRAINED) {
    tempHighScore = preTrainedBird.score;
    if (tempHighScore > highScore) {
      highScore = tempHighScore;
    }
  } else {
    // In training mode, find the bird with the highest score in the active population
    let tempBestBird = null;
    for (let i = 0; i < activeBirds.length; i++) {
      let s = activeBirds[i].score;
      if (s > tempHighScore) {
        tempHighScore = s;
        tempBestBird = activeBirds[i];
      }
    }
    // Update the overall high score if a better score is found and store the best bird
    if (tempHighScore > highScore) {
      highScore = tempHighScore;
      bestBird = tempBestBird;
    }
  }

  // Update the high score displays in the DOM
  highScoreSpan.html(tempHighScore);
  allTimeHighScoreSpan.html(highScore);

  // Render all pipes on the screen
  for (let i = 0; i < pipes.length; i++) {
    pipes[i].show();
  }

  // Render the bird(s) based on the current game state
  if (currentState == STATE_USER) {
    bird.show();
  } else if (currentState == STATE_BEST_RUN) {
    bestBird.show();
  } else if (currentState == STATE_PRE_TRAINED) {
    preTrainedBird.show();
  } else {
    // In training mode, show all active birds
    for (let i = 0; i < activeBirds.length; i++) {
      activeBirds[i].show();
    }
    // If all birds have been removed (they all collided), trigger the next generation
    if (activeBirds.length == 0) {
      nextGeneration();
    }
  }
}

// Function to reset the game state after a collision or when the bird goes offscreen
function resetGame() {
  counter = 0;
  // Reset the score and position for the user-controlled bird
  if (bird) {
    bird.score = 0;
    bird.reset(null, true);
  }
  // Reset the best bird's score and vertical position
  if (bestBird) {
    bestBird.score = 0;
    bestBird.y = height / 2;
  }
  // Reset the pre-trained bird's score and vertical position
  if (preTrainedBird) {
    preTrainedBird.score = 0;
    preTrainedBird.y = height / 2;
  }
  // Clear all pipes from the screen
  pipes = [];
}

// Listen for key press events to capture user input
function keyPressed() {
  if (key == " ") {
    birdUp(key);
  }
}

// Function to trigger the bird's upward movement when appropriate
function birdUp(key) {
  // Only allow jump if in user-controlled mode and space key is pressed
  if (currentState == STATE_USER && key === " ") {
    goUp = true;
    canGoUp = false;
    // Prevent continuous jumping by adding a short delay before allowing the next jump
    setTimeout(() => {
      canGoUp = true;
    }, 75);
  }
}

// Handle changes in radio button selection to switch game modes
function handleRadioChange() {
  // Get the selected value from the radio buttons
  let selectedValue = document.querySelector(
    'input[name="radios"]:checked'
  ).value;
  currentState = selectedValue;
  // Toggle display of UI elements based on selected game mode
  if (currentState == STATE_USER) {
    ss.style("display", "none");
    ps.style("display", "block");
  } else {
    ss.style("display", "block");
    ps.style("display", "none");
  }
  // Reset the game state whenever the game mode is changed
  resetGame();
}

// Listen for mouse press events to trigger the bird's upward movement in user mode
function mousePressed() {
  if (currentState == STATE_USER) {
    birdUp(" ");
  }
}

// Listen for touch events to trigger the bird's upward movement on touch devices
function touchStarted() {
  if (currentState == STATE_USER) {
    birdUp(" ");
  }
  // Prevent default touch behavior (e.g., scrolling)
  return true;
}
