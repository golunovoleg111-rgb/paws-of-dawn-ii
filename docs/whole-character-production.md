# Цельные персонажи, версия 0.7

## Что заменено

Новый набор включает Мисти, Коди, Гектора, Теддика, Богдалину, Ори и десять видов врагов. Удалены все прежние библиотеки сборки тела, старые персонажные атласы, пробная низкополигональная модель, её экспорты и альтернативные способы показа. В текущем приложении существует только `CharacterLibrary` и новый манифест.

Это новый иллюстрированный набор, созданный встроенным ImageGen. Он не выдаётся за анимированную высокополигональную модель. Браузер не вращает конечности, не переставляет голову и не дорисовывает резервного персонажа.

## Производство

1. Лист Мисти `docs/art/misty-design-target.png` задаёт материалы и характер. Четыре героя имеют собственные новые исходники `*-walk-source.png`.
2. Каждый исходный кадр содержит полную анатомию. Листы действий и особых приёмов следуют одному раскадровочному плану; бег — отдельный лист из восьми фаз. Низкий шаг вынесен в четыре фазы для каждого героя.
3. В `art/production/registration.json` вручную отмечены центр опоры и фактические кисти. Оружие не определяет положение тела.
4. `scripts/build-cast.cjs` удаляет посторонние неприсоединённые фрагменты соседних ячеек, сохраняет единый масштаб героя и технически упаковывает изображения. Тело не разбирается и не деформируется.
5. Шесть вариантов оружия добавляются при подготовке ресурсов; клинки в покое и движении направлены вперёд и вверх, угол меняется плавно вслед за положением хвата, кувалда удерживается ниже линии морды. Исходные пиксели перчатки восстанавливаются на прежнем месте для перекрытия рукояти. Итоговый WebP уже содержит тело и оружие целиком. Во время игры это один вызов вывода кадра.
6. Крупные портреты берутся с отдельного исходного листа. Для галереи вычисляются границы всех поз действия, чтобы оружие не обрезалось и масштаб не прыгал между фазами.

Пересборка: `npm install`, затем `npm run build:cast`. Для запуска готовой игры пакеты не нужны. Промежуточная локальная мастерская в `work/` не публикуется.

## Основные промпты и режим

Все изображения созданы встроенным инструментом, режим transparent background. PNG сохранены без замены оригиналов генерации; игровые WebP получены технической упаковкой.

- Герои: detailed hand-painted 2.5D fantasy action game; adult anthropomorphic animal knight; complete connected anatomy; exact costume and identity across poses; right-facing; transparent background; empty closed fists; no labels/shadows.
- Ходьба: exact 4×2 grid, eight forward walk phases, opposing arm/leg motion, same body proportions, generous cell padding.
- Бег: exact 4×2 grid, successive contact/passing/push-off/flight phases, right-facing forward run, connected elbows and knees, fixed costume and scale.
- Действия: idle, melee windup, strike, recovery, crouch, tucked jump, reach/interact, hurt; complete figure in each cell.
- Особые приёмы: bow draw/release and two-handed hammer windup/impact; both hands remain attached, equipment supplied separately during offline preparation.
- Противники: five columns of idle, two movement phases, windup, attack; distinct rat scout, raider, archer, armored shieldguard, automaton, specter, thorn plant, quadruped hound, moth and arcane sentinel.
- Двор: four complete poses of white longhair queen Bogdalina in burgundy/gold and scholar owl Ori in purple hood; no clipped staffs or feathers.
- Оружие: six isolated upright objects in a 3×2 grid: sword, sabre, unstrung bow, warhammer, moonblade, unstrung royal bow. Bowstrings are prepared with the drawing-hand registration.
- Исправления листов: reduce complete figures within their own cells; restore clipped weapon tips; generous transparent gutters; preserve identities and poses.

## Практические ограничения

Покадровая анимация имеет ограниченное число фаз. Резкое переключение состояния и отдельные художественные несоответствия требуют дальнейшего просмотра в игре. Разные предметы брони пока меняют характеристики без отдельного комплекта изображений. Полное ручное прохождение всех десяти глав и настройка сложности не заменяются автоматическими проверками.
