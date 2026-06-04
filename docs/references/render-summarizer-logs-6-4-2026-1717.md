2026-06-03T17:59:08.130582155Z Standup summarizer listening on port 10000
2026-06-03T17:59:08.520526106Z Registered global slash commands (available in all servers; may take up to ~1 hour on first deploy)
2026-06-03T17:59:08.672169208Z [gateway] online as Wizard of Oz
2026-06-03T17:59:15.64871901Z ==> Your service is live 🎉
2026-06-03T17:59:15.793761969Z ==>
2026-06-03T17:59:15.873775238Z ==> ///////////////////////////////////////////////////////////
2026-06-03T17:59:15.879737726Z ==>
2026-06-03T17:59:15.885436869Z ==> Available at your primary URL https://standup-summarizer.onrender.com
2026-06-03T17:59:15.893555657Z ==>
2026-06-03T17:59:15.902446524Z ==> ///////////////////////////////////////////////////////////
2026-06-03T18:04:16.53596966Z ==> Detected service running on port 10000
2026-06-03T18:04:16.628424267Z ==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
2026-06-03T18:11:13.361750066Z ==> Deploying...
2026-06-03T18:11:13.427015353Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-06-03T18:11:23.667877324Z
2026-06-03T18:11:23.667904274Z > wizard-of-oz-discord@1.0.0 start
2026-06-03T18:11:23.667909834Z > node dist/index.js
2026-06-03T18:11:23.667913994Z
2026-06-03T18:11:26.960627782Z [scheduler] internal standup tick enabled (every 60s, first aligned tick in 34s)
2026-06-03T18:11:27.062500628Z Standup summarizer listening on port 10000
2026-06-03T18:11:27.552266307Z Registered global slash commands (available in all servers; may take up to ~1 hour on first deploy)
2026-06-03T18:11:27.58714955Z [gateway] online as Wizard of Oz
2026-06-03T18:11:35.413054215Z ==> Your service is live 🎉
2026-06-03T18:11:35.499813696Z ==>
2026-06-03T18:11:35.506215064Z ==> ///////////////////////////////////////////////////////////
2026-06-03T18:11:35.515797806Z ==>
2026-06-03T18:11:35.526021692Z ==> Available at your primary URL https://standup-summarizer.onrender.com
2026-06-03T18:11:35.530553897Z ==>
2026-06-03T18:11:35.538072521Z ==> ///////////////////////////////////////////////////////////
2026-06-03T18:13:44.931156836Z [egress/discord] Summary posted without attachment URL; removing download button
2026-06-03T18:13:45.126842481Z [egress/discord] Failed to patch summary after missing attachment URL: DiscordApiError: Discord API error: 400 Bad Request
2026-06-03T18:13:45.126867601Z at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:98:15)
2026-06-03T18:13:45.126918462Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-03T18:13:45.126924503Z at async patchChannelMessage (file:///opt/render/project/src/dist/egress/discord.js:206:5)
2026-06-03T18:13:45.126928723Z at async broadcastResult (file:///opt/render/project/src/dist/egress/discord.js:121:13)
2026-06-03T18:13:45.126933333Z at async runPipeline (file:///opt/render/project/src/dist/pipeline.js:15:20)
2026-06-03T18:13:45.126938023Z at async runSummarizeAndFollowUp (file:///opt/render/project/src/dist/commands/standup.js:10:24) {
2026-06-03T18:13:45.126942183Z status: 400,
2026-06-03T18:13:45.126946533Z body: {
2026-06-03T18:13:45.126951503Z message: 'Invalid Form Body',
2026-06-03T18:13:45.126955853Z code: 50035,
2026-06-03T18:13:45.126959813Z errors: { components: [Object] }
2026-06-03T18:13:45.126963803Z }
2026-06-03T18:13:45.126967653Z }
2026-06-03T18:16:34.693658503Z ==> Detected service running on port 10000
2026-06-03T18:16:34.796977625Z ==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
2026-06-03T18:17:43.730589927Z ==> Deploying...
2026-06-03T18:17:43.871286619Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-06-03T18:17:55.564434961Z ==> Running 'npm start'
2026-06-03T18:17:57.171031685Z
2026-06-03T18:17:57.171056285Z > wizard-of-oz-discord@1.0.0 start
2026-06-03T18:17:57.171060945Z > node dist/index.js
2026-06-03T18:17:57.171063055Z
2026-06-03T18:18:00.573417519Z [scheduler] internal standup tick enabled (every 60s, first aligned tick in 60s)
2026-06-03T18:18:00.7607211Z Standup summarizer listening on port 10000
2026-06-03T18:18:01.261085539Z Registered global slash commands (available in all servers; may take up to ~1 hour on first deploy)
2026-06-03T18:18:01.261853338Z [gateway] online as Wizard of Oz
2026-06-03T18:18:05.040125704Z ==> Your service is live 🎉
2026-06-03T18:18:05.318139731Z ==>
2026-06-03T18:18:05.321220347Z ==> ///////////////////////////////////////////////////////////
2026-06-03T18:18:05.324070876Z ==>
2026-06-03T18:18:05.326622334Z ==> Available at your primary URL https://standup-summarizer.onrender.com
2026-06-03T18:18:05.329358825Z ==>
2026-06-03T18:18:05.33241283Z ==> ///////////////////////////////////////////////////////////
2026-06-03T18:21:17.664818977Z ==> Deploying...
2026-06-03T18:21:17.727007233Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-06-03T18:21:28.096573434Z ==> Running 'npm start'
2026-06-03T18:21:29.704973367Z
2026-06-03T18:21:29.705001648Z > wizard-of-oz-discord@1.0.0 start
2026-06-03T18:21:29.705007548Z > node dist/index.js
2026-06-03T18:21:29.705010659Z
2026-06-03T18:21:32.800700183Z [scheduler] internal standup tick enabled (every 60s, first aligned tick in 28s)
2026-06-03T18:21:32.899336476Z Standup summarizer listening on port 10000
2026-06-03T18:21:33.400104325Z Registered global slash commands (available in all servers; may take up to ~1 hour on first deploy)
2026-06-03T18:21:33.489542114Z [gateway] online as Wizard of Oz
2026-06-03T18:21:38.958318898Z ==> Your service is live 🎉
2026-06-03T18:21:39.107019922Z ==>
2026-06-03T18:21:39.109746095Z ==> ///////////////////////////////////////////////////////////
2026-06-03T18:21:39.115923838Z ==>
2026-06-03T18:21:39.118939698Z ==> Available at your primary URL https://standup-summarizer.onrender.com
2026-06-03T18:21:39.122278575Z ==>
2026-06-03T18:21:39.125384827Z ==> ///////////////////////////////////////////////////////////
2026-06-03T18:25:40.215162873Z [egress/discord] Summary posted without attachment URL; removing download button
2026-06-03T18:25:40.368124967Z [egress/discord] Failed to patch summary after missing attachment URL: DiscordApiError: Discord API error: 400 Bad Request
2026-06-03T18:25:40.368149188Z at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:98:15)
2026-06-03T18:25:40.368154738Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-03T18:25:40.368159648Z at async patchChannelMessage (file:///opt/render/project/src/dist/egress/discord.js:206:5)
2026-06-03T18:25:40.368208229Z at async broadcastResult (file:///opt/render/project/src/dist/egress/discord.js:121:13)
2026-06-03T18:25:40.36821446Z at async runPipeline (file:///opt/render/project/src/dist/pipeline.js:18:20)
2026-06-03T18:25:40.36821933Z at async runSummarizeAndFollowUp (file:///opt/render/project/src/dist/commands/standup.js:10:24) {
2026-06-03T18:25:40.36822357Z status: 400,
2026-06-03T18:25:40.3682286Z body: {
2026-06-03T18:25:40.3682341Z message: 'Invalid Form Body',
2026-06-03T18:25:40.36823908Z code: 50035,
2026-06-03T18:25:40.36824363Z errors: { components: [Object] }
2026-06-03T18:25:40.36824821Z }
2026-06-03T18:25:40.368252861Z }
2026-06-03T18:26:41.010187991Z ==> Detected service running on port 10000
2026-06-03T18:26:41.158613495Z ==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
2026-06-03T18:41:47.933619664Z [gateway] disconnected (1006):
2026-06-03T18:45:04.787363893Z [egress/discord] Summary posted without attachment URL; removing download button
2026-06-03T18:45:04.970170295Z [egress/discord] Failed to patch summary after missing attachment URL: DiscordApiError: Discord API error: 400 Bad Request
2026-06-03T18:45:04.970200566Z at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:98:15)
2026-06-03T18:45:04.970205676Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-03T18:45:04.970209636Z at async patchChannelMessage (file:///opt/render/project/src/dist/egress/discord.js:206:5)
2026-06-03T18:45:04.970213606Z at async broadcastResult (file:///opt/render/project/src/dist/egress/discord.js:121:13)
2026-06-03T18:45:04.970218077Z at async runPipeline (file:///opt/render/project/src/dist/pipeline.js:18:20)
2026-06-03T18:45:04.970221987Z at async processGuildTick (file:///opt/render/project/src/dist/cron/standup-tick.js:44:13)
2026-06-03T18:45:04.970225867Z at async runStandupTick (file:///opt/render/project/src/dist/cron/standup-tick.js:11:22) {
2026-06-03T18:45:04.970229817Z status: 400,
2026-06-03T18:45:04.970234317Z body: {
2026-06-03T18:45:04.970238937Z message: 'Invalid Form Body',
2026-06-03T18:45:04.970242817Z code: 50035,
2026-06-03T18:45:04.970246707Z errors: { components: [Object] }
2026-06-03T18:45:04.970250627Z }
2026-06-03T18:45:04.970254567Z }
2026-06-04T02:17:09.995063993Z ==> Running 'npm start'
2026-06-04T02:17:11.495188319Z
2026-06-04T02:17:11.49521917Z > wizard-of-oz-discord@1.0.0 start
2026-06-04T02:17:11.49522522Z > node dist/index.js
2026-06-04T02:17:11.49522832Z
2026-06-04T02:17:14.498706627Z [scheduler] internal standup tick enabled (every 60s, first aligned tick in 46s)
2026-06-04T02:17:14.593805247Z Standup summarizer listening on port 10000
2026-06-04T02:17:15.113252188Z [gateway] online as Wizard of Oz
2026-06-04T02:17:15.187725477Z Registered global slash commands (available in all servers; may take up to ~1 hour on first deploy)
2026-06-04T03:07:19.889331Z ==> Running 'npm start'
2026-06-04T03:07:20.994156038Z
2026-06-04T03:07:20.9941863Z > wizard-of-oz-discord@1.0.0 start
2026-06-04T03:07:20.99419315Z > node dist/index.js
2026-06-04T03:07:20.99419686Z
2026-06-04T03:07:24.078698666Z [scheduler] internal standup tick enabled (every 60s, first aligned tick in 36s)
2026-06-04T03:07:24.179567032Z Standup summarizer listening on port 10000
2026-06-04T03:07:24.495648038Z Registered global slash commands (available in all servers; may take up to ~1 hour on first deploy)
2026-06-04T03:07:24.743435936Z [gateway] online as Wizard of Oz
2026-06-04T06:27:58.567888129Z ==> Running 'npm start'
2026-06-04T06:28:00.084200549Z
2026-06-04T06:28:00.08422707Z > wizard-of-oz-discord@1.0.0 start
2026-06-04T06:28:00.08423336Z > node dist/index.js
2026-06-04T06:28:00.0842377Z
2026-06-04T06:28:03.371189156Z [scheduler] internal standup tick enabled (every 60s, first aligned tick in 57s)
2026-06-04T06:28:03.472205395Z Standup summarizer listening on port 10000
2026-06-04T06:28:04.025777455Z [gateway] online as Wizard of Oz
2026-06-04T06:28:06.363186748Z Registered global slash commands (available in all servers; may take up to ~1 hour on first deploy)
2026-06-04T06:28:12.820926742Z [egress/discord] Summary posted without attachment URL; removing download button
2026-06-04T06:28:12.823764641Z [egress/discord] Summary posted without attachment URL; removing download button
2026-06-04T06:28:13.010835795Z [egress/discord] Failed to patch summary after missing attachment URL: DiscordApiError: Discord API error: 400 Bad Request
2026-06-04T06:28:13.010864546Z at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:98:15)
2026-06-04T06:28:13.010868066Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-04T06:28:13.010870726Z at async patchChannelMessage (file:///opt/render/project/src/dist/egress/discord.js:206:5)
2026-06-04T06:28:13.010873306Z at async broadcastResult (file:///opt/render/project/src/dist/egress/discord.js:121:13)
2026-06-04T06:28:13.010876446Z at async runPipeline (file:///opt/render/project/src/dist/pipeline.js:18:20)
2026-06-04T06:28:13.010879576Z at async runSummarizeAndFollowUp (file:///opt/render/project/src/dist/commands/standup.js:10:24) {
2026-06-04T06:28:13.010882006Z status: 400,
2026-06-04T06:28:13.010884496Z body: {
2026-06-04T06:28:13.010887566Z message: 'Invalid Form Body',
2026-06-04T06:28:13.010890076Z code: 50035,
2026-06-04T06:28:13.010892486Z errors: { components: [Object] }
2026-06-04T06:28:13.010894956Z }
2026-06-04T06:28:13.010897306Z }
2026-06-04T06:28:13.024575943Z [egress/discord] Failed to patch summary after missing attachment URL: DiscordApiError: Discord API error: 400 Bad Request
2026-06-04T06:28:13.024607624Z at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:98:15)
2026-06-04T06:28:13.024611854Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-04T06:28:13.024615134Z at async patchChannelMessage (file:///opt/render/project/src/dist/egress/discord.js:206:5)
2026-06-04T06:28:13.024618404Z at async broadcastResult (file:///opt/render/project/src/dist/egress/discord.js:121:13)
2026-06-04T06:28:13.024621964Z at async runPipeline (file:///opt/render/project/src/dist/pipeline.js:18:20)
2026-06-04T06:28:13.024625834Z at async runSummarizeAndFollowUp (file:///opt/render/project/src/dist/commands/standup.js:10:24) {
2026-06-04T06:28:13.024628884Z status: 400,
2026-06-04T06:28:13.024632034Z body: {
2026-06-04T06:28:13.024636185Z message: 'Invalid Form Body',
2026-06-04T06:28:13.024639285Z code: 50035,
2026-06-04T06:28:13.024642375Z errors: { components: [Object] }
2026-06-04T06:28:13.024645525Z }
2026-06-04T06:28:13.024648875Z }
2026-06-04T06:28:13.174442357Z [discord/interaction-followup] edit failed: 404 { message: 'Unknown Webhook', code: 10015 }
2026-06-04T06:28:13.182101277Z [discord/interaction-followup] edit failed: 404 { message: 'Unknown Webhook', code: 10015 }
2026-06-04T09:08:23.206110683Z at async runSummarizeAndFollowUp (file:///opt/render/project/src/dist/commands/standup.js:10:24) {
2026-06-04T09:08:23.206113653Z status: 400,
2026-06-04T09:08:23.206116643Z body: {
2026-06-04T09:08:23.206120453Z message: 'Invalid Form Body',
2026-06-04T09:08:23.206123293Z code: 50035,
2026-06-04T09:08:23.206126343Z errors: { components: [Object] }
2026-06-04T09:08:23.206129573Z }
2026-06-04T09:08:23.206132173Z }
2026-06-04T09:08:23.349806207Z [egress/discord] Summary posted without attachment URL; removing download button
2026-06-04T09:08:23.367063791Z [discord/interaction-followup] edit failed: 404 { message: 'Unknown Webhook', code: 10015 }
2026-06-04T09:08:23.566460061Z [egress/discord] Failed to patch summary after missing attachment URL: DiscordApiError: Discord API error: 400 Bad Request
2026-06-04T09:08:23.566481551Z at discordJson (file:///opt/render/project/src/dist/utils/discord-api.js:98:15)
2026-06-04T09:08:23.566486651Z at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-06-04T09:08:23.566491002Z at async patchChannelMessage (file:///opt/render/project/src/dist/egress/discord.js:206:5)
2026-06-04T09:08:23.566495062Z at async broadcastResult (file:///opt/render/project/src/dist/egress/discord.js:121:13)
2026-06-04T09:08:23.566499502Z at async runPipeline (file:///opt/render/project/src/dist/pipeline.js:18:20)
2026-06-04T09:08:23.566503832Z at async runSummarizeAndFollowUp (file:///opt/render/project/src/dist/commands/standup.js:10:24) {
2026-06-04T09:08:23.566508112Z status: 400,
2026-06-04T09:08:23.566512222Z body: {
2026-06-04T09:08:23.566516752Z message: 'Invalid Form Body',
2026-06-04T09:08:23.566520812Z code: 50035,
2026-06-04T09:08:23.566524802Z errors: { components: [Object] }
2026-06-04T09:08:23.566529072Z }
2026-06-04T09:08:23.566533132Z }
2026-06-04T09:08:23.694182298Z [discord/interaction-followup] edit failed: 404 { message: 'Unknown Webhook', code: 10015 }
