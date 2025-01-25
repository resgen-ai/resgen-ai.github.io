// Draw the full waveform of the audio
function drawWaveform(data, canvas, currentTime, totalTime, promptTime = 3) {
  const ctx = canvas.getContext("2d");
  // console.log((new Date()).getTime());

  const step = Math.ceil(data.length / canvas.width);
  const amp = canvas.height / 2;
  const currentRatio = currentTime / totalTime;
  const promptRatio = promptTime / totalTime;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "transparent"; // Background color
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const barWidth = 2; //4;      // Width of each bar
  const gap = 1; // Space between bars

  let maxVal = 0;
  let sumArray = [];
  for (let i = 0; i < canvas.width; i += barWidth + gap) {
    let sum = 0;
    for (let j = 0; j < step; j++) {
      // const datum = data[(i * step / (barWidth + gap)) + j];
      const datum = Math.abs(data[i * step + j]);
      sum += datum;
    }
    sumArray.push(sum);
    maxVal = Math.max(sum, maxVal);
  }

  for (let i = 0; i < canvas.width; i += barWidth + gap) {
    let mean = sumArray[Math.round(i / (barWidth + gap))] / maxVal;
    mean = Math.pow(mean, 0.8);
    mean = Math.max(mean, 0.05);
    // console.log(maxVal, mean);
    if (i < currentRatio * canvas.width) {
      if (i < promptRatio * canvas.width) {
        ctx.fillStyle = "#8FBDDF"; //"#F06A8A";
      } else {
        ctx.fillStyle = "#9FDE83"; //"#8FBDDF";
      }
    } else {
      ctx.fillStyle = "#858585";
    }
    ctx.beginPath();
    // ctx.fillRect(i, (1 + min) * amp, barWidth, (max - min) * amp);
    ctx.roundRect(i, (1 - mean) * amp, barWidth, 2 * mean * amp, [100]);
    // ctx.stroke();
    ctx.fill();
  }
}

function audioVisualizer(audio, canvas, promptTime = 3) {
  let audioData = null;

  // Set up AudioContext and Analyzer
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  // Fetch and decode the audio file data
  fetch(audio.src)
    .then((response) => response.arrayBuffer())
    .then((data) => audioContext.decodeAudioData(data))
    .then((buffer) => {
      audioData = buffer.getChannelData(0);
      drawWaveform(audioData, canvas, 0, audio.duration, promptTime);
    });

  audio.addEventListener("play", function () {
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
  });

  let userInteracted = false;
  audio.addEventListener("seeking", function () {
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    userInteracted = true;
  });

  // Update waveform display during audio playback
  setInterval(function () {
    if (audio.paused != true || userInteracted) {
      drawWaveform(
        audioData,
        canvas,
        audio.currentTime,
        audio.duration,
        promptTime,
      );
      userInteracted = false;
    }
  }, 50);
}

