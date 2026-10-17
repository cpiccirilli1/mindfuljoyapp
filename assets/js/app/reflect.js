// Reflect tab: random prompts.
// Part of the Mindful Joy timer page (index.html). Plain script, not a module:
// the files in assets/js/app/ share one scope, so load order in index.html matters.

// ---------- Reflection prompts ----------
const PROMPTS = [
  'What feeling is most present in your body right now?',
  'What are you carrying today that you could set down?',
  'What would it feel like to be fully at ease right now?',
  'What is one thing you are grateful for in this moment?',
  'Where in your body do you feel the most tension?',
  'What would you tell a friend who felt the way you do now?',
  'What does your breath want to tell you today?',
  'What is one small kindness you could offer yourself?',
  'What are you avoiding sitting with right now?',
  'What does stillness feel like for you today?',
  'What is one thought you can let pass without following it?',
  'What intention would you like to carry into the rest of your day?'
];
let lastPrompt = -1;
const reflectText = document.getElementById('reflectText');
document.getElementById('reflectBtn').addEventListener('click', ()=>{
  let idx;
  do { idx = Math.floor(Math.random()*PROMPTS.length); } while(idx===lastPrompt && PROMPTS.length>1);
  lastPrompt = idx;
  reflectText.textContent = PROMPTS[idx];
});
