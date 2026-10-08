// The themes: the 22 themes of Omarchy (github.com/basecamp/omarchy, MIT, © David Heinemeier Hansson: see
// themes/omarchy-LICENSE). `term` is the terminal palette, `ui` the colours the look draws its frame, glass and lights
// with, `scene` the name of its pixel scene (scenes/<id>.glsl), `font` the terminal font it prefers (used only when
// installed) and `crt` the strength of the retro themes' scanlines.

export const DEFAULT_FONT = "JetBrainsMono NFM"

// The Homebrew cask each font comes from (all free)
export const FONT_CASKS = {
  "Monaspace Argon": "font-monaspace",
  "Monaspace Krypton": "font-monaspace",
  "Monaspace Xenon": "font-monaspace",
  "Maple Mono": "font-maple-mono",
  "Iosevka": "font-iosevka",
  "Fira Code": "font-fira-code",
  "IBM Plex Mono": "font-ibm-plex-mono",
  "Victor Mono": "font-victor-mono",
  "Geist Mono": "font-geist-mono",
  "Departure Mono": "font-departure-mono",
  "0xProto": "font-0xproto",
  "CommitMono": "font-commit-mono",
  "JetBrainsMono NFM": "font-jetbrains-mono-nerd-font"
}

export const THEMES = [
  {
    "id": "tokyo-night",
    "name": "Tokyo Night",
    "light": false,
    "term": {
      "bg": "#1a1b26",
      "fg": "#a9b1d6",
      "cursor": "#c0caf5",
      "selBg": "#292e42",
      "selFg": "#c0caf5",
      "normal": [
        "#1a1b26",
        "#f7768e",
        "#9ece6a",
        "#e0af68",
        "#7aa2f7",
        "#ad8ee6",
        "#449dab",
        "#a9b1d6"
      ],
      "bright": [
        "#414868",
        "#ff7a93",
        "#b9f27c",
        "#ff9e64",
        "#7da6ff",
        "#bb9af7",
        "#0db9d7",
        "#c0caf5"
      ]
    },
    "ui": {
      "violet": "#7aa2f7",
      "purple": "#7aa2f7",
      "magenta": "#ad8ee6",
      "pink": "#bb9af7",
      "lavender": "#b4bee6",
      "muted": "#565f89",
      "track": "#24283b",
      "deep": "#202333",
      "amber": "#e0af68",
      "red": "#f7768e",
      "mint": "#9ece6a",
      "onAccent": "#1a1b26",
      "hi": "#c0caf5",
      "bg": "#1a1b26"
    },
    "scene": "Rain city",
    "font": "JetBrainsMono NFM",
    "crt": 0
  },
  {
    "id": "catppuccin",
    "name": "Catppuccin",
    "light": false,
    "term": {
      "bg": "#1e1e2e",
      "fg": "#cdd6f4",
      "cursor": "#cdd6f4",
      "selBg": "#45475a",
      "selFg": "#cdd6f4",
      "normal": [
        "#1e1e2e",
        "#f38ba8",
        "#a6e3a1",
        "#f9e2af",
        "#89b4fa",
        "#f5c2e7",
        "#94e2d5",
        "#cdd6f4"
      ],
      "bright": [
        "#585b70",
        "#f38ba8",
        "#a6e3a1",
        "#f9e2af",
        "#89b4fa",
        "#f5c2e7",
        "#94e2d5",
        "#cdd6f4"
      ]
    },
    "ui": {
      "violet": "#89b4fa",
      "purple": "#89b4fa",
      "magenta": "#f5c2e7",
      "pink": "#ebc7ea",
      "lavender": "#bac2de",
      "muted": "#6c7086",
      "track": "#313244",
      "deep": "#292a3b",
      "amber": "#f9e2af",
      "red": "#f38ba8",
      "mint": "#a6e3a1",
      "onAccent": "#1e1e2e",
      "hi": "#cdd6f4",
      "bg": "#1e1e2e"
    },
    "scene": "Moonlit rooftops",
    "font": "Maple Mono",
    "crt": 0
  },
  {
    "id": "kanagawa",
    "name": "Kanagawa",
    "light": false,
    "term": {
      "bg": "#1f1f28",
      "fg": "#dcd7ba",
      "cursor": "#dcd7ba",
      "selBg": "#363646",
      "selFg": "#dcd7ba",
      "normal": [
        "#1f1f28",
        "#c34043",
        "#76946a",
        "#c0a36e",
        "#7e9cd8",
        "#957fb8",
        "#6a9589",
        "#dcd7ba"
      ],
      "bright": [
        "#54546d",
        "#e82424",
        "#98bb6c",
        "#e6c384",
        "#7fb4ca",
        "#938aa9",
        "#7aa89f",
        "#dcd7ba"
      ]
    },
    "ui": {
      "violet": "#dcd7ba",
      "purple": "#7e9cd8",
      "magenta": "#957fb8",
      "pink": "#938aa9",
      "lavender": "#c8c093",
      "muted": "#727169",
      "track": "#223249",
      "deep": "#212a3c",
      "amber": "#c0a36e",
      "red": "#c34043",
      "mint": "#76946a",
      "onAccent": "#1f1f28",
      "hi": "#dcd7ba",
      "bg": "#1f1f28"
    },
    "scene": "The great wave",
    "font": "Iosevka",
    "crt": 0
  },
  {
    "id": "everforest",
    "name": "Everforest",
    "light": false,
    "term": {
      "bg": "#2d353b",
      "fg": "#d3c6aa",
      "cursor": "#d3c6aa",
      "selBg": "#3d484d",
      "selFg": "#d3c6aa",
      "normal": [
        "#2d353b",
        "#e67e80",
        "#a7c080",
        "#dbbc7f",
        "#7fbbb3",
        "#d699b6",
        "#83c092",
        "#d3c6aa"
      ],
      "bright": [
        "#475258",
        "#e67e80",
        "#a7c080",
        "#dbbc7f",
        "#7fbbb3",
        "#d699b6",
        "#83c092",
        "#d3c6aa"
      ]
    },
    "ui": {
      "violet": "#7fbbb3",
      "purple": "#7fbbb3",
      "magenta": "#d699b6",
      "pink": "#d5a4b3",
      "lavender": "#9da9a0",
      "muted": "#4f585e",
      "track": "#343f44",
      "deep": "#313b40",
      "amber": "#dbbc7f",
      "red": "#e67e80",
      "mint": "#a7c080",
      "onAccent": "#2d353b",
      "hi": "#d3c6aa",
      "bg": "#2d353b"
    },
    "scene": "Firefly forest",
    "font": "Fira Code",
    "crt": 0
  },
  {
    "id": "gruvbox",
    "name": "Gruvbox",
    "light": false,
    "term": {
      "bg": "#282828",
      "fg": "#d4be98",
      "cursor": "#d4be98",
      "selBg": "#504945",
      "selFg": "#d4be98",
      "normal": [
        "#282828",
        "#ea6962",
        "#a9b665",
        "#d8a657",
        "#7daea3",
        "#d3869b",
        "#89b482",
        "#d4be98"
      ],
      "bright": [
        "#665c54",
        "#ea6962",
        "#a9b665",
        "#d8a657",
        "#7daea3",
        "#d3869b",
        "#89b482",
        "#d4be98"
      ]
    },
    "ui": {
      "violet": "#7daea3",
      "purple": "#7daea3",
      "magenta": "#d3869b",
      "pink": "#d3949a",
      "lavender": "#bdae93",
      "muted": "#7c6f64",
      "track": "#3c3836",
      "deep": "#343230",
      "amber": "#d8a657",
      "red": "#ea6962",
      "mint": "#a9b665",
      "onAccent": "#282828",
      "hi": "#d4be98",
      "bg": "#282828"
    },
    "scene": "Desert dusk",
    "font": "IBM Plex Mono",
    "crt": 0
  },
  {
    "id": "nord",
    "name": "Nord",
    "light": false,
    "term": {
      "bg": "#2e3440",
      "fg": "#d8dee9",
      "cursor": "#d8dee9",
      "selBg": "#434c5e",
      "selFg": "#d8dee9",
      "normal": [
        "#2e3440",
        "#bf616a",
        "#a3be8c",
        "#ebcb8b",
        "#81a1c1",
        "#b48ead",
        "#88c0d0",
        "#d8dee9"
      ],
      "bright": [
        "#4c566a",
        "#bf616a",
        "#a3be8c",
        "#ebcb8b",
        "#81a1c1",
        "#b48ead",
        "#8fbcbb",
        "#d8dee9"
      ]
    },
    "ui": {
      "violet": "#81a1c1",
      "purple": "#81a1c1",
      "magenta": "#b48ead",
      "pink": "#bda2bc",
      "lavender": "#adb5c4",
      "muted": "#667080",
      "track": "#3b4252",
      "deep": "#363c4b",
      "amber": "#ebcb8b",
      "red": "#bf616a",
      "mint": "#a3be8c",
      "onAccent": "#2e3440",
      "hi": "#d8dee9",
      "bg": "#2e3440"
    },
    "scene": "Aurora fjord",
    "font": "Monaspace Argon",
    "crt": 0
  },
  {
    "id": "rose-pine",
    "name": "Rose Pine Dawn",
    "light": true,
    "term": {
      "bg": "#faf4ed",
      "fg": "#575279",
      "cursor": "#575279",
      "selBg": "#dfdad9",
      "selFg": "#575279",
      "normal": [
        "#faf4ed",
        "#b4637a",
        "#286983",
        "#ea9d34",
        "#56949f",
        "#907aa9",
        "#d7827e",
        "#575279"
      ],
      "bright": [
        "#cecacd",
        "#b4637a",
        "#286983",
        "#ea9d34",
        "#56949f",
        "#907aa9",
        "#d7827e",
        "#575279"
      ]
    },
    "ui": {
      "violet": "#56949f",
      "purple": "#56949f",
      "magenta": "#907aa9",
      "pink": "#82709d",
      "lavender": "#6e6a86",
      "muted": "#9893a5",
      "track": "#e1dbd5",
      "deep": "#ede7e1",
      "amber": "#ea9d34",
      "red": "#b4637a",
      "mint": "#286983",
      "onAccent": "#ffffff",
      "hi": "#575279",
      "bg": "#faf4ed"
    },
    "scene": "Dawn lake",
    "font": "Victor Mono",
    "crt": 0
  },
  {
    "id": "ristretto",
    "name": "Ristretto",
    "light": false,
    "term": {
      "bg": "#2c2525",
      "fg": "#e6d9db",
      "cursor": "#e6d9db",
      "selBg": "#403e41",
      "selFg": "#e6d9db",
      "normal": [
        "#2c2525",
        "#fd6883",
        "#adda78",
        "#f9cc6c",
        "#f38d70",
        "#a8a9eb",
        "#85dacc",
        "#e6d9db"
      ],
      "bright": [
        "#72696a",
        "#ff8297",
        "#c8e292",
        "#fcd675",
        "#f8a788",
        "#bebffd",
        "#9bf1e1",
        "#e6d9db"
      ]
    },
    "ui": {
      "violet": "#f38d70",
      "purple": "#f38d70",
      "magenta": "#a8a9eb",
      "pink": "#bebffd",
      "lavender": "#c3b7b8",
      "muted": "#72696a",
      "track": "#3d2f2a",
      "deep": "#362b28",
      "amber": "#f9cc6c",
      "red": "#fd6883",
      "mint": "#adda78",
      "onAccent": "#2c2525",
      "hi": "#e6d9db",
      "bg": "#2c2525"
    },
    "scene": "Campfire",
    "font": "Monaspace Krypton",
    "crt": 0
  },
  {
    "id": "osaka-jade",
    "name": "Osaka Jade",
    "light": false,
    "term": {
      "bg": "#111c18",
      "fg": "#c1c497",
      "cursor": "#f7e8b2",
      "selBg": "#32473b",
      "selFg": "#f7e8b2",
      "normal": [
        "#111c18",
        "#ff5345",
        "#549e6a",
        "#459451",
        "#509475",
        "#d2689c",
        "#2dd5b7",
        "#c1c497"
      ],
      "bright": [
        "#53685b",
        "#db9f9c",
        "#63b07a",
        "#e5c736",
        "#acd4cf",
        "#75bbb3",
        "#8cd3cb",
        "#f7e8b2"
      ]
    },
    "ui": {
      "violet": "#509475",
      "purple": "#509475",
      "magenta": "#d2689c",
      "pink": "#75bbb3",
      "lavender": "#d6d5bc",
      "muted": "#81b8a8",
      "track": "#23372b",
      "deep": "#1c2c23",
      "amber": "#459451",
      "red": "#ff5345",
      "mint": "#549e6a",
      "onAccent": "#111c18",
      "hi": "#f7e8b2",
      "bg": "#111c18"
    },
    "scene": "Bamboo moon",
    "font": "Geist Mono",
    "crt": 0
  },
  {
    "id": "ethereal",
    "name": "Ethereal",
    "light": false,
    "term": {
      "bg": "#060b1e",
      "fg": "#ffcead",
      "cursor": "#ffcead",
      "selBg": "#252e56",
      "selFg": "#ffcead",
      "normal": [
        "#060b1e",
        "#ed5b5a",
        "#92a593",
        "#e9bb4f",
        "#7d82d9",
        "#c89dc1",
        "#a3bfd1",
        "#ffcead"
      ],
      "bright": [
        "#6d7db6",
        "#faaaa9",
        "#c4cfc4",
        "#f7dc9c",
        "#c2c4f0",
        "#ead7e7",
        "#dfeaf0",
        "#ffcead"
      ]
    },
    "ui": {
      "violet": "#7d82d9",
      "purple": "#7d82d9",
      "magenta": "#c89dc1",
      "pink": "#ead7e7",
      "lavender": "#c9b8a6",
      "muted": "#6d7db6",
      "track": "#131a3a",
      "deep": "#0e142f",
      "amber": "#e9bb4f",
      "red": "#ed5b5a",
      "mint": "#92a593",
      "onAccent": "#060b1e",
      "hi": "#ffcead",
      "bg": "#060b1e"
    },
    "scene": "Floating isles",
    "font": "Monaspace Xenon",
    "crt": 0
  },
  {
    "id": "hackerman",
    "name": "Hackerman",
    "light": false,
    "term": {
      "bg": "#0b0c16",
      "fg": "#ddf7ff",
      "cursor": "#ddf7ff",
      "selBg": "#1f253a",
      "selFg": "#ddf7ff",
      "normal": [
        "#0b0c16",
        "#50f872",
        "#4fe88f",
        "#50f7d4",
        "#829dd4",
        "#86a7df",
        "#7cf8f7",
        "#ddf7ff"
      ],
      "bright": [
        "#2d3450",
        "#85ff9d",
        "#9cf7c2",
        "#a4ffec",
        "#c4d2ed",
        "#cddbf4",
        "#d1fffe",
        "#ddf7ff"
      ]
    },
    "ui": {
      "violet": "#82fb9c",
      "purple": "#829dd4",
      "magenta": "#86a7df",
      "pink": "#cddbf4",
      "lavender": "#b5c5db",
      "muted": "#6a6e95",
      "track": "#2d323b",
      "deep": "#111321",
      "amber": "#50f7d4",
      "red": "#50f872",
      "mint": "#4fe88f",
      "onAccent": "#0b0c16",
      "hi": "#ddf7ff",
      "bg": "#0b0c16"
    },
    "scene": "Signal rain",
    "font": "Departure Mono",
    "crt": 0.9
  },
  {
    "id": "retro-82",
    "name": "Retro 82",
    "light": false,
    "term": {
      "bg": "#05182e",
      "fg": "#f6dcac",
      "cursor": "#f6dcac",
      "selBg": "#134e5a",
      "selFg": "#f6dcac",
      "normal": [
        "#05182e",
        "#f85525",
        "#028391",
        "#e97b3c",
        "#3f8f8a",
        "#3f8f8a",
        "#8cbfb8",
        "#f6dcac"
      ],
      "bright": [
        "#2a6b78",
        "#f85525",
        "#028391",
        "#e97b3c",
        "#faa968",
        "#3f8f8a",
        "#8cbfb8",
        "#f6dcac"
      ]
    },
    "ui": {
      "violet": "#faa968",
      "purple": "#3f8f8a",
      "magenta": "#3f8f8a",
      "pink": "#6da293",
      "lavender": "#a7c9c6",
      "muted": "#3f8f8a",
      "track": "#2c3742",
      "deep": "#082039",
      "amber": "#e97b3c",
      "red": "#f85525",
      "mint": "#028391",
      "onAccent": "#05182e",
      "hi": "#f6dcac",
      "bg": "#05182e"
    },
    "scene": "Night drive",
    "font": "Departure Mono",
    "crt": 0.85
  },
  {
    "id": "lumon",
    "name": "Lumon",
    "light": false,
    "term": {
      "bg": "#16242d",
      "fg": "#d6e2ee",
      "cursor": "#f2fcff",
      "selBg": "#243d56",
      "selFg": "#f2fcff",
      "normal": [
        "#16242d",
        "#4d86b0",
        "#5e95bc",
        "#6fa4c9",
        "#6fb8e3",
        "#8bc9eb",
        "#b4e4f6",
        "#d6e2ee"
      ],
      "bright": [
        "#304860",
        "#73a6cb",
        "#86b7d8",
        "#9dcae5",
        "#f2fcff",
        "#b1d8ee",
        "#d1eef8",
        "#f2fcff"
      ]
    },
    "ui": {
      "violet": "#8bc9eb",
      "purple": "#6fb8e3",
      "magenta": "#8bc9eb",
      "pink": "#b1d8ee",
      "lavender": "#d6e2ee",
      "muted": "#4d86b0",
      "track": "#35424c",
      "deep": "#192938",
      "amber": "#6fa4c9",
      "red": "#4d86b0",
      "mint": "#5e95bc",
      "onAccent": "#16242d",
      "hi": "#f2fcff",
      "bg": "#16242d"
    },
    "scene": "Macrodata",
    "font": "IBM Plex Mono",
    "crt": 0
  },
  {
    "id": "last-horizon",
    "name": "Last Horizon",
    "light": false,
    "term": {
      "bg": "#0c0b0c",
      "fg": "#fafcfb",
      "cursor": "#e2dddc",
      "selBg": "#584e51",
      "selFg": "#e2dddc",
      "normal": [
        "#0c0b0c",
        "#c38b7b",
        "#87a9b0",
        "#6b5e73",
        "#b59790",
        "#c4d8e2",
        "#a5a0b6",
        "#fafcfb"
      ],
      "bright": [
        "#584e51",
        "#c38b7b",
        "#87a9b0",
        "#6b5e73",
        "#b59790",
        "#c4d8e2",
        "#a5a0b6",
        "#e2dddc"
      ]
    },
    "ui": {
      "violet": "#b59790",
      "purple": "#b59790",
      "magenta": "#c4d8e2",
      "pink": "#ccd9e1",
      "lavender": "#cfd3cd",
      "muted": "#584e51",
      "track": "#323232",
      "deep": "#0c0b0c",
      "amber": "#6b5e73",
      "red": "#c38b7b",
      "mint": "#87a9b0",
      "onAccent": "#0c0b0c",
      "hi": "#e2dddc",
      "bg": "#0c0b0c"
    },
    "scene": "Planetrise",
    "font": "0xProto",
    "crt": 0
  },
  {
    "id": "miasma",
    "name": "Miasma",
    "light": false,
    "term": {
      "bg": "#222222",
      "fg": "#c2c2b0",
      "cursor": "#c2c2b0",
      "selBg": "#383838",
      "selFg": "#c2c2b0",
      "normal": [
        "#222222",
        "#685742",
        "#5f875f",
        "#b36d43",
        "#78824b",
        "#bb7744",
        "#c9a554",
        "#c2c2b0"
      ],
      "bright": [
        "#666666",
        "#685742",
        "#5f875f",
        "#b36d43",
        "#78824b",
        "#bb7744",
        "#c9a554",
        "#c2c2b0"
      ]
    },
    "ui": {
      "violet": "#78824b",
      "purple": "#78824b",
      "magenta": "#bb7744",
      "pink": "#bd8a5f",
      "lavender": "#8a8a7e",
      "muted": "#555555",
      "track": "#3c3c39",
      "deep": "#282828",
      "amber": "#b36d43",
      "red": "#685742",
      "mint": "#5f875f",
      "onAccent": "#ffffff",
      "hi": "#c2c2b0",
      "bg": "#222222"
    },
    "scene": "Marsh lights",
    "font": "CommitMono",
    "crt": 0
  },
  {
    "id": "matte-black",
    "name": "Matte Black",
    "light": false,
    "term": {
      "bg": "#121212",
      "fg": "#bebebe",
      "cursor": "#bebebe",
      "selBg": "#2a2a2a",
      "selFg": "#bebebe",
      "normal": [
        "#121212",
        "#d35f5f",
        "#ffc107",
        "#b91c1c",
        "#e68e0d",
        "#d35f5f",
        "#bebebe",
        "#bebebe"
      ],
      "bright": [
        "#333333",
        "#b91c1c",
        "#ffc107",
        "#b90a0a",
        "#f59e0b",
        "#b91c1c",
        "#eaeaea",
        "#bebebe"
      ]
    },
    "ui": {
      "violet": "#e68e0d",
      "purple": "#e68e0d",
      "magenta": "#d35f5f",
      "pink": "#b91c1c",
      "lavender": "#8a8a8d",
      "muted": "#555555",
      "track": "#2e2e2e",
      "deep": "#191919",
      "amber": "#b91c1c",
      "red": "#d35f5f",
      "mint": "#ffc107",
      "onAccent": "#121212",
      "hi": "#bebebe",
      "bg": "#121212"
    },
    "scene": "Beacon",
    "font": "Geist Mono",
    "crt": 0
  },
  {
    "id": "solitude",
    "name": "Solitude",
    "light": false,
    "term": {
      "bg": "#101315",
      "fg": "#cacccc",
      "cursor": "#a5aeb4",
      "selBg": "#343d41",
      "selFg": "#a5aeb4",
      "normal": [
        "#101315",
        "#565d60",
        "#9fa5a9",
        "#d9dbdc",
        "#798186",
        "#aeaeae",
        "#707070",
        "#cacccc"
      ],
      "bright": [
        "#4b4e55",
        "#de6145",
        "#343d41",
        "#c9c2b4",
        "#5d6367",
        "#9a9a9a",
        "#707070",
        "#a5aeb4"
      ]
    },
    "ui": {
      "violet": "#798186",
      "purple": "#798186",
      "magenta": "#aeaeae",
      "pink": "#9a9a9a",
      "lavender": "#cbc2be",
      "muted": "#4b4e55",
      "track": "#2e3132",
      "deep": "#101315",
      "amber": "#d9dbdc",
      "red": "#565d60",
      "mint": "#9fa5a9",
      "onAccent": "#101315",
      "hi": "#a5aeb4",
      "bg": "#101315"
    },
    "scene": "Lighthouse",
    "font": "Monaspace Argon",
    "crt": 0
  },
  {
    "id": "vantablack",
    "name": "Vantablack",
    "light": false,
    "term": {
      "bg": "#000000",
      "fg": "#ffffff",
      "cursor": "#ffffff",
      "selBg": "#1a1a1a",
      "selFg": "#ffffff",
      "normal": [
        "#000000",
        "#a4a4a4",
        "#b6b6b6",
        "#cecece",
        "#8d8d8d",
        "#9b9b9b",
        "#b0b0b0",
        "#ffffff"
      ],
      "bright": [
        "#7a7a7a",
        "#a4a4a4",
        "#b6b6b6",
        "#cecece",
        "#8d8d8d",
        "#9b9b9b",
        "#b0b0b0",
        "#ffffff"
      ]
    },
    "ui": {
      "violet": "#8d8d8d",
      "purple": "#8d8d8d",
      "magenta": "#9b9b9b",
      "pink": "#b4b4b4",
      "lavender": "#ececec",
      "muted": "#505050",
      "track": "#1a1a1a",
      "deep": "#101010",
      "amber": "#cecece",
      "red": "#a4a4a4",
      "mint": "#b6b6b6",
      "onAccent": "#000000",
      "hi": "#ffffff",
      "bg": "#000000"
    },
    "scene": "The void",
    "font": "Iosevka",
    "crt": 0
  },
  {
    "id": "catppuccin-latte",
    "name": "Catppuccin Latte",
    "light": true,
    "term": {
      "bg": "#eff1f5",
      "fg": "#4c4f69",
      "cursor": "#4c4f69",
      "selBg": "#ccd0da",
      "selFg": "#4c4f69",
      "normal": [
        "#eff1f5",
        "#d20f39",
        "#40a02b",
        "#df8e1d",
        "#1e66f5",
        "#ea76cb",
        "#179299",
        "#4c4f69"
      ],
      "bright": [
        "#acb0be",
        "#d20f39",
        "#40a02b",
        "#df8e1d",
        "#1e66f5",
        "#ea76cb",
        "#179299",
        "#4c4f69"
      ]
    },
    "ui": {
      "violet": "#1e66f5",
      "purple": "#1e66f5",
      "magenta": "#ea76cb",
      "pink": "#c36cb3",
      "lavender": "#5c5f77",
      "muted": "#9ca0b0",
      "track": "#d7d8dc",
      "deep": "#e3e4e8",
      "amber": "#df8e1d",
      "red": "#d20f39",
      "mint": "#40a02b",
      "onAccent": "#ffffff",
      "hi": "#4c4f69",
      "bg": "#eff1f5"
    },
    "scene": "Balloon morning",
    "font": "Maple Mono",
    "crt": 0
  },
  {
    "id": "flexoki-light",
    "name": "Flexoki Light",
    "light": true,
    "term": {
      "bg": "#fffcf0",
      "fg": "#100f0f",
      "cursor": "#100f0f",
      "selBg": "#cecdc3",
      "selFg": "#100f0f",
      "normal": [
        "#fffcf0",
        "#d14d41",
        "#879a39",
        "#d0a215",
        "#205ea6",
        "#ce5d97",
        "#3aa99f",
        "#100f0f"
      ],
      "bright": [
        "#b7b5ac",
        "#d14d41",
        "#879a39",
        "#d0a215",
        "#4385be",
        "#ce5d97",
        "#3aa99f",
        "#100f0f"
      ]
    },
    "ui": {
      "violet": "#205ea6",
      "purple": "#205ea6",
      "magenta": "#ce5d97",
      "pink": "#9f4a75",
      "lavender": "#403e3c",
      "muted": "#878580",
      "track": "#e5e2d8",
      "deep": "#f2efe4",
      "amber": "#d0a215",
      "red": "#d14d41",
      "mint": "#879a39",
      "onAccent": "#ffffff",
      "hi": "#100f0f",
      "bg": "#fffcf0"
    },
    "scene": "Ink mountains",
    "font": "CommitMono",
    "crt": 0
  },
  {
    "id": "lupine",
    "name": "Lupine",
    "light": true,
    "term": {
      "bg": "#fafafa",
      "fg": "#212121",
      "cursor": "#000000",
      "selBg": "#d0d0d0",
      "selFg": "#000000",
      "normal": [
        "#fafafa",
        "#c900c4",
        "#4a2fd0",
        "#026fde",
        "#3264eb",
        "#8a4ad7",
        "#0c67de",
        "#212121"
      ],
      "bright": [
        "#9e9e9e",
        "#f930fb",
        "#9f85e0",
        "#358fff",
        "#5482ff",
        "#b363ff",
        "#3986ff",
        "#000000"
      ]
    },
    "ui": {
      "violet": "#3264eb",
      "purple": "#3264eb",
      "magenta": "#8a4ad7",
      "pink": "#b363ff",
      "lavender": "#424242",
      "muted": "#757575",
      "track": "#dedede",
      "deep": "#ececec",
      "amber": "#026fde",
      "red": "#c900c4",
      "mint": "#4a2fd0",
      "onAccent": "#ffffff",
      "hi": "#212121",
      "bg": "#fafafa"
    },
    "scene": "Lupine meadow",
    "font": "Victor Mono",
    "crt": 0
  },
  {
    "id": "white",
    "name": "White",
    "light": true,
    "term": {
      "bg": "#ffffff",
      "fg": "#000000",
      "cursor": "#000000",
      "selBg": "#c0c0c0",
      "selFg": "#000000",
      "normal": [
        "#ffffff",
        "#2a2a2a",
        "#3a3a3a",
        "#4a4a4a",
        "#1a1a1a",
        "#2e2e2e",
        "#3e3e3e",
        "#000000"
      ],
      "bright": [
        "#808080",
        "#2a2a2a",
        "#3a3a3a",
        "#4a4a4a",
        "#1a1a1a",
        "#2e2e2e",
        "#3e3e3e",
        "#000000"
      ]
    },
    "ui": {
      "violet": "#6e6e6e",
      "purple": "#1a1a1a",
      "magenta": "#2e2e2e",
      "pink": "#232323",
      "lavender": "#000000",
      "muted": "#c0c0c0",
      "track": "#e8e8e8",
      "deep": "#f5f5f5",
      "amber": "#4a4a4a",
      "red": "#2a2a2a",
      "mint": "#3a3a3a",
      "onAccent": "#ffffff",
      "hi": "#000000",
      "bg": "#ffffff"
    },
    "scene": "Snowfield",
    "font": "Geist Mono",
    "crt": 0
  }
]
