2026-06-10T06:45:04.1352224Z [cron/standup] guild 1364793724877672588 {"reminderSent":false,"nudgeSent":true,"summaryRan":false}
2026-06-10T06:50:17.207226893Z [gateway] disconnected (1005): 
2026-06-10T07:14:13.263416764Z [gateway] disconnected (1005): 
2026-06-10T09:00:07.984180234Z [cron/standup] guild 1364793724877672588 {"reminderSent":false,"nudgeSent":false,"summaryRan":true}
2026-06-10T10:29:22.58339311Z [gateway] disconnected (1006): 
2026-06-10T10:30:04.076011364Z [cron/standup] guild 751138389507702844 reminder: DiscordApiError: Discord API error: 404 Not Found
2026-06-10T10:30:04.076051965Z     at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:113:15)
2026-06-10T10:30:04.076057585Z     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-10T10:30:04.076061955Z     at async fetchMemberIdsWithRole (file:///opt/render/project/src/dist/discord/guild-members.js:21:20)
2026-06-10T10:30:04.076066175Z     at async runDailyReminder (file:///opt/render/project/src/dist/standup/reminder.js:8:29)
2026-06-10T10:30:04.076071115Z     at async file:///opt/render/project/src/dist/cron/standup-tick.js:91:13
2026-06-10T10:30:04.076075575Z     at async runTickAction (file:///opt/render/project/src/dist/cron/standup-tick.js:18:9)
2026-06-10T10:30:04.076079745Z     at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:90:31)
2026-06-10T10:30:04.076083825Z     at async runStandupTickInner (file:///opt/render/project/src/dist/cron/standup-tick.js:70:24) {
2026-06-10T10:30:04.076087976Z   status: 404,
2026-06-10T10:30:04.076092876Z   body: { message: 'Unknown Guild', code: 10004 }
2026-06-10T10:30:04.076096926Z }
2026-06-10T10:30:04.076116186Z [cron/standup] guild 751138389507702844 {"reminderSent":false,"nudgeSent":false,"summaryRan":false,"reminderError":"Discord API error: 404 Not Found"}
2026-06-10T10:49:49.202391528Z [gateway] disconnected (1006): 
2026-06-10T11:37:50.596681108Z [gateway] disconnected (1006): 
2026-06-10T13:29:39.164464188Z [gateway] disconnected (1005): 
2026-06-10T14:21:02.598630595Z [gateway] disconnected (1005): 
2026-06-10T14:51:20.615382222Z [gateway] disconnected (1005): 
2026-06-10T15:00:04.541500439Z [cron/standup] guild 751138389507702844 nudge: DiscordApiError: Discord API error: 404 Not Found
2026-06-10T15:00:04.54152665Z     at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:113:15)
2026-06-10T15:00:04.54153229Z     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-10T15:00:04.54153755Z     at async fetchMemberIdsWithRole (file:///opt/render/project/src/dist/discord/guild-members.js:21:20)
2026-06-10T15:00:04.54155357Z     at async runMissingReporterNudge (file:///opt/render/project/src/dist/standup/missing-reporters.js:18:25)
2026-06-10T15:00:04.54155622Z     at async file:///opt/render/project/src/dist/cron/standup-tick.js:106:33
2026-06-10T15:00:04.54155814Z     at async runTickAction (file:///opt/render/project/src/dist/cron/standup-tick.js:18:9)
2026-06-10T15:00:04.54156035Z     at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:105:28)
2026-06-10T15:00:04.54156235Z     at async runStandupTickInner (file:///opt/render/project/src/dist/cron/standup-tick.js:70:24) {
2026-06-10T15:00:04.54156433Z   status: 404,
2026-06-10T15:00:04.54156694Z   body: { message: 'Unknown Guild', code: 10004 }
2026-06-10T15:00:04.54156896Z }
2026-06-10T15:00:04.541648442Z [cron/standup] guild 751138389507702844 {"reminderSent":false,"nudgeSent":false,"summaryRan":false,"nudgeError":"Discord API error: 404 Not Found"}
2026-06-10T15:25:23.187140437Z [gateway] disconnected (1006): 
2026-06-10T15:45:04.999951566Z [cron/standup] guild 751138389507702844 channel 858294696593326100 summary: DiscordApiError: Discord API error: 403 Forbidden
2026-06-10T15:45:04.999996747Z     at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:113:15)
2026-06-10T15:45:05.000002127Z     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-10T15:45:05.000006057Z     at async fetchChannelMessages (file:///opt/render/project/src/dist/ingestion/discord.js:60:22)
2026-06-10T15:45:05.000009807Z     at async ingestStandupMessages (file:///opt/render/project/src/dist/ingestion/discord.js:7:25)
2026-06-10T15:45:05.000015457Z     at async runPipeline (file:///opt/render/project/src/dist/pipeline.js:12:18)
2026-06-10T15:45:05.000020338Z     at async runTickAction.channelId (file:///opt/render/project/src/dist/cron/standup-tick.js:121:13)
2026-06-10T15:45:05.000025158Z     at async runTickAction (file:///opt/render/project/src/dist/cron/standup-tick.js:18:9)
2026-06-10T15:45:05.000030298Z     at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:120:30)
2026-06-10T15:45:05.000035378Z     at async runStandupTickInner (file:///opt/render/project/src/dist/cron/standup-tick.js:70:24) {
2026-06-10T15:45:05.000039238Z   status: 403,
2026-06-10T15:45:05.000043048Z   body: { message: 'Missing Access', code: 50001 }
2026-06-10T15:45:05.000046188Z }
2026-06-10T15:45:05.000288232Z [cron/standup] guild 751138389507702844 {"reminderSent":false,"nudgeSent":false,"summaryRan":false,"summaryError":"Discord denied access to the standup channel (Discord code 50001).\n\nCheck that:\n1. The channel in `/standup-config show` still exists\n2. The bot can **View Channel** and **Read Message History** there\n3. Re-run `/standup-config set channel:#your-standup-channel` if needed"}
2026-06-10T15:54:43.578717516Z [gateway] disconnected (1006): 
2026-06-10T19:23:32.961794421Z [gateway] disconnected (1005): 
2026-06-10T22:53:06.616699464Z [gateway] disconnected (1005): 
2026-06-11T02:22:54.674681313Z [gateway] disconnected (1006): 
2026-06-11T03:00:04.918933604Z [cron/standup] guild 1364793724877672588 {"reminderSent":true,"nudgeSent":false,"summaryRan":false}
2026-06-11T03:25:00.588701715Z [gateway] disconnected (1005): 
2026-06-11T04:58:21.329873121Z [gateway] disconnected (1006): 
2026-06-11T06:45:05.485748848Z [cron/standup] guild 1364793724877672588 {"reminderSent":false,"nudgeSent":true,"summaryRan":false}
2026-06-11T07:21:10.62826976Z [gateway] disconnected (1006): 
2026-06-11T08:25:53.855193022Z [gateway] disconnected (1005): 
2026-06-11T09:00:09.220845895Z [cron/standup] guild 1364793724877672588 {"reminderSent":false,"nudgeSent":false,"summaryRan":true}
2026-06-11T09:10:00.556313528Z [gateway] disconnected (1005): 
2026-06-11T09:47:46.823072588Z [gateway] disconnected (1005): 
2026-06-11T10:30:06.300703497Z [cron/standup] guild 751138389507702844 reminder: DiscordApiError: Discord API error: 404 Not Found
2026-06-11T10:30:06.300826239Z     at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:113:15)
2026-06-11T10:30:06.300834359Z     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-11T10:30:06.300838989Z     at async fetchMemberIdsWithRole (file:///opt/render/project/src/dist/discord/guild-members.js:21:20)
2026-06-11T10:30:06.300843659Z     at async runDailyReminder (file:///opt/render/project/src/dist/standup/reminder.js:8:29)
2026-06-11T10:30:06.300848619Z     at async file:///opt/render/project/src/dist/cron/standup-tick.js:91:13
2026-06-11T10:30:06.300853359Z     at async runTickAction (file:///opt/render/project/src/dist/cron/standup-tick.js:18:9)
2026-06-11T10:30:06.300857869Z     at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:90:31)
2026-06-11T10:30:06.3008631Z     at async runStandupTickInner (file:///opt/render/project/src/dist/cron/standup-tick.js:70:24) {
2026-06-11T10:30:06.300867729Z   status: 404,
2026-06-11T10:30:06.30087323Z   body: { message: 'Unknown Guild', code: 10004 }
2026-06-11T10:30:06.30087748Z }
2026-06-11T10:30:06.301004322Z [cron/standup] guild 751138389507702844 {"reminderSent":false,"nudgeSent":false,"summaryRan":false,"reminderError":"Discord API error: 404 Not Found"}
2026-06-11T12:08:18.511823652Z [gateway] disconnected (1005): 
2026-06-11T13:22:36.978352557Z [gateway] disconnected (1006): 
2026-06-11T15:00:06.402485955Z [cron/standup] guild 751138389507702844 nudge: DiscordApiError: Discord API error: 404 Not Found
2026-06-11T15:00:06.402687598Z [cron/standup] guild 751138389507702844 {"reminderSent":false,"nudgeSent":false,"summaryRan":false,"nudgeError":"Discord API error: 404 Not Found"}
2026-06-11T15:00:06.410342844Z     at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:113:15)
2026-06-11T15:00:06.410353355Z     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-11T15:00:06.410358335Z     at async fetchMemberIdsWithRole (file:///opt/render/project/src/dist/discord/guild-members.js:21:20)
2026-06-11T15:00:06.410362445Z     at async runMissingReporterNudge (file:///opt/render/project/src/dist/standup/missing-reporters.js:18:25)
2026-06-11T15:00:06.410367445Z     at async file:///opt/render/project/src/dist/cron/standup-tick.js:106:33
2026-06-11T15:00:06.410371665Z     at async runTickAction (file:///opt/render/project/src/dist/cron/standup-tick.js:18:9)
2026-06-11T15:00:06.410375685Z     at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:105:28)
2026-06-11T15:00:06.410379825Z     at async runStandupTickInner (file:///opt/render/project/src/dist/cron/standup-tick.js:70:24) {
2026-06-11T15:00:06.410383945Z   status: 404,
2026-06-11T15:00:06.410388565Z   body: { message: 'Unknown Guild', code: 10004 }
2026-06-11T15:00:06.410392545Z }
2026-06-11T15:45:06.423659156Z [cron/standup] guild 751138389507702844 channel 858294696593326100 summary: DiscordApiError: Discord API error: 403 Forbidden
2026-06-11T15:45:06.424312508Z     at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:113:15)
2026-06-11T15:45:06.424321308Z     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-11T15:45:06.424326828Z     at async fetchChannelMessages (file:///opt/render/project/src/dist/ingestion/discord.js:60:22)
2026-06-11T15:45:06.424331638Z     at async ingestStandupMessages (file:///opt/render/project/src/dist/ingestion/discord.js:7:25)
2026-06-11T15:45:06.424346049Z     at async runPipeline (file:///opt/render/project/src/dist/pipeline.js:12:18)
2026-06-11T15:45:06.424348169Z     at async runTickAction.channelId (file:///opt/render/project/src/dist/cron/standup-tick.js:121:13)
2026-06-11T15:45:06.424350169Z     at async runTickAction (file:///opt/render/project/src/dist/cron/standup-tick.js:18:9)
2026-06-11T15:45:06.424352299Z     at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:120:30)
2026-06-11T15:45:06.424354259Z     at async runStandupTickInner (file:///opt/render/project/src/dist/cron/standup-tick.js:70:24) {
2026-06-11T15:45:06.424356249Z   status: 403,
2026-06-11T15:45:06.424359189Z   body: { message: 'Missing Access', code: 50001 }
2026-06-11T15:45:06.424361879Z }
2026-06-11T15:45:06.439269836Z [cron/standup] guild 751138389507702844 {"reminderSent":false,"nudgeSent":false,"summaryRan":false,"summaryError":"Discord denied access to the standup channel (Discord code 50001).\n\nCheck that:\n1. The channel in `/standup-config show` still exists\n2. The bot can **View Channel** and **Read Message History** there\n3. Re-run `/standup-config set channel:#your-standup-channel` if needed"}
2026-06-11T16:42:35.326781189Z [gateway] disconnected (1005): 
2026-06-11T17:08:01.643711758Z [gateway] disconnected (1005): 
2026-06-11T19:24:00.495709907Z [gateway] disconnected (1005): 
2026-06-11T19:50:20.429985316Z [gateway] disconnected (1006): 
2026-06-11T21:09:25.219331616Z [gateway] disconnected (1006): 
2026-06-11T21:56:37.082286936Z [gateway] disconnected (1006): 
2026-06-11T22:12:23.904874911Z [gateway] disconnected (1006): 
2026-06-11T22:51:27.611834629Z [gateway] disconnected (1005): 
2026-06-12T00:33:47.616511177Z [gateway] disconnected (1005): 
2026-06-12T02:00:27.232776633Z [gateway] disconnected (1005): 
2026-06-12T03:00:05.631436177Z [cron/standup] guild 1364793724877672588 {"reminderSent":true,"nudgeSent":false,"summaryRan":false}
2026-06-12T03:09:59.120567041Z [gateway] disconnected (1006): 
2026-06-12T04:06:43.98737069Z [gateway] disconnected (1005): 
2026-06-12T05:34:01.537854772Z [gateway] disconnected (1005): 
2026-06-12T06:45:05.998313495Z [cron/standup] guild 1364793724877672588 {"reminderSent":false,"nudgeSent":true,"summaryRan":false}
2026-06-12T08:23:23.898029452Z [gateway] disconnected (1005): 
2026-06-12T09:00:08.220200221Z [cron/standup] guild 1364793724877672588 {"reminderSent":false,"nudgeSent":false,"summaryRan":true}
2026-06-12T10:30:06.63399582Z [cron/standup] guild 751138389507702844 reminder: DiscordApiError: Discord API error: 404 Not Found
2026-06-12T10:30:06.634094272Z [cron/standup] guild 751138389507702844 {"reminderSent":false,"nudgeSent":false,"summaryRan":false,"reminderError":"Discord API error: 404 Not Found"}
2026-06-12T10:30:06.64295923Z     at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:113:15)
2026-06-12T10:30:06.642972251Z     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-12T10:30:06.642979061Z     at async fetchMemberIdsWithRole (file:///opt/render/project/src/dist/discord/guild-members.js:21:20)
2026-06-12T10:30:06.642984581Z     at async runDailyReminder (file:///opt/render/project/src/dist/standup/reminder.js:8:29)
2026-06-12T10:30:06.643004821Z     at async file:///opt/render/project/src/dist/cron/standup-tick.js:91:13
2026-06-12T10:30:06.643011751Z     at async runTickAction (file:///opt/render/project/src/dist/cron/standup-tick.js:18:9)
2026-06-12T10:30:06.643018601Z     at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:90:31)
2026-06-12T10:30:06.643026221Z     at async runStandupTickInner (file:///opt/render/project/src/dist/cron/standup-tick.js:70:24) {
2026-06-12T10:30:06.643042032Z   status: 404,
2026-06-12T10:30:06.643045502Z   body: { message: 'Unknown Guild', code: 10004 }
2026-06-12T10:30:06.643048052Z }
2026-06-12T11:46:55.60925725Z [gateway] disconnected (1005): 
2026-06-12T13:02:53.999433293Z [gateway] disconnected (1006): 
2026-06-12T14:18:25.840816286Z [gateway] disconnected (1005): 
2026-06-12T15:00:06.778150837Z [cron/standup] guild 751138389507702844 {"reminderSent":false,"nudgeSent":false,"summaryRan":false,"nudgeError":"Discord API error: 404 Not Found"}
2026-06-12T15:00:06.778793758Z [cron/standup] guild 751138389507702844 nudge: DiscordApiError: Discord API error: 404 Not Found
2026-06-12T15:00:06.778799879Z     at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:113:15)
2026-06-12T15:00:06.778803309Z     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-12T15:00:06.778806949Z     at async fetchMemberIdsWithRole (file:///opt/render/project/src/dist/discord/guild-members.js:21:20)
2026-06-12T15:00:06.778809969Z     at async runMissingReporterNudge (file:///opt/render/project/src/dist/standup/missing-reporters.js:18:25)
2026-06-12T15:00:06.778813179Z     at async file:///opt/render/project/src/dist/cron/standup-tick.js:106:33
2026-06-12T15:00:06.778816269Z     at async runTickAction (file:///opt/render/project/src/dist/cron/standup-tick.js:18:9)
2026-06-12T15:00:06.778819339Z     at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:105:28)
2026-06-12T15:00:06.778822349Z     at async runStandupTickInner (file:///opt/render/project/src/dist/cron/standup-tick.js:70:24) {
2026-06-12T15:00:06.778825399Z   status: 404,
2026-06-12T15:00:06.778828909Z   body: { message: 'Unknown Guild', code: 10004 }
2026-06-12T15:00:06.778832019Z }
2026-06-12T15:45:06.80859876Z [cron/standup] guild 751138389507702844 channel 858294696593326100 summary: DiscordApiError: Discord API error: 403 Forbidden
2026-06-12T15:45:06.808790354Z [cron/standup] guild 751138389507702844 {"reminderSent":false,"nudgeSent":false,"summaryRan":false,"summaryError":"Discord denied access to the standup channel (Discord code 50001).\n\nCheck that:\n1. The channel in `/standup-config show` still exists\n2. The bot can **View Channel** and **Read Message History** there\n3. Re-run `/standup-config set channel:#your-standup-channel` if needed"}
2026-06-12T15:45:06.809270992Z     at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:113:15)
2026-06-12T15:45:06.809278513Z     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-12T15:45:06.809282993Z     at async fetchChannelMessages (file:///opt/render/project/src/dist/ingestion/discord.js:60:22)
2026-06-12T15:45:06.809286233Z     at async ingestStandupMessages (file:///opt/render/project/src/dist/ingestion/discord.js:7:25)
2026-06-12T15:45:06.809290113Z     at async runPipeline (file:///opt/render/project/src/dist/pipeline.js:12:18)
2026-06-12T15:45:06.809293513Z     at async runTickAction.channelId (file:///opt/render/project/src/dist/cron/standup-tick.js:121:13)
2026-06-12T15:45:06.809296613Z     at async runTickAction (file:///opt/render/project/src/dist/cron/standup-tick.js:18:9)
2026-06-12T15:45:06.809299713Z     at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:120:30)
2026-06-12T15:45:06.809332014Z     at async runStandupTickInner (file:///opt/render/project/src/dist/cron/standup-tick.js:70:24) {
2026-06-12T15:45:06.809338414Z   status: 403,
2026-06-12T15:45:06.809343984Z   body: { message: 'Missing Access', code: 50001 }
2026-06-12T15:45:06.809348604Z }
2026-06-12T17:31:38.894300721Z [gateway] disconnected (1005): 
2026-06-12T17:55:31.685572743Z [gateway] disconnected (1001): 
2026-06-12T18:16:39.57537607Z [gateway] disconnected (1001): 
2026-06-12T20:56:44.724089049Z [gateway] disconnected (1005): 
2026-06-13T00:53:39.603141352Z [gateway] disconnected (1005): 
2026-06-13T02:26:33.38962743Z [gateway] disconnected (1005): 
2026-06-13T03:42:51.801680782Z [gateway] disconnected (1006): 
2026-06-13T04:19:23.355492127Z [gateway] disconnected (1005): 
2026-06-13T07:52:53.20785595Z [gateway] disconnected (1006): 
2026-06-13T10:29:42.058450657Z [gateway] disconnected (1005): 
2026-06-13T13:25:12.8200585Z [gateway] disconnected (1005): 
2026-06-13T15:28:06.1428467Z [gateway] disconnected (1005): 
2026-06-13T17:41:42.572743093Z [gateway] disconnected (1005): 
2026-06-13T20:37:40.060135211Z [gateway] disconnected (1005): 
2026-06-14T00:23:47.501379614Z [gateway] disconnected (1005): 
2026-06-14T04:06:19.332953506Z [gateway] disconnected (1005): 
2026-06-14T06:07:43.304110062Z [gateway] disconnected (1005): 
2026-06-14T09:32:30.849957224Z [gateway] disconnected (1005): 
2026-06-14T10:30:11.47542995Z [cron/standup] guild 751138389507702844 reminder: DiscordApiError: Discord API error: 404 Not Found
2026-06-14T10:30:11.475924199Z [cron/standup] guild 751138389507702844 {"reminderSent":false,"nudgeSent":false,"summaryRan":false,"reminderError":"Discord API error: 404 Not Found"}
2026-06-14T10:30:11.476113612Z     at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:113:15)
2026-06-14T10:30:11.476122902Z     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-14T10:30:11.476128142Z     at async fetchMemberIdsWithRole (file:///opt/render/project/src/dist/discord/guild-members.js:21:20)
2026-06-14T10:30:11.476132482Z     at async runDailyReminder (file:///opt/render/project/src/dist/standup/reminder.js:8:29)
2026-06-14T10:30:11.476137463Z     at async file:///opt/render/project/src/dist/cron/standup-tick.js:91:13
2026-06-14T10:30:11.476141823Z     at async runTickAction (file:///opt/render/project/src/dist/cron/standup-tick.js:18:9)
2026-06-14T10:30:11.476146233Z     at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:90:31)
2026-06-14T10:30:11.476150813Z     at async runStandupTickInner (file:///opt/render/project/src/dist/cron/standup-tick.js:70:24) {
2026-06-14T10:30:11.476155403Z   status: 404,
2026-06-14T10:30:11.476160403Z   body: { message: 'Unknown Guild', code: 10004 }
2026-06-14T10:30:11.476164663Z }
2026-06-14T11:36:58.686624676Z [gateway] disconnected (1005): 
2026-06-14T14:05:33.321641327Z [gateway] disconnected (1005): 
2026-06-14T14:35:28.566581294Z [gateway] disconnected (1005): 
2026-06-14T15:00:11.444890246Z [cron/standup] guild 751138389507702844 nudge: DiscordApiError: Discord API error: 404 Not Found
2026-06-14T15:00:11.444950537Z [cron/standup] guild 751138389507702844 {"reminderSent":false,"nudgeSent":false,"summaryRan":false,"nudgeError":"Discord API error: 404 Not Found"}
2026-06-14T15:00:11.449506706Z     at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:113:15)
2026-06-14T15:00:11.449516566Z     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-14T15:00:11.449573517Z     at async fetchMemberIdsWithRole (file:///opt/render/project/src/dist/discord/guild-members.js:21:20)
2026-06-14T15:00:11.449580418Z     at async runMissingReporterNudge (file:///opt/render/project/src/dist/standup/missing-reporters.js:18:25)
2026-06-14T15:00:11.449585407Z     at async file:///opt/render/project/src/dist/cron/standup-tick.js:106:33
2026-06-14T15:00:11.449589778Z     at async runTickAction (file:///opt/render/project/src/dist/cron/standup-tick.js:18:9)
2026-06-14T15:00:11.449594138Z     at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:105:28)
2026-06-14T15:00:11.449598348Z     at async runStandupTickInner (file:///opt/render/project/src/dist/cron/standup-tick.js:70:24) {
2026-06-14T15:00:11.450203198Z   status: 404,
2026-06-14T15:00:11.450208209Z   body: { message: 'Unknown Guild', code: 10004 }
2026-06-14T15:00:11.450211178Z }
2026-06-14T15:09:53.240804063Z [gateway] disconnected (1005): 
2026-06-14T15:45:11.415168962Z [cron/standup] guild 751138389507702844 {"reminderSent":false,"nudgeSent":false,"summaryRan":false,"summaryError":"Discord denied access to the standup channel (Discord code 50001).\n\nCheck that:\n1. The channel in `/standup-config show` still exists\n2. The bot can **View Channel** and **Read Message History** there\n3. Re-run `/standup-config set channel:#your-standup-channel` if needed"}
2026-06-14T15:45:11.415188323Z [cron/standup] guild 751138389507702844 channel 858294696593326100 summary: DiscordApiError: Discord API error: 403 Forbidden
2026-06-14T15:45:11.415850544Z     at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:113:15)
2026-06-14T15:45:11.415856104Z     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-14T15:45:11.415860644Z     at async fetchChannelMessages (file:///opt/render/project/src/dist/ingestion/discord.js:60:22)
2026-06-14T15:45:11.415865285Z     at async ingestStandupMessages (file:///opt/render/project/src/dist/ingestion/discord.js:7:25)
2026-06-14T15:45:11.415869925Z     at async runPipeline (file:///opt/render/project/src/dist/pipeline.js:12:18)
2026-06-14T15:45:11.415874555Z     at async runTickAction.channelId (file:///opt/render/project/src/dist/cron/standup-tick.js:121:13)
2026-06-14T15:45:11.415879325Z     at async runTickAction (file:///opt/render/project/src/dist/cron/standup-tick.js:18:9)
2026-06-14T15:45:11.415883915Z     at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:120:30)
2026-06-14T15:45:11.415888415Z     at async runStandupTickInner (file:///opt/render/project/src/dist/cron/standup-tick.js:70:24) {
2026-06-14T15:45:11.415892955Z   status: 403,
2026-06-14T15:45:11.415897855Z   body: { message: 'Missing Access', code: 50001 }
2026-06-14T15:45:11.415902285Z }
2026-06-14T16:45:42.766241643Z [gateway] disconnected (1005): 
2026-06-14T20:37:20.740143832Z [gateway] disconnected (1005): 
2026-06-15T00:16:29.590416178Z [gateway] disconnected (1005): 
2026-06-15T02:31:08.918752039Z [gateway] disconnected (1005): 
2026-06-15T03:00:10.643385965Z [cron/standup] guild 1364793724877672588 {"reminderSent":true,"nudgeSent":false,"summaryRan":false}
2026-06-15T05:41:38.052107128Z [gateway] disconnected (1005): 
2026-06-15T06:45:10.595433955Z [cron/standup] guild 1364793724877672588 {"reminderSent":false,"nudgeSent":true,"summaryRan":false}
2026-06-15T09:00:13.593149975Z [cron/standup] guild 1364793724877672588 {"reminderSent":false,"nudgeSent":false,"summaryRan":true}
2026-06-15T09:22:46.184066997Z [gateway] disconnected (1005): 
2026-06-15T10:30:11.708623664Z [cron/standup] guild 751138389507702844 reminder: DiscordApiError: Discord API error: 404 Not Found
2026-06-15T10:30:11.709004031Z [cron/standup] guild 751138389507702844 {"reminderSent":false,"nudgeSent":false,"summaryRan":false,"reminderError":"Discord API error: 404 Not Found"}
2026-06-15T10:30:11.709419018Z     at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:113:15)
2026-06-15T10:30:11.709427908Z     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-15T10:30:11.709432438Z     at async fetchMemberIdsWithRole (file:///opt/render/project/src/dist/discord/guild-members.js:21:20)
2026-06-15T10:30:11.709436738Z     at async runDailyReminder (file:///opt/render/project/src/dist/standup/reminder.js:8:29)
2026-06-15T10:30:11.709441318Z     at async file:///opt/render/project/src/dist/cron/standup-tick.js:91:13
2026-06-15T10:30:11.71010448Z     at async runTickAction (file:///opt/render/project/src/dist/cron/standup-tick.js:18:9)
2026-06-15T10:30:11.71011316Z     at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:90:31)
2026-06-15T10:30:11.71011641Z     at async runStandupTickInner (file:///opt/render/project/src/dist/cron/standup-tick.js:70:24) {
2026-06-15T10:30:11.71011899Z   status: 404,
2026-06-15T10:30:11.71012204Z   body: { message: 'Unknown Guild', code: 10004 }
2026-06-15T10:30:11.710124621Z }
2026-06-15T11:48:20.567639485Z [gateway] disconnected (1001): 
2026-06-15T15:00:11.939881062Z [cron/standup] guild 751138389507702844 nudge: DiscordApiError: Discord API error: 404 Not Found
2026-06-15T15:00:11.939911933Z [cron/standup] guild 751138389507702844 {"reminderSent":false,"nudgeSent":false,"summaryRan":false,"nudgeError":"Discord API error: 404 Not Found"}
2026-06-15T15:00:11.940623855Z     at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:113:15)
2026-06-15T15:00:11.940631215Z     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-15T15:00:11.940635475Z     at async fetchMemberIdsWithRole (file:///opt/render/project/src/dist/discord/guild-members.js:21:20)
2026-06-15T15:00:11.940638675Z     at async runMissingReporterNudge (file:///opt/render/project/src/dist/standup/missing-reporters.js:18:25)
2026-06-15T15:00:11.940672096Z     at async file:///opt/render/project/src/dist/cron/standup-tick.js:106:33
2026-06-15T15:00:11.940678176Z     at async runTickAction (file:///opt/render/project/src/dist/cron/standup-tick.js:18:9)
2026-06-15T15:00:11.940681736Z     at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:105:28)
2026-06-15T15:00:11.940685916Z     at async runStandupTickInner (file:///opt/render/project/src/dist/cron/standup-tick.js:70:24) {
2026-06-15T15:00:11.940689096Z   status: 404,
2026-06-15T15:00:11.940693986Z   body: { message: 'Unknown Guild', code: 10004 }
2026-06-15T15:00:11.940697096Z }
2026-06-15T15:37:05.815150178Z [gateway] disconnected (1005): 
2026-06-15T15:45:12.113684225Z [cron/standup] guild 751138389507702844 channel 858294696593326100 summary: DiscordApiError: Discord API error: 403 Forbidden
2026-06-15T15:45:12.11396732Z [cron/standup] guild 751138389507702844 {"reminderSent":false,"nudgeSent":false,"summaryRan":false,"summaryError":"Discord denied access to the standup channel (Discord code 50001).\n\nCheck that:\n1. The channel in `/standup-config show` still exists\n2. The bot can **View Channel** and **Read Message History** there\n3. Re-run `/standup-config set channel:#your-standup-channel` if needed"}
2026-06-15T15:45:12.11453991Z     at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:113:15)
2026-06-15T15:45:12.11455053Z     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-15T15:45:12.11455605Z     at async fetchChannelMessages (file:///opt/render/project/src/dist/ingestion/discord.js:60:22)
2026-06-15T15:45:12.11456096Z     at async ingestStandupMessages (file:///opt/render/project/src/dist/ingestion/discord.js:7:25)
2026-06-15T15:45:12.11456666Z     at async runPipeline (file:///opt/render/project/src/dist/pipeline.js:12:18)
2026-06-15T15:45:12.11457161Z     at async runTickAction.channelId (file:///opt/render/project/src/dist/cron/standup-tick.js:121:13)
2026-06-15T15:45:12.11457574Z     at async runTickAction (file:///opt/render/project/src/dist/cron/standup-tick.js:18:9)
2026-06-15T15:45:12.115342814Z     at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:120:30)
2026-06-15T15:45:12.115353434Z     at async runStandupTickInner (file:///opt/render/project/src/dist/cron/standup-tick.js:70:24) {
2026-06-15T15:45:12.115356564Z   status: 403,
2026-06-15T15:45:12.115360194Z   body: { message: 'Missing Access', code: 50001 }
2026-06-15T15:45:12.115363394Z }
2026-06-15T18:56:24.977890216Z [gateway] disconnected (1005): 
2026-06-15T20:48:26.593824181Z [gateway] disconnected (1006): 
2026-06-15T21:07:45.696943827Z [gateway] disconnected (1006): 
2026-06-15T22:11:34.019821162Z [gateway] disconnected (1005): 
2026-06-15T22:41:06.337812956Z [gateway] disconnected (1006): 
2026-06-15T23:09:01.182125883Z [gateway] disconnected (1006): 
2026-06-16T02:34:09.193678439Z [gateway] disconnected (1006): 
2026-06-16T03:00:12.017817413Z [cron/standup] guild 1364793724877672588 {"reminderSent":true,"nudgeSent":false,"summaryRan":false}
2026-06-16T03:42:37.335794056Z [gateway] disconnected (1005): 
2026-06-16T04:15:49.20816697Z [gateway] disconnected (1005): 
2026-06-16T06:05:49.953893883Z [gateway] disconnected (1005): 
2026-06-16T06:45:11.83638956Z [cron/standup] guild 1364793724877672588 {"reminderSent":false,"nudgeSent":true,"summaryRan":false}
2026-06-16T08:21:43.492798637Z [gateway] disconnected (1005): 
2026-06-16T09:00:17.197829687Z [cron/standup] guild 1364793724877672588 {"reminderSent":false,"nudgeSent":false,"summaryRan":true}
2026-06-16T10:08:06.507558425Z [gateway] disconnected (1001): 
2026-06-16T10:08:42.06782736Z [gateway] reconnected as Wizard of Oz
2026-06-16T10:24:18.934352427Z [gateway] disconnected (1005): 
2026-06-16T13:22:06.583058786Z [gateway] disconnected (1006): 
2026-06-16T13:34:42.374651194Z [gateway] disconnected (1006): 
2026-06-16T15:58:11.87546778Z [gateway] disconnected (1005): 
2026-06-16T16:39:52.949533622Z [gateway] disconnected (1005): 
2026-06-16T18:16:22.390273294Z [gateway] disconnected (1005): 
2026-06-16T21:29:10.146352139Z [gateway] disconnected (1005): 
2026-06-16T22:56:01.989313174Z [gateway] disconnected (1005): 
2026-06-16T22:56:43.432683316Z [gateway] reconnected as Wizard of Oz
2026-06-16T23:20:22.14780715Z [gateway] disconnected (1005): 
2026-06-17T01:17:25.113091592Z [gateway] disconnected (1005): 
2026-06-17T03:01:12.773118535Z [cron/standup] tick skipped, previous still running
2026-06-17T03:02:12.778136956Z [cron/standup] tick skipped, previous still running
2026-06-17T03:03:12.782388402Z [cron/standup] tick skipped, previous still running
2026-06-17T03:04:12.786023348Z [cron/standup] tick skipped, previous still running
2026-06-17T03:05:12.789991579Z [cron/standup] tick skipped, previous still running
2026-06-17T03:06:12.794075122Z [cron/standup] tick skipped, previous still running
2026-06-17T03:07:12.795973164Z [cron/standup] tick skipped, previous still running
2026-06-17T03:08:12.797058483Z [cron/standup] tick skipped, previous still running
2026-06-17T03:09:12.800028157Z [cron/standup] tick skipped, previous still running
2026-06-17T03:10:12.800710135Z [cron/standup] tick skipped, previous still running
2026-06-17T03:11:12.803068165Z [cron/standup] tick skipped, previous still running
2026-06-17T03:12:12.807059788Z [cron/standup] tick skipped, previous still running
2026-06-17T03:13:12.81003938Z [cron/standup] tick skipped, previous still running
2026-06-17T03:14:12.813038805Z [cron/standup] tick skipped, previous still running
2026-06-17T03:15:12.817422827Z [cron/standup] tick skipped, previous still running
2026-06-17T03:16:12.821030466Z [cron/standup] tick skipped, previous still running
2026-06-17T03:17:12.824027367Z [cron/standup] tick skipped, previous still running
2026-06-17T03:18:12.828472889Z [cron/standup] tick skipped, previous still running
2026-06-17T03:19:12.832010516Z [cron/standup] tick skipped, previous still running
2026-06-17T03:20:12.835485347Z [cron/standup] tick skipped, previous still running
2026-06-17T03:21:12.835666967Z [cron/standup] tick skipped, previous still running
2026-06-17T03:22:12.839094936Z [cron/standup] tick skipped, previous still running
2026-06-17T03:23:12.841017102Z [cron/standup] tick skipped, previous still running
2026-06-17T03:24:12.844583087Z [cron/standup] tick skipped, previous still running
2026-06-17T03:25:12.845415504Z [cron/standup] tick skipped, previous still running
2026-06-17T03:26:12.846494664Z [cron/standup] tick skipped, previous still running
2026-06-17T03:27:12.850320455Z [cron/standup] tick skipped, previous still running
2026-06-17T03:28:12.854036812Z [cron/standup] tick skipped, previous still running
2026-06-17T03:29:12.856319369Z [cron/standup] tick skipped, previous still running
2026-06-17T03:30:12.860014624Z [cron/standup] tick skipped, previous still running
2026-06-17T03:31:12.864020334Z [cron/standup] tick skipped, previous still running
2026-06-17T03:32:12.865043185Z [cron/standup] tick skipped, previous still running
2026-06-17T03:33:12.868004445Z [cron/standup] tick skipped, previous still running
2026-06-17T03:34:12.872012415Z [cron/standup] tick skipped, previous still running
2026-06-17T03:35:12.873869914Z [cron/standup] tick skipped, previous still running
2026-06-17T03:36:12.877755716Z [cron/standup] tick skipped, previous still running
2026-06-17T03:37:12.87758896Z [cron/standup] tick skipped, previous still running
2026-06-17T03:38:12.881030228Z [cron/standup] tick skipped, previous still running
2026-06-17T03:39:12.885139982Z [cron/standup] tick skipped, previous still running
2026-06-17T03:40:12.886029966Z [cron/standup] tick skipped, previous still running
2026-06-17T03:41:12.889987493Z [cron/standup] tick skipped, previous still running
2026-06-17T03:42:12.894044808Z [cron/standup] tick skipped, previous still running
2026-06-17T03:43:12.894414172Z [cron/standup] tick skipped, previous still running
2026-06-17T03:44:12.897884199Z [cron/standup] tick skipped, previous still running
2026-06-17T03:45:12.899417823Z [cron/standup] tick skipped, previous still running
2026-06-17T03:46:12.903040817Z [cron/standup] tick skipped, previous still running
2026-06-17T03:47:12.907118477Z [cron/standup] tick skipped, previous still running
2026-06-17T03:48:12.911086864Z [cron/standup] tick skipped, previous still running
2026-06-17T03:49:12.91506998Z [cron/standup] tick skipped, previous still running
2026-06-17T03:50:12.916998495Z [cron/standup] tick skipped, previous still running
2026-06-17T03:51:12.922075554Z [cron/standup] tick skipped, previous still running
2026-06-17T03:52:12.925992859Z [cron/standup] tick skipped, previous still running
2026-06-17T03:53:12.929054819Z [cron/standup] tick skipped, previous still running
2026-06-17T03:54:12.929408608Z [cron/standup] tick skipped, previous still running
2026-06-17T03:55:12.933035493Z [cron/standup] tick skipped, previous still running
2026-06-17T03:56:12.937801854Z [cron/standup] tick skipped, previous still running
2026-06-17T03:57:12.940554559Z [cron/standup] tick skipped, previous still running
2026-06-17T03:58:12.944066644Z [cron/standup] tick skipped, previous still running
2026-06-17T03:59:12.948073133Z [cron/standup] tick skipped, previous still running
2026-06-17T04:00:12.948781562Z [cron/standup] tick skipped, previous still running
2026-06-17T04:01:12.951975208Z [cron/standup] tick skipped, previous still running
2026-06-17T04:02:12.956046491Z [cron/standup] tick skipped, previous still running
2026-06-17T04:03:12.960110874Z [cron/standup] tick skipped, previous still running
2026-06-17T04:04:12.960385579Z [cron/standup] tick skipped, previous still running
2026-06-17T04:05:12.960504573Z [cron/standup] tick skipped, previous still running
2026-06-17T04:06:12.964076437Z [cron/standup] tick skipped, previous still running
2026-06-17T04:07:12.969180397Z [cron/standup] tick skipped, previous still running
2026-06-17T04:08:12.973009327Z [cron/standup] tick skipped, previous still running
2026-06-17T04:08:26.094989277Z [gateway] disconnected (1005): 
2026-06-17T04:09:12.974766323Z [cron/standup] tick skipped, previous still running
2026-06-17T04:10:12.978599017Z [cron/standup] tick skipped, previous still running
2026-06-17T04:11:12.982046613Z [cron/standup] tick skipped, previous still running
2026-06-17T04:12:12.982939286Z [cron/standup] tick skipped, previous still running
2026-06-17T04:13:12.986010424Z [cron/standup] tick skipped, previous still running
2026-06-17T04:14:12.990033644Z [cron/standup] tick skipped, previous still running
2026-06-17T04:15:12.994065508Z [cron/standup] tick skipped, previous still running
2026-06-17T04:16:12.998045784Z [cron/standup] tick skipped, previous still running
2026-06-17T04:17:13.002032937Z [cron/standup] tick skipped, previous still running
2026-06-17T04:18:13.003332341Z [cron/standup] tick skipped, previous still running
2026-06-17T04:19:13.007032488Z [cron/standup] tick skipped, previous still running
2026-06-17T04:20:13.008240338Z [cron/standup] tick skipped, previous still running
2026-06-17T04:21:13.012058884Z [cron/standup] tick skipped, previous still running
2026-06-17T04:22:13.016044949Z [cron/standup] tick skipped, previous still running
2026-06-17T04:23:13.020027983Z [cron/standup] tick skipped, previous still running
2026-06-17T04:24:13.024133779Z [cron/standup] tick skipped, previous still running
2026-06-17T04:25:13.028971192Z [cron/standup] tick skipped, previous still running
2026-06-17T04:26:13.033418229Z [cron/standup] tick skipped, previous still running
2026-06-17T04:27:13.037181949Z [cron/standup] tick skipped, previous still running
2026-06-17T04:28:13.041783152Z [cron/standup] tick skipped, previous still running
2026-06-17T04:29:13.043393456Z [cron/standup] tick skipped, previous still running
2026-06-17T04:30:13.04707896Z [cron/standup] tick skipped, previous still running
2026-06-17T04:31:13.049191635Z [cron/standup] tick skipped, previous still running
2026-06-17T04:32:13.053079609Z [cron/standup] tick skipped, previous still running
2026-06-17T04:33:13.057026128Z [cron/standup] tick skipped, previous still running
2026-06-17T04:34:13.061423843Z [cron/standup] tick skipped, previous still running
2026-06-17T04:35:13.065036819Z [cron/standup] tick skipped, previous still running
2026-06-17T04:36:13.069062123Z [cron/standup] tick skipped, previous still running
2026-06-17T04:37:13.072341462Z [cron/standup] tick skipped, previous still running
2026-06-17T04:38:13.077002002Z [cron/standup] tick skipped, previous still running
2026-06-17T04:39:13.081152046Z [cron/standup] tick skipped, previous still running
2026-06-17T04:40:13.085321997Z [cron/standup] tick skipped, previous still running
2026-06-17T04:41:13.090076504Z [cron/standup] tick skipped, previous still running
2026-06-17T04:42:13.091796309Z [cron/standup] tick skipped, previous still running
2026-06-17T04:43:13.097919231Z [cron/standup] tick skipped, previous still running
2026-06-17T04:44:13.102035192Z [cron/standup] tick skipped, previous still running
2026-06-17T04:45:13.106066835Z [cron/standup] tick skipped, previous still running
2026-06-17T04:46:13.106243333Z [cron/standup] tick skipped, previous still running
2026-06-17T04:47:13.110058547Z [cron/standup] tick skipped, previous still running
2026-06-17T04:48:13.114030292Z [cron/standup] tick skipped, previous still running
2026-06-17T04:49:13.118028933Z [cron/standup] tick skipped, previous still running
2026-06-17T04:50:13.122233936Z [cron/standup] tick skipped, previous still running
2026-06-17T04:51:13.12604727Z [cron/standup] tick skipped, previous still running
2026-06-17T04:52:13.130516905Z [cron/standup] tick skipped, previous still running
2026-06-17T04:53:13.132092604Z [cron/standup] tick skipped, previous still running
2026-06-17T04:54:13.136042046Z [cron/standup] tick skipped, previous still running
2026-06-17T04:55:13.140109889Z [cron/standup] tick skipped, previous still running
2026-06-17T04:56:13.144022311Z [cron/standup] tick skipped, previous still running
2026-06-17T04:57:13.148023799Z [cron/standup] tick skipped, previous still running
2026-06-17T04:58:13.152835527Z [cron/standup] tick skipped, previous still running
2026-06-17T04:59:13.155279763Z [cron/standup] tick skipped, previous still running
2026-06-17T05:00:13.158956087Z [cron/standup] tick skipped, previous still running
2026-06-17T05:01:13.160936974Z [cron/standup] tick skipped, previous still running
2026-06-17T05:02:13.165038929Z [cron/standup] tick skipped, previous still running
2026-06-17T05:03:13.167653221Z [cron/standup] tick skipped, previous still running
2026-06-17T05:04:13.167986425Z [cron/standup] tick skipped, previous still running
2026-06-17T05:05:13.17100985Z [cron/standup] tick skipped, previous still running
2026-06-17T05:06:13.176176024Z [cron/standup] tick skipped, previous still running
2026-06-17T05:07:13.180074903Z [cron/standup] tick skipped, previous still running
2026-06-17T05:08:13.183240845Z [cron/standup] tick skipped, previous still running
2026-06-17T05:09:13.188712123Z [cron/standup] tick skipped, previous still running
2026-06-17T05:10:13.192241409Z [cron/standup] tick skipped, previous still running
2026-06-17T05:11:13.196028281Z [cron/standup] tick skipped, previous still running
2026-06-17T05:12:13.200217233Z [cron/standup] tick skipped, previous still running
2026-06-17T05:13:13.204057693Z [cron/standup] tick skipped, previous still running
2026-06-17T05:14:13.209021031Z [cron/standup] tick skipped, previous still running
2026-06-17T05:15:13.211000745Z [cron/standup] tick skipped, previous still running
2026-06-17T05:16:13.21505498Z [cron/standup] tick skipped, previous still running
2026-06-17T05:17:13.219047705Z [cron/standup] tick skipped, previous still running
2026-06-17T05:18:13.223617803Z [cron/standup] tick skipped, previous still running
2026-06-17T05:19:13.227040532Z [cron/standup] tick skipped, previous still running
2026-06-17T05:20:13.231048328Z [cron/standup] tick skipped, previous still running
2026-06-17T05:21:13.236048531Z [cron/standup] tick skipped, previous still running
2026-06-17T05:22:13.241088643Z [cron/standup] tick skipped, previous still running
2026-06-17T05:23:13.245081094Z [cron/standup] tick skipped, previous still running
2026-06-17T05:24:13.249088436Z [cron/standup] tick skipped, previous still running
2026-06-17T05:25:13.253067321Z [cron/standup] tick skipped, previous still running
2026-06-17T05:26:13.254252623Z [cron/standup] tick skipped, previous still running
2026-06-17T05:27:13.258031263Z [cron/standup] tick skipped, previous still running
2026-06-17T05:28:13.262024864Z [cron/standup] tick skipped, previous still running
2026-06-17T05:29:13.266043382Z [cron/standup] tick skipped, previous still running
2026-06-17T05:30:13.271686051Z [cron/standup] tick skipped, previous still running
2026-06-17T05:31:13.27416927Z [cron/standup] tick skipped, previous still running
2026-06-17T05:32:13.278033173Z [cron/standup] tick skipped, previous still running
2026-06-17T05:33:13.282122737Z [cron/standup] tick skipped, previous still running
2026-06-17T05:34:13.287060113Z [cron/standup] tick skipped, previous still running
2026-06-17T05:35:13.292067906Z [cron/standup] tick skipped, previous still running
2026-06-17T05:36:13.294502229Z [cron/standup] tick skipped, previous still running
2026-06-17T05:37:13.294859344Z [cron/standup] tick skipped, previous still running
2026-06-17T05:38:13.299574954Z [cron/standup] tick skipped, previous still running
2026-06-17T05:39:13.30408666Z [cron/standup] tick skipped, previous still running
2026-06-17T05:40:13.306788739Z [cron/standup] tick skipped, previous still running
2026-06-17T05:41:13.306996987Z [cron/standup] tick skipped, previous still running
2026-06-17T05:42:13.307456575Z [cron/standup] tick skipped, previous still running
2026-06-17T05:43:13.311033778Z [cron/standup] tick skipped, previous still running
2026-06-17T05:44:13.31580373Z [cron/standup] tick skipped, previous still running
2026-06-17T05:45:13.315545996Z [cron/standup] tick skipped, previous still running
2026-06-17T05:46:13.319142319Z [cron/standup] tick skipped, previous still running
2026-06-17T05:47:13.323549769Z [cron/standup] tick skipped, previous still running
2026-06-17T05:48:13.327028219Z [cron/standup] tick skipped, previous still running
2026-06-17T05:49:13.327871055Z [cron/standup] tick skipped, previous still running
2026-06-17T05:50:13.327332943Z [cron/standup] tick skipped, previous still running