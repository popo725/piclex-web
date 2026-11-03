export default {
  "sourceUrl": "https://teemo.dev/game-design/brotato/wiki/characters/",
  "sourceVersion": "PC 1.1.15.4",
  "verification": "read-local-resources",
  "packSha256": "be303f0a320cb099001fdc39c3b807cdd657e93426dc09867cee1d36f5385acf",
  "entries": [
    {
      "id": "well_rounded",
      "name": "全能者",
      "effects": [
        {
          "key": "stat_max_hp",
          "value": 5,
          "custom_key": "",
          "custom_args": [],
          "storage_method": 0
        },
        {
          "key": "stat_speed",
          "value": 5,
          "custom_key": "",
          "custom_args": [],
          "storage_method": 0
        },
        {
          "key": "stat_harvesting",
          "value": 8,
          "custom_key": "",
          "custom_args": [],
          "storage_method": 0
        }
      ],
      "resourcePath": "res://items/characters/well_rounded/well_rounded_data.tres"
    },
    {
      "id": "brawler",
      "name": "斗士",
      "effects": [
        {
          "key": "EFFECT_WEAPON_CLASS_BONUS",
          "value": 50,
          "custom_key": "",
          "custom_args": [],
          "storage_method": 0
        },
        {
          "key": "weapon_fist_1",
          "value": 1,
          "custom_key": "starting_weapon",
          "custom_args": [],
          "storage_method": 1
        },
        {
          "key": "stat_dodge",
          "value": 15,
          "custom_key": "",
          "custom_args": [],
          "storage_method": 0
        },
        {
          "key": "stat_range",
          "value": -50,
          "custom_key": "",
          "custom_args": [],
          "storage_method": 0
        },
        {
          "key": "stat_ranged_damage",
          "value": -50,
          "custom_key": "",
          "custom_args": [],
          "storage_method": 0
        }
      ],
      "resourcePath": "res://items/characters/brawler/brawler_data.tres"
    },
    {
      "id": "ranger",
      "name": "游侠",
      "effects": [
        {
          "key": "stat_range",
          "value": 50,
          "custom_key": "",
          "custom_args": [],
          "storage_method": 0
        },
        {
          "key": "weapon_pistol_1",
          "value": 1,
          "custom_key": "starting_weapon",
          "custom_args": [],
          "storage_method": 1
        },
        {
          "key": "effect_increase_stat_gains",
          "value": 50,
          "custom_key": "",
          "custom_args": [],
          "storage_method": 0
        },
        {
          "key": "no_melee_weapons",
          "value": 1,
          "custom_key": "",
          "custom_args": [],
          "storage_method": 0
        },
        {
          "key": "effect_reduce_stat_gains",
          "value": -25,
          "custom_key": "",
          "custom_args": [],
          "storage_method": 0
        }
      ],
      "resourcePath": "res://items/characters/ranger/ranger_data.tres"
    }
  ]
};