function divBuilderLibriSpeech(id, data) {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < data["text_list"].length; i++) {
    const copiedNode = document.importNode(
      document.querySelector("#prompt-template").content,
      true,
    );

    // inject values
    const promptText = copiedNode.querySelector(".ditto-prompt-text > span");
    promptText.innerText = data["prompt_text_list"][i];
    const text = copiedNode.querySelector(".ditto-text > span");
    text.innerText = data["text_list"][i];

    const audioOursAll = copiedNode.querySelector(".ditto-audioviz audio");
    audioOursAll.setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "ours_all"),
    );

    const sampleAudioList = copiedNode.querySelectorAll(
      ".ditto-sample-box audio",
    );
    sampleAudioList[0].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "prompt"),
    );
    sampleAudioList[1].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "gt"),
    );
    sampleAudioList[2].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "yourtts"),
    );
    sampleAudioList[3].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "vall-e"),
    );
    sampleAudioList[4].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "clam"),
    );

    const card = copiedNode.querySelectorAll(".ditto-sample-box table tr")
    card.forEach((elm, idx) => {
      elm.removeChild(elm.children[5]);
    });

    // inject functions
    const canvas = copiedNode.querySelector(".ditto-audioviz canvas");
    audioVisualizer(audioOursAll, canvas, data["prompt_time"][i]);

    const toggle = copiedNode.querySelector(".ditto-toggle");
    const sampleBox = copiedNode.querySelector(".ditto-sample-box");
    toggle.children[0].onclick = function () {
      toggle.children[0].classList.remove("show");
      toggle.children[1].classList.add("show");
      sampleBox.classList.add("show");
    };
    toggle.children[1].onclick = function () {
      toggle.children[0].classList.add("show");
      toggle.children[1].classList.remove("show");
      sampleBox.classList.remove("show");
    };
    const openToggle = copiedNode.querySelector(
      ".ditto-toggle div:nth-child(1)",
    );
    const closeToggle = copiedNode.querySelector(
      ".ditto-toggle div:nth-child(2)",
    );

    fragment.appendChild(copiedNode);
  }

  const footnote1 = document.createElement("span");
  footnote1.innerHTML =
    '<sup id="footnote1-1">1</sup><a href="https://edresson.github.io/YourTTS/">https://edresson.github.io/YourTTS/</a><br>';
  const footnote2 = document.createElement("span");
  footnote2.innerHTML =
    '<sup id="footnote1-2">2</sup><a href="https://www.microsoft.com/en-us/research/project/vall-e-x/vall-e/">https://www.microsoft.com/en-us/research/project/vall-e-x/vall-e/</a><br>';
  const footnote3 = document.createElement("span");
  footnote3.innerHTML =
    '<sup id="footnote1-3">3</sup><a href="https://clam-tts.github.io/">https://clam-tts.github.io/</a>';

  fragment.appendChild(footnote1);
  fragment.appendChild(footnote2);
  fragment.appendChild(footnote3);

  const root = document.querySelector(id);
  root.appendChild(fragment);
}

function divBuilder(id, data) {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < data["text_list"].length; i++) {
    const copiedNode = document.importNode(
      document.querySelector("#prompt-template").content,
      true,
    );

    // inject values
    const promptText = copiedNode.querySelector(".ditto-prompt-text > span");
    promptText.innerText = data["prompt_text_list"][i];
    const text = copiedNode.querySelector(".ditto-text > span");
    text.innerText = data["text_list"][i];

    const audioOursAll = copiedNode.querySelector(".ditto-audioviz audio");
    audioOursAll.setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "ours_all"),
    );

    const sampleAudioList = copiedNode.querySelectorAll(
      ".ditto-sample-box audio",
    );
    sampleAudioList[0].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "prompt"),
    );
    sampleAudioList[1].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "gt"),
    );
    sampleAudioList[2].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "yourtts"),
    );
    sampleAudioList[3].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "vall-e"),
    );
    sampleAudioList[4].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "clam"),
    );
    sampleAudioList[5].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "megatts"),
    );

    // inject functions
    const canvas = copiedNode.querySelector(".ditto-audioviz canvas");
    audioVisualizer(audioOursAll, canvas, data["prompt_time"][i]);

    const toggle = copiedNode.querySelector(".ditto-toggle");
    const sampleBox = copiedNode.querySelector(".ditto-sample-box");
    toggle.children[0].onclick = function () {
      toggle.children[0].classList.remove("show");
      toggle.children[1].classList.add("show");
      sampleBox.classList.add("show");
    };
    toggle.children[1].onclick = function () {
      toggle.children[0].classList.add("show");
      toggle.children[1].classList.remove("show");
      sampleBox.classList.remove("show");
    };
    const openToggle = copiedNode.querySelector(
      ".ditto-toggle div:nth-child(1)",
    );
    const closeToggle = copiedNode.querySelector(
      ".ditto-toggle div:nth-child(2)",
    );

    fragment.appendChild(copiedNode);
  }

  const root = document.querySelector(id);
  root.appendChild(fragment);
}

