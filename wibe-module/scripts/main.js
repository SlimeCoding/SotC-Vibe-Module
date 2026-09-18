// SotC Status Links
// Standalone module for Stars of the City 1.06 / Foundry VTT 13

console.log("SotC Status Links | Loading...");


/* ============================================================
 * STATUS ENRICHMENT
 * ============================================================ */

function enrichModWithStatusIcons(text, actor) {
  if (!text) return "";

  // Собираем доступные статусы.
  // Сначала мировые Items, затем статусы актёра поверх них.
  const statusMap = new Map();

  for (const item of game.items ?? []) {
    if (item.type !== "status") continue;

    const name = item.name?.trim();
    if (!name) continue;

    statusMap.set(name.toLowerCase(), item);
  }

  if (actor?.items) {
    for (const item of actor.items) {
      if (item.type !== "status") continue;

      const name = item.name?.trim();
      if (!name) continue;

      statusMap.set(name.toLowerCase(), item);
    }
  }

  if (!statusMap.size) return text;

  // Более длинные названия должны проверяться первыми.
  // Например, "Burning Wound" раньше "Burning".
  const statusNames = [...statusMap.keys()]
    .sort((a, b) => b.length - a.length);

  const escapedNames = statusNames.map(name =>
    name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );

  const pattern = escapedNames.join("|");

  const regex = new RegExp(
    `(?<![\\w])(\\d+\\s+)?(${pattern})(?![\\w])`,
    "gi"
  );

  // Разбираем только текстовые части.
  // HTML внутри уже существующего текста не трогаем.
  const parts = text.split(/(<[^>]+>)/g);

  for (let i = 0; i < parts.length; i++) {

    // Это HTML-тег — пропускаем.
    if (parts[i].startsWith("<")) continue;

    parts[i] = parts[i].replace(regex, (match, numberPart, namePart) => {

      const normalizedName = namePart.toLowerCase();
      const sourceStatus = statusMap.get(normalizedName);

      if (!sourceStatus) return match;

      const actualName = sourceStatus.name;
      const img = sourceStatus.img ||
        "systems/sotc/assets/statuses/" +
        `${actualName}.png`;

      const count = numberPart
        ? Number(numberPart.trim())
        : null;

      const numPart = numberPart
        ? `${numberPart}`
        : "";

      const iconHtml = `
        <img
          src="${img}"
          title="${actualName}"
          style="
            width:16px;
            height:16px;
            border:none;
            object-fit:contain;
            vertical-align:middle;
            margin-right:2px;
          "
        >
      `;

      const applyBtn = `
        <a
          class="apply-status-from-chat"
          data-status-name="${actualName}"
          data-status-count="${count ?? ""}"
          title="Apply ${actualName}"
          style="
            cursor:pointer;
            margin-left:3px;
            color:#c9a227;
            font-weight:bold;
          "
        >[+]</a>
      `;

      return (
        `${numPart}` +
        `${iconHtml}` +
        `<strong>${actualName}</strong>` +
        `${applyBtn}`
      );
    });
  }

  return parts.join("");
}


/* ============================================================
 * APPLY STATUS
 * ============================================================ */

async function applyStatusFromButton(ev, speakerActor) {
  ev.preventDefault();

  const button = ev.currentTarget;

  const statusName =
    button.dataset.statusName;

  const rawCount =
    button.dataset.statusCount;

  if (!statusName) return;


  // ----------------------------------------------------------
  // Ищем источник статуса.
  // Сначала у говорящего актёра, затем среди world Items.
  // ----------------------------------------------------------

  const sourceStatus =
    speakerActor?.items?.find(
      item =>
        item.type === "status" &&
        item.name?.toLowerCase() === statusName.toLowerCase()
    )
    ??
    game.items?.find(
      item =>
        item.type === "status" &&
        item.name?.toLowerCase() === statusName.toLowerCase()
    );


  if (!sourceStatus) {
    return ui.notifications.warn(
      `No status item found for "${statusName}". ` +
      `Make sure it exists as a world item or on the actor.`
    );
  }


  // ----------------------------------------------------------
  // Получаем выбранные цели.
  // ----------------------------------------------------------

  const targets = [...game.user.targets];

  if (!targets.length) {
    return ui.notifications.warn(
      "No target selected. Right-click a token and target it first."
    );
  }


  // ----------------------------------------------------------
  // Определяем количество стаков.
  // ----------------------------------------------------------

  let stacksToAdd;

  if (rawCount && Number(rawCount) > 0) {

    stacksToAdd = Number(rawCount);

  } else {

    stacksToAdd = await new Promise(resolve => {

      new Dialog({
        title: `Apply ${sourceStatus.name}`,

        content: `
          <div style="
            display:flex;
            align-items:center;
            gap:8px;
            padding:4px 0;
          ">
            <label style="flex-shrink:0;">
              Stacks to apply:
            </label>

            <input
              id="sotc-stack-input"
              type="number"
              min="1"
              value="1"
              style="width:60px;"
              autofocus
            />
          </div>
        `,

        buttons: {

          apply: {
            icon: '<i class="fas fa-check"></i>',
            label: "Apply",

            callback: html => {

              const value =
                Number(
                  html.find("#sotc-stack-input").val()
                );

              resolve(
                value > 0 ? value : 1
              );
            }
          },

          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",

            callback: () => resolve(null)
          }

        },

        default: "apply"

      }).render({ force: true });

    });
  }


  if (!stacksToAdd) return;


  // ----------------------------------------------------------
  // Применяем статус ко всем выбранным целям.
  // ----------------------------------------------------------

  for (const target of targets) {

    const targetActor = target.actor;

    if (!targetActor) continue;


    // Ищем уже существующий статус.
    const existing =
      targetActor.items.find(
        item =>
          item.type === "status" &&
          item.name === sourceStatus.name
      );


    // Статус уже есть → увеличиваем количество.
    if (existing) {

      const newCount =
        (Number(existing.system?.count) || 0) +
        stacksToAdd;

      await existing.update({
        "system.count": newCount
      });

      ui.notifications.info(
        `${sourceStatus.name} on ${targetActor.name} → ${newCount}.`
      );

    }

    // Статуса нет → создаём копию.
    else {

      const newItem =
        sourceStatus.toObject();

      newItem.system.count =
        stacksToAdd;

      await targetActor.createEmbeddedDocuments(
        "Item",
        [newItem]
      );

      ui.notifications.info(
        `Applied ${stacksToAdd}x ` +
        `${sourceStatus.name} to ${targetActor.name}.`
      );
    }
  }
}


