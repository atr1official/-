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

      <div v-else-if="block.type === 'status'" class="status-block" v-html="block.html"></div>

      <div v-else class="narration-block" v-html="block.html"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { injectStreamingMessageContext } from '@util/streaming';

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
  html: string;
};

type RenderBlock = DialogueBlock | NarrationBlock | StatusBlock;

type PersonaInfo = {
  personaName: string;
  userName: string;
  avatarUrl: string | null;
};

const SHIXIA_SMILE =
  'https://raw.githubusercontent.com/atr1official/atri_official/main/%E6%97%B6%E5%A4%8F%26%E6%A0%97%E5%8E%9F/%E6%97%B6%E5%A4%8Fsmile.png';
const SHIXIA_SAD =
  'https://raw.githubusercontent.com/atr1official/atri_official/main/%E6%97%B6%E5%A4%8F%26%E6%A0%97%E5%8E%9F/%E6%97%B6%E5%A4%8Fsad.png';
const KURIHARA_SMILE =
  'https://raw.githubusercontent.com/atr1official/atri_official/main/%E6%97%B6%E5%A4%8F%26%E6%A0%97%E5%8E%9F/%E6%A0%97%E5%8E%9Fsmile.png';
const KURIHARA_SAD =
  'https://raw.githubusercontent.com/atr1official/atri_official/main/%E6%97%B6%E5%A4%8F%26%E6%A0%97%E5%8E%9F/%E6%A0%97%E5%8E%9Fsad.png';

const NON_DIALOGUE_KEYS = new Set([
  "Atri's Voice",
  "Deach's Voice",
  "Atri's Note",
  "Deach's Note",
  'time',
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

const blocks = computed<RenderBlock[]>(() => {
  const lines = getRenderableMessage(context.message).replaceAll('\r\n', '\n').split('\n');
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
          html: formatAsDisplayedMessage(rawLine, { message_id: context.message_id }),
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
  let result = message;
  const startMarkers = ['</think>', '开始输出正文', '<content>'];
  const startIndex = Math.max(...startMarkers.map(marker => result.indexOf(marker)));
  if (startIndex !== -1) {
    const matchedMarker = startMarkers.find(marker => result.indexOf(marker) === startIndex);
    if (matchedMarker) {
      result = result.slice(startIndex + matchedMarker.length);
    }
  }

  // Keep the status placeholder in the rendered message so Tavern regex replacement
  // can still inject the status bar UI into the formatted HTML output.
  result = result.replace(/<status>[\s\S]*?<\/status>/gi, '');

  const endMarkers = ['</content>'];
  const endCandidates = endMarkers.map(marker => result.indexOf(marker)).filter(index => index !== -1);
  if (endCandidates.length > 0) {
    result = result.slice(0, Math.min(...endCandidates));
  }

  return result.trim();
}

function containsStatusPlaceholder(line: string): boolean {
  return line.includes('<StatusPlaceHolderImpl/>');
}

function parseDialogueLine(line: string): { speaker: string; displayName: string; content: string } | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  // 支持 [名字]:、【名字】:、**名字**:、名字: 等格式
  const bracketMatch = trimmed.match(/^(?:\[|【|\*\*)?([^\]】\n*]{1,24})(?:\]|】|\*\*)?\s*[：:]\s*(.+)$/);
  const matched = bracketMatch;
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
  return value
    .replaceAll(/^\*\*|\*\*$/g, '')
    .replaceAll(/^[[【(（「『]+|[\]】)）」』]+$/g, '')
    .trim();
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

  if (/[<>]/.test(speaker) || speaker.includes('/') || speaker.includes('.') || speaker.startsWith('--')) {
    return false;
  }

  if (/^[a-z_][a-z0-9_ -]*$/i.test(speaker) && !['user', 'USER'].includes(speaker)) {
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
    content.includes('「') ||
    content.includes('」') ||
    content.includes('『') ||
    content.includes('』') ||
    /[，。！？…～~!?,]/.test(content)
  ) {
    return true;
  }

  return speaker.length <= 12 && content.length <= 80;
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

.status-block {
  margin: 0.25rem 0 0.75rem;
}

.status-block :deep(body) {
  margin: 0;
}

@media (max-width: 720px) {
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
