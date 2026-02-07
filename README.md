Team Name:
TEEN KHWATEEN

Team Members:
Rameen Fatima Ali
Hania Qaisar
Aeima Naveed

Scenario:
ANONYMOUS CAMPUS RUMOR SYSTEM


Objective:
Building a decentralized, anonymous rumor verification platform. Creating a space where users can post and verify information without ever revealing who they are. Instead of trusting "identities," the system trusts interaction patterns.

The Core Issue:
On a college campus, rumors spread fast, and there is no easy way to know what is real. If we use a central authority (like an admin) to moderate, we lose anonymity and trust. If we use simple "likes" or "upvotes," it is incredibly easy for one person to create 50 fake accounts and make a lie look like the truth.
Right now, there is no way for a group of anonymous people to reach a reliable consensus without being vulnerable to coordinated attacks or bots.

Assumptions Made:
Limited Resources:
   	We're assuming the person trying to cheat doesn't have a supercomputer. They have a normal laptop or a botnet, but their power is limited.
Browser Storage:
   	We're assuming students will use the same browser. We will store a secret key in their browser so the system remembers them as a consistent user 	without ever knowing their name or ID.
The NUST Scale:
 	The system is designed for a campus-sized crowd, where rumors have a short life cycle.
Identity Persistence:
 	We're assuming that once a student is assigned an anonymous ID (like User_9940), they will keep using that same ID from their browser.


Problem Solution:
When a student first opens the web app, they aren't asked for an email or a NUST ID. Instead, the browser automatically generates a Public/Private Key pair and saves it in localStorage.

The Identity: The app assigns them a random name, like User_5592.

The Logic: Even though the name is random, every action they take is digitally signed by their private key. This ensures that no one can impersonate User_5592.
In a normal system, if you have 1,000 bots, you have 1,000 times the power. In our system, We are designing it so that influence is something you have to pay for with your computer’s effort and your account's history. By doing this, We're making it mathematically and physically exhausting for a group of liars to manipulate the campus news feed.

Case 1: The 1,000 Bot Attack (Sybil Attack) If an attacker tries to flood a rumor with 1,000 fake "Verify" clicks using a script, they hit a wall. First, our system uses a Square Root Rule. Instead of the score going up by 1,000, it only goes up by about 31. To actually get a score of 100, they would need 10,000 bots. This makes cheating super linear, the more you want to lie, the exponentially harder it becomes. Plus, since each vote requires the browser to solve a math puzzle (Proof-of-Work), their server would likely crash or slow down trying to solve 1,000 puzzles at once.

Case 2: The Multi-Device User (Self-Voting) If a student tries to vote for their own rumor using Chrome and Edge on their phone and laptop, they might get 4 votes in. However, our system treats "New Users" as unverified. A brand-new anonymous ID has a very low "Reputation Weight." Even with 4 devices, their combined impact might be less than half of a single "Senior User" who has been on the platform for a month and has a history of being honest. We are basically solving the "identity" problem by making time and consistency the most valuable currencies in the app.

Case 3: The Wait-and-Push Attack Sometimes, attackers wait for a rumor to get popular and then suddenly flood it with fake info. We're solving this using Temporal Decay. The weight of a verification is highest right when a rumor is posted. If someone tries to pile on a rumor 10 hours later, their vote is worth 90% less. This protects the system from "flash mobs" or bots that try to hijack a conversation once it starts trending.

Case 4: The Ghost of Deleted Rumors One of the biggest issues is when a fake rumor is deleted but its "score" still makes other related rumors look true. We are building a Dependency Graph. Every rumor knows which other rumors it is related to. If the "Parent" rumor is found to be a bot attack and gets deleted, my backend will automatically "prune" or recalculate the scores of every related "Child" rumor. This stops the "poison" from spreading through the system even after the original post is gone.

Posting a Rumor: When a user posts a rumor, they aren't just sending text.

Dependency Check: They can "link" it to an existing rumor (e.g., "This is an update to the Library Haunting post").

Anti-Spam Proof: Before the "Submit" button works, the browser must solve a Proof-of-Work (PoW) challenge. This takes about 1 second of CPU power, which stops a bot from posting 100 rumors at once.

***Handling Attacks and "Ghosts" (The Graph Logic):***If a group of 1,000 bots somehow bypasses the PoW and floods a rumor, my system has a "safety valve":

Anomaly Detection: If the backend sees a massive spike in votes from new IDs with zero reputation, it automatically "Freezes" the trust score and flags it as "Suspicious Activity."

Pruning the Score: If a rumor is eventually debunked or deleted, my system looks at the Dependency Graph. It follows the links to all "related" rumors and automatically subtracts the trust they gained from the fake post. This solves the "bug" where deleted rumors still affect the new ones.

The User Feed: The end result is a feed where rumors are color-coded:
Green (Trusted): High reputation support, low anomaly detection.
Yellow (Unverified): New posts or conflicting votes.
Red (Suspect): High bot-activity detected or heavy disputes from trusted users.


System Architecture
We are designing a simple Client-Server architecture that focuses on security without using logins. On the Frontend, We'll be using React to handle the work. Instead of a username, the browser will create a secret key for the student and save it locally. Before sending any rumor or vote, the frontend will solve a quick math puzzle (Proof-of-Work) to prove the user isn't a bot.

The Backend acts as the judge. It checks the math puzzle and the digital signature to make sure the data hasn't been messed with. It then runs my scoring logic to update the rumor's trust. For the Database, We're using PostgreSQL with a simple "link" system. This way, if we delete a fake rumor, the system can find all the other related posts and fix their scores automatically. It's a basic setup, but it keeps the system fast and stops the ghost score bug.


Trust Score Mechanism:
The Trust Engine (The Math Behind the Scenes). Our system doesn't trust everyone equally. We use three specific layers to calculate the score:
Reputation Weight:
 	If User_5592 has verified 10 rumors in the past that were eventually accepted as true, their vote is now worth 5 times more than a brand-new user.
The Square Root Rule:
 	We use Quadratic Voting logic. If an attacker uses 100 bots to vote, the score only goes up by sqrt(100) = 10. This makes buying the truth through bot-nets 	incredibly expensive and inefficient.
Temporal Accuracy:
We reward early verifiers. People who spot a lie early get a reputation boost, while bandwagoners who vote hours later get very little influence.
