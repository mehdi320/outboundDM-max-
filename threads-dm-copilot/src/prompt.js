const readline = require('readline');

const VALID_ANSWERS = {
  e: 'envoye',
  p: 'passe',
  x: 'erreur',
  q: 'quitter',
};

function askAction() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = '\nAction ?  [e] envoyé   [p] passer   [x] erreur   [q] quitter > ';

  return new Promise((resolve) => {
    function loop() {
      rl.question(question, (answer) => {
        const key = answer.trim().toLowerCase();
        if (VALID_ANSWERS[key]) {
          rl.close();
          resolve(VALID_ANSWERS[key]);
        } else {
          console.log('Réponse non reconnue, tape e / p / x / q.');
          loop();
        }
      });
    }
    loop();
  });
}

module.exports = { askAction };
