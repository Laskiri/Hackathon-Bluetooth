This is a repository containing code for all the components for our bluetooth/museum experience hackathon held at Kongernes Jelling museum from 24-26 octorber 2025.

## Portal
The portal app is a webapp, containing a server and a SPA. The portal is used to initiate and complete the museum experience. When starting the exhibition, your group can chose a team name and the adminstrator of the experience can enter a summoning write and how many "Runestones" this should be fragmented between. The active team and the code fragments will be stored through the server and code fragments will be posted to the corresponding "Runestones" which will init all of the runestone devices placed around the museum. The Portal looks like the following:
<img width="472" height="410" alt="image" src="https://github.com/user-attachments/assets/05b6b178-480d-468b-ad96-a3f8707ce014" />
Exstra functionality includes submitting the code and seing the ressurection of harald bluetooth aswell as a leaderboard (All of this is flowing through the api, and can therefore be used as desired in the museum.

## Runestones
The "Runestones" Are devices managed by the museum, which are placed strategically eg: 1 in each room. The Runestones are listening/waiting for bluetooth transmittions from artifacts around the room/area and when all of these have been activated and read by the Runestone, the team will be challenged with a quiz/puzzle on the runestone app device, that are related to the artifacts they have activated with nfc around the room.

## Artifacts 
Artifacts could be specific exhibitions/ physical things around the room which can have tags/electronics integrated, that when scanned with nfc can advertise bluetooth. For our demo and code we've used 4x esp32 boards. 3x of them were used to demonstrate artifacts and the last one was used a "mock" for nfc scanning by using RSII bluetooth proximity detection instead. 

