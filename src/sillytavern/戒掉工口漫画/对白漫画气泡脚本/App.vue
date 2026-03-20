<template>
  <div class="manga-bubbles">
    <template v-for="(block, index) in blocks" :key="`${block.type}-${index}`">
      <div v-if="block.type === 'dialogue'" class="bubble-row" :class="[`is-${block.side}`, `kind-${block.kind}`]">
        <div class="speaker-anchor">
          <img v-if="block.avatarUrl" class="speaker-avatar" :src="block.avatarUrl" :alt="block.displayName" />
          <div v-else class="speaker-badge">
            {{ block.displayName }}
          </div>
        </div>

        <div class="bubble-stack">
          <div class="speaker-name">
            {{ block.displayName }}
          </div>
          <div class="bubble-shell">
            <div class="bubble-content" v-html="block.html"></div>
          </div>
        </div>
      </div>

      <div v-else-if="block.type === 'status'" class="status-card">
        <div class="status-card__header">
          <div class="status-card__datetime">{{ statusData.系统.日期 }} {{ statusData.系统.时间 }}</div>
          <div class="status-card__divider"></div>
          <div v-if="typeof statusData.系统.当前地点 === 'object'" class="status-card__locations">
            <span><span class="status-card__label status-card__label--shixia">时夏:</span> {{ statusData.系统.当前地点.时夏 }}</span>
            <span
              ><span class="status-card__label status-card__label--kurihara">栗原:</span>
              {{ statusData.系统.当前地点.栗原 }}</span
            >
            <span><span class="status-card__label status-card__label--user">你:</span> {{ statusUserLocation }}</span>
          </div>
          <div v-else class="status-card__pending">地点待初始化</div>
        </div>

        <div class="status-card__body">
          <div class="status-card__panel status-card__panel--shixia">
            <div class="status-card__backdrop">
              <img :src="statusShixiaImage" class="status-card__backdrop-image" alt="" />
            </div>
            <div class="status-card__portrait">
              <img :src="statusShixiaImage" class="status-card__portrait-image" alt="时夏" />
            </div>
            <div class="status-card__overlay"></div>

            <div class="status-card__content status-card__content--left">
              <div class="status-card__title-row">
                <div class="status-card__title status-card__title--shixia">时夏</div>
                <div class="status-card__stats">
                  <div class="status-card__meter">
                    <div class="status-card__meter-head">
                      <span>爱意隐藏值</span>
                      <span>{{ statusData.时夏.爱隐藏值 }} / 200</span>
                    </div>
                    <div class="status-card__meter-track status-card__meter-track--shixia">
                      <div
                        class="status-card__meter-fill status-card__meter-fill--shixia"
                        :style="{ width: `${(statusData.时夏.爱隐藏值 / 200) * 100}%` }"
                      ></div>
                    </div>
                  </div>

                  <div class="status-card__counter status-card__counter--shixia">
                    <span class="status-card__counter-label">做爱次数</span>
                    <span class="status-card__counter-value">{{ statusData.时夏.做爱次数 }}</span>
                  </div>
                </div>
              </div>

              <div class="status-card__thought-list">
                <div class="status-card__thought status-card__thought--shixia">
                  <div class="status-card__thought-title">对你的内心话</div>
                  <div class="status-card__thought-text">"{{ statusShixiaThoughts }}"</div>
                </div>

                <div class="status-card__thought status-card__thought--neutral">
                  <div class="status-card__thought-title">对栗原</div>
                  <div class="status-card__thought-text status-card__thought-text--muted">
                    "{{ statusData.时夏.对栗原 }}"
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="status-card__panel status-card__panel--kurihara">
            <div class="status-card__backdrop">
              <img :src="statusKuriharaImage" class="status-card__backdrop-image" alt="" />
            </div>
            <div class="status-card__portrait">
              <img :src="statusKuriharaImage" class="status-card__portrait-image" alt="栗原" />
            </div>
            <div class="status-card__overlay"></div>

            <div class="status-card__content status-card__content--right">
              <div class="status-card__title-row">
                <div class="status-card__title status-card__title--kurihara">栗原</div>
                <div class="status-card__stats">
                  <div class="status-card__meter">
                    <div class="status-card__meter-head">
                      <span>灰心度</span>
                      <span>{{ statusData.栗原.灰心度 }} / 200</span>
                    </div>
                    <div class="status-card__meter-track status-card__meter-track--kurihara">
                      <div
                        class="status-card__meter-fill status-card__meter-fill--kurihara"
                        :style="{ width: `${(statusData.栗原.灰心度 / 200) * 100}%` }"
                      ></div>
                    </div>
                  </div>

                  <div class="status-card__counter status-card__counter--kurihara">
                    <span class="status-card__counter-label">做爱次数</span>
                    <span class="status-card__counter-value">{{ statusData.栗原.做爱次数 }}</span>
                  </div>
                </div>
              </div>

              <div class="status-card__thought-list">
                <div class="status-card__thought status-card__thought--kurihara">
                  <div class="status-card__thought-title">对你的心理话</div>
                  <div class="status-card__thought-text">"{{ statusKuriharaThoughts }}"</div>
                </div>

                <div class="status-card__thought status-card__thought--neutral">
                  <div class="status-card__thought-title">对时夏</div>
                  <div class="status-card__thought-text status-card__thought-text--muted">
                    "{{ statusData.栗原.对时夏 }}"
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="status-card__vs">VS</div>
        </div>
      </div>
      <div v-else class="narration-block" v-html="block.html"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { injectStreamingMessageContext } from '@util/streaming';