/* ============================================================
 * PATCH SKILL SHEET
 * ============================================================ */

async function patchSkillSheet() {

  let SotCSkillSheet;

  try {

    const module =
      await import(
        "/systems/sotc/module/skill-sheet.js"
      );

    SotCSkillSheet =
      module.SotCSkillSheet;

  } catch (error) {

    console.error(
      "SotC Status Links | Could not load SotCSkillSheet.",
      error
    );

    return;
  }


  if (!SotCSkillSheet) {

    console.error(
      "SotC Status Links | SotCSkillSheet not found."
    );

    return;
  }


  // Не патчим класс второй раз.
  if (SotCSkillSheet.prototype._sotcStatusLinksPatched) {
    return;
  }


  const originalGetData =
    SotCSkillSheet.prototype.getData;


  SotCSkillSheet.prototype.getData =
    async function(options) {

      const context =
        await originalGetData.call(
          this,
          options
        );


      // Только Skill.
      if (
        this.item?.type !== "skill" &&
        this.document?.type !== "skill"
      ) {
        return context;
      }


      const systemData =
        context.data?.system ??
        this.item?.system;


      if (!systemData) {
        return context;
      }


      // ------------------------------------------------------
      // Основные skill modules
      // ------------------------------------------------------

      const rawMods =
        systemData.skill_modules?.mods ?? "";


      context.enrichedMods =
        enrichModWithStatusIcons(
          rawMods,
          this.actor
        );


      // ------------------------------------------------------
      // Модификаторы отдельных кубиков
      // ------------------------------------------------------

      const rawDie =
        systemData.dice?.die;


      const dieArr =
        rawDie
          ? (
              Array.isArray(rawDie)
                ? rawDie
                : Object.values(rawDie)
            )
          : [];


      dieArr.forEach(die => {

        const mods =
          die.mods ?? {};


        const modArr =
          Array.isArray(mods)
            ? mods
            : Object.values(mods);


        die.enrichedMods =
          modArr.map(
            mod =>
              enrichModWithStatusIcons(
                mod,
                this.actor
              )
          );
      });


      return context;
    };


  SotCSkillSheet.prototype._sotcStatusLinksPatched =
    true;


  console.log(
    "SotC Status Links | SotCSkillSheet patched."
  );
}


/* ============================================================
 * CHAT / SHEET BUTTON HANDLER
 * ============================================================ */

function installStatusButtonHandler() {

  // Используем делегирование событий.
  // Поэтому кнопки, созданные Handlebars позже,
  // тоже будут работать.

  document.addEventListener(
    "click",
    async ev => {

      const button =
        ev.target.closest(
          ".apply-status-from-chat"
        );


      if (!button) return;


      // Если кнопка находится внутри Sheet,
      // используем actor этого sheet.
      let speakerActor = null;

      const sheetElement =
        button.closest(".app");

      if (sheetElement) {

        const appId =
          sheetElement.dataset?.appid;

        if (appId) {

          const app =
            foundry.applications?.instances?.get?.(
              appId
            );

          if (app?.actor) {
            speakerActor = app.actor;
          }

          if (app?.item?.actor) {
            speakerActor = app.item.actor;
          }
        }
      }


      // Дополнительная попытка определить актёра
      // через ближайший ItemSheet.
      if (!speakerActor) {

        for (
          const app of
          Object.values(ui.windows ?? {})
        ) {

          if (
            app?.rendered &&
            app?.item?.actor &&
            app.element?.contains(button)
          ) {
            speakerActor =
              app.item.actor;

            break;
          }
        }
      }


      try {

        await applyStatusFromButton(
          ev,
          speakerActor
        );

      } catch (error) {

        console.error(
          "SotC Status Links | Failed to apply status.",
          error
        );

        ui.notifications.error(
          "Failed to apply status. Check console."
        );
      }

    }
  );
}


/* ============================================================
 * INITIALIZATION
 * ============================================================ */

Hooks.once("ready", async () => {

  console.log(
    "SotC Status Links | Initializing..."
  );


  await patchSkillSheet();

  installStatusButtonHandler();


  console.log(
    "SotC Status Links | Ready."
  );
});