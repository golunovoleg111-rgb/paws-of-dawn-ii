# Персонажи версии 0.2

Все изображения созданы встроенным инструментом генерации изображений, без CLI и внешнего API-ключа. Это самостоятельные персонажи, а не изображения из игр-референсов. Пять финальных атласов находятся в `assets/characters/`; исходные PNG сохранены вместе с WebP для загрузки в браузере.

## Финальные ассеты

| Файл (PNG + WebP) | Сетка | Содержание |
| --- | --- | --- |
| misty-poses | 4×2 | Мисти: две стойки, два шага, два удара, прыжок, крадущаяся поза |
| party-poses | 4×3 | Коди, Гектор, Теддик: стойка, бег, удар, прыжок |
| enemies | 4×2 | Крыса, налётчик, стрелок, щитоносец, автоматон, тень, растение, гончая |
| court-poses | 4×2 | Четыре позы Богдалины и четыре позы совы Ори |
| creatures | 4×2 | Четыре позы мотылька и четыре состояния стража печати |

## Набор промптов

Ниже — воспроизводимые спецификации финального набора (сведены из генераций и последующих правок прозрачности/отступов).

Общий стиль: production game sprite atlas for a mature 2.5D side-scrolling fantasy adventure. Detailed hand-painted pre-rendered character look, tactile fur, engraved metal, worn leather, cinematic dimensional lighting. Not pixel art, not flat vector, not geometric placeholders. Side view facing right, full body, consistent ground registration, no labels, no UI, true transparent background. All weapons, ears, tails and cloaks stay inside their cells, generous transparent margins, no overlap or ground plane.

1. Misty: 4 columns by 2 rows. Adult black female cat knight, emerald eyes, flexible steel and leather armor, worn indigo cape, moon sabre. Eight poses in reading order: alert idle, relaxed idle, two distinct running strides, attack preparation, attack follow-through, airborne jump, low stealth crouch. Preserve identity and armor between poses.
2. Party: 4 columns by 3 rows. Each row is one character; columns are idle, run, attack, jump. Row 1 Cody, ginger cat duelist, light leather armor and green cape, curved sabre. Row 2 Hector, large Maine Coon with mane, engraved heavy armor, shield and massive hammer. Row 3 Teddy, cream Pomeranian ranger, travel coat, satchel and short sword. Distinct silhouettes; same body proportions within each row. Keep complete silhouettes and weapon tips within safe cell margins.
3. Enemies: 4 columns by 2 rows. Rat knife scout; armored rat raider with spear; hooded rat archer; heavy rat shield guard; brass clockwork executioner; purple hooded spectral archivist; thorn carnivorous plant; four-legged storm hound. Detailed readable adversaries with distinct materials and silhouettes. Background extraction edit: preserve all characters, remove opaque pale backing and detached fog, retain true alpha and intentional local magic glows.
4. Court: 4 columns by 2 rows. Row 1 Bogdalina, imposing adult silver-furred feline queen, burgundy velvet, sharp crown, ornate regalia: idle, spell preparation, spell release, furious final phase. Row 2 Ori, feathered owl scholar with old tome and academic robe: idle, blink, speaking, wings open. Consistent identity, dramatic but readable costume.
5. Creatures: 4 columns by 2 rows. Row 1 luminous lunar moth with velvet wings and moon patterns: wings raised, wide, lowered, releasing pollen. Row 2 floating antique brass seal sentinel with living gemstone eye: open, charging, firing, dormant. Background extraction edit: preserve sprites, remove the backing completely, retain alpha around fine wing edges and suspended rings.

## Интеграция и пределы

Игра выделяет связанные части силуэта, привязывает позы к стопам и использует стабильный масштаб тела. Это техническая нарезка атласа; исходные иллюстрации не перерисовываются кодом. WebP: quality 92, alpha quality 100. Старый векторный набор остаётся резервом при ошибке загрузки.

Движения комбинируют несколько нарисованных поз с процедурным смещением. У наземных врагов пока по одной основной позе; индивидуальные циклы каждого оружия и плавные переходы ещё требуют работы. Лук отображается поверх базовой позы. У спутников пригибание пока масштабирует стойку; у Мисти есть отдельная нарисованная поза. Полный ручной прогон и баланс всей кампании остаются следующим этапом.