import { Schema } from '../schema';

type BubbleKind = 'shixia' | 'kurihara' | 'user' | 'other';
type BubbleSide = 'left' | 'right';

type DialogueBlock = {
  type: 'dialogue';
  kind: BubbleKind;
  side: BubbleSide;
  speaker: string;
  displayName: string;
  avatarUrl: string | null;
  html: string;
};

type NarrationBlock = {
  type: 'narration';
  html: string;
};

type StatusBlock = {
  type: 'status';
};

type RenderBlock = DialogueBlock | NarrationBlock | StatusBlock;

type PersonaInfo = {
  personaName: string;
  userName: string;
  avatarUrl: string | null;
};

const STRICT_DIALOGUE_LINE_RE = /^\[([^[\]\n:：]{1,24})\]\s*[：:]\s*(.+)$/;

const SHIXIA_SMILE =
  'https://raw.githubusercontent.com/atr1official/atri_official/main/%E6%97%B6%E5%A4%8F%26%E6%A0%97%E5%8E%9F/%E6%97%B6%E5%A4%8Fsmile.png';
const SHIXIA_SAD =
  'https://raw.githubusercontent.com/atr1official/atri_official/main/%E6%97%B6%E5%A4%8F%26%E6%A0%97%E5%8E%9F/%E6%97%B6%E5%A4%8Fsad.png';
const KURIHARA_SMILE =
  'https://raw.githubusercontent.com/atr1official/atri_official/main/%E6%97%B6%E5%A4%8F%26%E6%A0%97%E5%8E%9F/%E6%A0%97%E5%8E%9Fsmile.png';
const KURIHARA_SAD =
  'https://raw.githubusercontent.com/atr1official/atri_official/main/%E6%97%B6%E5%A4%8F%26%E6%A0%97%E5%8E%9F/%E6%A0%97%E5%8E%9Fsad.png';
const OUTER_WRAPPER_RE = /^<([A-Za-z][\w:-]*)(?:\s+[^<>]*?)?>\s*([\s\S]*?)\s*<\/\1>$/;
const STANDALONE_TAG_LINE_RE = /^<\/?[A-Za-z][\w:-]*(?:\s+[^<>]*?)?\s*\/?>$/;

