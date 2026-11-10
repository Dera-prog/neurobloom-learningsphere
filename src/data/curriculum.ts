import type { Question } from './content'

/**
 * Real-life curriculum. Every topic starts from something a learner actually
 * meets — a market stall, a bus timetable, a NEPA bill — then teaches the
 * subject idea behind it, and ends with questions that are answerable from
 * the lesson text alone.
 */

export interface WorkedExample {
  prompt: string
  steps: string[]
  answer: string
}

export interface Topic {
  id: string
  title: string
  realLife: string
  keyIdeas: string[]
  worked: WorkedExample
  questions: Question[]
}

export interface SubjectCurriculum {
  id: string
  subjectId: string
  stage: 'junior' | 'senior'
  name: string
  emoji: string
  color: string
  soft: string
  blurb: string
  topics: Topic[]
}

/* -------------------------------- Junior ---------------------------------- */

export const juniorCurriculum: SubjectCurriculum[] = [
  {
    id: 'junior-maths',
    subjectId: 'maths',
    stage: 'junior',
    name: 'Mathematics',
    emoji: '🔢',
    color: '#6c3fc5',
    soft: '#f0eefb',
    blurb: 'Market prices, family money and savings — the maths you use before lunch every day.',
    topics: [
      {
        id: 'j-maths-profit',
        title: 'Profit and loss at the market',
        realLife:
          "Mama Nkechi sells fabric at Balogun Market. She buys a roll for ₦18,000 and sells it for ₦22,500. Before she prices anything she works out her profit as a percentage of what she paid, so she knows whether the journey to the market was worth it.",
        keyIdeas: [
          'Cost price (CP) is what the trader paid. Selling price (SP) is what the customer hands over.',
          'Profit = SP − CP. Loss = CP − SP.',
          'Percentage profit = (profit ÷ CP) × 100. Always divide by the cost price.',
          'A discount is a percentage taken off the marked price, so the customer pays less than the ticket.',
        ],
        worked: {
          prompt: 'A trader buys 40 tubers of yam at ₦250 each and sells them all at ₦320 each. Find the total profit and the percentage profit.',
          steps: [
            'Cost price = 40 × ₦250 = ₦10,000',
            'Selling price = 40 × ₦320 = ₦12,800',
            'Profit = ₦12,800 − ₦10,000 = ₦2,800',
            'Percentage profit = (2,800 ÷ 10,000) × 100 = 28%',
          ],
          answer: '₦2,800 profit, which is 28%.',
        },
        questions: [
          {
            q: 'A bag of rice costs ₦42,000 and is sold for ₦48,300. What is the percentage profit?',
            options: ['13%', '15%', '18%', '20%'],
            correct: 1,
            explain: 'Profit = ₦6,300. ₦6,300 ÷ ₦42,000 × 100 = 15%.',
          },
          {
            q: 'A shop marks a dress at ₦8,000 and gives a 15% discount. How much does a customer pay?',
            options: ['₦6,800', '₦7,200', '₦7,400', '₦6,500'],
            correct: 0,
            explain: '15% of ₦8,000 is ₦1,200, so the customer pays ₦8,000 − ₦1,200 = ₦6,800.',
          },
          {
            q: 'A phone bought for ₦65,000 is sold for ₦58,500. What is the loss percentage?',
            options: ['10%', '11%', '13%', '15%'],
            correct: 0,
            explain: 'Loss = ₦6,500. ₦6,500 ÷ ₦65,000 × 100 = 10%.',
          },
          {
            q: 'Which formula gives percentage profit?',
            options: [
              '(SP − CP) ÷ SP × 100',
              '(SP − CP) ÷ CP × 100',
              '(CP − SP) ÷ CP × 100',
              'SP ÷ CP × 100',
            ],
            correct: 1,
            explain: 'Profit is always measured against what the trader paid, so divide by the cost price.',
          },
        ],
      },
      {
        id: 'j-maths-ratio',
        title: 'Sharing money at home',
        realLife:
          "When Mr. Bakare's shop has a good week, ₦90,000 is shared between savings, food and school fees in the ratio 2 : 3 : 4. Tunde checks the maths before the money leaves the house, because a ratio is a promise about fairness.",
        keyIdeas: [
          'A ratio compares parts of the same whole: 2 : 3 : 4 means 9 equal parts in total.',
          'One part = total amount ÷ total number of parts.',
          'Each share = its ratio number × the value of one part.',
          'Ratios can be simplified the way fractions can: 18 : 24 = 3 : 4.',
        ],
        worked: {
          prompt: 'Share ₦90,000 between savings, food and school fees in the ratio 2 : 3 : 4.',
          steps: [
            'Total parts = 2 + 3 + 4 = 9',
            'One part = ₦90,000 ÷ 9 = ₦10,000',
            'Savings = 2 × ₦10,000 = ₦20,000',
            'Food = 3 × ₦10,000 = ₦30,000',
            'School fees = 4 × ₦10,000 = ₦40,000',
          ],
          answer: '₦20,000 savings, ₦30,000 food and ₦40,000 school fees.',
        },
        questions: [
          {
            q: '₦54,000 is shared in the ratio 3 : 6. How much is the larger share?',
            options: ['₦18,000', '₦36,000', '₦27,000', '₦40,000'],
            correct: 1,
            explain: 'There are 9 parts, so one part is ₦6,000. The larger share is 6 × ₦6,000 = ₦36,000.',
          },
          {
            q: 'Simplify the ratio 18 : 24.',
            options: ['3 : 4', '2 : 3', '4 : 5', '6 : 8'],
            correct: 0,
            explain: 'Divide both sides by 6 to get 3 : 4.',
          },
          {
            q: 'A recipe uses 2 cups of rice for every 5 people. How many cups feed 20 people?',
            options: ['6', '8', '10', '12'],
            correct: 1,
            explain: '20 people is 4 groups of 5, so 4 × 2 = 8 cups.',
          },
          {
            q: 'If 4 pens cost ₦1,200, how much do 7 pens cost?',
            options: ['₦1,800', '₦2,000', '₦2,100', '₦2,400'],
            correct: 2,
            explain: 'One pen costs ₦300, so 7 pens cost ₦2,100.',
          },
        ],
      },
      {
        id: 'j-maths-interest',
        title: 'Saving for a school bag',
        realLife:
          "Tunde's mother keeps ₦15,000 in a savings account that pays 8% simple interest a year. She wants to know exactly how much the money will grow before she buys a new school bag at the end of the year.",
        keyIdeas: [
          'Simple interest is paid only on the original amount (the principal).',
          'I = (P × R × T) ÷ 100, where T is the time in years.',
          'Total amount = principal + interest.',
          'A 6-month period is half a year, so T = 0.5.',
        ],
        worked: {
          prompt: 'Find the simple interest on ₦15,000 at 8% a year for 2 years, and the total amount.',
          steps: [
            'I = (15,000 × 8 × 2) ÷ 100',
            'I = 240,000 ÷ 100 = ₦2,400',
            'Amount = ₦15,000 + ₦2,400 = ₦17,400',
          ],
          answer: '₦2,400 interest, giving ₦17,400 in total.',
        },
        questions: [
          {
            q: 'Find the simple interest on ₦20,000 at 5% for 3 years.',
            options: ['₦1,000', '₦2,500', '₦3,000', '₦3,500'],
            correct: 2,
            explain: '(20,000 × 5 × 3) ÷ 100 = ₦3,000.',
          },
          {
            q: '₦12,000 is saved at 10% simple interest. What is the total amount after one year?',
            options: ['₦12,120', '₦13,000', '₦13,200', '₦14,000'],
            correct: 2,
            explain: 'Interest is ₦1,200, so the amount is ₦12,000 + ₦1,200 = ₦13,200.',
          },
          {
            q: 'Which formula finds simple interest?',
            options: ['(P × R × T) ÷ 100', '(P × R) ÷ T', 'P × R × T', '(P + R + T) ÷ 100'],
            correct: 0,
            explain: 'Rate is a percentage, so the product of principal, rate and time is divided by 100.',
          },
          {
            q: 'After 2 years, ₦5,000 earns ₦800 simple interest. What yearly rate was used?',
            options: ['4%', '6%', '8%', '10%'],
            correct: 2,
            explain: '800 = (5,000 × R × 2) ÷ 100, so R = 800 ÷ 100 = 8%.',
          },
        ],
      },
    ],
  },
  {
    id: 'junior-english',
    subjectId: 'english',
    stage: 'junior',
    name: 'English Language',
    emoji: '📖',
    color: '#0ea5e9',
    soft: '#e8f4fd',
    blurb: 'Letters, timetables and storytelling — English you can use the moment you leave the classroom.',
    topics: [
      {
        id: 'j-eng-letter',
        title: 'Writing to Uncle Emeka',
        realLife:
          "Tunde wants to thank his uncle for paying his school fees and tell him about a new science project. A letter to a relative is informal: friendly language, contractions and a chatty tone — not the stiff wording of a bank letter.",
        keyIdeas: [
          'Writer’s address and the date go at the top right; no recipient address is needed for family.',
          'The salutation names the person: “Dear Uncle Emeka,”.',
          'Each paragraph carries one idea: thanks, news, then a request or closing.',
          'Close with a relationship, not a formula: “Your nephew, Tunde”.',
        ],
        worked: {
          prompt: 'Write the opening of a letter thanking an uncle for paying school fees.',
          steps: [
            'Address and date at the top right.',
            'Salutation: Dear Uncle Emeka,',
            'Paragraph 1: “Thank you very much for paying my school fees this term. I know it was not a small amount.”',
            'Paragraph 2: the news or request, kept short and friendly.',
            'Closing: Your nephew, Tunde.',
          ],
          answer: 'Friendly salutation, one idea per paragraph, and a family closing.',
        },
        questions: [
          {
            q: 'Which salutation suits a letter to your aunt?',
            options: ['Dear Sir/Madam,', 'Dear Auntie Ngozi,', 'To Whom It May Concern,', 'Yours faithfully,'],
            correct: 1,
            explain: 'An informal letter names the person you know.',
          },
          {
            q: 'Where does the writer’s address go in an informal letter?',
            options: ['Bottom left', 'Top right', 'After the body', 'Inside the signature'],
            correct: 1,
            explain: 'The writer’s address sits top right, with the date just below it.',
          },
          {
            q: 'Which closing is correct for a letter to your uncle?',
            options: ['Yours faithfully,', 'Yours sincerely,', 'Your nephew,', 'Best regards to the office,'],
            correct: 2,
            explain: 'Family letters close with the relationship, e.g. “Your nephew”.',
          },
          {
            q: 'Which sentence is too formal for a letter to a cousin?',
            options: [
              'How are you doing?',
              'I hope you are well.',
              'I am writing to acknowledge receipt of your correspondence.',
              'Guess what happened at school!',
            ],
            correct: 2,
            explain: '“Acknowledge receipt of your correspondence” belongs in an office letter.',
          },
        ],
      },
      {
        id: 'j-eng-timetable',
        title: 'Reading a bus timetable',
        realLife:
          "The bus from Oshodi to Ikeja leaves at 6:45 a.m. and takes 35 minutes. Reading a timetable means scanning for the one fact you need, then checking the small print around it — not reading every word slowly.",
        keyIdeas: [
          'Skimming gives you the main idea of a passage; scanning hunts for one detail.',
          'Check the small print: “weekdays only” changes everything.',
          'Arrival time = departure time + journey time.',
          'An inference is a fact the writer implies without stating.',
        ],
        worked: {
          prompt: 'A bus leaves Oshodi at 6:45 a.m. and the journey takes 35 minutes. When does it arrive in Ikeja?',
          steps: [
            '6:45 + 15 minutes = 7:00',
            '35 − 15 = 20 minutes still to travel',
            '7:00 + 20 minutes = 7:20',
          ],
          answer: 'The bus arrives at 7:20 a.m.',
        },
        questions: [
          {
            q: 'A bus leaves at 6:45 a.m. and the journey takes 35 minutes. When does it arrive?',
            options: ['7:10 a.m.', '7:20 a.m.', '7:25 a.m.', '7:30 a.m.'],
            correct: 1,
            explain: '6:45 plus 35 minutes is 7:20.',
          },
          {
            q: 'Looking only for a departure time in a timetable is called…',
            options: ['skimming', 'scanning', 'summarising', 'paraphrasing'],
            correct: 1,
            explain: 'Scanning is searching a text for one specific piece of information.',
          },
          {
            q: 'A route is marked “weekdays only”. Does it run on Saturday?',
            options: ['Yes', 'No', 'Only in the morning', 'Only in the holidays'],
            correct: 1,
            explain: 'Weekdays are Monday to Friday, so Saturday is excluded.',
          },
          {
            q: 'What is the main idea of a paragraph that lists bus fares by route?',
            options: [
              'How to drive a bus',
              'The cost of travelling each route',
              'Why buses are late',
              'Who owns the bus company',
            ],
            correct: 1,
            explain: 'The paragraph is organised around fares, so the main idea is cost per route.',
          },
        ],
      },
      {
        id: 'j-eng-past',
        title: 'Telling a story in the past tense',
        realLife:
          "When Tunde tells his friends about the football match, most verbs must be in the simple past: “We played”, “I scored”, “Coach shouted”. Mixing “I score” with “yesterday” confuses the listener about when it happened.",
        keyIdeas: [
          'Regular verbs add -ed: play → played, kick → kicked.',
          'Irregular verbs change form: go → went, buy → bought, run → ran.',
          'The past continuous (was/were + -ing) shows an action in progress.',
          'Time markers such as yesterday, last week and in 2019 require a past tense.',
        ],
        worked: {
          prompt: 'Rewrite in the past: “We play football, the coach shouts, and I score.”',
          steps: [
            '“play” becomes “played”.',
            '“shouts” becomes “shouted”.',
            '“score” becomes “scored”.',
            'Result: “We played football, the coach shouted, and I scored.”',
          ],
          answer: 'We played football, the coach shouted, and I scored.',
        },
        questions: [
          {
            q: 'Choose the correct past tense: “Yesterday I ___ to the market.”',
            options: ['go', 'goed', 'went', 'gone'],
            correct: 2,
            explain: '“Go” is irregular: go → went → gone.',
          },
          {
            q: 'Which sentence is in the simple past?',
            options: ['She is cooking rice.', 'She cooks rice.', 'She cooked rice.', 'She will cook rice.'],
            correct: 2,
            explain: 'Only “cooked” is the simple past form.',
          },
          {
            q: 'What is the past tense of “buy”?',
            options: ['buyed', 'bought', 'boughted', 'buys'],
            correct: 1,
            explain: 'Buy is irregular: buy → bought.',
          },
          {
            q: '“While we ___ football, it started to rain.” Choose the best form.',
            options: ['play', 'played', 'were playing', 'have played'],
            correct: 2,
            explain: 'The past continuous shows the longer action in progress when it began to rain.',
          },
        ],
      },
    ],
  },
  {
    id: 'junior-science',
    subjectId: 'science',
    stage: 'junior',
    name: 'Basic Science',
    emoji: '🔬',
    color: '#10b981',
    soft: '#ecfdf5',
    blurb: 'Clean water, food that keeps and why a metal spoon burns your hand.',
    topics: [
      {
        id: 'j-sci-water',
        title: 'Clean water at home',
        realLife:
          "The water from the well behind Chidi's house looks clear, but it still carries germs. His family lets it settle, pours it through cloth, then boils it. Each step removes something different.",
        keyIdeas: [
          'Settling (sedimentation) lets heavy dirt sink to the bottom.',
          'Filtration through cloth, sand or a filter removes solid particles, not germs.',
          'Boiling for at least one minute kills most micro-organisms.',
          'Clear water is not automatically safe water — germs are invisible.',
        ],
        worked: {
          prompt: 'Put the three steps for treating well water in the correct order and say what each removes.',
          steps: [
            'Settle: heavy sand and mud sink to the bottom.',
            'Filter: cloth or sand traps the remaining solid particles.',
            'Boil: heat kills the germs that filtering could not reach.',
          ],
          answer: 'Settle → filter → boil.',
        },
        questions: [
          {
            q: 'Which step kills germs in drinking water?',
            options: ['Filtering through cloth', 'Boiling', 'Adding sand', 'Leaving it in the sun'],
            correct: 1,
            explain: 'Boiling is the step that destroys micro-organisms.',
          },
          {
            q: 'Filtration removes…',
            options: ['dissolved sugar', 'solid dirt particles', 'all bacteria', 'the taste of water'],
            correct: 1,
            explain: 'A cloth or sand filter catches solids but lets dissolved substances and germs through.',
          },
          {
            q: 'Water that looks clear is always safe to drink.',
            options: ['True', 'False — germs can be invisible', 'True if it is cold', 'True in the rainy season'],
            correct: 1,
            explain: 'Germs are far too small to see, so looks prove nothing.',
          },
          {
            q: 'Which is the correct order for treating water?',
            options: ['Boil → filter → settle', 'Settle → filter → boil', 'Filter → settle → boil', 'Boil → settle → filter'],
            correct: 1,
            explain: 'Settle first, filter second, then boil last so nothing re-contaminates it.',
          },
        ],
      },
      {
        id: 'j-sci-food',
        title: 'Why food spoils',
        realLife:
          "Leftover beans left outside overnight smell sour by morning. Micro-organisms multiply quickly in warm, moist food, so drying, salting, refrigerating or canning all work by making life difficult for them.",
        keyIdeas: [
          'Micro-organisms need warmth, moisture and food to multiply.',
          'Preservation removes one of those conditions.',
          'Drying removes water, salting draws water out, cooling slows growth.',
          'Cooked food should be covered and chilled quickly, not left out.',
        ],
        worked: {
          prompt: 'Explain why dried fish keeps for weeks while fresh fish spoils in a day.',
          steps: [
            'Fresh fish is warm and moist — ideal for micro-organisms.',
            'Drying removes most of the water they need.',
            'Without water they cannot multiply, so the fish keeps.',
          ],
          answer: 'Drying removes the moisture micro-organisms need.',
        },
        questions: [
          {
            q: 'Which condition makes food spoil fastest?',
            options: ['Cold and dry', 'Warm and moist', 'Frozen', 'Salty'],
            correct: 1,
            explain: 'Warmth and moisture are the two conditions micro-organisms need most.',
          },
          {
            q: 'Drying food preserves it because…',
            options: ['it adds vitamins', 'micro-organisms need water', 'it makes food sweeter', 'it kills all insects'],
            correct: 1,
            explain: 'Removing water denies micro-organisms the moisture they need to grow.',
          },
          {
            q: 'Which is NOT a food preservation method?',
            options: ['Salting', 'Canning', 'Refrigerating', 'Washing with cold water'],
            correct: 3,
            explain: 'Washing adds moisture and does not slow spoilage.',
          },
          {
            q: 'Leftover rice should be…',
            options: [
              'left on the table overnight',
              'covered and refrigerated quickly',
              'kept in warm water',
              'reheated only the next evening',
            ],
            correct: 1,
            explain: 'Cooling it quickly slows bacterial growth.',
          },
        ],
      },
      {
        id: 'j-sci-heat',
        title: 'Heat in the kitchen',
        realLife:
          "A metal spoon left in a pot of hot stew soon burns your hand, but the wooden handle stays cool. Metals conduct heat quickly; wood resists it — which is why pots have metal bodies and wooden or plastic handles.",
        keyIdeas: [
          'Conduction moves heat through a solid by particles passing energy along.',
          'Convection moves heat through liquids and gases as warm fluid rises.',
          'Radiation travels without a medium, like heat from a fire.',
          'Conductors (metals) move heat easily; insulators (wood, plastic, air) do not.',
        ],
        worked: {
          prompt: 'Why does a pot have a metal base and a plastic handle?',
          steps: [
            'The metal base must conduct heat quickly from the fire into the food.',
            'The handle must not conduct heat, or the cook would be burned.',
            'Plastic is a poor conductor, so it acts as an insulator.',
          ],
          answer: 'Metal conducts heat into the food; plastic insulates the hand.',
        },
        questions: [
          {
            q: 'Why do cooking pots have wooden or plastic handles?',
            options: ['They look better', 'They are good heat insulators', 'They conduct heat faster', 'They are cheaper than metal'],
            correct: 1,
            explain: 'Insulators slow the transfer of heat to your hand.',
          },
          {
            q: 'Heat moving along a metal spoon is called…',
            options: ['convection', 'radiation', 'conduction', 'evaporation'],
            correct: 2,
            explain: 'Conduction is heat travelling through a solid.',
          },
          {
            q: 'Warm air rising in a room is an example of…',
            options: ['conduction', 'convection', 'radiation', 'reflection'],
            correct: 1,
            explain: 'Convection is heat carried by a moving fluid such as air.',
          },
          {
            q: 'Which material is the best conductor of heat?',
            options: ['Wood', 'Plastic', 'Copper', 'Rubber'],
            correct: 2,
            explain: 'Copper is a metal, and metals are strong conductors.',
          },
        ],
      },
    ],
  },
  {
    id: 'junior-social',
    subjectId: 'social',
    stage: 'junior',
    name: 'Social Studies',
    emoji: '🌍',
    color: '#f59e0b',
    soft: '#fffbeb',
    blurb: 'Street rules, market culture and knowing which level of government to write to.',
    topics: [
      {
        id: 'j-soc-rules',
        title: 'Rules that keep us safe',
        realLife:
          "On Tunde's street everyone agrees that motorbikes slow down near the primary school. The rule is written down, and the community leader reminds riders who forget. Rules only work when they are known and applied to everybody.",
        keyIdeas: [
          'Rules guide behaviour so people can live together safely.',
          'A sanction is the consequence of breaking a rule.',
          'Rules must be clear, fair and applied to everyone equally.',
          'Community leaders explain and uphold local rules.',
        ],
        worked: {
          prompt: 'Why does a speed rule near a school need both a sign and enforcement?',
          steps: [
            'The sign makes the rule known to every rider, including visitors.',
            'Enforcement gives the rule a consequence, so it is not just advice.',
            'Both together protect children who cross at that point.',
          ],
          answer: 'A rule needs to be known and enforced to change behaviour.',
        },
        questions: [
          {
            q: 'The main purpose of community rules is to…',
            options: ["limit people's freedom", 'keep people safe and orderly', 'make leaders rich', 'stop trade'],
            correct: 1,
            explain: 'Rules exist so people can live together safely.',
          },
          {
            q: 'A consequence for breaking a rule is called a…',
            options: ['sanction', 'ceremony', 'statute', 'slogan'],
            correct: 0,
            explain: 'A sanction is the penalty attached to breaking a rule.',
          },
          {
            q: 'Who is best placed to remind residents of a street rule?',
            options: ['A visitor', 'The community leader', 'A shopkeeper from another town', 'No one'],
            correct: 1,
            explain: 'Community leaders are recognised locally and can call residents together.',
          },
          {
            q: 'Rules must be…',
            options: ['secret', 'clear and applied to everyone', 'changed every week', 'only for children'],
            correct: 1,
            explain: 'Fairness means the same rule applies to all.',
          },
        ],
      },
      {
        id: 'j-soc-culture',
        title: 'Culture in our market',
        realLife:
          "In the same market you can buy suya from the north, garri from the east and fresh fish from the riverine south. Culture is shared through food, dress, language and festivals — and learning about other people's customs makes living together easier.",
        keyIdeas: [
          'Culture includes language, food, dress, music, festivals and beliefs.',
          'Nigeria has more than 250 ethnic groups, so our culture is diverse.',
          'Tolerance means respecting customs that differ from your own.',
          'Cultural borrowing spreads food, words and music between groups.',
        ],
        worked: {
          prompt: 'Give two examples of cultural borrowing you can see in a Nigerian market.',
          steps: [
            'Suya, a northern speciality, is sold and eaten across the country.',
            'Words such as “oba” and “bature” travel between languages.',
          ],
          answer: 'Food and language move between cultures and become shared.',
        },
        questions: [
          {
            q: 'Which is NOT an element of culture?',
            options: ['Language', 'Dress', 'Weather', 'Food'],
            correct: 2,
            explain: 'Weather is part of the physical environment, not a cultural practice.',
          },
          {
            q: 'Respecting another person’s custom even when it differs from yours is called…',
            options: ['tolerance', 'ignorance', 'prejudice', 'competition'],
            correct: 0,
            explain: 'Tolerance is respect for differences.',
          },
          {
            q: 'Nigeria has over 250 ethnic groups. This means our culture is…',
            options: ['identical everywhere', 'diverse', 'only one', 'forgotten'],
            correct: 1,
            explain: 'Many groups mean many cultures living together.',
          },
          {
            q: 'A festival that brings a whole town together is an example of…',
            options: ['cultural practice', 'foreign policy', 'taxation', 'trade law'],
            correct: 0,
            explain: 'Festivals are shared cultural practices.',
          },
        ],
      },
      {
        id: 'j-soc-lga',
        title: 'Who leads the local government?',
        realLife:
          "The pothole on Tunde's road is the job of the local government, not the federal government. Each tier of government has different duties, and knowing which one to write to saves weeks of waiting.",
        keyIdeas: [
          'Nigeria has three tiers: federal, state and local government.',
          'Local governments handle local roads, markets, sanitation and primary schools.',
          'A local government is led by a chairman with elected councillors.',
          'Federal duties include defence, currency and foreign affairs.',
        ],
        worked: {
          prompt: 'A street light in your neighbourhood is broken. Which tier of government should you contact first?',
          steps: [
            'Street lighting is a local service.',
            'The local government council is responsible for local infrastructure.',
            'Write to the local government chairman, copying your councillor.',
          ],
          answer: 'The local government, through your ward councillor.',
        },
        questions: [
          {
            q: 'Who is the head of a local government area?',
            options: ['The Governor', 'The Chairman', 'The President', 'The Senator'],
            correct: 1,
            explain: 'An elected chairman leads the local government council.',
          },
          {
            q: 'Which duty belongs to the local government?',
            options: ['Printing currency', 'Local market sanitation', 'Foreign affairs', 'National defence'],
            correct: 1,
            explain: 'Markets and sanitation are local services.',
          },
          {
            q: 'How many tiers of government does Nigeria have?',
            options: ['Two', 'Three', 'Four', 'Five'],
            correct: 1,
            explain: 'Federal, state and local government.',
          },
          {
            q: 'Public primary school teachers are usually paid through…',
            options: ['The federal government alone', 'State and local government', 'Parents only', 'The police'],
            correct: 1,
            explain: 'Basic education is funded jointly by state and local government.',
          },
        ],
      },
    ],
  },
  {
    id: 'junior-arts',
    subjectId: 'arts',
    stage: 'junior',
    name: 'Fine Arts',
    emoji: '🎨',
    color: '#ec4899',
    soft: '#fdf2f8',
    blurb: 'Drawing what you see, mixing colour from the ground, and posters that speak in three seconds.',
    topics: [
      {
        id: 'j-art-draw',
        title: 'Drawing what you see',
        realLife:
          "When Chidi draws the water bottle on the table, he starts with the big shape, checks how tall it is compared with its width, then adds the cap and label. Artists measure before they shade.",
        keyIdeas: [
          'Start with the overall shape, then work towards detail.',
          'Proportion is the size relationship between parts.',
          'Light falls on one side, so shadow forms on the opposite side.',
          'A contour line follows the edge of a form.',
        ],
        worked: {
          prompt: 'Plan a drawing of a chair.',
          steps: [
            'Sketch the overall box shape of the chair.',
            'Check the seat height against the backrest height.',
            'Add legs, then the smaller details.',
            'Shade the side away from the light last.',
          ],
          answer: 'Big shape → proportion check → detail → shading.',
        },
        questions: [
          {
            q: 'The first step in drawing an object from life is…',
            options: ['shading every corner', 'observing its overall shape', 'adding a signature', 'colouring the background'],
            correct: 1,
            explain: 'Observation of the whole form comes before detail.',
          },
          {
            q: 'Proportion in drawing means…',
            options: ['using many colours', 'the size relationship between parts', 'drawing very fast', 'using a ruler only'],
            correct: 1,
            explain: 'Proportion compares one part of the drawing with another.',
          },
          {
            q: 'A shadow appears on the side of an object that…',
            options: ['faces the light', 'is away from the light', 'is closest to you', 'is painted black'],
            correct: 1,
            explain: 'Light cannot reach the far side, so that is where shadow forms.',
          },
          {
            q: 'A contour line shows…',
            options: ['the outline or edge of a form', 'the temperature of an object', 'the sound of an object', 'the weight of an object'],
            correct: 0,
            explain: 'Contour lines trace edges and changes of surface.',
          },
        ],
      },
      {
        id: 'j-art-colour',
        title: 'Mixing colour with local materials',
        realLife:
          "Fine art students crush red laterite soil and mix it with water to paint. Red and yellow make orange; blue and yellow make green. The three primary colours cannot be mixed from others.",
        keyIdeas: [
          'Primary colours are red, yellow and blue.',
          'Secondary colours come from mixing two primaries.',
          'Complementary colours sit opposite each other on the colour wheel.',
          'Local pigments such as laterite and charcoal can replace shop paint.',
        ],
        worked: {
          prompt: 'You have only red, yellow and blue. How do you paint a green leaf with a brown stem?',
          steps: [
            'Mix blue and yellow to make green for the leaf.',
            'Mix red and yellow to make orange for the stem.',
            'Add a little blue to the orange to dull it towards brown.',
          ],
          answer: 'Green from blue + yellow; brown from orange darkened with blue.',
        },
        questions: [
          {
            q: 'Which pair mixes to make green?',
            options: ['Red and blue', 'Blue and yellow', 'Red and yellow', 'White and black'],
            correct: 1,
            explain: 'Blue and yellow are the two primaries that make green.',
          },
          {
            q: 'Red and yellow make…',
            options: ['purple', 'orange', 'green', 'brown'],
            correct: 1,
            explain: 'Red and yellow are both warm primaries, giving orange.',
          },
          {
            q: 'Which is a primary colour?',
            options: ['Green', 'Orange', 'Blue', 'Purple'],
            correct: 2,
            explain: 'Blue cannot be mixed from other colours.',
          },
          {
            q: 'Colours opposite each other on the colour wheel are…',
            options: ['primary', 'complementary', 'similar', 'neutral'],
            correct: 1,
            explain: 'Opposite pairs are called complementary colours.',
          },
        ],
      },
      {
        id: 'j-art-poster',
        title: 'Making a poster that speaks',
        realLife:
          "The school malaria poster has one big message, a large picture of a mosquito net and just six words. A poster works when a person walking past can read it in three seconds.",
        keyIdeas: [
          'One poster, one message.',
          'The focal point is where the eye lands first.',
          'Contrast makes the message stand out from the background.',
          'Short text is read; long text is skipped.',
        ],
        worked: {
          prompt: 'Design a poster for a school clean-up day.',
          steps: [
            'Message: “Clean school, healthy us”.',
            'Focal point: one large image of students with brooms.',
            'Supporting line: date and meeting point.',
            'Use two strong colours and leave white space.',
          ],
          answer: 'One image, one line, one clear action.',
        },
        questions: [
          {
            q: 'The most important rule of poster design is…',
            options: ['use as many colours as possible', 'one clear message', 'fill every space with text', 'use small writing'],
            correct: 1,
            explain: 'A poster has seconds to communicate, so it carries one message.',
          },
          {
            q: 'A focal point is…',
            options: ['the part the eye is drawn to first', 'the border of the poster', 'the smallest text', 'the printer’s name'],
            correct: 0,
            explain: 'The focal point is the visual centre of attention.',
          },
          {
            q: 'Strong contrast helps a poster by…',
            options: ['making it harder to read', 'making the message stand out', 'hiding the picture', 'using only pastel colours'],
            correct: 1,
            explain: 'Contrast separates the message from everything else.',
          },
          {
            q: 'Which text is best for a poster?',
            options: ['A 40-word paragraph', 'Six bold words', 'A long quotation', 'A list of addresses'],
            correct: 1,
            explain: 'Short, bold text can be read at a glance.',
          },
        ],
      },
    ],
  },
  {
    id: 'junior-music',
    subjectId: 'music',
    stage: 'junior',
    name: 'Music',
    emoji: '🎵',
    color: '#8b5cf6',
    soft: '#f5f3ff',
    blurb: 'Beat, Nigerian instruments and the harmony you hear in the school choir.',
    topics: [
      {
        id: 'j-music-beat',
        title: 'Keeping the beat',
        realLife:
          "At a wedding the talking drum holds the pulse while everyone claps along. The beat is the steady pulse; tempo is how fast it moves; metre groups beats into twos, threes or fours.",
        keyIdeas: [
          'The beat is the steady pulse you clap to.',
          'Tempo is the speed of the beat.',
          'Metre groups beats into bars of two, three or four.',
          'The first beat of a bar is the strongest — the downbeat.',
        ],
        worked: {
          prompt: 'Clap a four-beat pattern and mark the downbeat.',
          steps: [
            'Count 1 – 2 – 3 – 4 evenly.',
            'Clap louder on 1, the downbeat.',
            'Repeat without speeding up or slowing down.',
          ],
          answer: 'Four beats per bar, with beat 1 strongest.',
        },
        questions: [
          {
            q: 'The steady pulse in music is called the…',
            options: ['melody', 'beat', 'harmony', 'pitch'],
            correct: 1,
            explain: 'The beat is the underlying pulse.',
          },
          {
            q: 'Tempo describes…',
            options: ['how high a note is', 'how fast the music moves', 'how loud it is', 'how long it lasts'],
            correct: 1,
            explain: 'Tempo is speed.',
          },
          {
            q: 'A metre of three beats per bar is called…',
            options: ['duple', 'triple', 'quadruple', 'free'],
            correct: 1,
            explain: 'Three beats per bar is triple metre.',
          },
          {
            q: 'Clapping on every second beat gives a feel of…',
            options: ['three beats per bar', 'two beats per bar', 'no beat', 'five beats per bar'],
            correct: 1,
            explain: 'Two beats per bar is duple metre.',
          },
        ],
      },
      {
        id: 'j-music-inst',
        title: 'Instruments of Nigeria',
        realLife:
          "The talking drum can imitate the tone of Yoruba speech; the ekwe is a wooden slit drum from Igbo music; the kakaki is a long northern trumpet. Instruments carry language and history.",
        keyIdeas: [
          'Membranophones have a stretched skin, like the talking drum.',
          'Idiophones are struck bodies, like the ekwe slit drum.',
          'Aerophones use air, like the kakaki trumpet.',
          'Chordophones use strings, like the goje.',
        ],
        worked: {
          prompt: 'Sort the talking drum, ekwe and kakaki into instrument families.',
          steps: [
            'Talking drum has a skin head → membranophone.',
            'Ekwe is a struck wooden body → idiophone.',
            'Kakaki is blown → aerophone.',
          ],
          answer: 'Membranophone, idiophone, aerophone.',
        },
        questions: [
          {
            q: 'The talking drum is played by…',
            options: ['blowing into it', 'striking and squeezing its cords', 'plucking strings', 'shaking beads'],
            correct: 1,
            explain: 'Squeezing the cords changes the pitch of the skin.',
          },
          {
            q: 'The ekwe is made from…',
            options: ['metal', 'wood', 'clay', 'glass'],
            correct: 1,
            explain: 'The ekwe is a hollowed wooden slit drum.',
          },
          {
            q: 'A kakaki is a…',
            options: ['drum', 'flute-like trumpet', 'string instrument', 'rattle'],
            correct: 1,
            explain: 'The kakaki is a long metal trumpet of the north.',
          },
          {
            q: 'Instruments that are struck to sound belong to the…',
            options: ['string family', 'percussion family', 'wind family', 'electronic family'],
            correct: 1,
            explain: 'Struck instruments are percussion.',
          },
        ],
      },
      {
        id: 'j-music-harmony',
        title: 'Singing together',
        realLife:
          "In the school choir the lead singer calls a line and the choir answers — call and response. When two voices sing different notes that sound good together, that is harmony.",
        keyIdeas: [
          'Unison is everyone on the same note.',
          'Harmony is different notes sounding well together.',
          'Call and response alternates leader and group.',
          'A round enters voice by voice on the same melody.',
        ],
        worked: {
          prompt: 'Turn “Everybody clap your hands” into a call-and-response line.',
          steps: [
            'Leader sings: “Everybody clap your hands”.',
            'Group answers: “Clap your hands!”.',
            'Repeat with a second action, keeping the beat steady.',
          ],
          answer: 'Leader calls, group answers on the beat.',
        },
        questions: [
          {
            q: 'When everyone sings the same notes together it is called…',
            options: ['harmony', 'unison', 'solo', 'ostinato'],
            correct: 1,
            explain: 'Same notes together is unison.',
          },
          {
            q: 'Call and response is common in…',
            options: ['Western opera only', 'African communal singing', 'piano exams', 'orchestral tuning'],
            correct: 1,
            explain: 'Call and response is central to much African music.',
          },
          {
            q: 'Harmony happens when…',
            options: ['everyone sings the same note', 'different notes sound good together', 'someone sings alone', 'the drum stops'],
            correct: 1,
            explain: 'Harmony blends different pitches.',
          },
          {
            q: 'A round is a song where…',
            options: ['everyone starts together', 'singers enter one after another', 'no one sings', 'only drums play'],
            correct: 1,
            explain: 'Voices enter in turn, imitating the first.',
          },
        ],
      },
    ],
  },
]

