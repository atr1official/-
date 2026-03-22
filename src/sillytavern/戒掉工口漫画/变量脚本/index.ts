import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { Schema } from './schema';

$(() => {
  registerMvuSchema(Schema);
});

void (async () => {
  await waitGlobalInitialized('Mvu');

  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (newVariables, oldVariables) => {
    const clampRange = (path: string) => {
      const nextValue = Number(_.get(newVariables, `stat_data.${path}`));

      if (!Number.isFinite(nextValue)) return;

      _.set(newVariables, `stat_data.${path}`, _.clamp(nextValue, 0, 200));
    };

    const clampDelta = (path: string, limit: number) => {
      const oldValue = Number(_.get(oldVariables, `stat_data.${path}`));
      const newValue = Number(_.get(newVariables, `stat_data.${path}`));

      if (!Number.isFinite(newValue)) return;

      if (!Number.isFinite(oldValue)) {
        _.set(newVariables, `stat_data.${path}`, _.clamp(newValue, 0, 200));
        return;
      }

      const deltaClampedValue = _.clamp(newValue, oldValue - limit, oldValue + limit);
      _.set(newVariables, `stat_data.${path}`, _.clamp(deltaClampedValue, 0, 200));
    };

    const preserveText = (path: string) => {
      const oldValue = _.get(oldVariables, `stat_data.${path}`);
      const newValue = _.get(newVariables, `stat_data.${path}`);

      if (typeof oldValue !== 'string' || !oldValue.trim()) return;
      if (typeof newValue !== 'string') return;

      if (newValue.trim() === '' || newValue === '待初始化') {
        _.set(newVariables, `stat_data.${path}`, oldValue);
      }
    };

    clampRange('时夏.爱隐藏值');
    clampRange('栗原.灰心度');
    clampDelta('时夏.爱隐藏值', 8);
    clampDelta('栗原.灰心度', 8);

    preserveText('系统.当前地点.{{user}}');
    preserveText('时夏.对{{user}}的内心话');
    preserveText('栗原.对{{user}}的心理话');
    preserveText('时夏.对栗原');
    preserveText('栗原.对时夏');

    const oldChoice = _.get(oldVariables, 'stat_data.{{user}}的选择', {});
    const newChoice = _.get(newVariables, 'stat_data.{{user}}的选择', {});
    const oldShixia = oldChoice?.时夏 === true;
    const oldLiyuan = oldChoice?.栗原 === true;
    const newShixia = newChoice?.时夏 === true;
    const newLiyuan = newChoice?.栗原 === true;

    if (newShixia && newLiyuan) {
      if (oldShixia && !oldLiyuan) {
        _.set(newVariables, 'stat_data.{{user}}的选择.栗原', false);
      } else if (oldLiyuan && !oldShixia) {
        _.set(newVariables, 'stat_data.{{user}}的选择.时夏', false);
      } else if (newShixia !== oldShixia && newLiyuan === oldLiyuan) {
        _.set(newVariables, 'stat_data.{{user}}的选择.栗原', false);
      } else if (newLiyuan !== oldLiyuan && newShixia === oldShixia) {
        _.set(newVariables, 'stat_data.{{user}}的选择.时夏', false);
      } else {
        _.set(newVariables, 'stat_data.{{user}}的选择', {
          时夏: oldShixia,
          栗原: oldLiyuan,
        });
      }
    }
  });
})();