const NON_DIALOGUE_KEYS = new Set([
  "Atri's Voice",
  "Deach's Voice",
  "Atri's Note",
  "Deach's Note",
  'time',
  'time passed',
  'dramatic updates',
  'scene',
  'stat_data',
  '日期',
  '时间',
  '当前地点',
  '爱隐藏值',
  '灰心度',
  '做爱次数',
  '对栗原',
  '对时夏',
  '对user的内心话',
  '对user的心理话',
  'user的选择',
  '{{user}}的选择',
]);

const context = injectStreamingMessageContext();

const persona = computed<PersonaInfo>(() => {
  const $latestUserAvatar = $('#chat .mes[is_user="true"] .mesAvatarWrapper img').last();
  const $selectedAvatar = $('#user_avatar_block .avatar[data-avatar-id]').first();
  const $selectedImg = $('#user_avatar_block img[alt="User Avatar"]').first();
  const avatarId = String($selectedAvatar.attr('data-avatar-id') ?? '').trim();
  const avatarSrc = String($latestUserAvatar.attr('src') ?? '').trim() || String($selectedImg.attr('src') ?? '').trim();
  const nameFromDom = $('#user_avatar_block .ch_name').first().text().trim();

  const stContext = (SillyTavern as any).getContext();
  const userName = String(stContext.name1 ?? '').trim() || 'user';

  return {
    personaName: nameFromDom,
    userName,
    avatarUrl: avatarSrc || (avatarId ? `/thumbnail?type=persona&file=${encodeURIComponent(avatarId)}` : null),
  };
});

const choices = computed(() => {
  const variables = getVariables({ type: 'message', message_id: context.message_id });
  const statData = _.get(variables, 'stat_data', {});
  const matchedEntry = Object.entries(statData).find(
    ([key, value]) =>
      key.endsWith('的选择') &&
      _.isPlainObject(value) &&
      ('时夏' in (value as Record<string, unknown>) || '栗原' in (value as Record<string, unknown>)),
  )?.[1] as Record<string, unknown> | undefined;

  return {
    shixiaChosen: matchedEntry?.时夏 === true,
    kuriharaChosen: matchedEntry?.栗原 === true,
  };
});

const statusData = ref(getNormalizedStatusData());

useIntervalFn(() => {
  const next = getNormalizedStatusData();
  if (!_.isEqual(statusData.value, next)) {
    statusData.value = next;
  }
}, 2000);

const statusUserLocation = computed(() => {
  const location = statusData.value.系统.当前地点;
  return typeof location === 'object' ? location['{{user}}'] : '';
});

const statusShixiaThoughts = computed(() => statusData.value.时夏['对{{user}}的内心话']);
const statusKuriharaThoughts = computed(() => statusData.value.栗原['对{{user}}的心理话']);

const statusShixiaImage = computed(() => {
  if (statusData.value['{{user}}的选择'].时夏) {
    return 'https://raw.githubusercontent.com/atr1official/atri_official/main/时夏&栗原/时夏.png';
  }

  if (statusData.value['{{user}}的选择'].栗原) {
    return 'https://raw.githubusercontent.com/atr1official/atri_official/main/时夏&栗原/时夏leave.png';
  }

  return 'https://raw.githubusercontent.com/atr1official/atri_official/main/时夏&栗原/时夏normal.png';
});

const statusKuriharaImage = computed(() => {
  if (statusData.value['{{user}}的选择'].时夏) {
    return 'https://raw.githubusercontent.com/atr1official/atri_official/main/时夏&栗原/栗原leave.png';
  }

  if (statusData.value['{{user}}的选择'].栗原) {
    return 'https://raw.githubusercontent.com/atr1official/atri_official/main/时夏&栗原/栗原.png';
  }

  return 'https://raw.githubusercontent.com/atr1official/atri_official/main/时夏&栗原/栗原normal.png';
});