/* -------------------------------- Senior ---------------------------------- */

export const seniorCurriculum: SubjectCurriculum[] = [
  {
    id: 'senior-maths',
    subjectId: 'maths',
    stage: 'senior',
    name: 'Mathematics',
    emoji: '📐',
    color: '#6c3fc5',
    soft: '#f0eefb',
    blurb: 'Data plans, cooperative savings and measuring a farm plot before planting.',
    topics: [
      {
        id: 's-maths-value',
        title: 'Data plans and airtime',
        realLife:
          "Amaka compares a 1.5 GB plan at ₦1,000 with a 4 GB plan at ₦2,400. The cheaper plan is not automatically the better value: she divides naira by gigabytes to find the cost of one gigabyte.",
        keyIdeas: [
          'Unit cost = total price ÷ quantity. Compare like with like.',
          'Percentage increase = (new − old) ÷ old × 100.',
          'Percentage decrease uses the same denominator: the original value.',
          'A “bonus” quoted as a percentage can hide a small absolute amount.',
        ],
        worked: {
          prompt: 'Which is better value: 1.5 GB for ₦1,000 or 4 GB for ₦2,400?',
          steps: [
            '₦1,000 ÷ 1.5 GB = ₦666.67 per GB',
            '₦2,400 ÷ 4 GB = ₦600.00 per GB',
            '₦600 < ₦666.67, so the 4 GB plan is cheaper per gigabyte.',
          ],
          answer: 'The 4 GB plan — ₦600 per GB against ₦667 per GB.',
        },
        questions: [
          {
            q: 'Which plan is better value?',
            options: ['1.5 GB for ₦1,000', '4 GB for ₦2,400', 'They are the same', 'Not enough information'],
            correct: 1,
            explain: '₦600 per GB beats ₦666.67 per GB.',
          },
          {
            q: 'A price rises from ₦4,000 to ₦5,000. The percentage increase is…',
            options: ['20%', '25%', '30%', '125%'],
            correct: 1,
            explain: 'Increase = ₦1,000. ₦1,000 ÷ ₦4,000 × 100 = 25%.',
          },
          {
            q: 'A phone drops from ₦120,000 to ₦90,000. The percentage decrease is…',
            options: ['20%', '25%', '30%', '33%'],
            correct: 1,
            explain: 'Decrease = ₦30,000. ₦30,000 ÷ ₦120,000 × 100 = 25%.',
          },
          {
            q: 'If 1 GB costs ₦600, how much do 3.5 GB cost?',
            options: ['₦1,800', '₦2,000', '₦2,100', '₦2,400'],
            correct: 2,
            explain: '3.5 × ₦600 = ₦2,100.',
          },
        ],
      },
      {
        id: 's-maths-compound',
        title: 'Saving with compound interest',
        realLife:
          "A cooperative account pays 10% compound interest a year. Unlike simple interest, each year's interest also earns interest — so ₦100,000 grows faster the longer it stays.",
        keyIdeas: [
          'Compound amount A = P(1 + r)ⁿ, where r is the rate as a decimal.',
          'Compound interest = A − P.',
          'Interest earned in year two is larger than in year one.',
          'More frequent compounding (monthly) grows faster than yearly.',
        ],
        worked: {
          prompt: 'Find the amount when ₦100,000 is invested at 10% compound interest for 2 years.',
          steps: [
            'r = 10% = 0.10',
            'A = 100,000 × (1.10)²',
            'A = 100,000 × 1.21 = ₦121,000',
            'Compound interest = ₦21,000',
          ],
          answer: '₦121,000, which is ₦21,000 of interest.',
        },
        questions: [
          {
            q: '₦100,000 at 10% compound interest for 2 years grows to…',
            options: ['₦120,000', '₦121,000', '₦122,000', '₦110,000'],
            correct: 1,
            explain: '₦100,000 × 1.1 × 1.1 = ₦121,000.',
          },
          {
            q: 'Compound interest differs from simple interest because…',
            options: ['it is always lower', 'interest also earns interest', 'it is paid once', 'it ignores the principal'],
            correct: 1,
            explain: 'Interest is added to the principal and earns interest itself.',
          },
          {
            q: 'The formula for compound amount is…',
            options: ['P(1 + r)ⁿ', 'P + rn', 'P(1 + rn)', 'P ÷ (1 + r)ⁿ'],
            correct: 0,
            explain: 'Each year multiplies the balance by (1 + r).',
          },
          {
            q: 'Which grows faster over 5 years at the same rate?',
            options: ['Simple interest', 'Compound interest', 'They are equal', 'Neither grows'],
            correct: 1,
            explain: 'Compounding adds interest on interest, so it pulls ahead.',
          },
        ],
      },
      {
        id: 's-maths-area',
        title: 'Measuring a farm plot',
        realLife:
          "Before planting, Amaka's uncle measures his rectangular plot with a 50 m tape. Area tells him how much seed he needs, perimeter tells him how much fencing to buy, and a diagonal check tells him whether the corners are truly square.",
        keyIdeas: [
          'Area of a rectangle = length × breadth; perimeter = 2(length + breadth).',
          'Pythagoras: in a right-angled triangle, a² + b² = c².',
          'A 3–4–5 triangle is always right-angled.',
          'Match units: 1 hectare = 10,000 m².',
        ],
        worked: {
          prompt: 'A plot measures 30 m by 40 m. Find its area, perimeter and diagonal.',
          steps: [
            'Area = 30 × 40 = 1,200 m²',
            'Perimeter = 2(30 + 40) = 140 m',
            'Diagonal² = 30² + 40² = 900 + 1,600 = 2,500',
            'Diagonal = √2,500 = 50 m',
          ],
          answer: '1,200 m², 140 m of fencing, 50 m diagonal.',
        },
        questions: [
          {
            q: 'A plot is 30 m by 40 m. Its area is…',
            options: ['70 m²', '140 m²', '1,200 m²', '1,400 m²'],
            correct: 2,
            explain: '30 × 40 = 1,200 m².',
          },
          {
            q: 'The fencing needed for the same plot is…',
            options: ['70 m', '140 m', '1,200 m', '50 m'],
            correct: 1,
            explain: 'Perimeter = 2(30 + 40) = 140 m.',
          },
          {
            q: 'The diagonal of a 30 m by 40 m rectangle is…',
            options: ['45 m', '50 m', '60 m', '70 m'],
            correct: 1,
            explain: '√(900 + 1,600) = √2,500 = 50 m.',
          },
          {
            q: 'Which theorem checks a right angle?',
            options: ["Pythagoras' theorem", "Newton's law", "Ohm's law", "Boyle's law"],
            correct: 0,
            explain: 'Pythagoras relates the three sides of a right-angled triangle.',
          },
        ],
      },
    ],
  },
  {
    id: 'senior-english',
    subjectId: 'english',
    stage: 'senior',
    name: 'English Language',
    emoji: '📖',
    color: '#0ea5e9',
    soft: '#e8f4fd',
    blurb: 'Scholarship letters, reading between the lines and the grammar WAEC rewards.',
    topics: [
      {
        id: 's-eng-formal',
        title: 'Applying for a scholarship',
        realLife:
          "A scholarship application is a formal letter: both addresses, a date, “Dear Sir/Madam”, a subject line, three tight paragraphs and “Yours faithfully”. No slang, no contractions, no long stories.",
        keyIdeas: [
          'Formal letters carry both addresses and a date.',
          'A subject line states the purpose in one line.',
          'Paragraph 1 states why you are writing; paragraph 2 gives evidence; paragraph 3 states what you want.',
          '“Dear Sir/Madam” pairs with “Yours faithfully”; a named person pairs with “Yours sincerely”.',
        ],
        worked: {
          prompt: 'Plan the body of a scholarship application.',
          steps: [
            'Opening: “I am writing to apply for the 2027 Academic Excellence Scholarship.”',
            'Evidence: results, positions held, one concrete achievement.',
            'Request: ask for the application form and state availability for an interview.',
            'Close: “Yours faithfully,” then your full name.',
          ],
          answer: 'Purpose, evidence, request — in three paragraphs.',
        },
        questions: [
          {
            q: "Which closing matches “Dear Sir/Madam”?",
            options: ['Yours sincerely,', 'Yours faithfully,', 'Best wishes,', 'Cheers,'],
            correct: 1,
            explain: 'An unnamed recipient takes “Yours faithfully”.',
          },
          {
            q: 'A formal letter should avoid…',
            options: ['a subject line', "contractions like “I'm”", 'a date', 'a clear paragraph structure'],
            correct: 1,
            explain: 'Formal register avoids contractions and slang.',
          },
          {
            q: "Where does the recipient's address go?",
            options: ['Below the signature', 'Above the salutation', 'Inside the last paragraph', 'On the envelope only'],
            correct: 1,
            explain: 'The recipient’s address sits on the left, above the salutation.',
          },
          {
            q: 'The purpose of the opening paragraph is to…',
            options: ['tell your life story', 'state why you are writing', 'list your grades', 'ask for a reply'],
            correct: 1,
            explain: 'Formal letters state their purpose immediately.',
          },
        ],
      },
      {
        id: 's-eng-inference',
        title: 'Reading between the lines',
        realLife:
          "A WAEC comprehension passage rarely states its point directly. “The bus crawled through Ojota, and Ada checked her watch for the fourth time” tells you she is late and anxious without ever saying so.",
        keyIdeas: [
          'Inference is a conclusion drawn from evidence in the text.',
          'Tone is the writer’s attitude, shown through word choice.',
          'Sarcasm says the opposite of what is meant.',
          'Always point to the words that support your answer.',
        ],
        worked: {
          prompt: 'What can you infer from “The bus crawled through Ojota, and Ada checked her watch for the fourth time”?',
          steps: [
            '“Crawled” shows very slow movement.',
            'Checking a watch four times shows repeated worry about time.',
            'Together they imply she is late for something important and anxious.',
          ],
          answer: 'Ada is delayed and growing anxious about the time.',
        },
        questions: [
          {
            q: '“Ada checked her watch for the fourth time” suggests she is…',
            options: ['relaxed', 'anxious about time', 'sleeping', 'lost'],
            correct: 1,
            explain: 'Repeated watch-checking signals worry about time.',
          },
          {
            q: 'An inference is a conclusion based on…',
            options: ['guessing only', 'evidence in the text', 'the title alone', "the reader's opinion"],
            correct: 1,
            explain: 'Inference must be supported by the passage.',
          },
          {
            q: 'The tone of “Oh, wonderful. Another delay.” is…',
            options: ['genuinely happy', 'sarcastic', 'formal', 'neutral'],
            correct: 1,
            explain: '“Wonderful” is used to mean the opposite.',
          },
          {
            q: 'Which detail best supports “the market was crowded”?',
            options: ['The sky was grey', 'People stood shoulder to shoulder', 'The shop was closed', 'Prices were high'],
            correct: 1,
            explain: 'Shoulder to shoulder is direct physical evidence of crowding.',
          },
        ],
      },
      {
        id: 's-eng-concord',
        title: 'Choosing the right word',
        realLife:
          "Editors check subject–verb agreement because one wrong word changes the meaning: “The number of students has risen” but “A number of students have complained”.",
        keyIdeas: [
          'A singular subject takes a singular verb.',
          '“The number of…” is singular; “a number of…” is plural.',
          'Affect is usually a verb; effect is usually a noun.',
          'Principal means main or head; principle means a rule or belief.',
        ],
        worked: {
          prompt: 'Correct the sentence: “The list of items were long.”',
          steps: [
            'Find the subject: “the list”, not “items”.',
            '“List” is singular.',
            'Use the singular verb: “was”.',
          ],
          answer: 'The list of items was long.',
        },
        questions: [
          {
            q: 'Choose the correct sentence.',
            options: ['The list of items were long.', 'The list of items was long.', 'The list of items were being long.', 'The lists of item was long.'],
            correct: 1,
            explain: 'The singular subject “list” takes “was”.',
          },
          {
            q: 'The medicine had no ___ on him.',
            options: ['affect', 'effect', 'affects', 'effecting'],
            correct: 1,
            explain: '“Effect” is the noun meaning result.',
          },
          {
            q: 'The school ___ spoke at assembly.',
            options: ['principle', 'principal', 'principals', 'principally'],
            correct: 1,
            explain: 'A principal is the head of a school.',
          },
          {
            q: '“A number of students ___ complained.”',
            options: ['has', 'have', 'is', 'was'],
            correct: 1,
            explain: '“A number of” is treated as plural.',
          },
        ],
      },
    ],
  },
  {
    id: 'senior-physics',
    subjectId: 'physics',
    stage: 'senior',
    name: 'Physics',
    emoji: '⚛️',
    color: '#10b981',
    soft: '#ecfdf5',
    blurb: 'Braking on wet roads, reading the meter at home and why a straw looks bent.',
    topics: [
      {
        id: 's-phy-braking',
        title: 'Stopping distance on a wet road',
        realLife:
          "A driver braking on a wet road needs a longer distance to stop. Thinking distance grows with speed; braking distance grows with the square of speed and gets worse when friction is reduced by water.",
        keyIdeas: [
          'First equation of motion: v = u + at.',
          'Distance moved: s = ut + ½at², or v² = u² + 2as.',
          'Stopping distance = thinking distance + braking distance.',
          'Wet roads reduce friction, so the deceleration a is smaller.',
        ],
        worked: {
          prompt: 'A car travelling at 20 m/s brakes with a deceleration of 4 m/s². Find the stopping time and distance.',
          steps: [
            'v = u + at → 0 = 20 − 4t → t = 5 s',
            's = ut + ½at² = 20(5) + ½(−4)(25)',
            's = 100 − 50 = 50 m',
          ],
          answer: 'It stops in 5 s after travelling 50 m.',
        },
        questions: [
          {
            q: 'A car at 20 m/s brakes at 4 m/s². How long does it take to stop?',
            options: ['4 s', '5 s', '6 s', '8 s'],
            correct: 1,
            explain: 't = u ÷ a = 20 ÷ 4 = 5 s.',
          },
          {
            q: 'Stopping distance on a wet road is longer because…',
            options: ['friction is greater', 'friction is reduced', 'the car is heavier', 'the engine is warmer'],
            correct: 1,
            explain: 'Water reduces friction between tyre and road.',
          },
          {
            q: 'If speed doubles, braking distance roughly…',
            options: ['stays the same', 'doubles', 'quadruples', 'halves'],
            correct: 2,
            explain: 'Braking distance depends on v², so doubling speed multiplies it by four.',
          },
          {
            q: 'Thinking distance depends mainly on…',
            options: ['tyre colour', 'reaction time and speed', 'road width', 'fuel type'],
            correct: 1,
            explain: 'The car keeps moving at speed during the driver’s reaction time.',
          },
        ],
      },
      {
        id: 's-phy-energy',
        title: 'The electricity bill at home',
        realLife:
          "A 2,000 W air conditioner running for five hours uses 10 kWh. Electricity is billed in kilowatt-hours, so the cost depends on power and time — not on how many sockets are in the wall.",
        keyIdeas: [
          'Power P = IV, measured in watts.',
          'Electrical energy = power × time.',
          '1 kWh = 1,000 W used for 1 hour.',
          'Cost = energy in kWh × price per kWh.',
        ],
        worked: {
          prompt: 'A 2,000 W air conditioner runs for 5 hours. Find the energy used and the cost at ₦200 per kWh.',
          steps: [
            'Energy = 2,000 W × 5 h = 10,000 Wh',
            'In kWh: 10,000 ÷ 1,000 = 10 kWh',
            'Cost = 10 × ₦200 = ₦2,000',
          ],
          answer: '10 kWh, costing ₦2,000.',
        },
        questions: [
          {
            q: 'A 2,000 W AC runs for 5 hours. Energy used is…',
            options: ['2 kWh', '5 kWh', '10 kWh', '20 kWh'],
            correct: 2,
            explain: '2,000 × 5 = 10,000 Wh = 10 kWh.',
          },
          {
            q: 'Electricity units on a bill are measured in…',
            options: ['watts', 'volts', 'kilowatt-hours', 'amperes'],
            correct: 2,
            explain: 'Bills charge for energy, measured in kWh.',
          },
          {
            q: 'At ₦200 per kWh, running that AC costs…',
            options: ['₦1,000', '₦2,000', '₦4,000', '₦10,000'],
            correct: 1,
            explain: '10 kWh × ₦200 = ₦2,000.',
          },
          {
            q: 'Power is calculated as…',
            options: ['current × voltage', 'current ÷ voltage', 'voltage ÷ current', 'energy × time'],
            correct: 0,
            explain: 'P = IV.',
          },
        ],
      },
      {
        id: 's-phy-refraction',
        title: 'Why a straw looks bent',
        realLife:
          "A straw in a glass of water appears to bend at the surface because light slows down as it moves from water into air. Refraction also makes a pool look shallower than it is — a real danger when swimming.",
        keyIdeas: [
          'Refraction is the bending of light as it changes speed between media.',
          'Refractive index n = speed of light in vacuum ÷ speed in the medium.',
          'Light bends towards the normal when entering a denser medium.',
          'Refraction makes objects appear shallower or displaced.',
        ],
        worked: {
          prompt: 'Explain why a coin at the bottom of a bucket looks higher than it really is.',
          steps: [
            'Light from the coin travels up through water, then into air.',
            'It speeds up and bends away from the normal at the surface.',
            'Your eye traces the ray back in a straight line, which places the coin higher.',
          ],
          answer: 'Refraction at the surface makes the coin appear raised.',
        },
        questions: [
          {
            q: 'A straw looks bent in water because of…',
            options: ['reflection', 'refraction', 'diffraction', 'dispersion'],
            correct: 1,
            explain: 'Light changes speed and direction at the water–air boundary.',
          },
          {
            q: 'Light bends when it…',
            options: ['changes speed between media', 'hits a mirror', 'passes a lens only', 'enters a vacuum'],
            correct: 0,
            explain: 'A change of speed is what causes refraction.',
          },
          {
            q: 'A pool looks shallower than it is because…',
            options: ['water is clean', 'light refracts at the surface', 'water absorbs colour', 'the floor is painted'],
            correct: 1,
            explain: 'Rays bend at the surface, so the floor appears raised.',
          },
          {
            q: 'Refractive index compares the speed of light in a vacuum with…',
            options: ['the speed of sound', 'its speed in a medium', 'its wavelength', 'its frequency'],
            correct: 1,
            explain: 'n = c ÷ v for that medium.',
          },
        ],
      },
    ],
  },
  {
    id: 'senior-chemistry',
    subjectId: 'chemistry',
    stage: 'senior',
    name: 'Chemistry',
    emoji: '🧪',
    color: '#f59e0b',
    soft: '#fffbeb',
    blurb: 'Hard water, cooking with acids and bases, and the real cost of rust.',
    topics: [
      {
        id: 's-chem-hardness',
        title: 'Hard water and soap',
        realLife:
          "In some towns soap refuses to lather. The water contains dissolved calcium and magnesium ions, which form scum with soap. Boiling removes temporary hardness; adding washing soda softens permanent hardness.",
        keyIdeas: [
          'Hard water contains dissolved calcium and magnesium ions.',
          'Temporary hardness is caused by hydrogencarbonates and is removed by boiling.',
          'Permanent hardness is caused by sulphates and chlorides and needs softening agents.',
          'Hardness forms scum with soap and wastes soap.',
        ],
        worked: {
          prompt: 'Explain why boiling softens temporary but not permanent hardness.',
          steps: [
            'Boiling decomposes calcium hydrogencarbonate into insoluble calcium carbonate.',
            'The calcium ions leave the water, so it lathers.',
            'Calcium sulphate does not decompose on boiling, so permanent hardness remains.',
          ],
          answer: 'Boiling removes hydrogencarbonates only.',
        },
        questions: [
          {
            q: 'Hard water contains dissolved…',
            options: ['sodium chloride only', 'calcium and magnesium ions', 'oxygen', 'sugar'],
            correct: 1,
            explain: 'Calcium and magnesium ions cause hardness.',
          },
          {
            q: 'Temporary hardness is removed by…',
            options: ['freezing', 'boiling', 'adding soap', 'filtering through cloth'],
            correct: 1,
            explain: 'Boiling precipitates the hydrogencarbonates.',
          },
          {
            q: 'Scum forms when soap reacts with…',
            options: ['water only', 'calcium ions', 'oxygen', 'carbon'],
            correct: 1,
            explain: 'Calcium ions form an insoluble scum with soap.',
          },
          {
            q: 'Which softens permanent hardness?',
            options: ['Boiling', 'Washing soda', 'Stirring', 'Cooling'],
            correct: 1,
            explain: 'Washing soda precipitates the calcium and magnesium ions.',
          },
        ],
      },
      {
        id: 's-chem-ph',
        title: 'Cooking with acids and bases',
        realLife:
          "Lime juice cuts the fishiness of fish; baking soda makes cakes rise; an antacid neutralises stomach acid. The pH scale tells you where a substance sits between 0 and 14.",
        keyIdeas: [
          'pH below 7 is acidic; 7 is neutral; above 7 is basic.',
          'Acid + base → salt + water (neutralisation).',
          'Indicators such as litmus and hibiscus extract show acidity.',
          'Strong acids and bases are corrosive at the extremes of the scale.',
        ],
        worked: {
          prompt: 'A solution has pH 3. Is it acidic, neutral or basic? What happens when sodium hydroxide is added?',
          steps: [
            'pH 3 is below 7, so the solution is acidic.',
            'Sodium hydroxide is a base.',
            'They neutralise, forming a salt and water, and the pH rises towards 7.',
          ],
          answer: 'Acidic; adding a base neutralises it.',
        },
        questions: [
          {
            q: 'A substance with pH 3 is…',
            options: ['strongly basic', 'acidic', 'neutral', 'alkaline'],
            correct: 1,
            explain: 'Below 7 is acidic.',
          },
          {
            q: 'Acid + base gives…',
            options: ['salt and water', 'gas only', 'pure acid', 'metal'],
            correct: 0,
            explain: 'This is neutralisation.',
          },
          {
            q: 'Which household item is a base?',
            options: ['Lemon juice', 'Vinegar', 'Baking soda', 'Coca-Cola'],
            correct: 2,
            explain: 'Baking soda (sodium hydrogencarbonate) is basic.',
          },
          {
            q: 'A neutral solution has a pH of…',
            options: ['0', '7', '10', '14'],
            correct: 1,
            explain: 'Pure water is neutral at pH 7.',
          },
        ],
      },
      {
        id: 's-chem-rust',
        title: 'Rust and the cost of iron',
        realLife:
          "A gate left unpainted in the rain rusts within months. Iron reacts with oxygen and water to form hydrated iron(III) oxide; painting, oiling or galvanising blocks the reaction.",
        keyIdeas: [
          'Rusting needs both oxygen and water.',
          'Rust is hydrated iron(III) oxide, which flakes and exposes fresh iron.',
          'Barrier methods: paint, oil, grease, plastic coating.',
          'Sacrificial protection: zinc (galvanising) corrodes instead of iron.',
        ],
        worked: {
          prompt: 'Why does galvanising protect iron even when the zinc coating is scratched?',
          steps: [
            'Zinc is more reactive than iron.',
            'It corrodes first, sacrificing itself.',
            'The iron underneath is left intact.',
          ],
          answer: 'Zinc acts as a sacrificial metal.',
        },
        questions: [
          {
            q: 'Rusting needs…',
            options: ['oxygen and water', 'carbon dioxide only', 'salt only', 'sunlight only'],
            correct: 0,
            explain: 'Both oxygen and water are required.',
          },
          {
            q: 'Galvanising protects iron by coating it with…',
            options: ['paint', 'zinc', 'oil', 'plastic'],
            correct: 1,
            explain: 'Zinc coating is galvanising.',
          },
          {
            q: 'Rust is chemically…',
            options: ['iron sulphide', 'hydrated iron(III) oxide', 'iron chloride', 'pure iron'],
            correct: 1,
            explain: 'Rust is hydrated iron(III) oxide.',
          },
          {
            q: 'Which slows rusting?',
            options: ['Leaving iron in the rain', 'Painting the surface', 'Scratching the paint', 'Storing it in water'],
            correct: 1,
            explain: 'Paint keeps oxygen and water away from the iron.',
          },
        ],
      },
    ],
  },
  {
    id: 'senior-biology',
    subjectId: 'biology',
    stage: 'senior',
    name: 'Biology',
    emoji: '🧬',
    color: '#ec4899',
    soft: '#fdf2f8',
    blurb: 'Malaria, a balanced plate and the genetics you can see in your own family.',
    topics: [
      {
        id: 's-bio-malaria',
        title: 'Malaria and mosquitoes',
        realLife:
          "Malaria is spread by the female Anopheles mosquito, which needs standing water to breed. Draining puddles, using treated nets and taking prophylaxis each interrupt a different part of the parasite's life cycle.",
        keyIdeas: [
          'The Plasmodium parasite causes malaria; the mosquito is the vector.',
          'Only the female Anopheles bites, because she needs blood for eggs.',
          'Standing water is the breeding site.',
          'Control targets the vector: nets, spraying, drainage.',
        ],
        worked: {
          prompt: 'Give three ways to break the malaria transmission cycle.',
          steps: [
            'Remove standing water so mosquitoes cannot breed.',
            'Sleep under insecticide-treated nets so they cannot bite.',
            'Treat infected people so the parasite cannot be picked up.',
          ],
          answer: 'Block breeding, block biting, treat carriers.',
        },
        questions: [
          {
            q: 'Malaria is transmitted by…',
            options: ['the male Anopheles mosquito', 'the female Anopheles mosquito', 'houseflies', 'tsetse flies'],
            correct: 1,
            explain: 'The female bites to obtain blood for her eggs.',
          },
          {
            q: 'Mosquitoes breed in…',
            options: ['dry sand', 'standing water', 'tall grass only', 'cooking pots'],
            correct: 1,
            explain: 'Larvae develop in still water.',
          },
          {
            q: 'Which measure prevents malaria?',
            options: ['Sleeping under an untreated sheet', 'Using an insecticide-treated net', 'Drinking more water', 'Eating more fruit'],
            correct: 1,
            explain: 'Treated nets stop the bite that transmits the parasite.',
          },
          {
            q: 'The organism that carries a disease is called a…',
            options: ['host', 'vector', 'parasite', 'predator'],
            correct: 1,
            explain: 'A vector transmits a pathogen between hosts.',
          },
        ],
      },
      {
        id: 's-bio-diet',
        title: 'Food and energy',
        realLife:
          "A plate of rice alone gives energy but little body-building protein. A balanced diet combines carbohydrates, proteins, fats, vitamins, minerals and water — and each deficiency shows up in a specific way, such as night blindness from lack of vitamin A.",
        keyIdeas: [
          'Carbohydrates and fats supply energy; proteins build and repair.',
          'Vitamins and minerals regulate body processes.',
          'Deficiency diseases: night blindness (A), scurvy (C), rickets (D and calcium), anaemia (iron).',
          'A balanced diet matches energy intake to activity.',
        ],
        worked: {
          prompt: 'Improve a meal of plain rice to make it more balanced.',
          steps: [
            'Rice supplies carbohydrate energy.',
            'Add beans or fish for protein.',
            'Add vegetables for vitamins and minerals.',
            'Add water or fruit to complete the plate.',
          ],
          answer: 'Rice + protein + vegetables + fruit.',
        },
        questions: [
          {
            q: 'Which food class builds and repairs the body?',
            options: ['Carbohydrates', 'Proteins', 'Fats', 'Water'],
            correct: 1,
            explain: 'Proteins are the body-building foods.',
          },
          {
            q: 'Night blindness is caused by a lack of…',
            options: ['vitamin A', 'vitamin C', 'iron', 'calcium'],
            correct: 0,
            explain: 'Vitamin A is needed by the retina.',
          },
          {
            q: 'Which is a source of carbohydrate?',
            options: ['Beans', 'Rice', 'Fish', 'Palm oil'],
            correct: 1,
            explain: 'Rice is a starchy staple.',
          },
          {
            q: 'Rickets results from a deficiency of…',
            options: ['vitamin D and calcium', 'protein', 'vitamin C', 'water'],
            correct: 0,
            explain: 'Without vitamin D, calcium is poorly absorbed and bones soften.',
          },
        ],
      },
      {
        id: 's-bio-genetics',
        title: 'Genetics in the family',
        realLife:
          "Two brown-eyed parents can have a blue-eyed child if both carry the recessive allele. Genotype is the pair of alleles; phenotype is what you see. A Punnett square predicts the possible children.",
        keyIdeas: [
          'Each child inherits one allele from each parent.',
          'Dominant alleles show even when paired with a recessive one.',
          'A recessive trait appears only when both alleles are recessive.',
          'A cross of two heterozygotes gives a 3 : 1 phenotypic ratio.',
        ],
        worked: {
          prompt: 'Cross Bb × Bb and describe the possible children.',
          steps: [
            'Possible gametes: B or b from each parent.',
            'Offspring: BB, Bb, bB, bb.',
            'Three show the dominant trait; one shows the recessive trait.',
          ],
          answer: '3 dominant : 1 recessive.',
        },
        questions: [
          {
            q: 'A child inherits one allele from…',
            options: ['each parent', 'the mother only', 'the father only', 'a sibling'],
            correct: 0,
            explain: 'One allele comes from each parent.',
          },
          {
            q: 'Bb × Bb gives what ratio of dominant to recessive phenotypes?',
            options: ['1 : 1', '3 : 1', '2 : 1', '1 : 3'],
            correct: 1,
            explain: 'Three of four combinations show the dominant trait.',
          },
          {
            q: 'The visible characteristic is the…',
            options: ['genotype', 'phenotype', 'allele', 'chromosome'],
            correct: 1,
            explain: 'Phenotype is the observable trait.',
          },
          {
            q: 'A recessive trait appears only when…',
            options: ['one recessive allele is present', 'both alleles are recessive', 'no alleles are present', 'the trait is dominant'],
            correct: 1,
            explain: 'The recessive allele must be homozygous to show.',
          },
        ],
      },
    ],
  },
  {
    id: 'senior-government',
    subjectId: 'government',
    stage: 'senior',
    name: 'Government',
    emoji: '🏛️',
    color: '#8b5cf6',
    soft: '#f5f3ff',
    blurb: 'How a bill becomes law, who fixes which road, and why your vote matters.',
    topics: [
      {
        id: 's-gov-bill',
        title: 'How a bill becomes law',
        realLife:
          "A proposal to ban plastic bags starts as a bill, is debated and voted on in the legislature, then signed by the executive. Knowing the stages explains why change takes months — and where citizens can influence it.",
        keyIdeas: [
          'First reading introduces the bill; second reading debates its principles.',
          'The committee stage examines it clause by clause.',
          'Third reading takes the final vote.',
          'Executive assent turns the bill into an Act.',
        ],
        worked: {
          prompt: 'Trace a bill from proposal to law.',
          steps: [
            'First reading: the bill is formally introduced.',
            'Second reading: general debate on its principles.',
            'Committee stage: detailed clause-by-clause review.',
            'Third reading: final vote.',
            'Assent: the executive signs it into law.',
          ],
          answer: 'Introduction → debate → committee → vote → assent.',
        },
        questions: [
          {
            q: 'A bill becomes law after…',
            options: ['the first reading', 'the committee stage', 'presidential assent', 'the second reading'],
            correct: 2,
            explain: 'Assent is the final step.',
          },
          {
            q: 'Detailed examination of a bill happens at the…',
            options: ['first reading', 'committee stage', 'third reading', 'assent'],
            correct: 1,
            explain: 'Committees examine clauses in detail.',
          },
          {
            q: 'Who can propose a bill?',
            options: ['Only the president', 'Legislators, and citizens through their representatives', 'Only judges', 'Only governors'],
            correct: 1,
            explain: 'Bills are sponsored by legislators on behalf of citizens.',
          },
          {
            q: 'A bill that fails to pass is…',
            options: ['assented', 'thrown out', 'amended into law automatically', 'sent to court'],
            correct: 1,
            explain: 'Without a majority vote the bill fails.',
          },
        ],
      },
      {
        id: 's-gov-federalism',
        title: 'Federal, state, local',
        realLife:
          "The federal government handles defence and currency; states run secondary schools and hospitals; local governments handle markets and local roads. Knowing which tier owns a problem tells you who to hold accountable.",
        keyIdeas: [
          'Nigeria is a federation of 36 states and the FCT.',
          'The exclusive list belongs to the federal government.',
          'The concurrent list is shared by federal and state governments.',
          'Residual matters fall to the states.',
        ],
        worked: {
          prompt: 'A state wants to build a new general hospital. Which tier is responsible?',
          steps: [
            'Health is a concurrent matter, so both federal and state can act.',
            'General hospitals serving a state are normally a state responsibility.',
            'The state government funds and runs it.',
          ],
          answer: 'The state government, within the concurrent list.',
        },
        questions: [
          {
            q: 'Defence and currency are…',
            options: ['concurrent matters', 'exclusive federal matters', 'local government matters', 'state matters'],
            correct: 1,
            explain: 'They appear on the exclusive legislative list.',
          },
          {
            q: 'Nigeria operates a…',
            options: ['unitary system', 'federal system', 'confederal system', 'monarchy'],
            correct: 1,
            explain: 'Power is shared between federal and state governments.',
          },
          {
            q: 'Local roads and markets are the duty of…',
            options: ['the federal government', 'state governments', 'local governments', 'traditional rulers'],
            correct: 2,
            explain: 'Local services sit with local government.',
          },
          {
            q: 'Powers shared by federal and state governments are on the…',
            options: ['exclusive list', 'concurrent list', 'residual list', 'civil list'],
            correct: 1,
            explain: 'The concurrent list is shared.',
          },
        ],
      },
      {
        id: 's-gov-elections',
        title: 'Voting and your voice',
        realLife:
          "At 18 Amaka can register, collect her PVC and vote. Free and fair elections need an independent commission, a secret ballot and an accurate register — each protects a different part of the process.",
        keyIdeas: [
          'The franchise is the right to vote; in Nigeria it starts at 18.',
          'INEC organises federal and state elections.',
          'A secret ballot protects the voter’s choice.',
          'Vote buying and ballot snatching are electoral malpractice.',
        ],
        worked: {
          prompt: 'Explain how a secret ballot protects democracy.',
          steps: [
            'No one can see how you voted.',
            'So no one can punish or reward you for your choice.',
            'Voters can therefore choose freely.',
          ],
          answer: 'It removes pressure and lets voters choose freely.',
        },
        questions: [
          {
            q: 'The minimum voting age in Nigeria is…',
            options: ['16', '17', '18', '21'],
            correct: 2,
            explain: 'The constitution sets the voting age at 18.',
          },
          {
            q: 'A secret ballot protects…',
            options: ['the candidate', "the voter's choice", 'the commission', 'the press'],
            correct: 1,
            explain: 'It keeps each vote private.',
          },
          {
            q: 'INEC is responsible for…',
            options: ['making laws', 'conducting elections', 'judging disputes', 'printing money'],
            correct: 1,
            explain: 'INEC is the independent electoral commission.',
          },
          {
            q: 'Which is an electoral malpractice?',
            options: ['Registering to vote', 'Vote buying', 'Casting a secret ballot', 'Attending a rally'],
            correct: 1,
            explain: 'Paying for votes undermines free choice.',
          },
        ],
      },
    ],
  },
]

export const allCurriculum = [...juniorCurriculum, ...seniorCurriculum]

export function curriculumFor(stage: 'junior' | 'senior') {
  return stage === 'junior' ? juniorCurriculum : seniorCurriculum
}

export function subjectBySubjectId(stage: 'junior' | 'senior', subjectId: string) {
  return curriculumFor(stage).find((subject) => subject.subjectId === subjectId) ?? null
}

export function findTopic(topicId: string) {
  for (const subject of allCurriculum) {
    const topic = subject.topics.find((item) => item.id === topicId)
    if (topic) return { subject, topic }
  }
  return null
}
