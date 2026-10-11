import type { Topic } from '@/game/types';

/**
 * The topics that ship with the app. All free, all written in-house.
 *
 * A good secret word is something everyone at the table knows, with plenty of
 * sides to give a one-word clue about and a few close neighbours in the same
 * topic, so an imposter can bluff toward it. Nothing a twelve-year-old
 * couldn't play with their grandparents.
 *
 * Ids are stable: a player's topic picks are saved by id.
 */
export const BUNDLED_TOPICS: readonly Topic[] = [
  {
    id: 'food',
    name: 'Food',
    emoji: '🍕',
    color: 'orange',
    builtIn: true,
    words: [
      'Pizza', 'Sushi', 'Tacos', 'Pancakes', 'Spaghetti', 'Burger', 'Popcorn', 'Ice cream', 'Donut', 'Curry',
      'Ramen', 'Burrito', 'Hot dog', 'Waffles', 'Lasagna', 'Nachos', 'Dumplings', 'Croissant', 'Cheesecake', 'Salad',
      'French fries', 'Omelette', 'Pretzel', 'Bagel', 'Mac and cheese', 'Fried chicken', 'Brownie', 'Sandwich', 'Soup', 'Steak',
      'Pie', 'Cupcake', 'Grilled cheese', 'Cereal', 'Toast', 'Smoothie', 'Popsicle', 'Kebab', 'Paella', 'Hummus',
      'Corn dog', 'Meatballs', 'Fondue', 'Chocolate', 'Watermelon', 'Avocado', 'Banana bread', 'Pad thai', 'Churros', 'Milkshake',
    ],
  },
  {
    id: 'animals',
    name: 'Animals',
    emoji: '🦁',
    color: 'teal',
    builtIn: true,
    words: [
      'Lion', 'Penguin', 'Elephant', 'Giraffe', 'Shark', 'Octopus', 'Kangaroo', 'Owl', 'Dolphin', 'Panda',
      'Snake', 'Flamingo', 'Tiger', 'Koala', 'Crocodile', 'Bat', 'Sloth', 'Zebra', 'Camel', 'Peacock',
      'Turtle', 'Frog', 'Bee', 'Spider', 'Horse', 'Rabbit', 'Squirrel', 'Gorilla', 'Polar bear', 'Hedgehog',
      'Jellyfish', 'Parrot', 'Wolf', 'Fox', 'Hippo', 'Rhino', 'Chameleon', 'Butterfly', 'Skunk', 'Raccoon',
      'Eagle', 'Goldfish', 'Lobster', 'Moose', 'Otter', 'Pig', 'Cow', 'Llama', 'Seal', 'Ladybug',
    ],
  },
  {
    id: 'places',
    name: 'Places',
    emoji: '🏝️',
    color: 'indigo',
    builtIn: true,
    words: [
      'Beach', 'Airport', 'Hospital', 'Library', 'Zoo', 'Gym', 'Casino', 'Museum', 'Cinema', 'Supermarket',
      'Hotel', 'School', 'Prison', 'Farm', 'Castle', 'Desert', 'Jungle', 'Space station', 'Submarine', 'Cruise ship',
      'Theme park', 'Campsite', 'Bakery', 'Dentist', 'Bowling alley', 'Stadium', 'Train station', 'Church', 'Ski resort', 'Volcano',
      'Igloo', 'Laundromat', 'Police station', 'Fire station', 'Bank', 'Wedding', 'Circus', 'Aquarium', 'Office', 'Spa',
      'Haunted house', 'Pirate ship', 'Car wash', 'Night club', 'Farmers market', 'Arcade', 'Waterpark', 'Mall', 'Lighthouse', 'Garden',
    ],
  },
  {
    id: 'jobs',
    name: 'Jobs',
    emoji: '🧑‍🚒',
    color: 'yellow',
    builtIn: true,
    words: [
      'Firefighter', 'Teacher', 'Doctor', 'Chef', 'Pilot', 'Astronaut', 'Plumber', 'Lawyer', 'Dentist', 'Farmer',
      'Police officer', 'Magician', 'Clown', 'Lifeguard', 'Barber', 'Mail carrier', 'Nurse', 'Vet', 'Architect', 'Photographer',
      'DJ', 'Waiter', 'Mechanic', 'Scientist', 'Librarian', 'Judge', 'Baker', 'Electrician', 'Zookeeper', 'Detective',
      'Taxi driver', 'Actor', 'Painter', 'Soldier', 'Coach', 'Flight attendant', 'Cashier', 'Tattoo artist', 'Fisherman', 'Gardener',
      'Spy', 'Surgeon', 'Reporter', 'Carpenter', 'Pirate', 'Personal trainer', 'Ballet dancer', 'Referee', 'Bus driver', 'Influencer',
    ],
  },
  {
    id: 'movies',
    name: 'Movies & TV',
    emoji: '🎬',
    color: 'purple',
    builtIn: true,
    words: [
      'Titanic', 'Frozen', 'Shrek', 'Jaws', 'Star Wars', 'Harry Potter', 'The Lion King', 'Toy Story', 'Jurassic Park', 'Finding Nemo',
      'Spider-Man', 'Batman', 'The Avengers', 'Barbie', 'Home Alone', 'Mean Girls', 'The Simpsons', 'Friends', 'Stranger Things', 'Grease',
      'The Wizard of Oz', 'Rocky', 'Ghostbusters', 'Back to the Future', 'Up', 'Cars', 'Moana', 'Encanto', 'Minions', 'Mario',
      'Pirates of the Caribbean', 'Lord of the Rings', 'The Matrix', 'Indiana Jones', 'Top Gun', 'Wednesday', 'SpongeBob', 'The Office', 'Squid Game', 'Aladdin',
      'Mamma Mia', 'Hunger Games', 'Twilight', 'Inside Out', 'Kung Fu Panda', 'Pokémon', 'Madagascar', 'Zootopia', 'Cinderella', 'E.T.',
    ],
  },
  {
    id: 'sports',
    name: 'Sports',
    emoji: '⚽',
    color: 'magenta',
    builtIn: true,
    words: [
      'Soccer', 'Basketball', 'Tennis', 'Golf', 'Swimming', 'Boxing', 'Surfing', 'Skiing', 'Baseball', 'Bowling',
      'Volleyball', 'Ice hockey', 'Skateboarding', 'Cycling', 'Gymnastics', 'Wrestling', 'Karate', 'Archery', 'Fencing', 'Rowing',
      'Marathon', 'Table tennis', 'Badminton', 'Rugby', 'Cricket', 'Horse racing', 'Figure skating', 'Snowboarding', 'Rock climbing', 'Diving',
      'Darts', 'Pool', 'Sumo', 'Formula 1', 'Yoga', 'Dodgeball', 'Lacrosse', 'Water polo', 'Weightlifting', 'Hurdles',
      'Javelin', 'Bobsled', 'Kayaking', 'Fishing', 'Mini golf', 'Pickleball', 'Football', 'Triathlon', 'Curling', 'Parkour',
    ],
  },
  {
    id: 'home',
    name: 'Around the house',
    emoji: '🛋️',
    color: 'teal',
    builtIn: true,
    words: [
      'Toaster', 'Couch', 'Bathtub', 'Fridge', 'Microwave', 'Pillow', 'Toothbrush', 'Vacuum', 'Mirror', 'Lamp',
      'Remote control', 'Washing machine', 'Doorbell', 'Blanket', 'Kettle', 'Fork', 'Umbrella', 'Alarm clock', 'Curtains', 'Bookshelf',
      'Oven', 'Shower', 'Ladder', 'Candle', 'Hairdryer', 'Fan', 'Rug', 'Fireplace', 'Plant', 'Broom',
      'Dishwasher', 'Bunk bed', 'Wi-Fi router', 'Trash can', 'Coat hanger', 'Mailbox', 'Garage', 'Staircase', 'Smoke alarm', 'Frying pan',
      'Rubber duck', 'Toilet paper', 'Sponge', 'Iron', 'Keys', 'Clock', 'Piggy bank', 'Doormat', 'Laptop', 'Wardrobe',
    ],
  },
  {
    id: 'music',
    name: 'Music',
    emoji: '🎸',
    color: 'purple',
    builtIn: true,
    words: [
      'Guitar', 'Piano', 'Drums', 'Violin', 'Trumpet', 'Saxophone', 'Microphone', 'Karaoke', 'Concert', 'Choir',
      'Harp', 'Flute', 'Banjo', 'Ukulele', 'Accordion', 'Bagpipes', 'Tambourine', 'Xylophone', 'Cello', 'Harmonica',
      'Headphones', 'Vinyl record', 'Boy band', 'Opera', 'Rap', 'Jazz', 'Disco', 'Country', 'Heavy metal', 'Lullaby',
      'Music festival', 'Orchestra', 'Conductor', 'Encore', 'Mosh pit', 'Playlist', 'Radio', 'Music video', 'Talent show', 'Busker',
      'Triangle', 'Cowbell', 'Air guitar', 'Rock star', 'National anthem', 'Jingle', 'Marching band', 'DJ booth', 'Love song', 'Duet',
    ],
  },
  {
    id: 'party',
    name: 'Party',
    emoji: '🎉',
    color: 'magenta',
    builtIn: true,
    words: [
      'Balloon', 'Birthday cake', 'Piñata', 'Confetti', 'Costume', 'Dance floor', 'Party hat', 'Sleepover', 'Karaoke night', 'Surprise party',
      'Fireworks', 'Pool party', 'Barbecue', 'Bonfire', 'Limbo', 'Musical chairs', 'Truth or dare', 'Disco ball', 'Glow sticks', 'Photo booth',
      'Gift', 'Candles', 'Streamers', 'Punch bowl', 'Pizza party', 'Board game', 'Charades', 'Hide and seek', 'Bounce house', 'Face paint',
      'Wedding', 'Graduation', 'Baby shower', 'New Year', 'Halloween', 'Prom', 'Talent show', 'Picnic', 'Tea party', 'Toga party',
      'Party popper', 'Goodie bag', 'Magic show', 'Slow dance', 'Selfie', 'Group chat', 'DJ', 'After party', 'Thank-you card', 'Cake smash',
    ],
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    emoji: '🐉',
    color: 'indigo',
    builtIn: true,
    words: [
      'Dragon', 'Unicorn', 'Wizard', 'Mermaid', 'Vampire', 'Werewolf', 'Ghost', 'Zombie', 'Fairy', 'Troll',
      'Witch', 'Giant', 'Elf', 'Goblin', 'Phoenix', 'Robot', 'Alien', 'Superhero', 'Pirate', 'Knight',
      'Princess', 'Genie', 'Ninja', 'Cyclops', 'Yeti', 'Mummy', 'Centaur', 'Sphinx', 'Leprechaun', 'Santa',
      'Tooth fairy', 'Easter bunny', 'Time machine', 'Magic wand', 'Flying carpet', 'Crystal ball', 'Treasure map', 'Invisibility cloak', 'Haunted castle', 'Spell book',
      'Potion', 'Portal', 'Talking cat', 'Kraken', 'Bigfoot', 'Loch Ness monster', 'Frankenstein', 'Grim reaper', 'Cupid', 'Gnome',
    ],
  },
  {
    id: 'school',
    name: 'School',
    emoji: '🎒',
    color: 'yellow',
    builtIn: true,
    words: [
      'Homework', 'Recess', 'Detention', 'Lunchbox', 'Backpack', 'Pop quiz', 'Field trip', 'Yearbook', 'Graduation', 'Locker',
      'Principal', 'Cafeteria', 'Gym class', 'Chalkboard', 'Pencil', 'Eraser', 'Science fair', 'Spelling bee', 'Report card', 'School bus',
      'Hall pass', 'Fire drill', 'Group project', 'Substitute teacher', 'Snow day', 'Prom', 'Library card', 'Calculator', 'Crayons', 'Glue stick',
      'History', 'Math', 'Art class', 'Music class', 'Microscope', 'Exam', 'Summer break', 'Class photo', 'Show and tell', 'Nap time',
      'Hallway', 'Bell', 'Uniform', 'Notebook', 'Ruler', 'Globe', 'Sticker chart', 'Teacher’s pet', 'Cheerleader', 'Mascot',
    ],
  },
  {
    id: 'travel',
    name: 'Travel',
    emoji: '✈️',
    color: 'orange',
    builtIn: true,
    words: [
      'Passport', 'Suitcase', 'Road trip', 'Jet lag', 'Souvenir', 'Postcard', 'Map', 'Tent', 'Motel', 'Hostel',
      'Paris', 'New York', 'Tokyo', 'London', 'Rome', 'Egypt', 'Hawaii', 'Las Vegas', 'Australia', 'Mexico',
      'Eiffel Tower', 'Statue of Liberty', 'Great Wall of China', 'Pyramids', 'Grand Canyon', 'Niagara Falls', 'Mount Everest', 'Big Ben', 'Hollywood', 'Venice',
      'Sunscreen', 'Flip-flops', 'Backpacking', 'Train', 'Cruise', 'Hot air balloon', 'Gondola', 'Safari', 'Snorkel', 'Duty free',
      'Window seat', 'Boarding pass', 'Tour guide', 'Room service', 'Lost luggage', 'Selfie stick', 'Camper van', 'Layover', 'Customs', 'Beach towel',
    ],
  },
];

/** Words in every bundled topic: shown on the Topics page. */
export const BUNDLED_WORD_COUNT = BUNDLED_TOPICS.reduce((sum, t) => sum + t.words.length, 0);