const blocks = computed<RenderBlock[]>(() => {
  const renderableMessage = getRenderableMessage(context.message);
  const lines = renderableMessage.replaceAll('\r\n', '\n').split('\n');
  const result: RenderBlock[] = [];
  let narrationBuffer: string[] = [];

  const fastFormat = (text: string) => {
    return text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  const flushNarration = () => {
    const content = narrationBuffer.join('\n').trim();
    if (!content) {
      narrationBuffer = [];
      return;
    }

    result.push({
      type: 'narration',
      html: context.during_streaming
        ? fastFormat(content)
        : formatAsDisplayedMessage(content, { message_id: context.message_id }),
    });
    narrationBuffer = [];
  };

  for (const rawLine of lines) {
    if (containsStatusPlaceholder(rawLine)) {
      flushNarration();

      if (!context.during_streaming) {
        result.push({
          type: 'status',
        });
      }

      continue;
    }
    const parsed = parseDialogueLine(rawLine);
    if (!parsed) {
      narrationBuffer.push(rawLine);
      continue;
    }

    flushNarration();

    const speakerType = getSpeakerType(parsed.speaker, persona.value.userName, persona.value.personaName);
    result.push({
      type: 'dialogue',
      kind: speakerType,
      side: speakerType === 'user' ? 'right' : 'left',
      speaker: parsed.speaker,
      displayName: parsed.displayName,
      avatarUrl: getAvatarUrl(speakerType),
      html: context.during_streaming
        ? fastFormat(parsed.content)
        : formatAsDisplayedMessage(parsed.content, { message_id: context.message_id }),
    });
  }

  flushNarration();
  return result;
});

function getRenderableMessage(message: string): string {
  let result = message.replaceAll('\r\n', '\n').trim();

  result = stripThinkBlocks(result);
  result = stripLeadingPrelude(result);
  result = unwrapOuterContentWrappers(result);

  // Keep the status placeholder in the rendered message so Tavern regex replacement
  // can still inject the status bar UI into the formatted HTML output.
  result = result.replace(/<status>[\s\S]*?<\/status>/gi, '');
  result = stripStandaloneWrapperLines(result);

  const endMarkers = ['</content>'];
  const endCandidates = endMarkers.map(marker => result.indexOf(marker)).filter(index => index !== -1);
  if (endCandidates.length > 0) {
    result = result.slice(0, Math.min(...endCandidates));
  }

  return result.trim();
}

function stripThinkBlocks(message: string): string {
  return message.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '').trim();
}

function stripLeadingPrelude(message: string): string {
  const preludeMarkers = ['</think>', '开始输出正文'];

  for (const marker of preludeMarkers) {
    const markerIndex = message.indexOf(marker);
    if (markerIndex !== -1) {
      return message.slice(markerIndex + marker.length).trim();
    }
  }

  return message;
}

function unwrapOuterContentWrappers(message: string): string {
  let result = message.trim();

  while (true) {
    const matched = result.match(OUTER_WRAPPER_RE);
    if (!matched) {
      return result;
    }

    const tagName = matched[1].toLowerCase();
    if (tagName === 'status' || tagName === 'script' || tagName === 'style') {
      return result;
    }

    result = matched[2].trim();
  }
}

function stripStandaloneWrapperLines(message: string): string {
  const lines = message.split('\n');
  const filtered = lines.filter(rawLine => {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      return true;
    }

    if (trimmed.includes('StatusPlaceHolderImpl')) {
      return true;
    }

    return !STANDALONE_TAG_LINE_RE.test(trimmed);
  });

  return filtered.join('\n').trim();
}

function containsStatusPlaceholder(line: string): boolean {
  return line.includes('<StatusPlaceHolderImpl/>');
}