function divBuilderCeleb(id, data) {
  divBuilder(id, data);

  const cards = document.querySelectorAll(id + " .ditto-card");
  for (let i = 0; i < data["text_list"].length; i++) {
    cards[i].querySelector("div:nth-child(1)").innerHTML =
      "<p style='font-weight: bold;'>Celeb: " +
      data["name_list"][i] +
      "</p>" +
      cards[i].querySelector("div:nth-child(1)").innerHTML;
    cards[i]
      .querySelectorAll(".ditto-sample-box table tr")
      .forEach((elm, idx) => {
        elm.removeChild(elm.children[5]);
        elm.removeChild(elm.children[3]);
        elm.removeChild(elm.children[2]);
        elm.removeChild(elm.children[1]);
      });
  }

  const fragment = document.createDocumentFragment();
  const footnote1 = document.createElement("span");
  footnote1.innerHTML =
    '<sup id="footnote3-1">1</sup><a href="https://clam-tts.github.io/">https://clam-tts.github.io/</a>';

  fragment.appendChild(footnote1);

  const root = document.querySelector(id);
  root.appendChild(fragment);
}

function divBuilderAnime(id, data) {
  divBuilder(id, data);

  const cards = document.querySelectorAll(id + " .ditto-card");
  for (let i = 0; i < data["text_list"].length; i++) {
    cards[i].querySelector("div:nth-child(1)").innerHTML =
      "<p style='font-weight: bold;'>Anime: " +
      data["name_list"][i] +
      "</p>" +
      cards[i].querySelector("div:nth-child(1)").innerHTML;
    cards[i]
      .querySelectorAll(".ditto-sample-box table tr")
      .forEach((elm, idx) => {
        elm.removeChild(elm.children[3]);
        elm.removeChild(elm.children[2]);
        elm.removeChild(elm.children[1]);
      });
  }

  const fragment = document.createDocumentFragment();
  const footnote1 = document.createElement("span");
  footnote1.innerHTML =
    '<sup id="footnote4-1">1</sup><a href="https://boostprompt.github.io/boostprompt/">https://boostprompt.github.io/boostprompt/</a>';

  fragment.appendChild(footnote1);

  const root = document.querySelector(id);
  root.appendChild(fragment);
}

const librispeechData = {
  text_list: [
    "They moved thereafter cautiously about the hut groping before and about them to find something to show that Warrenton had fulfilled his mission.",
    "And lay me down in thy cold bed and leave my shining lot.",
    "Number ten, fresh nelly is waiting on you, good night husband.",
    "Yea, his honourable worship is within, but he hath a godly minister or two with him, and likewise a leech.",
    "Instead of shoes, the old man wore boots with turnover tops, and his blue coat had wide cuffs of gold braid.",
    "The army found the people in poverty and left them in comparative wealth.",
    "Thus did this humane and right minded father comfort his unhappy daughter, and her mother embracing her again, did all she could to soothe her feelings.",
    "He was in deep converse with the clerk and entered the hall holding him by the arm",
  ],

  path_template_list: [
    "audios/librispeech/librispeech_61-70970-0024_{}.wav",
    "audios/librispeech/librispeech_908-157963-0027_{}.wav",
    "audios/librispeech/librispeech_1089-134686-0004_{}.wav",
    "audios/librispeech/librispeech_1221-135767-0014_{}.wav",
    "audios/librispeech/librispeech_1284-1180-0002_{}.wav",
    "audios/librispeech/librispeech_4077-13754-0000_{}.wav",
    "audios/librispeech/librispeech_5639-40744-0020_{}.wav",
    "audios/librispeech/librispeech_61-70970-0007_{}.wav",
  ],

  prompt_text_list: [
    "ly descended the ladder and found himself soon upon firm rock",
    "milked cow and tames the fi",
    "paced up and down waiting but he could wait no long",
    "windows the wooden shutters to close over them at",
    "he told his visitors as he lighted a pipe with a",
    "an tribes have generally regarded the religion of the latter day sa",
    "ings were showered upon him by all who saw him",
    "urs passed wearily by and movement could yet be heard about",
  ],
  prompt_time: Array(8).fill(3),
};

