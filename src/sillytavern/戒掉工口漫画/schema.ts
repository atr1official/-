import _ from 'lodash';
import { z } from 'zod';

export const Schema = z.object({
  系统: z
    .object({
      日期: z.string().prefault('待初始化'),
      时间: z.string().prefault('待初始化'),
      当前地点: z
        .object({
          时夏: z.string().prefault('待初始化'),
          栗原: z.string().prefault('待初始化'),
          '{{user}}': z.string().prefault('待初始化'),
        })
        .or(z.literal('待初始化'))
        .prefault('待初始化'),
    })
    .prefault({}),
  时夏: z
    .object({
      爱隐藏值: z.coerce
        .number()
        .describe(
          '0-200，初始200=完全隐藏。随剧情递减，越低越藏不住爱。到0时时夏会直接向{{user}}表白，必须让{{user}}做出选择',
        )
        .transform(value => _.clamp(value, 0, 200))
        .prefault(200),
      做爱次数: z.coerce
        .number()
        .transform(value => Math.max(0, Math.round(value)))
        .prefault(0),
      对栗原: z
        .string()
        .describe('if线剧情：时夏对栗原的话，以及对当前正文的评价。仅在时夏或栗原有一方在场时更新')
        .prefault('待初始化'),
      '对{{user}}的内心话': z.string().prefault('待初始化'),
    })
    .prefault({}),
  栗原: z
    .object({
      灰心度: z.coerce
        .number()
        .describe(
          '0-200，初始0=完全不灰心。栗原知道时夏和{{user}}曾是要好的朋友，但认定爱要靠自己争取。数值越高越想放弃，到200时会直接向{{user}}表白，必须让{{user}}做出选择',
        )
        .transform(value => _.clamp(value, 0, 200))
        .prefault(0),
      做爱次数: z.coerce
        .number()
        .transform(value => Math.max(0, Math.round(value)))
        .prefault(0),
      对时夏: z
        .string()
        .describe('if线剧情：栗原对时夏的话，以及对当前正文的评价。仅在时夏或栗原有一方在场时更新')
        .prefault('待初始化'),
      '对{{user}}的心理话': z.string().prefault('待初始化'),
    })
    .prefault({}),
  '{{user}}的选择': z
    .object({
      时夏: z.boolean().prefault(false),
      栗原: z.boolean().prefault(false),
    })
    .prefault({}),
});