function getNormalizedStatusData() {
  const statData = _.get(getVariables({ type: 'message', message_id: context.message_id }), 'stat_data', {});
  const normalized = _.cloneDeep(statData);

  const possibleUserKeys = _.uniq(['{{user}}', 'user', persona.value.userName].filter(Boolean));

  const currentLocation = _.get(normalized, '系统.当前地点');
  if (_.isPlainObject(currentLocation)) {
    const userLocation = getFirstExistingValue(currentLocation, possibleUserKeys);
    if (userLocation !== undefined) {
      _.set(normalized, '系统.当前地点.{{user}}', userLocation);
    }
  }

  const shixiaThought = getFirstExistingValue(_.get(normalized, '时夏', {}), [
    '对{{user}}的内心话',
    '对user的内心话',
    `对${persona.value.userName}的内心话`,
  ]);
  if (shixiaThought !== undefined) {
    _.set(normalized, '时夏.对{{user}}的内心话', shixiaThought);
  }

  const kuriharaThought = getFirstExistingValue(_.get(normalized, '栗原', {}), [
    '对{{user}}的心理话',
    '对user的心理话',
    `对${persona.value.userName}的心理话`,
  ]);
  if (kuriharaThought !== undefined) {
    _.set(normalized, '栗原.对{{user}}的心理话', kuriharaThought);
  }

  const choice = getFirstExistingValue(normalized, ['{{user}}的选择', 'user的选择', `${persona.value.userName}的选择`]);
  if (_.isPlainObject(choice)) {
    _.set(normalized, '{{user}}的选择', choice);
  }

  return Schema.parse(normalized);
}

function getFirstExistingValue(source: unknown, keys: string[]) {
  if (!_.isPlainObject(source)) {
    return undefined;
  }

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      return (source as Record<string, unknown>)[key];
    }
  }

  return undefined;
}

function parseDialogueLine(line: string): { speaker: string; displayName: string; content: string } | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const matched = trimmed.match(STRICT_DIALOGUE_LINE_RE);
  if (!matched) {
    return null;
  }

  const rawSpeaker = cleanupSpeaker(matched[1]);
  const rawContent = matched[2].trim();

  if (!rawSpeaker || !rawContent) {
    return null;
  }

  if (!isLikelyDialogue(rawSpeaker, rawContent)) {
    return null;
  }

  return {
    speaker: rawSpeaker,
    displayName: rawSpeaker,
    content: stripOuterQuotes(rawContent),
  };
}

function cleanupSpeaker(value: string): string {
  return value.trim();
}

function stripOuterQuotes(value: string): string {
  let content = value.trim();
  while (
    (content.startsWith('「') && content.endsWith('」')) ||
    (content.startsWith('『') && content.endsWith('』')) ||
    (content.startsWith('"') && content.endsWith('"')) ||
    (content.startsWith('“') && content.endsWith('”'))
  ) {
    content = content.slice(1, -1).trim();
  }
  return content;
}