const celebData = {
  text_list: [
    "We must unite and harness our strengths, for the fate of our world hangs in the balance.",
    "However, if you choose to stay, know that the truth I unveil may forever alter the course of your journey.",
    "So here we are, trying to catch up, and hoping this day turns around soon.",
    "And sometimes, in both realms, it's not just about shining the brightest, but enduring the longest.",
    "But to those who knew her well, it was a symbol of her unwavering determination and spirit.",
    "We have the responsibility to ensure power and technology are used for the greater good.",
    "Our goal is to bridge communication gaps and preserve the richness of these unique languages.",
  ],

  path_template_list: [
    "audios/famous/optimusprime_{}.wav",
    "audios/famous/sherlock_{}.wav",
    "audios/famous/jessie_{}.wav",
    "audios/famous/caine_{}.wav",
    "audios/famous/rachel_{}.wav",
    "audios/famous/robert_{}.wav",
    "audios/famous/zuck_{}.wav",
  ],
  name_list: [
    "Optimus Prime",
    "Benedict Cumberbatch",
    "Jessie Eisenberg",
    "Michael Caine",
    "Rachel McAdams",
    "Robert Downey Jr.",
    "Mark Zuckerberg",
  ],
  prompt_text_list: [
    "Perhaps, in any case, we had better see some improvement, or this battle may be lost before it has truly begun.",
    "So maybe, that you would prefer to forgo my secret rather than consent to becoming a prisoner here for what might be several days.",
    "I'm starting this, twelve minutes late which is annoying and not my fault. Rachel needed my help and Ziggy would not stop crying.",
    "What you need to be a star in movies is not that different from what you need to be a star in the other universe. It just takes a little more luck.",
    "So far, the ordinary observer, an extraordinary observer might have seen that the chin was very pointed and pronounced. ",
    "They, say the best weapon is one you never have to fire. I respectfully disagree! I prefer, the weapon you only have to fire once! That's how dad did it! that's how America does it! and it's worked out pretty well so far.",
    "Alright so our team developed the first speech to speech AI translation system, that works for languages that are only spoken and not written like Hokkien.",
  ],
  // prompt_time: Array(7).fill(3),
  prompt_time: [8.731, 7.43, 6.873, 8.266, 7.152, 16.718, 8.638],
};

const animeData = {
  text_list: [
    "Let's go drink until we can't feel feelings anymore.",
    "Uh, it's not like the internet to go crazy about something small and stupid.",
    "Then I would never talk to that person about boa constrictors, or primeval forests, or stars. I would bring myself down to his level.",
    "In what a disgraceful light might it not strike so vain a man!",
  ],

  path_template_list: [
    "audios/anime/spongebob_{}.wav",
    "audios/anime/petergriffin_{}.wav",
    "audios/anime/rick_{}.wav",
    "audios/anime/morty_{}.wav",
  ],
  name_list: [
    "Sponge Bob",
    "Peter Griffin",
    "Rick",
    "Morty",
  ],
  prompt_text_list: [
    "My name is Spongebob Squarepants. And I’m gonna tell you about paying.",
    "Well, I, I’m getting something really special too and by special, I don’t mean special like that Kleinman boy down the street. More special, like, like special K the serial.",
    "Yeah, that’s the difference between you and me morty. I never go back to the carpet store.",
    "I’m being serious. Ok?",
  ],
  // prompt_time: Array(7).fill(3),
  prompt_time: [3.239, 9.850, 4.350, 1.750],
};

divBuilderCeleb("#celeb-box", celebData);
//divBuilder("#librispeech-box", librispeechData);
//divBuilder("#vctk-box", vctkData);
let librispeechFlag = false;
let animeFlag = false;

document
  .querySelector(
    'button[data-bs-toggle="tab"][data-bs-target="#librispeech-box"]',
  )
  .addEventListener("shown.bs.tab", function (event) {
    if (!librispeechFlag) {
      librispeechFlag = true;
      divBuilderLibriSpeech("#librispeech-box", librispeechData);
    }
  });
document
  .querySelector('button[data-bs-toggle="tab"][data-bs-target="#anime-box"]')
  .addEventListener("shown.bs.tab", function (event) {
    if (!animeFlag) {
      animeFlag = true;
      divBuilderAnime("#anime-box", animeData);
    }
  });

addEventListener("scroll", (event) => {
  if (document.querySelector("#myTab").offsetTop < window.scrollY) {
    document.querySelector("#fab").classList.add("show");
  } else {
    document.querySelector("#fab").classList.remove("show");
  }
});