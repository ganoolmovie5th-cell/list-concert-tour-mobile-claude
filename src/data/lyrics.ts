/**
 * lyrics.ts — Static Lyrics untuk Karaoke Mode
 * Key = concert ID. Berisi lagu-lagu populer artis.
 * Untuk setlist karaoke — menampilkan lirik saat konser.
 */

export interface LyricLine {
  time?: number; // detik dari awal lagu (opsional, untuk sync)
  text: string;
}

export interface SongLyrics {
  title: string;
  artist: string;
  lines: LyricLine[];
  spotifyId?: string;
}

export const LYRICS: Record<string, SongLyrics[]> = {

  'bts-jakarta-2026': [
    {
      title: 'Dynamite',
      artist: 'BTS',
      spotifyId: '0t1kP63rueHleOhQkYSXFY',
      lines: [
        { text: "'Cause I, I, I'm in the stars tonight" },
        { text: 'So watch me bring the fire and set the night alight' },
        { text: 'Shining through the city with a little funk and soul' },
        { text: "So I'ma light it up like dynamite" },
        { text: 'Dy-na-na-na, na-na, na-na, na, ayy' },
        { text: 'Dy-na-na-na, na-na, na-na, na, ayy' },
        { text: 'Dy-na-na-na, na-na, na-na, na' },
        { text: 'Light it up like dynamite' },
        { text: '— ✨ Verse 2 ✨ —' },
        { text: 'Bring a friend, join the crowd' },
        { text: "Whoever wanna come along, word up, talk the talk" },
        { text: 'Just move like we off the wall' },
        { text: "Day or night the sky's alight" },
        { text: 'So we dance to the break of dawn' },
        { text: "Ladies and gentlemen, I got the medicine" },
        { text: 'So you should keep ya eyes on me' },
      ],
    },
    {
      title: 'Boy With Luv',
      artist: 'BTS ft. Halsey',
      lines: [
        { text: 'Oh my, my, my' },
        { text: "I've waited all my life" },
        { text: "I think I know now what I'd like" },
        { text: 'Boy with luv' },
        { text: 'Oh my, oh my, oh my' },
        { text: "Oh I'd like you just as you are" },
        { text: 'How's your day? Oh tell me' },
        { text: "'Cause I care" },
        { text: "How's your night? Oh tell me" },
        { text: "'Cause I care" },
      ],
    },
    {
      title: 'Butter',
      artist: 'BTS',
      lines: [
        { text: 'Smooth like butter, like a criminal undercover' },
        { text: "Gon' pop like trouble breaking into your heart like that" },
        { text: 'Cool shade stunner, yeah I owe it all to my mother' },
        { text: "Hot like summer, yeah I'm making you sweat like that" },
        { text: 'Break it down, oh' },
        { text: 'Hey, side step right-left to my beat' },
        { text: "High like the moon, rock with me baby" },
        { text: "Know that I got that heat" },
        { text: "Let me show you 'cause talk is cheap" },
        { text: 'Side step right-left to my beat' },
      ],
    },
  ],

  'blackpink-deadline-2025': [
    {
      title: 'Pink Venom',
      artist: 'BLACKPINK',
      lines: [
        { text: 'My venom, my venom, my venom, my venom' },
        { text: "어디 봐봐 봐봐 봐봐 봐봐 나를 봐봐 봐봐" },
        { text: 'Nananana na na na na na' },
        { text: 'Before you call the doctor' },
        { text: "Need an antidote, I'll be your remedy" },
        { text: "I take a hit and don't you worry" },
        { text: 'I promise it feels good' },
        { text: "My venom's in your blood" },
      ],
    },
    {
      title: 'Lovesick Girls',
      artist: 'BLACKPINK',
      lines: [
        { text: 'We are the lovesick girls, we are the lovesick girls' },
        { text: "We keep looking for love in the world" },
        { text: "Mama told me not to waste my life" },
        { text: "She said spread your wings, my little butterfly" },
        { text: "Don't let nobody put you in a cage" },
        { text: 'Girl, you gotta live your life and love it' },
        { text: "We were born to be alone" },
        { text: "But why do I come undone" },
        { text: "When someone looks me in the eye" },
      ],
    },
  ],

  'the-weeknd-jakarta-2026': [
    {
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      spotifyId: '0VjIjW4GlUZAMYd2vXMi3b',
      lines: [
        { text: "I've been trying to call" },
        { text: "I've been on my own for long enough" },
        { text: "Maybe you can show me how to love, maybe" },
        { text: "I'm going through withdrawals" },
        { text: "You don't even have to do too much" },
        { text: 'You can turn me on with just a touch, baby' },
        { text: "I look around and" },
        { text: "Sin City's cold and empty (oh)" },
        { text: "No one's around to judge me (oh)" },
        { text: "I can't see clearly when you're gone" },
      ],
    },
    {
      title: 'Save Your Tears',
      artist: 'The Weeknd',
      lines: [
        { text: 'I saw you dancing in a crowded room' },
        { text: 'You look so happy when I\'m not with you' },
        { text: 'But then you saw me, caught you by surprise' },
        { text: 'A single teardrop falling from your eye' },
        { text: "I don't know why, I run from you" },
        { text: "I run from love, I know it's wrong" },
        { text: "I run from love, so save your tears for another" },
        { text: 'Save your tears for another day' },
        { text: 'Save your tears for another day' },
      ],
    },
  ],

  'mcr-jis-2026': [
    {
      title: 'Welcome to the Black Parade',
      artist: 'My Chemical Romance',
      spotifyId: '1efVpWGkSMwcPzgaGQ4eCQ',
      lines: [
        { text: 'When I was a young boy' },
        { text: 'My father took me into the city' },
        { text: 'To see a marching band' },
        { text: 'He said, "Son, when you grow up' },
        { text: 'Would you be the savior of the broken' },
        { text: 'The beaten and the damned?"' },
        { text: 'He said, "Will you defeat them' },
        { text: 'Your demons and all the non-believers' },
        { text: 'The plans that they have made?"' },
        { text: 'Because one day I\'ll leave you' },
        { text: 'A phantom to lead you in the summer' },
        { text: 'To join the Black Parade' },
        { text: '🎸 DO OR DIE 🎸' },
        { text: "We'll carry on, we'll carry on" },
        { text: 'And though you\'re dead and gone, believe me' },
        { text: 'Your memory will carry on' },
      ],
    },
    {
      title: 'Helena',
      artist: 'My Chemical Romance',
      lines: [
        { text: 'Long ago, just like the hearse you die to get in again' },
        { text: 'We are so far from you' },
        { text: 'Burning on, just like the match you strike to incinerate' },
        { text: 'The lives of everyone you know' },
        { text: 'And what\'s the worst you take, from every heart you break?' },
        { text: 'And like the blade you stain' },
        { text: 'Well, I\'ve been holding on tonight' },
        { text: '— Chorus —' },
        { text: "What's the worst that I can say?" },
        { text: 'Things are better if I stay' },
        { text: 'So long and goodnight, so long and goodnight' },
      ],
    },
  ],

  'avenged-sevenfold-jakarta-2026': [
    {
      title: 'Bat Country',
      artist: 'Avenged Sevenfold',
      lines: [
        { text: 'She said, "I\'ll throw myself away"' },
        { text: 'They\'re just photos after all' },
        { text: 'I can\'t make you hang around' },
        { text: "I can't wash you off my skin" },
        { text: 'Outside the frame, is what we\'re leaving out' },
        { text: "You won't remember anyway" },
        { text: '— Chorus —' },
        { text: 'I can\'t escape this now' },
        { text: 'Unless you show me how' },
        { text: 'When can I stop running from the choices that I made' },
      ],
    },
    {
      title: 'Nightmare',
      artist: 'Avenged Sevenfold',
      lines: [
        { text: 'Nightmare, nightmare, nightmare' },
        { text: 'Now your nightmare comes to life' },
        { text: "Dragged you down below, down to the devil's show" },
        { text: 'To be his guest forever' },
        { text: 'Peace of mind is less than never' },
        { text: 'Hate to twist your mind, but God ain\'t on your side' },
        { text: 'An old acquaintance severed' },
        { text: 'Burn the world, your last endeavor' },
        { text: 'Flesh and bone, you\'re on your own' },
        { text: 'Remember what I told you' },
      ],
    },
  ],

  'laufey-jakarta-2026': [
    {
      title: 'From the Start',
      artist: 'Laufey',
      spotifyId: '1E8dRMxSmn3LMeoxuCdlde',
      lines: [
        { text: 'I pretend that I like jazz' },
        { text: 'Just to stand next to you' },
        { text: "I'm so embarrassing, God" },
        { text: 'I have it bad for you' },
        { text: 'You smile, something ignites' },
        { text: 'And I have to look away' },
        { text: "If only you knew what I wanted you to say" },
        { text: "I think I've liked you from the start" },
        { text: 'You make me crazy with that little smile' },
        { text: "Always driving me apart" },
        { text: "I don't know if I can get over you" },
      ],
    },
    {
      title: 'Bewitched',
      artist: 'Laufey',
      lines: [
        { text: 'I find myself in violet light' },
        { text: 'What are you doing in my mind?' },
        { text: "We both know I'm not your type" },
        { text: "I shouldn't be standing here tonight" },
        { text: "I've had a little to drink" },
        { text: "And I'm not supposed to think" },
        { text: "About the way that you're lookin' at me now" },
        { text: "I can't believe what I've found" },
        { text: "I think that I'm bewitched" },
      ],
    },
  ],

  'the-neighbourhood-jakarta-2026': [
    {
      title: 'Sweater Weather',
      artist: 'The Neighbourhood',
      spotifyId: '3kfuNBCMPuEJFLpHoT4HHl',
      lines: [
        { text: 'All I am is a man' },
        { text: 'I want the world in my hands' },
        { text: "I hate the beach, but I stand" },
        { text: 'In California with my toes in the sand' },
        { text: "Use the sleeves of my sweater" },
        { text: "Let's have an adventure" },
        { text: "Head in the clouds but my gravity's centered" },
        { text: "Touch my neck and I'll touch yours" },
        { text: "You in those little high waisted shorts, oh" },
        { text: "— Chorus —" },
        { text: "'Cause it's too cold for you here and now" },
        { text: "So let me hold both your hands in the holes of my sweater" },
      ],
    },
  ],

  'five-sos-jakarta-2026': [
    {
      title: 'Youngblood',
      artist: '5 Seconds of Summer',
      lines: [
        { text: 'Says she got a boyfriend anyway' },
        { text: "That didn't stop you coming over last Wednesday" },
        { text: "You don't even have to say a thing" },
        { text: "I already know what you are thinking" },
        { text: "Call me, call me" },
        { text: "And then you wake up, wake up in the middle of the night with a" },
        { text: 'Heartbeat, heartbeat' },
        { text: "You'll never listen, listen" },
        { text: 'Feel it comin\' comin\' comin\'' },
        { text: "It's the youngblood" },
      ],
    },
  ],

  'lalala-fest-2026': [
    {
      title: 'Bad Habit',
      artist: 'Steve Lacy',
      lines: [
        { text: 'I used to hate the taste of beer' },
        { text: "But now I'm on my fourth one" },
        { text: 'And I drove here 3 hours just to sit at this bar alone' },
        { text: "Don't call me no more" },
        { text: "Baby, we're done with all of that" },
        { text: "I wish I knew" },
        { text: "I wish I knew that you were into me" },
        { text: "'Cause I'm into you, but now we're older" },
      ],
    },
  ],

  'dream-theater-2026': [
    {
      title: 'The Mirror',
      artist: 'Dream Theater',
      lines: [
        { text: 'Lie' },
        { text: 'Straight to the mirror' },
        { text: 'You know what you see is the truth' },
        { text: 'You know what you want' },
        { text: "So what's holding you back" },
        { text: "Is it the ghost of an addiction?" },
        { text: 'Feeding on your guilt and fear?' },
        { text: "Are you sure that what you're" },
        { text: 'Trying to avoid' },
        { text: "Isn't already here?" },
      ],
    },
  ],
};
