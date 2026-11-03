export default {
  "sourceUrl": "https://teemo.dev/game-design/brotato/systems/wave-scripting-and-spawns/",
  "sourceVersion": "PC 1.1.15.4",
  "verification": "read-local-resources",
  "packSha256": "be303f0a320cb099001fdc39c3b807cdd657e93426dc09867cee1d36f5385acf",
  "entries": [
    {
      "id": 1,
      "duration": 20,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 4,
              "max_number": 5,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/001/group_1.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/001/wave_1.tres"
    },
    {
      "id": 2,
      "duration": 25,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "chaser",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/002/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 4,
              "max_number": 5,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/002/group_2.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/002/wave_2.tres"
    },
    {
      "id": 3,
      "duration": 30,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 5,
              "max_number": 6,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/003/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": 999,
          "repeating_interval": 7,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 3,
          "area": 200,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "chaser",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/003/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": -1,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 100,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "charger",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/003/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": -1,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 100,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 2,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "fly",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/003/d2_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 5,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "charger",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/003/d5_group_1.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/003/wave_3.tres"
    },
    {
      "id": 4,
      "duration": 35,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spitter",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/004/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 4,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 300,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 6,
              "max_number": 7,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/004/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 25,
          "repeating": 999,
          "repeating_interval": 7,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spitter",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/004/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": -1,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 5,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "fly",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/004/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 3,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 3,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 5,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "helmet_alien",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/004/d5_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_fly",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/004/d6_group_horned_fly.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/004/wave_4.tres"
    },
    {
      "id": 5,
      "duration": 40,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 4,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 4,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 8,
              "max_number": 8,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/005/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 3,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 2,
          "area": 200,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "chaser",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/005/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 25,
          "repeating": 999,
          "repeating_interval": 6,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 200,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spitter",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/005/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": 999,
          "repeating_interval": 4,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "charger",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/005/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 7,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 200,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 2,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "chaser",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/005/d2_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 4,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_charger",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/005/d4_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": 999,
          "repeating_interval": 12,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "healer",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/005/d6_group_1.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/005/wave_5.tres"
    },
    {
      "id": 6,
      "duration": 45,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 3,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "charger",
              "min_number": 4,
              "max_number": 5,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/006/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 3,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 2,
          "area": 200,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "chaser",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/006/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 25,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 2,
          "area": 200,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 5,
              "max_number": 6,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/006/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 5,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 5,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "fly",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/006/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 5,
          "max_difficulty": 5,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_charger",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/006/d5_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 0,
          "repeating": 0,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "slasher_egg",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/006/d6_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 0,
          "repeating": 20,
          "repeating_interval": 10,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spawner",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/006/d6_group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 22,
          "repeating": 0,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "slasher_egg",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/006/d6_group_3.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/006/wave_6.tres"
    },
    {
      "id": 7,
      "duration": 50,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 2,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 6,
              "max_number": 7,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/007/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 200,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 5,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "charger",
              "min_number": 6,
              "max_number": 6,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/007/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 30,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 200,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spitter",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/007/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 15,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "healer",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/007/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 3,
          "repeating": 9998,
          "repeating_interval": 10,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 5,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "slasher_egg",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/007/d5_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": 9999,
          "repeating_interval": 10,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 100,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_charger",
              "min_number": 3,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/007/d6_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 8,
          "repeating": 9999,
          "repeating_interval": 10,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 100,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "charger",
              "min_number": 4,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/007/d6_group_charger.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 20,
          "repeating": 2,
          "repeating_interval": 20,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_spitter",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/007/d6_group_horned_spitter.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/007/wave_7.tres"
    },
    {
      "id": 8,
      "duration": 55,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 6,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "bruiser",
              "min_number": 3,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/008/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 2,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 2,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spitter",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/008/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 5,
          "repeating": 999,
          "repeating_interval": 6,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": 300,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 3,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/008/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 30,
          "repeating": -1,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_bruiser",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/008/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": 6,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 3,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_bruiser",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/008/d3_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 40,
          "repeating": 4,
          "repeating_interval": 1,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_bruiser",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/008/d6_group_1.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/008/wave_8.tres"
    },
    {
      "id": 9,
      "duration": 60,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 2,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": 400,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "chaser",
              "min_number": 6,
              "max_number": 7,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/009/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "charger",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/009/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 22,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "bruiser",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/009/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 3,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 200,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "fin_alien",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/009/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 3,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 200,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 4,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "fin_alien",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/009/d4_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 3,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 200,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spawner",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/009/d6_group_1.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/009/wave_9.tres"
    },
    {
      "id": 10,
      "duration": 60,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 2,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 2,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 8,
              "max_number": 9,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/010/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 5,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 5,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "bruiser",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/010/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 20,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 2,
          "area": 200,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "charger",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/010/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 30,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 2,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "chaser",
              "min_number": 4,
              "max_number": 5,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/010/group_4.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 20,
          "repeating": 999,
          "repeating_interval": 12,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "helmet_alien",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/010/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 30,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 2,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 2,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "chaser",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/010/d2_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 45,
          "repeating": 8,
          "repeating_interval": 1,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "bruiser",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/010/d6_group_1.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/010/wave_10.tres"
    },
    {
      "id": 11,
      "duration": 60,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "pursuer",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/011/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 3,
          "repeating": 999,
          "repeating_interval": 6,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": 400,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/011/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 5,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "charger",
              "min_number": 3,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/011/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 25,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spitter",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/011/group_4.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 12,
          "repeating": 999,
          "repeating_interval": 10,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "fly",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/011/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 3,
          "repeating": 999,
          "repeating_interval": 10,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 5,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "pursuer",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/011/d5_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 6,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_spitter",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/011/d6_group_horned_spitter.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/011/wave_11.tres"
    },
    {
      "id": 12,
      "duration": 60,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 10,
          "repeating_interval": 2,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "chaser",
              "min_number": 10,
              "max_number": 10,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/012/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 5,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 250,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "pursuer",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/012/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "bruiser",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/012/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 25,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": 300,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "charger",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/012/group_4.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 25,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/012/group_5.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 3,
          "repeating": 999,
          "repeating_interval": 10,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "healer",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/012/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 2,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            },
            {
              "enemy": "bruiser",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/012/d2_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "tentacle",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/012/d6_group_1.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/012/wave_12.tres"
    },
    {
      "id": 13,
      "duration": 60,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 4,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 2,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "helmet_alien",
              "min_number": 8,
              "max_number": 8,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/013/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 4,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 4,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spitter",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/013/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 8,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 4,
              "max_number": 5,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/013/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 30,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 4,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "bruiser",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            },
            {
              "enemy": "horned_bruiser",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/013/group_4.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 8,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 300,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "fly",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/013/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 8,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 3,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "tentacle",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/013/d3_group_1.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/013/wave_13.tres"
    },
    {
      "id": 14,
      "duration": 60,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 4,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spawner",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/014/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 2,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 3,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "helmet_alien",
              "min_number": 5,
              "max_number": 5,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/014/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 2,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 6,
              "max_number": 6,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/014/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 40,
          "repeating": 999,
          "repeating_interval": 10,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 4,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "bruiser",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/014/group_4.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 22,
          "repeating": 999,
          "repeating_interval": 6,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 200,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "junkie",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/014/group_5.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 5,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "healer",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/014/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 8,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 4,
          "max_difficulty": 5,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spawner",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/014/d4_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 8,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "bloated_spawner",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/014/d6_group_1.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/014/wave_14.tres"
    },
    {
      "id": 15,
      "duration": 60,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 3,
          "area": 500,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 5,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 8,
              "max_number": 8,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            },
            {
              "enemy": "spawner",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/015/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 2,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "helmet_alien",
              "min_number": 6,
              "max_number": 6,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/015/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 8,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 300,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spitter",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/015/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 12,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 2,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 3,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/015/group_4.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 20,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 2,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "fin_alien",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/015/group_5.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 35,
          "repeating": 999,
          "repeating_interval": 6,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 5,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "junkie",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/015/group_6.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": 999,
          "repeating_interval": 15,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "tentacle",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/015/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 5,
          "repeating": 999,
          "repeating_interval": 12,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 300,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 4,
          "max_difficulty": 5,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "slasher_egg",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/015/d4_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 2,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 300,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "bloated_spawner",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/015/d6_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 5,
          "repeating": 999,
          "repeating_interval": 12,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 300,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "infected_slasher_egg",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/015/d6_group_2.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/015/wave_15.tres"
    },
    {
      "id": 16,
      "duration": 60,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 4,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 500,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "buffer",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            },
            {
              "enemy": "helmet_alien",
              "min_number": 10,
              "max_number": 10,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/016/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 5,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 4,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 5,
              "max_number": 5,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/016/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 20,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": 450,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "fin_alien",
              "min_number": 3,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/016/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 32,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 450,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_bruiser",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            },
            {
              "enemy": "bruiser",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/016/group_4.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 20,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "healer",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/016/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 3,
          "repeating": 999,
          "repeating_interval": 6,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 2,
          "max_difficulty": 5,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "helmet_alien",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/016/d2_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": 99,
          "repeating_interval": 7,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_fly",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/016/d6_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": 99,
          "repeating_interval": 14,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "corrupted_buffer",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/016/d6_group_2.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/016/wave_16.tres"
    },
    {
      "id": 17,
      "duration": 60,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "pursuer",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/017/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 4,
          "repeating": 999,
          "repeating_interval": 10,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 300,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "pursuer",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/017/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 4,
          "repeating": 999,
          "repeating_interval": 10,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 300,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 5,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "buffer",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/017/group_2b.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 7,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 5,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spawner",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/017/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 30,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": 300,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "fin_alien",
              "min_number": 4,
              "max_number": 5,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/017/group_4.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "tentacle",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/017/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 3,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "helmet_alien",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/017/group_3b.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 40,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 3,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 4,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/017/group_5.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 5,
          "repeating": 999,
          "repeating_interval": 15,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 3,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "bloated_spawner",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/017/d6_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 4,
          "repeating": 999,
          "repeating_interval": 10,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 300,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "corrupted_buffer",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/017/d6_group_corrupted_buffer.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/017/wave_17.tres"
    },
    {
      "id": 18,
      "duration": 60,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 10,
          "repeating_interval": 3,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 2,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_charger",
              "min_number": 6,
              "max_number": 6,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            },
            {
              "enemy": "buffer",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/018/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 4,
          "repeating": 999,
          "repeating_interval": 10,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 3,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "helmet_alien",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/018/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "helmet_alien",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/018/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 20,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spitter",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/018/group_4.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 24,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 3,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spawner",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/018/group_5.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 30,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "helmet_alien",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/018/group_6.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 5,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "healer",
              "min_number": 1,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/018/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 35,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_charger",
              "min_number": 5,
              "max_number": 5,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/018/group_7.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 40,
          "repeating": 99,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 4,
          "max_difficulty": 5,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "slasher_egg",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/018/d4_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 5,
          "repeating": 99,
          "repeating_interval": 15,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 3,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "bloated_spawner",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/018/d6_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": 99,
          "repeating_interval": 6,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 3,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "corrupted_buffer",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/018/d6_group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 14,
          "repeating": 99,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "infected_slasher_egg",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/018/d6_group_3.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/018/wave_18.tres"
    },
    {
      "id": 19,
      "duration": 60,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 999,
          "repeating_interval": 1,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 6,
              "max_number": 6,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/019/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 4,
          "repeating": 999,
          "repeating_interval": 1,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "helmet_alien",
              "min_number": 3,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/019/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": 999,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "buffer",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/019/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 4,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_bruiser",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/019/group_4.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 25,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": 200,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "pursuer",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/019/group_5.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 32,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "helmet_alien",
              "min_number": 2,
              "max_number": 2,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/019/group_6.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 5,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 100,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "healer",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            },
            {
              "enemy": "tentacle",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/019/d1_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 30,
          "repeating": 999,
          "repeating_interval": 5,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_charger",
              "min_number": 3,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/019/group_7.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 8,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 100,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 1,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "fin_alien",
              "min_number": 4,
              "max_number": 5,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/019/d2_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": 999,
          "repeating_interval": 8,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "slasher_egg",
              "min_number": 2,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/019/d6_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": 99,
          "repeating_interval": 12,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "corrupted_buffer",
              "min_number": 3,
              "max_number": 4,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/019/d6_group_2.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/019/wave_19.tres"
    },
    {
      "id": 20,
      "duration": 90,
      "maxEnemies": 100,
      "groups": [
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 0,
          "repeating_interval": 0,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 0,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": true,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [],
          "resourcePath": "res://zones/zone_1/020/group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 1,
          "repeating": 5,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "baby_alien",
              "min_number": 5,
              "max_number": 5,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/020/group_2.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 10,
          "repeating": 5,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "helmet_alien",
              "min_number": 5,
              "max_number": 5,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/020/group_3.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 15,
          "repeating": 5,
          "repeating_interval": 3,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "helmet_alien",
              "min_number": 5,
              "max_number": 5,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/020/group_4.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 20,
          "repeating": 5,
          "repeating_interval": 1,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 3,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "fin_alien",
              "min_number": 5,
              "max_number": 5,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/020/group_5.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 20,
          "repeating": 5,
          "repeating_interval": 1,
          "reduce_repeating_interval": 0,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": false,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "horned_bruiser",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/020/group_5b.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 30,
          "repeating": 999,
          "repeating_interval": 6,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 3,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 0,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "spawner",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            },
            {
              "enemy": "buffer",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            },
            {
              "enemy": "helmet_alien",
              "min_number": 3,
              "max_number": 3,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            },
            {
              "enemy": "horned_bruiser",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/020/group_6.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 5,
          "repeating": 999,
          "repeating_interval": 15,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 3,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "bloated_spawner",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/020/d6_group_1.tres"
        },
        {
          "spawn_chance": 1.0,
          "spawn_timing": 60,
          "repeating": 2,
          "repeating_interval": 10,
          "reduce_repeating_interval": 1,
          "min_repeating_interval": 1,
          "area": -1,
          "spawn_dist_away_from_edges": 0,
          "spawn_edge_of_map": true,
          "is_neutral": false,
          "is_boss": false,
          "is_horde": false,
          "is_loot": false,
          "min_difficulty": 6,
          "max_difficulty": 9999,
          "min_wave": 0,
          "max_wave": 99999,
          "units": [
            {
              "enemy": "mad_slasher",
              "min_number": 1,
              "max_number": 1,
              "spawn_chance": 1.0,
              "additional_min_distance_from_player": 0.0
            }
          ],
          "resourcePath": "res://zones/zone_1/020/d6_group_2.tres"
        }
      ],
      "conditionalGroups": [],
      "resourcePath": "res://zones/zone_1/020/wave_20.tres"
    }
  ]
};
