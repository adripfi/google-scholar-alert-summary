# Google Scholar alert summary

Google Scholar lets you configure email alerts when an author you're following publishes a paper, or is cited by a new paper. But the frequency of these alerts isn't configurable: daily only. And if the same new paper is included in multiple alerts (e.g., it cites several authors you follow), Google Scholar won't deduplicate it.

The code in this repo lets you configure the frequency of alerts, and deduplicate them.

## Installation

I assume you've configured some Google Scholar alerts to arrive at your GMail inbox. In GMail, create a new filter that matches all emails from scholaralerts-noreply@google.com and auto-archives them ("skip the inbox"). Thus they'll stay in your account until they're summarized, but they won't clutter your inbox.

![image](https://github.com/user-attachments/assets/9a2304fe-6a41-44d9-bdd1-19c04a3f535e)

![image](https://github.com/user-attachments/assets/2b0f95cd-e5b1-4690-b1b6-68caf9498887)

Using the same Google account as you use for GMail, create a new [Google Apps Script](script.google.com) project. Paste this repository's Code.gs as a new file named Code.gs in the Google Apps Script project. Then configure a trigger to run the processScholarAlerts function, whenever and as often as you desire (at most daily).

<img width="593" alt="image" src="https://github.com/user-attachments/assets/f0a6d18c-04b0-4423-930a-a36af3f3ca8c" />

Now the raw scholar alerts will be hidden from you, and you'll get a summary periodically. If an article is listed for multiple reasons, the summary lists them all.
