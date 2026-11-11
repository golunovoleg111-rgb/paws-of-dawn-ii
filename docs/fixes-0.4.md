# Исправления 0.4 по скриншотам

## Персонажи

Перестроена привязка частей к суставам. Торс следует оси от таза к плечам, шея и плечевые суставы переходят вместе с ним. Ограничения длины конечностей применяются после сглаживания позы, а не только до него. У рук и ног заданы отдельные точки входа и выхода рисунка и перекрытие суставов. Исправлены посадка головы, пропорции четырёх героев и крысиной пехоты, соединение голени с сапогом. Плащ складывается при пригибании и остаётся над плоскостью стоп. В карточках добавлен запас места под замах и оружие. Фазы противников учитывают таймер замаха/удара/возврата вместо одной фиксированной позы.

## Мир и камера

Масштаб камеры 1.85× вместо 1.34× в 0.3 (приблизительно на 38% крупнее). Игровая область видит около 692×389 мировых единиц. Новые десять дальних панорам сохраняют соотношение сторон, сдержанный контраст и пустую дымку внизу. Удалены полупрозрачные геометрические здания поверх старой картины. У игрового пола и уступов усилена читаемая кромка. Лавка заменена подробным самостоятельным изображением; сова рисуется отдельно за прилавком. Из прозрачных полей лавки извлечена точная нижняя опора, чтобы она не висела над землёй.

## Размещение

После построения мира выполняется проверка полного объёма интерактивных предметов и свободного пространства вокруг них. Лавки и основные предметы сдвигаются из-под мостков/низких крыш. Ловушки переносятся в свободные части своей опоры или исключаются, если безопасного места нет. Учитываются также верхние предметы и колонка падения валуна. Лавки, NPC и костры имеют зоны, куда обычный патруль не заходит; оказавшийся внутри враг может выйти. Существующие ID предметов и сохранения остаются совместимыми.

## Проверка

Автоматические проверки охватывают длины костей во всех переходах/оружии, масштаб камеры, безопасное размещение ловушек в десяти главах на 24 семенах каждой, отсутствие пересечений лавок и основных предметов с мостками, прозрачное окно торговца, а также предыдущие проверки физики, экономики и прохождения маршрутов. В tests/visual.html есть отдельный просмотр фаз и растровая проверка связности силуэта/обрезания краями карточки; она не меняет сохранения. Проверка связности исключает оружие и тень, которые не являются частями тела. Крупные позы и реальные игровые сцены также осмотрены вручную в браузере. Эти проверки относятся к исправленным дефектам, а не означают полное отсутствие других ошибок или полный ручной прогон кампании.

## Новая графика

Встроенная генерация изображений, без CLI или внешнего API-ключа. Исходные PNG и соответствующие WebP сохранены в assets/: shop-v04, backdrop-a-v04, backdrop-b-v04, backdrop-c-v04. Части персонажей 0.3 сохранены; исправлены сборка, точки привязки, пропорции и движение.

### Лавка

Production single fantasy merchant stall game asset, true transparent background. A beautifully detailed hand-painted pre-rendered 3D travelling apothecary stall for a mature side-scrolling cat-knight adventure. Front side view, whole stall entirely visible, warm weathered carved oak counter, deep teal and muted gold scalloped fabric canopy supported by ornate wooden posts, brass hanging lanterns, small glass potion bottles, rolled maps, sacks, leather goods and a little hanging fish-shaped wooden sign WITHOUT letters. Empty central opening behind the counter to place an owl merchant as a separate animated character. Counter front reaches floor, no empty rectangular wireframe. Clear three-dimensional construction, tactile cloth and wood, painterly cinematic light, readable silhouette at 220px wide. Large transparent margins, no people, no animals, no scenery, no floor, no text, no UI, no frame or matte. Do not add a baked character.

### Панорамы a

Game background painting atlas, EXACT 2 columns by 2 rows of equal independent widescreen 16:9 panoramas, no gutters no borders. Sophisticated mature hand-painted 2.5D fantasy game art. BACKGROUND DISTANCE LAYER ONLY, not playable scenery. Every panorama has detailed distant architecture only in the upper two thirds, strong atmospheric perspective, small distant structures, desaturated cool tones, soft edges and low contrast. The lower third is empty soft mist and shadow, no walkable ground, no foreground floor, no nearby walls, no platforms, no visible collision ledges, no characters, no objects in front of the player. This will sit behind crisp warm foreground platforms and characters; leave visual room for them. Do not paint a playable street or a close house. Avoid orange busy foregrounds, over-sharpening, repeated panels, stretching, obvious gradients, squares. Row-major scenes: 1. distant ash village rooftops and far ruined chapel at dusk, cool slate mist and restrained amber sky; 2. distant flooded aqueduct arches above a teal misty reservoir; 3. distant astronomical observatory domes and tiny brass orreries under violet starlight; 4. distant industrial clockwork factory halls in blue-grey haze and restrained copper lights. Each scene self-contained, cinematic layered depth. No text or UI.

### Панорамы b

Game background painting atlas, EXACT 2 columns by 2 rows of equal independent widescreen 16:9 panoramas, no gutters no borders. Sophisticated mature hand-painted 2.5D fantasy game art. BACKGROUND DISTANCE LAYER ONLY, not playable scenery. Every panorama has detailed distant architecture only in the upper two thirds, strong atmospheric perspective, small distant structures, desaturated cool tones, soft edges and low contrast. The lower third is empty soft mist and shadow, no walkable ground, no foreground floor, no nearby walls, no platforms, no visible collision ledges, no characters, no objects in front of the player. This will sit behind crisp warm foreground platforms and characters; leave visual room for them. Do not paint a playable street or a close house. Avoid orange busy foregrounds, over-sharpening, repeated panels, stretching, obvious gradients, squares. Row-major scenes: 1. distant enormous conservatory behind a moonlit overgrown garden, dark teal foliage and pale green mist; 2. distant mountain quarry cliffs and giant cat statues in blue atmospheric haze; 3. distant storm canyon with far suspension towers and deep blue clouds; 4. distant grand archive shelves and library vaults lost in warm-grey dust. Each scene self-contained, cinematic layered depth. No text or UI.

### Панорамы c

Game background painting atlas, EXACT 2 columns by 1 row of equal independent widescreen 16:9 panoramas, no gutters no borders. Sophisticated mature hand-painted 2.5D fantasy game art. BACKGROUND DISTANCE LAYER ONLY, not playable scenery. Every panorama has detailed distant architecture only in the upper two thirds, strong atmospheric perspective, small distant structures, desaturated cool tones, soft edges and low contrast. The lower third is empty soft mist and shadow, no walkable ground, no foreground floor, no nearby walls, no platforms, no visible collision ledges, no characters, no objects in front of the player. This will sit behind crisp warm foreground platforms and characters; leave visual room for them. Do not paint a playable street or a close house. Avoid orange busy foregrounds, over-sharpening, repeated panels, stretching, obvious gradients, squares. Row-major scenes: 1. distant cathedral organ and stained-glass apses behind cool violet haze; 2. distant obsidian citadel spires and a restrained burgundy moon beyond blue-grey mist. Each scene self-contained, cinematic layered depth. No text or UI.


Итог проверки этой версии: 45 тестов Node; в браузерной растровой проверке 1152 сочетания позы/фазы/оружия — 0 разрывов и 0 обрезаний карточкой. Просмотрены начальные сцены, лавка и площадка святилища.

Во время стартовой/боевой неуязвимости герой теперь слегка меняет прозрачность, сохраняя видимый силуэт; полностью пустые кадры мерцания убраны.
