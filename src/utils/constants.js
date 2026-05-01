'use strict';

/**
 * @module utils/constants
 * @description Application constants including AI system prompts and election timeline data.
 */

/**
 * System prompt that grounds Gemini AI as an election process education expert.
 * @type {string}
 */
const ELECTION_SYSTEM_PROMPT = `You are ElectionGuide AI, an expert, friendly, and non-partisan assistant dedicated to educating people about the election process.

Your core mission:
- Explain election processes clearly and accurately using simple, accessible language
- Cover all aspects: voter registration, primaries, caucuses, conventions, general elections, the Electoral College, and inauguration
- Be non-partisan and factual — never express political opinions or endorse candidates/parties
- Use analogies and real-world examples to make complex concepts easy to understand
- When asked about different countries, compare and contrast their systems with clarity
- Encourage civic participation and voter engagement

Response guidelines:
- Keep responses concise but thorough (2-4 paragraphs for most questions)
- Use bullet points and numbered lists for step-by-step processes
- Include relevant historical context when helpful
- If a question is outside the scope of election education, politely redirect to election-related topics
- Use markdown formatting for better readability (bold, headers, lists)
- Always be encouraging and supportive of people learning about democracy

Topics you cover:
1. Voter Registration (requirements, deadlines, methods)
2. Types of Elections (primary, general, special, midterm, municipal)
3. Voting Methods (in-person, mail-in, early voting, absentee)
4. The Primary Process (open vs closed primaries, caucuses, delegates)
5. National Conventions (purpose, delegate count, nomination)
6. Campaign Process (debates, advertising, fundraising rules)
7. Election Day (polling places, ballots, voting rights)
8. Electoral College (how it works, 270 to win, faithless electors)
9. Vote Counting & Certification (canvassing, recounts, certification)
10. Inauguration & Transition (timeline, oath of office, peaceful transfer)
11. Comparative Elections (parliamentary systems, proportional representation)
12. Voting Rights History (amendments, landmark legislation)`;

/**
 * System prompt for quiz generation mode.
 * @type {string}
 */
const QUIZ_SYSTEM_PROMPT = `You are a quiz generator specializing in election process education.
Generate clear, factual, non-partisan multiple-choice questions.
Each question must have exactly 4 options with one correct answer.
Provide a brief, educational explanation for each correct answer.
Return ONLY valid JSON — no additional text, commentary, or markdown outside the JSON.
Ensure questions are age-appropriate and accessible to a general audience.`;

/**
 * Election process timeline data — the complete journey from registration to inauguration.
 * @type {Array<object>}
 */
