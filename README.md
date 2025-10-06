# ft_transcendence

This project is not intended to be a portfolio for an incoming internship or other professional
experience. Its purpose is to reveal your ability to become acquainted with acomplete and complex
task using an unfamiliar technology. This situation will inevitably be faced during your career,
and we aim to develop your self-confidence in front of such situations.

Especially on this big and long project, we encourage you to carefully read the entire subject,
consider several possible strategies, think about your design, before startingcoding anything!
Some modules may depend on others, some modules may conflict withothers.
Ft_transcendence will bring many doubts and requires a lot of difficult decisions!
Act wisely :-)

Also, this project is definitely a long run, and a wrong path will lead you to a huge loss
of time. Your project management and team management choices will strongly impact
your timeline and results. Many approaches and tools exist to support you on these topics.
Good luck, and have fun playing Pong!



# Technical Constraints

Backend and database:
- Pure PHP without framework or Framework module
- Database module

Single-page application (SPA)
- une application monopage est une application web qui fonctionne a l'interieur d'une seule page HTML
- utilisation de JavaScript pour ne pas recharger completement une nouvelle page a chaque fois que lutilisateur clique quelque part. la SPA (via JavaScript) met a jour dynamiquement le contenu de la page.

Frameworks JavaScript : React, Vue.js, Angular, Svelte, etc.

J'aimerais utiliser
- PHP : Symfony 
- Python Django


- You must use Docker to run your website. Everything must be launched with a single command line to run an autonomous container.



# The Game

- live Pong on the website, both players use the same keyboard
- tournament system: it must clearly display who is playing against whom and the order of the play
- a registration system: each player must input their alias for the tournament
- matchmaking system: tournament system should organize the matchmaking of the participants and announce the next match



# Security

- password stored in the database must be hashed
- website must be protected against SQL injections / XSS attacks
- HTTPS connection for all aspects should be used (use wss instead of ws for example)
- parse forms on server side AND front end side
- strong password hashing algorithm
- credentials, API keys, env variables must be saved locally in a .env file and ignored by git