import './style.scss';

type JQueryElement = JQuery<HTMLElement>;

const FALLBACK_STYLE_TEXT = `.manga-formatted {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.manga-paragraph {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.manga-narration {
  display: block;
  font-style: italic;
  opacity: 0.85;
  padding: 10px 15px;
  background: var(--SmartThemeChatTintColor, rgba(128, 128, 128, 0.1));
  border-radius: 8px;
  margin: 5px 0;
  line-height: 1.6;
  border-left: 4px solid var(--SmartThemeQuoteColor, #888);
  font-size: 0.95em;
}

.manga-bubble-wrapper {
  display: flex;
  gap: 15px;
  max-width: 95%;
  margin: 10px 0;
}

.manga-bubble-wrapper.left {
  align-self: flex-start;
  flex-direction: row;
}

.manga-bubble-wrapper.left .manga-bubble-text {
  border-top-left-radius: 4px;
}

.manga-bubble-wrapper.right {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.manga-bubble-wrapper.right .manga-bubble-content {
  align-items: flex-end;
}

.manga-bubble-wrapper.right .manga-bubble-text {
  border-top-right-radius: 4px;
  background: var(--SmartThemeUserColor, rgba(0, 120, 255, 0.2));
}

.manga-avatar {
  flex-shrink: 0;
}

.manga-avatar img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.3));
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.manga-avatar-placeholder {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--SmartThemeChatTintColor, #666);
  color: var(--SmartThemeTextColor, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  border: 2px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.3));
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.manga-bubble-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.manga-speaker-name {
  font-size: 0.9em;
  font-weight: bold;
  opacity: 0.9;
  margin: 0 5px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.manga-bubble-text {
  background: var(--SmartThemeBlurTintColor, rgba(255, 255, 255, 0.1));
  color: var(--SmartThemeTextColor, #fff);
  padding: 16px 24px;
  border-radius: 24px;
  font-size: 1.15em;
  line-height: 1.6;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  position: relative;
  border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.15));
  backdrop-filter: blur(8px);
  word-break: break-word;
}

.manga-quote {
  opacity: 0.5;
  font-family: serif;
  margin: 0 2px;
}`;

