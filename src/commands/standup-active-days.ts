import type { AppConfig } from "../config.js";
import {
  ephemeral,
  ephemeralMessageWithComponents,
  getInteractionCustomId,
  getUserId,
  requireGuild,
  updateMessage,
  type DiscordInteraction,
  type InteractionMessageData,
  type InteractionResponse,
} from "../discord/interaction-utils.js";
import { requireManageGuild } from "../discord/permissions.js";
import { getConfig, updateActiveWeekdays } from "../storage/config-store.js";
import { formatUserFacingDiscordError } from "../utils/discord-api.js";
import {
  bitmaskToWeekdays,
  formatActiveWeekdays,
  normalizeActiveWeekdays,
  toggleBitmaskDay,
  WEEKDAY_MASK_ALL,
  WEEKDAY_MASK_WEEKDAYS,
  WEEKDAY_SHORT,
  weekdaysToBitmask,
} from "../utils/weekdays.js";

export const ACTIVE_DAYS_CUSTOM_ID_PREFIX = "standup:active-days:";

const COMPONENT_ACTION_ROW = 1;
const COMPONENT_BUTTON = 2;
const BUTTON_PRIMARY = 1;
const BUTTON_SECONDARY = 2;
const BUTTON_SUCCESS = 3;

interface DiscordButtonComponent {
  type: typeof COMPONENT_BUTTON;
  style: number;
  label: string;
  custom_id: string;
}

interface DiscordActionRow {
  type: typeof COMPONENT_ACTION_ROW;
  components: DiscordButtonComponent[];
}

function toggleCustomId(day: number, mask: number): string {
  return `${ACTIVE_DAYS_CUSTOM_ID_PREFIX}toggle:${day}:${mask}`;
}

function saveCustomId(mask: number): string {
  return `${ACTIVE_DAYS_CUSTOM_ID_PREFIX}save:${mask}`;
}

function buildActiveDaysPayload(
  mask: number,
  opts?: { saved?: boolean; timezone?: string },
): InteractionMessageData {
  const weekdays = bitmaskToWeekdays(mask);
  const selected =
    weekdays.length > 0
      ? formatActiveWeekdays(weekdays)
      : "_none (select at least one before saving)_";

  const description = opts?.saved
    ? [
        "Saved. Automated reminder, missing-DSM nudge, and summary will run on:",
        `**${formatActiveWeekdays(weekdays)}**`,
        opts.timezone ? `(\`${opts.timezone}\`)` : "",
      ]
        .filter(Boolean)
        .join(" ")
    : [
        "Toggle which days run the automated **reminder**, **missing-DSM nudge**, and **summary** (guild timezone).",
        "",
        `**Selected:** ${selected}`,
      ].join("\n");

  return {
    embeds: [
      {
        title: opts?.saved ? "Active weekdays saved" : "Active weekdays",
        description,
        color: opts?.saved ? 0x57f287 : 0x5865f2,
      },
    ],
    components: opts?.saved ? [] : buildActiveDaysComponents(mask),
  };
}

function buildActiveDaysComponents(mask: number): DiscordActionRow[] {
  const dayButtons: DiscordButtonComponent[] = [];
  for (let day = 0; day <= 6; day++) {
    const active = (mask & (1 << day)) !== 0;
    dayButtons.push({
      type: COMPONENT_BUTTON,
      style: active ? BUTTON_SUCCESS : BUTTON_SECONDARY,
      label: active ? `${WEEKDAY_SHORT[day]} ✓` : WEEKDAY_SHORT[day],
      custom_id: toggleCustomId(day, mask),
    });
  }

  return [
    { type: COMPONENT_ACTION_ROW, components: dayButtons.slice(0, 5) },
    {
      type: COMPONENT_ACTION_ROW,
      components: [
        ...dayButtons.slice(5),
        {
          type: COMPONENT_BUTTON,
          style: BUTTON_PRIMARY,
          label: "Save",
          custom_id: saveCustomId(mask),
        },
        {
          type: COMPONENT_BUTTON,
          style: BUTTON_SECONDARY,
          label: "Weekdays",
          custom_id: `${ACTIVE_DAYS_CUSTOM_ID_PREFIX}preset:weekdays`,
        },
        {
          type: COMPONENT_BUTTON,
          style: BUTTON_SECONDARY,
          label: "All",
          custom_id: `${ACTIVE_DAYS_CUSTOM_ID_PREFIX}preset:all`,
        },
      ],
    },
  ];
}

export function isActiveDaysInteraction(interaction: DiscordInteraction): boolean {
  const customId = getInteractionCustomId(interaction);
  return customId?.startsWith(ACTIVE_DAYS_CUSTOM_ID_PREFIX) ?? false;
}

export async function handleSetActiveDaysCommand(
  config: AppConfig,
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  if (!requireManageGuild(interaction)) {
    return ephemeral("You need **Manage Server** permission to use this command.");
  }

  const guildResult = requireGuild(interaction);
  if (!guildResult.ok) return guildResult.response;

  try {
    const row = await getConfig(config, guildResult.guildId);
    if (!row) {
      return ephemeral(
        "No configuration yet. Run `/standup-config set` first.",
      );
    }

    const mask = weekdaysToBitmask(
      normalizeActiveWeekdays(row.active_weekdays),
    );
    return ephemeralMessageWithComponents(buildActiveDaysPayload(mask));
  } catch (error) {
    return ephemeral(formatUserFacingDiscordError(error));
  }
}

export async function handleActiveDaysInteraction(
  config: AppConfig,
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  if (!requireManageGuild(interaction)) {
    return ephemeral("You need **Manage Server** permission to use this.");
  }

  const guildResult = requireGuild(interaction);
  if (!guildResult.ok) return guildResult.response;

  const customId = getInteractionCustomId(interaction);
  if (!customId?.startsWith(ACTIVE_DAYS_CUSTOM_ID_PREFIX)) {
    return ephemeral("Unknown active-days control.");
  }

  const rest = customId.slice(ACTIVE_DAYS_CUSTOM_ID_PREFIX.length);

  try {
    if (rest === "preset:weekdays") {
      return updateMessage(buildActiveDaysPayload(WEEKDAY_MASK_WEEKDAYS));
    }
    if (rest === "preset:all") {
      return updateMessage(buildActiveDaysPayload(WEEKDAY_MASK_ALL));
    }

    const [action, arg1, arg2] = rest.split(":");
    if (action === "toggle") {
      const day = Number(arg1);
      const mask = Number(arg2);
      if (!Number.isInteger(day) || day < 0 || day > 6 || !Number.isInteger(mask)) {
        return ephemeral("Invalid day toggle. Run `/standup-config set-active-days` again.");
      }
      const nextMask = toggleBitmaskDay(mask, day);
      return updateMessage(buildActiveDaysPayload(nextMask));
    }

    if (action === "save") {
      const mask = Number(arg1);
      if (!Number.isInteger(mask)) {
        return ephemeral("Invalid save state. Run `/standup-config set-active-days` again.");
      }

      const weekdays = bitmaskToWeekdays(mask);
      if (weekdays.length === 0) {
        return ephemeral("Select at least one day before saving.");
      }

      const row = await updateActiveWeekdays(config, guildResult.guildId, {
        activeWeekdays: weekdays,
        updatedBy: getUserId(interaction),
      });

      return updateMessage(
        buildActiveDaysPayload(mask, {
          saved: true,
          timezone: row.timezone,
        }),
      );
    }

    return ephemeral("Unknown active-days action.");
  } catch (error) {
    return ephemeral(formatUserFacingDiscordError(error));
  }
}
