import type { StandupConfigRow } from "../../storage/supabase.js";
import type { InteractionMessageData } from "../../discord/interaction-utils.js";
import {
  NAV_ACTIVE_DAYS,
  NAV_CHANNEL,
  NAV_HOME,
  NAV_ROLE,
  NAV_SCHEDULE,
  NAV_TIMEZONE,
  TOGGLE_ENABLED,
} from "./custom-ids.js";
import { buildHubDescription } from "./format.js";
import {
  ACTION_ROW,
  BTN_DANGER,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_SUCCESS,
  BUTTON,
  EMBED_COLOR,
} from "./components.js";

export function buildHomePayload(row: StandupConfigRow | null): InteractionMessageData {
  const enabled = row?.enabled ?? false;

  return {
    embeds: [
      {
        title: "Standup configuration",
        description: buildHubDescription(row),
        color: EMBED_COLOR,
      },
    ],
    components: [
      {
        type: ACTION_ROW,
        components: [
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Active days",
            custom_id: NAV_ACTIVE_DAYS,
          },
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Schedule",
            custom_id: NAV_SCHEDULE,
            disabled: !row,
          },
          {
            type: BUTTON,
            style: BTN_PRIMARY,
            label: "Channel",
            custom_id: NAV_CHANNEL,
          },
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Reporter role",
            custom_id: NAV_ROLE,
            disabled: !row,
          },
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Time region",
            custom_id: NAV_TIMEZONE,
            disabled: !row,
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: BUTTON,
            style: enabled ? BTN_DANGER : BTN_SUCCESS,
            label: enabled ? "Disable" : "Enable",
            custom_id: TOGGLE_ENABLED,
            disabled: !row,
          },
          {
            type: BUTTON,
            style: BTN_SECONDARY,
            label: "Refresh",
            custom_id: NAV_HOME,
            disabled: !row,
          },
        ],
      },
    ],
  };
}