void (async () => {
  const hostWindow =
    (() => {
      try {
        return globalThis.parent && globalThis.parent !== globalThis ? globalThis.parent : globalThis;
      } catch {
        return globalThis;
      }
    })() as typeof globalThis;
  const hostDocument = hostWindow.document ?? document;
  const waitForGlobal =
    globalThis.waitGlobalInitialized?.bind(globalThis) ??
    globalThis.TavernHelper?.waitGlobalInitialized?.bind(globalThis.TavernHelper);
  const getDisplayedMessage =
    globalThis.retrieveDisplayedMessage?.bind(globalThis) ??
    globalThis.TavernHelper?.retrieveDisplayedMessage?.bind(globalThis.TavernHelper);
  const bindEvent = globalThis.eventOn?.bind(globalThis);
  const tavernEvents = globalThis.tavern_events;

  const SHIXIA = '时夏';
  const KURIHARA = '栗原';
  const USER_CHOICE_KEY = '{{user}}的选择';
  const debugState = ((hostWindow as typeof globalThis & { __mangaBeautifyDebug?: unknown }).__mangaBeautifyDebug = {
    loadedAt: Date.now(),
    steps: [] as Array<Record<string, unknown>>,
  });

  function debug(step: string, payload: Record<string, unknown> = {}) {
    debugState.steps.push({ step, ...payload, time: Date.now() });
    if (debugState.steps.length > 200) {
      debugState.steps.shift();
    }
  }

  function ensureFallbackStyles() {
    if (hostDocument.querySelector('style[data-manga-beautify-style="true"]')) {
      return;
    }

    const hasInjectedMangaStyle = Array.from(hostDocument.querySelectorAll('style')).some(style =>
      style.textContent?.includes('.manga-bubble-wrapper'),
    );
    if (hasInjectedMangaStyle) {
      return;
    }

    const style = hostDocument.createElement('style');
    style.dataset.mangaBeautifyStyle = 'true';
    style.textContent = FALLBACK_STYLE_TEXT;
    (hostDocument.head ?? hostDocument.documentElement).appendChild(style);
    debug('fallback-style-injected');
  }

  if (!waitForGlobal) {
    console.error('[美化组件] waitGlobalInitialized 不存在，已停止执行');
    return;
  }

  if (!getDisplayedMessage) {
    console.error('[美化组件] retrieveDisplayedMessage 不存在，已停止执行');
    return;
  }

  ensureFallbackStyles();
  await waitForGlobal('Mvu');
  debug('wait-resolved');

  const safeInlineTags = new Set([
    'a',
    'abbr',
    'b',
    'br',
    'code',
    'del',
    'em',
    'i',
    'ins',
    'kbd',
    'mark',
    'q',
    'ruby',
    'rp',
    'rt',
    's',
    'small',
    'span',
    'strong',
    'sub',
    'sup',
    'u',
  ]);

  function hasStructuredDescendants($root: JQueryElement) {
    return $root.find('*').toArray().some(node => {
      const tagName = node.tagName.toLowerCase();
      return !safeInlineTags.has(tagName);
    });
  }

  function appendNarrationLine($container: JQueryElement, line: string) {
    if (!line.trim()) return;

    const $narration = $('<span class="manga-narration"></span>');
    if (line.includes('<')) {
      $narration.html(line);
    } else {
      $narration.text(line);
    }
    $container.append($narration);
  }

  function collectLegacyFormattedLinesHtml($formatted: JQueryElement) {
    const lines: string[] = [];
    let currentLine = '';

    const pushLine = () => {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    };

    $formatted.contents().each((_, node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        currentLine += node.textContent || '';
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const $node = $(node as HTMLElement);
      if ($node.is('br')) {
        pushLine();
        return;
      }

      if ($node.is('.manga-narration, .manga-dialogue')) {
        currentLine += $node.html() || '';
        return;
      }

      currentLine += (node as HTMLElement).outerHTML;
    });

    pushLine();
    return lines;
  }

  function splitFlattenedParagraph($paragraph: JQueryElement) {
    let $rebuiltChildren = $();

    $paragraph.contents().each((_, node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.textContent?.trim()) {
          return;
        }

        $rebuiltChildren = $rebuiltChildren.add(
          $('<div class="manga-paragraph"></div>').append(
            $('<span class="manga-narration"></span>').text(node.textContent),
          ),
        );
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const $node = $(node as HTMLElement);
      if ($node.is('.manga-narration, .manga-bubble-wrapper')) {
        $rebuiltChildren = $rebuiltChildren.add(
          $('<div class="manga-paragraph"></div>').append($node.clone(true, true)),
        );
      }
    });

    return $rebuiltChildren;
  }

  function resolveSpeaker(rawSpeakerName: string, userName: string) {
    let speakerName = rawSpeakerName.replace(/<[^>]+>/g, '').trim();
    let speakerCategory = 'others';

    if (speakerName.includes(SHIXIA)) {
      speakerCategory = SHIXIA;
      speakerName = SHIXIA;
    } else if (speakerName.includes(KURIHARA)) {
      speakerCategory = KURIHARA;
      speakerName = KURIHARA;
    } else if (speakerName.includes(userName) || speakerName === 'You' || speakerName === '{{user}}') {
      speakerCategory = 'user';
      speakerName = userName;
    }

    return { speakerName, speakerCategory };
  }

  function buildBubbleHtml(
    speakerName: string,
    speakerCategory: string,
    dialogue: string,
    avatars: Record<string, string>,
  ) {
    const position = speakerCategory === 'user' ? 'right' : 'left';
    const avatarSrc = avatars[speakerCategory as keyof typeof avatars];

    return $(`
      <div class="manga-bubble-wrapper ${position}">
        ${
          avatarSrc
            ? `<div class="manga-avatar"><img src="${avatarSrc}" alt="${speakerName}"></div>`
            : `<div class="manga-avatar-placeholder">${speakerName[0] || ''}</div>`
        }
        <div class="manga-bubble-content">
          <div class="manga-speaker-name">${speakerName}</div>
          <div class="manga-bubble-text">
            <span class="manga-dialogue">${dialogue}</span>
          </div>
        </div>
      </div>
    `);
  }

  function buildFormattedContent(html: string, avatars: Record<string, string>, userName: string) {
    if (!html?.trim()) return null;

    const $container = $('<div class="manga-formatted"></div>');
    const $temp = $('<div>').html(html);

    $temp.contents().each((_, node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent?.trim()) {
          $container.append($('<span class="manga-narration"></span>').text(node.textContent));
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const $el = $(node as HTMLElement);
      if ($el.is('style')) {
        return;
      }

      if (isIgnorableSpacingBlock($el) || $el.is('br')) {
        return;
      }

      if (!$el.is('p')) {
        $container.append($el);
        return;
      }

      if (hasStructuredDescendants($el)) {
        $container.append($el);
        return;
      }

      const lines = ($el.html() || '').split(/<br\s*\/?>/i);
      const $paragraph = $('<div class="manga-paragraph"></div>');

      for (const line of lines) {
        const normalizedLine = line.trim();
        const dialogueRegex = /^(?:<[^>]+>|\s)*\[(.*?)\](?:<[^>]+>|\s)*[:：]\s*(.*)$/;
        const match = normalizedLine.match(dialogueRegex);

        if (match) {
          const { speakerName, speakerCategory } = resolveSpeaker(match[1], userName);
          $paragraph.append(buildBubbleHtml(speakerName, speakerCategory, match[2], avatars));
          continue;
        }

        appendNarrationLine($paragraph, line);
      }

      if ($paragraph.children().length > 0) {
        $container.append($paragraph);
      } else {
        $container.append($el);
      }
    });

    return $container;
  }

  function getContentAnchor($content: JQueryElement) {
    const $parent = $content.parent();
    if ($parent.is('p') && !$parent.text().trim() && $parent.children().length === 1) {
      return $parent;
    }

    return $content;
  }

  function getFormattedAnchor($formatted: JQueryElement) {
    const $parent = $formatted.parent();
    if (
      $parent.is('p') &&
      $parent.contents().toArray().every(node => {
        if (node === $formatted[0]) return true;
        if (node.nodeType === Node.TEXT_NODE) return !node.textContent?.trim();
        return node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === 'br';
      })
    ) {
      return $parent;
    }

    return $formatted;
  }

  function isIgnorableSpacingBlock($block: JQueryElement) {
    if ($block.is('br')) {
      return true;
    }

    if (!$block.is('p, div')) {
      return false;
    }

    if ($block.find('style, details, iframe, img, video, audio, table, ul, ol, li').length > 0) {
      return false;
    }

    const normalizedHtml = ($block.html() || '')
      .replace(/<br\s*\/?>/gi, '')
      .replace(/&nbsp;|&#160;/gi, '')
      .replace(/\s+/g, '');

    return normalizedHtml.length === 0;
  }

  function collectFollowingParagraphGroup($anchor: JQueryElement) {
    let $paragraphs = $();
    let $spacing = $();
    let currentNode = $anchor[0]?.nextSibling ?? null;

    while (currentNode) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        if (currentNode.textContent?.trim()) {
          break;
        }

        currentNode = currentNode.nextSibling;
        continue;
      }

      if (currentNode.nodeType !== Node.ELEMENT_NODE) {
        break;
      }

      const $current = $(currentNode as HTMLElement);
      if ($current.is('style')) {
        currentNode = currentNode.nextSibling;
        continue;
      }

      if (isIgnorableSpacingBlock($current)) {
        $spacing = $spacing.add($current);
        currentNode = currentNode.nextSibling;
        continue;
      }

      if (!$current.is('p')) {
        break;
      }

      $paragraphs = $paragraphs.add($current);
      currentNode = currentNode.nextSibling;
    }

    return { $paragraphs, $spacing };
  }

  function collectContentParagraphSiblings($content: JQueryElement) {
    return collectFollowingParagraphGroup(getContentAnchor($content));
  }

  function collectFollowingParagraphSiblings($anchor: JQueryElement) {
    return collectFollowingParagraphGroup($anchor);
  }

  function formatContentMarker($content: JQueryElement, avatars: Record<string, string>, userName: string) {
    const $anchor = getContentAnchor($content);
    if ($anchor.next('.manga-formatted').length) {
      return;
    }

    const htmlParts: string[] = [];
    const directHtml = $content.html()?.trim();
    if (directHtml) {
      htmlParts.push(directHtml);
    }

    const { $paragraphs, $spacing } = collectContentParagraphSiblings($content);
    debug('collect-paragraphs', {
      paragraphCount: $paragraphs.length,
      hasDirectHtml: Boolean(directHtml),
    });
    if ($paragraphs.length) {
      htmlParts.push(
        ...$paragraphs.toArray().map(node => node.outerHTML),
      );
    }

    const html = htmlParts.join('');
    if (!html.trim()) {
      return;
    }

    const $formatted = buildFormattedContent(html, avatars, userName);
    if (!$formatted) return;

    $anchor.after($formatted);
    $spacing.remove();
    $paragraphs.remove();
    $anchor.remove();
  }

  function normalizeExistingFormatted($formatted: JQueryElement, avatars: Record<string, string>, userName: string) {
    const $wrapperParagraph = $formatted.parent('p');
    const $anchor = getFormattedAnchor($formatted);
    const { $paragraphs: $followingParagraphs, $spacing } = collectFollowingParagraphSiblings($anchor);

    if ($formatted.children('.manga-paragraph').length === 1) {
      const $onlyParagraph = $formatted.children('.manga-paragraph').first();
      const hasMultipleBlocks =
        $onlyParagraph.children('.manga-narration, .manga-bubble-wrapper').length > 1;

      if (hasMultipleBlocks) {
        const $rebuiltParagraphs = splitFlattenedParagraph($onlyParagraph);
        if ($rebuiltParagraphs.length) {
          $formatted.empty().append($rebuiltParagraphs);
        }
      }
    }

    if (!$formatted.find('.manga-bubble-wrapper').length) {
      const legacyLines = collectLegacyFormattedLinesHtml($formatted);
      if (legacyLines.length || $followingParagraphs.length) {
        const htmlParts: string[] = [];
        if (legacyLines.length) {
          htmlParts.push(`<p>${legacyLines.join('<br>')}</p>`);
        }
        if ($followingParagraphs.length) {
          htmlParts.push(...$followingParagraphs.toArray().map(node => node.outerHTML));
        }

        const rebuilt = buildFormattedContent(htmlParts.join(''), avatars, userName);
        if (rebuilt?.children().length) {
          const canReplaceWrapper =
            $wrapperParagraph.length &&
            $wrapperParagraph.contents().toArray().every(node => {
              if (node === $formatted[0]) return true;
              if (node.nodeType === Node.TEXT_NODE) return !node.textContent?.trim();
              return node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === 'br';
            });

          if (canReplaceWrapper) {
            $wrapperParagraph.replaceWith(rebuilt);
          } else {
            $formatted.replaceWith(rebuilt);
          }
          $spacing.remove();
          $followingParagraphs.remove();
          return;
        }
      }
    }

    $formatted.children('p').each((_, paragraph) => {
      const $paragraph = $(paragraph);
      if (hasStructuredDescendants($paragraph)) {
        return;
      }

      const rebuilt = buildFormattedContent(`<p>${$paragraph.html() || ''}</p>`, avatars, userName);
      if (rebuilt?.children().length) {
        $paragraph.replaceWith(rebuilt.children());
      }
    });

    if ($followingParagraphs.length) {
      const appended = buildFormattedContent(
        $followingParagraphs
          .toArray()
          .map(node => node.outerHTML)
          .join(''),
        avatars,
        userName,
      );

      if (appended?.children().length) {
        $formatted.append(appended.children());
        $spacing.remove();
        $followingParagraphs.remove();
      }
    } else if ($spacing.length) {
      $spacing.remove();
    }
  }

  function getMessageParts(message_id: number) {
    const $displayed = getDisplayedMessage(message_id);
    if (!$displayed.length) return null;

    const $mes = $displayed.hasClass('mes') ? $displayed : $displayed.closest('.mes');
    const $text = $displayed.hasClass('mes_text')
      ? $displayed
      : $displayed.find('.mes_text').first().length
        ? $displayed.find('.mes_text').first()
        : $mes.find('.mes_text').first();

    if (!$mes.length || !$text.length) {
      return null;
    }

    return { $mes, $text };
  }

  function buildAvatars(message_id: number) {
    const userName = SillyTavern.name1 || 'User';
    const userAvatar = $('#chat .mes[is_user="true"] .avatar img').first().attr('src') || '';

    let shixiaSad = false;
    let kuriharaSad = false;

    try {
      const variables = Mvu.getMvuData({ type: 'message', message_id });
      const statData = _.get(variables, 'stat_data');
      if (statData && statData[USER_CHOICE_KEY]) {
        shixiaSad = statData[USER_CHOICE_KEY][KURIHARA] === true;
        kuriharaSad = statData[USER_CHOICE_KEY][SHIXIA] === true;
      }
    } catch (error) {
      console.error('Failed to get MVU data', error);
    }

    return {
      userName,
      avatars: {
        [SHIXIA]: shixiaSad
          ? 'https://raw.githubusercontent.com/atr1official/atri_official/main/%E6%97%B6%E5%A4%8F%26%E6%A0%97%E5%8E%9F/%E6%97%B6%E5%A4%8Fsad.png'
          : 'https://raw.githubusercontent.com/atr1official/atri_official/main/%E6%97%B6%E5%A4%8F%26%E6%A0%97%E5%8E%9F/%E6%97%B6%E5%A4%8Fsmile.png',
        [KURIHARA]: kuriharaSad
          ? 'https://raw.githubusercontent.com/atr1official/atri_official/main/%E6%97%B6%E5%A4%8F%26%E6%A0%97%E5%8E%9F/%E6%A0%97%E5%8E%9Fsad.png'
          : 'https://raw.githubusercontent.com/atr1official/atri_official/main/%E6%97%B6%E5%A4%8F%26%E6%A0%97%E5%8E%9F/%E6%A0%97%E5%8E%9Fsmile.png',
        user: userAvatar,
      } as Record<string, string>,
    };
  }

  function formatMessage(message_id: number) {
    const parts = getMessageParts(message_id);
    if (!parts) return;

    const { $mes, $text } = parts;
    if ($mes.attr('is_user') === 'true' || $text.attr('is_user') === 'true') {
      return;
    }

    const { avatars, userName } = buildAvatars(message_id);
    const $existingFormatted = $text.find('> .manga-formatted, > p > .manga-formatted').first();
    if ($existingFormatted.length) {
      normalizeExistingFormatted($existingFormatted, avatars, userName);
      return;
    }

    const $contents = $text.find('content');
    debug('message-scan', {
      message_id,
      contentCount: $contents.length,
      mesTextLength: $text.html()?.length ?? 0,
    });
    if (!$contents.length) return;

    $contents.each((_, element) => {
      formatContentMarker($(element), avatars, userName);
    });
  }

  const formatAll = () => {
    $('#chat .mes').each((_, el) => {
      const mesId = $(el).attr('mesid');
      if (mesId) {
        formatMessage(Number(mesId));
      }
    });
  };

  let mutationTimer: number | null = null;
  let isApplyingMutation = false;
  let hasPendingMutation = false;

  const scheduleFormatAll = (delay = 30) => {
    if (mutationTimer !== null) {
      window.clearTimeout(mutationTimer);
    }

    mutationTimer = window.setTimeout(() => {
      mutationTimer = null;
      if (isApplyingMutation) {
        hasPendingMutation = true;
        return;
      }

      isApplyingMutation = true;
      hasPendingMutation = false;
      try {
        formatAll();
      } finally {
        window.setTimeout(() => {
          isApplyingMutation = false;
          if (hasPendingMutation) {
            debug('mutation-replay');
            scheduleFormatAll(0);
          }
        }, 0);
      }
    }, delay);
  };

  const chatObserver = new MutationObserver(() => {
    hasPendingMutation = true;
    if (isApplyingMutation) {
      return;
    }

    scheduleFormatAll();
  });

  formatAll();

  const chatRoot = hostDocument.querySelector('#chat');
  if (chatRoot) {
    chatObserver.observe(chatRoot, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    debug('observer-started');
  }

  if (!bindEvent || !tavernEvents) {
    console.warn('[美化组件] eventOn 或 tavern_events 不存在，仅执行观察器兜底');
    return;
  }

  bindEvent(tavernEvents.GENERATION_STARTED, () => {
    debug('generation-started');
    window.setTimeout(formatAll, 0);
  });

  bindEvent(tavernEvents.GENERATION_ENDED, () => {
    debug('generation-ended');
    window.setTimeout(formatAll, 100);
  });

  bindEvent(tavernEvents.GENERATION_STOPPED, () => {
    debug('generation-stopped');
    window.setTimeout(formatAll, 100);
  });

  bindEvent(tavernEvents.CHARACTER_MESSAGE_RENDERED, (message_id: number) => {
    window.setTimeout(() => formatMessage(message_id), 0);
  });

  bindEvent(tavernEvents.MESSAGE_UPDATED, (message_id: number) => {
    window.setTimeout(() => formatMessage(message_id), 0);
  });

  bindEvent(tavernEvents.CHAT_CHANGED, () => {
    window.setTimeout(formatAll, 100);
  });
})();