function isLikelyDialogue(speaker: string, content: string): boolean {
  if (NON_DIALOGUE_KEYS.has(speaker)) {
    return false;
  }

  const normalizedSpeaker = speaker.trim().toLowerCase();
  if (
    normalizedSpeaker === 'date' ||
    normalizedSpeaker === 'time' ||
    normalizedSpeaker === 'time passed' ||
    normalizedSpeaker === 'dramatic updates' ||
    normalizedSpeaker === 'location' ||
    normalizedSpeaker === 'current location' ||
    normalizedSpeaker.startsWith('- ') ||
    normalizedSpeaker.startsWith('/system') ||
    normalizedSpeaker.startsWith('system/') ||
    normalizedSpeaker.startsWith('/系统') ||
    normalizedSpeaker.includes('日期') ||
    normalizedSpeaker.includes('时间') ||
    normalizedSpeaker.includes('当前地点')
  ) {
    return false;
  }

  if (/[<>]/.test(speaker) || speaker.includes('/') || speaker.includes('.') || speaker.startsWith('--')) {
    return false;
  }

  if (speaker.includes('[') || speaker.includes(']') || speaker.includes('【') || speaker.includes('】')) {
    return false;
  }

  if (content.includes('current time') || content.includes('/system/') || content.includes('/系统/')) {
    return false;
  }

  if (/^[a-z_][a-z0-9_ -]*$/i.test(speaker) && !['user', 'USER'].includes(speaker)) {
    return false;
  }

  if (content.startsWith('|') || /^[-*]\s/.test(content)) {
    return false;
  }

  if (/^(true|false|null|\d+(\.\d+)?)$/i.test(content)) {
    return false;
  }

  if (/^[[{]/.test(content) || /;\s*$/.test(content)) {
    return false;
  }

  if (
    content.includes('<style') ||
    content.includes('</style>') ||
    content.includes('<details') ||
    content.includes('</details>') ||
    content.includes('::') ||
    content.includes('{') ||
    content.includes('}') ||
    /(^|[\s(])var\(--/.test(content)
  ) {
    return false;
  }

  return true;
}

function getSpeakerType(speaker: string, userName: string, personaName: string): BubbleKind {
  const normalized = speaker.toLowerCase();
  const normalizedUser = userName.trim().toLowerCase();
  const normalizedPersona = personaName.trim().toLowerCase();

  if (speaker.includes('时夏') || speaker.includes('时晚夏')) {
    return 'shixia';
  }

  if (speaker.includes('栗原')) {
    return 'kurihara';
  }

  if (
    normalized === 'user' ||
    normalized === '{{user}}' ||
    normalized === normalizedUser ||
    speaker === userName ||
    (normalizedPersona && normalized === normalizedPersona)
  ) {
    return 'user';
  }

  return 'other';
}

function getAvatarUrl(kind: BubbleKind): string | null {
  if (kind === 'shixia') {
    return choices.value.kuriharaChosen ? SHIXIA_SAD : SHIXIA_SMILE;
  }

  if (kind === 'kurihara') {
    return choices.value.shixiaChosen ? KURIHARA_SAD : KURIHARA_SMILE;
  }

  if (kind === 'user') {
    return persona.value.avatarUrl;
  }

  return null;
}
</script>

<style scoped>
.manga-bubbles {
  --shixia-color: #60a5fa;
  --kurihara-color: #fbbf24;
  --user-color: #c084fc;
  --other-color: #9ca3af;
  --border-color: #1e293b;
  --bubble-bg: #ffffff;
  --text-color: #334155;

  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.5rem 0 1rem;
}

.bubble-row {
  align-items: flex-start;
  display: flex;
  gap: 0.8rem;
  width: 100%;
}

.bubble-row.is-right {
  flex-direction: row-reverse;
}

.speaker-anchor {
  flex: 0 0 auto;
  padding-top: 0.8rem;
}

.speaker-avatar,
.speaker-badge {
  border: 2px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 2px 2px 0 var(--border-color);
  height: 48px;
  width: 48px;
  background: #fff;
  object-fit: cover;
}

.speaker-badge {
  align-items: center;
  color: var(--border-color);
  display: flex;
  font-size: 0.8rem;
  font-weight: 800;
  justify-content: center;
  line-height: 1.2;
  text-align: center;
}

.bubble-stack {
  align-items: flex-start;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  max-width: min(85%, 56rem);
  position: relative;
}

.bubble-row.is-right .bubble-stack {
  align-items: flex-end;
}

.speaker-name {
  background: var(--other-color);
  border: 2px solid var(--border-color);
  border-radius: 6px;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.15rem 0.5rem;
  position: absolute;
  top: -8px;
  left: 16px;
  z-index: 2;
  box-shadow: 2px 2px 0 var(--border-color);
}

.bubble-row.is-right .speaker-name {
  left: auto;
  right: 16px;
}

.kind-shixia .speaker-name {
  background: var(--shixia-color);
}
.kind-kurihara .speaker-name {
  background: var(--kurihara-color);
}
.kind-user .speaker-name {
  background: var(--user-color);
}

.bubble-shell {
  background: var(--bubble-bg);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 3px 3px 0 var(--border-color);
  max-width: 100%;
  padding: 0.8rem 1rem;
  position: relative;
  margin-top: 0.5rem;
}

.bubble-shell::before {
  content: '';
  position: absolute;
  top: 14px;
  width: 10px;
  height: 10px;
  background: var(--bubble-bg);
  border: 2px solid var(--border-color);
  transform: rotate(45deg);
}

.bubble-row.is-left .bubble-shell::before {
  left: -6px;
  border-top: none;
  border-right: none;
  border-bottom-left-radius: 2px;
}

.bubble-row.is-right .bubble-shell::before {
  right: -6px;
  border-bottom: none;
  border-left: none;
  border-top-right-radius: 2px;
}

.bubble-content {
  color: var(--text-color);
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.bubble-content :deep(p) {
  margin: 0;
}

.bubble-content :deep(p + p) {
  margin-top: 0.7rem;
}

.bubble-content :deep(blockquote),
.bubble-content :deep(pre),
.bubble-content :deep(table) {
  margin: 0.8rem 0 0;
}

.narration-block {
  margin: 0.5rem 0;
  padding: 0.8rem 1.2rem;
  background: #fef3c7;
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  color: var(--text-color);
  font-size: 0.95rem;
  font-weight: 600;
  text-align: center;
  box-shadow: 2px 2px 0 var(--border-color);
}

.narration-block :deep(p) {
  margin: 0.5rem 0;
}

.status-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin: 0.25rem 0 0.75rem;
  padding: 1rem;
  border: 4px solid #000;
  border-radius: 1rem;
  background:
    radial-gradient(#333 2px, transparent 2px),
    #111827;
  background-size: 12px 12px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.28);
}

.status-card__body {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: stretch;
}

.status-card__header {
  position: relative;
  z-index: 2;
  align-self: center;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.45rem 1.1rem;
  border: 2px solid #000;
  border-radius: 999px;
  background: #fff;
  box-shadow: 2px 2px 0 #000;
  font-size: 0.75rem;
  font-weight: 800;
  white-space: nowrap;
}

.status-card__datetime {
  color: #2563eb;
  letter-spacing: 0.03em;
}

.status-card__divider {
  width: 1px;
  background: rgba(0, 0, 0, 0.2);
}

.status-card__locations {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  color: #1f2937;
}

.status-card__label {
  font-weight: 900;
}

.status-card__label--shixia {
  color: #2563eb;
}

.status-card__label--kurihara {
  color: #ca8a04;
}

.status-card__label--user {
  color: #16a34a;
}

.status-card__pending {
  color: #6b7280;
}

.status-card__panel {
  position: relative;
  overflow: hidden;
  min-height: 26rem;
  border: 4px solid #000;
  border-radius: 1rem;
  background: #000;
  box-shadow: 4px 4px 0 #000;
}

.status-card__backdrop,
.status-card__portrait,
.status-card__overlay {
  position: absolute;
  inset: 0;
}

.status-card__backdrop {
  opacity: 0.4;
  filter: blur(12px);
}

.status-card__backdrop-image,
.status-card__portrait-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-card__portrait {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0.2rem 0.5rem 0;
}

.status-card__portrait-image {
  object-fit: contain;
  object-position: center top;
  transform: translateY(-1.6rem) scale(1.04);
  transform-origin: center top;
  filter: drop-shadow(0 12px 20px rgba(0, 0, 0, 0.55));
}

.status-card__overlay {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.68), rgba(0, 0, 0, 0.18), transparent);
}

.status-card__content {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 68%;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.85rem 1rem 0.2rem;
}

.status-card__content--left {
  align-items: flex-start;
}

.status-card__content--right {
  align-items: flex-end;
}

.status-card__title-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.status-card__stats {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.35rem;
  width: min(50%, 12.5rem);
}

.status-card__title {
  font-size: clamp(2rem, 5vw, 2.8rem);
  font-weight: 900;
  font-style: italic;
  letter-spacing: 0.08em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

.status-card__title--shixia {
  color: rgba(96, 165, 250, 0.92);
}

.status-card__title--kurihara {
  color: rgba(250, 204, 21, 0.92);
}

.status-card__meter-head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.3rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55);
}

.status-card__meter-track {
  overflow: hidden;
  height: 0.55rem;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.5);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.35);
}

