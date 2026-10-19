// Journal entries for the Misty Lake fish. Sizes come from public angling and
// fisheries references; the notes describe what makes each fish easy to recognise.

export interface JournalEntry {
  latin: string;
  /** Typical size, when a reliable figure is known. */
  size?: string;
  note: string;
}

export const JOURNAL: Record<string, JournalEntry> = {
  bluegill: {
    latin: "Lepomis macrochirus",
    size: "10–30 cm",
    note: "Look for the blue-purple cheek and the black flap on its gill cover. It darts and turns fast for its size.",
  },
  "reed-sunfish": {
    latin: "Lepomis gibbosus",
    size: "Up to 28 cm",
    note: "Round as a pumpkin seed, with blue lines across its cheeks and an orange-red spot on its gill flap.",
  },
  "yellow-perch": {
    latin: "Perca flavescens",
    size: "10–25 cm",
    note: "Six to eight dark bars on golden flanks, and two separate fins on its back. It travels in schools.",
  },
  "black-crappie": {
    latin: "Pomoxis nigromaculatus",
    size: "10–20 cm",
    note: "Silvery green with black blotches. Count seven or eight spines on the back fin to tell it apart.",
  },
  "rock-bass": {
    latin: "Ambloplites rupestris",
    size: "15–25 cm",
    note: "A stocky little bass with red eyes and rows of dark dots along its sides.",
  },
  "brown-bullhead": {
    latin: "Ameiurus nebulosus",
    size: "20–50 cm",
    note: "A scaleless catfish with eight whiskers. It feeds along the bottom.",
  },
  "white-sucker": {
    latin: "Catostomus commersonii",
    size: "30–51 cm",
    note: "Long and round, with an underslung mouth and thick lips for grazing the lake floor.",
  },
  "golden-shiner": {
    latin: "Notemigonus crysoleucas",
    size: "7–20 cm",
    note: "A small, deep-bodied minnow with a brassy shine and an upturned mouth.",
  },
  "lake-bass": {
    latin: "Micropterus salmoides",
    size: "Up to 75 cm",
    note: "Its huge mouth reaches back past the eye. Famous for leaping to shake the hook.",
  },
  "smallmouth-bass": {
    latin: "Micropterus dolomieu",
    size: "Up to 69 cm",
    note: "Bronze with dark bars and red-brown eyes. One of the toughest fighters in North American fresh water.",
  },
  "white-bass": {
    latin: "Morone chrysops",
    note: "Silver with dark stripes along its sides. It hunts small fish in packs near the surface.",
  },
  "chain-pickerel": {
    latin: "Esox niger",
    size: "Around 61 cm",
    note: "Marked with a green chain-link pattern. It swallows lures whole.",
  },
  "rainbow-trout": {
    latin: "Oncorhynchus mykiss",
    note: "A pink stripe runs down its side. Often called the hardest-fighting trout.",
  },
  "brown-trout": {
    latin: "Salmo trutta",
    size: "40–80 cm (lake form)",
    note: "Gold-brown with dark spots ringed in pale halos, some of them red. It makes long runs and shakes its head hard.",
  },
  "common-carp": {
    latin: "Cyprinus carpio",
    size: "40–80 cm",
    note: "Big scales, a pair of whiskers, and a long life. Strong enough to bend a light rod.",
  },
  "northern-pike": {
    latin: "Esox lucius",
    size: "40–55 cm, up to 150 cm",
    note: "A long ambush hunter with sharp, backward-pointing teeth. It explodes into motion from a standstill.",
  },
  "amber-walleye": {
    latin: "Sander vitreus",
    size: "30–50 cm",
    note: "Pale, glassy eyes gather light, which makes it a night hunter.",
  },
  "channel-catfish": {
    latin: "Ictalurus punctatus",
    note: "Slate-blue with a scatter of dark spots, long whiskers and a deeply forked tail.",
  },
  "brook-trout": {
    latin: "Salvelinus fontinalis",
    size: "25–65 cm",
    note: "Worm-like markings on its back, red dots ringed in blue, and fins edged in white.",
  },
  burbot: {
    latin: "Lota lota",
    size: "Around 40 cm, up to 120 cm",
    note: "The freshwater cod: one whisker on its chin and a long, mottled body. It hunts in the dark.",
  },
  "lake-whitefish": {
    latin: "Coregonus clupeaformis",
    size: "Around 51 cm",
    note: "Silver and deep-bodied, with a small mouth. It schools in cold, deep water.",
  },
  muskellunge: {
    latin: "Esox masquinongy",
    size: "70–120 cm, up to 1.8 m",
    note: "Anglers call it the fish of ten thousand casts: huge, toothy, and rarely seen.",
  },
  "crystal-trout": {
    latin: "Salvelinus namaycush",
    note: "Pale spots on a dark body and a deeply forked tail. It lives in cold, deep lakes.",
  },
  "flathead-catfish": {
    latin: "Pylodictis olivaris",
    note: "A broad, flat head on a mottled yellow-brown body. It hunts live fish at night.",
  },
  bowfin: {
    latin: "Amia calva",
    size: "50–70 cm, up to 109 cm",
    note: "A living fossil with one long fin down its back. Males carry a dark eyespot at the base of the tail.",
  },
  "longnose-gar": {
    latin: "Lepisosteus osseus",
    size: "71–122 cm, up to 1.8 m",
    note: "A needle-like snout full of teeth, and diamond-shaped armor scales.",
  },
  "lake-sturgeon": {
    latin: "Acipenser fulvescens",
    size: "Up to 2.2 m",
    note: "An ancient fish with bony plates instead of scales and four whiskers by its mouth.",
  },
  "lake-dragon-eel": {
    latin: "Anguilla rostrata",
    size: "Up to 1.2 m",
    note: "Born in the Sargasso Sea, it swims thousands of kilometers to live in fresh water. It slips through any gap.",
  },
  "wels-catfish": {
    latin: "Silurus glanis",
    size: "Typically 1.3–1.6 m",
    note: "Europe's giant catfish: broad-headed, dark, with long whiskers. It is known for lunging at the bank.",
  },
};