const ELECTION_TIMELINE = [
  {
    id: 1,
    step: 'Voter Registration',
    icon: '📋',
    timeframe: 'Ongoing (deadlines vary by state)',
    summary: 'The first step in participating in democracy is registering to vote.',
    details: `Voter registration is the process of signing up to be eligible to vote in elections. Requirements and deadlines vary by state, but generally you must be a U.S. citizen, meet your state's residency requirements, and be 18 years old by Election Day.

**Key Points:**
- **Online Registration**: Most states offer online voter registration through their Secretary of State website
- **Same-Day Registration**: Some states allow registration on Election Day itself
- **Automatic Registration**: Several states automatically register eligible citizens when they interact with government agencies
- **Deadlines**: Registration deadlines range from 30 days before an election to same-day, depending on the state
- **Verification**: After registering, you can verify your status through your state's election office`,
    keyFacts: [
      'About 70% of eligible Americans are registered to vote',
      '21 states plus DC offer same-day voter registration',
      'The National Voter Registration Act of 1993 (Motor Voter Act) expanded registration access',
    ],
  },
  {
    id: 2,
    step: 'Primary Elections & Caucuses',
    icon: '🗳️',
    timeframe: 'January – June (Election Year)',
    summary: 'Voters choose their preferred candidates within each political party.',
    details: `Primary elections and caucuses are the methods by which political parties select their candidates for the general election. This process determines who will represent each party on the ballot.

**Types of Primaries:**
- **Open Primary**: Any registered voter can participate regardless of party affiliation
- **Closed Primary**: Only registered party members can vote in their party's primary
- **Semi-Open/Semi-Closed**: Variations that allow some crossover participation
- **Caucuses**: Local gatherings where party members discuss and vote for candidates through an interactive process

**How Delegates Work:**
- Candidates earn delegates based on their vote share
- Democratic primaries use proportional allocation
- Republican primaries use a mix of winner-take-all and proportional systems
- The candidate who wins a majority of delegates becomes the presumptive nominee`,
    keyFacts: [
      'Iowa and New Hampshire have traditionally held the first caucus and primary',
      'Super Tuesday features primaries in multiple states on the same day',
      'Approximately 35% of eligible voters participate in primaries',
    ],
  },
  {
    id: 3,
    step: 'National Conventions',
    icon: '🎪',
    timeframe: 'July – August (Election Year)',
    summary: 'Parties officially nominate their presidential candidates and adopt platforms.',
    details: `The national conventions are multi-day events where each major political party officially selects its presidential and vice-presidential nominees. Conventions also serve to unify the party, adopt the party platform, and energize supporters.

**Convention Process:**
- **Delegate Voting**: Delegates cast votes to formally nominate the candidate
- **First Ballot**: If a candidate has a majority of delegates, they win on the first ballot
- **Contested Convention**: If no candidate has a majority, multiple rounds of voting occur
- **Vice Presidential Pick**: The presidential nominee announces their running mate
- **Acceptance Speech**: The nominee delivers a major speech to the nation
- **Party Platform**: Delegates vote on the party's official policy positions`,
    keyFacts: [
      'Modern conventions are largely ceremonial since the nominee is usually known after primaries',
      'The last contested convention was in 1952 (Democratic)',
      'Conventions typically produce a polling "bounce" for the nominee',
    ],
  },
  {
    id: 4,
    step: 'Campaign Season',
    icon: '📢',
    timeframe: 'August – November (Election Year)',
    summary: 'Candidates actively campaign, debate, and present their platforms to voters.',
    details: `After the conventions, the general election campaign intensifies. Candidates travel the country, participate in debates, run advertisements, and work to win over undecided voters.

**Key Campaign Elements:**
- **Presidential Debates**: Typically 3 presidential debates and 1 vice-presidential debate organized by the Commission on Presidential Debates
- **Battleground States**: Candidates focus on competitive "swing states" that could go either way
- **Campaign Finance**: Federal Election Commission (FEC) regulates campaign contributions and spending
- **Media & Advertising**: TV ads, digital campaigns, social media, and grassroots organizing
- **Get Out the Vote (GOTV)**: Intensive efforts to mobilize supporters to actually cast ballots`,
    keyFacts: [
      'The first televised presidential debate was Kennedy vs Nixon in 1960',
      'Swing states receive disproportionate campaign attention and spending',
      'Billions of dollars are spent on presidential campaigns',
    ],
  },
  {
    id: 5,
    step: 'Election Day',
    icon: '🏛️',
    timeframe: 'First Tuesday after first Monday in November',
    summary: 'Citizens cast their votes at polling places or through previously submitted ballots.',
    details: `Election Day is when the majority of voters cast their ballots. It is held on the first Tuesday following the first Monday in November, a tradition dating back to 1845.

**Voting Process:**
- **Polling Places**: Voters go to their assigned location, verify identity (requirements vary by state), and cast their ballot
- **Early Voting**: Many states allow voting days or weeks before Election Day
- **Mail-In/Absentee Voting**: Voters can request ballots by mail in every state
- **Provisional Ballots**: If eligibility is in question, voters can cast a provisional ballot that is verified later
- **Exit Polls**: Media organizations survey voters leaving polling places to project results

**Voter Protections:**
- Federal law requires employers to allow time off for voting in many states
- Voter intimidation is a federal crime
- Non-partisan poll watchers help ensure fair elections`,
    keyFacts: [
      'About 155 million Americans voted in the 2020 presidential election',
      'Voter turnout in presidential elections has ranged from 50-67% in recent decades',
      'Election Day was chosen to avoid conflicts with market days and the Sabbath',
    ],
  },
  {
    id: 6,
    step: 'Electoral College Vote',
    icon: '⭐',
    timeframe: 'First Monday after second Wednesday in December',
    summary: 'Electors formally cast their votes based on their state\'s popular vote results.',
    details: `The Electoral College is the body that officially elects the President and Vice President. Each state has a number of electors equal to its total Congressional representation (House members + 2 Senators). A candidate needs 270 out of 538 electoral votes to win.

**How It Works:**
- **Winner-Take-All**: In 48 states and DC, the candidate who wins the popular vote receives ALL of that state's electoral votes
- **Congressional District Method**: Maine and Nebraska allocate some electors by congressional district
- **Electors Meet**: In December, electors gather in their state capitals to formally cast votes
- **Faithless Electors**: Rarely, an elector votes against the state's popular vote winner (some states have laws against this)

**Why the Electoral College?**
- Created as a compromise between direct popular vote and Congressional selection
- Gives smaller states proportionally more influence
- Has resulted in 5 elections where the popular vote winner lost the presidency`,
    keyFacts: [
      'There are 538 total electoral votes (435 House + 100 Senate + 3 for DC)',
      '270 electoral votes are needed to win the presidency',
      'The 2000 and 2016 elections featured popular vote / Electoral College splits',
    ],
  },
  {
    id: 7,
    step: 'Congressional Certification',
    icon: '📜',
    timeframe: 'January 6',
    summary: 'Congress meets in joint session to count and certify the electoral votes.',
    details: `On January 6, a joint session of Congress meets to formally count the electoral votes. The Vice President (as President of the Senate) presides over the session.

**Certification Process:**
- **Vote Counting**: Electoral votes from each state are opened and read aloud
- **Objections**: Members of Congress can object to a state's electoral votes (requires one House member and one Senator)
- **Debate**: If an objection is sustained, both chambers debate and vote separately
- **Final Count**: After all votes are counted and any objections resolved, the winner is officially declared
- **Electoral Count Reform Act (2022)**: Clarified the Vice President's role as ceremonial and raised the threshold for objections`,
    keyFacts: [
      'The Electoral Count Reform Act of 2022 updated the 1887 Electoral Count Act',
      'The VP\'s role in certification is ceremonial — they cannot reject electoral votes',
      'Congressional certification is typically a routine procedural event',
    ],
  },
  {
    id: 8,
    step: 'Inauguration',
    icon: '🎖️',
    timeframe: 'January 20',
    summary: 'The President-elect is sworn in and officially becomes the President of the United States.',
    details: `Inauguration Day marks the peaceful transfer of power. The President-elect takes the oath of office and becomes the new President of the United States.

**Inauguration Traditions:**
- **Oath of Office**: The President recites the oath prescribed by Article II of the Constitution, typically administered by the Chief Justice of the Supreme Court
- **Inaugural Address**: The new President delivers a speech outlining their vision and priorities
- **Inaugural Parade**: A procession along Pennsylvania Avenue from the Capitol to the White House
- **Inaugural Balls**: Evening celebrations and galas
- **Transition**: The outgoing administration has been transferring knowledge and resources since the election

**The Presidential Oath:**
"I do solemnly swear that I will faithfully execute the Office of President of the United States, and will to the best of my ability, preserve, protect and defend the Constitution of the United States."`,
    keyFacts: [
      'The 20th Amendment (1933) moved Inauguration Day from March 4 to January 20',
      'Eight presidents have taken the oath due to death or resignation of the incumbent',
      'The inauguration represents the peaceful transfer of power — a cornerstone of democracy',
    ],
  },
];

/**
 * Supported languages for translation.
 * @type {Array<object>}
 */
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'hi', name: 'Hindi' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
];

module.exports = {
  ELECTION_SYSTEM_PROMPT,
  QUIZ_SYSTEM_PROMPT,
  ELECTION_TIMELINE,
  SUPPORTED_LANGUAGES,
};
