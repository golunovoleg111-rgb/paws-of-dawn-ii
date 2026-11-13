# Town architectural production sources

Built-in ImageGen, transparent-background mode. These are painterly architectural cutouts, not claimed Blender models. Original `source.png` is preserved. The two objects that touched their original sheet boundary were regenerated as complete standalone sources before release.

The original 3×2 sheet contains a timber merchant facade with roof terrace, limestone workshop, supported masonry stairs, collapsed freight wagon, construction scaffold and four-dial gate lock. The art direction is mature hand-painted 2.5D fantasy: worn limestone, timber and brass; muted slate shadows; warm upper-left highlights; subdued amber windows. No character, text, UI or ground shadow.

Standalone repair prompts:

- Extract and finish exactly the bottom-middle timber construction scaffold, damaged brick chimney, pulley and hanging stone at left, warning lantern at right. One complete centered object, transparent background with generous padding, complete chimney top and base; preserve the exact painterly design and materials.
- Extract and finish exactly the bottom-right gate lock: masonry moon pier with brass globe finial, four ornate round zodiac dials, right side crank. One complete centered object, transparent background, full finial and side edges; preserve the exact painterly design and materials.

The barricade uses a separate two-column source: the same anchored cast-iron street defense in extended and retracted states. Five weathered steel stakes, worn limestone curb, brass rivets, small ratchet crank; side-on camera; genuine transparency; mature painterly materials matching the town. Its floor line is registered at source Y=440, so the active tips match the damage footprint and the maintenance box is embedded below the paving.

`scripts/pack-town.cjs` performs only technical alpha cleanup, connected-component isolation, cropping and WebP conversion. It rejects opaque source cells and silhouettes touching the source boundary. Merchant and workshop walk-surface coordinates are registered in the manifest. `timber.webp` is a technical material crop from the original painted merchant beam, used for structurally open stair treads and braces.

Runtime architecture follows authored collision geometry. Roof tread and ground baseline are aligned separately; stairs are clipped to the actual tread contour. Falling rubble is anchored to the damaged chimney and follows hazard relocation. These checks establish geometric consistency; they do not replace visual review in the game.

Street dressing reuses native painted detail: `lantern-part.webp` comes from the scaffold's real lantern and wood attachment, `guild-plaque.webp` from the merchant's hanging scales emblem, and `stone-plinth.webp` from the gate pier's masonry foot. They are deliberate joining parts, not independent floating silhouettes. Runtime timber posts cover their attachment cuts and all three posts stand on the authored street baseline. Short painted sign labels direct the player to the crawlspace/roofs and guild gate; the full text is read through the associated F interaction. The existing house windows receive only restrained warm ambient halos, with no new fake entrances or loot markers.