.status-card__meter-track--shixia {
  border: 1px solid rgba(30, 64, 175, 0.45);
}

.status-card__meter-track--kurihara {
  border: 1px solid rgba(133, 77, 14, 0.45);
}

.status-card__meter-fill {
  height: 100%;
}

.status-card__meter-fill--shixia {
  background: linear-gradient(to right, rgba(37, 99, 235, 0.82), rgba(96, 165, 250, 0.82));
}

.status-card__meter-fill--kurihara {
  background: linear-gradient(to right, rgba(202, 138, 4, 0.82), rgba(250, 204, 21, 0.82));
}

.status-card__counter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  align-self: flex-end;
  gap: 0.4rem;
  min-width: 0;
  padding: 0.18rem 0.48rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.22);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(3px);
}

.status-card__counter--shixia {
  border-color: rgba(96, 165, 250, 0.3);
}

.status-card__counter--kurihara {
  border-color: rgba(250, 204, 21, 0.3);
}

.status-card__counter-label {
  font-size: 0.66rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.68);
}

.status-card__counter-value {
  font-size: 0.82rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.03em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

.status-card__thought-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  margin-top: 0.65rem;
}

.status-card__thought {
  padding: 0.6rem 0.75rem;
  border-left: 4px solid rgba(156, 163, 175, 0.75);
  border-radius: 0.45rem;
  background: rgba(0, 0, 0, 0.3);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(4px);
}

