/**
 * Ready-made messages for the handwritten card. Tapping an occasion fills the box with one; tapping
 * again shows the next. Keep each one short, warm and in your own voice, and edit freely.
 * The verses use the King James Version, which is in the public domain.
 */
export type Occasion = { id: string; label: string; ideas: string[] };

export const CARD_OCCASIONS: Occasion[] = [
  {
    id: "birthday",
    label: "Birthday",
    ideas: [
      "Happy birthday! May this year bring you joy, good health and every blessing you deserve.",
      "Another year of you is a gift to all of us. Happy birthday, and God bless you always.",
      "Wishing you a day full of love and laughter. Happy birthday!",
    ],
  },
  {
    id: "thanks",
    label: "Thank you",
    ideas: [
      "Thank you for everything you do. You mean more to me than you know.",
      "Grateful for you today and every day. Thank you from the bottom of my heart.",
      "Just a little something to say thank you. God bless you!",
    ],
  },
  {
    id: "christmas",
    label: "Christmas",
    ideas: [
      "Merry Christmas! May your home be filled with joy, peace and the love of Christ.",
      "Wishing you and your family a blessed Christmas and a new year full of hope.",
      "Just a little something to remind you that you matter. Merry Christmas!",
    ],
  },
  {
    id: "anniversary",
    label: "Anniversary",
    ideas: [
      "Happy anniversary! Thank you for walking this journey of love and faith with me.",
      "Here is to another year of love, laughter and God's blessings on us both.",
      "Happy anniversary to my favourite person. I love you more every year.",
    ],
  },
  {
    id: "getwell",
    label: "Get well",
    ideas: [
      "Thinking of you and praying for your quick recovery. Get well soon!",
      "Sending love, strength and prayers your way. You are not alone.",
      "Rest well and get stronger every day. We are praying for you.",
    ],
  },
  {
    id: "verse",
    label: "A verse",
    ideas: [
      "Be still, and know that I am God. Psalm 46:10",
      "The Lord bless thee, and keep thee. Numbers 6:24",
      "I can do all things through Christ which strengtheneth me. Philippians 4:13",
      "For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end. Jeremiah 29:11",
    ],
  },
];