.status-card__thought--shixia {
  border-left-color: rgba(59, 130, 246, 0.82);
}

.status-card__thought--kurihara {
  border-left-color: rgba(234, 179, 8, 0.82);
}

.status-card__thought-title {
  margin-bottom: 0.2rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.86);
}

.status-card__thought-text {
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.95rem;
  line-height: 1.5;
  font-style: italic;
}

.status-card__thought-text--muted {
  color: rgba(255, 255, 255, 0.72);
  font-style: normal;
}

.status-card__vs {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 3;
  transform: translate(-50%, -50%);
  padding: 0.32rem 0.62rem;
  border: 4px solid #000;
  border-radius: 999px;
  background: #fff;
  color: #000;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  font-size: clamp(1.15rem, 3vw, 1.55rem);
  font-style: italic;
  font-weight: 900;
  box-shadow: 4px 4px 0 #000;
}
@media (max-width: 720px) {
  .status-card__body {
    grid-template-columns: 1fr;
  }

  .status-card {
    padding: 0.85rem;
  }

  .status-card__header {
    white-space: normal;
  }

  .status-card__divider {
    display: none;
  }

  .status-card__locations {
    justify-content: center;
  }

  .status-card__panel {
    min-height: 21rem;
  }

  .status-card__content {
    top: 58%;
    padding: 0.85rem 0.85rem 0.2rem;
  }

  .status-card__portrait-image {
    transform: translateY(-0.9rem) scale(1.02);
  }

  .status-card__title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-card__content--right .status-card__title-row {
    align-items: flex-end;
  }

  .status-card__stats {
    width: 100%;
  }

  .status-card__counter {
    align-self: flex-start;
  }

  .status-card__content--right .status-card__counter {
    align-self: flex-end;
  }

  .status-card__vs {
    top: auto;
    bottom: calc(50% - 1.1rem);
  }

  .bubble-row {
    gap: 0.5rem;
  }

  .speaker-avatar,
  .speaker-badge {
    height: 40px;
    width: 40px;
    border-radius: 10px;
  }

  .bubble-stack {
    max-width: calc(100% - 3.5rem);
  }

  .bubble-shell {
    border-radius: 12px;
    padding: 0.6rem 0.8rem;
  }

  .bubble-content {
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .speaker-name {
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
    top: -6px;
    left: 12px;
  }

  .bubble-row.is-right .speaker-name {
    right: 12px;
  }
}
</style>
